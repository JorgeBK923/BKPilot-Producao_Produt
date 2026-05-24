---
id: gerar-cenarios-mobile-web
description: "Gera cenarios para sistema web mobile a partir da exploracao Appium."
name: "Geracao de Cenarios Web Mobile"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
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
# /gerar-cenarios-mobile-web - Geracao de cenarios para web mobile

## Descricao
Gera cenarios de teste para sistema web mobile a partir dos artefatos de `/explorar-mobile-web`, documentos de requisito ou ambos.

## Uso
```bash
/gerar-cenarios-mobile-web --cliente <id> --formato gherkin [--modulo <nome>] [--requisitos <arquivo>]
```

## Parametros
- `--cliente <id>` - pasta do cliente em `clients/<id>/`.
- `--formato gherkin` - formato de saida obrigatorio.
- `--modulo <nome>` - gera apenas para o modulo informado.
- `--requisitos <arquivo>` - documento fonte opcional em PDF, DOCX, Markdown ou TXT.

## Entradas
Usar quando existirem:
- `clients/<id>/estado/mobile_web_mapa.md`
- `clients/<id>/estado/mobile_web_fluxos.md`
- `clients/<id>/estado/mobile_web_elementos.json`
- `clients/<id>/resultado/latest/mobile_web_log.json`
- Documento informado em `--requisitos`

## Riscos mobile web obrigatorios
Gerar cenarios cobrindo, quando aplicavel:
- Layout quebrado em tela real.
- Menu, filtros, tabelas e modais em tela pequena.
- Teclado cobrindo campos.
- Campos cortados ou texto truncado.
- Rolagem horizontal indevida.
- Sticky headers/footers cobrindo acoes.
- Offline e reconexao.
- Rede lenta.
- Background e foreground.
- Rotacao de tela.
- Diferencas entre tamanhos de tela.
- Login expirado no navegador mobile.

## Saidas
Gerar:
- `clients/<id>/cenarios/mobile_web_cenarios.xlsx` ou atualizar aba mobile web da planilha definida pelo usuario.
- `clients/<id>/cenarios/mobile_web_ficha_risco.md`
- `clients/<id>/cenarios/mobile_web_traceabilidade.md`

## Colunas recomendadas
- `ID`
- `Plataforma`
- `Target`
- `Device`
- `BrowserName`
- `BaseUrl`
- `Modulo`
- `Fluxo`
- `Cenario`
- `Pre-condicao`
- `Dados de Teste`
- `Passos`
- `Resultado Esperado`
- `Prioridade`
- `Risco Mobile`

## Gate final
Nao finalizar sem:
- Cada risco aplicavel estar coberto ou justificado.
- Cada modulo do mapa ter ao menos um cenario.
- Gaps entre requisitos e mapa documentados.


