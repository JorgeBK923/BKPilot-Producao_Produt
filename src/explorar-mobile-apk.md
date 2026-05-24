---
id: explorar-mobile-apk
description: "Mapeia APK/app nativo em celular via Appium."
name: "Exploracao APK Mobile"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
  - mobile.startSession
  - mobile.getState
  - mobile.tap
  - mobile.type
  - mobile.swipe
  - mobile.back
  - mobile.waitFor
  - mobile.captureEvidence
  - mobile.endSession
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks: []
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id>"
  - name: device
    required: false
    description: "Serial do device conectado via USB, quando aplicavel"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---
# /explorar-mobile-apk - Exploracao de APK/app nativo via Appium

## Descricao
Mapeia um aplicativo Android instalado ou APK fornecido pelo cliente usando Appium. Esta skill e exclusiva para APK/app nativo em device real ou emulador. Nao usar Playwright nesta skill.

## Uso
```bash
/explorar-mobile-apk --cliente <id> --device <serial> [--app <apk>] [--login <email>] [--escopo <texto>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `--device <serial>` - serial do device em `adb devices`. Se houver apenas um device conectado, pode ser inferido.
- `--app <apk>` - caminho do APK. Se ausente, ler `clients/<id>/config.json` em `mobile.app`, `mobile.appPackage` e `mobile.appActivity`.
- `--login <email>` - email de autenticacao. A senha deve vir de `QA_PASSWORD` em `clients/<id>/.env`.
- `--escopo <texto>` - restringe a exploracao a uma area, fluxo ou modulo.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline em `--login`. Se vier `email:senha`, parar por erro de seguranca.
- Todos os artefatos devem ficar dentro de `clients/<id>/`.
- Preferir seletores estaveis: `resource-id`, `content-desc`, `testID`, `accessibilityLabel`. XPath apenas como fallback.


## Regras Mobile 0.1
- Usar `mobile.getState` compacto por padrao: retornar elementos relevantes/top-K e salvar XML completo em `mobile/sources/`.
- Usar `includeAll: true` apenas quando a tela exigir diagnostico completo.
- Declarar `mode`: `observe` para diagnostico, `explore` para exploracao, `execute` para roteiro/cenario.
- Video na Release Tecnica 0.1 e best-effort/opcional; evidencia obrigatoria e screenshot + source + state.
- Para APK com `appPackage`, exigir allowlist `allowedAppPackages`; para web sem `allowedUrls`, permitir com warning.
## Pre-condicoes
Validar antes de executar:
- `clients/<id>/config.json` existe.
- Configuracao `mobile.target` e `apk`, ou a skill foi chamada explicitamente para APK.
- Device conectado via `adb devices`, para Android.
- Appium Server acessivel.
- Driver `uiautomator2` instalado para Android.
- APK, `appPackage`/`appActivity` ou app ja instalado resolvido.

## Execucao
1. Criar timestamp `YYYY-MM-DD_HHMM`.
2. Criar:
   - `clients/<id>/resultado/<timestamp>/screenshots/`
   - `clients/<id>/resultado/<timestamp>/videos/`
   - `clients/<id>/resultado/<timestamp>/dados_brutos/`
3. Atualizar `clients/<id>/resultado/latest` para o timestamp atual.
4. Iniciar sessao Appium para o APK/app.
5. Instalar/abrir o app conforme configuracao.
6. Autenticar se `--login` foi informado.
7. Mapear telas, menus, modais, permisssoes do sistema, abas, formularios, listas e navegacao.
8. Testar estados comuns: voltar, rotacao quando aplicavel, background/foreground, offline/reconexao quando seguro.
9. Capturar screenshot para cada tela/estado relevante.
10. Salvar estado bruto de cada tela retornado por `mobile.getState`.
11. Encerrar sessao Appium e finalizar video.

## Artefatos
Gerar obrigatoriamente:
- `clients/<id>/estado/mobile_apk_mapa.md`
- `clients/<id>/estado/mobile_apk_fluxos.md`
- `clients/<id>/estado/mobile_apk_elementos.json`
- `clients/<id>/resultado/<timestamp>/mobile_apk_log.json`
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`

## Gate final
Antes de finalizar, verificar:
- Cada tela mapeada tem screenshot.
- `mobile_apk_elementos.json` contem elementos por tela.
- `mobile_apk_mapa.md` lista telas/estados e riscos encontrados.
- Falhas de captura estao documentadas no relatorio.


