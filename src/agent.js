const { calculateBudget, isEmergency, normalizeText } = require("./budget");
const { improveBudgetMessage } = require("./ai");
const { saveCustomerSheet } = require("./datasheet");

const MENU_OPTIONS = {
  "1": "Emergencia eletrica",
  "2": "Instalacao de tomada / iluminacao",
  "3": "Chuveiro / disjuntor / quadro",
  "4": "Orcamento de obra ou reforma"
};

class WhatsAppBudgetAgent {
  constructor(config = {}) {
    this.companyName = config.companyName || "Martinho Construtor";
    this.city = config.city || "Porto Alegre";
    this.hourlyRate = Number(config.hourlyRate || 150);
    this.diagnosticFee = Number(config.diagnosticFee || 200);
    this.emergencyMultiplier = Number(config.emergencyMultiplier || 1.7);
    this.sessions = new Map();
  }

  createSession() {
    return {
      step: "start",
      name: "",
      address: "",
      propertyType: "",
      urgencyLabel: "",
      description: "",
      serviceOption: "",
      detectedIntent: "",
      hasPhotos: "",
      preferredDay: "",
      preferredTime: "",
      diagnosticConfirmed: "",
      lastBudget: null,
      history: []
    };
  }

  getSession(phone) {
    if (!this.sessions.has(phone)) {
      this.sessions.set(phone, this.createSession());
    }

    return this.sessions.get(phone);
  }

  resetSession(phone) {
    this.sessions.delete(phone);
  }

  welcomeMessage() {
    return `Ola. Seja bem-vindo(a) a ${this.companyName}.

Atendemos servicos eletricos e pequenos servicos de obra em ${this.city}.

Para eu iniciar seu atendimento da melhor forma, por favor me informe o seu nome.`;
  }

  menuMessage(name = "") {
    return `${name ? `Muito obrigado, ${name}.` : "Muito obrigado."}

Como posso ajudar hoje?

1. Emergencia eletrica
2. Instalacao de tomada ou iluminacao
3. Chuveiro, disjuntor ou quadro
4. Orcamento de obra ou reforma
5. Falar com atendimento humano

Se preferir, voce tambem pode descrever o problema em uma frase.`;
  }

  humanHandoffMessage() {
    return `Claro. Vou encaminhar o seu atendimento para uma pessoa da equipe.

Para agilizar, por favor envie:
- endereco do servico
- foto ou video do local
- melhor horario para contato`;
  }

  inferIntent(text = "") {
    const normalized = normalizeText(text);

    if (["humano", "atendente", "pessoa", "suporte"].some(term => normalized.includes(term))) return "human";
    if (["agendar", "visita", "horario", "agenda"].some(term => normalized.includes(term))) return "schedule";
    if (["orcamento", "preco", "valor", "quanto custa"].some(term => normalized.includes(term))) return "quote";
    if (["urgente", "emergencia", "sem luz", "cheiro de queimado", "curto"].some(term => normalized.includes(term))) return "emergency";
    if (["oi", "ola", "bom dia", "boa tarde", "boa noite"].some(term => normalized.includes(term))) return "greeting";

    return "service";
  }

  detectMenuOption(text = "") {
    const normalized = normalizeText(text);

    if (["1", "emergencia", "urgente", "sem luz", "curto", "queimado"].some(term => normalized.includes(term))) return "1";
    if (["2", "tomada", "iluminacao", "lampada", "luminaria", "led"].some(term => normalized.includes(term))) return "2";
    if (["3", "chuveiro", "disjuntor", "quadro"].some(term => normalized.includes(term))) return "3";
    if (["4", "reforma", "obra", "orcamento"].some(term => normalized.includes(term))) return "4";

    return "";
  }

  parseYesNo(text = "") {
    const normalized = normalizeText(text);

    if (["sim", "s", "tenho", "quero", "confirmo", "ok", "pode"].includes(normalized)) return "yes";
    if (["nao", "n", "ainda nao"].includes(normalized)) return "no";

    return "";
  }

