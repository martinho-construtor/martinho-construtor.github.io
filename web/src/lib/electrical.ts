import type {
  BoardRow,
  Circuit,
  CircuitCalculation,
  ElectricalPoint,
  MaterialItem,
  Phase,
  Project,
  ProjectAnalysis,
  ProjectWarning,
  Room
} from "../types";

const COPPER_RESISTIVITY = 0.0175;
const POWER_FACTOR = 0.92;
const VOLTAGE_DROP_LIMIT_PERCENT = 4;

const AMPACITY: Record<number, number> = {
  1.5: 15.5,
  2.5: 21,
  4: 28,
  6: 36,
  10: 50,
  16: 68,
  25: 89,
  35: 110
};

const STANDARD_BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100];
const STANDARD_CABLES = Object.keys(AMPACITY).map(Number);
const SINGLE_PHASES: Array<"A" | "B" | "C"> = ["A", "B", "C"];
export const ENTRANCE_CIRCUIT_ID = "c-entrada";

const ENTRANCE_CIRCUIT: Circuit = {
  id: ENTRANCE_CIRCUIT_ID,
  name: "01 Entrada / alimentador",
  kind: "board",
  phase: "ABC",
  voltage: 220,
  lengthM: 12,
  cableMm2: 16,
  breakerA: 63,
  drProtected: false,
  hasPE: true
};

export function isEntranceCircuit(circuit: Circuit): boolean {
  return circuit.id === ENTRANCE_CIRCUIT_ID || (circuit.kind === "board" && circuit.name.toLowerCase().includes("entrada"));
}

export function ensureEntranceCircuit(project: Project): Project {
  const existingEntrance = project.circuits.find(isEntranceCircuit);
  const entranceCircuit = {
    ...ENTRANCE_CIRCUIT,
    ...existingEntrance,
    id: ENTRANCE_CIRCUIT_ID,
    name: ENTRANCE_CIRCUIT.name,
    kind: "board" as const,
    cableMm2: Math.max(ENTRANCE_CIRCUIT.cableMm2, existingEntrance?.cableMm2 ?? ENTRANCE_CIRCUIT.cableMm2),
    breakerA: existingEntrance?.breakerA ?? ENTRANCE_CIRCUIT.breakerA
  };
  const otherCircuits = project.circuits.filter(circuit => !isEntranceCircuit(circuit));

  return {
    ...project,
    circuits: [entranceCircuit, ...otherCircuits],
    points: project.points.map(point =>
      point.type === "board" || (existingEntrance && point.circuitId === existingEntrance.id)
        ? { ...point, circuitId: ENTRANCE_CIRCUIT_ID }
        : point
    )
  };
}

export function analyzeProject(project: Project): ProjectAnalysis {
  const normalizedProject = ensureEntranceCircuit(project);
  const circuits = normalizedProject.circuits.map(circuit => analyzeCircuit(normalizedProject, circuit));
  const phaseLoadsW = getPhaseLoads(circuits);
  const warnings = buildWarnings(normalizedProject, circuits, phaseLoadsW);
  const materials = buildMaterials(normalizedProject, circuits);
  const boardRows = circuits.map<BoardRow>((calculation, index) => ({
    position: index + 1,
    circuitName: calculation.circuit.name,
    phase: calculation.circuit.phase,
    breakerA: calculation.circuit.breakerA,
    cableMm2: calculation.circuit.cableMm2,
    drProtected: calculation.circuit.drProtected,
    totalW: calculation.totalW,
    currentA: calculation.currentA
  }));
  const totalLoadW = circuits.reduce((sum, item) => sum + item.totalW, 0);
  const demandLoadW = Math.round(totalLoadW * demandFactor(totalLoadW));

  return { circuits, warnings, materials, boardRows, phaseLoadsW, totalLoadW, demandLoadW };
}

