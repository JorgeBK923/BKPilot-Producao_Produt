---
id: regressao
description: "Retesta bugs corrigidos via Playwright MCP, validando correcao, persistencia, regressao, evidencia visual por bug e comportamento flaky."
name: "Teste de Regressão"
type: hybrid
language: pt-BR
provider_hint: balanced
tools_required:
  - playwright.browser_navigate
  - playwright.browser_click
  - playwright.browser_fill_form
  - playwright.browser_snapshot
  - playwright.browser_take_screenshot
  - playwright.browser_press_key
  - playwright.browser_wait_for
  - playwright.browser_console_messages
  - playwright.browser_network_requests
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks:
  - console_monitoring
  - network_monitoring
  - session_reauth
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: planilha
    required: false
    description: "Planilha original de cenários (para contexto e cruzamento). Ex: cenarios/cenarios_relatorios_2026-04-16_1500.xlsx"
  - name: bugs
    required: false
    description: "Pasta com exportação do Jira (Excel/Word/XML) ou estrutura manual. Convenção: clients/<client>/bugs/<data>/"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: visual-diff
    required: false
    description: "Ativa comparação visual pixel-a-pixel de screenshots (flag booleano)"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

> 🚨 **REGRA EXPRESSA — EVIDÊNCIA VISUAL OBRIGATÓRIA POR BUG**
>
> **NUNCA** finalize o reteste de um bug sem capturar screenshot (PNG) ou vídeo (MP4) do estado pós-correção. Cada bug retestado **deve** ter um arquivo `JBUG-<ID>_reteste_<descricao>.png` em `clients/<id>/resultado/<timestamp>/screenshots/` antes de ser marcado como Corrigido/Persiste/Regressão.
>
> Se por qualquer motivo a captura falhar (modal desaparece, timing etc.), **registre o motivo no relatório**. Silêncio ou "observado durante sessão" sem arquivo em disco **não é aceitável**.
>
> Aplica-se a **TODAS as ICLs** (Claude, GLM, Minimax, Kimi, MiMo, Qwen, GPT, Codex). Ver §7.1 do CLAUDE.md.

# /regressao — Teste de Regressão

## Descrição

> ⚠️ **OBRIGATÓRIO — Execução via MCP Playwright**
>
> Reteste de bugs nesta skill **deve** usar MCP Playwright (`mcp__playwright__browser_*`), não scripts Node. Vale para **todas as ICLs** do ecossistema (Claude, GLM, Minimax, Kimi, MiMo, Qwen, GPT).
>
> **Motivo:** reteste exige interpretar a tela em tempo real — modais de boas-vindas aparecem em momentos imprevisíveis, ícones SVG não têm label, endpoints podem ter nomes diferentes do mapeado inicial. Scripts Node travam nesses blockers; o MCP resolve o fluxo em uma sessão (snapshot de acessibilidade + refs estáveis + `browser_evaluate` para injetar interceptors dinâmicos).
>
> Script Node continua válido apenas para **batch determinístico** de cenários conhecidos (ex: Modo Planilha rodando ciclos repetidos de CTs já estáveis). Para reteste de bugs externos (Modo Bugs ou Combinado) — sempre MCP.

Retesta bugs corrigidos e verifica se as correções introduziram regressões. Opera em **três modos**:

- **Modo Planilha:** retesta cenários que falharam em execução anterior (comportamento original)
- **Modo Bugs Externos:** retesta bugs a partir de uma pasta `clients/<client>/bugs/<data>/` com exportação do Jira (Excel/Word/XML) ou estrutura manual. Cruza com a planilha original para contexto e cenários relacionados.
- **Modo Combinado:** bugs externos + planilha de contexto (recomendado)

Suporta **exportação direta do Jira** nos formatos Excel (.xlsx), Word (.docx) e XML. A skill detecta automaticamente o formato e faz o parse. Também ingere evidências visuais (prints/vídeos) dos bugs para comparação antes/depois.

