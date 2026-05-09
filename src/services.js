module.exports = [
  {
    id: "tomada_nova",
    keywords: ["tomada", "ponto novo", "ponto de tomada"],
    name: "Instalacao de tomada nova",
    baseHours: 1.5,
    materialEstimate: 45,
    basePrice: 180
  },
  {
    id: "disjuntor",
    keywords: ["disjuntor", "desarmando", "quadro", "curto"],
    name: "Verificacao ou troca de disjuntor",
    baseHours: 1,
    materialEstimate: 70,
    basePrice: 180
  },
  {
    id: "chuveiro",
    keywords: ["chuveiro", "aquecedor"],
    name: "Instalacao ou verificacao de chuveiro",
    baseHours: 1.5,
    materialEstimate: 80,
    basePrice: 220
  },
  {
    id: "iluminacao",
    keywords: ["lampada", "luminaria", "led", "iluminacao"],
    name: "Instalacao ou manutencao de iluminacao",
    baseHours: 1,
    materialEstimate: 40,
    basePrice: 160
  },
  {
    id: "diagnostico",
    keywords: ["nao sei", "problema", "energia", "sem luz", "queda"],
    name: "Diagnostico eletrico",
    baseHours: 1,
    materialEstimate: 0,
    basePrice: 200
  }
];
