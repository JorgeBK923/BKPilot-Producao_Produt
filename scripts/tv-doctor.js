#!/usr/bin/env node
'use strict';

// Preflight do ambiente de testes Android TV (target: tv).
// Espelha scripts/mobile-doctor.js, mas valida o que o pilar mobile-tv exige:
// virtualizacao acelerada, emulador com imagem Android TV e orientacao paisagem.
// Uso: npm run tv:doctor -- --cliente <id>

const fs = require('fs');
const os = require('os');
const http = require('http');
const https = require('https');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  ROOT,
  buildCapabilities,
  loadClientMobileConfig,
  resolveProviderConfig,
  validateScreenshotRedactionPolicy,
  validateMobileConfig
} = require('./lib/mobile-appium-client');
const { validateLocalAndroidDevice } = require('./lib/mobile-device-manager');
const {
  resolveApkSource,
  validateAllowedAppPackage,
  validateApkFile
} = require('./lib/mobile-apk');

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
  if (args.client && !args.clientId) args.clientId = args.client;
  return args;
}

function loadClientEnv(clientId) {
  const envPath = path.join(ROOT, 'clients', clientId, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: true });
    return path.relative(ROOT, envPath);
  }
  return null;
}

function sanitize(value) {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string' && /^(env:)?(MOBILE_FARM|QA_PASSWORD|.*TOKEN|.*KEY|.*SECRET)/i.test(value)) return '[redacted]';
  return value;
}

function add(checks, name, ok, details, severity = 'error') {
  checks.push({ name, status: ok ? 'passed' : (severity === 'warning' ? 'warning' : 'failed'), severity, details });
}