  parsePropertyType(text = "") {
    const normalized = normalizeText(text);

    if (["1", "casa", "apartamento", "residencial", "residencia"].some(term => normalized.includes(term))) return "Residencial";
    if (["2", "comercial", "loja", "empresa", "escritorio"].some(term => normalized.includes(term))) return "Comercial";

    return "";
  }

  parseUrgency(text = "") {
    const normalized = normalizeText(text);

    if (["1", "agora", "urgente", "hoje", "imediato"].some(term => normalized.includes(term))) return "Urgente";
    if (["2", "essa semana", "esta semana", "proximos dias"].some(term => normalized.includes(term))) return "Esta semana";
    if (["3", "sem pressa", "sem urgencia", "outro momento"].some(term => normalized.includes(term))) return "Sem urgencia";

    return "";
  }

  parseDayOption(text = "") {
    const normalized = normalizeText(text);

    if (normalized === "1" || normalized.includes("hoje")) return "Hoje";
    if (normalized === "2" || normalized.includes("amanha")) return "Amanha";
    if (normalized === "3" || normalized.includes("outro")) return "Outro dia";

    return "";
  }

  buildDescription(session, latestText) {
    return [
      MENU_OPTIONS[session.serviceOption],
      session.propertyType,
      session.urgencyLabel,
      session.description,
      latestText
    ]
      .filter(Boolean)
      .join(" - ");
  }

  buildCustomerSheet(phone, session, reply) {
    const now = new Date().toISOString();
    const budget = session.lastBudget || {};

    return {
      phone,
      updatedAt: now,
      companyName: this.companyName,
      customerName: session.name,
      status: session.step,
      serviceCategory: MENU_OPTIONS[session.serviceOption] || "Nao classificado",
      address: session.address,
      propertyType: session.propertyType,
      urgency: session.urgencyLabel,
      description: session.description,
      hasPhotos: session.hasPhotos,
      preferredDay: session.preferredDay,
      preferredTime: session.preferredTime,
      diagnosticConfirmed: session.diagnosticConfirmed,
      budgetMin: budget.min || null,
      budgetMax: budget.max || null,
      complexity: budget.complexity ? budget.complexity.label : null,
      complexityMultiplier: budget.complexity ? budget.complexity.multiplier : null,
      estimatedHours: budget.estimatedHours || null,
      serviceName: budget.service ? budget.service.name : null,
      nextAction: this.getNextAction(session.step),
      lastReply: reply,
      conversationHistory: session.history.slice(-12)
    };
  }

  getNextAction(step) {
    const actions = {
      start: "Aguardar nome do cliente",
      menu: "Aguardar selecao do servico",
      address: "Aguardar endereco do servico",
      property_type: "Aguardar tipo do imovel",
      urgency: "Aguardar nivel de urgencia",
      description: "Aguardar descricao detalhada do problema",
      budget: "Aguardar confirmacao sobre envio de foto ou video",
      schedule_day: "Aguardar preferencia de dia",
      schedule_time: "Aguardar preferencia de horario",
      schedule_confirm: "Aguardar confirmacao do diagnostico",
      scheduled: "Fazer follow-up e confirmar visita",
      human: "Encaminhar para atendimento humano"
    };

    return actions[step] || "Aguardar retorno do cliente";
  }

  persistCustomerSheet(phone, session, incomingText, reply) {
    session.history.push({
      at: new Date().toISOString(),
      incoming: incomingText,
      outgoing: reply
    });

    saveCustomerSheet(this.buildCustomerSheet(phone, session, reply));
  }