## Uso
```
# Modo Planilha (original)
/regressao --cliente <id> --planilha cenarios/cenarios.xlsx [--login <email>] [--visual-diff]

# Modo Bugs Externos (exportação Jira)
/regressao --cliente <id> --bugs clients/<id>/bugs/<data>/ [--planilha cenarios/cenarios.xlsx] [--login <email>] [--visual-diff]

# Modo Combinado (recomendado)
/regressao --cliente tega --bugs clients/tega/bugs/2026-04-17/ --planilha cenarios/cenarios_relatorios_2026-04-16_1500.xlsx --login adminteste2
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `--planilha <arquivo>` — planilha original de cenários (opcional, mas recomendada). Usada para cruzar bugs com cenários existentes, entender fluxos e detectar cenários relacionados
- `--bugs <pasta>` — pasta com dados dos bugs. Aceita:
  - **Exportação Jira** (Excel .xlsx, Word .docx ou XML) — formato mais comum
  - **Estrutura manual** — `index.json` + subpastas por bug com `descricao.md`, `passos.md`
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`
- `--visual-diff` — ativa comparação visual pixel-a-pixel de screenshots entre evidência anterior e reteste (opcional)

## Modo de Operação

A skill detecta automaticamente o modo com base nos parâmetros:

| Modo | Parâmetros | Comportamento |
|------|-----------|---------------|
| Planilha | `--planilha` sem `--bugs` | Retesta cenários com Status=Failed da planilha |
| Bugs | `--bugs` sem `--planilha` | Retesta bugs da pasta, sem contexto de cenários |
| Combinado | `--bugs` + `--planilha` | Retesta bugs + cruza com cenários relacionados (recomendado) |

---

## ⛔ Critérios de parada negativa

Você **NÃO PODE** encerrar a skill nem imprimir o resumo final enquanto qualquer item abaixo estiver falso:

- [ ] Todos os bugs da exportação Jira (ou index.json) foram retestados
- [ ] Cada bug tem evidência de reteste (screenshot obrigatório, vídeo se possível)
- [ ] Cada bug foi classificado (Corrigido / Persiste / Regressão / Inconclusivo)
- [ ] Se `--planilha` foi passado: cenários relacionados foram identificados e testados
- [ ] `console_log.json` e `network_log.json` existem em `clients/<id>/resultado/<timestamp>/`
- [ ] Relatório `regressao_<timestamp>.md` foi gerado com todas as seções

**Regra de evidência:** um bug só é considerado retestado se existe um **screenshot no disco** que prove o resultado. Sem screenshot = não conta.

---

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Validação de pré-condição

Verificar parâmetros:
- Se **nenhum** de `--planilha` ou `--bugs` foi passado, PARAR:
  > ❌ Informe pelo menos --planilha ou --bugs. Use /regressao --help para ver opções.

Se `--bugs` foi passado:
- Verificar se a pasta existe
- Detectar formato de entrada (prioridade: Excel > Word > XML > index.json):
  - **Excel:** procurar `*.xlsx` na pasta
  - **Word:** procurar `*.docx` na pasta
  - **XML:** procurar `*.xml` na pasta
  - **Manual:** procurar `index.json` na raiz da pasta
- Se **nenhum formato encontrado**, PARAR:
  > ❌ Nenhum arquivo de bugs encontrado em <pasta>. Coloque uma exportação do Jira (.xlsx, .docx ou .xml) ou crie index.json manualmente.

Se `--planilha` foi passado:
- Verificar se o arquivo existe
- Se **não existir**, PARAR:
  > ❌ Planilha não encontrada: <arquivo>

### 3. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpastas:
  - `clients/<id>/resultado/<timestamp>/videos/` para vídeos MP4
  - `clients/<id>/resultado/<timestamp>/screenshots/` para screenshots de reteste
  - `clients/<id>/resultado/<timestamp>/evidencias_anteriores/` para cópia de prints/vídeos dos bugs
  - `clients/<id>/resultado/<timestamp>/diff_visual/` (se `--visual-diff` ativado)
- Atualizar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`
- Autenticar se `--login` foi passado

### 3.1 Configuração de gravação de vídeo
Ao iniciar o browser via Playwright MCP, ativar gravação por cenário:
```
recordVideo: { dir: 'clients/<id>/resultado/<timestamp>/videos/_raw/', size: { width: 1280, height: 720 } }
```
Abrir e fechar o browser a cada cenário para gerar um vídeo individual por re-execução.

### 3.2 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Registrar: `{ timestamp, level, text, url, lineNumber }`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 3.3 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes }`
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 4. Ingestão de dados

