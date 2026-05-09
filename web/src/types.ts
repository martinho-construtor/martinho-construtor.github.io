export type Phase = "A" | "B" | "C" | "AB" | "BC" | "CA" | "ABC";

export type RoomCategory = "dry" | "wet" | "kitchen" | "service" | "public";

export type PointType =
  | "lighting"
  | "switch"
  | "outlet"
  | "dedicated"
  | "ac"
  | "oven"
  | "exhaust"
  | "board";

export interface ProjectMeta {
  name: string;
  client: string;
  city: string;
  voltageSystem: string;
  responsible: string;
  notes: string;
  scaleMPerUnit: number;
  scaleVerified: boolean;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: RoomCategory;
}

export interface ElectricalPoint {
  id: string;
  roomId: string;
  x: number;
  y: number;
  type: PointType;
  label: string;
  loadW: number;
  quantity: number;
  circuitId: string;
}

export interface Circuit {
  id: string;
  name: string;
  kind: "lighting" | "outlets" | "dedicated" | "hvac" | "motor" | "board";
  phase: Phase;
  voltage: 127 | 220 | 380;
  lengthM: number;
  cableMm2: number;
  breakerA: number;
  drProtected: boolean;
  hasPE: boolean;
}

export type CustomerPropertyType = "commercial" | "residential-house" | "residential-building";

export type CustomerRoomKey =
  | "bedrooms"
  | "suites"
  | "livingRooms"
  | "bathrooms"
  | "kitchens"
  | "serviceAreas"
  | "balconies"
  | "office"
  | "stock"
  | "customerArea";

export type CustomerVisualStyle = "modern" | "natural" | "urban" | "cozy" | "premium";

export type CustomerPackage = "essential" | "comfort" | "signature";

export interface CustomerLayout {
  modeVersion: 2;
  propertyType: CustomerPropertyType;
  roomCounts: Partial<Record<CustomerRoomKey, number>>;
  visualStyle: CustomerVisualStyle;
  selectedPackage: CustomerPackage;
  previewImageId: string;
  notes: string;
  updatedAt: string;
}

export interface Project {
  meta: ProjectMeta;
  rooms: Room[];
  points: ElectricalPoint[];
  circuits: Circuit[];
  customerLayout?: CustomerLayout;
}

export interface CircuitCalculation {
  circuit: Circuit;
  points: ElectricalPoint[];
  totalW: number;
  currentA: number;
  voltageDropPercent: number;
  cableAmpacityA: number;
  suggestedCableMm2: number;
  suggestedBreakerA: number;
  breakerCableMismatch: boolean;
  overloaded: boolean;
  highVoltageDrop: boolean;
  missingPE: boolean;
  missingDR: boolean;
}

export interface ProjectWarning {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  circuitId?: string;
  pointId?: string;
  roomId?: string;
}

export interface MaterialItem {
  group: string;
  item: string;
  quantity: number;
  unit: string;
}

export interface BoardRow {
  position: number;
  circuitName: string;
  phase: Phase;
  breakerA: number;
  cableMm2: number;
  drProtected: boolean;
  totalW: number;
  currentA: number;
}

export interface ProjectAnalysis {
  circuits: CircuitCalculation[];
  warnings: ProjectWarning[];
  materials: MaterialItem[];
  boardRows: BoardRow[];
  phaseLoadsW: Record<"A" | "B" | "C", number>;
  totalLoadW: number;
  demandLoadW: number;
}

// Lead Capture & CRM Types
export type LeadStatus = "new" | "in-progress" | "quote-sent" | "closed-won" | "closed-lost";
export type LeadSource = "website" | "calculator" | "whatsapp" | "referral";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  neighborhood?: string;
  service?: string;
  urgency?: "today" | "week" | "flexible";
  description?: string;
  hasPhotos?: boolean;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface LeadMetrics {
  totalLeads: number;
  leadsToday: number;
  dailyGoal: number;
  estimatedRevenue: number;
  statusCounts: Record<LeadStatus, number>;
}
