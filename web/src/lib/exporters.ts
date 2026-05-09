import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import writeExcelFile from "write-excel-file/browser";
import type { Project, ProjectAnalysis } from "../types";
import { formatNumber } from "./electrical";

type SheetRow = Array<string | number | boolean | null>;

export function downloadJson(project: Project): void {
  downloadBlob(
    new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }),
    `${safeName(project.meta.name)}.json`
  );
}

export async function downloadXlsx(project: Project, analysis: ProjectAnalysis): Promise<void> {
  await writeExcelFile([
    { sheet: "Ambientes", data: rowsFromObjects(project.rooms), stickyRowsCount: 1 },
    { sheet: "Pontos", data: rowsFromObjects(project.points), stickyRowsCount: 1 },
    { sheet: "Circuitos", data: rowsFromObjects(project.circuits), stickyRowsCount: 1 },
    {
      sheet: "Calculos",
      data: rowsFromObjects(
        analysis.circuits.map(item => ({
          circuito: item.circuit.name,
          cargaW: Math.round(item.totalW),
          correnteA: Number(item.currentA.toFixed(2)),
          quedaPercent: Number(item.voltageDropPercent.toFixed(2)),
          caboAtualMm2: item.circuit.cableMm2,
          caboSugeridoMm2: item.suggestedCableMm2,
          disjuntorAtualA: item.circuit.breakerA,
          disjuntorSugeridoA: item.suggestedBreakerA,
          DR: item.circuit.drProtected ? "Sim" : "Nao",
          PE: item.circuit.hasPE ? "Sim" : "Nao"
        }))
      ),
      stickyRowsCount: 1
    },
    { sheet: "Alertas", data: rowsFromObjects(analysis.warnings), stickyRowsCount: 1 },
    { sheet: "Materiais", data: rowsFromObjects(analysis.materials), stickyRowsCount: 1 }
  ]).toFile(`${safeName(project.meta.name)}.xlsx`);
}

export async function downloadPdf(project: Project, analysis: ProjectAnalysis): Promise<void> {
  const app = document.querySelector(".app") as HTMLElement | null;
  if (!app) {
    downloadTextPdf(project, analysis);
    return;
  }

  try {
    const floorPlanSvg = document.getElementById("floor-plan-svg") as SVGSVGElement | null;
    const floorPlanCanvas = floorPlanSvg ? await captureFloorPlanCanvas(floorPlanSvg) : undefined;
    const canvas = await html2canvas(app, {
      backgroundColor: "#eef0eb",
      logging: false,
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true,
      windowWidth: Math.max(document.documentElement.scrollWidth, 1680),
      windowHeight: Math.max(document.documentElement.scrollHeight, 1200),
      onclone: preparePdfClone
    });

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3", compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const sliceHeightPx = Math.floor((contentHeight / contentWidth) * canvas.width);
    const hasFloorPlanPage = Boolean(floorPlanCanvas);

    if (floorPlanCanvas) {
      addFullPageImage(doc, floorPlanCanvas, pageWidth, pageHeight);
    }

    for (let sourceY = 0, pageIndex = 0; sourceY < canvas.height; sourceY += sliceHeightPx, pageIndex += 1) {
      const sliceHeight = Math.min(sliceHeightPx, canvas.height - sourceY);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;

      const context = slice.getContext("2d");
      if (!context) continue;

      context.fillStyle = "#eef0eb";
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      if (hasFloorPlanPage || pageIndex > 0) doc.addPage("a3", "landscape");

      const imageHeight = (sliceHeight * contentWidth) / canvas.width;
      doc.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", margin, margin, contentWidth, imageHeight);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(98, 106, 98);
      doc.text(`${project.meta.name} | A3 paisagem | pagina ${pageIndex + (hasFloorPlanPage ? 2 : 1)}`, margin, pageHeight - 3.5);
    }

    doc.save(`${safeName(project.meta.name)}-a3-paisagem.pdf`);
  } catch (error) {
    console.error("Falha ao gerar PDF grafico A3.", error);
    downloadTextPdf(project, analysis);
  }
}

async function captureFloorPlanCanvas(svgElement: SVGSVGElement): Promise<HTMLCanvasElement> {
  const editorShell = svgElement.closest(".editor-shell") as HTMLElement | null;
  if (!editorShell) throw new Error("Editor da planta nao encontrado.");

  return await html2canvas(editorShell, {
    backgroundColor: "#fbfaf5",
    logging: false,
    scale: Math.min(3, window.devicePixelRatio || 2),
    useCORS: true,
    onclone: clonedDocument => {
      clonedDocument.querySelectorAll<HTMLElement>(".editor-toolbar, .zoom-controls, .palette-rail, .tool-guidance").forEach(element => {
        element.remove();
      });

      const clonedShell = clonedDocument.querySelector(".editor-shell") as HTMLElement | null;
      if (clonedShell) {
        clonedShell.style.border = "0";
        clonedShell.style.boxShadow = "none";
      }

      const clonedSvg = clonedDocument.getElementById("floor-plan-svg") as SVGSVGElement | null;
      if (clonedSvg) {
        clonedSvg.setAttribute("viewBox", "0 0 15 9.2");
        clonedSvg.style.minHeight = "700px";
      }
    }
  });
}

