#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT, 'clients', 'vevatv');
const ENV_PATH = path.join(CLIENT_DIR, '.env');
const EMAIL = 'jorge.alves@bugkillers.net';
const PANEL_URL = process.env.VEVA_PANEL_URL || 'https://app-hml.vevatv.com.br/';
const ACCESS_URL = process.env.VEVA_ACCESS_URL || 'https://app-hml.vevatv.com.br/access?pairingHash=019e3cab-f5a4-713d-89ba-e5a0fec79138';

function loadEnvValue(name) {
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const line = raw.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1) : '';
}

function sanitize(text) {
  return String(text || '')
    .replace(loadEnvValue('QA_PASSWORD'), '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fillLogin(page) {
  await page.goto(PANEL_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  if (!/sign-in|auth/i.test(page.url())) return;

  await page.locator('input[name="email"], input[type="email"]').first().click();
  await page.locator('input[name="email"], input[type="email"]').first().press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.locator('input[name="email"], input[type="email"]').first().type(EMAIL, { delay: 5 });
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.click();
  await passwordInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await passwordInput.type(loadEnvValue('QA_PASSWORD'), { delay: 5 });
  await page.waitForTimeout(500);

  const [, loginResponse] = await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}),
    page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/auth/custom/sign-in'), { timeout: 20000 }).catch(() => null),
    page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Entrar');
      if (button) button.disabled = false;
      const form = document.querySelector('form');
      if (form) form.requestSubmit(button || undefined);
    })
  ]);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  if (loginResponse) {
    const text = await loginResponse.text().catch(() => '');
    const clean = sanitize(text);
    const resultMatch = clean.match(/\{"success":[\s\S]*?\}/);
    return { status: loginResponse.status(), result: resultMatch ? resultMatch[0] : null, body: clean.slice(0, 1200) };
  }
  return null;
}

async function collectPage(page, label) {
  const body = sanitize(await page.locator('body').innerText({ timeout: 10000 }).catch(() => ''));
  const cnpjs = Array.from(new Set(body.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || []));
  const codes = Array.from(new Set(body.match(/\b[A-Z0-9]{4,12}\b/g) || []))
    .filter((code) => !/^(VEVA|CNPJ|EMAIL|LTDA|HTTP|HTTPS)$/i.test(code))
    .slice(0, 30);
  const buttons = [];
  const buttonCount = await page.locator('button').count().catch(() => 0);
  for (let i = 0; i < Math.min(buttonCount, 30); i++) {
    const button = page.locator('button').nth(i);
    const text = sanitize(await button.innerText().catch(() => ''));
    if (text) buttons.push({
      text,
      disabled: await button.isDisabled().catch(() => null),
      type: await button.getAttribute('type').catch(() => null)
    });
  }
  const alerts = [];
  const alertCount = await page.locator('[role="alert"], .MuiAlert-message, .Toastify__toast-body').count().catch(() => 0);
  for (let i = 0; i < Math.min(alertCount, 10); i++) {
    const text = sanitize(await page.locator('[role="alert"], .MuiAlert-message, .Toastify__toast-body').nth(i).innerText().catch(() => ''));
    if (text) alerts.push(text);
  }
  const fields = await page.locator('input').evaluateAll((inputs) => inputs.map((input) => ({
    name: input.getAttribute('name'),
    type: input.getAttribute('type'),
    hasValue: Boolean(input.value)
  }))).catch(() => []);
  return { label, url: page.url(), cnpjs, codes, buttons, alerts, fields, body: body.slice(0, 3000) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const network = [];
  const consoleMessages = [];
  const requests = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST') return;
    const headers = request.headers();
    requests.push({
      method: request.method(),
      url: request.url(),
      nextAction: headers['next-action'] || null,
      contentType: headers['content-type'] || null,
      postDataShape: sanitize(request.postData() || '').slice(0, 200)
    });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleMessages.push(sanitize(msg.text()).slice(0, 300));
  });
  page.on('response', async (response) => {
    const url = response.url();
    if (!/auth|login|sign|api|session|csrf|access|pair/i.test(url)) return;
    let body = '';
    try {
      const text = await response.text();
      body = sanitize(text).slice(0, 300);
    } catch (_) {}
    network.push({ method: response.request().method(), status: response.status(), url, body });
  });
  try {
    const loginResult = await fillLogin(page);
    await page.waitForTimeout(1500);
    await page.goto(PANEL_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    const dashboard = await collectPage(page, 'dashboard_after_login');
    await page.goto(ACCESS_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    const access = await collectPage(page, 'access_pairing');
    console.log(JSON.stringify({ ok: true, loginResult, dashboard, access, requests, network, consoleMessages }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`inspect_failed: ${err.message}`);
  process.exit(1);
});
