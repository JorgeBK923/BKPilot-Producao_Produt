const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outArg = process.argv[2];
const outputPath = outArg
  ? path.resolve(outArg)
  : path.join(__dirname, '..', 'documentacao_projeto', 'MVP_BKPilot_Frontend.pdf');

const PAGE = { w: 595.28, h: 841.89 };
const M = { top: 60, bottom: 60, left: 60, right: 60 };
const CONTENT_W = PAGE.w - M.left - M.right;
const BOTTOM_LIMIT = PAGE.h - M.bottom - 30;

const C = {
  primary:    '#1a1a2e',
  accent:     '#e94560',
  heading:    '#16213e',
  subheading: '#0f3460',
  text:       '#222222',
  muted:      '#666666',
  codeBg:     '#1e1e2e',
  codeText:   '#e0e0f0',
  rowAlt:     '#eef2f7',
  border:     '#cccccc',
};

const doc = new PDFDocument({ size: 'A4', margins: M, autoFirstPage: false });
doc.pipe(fs.createWriteStream(outputPath));

let pageNum = 0;

function drawFooter() {
  const y = PAGE.h - 35;
  // desabilita margin.bottom da página para que doc.text() não dispare auto-page
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc.save();
  doc.lineWidth(0.4).strokeColor(C.border)
    .moveTo(M.left, y - 8).lineTo(PAGE.w - M.right, y - 8).stroke();
  doc.fillColor(C.muted).font('Helvetica').fontSize(8);
  doc.text(
    'BugKillers — MVP BKPilot Front-end',
    M.left, y, { width: CONTENT_W / 2, align: 'left', lineBreak: false }
  );
  doc.text(
    `Página ${pageNum}`,
    M.left + CONTENT_W / 2, y,
    { width: CONTENT_W / 2, align: 'right', lineBreak: false }
  );
  doc.restore();

  doc.page.margins.bottom = savedBottom;
  doc.y = M.top;
  doc.fillColor(C.text).font('Helvetica');
}

function newContentPage() {
  doc.addPage();
  pageNum++;
  doc.y = M.top;
  doc.fillColor(C.text);
  drawFooter();
}

function ensure(needed) {
  if (doc.y + needed > BOTTOM_LIMIT) newContentPage();
}

// ── primitivas de conteúdo ───────────────────────────────────────────────────
function sectionTitle(text) {
  ensure(26 + 10 + 90); // keep-with-next
  if (doc.y > M.top + 5) doc.y += 8;
  const y = doc.y;
  doc.rect(M.left, y, CONTENT_W, 26).fill(C.heading);
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12);
  const titleH = doc.heightOfString(text, { width: CONTENT_W - 20 });
  doc.text(text, M.left + 12, y + (26 - titleH) / 2, {
    width: CONTENT_W - 20,
    lineBreak: false,
  });
  doc.y = y + 26 + 10;
  doc.fillColor(C.text);
}

function h2(text) {
  doc.font('Helvetica-Bold').fontSize(11);
  const h = doc.heightOfString(text, { width: CONTENT_W });
  ensure(h + 12 + 60); // keep-with-next
  if (doc.y > M.top + 5) doc.y += 4;
  doc.fillColor(C.subheading).text(text, M.left, doc.y, { width: CONTENT_W });
  doc.y += 4;
  doc.fillColor(C.text);
}

function body(text) {
  doc.font('Helvetica').fontSize(10);
  const h = doc.heightOfString(text, { width: CONTENT_W, align: 'justify', lineGap: 2 });
  ensure(h + 6);
  doc.fillColor(C.text).text(text, M.left, doc.y, {
    width: CONTENT_W, align: 'justify', lineGap: 2,
  });
  doc.y += 6;
}

function bullet(text) {
  const indent = 16;
  doc.font('Helvetica').fontSize(10);
  const h = doc.heightOfString(text, { width: CONTENT_W - indent, lineGap: 2 });
  ensure(h + 4);
  const y = doc.y;
  doc.fillColor(C.accent).text('•', M.left + 4, y, { lineBreak: false });
  doc.fillColor(C.text).text(text, M.left + indent, y, {
    width: CONTENT_W - indent, lineGap: 2,
  });
  doc.y = y + h + 3;
}

function codeBlock(lines) {
  const padV = 10, padH = 12, lineH = 12, fontSize = 8;
  doc.font('Courier').fontSize(fontSize);
  const blockH = padV * 2 + lines.length * lineH;
  ensure(blockH + 8);
  const y = doc.y;
  doc.rect(M.left, y, CONTENT_W, blockH).fill(C.codeBg);
  doc.fillColor(C.codeText).font('Courier').fontSize(fontSize);
  lines.forEach((line, i) => {
    doc.text(line, M.left + padH, y + padV + i * lineH, {
      lineBreak: false,
      width: CONTENT_W - padH * 2,
    });
  });
  doc.y = y + blockH + 8;
  doc.fillColor(C.text).font('Helvetica');
}

