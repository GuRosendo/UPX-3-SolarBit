/* =========================================================
   Solarbit – lógica do aplicativo
   Organização:
   1. Dados e constantes
   2. Funções utilitárias
   3. Login e cadastro de usuário
   4. Cálculos de consumo
   5. Desenho da tela (render)
   6. Dicas de economia
   7. Cadastro de aparelhos
   8. Sensor ESP32 (simulado)
   9. Inicialização
   ========================================================= */


/* ---------- 1. Dados e constantes ---------- */

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


/* ---------- 2. Funções utilitárias ---------- */

// Atalho para document.getElementById
const $ = (id) => document.getElementById(id);

// Evita que texto digitado pelo usuário vire HTML (proteção contra injeção)
function escapeHtml(text) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(text).replace(/[&<>"']/g, (char) => replacements[char]);
}

// Leitura e escrita segura no localStorage (não quebra se estiver bloqueado)
const storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // sem armazenamento disponível: o app continua funcionando, só não salva
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  },
};

// Formata número como moeda brasileira (ex.: R$ 12,50)
function formatMoney(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


/* ---------- 3. Login e cadastro de usuário ---------- */

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";

  $("nameWrap").classList.toggle("hidden", !isRegister);
  $("authBtn").textContent = isRegister ? "Criar conta" : "Entrar";
  $("authToggle").textContent = isRegister
    ? "Já tem conta? Entrar"
    : "Não tem conta? Criar conta";
  $("authErr").textContent = "";
}

function showAuthError(message) {
  $("authErr").textContent = message;
}

function handleAuthSubmit() {
  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPass").value;
  const name = $("authName").value.trim();
  const users = storage.get(STORAGE_USERS) || {};

  if (!email || !password) {
    showAuthError("Preencha e-mail e senha.");
    return;
  }

  if (authMode === "register") {
    if (!name) {
      showAuthError("Informe seu nome.");
      return;
    }
    if (users[email]) {
      showAuthError("Este e-mail já tem cadastro. Faça login.");
      return;
    }
    users[email] = { name, pass: password };
    storage.set(STORAGE_USERS, users);
  } else if (!users[email] || users[email].pass !== password) {
    showAuthError("E-mail ou senha incorretos.");
    return;
  }

  storage.set(STORAGE_SESSION, email);
  startApp(email);
}

function handleLogout() {
  stopSimulation();
  storage.remove(STORAGE_SESSION);
  location.reload();
}

// Entra no aplicativo depois do login
function startApp(email) {
  currentUser = email;
  const user = (storage.get(STORAGE_USERS) || {})[email];

  userData = storage.get(STORAGE_DATA_PREFIX + email) || {
    tarifa: DEFAULT_TARIFF,
    items: [],
  };

  $("who").textContent = "Olá, " + (user ? user.name : email);
  $("tariff").value = userData.tarifa;

  $("auth").classList.add("hidden");
  $("app").classList.remove("hidden");

  render();
}

function saveUserData() {
  storage.set(STORAGE_DATA_PREFIX + currentUser, userData);
}


/* ---------- 4. Cálculos de consumo ---------- */

// Consumo mensal do aparelho em kWh: potência × horas × dias ÷ 1000
function monthlyKwh(appliance) {
  return (appliance.w * appliance.h * appliance.d) / 1000;
}

// Retorna true se o horário de início cai entre 18h e 21h
function isPeakTime(time) {
  const hour = parseInt(time.split(":")[0], 10);
  return hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
}

function sortByConsumption(appliances) {
  return [...appliances].sort((a, b) => monthlyKwh(b) - monthlyKwh(a));
}


/* ---------- 5. Desenho da tela ---------- */

function render() {
  const appliances = userData.items;
  const totalKwh = appliances.reduce((sum, item) => sum + monthlyKwh(item), 0);

  renderSummary(appliances, totalKwh);
  renderApplianceTable(appliances);
  renderBars(appliances, totalKwh);
  renderTips(appliances, totalKwh);
}

// Cards de resumo no topo
function renderSummary(appliances, totalKwh) {
  $("totalKwh").textContent = totalKwh.toFixed(1).replace(".", ",");
  $("totalCost").textContent = formatMoney(totalKwh * userData.tarifa);
  $("totalCount").textContent = appliances.length;
}

