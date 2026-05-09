import { publicAsset } from "../lib/assets";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  showMascot?: boolean;
  priority?: "high" | "low" | "auto";
}

export function BrandLogo({ className = "", compact = false, showMascot = false, priority = "auto" }: BrandLogoProps) {
  const loading = priority === "high" ? "eager" : "lazy";

  return (
    <div className={`brand-logo ${compact ? "brand-logo-compact" : ""} ${showMascot ? "brand-logo-with-mascot" : ""} ${className}`.trim()}>
      <img
        className="brand-logo-wordmark"
        src={publicAsset("brand/martinho-wordmark.svg")}
        alt="Martinho Construtor"
        width={632}
        height={171}
        loading={loading}
        decoding="async"
        fetchPriority={priority}
      />
      {showMascot && (
        <img
          className="brand-logo-mascot"
          src={publicAsset("brand/martinho-construtor-personagem.webp")}
          alt=""
          width={607}
          height={824}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

export default BrandLogo;
