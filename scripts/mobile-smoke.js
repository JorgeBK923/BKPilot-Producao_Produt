#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  ROOT,
  MobileAppiumClient,
  buildCapabilities,
  loadClientMobileConfig,
  resolveProviderConfig,
  redact,
  timestamp
} = require('./lib/mobile-appium-client');
const { validateLocalAndroidDevice } = require('./lib/mobile-device-manager');
const {
  buildLogsIndex,
  buildVideosIndex,
  captureAppiumLogs,
  captureLogcat,
  downloadSauceVideo,
  logOutputPath,
  redactLog,
  startRecording,
  stopRecording,
  videoOutputPath
} = require('@bugkillers/bkpilot-core/mobile-recording');
const {
  buildApkCapabilities,
  downloadApkFromUrl,
  resolveApkSource,
  uploadApkToSauce,
  validateAllowedAppPackage,
  validateApkFile
} = require('@bugkillers/bkpilot-core/mobile-apk');
const { purgeOldArtifacts } = require('@bugkillers/bkpilot-core/mobile-retention');

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const next = argv[i + 1];
    if (inlineValue !== undefined) args[rawKey] = inlineValue;
    else if (!next || next.startsWith('--')) args[rawKey] = true;
    else {
      args[rawKey] = next;
      i++;
    }
  }
  if (args.cliente && !args.clientId) args.clientId = args.cliente;
  if (args.client && !args.clientId) args.clientId = args.client;
  if (args.device && !args.deviceName) args.deviceName = args.device;
  if (args.video && !args.videoEnabled) args.videoEnabled = args.video;
  args._ = positional;
  return args;
}

function printUsage() {
  console.log(`
Uso:
  node scripts/mobile-smoke.js --cliente <id> [--target web|apk] [--device <serial>] [--url <url>] [--app <apk|remote-id>] [--video=on|off]
  npm run mobile:smoke -- --cliente <id> [--target web|apk]
`);
}

function loadClientEnv(clientId) {
  const envPath = path.join(ROOT, 'clients', clientId, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: true });
    return path.relative(ROOT, envPath);
  }
  return null;
}

function writeReport(resultDir, report) {
  // Runtime evidence can contain client-controlled text; persist as data only.
  const reportsDir = path.join(resultDir, 'mobile', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, 'mobile_smoke_report.json');
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  return filePath;
}

function durationSeconds(startedAt) {
  return Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
}

function addCheck(checks, name, passed, details) {
  checks.push({ name, status: passed ? 'passed' : 'failed', details: details || null });
}

function apkFilename(clientId, apkConfig) {
  const version = String(apkConfig.version || apkConfig.versionName || 'v0').replace(/[^\w.-]+/g, '_');
  const ts = timestamp().replace(/[^\w.-]+/g, '_');
  return `${clientId}_${version}_${ts}.apk`;
}

