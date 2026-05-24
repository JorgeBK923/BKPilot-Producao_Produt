---
id: relatorio-parcial
description: "Gera relatorio parcial de acompanhamento para o cliente com progresso, bugs criticos, riscos, evidencias e proximos passos."
name: "Relatório Parcial de Acompanhamento"
type: pure_llm
language: pt-BR
provider_hint: strong
tools_required: []
inject_blocks: []
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador da pasta do cliente em clients/<id>"
  - name: nome-cliente
    required: true
    description: "Nome do cliente para o cabeçalho"
  - name: semana
    required: false
    description: "Número da semana do ciclo de testes"
  - name: notas
    required: false
    description: "Observações livres do QA"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /relatorio-parcial — Relatório Parcial de Acompanhamento

## Descrição
Gera um relatório parcial em PDF para envio ao cliente durante a execução do projeto de QA. Consolida os resultados obtidos até o momento, mostra o progresso geral, lista bugs críticos já encontrados, identifica riscos e detalha os próximos passos. Projetado para ser executado manualmente pelo QA ao final de cada semana em projetos de longa duração (ex: a cada 7 dias em um ciclo de 15 dias).

## Uso
```
/relatorio-parcial --cliente <id> --nome-cliente "<nome>" [--semana <n>] [--notas "<observações>"]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `--nome-cliente "<nome>"` — nome do cliente para o cabeçalho (obrigatório). Ex: `--nome-cliente "TEGA Sistemas"`
- `--semana <n>` — número da semana do ciclo de testes (opcional). Ex: `--semana 1`. Se omitido, é calculado automaticamente com base na data da primeira execução em `clients/<id>/resultado/`
- `--notas "<observações>"` — observações livres do QA para incluir no relatório (opcional). Ex: `--notas "Ambiente de staging instável na quarta-feira, alguns testes precisaram ser reexecutados"`

## Instruções de Execução

### 1. Validação de pré-condição
Verificar se existe pelo menos uma pasta de resultado em `clients/<id>/resultado/`:
- Se **não existir** ou todas estiverem vazias, PARAR e exibir:
  > ❌ Nenhum resultado encontrado em clients/<id>/resultado/
  > Execute pelo menos uma skill de execução antes de gerar o relatório parcial.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/` (se não existir para este relatório)
- Atualizar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 3. Levantamento do escopo total
Ler `clients/<id>/estado/mapa.md` e `cenarios/*.xlsx` para determinar o escopo completo do projeto:

**Do mapa (clients/<id>/estado/mapa.md):**
- Total de módulos/seções identificados no sistema
- Total de páginas mapeadas
- Total de fluxos identificados (clients/<id>/estado/fluxos.md)

