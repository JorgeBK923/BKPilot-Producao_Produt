# AGENTS.md â€” BugKillers QA Agent

## Quick Start
```bash
claude
# Slash commands in .claude/commands/ and dist/{claude,codex,opencode}/ (27 total, incluindo /plano-automacao e skills mobile Appium)
```

## Framework
Claude Code + **Playwright MCP** via `.claude/settings.json` para web atual, e arquitetura **Appium/MCP** para skills mobile.

## Arquitetura Core/Comercial/Producao
- Este repositorio e o futuro **BKPilot-Producao**; a pasta ainda pode estar chamada `BKPilot`.
- Codigo compartilhado entre Comercial e Producao vive no pacote externo `@bugkillers/bkpilot-core`, hoje fixado em `github:JorgeBK923/BKPilot-Core#v0.2.0`.
- Os arquivos `core/browser.js`, `core/client.js`, `core/env.js`, `core/evidence.js`, `core/logger.js` e `core/paths.js` sao apenas wrappers de compatibilidade. Nao coloque logica nova neles.
- Para alterar comportamento compartilhado, edite o repositorio `BKPilot-Core`, publique nova tag e depois atualize a dependencia neste projeto.
- O runtime mobile compartilhado (Appium client, device manager e MCP mobile) pertence ao `BKPilot-Core`; neste repositorio devem ficar apenas wrappers finos e skills operacionais.
- Frontend comercial, API da demo, relatorio comercial, fluxo `demo_mvp` e skill `/demo-comercial` nao pertencem ao Producao.
- Producao deve implementar apenas rotinas, skills e regras operacionais. Nao copiar codigo comercial para ca sem decisao arquitetural explicita.
- Este repositorio nao tem suite `npm test` configurada; ao trocar versao do Core, rode `npm install` e smoke tests de importacao dos wrappers.`n`n## Security (BLOCK-B/C/D/E)
- **NEVER** pass password inline (`--login email:senha`). Stop immediately.
- Password from `QA_PASSWORD` in `clients/<id>/.env` only (multi-tenant â€” each client has its own isolated env)
- Jira/GitHub tokens from root `.env` only â€” **NEVER** pass tokens inline as parameters
- All `.env` files (root and `clients/*/.env`) are gitignored

## Browser Automation
- Antes de qualquer skill com browser para cliente real, rode `npm run preflight:vpn -- --client <id>` ou `npm run preflight:vpn -- --client <id> --url <URL>` quando a URL vier por argumento.
- Se o preflight falhar, nao abrir Playwright. Corrija VPN/proxy/firewall/rota primeiro e registre o diagnostico.
- Web atual: Playwright MCP only â€” no Selenium, Cypress
- Mobile web e APK: Appium/MCP only â€” no Playwright, Selenium, Cypress
- Use `networkidle` wait for SPA pages
- Log `console.error/warning` â†’ `clients/<id>/resultado/<timestamp>/console_log.json`
- Log network failures (â‰¥400, >3000ms) â†’ `clients/<id>/resultado/<timestamp>/network_log.json`
- Detect session expiry (401/redirect) â†’ re-authenticate and continue

## Mobile Contract, Doctor and Redaction
- Todo cliente mobile deve ter bloco `mobile` completo em `clients/<id>/config.json`; novos clientes criados por `novo-cliente.sh` ja recebem o template.
- Para `mobile.target: "apk"`, logica reutilizavel fica no Core (`@bugkillers/bkpilot-core/mobile-apk`); Producao so integra wrappers/skills.
- Em cliente real APK, `mobile.allowedAppPackages` e obrigatorio e deve conter `mobile.apk.appPackage` antes de qualquer download/upload/install.
- `mobile.apk.uploadStrategy` padrao e `"auto"`; `"preuploaded"` e opt-in e exige `mobile.apk.storageFilename`.
- APK por URL HTTPS deve usar cache por execucao; nunca baixar o mesmo APK N vezes para N cenarios.
- Antes de smoke mobile, rode `npm run mobile:doctor -- --cliente <id>` para validar schema, ADB/device local, Appium, credenciais cloud e capabilities minimas.
- Evidencias mobile passam por mascaramento no Core antes de persistir: XML usa `***REDACTED***`; PNG usa retangulos opacos por bounding box configurado em `mobile.redaction.screenshotFields`.
- Categorias padrao de XML/texto sempre ativas: CPF, CNPJ, email, telefone, cartao, token/JWT e senha. Desabilitar exige `mobile.redaction.allowUnsafeDisable: true`.
- `redaction_log.json` registra apenas contagens por categoria; nunca valores originais.
- Relatorio final mobile: `npm run mobile:report -- --cliente <id> [--timestamp <ts>] [--target web|apk|hybrid]` gera `relatorio_final.md`, `relatorio_final.pdf` e `demo_summary.json`.

