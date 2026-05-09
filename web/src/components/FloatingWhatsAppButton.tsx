import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink, WHATSAPP_MESSAGES, COMPANY } from "../lib/config";
import "../styles/floating-whatsapp-button.css";

interface FloatingWhatsAppButtonProps {
  message?: string;
  className?: string;
}

export function FloatingWhatsAppButton({ 
  message = WHATSAPP_MESSAGES.initial_greeting,
  className = ""
}: FloatingWhatsAppButtonProps) {
  const whatsappUrl = generateWhatsAppLink(message);

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`floating-whatsapp-button ${className}`}
      title={`Enviar fotos pelo WhatsApp para ${COMPANY.name}`}
      aria-label={`Enviar fotos ou vídeos para ${COMPANY.name} via WhatsApp`}
      data-agent-action="contact-whatsapp"
      data-agent-channel="whatsapp"
      data-agent-purpose="quote-request"
    >
      <MessageCircle size={24} />
      <span className="floating-tooltip">Enviar fotos pelo WhatsApp</span>
    </a>
  );
}
