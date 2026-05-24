# Especificação MAIA — Skill Runner Engine (Pré-Sprint Técnica)

**Data:** 2026-05-23
**Skill:** `02-maia-especificacao`
**Executor:** Guardião MAIA (Cursor + Opus 4.7)
**Projeto-alvo:** BKPilot-SkillRunner
**Entradas:** HANDOFF.md, diagnóstico-2026-05-23-skillrunner.md, doc-fonte (Plano SkillRunner Primeiro), 13 skills web do Producao (`src/*.md`)

---

## 1. Resumo executivo

Esta especificação transforma a Pré-Sprint Técnica do documento-fonte em **requisitos formalmente verificáveis**, garantindo que o Skill Runner Engine seja **genérico o suficiente** para executar as 13 skills web do catálogo V1 (e qualquer skill futura no mesmo formato), enquanto o Gate 0 valida apenas a skill **Usabilidade** end-to-end.

O Engine é um **executor de manifesto** — não conhece o conteúdo das skills, só sabe ler manifesto, executar tools, passar prompt para LLM e coletar resultado.

---

## 2. Catálogo de skills V1 (13 skills web)

Mapeamento extraído do frontmatter de `src/*.md` no BKPilot-Producao:

| # | id | type | provider_hint | Tools Playwright | Tools FS | Tools especiais |
|---|---|---|---|---|---|---|
| 1 | `explorar` | interactive | strong | navigate, click, fill_form, snapshot, screenshot, wait_for, press_key, console_messages, network_requests | read, write | — |
| 2 | `gerar-cenarios` | pure_llm | strong | — | read, write | — |
| 3 | `testar-modulo` | hybrid | balanced | navigate, click, fill_form, snapshot, screenshot, wait_for | read, write | — |
| 4 | `executar-fluxo` | hybrid | balanced | navigate, click, fill_form, snapshot, screenshot, wait_for | read, write | — |
| 5 | `executar-planilha` | script | cheap | — | read, write | scripts Node (cenarios/_executar_planilha.js) |
| 6 | `testar-forms` | interactive | strong | navigate, click, fill_form, snapshot, screenshot, press_key, evaluate | read, write | — |
| 7 | `regressao` | hybrid | balanced | navigate, click, fill_form, snapshot, screenshot, press_key, wait_for, console_messages, network_requests | read, write | — |
| 8 | `usabilidade` | interactive | strong | navigate, click, snapshot, screenshot, evaluate | read, write | — |
| 9 | `acessibilidade` | hybrid | balanced | navigate, snapshot, screenshot, evaluate | read, write | — |
| 10 | `performance` | script | any | navigate, evaluate, screenshot | read, write | — |
| 11 | `api-check` | script | any | — | read, write | HTTP client (fetch/axios) |
| 12 | `testar-ia` | hybrid | balanced | — | read, write | HTTP client (interação com chat IA) |
| 13 | `reportar-bug` | pure_llm | balanced | — | read, write | — |

### Achados do mapeamento

- **4 tipos de skill:** `interactive` (browser pesado), `hybrid` (browser + LLM), `pure_llm` (só LLM + filesystem), `script` (automação Node).
- **3 níveis de provider_hint:** `strong` (LLM potente obrigatório), `balanced` (intermediário), `cheap`/`any` (modelo barato serve).
- **11 tools Playwright distintas** usadas no total: `navigate`, `click`, `fill_form`, `snapshot`, `screenshot`, `wait_for`, `press_key`, `evaluate`, `console_messages`, `network_requests`.
- **2 tools FS:** `read_file`, `write_file` (todas as skills usam).
- **2 tools especiais:** scripts Node (executar-planilha) e HTTP client (api-check, testar-ia).
- **Todos os inputs têm `cliente` como obrigatório** — no Engine SaaS virará `tenant_id` + `execution_id`. Na Pré-Sprint Técnica, mapeamos para `execution_id` local.

---

## 3. Schema formal do manifesto YAML

O manifesto é o **contrato** entre a skill e o Engine. Toda skill é uma pasta com:

```
skills/<skill_id>/
  manifest.yaml       ← contrato (este schema)
  prompt.md            ← instruções para o LLM
  report-template.md   ← template do relatório (opcional, pode estar no prompt)
```

### Schema do `manifest.yaml`

