// Gera docs/Guia_Pratico_MAIA_Skill_Pack_v2.pdf a partir do pack em docs/maia-skill-pack/.
// Pipeline: concatena README + 12 SKILL.md (ordem) + HANDOFF_TEMPLATE -> HTML (pandoc) -> PDF (Chrome/Edge headless).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const packDir = path.join(root, 'docs', 'maia-skill-pack');
const outPdf = path.join(root, 'docs', 'Guia_Pratico_MAIA_Skill_Pack_v2.pdf');
const tmpMd = path.join(packDir, '_guia_tmp.md');
const tmpHtml = path.join(packDir, '_guia_tmp.html');

function findPandoc() {
  const candidates = [
    path.join(process.env.APPDATA || '', 'npm/node_modules/pandoc-bin/vendor/pandoc.exe'),
    'pandoc',
  ];
  return candidates.find((c) => c === 'pandoc' || fs.existsSync(c)) || 'pandoc';
}

function findBrowser() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error('Nenhum navegador (Chrome/Edge) encontrado para gerar PDF.');
  return found;
}

// 1. Concatenar pack na ordem oficial
const skillDirs = fs
  .readdirSync(packDir)
  .filter((d) => /^\d{2}-maia-/.test(d))
  .sort();

const parts = [];
parts.push(fs.readFileSync(path.join(packDir, 'README.md'), 'utf8'));
for (const d of skillDirs) {
  const skill = path.join(packDir, d, 'SKILL.md');
  if (fs.existsSync(skill)) {
    parts.push('\n\n---\n\n' + fs.readFileSync(skill, 'utf8'));
  }
}
const handoff = path.join(packDir, 'HANDOFF_TEMPLATE.md');
if (fs.existsSync(handoff)) {
  parts.push('\n\n---\n\n# HANDOFF_TEMPLATE\n\n' + fs.readFileSync(handoff, 'utf8'));
}
fs.writeFileSync(tmpMd, parts.join('\n'), 'utf8');

// 2. Markdown -> HTML (pandoc), com CSS embutido
const css = `
body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }
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
`;
const cssFile = path.join(packDir, '_guia_style.css');
fs.writeFileSync(cssFile, css, 'utf8');

execFileSync(findPandoc(), ['-s', '-f', 'markdown', '-t', 'html', '-c', '_guia_style.css', tmpMd, '-o', tmpHtml], {
  stdio: 'pipe',
});

// 3. HTML -> PDF (Chrome/Edge headless)
const browser = findBrowser();
const fileUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');
execFileSync(
  browser,
  ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${outPdf}`, fileUrl],
  { stdio: 'pipe' }
);

// 4. Limpeza
for (const f of [tmpMd, tmpHtml, cssFile]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
const kb = (fs.statSync(outPdf).size / 1024).toFixed(1);
console.log('PDF OK: ' + path.relative(root, outPdf) + ' (' + kb + ' KB)');