**Da planilha de cenários (cenarios/*.xlsx mais recente):**
- Total de cenários planejados
- Cenários por módulo
- Cenários por prioridade (Alta / Média / Baixa)

Se `clients/<id>/estado/mapa.md` ou a planilha não existirem, usar apenas os dados de `clients/<id>/resultado/` disponíveis e indicar que o escopo total é desconhecido.

### 4. Coleta dos resultados até o momento
Ler **todas** as pastas de resultado em `clients/<id>/resultado/` (não apenas a latest), coletando:

**Resultados de execução:**
- Todos os arquivos `modulo_*.md`, `fluxo_*.md`, `forms_*.md`, `planilha_*.md`, `regressao_*.md`
- Para cada um: extrair módulo testado, cenários executados, passou/falhou/pulou

**Bugs encontrados:**
- Todos os arquivos `bugs_*.md` encontrados em qualquer pasta de resultado
- Para cada bug: ID, título, severidade, módulo, status (aberto/corrigido)

**Logs de infraestrutura:**
- `console_log.json` — total de console errors
- `network_log.json` — total de requisições com erro e lentas
- `cleanup_log.json` — dados de teste pendentes de limpeza

**Relatórios parciais anteriores:**
- Verificar se existem `parcial_*.md` anteriores em `clients/<id>/resultado/` para referência de evolução

### 5. Cálculo das métricas de progresso

**Progresso geral:**
- Módulos testados vs. total de módulos (quantidade e %)
- Cenários executados vs. total planejado (quantidade e %)
- Cenários Passou / Falhou / Pulou (quantidade e %)

**Progresso por módulo:**
- Para cada módulo: cenários executados, passou, falhou, % cobertura
- Classificar módulos em: ✅ Concluído | 🔄 Em andamento | ⏳ Pendente

**Bugs acumulados:**
- Total de bugs encontrados até agora
- Por severidade: Crítico / Alto / Médio / Baixo
- Por módulo
- Bugs bloqueadores (Crítico) destacados

**Comparação com parcial anterior (se existir):**
- Novos bugs desde o último parcial
- Módulos avançados desde o último parcial
- Evolução do % de progresso

### 6. Análise de riscos e bloqueios
Gerar análise automática com base nos dados coletados:

**Riscos identificados:**
- Módulos com alta taxa de falha (>50% dos cenários falhando)
- Bugs críticos sem correção
- Módulos com muitos console errors ou erros de rede
- Escopo ainda não testado que contém funcionalidades críticas

**Bloqueios (se houver):**
- Ambiente indisponível
- Dependência de correção de bug para continuar
- Credenciais ou permissões faltando
- Funcionalidades incompletas no sistema

**Projeção:**
- Com base no ritmo atual, estimar se o prazo será cumprido
- Se o progresso estiver abaixo do esperado, sugerir priorização

### 7. Próximos passos
Gerar lista automática do que falta ser feito:
- Módulos pendentes de teste (listados por prioridade)
- Retestes necessários (bugs reportados aguardando correção)
- Auditorias pendentes (acessibilidade, performance, API, usabilidade — se aplicáveis)
- Ações recomendadas para o cliente (correções prioritárias)

### 8. Estrutura do relatório parcial
Montar o PDF com as seguintes seções:

```
1. Capa
   - Logo BugKillers (assets/logo-bugkillers.png)
   - Nome do cliente
   - "Relatório Parcial de QA — Semana <n>"
   - Data de geração
   - Período coberto (data da primeira execução → data atual)

2. Resumo Executivo (1 página)
   - Progresso geral: barra visual ou percentual grande
     Ex: "62% concluído — 8 de 13 módulos testados"
   - Métricas-chave em destaque:
     | Cenários executados | Passou | Falhou | Bugs encontrados |
     | 156 / 250 (62%)     | 128    | 22     | 18               |
   - Semáforo geral:
     🟢 No prazo / 🟡 Atenção necessária / 🔴 Risco de atraso
   - Top 3 bugs críticos (título + módulo + severidade)
   - Frase-resumo do QA (das --notas, se fornecidas)

3. Progresso por Módulo
   - Tabela:
     | Módulo | Status | Cenários | Passou | Falhou | Bugs | Cobertura |
   - Módulos ordenados: Em andamento → Pendente → Concluído
   - Legenda: ✅ Concluído | 🔄 Em andamento | ⏳ Pendente

4. Bugs Encontrados até o Momento
   - Tabela resumo por severidade:
     | Severidade | Quantidade | % do total |
   - Lista dos bugs Críticos e Altos com:
     - ID, título, módulo, severidade, URL
     - 1 linha de descrição
   - Bugs Médios e Baixos: apenas contagem por módulo
   - Se houver parcial anterior: "Novos desde o último parcial: <n>"

5. Riscos e Bloqueios
   - Tabela de riscos:
     | Risco | Impacto | Módulo afetado | Ação sugerida |
   - Bloqueios ativos (se houver)
   - Projeção de conclusão

6. Infraestrutura Técnica (resumo compacto)
   - Console errors: <n> erros, <n> warnings
   - Network issues: <n> requisições 5xx, <n> lentas (>3s)
   - Re-autenticações: <n> sessões expiradas durante os testes
   - Dados de teste pendentes de limpeza: <n> itens

7. Próximos Passos
   - Lista numerada do que será feito na próxima semana
   - Priorização: o que testar primeiro e por quê
   - Dependências do cliente (correções necessárias para avançar)

8. Observações do QA (se --notas fornecidas)
   - Texto livre do QA sobre a semana
   - Contexto adicional que não aparece nos números

Rodapé em todas as páginas:
   BugKillers — Relatório Parcial — <cliente> — Semana <n> — <data>
```

### 9. Geração do arquivo
Gerar o PDF aplicando identidade visual BugKillers:
- Cor primária: `#C0392B` (vermelho)
- Cor de texto: `#1C1C1E` (preto suave)
- Fonte: Arial
- Logo: `assets/logo-bugkillers.png`

Salvar como: `clients/<id>/resultado/latest/parcial_semana<n>_<timestamp>.pdf`

Se já existir um parcial da mesma semana, **não sobrescrever** — adicionar sufixo incremental:
`parcial_semana1_2026-04-04_1530.pdf`, `parcial_semana1_2026-04-05_0930.pdf`

### 10. Histórico de parciais
Manter índice de todos os parciais gerados em `clients/<id>/resultado/parciais_index.json`:
```json
{
  "parciais": [
    {
      "semana": 1,
      "data": "2026-04-04T15:30:00",
      "arquivo": "clients/<id>/resultado/2026-04-04_1530/parcial_semana1_2026-04-04_1530.pdf",
      "progresso_pct": 38,
      "bugs_total": 7,
      "modulos_testados": 5,
      "modulos_total": 13
    },
    {
      "semana": 2,
      "data": "2026-04-11T16:00:00",
      "arquivo": "clients/<id>/resultado/2026-04-11_1600/parcial_semana2_2026-04-11_1600.pdf",
      "progresso_pct": 62,
      "bugs_total": 18,
      "modulos_testados": 8,
      "modulos_total": 13
    }
  ]
}
```

### 11. Resumo final
```
✅ Relatório parcial gerado
   Cliente: <nome>
   Semana: <n>
   Progresso: <n>% (<n>/<n> módulos | <n>/<n> cenários)
   Bugs acumulados: <n> (Crítico: <n> | Alto: <n> | Médio: <n> | Baixo: <n>)
   Novos desde último parcial: <n> bugs | <n> módulos avançados
   Semáforo: 🟢|🟡|🔴
   Arquivo: clients/<id>/resultado/latest/parcial_semana<n>_<timestamp>.pdf

📋 Envie o PDF ao cliente para acompanhamento semanal.
```

## Artefatos gerados
- `clients/<id>/resultado/latest/parcial_semana<n>_<timestamp>.pdf` — relatório parcial em PDF
- `clients/<id>/resultado/parciais_index.json` — índice histórico de todos os parciais gerados

## Encadeamento
- **Pré-condição:** pelo menos uma skill de execução já rodou (`/explorar`, `/testar-modulo`, `/executar-planilha`, etc.)
- **Pode ser executado:** a qualquer momento durante o pipeline, quantas vezes necessário
- **Não interfere:** no pipeline normal — o `/gerar-relatorio` final continua funcionando independentemente
- **Referência:** o `/gerar-relatorio` final pode incluir os parciais como anexo ou referência de evolução