```yaml
# === IDENTIFICAÇÃO ===
id: string                    # único, kebab-case (ex: "usabilidade", "api-check")
name: string                  # nome humano (ex: "Avaliação Heurística de Usabilidade")
description: string           # 1 linha descritiva
version: string               # semver (ex: "1.0.0")

# === CLASSIFICAÇÃO ===
type: enum                    # "interactive" | "hybrid" | "pure_llm" | "script"
                              # interactive = browser pesado + LLM forte
                              # hybrid = browser + LLM moderado
                              # pure_llm = só LLM + filesystem
                              # script = automação Node, LLM opcional

# === LLM ===
llm:
  provider_hint: enum         # "strong" | "balanced" | "cheap" | "any"
                              # Indica ao Gateway qual tier de modelo usar.
                              # O Engine NÃO hardcoda modelo — Gateway resolve.
  max_tokens: number          # (opcional) limite de tokens por chamada LLM
  temperature: number         # (opcional) default 0.3
  system_prompt_file: string  # (opcional) path relativo a arquivo de system prompt

# === INPUTS ===
inputs:
  - name: string              # nome do campo (ex: "target_url")
    type: enum                # "string" | "number" | "boolean" | "url" | "file_path" | "json"
    required: boolean
    description: string
    default: any              # (opcional)
    validation: string        # (opcional) regex ou regra (ex: "^https?://")

# === TOOLS ===
tools:
  - id: string                # identificador da tool (ex: "browser.navigate")
    provider: enum            # "playwright_native" | "http_client" | "node_script" | "builtin"
    config: object            # (opcional) configuração específica da tool

# === OUTPUTS ===
outputs:
  - name: string              # nome do arquivo de saída (ex: "report.md")
    type: enum                # "markdown" | "json" | "png" | "mp4" | "xlsx" | "pdf"
    required: boolean         # se o Engine deve falhar caso não gere este output

# === COMPORTAMENTO ===
timeout_seconds: number       # default 300 (5 min). Max 1800 (30 min).
retry:
  max_attempts: number        # default 1 (sem retry). Max 3.
  on: enum[]                  # ["llm_error", "browser_error", "timeout"]

# === METADADOS ===
tags: string[]                # (opcional) ["web", "audit", "security", "lgpd"]
language: string              # idioma padrão do relatório (ex: "pt-BR")
```

### Validação ao carregar

O Engine DEVE validar o manifesto ao carregar a skill. Se inválido: retornar `MANIFEST_INVALID` (ver seção 6) e não executar.

Campos obrigatórios: `id`, `name`, `version`, `type`, `llm.provider_hint`, pelo menos 1 input, pelo menos 1 output.

---

## 4. Schema formal do `execution-input.json`

Este é o JSON que o chamador passa ao Engine para disparar uma execução.

```typescript
interface ExecutionInput {
  execution_id: string;         // único por execução (ex: "local-001", UUID em produção)
  skill_id: string;             // deve existir em skills/<skill_id>/manifest.yaml
  inputs: Record<string, any>;  // valores dos inputs declarados no manifesto
  options?: {
    timeout_override?: number;  // sobrescreve timeout do manifesto
    llm_override?: {            // sobrescreve hint do manifesto (debug/teste)
      provider?: string;
      model?: string;
    };
    dry_run?: boolean;          // se true, valida tudo mas não executa
    output_dir?: string;        // default: outputs/<execution_id>/
  };
}
```

### Exemplo para Gate 0 (Usabilidade local)

```json
{
  "execution_id": "local-001",
  "skill_id": "usabilidade",
  "inputs": {
    "target_url": "https://site-de-teste.com",
    "language": "pt-BR"
  }
}
```

---

## 5. Schema formal do `result.json`

Gerado pelo Engine ao final de toda execução.

```typescript
interface ExecutionResult {
  execution_id: string;
  skill_id: string;
  status: ExecutionStatus;
  started_at: string;           // ISO 8601
  finished_at: string;          // ISO 8601
  duration_ms: number;
  outputs: OutputFile[];        // lista de arquivos gerados
  error?: ExecutionError;       // presente se status != "completed"
  metrics?: {
    llm_calls: number;
    llm_tokens_in: number;
    llm_tokens_out: number;
    llm_cost_usd?: number;      // estimado, se disponível
    playwright_actions: number;
    screenshots_taken: number;
  };
}

type ExecutionStatus =
  | "completed"       // tudo OK, outputs gerados
  | "failed"          // erro técnico (Engine, Playwright, LLM)
  | "timeout"         // excedeu timeout
  | "cancelled"       // cancelado externamente
  | "partial"         // gerou alguns outputs mas não todos

interface OutputFile {
  name: string;       // ex: "report.md"
  type: string;       // ex: "markdown"
  path: string;       // caminho relativo ao output_dir
  size_bytes: number;
}

interface ExecutionError {
  code: string;       // código padronizado (ver seção 6)
  message: string;    // mensagem humana
  details?: any;      // stack trace ou contexto adicional (nunca expor PII)
}
```

