---
id: gerar-relatorio
description: "Consolida resultados do pipeline de QA em relatorio final para o cliente, incluindo metricas, bugs, evidencias, cobertura e parecer tecnico."
name: "Relatório Final para o Cliente"
type: pure_llm
language: pt-BR
provider_hint: balanced
tools_required:
  - fs.read_file
  - fs.write_file
inject_blocks: []
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador da pasta do cliente em clients/<id>"
  - name: nome-cliente
    required: true
    description: "Nome do cliente para o cabeçalho do relatório"
  - name: formato
    required: true
    description: "Formato de saída: pdf, pptx ou docx"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /gerar-relatorio — Relatório Final para o Cliente

## Descrição
Consolida todos os resultados do pipeline de QA em um relatório final profissional para entrega ao cliente. Agrega métricas, bugs, evidências, gráficos, análise de tendência, cobertura vs. risco e parecer técnico no padrão BugKillers.

## Uso
```
/gerar-relatorio --cliente <id> --nome-cliente "<nome>" --formato <pdf|pptx|docx>
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `--nome-cliente "<nome>"` — nome do cliente para o cabeçalho do relatório (obrigatório). Ex: `--nome-cliente "TEGA Sistemas"`
- `--formato <pdf|pptx|docx>` — formato de saída (obrigatório)

## Instruções de Execução

### 1. Validação de pré-condição
Verificar se `clients/<id>/resultado/latest/` existe e contém arquivos:
- Se **não existir** ou estiver vazia, PARAR e exibir:
  > ❌ Nenhum resultado encontrado em clients/<id>/resultado/latest/
  > Execute pelo menos uma skill de execução antes: /executar-fluxo, /testar-modulo, /executar-planilha

### 2. Coleta dos dados
Ler todos os arquivos presentes em `clients/<id>/resultado/latest/`:
- `fluxo_*.md` → resultados de execução de fluxos
- `forms_*.md` → resultados de testes de formulários
- `planilha_*.md` → resultados de execução por planilha
- `modulo_*.md` → resultados de testes de módulo
- `regressao_*.md` → resultados de regressão
- `bugs_*.md` → bug report gerado pelo /reportar-bug
- `console_log.json` → erros de console consolidados
- `network_log.json` → issues de rede consolidados

Se `bugs_*.md` não existir em `clients/<id>/resultado/latest/`, executar internamente a lógica do `/reportar-bug` para gerar os bug cards antes de montar o relatório.

### 3. Consolidação das métricas
Calcular a partir dos arquivos coletados:

**Métricas de execução:**
- Total de cenários executados
- Passou / Falhou / Pulou (quantidade e %)
- Cobertura por módulo (% de cenários executados vs total da planilha)

**Consolidação obrigatória de retestes e reclassificações manuais:**
O placar final do ciclo **DEVE** refletir o estado pós-reteste e pós-auditoria manual, não o output bruto do executor. Regras:

1. **Retestes pontuais do mesmo ciclo:** se uma pasta posterior em `clients/<id>/resultado/` contém reteste de cenários que falharam no ciclo principal (ex.: run de 5 cenários), o status do reteste **sobrescreve** o status original na contagem final.
   - Cenário 478 falhou no run original → passou no reteste → conta como **Passou** no placar final.
   - Se o reteste confirmar a falha, conta como Falhou e vira bug card.
2. **Reclassificação manual (auditoria):** se o QA reclassificou um cenário Passou→Falhou ou Falhou→Passou (ex.: detecção de alucinação que o executor não viu), o status reclassificado **prevalece**.
3. **Rastreabilidade:** incluir no relatório uma tabela "Placar consolidado" mostrando a evolução:
   - Linha 1: placar bruto do executor
   - Linha 2: após auditoria manual (se houve reclassificação)
   - Linha 3+: após cada reteste
   - Linha final: **placar consolidado** usado em todas as métricas e gráficos do relatório
4. **Falhas descartadas por ambiente (ex.: limite de chats, timeout de infra):** após reteste que as absolva, elas **não** entram como Falhou no placar final nem geram bug card — apenas são listadas na seção "Falhas descartadas (não são bugs de produto)" com o motivo.

Todas as métricas, percentuais, gráficos de barras, tabela de cobertura por módulo e seção de tendência **devem usar o placar consolidado final**, não o bruto.

**Métricas de bugs:**
- Total de bugs encontrados
- Por severidade: Crítico / Alto / Médio / Baixo
- Por módulo: quais módulos têm mais problemas
- Por frequência: Sempre / Intermitente / Raro
- Bugs corrigidos vs pendentes (se houver dados de regressão)

**Métricas de infraestrutura:**
- Console errors totais (do console_log.json)
- Requisições com erro 4xx/5xx (do network_log.json)
- Requisições lentas (>3s)

### 4. Geração de gráficos
Gerar os seguintes gráficos como imagens para inclusão no relatório:

- **Pizza de severidade:** distribuição de bugs por severidade (Crítico/Alto/Médio/Baixo)
- **Barras por módulo:** quantidade de bugs por módulo, colorido por severidade
- **Barras empilhadas de execução:** cenários Passou/Falhou/Pulou por módulo
- **Linha de tendência** (se houver execuções anteriores em `clients/<id>/resultado/`): evolução de bugs ao longo do tempo

Salvar gráficos em `clients/<id>/resultado/latest/graficos/` como PNG.

### 5. Análise de tendência
Se existirem execuções anteriores em `clients/<id>/resultado/` (além da latest):
- Comparar quantidade de bugs por severidade entre execuções
- Identificar: bugs novos, bugs corrigidos, bugs persistentes
- Calcular: taxa de correção (%), tendência (melhorando/piorando/estável)
- Incluir no relatório como seção dedicada

Se não houver execuções anteriores: omitir esta seção.

### 6. Parecer técnico (via LLM)
Gerar análise com base nas métricas e bugs coletados:
- **Avaliação geral da qualidade:** nota de 1 a 5 com justificativa
- **Módulos mais críticos:** quais precisam de atenção imediata
- **Padrões de bug:** se houver bugs similares, identificar causa raiz comum
- **Riscos para produção:** o que pode impactar o usuário final se não corrigido
- **Recomendações:** ações prioritárias antes do próximo release

### 7. Estrutura do relatório
Montar o relatório com as seguintes seções:

```
1. Capa
   - Logo BugKillers (assets/logo-bugkillers.png)
   - Nome do cliente
   - Data da execução
   - Período testado

