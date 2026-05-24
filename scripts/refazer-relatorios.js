#!/usr/bin/env node
/**
 * Refazer Relatórios — recalcula custos/prazos sem re-explorar
 * Uso: node refazer-relatorios.js --cliente <id> --timestamp <YYYY-MM-DD_HHMM> --horas-base <n> [--time-size <n>] [--sobrescrever]
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cliente' && args[i + 1]) opts.cliente = args[i + 1];
    if (args[i] === '--timestamp' && args[i + 1]) opts.timestamp = args[i + 1];
    if (args[i] === '--horas-base' && args[i + 1]) opts.horasBase = parseFloat(args[i + 1]);
    if (args[i] === '--time-size' && args[i + 1]) opts.timeSize = parseInt(args[i + 1]);
    if (args[i] === '--sobrescrever') opts.sobrescrever = true;
  }
  return opts;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Arquivo não encontrado: ' + filePath);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fmtMoeda(valor) {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularPrazoDiasUteis(horas, timeSize) {
  const horasPorDia = 6; // considerando 6h produtivas/dia
  return Math.ceil(horas / (horasPorDia * timeSize));
}

function calcularPaybackMeses(custoAutomacao, economiaMensal) {
  if (economiaMensal <= 0) return 'N/A';
  return (custoAutomacao / economiaMensal).toFixed(1);
}

function gerarPlanoMd(dados, cfg, novoCfg) {
  const hb = novoCfg.horasBase;
  const ts = novoCfg.timeSize;
  const custoTotal = Math.round(dados.horasTotaisAjustado * hb);
  const prazoSemanas = Math.ceil(calcularPrazoDiasUteis(dados.horasTotaisAjustado, ts) / 5);
  const custoManualAno = 2.5 * 20 * hb; // 2.5h/sprint * 20 sprints
  const economiaSprint = (2.5 * 60 - 20) / 60; // horas manual - horas auto
  const economiaMensal = economiaSprint * 4 * hb; // ~4 sprints/mes
  const payback = calcularPaybackMeses(custoTotal + dados.horasManutencaoAnual * hb, economiaMensal);

  return `# Plano Estratégico de Automação de Testes

**Cliente/Sistema:** ${dados.sistema} — ${dados.url}
**Data da Avaliação:** ${cfg.timestamp}
**Avaliador:** BugKillers QA Agent
**Veredito:** ${dados.veredito}

---

## 1. Resumo Executivo

| Métrica | Valor |
|---|---|
| Módulos mapeados | ${dados.modulos.length} |
| Score médio de automatizabilidade | ${dados.scoreMedio}/100 |
| Veredito | ${dados.veredito} |
| Horas totais estimadas (Q2 — Core) | ${dados.horasTotaisAjustado}h |
| Custo total estimado | ${fmtMoeda(custoTotal)} |
| Prazo estimado | ${prazoSemanas} semanas |
| Payback estimado | ${payback} meses |

**Recomendação principal:** ${dados.recomendacaoPrincipal}

---

## 2. Módulo Central (Core)

- **Nome:** ${dados.core.nome}
- **Justificativa:** ${dados.core.justificativa}
- **Fluxos críticos:**
${dados.core.fluxos.map(f => '  ' + f).join('\n')}
- **Evidência:** ${dados.core.evidencia}

---

## 3. Score de Automatizabilidade por Módulo

| Módulo | Score | Classificação | IDs (%) | Data-testid (%) | Estabilidade | Dados | Ambiente |
|---|---|---|---|---|---|---|---|
${dados.modulos.map(m => `| ${m.nome} | ${m.score} | ${m.classificacao} | ${m.detalhes.pctIdEstavel}% | ${m.detalhes.pctTestId}% | ${m.detalhes.loadingEstavel ? 'Sim' : 'Não'} | ${m.detalhes.massaViaApi ? 'Sim' : 'Não'} | ${m.detalhes.ambienteEstavel ? 'Sim' : 'Não'} |`).join('\n')}

**Nota:** Todos os módulos estão na faixa "Regular" (40-59). A principal limitação é a ausência de \`data-testid\` e a falta de indicadores de loading estáveis.

---

## 4. Matriz de Prioridade

### Q2 — Core Estratégico (Automatizar DEPOIS)
| Módulo | Valor Negócio | Fácilidade | Horas Est. | Custo |
|---|---|---|---|---|
${dados.modulos.filter(m => m.quadrante === 'Q2').map(m => {
  const custo = Math.round(m.horasAjustado * hb);
  return `| ${m.nome} | ${m.valorNegocio} | ${m.facilidade} | ${m.horasAjustado}h | ${fmtMoeda(custo)} |`;
}).join('\n')}

### Q3 — Oportunidades (Se sobrar tempo)
| Módulo | Valor Negócio | Fácilidade | Horas Est. | Custo |
|---|---|---|---|---|
${dados.modulos.filter(m => m.quadrante === 'Q3').map(m => {
  const custo = Math.round(m.horasAjustado * hb);
  return `| ${m.nome} | ${m.valorNegocio} | ${m.facilidade} | ${m.horasAjustado}h | ${fmtMoeda(custo)} |`;
}).join('\n')}

### Q4 — Depriorizar (Não automatizar agora)
| Módulo | Motivo |
|---|---|
${dados.modulos.filter(m => m.quadrante === 'Q4').map(m => `| ${m.nome} | ${m.motivoDepriorizar} |`).join('\n')}

---

## 5. Estimativa Detalhada

${dados.modulos.filter(m => m.quadrante === 'Q2' || m.quadrante === 'Q1').map(m => {
  const custo = Math.round(m.horasAjustado * hb);
  const prazo = calcularPrazoDiasUteis(m.horasAjustado, ts);
  return `### Estimativa por Módulo: ${m.nome}
- **Complexidade média dos cenários:** ${m.complexidade}
- **Quantidade de cenários estimados:** ${m.cenarios}
- **Horas por cenário:** ${(m.horasAjustado / m.cenarios).toFixed(1)}h
- **Horas totais (bruto):** ${m.horasBruto}h
- **Multiplicadores aplicados:** ${m.multiplicadores.join(', ')}
- **Horas totais (ajustado):** ${m.horasAjustado}h
- **Custo total (R$):** ${fmtMoeda(custo)} (@ ${fmtMoeda(hb)}/hora — valor ilustrativo; ajuste conforme realidade da equipe)
- **Prazo com ${ts} QA(s):** ${prazo} dias úteis
`;
}).join('\n')}

---

## 6. Bloqueadores Técnicos

| Bloqueador | Severidade | Impacto na Estimativa | Ação Sugerida | Responsável | Prazo |
|---|---|---|---|---|---|
${dados.bloqueadores.map(b => `| ${b.nome} | ${b.severidade} | ${b.impacto} | ${b.acao} | ${b.responsavel} | ${b.prazo} |`).join('\n')}

---

## 7. Plano de Execução

### Fase A: Quick Wins (Semanas 1-2)
- **Objetivo:** ${dados.plano.faseA.objetivo}
- **Módulos:** ${dados.plano.faseA.modulos}
- **Horas estimadas:** ${dados.plano.faseA.horas}h
- **Entregável:** ${dados.plano.faseA.entregavel}

### Fase B: Core Estratégico (Semanas 3-${3 + prazoSemanas})
- **Objetivo:** ${dados.plano.faseB.objetivo}
- **Módulos:** ${dados.plano.faseB.modulos}
- **Horas estimadas:** ${dados.plano.faseB.horas}h
- **Entregável:** ${dados.plano.faseB.entregavel}

### Fase D: Manutenção Contínua
- **Horas/sprint:** 6-10h
- **Manutenção anual estimada:** ${dados.horasManutencaoAnual}h (${fmtMoeda(dados.horasManutencaoAnual * hb)})

---

## 8. ROI Estimado

> **Aviso:** Esta seção é uma estimativa ilustrativa. O valor hora usado é ${fmtMoeda(hb)}.

### Cenário Atual (Manual)
- **Cenários manuais por sprint:** 10
- **Tempo médio por cenário manual:** 15 minutos
- **Horas gastas em teste manual/sprint:** 2.5h
- **Custo manual/ano (R$):** ${fmtMoeda(custoManualAno)}

### Cenário com Automação
- **Cenários automatizados:** ${dados.cenariosAutomatizados}
- **Horas investidas em automação:** ${dados.horasTotaisAjustado}h
- **Custo de automação (R$):** ${fmtMoeda(custoTotal)}
- **Tempo de execução automatizado/sprint:** 20 minutos
- **Economia de horas/sprint:** ${economiaSprint.toFixed(1)}h
- **Payback (meses):** ${payback}
- **Economia anual estimada (após payback):** ${fmtMoeda(economiaMensal * 12 - dados.horasManutencaoAnual * hb)}

---

## 9. Recomendações Finais

${dados.recomendacoes.map((r, i) => `${i + 1}. **${r.prazo}:** ${r.texto}`).join('\n')}

---

## Anexos

- Screenshots: \`resultado/${cfg.timestamp}/screenshots/\`
- Dados brutos: \`resultado/${cfg.timestamp}/dados_brutos/\`
- Mapa do sistema: \`../estado/mapa.md\`
- Fluxos críticos: \`../estado/fluxos.md\`
`;
}

async function gerarPdf(mdPath, pdfPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const html = marked(md);
  const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; }
h2 { color: #2c5282; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; }
h3 { color: #2b6cb0; margin-top: 24px; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; }
th, td { border: 1px solid #cbd5e0; padding: 8px; text-align: left; }
th { background: #edf2f7; font-weight: bold; }
tr:nth-child(even) { background: #f7fafc; }
code { background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 90%; }
pre { background: #edf2f7; padding: 12px; border-radius: 6px; overflow-x: auto; }
blockquote { border-left: 4px solid #4299e1; margin: 0; padding-left: 16px; color: #4a5568; }
ul, ol { margin: 8px 0; padding-left: 24px; }
</style>
</head><body>${html}</body></html>`;

  const tmpHtml = mdPath.replace('.md', '_tmp.html');
  fs.writeFileSync(tmpHtml, fullHtml, 'utf8');

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + path.resolve(tmpHtml).replace(/\\/g, '/'));
  await page.waitForTimeout(1000);
  await page.pdf({ path: pdfPath, format: 'A4', margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, printBackground: true });
  await browser.close();
  fs.unlinkSync(tmpHtml);
  console.log('PDF gerado: ' + pdfPath);
}

async function main() {
  const opts = parseArgs();
  if (!opts.cliente || !opts.timestamp || !opts.horasBase) {
    console.error('Uso: node refazer-relatorios.js --cliente <id> --timestamp <YYYY-MM-DD_HHMM> --horas-base <n> [--time-size <n>] [--sobrescrever]');
    process.exit(1);
  }

  const baseDir = path.resolve(__dirname, '..', 'clients', opts.cliente);
  const resultadoDir = path.join(baseDir, 'resultado', opts.timestamp);
  const dadosBrutosDir = path.join(resultadoDir, 'dados_brutos');
  const entregaveisDir = path.join(baseDir, 'entregaveis', 'automacao', 'playwright');

  if (!fs.existsSync(dadosBrutosDir)) {
    console.error('Dados brutos não encontrados: ' + dadosBrutosDir);
    process.exit(1);
  }

  const configOriginal = loadJson(path.join(dadosBrutosDir, 'config_execucao.json'));
  const scores = loadJson(path.join(dadosBrutosDir, 'scores_automatizabilidade.json'));

  // Recalcular com novos valores
  const novoConfig = {
    ...configOriginal,
    horasBase: opts.horasBase,
    timeSize: opts.timeSize || configOriginal.timeSize || 1,
    horasBaseRecalculado: true,
    horasBaseOriginal: configOriginal.horasBase,
    timestampRecalculo: new Date().toISOString()
  };

  // Construir dados consolidados a partir dos scores
  const modulos = scores.modulos.map(m => ({
    ...m,
    valorNegocio: m.valorNegocio || 3,
    facilidade: m.facilidade || 3,
    quadrante: m.quadrante || 'Q3',
    complexidade: m.complexidade || 'Médio',
    cenarios: m.cenarios || 8,
    horasBruto: m.horasBruto || Math.round(m.cenarios * 5.5),
    multiplicadores: m.multiplicadores || ['Sem IDs/data-testid (+25%)', 'Sem API (+20%)'],
    horasAjustado: m.horasAjustado || Math.round((m.cenarios * 5.5) * 1.45),
    motivoDepriorizar: m.motivoDepriorizar || 'Baixo valor + mesma complexidade. ROI negativo.'
  }));

  const horasTotaisAjustado = modulos.filter(m => m.quadrante === 'Q2' || m.quadrante === 'Q1').reduce((s, m) => s + m.horasAjustado, 0);
  const scoreMedio = Math.round(modulos.reduce((s, m) => s + m.score, 0) / modulos.length);
  const horasManutencaoAnual = Math.round(horasTotaisAjustado * 0.25);

  const dados = {
    sistema: configOriginal.sistema || 'GNIweb',
    url: configOriginal.url || '',
    veredito: scoreMedio >= 60 ? 'Viável' : scoreMedio >= 30 ? 'Parcialmente Viável' : 'Não Viável',
    scoreMedio,
    modulos,
    horasTotaisAjustado,
    horasManutencaoAnual,
    cenariosAutomatizados: modulos.filter(m => m.quadrante === 'Q2' || m.quadrante === 'Q1').reduce((s, m) => s + m.cenarios, 0),
    core: configOriginal.core || { nome: 'Comercial', justificativa: 'Módulo central de vendas', fluxos: ['Cadastro de pedidos', 'Liberação', 'Faturamento'], evidencia: 'resultado/' + opts.timestamp + '/screenshots/form_pedido_vendas.png' },
    recomendacaoPrincipal: 'Iniciar pelo módulo Comercial (core de vendas).',
    bloqueadores: configOriginal.bloqueadores || [
      { nome: 'Ausência total de data-testid', severidade: 'Alta', impacto: '+25% de manutenção', acao: 'Adicionar data-testid nos elementos principais', responsavel: 'Time de Dev', prazo: '2 semanas' },
      { nome: 'IDs GeneXus não semânticos', severidade: 'Média', impacto: '+15% de manutenção', acao: 'Documentar padrão de IDs', responsavel: 'Time de Dev', prazo: 'Contínuo' },
      { nome: 'Sem API REST documentada', severidade: 'Média', impacto: '+20% de horas', acao: 'Criar endpoints de teste', responsavel: 'Time de Dev / QA', prazo: '1 mês' }
    ],
    plano: configOriginal.plano || {
      faseA: { objetivo: 'Smoke tests de login e navegação', modulos: 'Transversal', horas: 20, entregavel: 'Suite de smoke tests' },
      faseB: { objetivo: 'Automatizar módulo central (Comercial)', modulos: 'Comercial, Estoque, Financeiro', horas: horasTotaisAjustado, entregavel: 'Cobertura do fluxo principal de negócio' }
    },
    recomendacoes: [
      { prazo: 'Imediata', texto: 'Adicionar data-testid nos elementos críticos do fluxo de pedidos.' },
      { prazo: 'Curto prazo', texto: 'Documentar o padrão de IDs GeneXus usado no projeto.' },
      { prazo: 'Médio prazo', texto: 'Avaliar a criação de uma API de testes para setup/teardown de dados.' },
      { prazo: 'Contínuo', texto: 'Executar /explorar completo para o módulo Comercial antes de iniciar a automação.' }
    ]
  };

  // Atualizar config_execucao.json
  fs.writeFileSync(path.join(dadosBrutosDir, 'config_execucao.json'), JSON.stringify(novoConfig, null, 2), 'utf8');

  // Sufixo dos arquivos
  const sufixo = opts.sobrescrever ? '' : `_${opts.horasBase}`;
  const ts = opts.timestamp;

  // Gerar Plano
  const planoMdPath = path.join(resultadoDir, `automacao_plano_${ts}${sufixo}.md`);
  fs.writeFileSync(planoMdPath, gerarPlanoMd(dados, configOriginal, novoConfig), 'utf8');
  await gerarPdf(planoMdPath, planoMdPath.replace('.md', '.pdf'));

  // Gerar Estimativa simplificada
  const estMdPath = path.join(resultadoDir, `automacao_estimativa_${ts}${sufixo}.md`);
  const estMd = `# Estimativa Detalhada de Automação — ${dados.sistema}\n\n**Data:** ${ts}\n**Sistema:** ${dados.sistema}\n**Valor Hora:** ${fmtMoeda(novoConfig.horasBase)} *(valor ilustrativo — ajuste conforme realidade da equipe)*\n**Time Size:** ${novoConfig.timeSize} QA(s)\n**Recalculado em:** ${novoConfig.timestampRecalculo}\n\n---\n\n## 1. Resumo Consolidado por Módulo\n\n| Módulo | Score | Quadrante | Cenários | Horas Bruto | Multiplicadores | Horas Ajustado | Custo |\n|---|---|---|---|---|---|---|---|\n${modulos.map(m => `| ${m.nome} | ${m.score} | ${m.quadrante} | ${m.cenarios} | ${m.horasBruto}h | ${m.multiplicadores.join('; ')} | ${m.horasAjustado}h | ${fmtMoeda(m.horasAjustado * novoConfig.horasBase)} |`).join('\n')}\n\n**Totais Q2 (Core):** ${modulos.filter(m => m.quadrante === 'Q2').length} módulos | ${modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0)}h | **${fmtMoeda(modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0) * novoConfig.horasBase)}**\n\n---\n\n## 2. Cronograma Semana a Semana\n\n| Semana | Fase | Módulo(s) | Horas | Entregável |\n|---|---|---|---|---|\n| 1-2 | Preparação | Transversal | 20h | Ambiente configurado, smoke tests |\n| 3+ | Core | Comercial, Estoque, Financeiro | ${dados.horasTotaisAjustado}h | Cobertura do fluxo principal |\n\n---\n\n## 3. Custos Detalhados\n\n| Item | Horas | Valor Unit. | Total |\n|---|---|---|---|\n${modulos.filter(m => m.quadrante === 'Q2').map(m => `| ${m.nome} | ${m.horasAjustado}h | ${fmtMoeda(novoConfig.horasBase)} | ${fmtMoeda(m.horasAjustado * novoConfig.horasBase)} |`).join('\n')}\n| **Subtotal Q2** | **${modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0)}h** | | **${fmtMoeda(modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0) * novoConfig.horasBase)}** |\n\n### Manutenção Anual\n| Item | Cálculo | Valor |\n|---|---|---|\n| Manutenção (25% do investimento Q2) | ${Math.round(modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0) * 0.25)}h | ${fmtMoeda(Math.round(modulos.filter(m => m.quadrante === 'Q2').reduce((s, m) => s + m.horasAjustado, 0) * 0.25) * novoConfig.horasBase)} |\n\n---\n\n*Este relatório foi recalculado a partir da análise original de ${ts}.*\n`;
  fs.writeFileSync(estMdPath, estMd, 'utf8');
  await gerarPdf(estMdPath, estMdPath.replace('.md', '.pdf'));

  // Copiar para entregaveis
  if (!fs.existsSync(entregaveisDir)) fs.mkdirSync(entregaveisDir, { recursive: true });
  fs.copyFileSync(planoMdPath, path.join(entregaveisDir, path.basename(planoMdPath)));
  fs.copyFileSync(planoMdPath.replace('.md', '.pdf'), path.join(entregaveisDir, path.basename(planoMdPath.replace('.md', '.pdf'))));
  fs.copyFileSync(estMdPath, path.join(entregaveisDir, path.basename(estMdPath)));
  fs.copyFileSync(estMdPath.replace('.md', '.pdf'), path.join(entregaveisDir, path.basename(estMdPath.replace('.md', '.pdf'))));

  console.log('\n✅ Relatórios recalculados com sucesso!');
  console.log('Novo valor hora:', fmtMoeda(novoConfig.horasBase));
  console.log('Time size:', novoConfig.timeSize);
  console.log('Arquivos em:', resultadoDir);
  console.log('Entregáveis em:', entregaveisDir);
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
