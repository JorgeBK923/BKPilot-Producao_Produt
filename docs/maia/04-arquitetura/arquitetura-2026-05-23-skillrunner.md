# Arquitetura MAIA — Skill Runner Engine (Pré-Sprint Técnica)

**Data:** 2026-05-23
**Skill:** `04-maia-arquitetura`
**Executor:** Guardião MAIA (Cursor + Opus 4.7)
**Projeto-alvo:** BKPilot-SkillRunner (repo novo, ainda não criado)
**Entradas consumidas:** `HANDOFF.md`, `docs/maia/02-especificacao/especificacao-2026-05-23-skillrunner.md`, `docs/maia/01-diagnostico/diagnostico-2026-05-23-skillrunner.md`, doc-fonte `BKPilot_Plano_SkillRunner_Primeiro.md` (seções 8 e 9), 13 skills web em `src/*.md` do Producao.

---

## 1. Resumo executivo

Esta arquitetura define **como** construir o Skill Runner Engine de forma que ele satisfaça a especificação aprovada na `02-maia-especificacao`, respeite os ADRs 001-007 e seja capaz de passar no **Gate 0** com a skill **Usabilidade**.

Decisões macro:

1. **Stack TypeScript estrita** (strict mode, ESM, Node 20 LTS — pinned por `.nvmrc`).
2. **Engine como biblioteca + CLI fino** — Engine é um pacote interno consumível; CLI é só um entrypoint. Isso garante ADR-006 (Engine ≠ Worker) desde o dia 1.
3. **Arquitetura em camadas** (Core → Runtime → Adapters → CLI), inversão de dependência via interfaces. Trocar `MockLLMClient` por `GatewayLLMClient` é mudar 1 linha de wiring.
4. **Playwright como dependência direta** (não MCP) — Engine precisa de controle programático puro, sem overhead de tool calls de IA. O MCP do Producao continua existindo para as skills atuais; o Engine é um caminho independente.
5. **Schemas YAML/JSON validados em runtime** com `zod` + `yaml` — não confiamos em tipagem estática para inputs externos (manifesto e `execution-input.json`).
6. **Skills convertidas em lote** após o Gate 0 — durante a Pré-Sprint Técnica, só `usabilidade` é convertida manualmente. Sprint 1 cria um script de conversão semi-automática a partir do frontmatter de `src/*.md`.
7. **Reaproveitamento mínimo do BKPilot-Core** nesta fase — Engine é novo, isolado, sem dependência do Core (ADR-001). Migração de utilitários só acontece se justificada por código duplicado real.

Não há bloqueador arquitetural. As 2 pendências humanas registradas no HANDOFF (prazo da Pré-Sprint, modo de criação do repo) continuam pendentes mas não impedem esta skill.

---

## 2. Stack TypeScript detalhada

### 2.1 Runtime e linguagem

| Item | Decisão | Justificativa |
|---|---|---|
| Node.js | **20.x LTS** (pinned via `.nvmrc` e `engines` no `package.json`) | LTS estável, sem features experimentais. Producao atual roda 26.1.0, mas isso é local — em produção SaaS o alvo é LTS conservador. |
| TypeScript | **5.4+** | Versão estável atual. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. |
| Módulos | **ESM puro** (`"type": "module"` no `package.json`) | Padrão moderno. Playwright e zod suportam ESM nativo. Evita pegadinhas CJS/ESM mistas. |
| Target | `ES2022` | Compatível com Node 20. |
| Package manager | **npm** | Padrão do ecossistema BKPilot (Producao usa npm). Sem pnpm/yarn nesta fase para evitar atrito. |

### 2.2 Dependências runtime (mínimas)

| Pacote | Versão alvo | Função | Camada |
|---|---|---|---|
| `playwright` | `^1.45` | Browser automation | Adapter |
| `zod` | `^3.23` | Validação de schemas (manifest, input, result) | Core |
| `yaml` | `^2.5` | Parse YAML de manifesto | Adapter |
| `commander` | `^12` | CLI parsing (`--skill`, `--input`) | CLI |
| `pino` | `^9` | Logger estruturado JSON | Core |
| `nanoid` | `^5` | Geração de IDs (quando `execution_id` não vier do input) | Core |

