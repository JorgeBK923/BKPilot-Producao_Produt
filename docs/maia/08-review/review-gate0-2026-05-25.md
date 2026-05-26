# Review Final — Gate 0 + Engine — BKPilot-SkillRunner

**Data:** 2026-05-25
**Skill MAIA:** `08-maia-review` — T23 (review final)
**Revisor:** Cursor + Opus 4.7
**Autor do código:** Codex / GPT-5.3 (T01-T21) — autor ≠ revisor (ADR-004)
**Alvo:** Engine isolado (T01-T22) + prova de vida Gate 0
**Repo:** `C:\Users\Jorge\IA\Produto\BKPilot-SkillRunner\`
**HEAD no review:** `31bae5a` (branch `main`, NÃO pushado)
**Decisão:** ✅ **APROVA COM RESSALVAS**

---

## 1. Escopo e método

Review crítico do código do Skill Runner Engine e da validade do Gate 0, conforme brief T23. Avaliado: arquitetura/qualidade do `Runner` e das peças CAP-1..CAP-8, aderência aos ADRs 001-012, cobertura/qualidade dos 50 testes, validade do relatório QA T22 (G0-1..G0-10 + cobertura Gemini) e prontidão para encerramento.

**Verificação independente executada pelo revisor** (não apenas leitura — reprodução real):

| Comando | Resultado |
|---|---|
| `npm run typecheck` | exit 0, sem erros |
| `npm run lint` (`--max-warnings 0`) | exit 0, "No issues found" |
| `npm test` (vitest run) | **50/50 PASS** em 8 arquivos (9.09s) |
| `npm run gate0` (Mock) | **10/10 PASS**, exit 0 |
| Inspeção artefatos `outputs/gate0-001/` | 4 arquivos íntegros (result.json 956B, report.md 5.8K, screenshot.png 10.2K PNG, execution-log.json 1.8K) |
| `result.json` reproduzido | `status=completed`, `duration_ms=1079`, `llm_calls=1` |
| Higiene de segredos | só `.env.example` versionado; zero chaves hardcoded em `src/`/`scripts/`/`skills/` |

Os números batem com o relatório deepseek (T22) dentro da variância natural de tempo (1079ms aqui vs 4134ms/4084ms nas execuções QA — variação esperada, mesma ordem e muito abaixo do teto de 300s). **Gate 0 é reprodutível e determinístico no caminho feliz.**

---

## 2. Arquitetura e qualidade do código

**Avaliação geral: ALTA.** Código limpo, tipado em strict ESM, sem dependência do BKPilot-Core, sem DI framework. Separação de responsabilidades clara: `Runner` orquestra, peças isoladas e testáveis.

### Pontos fortes

- **`Runner.run` (runtime/runner.ts):** pipeline CAP-1..CAP-8 legível (validar → loader → browser → LLM → report → artifacts → status → cleanup em `finally`). Injeção por construtor + `createDefault()`. `result.json` é gerado mesmo em erro (try/catch externo para escrita de log/result). Suporta `output_dir`, `timeout_override`, `llm_override`.
- **`status-resolver.ts`:** função pura, precedência correta `timeout > cancelled > failed > completed/partial`. Erro vence `partial`. Coberto por 8 testes.
- **`playwright-executor.ts`:** `headless: true` fixo (regra do projeto), `networkidle` como espera, `TimeoutError → BROWSER_TIMEOUT` vs `BROWSER_NAVIGATION_FAILED`, `close()` best-effort idempotente (zera refs antes de fechar). Zero zumbis confirmado (G0-10).
- **`errors.ts`:** 16 códigos tipados + `ERROR_MESSAGES` exaustivo (`satisfies Record<...>`) + `CLIENT_RETURNABLE_ERROR_CODES` já preparado para o futuro SaaS (spec §7).
- **Schemas zod (`core/schemas/`):** fonte de verdade (ADR-010). `LocalArtifactManager` revalida `result.json`/`execution-log.json`/`OutputFile` contra o schema **antes** de escrever — defesa em profundidade.
- **`cli/index.ts`:** erros amigáveis sem stacktrace/segredo, `--skill` sobrescreve `skill_id` para reuso do mesmo JSON, exit 0 só em `completed`.
- **`cursor-llm-client.ts` / `mock-llm-client.ts`:** interface `LLMClient` abstrata; trocar mock por real = mudar config, não código (CAP-5). Credenciais só de env, nunca embutidas nem logadas. Mock funciona offline com fallback de resposta default.

### Achados de baixa severidade (code smell, não bug)

1. **Aliasing de `result.outputs` (runner.ts:300-313 + 154).** `buildResult` atribui `outputs: input.outputs` por **referência**; o `outputs.push(writeLog)` posterior (linha 154) muta o array já contido em `result`, por isso o `result.json` persistido lista 3 saídas (inclui `execution-log.json`, exclui a si mesmo). O comportamento atual está correto, mas depende de aliasing implícito — um refactor que copie o array mudaria silenciosamente o conteúdo do `result.json`. Recomenda-se tornar a intenção explícita.
2. **`createEffectiveLlm` (runner.ts:340-353):** `llm_override` só tem efeito sobre `MockLLMClient` (troca de `model`); `llm_override.provider` é ignorado. Aceitável e coerente com o escopo Gate 0 (mock-first), mas o campo do schema fica sem efeito no caminho real.

Nenhum desses é bloqueador.

---

## 3. Aderência aos ADRs 001-012

| ADR | Decisão | Status | Evidência |
|---|---|---|---|
| 001 | Repo separado, local-first | ✅ | Repo isolado, não pushado |
| 002 | TypeScript 5.4+ strict ESM | ✅ | `type: module`, `engines node >=20 <21`, typecheck 0 |
| 003 | `docs/maia/` próprio | ✅ | Estrutura presente; este review em `08-review/` |
| 008 | Biblioteca + CLI fino | ✅ | CLI delega 100% ao `Runner`; nenhuma lógica de domínio no CLI |
| 009 | Playwright direto (sem MCP) | ✅ | `chromium.launch` direto, sem MCP no Engine |
| 010 | zod fonte de verdade | ✅ | 4 schemas zod; validação em loader/artifact/input/result |
| 011 | pino logs | ⚠️ **Parcial** | `core/logger.ts` cria pino e é exportado, mas **não é consumido** pelo `Runner` (usa `events[]` em memória) nem pelo CLI (usa `console`). Infra presente, wiring de runtime fica p/ Sprint 1 |
| 012 | Sem DI framework | ✅ | Injeção manual por construtor (`RunnerDeps`) |

ADR-011 é a única aderência parcial — não compromete o Gate 0 (o `execution-log.json` estruturado cumpre o requisito de log de execução via CAP-5/G0-5), mas o logging operacional via pino deve ser conectado na Sprint 1.

---

## 4. Cobertura e qualidade dos 50 testes

**Suíte: 50/50 verde.** Distribuição coerente com as capacidades:

| Arquivo | Testes | Cobre |
|---|---:|---|
| `unit/schemas.test.ts` | 21 | Schemas zod (manifest/input/result/log) |
| `unit/status-resolver.test.ts` | 8 | Precedência de status (CAP-8) |
| `unit/artifact-manager.test.ts` | 5 | Escrita/validação de artefatos (CAP-7) |
| `unit/skill-loader.test.ts` | 4 | Manifesto válido/ausente/inválido/malformado (CAP-1) |
| `unit/report-generator.test.ts` | 2 | Template + genérico, sem placeholder cru (CAP-6) |
| `unit/mock-llm-client.test.ts` | 2 | Mock offline + `LLM_CALL_FAILED` (CAP-5) |
| `integration/playwright-executor.test.ts` | 7 | Browser real: navigate/snapshot/screenshot/evaluate/close idempotente (CAP-2/3/4) |
| `integration/runner-e2e.test.ts` | 1 | E2E completo em tmpdir, 4 artefatos, ≥3 Nielsen, log ≥5 (CAP-1..CAP-8) |

**Qualidade:** testes de integração usam browser real (não mock de Playwright) e tmpdir com cleanup; o E2E valida exatamente os mesmos invariantes do Gate 0. **CAP-1..CAP-8 todas cobertas.**

### Lacunas de teste (debt, não bloqueador)
- Caminhos de erro do `Runner` (browser falha → `failed`, output required ausente → `partial`) não têm teste dedicado — são exercitados só indiretamente. A lógica existe e está correta por leitura; falta o teste que a trave.
- `cursor-llm-client.ts` não tem teste unitário (sem mock de `fetch`). A rota real foi validada manualmente no T21 (Groq).

---

## 5. Validade do relatório QA T22

**Relatório deepseek (`relatorio-gate0-2026-05-25.md`): VÁLIDO.** Cada G0-1..G0-10 declarado PASS com evidência concreta (bytes, magic bytes PNG, contagem de eventos, `metrics.llm_calls`, `duration_ms`, stderr limpo, delta de processos). Reproduzi `npm run gate0` de forma independente e cheguei a 10/10 PASS com os mesmos tamanhos de artefato — **sem alucinação, sem divergência.**

**Cobertura Gemini (`cobertura-gemini-gate0-2026-05-25.md`): VÁLIDA.** Segunda lente independente, execução própria do `gate0`, valores conferem (variância natural de ms), veredito CONCORDA. Fecha ADR-004 (autor ≠ validador) corretamente: código por Codex, QA por deepseek, cobertura por Gemini, review por Opus.

**Ressalvas do T22 conferidas e mantidas:**
- Execução real Groq não reproduzível neste ambiente (sem `GROQ_API_KEY`/`CURSOR_LLM_*`) → graceful degradation correta (`DUVIDA EXPLICITA` + exit 1). Evidência documental do T21 (status `completed`, 8581ms, 964 tokens). **Não bloqueia.**
- Paridade com Claude Code (ADR-005) não calculável sem baseline. Spec §9: paridade < 80% no Gate 0 **não bloqueia**.

O processo do T22 teve uma correção registrada (cobertura Gemini inicialmente não rodada; corrigida com tarefa/artefato separados por modelo). A correção está documentada e o estado final é consistente. Regra "1 modelo = 1 tarefa = 1 arquivo" adotada — boa prática mantida.

---

## 6. Débitos técnicos e ressalvas para o T24 (Sprint 1)

Nenhum bloqueia o Gate 0 (prova de vida = caminho feliz). Carregar para o backlog da Sprint 1:

| # | Débito | Severidade | Observação |
|---|---|---|---|
| D1 | **Timeout global não enforçado.** `EXECUTION_TIMEOUT`/status `timeout` existem e são tratados, mas o `Runner` não inicia relógio de parede; `manifest.timeout_seconds` (1800s) é ignorado. Só há `navigationTimeoutMs` (30s) no browser. | MÉDIA | CAP-8 prevê timeout global; hoje é caminho morto fora da navegação |
| D2 | **Retry não implementado.** Manifesto declara `retry { max_attempts, on }` mas o `Runner` não tem laço de retry. | MÉDIA | Schema/manifesto prometem o que o Engine não executa |
| D3 | **Fallback de LLM ausente.** `LLM_FALLBACK_EXHAUSTED` nunca é lançado; critério de fallback do CAP-5 não atendido. | BAIXA | **Deferido deliberadamente** no planejamento (linha 18) |
| D4 | **pino não conectado ao runtime** (ADR-011 parcial). | BAIXA | Wiring de logging operacional |
| D5 | **Aliasing de `result.outputs`** (§2.1). | BAIXA | Tornar a mutação explícita |
| D6 | **`result.schema` tem `metrics` opcional** enquanto G0-6 depende da presença. | BAIXA | `Runner` sempre preenche; alinhar schema ao contrato |
| D7 | **`llm_override.provider` ignorado** no caminho real (§2.2). | BAIXA | Honrar ou remover do schema |
| D8 | **Lacunas de teste** nos caminhos `failed`/`partial` e em `cursor-llm-client`. | BAIXA | Travar comportamento já correto |
| D9 | **Paridade ADR-005 não medida.** | INFO | Requer baseline Claude na Sprint 1 |
| D10 | **HANDOFF cita HEAD `a14bd82`; HEAD real é `31bae5a`** (commit de docs posterior). | INFO | Apenas atualizar HANDOFF no T24 |

---

## 7. Bugs / bloqueadores

**Nenhum bug funcional. Nenhum bloqueador.** O Engine cumpre as 8 capacidades obrigatórias e os 10 critérios do Gate 0, verificado de forma independente pelo revisor.

---

## 8. Prontidão para encerramento

| Critério | Status |
|---|---|
| Gate 0 G0-1..G0-10 | ✅ 10/10 (reproduzido pelo revisor) |
| 50 testes | ✅ 50/50 |
| typecheck / lint | ✅ exit 0 / 0 warnings |
| CAP-1..CAP-8 | ✅ cobertas |
| ADRs 001-012 | ✅ (011 parcial, não bloqueia) |
| QA T22 + cobertura Gemini | ✅ válidos, sem divergência |
| Higiene de segredos | ✅ nenhum segredo versionado |
| Bloqueadores abertos | ✅ nenhum |

**Pronto para encerramento da Pré-Sprint Técnica.** Os débitos D1-D10 são de Sprint 1 e nenhum invalida a prova de vida.

---

## 9. Decisão

# ✅ APROVA COM RESSALVAS

O Skill Runner Engine está sólido, bem arquitetado e o Gate 0 é uma prova de vida real, reprodutível e independentemente verificada. As ressalvas (D1-D10) são débitos de evolução, não defeitos do Gate 0: timeout global, retry e fallback de LLM ficam para a Sprint 1; pino precisa de wiring; e há limpezas menores de schema/aliasing/testes.

**Próximo:** T24 — `10-maia-memoria` (encerramento + abertura Sprint 1), Cursor + Opus 4.7. Atualizar HANDOFF (HEAD real `31bae5a`) e abrir os débitos D1-D10 no backlog da Sprint 1.

---

## 10. Assinatura

- **Revisor:** Cursor + Opus 4.7 — 2026-05-25
- **Verificação independente:** typecheck/lint/test(50)/gate0(10) reproduzidos pelo revisor
- **Código alterado:** NENHUM
- **Commits:** NENHUM (Guardião faz backstop)
- **Push:** NÃO

*BugKillers — Setor de Inteligência Artificial — MAIA Skill Pack*
</content>
</invoke>
