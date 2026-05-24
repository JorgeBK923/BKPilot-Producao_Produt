#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { decodeQrFromArtifacts } = require('./lib/mobile-qr-adapter');

const ROOT = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function newestResultDir(clientId) {
  const base = path.join(ROOT, 'clients', clientId, 'resultado');
  const dirs = fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (!dirs.length) throw new Error(`No timestamped result dirs found for ${clientId}`);
  return path.join(base, dirs.at(-1));
}

function latestFile(dir, ext) {
  return fs.readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(ext))
    .sort()
    .map((file) => path.join(dir, file))
    .at(-1);
}

function resolveQrUrl(args, clientId) {
  if (args.url) return args.url;
  if (process.env.VEVA_TV_PAIRING_URL) return process.env.VEVA_TV_PAIRING_URL;

  const resultDir = args.resultDir ? path.resolve(ROOT, args.resultDir) : newestResultDir(clientId);
  const screenshotPath = args.screenshot
    ? path.resolve(ROOT, args.screenshot)
    : latestFile(path.join(resultDir, 'screenshots'), '.png');
  const sourcePath = args.source
    ? path.resolve(ROOT, args.source)
    : latestFile(path.join(resultDir, 'mobile', 'sources'), '.xml');
  const cropPath = path.join(resultDir, 'dados_brutos', 'qr_crop.png');
  const decoded = decodeQrFromArtifacts({ screenshotPath, sourcePath, outputCropPath: cropPath });
  if (!decoded.ok) throw new Error(`Could not decode QR from ${screenshotPath}`);
  return decoded.data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const clientId = args.cliente || args.client || 'vevatv';
  require('dotenv').config({ path: path.join(ROOT, 'clients', clientId, '.env'), override: true });

  const url = resolveQrUrl(args, clientId);
  const code = args.code || process.env.VEVA_TV_LOGIN_CODE;
  const cnpj = args.cnpj || process.env.VEVA_TV_UNIT_CNPJ;
  if (!code) throw new Error('Missing VEVA_TV_LOGIN_CODE in client .env');
  if (!cnpj) throw new Error('Missing VEVA_TV_UNIT_CNPJ in client .env');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const responses = [];
  page.on('response', async (response) => {
    if (response.request().method() !== 'POST') return;
    if (!response.url().includes('/access')) return;
    let body = '';
    try {
      body = (await response.text()).slice(0, 1000);
    } catch (_) {}
    responses.push({ status: response.status(), url: response.url(), body });
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    const companyCodeInput = page.locator('input[name="companyCode"]');
    const hasPairingForm = await companyCodeInput.waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!hasPairingForm) {
      const body = await page.locator('body').innerText().catch(() => '');
      throw new Error(`Pairing form not available: ${body.replace(/\s+/g, ' ').trim().slice(0, 300)}`);
    }
    await companyCodeInput.fill(code);
    await page.locator('input[name="serialNumber"]').fill(cnpj);
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}),
      page.locator('button[type="submit"], button:has-text("Enviar")').first().click()
    ]);
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(JSON.stringify({
      ok: true,
      usedEnv: {
        loginCode: Boolean(process.env.VEVA_TV_LOGIN_CODE),
        unitCnpj: Boolean(process.env.VEVA_TV_UNIT_CNPJ)
      },
      url: page.url(),
      body: body.replace(/\s+/g, ' ').trim().slice(0, 2000),
      responses
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`pair_failed: ${err.message}`);
  process.exit(1);
});
