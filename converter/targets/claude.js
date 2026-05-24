const path = require('path');

function render(skill, { blocks, toolsMap }) {
  const parts = [];

  parts.push(skill.body);

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
  return path.join(distDir, 'claude', `${skill.id}.md`);
}

module.exports = { render, getOutputPath, targetName: 'claude' };
