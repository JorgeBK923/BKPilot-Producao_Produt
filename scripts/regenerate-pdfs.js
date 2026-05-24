const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

async function mdToPdf(mdPath, pdfPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const html = marked(md);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
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
</head>
<body>
${html}
</body>
</html>`;

  const tmpHtml = mdPath.replace('.md', '_tmp.html');
  fs.writeFileSync(tmpHtml, fullHtml, 'utf8');

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + path.resolve(tmpHtml).replace(/\\/g, '/'));
  await page.waitForTimeout(2000);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });
  await browser.close();
  fs.unlinkSync(tmpHtml);
  console.log('  PDF OK: ' + path.basename(pdfPath));
}

const baseDir = path.resolve(__dirname, '../documentacao_projeto');

const docs = [
  'Guia QA',
  'Guia QA - Skill plano-automacao',
  'Guia QA - Skills de Automacao do Cliente',
  'Guia Instalacao VPS'
];

(async () => {
  for (const doc of docs) {
    const md = path.join(baseDir, doc + '.md');
    const pdf = path.join(baseDir, doc + '.pdf');
    if (fs.existsSync(md) && fs.existsSync(pdf)) {
      console.log('\n=== ' + doc + ' ===');
      try {
        await mdToPdf(md, pdf);
      } catch (e) {
        console.error('  ERROR: ' + e.message);
      }
    }
  }
  console.log('\nDone.');
})();
