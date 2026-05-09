require("dotenv").config();

const qrcode = require("qrcode-terminal");
const express = require("express");
const cors = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { WhatsAppBudgetAgent } = require("./agent");

const agent = new WhatsAppBudgetAgent({
  companyName: process.env.COMPANY_NAME,
  city: process.env.CITY,
  hourlyRate: process.env.HOURLY_RATE,
  diagnosticFee: process.env.DIAGNOSTIC_FEE,
  emergencyMultiplier: process.env.EMERGENCY_MULTIPLIER
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on("qr", qr => {
  console.log("Escaneie o QR Code abaixo com o WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Bot conectado e pronto.");
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/welcome", async (req, res) => {
  const { name, whatsapp } = req.body || {};
  if (!name || !whatsapp) {
    return res.status(400).send("Nome e WhatsApp sao obrigatorios.");
  }

  const phoneNumber = String(whatsapp).replace(/[^\d]/g, "");
  if (phoneNumber.length < 10) {
    return res.status(400).send("Numero de WhatsApp invalido.");
  }

  const recipient = phoneNumber.length === 11 || phoneNumber.length === 12 ? `${phoneNumber}@c.us` : `${phoneNumber}@c.us`;
  const message = `Olá ${name}! Recebemos seu cadastro e já abrimos o planejador para você. Se precisar, responda aqui e eu te acompanho.`;

  try {
    console.log("Enviando mensagem de boas-vindas para:", recipient);
    await client.sendMessage(recipient, message);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem para", recipient, error);
    return res.status(500).send("Não foi possível enviar a mensagem de boas-vindas.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend WhatsApp rodando em http://127.0.0.1:${port}`);
});

client.on("auth_failure", message => {
  console.error("Falha de autenticacao:", message);
});

client.on("disconnected", reason => {
  console.error("Bot desconectado:", reason);
});

client.on("message", async msg => {
  console.log("Mensagem recebida:", {
    from: msg.from,
    fromMe: msg.fromMe,
    body: msg.body
  });

  try {
    const reply = await agent.handleMessage({
      phone: msg.from,
      text: msg.body || ""
    });

    if (reply) {
      console.log("Enviando resposta para:", msg.from);
      await msg.reply(reply);
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
});

client.initialize();
