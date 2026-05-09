import type { CustomerPackage, CustomerPropertyType, CustomerVisualStyle } from "../types";
import { publicAsset } from "./assets";

export interface CustomerStyleOption {
  value: CustomerVisualStyle;
  label: string;
  description: string;
}

export interface CustomerPackageOption {
  value: CustomerPackage;
  label: string;
  description: string;
}

export interface CustomerPreviewImage {
  id: string;
  src: string;
  title: string;
  caption: string;
}

export const CUSTOMER_STYLE_OPTIONS: CustomerStyleOption[] = [
  { value: "modern", label: "Moderno", description: "Linhas limpas, cristal e luz natural." },
  { value: "natural", label: "Natural", description: "Madeira, plantas e tons suaves." },
  { value: "urban", label: "Urbano", description: "Contraste, concreto e ritmo de cidade." },
  { value: "cozy", label: "Aconchegante", description: "Luz quente e clima familiar." },
  { value: "premium", label: "Premium", description: "Acabamento alto e visual marcante." }
];

export const CUSTOMER_PACKAGE_OPTIONS: CustomerPackageOption[] = [
  { value: "essential", label: "Basico bem feito", description: "Somente eletrica, limpa, segura e pronta para uso." },
  { value: "comfort", label: "Pronta pro futuro", description: "Eletrica, dados e espera de ar condicionado." },
  { value: "signature", label: "Casa do futuro", description: "Automacao parcial ou completa, conforto e tecnologia." }
];

const IMAGE_ROOT = "customer-configurator/optimized";

const IMAGE_CATALOG: Record<CustomerPropertyType, Record<CustomerPackage, CustomerPreviewImage>> = {
  commercial: {
    essential: image("commercial-essential", "Comercial basico bem feito", "Fachada limpa, acolhedora e pronta para receber clientes."),
    comfort: image("commercial-comfort", "Comercial pronto pro futuro", "Espaco preparado para crescer com conectividade e conforto."),
    signature: image("commercial-signature", "Comercial casa do futuro", "Atendimento premium com tecnologia integrada e luz inteligente.")
  },
  "residential-house": {
    essential: image("house-essential", "Casa basico bem feito", "Uma casa bonita, segura e bem entregue desde o primeiro dia."),
    comfort: image("house-comfort", "Casa pronta pro futuro", "Infraestrutura pensada para novos usos, dados e conforto de ar."),
    signature: image("house-signature", "Casa do futuro", "Automacao, cenas de luz e conforto integrados ao projeto.")
  },
  "residential-building": {
    essential: image("building-essential", "Predio basico bem feito", "Entrada clara, varandas bonitas e sensacao de obra bem resolvida."),
    comfort: image("building-comfort", "Predio pronto pro futuro", "Areas preparadas para conectividade, conforto e novas rotinas."),
    signature: image("building-signature", "Predio casa do futuro", "Tecnologia elegante, acesso inteligente e iluminacao premium.")
  }
};

export function getCustomerPreviewImage(
  propertyType: CustomerPropertyType,
  _visualStyle: CustomerVisualStyle,
  selectedPackage: CustomerPackage
): CustomerPreviewImage {
  return IMAGE_CATALOG[propertyType]?.[selectedPackage] ?? IMAGE_CATALOG["residential-house"].essential;
}

export function getCustomerPreviewImageId(
  propertyType: CustomerPropertyType,
  visualStyle: CustomerVisualStyle,
  selectedPackage: CustomerPackage
): string {
  return getCustomerPreviewImage(propertyType, visualStyle, selectedPackage).id;
}

function image(id: string, title: string, caption: string): CustomerPreviewImage {
  return {
    id,
    src: publicAsset(`${IMAGE_ROOT}/${id}.webp`),
    title,
    caption
  };
}
