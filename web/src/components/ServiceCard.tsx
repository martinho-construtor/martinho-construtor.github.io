interface ServiceCardProps {
  iconId?: string;
  name: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function ServiceCard({
  iconId = "disjuntor",
  name,
  description,
  onClick,
  className = ""
}: ServiceCardProps) {
  return (
    <article
      className={`service-card ${className}`}
      data-agent-service-id={iconId}
      data-agent-service-name={name}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? event => event.key === "Enter" && onClick() : undefined}
    >
      <Ps2ServiceIcon iconId={iconId} />
      <h3>{name}</h3>
      <p>{description}</p>
    </article>
  );
}

function Ps2ServiceIcon({ iconId }: { iconId: string }) {
  return (
    <div className={`service-icon ps2-service-icon ps2-${iconId}`} aria-hidden="true">
      <span className="ps2-icon-orbit" />
      <svg viewBox="0 0 64 64" focusable="false">
        <ellipse className="ps2-ground" cx="32" cy="50" rx="19" ry="5" />
        {renderServiceIcon(iconId)}
        <path className="ps2-sheen" d="M17 15 C25 7 42 7 50 16" />
      </svg>
    </div>
  );
}

function renderServiceIcon(iconId: string) {
  switch (iconId) {
    case "tomada":
      return (
        <g>
          <rect className="ps2-body" x="19" y="15" width="26" height="34" rx="8" />
          <circle className="ps2-cutout" cx="27" cy="31" r="3" />
          <circle className="ps2-cutout" cx="37" cy="31" r="3" />
          <path className="ps2-accent" d="M26 42 H38" />
        </g>
      );
    case "chuveiro":
      return (
        <g>
          <path className="ps2-body" d="M20 23 Q32 13 44 23 L42 31 H22 Z" />
          <path className="ps2-line" d="M24 23 H40" />
          <path className="ps2-accent" d="M24 39 L21 45 M32 39 L30 47 M40 39 L43 45" />
          <circle className="ps2-dot" cx="26" cy="34" r="2" />
          <circle className="ps2-dot" cx="32" cy="35" r="2" />
          <circle className="ps2-dot" cx="38" cy="34" r="2" />
        </g>
      );
    case "quadro":
      return (
        <g>
          <rect className="ps2-body" x="17" y="13" width="30" height="38" rx="4" />
          <path className="ps2-line" d="M23 22 H41 M23 31 H41 M23 40 H41" />
          <path className="ps2-accent" d="M26 22 V28 M37 31 V37 M31 40 V46" />
        </g>
      );
    case "iluminacao":
      return (
        <g>
          <path className="ps2-body" d="M22 27 C22 17 42 17 42 27 C42 33 37 36 37 42 H27 C27 36 22 33 22 27 Z" />
          <path className="ps2-accent" d="M27 47 H37 M29 52 H35" />
          <path className="ps2-line" d="M32 15 V9 M20 20 L15 16 M44 20 L49 16" />
        </g>
      );
    case "ar":
      return (
        <g>
          <rect className="ps2-body" x="15" y="18" width="34" height="24" rx="6" />
          <path className="ps2-line" d="M22 27 H42 M22 33 H36" />
          <path className="ps2-accent" d="M24 48 C27 44 30 44 33 48 C36 52 40 52 43 48" />
          <circle className="ps2-dot" cx="43" cy="24" r="2" />
        </g>
      );
    case "reforma":
      return (
        <g>
          <path className="ps2-body" d="M20 17 L46 43 L40 49 L14 23 Z" />
          <path className="ps2-accent" d="M41 16 L48 23 L42 29 L35 22 Z" />
          <path className="ps2-line" d="M24 26 L38 40" />
        </g>
      );
    case "comercio":
      return (
        <g>
          <path className="ps2-accent" d="M16 20 H48 L52 29 H12 Z" />
          <path className="ps2-body" d="M16 29 H48 V50 H16 Z" />
          <path className="ps2-cutout" d="M28 37 H36 V50 H28 Z" />
          <path className="ps2-line" d="M20 35 H26 M38 35 H44" />
        </g>
      );
    case "disjuntor":
    default:
      return (
        <g>
          <rect className="ps2-body" x="18" y="13" width="28" height="38" rx="6" />
          <path className="ps2-line" d="M24 22 H40 M24 43 H40" />
          <path className="ps2-accent" d="M29 28 L38 36" />
          <circle className="ps2-dot" cx="27" cy="28" r="2" />
          <circle className="ps2-dot" cx="39" cy="37" r="2" />
        </g>
      );
  }
}