function addFullPageImage(doc: jsPDF, canvas: HTMLCanvasElement, pageWidth: number, pageHeight: number): void {
  const pageBackground = "#fbfaf5";
  const margin = 8;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const imageRatio = canvas.width / canvas.height;
  const pageRatio = maxWidth / maxHeight;
  const imageWidth = imageRatio > pageRatio ? maxWidth : maxHeight * imageRatio;
  const imageHeight = imageRatio > pageRatio ? maxWidth / imageRatio : maxHeight;
  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;

  doc.setFillColor(pageBackground);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", x, y, imageWidth, imageHeight);
}

function downloadTextPdf(project: Project, analysis: ProjectAnalysis): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(project.meta.name, 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  [
    `Cliente: ${project.meta.client}`,
    `Cidade: ${project.meta.city}`,
    `Sistema: ${project.meta.voltageSystem}`,
    `Carga instalada: ${Math.round(analysis.totalLoadW)} W | Demanda estimada: ${analysis.demandLoadW} W`,
    "Aviso: estudo preliminar inspirado em boas praticas NBR 5410/NR-10. Exige validacao tecnica."
  ].forEach(line => {
    doc.text(line, 14, y);
    y += 6;
  });

  y = addSection(doc, y + 4, "Circuitos");
  analysis.circuits.forEach(item => {
    y = addLine(
      doc,
      y,
      `${item.circuit.name}: ${Math.round(item.totalW)} W, ${formatNumber(item.currentA)} A, queda ${formatNumber(item.voltageDropPercent)}%, cabo ${item.circuit.cableMm2} mm2, disj. ${item.circuit.breakerA} A`
    );
  });

  y = addSection(doc, y + 4, "Alertas");
  analysis.warnings.slice(0, 18).forEach(warning => {
    y = addLine(doc, y, `${warning.severity.toUpperCase()} - ${warning.title}: ${warning.detail}`);
  });

  y = addSection(doc, y + 4, "Lista de materiais");
  analysis.materials.slice(0, 18).forEach(item => {
    y = addLine(doc, y, `${item.group} - ${item.item}: ${item.quantity} ${item.unit}`);
  });

  doc.save(`${safeName(project.meta.name)}.pdf`);
}

function preparePdfClone(clonedDocument: Document): void {
  const app = clonedDocument.querySelector(".app") as HTMLElement | null;
  if (!app) return;

  app.classList.add("pdf-capture-mode");
  clonedDocument.querySelectorAll<HTMLElement>("[hidden]").forEach(element => {
    element.removeAttribute("hidden");
  });
  clonedDocument.querySelectorAll<HTMLElement>(".sidebar, .panel-content, .warnings, .board, .table-scroll").forEach(element => {
    element.scrollTop = 0;
    element.scrollLeft = 0;
  });

  const style = clonedDocument.createElement("style");
  style.textContent = `
    body {
      margin: 0 !important;
      background: #eef0eb !important;
    }

    .app.pdf-capture-mode {
      width: 1680px !important;
      min-height: auto !important;
      grid-template-columns: 320px 1fr 390px !important;
      gap: 16px !important;
      padding: 18px !important;
    }

    .pdf-capture-mode .sidebar {
      position: static !important;
      top: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding-right: 0 !important;
    }

    .pdf-capture-mode .workspace {
      grid-template-rows: auto auto auto !important;
    }

    .pdf-capture-mode .panel-content,
    .pdf-capture-mode .circuit-list .panel-content,
    .pdf-capture-mode .materials .panel-content,
    .pdf-capture-mode .warnings,
    .pdf-capture-mode .board,
    .pdf-capture-mode .table-scroll {
      max-height: none !important;
      overflow: visible !important;
    }

    .pdf-capture-mode .editor-map-row {
      grid-template-columns: 1fr !important;
    }

    .pdf-capture-mode .editor-shell {
      display: none !important;
    }

    .pdf-capture-mode .floor-svg {
      min-height: 700px !important;
    }

    .pdf-capture-mode .installation-map {
      max-height: none !important;
      overflow: visible !important;
    }
  `;
  clonedDocument.head.appendChild(style);
}

export async function downloadPng(svgElement: SVGSVGElement, projectName: string): Promise<void> {
  const serialized = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1100;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#f7f5ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, `${safeName(projectName)}.png`);
  }, "image/png");
}

function addSection(doc: jsPDF, y: number, title: string): number {
  if (y > 270) {
    doc.addPage();
    y = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, y);
  return y + 7;
}

function addLine(doc: jsPDF, y: number, text: string): number {
  if (y > 282) {
    doc.addPage();
    y = 16;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, 182);
  doc.text(lines, 14, y);
  return y + lines.length * 5;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function rowsFromObjects<T extends object>(rows: T[]): SheetRow[] {
  if (rows.length === 0) return [["Sem dados"]];
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  return [
    headers,
    ...rows.map(sourceRow => {
      const row = sourceRow as Record<string, unknown>;
      return headers.map(header => {
        const value = row[header];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
        if (value === null || value === undefined) return null;
        return JSON.stringify(value);
      });
    })
  ];
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "projeto-eletrico";
}
