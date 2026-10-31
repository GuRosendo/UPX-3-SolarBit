/* Solarbit – Desenho da tela */

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
