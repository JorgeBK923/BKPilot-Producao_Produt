const fs = require('fs');
const path = require('path');
const HTMLtoDOCX = require('html-to-docx');
const { marked } = require('marked');

async function mdToDocx(mdPath, docxPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const html = marked(md);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
h1 { color: #1a365d; }
h2 { color: #2c5282; }
h3 { color: #2b6cb0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #cbd5e0; padding: 8px; text-align: left; }
th { background: #edf2f7; }
code { background: #edf2f7; padding: 2px 6px; }
pre { background: #edf2f7; padding: 12px; }
blockquote { border-left: 4px solid #4299e1; padding-left: 16px; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  const docx = await HTMLtoDOCX(fullHtml, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  fs.writeFileSync(docxPath, docx);
  console.log('  DOCX OK: ' + path.basename(docxPath));
}

const baseDir = path.resolve(__dirname, '../documentacao_projeto');

const docs = [
  'Guia QA',
  'Guia QA - Skill plano-automacao',
  'Guia QA - Skills de Automacao do Cliente',
  'Guia Instalacao VPS',
  'Especificacao Tecnica BKPilot v1.5',
  'Arquitetura BKPilot'
];

(async () => {
  for (const doc of docs) {
    const md = path.join(baseDir, doc + '.md');
    const docx = path.join(baseDir, doc + '.docx');
    if (fs.existsSync(md)) {
      console.log('\n=== ' + doc + ' ===');
      try {
        await mdToDocx(md, docx);
      } catch (e) {
        console.error('  ERROR: ' + e.message);
      }
    }
  }
  console.log('\nDone.');
})();
