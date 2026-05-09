import html2canvas from "html2canvas";
import { ArrowLeft, Building2, Check, ChevronLeft, ChevronRight, Home, ImageDown, Minus, Plus, RotateCcw, Save, Store } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { getCustomerPreviewImage, CUSTOMER_PACKAGE_OPTIONS, CUSTOMER_STYLE_OPTIONS } from "../lib/customerImages";
import { createDefaultCustomerLayout, resetCustomerLayout, withCustomerPreview } from "../lib/customerLayout";
import { CUSTOMER_PROPERTY_OPTIONS, getCustomerRoomQuestions, normalizeRoomCounts } from "../lib/customerRooms";
import type { CustomerLayout, CustomerPackage, CustomerPropertyType, CustomerRoomKey, CustomerVisualStyle, Project } from "../types";

interface CustomerPlannerProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onBackToTechnical: () => void;
  onSave: () => void;
}

const WIZARD_STEPS = ["Tipo", "Comodos", "Estilo", "Resumo"];

export function CustomerPlanner({ project, onProjectChange, onBackToTechnical, onSave }: CustomerPlannerProps) {
  const layout = project.customerLayout ?? createDefaultCustomerLayout(project);
  const [activeStep, setActiveStep] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);

  const previewImage = getCustomerPreviewImage(layout.propertyType, layout.visualStyle, layout.selectedPackage);
  const roomQuestions = getCustomerRoomQuestions(layout.propertyType);
  const selectedProperty = CUSTOMER_PROPERTY_OPTIONS.find(option => option.value === layout.propertyType) ?? CUSTOMER_PROPERTY_OPTIONS[0];
  const selectedStyle = CUSTOMER_STYLE_OPTIONS.find(option => option.value === layout.visualStyle) ?? CUSTOMER_STYLE_OPTIONS[0];
  const selectedPackage = CUSTOMER_PACKAGE_OPTIONS.find(option => option.value === layout.selectedPackage) ?? CUSTOMER_PACKAGE_OPTIONS[1];

  const summaryItems = useMemo(
    () => roomQuestions.filter(question => (layout.roomCounts[question.key] ?? 0) > 0),
    [layout.roomCounts, roomQuestions]
  );

  const commitLayout = (nextLayout: CustomerLayout) => {
    onProjectChange({
      ...project,
      customerLayout: withCustomerPreview(nextLayout)
    });
  };

  const selectPropertyType = (propertyType: CustomerPropertyType) => {
    const roomCounts = normalizeRoomCounts(propertyType, {});
    commitLayout({
      ...layout,
      propertyType,
      roomCounts
    });
  };

  const updateRoomCount = (key: CustomerRoomKey, value: number) => {
    commitLayout({
      ...layout,
      roomCounts: normalizeRoomCounts(layout.propertyType, {
        ...layout.roomCounts,
        [key]: value
      })
    });
  };

  const updateStyle = (visualStyle: CustomerVisualStyle) => {
    commitLayout({ ...layout, visualStyle });
  };

  const updatePackage = (selectedPackage: CustomerPackage) => {
    commitLayout({ ...layout, selectedPackage });
  };

  const resetLayout = () => {
    if (!window.confirm("Recriar a configuracao do cliente com base no projeto atual?")) return;
    onProjectChange(resetCustomerLayout(project));
    setActiveStep(0);
  };

  const exportImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#f7f0e3",
      scale: 2,
      useCORS: true
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${slugify(project.meta.client || project.meta.name || "cliente")}-configuracao.png`;
    link.click();
  };

  return (
    <main className="customer-shell customer-configurator">
      <header className="customer-topbar customer-configurator-topbar">
        <div className="customer-topbar-copy">
          <BrandLogo compact priority="high" />
          <div>
            <span className="customer-eyebrow">Modo cliente</span>
            <h1>Configurador de ambientes</h1>
            <p>Escolha o tipo de imovel, informe os comodos e monte uma visao bonita para decidir com calma.</p>
          </div>
        </div>
        <div className="customer-topbar-actions">
          <button type="button" onClick={onBackToTechnical}>
            <ArrowLeft size={16} />
            Voltar ao editor
          </button>
          <button type="button" onClick={resetLayout}>
            <RotateCcw size={16} />
            Recriar
          </button>
          <button type="button" className="primary-action" onClick={onSave}>
            <Save size={16} />
            Salvar progresso
          </button>
        </div>
      </header>

      <section className="customer-configurator-stepper" aria-label="Etapas">
        {WIZARD_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className={index === activeStep ? "active" : index < activeStep ? "done" : ""}
            onClick={() => setActiveStep(index)}
          >
            <span>{index < activeStep ? <Check size={14} /> : index + 1}</span>
            {step}
          </button>
        ))}
      </section>

      <section className="customer-configurator-stage">
        <section className="customer-configurator-main">
          {activeStep === 0 && (
            <ConfiguratorPanel eyebrow="Etapa 1" title="Escolha o tipo de imovel" lead="Essa escolha define o ambiente externo da imagem.">
              <div className="customer-option-grid property-grid">
                {CUSTOMER_PROPERTY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`customer-option-card ${layout.propertyType === option.value ? "selected" : ""}`}
                    onClick={() => selectPropertyType(option.value)}
                  >
                    <PropertyIcon type={option.value} />
                    <span>{option.eyebrow}</span>
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                  </button>
                ))}
              </div>
            </ConfiguratorPanel>
          )}

          {activeStep === 1 && (
            <ConfiguratorPanel eyebrow="Etapa 2" title="Quantos comodos?" lead="Use controles simples. Sem planta tecnica e sem movimento livre.">
              <div className="customer-room-list">
                {roomQuestions.map(question => (
                  <article key={question.key} className="customer-room-counter">
                    <div>
                      <strong>{question.label}</strong>
                      <span>{question.hint}</span>
                    </div>
                    <div className="counter-control">
                      <button
                        type="button"
                        onClick={() => updateRoomCount(question.key, (layout.roomCounts[question.key] ?? 0) - 1)}
                        disabled={(layout.roomCounts[question.key] ?? 0) <= question.min}
                      >
                        <Minus size={15} />
                      </button>
                      <output>{layout.roomCounts[question.key] ?? 0}</output>
                      <button
                        type="button"
                        onClick={() => updateRoomCount(question.key, (layout.roomCounts[question.key] ?? 0) + 1)}
                        disabled={(layout.roomCounts[question.key] ?? 0) >= question.max}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </ConfiguratorPanel>
          )}

          {activeStep === 2 && (
            <ConfiguratorPanel eyebrow="Etapa 3" title="Escolha o visual" lead="Como em um configurador de carro: selecione acabamentos e veja a imagem mudar.">
              <div className="customer-style-grid">
                {CUSTOMER_STYLE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`customer-style-card style-${option.value} ${layout.visualStyle === option.value ? "selected" : ""}`}
                    onClick={() => updateStyle(option.value)}
                  >
                    <span />
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="customer-package-grid">
                {CUSTOMER_PACKAGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`customer-package-card ${layout.selectedPackage === option.value ? "selected" : ""}`}
                    onClick={() => updatePackage(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                  </button>
                ))}
              </div>
            </ConfiguratorPanel>
          )}

          {activeStep === 3 && (
            <ConfiguratorPanel eyebrow="Etapa 4" title="Resumo para o cliente" lead="Um fechamento simples para conversar e salvar a escolha.">
              <div className="customer-summary-hero">
                <div>
                  <span>Tipo</span>
                  <strong>{selectedProperty.label}</strong>
                </div>
                <div>
                  <span>Visual</span>
                  <strong>{selectedStyle.label}</strong>
                </div>
                <div>
                  <span>Pacote</span>
                  <strong>{selectedPackage.label}</strong>
                </div>
              </div>

              <label className="customer-notes-field">
                Notas para conversa
                <textarea value={layout.notes} onChange={event => commitLayout({ ...layout, notes: event.target.value })} rows={5} />
              </label>
            </ConfiguratorPanel>
          )}

          <div className="customer-wizard-actions">
            <button type="button" onClick={() => setActiveStep(step => Math.max(0, step - 1))} disabled={activeStep === 0}>
              <ChevronLeft size={16} />
              Voltar
            </button>
            <button type="button" className="primary-action" onClick={() => setActiveStep(step => Math.min(WIZARD_STEPS.length - 1, step + 1))}>
              {activeStep === WIZARD_STEPS.length - 1 ? "Finalizado" : "Avancar"}
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <aside className="customer-configurator-side">
          <div className="customer-configurator-export" ref={exportRef}>
            <section className="customer-preview-card">
              <div className="customer-preview-image-wrap">
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  width={1200}
                  height={675}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                <div className="customer-image-badge">Imagem pre-renderizada</div>
              </div>
              <div className="customer-preview-copy">
                <span>{selectedProperty.label}</span>
                <h2>{previewImage.title}</h2>
                <p>{previewImage.caption}</p>
              </div>
            </section>

            <section className="customer-summary-card">
              <div className="customer-summary-title">
                <span>Resumo</span>
                <strong>{selectedStyle.label} / {selectedPackage.label}</strong>
              </div>
              <div className="customer-summary-list">
                {summaryItems.map(question => (
                  <div key={question.key}>
                    <span>{question.label}</span>
                    <strong>{layout.roomCounts[question.key]}</strong>
                  </div>
                ))}
              </div>
              {layout.notes && <p className="customer-summary-notes">{layout.notes}</p>}
            </section>
          </div>

          <button type="button" className="customer-export-button" onClick={exportImage}>
            <ImageDown size={17} />
            Exportar imagem
          </button>
        </aside>
      </section>
    </main>
  );
}

interface ConfiguratorPanelProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}

function ConfiguratorPanel({ eyebrow, title, lead, children }: ConfiguratorPanelProps) {
  return (
    <section className="customer-configurator-panel">
      <div className="customer-section-heading">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <p>{lead}</p>
      </div>
      {children}
    </section>
  );
}

function PropertyIcon({ type }: { type: CustomerPropertyType }) {
  if (type === "commercial") return <Store size={26} />;
  if (type === "residential-building") return <Building2 size={26} />;
  return <Home size={26} />;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
