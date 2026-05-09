import { CircuitBoard, Crosshair, DoorOpen, Hand, Maximize2, MousePointer2, Plug, SquarePlus, Trash2, ZoomIn, ZoomOut, Zap } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { ElectricalPoint, PointType, Project, Room } from "../types";

type Tool = "select" | "pan" | "room" | "point";
type PaletteKind = PointType | "circuit" | "room";

interface FloorPlanEditorProps {
  project: Project;
  selectedId: string;
  selectedType: "room" | "point" | "circuit";
  pointType: PointType;
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onPointTypeChange: (type: PointType) => void;
  onProjectChange: (project: Project) => void;
  onSelect: (type: "room" | "point" | "circuit", id: string) => void;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
}

const VIEW = { width: 15, height: 9.2 };
const MIN_VIEW_WIDTH = 3.8;
const MAX_VIEW_WIDTH = 18;
const PALETTE: Array<{ kind: PaletteKind; label: string }> = [
  { kind: "room", label: "Comodo" },
  { kind: "circuit", label: "Circuito" },
  { kind: "lighting", label: "Luz" },
  { kind: "outlet", label: "Tomada" },
  { kind: "dedicated", label: "TUE" },
  { kind: "oven", label: "Forno" },
  { kind: "ac", label: "Ar" },
  { kind: "exhaust", label: "Exaustao" },
  { kind: "board", label: "QD" }
];

const TOOL_GUIDANCE: Record<Tool, { label: string; instruction: string }> = {
  select: { label: "Selecionar", instruction: "Clique em um ambiente, ponto ou circuito para editar no inspetor." },
  pan: { label: "Navegar", instruction: "Arraste a planta para reposicionar a vista; use a roda do mouse para zoom." },
  room: { label: "Criar ambiente", instruction: "Clique na planta para inserir um novo ambiente." },
  point: { label: "Inserir ponto", instruction: "Escolha o tipo e clique na planta para posicionar o ponto eletrico." }
};

