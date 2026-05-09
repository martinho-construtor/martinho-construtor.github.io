/**
 * CONFIG: Martinho Construtor - Lead Generation Configuration
 * 
 * All company details and WhatsApp integration settings are defined here.
 * Update these values to customize for your business.
 */

// CONFIG: Replace with your actual WhatsApp phone number (Brazil format with country code)
export const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '5551997290222';

// CONFIG: Company branding
export const COMPANY = {
  name: 'Martinho Construtor',
  city: 'Porto Alegre',
  state: 'RS',
  description: 'Serviços elétricos, manutenção e quadros elétricos em Porto Alegre'
};

// CONFIG: SEO and page titles
export const SEO = {
  title: 'Martinho Construtor | Eletricista e manutenção elétrica em Porto Alegre',
  description: 'Eletricista em Porto Alegre com diagnóstico seguro e orçamento rápido. Atendimento para quadros elétricos, disjuntores, tomadas, chuveiros, iluminação e diagnóstico de falhas. Solicite atendimento pelo WhatsApp.',
  keywords: ['eletricista Porto Alegre', 'manutenção elétrica', 'quadro elétrico', 'disjuntor', 'tomada esquentando', 'instalação chuveiro']
};

// CONFIG: Hero section copy
export const HERO = {
  headline: 'Eletricista em Porto Alegre com diagnóstico seguro e orçamento rápido',
  subheading: 'Atendimento para quadros elétricos, disjuntores, tomadas, chuveiros, iluminação, passagem de cabos e diagnóstico de falhas. Serviço feito com segurança, organização e acabamento limpo.',
  cta_primary: 'Enviar fotos pelo WhatsApp',
  cta_secondary: 'Planejar instalação elétrica'
};

// CONFIG: Services offered (8 main services for lead capture)
export const SERVICES = [
  {
    id: 'disjuntor',
    name: 'Disjuntor desarmando',
    description: 'Diagnóstico e reparo de disjuntores que desarmam frequentemente'
  },
  {
    id: 'tomada',
    name: 'Tomada aquecendo',
    description: 'Identificação de problemas em tomadas superaquecidas'
  },
  {
    id: 'chuveiro',
    name: 'Instalação de chuveiro',
    description: 'Instalação segura de chuveiros elétricos com circuito dedicado'
  },
  {
    id: 'quadro',
    name: 'Organização de quadro elétrico',
    description: 'Organização, balanceamento e manutenção de quadros'
  },
  {
    id: 'iluminacao',
    name: 'Instalação de tomadas e iluminação',
    description: 'Novas tomadas, interruptores e pontos de luz'
  },
  {
    id: 'ar',
    name: 'Ponto para ar-condicionado',
    description: 'Ponto específico para ar-condicionado com especificações técnicas'
  },
  {
    id: 'reforma',
    name: 'Reforma elétrica residencial',
    description: 'Reforma completa de instalações elétricas residenciais'
  },
  {
    id: 'comercio',
    name: 'Elétrica para comércio/restaurante',
    description: 'Soluções especializadas para estabelecimentos comerciais'
  }
];

// CONFIG: Urgency levels for quick quote form
export const URGENCY_LEVELS = [
  { id: 'today', label: 'Hoje', priority: 3 },
  { id: 'week', label: 'Esta semana', priority: 2 },
  { id: 'flexible', label: 'Sem urgência', priority: 1 }
];

// CONFIG: Lead capture settings
export const LEAD_CAPTURE = {
  default_value_per_lead: 300, // R$ estimate per lead for revenue calculation
  daily_goal: 2 // leads per day
};

// CONFIG: Google Review URL
export const GOOGLE_REVIEW_URL = 'https://g.page/r/Cebzq-NGwG-qEBE/review';

// CONFIG: Maps location
export const MAPS_LINK = 'https://maps.app.goo.gl/oyo6G7WvDFep8F6SA';

// CONFIG: Trust section keywords
export const TRUST_KEYWORDS = [
  {
    icon: '🔧',
    label: 'NR-10 Certificado',
    description: 'Segurança em instalações e serviços com eletricidade'
  },
  {
    icon: '📋',
    label: 'NBR 5410',
    description: 'Instalações elétricas de baixa tensão'
  },
  {
    icon: '⚡',
    label: 'CREA-SP',
    description: 'Registro profissional ativo'
  },
  {
    icon: '🏆',
    label: '15+ Anos',
    description: 'Experiência no mercado'
  }
];

// CONFIG: WhatsApp message templates
export const WHATSAPP_MESSAGES = {
  initial_greeting: 'Olá, vi o site da Martinho Construtor e preciso de um orçamento. Meu problema é:',
  quote_form_header: 'Orçamento para Martinho Construtor',
  calculator_intro: 'Envie este cálculo para orçamento no WhatsApp'
};

// Helper function to generate WhatsApp link
export function generateWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
}

// Helper function to format lead for WhatsApp message
export function formatLeadForWhatsApp(lead: {
  name: string;
  phone?: string;
  neighborhood?: string;
  service?: string;
  urgency?: string;
  description?: string;
  hasPhotos?: boolean;
}): string {
  const lines = [
    `*${WHATSAPP_MESSAGES.quote_form_header}*`,
    '',
    `*Nome:* ${lead.name}`,
  ];

  if (lead.phone) lines.push(`*Telefone:* ${lead.phone}`);
  if (lead.neighborhood) lines.push(`*Bairro:* ${lead.neighborhood}`);
  if (lead.service) lines.push(`*Serviço:* ${lead.service}`);
  if (lead.urgency) lines.push(`*Urgência:* ${lead.urgency}`);
  if (lead.description) lines.push(`*Descrição:* ${lead.description}`);
  if (lead.hasPhotos) lines.push(`*Fotos/Vídeos:* Sim`);

  return lines.join('\n');
}
