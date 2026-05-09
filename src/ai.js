async function improveBudgetMessage({ companyName, city, clientData, budget }) {
  if (!process.env.OPENAI_API_KEY) return null;

  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Voce e atendente profissional da empresa ${companyName} em ${city}.
Escreva em portugues do Brasil, com tom educado, claro e acolhedor para WhatsApp.
Nao prometa preco fechado sem visita tecnica.
Use boa gramatica e seja objetivo.
Dados do cliente: ${JSON.stringify(clientData)}
Orcamento: ${JSON.stringify(budget)}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt
  });

  return response.output_text;
}

module.exports = { improveBudgetMessage };