export function autoDefineCircuits(project: Project): Project {
  const baseProject = ensureEntranceCircuit(project);
  const entranceCircuit = baseProject.circuits[0];
  const consumerPoints = baseProject.points.filter(point => point.type !== "board");
  const groups = buildCircuitGroups(baseProject, consumerPoints);
  const phaseLoads = { A: 0, B: 0, C: 0 };

  const circuits: Circuit[] = groups.map((group, index) => {
    const loadW = group.points.reduce((sum, point) => sum + pointLoad(point), 0);
    const voltage = suggestedVoltage(group.points, loadW);
    const phase = voltage === 220 ? bestTwoPhase(phaseLoads) : bestSinglePhase(phaseLoads);
    const currentA = loadW / (voltage * POWER_FACTOR);
    const temporaryCircuit: Circuit = {
      id: group.id,
      name: `${String(index + 2).padStart(2, "0")} ${group.name}`,
      kind: group.kind,
      phase,
      voltage,
      lengthM: estimatedCircuitLength(baseProject, group.points),
      cableMm2: group.minCableMm2,
      breakerA: 10,
      drProtected: group.needsDr,
      hasPE: true
    };
    const cableMm2 = suggestCable(temporaryCircuit, group.points, currentA);
    const breakerA = suggestBreaker(currentA, cableMm2);
    addLoadToPhase(phaseLoads, phase, loadW);

    return {
      ...temporaryCircuit,
      cableMm2,
      breakerA
    };
  });

  return {
    ...baseProject,
    circuits: [entranceCircuit, ...circuits],
    points: baseProject.points.map(point => {
      if (point.type === "board") return { ...point, circuitId: ENTRANCE_CIRCUIT_ID };
      const group = groups.find(item => item.points.some(groupPoint => groupPoint.id === point.id));
      return {
        ...point,
        circuitId: group?.id ?? point.circuitId
      };
    })
  };
}

function analyzeCircuit(project: Project, circuit: Circuit): CircuitCalculation {
  const points = project.points.filter(point => point.circuitId === circuit.id);
  const totalW = points.reduce((sum, point) => sum + pointLoad(point), 0);
  const currentA = circuit.voltage > 0 ? totalW / (circuit.voltage * POWER_FACTOR) : 0;
  const voltageDropPercent = voltageDrop(circuit, currentA);
  const cableAmpacityA = AMPACITY[circuit.cableMm2] ?? 0;
  const suggestedCableMm2 = suggestCable(circuit, points, currentA);
  const suggestedBreakerA = suggestBreaker(currentA, suggestedCableMm2);
  const hasWetOrOutletPoint = !isEntranceCircuit(circuit) && points.some(point => needsDr(project.rooms, point));

  return {
    circuit,
    points,
    totalW,
    currentA,
    voltageDropPercent,
    cableAmpacityA,
    suggestedCableMm2,
    suggestedBreakerA,
    breakerCableMismatch: circuit.breakerA > cableAmpacityA,
    overloaded: currentA > circuit.breakerA * 0.9,
    highVoltageDrop: voltageDropPercent > VOLTAGE_DROP_LIMIT_PERCENT,
    missingPE: points.length > 0 && !circuit.hasPE,
    missingDR: hasWetOrOutletPoint && !circuit.drProtected
  };
}

function buildCircuitGroups(project: Project, points: ElectricalPoint[]) {
  const groups: Array<{
    id: string;
    name: string;
    kind: Circuit["kind"];
    points: ElectricalPoint[];
    minCableMm2: number;
    needsDr: boolean;
  }> = [];

  const byRoom = new Map<string, ElectricalPoint[]>();
  points.forEach(point => {
    if (isDedicatedPoint(point)) {
      groups.push({
        id: stableCircuitId(`dedicated-${point.id}`),
        name: `${pointTypeName(point.type)} ${point.label}`,
        kind: point.type === "ac" ? "hvac" : point.type === "exhaust" ? "motor" : "dedicated",
        points: [point],
        minCableMm2: 4,
        needsDr: true
      });
      return;
    }

    byRoom.set(point.roomId, [...(byRoom.get(point.roomId) ?? []), point]);
  });

  byRoom.forEach((roomPoints, roomId) => {
    const room = project.rooms.find(item => item.id === roomId);
    const lighting = roomPoints.filter(point => point.type === "lighting" || point.type === "switch");
    const outlets = roomPoints.filter(point => point.type === "outlet");

    if (lighting.length) {
      groups.push({
        id: stableCircuitId(`lighting-${roomId}`),
        name: `Iluminacao ${room?.name ?? "sem ambiente"}`,
        kind: "lighting",
        points: lighting,
        minCableMm2: 1.5,
        needsDr: room?.category === "wet" || room?.category === "service"
      });
    }

    splitByLoad(outlets, room?.category === "kitchen" || room?.category === "service" ? 1800 : 2200).forEach((bucket, index, buckets) => {
      groups.push({
        id: stableCircuitId(`outlets-${roomId}-${index}`),
        name: `Tomadas ${room?.name ?? "sem ambiente"}${buckets.length > 1 ? ` ${index + 1}` : ""}`,
        kind: "outlets",
        points: bucket,
        minCableMm2: 2.5,
        needsDr: true
      });
    });
  });

  return groups;
}