---

## 6. Schema formal do `execution-log.json`

Log estruturado de **tudo** que aconteceu durante a execução.

```typescript
interface ExecutionLog {
  execution_id: string;
  skill_id: string;
  events: LogEvent[];
}

interface LogEvent {
  timestamp: string;            // ISO 8601
  level: "info" | "warn" | "error" | "debug";
  phase: ExecutionPhase;
  message: string;
  data?: any;                   // contexto (nunca PII)
}

type ExecutionPhase =
  | "init"             // carregamento do manifesto e validação
  | "browser"          // ações Playwright
  | "llm"              // chamadas ao LLM
  | "report"           // geração do relatório
  | "artifact"         // salvamento de artefatos
  | "cleanup"          // limpeza de recursos
```

---

## 7. Códigos de erro padronizados

| Código | Fase | Significado | Retornável ao cliente SaaS? |
|---|---|---|---|
| `MANIFEST_INVALID` | init | Manifesto YAML inválido ou incompleto | Não (erro interno) |
| `MANIFEST_NOT_FOUND` | init | Skill não encontrada em `skills/` | Não |
| `INPUT_VALIDATION_FAILED` | init | Input obrigatório ausente ou tipo errado | Sim |
| `BROWSER_LAUNCH_FAILED` | browser | Playwright não conseguiu abrir browser | Não |
| `BROWSER_NAVIGATION_FAILED` | browser | URL não respondeu ou timeout de navegação | Sim |
| `BROWSER_ACTION_FAILED` | browser | click/fill/evaluate falhou | Sim (genérico) |
| `BROWSER_TIMEOUT` | browser | Ação excedeu timeout individual | Sim |
| `LLM_CALL_FAILED` | llm | Chamada ao LLM retornou erro | Não |
| `LLM_TIMEOUT` | llm | LLM não respondeu no tempo | Não |
| `LLM_RESPONSE_INVALID` | llm | Resposta do LLM não parseable / fora do schema esperado | Não |
| `LLM_FALLBACK_EXHAUSTED` | llm | Primário e fallback(s) falharam | Não |
| `REPORT_GENERATION_FAILED` | report | Erro ao gerar relatório (template, dados) | Não |
| `ARTIFACT_SAVE_FAILED` | artifact | Erro ao salvar arquivo de saída | Não |
| `EXECUTION_TIMEOUT` | cleanup | Execução inteira excedeu timeout global | Sim |
| `EXECUTION_CANCELLED` | cleanup | Cancelamento solicitado externamente | Sim |
| `UNKNOWN_ERROR` | qualquer | Erro não classificado (fallback) | Não |

### Regra para erros retornáveis ao cliente SaaS

Erros marcados "Sim" geram mensagem amigável no portal. Erros marcados "Não" viram mensagem genérica ("Erro interno — tente novamente") e entram no log técnico + Sentry.

---

## 8. As 8 capacidades obrigatórias — definição operacional

Extraídas do doc-fonte seção 8, agora com **critério testável** para cada uma.

### CAP-1: Ler o manifesto da skill

**O que faz:** Carrega `skills/<skill_id>/manifest.yaml`, valida contra o schema (seção 3), retorna objeto tipado.

**Critério de aceite:**
- [ ] Manifesto válido → retorna objeto `SkillManifest` completo
- [ ] Manifesto com campo obrigatório faltando → retorna `MANIFEST_INVALID` com detalhes de qual campo
- [ ] Manifesto inexistente → retorna `MANIFEST_NOT_FOUND`
- [ ] Teste unitário cobre os 3 cenários

### CAP-2: Abrir a URL com Playwright

**O que faz:** Lança browser headless, navega para `target_url` do input, espera carregamento.

**Critério de aceite:**
- [ ] URL válida acessível → página carrega, status 200
- [ ] URL inválida/offline → retorna `BROWSER_NAVIGATION_FAILED` (não crash)
- [ ] Timeout de navegação → retorna `BROWSER_TIMEOUT`
- [ ] Browser fecha corretamente no cleanup mesmo em caso de erro
- [ ] Teste de integração com URL real (ex: `https://example.com`)

