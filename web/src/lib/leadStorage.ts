import { type Lead, type LeadStatus } from "../types";

const LEADS_STORAGE_KEY = "martinho_leads";

const emptyStatusCounts = (): Record<LeadStatus, number> => ({
  new: 0,
  "in-progress": 0,
  "quote-sent": 0,
  "closed-won": 0,
  "closed-lost": 0
});

export function getLeadsFromStorage(): Lead[] {
  try {
    const data = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeStoredLead).filter(Boolean) as Lead[];
  } catch (error) {
    console.error("Failed to read leads from storage:", error);
    return [];
  }
}

export function saveLeadToStorage(lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "status"> & { status?: LeadStatus }): Lead {
  try {
    const leads = getLeadsFromStorage();
    const now = new Date().toISOString();
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      ...lead,
      createdAt: now,
      updatedAt: now,
      status: lead.status ?? "new"
    };

    leads.push(newLead);
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    return newLead;
  } catch (error) {
    console.error("Failed to save lead:", error);
    throw error;
  }
}

export function updateLeadStatus(id: string, status: LeadStatus): boolean {
  try {
    const leads = getLeadsFromStorage();
    const leadIndex = leads.findIndex(lead => lead.id === id);
    if (leadIndex === -1) return false;

    leads[leadIndex] = {
      ...leads[leadIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    return true;
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return false;
  }
}

export function getLeadsMetrics(leads: Lead[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leadsToday = leads.filter(lead => new Date(lead.createdAt) >= today);
  const statusCounts = emptyStatusCounts();

  leads.forEach(lead => {
    statusCounts[lead.status] += 1;
  });

  return {
    totalLeads: leads.length,
    totalToday: leadsToday.length,
    statusCounts,
    estimatedRevenue: statusCounts["closed-won"] * 300,
    conversionRate: leads.length > 0 ? (statusCounts["closed-won"] / leads.length) * 100 : 0
  };
}

function normalizeStoredLead(rawLead: unknown): Lead | null {
  if (!rawLead || typeof rawLead !== "object") return null;

  const lead = rawLead as Partial<Lead> & { status?: string };
  if (!lead.name || !lead.phone || !lead.createdAt) return null;

  return {
    id: lead.id ?? `lead-${lead.createdAt}`,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    neighborhood: lead.neighborhood,
    service: lead.service,
    urgency: lead.urgency,
    description: lead.description,
    hasPhotos: lead.hasPhotos,
    source: lead.source ?? "website",
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt ?? lead.createdAt,
    notes: lead.notes,
    status: normalizeStatus(lead.status)
  };
}

function normalizeStatus(status?: string): LeadStatus {
  if (status === "contacted") return "in-progress";
  if (status === "scheduled") return "quote-sent";
  if (status === "converted") return "closed-won";
  if (status === "in-progress" || status === "quote-sent" || status === "closed-won" || status === "closed-lost") return status;
  return "new";
}

export default { getLeadsFromStorage, saveLeadToStorage, updateLeadStatus, getLeadsMetrics };
