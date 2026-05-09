import type { CustomerLayout, CustomerPackage, CustomerPropertyType, CustomerVisualStyle, Project } from "../types";
import { getCustomerPreviewImageId } from "./customerImages";
import { deriveCustomerPropertyType, estimateRoomCountsFromProject, normalizeRoomCounts } from "./customerRooms";

const DEFAULT_STYLE: CustomerVisualStyle = "modern";
const DEFAULT_PACKAGE: CustomerPackage = "essential";

export function createDefaultCustomerLayout(project: Project): CustomerLayout {
  const propertyType = deriveCustomerPropertyType(project);
  const roomCounts = estimateRoomCountsFromProject(project, propertyType);

  return {
    modeVersion: 2,
    propertyType,
    roomCounts,
    visualStyle: DEFAULT_STYLE,
    selectedPackage: DEFAULT_PACKAGE,
    previewImageId: getCustomerPreviewImageId(propertyType, DEFAULT_STYLE, DEFAULT_PACKAGE),
    notes: "Escolhas iniciais para conversar com o cliente.",
    updatedAt: new Date().toISOString()
  };
}

export function normalizeCustomerLayout(project: Project): Project {
  const current = project.customerLayout as unknown;

  if (!isRecord(current)) {
    return { ...project, customerLayout: createDefaultCustomerLayout(project) };
  }

  const defaultLayout = createDefaultCustomerLayout(project);
  const propertyType = normalizePropertyType(current.propertyType, defaultLayout.propertyType);
  const visualStyle = normalizeVisualStyle(current.visualStyle, styleFromLegacy(current.style) ?? defaultLayout.visualStyle);
  const selectedPackage = normalizePackage(current.selectedPackage, defaultLayout.selectedPackage);
  const roomCounts = normalizeRoomCounts(propertyType, current.roomCounts);

  return {
    ...project,
    customerLayout: {
      modeVersion: 2,
      propertyType,
      roomCounts,
      visualStyle,
      selectedPackage,
      previewImageId: getCustomerPreviewImageId(propertyType, visualStyle, selectedPackage),
      notes: typeof current.notes === "string" ? current.notes : defaultLayout.notes,
      updatedAt: typeof current.updatedAt === "string" ? current.updatedAt : new Date().toISOString()
    }
  };
}

export function resetCustomerLayout(project: Project): Project {
  return { ...project, customerLayout: createDefaultCustomerLayout(project) };
}

export function withCustomerPreview(layout: CustomerLayout): CustomerLayout {
  return {
    ...layout,
    previewImageId: getCustomerPreviewImageId(layout.propertyType, layout.visualStyle, layout.selectedPackage),
    updatedAt: new Date().toISOString()
  };
}

function normalizePropertyType(value: unknown, fallback: CustomerPropertyType): CustomerPropertyType {
  return value === "commercial" || value === "residential-house" || value === "residential-building" ? value : fallback;
}

function normalizeVisualStyle(value: unknown, fallback: CustomerVisualStyle): CustomerVisualStyle {
  return value === "modern" || value === "natural" || value === "urban" || value === "cozy" || value === "premium" ? value : fallback;
}

function normalizePackage(value: unknown, fallback: CustomerPackage): CustomerPackage {
  return value === "essential" || value === "comfort" || value === "signature" ? value : fallback;
}

function styleFromLegacy(value: unknown): CustomerVisualStyle | undefined {
  if (!isRecord(value)) return undefined;
  if (value.palette === "natural") return "natural";
  if (value.palette === "warm") return "cozy";
  if (value.palette === "clean") return "modern";
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
