import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  DatabaseBackup,
  Download,
  FilePlus2,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Home,
  ImageDown,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BrandLogo } from "./components/BrandLogo";
import { CustomerPlanner } from "./components/CustomerPlanner";
import { FloorPlanEditor } from "./components/FloorPlanEditor";
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { PromoPage } from "./pages/PromoPage";
import { LandingPage } from "./pages/LandingPage";
import { sampleRestaurantProject } from "./data/sampleRestaurant";
import { normalizeCustomerLayout } from "./lib/customerLayout";
import { ENTRANCE_CIRCUIT_ID, analyzeProject, autoDefineCircuits, ensureEntranceCircuit, formatNumber, isEntranceCircuit } from "./lib/electrical";
import { downloadJson, downloadPdf, downloadPng, downloadXlsx } from "./lib/exporters";
import { exportProjectToWhatsApp } from "./lib/projectWhatsApp";
import { clearLocalProject, getLocalProjectInfo, loadLocalProject, parseProjectJson, saveLocalProject } from "./lib/storage";
import type { Circuit, ElectricalPoint, PointType, Project, ProjectWarning, Room } from "./types";

type SelectionType = "room" | "point" | "circuit";
type Tool = "select" | "pan" | "room" | "point";

export function App() {
  const [showLanding, setShowLanding] = useState(() => {
    const hash = window.location.hash;
    return hash.includes("#landing");
  });
  const [showCustomerPage, setShowCustomerPage] = useState(() => {
    const hash = window.location.hash;
    return hash.includes("#customer");
  });
  const [showDashboard, setShowDashboard] = useState(() => {
    const hash = window.location.hash;
    return hash.includes("#admin") || hash.includes("#dashboard");
  });
  const [showPromoPage, setShowPromoPage] = useState(() => {
    const hash = window.location.hash;
    return !hash.includes("#app") && !hash.includes("#landing") && !hash.includes("#customer") && !hash.includes("#admin") && !hash.includes("#dashboard");
  });
  const [isAppAuthenticated, setIsAppAuthenticated] = useState(() => hasStoredAppAccess());
  const [project, setProject] = useState<Project>(() => prepareProject(loadLocalProject(sampleRestaurantProject)));
  const [selectedType, setSelectedType] = useState<SelectionType>("point");
  const [selectedId, setSelectedId] = useState(project.points[0]?.id ?? "");
  const [tool, setTool] = useState<Tool>("select");
  const [pointType, setPointType] = useState<PointType>("outlet");
  const [automationNote, setAutomationNote] = useState("");
  const [storageInfo, setStorageInfo] = useState(() => getLocalProjectInfo());
  const [inspectorPulse, setInspectorPulse] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const inspectorPulseTimer = useRef<number | undefined>(undefined);
  const inspectorPulseResetTimer = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => analyzeProject(project), [project]);
  const selectedRoom = selectedType === "room" ? project.rooms.find(room => room.id === selectedId) : undefined;
  const selectedPoint = selectedType === "point" ? project.points.find(point => point.id === selectedId) : undefined;
  const selectedCircuit = selectedType === "circuit" ? project.circuits.find(circuit => circuit.id === selectedId) : undefined;
  const selectedSummary = getSelectionSummary(project, selectedType, selectedId);
  const canDeleteSelected = Boolean(selectedId && !(selectedType === "circuit" && selectedCircuit && isEntranceCircuit(selectedCircuit)));
  const mapLink = "https://maps.app.goo.gl/oyo6G7WvDFep8F6SA";
  const nextAction = useMemo(() => {
    const consumerCount = project.points.filter(point => point.type !== "board").length;
    const assignedCount = project.points.filter(point => point.type !== "board" && point.circuitId).length;

    if (project.rooms.length === 0) return "Comece criando ambientes na planta.";
    if (consumerCount === 0) return "Adicione pontos consumidores para calcular circuitos.";
    if (assignedCount < consumerCount) return "Vincule pontos a circuitos ou gere circuitos automaticamente.";
    if (analysis.warnings.length > 0) return "Revise alertas antes de exportar ou ajustar o quadro.";
    return "Pronto para exportar ou continuar refinando o projeto.";
  }, [project, analysis]);

  const enterApp = () => {
    if (hasStoredAppAccess()) setIsAppAuthenticated(true);
    window.history.replaceState(null, "", "#app");
    setShowLanding(false);
    setShowCustomerPage(false);
    setShowPromoPage(false);
    setShowDashboard(false);
  };

  const unlockApp = () => {
    localStorage.setItem("app_auth", "true");
    setIsAppAuthenticated(true);
  };

  const openPromoPage = () => {
    window.history.replaceState(null, "", "#");
    setShowPromoPage(true);
    setShowLanding(false);
    setShowCustomerPage(false);
    setShowDashboard(false);
  };

  const openLandingPage = () => {
    window.history.replaceState(null, "", "#landing");
    setShowPromoPage(false);
    setShowLanding(true);
    setShowCustomerPage(false);
    setShowDashboard(false);
  };

  const openCustomerPage = () => {
    window.history.replaceState(null, "", "#customer");
    setShowPromoPage(false);
    setShowLanding(false);
    setShowCustomerPage(true);
    setShowDashboard(false);
  };

  const openDashboard = () => {
    window.history.replaceState(null, "", "#admin");
    setShowPromoPage(false);
    setShowLanding(false);
    setShowCustomerPage(false);
    setShowDashboard(true);
  };

  useEffect(() => {
    const syncPageFromHash = () => {
      const hash = window.location.hash;

      if (hash.includes("#customer")) {
        setShowLanding(false);
        setShowPromoPage(false);
        setShowCustomerPage(true);
        setShowDashboard(false);
        return;
      }

      if (hash.includes("#admin") || hash.includes("#dashboard")) {
        setShowLanding(false);
        setShowPromoPage(false);
        setShowCustomerPage(false);
        setShowDashboard(true);
        return;
      }

      if (hash.includes("#app")) {
        setShowLanding(false);
        setShowPromoPage(false);
        setShowCustomerPage(false);
        setShowDashboard(false);
        return;
      }

      if (hash.includes("#landing")) {
        setShowPromoPage(false);
        setShowLanding(true);
        setShowCustomerPage(false);
        setShowDashboard(false);
        return;
      }

      setShowLanding(false);
      setShowCustomerPage(false);
      setShowDashboard(false);
      setShowPromoPage(true);
    };

    syncPageFromHash();
    window.addEventListener("hashchange", syncPageFromHash);
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  useEffect(() => {
    saveLocalProject(prepareProject(project));
    setStorageInfo(getLocalProjectInfo());
  }, [project]);

  useEffect(() => {
    return () => {
      window.clearTimeout(inspectorPulseTimer.current);
      window.clearTimeout(inspectorPulseResetTimer.current);
    };
  }, []);

  const updateProject = (next: Project) => setProject(prepareProject(next));

  const selectEntity = (type: SelectionType, id: string) => {
    setSelectedType(type);
    setSelectedId(id);
    setTool("select");
    setInspectorPulse(false);
    window.clearTimeout(inspectorPulseTimer.current);
    window.clearTimeout(inspectorPulseResetTimer.current);
    inspectorPulseTimer.current = window.setTimeout(() => setInspectorPulse(true), 0);
    inspectorPulseResetTimer.current = window.setTimeout(() => setInspectorPulse(false), 850);
  };

  const focusWarning = (warning: ProjectWarning) => {
    if (warning.circuitId) {
      selectEntity("circuit", warning.circuitId);
      return;
    }

    if (warning.pointId) {
      selectEntity("point", warning.pointId);
      return;
    }

    if (warning.roomId) {
      selectEntity("room", warning.roomId);
    }
  };

  const updateRoom = (roomId: string, patch: Partial<Room>) => {
    setProject(current => {
      const room = current.rooms.find(item => item.id === roomId);
      const dx = room && patch.x !== undefined ? patch.x - room.x : 0;
      const dy = room && patch.y !== undefined ? patch.y - room.y : 0;

      return {
        ...current,
        rooms: current.rooms.map(item => (item.id === roomId ? { ...item, ...patch } : item)),
        points:
          room && (dx !== 0 || dy !== 0)
            ? current.points.map(point => (point.roomId === roomId ? { ...point, x: point.x + dx, y: point.y + dy } : point))
            : current.points
      };
    });
  };

  const updatePoint = (pointId: string, patch: Partial<ElectricalPoint>) => {
    setProject(current => ({
      ...current,
      points: current.points.map(point => (point.id === pointId ? { ...point, ...patch } : point))
    }));
  };

  const updateCircuit = (circuitId: string, patch: Partial<Circuit>) => {
    setProject(current => ({
      ...current,
      circuits: current.circuits.map(circuit =>
        circuit.id === circuitId
          ? {
              ...circuit,
              ...patch,
              ...(isEntranceCircuit(circuit) ? { id: ENTRANCE_CIRCUIT_ID, name: "01 Entrada / alimentador", kind: "board" as const } : {})
            }
          : circuit
      )
    }));
  };

  const addCircuit = () => {
    const circuitNumber = project.circuits.filter(circuit => !isEntranceCircuit(circuit)).length + 2;
    const circuit: Circuit = {
      id: crypto.randomUUID(),
      name: `${String(circuitNumber).padStart(2, "0")} Novo circuito`,
      kind: "outlets",
      phase: "A",
      voltage: 127,
      lengthM: 20,
      cableMm2: 2.5,
      breakerA: 16,
      drProtected: true,
      hasPE: true
    };

    setProject(current => prepareProject({ ...current, circuits: [...current.circuits, circuit] }));
    setSelectedType("circuit");
    setSelectedId(circuit.id);
  };

  const autoGenerateCircuits = () => {
    const hasExistingWork = project.circuits.length > 0 || project.points.some(point => point.circuitId);
    if (
      hasExistingWork &&
      !window.confirm("Gerar circuitos novamente vai substituir os circuitos atuais e os vinculos dos pontos. Deseja continuar?")
    ) {
      return;
    }

    setProject(current => {
      const next = autoDefineCircuits(current);
      const consumerCount = next.points.filter(point => point.type !== "board").length;
      const generatedCount = next.circuits.filter(circuit => !isEntranceCircuit(circuit)).length;
      setAutomationNote(`${generatedCount} circuito(s) gerado(s) a partir de ${consumerCount} ponto(s) consumidores. O circuito 01 Entrada foi preservado.`);
      return next;
    });
    setSelectedType("circuit");
    setSelectedId("");
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    if (selectedType === "circuit" && selectedCircuit && isEntranceCircuit(selectedCircuit)) {
      setAutomationNote("O circuito 01 Entrada e fixo e nao pode ser excluido.");
      return;
    }
    if (!window.confirm("Excluir este item irá remover o ambiente/ponto/circuito selecionado. Deseja continuar?")) return;

    setProject(current => {
      if (selectedType === "room") {
        const remainingRooms = current.rooms.filter(room => room.id !== selectedId);
        return {
          ...current,
          rooms: remainingRooms,
          points: current.points.filter(point => point.roomId !== selectedId)
        };
      }

      if (selectedType === "point") {
        return { ...current, points: current.points.filter(point => point.id !== selectedId) };
      }

      const remainingCircuits = current.circuits.filter(circuit => circuit.id !== selectedId);
      const fallbackCircuitId = remainingCircuits.find(circuit => !isEntranceCircuit(circuit))?.id ?? "";
      return prepareProject({
        ...current,
        circuits: remainingCircuits,
        points: current.points.map(point => (point.circuitId === selectedId ? { ...point, circuitId: fallbackCircuitId } : point))
      });
    });
    setSelectedId("");
  };

  const resetSample = () => {
    if (!window.confirm("Recarregar o exemplo irá descartar as alterações locais. Deseja continuar?")) return;
    clearLocalProject();
    const nextProject = prepareProject(sampleRestaurantProject);
    setProject(nextProject);
    setSelectedType("point");
    setSelectedId(nextProject.points[0]?.id ?? ENTRANCE_CIRCUIT_ID);
  };

  const exportPng = async () => {
    const svg = document.getElementById("floor-plan-svg") as SVGSVGElement | null;
    if (svg) await downloadPng(svg, project.meta.name);
  };

  const exportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadPdf(project, analysis);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const saveProgressFile = () => {
    const nextProject = prepareProject(project);
    saveLocalProject(nextProject);
    setStorageInfo(getLocalProjectInfo());
    downloadJson(nextProject);
    setAutomationNote("Progresso salvo no navegador e em arquivo JSON.");
  };

  const createNewFile = () => {
    if (!window.confirm("Criar um novo arquivo vai fechar o projeto atual nesta tela. Salve o progresso antes de continuar.")) return;

    const nextProject = createBlankProject();
    clearLocalProject();
    setProject(nextProject);
    setSelectedType("circuit");
    setSelectedId(ENTRANCE_CIRCUIT_ID);
    setAutomationNote("Novo arquivo criado com o circuito 01 Entrada.");
  };

  const openProjectFile = () => {
    fileInputRef.current?.click();
  };

  const handleOpenProjectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const raw = await file.text();
      const nextProject = parseProjectJson(raw, createBlankProject());
      if (!nextProject) {
        window.alert("Arquivo invalido. Abra um JSON exportado por este planejador.");
        return;
      }

      const normalizedProject = prepareProject(nextProject);
      setProject(normalizedProject);
      setSelectedType("circuit");
      setSelectedId(ENTRANCE_CIRCUIT_ID);
      setAutomationNote(`Arquivo "${file.name}" aberto com circuito 01 Entrada preservado.`);
    } catch {
      window.alert("Nao foi possivel abrir este arquivo.");
    }
  };

  if (showCustomerPage) {
    return <CustomerPlanner project={project} onProjectChange={updateProject} onBackToTechnical={enterApp} onSave={saveProgressFile} />;
  }

  if (showDashboard) {
    return <AdminDashboardPage onNavigateHome={openPromoPage} onNavigateToApp={enterApp} onNavigateToCustomer={openCustomerPage} />;
  }

  if (showPromoPage) {
    return <PromoPage onNavigateToLanding={openLandingPage} onNavigateToApp={enterApp} onNavigateToCustomer={openCustomerPage} />;
  }

  if (showLanding) {
    return <LandingPage onNavigateToPromo={openPromoPage} onNavigateToApp={enterApp} />;
  }

  if (!isAppAuthenticated && !hasStoredAppAccess()) {
    return <AppPinLogin onUnlock={unlockApp} onNavigateHome={openPromoPage} />;
  }

  return (
    <main className="app">
      <aside className="sidebar left">
        <div className="brand-block">
          <BrandLogo compact priority="high" />
          <button className="brand-home-link" type="button" onClick={openPromoPage} title="Voltar para home">
            <Home size={15} />
            Home
          </button>
        </div>

        <input ref={fileInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleOpenProjectFile} />

        <section className="panel file-actions">
          <div className="panel-title">
            <Save size={17} />
            <span>Arquivo</span>
          </div>
          <button className="wide" onClick={saveProgressFile} title="Salvar progresso em JSON">
            <Save size={16} />
            Salvar progresso
          </button>
          <div className="file-action-row">
            <button onClick={createNewFile} title="Novo arquivo">
              <FilePlus2 size={16} />
              Novo
            </button>
            <button onClick={openProjectFile} title="Abrir arquivo JSON">
              <FolderOpen size={16} />
              Abrir
            </button>
          </div>
          <button className="wide customer-entry-button" onClick={openCustomerPage} title="Abrir versao simples para cliente">
            <ImageDown size={16} />
            Modo cliente
          </button>
        </section>

        <section className="panel">
          <div className="panel-title">
            <Zap size={17} />
            <span>Projeto</span>
          </div>
          <label>
            Nome
            <input value={project.meta.name} onChange={event => setProject({ ...project, meta: { ...project.meta, name: event.target.value } })} />
          </label>
          <label>
            Cliente
            <input value={project.meta.client} onChange={event => setProject({ ...project, meta: { ...project.meta, client: event.target.value } })} />
          </label>
          <label>
            Cidade
            <input value={project.meta.city} onChange={event => setProject({ ...project, meta: { ...project.meta, city: event.target.value } })} />
          </label>
          <NumberField
            label="Escala (m por unidade)"
            value={project.meta.scaleMPerUnit}
            min={0.05}
            step="0.05"
            onChange={value => setProject({ ...project, meta: { ...project.meta, scaleMPerUnit: value } })}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={project.meta.scaleVerified}
              onChange={event => setProject({ ...project, meta: { ...project.meta, scaleVerified: event.target.checked } })}
            />
            Escala conferida
          </label>
          <div className="storage-note">
            <DatabaseBackup size={15} />
            <span>
              {storageInfo ? `Rascunho local salvo ${formatStorageDate(storageInfo.savedAt)}.` : "Rascunho salvo neste navegador."} Exporte JSON antes
              de limpar cache.
            </span>
          </div>
        </section>

        <WorkflowGuide
          project={project}
          analysis={analysis}
          onCreateRooms={() => setTool("room")}
          onAddPoints={() => setTool("point")}
          onGenerateCircuits={autoGenerateCircuits}
          onReviewWarnings={() => {
            const firstActionableWarning = analysis.warnings.find(warning => warning.circuitId || warning.pointId || warning.roomId);
            if (firstActionableWarning) focusWarning(firstActionableWarning);
          }}
          onExport={() => downloadJson(project)}
        />

        <section className="panel metrics">
          <Metric label="Carga instalada" value={`${Math.round(analysis.totalLoadW)} W`} />
          <Metric label="Demanda estimada" value={`${analysis.demandLoadW} W`} />
          <Metric label="Fase A" value={`${Math.round(analysis.phaseLoadsW.A)} W`} />
          <Metric label="Fase B" value={`${Math.round(analysis.phaseLoadsW.B)} W`} />
          <Metric label="Fase C" value={`${Math.round(analysis.phaseLoadsW.C)} W`} />
        </section>

        <section className="panel action-grid">
          <button onClick={() => downloadJson(project)} title="Exportar JSON">
            <FileJson size={17} />
            JSON
          </button>
          <button onClick={() => downloadXlsx(project, analysis)} title="Exportar XLSX">
            <FileSpreadsheet size={17} />
            XLSX
          </button>
          <button onClick={exportPdf} title="Exportar PDF A3 paisagem" disabled={isExportingPdf}>
            <FileText size={17} />
            {isExportingPdf ? "Gerando" : "PDF"}
          </button>
          <button onClick={exportPng} title="Exportar PNG">
            <ImageDown size={17} />
            PNG
          </button>
          <button onClick={() => exportProjectToWhatsApp(project, analysis)} title="Enviar para WhatsApp">
            <MessageCircle size={17} />
            WhatsApp
          </button>
        </section>

        <section className="panel">
          <button className="wide primary-action" onClick={autoGenerateCircuits}>
            <Zap size={16} />
            Gerar circuitos pelos pontos
          </button>
          {automationNote && (
            <div className="automation-note" role="status" aria-live="polite">
              {automationNote}
            </div>
          )}
          <button className="wide" onClick={addCircuit}>
            <Plus size={16} />
            Novo circuito
          </button>
          <button className="wide danger" onClick={deleteSelected} disabled={!canDeleteSelected}>
            <Trash2 size={16} />
            Excluir selecionado
          </button>
          <button className="wide muted" onClick={resetSample}>
            <RotateCcw size={16} />
            Recarregar restaurante
          </button>
        </section>
      </aside>

      <section className="workspace">
        <div className="topbar">
          <div className="project-heading">
            <strong>{project.meta.client}</strong>
            <span>{project.meta.voltageSystem}</span>
            <div className="project-flow-hint">
              <span>Próximo passo</span>
              <strong>{nextAction}</strong>
            </div>
          </div>
          <div className="status-chips">
            <span className="status-chip danger-chip">{analysis.warnings.filter(item => item.severity === "critical").length} critico(s)</span>
            <span className="status-chip warning-chip">{analysis.warnings.filter(item => item.severity === "warning").length} aviso(s)</span>
            <span className="status-chip ok-chip">{project.points.filter(point => point.type !== "board").length} ponto(s)</span>
          </div>
          <div className="safety-strip">
            <ShieldCheck size={17} />
            <span>Logica inspirada em NBR 5410/NR-10 para triagem e planejamento. Validacao profissional obrigatoria.</span>
          </div>
        </div>

        <div className="editor-map-row">
          <FloorPlanEditor
            project={project}
            selectedId={selectedId}
            selectedType={selectedType}
            pointType={pointType}
            tool={tool}
            onToolChange={setTool}
            onPointTypeChange={setPointType}
            onProjectChange={updateProject}
            onSelect={selectEntity}
            onDeleteSelected={deleteSelected}
            canDeleteSelected={canDeleteSelected}
          />

          <InstallationMap
            project={project}
            analysis={analysis}
            onSelectCircuit={id => selectEntity("circuit", id)}
            onSelectPoint={id => selectEntity("point", id)}
          />
        </div>

        <div className="bottom-panels">
          <section className="panel warnings">
            <div className="panel-title">
              <AlertTriangle size={17} />
              <span>Alertas</span>
            </div>
            {analysis.warnings.length === 0 ? (
              <p className="empty">Sem alertas criticos no momento.</p>
            ) : (
              analysis.warnings.map(warning => (
                <button
                  key={warning.id}
                  className={`warning-row ${warning.severity}`}
                  onClick={() => focusWarning(warning)}
                >
                  <strong>{warning.title}</strong>
                  <span>{warning.detail}</span>
                </button>
              ))
            )}
          </section>

          <section className="panel board">
            <div className="panel-title">
              <Download size={17} />
              <span>Quadro de distribuicao</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Circuito</th>
                    <th>Fase</th>
                    <th>Disj.</th>
                    <th>Cabo</th>
                    <th>DR</th>
                    <th>A</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.boardRows.map(row => (
                    <tr key={row.position}>
                      <td>{row.position}</td>
                      <td>{row.circuitName}</td>
                      <td>{row.phase}</td>
                      <td>{row.breakerA} A</td>
                      <td>{row.cableMm2} mm2</td>
                      <td>{row.drProtected ? "Sim" : "Nao"}</td>
                      <td>{formatNumber(row.currentA)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <aside className={`sidebar right ${inspectorPulse ? "inspector-pulse" : ""}`}>
        <WarningHub warnings={analysis.warnings} onFocusWarning={focusWarning} />
        <Inspector
          project={project}
          selectedRoom={selectedRoom}
          selectedPoint={selectedPoint}
          selectedCircuit={selectedCircuit}
          selectedType={selectedType}
          selectedSummary={selectedSummary}
          analysis={analysis}
          onSelectCircuit={id => selectEntity("circuit", id)}
          onUpdateRoom={updateRoom}
          onUpdatePoint={updatePoint}
          onUpdateCircuit={updateCircuit}
        />
      </aside>

      <FloatingWhatsAppButton />
    </main>
  );
}

function AppPinLogin({ onUnlock, onNavigateHome }: { onUnlock: () => void; onNavigateHome: () => void }) {
  const [pinInput, setPinInput] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pinInput.trim() !== "1234") {
      window.alert("PIN incorreto. Use 1234 para abrir o planejador.");
      return;
    }

    onUnlock();
  };

  return (
    <main className="app-login-shell">
      <section className="app-login-card" aria-label="Acesso ao planejador tecnico">
        <BrandLogo compact priority="high" />
        <span>Planejador tecnico</span>
        <h1>Acesso com PIN</h1>
        <p>O planejador eletrico e uma area interna para editar projeto, circuitos, materiais e exportacoes.</p>

        <form className="app-login-form" onSubmit={handleSubmit}>
          <label>
            PIN de acesso
            <input
              type="password"
              value={pinInput}
              onChange={event => setPinInput(event.target.value)}
              placeholder="1234"
              autoComplete="current-password"
            />
          </label>
          <button className="primary-action wide" type="submit">
            Entrar no app
          </button>
        </form>

        <button className="app-login-home" type="button" onClick={onNavigateHome}>
          <Home size={16} />
          Voltar para home
        </button>
      </section>
    </main>
  );
}

