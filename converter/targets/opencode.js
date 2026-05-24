const path = require('path');
const nunjucks = require('nunjucks');

function render(skill, { blocks, toolsMap }) {
  const parts = [];

  parts.push(`<!-- Skill: ${skill.id} | Target: OpenCode -->`);
  parts.push(`<!-- Type: ${skill.type} | Provider: ${skill.provider_hint} -->`);
  parts.push('');

  let body = skill.body;

  for (const toolId of skill.tools_required) {
    const mapping = toolsMap[toolId];
    if (mapping && mapping.opencode) {
      const toolRef = `{{ tool("${toolId}") }}`;
      if (body.includes(toolRef)) {
        body = body.split(toolRef).join(mapping.opencode.template || `[tool:${toolId}]`);
      }
    }
  }

  parts.push(body);

  if (skill.inject_blocks.length > 0) {
    parts.push('\n---\n');
    for (const blockName of skill.inject_blocks) {
      if (blocks[blockName]) {
        parts.push(blocks[blockName]);
        parts.push('');
      }
    }
  }

  return parts.join('\n') + '\n';
}

function getOutputPath(skill, distDir) {
  return path.join(distDir, 'opencode', `${skill.id}.md`);
}

module.exports = { render, getOutputPath, targetName: 'opencode' };