async function prepareApkExecution({ args, loaded, providerConfig, warnings, checks }) {
  const target = args.target || loaded.target;
  if (target !== 'apk') return null;
  const mobile = loaded.mobile || {};
  const apk = mobile.apk || {};
  const appPackage = args.appPackage || apk.appPackage || mobile.appPackage;
  const appActivity = args.appActivity || apk.appActivity || mobile.appActivity;
  const whitelist = validateAllowedAppPackage(appPackage, mobile.allowedAppPackages, { clientId: loaded.clientId });
  if (whitelist.warning) warnings.push(whitelist.warning);
  addCheck(checks, 'apk_allowed_package', true, whitelist.warning || appPackage);

  let apkSource = resolveApkSource({ ...apk, app: args.app || apk.app || mobile.app });
  let sizeBytes = null;
  let uploadedAt = null;
  let storageFilename = apkSource.type === 'storage' ? apkSource.filename : null;
  const resultCacheDir = path.join(ROOT, 'clients', loaded.clientId, 'resultado', '.apk-cache');

  if (apkSource.type === 'url') {
    const downloadedPath = await downloadApkFromUrl(apkSource.url, resultCacheDir, {
      timeoutMs: mobile.timeouts?.uploadApk || 300000
    });
    apkSource = { type: 'local', path: downloadedPath, originalUrl: apkSource.url };
  }
  if (apkSource.type === 'local') {
    const validation = validateApkFile(apkSource.path);
    sizeBytes = validation.sizeBytes;
    if (validation.warning) warnings.push(validation.warning);
  }

  const provider = providerConfig.provider;
  const isSauce = provider === 'saucelabs' || provider === 'sauce' || provider === 'cloud';
  const uploadStrategy = apk.uploadStrategy || 'auto';
  if (isSauce && uploadStrategy === 'preuploaded') {
    if (!storageFilename) throw new Error('APK_STORAGE_FILENAME_REQUIRED: mobile.apk.storageFilename is required for preuploaded APK');
    apkSource = { type: 'storage', filename: storageFilename };
  } else if (isSauce) {
    if (apkSource.type === 'storage') {
      storageFilename = apkSource.filename;
    } else {
      storageFilename = apkFilename(loaded.clientId, apk);
      const upload = await uploadApkToSauce({
        apkPath: apkSource.path,
        username: providerConfig.auth?.username,
        accessKey: providerConfig.auth?.accessKey,
        filename: storageFilename,
        timeoutMs: mobile.timeouts?.uploadApk || 300000
      });
      storageFilename = upload.storageFilename;
      uploadedAt = upload.uploadedAt;
      sizeBytes = upload.sizeBytes;
      apkSource = { type: 'storage', filename: storageFilename };
    }
  } else if (apkSource.type === 'storage') {
    throw new Error('APK_STORAGE_LOCAL_UNSUPPORTED: storage:filename is only valid for Sauce/cloud provider');
  }

  const apkCaps = buildApkCapabilities({
    provider,
    apkSource,
    appPackage,
    appActivity,
    noReset: apk.noReset !== undefined ? apk.noReset : true,
    fullReset: apk.fullReset === true
  });
  args.app = apkCaps['appium:app'];
  args.appPackage = appPackage;
  args.appActivity = appActivity;
  args.capabilities = {
    ...(args.capabilities || {}),
    app: apkCaps['appium:app'],
    appPackage,
    appActivity,
    noReset: apkCaps['appium:noReset'],
    ...(apkCaps['appium:fullReset'] ? { fullReset: true } : {})
  };
  addCheck(checks, 'apk_source_resolved', true, apkSource.type);
  return {
    source: apkSource.type,
    appPackage,
    appActivity,
    sizeBytes,
    uploadedAt,
    storageFilename,
    uploadStrategy,
    noReset: apkCaps['appium:noReset'],
    fullReset: apkCaps['appium:fullReset'] === true
  };
}

function enforceRunLimit(startedAt, mobile) {
  const maxMinutes = Number(mobile?.limits?.maxMinutesPerRun || 0);
  if (!maxMinutes) return;
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  if (elapsedMs > maxMinutes * 60 * 1000) {
    const err = new Error(`LIMIT_EXCEEDED: mobile.limits.maxMinutesPerRun=${maxMinutes}, elapsedMs=${elapsedMs}`);
    err.code = 'LIMIT_EXCEEDED';
    throw err;
  }
}

function resolveVideoPolicy(args, mobile) {
  if (args.videoEnabled === 'off') return { enabled: false, warnings: [] };
  if (args.videoEnabled === 'on') return { enabled: true, warnings: [] };
  if (mobile?.evidence?.videoEnabled === false) return { enabled: false, warnings: [] };
  if ((mobile?.environment === 'production' || mobile?.evidence?.production === true) && mobile?.evidence?.videoConsentDocumented !== true) {
    return { enabled: false, warnings: ['VIDEO_DISABLED_NO_CONSENT'] };
  }
  return { enabled: true, warnings: [] };
}

