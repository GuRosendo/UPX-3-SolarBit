/* Solarbit – Cadastro de aparelhos */

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
