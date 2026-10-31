/* Solarbit – Cálculos de consumo */

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