export function FloorPlanEditor({
  project,
  selectedId,
  selectedType,
  pointType,
  tool,
  onToolChange,
  onPointTypeChange,
  onProjectChange,
  onSelect,
  onDeleteSelected,
  canDeleteSelected
}: FloorPlanEditorProps) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: VIEW.width, height: VIEW.height });
  const zoomPercent = Math.round((VIEW.width / viewBox.width) * 100);
  const activeTool = TOOL_GUIDANCE[tool];
  const boardPoint = project.points.find(point => point.type === "board");

  const updateRoom = (roomId: string, patch: Partial<Room>) => {
    const currentRoom = project.rooms.find(room => room.id === roomId);
    const dx = currentRoom && patch.x !== undefined ? patch.x - currentRoom.x : 0;
    const dy = currentRoom && patch.y !== undefined ? patch.y - currentRoom.y : 0;

    onProjectChange({
      ...project,
      rooms: project.rooms.map(room => (room.id === roomId ? { ...room, ...patch } : room)),
      points:
        currentRoom && (dx !== 0 || dy !== 0)
          ? project.points.map(point =>
              point.roomId === roomId || containsPoint(currentRoom, point.x, point.y)
                ? {
                    ...point,
                    roomId,
                    x: clamp(point.x + dx, 0, VIEW.width),
                    y: clamp(point.y + dy, 0, VIEW.height)
                  }
                : point
            )
          : project.points
    });
  };

  const updatePoint = (pointId: string, patch: Partial<ElectricalPoint>) => {
    onProjectChange({
      ...project,
      points: project.points.map(point => (point.id === pointId ? { ...point, ...patch } : point))
    });
  };

  const addRoom = (x: number, y: number) => {
    const room: Room = {
      id: crypto.randomUUID(),
      name: `Ambiente ${project.rooms.length + 1}`,
      x: clamp(x - 2, 0.4, VIEW.width - 3),
      y: clamp(y - 1.4, 0.4, VIEW.height - 2),
      width: 3.6,
      height: 2.6,
      category: "dry"
    };

    onProjectChange({ ...project, rooms: [...project.rooms, room] });
    onSelect("room", room.id);
  };

  const addPoint = (x: number, y: number, type: PointType = pointType, circuitId = project.circuits.find(circuit => circuit.kind !== "board")?.id ?? "") => {
    const room = findRoomAt(project.rooms, x, y);
    const circuit = project.circuits.find(item => item.kind !== "board");
    const point: ElectricalPoint = {
      id: crypto.randomUUID(),
      roomId: room?.id ?? "",
      x,
      y,
      type,
      label: labelFor(type, project.points.length + 1),
      loadW: defaultLoad(type),
      quantity: 1,
      circuitId: circuitId || circuit?.id || ""
    };

    onProjectChange({ ...project, points: [...project.points, point] });
    onSelect("point", point.id);
  };

  const addCircuitWithPoint = (x: number, y: number) => {
    const circuitId = crypto.randomUUID();
    const circuitNumber = project.circuits.filter(circuit => circuit.kind !== "board").length + 2;
    const room = findRoomAt(project.rooms, x, y);
    const circuit = {
      id: circuitId,
      name: `Circuito ${circuitNumber} ${room ? room.name : "novo"}`,
      kind: "dedicated" as const,
      phase: "A" as const,
      voltage: 127 as const,
      lengthM: 20,
      cableMm2: 2.5,
      breakerA: 16,
      drProtected: true,
      hasPE: true
    };
    const point: ElectricalPoint = {
      id: crypto.randomUUID(),
      roomId: room?.id ?? "",
      x,
      y,
      type: "dedicated",
      label: `C${circuitNumber}`,
      loadW: defaultLoad("dedicated"),
      quantity: 1,
      circuitId
    };

    onProjectChange({
      ...project,
      circuits: [...project.circuits, circuit],
      points: [...project.points, point]
    });
    onSelect("circuit", circuit.id);
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isCanvasTarget(event.target)) return;
    const coordinates = getSvgPoint(event.currentTarget, event);

    if (tool === "room") addRoom(coordinates.x, coordinates.y);
    if (tool === "point") addPoint(coordinates.x, coordinates.y);
  };

  const zoomAtCenter = (factor: number) => {
    setViewBox(current => zoomViewBox(current, factor, { x: current.x + current.width / 2, y: current.y + current.height / 2 }));
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const anchor = getSvgPoint(event.currentTarget, event);
    setViewBox(current => zoomViewBox(current, event.deltaY > 0 ? 1.14 : 0.88, anchor));
  };

  const handleDrop = (event: React.DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("application/x-electrical-palette") as PaletteKind;
    const coordinates = getSvgPoint(event.currentTarget, event);

    if (payload === "room") {
      addRoom(coordinates.x, coordinates.y);
      return;
    }

    if (payload === "circuit") {
      addCircuitWithPoint(coordinates.x, coordinates.y);
      return;
    }

    if (payload) {
      addPoint(coordinates.x, coordinates.y, payload as PointType);
    }
  };

  return (
    <section className="editor-shell">
      <div className="editor-toolbar" aria-label="Ferramentas do plano">
        <button className={tool === "select" ? "active" : ""} aria-pressed={tool === "select"} onClick={() => onToolChange("select")} title="Selecionar">
          <MousePointer2 size={17} />
          <span className="sr-only">Selecionar</span>
        </button>
        <button className={tool === "pan" ? "active" : ""} aria-pressed={tool === "pan"} onClick={() => onToolChange("pan")} title="Navegar pela planta">
          <Hand size={17} />
          <span className="sr-only">Navegar</span>
        </button>
        <button className={tool === "room" ? "active" : ""} aria-pressed={tool === "room"} onClick={() => onToolChange("room")} title="Criar ambiente">
          <SquarePlus size={17} />
          <span className="sr-only">Criar ambiente</span>
        </button>
        <button className={tool === "point" ? "active" : ""} aria-pressed={tool === "point"} onClick={() => onToolChange("point")} title="Inserir ponto">
          <Crosshair size={17} />
          <span className="sr-only">Inserir ponto</span>
        </button>
        <button className="toolbar-danger" onClick={onDeleteSelected} disabled={!canDeleteSelected} title="Excluir selecionado">
          <Trash2 size={17} />
          <span className="sr-only">Excluir selecionado</span>
        </button>
        <select value={pointType} onChange={event => onPointTypeChange(event.target.value as PointType)} aria-label="Tipo de ponto">
          <option value="lighting">Iluminacao</option>
          <option value="switch">Interruptor</option>
          <option value="outlet">Tomada</option>
          <option value="dedicated">Dedicado</option>
          <option value="ac">Ar-condicionado</option>
          <option value="oven">Forno/chapa</option>
          <option value="exhaust">Exaustao</option>
          <option value="board">QD</option>
        </select>
      </div>

      <div className={`tool-guidance tool-guidance-${tool}`}>
        <strong>{activeTool.label}</strong>
        <span>{activeTool.instruction}</span>
      </div>

      <div className="zoom-controls" aria-label="Navegacao da planta">
        <button onClick={() => zoomAtCenter(0.82)} title="Aproximar">
          <ZoomIn size={16} />
        </button>
        <strong>{zoomPercent}%</strong>
        <button onClick={() => zoomAtCenter(1.18)} title="Afastar">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => setViewBox({ x: 0, y: 0, width: VIEW.width, height: VIEW.height })} title="Ajustar planta">
          <Maximize2 size={16} />
        </button>
      </div>

      <div className="palette-rail" aria-label="Barra de componentes">
        {PALETTE.map(item => (
          <button
            key={item.kind}
            draggable
            onDragStart={event => {
              event.dataTransfer.setData("application/x-electrical-palette", item.kind);
              event.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => {
              if (item.kind !== "room" && item.kind !== "circuit") {
                onPointTypeChange(item.kind as PointType);
                onToolChange("point");
              }
            }}
            title={`Arrastar ${item.label}`}
          >
            {item.kind === "room" ? <SquarePlus size={16} /> : item.kind === "circuit" ? <Zap size={16} /> : iconFor(item.kind as PointType)}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <svg
        id="floor-plan-svg"
        className={`floor-svg tool-${tool}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleCanvasClick}
        onPointerDown={event => {
          if (tool === "pan") startPan(event, viewBox, setViewBox);
        }}
        onWheel={handleWheel}
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
      >
        <defs>
          <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
            <path d="M 0.5 0 L 0 0 0 0.5" fill="none" stroke="#d8d2c5" strokeWidth="0.012" />
          </pattern>
        </defs>
        <rect className="svg-background" data-canvas="true" x="-2" y="-2" width={VIEW.width + 4} height={VIEW.height + 4} fill="url(#grid)" />
        <text x="0.25" y="0.32" className="scale-label">
          Escala grafica aproximada: cada quadrado = 0,50 m
        </text>
        <line x1="0.28" y1="0.52" x2="2.28" y2="0.52" className="scale-line" />
        <text x="0.3" y="0.78" className="scale-label">
          2,00 m
        </text>

        {boardPoint && (
          <g className="entrance-route" aria-label="Entrada da instalacao">
            <line x1="0.25" y1={boardPoint.y} x2={Math.max(0.25, boardPoint.x - 0.28)} y2={boardPoint.y} />
            <circle cx="0.25" cy={boardPoint.y} r="0.12" />
            <text x="0.36" y={boardPoint.y - 0.12}>
              Entrada
            </text>
          </g>
        )}

        {project.rooms.map(room => (
          <g key={room.id}>
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              rx={0.08}
              className={selectedType === "room" && selectedId === room.id ? "room selected" : "room"}
              onClick={event => {
                if (tool === "pan") return;
                event.stopPropagation();
                onSelect("room", room.id);
              }}
              onPointerDown={event => {
                if (tool === "select") startDragRoom(event, room, updateRoom);
              }}
            />
            <text x={room.x + 0.18} y={room.y + 0.36} className="room-label">
              {room.name}
            </text>
            <text x={room.x + 0.18} y={room.y + 0.68} className="room-measure">
              {formatRoomMeasures(room)}
            </text>
            <text x={room.x + 0.18} y={room.y + room.height - 0.22} className="room-sector">
              {roomSectorLabel(project, room)}
            </text>
            <DoorOpen x={room.x + room.width - 0.52} y={room.y + room.height - 0.48} size={0.32} strokeWidth={1.5} />
          </g>
        ))}

        {project.points.map(point => {
          const assignedRoom = project.rooms.find(room => room.id === point.roomId);
          const actualRoom = findRoomAt(project.rooms, point.x, point.y);
          const placementMismatch = Boolean(actualRoom && assignedRoom && actualRoom.id !== assignedRoom.id);
          const outsideRoom = !actualRoom;
          const pointClass = [
            "point",
            selectedType === "point" && selectedId === point.id ? "selected" : "",
            placementMismatch || outsideRoom ? "placement-mismatch" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <g
              key={point.id}
              className={pointClass}
              transform={`translate(${point.x} ${point.y})`}
              onClick={event => {
                if (tool === "pan") return;
                event.stopPropagation();
                onSelect("point", point.id);
              }}
              onPointerDown={event => {
                if (tool === "select") startDragPoint(event, point, project.rooms, updatePoint);
              }}
            >
              <title>
                {placementMismatch
                  ? `${point.label}: cadastrado em ${assignedRoom?.name}, posicionado em ${actualRoom?.name}`
                  : outsideRoom
                    ? `${point.label}: fora dos ambientes`
                    : point.label}
              </title>
              {(placementMismatch || outsideRoom) && <circle r="0.3" className="point-warning-ring" />}
              <circle r="0.2" className={`point-dot ${point.type}`} />
              {point.type === "board" ? (
                <CircuitBoard x={-0.12} y={-0.12} size={0.24} strokeWidth={2} />
              ) : (
                <Plug x={-0.105} y={-0.105} size={0.21} strokeWidth={2} />
              )}
              <text x="0.26" y="0.08" className="point-label">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function getSvgPoint(svg: SVGSVGElement, event: React.MouseEvent | React.DragEvent | React.WheelEvent | PointerEvent): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = "clientX" in event ? event.clientX : 0;
  point.y = "clientY" in event ? event.clientY : 0;
  const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
  return { x: clamp(transformed.x, 0, VIEW.width), y: clamp(transformed.y, 0, VIEW.height) };
}

function startPan(
  event: React.PointerEvent<SVGSVGElement>,
  viewBox: { x: number; y: number; width: number; height: number },
  setViewBox: Dispatch<SetStateAction<{ x: number; y: number; width: number; height: number }>>
) {
  if (event.button !== 0) return;
  const svg = event.currentTarget;
  const start = { x: event.clientX, y: event.clientY };
  svg.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    const dx = ((start.x - moveEvent.clientX) * viewBox.width) / svg.clientWidth;
    const dy = ((start.y - moveEvent.clientY) * viewBox.height) / svg.clientHeight;
    setViewBox(clampViewBox({ ...viewBox, x: viewBox.x + dx, y: viewBox.y + dy }));
  };

  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function startDragRoom(event: React.PointerEvent<SVGRectElement>, room: Room, onMove: (id: string, patch: Partial<Room>) => void) {
  if (event.button !== 0) return;
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) return;
  const start = getSvgPoint(svg, event.nativeEvent);
  const offset = { x: start.x - room.x, y: start.y - room.y };
  event.currentTarget.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    const next = getSvgPoint(svg, moveEvent);
    onMove(room.id, {
      x: clamp(next.x - offset.x, 0, VIEW.width - room.width),
      y: clamp(next.y - offset.y, 0, VIEW.height - room.height)
    });
  };

  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function startDragPoint(
  event: React.PointerEvent<SVGGElement>,
  point: ElectricalPoint,
  rooms: Room[],
  onMove: (id: string, patch: Partial<ElectricalPoint>) => void
) {
  if (event.button !== 0) return;
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) return;
  event.currentTarget.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    const next = getSvgPoint(svg, moveEvent);
    const room = findRoomAt(rooms, next.x, next.y);
    onMove(point.id, {
      x: next.x,
      y: next.y,
      roomId: room?.id ?? ""
    });
  };

  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function containsPoint(room: Room, x: number, y: number): boolean {
  return x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height;
}

function findRoomAt(rooms: Room[], x: number, y: number): Room | undefined {
  return rooms.find(room => containsPoint(room, x, y));
}

function roomSectorLabel(project: Project, room: Room): string {
  const circuitNames = Array.from(
    new Set(
      project.points
        .filter(point => point.roomId === room.id)
        .map(point => project.circuits.find(circuit => circuit.id === point.circuitId)?.name)
        .filter(Boolean)
    )
  ) as string[];

  if (circuitNames.length === 0) return "Sem setor";
  return `Setor: ${circuitNames.slice(0, 2).join(" / ")}${circuitNames.length > 2 ? ` +${circuitNames.length - 2}` : ""}`;
}

function formatRoomMeasures(room: Room): string {
  const area = room.width * room.height;
  return `${room.width.toFixed(2)} m x ${room.height.toFixed(2)} m | ${area.toFixed(1)} m2`;
}

function defaultLoad(type: PointType): number {
  const loads: Record<PointType, number> = {
    lighting: 100,
    switch: 0,
    outlet: 600,
    dedicated: 1500,
    ac: 2200,
    oven: 3500,
    exhaust: 750,
    board: 0
  };

  return loads[type];
}

function labelFor(type: PointType, count: number): string {
  const prefixes: Record<PointType, string> = {
    lighting: "L",
    switch: "I",
    outlet: "TUG",
    dedicated: "TUE",
    ac: "AC",
    oven: "F",
    exhaust: "EX",
    board: "QD"
  };

  return `${prefixes[type]}${count}`;
}

function iconFor(type: PointType) {
  if (type === "board") return <CircuitBoard size={16} />;
  return <Plug size={16} />;
}

function zoomViewBox(
  current: { x: number; y: number; width: number; height: number },
  factor: number,
  anchor: { x: number; y: number }
) {
  const nextWidth = clamp(current.width * factor, MIN_VIEW_WIDTH, MAX_VIEW_WIDTH);
  const nextHeight = nextWidth * (VIEW.height / VIEW.width);
  const anchorRatioX = (anchor.x - current.x) / current.width;
  const anchorRatioY = (anchor.y - current.y) / current.height;

  return clampViewBox({
    x: anchor.x - nextWidth * anchorRatioX,
    y: anchor.y - nextHeight * anchorRatioY,
    width: nextWidth,
    height: nextHeight
  });
}

function clampViewBox(viewBox: { x: number; y: number; width: number; height: number }) {
  const margin = 1.2;
  return {
    ...viewBox,
    x: clamp(viewBox.x, -margin, VIEW.width + margin - viewBox.width),
    y: clamp(viewBox.y, -margin, VIEW.height + margin - viewBox.height)
  };
}

function isCanvasTarget(target: EventTarget): boolean {
  return target instanceof SVGElement && (target.dataset.canvas === "true" || target.id === "floor-plan-svg");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