function writeIndex(resultDir, fileName, entries) {
  const indexPath = path.join(resultDir, 'mobile', fileName);
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2), 'utf8');
  return path.relative(ROOT, indexPath);
}

async function startLocalRecording(client, videoState, mobile) {
  try {
    await startRecording(client, mobile?.evidence?.recordingOptions || {});
    videoState.started = true;
  } catch (err) {
    videoState.errors.push(`startRecordingScreen failed: ${err.message}`);
  }
}

async function finishRecording(client, session, providerConfig, loaded, videoState) {
  const resultDir = path.join(ROOT, session.resultDir);
  try {
    if (!videoState.enabled) return;
    if (session.provider === 'local' && videoState.started) {
      const buffer = await stopRecording(client);
      if (buffer.length > 0) {
        const outputPath = videoOutputPath({ resultDir, cenario: 'smoke_test', sessionId: session.sessionId, provider: 'local', ext: 'mp4' });
        fs.writeFileSync(outputPath, buffer);
        videoState.videos.push({ cenario: 'smoke_test', sessionId: session.sessionId, path: path.relative(ROOT, outputPath), durationMs: 0, sizeBytes: buffer.length, provider: 'local' });
      }
    } else if (session.provider === 'saucelabs' || session.provider === 'sauce') {
      const outputPath = videoOutputPath({ resultDir, cenario: 'smoke_test', sessionId: session.sessionId, provider: 'sauce', ext: 'mp4' });
      const downloaded = await downloadSauceVideo({
        jobId: session.sessionId,
        username: providerConfig.auth?.username,
        accessKey: providerConfig.auth?.accessKey,
        outputPath,
        timeoutMs: loaded.mobile?.timeouts?.downloadArtifact || 60000
      });
      if (downloaded.ok) {
        videoState.videos.push({ cenario: 'smoke_test', sessionId: session.sessionId, path: path.relative(ROOT, outputPath), durationMs: 0, sizeBytes: downloaded.sizeBytes, provider: 'sauce' });
      } else {
        videoState.videos.push({ cenario: 'smoke_test', sessionId: session.sessionId, path: path.relative(ROOT, outputPath), durationMs: 0, sizeBytes: 0, provider: 'sauce', status: 'download_failed', error: downloaded.error });
      }
    } else if (/farm|internal/i.test(String(session.provider))) {
      videoState.warnings.push('Provider farm interna nao suporta captura de video nesta fase - pular');
    }
  } catch (err) {
    videoState.errors.push(`video capture failed: ${err.message}`);
  }
}

async function captureLogs(client, session, videoState) {
  const resultDir = path.join(ROOT, session.resultDir);
  try {
    const appiumLog = await captureAppiumLogs(client.appiumUrl, session.sessionId);
    if (appiumLog) {
      const outputPath = logOutputPath({ resultDir, type: 'appium', sessionId: session.sessionId });
      fs.writeFileSync(outputPath, redactLog(appiumLog), 'utf8');
      videoState.logs.push({ type: 'appium', sessionId: session.sessionId, path: path.relative(ROOT, outputPath), sizeBytes: fs.statSync(outputPath).size, provider: session.provider });
    }
  } catch (err) {
    videoState.logs.push({ type: 'appium', sessionId: session.sessionId, path: null, sizeBytes: 0, provider: session.provider, status: 'download_failed', error: err.message });
  }
  try {
    const udid = client.capabilities?.['appium:udid'] || client.capabilities?.udid || null;
    const logcat = captureLogcat(udid);
    if (logcat) {
      const outputPath = logOutputPath({ resultDir, type: 'logcat', sessionId: session.sessionId });
      fs.writeFileSync(outputPath, redactLog(logcat), 'utf8');
      videoState.logs.push({ type: 'logcat', sessionId: session.sessionId, path: path.relative(ROOT, outputPath), sizeBytes: fs.statSync(outputPath).size, provider: session.provider });
    }
  } catch (err) {
    videoState.logs.push({ type: 'logcat', sessionId: session.sessionId, path: null, sizeBytes: 0, provider: session.provider, status: 'download_failed', error: err.message });
  }
}