#### 4.1 Detectar e parsear formato de entrada

A skill detecta automaticamente o formato e faz o parse:

##### A. Excel (.xlsx) — Exportação Jira

Ler o arquivo `.xlsx` e identificar colunas do Jira. Mapeamento automático:

| Coluna Jira (possíveis nomes) | Campo interno | Notas |
|-------------------------------|---------------|-------|
| `Issue Key`, `Key`, `Chave`, `ID` | `id` | Ex: BUG-042, PROJ-123 |
| `Summary`, `Título`, `Titulo`, `Summary` | `titulo` | Resumo do bug |
| `Description`, `Descrição`, `Descricao` | `descricao` | Descrição completa (markdown do Jira) |
| `Status` | `status_anterior` | Ex: "In QA", "Done", "Reopened", "To Do" |
| `Priority`, `Prioridade` | `severidade` | Mapear: Highest→Crítica, High→Alta, Medium→Média, Low→Baixa |
| `Labels`, `Etiquetas` | `tags` | Separar por vírgula |
| `Component/s`, `Componente`, `Módulo` | `modulo` | Módulo afetado |
| `URL`, `Link`, `Environment` | `url` | URL do ambiente onde o bug ocorre |

**Parsear descrição do Jira:**
- A descrição do Jira vem em formato markdown-like
- Extrair passos de reprodução: procurar por "Steps to Reproduce", "Passos para reproduzir", "Como reproduzir", ou listas numeradas
- Extrair resultado esperado: procurar por "Expected Result", "Resultado esperado", "Comportamento esperado"
- Se não encontrar seções estruturadas, usar a descrição completa como contexto

##### B. Word (.docx) — Exportação Jira

Usar `mammoth` (já instalado no projeto) para extrair texto:
```bash
node -e "const mammoth = require('mammoth'); mammoth.extractRawText({path: '<arquivo>'}).then(r => console.log(r.value));"
```

**Parsear estrutura:**
- Cada bug geralmente começa com um heading ou "Issue Key: BUG-XXX"
- Separar por headings ou padrões de texto
- Extrair campos por labels: "Summary:", "Description:", "Status:", etc.
- Se o Word contém tabelas, extrair dados das tabelas

##### C. XML — Exportação Jira

Parsear XML do Jira (formato RSS ou XML nativo):
- Procurar tags: `<key>`, `<title>` ou `<summary>`, `<description>`, `<status>`, `<priority>`
- Extrair atributos e conteúdo de texto
- Mapear para estrutura interna

##### D. Estrutura manual (index.json)

Se nenhum formato de exportação foi encontrado, procurar `index.json`:
```json
[
  {
    "id": "BUG-042",
    "titulo": "Modal não fecha com ESC",
    "severidade": "Alta",
    "modulo": "Relatórios",
    "url": "https://devjcla.sistemastega.com.br/reports",
    "pasta": "BUG-042",
    "status_anterior": "Failed",
    "cenarios_relacionados": ["CT-096", "CT-097"]
  }
]
```

Para cada bug listado, ler da subpasta:
- `descricao.md` — descrição do bug
- `passos.md` — passos para reproduzir
- `resultado_esperado.md` — resultado esperado (opcional)

#### 4.2 Carregar evidências anteriores

Procurar em `clients/<client>/bugs/<data>/Anexos/` (se existir) arquivos correspondentes a cada bug:
- Padrão de nome: `<ID_BUG>*` (ex: `BUG-042.png`, `BUG-042_screenshot.png`, `BUG-042_video.webm`)
- Copiar para `clients/<id>/resultado/<timestamp>/evidencias_anteriores/`
- Registrar no metadata do bug quais evidências foram encontradas

#### 4.3 Ler planilha original (se --planilha foi passado)

Ler a planilha e extrair:
- Lista de todos os cenários com ID, Módulo, Passos, Regras de Validação, Resultado Esperado, URL, Fluxo, Categoria, Status QA Ciclo I
- Construir índice de busca por:
  - **URL:** mapear URL → lista de cenários
  - **Módulo:** mapear módulo → lista de cenários
  - **Palavras-chave:** extrair termos de cada cenário para busca textual

#### 4.4 Cruzamento bug ↔ cenários (se ambos foram passados)