  async buildBudgetReply(session) {
    const budget = calculateBudget({
      description: session.description,
      hourlyRate: this.hourlyRate,
      emergencyMultiplier: this.emergencyMultiplier
    });

    session.lastBudget = budget;

    const clientData = {
      name: session.name,
      address: session.address,
      propertyType: session.propertyType,
      urgency: session.urgencyLabel,
      hasPhotos: session.hasPhotos,
      description: session.description
    };

    try {
      const aiText = await improveBudgetMessage({
        companyName: this.companyName,
        city: this.city,
        clientData,
        budget
      });

      if (aiText) {
        return `${aiText}

Para seguir com o agendamento, voce consegue enviar foto ou video do local?
1. Sim
2. Nao`;
      }
    } catch (error) {
      console.error("Erro na IA, usando resposta padrao:", error.message);
    }

    return `Com base no que voce me explicou, preparei uma estimativa inicial:

Servico provavel: ${budget.service.name}
Perfil do atendimento: ${session.propertyType || "Nao informado"}
Urgencia: ${session.urgencyLabel || (isEmergency(session.description) ? "Urgente" : "Padrao")}
Complexidade estimada: ${budget.complexity.label} (x${budget.complexity.multiplier})
Tempo estimado: ${budget.estimatedHours}h
Material estimado: R$ ${budget.materialEstimate}
Faixa inicial de investimento: R$ ${budget.min} a R$ ${budget.max}

${budget.emergency ? "Como o caso parece urgente, pode haver adicional de atendimento emergencial.\n" : ""}Para confirmar um valor fechado, precisamos validar o local pessoalmente ou por foto/video.

A visita de diagnostico fica em torno de R$ ${this.diagnosticFee}, com possibilidade de abatimento se o servico for fechado no mesmo atendimento.

Para seguir com o agendamento, voce consegue enviar foto ou video do local?
1. Sim
2. Nao`;
  }

  buildLeadSummary(session) {
    const budget = session.lastBudget || {};

    return [
      `Cliente: ${session.name}`,
      `Servico: ${MENU_OPTIONS[session.serviceOption] || "Nao classificado"}`,
      `Endereco: ${session.address}`,
      `Tipo de imovel: ${session.propertyType || "Nao informado"}`,
      `Urgencia: ${session.urgencyLabel || "Nao informada"}`,
      `Complexidade: ${budget.complexity ? budget.complexity.label : "Nao avaliada"}`,
      `Midia enviada: ${session.hasPhotos || "Nao informado"}`,
      `Dia preferido: ${session.preferredDay || "Nao informado"}`,
      `Horario preferido: ${session.preferredTime || "Nao informado"}`,
      `Diagnostico confirmado: ${session.diagnosticConfirmed || "Nao informado"}`
    ].join("\n");
  }