function persistRecordingIndexes(session, videoState) {
  const resultDir = path.join(ROOT, session.resultDir);
  writeIndex(resultDir, 'videos_index.json', buildVideosIndex(videoState.videos));
  writeIndex(resultDir, 'logs_index.json', buildLogsIndex(videoState.logs));
}

function maybePurgeArtifacts(args, loaded, warnings) {
  if (args.purge !== true) return null;
  const retentionDays = Number(args.retentionDays || loaded.mobile?.evidence?.retentionDays || 90);
  const result = purgeOldArtifacts(loaded.clientId, retentionDays, false);
  warnings.push(`RETENTION_PURGE_REMOVED_${result.removed.length}`);
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }
  if (!args.clientId) {
    printUsage();
    process.exit(1);
  }
  const clientEnvPath = loadClientEnv(args.clientId);
  if (!args.appiumUrl && process.env.APPIUM_URL) args.appiumUrl = process.env.APPIUM_URL;
  if (args.url && !args.baseUrl) args.baseUrl = args.url;
  if (args.target) args.target = String(args.target).toLowerCase();

  const loaded = loadClientMobileConfig(args);
  const provider = resolveProviderConfig({ ...args, clientId: loaded.clientId });

  console.log('Mobile smoke starting');
  console.log(`Client: ${loaded.clientId}`);
  console.log(`Target: ${args.target || loaded.target}`);
  console.log(`Provider: ${provider.provider}`);
  console.log(`Appium URL: ${provider.appiumUrl.replace(/\/\/[^/@]+@/, '//[redacted]@')}`);
  console.log(`Client env: ${clientEnvPath || 'not found'}`);

  const client = new MobileAppiumClient();
  const startedAt = new Date().toISOString();
  const checks = [];
  const warnings = [];
  const errors = [];
  let apkReport = null;
  let capabilities = {};
  let report;
  try {
    apkReport = await prepareApkExecution({ args, loaded, providerConfig: provider, warnings, checks });
    capabilities = buildCapabilities({ ...args, clientId: loaded.clientId, target: args.target || loaded.target });
    console.log(`Capabilities: ${JSON.stringify(redact(capabilities), null, 2)}`);

    if (provider.provider === 'local') {
      const deviceValidation = validateLocalAndroidDevice({
        udid: args.udid || args.device || loaded.mobile.udid || loaded.mobile.device,
        target: args.target || loaded.target
      });
      for (const check of deviceValidation.checks) checks.push(check);
      warnings.push(...deviceValidation.warnings);
      if (!deviceValidation.ok) throw new Error('Local Android device validation failed');
    } else {
      addCheck(checks, 'device_manager_cloud', true, 'Cloud device validation is performed by remote Appium session creation');
    }

    try {
      const status = await client.status(provider);
      addCheck(checks, 'appium_status', true, status?.build || status);
    } catch (err) {
      addCheck(checks, 'appium_status', false, err.message);
      throw err;
    }

    const session = await client.startSession({ ...args, clientId: loaded.clientId, target: args.target || loaded.target });
    addCheck(checks, 'session_created', Boolean(session.sessionId), session.sessionId);
    addCheck(checks, 'target_resolved', Boolean(session.target), session.target);

    const videoPolicy = resolveVideoPolicy(args, loaded.mobile);
    warnings.push(...videoPolicy.warnings);
    const videoState = { enabled: videoPolicy.enabled, started: false, videos: [], logs: [], errors: [], warnings: [...videoPolicy.warnings] };
    if (videoState.enabled && session.provider === 'local') await startLocalRecording(client, videoState, loaded.mobile);

    const evidence = await client.captureEvidence({ name: 'mobile_smoke', includeState: true });
    addCheck(checks, 'state_collected', Boolean(evidence.state?.rawPath), evidence.state?.rawPath);
    addCheck(checks, 'screenshot_saved', Boolean(evidence.screenshot && fs.existsSync(path.join(ROOT, evidence.screenshot))), evidence.screenshot);
    addCheck(checks, 'source_saved', Boolean(evidence.state?.evidence?.source && fs.existsSync(path.join(ROOT, evidence.state.evidence.source))), evidence.state?.evidence?.source);
    if (session.target === 'web') {
      addCheck(checks, 'url_or_context_available', Boolean(evidence.state?.url || evidence.state?.context), evidence.state?.url || evidence.state?.context);
      const finalUrl = evidence.state?.url || '';
      addCheck(checks, 'web_not_blank', Boolean(finalUrl && finalUrl !== 'about:blank'), finalUrl || 'no url');
    } else {
      addCheck(checks, 'activity_or_source_available', Boolean(evidence.state?.activity || evidence.state?.elements?.length), evidence.state?.activity || `${evidence.state?.elements?.length || 0} elements`);
      const activity = evidence.state?.activity || '';
      addCheck(checks, 'apk_not_launcher_only', !/launcher/i.test(activity) || Boolean(evidence.state?.elements?.length), activity || 'no activity');
    }
    addCheck(checks, 'elements_present', (evidence.state?.summary?.totalElements || evidence.state?.elements?.length || 0) > 0, evidence.state?.summary || `${evidence.state?.elements?.length || 0} elements`);
    enforceRunLimit(startedAt, loaded.mobile);

    await finishRecording(client, session, provider, loaded, videoState);
    await captureLogs(client, session, videoState);
    const retention = maybePurgeArtifacts(args, loaded, warnings);
    await client.endSession();
    addCheck(checks, 'session_ended', true, session.sessionId);
    persistRecordingIndexes(session, videoState);

    const failedChecks = checks.filter((check) => check.status !== 'passed');
    if (failedChecks.length > 0) {
      throw new Error(`Smoke checks failed: ${failedChecks.map((check) => check.name).join(', ')}`);
    }

    report = {
      status: 'passed',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationSeconds: durationSeconds(startedAt),
      clientId: loaded.clientId,
      target: session.target,
      provider: session.provider,
      device: capabilities['appium:udid'] || capabilities['appium:deviceName'] || null,
      sessionId: session.sessionId,
      resultDir: session.resultDir,
      artifacts: {
        screenshot: evidence.screenshot,
        state: evidence.state?.rawPath,
        source: evidence.state?.evidence?.source,
        appiumLog: session.target === 'web' ? 'mobile_web_log.json' : 'mobile_apk_log.json'
      },
      video: videoState.videos[0] || null,
      logs: videoState.logs,
      videoErrors: videoState.errors,
      videoWarnings: videoState.warnings,
      apk: apkReport,
      retention,
      checks,
      warnings,
      errors,
      capabilities: redact(session.capabilities)
    };
    const reportPath = writeReport(path.join(ROOT, session.resultDir), report);
    console.log(`Smoke passed: ${path.relative(ROOT, reportPath)}`);
    console.log(`Screenshot: ${evidence.screenshot}`);
  } catch (err) {
    errors.push(err.message);
    try {
      const ended = await client.endSession();
      addCheck(checks, 'session_ended', Boolean(ended.ok), ended);
    } catch (_) {}
    const resultDir = client.resultDir || path.join(ROOT, 'clients', loaded.clientId, 'resultado', 'mobile_smoke_failed');
    fs.mkdirSync(resultDir, { recursive: true });
    report = {
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      clientId: loaded.clientId,
      target: args.target || loaded.target,
      provider: provider.provider,
      durationSeconds: durationSeconds(startedAt),
      checks,
      warnings,
      errors,
      error: err.message,
      apk: apkReport,
      capabilities: redact(capabilities)
    };
    const reportPath = writeReport(resultDir, report);
    console.error(`Smoke failed: ${err.message}`);
    console.error(`Report: ${path.relative(ROOT, reportPath)}`);
    process.exit(1);
  }
}

main();