function splitByLoad(points: ElectricalPoint[], maxLoadW: number): ElectricalPoint[][] {
  const buckets: ElectricalPoint[][] = [];

  points.forEach(point => {
    const loadW = pointLoad(point);
    const current = buckets[buckets.length - 1];
    const currentLoad = current?.reduce((sum, item) => sum + pointLoad(item), 0) ?? 0;

    if (!current || currentLoad + loadW > maxLoadW) {
      buckets.push([point]);
    } else {
      current.push(point);
    }
  });

  return buckets;
}

function isDedicatedPoint(point: ElectricalPoint): boolean {
  return ["dedicated", "ac", "oven", "exhaust"].includes(point.type) || pointLoad(point) >= 1800;
}

function suggestedVoltage(points: ElectricalPoint[], loadW: number): 127 | 220 {
  if (points.some(point => ["oven", "ac", "dedicated", "exhaust"].includes(point.type))) return 220;
  if (loadW > 2200) return 220;
  return 127;
}

function bestSinglePhase(loads: Record<"A" | "B" | "C", number>): Phase {
  return SINGLE_PHASES.reduce((best, phase) => (loads[phase] < loads[best] ? phase : best), "A");
}

function bestTwoPhase(loads: Record<"A" | "B" | "C", number>): Phase {
  const pairs: Array<"AB" | "BC" | "CA"> = ["AB", "BC", "CA"];
  return pairs.reduce((best, pair) => (pairLoad(loads, pair) < pairLoad(loads, best) ? pair : best), "AB");
}

function pairLoad(loads: Record<"A" | "B" | "C", number>, pair: "AB" | "BC" | "CA"): number {
  const phases = phaseParts(pair);
  return phases.reduce((sum, phase) => sum + loads[phase], 0);
}

function addLoadToPhase(loads: Record<"A" | "B" | "C", number>, phase: Phase, loadW: number): void {
  const phases = phaseParts(phase);
  phases.forEach(item => {
    loads[item] += loadW / phases.length;
  });
}

function estimatedCircuitLength(project: Project, points: ElectricalPoint[]): number {
  const roomIds = new Set(points.map(point => point.roomId));
  const relatedRooms = project.rooms.filter(room => roomIds.has(room.id));
  const farthestPoint = points.reduce((max, point) => Math.max(max, Math.hypot(point.x, point.y)), 0);
  const roomSpread = relatedRooms.reduce((sum, room) => sum + Math.hypot(room.width, room.height), 0);
  const scale = positiveNumber(project.meta.scaleMPerUnit, 1);
  return Math.max(12, Math.ceil((farthestPoint + roomSpread) * scale * 1.35));
}

