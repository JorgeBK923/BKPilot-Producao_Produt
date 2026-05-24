#!/bin/bash
# BugKillers QA Agent — Criação de novo cliente (multi-tenant)
# Uso: ./novo-cliente.sh <id> [--nome "Nome do Cliente"] [--url https://...]

set -e

ID="$1"
shift || true

if [ -z "$ID" ]; then
  echo ""
  echo "❌ Uso: ./novo-cliente.sh <id> [--nome \"Nome\"] [--url https://...]"
  echo "   Ex.: ./novo-cliente.sh acme --nome \"ACME Sistemas\" --url https://app.acme.com.br"
  echo ""
  exit 1
fi

if [[ ! "$ID" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  echo "❌ id inválido: '$ID'. Use apenas letras minúsculas, números, '-' ou '_'."
  exit 1
fi

NOME=""
URL=""
TARGET="web"
while [ $# -gt 0 ]; do
  case "$1" in
    --nome) NOME="$2"; shift 2;;
    --url)  URL="$2";  shift 2;;
    --target) TARGET="$2"; shift 2;;
    *) echo "⚠️  flag desconhecida: $1"; shift;;
  esac
done

[ -z "$NOME" ] && NOME="$ID"
[ -z "$URL" ]  && URL="https://app.exemplo.com.br"

if [[ "$TARGET" != "web" && "$TARGET" != "apk" ]]; then
  echo "âŒ target invÃ¡lido: '$TARGET'. Use web ou apk."
  exit 1
fi

DIR="clients/$ID"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   BugKillers — Novo Cliente               ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  id:     $ID"
echo "  nome:   $NOME"
echo "  url:    $URL"
echo "  target: $TARGET"
echo "  pasta:  $DIR"
echo ""

if [ -d "$DIR" ]; then
  echo "❌ Cliente '$ID' já existe em $DIR. Abortando para não sobrescrever."
  exit 1
fi

# ── 1. Estrutura de pastas ────────────────────────────────────────

echo "▶ Criando estrutura..."
mkdir -p "$DIR/flows"
mkdir -p "$DIR/cenarios"
mkdir -p "$DIR/fixtures"
mkdir -p "$DIR/bugs"
mkdir -p "$DIR/scripts"
mkdir -p "$DIR/estado"
mkdir -p "$DIR/resultado"
mkdir -p "$DIR/entregaveis/automacao/playwright"
echo "  ✅ $DIR/{flows,cenarios,fixtures,bugs,scripts,estado,resultado,entregaveis}"

# ── 2. .env do cliente ────────────────────────────────────────────

if [ ! -f clients/.env.example ]; then
  echo "❌ clients/.env.example não encontrado. Rode ./setup.sh antes."
  exit 1
fi
cp clients/.env.example "$DIR/.env"
echo "  ✅ $DIR/.env criado (preencha QA_PASSWORD antes de usar)"

if [ "$TARGET" = "apk" ]; then
  printf "Substitua este placeholder pelo APK real do cliente.\n" > "$DIR/fixtures/app-placeholder.apk"
fi

APK_BLOCK=""
if [ "$TARGET" = "apk" ]; then
  APK_BLOCK='
    "apk": {
      "app": "clients/'"$ID"'/fixtures/app-placeholder.apk",
      "appPackage": "com.cliente.app",
      "appActivity": ".MainActivity",
      "uploadStrategy": "auto",
      "storageFilename": "",
      "version": "v1",
      "noReset": true,
      "fullReset": false
    },'
fi

# ── 3. config.json skeleton ───────────────────────────────────────