  async handleMessage({ phone, text }) {
    const normalizedText = (text || "").trim();
    if (!normalizedText) return null;

    const lower = normalizeText(normalizedText);

    if (["menu", "inicio", "comecar"].includes(lower)) {
      this.resetSession(phone);
      const reply = this.welcomeMessage();
      this.persistCustomerSheet(phone, this.getSession(phone), normalizedText, reply);
      return reply;
    }

    const session = this.getSession(phone);
    session.detectedIntent = this.inferIntent(normalizedText);

    let reply;

    if (["humano", "atendente", "5"].includes(lower) || session.detectedIntent === "human") {
      session.step = "human";
      reply = this.humanHandoffMessage();
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "start") {
      session.name = normalizedText;
      session.step = "menu";
      reply = this.menuMessage(session.name);
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "menu") {
      const serviceOption = ["1", "2", "3", "4"].includes(normalizedText)
        ? normalizedText
        : this.detectMenuOption(normalizedText);

      if (serviceOption) {
        session.serviceOption = serviceOption;
        session.description = ["service", "quote", "emergency", "schedule"].includes(session.detectedIntent)
          ? normalizedText
          : "";
        session.step = "address";
        reply = "Perfeito. Por favor, informe o endereco do servico.";
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      session.description = normalizedText;
      session.step = "address";
      reply = "Entendi. Por favor, informe o endereco do servico.";
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "address") {
      session.address = normalizedText;
      session.step = "property_type";
      reply = `Obrigado.

Esse atendimento sera em:
1. Imovel residencial
2. Imovel comercial`;
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "property_type") {
      const propertyType = this.parsePropertyType(normalizedText);
      if (!propertyType) {
        reply = "Por favor, responda 1 para residencial ou 2 para comercial.";
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      session.propertyType = propertyType;
      session.step = "urgency";
      reply = `Certo.

Qual e o nivel de urgencia?
1. Preciso de atendimento hoje
2. Posso resolver ainda nesta semana
3. Sem urgencia`;
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "urgency") {
      const urgencyLabel = this.parseUrgency(normalizedText);
      if (!urgencyLabel) {
        reply = "Por favor, responda 1 para urgente, 2 para esta semana ou 3 para sem urgencia.";
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      session.urgencyLabel = urgencyLabel;
      session.step = "description";

      if (session.description) {
        reply = `Perfeito.

Ja entendi uma parte do seu pedido: "${session.description}".
Agora, por favor, descreva o problema com mais detalhes para eu montar a estimativa.`;
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      reply = `Perfeito.

Agora, por favor, descreva o problema com o maximo de detalhes possivel.
Exemplo: "o disjuntor desarma quando ligo o chuveiro" ou "quero instalar 3 tomadas".`;
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "description") {
      session.description = this.buildDescription(session, normalizedText);
      session.step = "budget";
      reply = await this.buildBudgetReply(session);
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "budget") {
      const yesNo = this.parseYesNo(normalizedText);

      if (yesNo === "yes" || normalizedText === "1") {
        session.hasPhotos = "Sim";
        session.step = "schedule_day";
        reply = `Otimo. Qual dia voce prefere para a visita?

1. Hoje
2. Amanha
3. Outro dia`;
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      if (yesNo === "no" || normalizedText === "2") {
        session.hasPhotos = "Nao";
        session.step = "schedule_day";
        reply = `Sem problema. Podemos seguir com o agendamento mesmo assim.

Qual dia voce prefere para a visita?
1. Hoje
2. Amanha
3. Outro dia`;
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      reply = "Por favor, responda 1 para sim ou 2 para nao.";
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "schedule_day") {
      const preferredDay = this.parseDayOption(normalizedText);
      if (!preferredDay) {
        reply = "Por favor, responda 1 para hoje, 2 para amanha ou 3 para outro dia.";
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      session.preferredDay = preferredDay;
      session.step = "schedule_time";
      reply = "Perfeito. Qual e o melhor horario para o atendimento?";
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "schedule_time") {
      session.preferredTime = normalizedText;
      session.step = "schedule_confirm";
      reply = `Perfeito.

Posso registrar sua solicitacao com visita de diagnostico no valor de R$ ${this.diagnosticFee}?
1. Sim, pode agendar
2. Prefiro falar com uma pessoa da equipe`;
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "schedule_confirm") {
      if (normalizedText === "1" || this.parseYesNo(normalizedText) === "yes") {
        session.diagnosticConfirmed = "Sim";
        session.step = "scheduled";
        reply = `Solicitacao registrada com sucesso.

Resumo do atendimento:
${this.buildLeadSummary(session)}

Sua ficha de cliente foi salva para acompanhamento e pos-venda.
Se puder, envie tambem foto ou video do local para agilizar a visita.`;
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      if (normalizedText === "2" || session.detectedIntent === "human") {
        session.diagnosticConfirmed = "Nao";
        session.step = "human";
        reply = this.humanHandoffMessage();
        this.persistCustomerSheet(phone, session, normalizedText, reply);
        return reply;
      }

      reply = "Por favor, responda 1 para confirmar o agendamento ou 2 para falar com uma pessoa da equipe.";
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    if (session.step === "scheduled") {
      reply = "Recebi sua mensagem. Se quiser iniciar um novo atendimento, envie MENU.";
      this.persistCustomerSheet(phone, session, normalizedText, reply);
      return reply;
    }

    reply = "Recebi sua mensagem. Para voltar ao inicio, envie MENU.";
    this.persistCustomerSheet(phone, session, normalizedText, reply);
    return reply;
  }
}

module.exports = { WhatsAppBudgetAgent };
