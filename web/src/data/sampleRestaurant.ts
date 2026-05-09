import type { Project } from "../types";

export const sampleRestaurantProject: Project = {
  meta: {
    name: "Restaurante Jardim Sul - Anteprojeto eletrico",
    client: "Restaurante Jardim Sul",
    city: "Porto Alegre / RS",
    voltageSystem: "127/220 V - baixa tensao",
    responsible: "Martinho Construtor",
    scaleMPerUnit: 1,
    scaleVerified: false,
    notes:
      "Projeto demonstrativo para planejamento. Validar em campo, emitir ART/RRT quando aplicavel e seguir normas vigentes."
  },
  rooms: [
    { id: "r1", name: "Salao", x: 0.8, y: 0.8, width: 7.2, height: 5.2, category: "public" },
    { id: "r2", name: "Cozinha", x: 8.3, y: 0.8, width: 5.2, height: 4.4, category: "kitchen" },
    { id: "r3", name: "Deposito", x: 8.3, y: 5.5, width: 2.5, height: 2.7, category: "service" },
    { id: "r4", name: "Banheiros", x: 11.1, y: 5.5, width: 2.4, height: 2.7, category: "wet" },
    { id: "r5", name: "Quadro", x: 0.8, y: 6.3, width: 2.8, height: 1.9, category: "service" }
  ],
  circuits: [
    {
      id: "c-entrada",
      name: "01 Entrada / alimentador",
      kind: "board",
      phase: "ABC",
      voltage: 220,
      lengthM: 12,
      cableMm2: 16,
      breakerA: 63,
      drProtected: false,
      hasPE: true
    },
    {
      id: "c1",
      name: "02 Iluminacao geral",
      kind: "lighting",
      phase: "A",
      voltage: 127,
      lengthM: 28,
      cableMm2: 1.5,
      breakerA: 10,
      drProtected: false,
      hasPE: true
    },
    {
      id: "c2",
      name: "03 Tomadas salao/cozinha",
      kind: "outlets",
      phase: "A",
      voltage: 127,
      lengthM: 36,
      cableMm2: 2.5,
      breakerA: 20,
      drProtected: false,
      hasPE: true
    },
    {
      id: "c3",
      name: "04 Forno e chapa",
      kind: "dedicated",
      phase: "BC",
      voltage: 220,
      lengthM: 42,
      cableMm2: 2.5,
      breakerA: 40,
      drProtected: true,
      hasPE: false
    },
    {
      id: "c4",
      name: "05 Ar-condicionado salao",
      kind: "hvac",
      phase: "B",
      voltage: 127,
      lengthM: 62,
      cableMm2: 4,
      breakerA: 25,
      drProtected: true,
      hasPE: true
    },
    {
      id: "c5",
      name: "06 Exaustao e apoio cozinha",
      kind: "motor",
      phase: "C",
      voltage: 220,
      lengthM: 24,
      cableMm2: 4,
      breakerA: 20,
      drProtected: true,
      hasPE: true
    }
  ],
  points: [
    { id: "p1", roomId: "r1", x: 2.2, y: 2.0, type: "lighting", label: "L1", loadW: 120, quantity: 4, circuitId: "c1" },
    { id: "p2", roomId: "r1", x: 6.2, y: 4.4, type: "lighting", label: "L2", loadW: 120, quantity: 4, circuitId: "c1" },
    { id: "p3", roomId: "r2", x: 10.1, y: 2.1, type: "lighting", label: "L3", loadW: 80, quantity: 3, circuitId: "c1" },
    { id: "p4", roomId: "r1", x: 1.7, y: 4.9, type: "outlet", label: "TUG salao", loadW: 600, quantity: 4, circuitId: "c2" },
    { id: "p5", roomId: "r2", x: 9.2, y: 3.9, type: "outlet", label: "TUG cozinha", loadW: 600, quantity: 3, circuitId: "c2" },
    { id: "p6", roomId: "r2", x: 12.6, y: 2.0, type: "oven", label: "Forno", loadW: 4500, quantity: 1, circuitId: "c3" },
    { id: "p7", roomId: "r2", x: 12.3, y: 4.4, type: "dedicated", label: "Chapa", loadW: 3200, quantity: 1, circuitId: "c3" },
    { id: "p8", roomId: "r1", x: 6.9, y: 1.4, type: "ac", label: "AC 36k", loadW: 4600, quantity: 1, circuitId: "c4" },
    { id: "p9", roomId: "r2", x: 11.1, y: 1.2, type: "exhaust", label: "Exaustor", loadW: 1100, quantity: 1, circuitId: "c5" },
    { id: "p10", roomId: "r5", x: 1.2, y: 7.0, type: "board", label: "QD", loadW: 0, quantity: 1, circuitId: "c-entrada" }
  ]
};
