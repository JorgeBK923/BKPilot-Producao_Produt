---
id: testar-modulo-mobile-web
description: "Executa testes de modulo web mobile em navegador real do celular via Appium."
name: "Teste de Modulo Web Mobile"
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
# /testar-modulo-mobile-web - Teste de modulo web mobile via Appium

## Descricao
Executa cenarios de um modulo web mobile no navegador real do celular usando Appium e depois faz exploracao livre focada no mesmo modulo. Nao usar Playwright nesta skill.

## Uso
```bash
/testar-modulo-mobile-web --cliente <id> <modulo> <arquivo> --device <serial> [--login <email>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `<modulo>` - modulo a testar.
- `<arquivo>` - planilha `.xlsx` ou `.csv` com cenarios.
- `--device <serial>` - serial do device.
- `--login <email>` - email de autenticacao. Senha em `clients/<id>/.env` como `QA_PASSWORD`.

## Regras obrigatorias
- Usar Appium com navegador mobile (`browserName`).
- Nunca usar Playwright, Selenium ou Cypress.
- Nunca aceitar senha inline.
- Gerar screenshot ou video para cada cenario executado.
- Atualizar resultado na planilha original, fazendo backup `.bak` antes.

## Execucao
1. Validar seguranca, planilha, modulo e device.
2. Criar timestamp e pastas em `clients/<id>/resultado/<timestamp>/`.
3. Iniciar sessao Appium com navegador mobile.
4. Autenticar se necessario.
5. Executar cenarios da planilha filtrados por modulo.
6. Para cada cenario:
   - executar passos via Appium;
   - capturar screenshot final;
   - registrar estado Appium;
   - marcar status e observacoes na planilha.
7. Fazer exploracao livre do modulo buscando riscos mobile web nao cobertos.
8. Registrar console/logs disponiveis via Appium, falhas de carregamento e falhas de interacao.
9. Encerrar sessao e finalizar video.

## Artefatos
- `clients/<id>/resultado/<timestamp>/screenshots/`
- `clients/<id>/resultado/<timestamp>/videos/`
- `clients/<id>/resultado/<timestamp>/mobile_web_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/console_log.json`, quando disponivel
- `clients/<id>/resultado/<timestamp>/relatorio_mobile_web_<modulo>.md`
- Planilha original atualizada in-place com backup `.bak`

## Gate final
Nao finalizar sem listar:
- Cenarios executados, aprovados, reprovados e bloqueados.
- Evidencia visual de cada cenario.
- Bugs encontrados na exploracao livre.
- Tentativas realizadas para qualquer item inconclusivo.


