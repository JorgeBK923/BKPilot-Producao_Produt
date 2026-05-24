---
id: testar-modulo-mobile-apk
description: "Executa testes de modulo em APK/app nativo via Appium."
name: "Teste de Modulo APK Mobile"
type: interactive
language: pt-BR
provider_hint: balanced
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
# /testar-modulo-mobile-apk - Teste de modulo APK/app nativo via Appium

## Descricao
Executa cenarios de um modulo de APK/app nativo no celular usando Appium e depois faz exploracao livre focada no mesmo modulo. Nao usar Playwright nesta skill.

## Uso
```bash
/testar-modulo-mobile-apk --cliente <id> <modulo> <arquivo> --device <serial> [--login <email>] [--app <apk>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<modulo>` - modulo a testar.
- `<arquivo>` - planilha `.xlsx` ou `.csv` com cenarios.
- `--device <serial>` - serial do device.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env` como `QA_PASSWORD`.
- `--app <apk>` - APK opcional; se ausente, usar `clients/<id>/config.json`.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Gerar screenshot ou video para cada cenario executado.
- Atualizar resultado na planilha original, fazendo backup `.bak` antes.
- Dados criados durante o teste devem ser limpos ou marcados como `pendente` em `cleanup_log.json`.

## Execucao
1. Validar seguranca, planilha, modulo, device e app/APK.
2. Criar timestamp e pastas em `clients/<id>/resultado/<timestamp>/`.
3. Iniciar sessao Appium para o app.
4. Autenticar se necessario.
5. Executar cenarios da planilha filtrados por modulo.
6. Para cada cenario:
   - executar passos via Appium;
   - capturar screenshot final;
   - registrar estado Appium;
   - marcar status e observacoes na planilha.
7. Fazer exploracao livre do modulo buscando riscos mobile APK nao cobertos.
8. Coletar logs do Appium, logs do device e crash logs quando disponiveis.
9. Executar cleanup dos dados criados quando aplicavel.
10. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile_apk_log.json`
- `clients/<id>/resultado/<timestamp>/device_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/crash_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- `clients/<id>/resultado/<timestamp>/relatorio_mobile_apk_<modulo>.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
Nao finalizar sem listar:
- Cenarios executados, aprovados, reprovados e bloqueados.
- Evidencia visual de cada cenario.
- Bugs encontrados na exploracao livre.
- Cleanup realizado ou pendente.
- Tentativas realizadas para qualquer item inconclusivo.


