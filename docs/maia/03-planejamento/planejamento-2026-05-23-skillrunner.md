# Planejamento MAIA - Pre-Sprint Tecnica Skill Runner

**Data:** 2026-05-23  
**Skill:** `03-maia-planejamento`  
**Executor:** Guardiao MAIA (Cursor + GPT-5.5, conforme ADR-004)  
**Projeto hub:** `BKPilot-Producao_Produt`  
**Projeto alvo:** `BKPilot-SkillRunner`  
**Escopo:** do harness concluido ate Gate 0 aprovado com `usabilidade` E2E local.

---

## 1. Resumo executivo

Plano aprovado para executar a Pre-Sprint Tecnica em 24 tarefas pequenas (0.5 a 1 dia), com implementacao e validacao separadas. O escopo termina no Gate 0: `usabilidade` convertida manualmente, `npm run execute -- --skill usabilidade --input inputs/execution-local.json` rodando localmente, `scripts/gate0-validate.ts` validando G0-1..G0-10, primeira execucao com `MockLLMClient` e segunda passada com `CursorLLMClient` real para paridade >= 80%.

Todas as 8 CAPs e os 10 criterios G0 possuem tarefa correspondente. Nao entram Sprint 1, Worker, SaaS, billing, auth do SUT, i18n, conversao das demais 12 skills, DI framework, MCP no Engine ou acoplamento ao BKPilot-Core.

Decisao final: **APROVADO COM RESSALVAS**. A ressalva e prazo: a soma bruta das tarefas e maior que 7 dias e o caminho critico realista fica em 8.5 dias uteis porque QA, review e memoria sao tarefas finais separadas. Para caber no teto R1, reduzir escopo adiando fallback avancado de LLM e mantendo a segunda passada real como evidencia manual, sem remover G0-1..G0-10.

---

## 2. Estado de entrada

### Existe

