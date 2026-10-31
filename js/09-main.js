/* Solarbit – Inicialização */

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