## Data Cleanup
- Skills that create data must clean up after
- Log to `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- Mark unreversible items as "pendente"

## Video Recording
- Use Playwright `recordVideo` (camelCase) â€” **NOT** `record_video` (snake_case is silently ignored in Node.js)
- Correct: `browser.newContext({ recordVideo: { dir: '...', size: { width: 1280, height: 720 } } })`
- Wrong: `browser.newContext({ record_video: { dir: '...', size: { width: 1280, height: 720 } } })` â† **NO VIDEO GENERATED, no error thrown**
- Use `page.video()` to get the Video object; call `await page.video().path()` for the file path
- Close the context (`await context.close()`) to finalize the .webm file before reading it
- Convert `.webm` â†’ `.mp4`: `ffmpeg -i input.webm -c:v libx264 -crf 23 -preset fast output.mp4`
- If ffmpeg missing: keep `.webm`, show warning, continue (non-blocking)

## Artifacts (Estrutura Multi-Tenant por Cliente)
> **REGRA:** Todos os artefatos gerados por skills devem ficar **dentro** da pasta do cliente (`clients/<id>/`). **NUNCA** criar pastas `resultado/`, `estado/` ou `entregaveis/` na raiz do projeto.

```
clients/<id>/                 # pasta do cliente (multi-tenant)
  â”œâ”€ estado/                  # /explorar output
  â”‚   â”œâ”€ mapa.md
  â”‚   â”œâ”€ fluxos.md
  â”‚   â”œâ”€ elementos.json
  â”‚   â””â”€ api_endpoints.json
  â”œâ”€ resultado/<timestamp>/   # execution outputs
  â”‚   â”œâ”€ console_log.json
  â”‚   â”œâ”€ network_log.json
  â”‚   â”œâ”€ cleanup_log.json
  â”‚   â”œâ”€ dados_brutos/
  â”‚   â”œâ”€ videos/
  â”‚   â”œâ”€ screenshots/
  â”‚   â””â”€ *.md / *.pdf
  â”œâ”€ resultado/latest â†’ <timestamp>/   # symlink para execuÃ§Ã£o mais recente
  â”œâ”€ entregaveis/automacao/<stack>/   # pacote de automaÃ§Ã£o para o cliente
  â”‚   â”œâ”€ codigo/
  â”‚   â”œâ”€ *.md
  â”‚   â””â”€ *.pdf
  â”œâ”€ cenarios/                # planilhas e fichas de risco do cliente
  â”œâ”€ flows/                   # implementaÃ§Ã£o customizada de runScenario
  â”œâ”€ config.json              # baseUrl, envPassword, defaultFlow
  â”œâ”€ login.js                 # funÃ§Ã£o de login do cliente
  â””â”€ .env                     # QA_PASSWORD per client (never commit)

