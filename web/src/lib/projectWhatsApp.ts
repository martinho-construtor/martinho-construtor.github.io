import type { Project, ProjectAnalysis } from "../types";
import { generateWhatsAppLink } from "./config";
import { formatNumber } from "./electrical";

export function generateProjectSummaryForWhatsApp(project: Project, analysis: ProjectAnalysis): string {
  const totalCurrentA = analysis.circuits.reduce((sum, circuit) => sum + circuit.currentA, 0);
  const lines = [
    `*Calculo de Quadro Eletrico - ${project.meta.name}*`,
    "",
    "*Resumo do Projeto:*",
    `- Ambientes: ${project.rooms.length}`,
    `- Pontos: ${project.points.filter(point => point.type !== "board").length}`,
    `- Circuitos: ${project.circuits.filter(circuit => circuit.kind !== "board").length}`,
    "",
    "*Dados Gerais:*",
    `- Potencia total: ${Math.round(analysis.totalLoadW)} W`,
    `- Demanda estimada: ${analysis.demandLoadW} W`,
    `- Corrente total: ${formatNumber(totalCurrentA)} A`,
    "",
    "*Circuitos Principais:*"
  ];

  analysis.circuits.slice(0, 5).forEach(circuit => {
    lines.push(
      `- ${circuit.circuit.name}: ${Math.round(circuit.totalW)} W, ${formatNumber(circuit.currentA)} A, ${circuit.circuit.cableMm2} mm2`
    );
  });

  if (analysis.circuits.length > 5) {
    lines.push(`- ... e mais ${analysis.circuits.length - 5} circuito(s)`);
  }

  lines.push("");
  lines.push("*Materiais Principais:*");

  analysis.materials.slice(0, 8).forEach(material => {
    lines.push(`- ${material.item}: ${material.quantity} ${material.unit}`);
  });

  lines.push("");
  lines.push("*Clique aqui para conversar e receber o orcamento completo.*");

  return lines.join("\n");
}

export function exportProjectToWhatsApp(project: Project, analysis: ProjectAnalysis): void {
  const message = generateProjectSummaryForWhatsApp(project, analysis);
  const whatsappUrl = generateWhatsAppLink(message);
  window.open(whatsappUrl, "_blank");
}