### CAP-3: Coletar texto, botões, links e campos

**O que faz:** Extrai DOM estruturado da página — textos visíveis, botões, links, inputs de formulário.

**Critério de aceite:**
- [ ] Página com formulário → retorna lista de campos com name/type/label
- [ ] Página com links → retorna lista de hrefs com texto âncora
- [ ] Página com botões → retorna lista com texto e tipo (submit, button)
- [ ] Resultado é JSON estruturado, não HTML bruto
- [ ] Teste unitário com página HTML fixa (fixture)

### CAP-4: Tirar screenshot

**O que faz:** Captura screenshot full-page em PNG.

**Critério de aceite:**
- [ ] Screenshot salvo em `outputs/<execution_id>/screenshot.png`
- [ ] Arquivo é PNG válido com > 0 bytes
- [ ] Em caso de falha do browser → não gera arquivo corrompido
- [ ] Teste verifica existência e formato do arquivo

### CAP-5: Chamar LLM ou usar mock

**O que faz:** Envia prompt + dados coletados para LLM via interface abstrata. Na Pré-Sprint Técnica, aceita mock que retorna resposta fixa.

**Critério de aceite:**
- [ ] Com mock: retorna resposta fixa configurável, sem chamada de rede
- [ ] Com LLM real: envia prompt, recebe resposta, parseia resultado
- [ ] LLM falha → retorna `LLM_CALL_FAILED`, tenta fallback se configurado
- [ ] Fallback esgotado → retorna `LLM_FALLBACK_EXHAUSTED`
- [ ] Métricas (tokens in/out, latência) são registradas no `execution-log.json`
- [ ] Interface é abstrata: trocar mock por LLM real = mudar configuração, não código

### CAP-6: Gerar relatório em Markdown

**O que faz:** Combina dados coletados + resposta do LLM + template da skill para gerar `report.md`.

**Critério de aceite:**
- [ ] Relatório salvo em `outputs/<execution_id>/report.md`
- [ ] Relatório contém seções obrigatórias: cabeçalho (data, URL, skill), corpo (análise), conclusão
- [ ] Se template existe na skill (`report-template.md`), é usado. Senão, formato genérico
- [ ] Relatório não contém placeholders não preenchidos (ex: `<n>` sem valor)
- [ ] Teste verifica que relatório é Markdown válido com > 100 caracteres

### CAP-7: Salvar logs e evidências

**O que faz:** Grava `execution-log.json` (seção 6), `result.json` (seção 5), screenshots, e quaisquer outputs declarados no manifesto.

**Critério de aceite:**
- [ ] Diretório `outputs/<execution_id>/` criado automaticamente
- [ ] `result.json` presente e válido contra schema da seção 5
- [ ] `execution-log.json` presente e válido contra schema da seção 6
- [ ] Todos os outputs marcados `required: true` no manifesto existem
- [ ] Se output required não foi gerado → status = `partial` (não `completed`)

### CAP-8: Retornar completed ou failed

**O que faz:** Define status final da execução baseado no que aconteceu.

**Critério de aceite:**
- [ ] Tudo OK → `completed` (todos outputs required gerados)
- [ ] Erro técnico em qualquer fase → `failed` com código de erro
- [ ] Timeout global → `timeout`
- [ ] Alguns outputs gerados mas não todos → `partial`
- [ ] `result.json` sempre é gerado, mesmo em caso de `failed`
- [ ] Processo sai com exit code 0 se `completed`, exit code 1 se `failed`/`timeout`

---

## 9. Definição operacional do Gate 0

### O que é

O Gate 0 é a **primeira prova de vida** do Skill Runner Engine. Responde à pergunta: *"A skill consegue executar e gerar resultado?"*

### Comando

```bash
npm run execute -- --skill usabilidade --input inputs/execution-local.json
```

### Input

```json
{
  "execution_id": "gate0-001",
  "skill_id": "usabilidade",
  "inputs": {
    "target_url": "https://example.com",
    "language": "pt-BR"
  }
}
```

### Critérios mensuráveis (todos devem passar)

