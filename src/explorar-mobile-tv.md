---
id: explorar-mobile-tv
description: "Mapeia app Android TV (UI Leanback) via Appium, navegacao por D-pad."
name: "Exploracao Android TV"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
  - mobile.startSession
  - mobile.getState
  - mobile.back
  - mobile.waitFor
  - mobile.captureEvidence
  - mobile.endSession
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks:
  - leanback_nav
  - tv_evidence
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id>"
  - name: device
    required: false
    description: "Serial do emulador Android TV conectado via adb"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---
# /explorar-mobile-tv - Exploracao de app Android TV via Appium

## Descricao
Mapeia um aplicativo Android TV (UI Leanback / digital signage) instalado ou fornecido como APK, usando Appium. Esta skill e exclusiva para app de TV — navegacao por D-pad, sem toque. Nao usar Playwright.

## Uso
```bash
/explorar-mobile-tv --cliente <id> --device <serial> [--app <apk>] [--login <email>] [--escopo <texto>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `--device <serial>` - serial do emulador/device em `adb devices`. Inferido se houver apenas um.
- `--app <apk>` - caminho do APK. Se ausente, ler `clients/<id>/config.json` em `mobile.apk`.
- `--login <email>` - email de autenticacao. Senha exclusivamente de `QA_PASSWORD` em `clients/<id>/.env`.
- `--escopo <texto>` - restringe a exploracao a uma area ou fluxo.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android. `mobile.target` deve ser `tv`.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline em `--login`. Se vier `email:senha`, parar por erro de seguranca.
- Navegacao exclusiva por D-pad via `scripts/lib/mobile-tv-nav.js`. Nao usar `tap`.
- Screenshots em paisagem.
- Todos os artefatos dentro de `clients/<id>/`.
- Preferir seletores estaveis: `resource-id`, `content-desc`. XPath apenas como fallback.

## Pre-condicoes
- `clients/<id>/config.json` existe com `mobile.target: "tv"`.
- `npm run tv:doctor -- --cliente <id>` passou (virtualizacao, emulador TV, Appium).
- Emulador Android TV conectado via `adb devices`.
- Appium Server acessivel, driver `uiautomator2` instalado.

## Execucao
1. Rodar `npm run tv:doctor -- --cliente <id>`. Se exit code != 0, PARAR e corrigir.
2. Criar timestamp `YYYY-MM-DD_HHMM` e pastas:
   - `clients/<id>/resultado/<timestamp>/screenshots/`
   - `clients/<id>/resultado/<timestamp>/videos/`
   - `clients/<id>/resultado/<timestamp>/mobile/sources/`
   - `clients/<id>/resultado/<timestamp>/dados_brutos/`
3. Atualizar symlink `clients/<id>/resultado/latest`.
4. Iniciar sessao Appium para o app TV.
5. Instalar/abrir o app conforme configuracao.
6. Autenticar se `--login` informado ou se o cliente tiver pareamento configurado:
   - Para QR Code, decodificar o QR a partir do screenshot/source.
   - Se `mobile.pairing.env.loginCode` e `mobile.pairing.env.unitCnpj` existirem no `.env` do cliente, usar esses valores automaticamente.
   - Para VevaTV, rodar `npm run vevatv:pair` apos capturar QR fresco.
7. Mapear telas, menus Leanback, modais, ordem de foco e navegacao por D-pad.
8. Testar estados comuns de TV: idle/screensaver, perda e retorno de rede, background/foreground, reboot do app, reproducao de playlist.
9. Capturar screenshot (paisagem) e source XML de cada tela/estado, registrando o elemento focado.
10. Encerrar sessao Appium.

## Artefatos
- `clients/<id>/estado/mobile_tv_mapa.md`
- `clients/<id>/estado/mobile_tv_fluxos.md`
- `clients/<id>/estado/mobile_tv_elementos.json`
- `clients/<id>/resultado/<timestamp>/mobile_tv_log.json`
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/mobile/sources/`

## Gate final
- Cada tela mapeada tem screenshot em paisagem e source XML.
- `mobile_tv_elementos.json` contem elementos focaveis e ordem de foco por tela.
- `mobile_tv_mapa.md` lista telas, ordem de navegacao por D-pad e riscos encontrados.
- Falhas de captura documentadas no relatorio.
