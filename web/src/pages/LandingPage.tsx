import { useState, type FormEvent } from "react";
import { HERO, COMPANY, MAPS_LINK, TRUST_KEYWORDS } from "../lib/config";
import { QuoteForm } from "../components/QuoteForm";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";
import { HeroSection } from "../components/HeroSection";
import { ServicesGrid } from "../components/ServicesGrid";
import { publicAsset } from "../lib/assets";

interface LandingPageProps {
  onNavigateToPromo: () => void;
  onNavigateToApp: () => void;
}

export function LandingPage({ onNavigateToPromo, onNavigateToApp }: LandingPageProps) {
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [signupState, setSignupState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleRegistration = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = visitorName.trim();
    const phone = visitorPhone.trim();

    if (!name || !phone) {
      setSignupState("error");
      setSignupMessage("Preencha nome e WhatsApp corretamente antes de continuar.");
      return;
    }

    setSignupState("sending");
    setSignupMessage("Processando cadastro...");

    try {
      const response = await fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        setSignupState("done");
        setSignupMessage("Cadastro enviado com sucesso! Verifique seu WhatsApp.");
        setVisitorName("");
        setVisitorPhone("");
      } else {
        const text = await response.text();
        setSignupState("error");
        setSignupMessage("Erro ao enviar: " + (text || response.statusText));
      }
    } catch (err) {
      setSignupState("error");
      setSignupMessage("Falha de rede ao enviar cadastro.");
    }
  };

  return (
    <main>
      <HeroSection onCalculate={onNavigateToApp} />

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-eyebrow">{COMPANY.name}</span>
          <h1>{HERO.headline}</h1>
          <p className="hero-subheading">{HERO.subheading}</p>
          <ul className="landing-features">
            <li>Capte atendimentos com um fluxo digital rápido e eficiente</li>
            <li>Acesse o app técnico em um clique para organizar os serviços</li>
            <li>Procedimentos alinhados a NBR 5410 / NR-10</li>
          </ul>

          <form className="landing-actions" onSubmit={handleRegistration}>
            <label>
              Nome
              <input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Seu nome"
              />
            </label>
            <label>
              WhatsApp
              <input
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="55 85 9xxxx-xxxx"
              />
            </label>
            <button className="wide primary-action" type="submit" disabled={signupState === "sending"}>
              {signupState === "sending" ? "Enviando..." : "Acessar webapp"}
            </button>
            <div className="landing-actions-row">
              <a className="landing-link" href={MAPS_LINK} target="_blank" rel="noreferrer">
                Ver no mapa
              </a>
              <button className="landing-link button-link" type="button" onClick={onNavigateToPromo}>
                Voltar para home
              </button>
            </div>
            {signupMessage && (
              <div className={`landing-notice ${signupState === "error" ? "error" : "success"}`}>
                {signupMessage}
              </div>
            )}
          </form>

          <div className="landing-contact-section">
            <h3>Ou solicite orçamento imediato</h3>
            <QuoteForm
              showService={true}
              showBairro={true}
              showUrgency={true}
              showPhotos={true}
              minimal={true}
              className="landing-contact-form"
            />
          </div>
        </div>

        <div className="landing-visual">
          <div className="landing-map-preview">
            <div className="landing-map-label">Localização do negócio</div>
            <div className="landing-map-frame">
              <div className="landing-map-badge">Google Maps</div>
              <div className="landing-map-pin">Seu cliente vê o local e chega mais rápido.</div>
            </div>
            <a className="landing-map-cta" href={MAPS_LINK} target="_blank" rel="noreferrer">
              Abrir no mapa
            </a>
          </div>
          <div className="landing-highlight-grid">
            <div className="landing-card">
              <strong>Recepção inteligente</strong>
              <p>O cliente informa nome e WhatsApp e recebe uma saudação automática para iniciar o atendimento.</p>
            </div>
            <div className="landing-card">
              <strong>Atendimento mais ágil</strong>
              <p>O visitante se sente guiado com uma landing moderna, direta e fácil de usar.</p>
            </div>
            <div className="landing-card">
              <strong>Confirmação de endereço</strong>
              <p>Google Maps integrado para confirmar seu local de atendimento.</p>
            </div>
          </div>
        </div>
      </section>

      <ServicesGrid onSelectService={(s) => console.log("service selected", s)} />

      <section className="landing-credentials">
        <div className="credentials-content">
          <h2>Credenciais Técnicas</h2>
          <div className="credentials-grid">
            {TRUST_KEYWORDS.map((item, idx) => (
              <div key={idx} className="credential-item">
                <div className="credential-icon">{item.icon}</div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-gallery">
        <h2>Experiência e Qualidade Técnica</h2>
        <div className="gallery-grid">
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/house-essential.webp")}
              alt="Instalação elétrica profissional"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Instalações certificadas</strong>
              <p>Trabalhos executados com padrão de qualidade e segurança</p>
            </div>
          </div>
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/house-comfort.webp")}
              alt="Ferramentas elétricas profissionais"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Equipamentos modernos</strong>
              <p>Utilizamos ferramentas de última geração para máxima precisão</p>
            </div>
          </div>
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/house-signature.webp")}
              alt="Projeto elétrico detalhado"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Projetos personalizados</strong>
              <p>Cada instalação é planejada especificamente para suas necessidades</p>
            </div>
          </div>
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/commercial-comfort.webp")}
              alt="Equipe técnica especializada"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Equipe especializada</strong>
              <p>Profissionais qualificados e em constante atualização</p>
            </div>
          </div>
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/building-comfort.webp")}
              alt="Medição e testes elétricos"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Medições precisas</strong>
              <p>Testes e verificações rigorosas em todas as etapas</p>
            </div>
          </div>
          <div className="gallery-item">
            <img
              src={publicAsset("customer-configurator/optimized/building-signature.webp")}
              alt="Soluções energéticas sustentáveis"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <div className="gallery-caption">
              <strong>Energia sustentável</strong>
              <p>Soluções modernas para eficiência energética</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-footer">
        <div>
          <strong>Horário de atendimento</strong>
          <p>Segunda a sexta · 8h às 18h</p>
        </div>
        <div>
          <strong>Localização</strong>
          <p>Abra o mapa para ver o endereço e enviar seu cliente.</p>
        </div>
      </section>

      <FloatingWhatsAppButton />
    </main>
  );
}
