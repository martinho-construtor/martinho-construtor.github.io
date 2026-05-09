import { BrandLogo } from "./BrandLogo";
import { publicAsset } from "../lib/assets";
import { HERO, WHATSAPP_MESSAGES, generateWhatsAppLink } from "../lib/config";
import "../styles/hero-services.css";

interface HeroSectionProps {
  onCalculate?: () => void;
}

export function HeroSection({ onCalculate }: HeroSectionProps) {
  const whatsappUrl = generateWhatsAppLink(WHATSAPP_MESSAGES.initial_greeting);

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <BrandLogo className="hero-brand" priority="high" />
        <h1>{HERO.headline}</h1>
        <p className="hero-subheading">{HERO.subheading}</p>

        <div className="hero-actions">
          <a
            className="primary-action hero-primary-action"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-agent-action="contact-whatsapp"
            data-agent-channel="whatsapp"
            data-agent-purpose="quote-request"
          >
            {HERO.cta_primary}
          </a>
          <button className="secondary-action hero-secondary-action" type="button" onClick={onCalculate}>
            {HERO.cta_secondary}
          </button>
        </div>

        <div className="hero-trust">
          Atendimento técnico com foco em segurança, diagnóstico correto e solução definitiva para sua instalação elétrica.
        </div>
      </div>

      <div className="hero-visual" aria-hidden>
        <div className="hero-visual-card hero-image-card">
          <img
            className="hero-mascot-image"
            src={publicAsset("brand/martinho-construtor-personagem.webp")}
            alt=""
            width={607}
            height={824}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="hero-visual-content">
            <div className="hero-visual-label">TRIAGEM RÁPIDA PELO WHATSAPP</div>
            <strong>Envie fotos ou vídeos do problema e receba uma orientação inicial antes da visita.</strong>
            <p>Ideal para disjuntor desarmando, tomada aquecendo, chuveiro sem funcionar, falhas na iluminação e problemas no quadro elétrico.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
