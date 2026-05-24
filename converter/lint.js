const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const VALID_TYPES = ['pure_llm', 'script', 'interactive', 'hybrid'];
const VALID_HINTS = ['strong', 'balanced', 'cheap', 'any'];

function lintSkill(skill, { toolsMapPath, blocksDir, sharedScriptsDir }) {
  const errors = [];
  const warnings = [];

  if (!VALID_TYPES.includes(skill.type)) {
    errors.push(`type "${skill.type}" inválido. Válidos: ${VALID_TYPES.join(', ')}`);
  }

  if (skill.provider_hint && !VALID_HINTS.includes(skill.provider_hint)) {
    errors.push(`provider_hint "${skill.provider_hint}" inválido. Válidos: ${VALID_HINTS.join(', ')}`);
  }

  let toolsMap = {};
  if (fs.existsSync(toolsMapPath)) {
    toolsMap = yaml.load(fs.readFileSync(toolsMapPath, 'utf8')) || {};
  }

  for (const tool of skill.tools_required) {
    if (!toolsMap[tool]) {
      warnings.push(`tool "${tool}" não encontrado em tools_map.yaml`);
    }
  }

  for (const block of skill.inject_blocks) {
    const blockPath = path.join(blocksDir, `${block}.md`);
    if (!fs.existsSync(blockPath)) {
      errors.push(`inject_block "${block}" não encontrado em ${blocksDir}/`);
    }
  }

  for (const script of skill.scripts) {
    if (!fs.existsSync(script)) {
      warnings.push(`script "${script}" não encontrado`);
    }
  }

  if (!skill.body || skill.body.length < 50) {
    warnings.push(`corpo da skill muito curto (${skill.body.length} chars)`);
  }

  const targets = skill.targets || {};
  if (Object.keys(targets).length === 0) {
    warnings.push('nenhum target declarado — skill será renderizada para todos os targets');
  }

  const unresolvedVars = skill.body.match(/\{\{[^}]+\}\}/g) || [];
  for (const v of unresolvedVars) {
    if (!v.includes('tool(') && !v.includes('block(')) {
      // Variables like {{timestamp}}, {{url}} are OK — resolved at runtime
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}

module.exports = { lintSkill };
