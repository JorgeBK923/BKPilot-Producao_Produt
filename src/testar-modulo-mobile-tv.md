---
id: testar-modulo-mobile-tv
description: "Executa cenarios de um modulo de app Android TV via Appium, navegacao D-pad."
name: "Teste de Modulo Android TV"
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
  - name: modulo
    required: true
    description: "Modulo a testar"
  - name: arquivo
    required: true
    description: "Planilha .xlsx ou .csv com cenarios"
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
# /testar-modulo-mobile-tv - Teste de modulo de app Android TV via Appium

## Descricao
Executa cenarios de um modulo de app Android TV usando Appium e depois faz exploracao livre focada no mesmo modulo. Navegacao por D-pad, sem toque. Nao usar Playwright.

## Uso
```bash
/testar-modulo-mobile-tv --cliente <id> <modulo> <arquivo> --device <serial> [--login <email>] [--app <apk>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<modulo>` - modulo a testar.
- `<arquivo>` - planilha `.xlsx` ou `.csv` com cenarios.
- `--device <serial>` - serial do emulador/device.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env` como `QA_PASSWORD`.
- `--app <apk>` - APK opcional; se ausente, usar `clients/<id>/config.json`.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android. `mobile.target` deve ser `tv`.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Navegacao exclusiva por D-pad via `scripts/lib/mobile-tv-nav.js`.
- Gerar screenshot (paisagem) ou video para cada cenario.
- Atualizar resultado na planilha original, com backup `.bak` antes.
- Dados criados durante o teste devem ser limpos ou marcados como `pendente` em `cleanup_log.json`.

## Execucao
1. Rodar `npm run tv:doctor -- --cliente <id>`. Se exit code != 0, PARAR e corrigir.
2. Validar seguranca, planilha, modulo, device e app/APK.
3. Criar timestamp e pastas em `clients/<id>/resultado/<timestamp>/`.
4. Iniciar sessao Appium para o app TV.
5. Autenticar se necessario (pareamento QR/codigo).
6. Executar cenarios da planilha filtrados por modulo:
   - navegar por D-pad ate cada elemento alvo;
   - acionar com `select`;
   - capturar screenshot final (paisagem) e source XML;
   - registrar elemento focado e estado Appium;
   - marcar status e observacoes na planilha.
7. Exploracao livre do modulo buscando riscos mobile TV nao cobertos (idle, perda de rede, reboot, reproducao continua).
8. Coletar logs do Appium, logcat do device e crash logs quando disponiveis.
9. Executar cleanup dos dados criados quando aplicavel.
10. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile/sources/`
- `clients/<id>/resultado/<timestamp>/mobile_tv_log.json`
- `clients/<id>/resultado/<timestamp>/device_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/crash_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- `clients/<id>/resultado/<timestamp>/relatorio_mobile_tv_<modulo>.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
- Cenarios executados, aprovados, reprovados e bloqueados listados.
- Evidencia visual (paisagem) de cada cenario, mostrando o foco.
- Bugs encontrados na exploracao livre.
- Cleanup realizado ou pendente.
- Tentativas realizadas para qualquer item inconclusivo.
