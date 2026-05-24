const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

function parseSkill(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content: body } = matter(raw);

  if (!frontmatter.id) {
    throw new Error(`Skill sem "id" no frontmatter: ${filePath}`);
  }
  if (!frontmatter.name) {
    throw new Error(`Skill sem "name" no frontmatter: ${filePath}`);
  }
  if (!frontmatter.type) {
    throw new Error(`Skill sem "type" no frontmatter: ${filePath}`);
  }

  return {
    id: frontmatter.id,
    name: frontmatter.name,
    type: frontmatter.type,
    language: frontmatter.language || 'pt-BR',
    targets: frontmatter.targets || {},
    scripts: frontmatter.scripts || [],
    tools_required: frontmatter.tools_required || [],
    inject_blocks: frontmatter.inject_blocks || [],
    inputs: frontmatter.inputs || [],
    provider_hint: frontmatter.provider_hint || 'balanced',
    frontmatter,
    body: body.trim(),
    sourcePath: filePath
  };
}

function loadAllSkills(srcDir) {
  const skills = [];
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(srcDir, file);
    try {
      skills.push(parseSkill(filePath));
    } catch (err) {
      console.error(`❌ Erro ao parsear ${file}: ${err.message}`);
    }
  }
  return skills;
}

module.exports = { parseSkill, loadAllSkills };
