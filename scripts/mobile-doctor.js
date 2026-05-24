#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
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
} = require('@bugkillers/bkpilot-core/mobile-apk');

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

function checkHead(urlString, auth, timeoutMs = 5000) {
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
      timeout: timeoutMs,
      headers: auth ? { Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.accessKey}`).toString('base64')}` } : {}
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

function add(checks, name, ok, details) {
  checks.push({ name, status: ok ? 'passed' : 'failed', details });
}

async function main() {
  const started = Date.now();
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('Usage: npm run mobile:doctor -- --cliente <id>');
    process.exit(1);
  }
  const checks = [];
  const clientEnvPath = loadClientEnv(args.clientId);
  if (!args.appiumUrl && process.env.APPIUM_URL) args.appiumUrl = process.env.APPIUM_URL;

  const loaded = loadClientMobileConfig(args);
  const validation = validateMobileConfig(loaded.mobile);
  add(checks, 'mobile_config_schema', validation.ok, validation.ok ? 'ok' : validation.errors);
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
    capabilities = buildCapabilities({ ...args, clientId: loaded.clientId, target: args.target || loaded.target });
  } catch (err) {
    add(checks, 'capabilities_build', false, err.message);
  }
  const target = args.target || loaded.target;
  const apkMinimum = target === 'apk' && Boolean(loaded.mobile.apk?.appPackage || loaded.mobile.appPackage);
  add(checks, 'client_env', Boolean(clientEnvPath), clientEnvPath || 'clients/<id>/.env not found');
  add(checks, 'capabilities_minimum', Boolean(capabilities.platformName && (capabilities.browserName || capabilities['appium:app'] || capabilities['appium:appPackage'] || apkMinimum)), Object.keys(capabilities));

  if (target === 'apk') {
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
        const validation = validateApkFile(apkSource.path);
        add(checks, 'apk_file', true, validation.warning || `${validation.sizeBytes} bytes`);
      } else if (apkSource.type === 'url') {
        const head = await checkHead(apkSource.url, null, loaded.mobile.timeouts?.uploadApk || 5000);
        add(checks, 'apk_url_head', head.ok, head.ok ? `HTTP ${head.status}` : head.error);
      } else {
        const hasCreds = Boolean(provider.auth?.username && provider.auth?.accessKey);
        const strategyOk = (apk.uploadStrategy || 'auto') === 'preuploaded' || Boolean(apk.storageFilename);
        add(checks, 'apk_storage_reference', hasCreds && strategyOk, hasCreds ? apkSource.filename : 'missing MOBILE_FARM_USERNAME/MOBILE_FARM_ACCESS_KEY');
      }
    } catch (err) {
      add(checks, 'apk_source', false, err.message);
    }
  }

  if (provider.provider === 'local') {
    const deviceValidation = validateLocalAndroidDevice({
      udid: args.udid || args.device || loaded.mobile.udid || loaded.mobile.device,
      target: args.target || loaded.target
    });
    for (const check of deviceValidation.checks) checks.push(check);
  } else {
    const hasCreds = Boolean(provider.auth?.username && provider.auth?.accessKey);
    add(checks, 'cloud_credentials', hasCreds, hasCreds ? 'present' : 'missing MOBILE_FARM_USERNAME/MOBILE_FARM_ACCESS_KEY');
  }

  const status = await checkHttpStatus(provider.appiumUrl, provider.auth);
  add(checks, 'appium_status', status.ok, status.ok ? `HTTP ${status.status}` : status.error);

  const failed = checks.filter((check) => check.status !== 'passed');
  const report = {
    status: failed.length === 0 ? 'passed' : 'failed',
    durationMs: Date.now() - started,
    clientId: loaded.clientId,
    provider: provider.provider,
    appiumUrl: provider.appiumUrl.replace(/\/\/[^/@]+@/, '//[redacted]@'),
    target: args.target || loaded.target,
    checks,
    capabilities: Object.fromEntries(Object.entries(capabilities).map(([key, value]) => [key, sanitize(value)]))
  };
  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`mobile:doctor failed: ${err.message}`);
  process.exit(1);
});