function adb(args, udid) {
  const full = udid ? ['-s', udid, ...args] : args;
  return execFileSync('adb', full, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// --- Virtualizacao -----------------------------------------------------------
// Emulador Android exige aceleracao de hardware. Sem ela, cai para traducao de
// instrucoes (~5-10x mais lento) — inviavel para baterias de teste.
function checkVirtualization(checks) {
  const platform = os.platform();
  if (platform === 'linux') {
    const kvm = fs.existsSync('/dev/kvm');
    add(checks, 'virtualization_kvm', kvm, kvm ? '/dev/kvm present' : '/dev/kvm absent — emulador sem aceleracao');
    if (kvm) {
      try {
        const ok = fs.accessSync('/dev/kvm', fs.constants.R_OK | fs.constants.W_OK) === undefined;
        add(checks, 'virtualization_kvm_access', ok, ok ? 'kvm read/write ok' : 'sem permissao em /dev/kvm');
      } catch (_) {
        add(checks, 'virtualization_kvm_access', false, 'sem permissao em /dev/kvm — adicionar usuario ao grupo kvm');
      }
    }
    return;
  }
  if (platform === 'win32') {
    // No Windows o emulador usa WHPX. emulator -accel-check e a verificacao canonica.
    try {
      const out = execFileSync('emulator', ['-accel-check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      const ok = /is installed and usable|accel:0/i.test(out);
      add(checks, 'virtualization_whpx', ok, out.trim().slice(0, 200));
    } catch (err) {
      add(checks, 'virtualization_whpx', false,
        `emulator -accel-check indisponivel (${err.message.slice(0, 120)}) — confirmar WHPX/Hyper-V ativo`, 'warning');
    }
    return;
  }
  if (platform === 'darwin') {
    add(checks, 'virtualization_hvf', true, 'macOS Hypervisor.framework — aceleracao nativa');
    return;
  }
  add(checks, 'virtualization', false, `plataforma ${platform} nao suportada para emulador`);
}

// --- Emulador e imagem TV ----------------------------------------------------
function checkTvDevice(checks, udid) {
  let characteristics = '';
  try {
    characteristics = adb(['shell', 'getprop', 'ro.build.characteristics'], udid);
  } catch (err) {
    add(checks, 'tv_characteristics', false, `getprop falhou: ${err.message.slice(0, 120)}`);
    return;
  }
  // AVD Android TV reporta characteristics="emulator" sem "tv", mas o produto confirma ATV.
  let productName = '';
  try { productName = adb(['shell', 'getprop', 'ro.product.name'], udid); } catch (_) {}
  const isTv = /\btv\b/.test(characteristics) || /atv|android.tv|google.atv/i.test(productName);
  add(checks, 'tv_characteristics', isTv,
    isTv
      ? `ro.build.characteristics=${characteristics} ro.product.name=${productName}`
      : `device nao e Android TV (characteristics=${characteristics || 'vazio'} product=${productName || 'vazio'})`);

  try {
    const features = adb(['shell', 'pm', 'list', 'features'], udid);
    const leanback = features.includes('android.software.leanback');
    add(checks, 'tv_leanback_feature', leanback,
      leanback ? 'android.software.leanback presente' : 'feature leanback ausente — app TV pode nao instalar', leanback ? 'error' : 'warning');
  } catch (err) {
    add(checks, 'tv_leanback_feature', false, `pm list features falhou: ${err.message.slice(0, 120)}`, 'warning');
  }

  // Orientacao: TV opera em paisagem. Rotacao 1 ou 3 = paisagem.
  try {
    const sizeOut = adb(['shell', 'wm', 'size'], udid);
    const dims = sizeOut.match(/(\d+)x(\d+)/);
    if (dims) {
      const landscape = Number(dims[1]) >= Number(dims[2]);
      add(checks, 'tv_orientation_landscape', landscape,
        landscape ? `resolucao ${dims[1]}x${dims[2]} (paisagem)` : `resolucao ${dims[1]}x${dims[2]} (retrato — esperado paisagem)`,
        landscape ? 'error' : 'warning');
    } else {
      add(checks, 'tv_orientation_landscape', false, `wm size sem resolucao parseavel: ${sizeOut}`, 'warning');
    }
  } catch (err) {
    add(checks, 'tv_orientation_landscape', false, `wm size falhou: ${err.message.slice(0, 120)}`, 'warning');
  }
}

function checkHttpStatus(urlString, auth, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let done = false;
    function finish(result) {
      if (done) return;
      done = true;
      resolve(result);
    }
    let url;
    try {
      url = new URL(`${String(urlString).replace(/\/$/, '')}/status`);
    } catch (err) {
      finish({ ok: false, error: `invalid url: ${err.message}` });
      return;
    }
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      timeout: timeoutMs,
      headers: auth ? { Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.accessKey}`).toString('base64')}` } : {}
    }, (res) => {
      res.resume();
      finish({ ok: res.statusCode < 400, status: res.statusCode });
    });
    req.on('timeout', () => {
      req.destroy();
      finish({ ok: false, error: 'timeout' });
    });
    req.on('error', (err) => finish({ ok: false, error: err.message }));
    req.end();
  });
}

function checkHead(urlString, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(urlString);
    } catch (err) {
      resolve({ ok: false, error: `invalid url: ${err.message}` });
      return;
    }
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: 'HEAD',
      timeout: timeoutMs
    }, (res) => {
      res.resume();
      resolve({ ok: res.statusCode < 400, status: res.statusCode });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.end();
  });
}

