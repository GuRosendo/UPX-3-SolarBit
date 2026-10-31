/* Solarbit – Funções utilitárias */

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