- Repo local `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\`, sem remote.
- Harness concluido: estrutura de pastas, configs TypeScript/ESLint/Prettier, CI 4 jobs, `.nvmrc`, `package.json`, `README.md`, `AGENTS.md`, `HANDOFF.md`.
- Smoke test da harness com exit 0: `npm install`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Stubs: `src/index.ts` e `src/cli/index.ts`.
- Pastas vazias: `src/core`, `src/runtime`, `src/tools`, `src/llm`, `inputs`, `scripts`, `skills/usabilidade`, `tests`.

### Falta

- Schemas zod do manifesto, input, result e execution-log.
- 16 codigos de erro.
- Skill loader com validacao YAML.
- Artifact manager, logger, status resolver.
- Playwright executor.
- LLM interface, `MockLLMClient` e `CursorLLMClient`.
- Report generator.
- Runner runtime e CLI `execute`.
- Conversao manual da skill `usabilidade`.
- `inputs/execution-local.json`.
- `scripts/gate0-validate.ts`.
- Testes unitarios/integracao e validacao final Gate 0.

---

## 3. Backlog completo T01..T24

| ID | Titulo | Desc. operacional | Est. | Dep. | Arquivos no `BKPilot-SkillRunner` | CAPs | Done testavel | Skill dona | CLI/LLM |
|---|---|---|---:|---|---|---|---|---|---|
| T01 | Schemas, erros e logger core | Criar schemas zod para `manifest.yaml`, `execution-input.json`, `result.json`, `execution-log.json`; derivar tipos com `z.infer`; registrar 16 codigos de erro; criar wrapper pino core sem I/O de dominio. | 1 | - | `src/core/schemas/manifest.schema.ts`, `src/core/schemas/execution-input.schema.ts`, `src/core/schemas/result.schema.ts`, `src/core/schemas/execution-log.schema.ts`, `src/core/types.ts`, `src/core/errors.ts`, `src/core/logger.ts` | CAP-1, CAP-7, CAP-8 | `npm run typecheck` passa; schemas exportados; nenhum `interface SkillManifest` manual. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T02 | Validar schemas core | Criar testes unitarios dos schemas e codigos de erro, cobrindo manifesto valido/invalido, input valido/invalido, result/log validos. | 0.5 | T01 | `tests/unit/schemas.test.ts` | CAP-1, CAP-7, CAP-8 | `npm run test -- --run tests/unit/schemas.test.ts` passa e cita CAP-1/CAP-7/CAP-8. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T03 | Skill loader YAML | Implementar `FileSystemSkillLoader` que le `skills/<id>/manifest.yaml`, parseia YAML e valida com zod. Retorna erros `MANIFEST_NOT_FOUND` e `MANIFEST_INVALID`. | 0.5 | T01 | `src/runtime/skill-loader.ts`, `tests/fixtures/manifests/*` | CAP-1 | Loader retorna objeto tipado para fixture valida e erro padronizado para fixture ausente/invalida. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T04 | Validar skill loader | Testar loader em 3 cenarios obrigatorios da CAP-1: valido, campo obrigatorio faltando, manifesto inexistente. | 0.5 | T03 | `tests/unit/skill-loader.test.ts` | CAP-1 | `npm run test -- --run tests/unit/skill-loader.test.ts` passa. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T05 | Artifact manager | Implementar `LocalArtifactManager` para criar `outputs/<execution_id>/`, escrever JSON/arquivos e calcular `size_bytes`. | 1 | T01 | `src/runtime/artifact-manager.ts` | CAP-7 | Teste manual ou unitario cria pasta temporaria e escreve `result.json`/`execution-log.json` validos. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T06 | Status resolver | Implementar resolucao de `completed`, `failed`, `timeout`, `partial` com base em erro, timeout e outputs required. | 0.5 | T01 | `src/runtime/status-resolver.ts` | CAP-8 | Resolver retorna status esperado para 4 cenarios da CAP-8. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T07 | Validar artifacts/status | Criar testes unitarios para artifact manager, execution-log/result schema e status resolver. | 0.5 | T05, T06 | `tests/unit/artifact-manager.test.ts`, `tests/unit/status-resolver.test.ts` | CAP-7, CAP-8 | `npm run test -- --run tests/unit/artifact-manager.test.ts tests/unit/status-resolver.test.ts` passa. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T08 | Browser lifecycle e navigate | Implementar `PlaywrightExecutor` para `launch`, `navigate`, timeout e `close`, com erros `BROWSER_LAUNCH_FAILED`, `BROWSER_NAVIGATION_FAILED`, `BROWSER_TIMEOUT`. | 1 | T01 | `src/tools/browser/types.ts`, `src/tools/browser/playwright-executor.ts` | CAP-2 | Integra com `https://example.com`; em URL invalida retorna erro padronizado e fecha browser. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T09 | Snapshot/evaluate/screenshot | Completar tools `snapshot`, `evaluate`, `screenshot`; snapshot retorna JSON estruturado de textos, botoes, links e campos. Screenshot full-page PNG. | 1 | T08 | `src/tools/browser/playwright-executor.ts`, `tests/fixtures/pages/usabilidade.html` | CAP-3, CAP-4 | Fixture HTML gera listas estruturadas; screenshot PNG existe com magic bytes e >0 bytes. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T10 | Validar Playwright executor | Criar testes de integracao para CAP-2/3/4, incluindo cleanup de browser em sucesso e erro. | 1 | T08, T09 | `tests/integration/playwright-executor.test.ts` | CAP-2, CAP-3, CAP-4 | `npm run test -- --run tests/integration/playwright-executor.test.ts` passa; nenhum processo Playwright zumbi apos teste. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T11 | LLM clients Gate 0 | Criar `LLMClient` interface, `MockLLMClient` com resposta fixa local e `CursorLLMClient` minimo configuravel para segunda passada manual do Gate 0. Registrar metricas. | 1 | T01 | `src/llm/llm-client.interface.ts`, `src/llm/mock-llm-client.ts`, `src/llm/cursor-llm-client.ts`, `tests/fixtures/llm-responses/usabilidade.md` | CAP-5 | Mock nao faz rede e retorna resposta com `model_used`, tokens e latencia; Cursor adapter pode ser selecionado por config sem mudar Runner. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T12 | Report generator | Gerar `report.md` combinando template da skill, snapshot, screenshot metadata e resposta LLM. Garantir secoes obrigatorias e sem placeholders crus. | 1 | T05, T11 | `src/runtime/report-generator.ts` | CAP-6 | Relatorio gerado com cabecalho, analise, conclusao, >100 caracteres e sem `<n>` literal pendente. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T13 | Validar LLM/report | Testar mock LLM, metricas, fallback minimo de erro e report generator com template. | 0.5 | T11, T12 | `tests/unit/mock-llm-client.test.ts`, `tests/unit/report-generator.test.ts` | CAP-5, CAP-6 | `npm run test -- --run tests/unit/mock-llm-client.test.ts tests/unit/report-generator.test.ts` passa. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T14 | Runner runtime | Implementar `Runner.run()` orquestrando loader, browser, LLM, report, artifacts, logs, metrics, cleanup e result final. Sem CLI. | 1 | T03, T05, T06, T09, T11, T12 | `src/runtime/runner.ts` | CAP-1..CAP-8 | Teste de integracao E2E com fixtures gera `result.json`, `execution-log.json`, `report.md`, `screenshot.png`. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T15 | CLI execute | Implementar `commander` para `execute --skill --input`, wiring manual por construtores e exit code 0/1. Manter `src/index.ts` stub sem ampliar API publica nesta tarefa. | 0.5 | T14 | `src/cli/index.ts` | CAP-8 | `npm run execute -- --skill usabilidade --input inputs/execution-local.json` chama Runner; falha controlada se input ainda nao existir. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T16 | Converter usabilidade manual | Criar `skills/usabilidade/{manifest.yaml,prompt.md,report-template.md}` a partir de `src/usabilidade.md`, adaptando paths para `outputs/<execution_id>/` e tools do Engine. | 1 | T01, T03 | `skills/usabilidade/manifest.yaml`, `skills/usabilidade/prompt.md`, `skills/usabilidade/report-template.md` | CAP-1, CAP-5, CAP-6 | `manifest.yaml` valida no loader; template contem Nielsen H1..H10 e secoes de score/quick wins/parecer tecnico. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T17 | Input local Gate 0 | Criar `inputs/execution-local.json` com `execution_id: gate0-001`, `skill_id: usabilidade`, `target_url: https://example.com`, `language: pt-BR`. | 0.5 | T01, T16 | `inputs/execution-local.json` | CAP-1 | Input valida contra schema e aponta para skill existente. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T18 | Gate0 validator | Implementar `scripts/gate0-validate.ts` para validar G0-1..G0-10, incluindo stderr capturado, magic bytes PNG, heuristicas Nielsen e checagem de processos Playwright. | 1 | T01, T05, T15, T17 | `scripts/gate0-validate.ts`, `package.json` script `gate0` se necessario | CAP-2..CAP-8 | `npm run gate0` retorna exit 1 antes da execucao e mensagens por G0; retorna exit 0 quando outputs validos existem. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T19 | Validar runner/CLI/assets/gate0 | Validacao em lote: testes E2E do Runner, CLI, manifest/input da `usabilidade`, gate0 validator e comandos `lint/typecheck/build/test`. | 1 | T14, T15, T16, T17, T18 | `tests/integration/runner-e2e.test.ts`, possivel ajuste em testes existentes | CAP-1..CAP-8 | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test` passam. | 12-maia-code-validator | Codex CLI + GPT-5.3 Codex |
| T20 | Gate 0 - MockLLM | Executar Gate 0 completo com `MockLLMClient`, capturar stdout/stderr, rodar `npm run gate0`, registrar evidencias e corrigir apenas bugs bloqueantes. | 0.5 | T19 | `outputs/gate0-001/*`, `docs/maia/06-implementacao/gate0-mock-2026-05-23.md` | CAP-1..CAP-8 | `npm run execute -- --skill usabilidade --input inputs/execution-local.json` exit 0; `npm run gate0` exit 0. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T21 | Gate 0 real - CursorLLM | Rodar segunda passada com `CursorLLMClient`, registrar saida e comparar com baseline Claude Code quando disponivel. Paridade <80% vira ressalva de prompt, nao falha de Engine se G0 passar. | 0.5 | T20 | `outputs/gate0-001-cursor/*`, `docs/maia/06-implementacao/gate0-cursor-2026-05-23.md` | CAP-1..CAP-8 | Execucao real registrada; paridade calculada ou duvida explicita se baseline Claude Code nao estiver disponivel. | 06-maia-implementacao | Codex CLI + GPT-5.3 Codex |
| T22 | QA final Gate 0 | Executar validacao final com `07-maia-qa-validacao`, cobrindo G0-1..G0-10, outputs, logs, stderr e processo Playwright. | 0.5 | T21 | `docs/maia/07-qa-validacao/relatorio-gate0-2026-05-23.md` | CAP-1..CAP-8 | Relatorio QA declara cada G0 como pass/fail com evidencia; nenhum bloqueador aberto para review. | 07-maia-qa-validacao | Codex CLI + Antigravity CLI |
| T23 | Review final Gate 0 | Executar `08-maia-review` apos QA, priorizando regressao arquitetural, aderencia ADR-001..012 e riscos residuais. | 0.5 | T22 | `docs/maia/08-review/review-gate0-2026-05-23.md` | CAP-1..CAP-8 | Review registra APROVADO/APROVADO COM RESSALVAS/BLOQUEADO; se bloqueado, lista achados com arquivo/linha. | 08-maia-review | Cursor + Opus 4.7 |
| T24 | Memoria e abertura Sprint 1 | Executar `10-maia-memoria` para encerrar a Pre-Sprint Tecnica, atualizar handoffs e abrir proxima etapa sem incluir escopo Sprint 1 no Gate 0. | 0.5 | T23 | `docs/maia/10-memoria/memoria-gate0-2026-05-23.md`, `HANDOFF.md` dos dois repos | CAP-1..CAP-8 | Memoria escrita; HANDOFFs apontam proxima skill de Sprint 1; Gate 0 nao fica com pendencia sem dono. | 10-maia-memoria | Cursor + Opus 4.7 |

---

## 4. Grafo de dependencias + caminho critico

### Ordem topologica e paralelismo

```text
Dia 1:
  T01

Dia 2:
  T02, T03, T05, T06, T08, T11

Dia 3:
  T04, T07, T09, T12, T16

Dia 4:
  T10, T13, T17

Dia 5:
  T14

Dia 6:
  T15, T18

Dia 7:
  T19 -> T20

Dia 8-9:
  T21 -> T22 -> T23 -> T24
```

### Dependencias principais

```text
T01 -> T03 -> T04
T01 -> T05 -> T07
T01 -> T06 -> T07
T01 -> T08 -> T09 -> T10
T01 -> T11 -> T12 -> T13
T01 -> T03 -> T16 -> T17
T03,T05,T06,T09,T11,T12 -> T14 -> T15
T01,T05,T15,T17 -> T18
T14,T15,T16,T17,T18 -> T19 -> T20 -> T21 -> T22 -> T23 -> T24
```

### Caminho critico

Sequencia mais longa, considerando paralelismo planejado:

```text
T01 -> T08 -> T09 -> T10 -> T14 -> T15/T18 -> T19 -> T20 -> T21 -> T22 -> T23 -> T24
```

Duração minima realista: **8.5 dias uteis** com execucao paralela por trilhas, porque QA, review e memoria sao finais e sequenciais. Para buscar 7 dias uteis, executar validacao de codigo em lotes menores durante T14-T18 e tratar T21 como evidencia manual curta, sem expandir prompt/paridade.

---

## 5. Estimativa total + sanity check vs R1

- Soma bruta das tarefas: **17.5 dias uteis**.
- Caminho critico com paralelismo: **8.5 dias uteis**.
- Folga operacional recomendada: **0.5 a 1 dia** para bugs de Playwright/Node local.
- Sanity check R1: **excede o teto sugerido de 5-7 dias**. Risco P1 fica ALTA. O plano continua valido porque respeita a regra de QA/review/memoria separados, mas deve acionar reducao de escopo se no dia 5 o Runner E2E ainda nao estiver pronto.

Reducao de escopo permitida para tentar voltar a 7 dias:

- Postergar fallback avancado de LLM; manter apenas erro padronizado e mock.
- Manter `CursorLLMClient` apenas para segunda passada manual, sem endurecer como adapter produtivo.
- Reduzir fixture HTML a uma pagina estatica unica, sem suite ampla.
- Nao ampliar relatorio alem das secoes necessarias para G0-3/G0-8/paridade.

Nao e permitido cortar `usabilidade`, `inputs/execution-local.json`, `scripts/gate0-validate.ts`, G0-1..G0-10 ou CAP-1..CAP-8.

---

## 6. Mapeamento Tarefa -> CAP -> G0-N

| Tarefa | CAPs cobertas | G0 cobertos |
|---|---|---|
| T01 | CAP-1, CAP-7, CAP-8 | G0-2, G0-5 |
| T02 | CAP-1, CAP-7, CAP-8 | G0-2, G0-5 |
| T03 | CAP-1 | G0-1, G0-2 |
| T04 | CAP-1 | G0-1, G0-2 |
| T05 | CAP-7 | G0-2, G0-5 |
| T06 | CAP-8 | G0-1, G0-2, G0-7 |
| T07 | CAP-7, CAP-8 | G0-2, G0-5, G0-7 |
| T08 | CAP-2 | G0-1, G0-7, G0-9, G0-10 |
| T09 | CAP-3, CAP-4 | G0-4, G0-8 |
| T10 | CAP-2, CAP-3, CAP-4 | G0-4, G0-9, G0-10 |
| T11 | CAP-5 | G0-6 |
| T12 | CAP-6 | G0-3, G0-8 |
| T13 | CAP-5, CAP-6 | G0-3, G0-6, G0-8 |
| T14 | CAP-1..CAP-8 | G0-1..G0-8 |
| T15 | CAP-8 | G0-1, G0-9 |
| T16 | CAP-1, CAP-5, CAP-6 | G0-3, G0-6, G0-8 |
| T17 | CAP-1 | G0-1, G0-2 |
| T18 | CAP-2..CAP-8 | G0-1..G0-10 |
| T19 | CAP-1..CAP-8 | G0-1..G0-10 |
| T20 | CAP-1..CAP-8 | G0-1..G0-10 |
| T21 | CAP-1..CAP-8 | G0-1..G0-10 e paridade >=80% quando baseline existir |
| T22 | CAP-1..CAP-8 | G0-1..G0-10 |
| T23 | CAP-1..CAP-8 | G0-1..G0-10 |
| T24 | CAP-1..CAP-8 | G0-1..G0-10 |

Cobertura por criterio:

| G0 | Criterio | Tarefas principais |
|---|---|---|
| G0-1 | Comando executa sem crash | T14, T15, T20 |
| G0-2 | `result.json` completed | T05, T06, T14, T20 |
| G0-3 | `report.md` > 500 caracteres | T12, T16, T20 |
| G0-4 | `screenshot.png` PNG valido | T09, T10, T20 |
| G0-5 | `execution-log.json` >= 5 eventos | T05, T14, T20 |
| G0-6 | `metrics.llm_calls >= 1` ou mock registrado | T11, T13, T20 |
| G0-7 | `duration_ms < 300000` | T06, T14, T20 |
| G0-8 | Relatorio cita >=3 heuristicas Nielsen | T12, T16, T20 |
| G0-9 | Sem erro nao tratado no stderr | T15, T18, T20 |
| G0-10 | Browser fecha sem processo zumbi | T08, T10, T18, T20 |

Nenhum CAP ou G0 ficou sem tarefa correspondente.

---

## 7. Definition of Ready / Done

### Definition of Ready

- Tarefa tem ID, titulo, estimativa <= 2 dias, dependencias explicitas e arquivos alvo.
- Tarefa respeita camadas: core, runtime, tools+llm, cli, assets, script ou validacao.
- CAP/G0 impactados estao declarados.
- Criterio de done e verificavel por comando, teste ou arquivo.
- ADRs 001-012 foram checadas.
- Nenhuma credencial real ou `.env` e requerida.

### Definition of Done

- Arquivos prometidos existem ou foram modificados conforme plano.
- Comandos de validacao da tarefa passam ou falha documentada com erro exato.
- Testes citam CAPs relevantes quando aplicavel.
- `npm run typecheck` nao regride apos tarefa de implementacao.
- Erros usam codigos padronizados da especificacao.
- Artifacts gerados ficam em `outputs/<execution_id>/` no repo SkillRunner.
- Handoff/relatorio atualizado quando a tarefa for gate, QA, review ou memoria.

---

## 8. Riscos novos

| Tag | Gravidade | Risco | Mitigacao |
|---|---|---|---|
| P1 | ALTA | Plano excede o teto R1 de 7 dias mesmo com paralelismo (8.5 dias) e uma execucao sequencial pode levar ~17.5 dias brutos. | Executar por trilhas independentes; validar em lotes; se passar do dia 5 sem Runner E2E, cortar fallback LLM avancado e fixtures extras. |
| P2 | MEDIA | `CursorLLMClient` real pode nao ter interface programatica estavel no ambiente local. | Tratar segunda passada como execucao manual controlada; manter `MockLLMClient` como criterio deterministico de G0; registrar bloqueio sem mudar ADR-007. |
| P3 | MEDIA | `usabilidade.md` atual usa artefatos `clients/<id>/resultado`, video e logs de console/rede que nao existem no formato do Engine Gate 0. | Converter manualmente apenas o nucleo necessario ao Gate 0: Nielsen H1..H10, snapshot, screenshot, report, logs/result em `outputs/<execution_id>/`. |
| P4 | BAIXA | Checagem G0-10 de processos zumbi pode variar entre Windows local e CI Linux. | Implementar checagem tolerante por processo Playwright iniciado pela execucao; documentar diferenca local/CI no validator. |
| P5 | MEDIA | Node local 26 gera `EBADENGINE`; comportamento de Playwright pode diferir do Node 20 alvo. | Usar Node 20 via `.nvmrc` para Gate 0 final; CI ja pinado Node 20. |

---

## 9. Checklist de saida

- [x] Todas as 8 CAPs cobertas por pelo menos 1 tarefa
- [x] Todos os 10 G0-N cobertos
- [x] Nenhuma tarefa com estimativa >2 dias
- [x] Caminho critico > 7 dias uteis justificado (8.5 dias; reducao de escopo proposta na secao 5)
- [x] Cada tarefa tem criterio de done testavel
- [x] Dependencias formam DAG sem ciclo

---

## 10. Decisao final

```text
APROVADO COM RESSALVAS
```

Ressalvas:

- Prazo excede o teto R1: caminho critico realista de 8.5 dias por exigir QA, review e memoria separados.
- Segunda passada com `CursorLLMClient` real pode exigir adaptacao manual do ambiente Cursor; nao vira dependencia produtiva nem decisao de LLM em producao.

Nao ha bloqueador para iniciar `06-maia-implementacao`.

---

## 11. Proxima skill recomendada

**`06-maia-implementacao`**, alvo **T01 - Schemas, erros e logger core**.

Comando recomendado:

```text
Executar 06-maia-implementacao no contexto BKPilot-SkillRunner, alvo T01 do plano docs/maia/03-planejamento/planejamento-2026-05-23-skillrunner.md.

Objetivo T01: criar schemas zod de manifest, execution-input, result e execution-log; derivar tipos via z.infer; registrar os 16 codigos de erro; criar wrapper pino core; nao criar logica de runtime ainda.

CLI/LLM: Codex CLI + GPT-5.3 Codex conforme ADR-004.
```

---

## 12. Atualizacao recomendada para o HANDOFF.md

Aplicada nesta execucao:

- Origem alterada para Guardiao MAIA `03-maia-planejamento`.
- Ultima skill alterada para `03-maia-planejamento`.
- Proxima skill recomendada alterada para `06-maia-implementacao`, alvo T01.
- Adicionada secao 4.4 com resumo do planejamento.
- Adicionada linha deste relatorio na secao 5.
- Adicionados riscos P1-P5 na secao 7.
- Definition of Done marcada com `Executar 03-maia-planejamento` concluido.
- Secao 11 atualizada com comando de chamada para T01.
- Handoff do repo `BKPilot-SkillRunner` atualizado para apontar este plano.

---

## 13. Saida literal MAIA

```text
Skill:              03-maia-planejamento (Skill Runner Engine)
Decisao final:      APROVADO COM RESSALVAS
Proxima skill:      06-maia-implementacao
Alvo da proxima:    T01 - Schemas, erros e logger core
Bloqueadores:       Nenhum
Riscos novos:       P1-P5 (1 ALTA, 3 MEDIA, 1 BAIXA)
Backlog:            T01-T24
Caminho critico:    8.5 dias uteis (excede R1; reducao de escopo proposta)
CAPs cobertas:      CAP-1..CAP-8
Gate 0 coberto:     G0-1..G0-10
Artefato:           docs/maia/03-planejamento/planejamento-2026-05-23-skillrunner.md
```

---

## 14. Adendo de auditoria pre-06 (2026-05-23)

Revisao cruzada feita pelo Guardiao antes de iniciar `06-maia-implementacao`. Nao reescreve o backlog; registra ajustes de execucao a aplicar quando cada tarefa for tocada. O plano segue **APROVADO COM RESSALVAS**; nenhum CAP/G0 ficou descoberto e o DAG continua sem ciclo.

### A1. T11 deve ser quebrado em T11a + T11b (escopo/ADR-007)

- **T11a (obrigatorio):** `LLMClient` interface + `MockLLMClient` deterministico (sem rede). E o que o Gate 0 exige de verdade (CAP-5, G0-6). Wiring do Runner usa o mock por padrao (arquitetura secao 5.2 / ADR-007).
- **T11b (condicional):** `CursorLLMClient`. So implementar se houver forma programatica estavel de invocar o modelo via Cursor a partir de script Node. Caso contrario, entregar **stub que aborta com mensagem clara** e tratar a segunda passada (T21) como execucao manual controlada. Isso evita trabalho ocioso e ja esta coberto pelo risco P2.

### A2. T18 (gate0-validate.ts) pode exigir retrabalho pos-T20

O validador G0-1..G0-10 hoje e escrito (T18) **antes** da primeira execucao real (T20), logo sem nunca ter visto um `outputs/gate0-001/` real (paths, magic bytes, formato). Esperar pequeno retrabalho: rodar T20 uma vez (mesmo rudimentar) -> ajustar T18 contra evidencia real -> rodar T20 de novo. Aceitavel; registrar como retrabalho previsto, nao como falha.

### A3. T19 nao duplica T20/T22

T19 e **smoke consolidado pre-Gate 0**: criterio unico = `npm run lint && npm run typecheck && npm run build && npm run test` verdes. O "E2E do Runner" ja esta implicito em T14 e e validado de fato em T20 (mock) e T22 (QA). Nao reexecutar Gate 0 dentro de T19.

### A4. T16 (conversao usabilidade) — esclarecer dependencia de LLM

O `report-template.md` da `usabilidade` e **markdown puro** (Nielsen H1..H10, score, quick wins, parecer) e nao depende de LLM para existir. Mas validar o relatorio fim-a-fim exige ao menos uma passada com `MockLLMClient` (T11a). Converter so o nucleo Gate 0; descartar artefatos do Producao que nao existem no Engine (`clients/<id>/`, video, console/network logs) — conforme risco P3.

### A5. T22 (QA final) — estimativa otimista

0.5 dia para `07-maia-qa-validacao` com duas IAs/CLIs (Codex+GPT-5.3 / Antigravity+Gemini) validando G0-1..G0-10 de forma independente tende a virar ~1 dia real. Nao bloqueia; ajustar expectativa de prazo (reforca P1).

### A6. Cosmetico (checklist secao 9)

O item "Caminho critico > 7 dias uteis justificado" esta marcado `[x]`, mas e uma **ressalva**, nao um criterio atingido. Leitura apenas; sem impacto tecnico.

### A7. Reatribuicao de validador (emenda ADR-004, 2026-05-23)

A coluna "Skill dona / CLI-LLM" do backlog (secao 3) listava `12-maia-code-validator` e `07-maia-qa-validacao` como **Codex CLI + GPT-5.3 Codex** — o mesmo modelo que escreve o codigo no `06`. Isso viola a regra autor≠validador. Conforme emenda registrada na ADR-004 (diagnostico), passa a valer para TODAS as tarefas de validacao do Engine (T02, T04, T07, T10, T13, T19, T22):

- **12-code-validator** (T02, T04, T07, T10, T13, T19): **Antigravity CLI + Gemini 3.1 Pro**.
- **07-qa-validacao** (T22): **deepseek-v4-pro (Ollama)** executa/escreve testes + **Gemini 3.1 Pro** cobertura.
- **06-implementacao** permanece Codex/GPT-5.3. Backstop: Guardiao (Claude+Opus) roda smoke independente.

As celulas CLI/LLM da tabela da secao 3 ficam como historico; esta emenda as supersede.

---

**Fim do planejamento.**