async function main() {
  const started = Date.now();
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('Usage: npm run tv:doctor -- --cliente <id>');
    process.exit(1);
  }
  args.target = 'tv';
  const checks = [];
  const clientEnvPath = loadClientEnv(args.clientId);
  if (!args.appiumUrl && process.env.APPIUM_URL) args.appiumUrl = process.env.APPIUM_URL;

  const loaded = loadClientMobileConfig(args);
  const validation = validateMobileConfig(loaded.mobile);
  add(checks, 'mobile_config_schema', validation.ok, validation.ok ? 'ok' : validation.errors);

  const tvTarget = (args.target || loaded.target) === 'tv';
  add(checks, 'target_is_tv', tvTarget, tvTarget ? 'target=tv' : `target=${loaded.target} (esperado tv)`);

  try {
    const redactionPolicy = validateScreenshotRedactionPolicy(loaded.mobile, loaded.clientId);
    add(checks, 'screenshot_redaction_policy', true, redactionPolicy.warning || 'ok');
  } catch (err) {
    add(checks, 'screenshot_redaction_policy', false, err.message);
  }

  let provider;
  let capabilities = {};
  try {
    provider = resolveProviderConfig({ ...args, clientId: loaded.clientId });
    add(checks, 'appium_endpoint_policy', true, (provider.warnings || []).join(', ') || 'ok');
  } catch (err) {
    add(checks, 'appium_endpoint_policy', false, err.message);
    provider = { provider: loaded.mobile.provider || 'local', appiumUrl: loaded.mobile.appiumUrl || 'http://127.0.0.1:4723', auth: null };
  }
  try {
    capabilities = buildCapabilities({ ...args, clientId: loaded.clientId, target: 'tv' });
  } catch (err) {
    add(checks, 'capabilities_build', false, err.message);
  }

  add(checks, 'client_env', Boolean(clientEnvPath), clientEnvPath || 'clients/<id>/.env not found');

  // Virtualizacao do host
  checkVirtualization(checks);

  // APK do app TV (target tv reutiliza o bloco mobile.apk)
  const apk = loaded.mobile.apk || {};
  const appPackage = args.appPackage || apk.appPackage || loaded.mobile.appPackage;
  const appActivity = args.appActivity || apk.appActivity || loaded.mobile.appActivity;
  try {
    const whitelist = validateAllowedAppPackage(appPackage, loaded.mobile.allowedAppPackages, { clientId: loaded.clientId });
    add(checks, 'apk_allowed_package', true, whitelist.warning || appPackage);
  } catch (err) {
    add(checks, 'apk_allowed_package', false, err.message);
  }
  add(checks, 'apk_activity', Boolean(appActivity), appActivity || 'mobile.apk.appActivity missing');
  try {
    const apkSource = resolveApkSource({ ...apk, app: args.app || apk.app || loaded.mobile.app });
    if (apkSource.type === 'local') {
      const apkValidation = validateApkFile(apkSource.path);
      add(checks, 'apk_file', true, apkValidation.warning || `${apkValidation.sizeBytes} bytes`);
    } else if (apkSource.type === 'url') {
      const head = await checkHead(apkSource.url, loaded.mobile.timeouts?.uploadApk || 5000);
      add(checks, 'apk_url_head', head.ok, head.ok ? `HTTP ${head.status}` : head.error);
    } else {
      add(checks, 'apk_storage_reference', false, 'APK do app TV deve ser local ou url', 'warning');
    }
  } catch (err) {
    add(checks, 'apk_source', false, err.message);
  }

  // Device / emulador
  let selectedUdid = null;
  if (provider.provider === 'local') {
    const deviceValidation = validateLocalAndroidDevice({
      udid: args.udid || args.device || loaded.mobile.udid || loaded.mobile.device,
      target: 'tv'
    });
    for (const check of deviceValidation.checks) checks.push({ severity: 'error', ...check });
    selectedUdid = deviceValidation.selected ? deviceValidation.selected.udid : null;
    if (selectedUdid) checkTvDevice(checks, selectedUdid);
  } else {
    const hasCreds = Boolean(provider.auth?.username && provider.auth?.accessKey);
    add(checks, 'cloud_credentials', hasCreds, hasCreds ? 'present' : 'missing MOBILE_FARM credentials');
  }

  const status = await checkHttpStatus(provider.appiumUrl, provider.auth);
  add(checks, 'appium_status', status.ok, status.ok ? `HTTP ${status.status}` : status.error);

  const failed = checks.filter((check) => check.status === 'failed');
  const warnings = checks.filter((check) => check.status === 'warning');
  const report = {
    status: failed.length === 0 ? 'passed' : 'failed',
    durationMs: Date.now() - started,
    clientId: loaded.clientId,
    platform: os.platform(),
    provider: provider.provider,
    appiumUrl: provider.appiumUrl.replace(/\/\/[^/@]+@/, '//[redacted]@'),
    target: 'tv',
    warningCount: warnings.length,
    checks,
    capabilities: Object.fromEntries(Object.entries(capabilities).map(([key, value]) => [key, sanitize(value)]))
  };
  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`tv:doctor failed: ${err.message}`);
  process.exit(1);
});
