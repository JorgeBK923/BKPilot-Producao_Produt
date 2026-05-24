#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SKILLS_DIR = path.resolve(ROOT, '..', 'BKPilot-Skills');
const SKILLS_DIR = path.resolve(process.env.BKPILOT_SKILLS_DIR || DEFAULT_SKILLS_DIR);

const AREAS = new Set(['mobile']);
const area = process.argv[2] || 'mobile';

if (!AREAS.has(area)) {
  console.error(`Unsupported area: ${area}`);
  console.error('Usage: node scripts/sync-shared-skills.js mobile');
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source file: ${src}`);
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return path.relative(ROOT, dest);
}

function listMarkdown(dir, pattern) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing source directory: ${dir}`);
  }
  return fs.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort();
}

function syncMobile() {
  const copied = [];
  const srcDir = path.join(SKILLS_DIR, 'src');
  const mobileSkills = listMarkdown(srcDir, /-mobile-.*\.md$/);

  for (const fileName of mobileSkills) {
    copied.push(copyFile(
      path.join(srcDir, fileName),
      path.join(ROOT, 'src', fileName)
    ));
  }

  for (const target of ['claude', 'codex', 'opencode']) {
    const distDir = path.join(SKILLS_DIR, 'dist', target);
    for (const fileName of listMarkdown(distDir, /-mobile-.*\.md$/)) {
      copied.push(copyFile(
        path.join(distDir, fileName),
        path.join(ROOT, 'dist', target, fileName)
      ));
    }
  }

  const claudeDistDir = path.join(SKILLS_DIR, 'dist', 'claude');
  for (const fileName of listMarkdown(claudeDistDir, /-mobile-.*\.md$/)) {
    copied.push(copyFile(
      path.join(claudeDistDir, fileName),
      path.join(ROOT, '.claude', 'commands', fileName)
    ));
  }

  copied.push(copyFile(
    path.join(SKILLS_DIR, 'converter', 'tools_map.yaml'),
    path.join(ROOT, 'converter', 'tools_map.yaml')
  ));

  return copied;
}

try {
  if (!fs.existsSync(SKILLS_DIR)) {
    throw new Error(`BKPilot-Skills not found: ${SKILLS_DIR}`);
  }

  const copied = syncMobile();
  console.log(`Synced ${copied.length} files from ${SKILLS_DIR}`);
  for (const filePath of copied) {
    console.log(`- ${filePath}`);
  }
} catch (err) {
  console.error(`Sync failed: ${err.message}`);
  process.exit(1);
}
