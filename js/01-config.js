/* Solarbit – Dados e constantes */

// Modelos prontos: [nome, potência (W), horas por dia, horário de início]
const APPLIANCE_PRESETS = [
  ["Chuveiro elétrico", 5500, 0.5, "06:30"],
  ["Ar-condicionado",   1400, 8,   "22:00"],
  ["Geladeira",          150, 24,  "00:00"],
  ["TV",                 100, 5,   "19:00"],
  ["Lâmpada LED",         10, 5,   "18:00"],
  ["Computador",         200, 6,   "09:00"],
  ["Micro-ondas",       1200, 0.3, "12:00"],
  ["Máquina de lavar",   500, 1,   "10:00"],
  ["Ferro de passar",   1000, 1,   "19:00"],
];

// Chaves usadas no localStorage (mantidas iguais para não perder dados já salvos)
const STORAGE_USERS = "wc_users";
const STORAGE_SESSION = "wc_session";
const STORAGE_DATA_PREFIX = "wc_data_";

const DEFAULT_TARIFF = 0.95;          // R$ por kWh
const PEAK_START_HOUR = 18;           // horário de ponta: 18h às 21h
const PEAK_END_HOUR = 21;
const CHART_POINTS = 30;              // quantas leituras o gráfico ao vivo mostra

// Estado do aplicativo
let currentUser = null;               // e-mail do usuário logado
let userData = { tarifa: DEFAULT_TARIFF, items: [] };
let authMode = "login";               // "login" ou "register"
let simulationTimer = null;
let liveReadings = [];                // últimas leituras do sensor simulado
