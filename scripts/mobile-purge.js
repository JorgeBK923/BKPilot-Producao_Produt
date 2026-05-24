#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { ROOT, loadClientMobileConfig } = require('./lib/mobile-appium-client');
const { purgeOldArtifacts } = require('@bugkillers/bkpilot-core/mobile-retention');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [key, inlineValue] = token.slice(2).split('=', 2);
    const next = argv[i + 1];
    if (inlineValue !== undefined) args[key] = inlineValue;
    else if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  if (args.cliente && !args.clientId) args.clientId = args.cliente;
  if (args.client && !args.clientId) args.clientId = args.client;
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('Usage: npm run mobile:purge -- --cliente <id> [--dry-run]');
    process.exit(1);
  }
  const loaded = loadClientMobileConfig(args);
  const retentionDays = Number(args.retentionDays || loaded.mobile?.evidence?.retentionDays || 90);
  const result = purgeOldArtifacts(loaded.clientId, retentionDays, args.dryRun === true || args['dry-run'] === true);
  const logDir = path.join(ROOT, 'clients', loaded.clientId, 'resultado');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, 'retention_purge_latest.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
}

main();
