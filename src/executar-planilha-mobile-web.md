---
id: executar-planilha-mobile-web
description: "Executa planilha de cenarios web mobile em navegador real do celular via Appium."
name: "Execucao de Planilha Web Mobile"
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
# /executar-planilha-mobile-web - Execucao em lote web mobile via Appium

## Descricao
Executa cenarios de uma planilha em navegador real de celular usando Appium. Esta skill cobre sistemas web mobile, nao APK. Nao usar Playwright.

## Uso
```bash
/executar-planilha-mobile-web --cliente <id> <arquivo> --device <serial> [--modulo <nome>] [--prioridade <Alta|Media|Baixa>] [--login <email>] [--retry <n>] [--max-falhas <n>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<arquivo>` - planilha `.xlsx` ou `.csv`.
- `--device <serial>` - serial do device.
- `--modulo <nome>` - filtro opcional.
- `--prioridade <nivel>` - filtro opcional.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env`.
- `--retry <n>` - tentativas por cenario.
- `--max-falhas <n>` - circuit breaker por falhas consecutivas.

## Regras obrigatorias
- Usar Appium com `browserName`.
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Fazer backup `.bak` antes de atualizar a planilha original.
- Gerar evidencia visual por cenario.

## Colunas minimas
Aceitar equivalentes quando documentado:
- `ID`
- `Modulo`
- `Fluxo`
- `Passos`
- `Resultado Esperado`

Colunas mobile web recomendadas:
- `Device`
- `BrowserName`
- `BaseUrl`
- `Prioridade`
- `Dados de Teste`

## Execucao
1. Validar seguranca, planilha e device.
2. Criar timestamp e pastas de resultado.
3. Fazer backup `.bak` da planilha.
4. Filtrar cenarios por modulo/prioridade.
5. Iniciar sessao Appium com navegador mobile.
6. Autenticar se necessario.
7. Executar cada cenario, com retry quando configurado.
8. Capturar screenshot final e estado Appium de cada cenario.
9. Marcar resultado diretamente na planilha.
10. Aplicar circuit breaker se exceder `--max-falhas`.
11. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile_web_log.json`
- `clients/<id>/resultado/<timestamp>/execucao_planilha_mobile_web.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
Nao finalizar sem:
- Planilha atualizada.
- Evidencia visual para cada cenario executado.
- Resumo de aprovados, reprovados, bloqueados e pulados.
- Justificativa de qualquer cenario inconclusivo com pelo menos 3 tentativas documentadas.


