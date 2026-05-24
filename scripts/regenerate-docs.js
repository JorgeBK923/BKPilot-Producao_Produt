const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../documentacao_projeto');

const docs = [
  { name: 'Guia QA', hasPdf: true, hasDocx: true },
  { name: 'Guia QA - Skill plano-automacao', hasPdf: true, hasDocx: true },
  { name: 'Guia QA - Skills de Automacao do Cliente', hasPdf: true, hasDocx: true },
  { name: 'Guia Instalacao VPS', hasPdf: true, hasDocx: true },
  { name: 'Especificacao Tecnica BKPilot v1.5', hasPdf: false, hasDocx: true },
  { name: 'Arquitetura BKPilot', hasPdf: false, hasDocx: true }
];

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error('  Error: ' + e.message.split('\n')[0]);
    return false;
  }
}

for (const doc of docs) {
  const md = path.join(baseDir, doc.name + '.md');
  if (!fs.existsSync(md)) {
    console.log('SKIP (no md): ' + doc.name);
    continue;
  }

  console.log('\n=== ' + doc.name + ' ===');

  if (doc.hasPdf) {
    const pdf = path.join(baseDir, doc.name + '.pdf');
    console.log('  Generating PDF...');
    // Try pandoc with pdf first
    let ok = run(`pandoc -f markdown -t pdf "${md}" -o "${pdf}" --pdf-engine=xelatex`);
    if (!ok) {
      // Fallback: markdown -> html -> pdf via wkhtmltopdf
      const html = path.join(baseDir, doc.name + '_tmp.html');
      run(`pandoc -f markdown -t html "${md}" -o "${html}"`);
      ok = run(`wkhtmltopdf --quiet "${html}" "${pdf}"`);
      if (fs.existsSync(html)) fs.unlinkSync(html);
    }
    if (ok) console.log('  PDF OK');
  }

  if (doc.hasDocx) {
    const docx = path.join(baseDir, doc.name + '.docx');
    console.log('  Generating DOCX...');
    const ok = run(`pandoc -f markdown -t docx "${md}" -o "${docx}"`);
    if (ok) console.log('  DOCX OK');
  }
}

console.log('\nDone.');
