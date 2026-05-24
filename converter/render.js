#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');
const { parseSkill, loadAllSkills } = require('./parser');
const { lintSkill } = require('./lint');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');
const SHARED_DIR = path.join(ROOT, 'shared');
const BLOCKS_DIR = path.join(SHARED_DIR, 'blocks');
const TOOLS_MAP_PATH = path.join(__dirname, 'tools_map.yaml');
const MANIFEST_PATH = path.join(ROOT, '.build_manifest.json');

const TARGETS = {
  claude: require('./targets/claude'),
  opencode: require('./targets/opencode'),
  codex: require('./targets/codex')
};

function loadBlocks() {
  const blocks = {};
  if (!fs.existsSync(BLOCKS_DIR)) return blocks;
  for (const file of fs.readdirSync(BLOCKS_DIR)) {
    if (file.endsWith('.md')) {
      const name = path.basename(file, '.md');
      blocks[name] = fs.readFileSync(path.join(BLOCKS_DIR, file), 'utf8');
    }
  }
  return blocks;
}

function loadToolsMap() {
  if (!fs.existsSync(TOOLS_MAP_PATH)) return {};
  return yaml.load(fs.readFileSync(TOOLS_MAP_PATH, 'utf8')) || {};
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { generated_at: null, converter_version: '1.0.0', skills: {} };
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function saveManifest(manifest) {
  manifest.generated_at = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

function renderSkill(skill, targetName, { blocks, toolsMap }) {
  const target = TARGETS[targetName];
  if (!target) {
    console.error(`❌ Target desconhecido: ${targetName}`);
    return null;
  }

  const targets = skill.targets || {};
  if (targets[targetName] && targets[targetName].supported === false) {
    console.log(`  ⏭️  ${skill.id} → ${targetName}: skipped (supported: false)`);
    return null;
  }

  const output = target.render(skill, { blocks, toolsMap });
  const outputPath = target.getOutputPath(skill, DIST_DIR);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');

  return { outputPath, content: output };
}

function runLint(skills) {
  const blocks = loadBlocks();
  const toolsMap = loadToolsMap();
  let hasErrors = false;

  console.log('\n🔍 Lint\n');
  for (const skill of skills) {
    const result = lintSkill(skill, {
      toolsMapPath: TOOLS_MAP_PATH,
      blocksDir: BLOCKS_DIR,
      sharedScriptsDir: path.join(SHARED_DIR, 'scripts')
    });

    const prefix = result.valid ? '✅' : '❌';
    console.log(`${prefix} ${skill.id} (${skill.type})`);

    for (const err of result.errors) {
      console.log(`   ❌ ${err}`);
      hasErrors = true;
    }
    for (const warn of result.warnings) {
      console.log(`   ⚠️  ${warn}`);
    }
  }
  return !hasErrors;
}

function runBuild(skills, targetFilter) {
  const blocks = loadBlocks();
  const toolsMap = loadToolsMap();
  const manifest = loadManifest();
  const targetsToRender = targetFilter ? [targetFilter] : Object.keys(TARGETS);

  console.log('\n🔨 Build\n');

  let rendered = 0;
  let skipped = 0;

  for (const skill of skills) {
    const srcHash = hash(fs.readFileSync(skill.sourcePath, 'utf8'));

    if (!manifest.skills[skill.id]) {
      manifest.skills[skill.id] = { src_hash: null, targets: {} };
    }

    const cached = manifest.skills[skill.id];
    const sourceChanged = cached.src_hash !== srcHash;

    for (const targetName of targetsToRender) {
      const targetEntry = cached.targets[targetName];

      if (!sourceChanged && targetEntry?.status === 'ok') {
        const outputPath = path.join(ROOT, targetEntry.output);
        if (fs.existsSync(outputPath)) {
          const actualDistHash = hash(fs.readFileSync(outputPath, 'utf8'));
          if (actualDistHash === targetEntry.dist_hash) {
            console.log(`  ⏩ ${skill.id} → ${targetName}: unchanged`);
            skipped++;
            continue;
          }
        }
      }

      const result = renderSkill(skill, targetName, { blocks, toolsMap });
      if (result) {
        const distHash = hash(result.content);
        cached.targets[targetName] = {
          dist_hash: distHash,
          status: 'ok',
          output: path.relative(ROOT, result.outputPath)
        };
        console.log(`  ✅ ${skill.id} → ${targetName}: ${path.relative(ROOT, result.outputPath)}`);
        rendered++;
      } else {
        cached.targets[targetName] = {
          dist_hash: null,
          status: 'skipped',
          reason: 'supported: false'
        };
        skipped++;
      }
    }

    cached.src_hash = srcHash;
  }

  saveManifest(manifest);
  console.log(`\n📊 ${rendered} renderizados, ${skipped} pulados`);
  console.log(`📄 Manifest: .build_manifest.json\n`);
}

function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skill') flags.skill = args[++i];
    else if (args[i] === '--target') flags.target = args[++i];
    else if (args[i] === '--lint') flags.lint = true;
    else if (args[i] === '--build-all') flags.buildAll = true;
    else if (args[i] === '--watch') flags.watch = true;
    else if (args[i] === '--list') flags.list = true;
  }

  if (Object.keys(flags).length === 0) {
    console.log(`
BugKillers Skill Converter v1.0

Uso:
  node converter/render.js --list                     Lista skills em /src
  node converter/render.js --lint                     Valida todas as skills
  node converter/render.js --skill <id> --target <t>  Renderiza uma skill
  node converter/render.js --build-all                Renderiza tudo
  node converter/render.js --watch                    Watch mode

Targets: claude, opencode, codex
`);
    return;
  }

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Diretório /src não encontrado: ${SRC_DIR}`);
    process.exit(1);
  }

  let skills;
  if (flags.skill) {
    const filePath = path.join(SRC_DIR, `${flags.skill}.md`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Skill não encontrada: ${filePath}`);
      process.exit(1);
    }
    skills = [parseSkill(filePath)];
  } else {
    skills = loadAllSkills(SRC_DIR);
  }

  if (flags.list) {
    console.log(`\n📋 Skills em /src (${skills.length})\n`);
    for (const s of skills) {
      const targets = Object.entries(s.targets || {})
        .map(([k, v]) => `${k}:${v.supported ? '✅' : '❌'}`)
        .join(' ');
      console.log(`  ${s.id.padEnd(22)} ${s.type.padEnd(14)} ${s.provider_hint.padEnd(10)} ${targets}`);
    }
    console.log('');
    return;
  }

  if (flags.lint) {
    const ok = runLint(skills);
    process.exit(ok ? 0 : 1);
  }

  if (flags.buildAll || flags.skill) {
    runLint(skills);
    runBuild(skills, flags.target || null);
  }

  if (flags.watch) {
    const chokidar = require('chokidar');
    console.log('\n👀 Watch mode — observando /src e /shared\n');
    const watcher = chokidar.watch([SRC_DIR, SHARED_DIR], { ignoreInitial: true });
    watcher.on('change', (filePath) => {
      console.log(`\n🔄 Mudança detectada: ${path.relative(ROOT, filePath)}`);
      const freshSkills = loadAllSkills(SRC_DIR);
      runBuild(freshSkills, flags.target || null);
    });
  }
}

main();
