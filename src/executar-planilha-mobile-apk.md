---
id: executar-planilha-mobile-apk
description: "Executa planilha de cenarios em APK/app nativo via Appium."
name: "Execucao de Planilha APK Mobile"
type: script
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
# /executar-planilha-mobile-apk - Execucao em lote APK/app nativo via Appium

## Descricao
Executa cenarios de uma planilha em APK/app nativo no celular usando Appium. Esta skill cobre apps instalados ou APKs fornecidos pelo cliente. Nao usar Playwright.

## Uso
```bash
/executar-planilha-mobile-apk --cliente <id> <arquivo> --device <serial> [--modulo <nome>] [--prioridade <Alta|Media|Baixa>] [--login <email>] [--app <apk>] [--retry <n>] [--max-falhas <n>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<arquivo>` - planilha `.xlsx` ou `.csv`.
- `--device <serial>` - serial do device.
- `--modulo <nome>` - filtro opcional.
- `--prioridade <nivel>` - filtro opcional.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env`.
- `--app <apk>` - APK opcional; se ausente, usar `clients/<id>/config.json`.
- `--retry <n>` - tentativas por cenario.
- `--max-falhas <n>` - circuit breaker por falhas consecutivas.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Fazer backup `.bak` antes de atualizar a planilha original.
- Gerar evidencia visual por cenario.
- Dados criados durante o teste devem ser limpos ou marcados como `pendente` em `cleanup_log.json`.

## Colunas minimas
Aceitar equivalentes quando documentado:
- `ID`
- `Modulo`
- `Fluxo`
- `Passos`
- `Resultado Esperado`

Colunas mobile APK recomendadas:
- `Device`
- `App`
- `AppPackage`
- `AppActivity`
- `Prioridade`
- `Dados de Teste`

## Execucao
1. Validar seguranca, planilha, device e app/APK.
2. Criar timestamp e pastas de resultado.
3. Fazer backup `.bak` da planilha.
4. Filtrar cenarios por modulo/prioridade.
5. Iniciar sessao Appium para o app.
6. Autenticar se necessario.
7. Executar cada cenario, com retry quando configurado.
8. Capturar screenshot final e estado Appium de cada cenario.
9. Marcar resultado diretamente na planilha.
10. Registrar logs do Appium, device e crash logs quando disponiveis.
11. Executar cleanup de dados criados.
12. Aplicar circuit breaker se exceder `--max-falhas`.
13. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile_apk_log.json`
- `clients/<id>/resultado/<timestamp>/device_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/crash_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- `clients/<id>/resultado/<timestamp>/execucao_planilha_mobile_apk.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
Nao finalizar sem:
- Planilha atualizada.
- Evidencia visual para cada cenario executado.
- Resumo de aprovados, reprovados, bloqueados e pulados.
- Cleanup realizado ou pendente.
- Justificativa de qualquer cenario inconclusivo com pelo menos 3 tentativas documentadas.


