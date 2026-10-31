/* Solarbit – Sensor ESP32 (simulado) */

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
