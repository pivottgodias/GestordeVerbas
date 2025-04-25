// produtos.js - Lista de produtos agora em um arquivo separado
const produtosDados = `
REFRIKO,REFRIKO FRAMBOESA 6X2LT
REFRIKO,TUBA JUJUBA GUARANA 6X2LT
REFRISHOW,REFRISHOW LARANJA 6X2LT
`;

const produtosPorFamilia = {};
produtosDados.trim().split('\n').forEach(line => {
  const [famRaw, prodRaw] = line.split(',');
  if (!famRaw || !prodRaw) return;
  const fam = famRaw.trim(), prod = prodRaw.trim();
  produtosPorFamilia[fam] = produtosPorFamilia[fam] || [];
  produtosPorFamilia[fam].push(prod);
});

const familias = Object.keys(produtosPorFamilia);
