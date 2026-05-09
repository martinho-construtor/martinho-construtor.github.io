import { SERVICES } from "../lib/config";
import { ServiceCard } from "./ServiceCard";

interface ServicesGridProps {
  onSelectService?: (serviceId: string) => void;
}

export function ServicesGrid({ onSelectService }: ServicesGridProps) {
  return (
    <section className="services-grid">
      <h2>Serviços</h2>
      <p>Atendemos serviços elétricos residenciais e comerciais em Porto Alegre, desde pequenos reparos até melhorias completas na instalação.</p>
      <div className="services-list">
        {SERVICES.map(service => (
          <ServiceCard
            key={service.id}
            name={service.name}
            description={service.description}
            iconId={service.id}
            onClick={() => onSelectService?.(service.name)}
          />
        ))}
      </div>
    </section>
  );
}

export default ServicesGrid;