// Tabela "Meus aparelhos"
function renderApplianceTable(appliances) {
  $("listEmpty").classList.toggle("hidden", appliances.length > 0);

  $("applianceList").innerHTML = appliances
    .map((item, index) => {
      const kwh = monthlyKwh(item);
      const peak = isPeakTime(item.t);

      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.w} W</td>
          <td>${item.h} h × ${item.d} d</td>
          <td class="${peak ? "peak" : ""}">${item.t}${peak ? " (ponta)" : ""}</td>
          <td>${kwh.toFixed(1)}</td>
          <td>${formatMoney(kwh * userData.tarifa)}</td>
          <td><button class="btn ghost sm" data-remove="${index}">Remover</button></td>
        </tr>`;
    })
    .join("");
}

// Gráfico "Quem mais consome"
function renderBars(appliances, totalKwh) {
  const sorted = sortByConsumption(appliances);
  const biggest = sorted.length ? monthlyKwh(sorted[0]) : 1;

  $("barsEmpty").classList.toggle("hidden", appliances.length > 0);

  $("bars").innerHTML = sorted
    .map((item) => {
      const kwh = monthlyKwh(item);
      const barWidth = (kwh / biggest) * 100;
      const percentOfTotal = (kwh / totalKwh) * 100;

      return `
        <div class="bar-row">
          <span>${escapeHtml(item.name)}</span>
          <div class="bar"><i style="width:${barWidth}%"></i></div>
          <span>${percentOfTotal.toFixed(0)}%</span>
        </div>`;
    })
    .join("");
}

function renderTips(appliances, totalKwh) {
  $("tips").innerHTML = buildTips(appliances, totalKwh)
    .map((tip) => `<li>${tip}</li>`)
    .join("");
}

// Clique no botão "Remover" de qualquer linha da tabela
function handleListClick(event) {
  const index = event.target.dataset.remove;
  if (index === undefined) return;

  userData.items.splice(Number(index), 1);
  saveUserData();
  render();
}

// Mudança no campo de tarifa
function handleTariffChange(event) {
  userData.tarifa = parseFloat(event.target.value) || 0;
  saveUserData();
  render();
}


/* ---------- 6. Dicas de economia ---------- */

function buildTips(appliances, totalKwh) {
  if (!appliances.length) {
    return ["Cadastre seus aparelhos para receber dicas personalizadas."];
  }

  const tips = [];

  // Procura aparelhos cujo nome combine com um padrão (ex.: /chuveiro/)
  const findByName = (pattern) =>
    appliances.filter((item) => pattern.test(item.name.toLowerCase()));

  // Dica 1: aparelho que domina o consumo
  const biggest = sortByConsumption(appliances)[0];
  const biggestShare = (monthlyKwh(biggest) / totalKwh) * 100;

  if (appliances.length > 1 && biggestShare >= 30) {
    tips.push(
      `<b>${escapeHtml(biggest.name)}</b> responde por ${biggestShare.toFixed(0)}% do consumo. ` +
      `Reduzir o uso dele é o jeito mais rápido de economizar.`
    );
  }

  // Dicas específicas por tipo de aparelho
  if (findByName(/chuveiro/).length) {
    tips.push("Chuveiro: banhos de 5 minutos e o modo verão podem cortar até 30% do consumo dele.");
  }

  if (findByName(/ar-cond|ar cond|split/).length) {
    tips.push("Ar-condicionado: mantenha em 23 °C, limpe o filtro todo mês e feche portas e janelas.");
  }

  if (findByName(/geladeira|freezer/).length) {
    tips.push("Geladeira: confira a borracha de vedação e não deixe a porta aberta por muito tempo.");
  }

  if (findByName(/lâmpada|lampada/).some((item) => item.w >= 30)) {
    tips.push("Há lâmpadas de 30 W ou mais. Trocar por LED de 9 W gasta cerca de 70% menos.");
  }

  if (findByName(/tv|computador|pc|notebook/).length) {
    tips.push("TV e computador consomem em modo de espera. Desligue da tomada ou use um filtro de linha com chave.");
  }

  // Aparelhos potentes usados no horário de ponta
  const strongInPeak = appliances.filter((item) => isPeakTime(item.t) && item.w >= 1000);
  if (strongInPeak.length) {
    const names = strongInPeak.map((item) => escapeHtml(item.name)).join(", ");
    tips.push(
      `Aparelhos fortes no horário de ponta (18h–21h): ${names}. ` +
      `Se sua distribuidora oferece a tarifa branca, mover o uso para outro horário sai mais barato.`
    );
  }

  // Consumo geral alto
  if (totalKwh > 200) {
    tips.push("Seu consumo passa de 200 kWh/mês. Defina uma meta de redução de 10% e acompanhe aqui.");
  }

  // Nenhuma dica se aplicou: mensagem positiva
  if (!tips.length) {
    tips.push("Bom trabalho! Seu consumo está equilibrado. Continue desligando aparelhos que não está usando.");
  }

  return tips;
}


/* ---------- 7. Cadastro de aparelhos ---------- */

// Preenche o <select> com os modelos prontos
function fillPresetOptions() {
  $("preset").innerHTML += APPLIANCE_PRESETS
    .map((preset, index) => `<option value="${index}">${preset[0]}</option>`)
    .join("");
}

// Ao escolher um modelo, preenche o formulário automaticamente
function handlePresetChange(event) {
  const preset = APPLIANCE_PRESETS[event.target.value];
  if (!preset) return;

  const [name, power, hours, startTime] = preset;
  $("applianceName").value = name;
  $("appliancePower").value = power;
  $("applianceHours").value = hours;
  $("applianceStart").value = startTime;
}

function handleAddAppliance() {
  const name = $("applianceName").value.trim();
  const power = Number($("appliancePower").value);
  const hours = Number($("applianceHours").value);
  const days = Number($("applianceDays").value);
  const startTime = $("applianceStart").value || "00:00";

  const isValid = name && power > 0 && hours > 0 && hours <= 24 && days >= 1 && days <= 31;

  if (!isValid) {
    $("formErr").textContent =
      "Confira nome, potência (maior que 0), horas (até 24) e dias (1 a 31).";
    return;
  }

  $("formErr").textContent = "";

  // w = watts, h = horas/dia, d = dias/mês, t = horário de início
  userData.items.push({ name, w: power, h: hours, d: days, t: startTime });
  saveUserData();
  render();

  // Limpa o formulário (mantém dias e horário para facilitar o próximo cadastro)
  ["applianceName", "appliancePower", "applianceHours"].forEach((id) => {
    $(id).value = "";
  });
  $("preset").value = "";
}


/* ---------- 8. Sensor ESP32 (simulado) ---------- */

function stopSimulation() {
  clearInterval(simulationTimer);
  simulationTimer = null;
  $("simBtn").textContent = "Iniciar simulação";
}

// Gera uma leitura falsa em watts, baseada nos aparelhos cadastrados
function generateFakeReading() {
  const averageWatts =
    userData.items.reduce((sum, item) => sum + item.w * (item.h / 24), 0) || 100;

  // Variação aleatória entre 70% e 150% da média
  const variation = 0.7 + Math.random() * 0.8;
  return Math.max(0, Math.round(averageWatts * variation));
}

// Redesenha a linha do gráfico ao vivo (SVG de 300 × 80)
function drawLiveChart() {
  const highest = Math.max(...liveReadings, 1);

  const points = liveReadings
    .map((watts, index) => {
      const x = (index * 300) / (CHART_POINTS - 1);
      const y = 76 - (watts / highest) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  $("liveLine").setAttribute("points", points);
}

function takeReading() {
  const watts = generateFakeReading();
  $("liveWatts").textContent = watts;

  liveReadings.push(watts);
  if (liveReadings.length > CHART_POINTS) liveReadings.shift();

  drawLiveChart();
}

function toggleSimulation() {
  if (simulationTimer) {
    stopSimulation();
    return;
  }
  $("simBtn").textContent = "Parar simulação";
  simulationTimer = setInterval(takeReading, 1000);
}


/* ---------- 9. Inicialização ---------- */

// Eventos de login
$("authToggle").onclick = () => setAuthMode(authMode === "login" ? "register" : "login");
$("authBtn").onclick = handleAuthSubmit;
$("logout").onclick = handleLogout;

// Eventos do painel
$("applianceList").onclick = handleListClick;
$("tariff").oninput = handleTariffChange;
$("preset").onchange = handlePresetChange;
$("addBtn").onclick = handleAddAppliance;
$("simBtn").onclick = toggleSimulation;
$("codeBtn").onclick = () => $("esp32Code").classList.toggle("hidden");

fillPresetOptions();

// Se já existe uma sessão salva, entra direto sem pedir login de novo
const savedSession = storage.get(STORAGE_SESSION);
const registeredUsers = storage.get(STORAGE_USERS) || {};

if (savedSession && registeredUsers[savedSession]) {
  startApp(savedSession);
}
