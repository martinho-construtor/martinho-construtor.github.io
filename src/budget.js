const services = require("./services");

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectService(text = "") {
  const normalized = normalizeText(text);
  return services.find(service =>
    service.keywords.some(keyword => normalized.includes(normalizeText(keyword)))
  ) || services.find(service => service.id === "diagnostico");
}

function isEmergency(text = "") {
  const normalized = normalizeText(text);
  return ["urgente", "emergencia", "agora", "sem energia", "queimado", "cheiro de queimado"].some(keyword =>
    normalized.includes(keyword)
  );
}

function detectComplexity(text = "") {
  const normalized = normalizeText(text);
  let score = 1;

  if (["reforma", "obra", "quadro", "fiacao", "fios", "circuito", "disjuntor"].some(keyword => normalized.includes(keyword))) {
    score += 1;
  }

  if (["curto", "cheiro de queimado", "troca geral", "varios pontos", "varias tomadas", "sem energia"].some(keyword =>
    normalized.includes(keyword)
  )) {
    score += 1;
  }

  if (["apartamento inteiro", "casa inteira", "rede completa", "quadro completo", "reforma completa"].some(keyword =>
    normalized.includes(keyword)
  )) {
    score += 1;
  }

  if (score <= 1) {
    return { label: "Baixa", multiplier: 1 };
  }

  if (score === 2) {
    return { label: "Media", multiplier: 1.15 };
  }

  return { label: "Alta", multiplier: 1.3 };
}

function calculateBudget({ description, hourlyRate, emergencyMultiplier }) {
  const service = detectService(description);
  const emergency = isEmergency(description);
  const complexity = detectComplexity(description);
  const adjustedHours = Number((service.baseHours * complexity.multiplier).toFixed(1));
  const adjustedMaterial = Math.round(service.materialEstimate * complexity.multiplier);
  const labor = adjustedHours * hourlyRate;
  const subtotal = Math.max(service.basePrice, labor + adjustedMaterial);
  const withComplexity = subtotal * complexity.multiplier;
  const finalEstimate = emergency ? withComplexity * emergencyMultiplier : withComplexity;
  const min = Math.round(finalEstimate * 0.9);
  const max = Math.round(finalEstimate * 1.25);

  return {
    service,
    emergency,
    complexity,
    estimatedHours: adjustedHours,
    materialEstimate: adjustedMaterial,
    min,
    max
  };
}

module.exports = { calculateBudget, detectService, detectComplexity, isEmergency, normalizeText };
