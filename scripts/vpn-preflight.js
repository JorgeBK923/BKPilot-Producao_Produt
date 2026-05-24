#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const dns = require('node:dns').promises;
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_TIMEOUT_MS = 10_000;
const VPN_KEYWORDS = [
  'vpn',
  'openvpn',
  'tap',
  'tun',
  'wireguard',
  'tailscale',
  'zerotier',
  'fortinet',
  'forticlient',
  'globalprotect',
  'cisco',
  'anyconnect',
  'pulse',
  'zscaler',
];

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    json: false,
    playwright: true,
    strictVpn: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--client' || arg === '--cliente') args.clientId = argv[++i];
    else if (arg === '--url') args.url = argv[++i];
    else if (arg === '--root') args.root = argv[++i];
    else if (arg === '--json') args.json = true;
    else if (arg === '--no-playwright') args.playwright = false;
    else if (arg === '--strict-vpn') args.strictVpn = true;
    else if (arg === '--no-strict-vpn') args.strictVpn = false;
    else if (arg === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Flag desconhecida: ${arg}`);
  }

  return args;
}

function usage() {
  return [
    'Uso:',
    '  npm run preflight:vpn -- --client <id>',
    '  node scripts/vpn-preflight.js --client <id> [--json] [--no-playwright]',
    '',
    'Config opcional em clients/<id>/config.json:',
    '  requiresVpn: true',
    '  vpnHosts: ["app.interno.local", "10.10.0.12"]',
    '  proxy: "http://proxy.empresa:8080"',
    '  vpnRouteHints: ["10.10.", "172.20."]',
    '  strictVpn: true',
  ].join('\n');
}

function loadClientConfig(root, clientId, options = {}) {
  if (!clientId || !/^[a-z0-9][a-z0-9_-]*$/i.test(clientId)) {
    throw new Error('Informe --client <id> valido.');
  }

  const configPath = path.join(root, 'clients', clientId, 'config.json');
  if (!fs.existsSync(configPath) && options.allowMissingWithUrl) {
    return { config: { id: clientId }, configPath: null };
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  return { config, configPath };
}

function normalizeProxy(proxy) {
  if (!proxy) return null;
  if (typeof proxy === 'string') return proxy.trim() || null;
  if (typeof proxy.server === 'string') return proxy.server.trim() || null;
  return null;
}

function normalizeConfig(config, overrides = {}) {
  const baseUrl = overrides.url || config.baseUrl || config.mobile?.baseUrl;
  if (!baseUrl) throw new Error('baseUrl ausente. Configure clients/<id>/config.json ou use --url.');

  const parsedBaseUrl = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
    throw new Error(`baseUrl deve usar http/https: ${baseUrl}`);
  }

  const vpn = config.vpn || {};
  const timeoutMs = Number(
    overrides.timeoutMs ||
    config.preflight?.timeoutMs ||
    config.timeout_ms ||
    DEFAULT_TIMEOUT_MS
  );
  const proxy = normalizeProxy(config.proxy || vpn.proxy || config.preflight?.proxy);
  const vpnHosts = unique([
    parsedBaseUrl.hostname,
    ...asArray(config.vpnHosts),
    ...asArray(vpn.hosts),
    ...asArray(config.preflight?.hosts),
  ]).filter(Boolean);

  return {
    baseUrl: parsedBaseUrl.toString(),
    baseHost: parsedBaseUrl.hostname,
    basePort: Number(parsedBaseUrl.port || (parsedBaseUrl.protocol === 'http:' ? 80 : 443)),
    requiresVpn: Boolean(config.requiresVpn || vpn.required || config.preflight?.requiresVpn),
    strictVpn: overrides.strictVpn ?? Boolean(config.strictVpn || vpn.strict || config.preflight?.strictVpn),
    vpnHosts,
    vpnRouteHints: unique([
      ...asArray(config.vpnRouteHints),
      ...asArray(vpn.routeHints),
      ...asArray(config.preflight?.routeHints),
    ]),
    vpnAdapterKeywords: unique([
      ...VPN_KEYWORDS,
      ...asArray(config.vpnAdapterKeywords),
      ...asArray(vpn.adapterKeywords),
    ]).map((item) => String(item).toLowerCase()),
    proxy,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  };
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

async function runPreflight(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const loaded = options.config
    ? { config: options.config, configPath: options.configPath || null }
    : loadClientConfig(root, options.clientId, { allowMissingWithUrl: Boolean(options.url) });
  const config = normalizeConfig(loaded.config, options);
  const result = {
    ok: true,
    checkedAt: new Date().toISOString(),
    root,
    clientId: options.clientId || loaded.config.id || null,
    configPath: loaded.configPath,
    baseUrl: config.baseUrl,
    requiresVpn: config.requiresVpn,
    strictVpn: config.strictVpn,
    proxy: config.proxy ? redactProxy(config.proxy) : null,
    environment: collectEnvironment(),
    checks: [],
    findings: [],
    remediation: [],
    playwrightSkipped: options.playwright === false,
  };

  await addSystemNetworkChecks(result, config, options);
  await addTargetChecks(result, config, options);

  if (options.playwright !== false) {
    await addPlaywrightCheck(result, config);
  }

  classifyResult(result, config);
  return result;
}

function collectEnvironment() {
  const proxyEnv = {};
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy']) {
    if (process.env[name]) proxyEnv[name] = redactProxy(process.env[name]);
  }

  return {
    platform: process.platform,
    release: os.release(),
    node: process.version,
    proxyEnv,
  };
}

async function addSystemNetworkChecks(result, config, options) {
  if (process.platform !== 'win32') {
    pushCheck(result, 'system.network', true, 'Sistema nao-Windows: rotas/adaptadores nao inspecionados.');
    return;
  }

  const [ipconfig, routes, winhttp] = await Promise.all([
    execFileSafe('ipconfig', ['/all'], options.execFile),
    execFileSafe('route', ['print', '-4'], options.execFile),
    execFileSafe('netsh', ['winhttp', 'show', 'proxy'], options.execFile),
  ]);

  const vpnAdapters = parseVpnAdapters(ipconfig.stdout, config.vpnAdapterKeywords);
  const routeHints = config.vpnRouteHints.map((hint) => ({
    hint,
    present: routes.stdout.toLowerCase().includes(String(hint).toLowerCase()),
  }));

  pushCheck(result, 'windows.ipconfig', ipconfig.ok, ipconfig.ok ? 'ipconfig coletado.' : ipconfig.error);
  pushCheck(result, 'windows.routes', routes.ok, routes.ok ? 'route print coletado.' : routes.error);
  pushCheck(result, 'windows.winhttpProxy', winhttp.ok, summarizeWinHttp(winhttp.stdout || winhttp.error));
  pushCheck(
    result,
    'vpn.adapters',
    vpnAdapters.active.length > 0 || !config.requiresVpn || !config.strictVpn,
    `${vpnAdapters.active.length} adaptador(es) VPN ativo(s), ${vpnAdapters.disconnected.length} desconectado(s).`,
    { active: vpnAdapters.active, disconnected: vpnAdapters.disconnected }
  );

  if (routeHints.length > 0) {
    const missing = routeHints.filter((route) => !route.present);
    pushCheck(
      result,
      'vpn.routes',
      missing.length === 0,
      missing.length === 0
        ? 'Todas as dicas de rota VPN apareceram na tabela IPv4.'
        : `Rotas esperadas ausentes: ${missing.map((route) => route.hint).join(', ')}`,
      { routeHints }
    );
  }

  if (config.requiresVpn && config.strictVpn && vpnAdapters.active.length === 0) {
    result.findings.push('VPN obrigatoria, mas nenhum adaptador VPN ativo foi detectado.');
  }
}

function execFileSafe(command, args, execFile = childProcess.execFile) {
  return new Promise((resolve) => {
    execFile(command, args, { encoding: 'utf8', windowsHide: true, timeout: 15_000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout || '',
        stderr: stderr || '',
        error: error ? `${error.message}${stderr ? `: ${stderr}` : ''}` : null,
      });
    });
  });
}

function parseVpnAdapters(ipconfigOutput, keywords = VPN_KEYWORDS) {
  const active = [];
  const disconnected = [];
  const normalizedKeywords = keywords.map((keyword) => String(keyword).toLowerCase());
  const sections = String(ipconfigOutput || '').split(/\r?\n\r?\n/);

  for (const section of sections) {
    const lower = section.toLowerCase();
    if (!normalizedKeywords.some((keyword) => lower.includes(keyword))) continue;

    const firstLine = section.split(/\r?\n/).find(Boolean) || 'Adaptador VPN';
    const name = firstLine.replace(/:$/, '').trim();
    const isDisconnected = /media disconnected|m.dia desconectada|midia desconectada|desconectada/i.test(section);
    if (isDisconnected) disconnected.push(name);
    else active.push(name);
  }

  return { active, disconnected };
}

function summarizeWinHttp(stdout) {
  const text = String(stdout || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Proxy WinHTTP nao informado.';
  return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}

async function addTargetChecks(result, config, options = {}) {
  const dnsChecker = options.checkDns || checkDns;
  const tcpChecker = options.checkTcp || checkTcp;
  const fetchChecker = options.checkFetch || checkFetch;

  for (const host of config.vpnHosts) {
    const target = parseTarget(host, host === config.baseHost ? config.basePort : 443);
    const dnsCheck = await dnsChecker(target.hostname);
    pushCheck(result, `dns.${target.label}`, dnsCheck.ok, dnsCheck.message, dnsCheck.details);

    const addresses = dnsCheck.details?.addresses?.length ? dnsCheck.details.addresses : [target.hostname];
    const tcpTargets = unique(addresses.map((address) => address.address || address)).slice(0, 4);
    for (const address of tcpTargets) {
      const tcpCheck = await tcpChecker(address, target.port, config.timeoutMs);
      pushCheck(result, `tcp.${target.label}.${address}.${target.port}`, tcpCheck.ok, tcpCheck.message, tcpCheck.details);
    }
  }

  const fetchCheck = await fetchChecker(config.baseUrl, config.timeoutMs);
  pushCheck(result, 'node.fetch.baseUrl', fetchCheck.ok, fetchCheck.message, fetchCheck.details);
}

function parseTarget(value, defaultPort) {
  const raw = String(value);
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    return {
      label: raw,
      hostname: url.hostname,
      port: Number(url.port || (url.protocol === 'http:' ? 80 : defaultPort)),
    };
  } catch {
    return { label: raw, hostname: raw, port: defaultPort };
  }
}

async function checkDns(host) {
  try {
    const addresses = await dns.lookup(host, { all: true });
    return {
      ok: addresses.length > 0,
      message: `${host} resolveu para ${addresses.map((item) => item.address).join(', ')}`,
      details: { addresses },
    };
  } catch (error) {
    return { ok: false, message: `DNS falhou para ${host}: ${error.message}`, details: { code: error.code } };
  }
}

function checkTcp(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let done = false;
    const started = Date.now();

    function finish(ok, message, extra = {}) {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok, message, details: { host, port, durationMs: Date.now() - started, ...extra } });
    }

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, `TCP ${host}:${port} conectou.`));
    socket.once('timeout', () => finish(false, `TCP ${host}:${port} timeout em ${timeoutMs}ms.`, { code: 'TIMEOUT' }));
    socket.once('error', (error) => finish(false, `TCP ${host}:${port} falhou: ${error.message}`, { code: error.code }));
  });
}

async function checkFetch(url, timeoutMs) {
  const started = Date.now();
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    }
    return {
      ok: response.status < 500,
      message: `Node fetch recebeu HTTP ${response.status}.`,
      details: { status: response.status, durationMs: Date.now() - started },
    };
  } catch (error) {
    return {
      ok: false,
      message: `Node fetch falhou: ${error.name} ${error.message}`,
      details: { durationMs: Date.now() - started },
    };
  }
}

async function addPlaywrightCheck(result, config) {
  const started = Date.now();
  let browser;
  try {
    const { chromium } = require('playwright');
    const launchOptions = { headless: true };
    if (config.proxy) launchOptions.proxy = { server: config.proxy };
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const response = await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded', timeout: config.timeoutMs });
    const title = await page.title().catch(() => '');
    await context.close();
    pushCheck(result, 'playwright.chromium.baseUrl', Boolean(response), `Playwright abriu HTTP ${response?.status() || 'sem response'}.`, {
      status: response?.status() || null,
      title,
      durationMs: Date.now() - started,
      proxy: config.proxy ? redactProxy(config.proxy) : null,
    });
  } catch (error) {
    pushCheck(result, 'playwright.chromium.baseUrl', false, `Playwright falhou: ${error.name} ${error.message}`, {
      durationMs: Date.now() - started,
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

function pushCheck(result, name, ok, message, details = undefined) {
  result.checks.push({ name, ok: Boolean(ok), message, ...(details ? { details } : {}) });
}

function classifyResult(result, config) {
  const failed = result.checks.filter((check) => !check.ok);
  const targetFailures = failed.filter((check) => /^(dns|tcp|node\.fetch|playwright)/.test(check.name));

  if (targetFailures.length > 0) {
    result.ok = false;
    result.findings.push('Rede do processo BKPilot nao consegue acessar o alvo de forma confiavel.');
  }

  if (config.requiresVpn && config.strictVpn && failed.some((check) => check.name === 'vpn.adapters')) {
    result.ok = false;
  }

  if (failed.some((check) => check.name.startsWith('vpn.routes'))) {
    result.ok = false;
    result.findings.push('Tabela de rotas nao contem uma rota VPN esperada.');
  }

  if (result.ok) {
    result.findings.push(
      result.playwrightSkipped
        ? 'Preflight aprovado: Node consegue acessar o alvo. Playwright nao foi executado (--no-playwright).'
        : 'Preflight aprovado: Node e Playwright conseguem acessar o alvo.'
    );
    return;
  }

  result.remediation.push('Conecte a VPN no Windows antes de rodar BKPilot.');
  result.remediation.push('Confirme que node.exe, npx.cmd e Chromium/Chrome Playwright estao liberados no firewall/antivirus.');
  result.remediation.push('Se o cliente usa proxy corporativo, configure proxy em clients/<id>/config.json ou HTTPS_PROXY.');
  result.remediation.push('Se o cliente usa split tunnel, adicione vpnRouteHints no config e confirme route print -4.');
  result.remediation.push('Rode de novo: npm run preflight:vpn -- --client <id>.');
}

function redactProxy(value) {
  return String(value).replace(/\/\/([^:@/]+):([^@/]+)@/, '//[REDACTED]:[REDACTED]@');
}

function formatHuman(result) {
  const lines = [];
  lines.push(`BKPilot VPN preflight: ${result.ok ? 'OK' : 'FALHOU'}`);
  lines.push(`Cliente: ${result.clientId || '-'}`);
  lines.push(`URL: ${result.baseUrl}`);
  lines.push(`VPN obrigatoria: ${result.requiresVpn ? 'sim' : 'nao'}`);
  if (result.proxy) lines.push(`Proxy: ${result.proxy}`);
  lines.push('');
  for (const check of result.checks) {
    lines.push(`${check.ok ? 'OK' : 'ERRO'} ${check.name}: ${check.message}`);
  }
  lines.push('');
  lines.push('Diagnostico:');
  for (const finding of result.findings) lines.push(`- ${finding}`);
  if (result.remediation.length > 0) {
    lines.push('');
    lines.push('Como corrigir:');
    for (const item of result.remediation) lines.push(`- ${item}`);
  }
  return lines.join('\n');
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      return;
    }
    const result = await runPreflight(args);
    console.log(args.json ? JSON.stringify(result, null, 2) : formatHuman(result));
    process.exitCode = result.ok ? 0 : 2;
  } catch (error) {
    console.error(`Erro preflight:vpn: ${error.message}`);
    console.error(usage());
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  normalizeConfig,
  parseArgs,
  parseTarget,
  parseVpnAdapters,
  redactProxy,
  runPreflight,
};