Para cada bug parseado:
1. **Buscar por URL:** se o bug tem URL, buscar cenários da planilha com mesma URL ou URL similar
2. **Buscar por módulo:** se o bug tem módulo, buscar cenários desse módulo
3. **Buscar por palavras-chave:** extrair termos do título e descrição do bug, buscar cenários que contenham esses termos
4. **Buscar por referência explícita:** se o bug lista `cenarios_relacionados` (no index.json ou inferido), incluir esses IDs
5. **Deduplicar:** remover cenários duplicados da lista
6. **Classificar:**
    - **Diretos:** cenários explicitamente relacionados ao bug (mesma URL, mesmo módulo, ou listados)
    - **Indiretos:** cenários que compartilham módulo ou termos, mas não são diretamente relacionados

### 5. Re-execução

#### 5.1 Retestar cada bug
Para cada bug parseado da exportação Jira (ou index.json):

1. **Copiar evidências anteriores** para `evidencias_anteriores/` (se existirem)
2. **Abrir novo contexto de browser** (inicia nova gravação)
3. **Navegar para URL do bug** (se disponível na exportação)
4. **Executar os passos** extraídos da descrição do bug via Playwright:
   - Se passos foram extraídos estruturadamente da descrição Jira, seguir passo a passo
   - Se não, usar a descrição completa como contexto e reproduzir o cenário descrito
5. **Validar resultado** comparando com o comportamento descrito no bug:
   - Se o comportamento descrito no bug **não ocorre mais** → classificar como **Corrigido**
   - Se o comportamento **ainda ocorre** → classificar como **Persiste**
   - Se o bug foi corrigido mas **outro comportamento que funcionava parou** → classificar como **Regressão**
   - Se não foi possível reproduzir (URL inválida, passos incompletos, ambiente diferente) → classificar como **Inconclusivo**
6. **Tirar screenshot** ao final: `screenshots/<ID>_reteste.png`
7. **Fechar o browser** — Playwright salva o `.webm`
8. **Converter para MP4:**
   ```bash
   ffmpeg -i _raw/<arquivo>.webm -c:v libx264 -crf 23 -preset fast videos/<ID>_<timestamp>.mp4
   ```
   Se ffmpeg não disponível: manter `.webm`, exibir aviso
9. **Se --planilha foi passado:** executar também os cenários relacionados identificados no cruzamento (seção 4.4)

#### 5.2 Verificar regressão nos cenários relacionados
Para cada cenário relacionado identificado no cruzamento:
1. Abrir novo contexto de browser
2. Executar os passos do cenário via Playwright
3. Comparar com Resultado Esperado
4. Tirar screenshot: `screenshots/<ID>_regressao.png`
5. Fechar browser e converter para MP4
6. Classificar:
   - **Passou** — continua funcionando
   - **Regressão** — passou antes, falhou agora

#### 5.3 Comparação visual (se --visual-diff)
Se `--visual-diff` foi ativado e existem screenshots anteriores:
- Para cada bug com evidência anterior (screenshot):
  - Comparar screenshot anterior com screenshot de reteste
  - Gerar imagem diff destacando áreas com diferença
  - Salvar em `diff_visual/<ID>_diff.png`
  - Classificar:
    - **Esperada:** mudança intencional (bug corrigido)
    - **Inesperada:** mudança não relacionada (possível regressão visual)

### 6. Geração dos artefatos

Salvar `clients/<id>/resultado/<timestamp>/regressao_<timestamp>.md`:

