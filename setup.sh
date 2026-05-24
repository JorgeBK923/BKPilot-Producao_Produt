#!/bin/bash
# BugKillers QA Agent — Setup do Ambiente
# Execute uma vez antes de usar o agente pela primeira vez

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   BugKillers QA Agent — Setup            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Verificar pré-requisitos ───────────────────────────────────

echo "▶ Verificando pré-requisitos..."

# Node.js
if ! command -v node &> /dev/null; then
  echo "  ❌ Node.js não encontrado. Instale em: https://nodejs.org"
  exit 1
fi
echo "  ✅ Node.js $(node -v)"

# npm
if ! command -v npm &> /dev/null; then
  echo "  ❌ npm não encontrado."
  exit 1
fi
echo "  ✅ npm $(npm -v)"

# Claude Code
if ! command -v claude &> /dev/null; then
  echo "  ❌ Claude Code não encontrado."
  echo "     Instale com: npm install -g @anthropic-ai/claude-code"
  exit 1
fi
echo "  ✅ Claude Code encontrado"

# ffmpeg
if ! command -v ffmpeg &> /dev/null; then
  echo ""
  echo "  ⚠️  ffmpeg não encontrado — necessário para converter vídeos para MP4."
  echo "     Instale com:"
  echo "       macOS:   brew install ffmpeg"
  echo "       Ubuntu:  sudo apt-get install -y ffmpeg"
  echo "       Windows: https://ffmpeg.org/download.html"
  echo ""
  read -p "  Deseja continuar sem o ffmpeg? (s/N): " resp
  if [[ "$resp" != "s" && "$resp" != "S" ]]; then
    echo "  Setup interrompido. Instale o ffmpeg e execute novamente."
    exit 1
  fi
else
  echo "  ✅ ffmpeg $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f3)"
fi

echo ""

# ── 2. Instalar Playwright MCP ────────────────────────────────────

echo "▶ Instalando Playwright MCP..."
npx @playwright/mcp@latest --version > /dev/null 2>&1 || true
echo "  ✅ Playwright MCP pronto (via npx)"

# ── 3. Instalar browsers do Playwright ───────────────────────────

echo ""
echo "▶ Instalando browsers do Playwright (Chromium)..."
npx playwright install chromium
echo "  ✅ Chromium instalado"

# ── 4. Criar estrutura de pastas ──────────────────────────────────

echo ""
echo "▶ Criando estrutura de pastas..."
mkdir -p estado/screenshots
mkdir -p resultado
mkdir -p cenarios/historico
mkdir -p clients
echo "  ✅ estado/, resultado/, cenarios/, clients/ criados"

# ── 5. Configurar .env raiz (integrações globais) ────────────────

echo ""
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  ✅ .env raiz criado a partir do .env.example"
  echo ""
  echo "  ℹ️  O .env raiz é reservado para integrações globais"
  echo "     (Jira, GitHub Issues). Credenciais de QA por cliente"
  echo "     ficam em clients/<id>/.env (arquitetura multi-tenant)."
else
  echo "  ✅ .env raiz já existe — mantido sem alterações"
fi

# ── 5.1. Orientação sobre credenciais por cliente ─────────────────

echo ""
echo "▶ Credenciais por cliente (multi-tenant):"
echo "     Para cada novo cliente, rode:"
echo "       ./novo-cliente.sh <id>"
echo "     Isso cria clients/<id>/ com .env, config.json e login.js."

# ── 6. Verificar .gitignore ───────────────────────────────────────

echo ""
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo "  ✅ .gitignore protege o .env"
else
  echo "  ⚠️  Verifique se .env está no .gitignore antes do primeiro commit"
fi

# ── Conclusão ─────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Setup concluído! Próximos passos:       ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  1. Crie um cliente: ./novo-cliente.sh <id> ║"
echo "║  2. Preencha QA_PASSWORD em clients/<id>/.env ║"
echo "║  3. Execute: claude                        ║"
echo "║  4. Digite:  /explorar <URL>               ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
