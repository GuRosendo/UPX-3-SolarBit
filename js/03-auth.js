/* Solarbit – Login e cadastro de usuário */

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