```markdown
# Resultado — Regressão

**Data:** <timestamp>
**Fonte dos bugs:** <formato detectado: Jira Excel / Jira Word / Jira XML / Manual>
**Arquivo de entrada:** <nome do arquivo>
**Planilha de contexto:** <arquivo ou "não informada">
**Visual diff:** ativado | desativado

## Resumo
| Métrica | Valor |
|---------|-------|
| Total de bugs retestados | N |
| ✅ Corrigidos | N |
| ❌ Persistem | N |
| ⚠️ Regressões | N |
| 🔄 Inconclusivos | N |
| Cenários relacionados testados | N |
| Regressões em cenários relacionados | N |

## Detalhe por bug

### BUG-042 — Modal não fecha com ESC
- **Módulo:** Relatórios
- **Severidade:** Alta
- **Status Jira:** In QA
- **URL:** /reports
- **Status anterior:** Failed
- **Status atual:** ✅ Corrigido
- **Cenários relacionados testados:** CT-096 (✅), CT-097 (✅), CT-098 (✅)
- **Evidências:**
  - Antes: `evidencias_anteriores/BUG-042_screenshot.png`
  - Depois: `screenshots/BUG-042_reteste.png`
  - Vídeo: `videos/BUG-042_<timestamp>.mp4`
  - Diff visual: `diff_visual/BUG-042_diff.png` (se ativado)
- **Observações:** Modal agora fecha corretamente com ESC. Foco retorna ao trigger. Cenários relacionados continuam passando.

### BUG-053 — Export PDF gera arquivo vazio
- **Módulo:** Relatórios
- **Severidade:** Média
- **Status Jira:** Reopened
- **URL:** /reports/{id}
- **Status anterior:** Failed
- **Status atual:** ❌ Persiste
- **Cenários relacionados testados:** CT-014 (❌ Regressão)
- **Evidências:**
  - Antes: `evidencias_anteriores/BUG-053_screenshot.png`
  - Depois: `screenshots/BUG-053_reteste.png`
  - Vídeo: `videos/BUG-053_<timestamp>.mp4`
- **Observações:** Export PDF ainda gera arquivo vazio. Além disso, CT-014 (cenário relacionado) agora também falha — possível regressão introduzida pela tentativa de correção.

## Bugs corrigidos
| ID | Título | Módulo | Severidade | Cenários relacionados |
|----|--------|--------|------------|----------------------|
| BUG-042 | Modal não fecha com ESC | Relatórios | Alta | CT-096, CT-097, CT-098 (todos ✅) |

## Bugs que persistem
| ID | Título | Módulo | Severidade | Observação |
|----|--------|--------|------------|------------|
| BUG-053 | Export PDF gera arquivo vazio | Relatórios | Média | Ainda falha. CT-014 também falha agora (regressão) |

## Regressões detectadas
| Cenário | Descrição | Bug relacionado | Observação |
|---------|-----------|-----------------|------------|
| CT-014 | Exportação para PDF | BUG-053 | Passava antes, falha agora após tentativa de correção |

## Testes inconclusivos
| ID | Título | Motivo |
|----|--------|--------|
| ... | ... | URL inválida / Passos incompletos / Ambiente diferente |

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|

## Próximos passos
- Bugs corrigidos: atualizar status no Jira manualmente (transicionar para "Done")
- Bugs que persistem: reabrir no Jira com evidências de reteste (comentário + anexos)
- Regressões: criar novo bug no Jira com evidências
```

### 7. Resumo final
```
✅ Regressão concluída
   Fonte: <Jira Excel / Jira Word / Jira XML / Manual>
   Bugs retestados: <n>
   ✅ Corrigidos: <n>
   ❌ Persistem: <n>
   ⚠️ Regressões: <n>
   🔄 Inconclusivos: <n>
   Cenários relacionados testados: <n>
   Regressões em relacionados: <n>
   Visual diffs: <n> (se ativado)
   Console errors: <n>
   Requisições com erro: <n>
   Vídeos: clients/<id>/resultado/latest/videos/ (<n> arquivos)
   Screenshots: clients/<id>/resultado/latest/screenshots/
   Evidências anteriores: clients/<id>/resultado/latest/evidencias_anteriores/
   Relatório: clients/<id>/resultado/latest/regressao_<timestamp>.md

➡️  Próximo passo: Atualizar status dos bugs no Jira manualmente
➡️  Para bugs que persistem ou regressões: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/regressao_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/videos/<ID>_<timestamp>.mp4` (um por bug + cenários relacionados)
- `clients/<id>/resultado/<timestamp>/screenshots/<ID>_reteste.png` (um por bug)
- `clients/<id>/resultado/<timestamp>/screenshots/<ID>_regressao.png` (um por cenário relacionado)
- `clients/<id>/resultado/<timestamp>/evidencias_anteriores/` (cópias de prints/vídeos dos bugs)
- `clients/<id>/resultado/<timestamp>/diff_visual/<ID>_diff.png` (se --visual-diff)
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
