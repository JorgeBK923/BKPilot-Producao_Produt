---
id: push-bugs
description: "Envia bug cards para Jira, GitHub Issues ou CSV de importacao, lendo tokens apenas do .env e preservando seguranca."
name: "Enviar Bugs para Issue Tracker"
type: pure_llm
language: pt-BR
provider_hint: cheap
tools_required:
  - http.request
  - fs.read_file
  - fs.write_file
inject_blocks: []
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: destino
    required: true
    description: "Destino dos bugs: jira, github ou csv"
  - name: fonte
    required: false
    description: "Caminho para o bug report. Default: clients/<id>/resultado/latest/bugs_*.md"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /push-bugs — Enviar Bugs para Issue Tracker

## Descrição
Envia os bug cards gerados pelo `/reportar-bug` para um sistema externo de issue tracking (Jira, GitHub Issues) ou exporta em formato CSV para importação manual. Nunca expõe tokens inline — sempre lê do `.env`.

## Uso
```
/push-bugs --cliente <id> --destino <jira|github|csv> [--fonte <caminho>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `--destino <jira|github|csv>` — destino dos bugs (obrigatório). Escolha uma das opções:
  - `jira` — cria issues no Jira Cloud via REST API
  - `github` — cria issues no GitHub via REST API
  - `csv` — gera arquivo CSV para importação manual em qualquer ferramenta
- `--fonte <caminho>` — caminho para o bug report (opcional). Default: `clients/<id>/resultado/latest/bugs_*.md`

## Instruções de Execução

### 1. Validação de segurança
Se qualquer variável de destino contiver `:` seguido de texto (ex: `--token abc123`), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Nunca passe tokens inline. Configure as variáveis no .env:
> - Jira: JIRA_URL, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT_KEY
> - GitHub: GITHUB_REPO, GITHUB_TOKEN

### 2. Validação de pré-condição
Verificar se `clients/<id>/resultado/latest/bugs_*.md` existe:
- Se **não existir**, PARAR e exibir:
  > ❌ Nenhum bug report encontrado. Execute /reportar-bug primeiro.

### 3. Seleção de destino

#### 3.1 Jira Cloud
Verificar variáveis no `.env`:
- `JIRA_URL` — ex: `https://empresa.atlassian.net`
- `JIRA_EMAIL` — email do usuário Jira
- `JIRA_TOKEN` — API token do Jira
- `JIRA_PROJECT_KEY` — ex: `PROJ`

Se qualquer variável estiver vazia, PARAR e exibir:
> ❌ Variáveis Jira incompletas no .env. Preencha: JIRA_URL, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT_KEY

Para cada bug no arquivo `bugs_*.md`:
1. Converter o bug card para formato de issue Jira:
   - `summary` ← título do bug (ex: "Dashboard com LCP de 5.4s (Performance Poor)")
   - `description` ← corpo completo do bug card (descrição, passos, resultado esperado, etc.)
   - `priority` ← mapear severidade: Crítico=Critical, Alto=High, Médio=Medium, Baixo=Low
   - `labels` ← ["bugkillers", "qa-automated"]
   - `issuetype` ← Bug
2. Criar a issue via `POST /rest/api/3/issue` com Basic Auth (email:token base64)
3. Registrar o ID da issue criada (ex: `PROJ-123`)
4. Se screenshots existem: anexar via `POST /rest/api/3/issue/{key}/attachments`

#### 3.2 GitHub Issues
Verificar variáveis no `.env`:
- `GITHUB_REPO` — ex: `empresa/repo`
- `GITHUB_TOKEN` — Personal Access Token com scope `repo`

Se qualquer variável estiver vazia, PARAR e exibir:
> ❌ Variáveis GitHub incompletas no .env. Preencha: GITHUB_REPO, GITHUB_TOKEN

Para cada bug no arquivo `bugs_*.md`:
1. Converter o bug card para formato de issue GitHub:
   - `title` ← título do bug
   - `body` ← corpo completo do bug card em Markdown
   - `labels` ← ["bug", "bugkillers", severidade]
   - assignees ← vazio (não atribuir automaticamente)
2. Criar a issue via `POST /repos/{owner}/{repo}/issues` com Bearer token
3. Registrar a URL da issue criada

#### 3.3 CSV (fallback universal)
Não requer nenhuma variável de ambiente. Gerar arquivo CSV com colunas:
```
ID,Severidade,Frequência,Módulo,Título,URL,Descrição,Passos para Reproduzir,Resultado Esperado,Resultado Obtido,Possível Causa Raiz,Screenshot
```

Salva em `clients/<id>/resultado/latest/bugs_<timestamp>.csv`

### 4. Mapeamento de campos

| Campo Bug Card | Jira | GitHub | CSV |
|---|---|---|---|
| ID | labels[bugkillers] + custom field | labels | coluna ID |
| Severidade | priority (Critical/High/Medium/Low) | label (severity:alto, etc) | coluna Severidade |
| Frequência | custom field ou label | label | coluna Frequência |
| Módulo | component | label | coluna Módulo |
| Título | summary | title | coluna Título |
| URL | descrição | body | coluna URL |
| Passos | descrição | body | coluna Passos |
| Screenshot | attachment | body (markdown link) | coluna Screenshot |

### 5. Geração de resumo
Após enviar todos os bugs, criar `clients/<id>/resultado/latest/push_bugs_<timestamp>.json` com:
```json
{
  "timestamp": "2026-04-14_1504",
  "destino": "jira|github|csv",
  "total_bugs": 6,
  "bugs_enviados": [
    { "id_local": "BUG-001", "id_externo": "PROJ-123", "url": "https://..." }
  ],
  "erros": []
}
```

### 6. Resumo final
```
✅ Bugs enviados com sucesso
   Destino: Jira Cloud | GitHub | CSV
   Total: <n> bugs
   Crítico: <n> | Alto: <n> | Médio: <n> | Baixo: <n>
   IDs criados:
   - BUG-001 → PROJ-123 — Dashboard com LCP de 5.4s
   - BUG-002 → PROJ-124 — Layout Shift na Auditoria
   - ...
   Arquivo: clients/<id>/resultado/latest/push_bugs_<timestamp>.json

➡️  Próximo passo: /gerar-relatorio --cliente <id> --nome-cliente "<nome>" --formato pdf
```

## Encadeia para
`/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/latest/push_bugs_<timestamp>.json` — resumo de envio
- `clients/<id>/resultado/latest/bugs_<timestamp>.csv` (quando destino=csv)

## Segurança (BLOCK-F)
- **NUNCA** passe JIRA_TOKEN ou GITHUB_TOKEN como parâmetro inline
- Tokens são lidos **exclusivamente** do `.env`
- Se qualquer parâmetro parecer conter um token, PARAR imediatamente
- O arquivo `.env` está no `.gitignore` e **nunca** deve ser commitado
