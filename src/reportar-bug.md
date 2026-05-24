---
id: reportar-bug
description: "Transforma falhas encontradas em bug cards completos, com reproducao, severidade, ambiente, evidencias e deduplicacao."
name: "Geração de Bug Cards"
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
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: fonte
    required: true
    description: "Arquivo ou pasta de resultado para extrair os bugs"
  - name: template
    required: false
    description: "Template de bug card (padrão: bugkillers)"
  - name: bugs-anteriores
    required: false
    description: "Caminho de bugs_*.md anterior para deduplicação"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /reportar-bug — Geração de Bug Cards

## Descrição
Transforma erros encontrados nas skills de execução em bug cards completos no padrão BugKillers. Cada bug recebe título, descrição, passos para reproduzir, severidade, ambiente, frequência, screenshot, referência ao vídeo e análise de causa raiz. Suporta deduplicação contra bugs anteriores.

## Uso
```
/reportar-bug --cliente <id> --fonte <caminho> [--template bugkillers] [--bugs-anteriores <caminho>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `--fonte <caminho>` — arquivo ou pasta de resultado para extrair os bugs (obrigatório). Ex: `clients/<id>/resultado/latest/` ou `clients/<id>/resultado/latest/fluxo_2026-03-28_1430.md`
- `--template bugkillers` — usa o template padrão BugKillers (opcional, aplicado por padrão)
- `--bugs-anteriores <caminho>` — caminho de um arquivo `bugs_*.md` anterior para deduplicação (opcional). Ex: `clients/<id>/resultado/2026-03-25_1430/bugs_2026-03-25_1430.md`

## Instruções de Execução

### 1. Validação de pré-condição
Verificar se o caminho informado existe:
- Se **não existir**, PARAR e exibir:
  > ❌ Caminho não encontrado: <caminho>
  > Execute uma das skills de execução antes: /executar-fluxo, /testar-forms, /executar-planilha, /testar-modulo ou /regressao

Se o caminho for uma pasta, verificar se contém pelo menos um arquivo `.md`:
- Se vazio, PARAR e exibir:
  > ❌ Nenhum arquivo de resultado encontrado em: <caminho>

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Ler todos os arquivos `.md` do caminho informado (ou o arquivo específico)
- Extrair todas as ocorrências com status `Falhou`, `Persiste`, `Regressão` ou seções marcadas como bug/comportamento inesperado
- Se `--bugs-anteriores` foi passado: ler o arquivo e carregar bugs existentes para deduplicação

### 3. Identificação dos bugs
Para cada falha encontrada nos arquivos de resultado:
- Extrair: descrição da falha, passo em que ocorreu, URL, resultado esperado, resultado obtido, screenshot associado, vídeo associado (se disponível)
- Agrupar falhas similares (mesma URL + mesmo comportamento) em um único bug card
- Gerar ID sequencial: `BUG-001`, `BUG-002`, ...

### 3.1 Deduplicação contra bugs anteriores
Se `--bugs-anteriores` foi passado:
- Para cada bug identificado, comparar com bugs do arquivo anterior
- Critérios de duplicata: mesma URL + mesmo comportamento + mesma severidade
- Se duplicata encontrada:
  - Não criar novo bug card
  - Registrar na seção "Bugs já reportados" com referência ao ID original
- Se bug similar mas com diferença relevante (nova URL, severidade diferente):
  - Criar novo bug card e referenciar o bug anterior como relacionado

### 4. Classificação de severidade
Para cada bug, classificar com base no impacto:

| Severidade | Critério |
|------------|----------|
| **Crítico** | Bloqueia fluxo principal (login, checkout, cadastro essencial) ou causa perda de dados |
| **Alto** | Funcionalidade importante não funciona, sem workaround óbvio |
| **Médio** | Funcionalidade secundária com problema, workaround possível |
| **Baixo** | Problema cosmético, mensagem de erro inadequada, comportamento inconsistente mas não bloqueante |

### 5. Informações de ambiente
Para cada bug, registrar o ambiente onde foi encontrado:
- **Browser:** Chromium (versão do Playwright)
- **OS:** sistema operacional onde o agente está rodando
- **Viewport:** resolução utilizada durante o teste (ex: 1280x720)
- **Rede:** condição de rede (normal, 3G throttled — se aplicável)

### 6. Classificação de frequência
Para cada bug, classificar a frequência de reprodução:
- **Sempre** — reproduz em 100% das tentativas
- **Intermitente** — reproduz em algumas tentativas mas não todas
- **Raro** — reproduziu apenas 1 vez durante os testes

Se o bug foi encontrado em múltiplas execuções (retry, regressão): usar o histórico para determinar frequência.

### 7. Análise de causa raiz (via LLM)
Para cada bug, usar raciocínio próprio para sugerir possível causa raiz com base em:
- Comportamento observado vs esperado
- Tipo de campo ou ação que gerou o problema
- Padrão do erro (ex: erro de validação no front vs erro 500 do servidor)
- Similaridade com outros bugs conhecidos
- Console errors e network issues associados (se disponíveis nos logs)

Formatar como: `Possível causa: <hipótese baseada no comportamento>`

### 8. Geração dos bug cards
Criar `clients/<id>/resultado/latest/bugs_<timestamp>.md` com um card por bug no template BugKillers:

```markdown
# Bug Report — BugKillers
Data: <timestamp>
Total de bugs: <n>
Bugs novos: <n> | Já reportados: <n>

---

## BUG-001 — <Título descritivo do problema>

**Severidade:** Crítico | Alto | Médio | Baixo
**Frequência:** Sempre | Intermitente | Raro
**Módulo:** <nome do módulo>
**URL:** <url onde ocorreu>
**Encontrado em:** <nome do arquivo de resultado de origem>

### Ambiente
- Browser: Chromium <versão>
- OS: <sistema operacional>
- Viewport: <largura>x<altura>
- Rede: normal | 3G throttled

### Descrição
<Descrição clara e objetiva do problema>

### Passos para Reproduzir
1. <passo 1>
2. <passo 2>
3. <passo 3>

### Resultado Esperado
<O que deveria acontecer>

### Resultado Obtido
<O que aconteceu de fato>

### Evidência
- Screenshot: <caminho do arquivo .png>
- Vídeo: <caminho do arquivo .mp4> (timestamp: <momento exato no vídeo>)

### Console Errors Relacionados
<erros de console capturados na mesma página/momento, se disponíveis>

### Possível Causa Raiz
<Hipótese gerada por análise do comportamento>

### Bugs Relacionados
<IDs de bugs anteriores similares, se aplicável>

---

## BUG-002 — ...
```

Se houver bugs deduplicados, incluir seção final:

```markdown
---

## Bugs já reportados (deduplicados)
| Bug Original | Descrição | Ainda reproduz? |
|--------------|-----------|-----------------|
| BUG-xxx      | ...       | Sim             |
```

### 9. Resumo final
```
✅ Bug report gerado
   Bugs encontrados: <n>
   Novos: <n> | Já reportados: <n>
   Crítico: <n> | Alto: <n> | Médio: <n> | Baixo: <n>
   Frequência: Sempre <n> | Intermitente <n> | Raro <n>
   Arquivo: clients/<id>/resultado/latest/bugs_<timestamp>.md

➡️  Próximo passo: /gerar-relatorio --cliente <id> --nome-cliente "<nome>" --formato pdf
```

## Encadeia para
`/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/latest/bugs_<timestamp>.md`
