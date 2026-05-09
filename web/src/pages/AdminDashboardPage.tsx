import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { getLeadsFromStorage, getLeadsMetrics, updateLeadStatus } from "../lib/leadStorage";
import { generateWhatsAppLink, GOOGLE_REVIEW_URL, LEAD_CAPTURE, MAPS_LINK, SERVICES } from "../lib/config";
import { type Lead, type LeadStatus } from "../types";

interface AdminDashboardPageProps {
  onNavigateHome: () => void;
  onNavigateToApp: () => void;
  onNavigateToCustomer: () => void;
}

const STATUS_META: Record<LeadStatus, { label: string; tone: string }> = {
  new: { label: "Novo", tone: "blue" },
  "in-progress": { label: "Em atendimento", tone: "amber" },
  "quote-sent": { label: "Orcamento enviado", tone: "violet" },
  "closed-won": { label: "Fechado", tone: "green" },
  "closed-lost": { label: "Perdido", tone: "gray" }
};

const URGENCY_LABELS: Record<NonNullable<Lead["urgency"]>, string> = {
  today: "Hoje",
  week: "Esta semana",
  flexible: "Flexivel"
};

export function AdminDashboardPage({ onNavigateHome, onNavigateToApp, onNavigateToCustomer }: AdminDashboardPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("admin_auth") === "true" || localStorage.getItem("dashboard_auth") === "true");
  const [pinInput, setPinInput] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);

  const refreshLeads = () => setLeads(getLeadsFromStorage());

  useEffect(() => {
    refreshLeads();
  }, []);

  const metrics = useMemo(() => getLeadsMetrics(leads), [leads]);
  const orderedLeads = useMemo(() => {
    return [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads]);

  const openPipelineCount = metrics.statusCounts.new + metrics.statusCounts["in-progress"] + metrics.statusCounts["quote-sent"];
  const wonRevenue = metrics.statusCounts["closed-won"] * LEAD_CAPTURE.default_value_per_lead;
  const goalProgress = Math.min((metrics.totalToday / LEAD_CAPTURE.daily_goal) * 100, 100);
  const serviceDemand = getServiceDemand(leads);

  const handlePinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pinInput.trim() !== "1234") {
      window.alert("PIN incorreto. Use 1234 neste painel local.");
      return;
    }

    localStorage.setItem("admin_auth", "true");
    localStorage.setItem("dashboard_auth", "true");
    setIsAuthenticated(true);
    setPinInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("dashboard_auth");
    setIsAuthenticated(false);
  };

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    updateLeadStatus(leadId, status);
    refreshLeads();
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card" aria-label="Acesso administrativo">
          <BrandLogo compact priority="high" />
          <span>Area interna</span>
          <h1>Painel do administrador</h1>
          <p>Entre com o PIN local para ver leads, fila de atendimento e atalhos do negocio.</p>

          <form onSubmit={handlePinSubmit} className="admin-login-form">
            <label>
              PIN de acesso
              <input
                type="password"
                value={pinInput}
                onChange={event => setPinInput(event.target.value)}
                placeholder="1234"
                autoComplete="current-password"
              />
            </label>
            <button className="primary-action wide" type="submit">
              Entrar no painel
            </button>
          </form>

          <button className="admin-text-button" type="button" onClick={onNavigateHome}>
            <Home size={16} />
            Voltar para home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-dashboard-header">
        <div className="admin-header-copy">
          <BrandLogo compact priority="high" />
          <div>
            <span className="admin-eyebrow">Area interna</span>
            <h1>Painel administrativo</h1>
            <p>Leads locais, funil de atendimento e atalhos para operar o site sem procurar link escondido.</p>
          </div>
        </div>

        <nav className="admin-nav-actions" aria-label="Navegacao administrativa">
          <button type="button" onClick={onNavigateHome}>
            <Home size={16} />
            Home
          </button>
          <button type="button" onClick={onNavigateToApp}>
            <LayoutDashboard size={16} />
            Planejador
          </button>
          <button type="button" onClick={onNavigateToCustomer}>
            <Wrench size={16} />
            Cliente
          </button>
          <button type="button" onClick={refreshLeads}>
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sair
          </button>
        </nav>
      </header>

      <section className="admin-kpi-grid" aria-label="Indicadores principais">
        <AdminKpiCard icon={<Users size={22} />} label="Leads hoje" value={metrics.totalToday} detail={`Meta diaria: ${LEAD_CAPTURE.daily_goal}`} progress={goalProgress} />
        <AdminKpiCard icon={<ClipboardList size={22} />} label="Funil aberto" value={openPipelineCount} detail="Novos, em atendimento e orcados" />
        <AdminKpiCard icon={<TrendingUp size={22} />} label="Receita fechada" value={`R$ ${wonRevenue}`} detail={`Base: R$ ${LEAD_CAPTURE.default_value_per_lead}/lead`} />
        <AdminKpiCard icon={<CheckCircle2 size={22} />} label="Conversao" value={`${metrics.conversionRate.toFixed(0)}%`} detail={`${metrics.statusCounts["closed-won"]} fechado(s) de ${metrics.totalLeads}`} />
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-pipeline-panel">
          <div className="admin-panel-header">
            <div>
              <span>Funil</span>
              <h2>Status dos leads</h2>
            </div>
            <BarChart3 size={22} />
          </div>

          <div className="admin-status-list">
            {(Object.keys(STATUS_META) as LeadStatus[]).map(status => (
              <div className={`admin-status-row tone-${STATUS_META[status].tone}`} key={status}>
                <span>{STATUS_META[status].label}</span>
                <strong>{metrics.statusCounts[status]}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span>Proximas acoes</span>
              <h2>Fila de atendimento</h2>
            </div>
            <CalendarCheck size={22} />
          </div>

          <div className="admin-action-list">
            <AdminActionItem icon={<MessageCircle size={18} />} title="Responder novos contatos" count={metrics.statusCounts.new} detail="Prioridade para leads que ainda nao receberam retorno." />
            <AdminActionItem icon={<PhoneCall size={18} />} title="Acompanhar atendimentos" count={metrics.statusCounts["in-progress"]} detail="Confirmar fotos, bairro, urgencia e proximo horario." />
            <AdminActionItem icon={<ClipboardList size={18} />} title="Cobrar retorno de orcamentos" count={metrics.statusCounts["quote-sent"]} detail="Orcamentos enviados que ainda nao fecharam." />
            <AdminActionItem icon={<ShieldCheck size={18} />} title="Pedir avaliacao apos servico" count={metrics.statusCounts["closed-won"]} detail="Cliente satisfeito pode reforcar prova social." />
          </div>
        </article>

        <article className="admin-panel admin-service-panel">
          <div className="admin-panel-header">
            <div>
              <span>Demanda</span>
              <h2>Servicos mais pedidos</h2>
            </div>
            <Wrench size={22} />
          </div>

          {serviceDemand.length === 0 ? (
            <div className="admin-empty-compact">Os servicos aparecem aqui quando os formularios gerarem leads.</div>
          ) : (
            <div className="admin-service-list">
              {serviceDemand.map(item => (
                <div className="admin-service-row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.count} lead(s)</span>
                  </div>
                  <div className="admin-service-bar" aria-hidden="true">
                    <span style={{ width: `${Math.max(10, (item.count / Math.max(metrics.totalLeads, 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel admin-links-panel">
          <div className="admin-panel-header">
            <div>
              <span>Atalhos</span>
              <h2>Operacao rapida</h2>
            </div>
            <ExternalLink size={22} />
          </div>

          <div className="admin-link-grid">
            <a href={generateWhatsAppLink("Ola, preciso revisar meus leads e atendimentos do site.")} target="_blank" rel="noreferrer">
              <MessageCircle size={17} />
              WhatsApp
            </a>
            <a href={MAPS_LINK} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              Localizacao
            </a>
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer">
              <CheckCircle2 size={17} />
              Avaliacoes
            </a>
            <button type="button" onClick={onNavigateHome}>
              <Home size={17} />
              Pagina publica
            </button>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-leads-panel">
        <div className="admin-panel-header">
          <div>
            <span>CRM local</span>
            <h2>Leads recentes</h2>
          </div>
          <strong>{orderedLeads.length} total</strong>
        </div>

        {orderedLeads.length === 0 ? (
          <div className="admin-empty-state">
            <h3>Nenhum lead salvo ainda</h3>
            <p>Quando alguem preencher o formulario de orcamento, o contato fica salvo neste navegador e aparece aqui.</p>
            <button className="primary-action" type="button" onClick={onNavigateHome}>
              Ver pagina publica
            </button>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-leads-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Servico</th>
                  <th>Urgencia</th>
                  <th>Status</th>
                  <th>Entrada</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {orderedLeads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.name}</strong>
                      <span>{lead.phone}</span>
                      {lead.neighborhood && <small>{lead.neighborhood}</small>}
                    </td>
                    <td>{getServiceName(lead.service)}</td>
                    <td>{lead.urgency ? URGENCY_LABELS[lead.urgency] : "Nao informado"}</td>
                    <td>
                      <select value={lead.status} onChange={event => handleStatusChange(lead.id, event.target.value as LeadStatus)} aria-label={`Status de ${lead.name}`}>
                        {(Object.keys(STATUS_META) as LeadStatus[]).map(status => (
                          <option key={status} value={status}>
                            {STATUS_META[status].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDateTime(lead.createdAt)}</td>
                    <td>
                      <a className="admin-whatsapp-link" href={generateLeadWhatsAppLink(lead)} target="_blank" rel="noreferrer">
                        <MessageCircle size={15} />
                        Chamar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function AdminKpiCard({
  icon,
  label,
  value,
  detail,
  progress
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  detail: string;
  progress?: number;
}) {
  return (
    <article className="admin-kpi-card">
      <div className="admin-kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
      {progress !== undefined && (
        <div className="admin-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
    </article>
  );
}

function AdminActionItem({ icon, title, count, detail }: { icon: ReactNode; title: string; count: number; detail: string }) {
  return (
    <div className="admin-action-item">
      <div className="admin-action-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <em>{count}</em>
    </div>
  );
}

function getServiceDemand(leads: Lead[]) {
  const counts = new Map<string, number>();

  leads.forEach(lead => {
    const label = getServiceName(lead.service);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getServiceName(serviceId?: string) {
  if (!serviceId) return "Nao informado";
  return SERVICES.find(service => service.id === serviceId)?.name ?? serviceId;
}

function generateLeadWhatsAppLink(lead: Lead) {
  const message = [
    `Ola, ${lead.name}. Aqui e a Martinho Construtor.`,
    lead.service ? `Vi seu pedido sobre ${getServiceName(lead.service)}.` : "Vi seu pedido pelo site.",
    "Pode me enviar fotos ou videos do local para eu entender melhor?"
  ].join(" ");

  const leadPhone = lead.phone.replace(/\D/g, "");
  if (!leadPhone) return generateWhatsAppLink(message);

  return `https://wa.me/${leadPhone}?text=${encodeURIComponent(message)}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default AdminDashboardPage;
