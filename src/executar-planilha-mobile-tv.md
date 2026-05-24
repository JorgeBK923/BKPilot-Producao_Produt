---
id: executar-planilha-mobile-tv
description: "Executa cenarios de uma planilha em app Android TV via Appium, navegacao D-pad."
name: "Execucao em Lote Android TV"
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
# /executar-planilha-mobile-tv - Execucao em lote de app Android TV via Appium

## Descricao
Executa cenarios de uma planilha em app Android TV usando Appium. Navegacao por D-pad, sem toque. Nao usar Playwright.

## Uso
```bash
/executar-planilha-mobile-tv --cliente <id> <arquivo> --device <serial> [--modulo <nome>] [--prioridade <Alta|Media|Baixa>] [--login <email>] [--app <apk>] [--retry <n>] [--max-falhas <n>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<arquivo>` - planilha `.xlsx` ou `.csv`.
- `--device <serial>` - serial do emulador/device.
- `--modulo <nome>` - filtro opcional.
- `--prioridade <nivel>` - filtro opcional.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env`.
- `--app <apk>` - APK opcional; se ausente, usar `clients/<id>/config.json`.
- `--retry <n>` - tentativas por cenario.
- `--max-falhas <n>` - circuit breaker por falhas consecutivas.

## Regras obrigatorias
- Usar Appium com UiAutomator2 no Android. `mobile.target` deve ser `tv`.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Navegacao por D-pad via `scripts/lib/mobile-tv-nav.js`.
- Fazer backup `.bak` antes de atualizar a planilha original.
- Gerar evidencia visual (paisagem) por cenario.
- Dados criados durante o teste devem ser limpos ou marcados como `pendente` em `cleanup_log.json`.

## Colunas minimas
Aceitar equivalentes quando documentado:
- `ID`
- `Modulo`
- `Fluxo`
- `Passos`
- `Resultado Esperado`

Colunas mobile TV recomendadas:
- `Device`
- `App`
- `AppPackage`
- `AppActivity`
- `Navegacao D-pad`
- `Prioridade`
- `Dados de Teste`

## Execucao
1. Rodar `npm run tv:doctor -- --cliente <id>`. Se exit code != 0, PARAR.
2. Validar seguranca, planilha, device e app/APK.
3. Criar timestamp e pastas de resultado.
4. Fazer backup `.bak` da planilha.
5. Filtrar cenarios por modulo/prioridade.
6. Iniciar sessao Appium para o app TV.
7. Autenticar se necessario (pareamento QR/codigo).
8. Executar cada cenario por navegacao D-pad, com retry quando configurado.
9. Capturar screenshot final (paisagem) e source XML de cada cenario.
10. Marcar resultado diretamente na planilha.
11. Registrar logs do Appium, logcat do device e crash logs quando disponiveis.
12. Executar cleanup de dados criados.
13. Aplicar circuit breaker se exceder `--max-falhas`.
14. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile/sources/`
- `clients/<id>/resultado/<timestamp>/mobile_tv_log.json`
- `clients/<id>/resultado/<timestamp>/device_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/crash_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- `clients/<id>/resultado/<timestamp>/execucao_planilha_mobile_tv.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
- Planilha atualizada.
- Evidencia visual para cada cenario executado.
- Resumo de aprovados, reprovados, bloqueados e pulados.
- Cleanup realizado ou pendente.
- Justificativa de qualquer cenario inconclusivo com pelo menos 3 tentativas documentadas.