2. Resumo Executivo
   - Métricas gerais (tabela)
   - Parecer em 3 linhas
   - Gráfico pizza de severidade

3. Cobertura por Módulo
   - Tabela: Módulo | Cenários | Passou | Falhou | % Cobertura
   - Gráfico barras empilhadas

4. Bugs Encontrados
   - Tabela resumo por severidade
   - Gráfico barras por módulo
   - Cards detalhados de cada bug (com screenshot e referência ao vídeo)

5. Análise Técnica
   - Parecer completo
   - Padrões identificados
   - Riscos
   - Console errors críticos
   - Network issues relevantes

6. Tendência (se disponível)
   - Comparação com execuções anteriores
   - Gráfico linha de tendência
   - Taxa de correção

7. Cobertura vs. Risco
   - Matriz 2x2: eixo X = cobertura de testes (%), eixo Y = severidade dos bugs
   - Quadrante crítico: baixa cobertura + alta severidade → prioridade máxima
   - Quadrante seguro: alta cobertura + baixa severidade → módulo estável

8. Escopo Não Testado
   - Módulos/páginas listados no mapa que não tiveram cenários executados
   - Motivo (se identificável): sem cenários gerados, fora do escopo, bloqueado
   - Recomendação: incluir no próximo ciclo de testes

9. Recomendações
   - Lista priorizada de ações
   - Prazo sugerido por ação

10. Evidências
    - Screenshots organizados por módulo
    - Lista de vídeos com timestamps dos momentos críticos
```

### 8. Geração do arquivo
Registrar timestamp: `YYYY-MM-DD_HHMM`

Gerar o arquivo no formato solicitado:
- **PDF:** usar ferramentas disponíveis (weasyprint, reportlab, pandoc) para gerar `clients/<id>/resultado/latest/relatorio_<timestamp>.pdf`
- **PPTX:** criar apresentação com slides por seção `clients/<id>/resultado/latest/relatorio_<timestamp>.pptx`
- **DOCX:** criar documento Word formatado `clients/<id>/resultado/latest/relatorio_<timestamp>.docx`

Aplicar identidade visual BugKillers:
- Cor primária: `#C0392B` (vermelho)
- Cor de texto: `#1C1C1E` (preto suave)
- Fonte: Arial
- Cabeçalho com nome do cliente e data
- Logo: `assets/logo-bugkillers.png`

### 9. Resumo final
```
✅ Relatório gerado
   Cliente: <nome>
   Formato: <formato>
   Cenários executados: <n> | Passou: <n>% | Falhou: <n>%
   Bugs: <n> (Crítico: <n> | Alto: <n> | Médio: <n> | Baixo: <n>)
   Tendência: melhorando | piorando | estável | primeira execução
   Módulos críticos: <lista>
   Escopo não testado: <n> módulos
   Arquivo: clients/<id>/resultado/latest/relatorio_<timestamp>.<ext>

📋 Pipeline concluído. Relatório pronto para entrega ao cliente.
```

## Artefatos gerados
- `clients/<id>/resultado/latest/relatorio_<timestamp>.pdf` (ou .pptx / .docx)
- `clients/<id>/resultado/latest/graficos/*.png`
