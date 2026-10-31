/* Solarbit – Dicas de economia */

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
