#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { decodeQrFromArtifacts } = require('./lib/mobile-qr-adapter');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  if (args.cliente && !args.clientId) args.clientId = args.cliente;
  return args;
}

function latestFile(dir, ext) {
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(ext))
    .sort()
    .map((file) => path.join(dir, file))
    .at(-1) || null;
}

function resolveDefaultArtifacts(clientId) {
  const resultDir = path.join(ROOT, 'clients', clientId, 'resultado', 'latest');
  return {
    screenshotPath: latestFile(path.join(resultDir, 'screenshots'), '.png'),
    sourcePath: latestFile(path.join(resultDir, 'mobile', 'sources'), '.xml'),
    cropPath: path.join(resultDir, 'dados_brutos', 'qr_crop.png')
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const defaults = args.clientId ? resolveDefaultArtifacts(args.clientId) : {};
  const screenshotPath = path.resolve(ROOT, args.screenshot || defaults.screenshotPath || '');
  const sourcePath = args.source ? path.resolve(ROOT, args.source) : defaults.sourcePath;
  const outputCropPath = args.crop === false ? null : path.resolve(ROOT, args.crop || defaults.cropPath || 'qr_crop.png');

  if (!screenshotPath || !fs.existsSync(screenshotPath)) {
    throw new Error('Informe --screenshot ou --cliente com resultado/latest contendo screenshots');
  }

  const result = decodeQrFromArtifacts({
    screenshotPath,
    sourcePath,
    bounds: args.bounds,
    outputCropPath,
    padding: Number(args.padding || 24)
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
}

main();
