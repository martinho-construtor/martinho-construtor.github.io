import { QuoteForm } from "../components/QuoteForm";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";
import { HeroSection } from "../components/HeroSection";
import { ServicesGrid } from "../components/ServicesGrid";
import { publicAsset } from "../lib/assets";
import { MAPS_LINK } from "../lib/config";

interface PromoPageProps {
  onNavigateToLanding: () => void;
  onNavigateToApp: () => void;
  onNavigateToCustomer: () => void;
}

export function PromoPage({ onNavigateToLanding, onNavigateToApp, onNavigateToCustomer }: PromoPageProps) {
  const scrollToQuote = () => {
    document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageDirectory = (
    <section className="promo-page-directory" aria-label="Páginas relacionadas do site">
      <div className="promo-page-directory-copy">
        <span>Mapa do site</span>
        <h2>Todas as páginas importantes em um lugar.</h2>
        <p>Use esta area como ponto de partida para orcamento, atendimento e planejamento eletrico.</p>
      </div>

      <div className="promo-page-link-grid">
        <button type="button" className="promo-page-link current" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span>Home pública</span>
          <strong>Serviços elétricos e WhatsApp</strong>
        </button>
        <button type="button" className="promo-page-link" onClick={scrollToQuote}>
          <span>Orçamento</span>
          <strong>Formulário e triagem pelo WhatsApp</strong>
        </button>
        <button type="button" className="promo-page-link" onClick={onNavigateToApp}>
          <span>Simulador elétrica</span>
          <strong>Calcule e planeje sua instalação</strong>
        </button>
        <button type="button" className="promo-page-link" onClick={onNavigateToCustomer}>
          <span>Modo cliente</span>
          <strong>Configurador visual simples</strong>
        </button>
        <button type="button" className="promo-page-link" onClick={onNavigateToLanding}>
          <span>Apresentação</span>
          <strong>Página completa com galeria</strong>
        </button>
      </div>
    </section>
  );

  return (
    <>
      <main className="promo-shell">
        <HeroSection onCalculate={onNavigateToApp} />

        <ServicesGrid onSelectService={service => console.log("service selected", service)} />

        <section className="promo-features">
          <article className="promo-card">
            <strong>Diagnóstico claro antes da visita</strong>
            <p>Conte o problema, envie fotos pelo WhatsApp e receba orientação inicial antes do atendimento técnico.</p>
          </article>
          <article className="promo-card">
            <strong>Segurança em primeiro lugar</strong>
            <p>Atendimento elétrico com foco em disjuntores, cabos, cargas e proteção da instalação.</p>
          </article>
          <article className="promo-card">
            <strong>Orçamento e visita organizados</strong>
            <p>Você entende o próximo passo, combina o melhor horário e acompanha tudo pelo WhatsApp.</p>
          </article>
        </section>

        <section className="promo-proof" aria-label="Confiança e atendimento">
          <div className="promo-proof-copy">
            <span>Atendimento técnico local em Porto Alegre</span>
            <h2>Antes de mexer na instalação, primeiro vem o diagnóstico correto.</h2>
            <p>
              A conversa começa pelo WhatsApp para entender urgência, localização e sinais do problema. Quando a visita for necessária,
              o atendimento já chega com contexto e foco na solução segura.
            </p>
          </div>

          <figure className="promo-proof-media">
            <img
              src={publicAsset("customer-configurator/optimized/house-comfort.webp")}
              alt="Casa iluminada com projeto elétrico planejado"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <figcaption>Infraestrutura pensada para segurança, conforto e manutenção mais organizada.</figcaption>
          </figure>

          <div className="promo-proof-grid">
            <article>
              <strong>Triagem por fotos e vídeos</strong>
              <p>Ajuda a identificar riscos, materiais prováveis e prioridade do atendimento.</p>
            </article>
            <article>
              <strong>Residencial e comercial</strong>
              <p>Tomadas, chuveiros, iluminação, quadros, disjuntores e reformas elétricas.</p>
            </article>
            <article>
              <strong>Visita com objetivo claro</strong>
              <p>Você sabe o que será verificado e evita perder tempo com tentativa e erro.</p>
            </article>
          </div>
        </section>

        <section id="orcamento" className="promo-contact">
          <div className="promo-contact-form">
            <h2>Entre em contato</h2>
            <p>Precisa de orçamento para um serviço elétrico?</p>
            <QuoteForm showService={true} showBairro={true} showUrgency={true} showPhotos={true} />
          </div>
        </section>

        <section className="promo-detail-grid">
          <div className="promo-detail-card promo-detail-card-with-image">
            <img
              src={publicAsset("customer-configurator/optimized/commercial-essential.webp")}
              alt="Espaço comercial com iluminação planejada"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <strong>Problemas urgentes e manutenção</strong>
            <p>Disjuntor desarmando, tomada aquecendo, chuveiro sem funcionar e falhas de iluminação precisam de avaliação segura.</p>
          </div>
          <div className="promo-detail-card promo-detail-card-with-image">
            <img
              src={publicAsset("customer-configurator/optimized/building-signature.webp")}
              alt="Prédio moderno com iluminação e infraestrutura elétrica"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
            <strong>Planejamento para reforma</strong>
            <p>Quando a obra exige novos pontos, quadro ou circuitos, o planejamento elétrico ajuda a evitar retrabalho.</p>
          </div>
        </section>

        <footer className="promo-footer">
          <div>
            <strong>Precisa resolver um problema elétrico?</strong>
            <p>Chame pelo WhatsApp com fotos do local, bairro e urgência para começar pelo caminho certo.</p>
          </div>
          <div className="promo-footer-actions">
            <button className="primary-action" type="button" onClick={scrollToQuote}>
              Solicitar orçamento
            </button>
            <a className="secondary-action" href={MAPS_LINK} target="_blank" rel="noreferrer">
              Ver localização
            </a>
          </div>
        </footer>

        {pageDirectory}
      </main>

      <FloatingWhatsAppButton />
    </>
  );
}