function stableCircuitId(seed: string): string {
  return `auto-${seed.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function pointTypeName(type: ElectricalPoint["type"]): string {
  const names: Record<ElectricalPoint["type"], string> = {
    lighting: "Iluminacao",
    switch: "Interruptor",
    outlet: "Tomada",
    dedicated: "Dedicado",
    ac: "Ar-condicionado",
    oven: "Forno",
    exhaust: "Exaustao",
    board: "Quadro"
  };

  return names[type];
}

function voltageDrop(circuit: Circuit, currentA: number): number {
  const lengthM = Math.max(0, circuit.lengthM);
  const cableMm2 = positiveNumber(circuit.cableMm2, 0);
  if (!cableMm2 || circuit.voltage <= 0) return 0;

  const multiplier = circuit.phase === "ABC" ? Math.sqrt(3) : 2;
  const dropV = (multiplier * COPPER_RESISTIVITY * lengthM * currentA) / cableMm2;
  return (dropV / circuit.voltage) * 100;
}

function needsDr(rooms: Room[], point: ElectricalPoint): boolean {
  const room = rooms.find(item => item.id === point.roomId);
  return (
    point.type === "outlet" ||
    point.type === "dedicated" ||
    point.type === "oven" ||
    room?.category === "wet" ||
    room?.category === "kitchen" ||
    room?.category === "service"
  );
}

function suggestCable(circuit: Circuit, points: ElectricalPoint[], currentA: number): number {
  const minByUse = points.some(point => ["oven", "ac", "dedicated"].includes(point.type))
    ? 4
    : circuit.kind === "lighting"
      ? 1.5
      : 2.5;
  const targetCurrent = currentA * 1.25;

  return STANDARD_CABLES.find(cable => cable >= minByUse && AMPACITY[cable] >= targetCurrent) ?? 35;
}

function suggestBreaker(currentA: number, cableMm2: number): number {
  const ampacity = AMPACITY[cableMm2] ?? 0;
  return STANDARD_BREAKERS.find(breaker => breaker >= currentA * 1.1 && breaker <= ampacity) ?? STANDARD_BREAKERS[0];
}

function demandFactor(totalW: number): number {
  if (totalW <= 10000) return 1;
  if (totalW <= 20000) return 0.85;
  return 0.75;
}

function getPhaseLoads(circuits: CircuitCalculation[]): Record<"A" | "B" | "C", number> {
  const loads = { A: 0, B: 0, C: 0 };

  circuits.forEach(({ circuit, totalW }) => {
    if (circuit.phase === "A" || circuit.phase === "B" || circuit.phase === "C") {
      loads[circuit.phase] += totalW;
      return;
    }

    const phases = phaseParts(circuit.phase);
    phases.forEach(phase => {
      loads[phase] += totalW / phases.length;
    });
  });

  return loads;
}

function phaseParts(phase: Phase): Array<"A" | "B" | "C"> {
  if (phase === "ABC") return ["A", "B", "C"];
  if (phase === "AB") return ["A", "B"];
  if (phase === "BC") return ["B", "C"];
  if (phase === "CA") return ["C", "A"];
  return [phase];
}

function buildWarnings(
  project: Project,
  circuits: CircuitCalculation[],
  phaseLoadsW: Record<"A" | "B" | "C", number>
): ProjectWarning[] {
  const warnings: ProjectWarning[] = buildDataWarnings(project);

  circuits.forEach(calculation => {
    const name = calculation.circuit.name;

    if (calculation.overloaded) {
      warnings.push({
        id: `${calculation.circuit.id}-overload`,
        severity: "critical",
        title: "Circuito sobrecarregado",
        detail: `${name}: ${formatNumber(calculation.currentA)} A para disjuntor de ${calculation.circuit.breakerA} A.`,
        circuitId: calculation.circuit.id
      });
    }

    if (calculation.highVoltageDrop) {
      warnings.push({
        id: `${calculation.circuit.id}-drop`,
        severity: "warning",
        title: "Queda de tensao elevada",
        detail: `${name}: ${formatNumber(calculation.voltageDropPercent)}%. Meta de planejamento: ate ${VOLTAGE_DROP_LIMIT_PERCENT}%.`,
        circuitId: calculation.circuit.id
      });
    }

    if (calculation.missingPE) {
      warnings.push({
        id: `${calculation.circuit.id}-pe`,
        severity: "critical",
        title: "PE ausente",
        detail: `${name}: circuito com pontos cadastrados sem condutor de protecao informado.`,
        circuitId: calculation.circuit.id
      });
    }

    if (calculation.missingDR) {
      warnings.push({
        id: `${calculation.circuit.id}-dr`,
        severity: "warning",
        title: "DR ausente",
        detail: `${name}: circuito atende tomadas, cozinha, area molhada ou carga dedicada sem DR marcado.`,
        circuitId: calculation.circuit.id
      });
    }

    if (calculation.breakerCableMismatch) {
      warnings.push({
        id: `${calculation.circuit.id}-breaker-cable`,
        severity: "critical",
        title: "Disjuntor incompativel com cabo",
        detail: `${name}: disjuntor de ${calculation.circuit.breakerA} A acima da capacidade estimada do cabo ${calculation.circuit.cableMm2} mm2.`,
        circuitId: calculation.circuit.id
      });
    }
  });

  const values = Object.values(phaseLoadsW);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const imbalance = average > 0 ? ((Math.max(...values) - Math.min(...values)) / average) * 100 : 0;

  if (imbalance > 20) {
    warnings.push({
      id: "phase-imbalance",
      severity: "warning",
      title: "Desequilibrio de fases",
      detail: `A: ${Math.round(phaseLoadsW.A)} W, B: ${Math.round(phaseLoadsW.B)} W, C: ${Math.round(phaseLoadsW.C)} W. Diferenca estimada: ${formatNumber(imbalance)}%.`
    });
  }

  if (!project.points.some(point => point.type === "board")) {
    warnings.push({
      id: "missing-board-point",
      severity: "info",
      title: "Quadro nao posicionado",
      detail: "Adicione um ponto do tipo QD no editor para localizar a origem da distribuicao."
    });
  }

  return warnings;
}

function buildDataWarnings(project: Project): ProjectWarning[] {
  const warnings: ProjectWarning[] = [];
  const scale = project.meta.scaleMPerUnit;

  if (!Number.isFinite(scale) || scale <= 0) {
    warnings.push({
      id: "data-scale-invalid",
      severity: "critical",
      title: "Escala invalida",
      detail: "A escala da planta precisa ser maior que zero para estimar comprimentos e queda de tensao."
    });
  } else if (!project.meta.scaleVerified) {
    warnings.push({
      id: "data-scale-unverified",
      severity: "warning",
      title: "Escala da planta nao conferida",
      detail: "Os comprimentos dos circuitos usam a posicao dos pontos na planta. Confira a escala antes de validar queda de tensao."
    });
  }

  project.rooms.forEach(room => {
    if (!room.name.trim()) {
      warnings.push({
        id: `${room.id}-empty-name`,
        severity: "warning",
        title: "Ambiente sem nome",
        detail: "Informe um nome para facilitar setorizacao, memorial e exportacao.",
        roomId: room.id
      });
    }

    if (!Number.isFinite(room.width) || !Number.isFinite(room.height) || room.width <= 0 || room.height <= 0) {
      warnings.push({
        id: `${room.id}-invalid-dimensions`,
        severity: "critical",
        title: "Dimensao de ambiente invalida",
        detail: `${room.name || "Ambiente"}: largura e comprimento precisam ser maiores que zero.`,
        roomId: room.id
      });
    }
  });

  project.points.forEach(point => {
    const assignedRoom = project.rooms.find(room => room.id === point.roomId);
    const actualRoom = findRoomAt(project.rooms, point.x, point.y);

    if (!point.label.trim()) {
      warnings.push({
        id: `${point.id}-empty-label`,
        severity: "warning",
        title: "Ponto sem etiqueta",
        detail: "Informe uma etiqueta para localizar o ponto na planta e nos relatorios.",
        pointId: point.id
      });
    }

    if (!Number.isFinite(point.quantity) || point.quantity <= 0) {
      warnings.push({
        id: `${point.id}-invalid-quantity`,
        severity: "critical",
        title: "Quantidade invalida",
        detail: `${point.label || "Ponto"}: quantidade precisa ser maior que zero.`,
        pointId: point.id
      });
    }

    if (point.type !== "switch" && point.type !== "board" && (!Number.isFinite(point.loadW) || point.loadW <= 0)) {
      warnings.push({
        id: `${point.id}-invalid-load`,
        severity: "critical",
        title: "Potencia invalida",
        detail: `${point.label || "Ponto"}: pontos consumidores precisam ter potencia maior que zero.`,
        pointId: point.id
      });
    }

    if (!assignedRoom) {
      warnings.push({
        id: `${point.id}-missing-room`,
        severity: "warning",
        title: "Ponto sem ambiente",
        detail: `${point.label || "Ponto"} nao esta vinculado a um ambiente.`,
        pointId: point.id
      });
    } else if (actualRoom && actualRoom.id !== assignedRoom.id) {
      warnings.push({
        id: `${point.id}-room-mismatch`,
        severity: "warning",
        title: "Ponto em ambiente divergente",
        detail: `${point.label || "Ponto"} esta cadastrado em ${assignedRoom.name}, mas aparece dentro de ${actualRoom.name}.`,
        pointId: point.id,
        roomId: actualRoom.id
      });
    }

    if (!actualRoom) {
      warnings.push({
        id: `${point.id}-outside-room`,
        severity: "warning",
        title: "Ponto fora dos ambientes",
        detail: `${point.label || "Ponto"} esta fora dos retangulos cadastrados na planta.`,
        pointId: point.id
      });
    }

    if (point.circuitId && !project.circuits.some(circuit => circuit.id === point.circuitId)) {
      warnings.push({
        id: `${point.id}-missing-circuit`,
        severity: "critical",
        title: "Circuito nao encontrado",
        detail: `${point.label || "Ponto"} esta vinculado a um circuito que nao existe mais.`,
        pointId: point.id
      });
    }
  });

  project.circuits.forEach(circuit => {
    if (!circuit.name.trim()) {
      warnings.push({
        id: `${circuit.id}-empty-name`,
        severity: "warning",
        title: "Circuito sem nome",
        detail: "Informe um nome para identificar o circuito no quadro e nas exportacoes.",
        circuitId: circuit.id
      });
    }

    if (!Number.isFinite(circuit.lengthM) || circuit.lengthM <= 0) {
      warnings.push({
        id: `${circuit.id}-invalid-length`,
        severity: "warning",
        title: "Comprimento invalido",
        detail: `${circuit.name || "Circuito"}: comprimento precisa ser maior que zero para queda de tensao confiavel.`,
        circuitId: circuit.id
      });
    }

    if (!Number.isFinite(circuit.cableMm2) || circuit.cableMm2 <= 0) {
      warnings.push({
        id: `${circuit.id}-invalid-cable`,
        severity: "critical",
        title: "Cabo invalido",
        detail: `${circuit.name || "Circuito"}: secao do cabo precisa ser maior que zero.`,
        circuitId: circuit.id
      });
    }

    if (!Number.isFinite(circuit.breakerA) || circuit.breakerA <= 0) {
      warnings.push({
        id: `${circuit.id}-invalid-breaker`,
        severity: "critical",
        title: "Disjuntor invalido",
        detail: `${circuit.name || "Circuito"}: corrente do disjuntor precisa ser maior que zero.`,
        circuitId: circuit.id
      });
    }
  });

  return warnings;
}

function pointLoad(point: ElectricalPoint): number {
  return Math.max(0, numericValue(point.loadW)) * Math.max(0, numericValue(point.quantity));
}

function positiveNumber(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function numericValue(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function findRoomAt(rooms: Room[], x: number, y: number): Room | undefined {
  return rooms.find(room => x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height);
}

function buildMaterials(project: Project, circuits: CircuitCalculation[]): MaterialItem[] {
  const items: MaterialItem[] = [];
  const cableByGauge = new Map<number, number>();

  circuits.forEach(calculation => {
    const conductors = phaseParts(calculation.circuit.phase).length + 1 + (calculation.circuit.hasPE ? 1 : 0);
    const meters = Math.ceil(Math.max(0, numericValue(calculation.circuit.lengthM)) * conductors * 1.1);
    const gauge = positiveNumber(calculation.circuit.cableMm2, calculation.suggestedCableMm2);
    cableByGauge.set(gauge, (cableByGauge.get(gauge) ?? 0) + meters);
  });

  cableByGauge.forEach((meters, gauge) => {
    items.push({ group: "Cabos", item: `Cabo cobre 750 V ${gauge} mm2`, quantity: meters, unit: "m" });
  });

  items.push({ group: "Infraestrutura", item: "Eletroduto corrugado/reforcado", quantity: totalConduit(circuits), unit: "m" });
  items.push({ group: "Protecao", item: "Disjuntores termomagneticos", quantity: project.circuits.length, unit: "un" });
  items.push({ group: "Protecao", item: "Dispositivo DR 30 mA", quantity: Math.max(1, circuits.filter(item => item.circuit.drProtected).length), unit: "un" });
  items.push({ group: "Protecao", item: "DPS classe II", quantity: 1, unit: "cj" });

  countPoints(project.points).forEach((quantity, type) => {
    items.push({ group: "Pontos", item: pointMaterialName(type), quantity, unit: "un" });
  });

  return items;
}

function totalConduit(circuits: CircuitCalculation[]): number {
  return Math.ceil(circuits.reduce((sum, item) => sum + Math.max(0, numericValue(item.circuit.lengthM)), 0) * 1.15);
}

function countPoints(points: ElectricalPoint[]): Map<ElectricalPoint["type"], number> {
  const counts = new Map<ElectricalPoint["type"], number>();
  points.forEach(point => counts.set(point.type, (counts.get(point.type) ?? 0) + Math.max(0, Math.ceil(numericValue(point.quantity)))));
  return counts;
}

function pointMaterialName(type: ElectricalPoint["type"]): string {
  const names: Record<ElectricalPoint["type"], string> = {
    lighting: "Ponto de iluminacao",
    switch: "Interruptor",
    outlet: "Tomada 2P+T",
    dedicated: "Ponto dedicado",
    ac: "Ponto ar-condicionado",
    oven: "Ponto forno/chapa",
    exhaust: "Ponto exaustao",
    board: "Quadro de distribuicao"
  };

  return names[type];
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}