function tableHeader(cells, widths) {
  doc.font('Helvetica-Bold').fontSize(9);
  const heights = cells.map((c, i) => doc.heightOfString(c, { width: widths[i] - 8 }));
  const rowH = Math.max(...heights, 14) + 10;
  ensure(rowH + 4);
  const y = doc.y;
  const totalW = widths.reduce((a, b) => a + b, 0);
  doc.rect(M.left, y, totalW, rowH).fill(C.subheading);
  doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
  let cx = M.left;
  cells.forEach((c, i) => {
    doc.text(c, cx + 4, y + 5, { width: widths[i] - 8 });
    cx += widths[i];
  });
  doc.y = y + rowH;
  doc.fillColor(C.text);
}

let tRowAlt = false;
function tableRow(cells, widths) {
  doc.font('Helvetica').fontSize(8.5);
  const heights = cells.map((c, i) =>
    doc.heightOfString(c, { width: widths[i] - 8, lineGap: 1 })
  );
  const rowH = Math.max(...heights, 12) + 8;
  ensure(rowH + 2);
  const y = doc.y;
  const totalW = widths.reduce((a, b) => a + b, 0);
  if (tRowAlt) doc.rect(M.left, y, totalW, rowH).fill(C.rowAlt);
  tRowAlt = !tRowAlt;
  doc.fillColor(C.text).font('Helvetica').fontSize(8.5);
  let cx = M.left;
  cells.forEach((c, i) => {
    doc.text(c, cx + 4, y + 4, { width: widths[i] - 8, lineGap: 1 });
    cx += widths[i];
  });
  doc.lineWidth(0.4).strokeColor(C.border).rect(M.left, y, totalW, rowH).stroke();
  doc.y = y + rowH;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
pageNum = 1;
doc.rect(0, 0, PAGE.w, PAGE.h).fill(C.primary);
doc.rect(0, PAGE.h - 10, PAGE.w, 10).fill(C.accent);
doc.rect(0, 0, 10, PAGE.h).fill(C.accent);

doc.fillColor('white').font('Helvetica-Bold').fontSize(46)
  .text('BKPilot', M.left + 10, 200, { lineBreak: false });

doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(16)
  .text('MVP — Front-end para Demonstração Comercial',
    M.left + 10, 268, { width: CONTENT_W });

doc.fillColor('#9999bb').font('Helvetica').fontSize(11)
  .text('Arquitetura, Proposta Técnica e Plano de Implementação',
    M.left + 10, 305, { width: CONTENT_W });

doc.fillColor('#9999bb').font('Helvetica').fontSize(10)
  .text('Documento gerado para o time comercial e técnico — guia de referência ' +
        'para a construção do produto mínimo viável de demonstração.',
    M.left + 10, 360, { width: CONTENT_W - 20, align: 'left', lineGap: 3 });

doc.fillColor('#666688').font('Helvetica').fontSize(9)
  .text('BugKillers — Setor de Inteligência Artificial',
    M.left + 10, PAGE.h - 80);
doc.fillColor('#555577').font('Helvetica').fontSize(9)
  .text('Abril 2026  |  Documento Confidencial',
    M.left + 10, PAGE.h - 64);

// ─────────────────────────────────────────────────────────────────────────────
// CONTEÚDO
// ─────────────────────────────────────────────────────────────────────────────
newContentPage();

sectionTitle('1. Resumo Executivo');
body(
  'O BKPilot é uma plataforma de QA automatizado baseada em Inteligência Artificial. ' +
  'Hoje opera inteiramente via linha de comando — ideal para times técnicos, mas ' +
  'inviável para demonstrações comerciais a clientes não técnicos.'
);
body(
  'Este documento descreve a proposta de criação de um MVP (Produto Mínimo Viável) com ' +
  'interface web que esconde toda a complexidade técnica, expondo apenas três campos ' +
  'e um botão para o usuário final.'
);

sectionTitle('2. O Problema Atual');
h2('Como funciona hoje');
body('O operador abre o terminal e executa os comandos na seguinte ordem:');
codeBlock([
  '/explorar         -> mapeia o sistema alvo',
  '/gerar-cenarios   -> cria os cenarios de teste',
  '/testar-modulo    -> executa os testes',
  '/reportar-bug     -> documenta os bugs encontrados',
  '/gerar-relatorio  -> gera o relatorio PDF final',
]);
body(
  'Cada skill é um passo do trabalho de QA. O operador precisa conhecer os comandos, ' +
  'entender o output técnico e tomar decisões durante o processo. Isso torna a ' +
  'demonstração comercial impraticável — o cliente veria apenas código rolando na tela.'
);

sectionTitle('3. A Solução Proposta');
h2('3.1  Skill /pipeline-completo');
body(
  'Uma nova skill que encadeia todos os passos em sequência automaticamente. ' +
  'O front-end envia apenas três dados:'
);
bullet('URL do site a ser testado');
bullet('Usuário de login');
bullet('Senha de acesso');
body(
  'E ela executa sozinha: explorar → gerar cenários → testar → reportar bugs → ' +
  'gerar PDF. É o equivalente a um botão "Fazer Tudo" que substitui os 5 comandos manuais.'
);

h2('3.2  Front-end Web (a casca bonita)');
body(
  'Uma tela web simples acessada pelo navegador. O cliente vê apenas um formulário ' +
  'limpo, uma barra de progresso e um botão de download do relatório. Toda a ' +
  'complexidade do Claude Code + skills fica completamente oculta.'
);

sectionTitle('4. Arquitetura na VPS');
h2('Três serviços rodando no servidor');
codeBlock([
  '+-------------------------------------------------------------+',
  '|                          SUA VPS                            |',
  '|                                                             |',
  '|  +------------+    +------------+    +-----------------+    |',
  '|  |  CAIXA 1   |    |  CAIXA 2   |    |    CAIXA 3      |    |',
  '|  |  Front-end | -> |    API     | -> |     Motor       |    |',
  '|  |  (a tela)  | <- | (o garcom) | <- |  Claude Code    |    |',
  '|  |  Next.js   |    |  Node.js   |    |  + Playwright   |    |',
  '|  |  :3000     |    |   :8080    |    |  (background)   |    |',
  '|  +------------+    +------------+    +-----------------+    |',
  '+-------------------------------------------------------------+',
  '          ^                                                    ',
  '          | internet                                           ',
  '     +----+----+                                               ',
  '     | Vendedor|  (abre no browser)                            ',
  '     +---------+                                               ',
]);

h2('Caixa 1 — Front-end (a tela)');
bullet('Tecnologia: Next.js ou React');
bullet('Exibe: formulário (URL, login, senha), barra de progresso, botão "Baixar PDF"');
bullet('Acesso: https://demo.bugkillers.com.br');

h2('Caixa 2 — API (o garçom)');
bullet('Tecnologia: Node.js com Express ou Fastify (~200 linhas de código)');
bullet('Recebe pedidos do front-end e repassa ao motor');
body('Três endpoints expostos:');
codeBlock([
  'POST /executar       -> recebe URL+login+senha, inicia teste, retorna { id }',
  'GET  /status/:id     -> consultado a cada 2s, retorna { etapa, progresso }',
  'GET  /relatorio/:id  -> ao terminar, retorna o PDF para download',
]);

h2('Caixa 3 — Motor (Claude Code rodando escondido)');
bullet('A API cria um processo filho do Claude Code em modo headless (sem interface)');
bullet('Roda a skill /pipeline-completo em background');
bullet('Escreve resultados em resultado/<timestamp>/ — exatamente como hoje');
bullet('A API monitora essa pasta para reportar progresso ao front-end');

sectionTitle('5. Fluxo de uma Demonstração');
body('Passo a passo do que acontece quando o vendedor usa o sistema:');
codeBlock([
  '1. Vendedor abre o browser, preenche os 3 campos e clica "Testar"',
  '2. Front-end envia: POST /executar { url, login, senha }',
  '3. API responde:    { id: "abc123" }  e dispara Claude Code em background',
  '4. Front-end consulta a cada 2s:  GET /status/abc123',
  '   -> { etapa: "Explorando o sistema...",       progresso: 15 }',
  '   -> { etapa: "Gerando cenarios de teste...",  progresso: 35 }',
  '   -> { etapa: "Executando testes...",          progresso: 70 }',
  '   -> { etapa: "Gerando relatorio...",          progresso: 90 }',
  '5. Quando termina:  { etapa: "Concluido", progresso: 100 }',
  '6. Aparece botao "Baixar Relatorio PDF"',
  '7. GET /relatorio/abc123 -> download do PDF gerado',
]);

sectionTitle('6. Flexibilidade de Motor');
body(
  'A API foi pensada para ser "agnóstica" — não sabe qual motor está rodando por baixo. ' +
  'Hoje é Claude Code. Amanhã pode ser outro. O front-end nunca muda. ' +
  'As pastas dist/claude/, dist/codex/ e dist/opencode/ já existem no projeto, ' +
  'confirmando que as skills foram preparadas para múltiplos motores.'
);

const COLS = [105, 130, 130, 110];
tRowAlt = false;
tableHeader(['CLI / Motor', 'Como funciona', 'Vantagem', 'Desvantagem'], COLS);
tableRow(['Claude Code (atual)', 'Roda Opus/Sonnet Anthropic', 'Skills prontas, melhor qualidade', 'Custo por token'], COLS);
tableRow(['Codex CLI (OpenAI)', 'Roda GPT-5', 'Alternativa de custo', 'Skills precisam adaptação'], COLS);
tableRow(['OpenCode', 'Open-source, qualquer modelo', 'Flexível, troca sem mudar código', 'Menos polido'], COLS);
tableRow(['Agent SDK direto', 'Node.js → API Anthropic', 'Controle total, sem CLI', 'Reimplementa orquestração'], COLS);
tableRow(['Modelo local (Ollama)', 'Roda na própria VPS', 'Custo zero por uso', 'Qualidade inferior'], COLS);

doc.y += 8;
body(
  'Analogia: é como um carro elétrico. O motorista dirige o carro (front-end). ' +
  'O motor pode ser bateria da Tesla, BYD ou CATL — o painel é o mesmo. ' +
  'Você troca o motor sem refazer a tela.'
);

sectionTitle('7. Infraestrutura na VPS');
h2('Requisitos mínimos de hardware');
bullet('RAM: mínimo 4 GB (Playwright + Chromium headless consomem memória)');
bullet('CPU: 2 vCPUs');
bullet('Disco: 20 GB (logs, screenshots, PDFs gerados)');
bullet('Sistema operacional: Ubuntu 22.04 LTS recomendado');

h2('Stack de infraestrutura');
bullet('PM2 — mantém front-end e API vivos, reinicia automaticamente em caso de falha');
bullet('Nginx — HTTPS na frente, roteia /  → front-end  e  /api  → API');
bullet('Certbot — certificado SSL gratuito via Let\'s Encrypt');
bullet('Arquivo .env — chaves da API Anthropic e credenciais QA, nunca no repositório');

h2('Configuração Nginx (resumo)');
codeBlock([
  'server {',
  '    server_name demo.bugkillers.com.br;',
  '',
  '    location /api/ {',
  '        proxy_pass http://localhost:8080;',
  '    }',
  '',
  '    location / {',
  '        proxy_pass http://localhost:3000;',
  '    }',
  '}',
]);

sectionTitle('8. Plano de Implementação — MVP em 2 Semanas');
h2('Semana 1');
bullet('Dias 1–2: criar skill /pipeline-completo encadeando as 5 skills existentes');
bullet('Dias 3–4: criar API Node.js com os 3 endpoints e integração com Claude Code');
bullet('Dia 5: testes de integração API ↔ Claude Code na VPS');

h2('Semana 2');
bullet('Dias 6–8: front-end (formulário, barra de progresso, download PDF)');
bullet('Dia 9: configurar Nginx + PM2 + HTTPS na VPS');
bullet('Dia 10: testes end-to-end + ajustes de UX para demo');

h2('Estimativa de esforço por componente');
bullet('Skill /pipeline-completo:  1–2 dias');
bullet('API Node.js:  2–3 dias  (~200 linhas de código)');
bullet('Front-end:  4–5 dias  (~500 linhas de código)');
bullet('Configuração de VPS:  1 dia');
bullet('Total:  ~2 semanas com 1 desenvolvedor');

sectionTitle('9. Analogias para o Time Comercial');
h2('Analogia do Uber');
body(
  'Por baixo do Uber existe algoritmo de roteamento, cálculo de preço dinâmico, ' +
  'GPS em tempo real e sistema de pagamento — tudo extremamente complexo. ' +
  'Mas o usuário só vê: "para onde vai?" e "pedir carro". ' +
  'O BKPilot MVP funciona da mesma forma: toda a complexidade fica escondida ' +
  'atrás de 3 campos e 1 botão.'
);

h2('Analogia do Carro Elétrico');
body(
  'O motorista dirige o carro (front-end). O motor pode ser bateria da Tesla, ' +
  'da BYD ou da CATL — tanto faz para quem dirige. O painel é exatamente o mesmo. ' +
  'Na nossa solução, a API é o "painel": você troca o motor (Claude Code → outro modelo) ' +
  'sem precisar reescrever a tela.'
);

sectionTitle('10. Próximos Passos');
bullet('Validar escopo do MVP com o time comercial');
bullet('Definir URL de demo (ex: demo.bugkillers.com.br)');
bullet('Iniciar desenvolvimento da skill /pipeline-completo');
bullet('Desenvolver API Node.js');
bullet('Desenvolver front-end web');
bullet('Deploy na VPS + configuração de HTTPS');
bullet('Sessão de testes com o time de vendas antes da primeira demonstração');

doc.end();
console.log('PDF gerado:', outputPath);
