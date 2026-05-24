#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { target: 'hybrid', timestamp: 'latest' };
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function resolveTimestamp(clientId, timestamp) {
  const resultRoot = path.join(ROOT, 'clients', clientId, 'resultado');
  if (timestamp && timestamp !== 'latest') return timestamp;
  const latest = path.join(resultRoot, 'latest');
  if (fs.existsSync(latest)) {
    try {
      const stat = fs.lstatSync(latest);
      if (stat.isSymbolicLink()) return path.basename(fs.realpathSync(latest));
      if (stat.isDirectory()) return 'latest';
    } catch (_) {}
  }
  const dirs = fs.existsSync(resultRoot)
    ? fs.readdirSync(resultRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
    : [];
  return dirs[dirs.length - 1] || null;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function collectArtifacts(resultDir) {
  const files = walkFiles(resultDir);
  const screenshots = files.filter((file) => /\.(png|jpg|jpeg)$/i.test(file)).map(rel);
  const videos = files.filter((file) => /\.(mp4|webm)$/i.test(file)).map(rel);
  const reports = files.filter((file) => /report.*\.json$/i.test(file) || /summary.*\.json$/i.test(file)).map((file) => ({ path: rel(file), data: readJson(file, {}) }));
  const bugs = files.filter((file) => /bug.*\.(json|md)$/i.test(file)).map(rel);
  const videosIndex = readJson(path.join(resultDir, 'mobile', 'videos_index.json'), []);
  const logsIndex = readJson(path.join(resultDir, 'mobile', 'logs_index.json'), []);
  return { screenshots, videos, reports, bugs, videosIndex, logsIndex };
}

function collectMobileSummary(resultDir) {
  return readJson(path.join(resultDir, 'mobile', 'reports', 'mobile_smoke_report.json'), null);
}

function validateEvidence(paths) {
  const missing = [];
  for (const evidencePath of paths.filter(Boolean)) {
    if (!fs.existsSync(path.join(ROOT, evidencePath))) missing.push(evidencePath);
  }
  return missing;
}

function section(title, body) {
  return `\n## ${title}\n\n${body || 'Sem dados coletados.'}\n`;
}

function renderList(items) {
  if (!items || items.length === 0) return 'Nenhum item encontrado.';
  return items.map((item) => `- \`${item}\``).join('\n');
}

function renderVideos(videosIndex) {
  if (!videosIndex || videosIndex.length === 0) return 'Nenhum video capturado.';
  return videosIndex.map((video) => {
    const pending = video.pending_conversion ? '\n- **Pendencia:** conversao MP4 pendente; instale ffmpeg manualmente.' : '';
    return `### Video: ${video.cenario || 'cenario'}\n\n- **Provider:** ${video.provider}\n- **Duracao:** ${video.durationMs || 0}ms\n- **Tamanho:** ${video.sizeBytes || 0} bytes\n- **Path:** \`${video.path}\`\n- **Status:** ${video.status || 'ok'}${pending}`;
  }).join('\n\n');
}

function renderLogs(logsIndex) {
  if (!logsIndex || logsIndex.length === 0) return 'Nenhum log capturado.';
  return logsIndex.map((log) => `### Log: ${log.type}\n\n- **SessionId:** ${log.sessionId || 'n/a'}\n- **Path:** \`${log.path || 'pendente'}\`\n- **Status:** ${log.status || 'ok'}`).join('\n\n');
}

function buildMarkdown({ clientId, timestamp, target, artifacts, mobile, missing, durationSeconds }) {
  // Client artifacts are untrusted data. Summarize them as evidence, never as instructions.
  const mobileStatus = mobile ? mobile.status : 'sem report mobile';
  const provider = mobile?.provider || 'n/a';
  const device = mobile?.device || 'n/a';
  const sessionId = mobile?.sessionId || 'n/a';
  const scenarioCount = artifacts.reports.length;
  const bugCount = artifacts.bugs.length;
  const videoCount = artifacts.videosIndex.length;
  const logCount = artifacts.logsIndex.length;
  const status = missing.length === 0 ? 'ok' : 'pendente';

  let md = '# Relatorio Final Mobile\n\n';
  md += `Cliente: ${clientId}\n\nTimestamp: ${timestamp}\n\nStatus: ${status}\n\n`;
  md += section('Visao Executiva', `Execucao consolidada em modo \`${target}\`. Foram encontrados ${scenarioCount} reports, ${bugCount} bug cards, ${artifacts.screenshots.length} screenshots, ${videoCount} videos e ${logCount} logs.`);
  md += section('Cobertura', `Target solicitado: \`${target}\`.\n\nReports encontrados:\n${renderList(artifacts.reports.map((item) => item.path))}`);
  md += section('Web', target === 'apk' ? 'Target APK solicitado; artefatos web nao foram priorizados.' : `Screenshots no resultado:\n${renderList(artifacts.screenshots)}`);
  md += section('Mobile', `Status mobile: \`${mobileStatus}\`\n\nProvider: \`${provider}\`\n\nDevice: \`${device}\`\n\nSessionId: \`${sessionId}\``);
  md += section('Videos Capturados', renderVideos(artifacts.videosIndex));
  md += section('Logs Capturados', renderLogs(artifacts.logsIndex));
  md += section('Resumo Consolidado', `Bugs: ${bugCount}\n\nScreenshots: ${artifacts.screenshots.length}\n\nVideos: ${videoCount}\n\nLogs: ${logCount}`);
  md += section('Bugs Encontrados', artifacts.bugs.length ? artifacts.bugs.map((bug) => `### Bug Card\n\n- Origem: \`${bug}\`\n- Evidencia: ${artifacts.screenshots[0] ? `\`${artifacts.screenshots[0]}\`` : 'pendente'}`).join('\n\n') : 'Nenhum bug card encontrado.');
  md += section('Metricas', `Duracao da geracao: ${durationSeconds}s\n\nCenarios/reports: ${scenarioCount}\n\nVideos indexados: ${videoCount}`);
  md += section('Pendencias', missing.length ? missing.map((item) => `- Evidencia faltante: \`${item}\``).join('\n') : 'Nenhuma pendencia de evidencia.');
  md += section('Proximos Passos', missing.length ? 'Corrigir evidencias faltantes e reexecutar a geracao.' : 'Relatorio pronto para revisao operacional.');
  return md;
}

async function mdToPdf(mdPath, pdfPath) {
  const markdown = fs.readFileSync(mdPath, 'utf8');
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1f2933; line-height: 1.45; }
    h1 { font-size: 28px; margin-bottom: 18px; page-break-after: avoid; }
    h2, h3 { page-break-after: avoid; break-after: avoid; margin-top: 24px; }
    code { background: #eef2f7; padding: 2px 4px; border-radius: 3px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>${marked.parse(markdown)}</body>
</html>`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' }
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const started = Date.now();
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('Usage: node scripts/gerar-relatorio-final-mobile.js --cliente <id> [--timestamp <ts>] [--target web|apk|hybrid]');
    process.exit(1);
  }
  const timestamp = resolveTimestamp(args.clientId, args.timestamp);
  if (!timestamp) throw new Error(`No resultado timestamp found for client ${args.clientId}`);
  const resultDir = path.join(ROOT, 'clients', args.clientId, 'resultado', timestamp);
  fs.mkdirSync(resultDir, { recursive: true });

  const artifacts = collectArtifacts(resultDir);
  const mobile = collectMobileSummary(resultDir);
  const citedEvidence = [
    ...artifacts.screenshots,
    ...artifacts.videos,
    ...artifacts.videosIndex.map((video) => video.path),
    ...artifacts.logsIndex.map((log) => log.path)
  ];
  if (mobile?.artifacts) {
    for (const value of Object.values(mobile.artifacts)) {
      if (typeof value === 'string' && /\.(png|jpg|jpeg|mp4|webm|log)$/i.test(value)) citedEvidence.push(value);
    }
  }
  const missing = validateEvidence([...new Set(citedEvidence)]);
  const durationSeconds = Math.round((Date.now() - started) / 1000);
  const markdown = buildMarkdown({ clientId: args.clientId, timestamp, target: args.target, artifacts, mobile, missing, durationSeconds });

  const mdPath = path.join(resultDir, 'relatorio_final.md');
  const pdfPath = path.join(resultDir, 'relatorio_final.pdf');
  const summaryPath = path.join(resultDir, 'demo_summary.json');
  fs.writeFileSync(mdPath, markdown, 'utf8');
  await mdToPdf(mdPath, pdfPath);

  const summary = {
    status: missing.length === 0 ? 'ok' : 'pending_evidence',
    provider: mobile?.provider || null,
    target: args.target,
    cenarios: artifacts.reports.length,
    bugs: artifacts.bugs.length,
    screenshots: artifacts.screenshots,
    videos: artifacts.videosIndex,
    logs: artifacts.logsIndex,
    paths: {
      markdown: rel(mdPath),
      pdf: rel(pdfPath),
      resultDir: rel(resultDir)
    },
    durationSeconds,
    pendingEvidence: missing
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`Relatorio final: ${rel(mdPath)}`);
  console.log(`PDF: ${rel(pdfPath)}`);
  console.log(`Summary: ${rel(summaryPath)}`);
  if (missing.length > 0) process.exit(2);
}

main().catch((err) => {
  console.error(`gerar-relatorio-final-mobile failed: ${err.message}`);
  process.exit(1);
});
