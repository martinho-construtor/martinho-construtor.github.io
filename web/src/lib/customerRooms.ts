import type { CustomerPropertyType, CustomerRoomKey, Project, Room } from "../types";

export interface CustomerPropertyOption {
  value: CustomerPropertyType;
  label: string;
  eyebrow: string;
  description: string;
}

export interface CustomerRoomQuestion {
  key: CustomerRoomKey;
  label: string;
  hint: string;
  min: number;
  max: number;
}

export const CUSTOMER_PROPERTY_OPTIONS: CustomerPropertyOption[] = [
  {
    value: "commercial",
    label: "Comercial",
    eyebrow: "Loja, sala ou restaurante",
    description: "Ambiente externo com fachada, vitrine e area de chegada para clientes."
  },
  {
    value: "residential-house",
    label: "Residencial casa",
    eyebrow: "Casa terrea ou sobrado",
    description: "Imagem com jardim, entrada acolhedora e cara de lar familiar."
  },
  {
    value: "residential-building",
    label: "Residencial predio",
    eyebrow: "Apartamento ou unidade em edificio",
    description: "Cena urbana com varanda, torre e leitura clara de moradia vertical."
  }
];

const ROOM_QUESTIONS: Record<CustomerPropertyType, CustomerRoomQuestion[]> = {
  commercial: [
    { key: "customerArea", label: "Atendimento", hint: "Area principal para receber clientes.", min: 1, max: 8 },
    { key: "stock", label: "Estoque", hint: "Apoio para guardar produtos ou insumos.", min: 0, max: 6 },
    { key: "bathrooms", label: "Banheiros", hint: "Uso de clientes e equipe.", min: 0, max: 6 },
    { key: "kitchens", label: "Cozinhas", hint: "Preparo, copa ou apoio.", min: 0, max: 4 },
    { key: "office", label: "Escritorio", hint: "Gestao, reuniao ou caixa.", min: 0, max: 4 }
  ],
  "residential-house": [
    { key: "bedrooms", label: "Quartos", hint: "Dormir, visita ou multiuso.", min: 1, max: 8 },
    { key: "suites", label: "Suites", hint: "Quartos com banho proprio.", min: 0, max: 5 },
    { key: "livingRooms", label: "Salas", hint: "Estar, jantar ou TV.", min: 1, max: 4 },
    { key: "bathrooms", label: "Banheiros", hint: "Banho social ou lavabo.", min: 1, max: 6 },
    { key: "kitchens", label: "Cozinhas", hint: "Cozinha, copa ou gourmet.", min: 1, max: 3 },
    { key: "serviceAreas", label: "Area de servico", hint: "Lavanderia e apoio.", min: 0, max: 3 },
    { key: "balconies", label: "Varandas", hint: "Deck, jardim ou sacada.", min: 0, max: 4 },
    { key: "office", label: "Escritorio", hint: "Trabalho ou estudo.", min: 0, max: 3 }
  ],
  "residential-building": [
    { key: "bedrooms", label: "Quartos", hint: "Dormir, visita ou bebe.", min: 1, max: 5 },
    { key: "suites", label: "Suites", hint: "Quartos com banho proprio.", min: 0, max: 3 },
    { key: "livingRooms", label: "Salas", hint: "Estar integrado ou jantar.", min: 1, max: 3 },
    { key: "bathrooms", label: "Banheiros", hint: "Banho social ou lavabo.", min: 1, max: 4 },
    { key: "kitchens", label: "Cozinhas", hint: "Aberta, fechada ou compacta.", min: 1, max: 2 },
    { key: "serviceAreas", label: "Area de servico", hint: "Lavanderia ou armario.", min: 0, max: 2 },
    { key: "balconies", label: "Varandas", hint: "Sacada, gourmet ou jardim suspenso.", min: 0, max: 3 },
    { key: "office", label: "Escritorio", hint: "Home office ou estudo.", min: 0, max: 2 }
  ]
};

const DEFAULT_ROOM_COUNTS: Record<CustomerPropertyType, Partial<Record<CustomerRoomKey, number>>> = {
  commercial: {
    customerArea: 1,
    stock: 1,
    bathrooms: 2,
    kitchens: 1,
    office: 1
  },
  "residential-house": {
    bedrooms: 3,
    suites: 1,
    livingRooms: 1,
    bathrooms: 2,
    kitchens: 1,
    serviceAreas: 1,
    balconies: 1,
    office: 0
  },
  "residential-building": {
    bedrooms: 2,
    suites: 1,
    livingRooms: 1,
    bathrooms: 2,
    kitchens: 1,
    serviceAreas: 1,
    balconies: 1,
    office: 0
  }
};

export function getCustomerRoomQuestions(propertyType: CustomerPropertyType): CustomerRoomQuestion[] {
  return ROOM_QUESTIONS[propertyType];
}

export function getDefaultRoomCounts(propertyType: CustomerPropertyType): Partial<Record<CustomerRoomKey, number>> {
  return { ...DEFAULT_ROOM_COUNTS[propertyType] };
}

export function normalizeRoomCounts(
  propertyType: CustomerPropertyType,
  source: unknown
): Partial<Record<CustomerRoomKey, number>> {
  const defaults = getDefaultRoomCounts(propertyType);
  const record = isRecord(source) ? source : {};
  const counts: Partial<Record<CustomerRoomKey, number>> = {};

  for (const question of getCustomerRoomQuestions(propertyType)) {
    const raw = record[question.key];
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : defaults[question.key] ?? question.min;
    counts[question.key] = clamp(Math.round(value), question.min, question.max);
  }

  return counts;
}

export function deriveCustomerPropertyType(project: Project): CustomerPropertyType {
  const nameSource = `${project.meta.name} ${project.meta.client} ${project.rooms.map(room => room.name).join(" ")}`.toLowerCase();
  if (/restaurante|loja|salao|comercial|estoque|recepcao|atendimento|bar|caf[eé]/i.test(nameSource)) return "commercial";
  if (/apartamento|apto|predio|edificio|condominio/i.test(nameSource)) return "residential-building";
  return "residential-house";
}

export function estimateRoomCountsFromProject(project: Project, propertyType: CustomerPropertyType): Partial<Record<CustomerRoomKey, number>> {
  const defaults = getDefaultRoomCounts(propertyType);
  const counts = { ...defaults };

  for (const room of project.rooms) {
    const key = roomToCustomerKey(room, propertyType);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return normalizeRoomCounts(propertyType, counts);
}

function roomToCustomerKey(room: Room, propertyType: CustomerPropertyType): CustomerRoomKey | undefined {
  const name = room.name.toLowerCase();
  if (/banheiro|lavabo|wc/i.test(name)) return "bathrooms";
  if (/cozinha|copa|gourmet/i.test(name)) return "kitchens";
  if (/quarto|suite|dorm/i.test(name)) return /suite/i.test(name) ? "suites" : "bedrooms";
  if (/sala|estar|jantar|tv/i.test(name)) return "livingRooms";
  if (/lavanderia|servico/i.test(name)) return "serviceAreas";
  if (/varanda|sacada|deck|jardim/i.test(name)) return "balconies";
  if (/escritorio|estudo|home/i.test(name)) return "office";
  if (/estoque|deposito/i.test(name)) return "stock";
  if (propertyType === "commercial" && /atendimento|recepcao|salao|loja|bar/i.test(name)) return "customerArea";
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
