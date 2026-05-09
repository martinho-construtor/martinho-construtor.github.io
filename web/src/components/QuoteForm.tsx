import { type FormEvent, useState } from "react";
import { SERVICES, URGENCY_LEVELS, formatLeadForWhatsApp, generateWhatsAppLink } from "../lib/config";
import { saveLeadToStorage } from "../lib/leadStorage";
import { type Lead } from "../types";

interface QuoteFormProps {
  onSubmit?: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  className?: string;
  showService?: boolean;
  showBairro?: boolean;
  showUrgency?: boolean;
  showPhotos?: boolean;
  minimal?: boolean;
}

export function QuoteForm({
  onSubmit,
  className = "",
  showService = true,
  showBairro = true,
  showUrgency = true,
  showPhotos = true,
  minimal = false
}: QuoteFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [service, setService] = useState(SERVICES[0]?.id || "");
  const [urgency, setUrgency] = useState<"today" | "week" | "flexible">("week");
  const [description, setDescription] = useState("");
  const [hasPhotos, setHasPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Preencha nome e telefone corretamente.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const leadData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        service: service || undefined,
        urgency,
        description: description.trim() || undefined,
        hasPhotos,
        source: "website" as const
      };

      // Save lead to storage
      const savedLead = saveLeadToStorage(leadData);

      // Format message for WhatsApp
      const whatsappMessage = formatLeadForWhatsApp(leadData);
      const whatsappUrl = generateWhatsAppLink(whatsappMessage);

      // Call parent handler if provided
      if (onSubmit) {
        onSubmit(leadData);
      }

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      setSubmitStatus("success");
      setSubmitMessage("Abrindo WhatsApp com seus dados...");

      // Reset form
      setTimeout(() => {
        setName("");
        setPhone("");
        setEmail("");
        setNeighborhood("");
        setService(SERVICES[0]?.id || "");
        setUrgency("week");
        setDescription("");
        setHasPhotos(false);
        setSubmitStatus("idle");
        setSubmitMessage("");
      }, 2000);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Erro ao enviar. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={`quote-form ${className}`}
      onSubmit={handleSubmit}
      data-agent-connect="quote-form"
      data-agent-channel="whatsapp"
      data-agent-required-fields="name,phone"
      data-agent-optional-fields="email,neighborhood,service,urgency,description,hasPhotos"
    >
      {!minimal && (
        <div className="form-header">
          <h3>Solicite um orçamento rápido</h3>
          <p>Informe seus dados e envie a solicitação direto para o WhatsApp.</p>
        </div>
      )}

      <div className="form-grid">
        <label>
          Nome
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
            disabled={isSubmitting}
          />
        </label>

        <label>
          Telefone (WhatsApp)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="55 51 9xxxx-xxxx"
            required
            disabled={isSubmitting}
          />
        </label>

        {!minimal && (
          <label>
            Email (opcional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isSubmitting}
            />
          </label>
        )}

        {showBairro && (
          <label>
            Bairro
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Qual bairro?"
              disabled={isSubmitting}
            />
          </label>
        )}

        {showService && (
          <label>
            Tipo de serviço
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              disabled={isSubmitting}
            >
              {SERVICES.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {showUrgency && (
          <label>
            Urgência
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as "today" | "week" | "flexible")}
              disabled={isSubmitting}
            >
              {URGENCY_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="form-full-width">
        Descrição do problema (opcional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o problema ou sua demanda..."
          rows={3}
          disabled={isSubmitting}
        />
      </label>

      {showPhotos && (
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={hasPhotos}
            onChange={(e) => setHasPhotos(e.target.checked)}
            disabled={isSubmitting}
          />
          <span>Tenho fotos ou vídeos do problema</span>
        </label>
      )}

      <button
        type="submit"
        className="primary-action wide"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar para WhatsApp"}
      </button>

      {submitMessage && (
        <div className={`form-message ${submitStatus}`}>
          {submitMessage}
        </div>
      )}
    </form>
  );
}