cat > "$DIR/config.json" <<EOF
{
  "id": "$ID",
  "nome": "$NOME",
  "baseUrl": "$URL",
  "timeout_ms": 30000,
  "max_paginas": 500,
  "envPassword": "QA_PASSWORD",
  "postLoginSelector": "",
  "loginMaxAttempts": 3,
  "defaultFlow": "",
  "defaultRetesteFlow": "",
  "requiresVpn": false,
  "vpnHosts": [],
  "vpnRouteHints": [],
  "vpnAdapterKeywords": [],
  "strictVpn": false,
  "proxy": "",
  "preflight": {
    "timeoutMs": 10000
  },
  "mobile": {
    "provider": "local",
    "target": "$TARGET",
    "appiumUrl": "env:APPIUM_URL",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "baseUrl": "$URL",
    "capabilities": {},
    "allowedAppiumHosts": [],
    "allowedUrls": [
      "$URL"
    ],
    "allowedAppPackages": [],$APK_BLOCK
    "timeouts": {
      "session": 60000,
      "pageLoad": 30000,
      "findElement": 10000,
      "command": 30000,
      "uploadApk": 300000,
      "downloadArtifact": 60000
    },
    "retry": {
      "maxAttempts": 2,
      "backoffMs": 2000,
      "retryableErrors": [
        "ECONNRESET",
        "ETIMEDOUT",
        "5xx"
      ]
    },
    "limits": {
      "maxConcurrentSessions": 2,
      "maxMinutesPerRun": 30,
      "maxScenariosPerRun": 50
    },
    "evidence": {
      "videoEnabled": true,
      "screenshotOnFail": true,
      "retentionDays": 90
    },
    "redaction": {
      "enabled": true,
      "screenshotFields": [
        { "name": "campo_sensivel_exemplo", "bounds": [0, 0, 1, 1] }
      ],
      "xmlFields": []
    }
  }
}
EOF
echo "  ✅ $DIR/config.json"

# ── 4. login.js skeleton ──────────────────────────────────────────

cat > "$DIR/login.js" <<'EOF'
// Fluxo de login do cliente.
// Chamado pela engine via core/auth.js. Recebe page (Playwright) e contexto.
// Deve retornar quando a sessão estiver autenticada.
//
// TODO: ajustar seletores de usuário/senha e postLoginSelector em config.json.

module.exports = async function login(page, { email, password, config, log = () => {} }) {
  const baseUrl = config.baseUrl;
  const maxAttempts = config.loginMaxAttempts || 3;
  const postLoginSelector = config.postLoginSelector;

  if (!postLoginSelector) {
    throw new Error('Configure postLoginSelector em clients/<id>/config.json antes de usar.');
  }

  // TODO: trocar os seletores abaixo pelos reais do cliente
  const usuario = page.getByPlaceholder('Digite seu usuário');
  const senha = page.getByPlaceholder('Digite sua senha');

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt === 1) {
        await page.goto(baseUrl + '/', { waitUntil: 'commit', timeout: 45000 });
      } else {
        log(`  ↻ Login retry ${attempt}: reload`);
        await page.reload({ waitUntil: 'commit', timeout: 45000 })
          .catch(async () => {
            await page.goto(baseUrl + '/', { waitUntil: 'commit', timeout: 45000 });
          });
      }
      await usuario.waitFor({ timeout: 30000 });
      await usuario.fill(email);
      await senha.fill(password);
      await page.getByRole('button', { name: /entrar/i }).click();
      await page.waitForSelector(postLoginSelector, { timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      return;
    } catch (e) {
      lastErr = e;
      log(`  ⚠ Login tentativa ${attempt} falhou: ${(e.message || '').slice(0, 80)}`);
    }
  }
  throw lastErr || new Error(`Login falhou em ${maxAttempts} tentativas`);
};
EOF
echo "  ✅ $DIR/login.js (skeleton — ajuste os seletores)"

# ── Conclusão ─────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Cliente criado! Próximos passos:        ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                           ║"
echo "║  1. Edite $DIR/.env e preencha QA_PASSWORD"
echo "║  2. Ajuste $DIR/config.json (postLoginSelector)"
echo "║  3. Ajuste $DIR/login.js (seletores reais)"
echo "║  4. Rode: npm run preflight:vpn -- --client $ID"
echo "║  5. /explorar $URL --login qa@exemplo.com"
echo "║                                           ║"
echo "╚══════════════════════════════════════════╝"
echo ""
