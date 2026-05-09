const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "customers.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}\n", "utf8");
  }
}

function readStore() {
  ensureStore();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Erro ao ler a ficha de clientes:", error.message);
    return {};
  }
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function saveCustomerSheet(sheet) {
  const store = readStore();
  const existing = store[sheet.phone] || {};

  store[sheet.phone] = {
    createdAt: existing.createdAt || sheet.updatedAt,
    ...existing,
    ...sheet
  };

  writeStore(store);
}

module.exports = { saveCustomerSheet, DATA_FILE };