cenarios/cenarios.xlsx        # test spreadsheet (global)
.env                          # global integrations: Jira/GitHub tokens (never commit)
CLAUDE.md                     # global rules
AGENTS.md                     # quick reference
```

## Conventions
- **Timestamps:** `YYYY-MM-DD_HHMM` (e.g., `2026-04-13_1530`)
- **Artifact naming:** `<type>_<context>_<timestamp>.<ext>`
- **Gate checks:** `/explorar` and `/gerar-cenarios` have mandatory gates â€” if âŒ in coverage, complete it
- **Phase 3 mutative:** controlled by `permite_mutativo` from project API (`true` = execute POST/PUT/DELETE)
- **Spreadsheet:** atualizar a original in-place (fazer backup `.bak` antes), NÃƒO criar planilha separada
- **Client automation reports:** todo `.md` destinado ao cliente em `clients/<id>/entregaveis/automacao/<stack>/` deve ter `.pdf` correspondente
- **Internal governance:** nunca enviar `clients/<id>/resultado/<timestamp>/governanca/`, `.env`, tokens, `geracao_id`, identidade de modelo/agente/executor ou logs internos ao cliente

## Testing
- `/testar-modulo` = Etapa A (spreadsheet) + Etapa B (free exploration: 375px viewport, 3G throttle, memory leak detection)
- `--dados <file.json>` for data-driven flow execution

## Reteste de Bugs â€” Regras ObrigatÃ³rias

### Regra dos 3 Tentativas MÃ­nimas
Antes de marcar qualquer bug como **inconclusivo**, vocÃª DEVE tentar pelo menos 3 abordagens diferentes e documentar cada tentativa (o que tentou + resultado exato).

### Checklist ObrigatÃ³rio (todas aplicÃ¡veis antes de "inconclusivo")
- [ ] `page.route()` para interceptar/modificar requisiÃ§Ãµes de rede
- [ ] `page.evaluate()` para injetar JavaScript (override de funÃ§Ãµes, simulaÃ§Ã£o de estados)
- [ ] `page.setViewportSize()` ou `document.body.style.zoom` para testar resoluÃ§Ã£o/zoom
- [ ] Dados de teste alternativos (tabela inexistente, usuÃ¡rio diferente, input invÃ¡lido)
- [ ] Documentar cada tentativa com: tÃ©cnica usada, cÃ³digo executado, erro/resultado exato

### TÃ©cnicas de SimulaÃ§Ã£o ObrigatÃ³rias
| CenÃ¡rio | TÃ©cnica |
|---------|---------|
| Falha de rede | `page.route('**/api/**', route => route.abort('failed'))` ou `page.evaluate(() => { window.fetch = () => Promise.reject(new Error('network')) })` |
| Zoom 50% | `page.evaluate(() => document.body.style.zoom = '0.5')` ou `page.setViewportSize(640, 360)` |
| Tabela inexistente | Digitar diretamente no chat da IA: `"Busque dados da tabela nao_existe_xyz"` |
| InterceptaÃ§Ã£o de prompts | `page.route('**/ai-assist', route => { console.log(route.request().postData()); route.continue() })` |
| Throttle de rede | `page.route('**', route => { const delay = Math.random() * 3000; setTimeout(() => route.continue(), delay) })` |
| UsuÃ¡rio diferente | Logout â†’ login com credencial alternativa (nunca inline, sempre via `.env`) |

### ProibiÃ§Ãµes
- **NUNCA** usar frases como "nÃ£o foi possÃ­vel" sem listar o que foi tentado
- **NUNCA** marcar como inconclusivo sem tentar `page.route()` para interceptaÃ§Ã£o
- **NUNCA** marcar como inconclusivo sem tentar `page.evaluate()` para simulaÃ§Ã£o
- **NUNCA** pular para inconclusivo por "falta de credenciais" sem tentar com as credenciais disponÃ­veis primeiro

### Formato de DocumentaÃ§Ã£o de Tentativas
```markdown
### JBUG-XXX â€” [TÃ­tulo]
- **Status:** ðŸ”„ Inconclusivo
- **Tentativas:**
  1. `page.route('**/api/**', ...)` â†’ [resultado exato]
  2. `page.evaluate(() => ...)` â†’ [resultado exato]
  3. [outra abordagem] â†’ [resultado exato]
- **Bloqueio real:** [explicar o que realmente impede, nÃ£o suposiÃ§Ãµes]
```

## Edge Cases
- Session expiry: re-authenticate, continue
- Many 5xx: alert in summary
- ffmpeg failure: keep `.webm`, non-blocking

## Setup
```bash
bash setup.sh  # one-time per machine: installs Playwright MCP + Chromium, creates root .env (Jira/GitHub)

# For each new client (creates clients/<id>/ with .env, config.json, login.js skeleton):
./novo-cliente.sh <id> --nome "Client Name" --url https://app.client.com
# Then edit clients/<id>/.env with QA_PASSWORD
```