function WorkflowGuide({
  project,
  analysis,
  onCreateRooms,
  onAddPoints,
  onGenerateCircuits,
  onReviewWarnings,
  onExport
}: {
  project: Project;
  analysis: ReturnType<typeof analyzeProject>;
  onCreateRooms: () => void;
  onAddPoints: () => void;
  onGenerateCircuits: () => void;
  onReviewWarnings: () => void;
  onExport: () => void;
}) {
  const consumerCount = project.points.filter(point => point.type !== "board").length;
  const assignedPointCount = project.points.filter(point => point.type !== "board" && point.circuitId).length;
  const actionableWarnings = analysis.warnings.filter(warning => warning.circuitId || warning.pointId || warning.roomId).length;
  const steps = [
    {
      label: "1. Ambientes",
      detail: `${project.rooms.length} ambiente(s) cadastrados`,
      state: project.rooms.length > 0 ? "done" : "todo",
      onClick: onCreateRooms
    },
    {
      label: "2. Pontos",
      detail: `${consumerCount} ponto(s) consumidores`,
      state: consumerCount > 0 ? "done" : "todo",
      onClick: onAddPoints
    },
    {
      label: "3. Circuitos",
      detail: `${assignedPointCount}/${consumerCount} ponto(s) vinculados`,
      state: consumerCount > 0 && assignedPointCount === consumerCount ? "done" : "todo",
      onClick: onGenerateCircuits
    },
    {
      label: "4. Alertas",
      detail: analysis.warnings.length ? `${analysis.warnings.length} pendencia(s), ${actionableWarnings} acionavel(is)` : "Sem pendencias ativas",
      state: analysis.warnings.length ? "attention" : "done",
      onClick: onReviewWarnings
    },
    {
      label: "5. Exportar",
      detail: "JSON para backup ou continuidade",
      state: "todo",
      onClick: onExport
    }
  ];

  return (
    <section className="panel workflow-panel">
      <div className="panel-title">
        <ClipboardCheck size={17} />
        <span>Fluxo do projeto</span>
      </div>
      <div className="workflow-list">
        {steps.map(step => (
          <button key={step.label} className={`workflow-step ${step.state}`} onClick={step.onClick}>
            {step.state === "done" ? <CheckCircle2 size={16} /> : step.state === "attention" ? <AlertTriangle size={16} /> : <ClipboardCheck size={16} />}
            <span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WarningHub({ warnings, onFocusWarning }: { warnings: ProjectWarning[]; onFocusWarning: (warning: ProjectWarning) => void }) {
  const sortedWarnings = [...warnings]
    .sort((a, b) => warningRank(a.severity) - warningRank(b.severity))
    .slice(0, 5);

  return (
    <section className="panel warning-hub">
      <div className="panel-title">
        <AlertTriangle size={17} />
        <span>Correcoes prioritarias</span>
      </div>
      {sortedWarnings.length === 0 ? (
        <p className="empty">Sem pendencias para corrigir.</p>
      ) : (
        sortedWarnings.map(warning => {
          const actionable = Boolean(warning.circuitId || warning.pointId || warning.roomId);
          return (
            <button
              key={warning.id}
              className={`warning-row ${warning.severity}`}
              disabled={!actionable}
              onClick={() => onFocusWarning(warning)}
            >
              <strong>{warning.title}</strong>
              <span>{warning.detail}</span>
            </button>
          );
        })
      )}
    </section>
  );
}

function Inspector({
  project,
  selectedRoom,
  selectedPoint,
  selectedCircuit,
  selectedType,
  selectedSummary,
  analysis,
  onSelectCircuit,
  onUpdateRoom,
  onUpdatePoint,
  onUpdateCircuit
}: {
  project: Project;
  selectedRoom?: Room;
  selectedPoint?: ElectricalPoint;
  selectedCircuit?: Circuit;
  selectedType: SelectionType;
  selectedSummary: string;
  analysis: ReturnType<typeof analyzeProject>;
  onSelectCircuit: (id: string) => void;
  onUpdateRoom: (id: string, patch: Partial<Room>) => void;
  onUpdatePoint: (id: string, patch: Partial<ElectricalPoint>) => void;
  onUpdateCircuit: (id: string, patch: Partial<Circuit>) => void;
}) {
  const circuitCalc = selectedCircuit ? analysis.circuits.find(item => item.circuit.id === selectedCircuit.id) : undefined;
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({
    inspector: false,
    circuits: false,
    materials: false,
    result: false
  });
  const togglePanel = (panel: string) => {
    setCollapsedPanels(current => ({ ...current, [panel]: !current[panel] }));
  };

  return (
    <>
      <CollapsiblePanel
        id="right-inspector"
        title="Inspetor"
        icon={<Save size={17} />}
        collapsed={collapsedPanels.inspector}
        onToggle={() => togglePanel("inspector")}
      >
        <div className="selection-context">
          <span>Editando agora</span>
          <strong>{selectedSummary}</strong>
        </div>

        {selectedType === "room" && selectedRoom && (
          <>
            <div className="form-grid">
              <label>
                Ambiente
                <input value={selectedRoom.name} onChange={event => onUpdateRoom(selectedRoom.id, { name: event.target.value })} />
                <FieldError show={!selectedRoom.name.trim()} message="Informe um nome para este ambiente." />
              </label>
              <label>
                Categoria
                <select value={selectedRoom.category} onChange={event => onUpdateRoom(selectedRoom.id, { category: event.target.value as Room["category"] })}>
                  <option value="dry">Seco</option>
                  <option value="wet">Molhado</option>
                  <option value="kitchen">Cozinha</option>
                  <option value="service">Servico</option>
                  <option value="public">Publico</option>
                </select>
              </label>
              <NumberField label="Posicao X (m)" value={selectedRoom.x} min={0} onChange={value => onUpdateRoom(selectedRoom.id, { x: value })} />
              <NumberField label="Posicao Y (m)" value={selectedRoom.y} min={0} onChange={value => onUpdateRoom(selectedRoom.id, { y: value })} />
              <NumberField label="Largura (m)" value={selectedRoom.width} min={0.1} onChange={value => onUpdateRoom(selectedRoom.id, { width: value })} />
              <NumberField label="Comprimento (m)" value={selectedRoom.height} min={0.1} onChange={value => onUpdateRoom(selectedRoom.id, { height: value })} />
            </div>
            <div className="measure-summary">
              Area: {(selectedRoom.width * selectedRoom.height).toFixed(2)} m2
            </div>
            <RoomSectorization project={project} analysis={analysis} roomId={selectedRoom.id} onSelectCircuit={onSelectCircuit} />
          </>
        )}

        {selectedType === "point" && selectedPoint && (
          <div className="form-grid">
            <label>
              Etiqueta
              <input value={selectedPoint.label} onChange={event => onUpdatePoint(selectedPoint.id, { label: event.target.value })} />
              <FieldError show={!selectedPoint.label.trim()} message="Informe uma etiqueta para este ponto." />
            </label>
            <label>
              Tipo
              <select value={selectedPoint.type} onChange={event => onUpdatePoint(selectedPoint.id, { type: event.target.value as PointType })}>
                <option value="lighting">Iluminacao</option>
                <option value="switch">Interruptor</option>
                <option value="outlet">Tomada</option>
                <option value="dedicated">Dedicado</option>
                <option value="ac">Ar-condicionado</option>
                <option value="oven">Forno/chapa</option>
                <option value="exhaust">Exaustao</option>
                <option value="board">QD</option>
              </select>
            </label>
            <label>
              Ambiente
              <select value={selectedPoint.roomId} onChange={event => onUpdatePoint(selectedPoint.id, { roomId: event.target.value })}>
                <option value="">Sem ambiente</option>
                {project.rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Circuito
              <select value={selectedPoint.circuitId} onChange={event => onUpdatePoint(selectedPoint.id, { circuitId: event.target.value })}>
                <option value="">Sem circuito</option>
                {project.circuits.map(circuit => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Potencia (W)"
              value={selectedPoint.loadW}
              min={selectedPoint.type === "switch" || selectedPoint.type === "board" ? 0 : 1}
              onChange={value => onUpdatePoint(selectedPoint.id, { loadW: value })}
            />
            <NumberField
              label="Quantidade"
              value={selectedPoint.quantity}
              min={1}
              step="1"
              integer
              onChange={value => onUpdatePoint(selectedPoint.id, { quantity: value })}
            />
          </div>
        )}

        {selectedType === "circuit" && selectedCircuit && (
          <div className="form-grid">
            <label>
              Circuito
              <input value={selectedCircuit.name} onChange={event => onUpdateCircuit(selectedCircuit.id, { name: event.target.value })} />
              <FieldError show={!selectedCircuit.name.trim()} message="Informe um nome para este circuito." />
            </label>
            <label>
              Tipo
              <select value={selectedCircuit.kind} onChange={event => onUpdateCircuit(selectedCircuit.id, { kind: event.target.value as Circuit["kind"] })}>
                <option value="lighting">Iluminacao</option>
                <option value="outlets">Tomadas</option>
                <option value="dedicated">Dedicado</option>
                <option value="hvac">Climatizacao</option>
                <option value="motor">Motor</option>
                <option value="board">Alimentador</option>
              </select>
            </label>
            <label>
              Fase
              <select value={selectedCircuit.phase} onChange={event => onUpdateCircuit(selectedCircuit.id, { phase: event.target.value as Circuit["phase"] })}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="AB">AB</option>
                <option value="BC">BC</option>
                <option value="CA">CA</option>
                <option value="ABC">ABC</option>
              </select>
            </label>
            <label>
              Tensao
              <select value={selectedCircuit.voltage} onChange={event => onUpdateCircuit(selectedCircuit.id, { voltage: Number(event.target.value) as Circuit["voltage"] })}>
                <option value={127}>127 V</option>
                <option value={220}>220 V</option>
                <option value={380}>380 V</option>
              </select>
            </label>
            <NumberField label="Comprimento (m)" value={selectedCircuit.lengthM} min={0.1} onChange={value => onUpdateCircuit(selectedCircuit.id, { lengthM: value })} />
            <NumberField label="Cabo (mm2)" value={selectedCircuit.cableMm2} min={0.1} onChange={value => onUpdateCircuit(selectedCircuit.id, { cableMm2: value })} />
            <NumberField label="Disjuntor (A)" value={selectedCircuit.breakerA} min={1} onChange={value => onUpdateCircuit(selectedCircuit.id, { breakerA: value })} />
            <label className="checkbox">
              <input type="checkbox" checked={selectedCircuit.drProtected} onChange={event => onUpdateCircuit(selectedCircuit.id, { drProtected: event.target.checked })} />
              DR
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={selectedCircuit.hasPE} onChange={event => onUpdateCircuit(selectedCircuit.id, { hasPE: event.target.checked })} />
              PE
            </label>
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        id="right-circuits"
        title="Circuitos"
        icon={<Zap size={17} />}
        collapsed={collapsedPanels.circuits}
        onToggle={() => togglePanel("circuits")}
        className="circuit-list"
      >
        {analysis.circuits.map(item => (
          <button key={item.circuit.id} onClick={() => onSelectCircuit(item.circuit.id)} className="circuit-row">
            <strong>{item.circuit.name}</strong>
            <span>
              {Math.round(item.totalW)} W | {formatNumber(item.currentA)} A | cabo sug. {item.suggestedCableMm2} mm2
            </span>
          </button>
        ))}
      </CollapsiblePanel>

      <CollapsiblePanel
        id="right-materials"
        title="Materiais"
        icon={<FileText size={17} />}
        collapsed={collapsedPanels.materials}
        onToggle={() => togglePanel("materials")}
        className="materials"
      >
        {analysis.materials.map(item => (
          <div className="material-row" key={`${item.group}-${item.item}`}>
            <span>{item.item}</span>
            <strong>
              {item.quantity} {item.unit}
            </strong>
          </div>
        ))}
      </CollapsiblePanel>

      {circuitCalc && (
        <CollapsiblePanel
          id="right-result"
          title="Resultado selecionado"
          icon={<Download size={17} />}
          collapsed={collapsedPanels.result}
          onToggle={() => togglePanel("result")}
          className="calc-note"
        >
          <span>Carga: {Math.round(circuitCalc.totalW)} W</span>
          <span>Corrente: {formatNumber(circuitCalc.currentA)} A</span>
          <span>Queda: {formatNumber(circuitCalc.voltageDropPercent)}%</span>
          <span>Cabo sugerido: {circuitCalc.suggestedCableMm2} mm2</span>
          <span>Disjuntor sugerido: {circuitCalc.suggestedBreakerA} A</span>
        </CollapsiblePanel>
      )}
    </>
  );
}

function CollapsiblePanel({
  id,
  title,
  icon,
  collapsed,
  onToggle,
  className = "",
  children
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`panel collapsible-panel ${className} ${collapsed ? "is-collapsed" : ""}`}>
      <button className="panel-title panel-title-button" onClick={onToggle} aria-expanded={!collapsed} aria-controls={id}>
        <span className="panel-title-left">
          {icon}
          <span>{title}</span>
        </span>
        {collapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
      </button>
      <div id={id} className="panel-content" hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = "0.1",
  integer = false
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
  integer?: boolean;
}) {
  const error = getNumberFieldError(value, min, max, integer);

  return (
    <label className={error ? "field-invalid" : ""}>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        onChange={event => onChange(Number(event.target.value))}
      />
      <FieldError show={Boolean(error)} message={error} />
    </label>
  );
}

function FieldError({ show, message }: { show: boolean; message?: string }) {
  if (!show || !message) return null;
  return <span className="field-error">{message}</span>;
}

function getNumberFieldError(value: number, min?: number, max?: number, integer = false): string | undefined {
  if (!Number.isFinite(value)) return "Informe um numero valido.";
  if (min !== undefined && value < min) return `Minimo: ${min}.`;
  if (max !== undefined && value > max) return `Maximo: ${max}.`;
  if (integer && !Number.isInteger(value)) return "Use um numero inteiro.";
  return undefined;
}

function InstallationMap({
  project,
  analysis,
  onSelectCircuit,
  onSelectPoint
}: {
  project: Project;
  analysis: ReturnType<typeof analyzeProject>;
  onSelectCircuit: (id: string) => void;
  onSelectPoint: (id: string) => void;
}) {
  const boards = project.points.filter(point => point.type === "board");
  const entranceCircuit = project.circuits.find(isEntranceCircuit);
  const roomDerivations = project.rooms
    .map(room => {
      const points = project.points.filter(point => point.roomId === room.id);
      const circuitIds = new Set(points.map(point => point.circuitId).filter(Boolean));
      const loadW = points.reduce((sum, point) => sum + point.loadW * point.quantity, 0);
      return { room, points: points.length, circuits: circuitIds.size, loadW };
    })
    .filter(item => item.points > 0);

  return (
    <section className="installation-map">
      <div className="map-header">
        <div>
          <span>Mapa da instalacao</span>
          <strong>Quadros, circuitos e pontos consumidores</strong>
        </div>
        <small>Organizacao vertical para conferir setorizacao, derivacoes e cargas.</small>
      </div>

      <div className="map-layer layer-top">
        <div className="layer-title">
          <span>1</span>
          <strong>Quadros e derivacoes principais</strong>
        </div>
        <div className="map-card-grid">
          {entranceCircuit && (
            <button className="map-card entrance-card" onClick={() => onSelectCircuit(entranceCircuit.id)}>
              <strong>{entranceCircuit.name}</strong>
              <span>Entrada da instalacao {"->"} quadro de distribuicao</span>
            </button>
          )}

          {boards.length === 0 ? (
            <div className="map-card muted-card">
              <strong>Quadro principal nao posicionado</strong>
              <span>Arraste o item QD para a planta para localizar o quadro.</span>
            </div>
          ) : (
            boards.map(board => {
              const room = project.rooms.find(item => item.id === board.roomId);
              return (
                <button key={board.id} className="map-card" onClick={() => onSelectPoint(board.id)}>
                  <strong>{board.label}</strong>
                  <span>{room ? room.name : "Sem comodo"} | recebe o circuito 01 Entrada</span>
                </button>
              );
            })
          )}

          {roomDerivations.map(item => (
            <div key={item.room.id} className="map-card derivation-card">
              <strong>{item.room.name}</strong>
              <span>
                {item.circuits} circuito(s), {item.points} ponto(s), {item.loadW} W
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="map-connector" />

      <div className="map-layer layer-middle">
        <div className="layer-title">
          <span>2</span>
          <strong>Circuitos e derivacoes por ambiente</strong>
        </div>
        <div className="map-card-grid circuit-map-grid">
          {analysis.circuits.map(item => {
            const rooms = Array.from(
              new Set(
                item.points
                  .map(point => project.rooms.find(room => room.id === point.roomId)?.name)
                  .filter(Boolean)
              )
            );

            return (
              <button
                key={item.circuit.id}
                className={`map-card circuit-map-card ${isEntranceCircuit(item.circuit) ? "entrance-circuit-card" : ""}`}
                onClick={() => onSelectCircuit(item.circuit.id)}
              >
                <strong>{item.circuit.name}</strong>
                <span>
                  {Math.round(item.totalW)} W | {formatNumber(item.currentA)} A | {item.circuit.phase} | {item.circuit.breakerA} A
                </span>
                <small>{rooms.length ? `Deriva para: ${rooms.join(", ")}` : "Sem pontos vinculados"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-connector" />

      <div className="map-layer layer-bottom">
        <div className="layer-title">
          <span>3</span>
          <strong>Pontos consumidores</strong>
        </div>
        <div className="consumer-list">
          {project.points
            .filter(point => point.type !== "board")
            .map(point => {
              const room = project.rooms.find(item => item.id === point.roomId);
              const circuit = project.circuits.find(item => item.id === point.circuitId);
              return (
                <button key={point.id} className="consumer-row" onClick={() => onSelectPoint(point.id)}>
                  <strong>{point.label}</strong>
                  <span>{pointTypeLabel(point.type)}</span>
                  <span>{room ? room.name : "Sem comodo"}</span>
                  <span>{circuit ? circuit.name : "Sem circuito"}</span>
                  <strong>{point.loadW * point.quantity} W</strong>
                </button>
              );
            })}
        </div>
      </div>
    </section>
  );
}

function RoomSectorization({
  project,
  analysis,
  roomId,
  onSelectCircuit
}: {
  project: Project;
  analysis: ReturnType<typeof analyzeProject>;
  roomId: string;
  onSelectCircuit: (id: string) => void;
}) {
  const rows = getRoomSectorRows(project, analysis, roomId);

  return (
    <div className="room-sectorization">
      <strong>Setorizacao do comodo</strong>
      {rows.length === 0 ? (
        <span>Nenhum ponto eletrico neste comodo.</span>
      ) : (
        rows.map(row => (
          <button key={row.circuitId} className="sector-row" onClick={() => onSelectCircuit(row.circuitId)}>
            <span>{row.name}</span>
            <strong>
              {row.points} ponto(s) | {row.loadW} W
            </strong>
          </button>
        ))
      )}
    </div>
  );
}

function getRoomSectorRows(project: Project, analysis: ReturnType<typeof analyzeProject>, roomId: string) {
  const rows = new Map<string, { circuitId: string; name: string; points: number; loadW: number }>();

  project.points
    .filter(point => point.roomId === roomId)
    .forEach(point => {
      const circuit = project.circuits.find(item => item.id === point.circuitId);
      if (!circuit) return;
      const existing = rows.get(circuit.id) ?? {
        circuitId: circuit.id,
        name: circuit.name,
        points: 0,
        loadW: 0
      };

      existing.points += point.quantity;
      existing.loadW += point.loadW * point.quantity;
      rows.set(circuit.id, existing);
    });

  return Array.from(rows.values()).sort((a, b) => {
    const circuitA = analysis.circuits.find(item => item.circuit.id === a.circuitId);
    const circuitB = analysis.circuits.find(item => item.circuit.id === b.circuitId);
    return (circuitB?.totalW ?? 0) - (circuitA?.totalW ?? 0);
  });
}

function prepareProject(project: Project): Project {
  return normalizeCustomerLayout(ensureEntranceCircuit(project));
}

function hasStoredAppAccess(): boolean {
  return localStorage.getItem("app_auth") === "true" || localStorage.getItem("admin_auth") === "true" || localStorage.getItem("dashboard_auth") === "true";
}

function createBlankProject(): Project {
  return prepareProject({
    meta: {
      name: "Novo projeto eletrico",
      client: "Cliente",
      city: "",
      voltageSystem: "127/220 V - baixa tensao",
      responsible: "Martinho Construtor",
      notes: "Projeto em desenvolvimento.",
      scaleMPerUnit: 1,
      scaleVerified: false
    },
    rooms: [
      {
        id: "room-entrada",
        name: "Entrada / QD",
        x: 0.8,
        y: 6.4,
        width: 2.6,
        height: 1.5,
        category: "service"
      }
    ],
    points: [
      {
        id: "point-qd",
        roomId: "room-entrada",
        x: 1.25,
        y: 7.1,
        type: "board",
        label: "QD",
        loadW: 0,
        quantity: 1,
        circuitId: ENTRANCE_CIRCUIT_ID
      }
    ],
    circuits: []
  });
}

function getSelectionSummary(project: Project, selectedType: SelectionType, selectedId: string): string {
  if (!selectedId) return "Nada selecionado";

  if (selectedType === "room") {
    return project.rooms.find(room => room.id === selectedId)?.name ?? "Ambiente nao encontrado";
  }

  if (selectedType === "point") {
    const point = project.points.find(item => item.id === selectedId);
    return point ? `${point.label || "Ponto sem etiqueta"} | ${pointTypeLabel(point.type)}` : "Ponto nao encontrado";
  }

  return project.circuits.find(circuit => circuit.id === selectedId)?.name ?? "Circuito nao encontrado";
}

function warningRank(severity: ProjectWarning["severity"]): number {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function formatStorageDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "agora";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function pointTypeLabel(type: PointType): string {
  const labels: Record<PointType, string> = {
    lighting: "Iluminacao",
    switch: "Interruptor",
    outlet: "Tomada",
    dedicated: "Ponto dedicado",
    ac: "Ar-condicionado",
    oven: "Forno/chapa",
    exhaust: "Exaustao",
    board: "Quadro"
  };

  return labels[type];
}