| # | Critério | Como verificar |
|---|---|---|
| G0-1 | Comando executa sem crash | Exit code 0 |
| G0-2 | `outputs/gate0-001/result.json` existe e tem `status: "completed"` | JSON parse + campo |
| G0-3 | `outputs/gate0-001/report.md` existe e tem > 500 caracteres | Tamanho do arquivo |
| G0-4 | `outputs/gate0-001/screenshot.png` existe e é PNG válido | Magic bytes `89 50 4E 47` |
| G0-5 | `outputs/gate0-001/execution-log.json` existe e tem ≥ 5 eventos | JSON parse + count |
| G0-6 | `result.json` contém `metrics.llm_calls ≥ 1` (ou mock registrado) | Campo numérico |
| G0-7 | `result.json` contém `duration_ms < 300000` (< 5 min) | Campo numérico |
| G0-8 | Relatório menciona pelo menos 3 das 10 heurísticas de Nielsen | Grep no conteúdo |
| G0-9 | Nenhum erro não-tratado no stderr | Captura de stderr |
| G0-10 | Browser Playwright fecha corretamente (sem processo zumbi) | `ps` após execução |

### Critério de paridade com Claude Code (ADR-005)

Executar a mesma URL com a skill `/usabilidade` do Producao atual (via Claude Code) e comparar:

- **Paridade estrutural:** relatório do Engine contém as mesmas seções principais (score por heurística, violações, quick wins, parecer técnico).
- **Paridade de conteúdo:** ≥ 80% das violações encontradas pelo Claude Code também aparecem no relatório do Engine.
- **Meta:** paridade ≥ 80% no Gate 0. Meta ≥ 95% na Sprint 1.

> **Nota:** paridade < 80% no Gate 0 **não bloqueia**. Indica necessidade de refinamento do prompt, não falha do Engine. Basta registrar e iterar.

---

## 10. Mapeamento de tools do Engine

Consolidação de todas as tools necessárias para suportar as 13 skills:

### Tools Playwright (provider: `playwright_native`)

| Tool ID | Função | Skills que usam |
|---|---|---|
| `browser.navigate` | Navegar para URL | 1,3,4,6,7,8,9,10 |
| `browser.click` | Clicar em elemento | 1,3,4,6,7 |
| `browser.fill_form` | Preencher campo de formulário | 1,3,4,6,7 |
| `browser.snapshot` | Capturar DOM/accessibility tree | 1,3,4,6,7,8,9 |
| `browser.screenshot` | Capturar screenshot PNG | 1,3,4,6,7,8,9,10 |
| `browser.wait_for` | Esperar elemento/condição | 1,3,4,7 |
| `browser.press_key` | Pressionar tecla | 1,6,7 |
| `browser.evaluate` | Executar JS na página | 6,8,9,10 |
| `browser.console_messages` | Capturar console.log/error | 1,7 |
| `browser.network_requests` | Interceptar requests HTTP | 1,7 |

### Tools de filesystem (provider: `builtin`)

| Tool ID | Função | Skills que usam |
|---|---|---|
| `fs.read_file` | Ler arquivo local | todas (13/13) |
| `fs.write_file` | Escrever arquivo local | todas (13/13) |

### Tools especiais (provider: `node_script` ou `http_client`)

| Tool ID | Função | Skills que usam |
|---|---|---|
| `script.execute_node` | Rodar script Node.js | 5 (executar-planilha) |
| `http.request` | Fazer request HTTP direto (sem browser) | 11 (api-check), 12 (testar-ia) |

### Total: 14 tools distintas

O Engine implementa 14 tools. Toda skill futura que usar qualquer combinação dessas 14 **funciona sem mudança no Engine**. Skill que precisar de tool nova → adiciona ao Engine (extensível por design).

---

## 11. Interface do LLM Client (abstrata)

```typescript
interface LLMClient {
  call(request: LLMRequest): Promise<LLMResponse>;
}

interface LLMRequest {
  system_prompt?: string;
  user_prompt: string;
  provider_hint: "strong" | "balanced" | "cheap" | "any";
  max_tokens?: number;
  temperature?: number;
  response_format?: "text" | "json";
}

interface LLMResponse {
  content: string;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_usd?: number;
}
```

### Implementações previstas

| Implementação | Quando | Uso |
|---|---|---|
| `MockLLMClient` | Pré-Sprint Técnica | Retorna texto fixo de arquivo. Para testar fluxo sem LLM real. |
| `CursorLLMClient` | Pré-Sprint Técnica / Sprint 1 | Chama Opus 4.7 via Cursor para validar qualidade. |
| `GatewayLLMClient` | Sprint 2+ | Chama LiteLLM Gateway (produção). Provider é configuração. |