**Notas:**
- **Sem** `axios` — usamos `fetch` nativo do Node 20 para o `http.request` tool (CAP futura).
- **Sem** `dotenv` no Engine — variáveis de ambiente são responsabilidade do chamador (CLI ou Worker). O Engine recebe config injetada.
- **Sem** framework de DI (NestJS, tsyringe). Wiring manual via construtores. Engine é pequeno o suficiente.

### 2.3 Dependências dev

| Pacote | Função |
|---|---|
| `typescript` | Compilador |
| `tsx` | Execução TS em dev (substitui ts-node) |
| `vitest` | Test runner (rápido, ESM nativo, melhor que Jest em 2026) |
| `@vitest/coverage-v8` | Cobertura |
| `eslint` + `@typescript-eslint/*` | Lint |
| `prettier` | Format |
| `@types/node` | Tipos Node |

### 2.4 Scripts npm

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsx src/cli/index.ts",
    "execute": "tsx src/cli/index.ts execute",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --max-warnings 0",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit",
    "gate0": "tsx scripts/gate0-validate.ts"
  }
}
```

O comando do Gate 0 fica literalmente como especificado no doc-fonte:

```bash
npm run execute -- --skill usabilidade --input inputs/execution-local.json
```

E o script `gate0` valida os 10 critérios mensuráveis da especificação (G0-1 a G0-10) após a execução, retornando exit code 0/1.

---

## 3. Estrutura de pastas real do repo `BKPilot-SkillRunner`

```text
BKPilot-SkillRunner/
├─ .github/
│  └─ workflows/
│     └─ ci.yml                          # build + lint + test + typecheck
├─ .vscode/
│  └─ settings.json                       # opcional, eslint+prettier on save
├─ docs/
│  └─ maia/                               # MAIA local deste repo (ADR-003)
│     ├─ README.md                        # aponta para skill pack no Producao
│     ├─ 01-diagnostico/
│     ├─ 02-especificacao/
│     ├─ 04-arquitetura/
│     ├─ 06-implementacao/
│     ├─ 07-qa-validacao/
│     └─ handoffs/
├─ inputs/
│  └─ execution-local.json                # input do Gate 0
├─ outputs/                               # gerado em runtime (gitignored)
│  └─ <execution_id>/
│     ├─ report.md
│     ├─ screenshot.png
│     ├─ execution-log.json
│     └─ result.json
├─ scripts/
│  ├─ gate0-validate.ts                   # validador dos 10 critérios G0-*
│  └─ convert-skill.ts                    # (Sprint 1) converte src/*.md → manifest.yaml
├─ skills/
│  └─ usabilidade/                        # única skill no Gate 0
│     ├─ manifest.yaml
│     ├─ prompt.md
│     └─ report-template.md
├─ src/
│  ├─ core/                               # CAMADA 1 — domínio puro, sem I/O
│  │  ├─ types.ts                         # SkillManifest, ExecutionInput, ExecutionResult, etc.
│  │  ├─ errors.ts                        # 16 códigos de erro (seção 7 da especificação)
│  │  ├─ schemas/
│  │  │  ├─ manifest.schema.ts            # zod schema do manifest.yaml
│  │  │  ├─ execution-input.schema.ts     # zod schema do input
│  │  │  └─ result.schema.ts              # zod schema do result.json
│  │  └─ logger.ts                        # wrapper pino com phases tipadas
│  │
│  ├─ runtime/                            # CAMADA 2 — orquestração
│  │  ├─ runner.ts                        # orquestrador principal (executa skill end-to-end)
│  │  ├─ skill-loader.ts                  # carrega + valida manifesto YAML (CAP-1)
│  │  ├─ artifact-manager.ts              # gerencia outputs/<execution_id>/ (CAP-7)
│  │  ├─ report-generator.ts              # combina template + dados + LLM (CAP-6)
│  │  └─ status-resolver.ts               # decide completed/failed/partial/timeout (CAP-8)
│  │
│  ├─ tools/                              # CAMADA 3 — adapters (tools do Engine)
│  │  ├─ registry.ts                      # registry de tools por id
│  │  ├─ browser/
│  │  │  ├─ playwright-executor.ts        # implementa as 10 tools browser.*
│  │  │  └─ types.ts                      # tipos de input/output das tools
│  │  ├─ fs/
│  │  │  └─ fs-tools.ts                   # fs.read_file, fs.write_file
│  │  ├─ http/
│  │  │  └─ http-client.ts                # http.request (Sprint 1, stub no Gate 0)
│  │  └─ script/
│  │     └─ node-script-runner.ts         # script.execute_node (Sprint 1, stub no Gate 0)
│  │
│  ├─ llm/                                # CAMADA 3 — adapter LLM
│  │  ├─ llm-client.interface.ts          # interface da seção 11 da especificação
│  │  ├─ mock-llm-client.ts               # MockLLMClient (Gate 0)
│  │  ├─ cursor-llm-client.ts             # CursorLLMClient (stub no Gate 0, real na Sprint 1)
│  │  └─ gateway-llm-client.ts            # GatewayLLMClient (Sprint 2+, stub agora)
│  │
│  ├─ cli/                                # CAMADA 4 — entrypoint
│  │  └─ index.ts                         # commander: `execute --skill X --input Y`
│  │
│  └─ index.ts                            # barrel export da biblioteca (Engine público)
│
├─ tests/
│  ├─ unit/
│  │  ├─ skill-loader.test.ts             # CAP-1
│  │  ├─ status-resolver.test.ts          # CAP-8
│  │  ├─ schemas.test.ts                  # validação zod
│  │  └─ mock-llm-client.test.ts          # CAP-5 (mock)
│  ├─ integration/
│  │  ├─ playwright-executor.test.ts      # CAP-2/3/4 (Playwright real, example.com)
│  │  └─ runner-e2e.test.ts               # CAP-1 a CAP-8 com MockLLMClient
│  └─ fixtures/
│     ├─ manifests/                       # YAMLs válidos e inválidos
│     ├─ pages/                           # HTMLs estáticos para CAP-3
│     └─ llm-responses/                   # respostas fixas para MockLLMClient
│
├─ .env.example                           # template (nunca commitar .env real)
├─ .gitignore                             # node_modules, outputs/, .env, dist/, coverage/
├─ .nvmrc                                 # 20.x
├─ .eslintrc.cjs
├─ .prettierrc
├─ AGENTS.md                              # quick reference (padrão BKPilot)
├─ CLAUDE.md                              # opcional, regras globais se Claude for usado
├─ HANDOFF.md                             # HANDOFF vivo deste repo
├─ LICENSE                                # a definir (privado por enquanto)
├─ README.md                              # como rodar, Gate 0, comandos
├─ package.json
├─ package-lock.json
├─ tsconfig.json                          # base (strict)
└─ tsconfig.build.json                    # build (excluí tests)
```

### Notas sobre a estrutura

- **`src/core/`** é puro: zero dependência de Playwright, zero I/O. Só tipos, schemas, errors e logger. Testável sem mocks.
- **`src/runtime/`** orquestra. Recebe adapters por injeção de construtor. Não conhece Playwright nem LLM concretos — só interfaces.
- **`src/tools/`** e **`src/llm/`** são adapters trocáveis. Inversão de dependência clara.
- **`src/cli/`** é fino: lê argumentos, monta wiring, chama `Runner.run()`, formata exit code.
- **`scripts/gate0-validate.ts`** é fora de `src/` porque é tooling de projeto, não parte do Engine publicável.

---

## 4. Estratégia de build e teste

### 4.1 Build

| Ambiente | Comando | Mecanismo |
|---|---|---|
| Dev local | `npm run dev` | `tsx` direto (sem build) |
| Gate 0 | `npm run execute` | `tsx` (rápido, sem build) |
| CI / produção (Sprint 1+) | `npm run build` → `node dist/cli/index.js` | `tsc` para `dist/`, ESM puro |
| Consumo como biblioteca (Sprint 2 Worker) | importa de `dist/index.js` | Engine é publicável |

`tsconfig.build.json` exclui `tests/`, `scripts/`, `**/*.test.ts`. Gera `dist/` com `.js` + `.d.ts`.

### 4.2 Pirâmide de testes

| Nível | Ferramenta | Cobertura alvo | Roda quando |
|---|---|---|---|
| Unit | vitest | ≥ 80% em `src/core/` e `src/runtime/` | a cada commit (CI + pre-push) |
| Integration | vitest + Playwright real | CAP-2/3/4 contra `example.com`; runner E2E com mock LLM | CI (job separado, mais lento) |
| Gate 0 | `scripts/gate0-validate.ts` | 10 critérios mensuráveis G0-1..G0-10 | sob demanda (`npm run gate0`) |

### 4.3 CI (GitHub Actions, `.github/workflows/ci.yml`)

Jobs em paralelo:
1. **lint-format**: `npm run lint` + `prettier --check`
2. **typecheck**: `npm run typecheck`
3. **unit**: `npm run test` (sem Playwright)
4. **integration**: `npx playwright install --with-deps chromium` + `npm run test:coverage`
5. **gate0** (opcional, manual trigger): roda o Gate 0 contra `example.com`

CI bloqueia merge se qualquer job falhar (após a Sprint 1, com branch protection).

### 4.4 Convenções de teste

- Cada CAP da especificação tem **pelo menos 1 teste** que cita explicitamente o ID (`CAP-1`, `CAP-2`...) no nome do `describe` ou `it`. Rastreabilidade direta entre teste e critério de aceite.
- Tests de integração que usam Playwright **devem** rodar em headless e fechar o browser em `afterEach` para evitar processos zumbi (critério G0-10).
- Nenhum teste pode depender de credenciais reais (`.env`). Gate 0 usa URL pública.

---

## 5. Modelo de inversão de dependência (wiring)

### 5.1 Interfaces principais (em `src/core/types.ts`)

```typescript
export interface BrowserExecutor {
  launch(): Promise<void>;
  navigate(url: string, opts?: NavigateOpts): Promise<NavigateResult>;
  snapshot(): Promise<DomSnapshot>;
  screenshot(path: string): Promise<ScreenshotResult>;
  evaluate<T>(script: string): Promise<T>;
  // ... demais tools browser.*
  close(): Promise<void>;
}

export interface LLMClient {
  call(req: LLMRequest): Promise<LLMResponse>; // assinatura da especificação seção 11
}

export interface ArtifactManager {
  ensureOutputDir(executionId: string): Promise<string>;
  writeFile(name: string, content: Buffer | string): Promise<OutputFile>;
  writeJson(name: string, data: unknown): Promise<OutputFile>;
}

export interface SkillLoader {
  load(skillId: string): Promise<SkillManifest>; // CAP-1
}
```

### 5.2 Wiring em `src/cli/index.ts` (Gate 0)

```typescript
const runner = new Runner({
  skillLoader: new FileSystemSkillLoader({ skillsDir: 'skills' }),
  browser:     new PlaywrightExecutor({ headless: true }),
  llm:         new MockLLMClient({ responsesDir: 'tests/fixtures/llm-responses' }),
  artifacts:   new LocalArtifactManager({ baseDir: 'outputs' }),
  logger:      createLogger({ level: 'info' }),
});

const result = await runner.run(executionInput);
process.exit(result.status === 'completed' ? 0 : 1);
```

### 5.3 Wiring em Sprint 2 (Worker)

```typescript
const runner = new Runner({
  skillLoader: new FileSystemSkillLoader({ skillsDir: '/var/bkp/skills' }),
  browser:     new PlaywrightExecutor({ headless: true }),
  llm:         new GatewayLLMClient({ baseUrl: env.LITELLM_URL, apiKey: env.LITELLM_KEY }),
  artifacts:   new S3ArtifactManager({ bucket: env.ARTIFACTS_BUCKET }),
  logger:      createLogger({ level: 'info', destination: 'stdout' }),
});
```

**Zero mudança no `Runner` e nas skills.** Só trocou wiring. Isso satisfaz o requisito da especificação seção 11 ("trocar mock por LLM real = mudar configuração, não código").

---

## 6. Estratégia de conversão das 13 skills do Producao

### 6.1 Realidade do `src/*.md` atual

As 13 skills web vivem como Markdown com frontmatter YAML, mais corpo em prosa com instruções para o agente Claude. **Não são manifestos do Engine** — são prompts ricos. A conversão tem 3 camadas:

| Camada | O que vira | Onde vai |
|---|---|---|
| Frontmatter (`type`, `provider_hint`, `tools`, `inputs`, `outputs`) | Manifesto YAML | `skills/<id>/manifest.yaml` |
| Corpo do `.md` (instruções, regras, formato esperado) | Prompt do LLM | `skills/<id>/prompt.md` |
| Template de relatório embutido no corpo | Template Markdown | `skills/<id>/report-template.md` |

### 6.2 Fluxo de conversão

```text
src/usabilidade.md   ─┐
                      ├─► scripts/convert-skill.ts ─► skills/usabilidade/{manifest.yaml, prompt.md, report-template.md}
[regras de mapping]   ─┘
```

O script `convert-skill.ts` (a ser criado na Sprint 1, **não** no Gate 0) faz:
1. Parseia o frontmatter de `src/<id>.md` (já mapeado na especificação seção 2).
2. Gera `manifest.yaml` mapeando campos do frontmatter para o schema da especificação seção 3.
3. Extrai corpo do `.md` para `prompt.md`, limpando referências a Claude Code, MCP, paths absolutos do Producao.
4. Identifica blocos de template (heurística: blocos `markdown` ou seções marcadas) e extrai para `report-template.md`.
5. Marca campos que exigem revisão humana (ex: tool referenciada no `.md` mas não no frontmatter) com comentário `# REVIEW:` no YAML.

### 6.3 Conversão da skill `usabilidade` no Gate 0 (manual)

Para o Gate 0, **não** rodamos o script. A `usabilidade` é convertida **à mão** durante a `06-maia-implementacao` para garantir qualidade do primeiro manifesto e validar que o schema da especificação é suficiente. O script de conversão entra depois, na Sprint 1, calibrado com o aprendizado da conversão manual.

### 6.4 Tabela de prioridade de conversão (Sprint 1)

| Ordem | Skill | Tipo | Justificativa da ordem |
|---|---|---|---|
| 1 | `usabilidade` | interactive | Já feita no Gate 0 |
| 2 | `gerar-cenarios` | pure_llm | Mais simples (sem browser), valida `llm` + `fs.*` |
| 3 | `acessibilidade` | hybrid | Valida `browser.evaluate` + LLM |
| 4 | `performance` | script | Valida `browser.evaluate` + tools de medição |
| 5 | `reportar-bug` | pure_llm | Valida pipeline pure_llm completo |
| 6 | `explorar` | interactive | Mais complexa (8 tools browser), valida abrangência |
| 7-13 | demais | — | Conversão em lote após estabilidade do convert-skill.ts |

Esta ordem foca em **cobrir os 4 tipos de skill** o mais cedo possível (interactive, pure_llm, hybrid, script), aumentando confiança no Engine antes de skills mais complexas.

### 6.5 Skills fora do escopo desta arquitetura

Skills mobile (`*-mobile-tv`, `*-mobile-web`, `*-mobile-apk`) **não entram** no Engine V1. Permanecem no Producao com runtime Appium/MCP do BKPilot-Core. Quando o Engine for maduro (Sprint 4+) avaliar generalizar — mas é decisão futura, fora deste ciclo.

---

## 7. Reaproveitamento do BKPilot-Core e do Producao

### 7.1 Princípio (ADR-001)

Engine é **isolado**. Não importa nada do BKPilot-Core nesta fase. Razão:
- Core foi desenhado para o runtime do Producao (Claude Code + MCP). Engine tem outro runtime (Playwright direto + LLM Client abstrato). Sobreposição real é pequena.
- Importar Core agora ataria o Engine ao ciclo de release do Core, contrariando o objetivo de "motor independente, testável sozinho".

### 7.2 O que pode ser inspiração (não dependência)

| Padrão do Core/Producao | Como o Engine usa |
|---|---|
| Mascaramento de PII (`mobile/redaction`) | **Inspiração** para um futuro módulo `src/security/redaction.ts` no Engine. Não copiar código — reimplementar limpo. Sprint 3 (security). |
| Estrutura `clients/<id>/resultado/<timestamp>/` | **Conceito** aplicado em `outputs/<execution_id>/`. Sem reuso de código. |
| Skills do Producao (`src/*.md`) | **Insumo** da conversão (seção 6). Não código, conteúdo. |
| Convenções de logging estruturado | **Conceito** aplicado via `pino`. Sem reuso. |

### 7.3 Se no futuro houver reuso real

Quando (e se) houver código genuinamente duplicado entre Engine e Core, criar um terceiro pacote `@bugkillers/bkp-common` com utilitários puros (sem I/O, sem Playwright, sem Appium). **Não acoplar Engine ↔ Core diretamente.**

---

## 8. Decisões adicionais desta arquitetura (ADR-008 a ADR-012)

Estas são novas decisões que **complementam** as ADRs 001-007 do diagnóstico. Não as substituem.

### ADR-008 — Engine como biblioteca + CLI fino

**Decisão:** Engine é exportado como biblioteca TS (`src/index.ts` é o barrel) e a CLI é apenas um entrypoint que monta wiring e chama `Runner.run()`.

**Justificativa:** ADR-006 (Engine ≠ Worker) exige que o Engine seja consumível pelo Worker SaaS futuro. Tratar Engine como biblioteca desde o dia 1 evita refactor doloroso na Sprint 2.

**Implicação:** `package.json` declara `main`, `types`, `exports`. Sprint 2 publica como tag GitHub (padrão já validado: Producao consome `@bugkillers/bkpilot-core`).

### ADR-009 — Playwright direto, não MCP, no Engine

**Decisão:** Engine usa o pacote `playwright` diretamente, **não** o Playwright MCP do Producao.

**Justificativa:**
- MCP foi desenhado para LLMs (Claude Code) chamarem tools via protocolo. Engine não é LLM — é orquestrador determinístico.
- Overhead de tool call IA-mediada é desnecessário e custa tokens (cada chamada vira ida e volta).
- Controle programático puro permite testes determinísticos (CAP-2/3/4).

**Implicação:** Producao continua com MCP para suas 27 skills atuais. Engine é um caminho paralelo. Sem conflito.

### ADR-010 — `zod` como única fonte de verdade de schemas

**Decisão:** Schemas `manifest.yaml`, `execution-input.json`, `result.json`, `execution-log.json` são definidos como `z.object(...)` em `src/core/schemas/` e **os tipos TS são derivados** via `z.infer<typeof schema>`.

**Justificativa:** Evita drift entre tipo TS e validador runtime. Mudança no schema = mudança em um único arquivo.

**Implicação:** Não há `interface SkillManifest` escrita à mão — é `type SkillManifest = z.infer<typeof manifestSchema>`.

### ADR-011 — Logger estruturado JSON desde o dia 1

**Decisão:** Logger usa `pino` em formato JSON em todo lugar. `execution-log.json` é construído a partir do stream de logs filtrado pela `execution_id`.

**Justificativa:** Sprint 2 (Worker + Fila) e Sprint 3 (SaaS) vão precisar de logs estruturados. Começar texto-livre agora seria dívida.

**Implicação:** Em dev local, `pino-pretty` transforma em saída legível. Sem custo cognitivo extra.

### ADR-012 — Sem framework de DI

**Decisão:** Wiring de dependências é manual em `src/cli/index.ts` (Gate 0) e nos pontos de entrada futuros (Worker).

**Justificativa:** Engine tem ~10 classes principais. NestJS/tsyringe/InversifyJS seriam overengineering. Construtor recebe dependências, ponto.

**Implicação:** Wiring fica explícito e auditável. Custo: 1 função de wiring por ambiente.

---

## 9. Checklist de conclusão da arquitetura

- [x] Stack TS detalhada (Node 20 LTS, TS 5.4+ strict, ESM, npm)
- [x] Dependências runtime mínimas justificadas (6 pacotes)
- [x] Dependências dev definidas (TS, tsx, vitest, eslint, prettier)
- [x] Scripts npm cobrindo `execute` do Gate 0 e `gate0` validador
- [x] Estrutura de pastas real do `BKPilot-SkillRunner` desenhada (com `docs/maia/` próprio — ADR-003)
- [x] Arquitetura em 4 camadas (Core → Runtime → Adapters → CLI)
- [x] Inversão de dependência via interfaces + wiring manual (ADR-012)
- [x] Estratégia de build (tsx dev / tsc build) + pirâmide de testes (unit + integration + gate0)
- [x] CI desenhada (lint, typecheck, unit, integration, gate0)
- [x] Estratégia de conversão das 13 skills documentada (manual no Gate 0, script semi-auto na Sprint 1)
- [x] Ordem de conversão priorizada (cobre 4 tipos de skill cedo)
- [x] Posicionamento sobre BKPilot-Core (não acoplar, só inspirar)
- [x] 5 novas ADRs (008-012) registradas e justificadas
- [x] Sem violação de ADR 001-007
- [x] Sem violação das restrições críticas do HANDOFF seção 8
- [ ] **Pendente próxima skill (05-maia-harness):** materializar a estrutura no FS (criar repo)
- [ ] **Pendente próxima skill (03-maia-planejamento):** quebrar a Pré-Sprint Técnica em tarefas de 1-2 dias cada

---

## 10. Riscos novos identificados nesta skill

| # | Risco | Gravidade | Mitigação |
|---|---|---|---|
| A1 | Conversão manual da `usabilidade` no Gate 0 pode revelar campo faltante no schema da especificação | MÉDIA | Schema é extensível (E4 já registrado). Reabrir `02-maia-especificacao` se for o caso, registrar como `02-revisao-1.md`. |
| A2 | Playwright direto exige `npx playwright install` no CI — pode adicionar 60-90s ao job | BAIXA | Cache de browser no CI (actions/cache). Aceitar custo. |
| A3 | `MockLLMClient` no Gate 0 pode passar todos os critérios mensuráveis (G0-1..G0-10) sem provar que LLM real funciona | MÉDIA | Rodar Gate 0 duas vezes: 1ª com mock (CI / determinístico), 2ª com `CursorLLMClient` real (manual, dia da entrega). Critério de paridade da especificação seção 9 só se aplica à 2ª. |
| A4 | Engine como biblioteca + CLI dobra trabalho de tipos exportados (`src/index.ts` precisa expor todas APIs públicas) | BAIXA | Aceitar — é trabalho necessário para Sprint 2. |
| A5 | Wiring manual em vez de DI pode ficar verboso quando aparecerem 15+ classes | BAIXA | Reavaliar na Sprint 3 se a queixa for real. Migrar para `tsyringe` é refactor mecânico. |

Riscos da especificação (E1-E5) e do diagnóstico (R1-R9) continuam válidos e não foram resolvidos por esta skill — são problemas para skills posteriores.

---

## 11. Decisão final

```text
APROVADO
```

**Justificativa:** A arquitetura proposta satisfaz integralmente os schemas, capacidades e critérios do Gate 0 definidos na especificação aprovada. Respeita as ADRs 001-007 sem exceção e adiciona 5 ADRs novas (008-012) que aprofundam decisões técnicas sem reabrir as anteriores. A estrutura de pastas e a estratégia de testes permitem que a próxima skill (`05-maia-harness`) materialize o repo de forma direta, e que `06-maia-implementacao` codifique sem ambiguidade. Não há bloqueador.

---

## 12. Próxima skill recomendada

**`05-maia-harness`** — materializar o repo `BKPilot-SkillRunner` no filesystem (`C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\`), com:
- estrutura de pastas da seção 3 desta arquitetura;
- `package.json` com dependências da seção 2;
- `tsconfig.json` strict + `tsconfig.build.json`;
- `.gitignore`, `.nvmrc`, `.env.example`, `.eslintrc.cjs`, `.prettierrc`;
- `README.md`, `AGENTS.md`, `HANDOFF.md` próprios;
- `docs/maia/README.md` apontando para o skill pack no Producao;
- CI mínima (`ci.yml`) com os 4 jobs (lint, typecheck, unit, integration).

**Antes de `05-maia-harness`** o owner precisa decidir a pendência humana do HANDOFF seção 6.2: **criar o repo no GitHub primeiro ou local primeiro?** Sugestão do Guardião: **local primeiro**, commit inicial, depois `git remote add origin` + push para um repo privado em `JorgeBK923/BKPilot-SkillRunner` (mesma org do Core). Permite iteração rápida sem fricção de GitHub.

Depois da `05-maia-harness`:
- `03-maia-planejamento` → quebrar Pré-Sprint Técnica em tarefas;
- `06-maia-implementacao` → codar até Gate 0 (Codex CLI + GPT-5.3 Codex conforme ADR-004);
- `12-maia-code-validator` + `07-maia-qa-validacao` → validar Gate 0;
- `08-maia-review` → review final;
- `10-maia-memoria` → encerrar Pré-Sprint Técnica e abrir Sprint 1.

---

## 13. Atualização recomendada para o `HANDOFF.md`

Aplicar **todas** as mudanças abaixo no `HANDOFF.md`:

- Linha 8 — Status: **APROVADO — pronto para `05-maia-harness`** (no lugar de "APROVADO — pronto para `04-maia-arquitetura`")
- Linha 9 — Última skill executada: **`04-maia-arquitetura` (relatório em `docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md`)**
- Linha 10 — Próxima skill recomendada: **`05-maia-harness`**
- Seção 4 — Atualizar título e conteúdo: "Próxima ação — `05-maia-harness`" com objetivo de criar o repo BKPilot-SkillRunner conforme estrutura da seção 3 desta arquitetura. CLI recomendado: **Cursor + Composer 2.5** (ADR-004, skill de harness).
- Nova subseção 4.2 — Resultado da `04-maia-arquitetura` (concluída): copiar resumo desta skill (decisão APROVADO, 5 ADRs novas 008-012, 5 novos riscos A1-A5, stack + estrutura + estratégia de conversão definidas, artefato em `docs/maia/04-arquitetura/`).
- Seção 5 — Adicionar linha de tabela: `docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md` | Arquitetura completa do Engine (stack TS, estrutura, conversão de skills) |
- Seção 6 — Pendência humana 2 (modo de criação do repo) precisa ser respondida **antes** da próxima skill. Marcar como bloqueante para `05-maia-harness` (não para esta `04`).
- Seção 7 — Adicionar riscos A1 a A5 (3 MÉDIA, 2 BAIXA) à tabela.
- Seção 10 — Marcar como concluído: `Executar 04-maia-arquitetura`. Próximo: `Executar 05-maia-harness`.
- Seção 11 — Substituir comando de chamada para a próxima skill (`05-maia-harness`) com referências às novas entradas obrigatórias.

---

## 14. Saída literal MAIA

```text
Skill:              04-maia-arquitetura (Skill Runner Engine)
Decisão final:      APROVADO
Próxima skill:      05-maia-harness
Bloqueadores:       Nenhum para esta skill
Pendência humana:   modo de criação do repo (bloqueia a próxima skill, não esta)
Riscos novos:       A1-A5 (3 MÉDIA, 2 BAIXA)
ADRs novas:         008, 009, 010, 011, 012
ADRs respeitadas:   001-007 (sem violação)
Stack:              Node 20 LTS + TS 5.4 strict ESM + Playwright + zod + vitest
Camadas:            core / runtime / tools+llm / cli (4 camadas)
Estrutura:          BKPilot-SkillRunner/ desenhada (seção 3)
Conversão skills:   13 web → manifest+prompt+template; usabilidade manual no Gate 0
Artefato:           docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md
```

---

**Fim da arquitetura.**
