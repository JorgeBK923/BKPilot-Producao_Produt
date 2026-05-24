const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '../documentacao_projeto');

const replacements = [
  // Padrões mais específicos primeiro
  { from: /`resultado\/latest\//g, to: '`clients/<id>/resultado/latest/' },
  { from: /`resultado\/<timestamp>\//g, to: '`clients/<id>/resultado/<timestamp>/' },
  { from: /`resultado\/<client>\//g, to: '`clients/<id>/resultado/' },
  { from: /`estado\/<client>\//g, to: '`clients/<id>/estado/' },
  { from: /`estado\//g, to: '`clients/<id>/estado/' },
  { from: /`entregaveis\/<cliente>\//g, to: '`clients/<id>/entregaveis/' },
  { from: /resultado\/<timestamp>\/governanca\//g, to: 'clients/<id>/resultado/<timestamp>/governanca/' },
  { from: /resultado\/tega\//g, to: 'clients/tega/resultado/' },
  { from: /resultado\/cliente-01\//g, to: 'clients/cliente-01/resultado/' },
  
  // Em textos explicativos
  { from: /em `resultado\//g, to: "em `clients/<id>/resultado/" },
  { from: /em `estado\//g, to: "em `clients/<id>/estado/" },
  { from: /em `entregaveis\//g, to: "em `clients/<id>/entregaveis/" },
  
  // Estrutura de pastas em blocos de código/texto
  { from: /resultado\/\n/g, to: 'clients/<id>/resultado/\n' },
  { from: /estado\/\n/g, to: 'clients/<id>/estado/\n' },
  { from: /entregaveis\/\n/g, to: 'clients/<id>/entregaveis/\n' },
  
  // No Guia plano-automacao específico
  { from: /resultado\/<timestamp>\/automacao_/g, to: 'clients/<id>/resultado/<timestamp>/automacao_' },
  { from: /resultado\/<timestamp>\/screenshots\//g, to: 'clients/<id>/resultado/<timestamp>/screenshots/' },
  { from: /resultado\/2026-/g, to: 'clients/<id>/resultado/2026-' },
  { from: /ls resultado\//g, to: 'ls clients/<id>/resultado/' },
  { from: /cat resultado\//g, to: 'cat clients/<id>/resultado/' },
  
  // Comandos tar
  { from: /tar .* resultado\//g, to: (match) => match.replace('resultado/', 'clients/<id>/resultado/') },
  { from: /du -sh resultado\//g, to: 'du -sh clients/<id>/resultado/' },
  { from: /find resultado\//g, to: 'find clients/<id>/resultado/' },
  
  // Especificação técnica
  { from: /estado\/<client>\//g, to: 'clients/<id>/estado/' },
  { from: /resultado\/<client>\//g, to: 'clients/<id>/resultado/' },
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const rep of replacements) {
    if (typeof rep.to === 'function') {
      content = content.replace(rep.from, rep.to);
    } else {
      content = content.replace(rep.from, rep.to);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Atualizado: ' + path.basename(filePath));
    return true;
  }
  console.log('⏭️  Sem alterações: ' + path.basename(filePath));
  return false;
}

const files = fs.readdirSync(DOCS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(DOCS_DIR, f));

let updated = 0;
for (const file of files) {
  if (updateFile(file)) updated++;
}

console.log('\n📊 Resumo: ' + updated + ' de ' + files.length + ' arquivos atualizados.');