Trocar implementação = trocar uma linha de configuração. Zero mudança nas skills ou no Engine.

---

## 12. Riscos específicos da especificação

| # | Risco | Gravidade | Mitigação |
|---|---|---|---|
| E1 | `executar-planilha` (skill 5) exige scripts Node externos — Engine precisa de sandbox para execução segura | MÉDIA | Implementar `script.execute_node` com subprocess isolado + timeout. Não é prioridade no Gate 0. |
| E2 | `api-check` (skill 11) e `testar-ia` (skill 12) precisam de HTTP client — não é Playwright | MÉDIA | Implementar `http.request` como tool separada. Não é prioridade no Gate 0. |
| E3 | Skills `interactive` + `hybrid` podem ter fluxos de autenticação complexos (login do SUT) | MÉDIA | Na Pré-Sprint Técnica, Gate 0 usa URL pública (ex: example.com). Auth entra no escopo de Sprint 1. |
| E4 | Schema do manifesto pode precisar de campos adicionais conforme skills são convertidas | BAIXA | Schema é extensível — campos opcionais podem ser adicionados sem quebrar skills existentes. |
| E5 | Relatório do Engine pode não atingir paridade 80% com Claude Code na primeira tentativa | MÉDIA | Registrar delta, iterar prompt. Não é bloqueador do Gate 0 (ver seção 9). |

---

## 13. Atualização do ADR-005

**ADR-005 — ATUALIZADO:**

**Antes:** Skill Usabilidade primeiro, sozinha, no Gate 0.

**Agora:** Skill Usabilidade primeiro no Gate 0. **Catálogo do Engine é 13 skills web.** O manifesto e as interfaces do Engine são desenhados para suportar todas as 13 desde o dia 1 (e qualquer skill futura). Implementação segue a ordem:
1. Gate 0: Usabilidade
2. Sprint 1: converter + validar as demais 12 skills (manifesto + prompt, sem alterar Engine)
3. Gate 1: pelo menos 3 skills passando E2E

**Justificativa da atualização:** O owner informou que as 13 skills web (src/explorar.md → src/reportar-bug.md) são o catálogo V1, não apenas as 4 mencionadas no doc-fonte.

---

## 14. Checklist de conclusão

- [x] 13 skills web mapeadas (frontmatter extraído)
- [x] Schema do `manifest.yaml` formal e genérico
- [x] Schema do `execution-input.json` formal
- [x] Schema do `result.json` formal
- [x] Schema do `execution-log.json` formal
- [x] 16 códigos de erro padronizados
- [x] 8 capacidades com critério de aceite testável
- [x] Gate 0: 10 critérios mensuráveis + critério de paridade
- [x] Mapeamento completo de tools (14 tools / 4 providers)
- [x] Interface abstrata do LLM Client com 3 implementações previstas
- [x] 5 riscos específicos da especificação identificados
- [x] ADR-005 atualizado com escopo expandido
- [ ] **Pendente:** validar com o owner se alguma skill web requer tool não mapeada

---

## 15. Decisão final

```text
APROVADO
```

**Justificativa:** Os requisitos estão formalizados com schemas verificáveis, critérios de aceite testáveis, códigos de erro padronizados e definição operacional do Gate 0 com 10 critérios mensuráveis. O Engine está desenhado para suportar as 13 skills web do catálogo V1 e qualquer skill futura no mesmo formato de manifesto. Não há bloqueador para avançar para `04-maia-arquitetura`.

---

## 16. Próxima skill recomendada

**`04-maia-arquitetura`** — definir stack TypeScript detalhada, estrutura de pastas real, estratégia de build/test, e como as 13 skills do Producao são convertidas para o formato de manifesto do Engine.

---

## 17. Saída literal MAIA

```text
Skill:              02-maia-especificacao (Skill Runner Engine)
Decisão final:      APROVADO
Próxima skill:      04-maia-arquitetura
Bloqueadores:       Nenhum
Riscos:             E1-E5 (3 MÉDIA, 2 BAIXA)
ADR atualizado:     005 (escopo expandido: 13 skills V1)
Artefatos:          especificacao-2026-05-23-skillrunner.md
Schemas definidos:  manifest.yaml, execution-input.json, result.json, execution-log.json
Tools mapeadas:     14 (10 Playwright + 2 FS + 1 script + 1 HTTP)
Códigos de erro:    16
Gate 0:             10 critérios mensuráveis
```

---

**Fim da especificação.**
