# Planejamento MAIA — Sprint 1 — Engine Real Reutilizável (BKPilot-SkillRunner)

**Data:** 2026-05-27
**Skill:** `03-maia-planejamento`
**Executor:** Guardião MAIA (Cursor + Opus 4.7)
**Projeto-alvo:** BKPilot-SkillRunner
**Sprint:** **Sprint 1** (Gate 1)
**Spec de referência:** `docs/maia/02-especificacao/especificacao-sprint1-2026-05-25.md` (G1-1..G1-15, CAP-9/10, ADR-013, teto 7–10 dias úteis)
**Entradas adicionais:** memória Gate 0 (D1–D10 com dono), review T23 (detalhe técnico dos débitos), planejamento Gate 0 (modelo replicado neste doc), `docs/maia-skill-pack/` (12 skills web — input do conversor)

---

## 1. Resumo

Backlog da Sprint 1 quebrado em **29 tarefas** (T01–T29), todas ≤ 1 dia, com implementação e validação separadas (ADR-004). Cobre 100% dos critérios G1-1..G1-15 + ciclo de encerramento (QA + cobertura + review + memória). **Caminho crítico estimado:** 7–8 dias úteis com paralelismo de 3 frentes (débitos de schema → conversor; débitos de Runtime; i18n). Cabe no teto de 7–10 dias úteis (decisão owner 2026-05-25). Se baseline Claude (D9) atrasar, paridade desliza p/ 2ª metade e replanejamos antes de codar T22.

---

## 2. Distribuição de papéis (ADR-004)

| Papel MAIA | Modelo |
|---|---|
| `06-maia-implementacao` | Codex / GPT-5.3 |
| `12-maia-code-validator` (testes) | Gemini 3.1 Pro |
| `07-maia-qa-validacao` (QA final) | deepseek-v4-pro **executa** + Gemini 3.1 Pro **cobertura** (passos separados — regra de 1 modelo = 1 tarefa = 1 arquivo) |
| `08-maia-review` | Cursor + Opus 4.7 |
| `10-maia-memoria` | Cursor + Opus 4.7 |
| Backstop + commits + push | Guardião / Opus |

---

## 3. Backlog Sprint 1 (T01–T29)

Formato por linha: `T0X | skill MAIA / dono | tarefa | dias | depende de | entrega | cobre`.

### Grupo A — Saneamento de schema (D5/D6) — fundação rápida
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T01** | 06 / Codex | Tornar `result.metrics` obrigatório no `resultSchema` (zod) + ajuste de `buildResult` | 0.5 | — | `src/core/schemas/result.schema.ts` + Runner refatorado | D6 / G1-10 |
| **T02** | 12 / Gemini | Testes: `resultSchema` rejeita sem `metrics`; existing tests verdes | 0.5 | T01 | `tests/unit/schemas.test.ts` (+casos) | D6 / G1-10 |
| **T03** | 06 / Codex | Eliminar aliasing de `result.outputs` (copy on read no `buildResult`) | 0.5 | — | `src/runtime/runner.ts` | D5 / G1-9 |
| **T04** | 12 / Gemini | Teste unitário: mutar retorno não altera estado interno | 0.5 | T03 | `tests/unit/runner.test.ts` | D5 / G1-9 |

### Grupo B — Conversor (CAP-9 / G1-1, G1-2)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T05** | 06 / Codex | `scripts/convert-skill.ts` core: lê `docs/maia-skill-pack/<id>.md` (frontmatter YAML + corpo), produz `skills/<id>/{manifest.yaml,prompt.md,report-template.md}`; saída determinística (chaves YAML ordenadas, fim-de-linha LF, sem timestamps) | 1.0 | T01, T03 | `scripts/convert-skill.ts` + 1 skill convertida (smoke) | CAP-9 / G1-1, G1-2 |
| **T06** | 12 / Gemini | Testes: smoke 1 skill + determinismo (sha256 igual em 2 runs) + manifesto válido no `skillManifestSchema` | 0.5 | T05 | `tests/unit/convert-skill.test.ts` | G1-1, G1-2 |

### Grupo C — Conversão das 12 skills (G1-3)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T07** | 06 / Codex | Rodar conversor nas 12 skills web restantes; ajustar conversor para frontmatter heterogêneo; **PARSE-IT-ALL ou-MORRA** (skills incompatíveis viram exceção registrada, não-bloqueante p/ as outras) | 1.0 | T05 | `skills/` com 13 diretórios; relatório `docs/maia/06-implementacao/conversao-12-skills-<data>.md` | G1-3 |
| **T08** | 12 / Gemini | Teste de integração: loader carrega as 13 skills sem erro (`skillManifestSchema` para cada) | 0.5 | T07 | `tests/integration/skill-loader-all.test.ts` | G1-3 |

### Grupo D — Débitos de Runtime (D7/D1/D2)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T09** | 06 / Codex | `llm_override.provider` respeitado: quando `--llm-override '{"provider":"mock"}'`, Runner injeta MockLLMClient mesmo com default Cursor | 0.5 | — | `src/runtime/runner.ts` + `src/cli/index.ts` | D7 / G1-11 |
| **T10** | 12 / Gemini | Teste: override flipa o client; `model_used` reflete | 0.5 | T09 | `tests/unit/runner.test.ts` | D7 / G1-11 |
| **T11** | 06 / Codex | Timeout global enforçado: `manifest.timeout_seconds` arma `AbortController`; ultrapassou → `status=timeout`, evento `timeout` no log, cleanup em finally | 1.0 | T01 | `src/runtime/runner.ts` | D1 / G1-6 |
| **T12** | 12 / Gemini | Teste integração: skill artificial com sleep > timeout produz `status=timeout`, `duration_ms ≤ timeout+200ms`, sem zumbi | 0.5 | T11 | `tests/integration/timeout.test.ts` | D1 / G1-6 |
| **T13** | 06 / Codex | Retry conforme `manifest.retry`: Runner re-tenta passo LLM em erros transientes (`LLM_CALL_FAILED` com code≠fatal), até N tentativas; conta cada call em `metrics.llm_calls` | 1.0 | T01, T09 | `src/runtime/runner.ts` + `src/llm/retry-policy.ts` | D2 / G1-7 |
| **T14** | 12 / Gemini | Teste: fake LLM falha 1x sucede 2ª → `status=completed`, `metrics.llm_calls ≥ 2` | 0.5 | T13 | `tests/unit/retry-policy.test.ts` | D2 / G1-7 |

### Grupo E — pino wiring (D4 / G1-8)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T15** | 06 / Codex | Wire pino no Runtime: Runner aceita `logger` em `RunnerDeps`; `createDefault` lê `LOG_FORMAT` (json/human); emite no stderr | 0.5 | — | `src/runtime/runner.ts` + `src/core/logger.ts` | D4 / G1-8 |
| **T16** | 12 / Gemini | Teste: `LOG_FORMAT=json` produz JSON-lines com `level/time/msg`; default produz texto | 0.5 | T15 | `tests/unit/logger.test.ts` | D4 / G1-8 |

### Grupo F — CursorLLM real default + cobertura D8 (G1-5, G1-12)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T17** | 06 / Codex | CLI: default = Cursor; Mock só com `--llm mock` ou `LLM=mock`. Erro amigável se env Cursor ausente | 0.5 | T09 | `src/cli/index.ts` | G1-5 |
| **T18** | 12 / Gemini | Bateria D8: 3 testes `cursor-llm-client` (sucesso, falha rede, JSON inválido) + 2 Runner `status=failed` + 2 Runner `status=partial`. **Meta suíte ≥ 75 testes verdes** | 1.0 | T13, T17 | `tests/unit/cursor-llm-client.test.ts` + `tests/integration/runner-failure-paths.test.ts` | D8 / G1-12 |

### Grupo G — i18n hook (CAP-10 / ADR-013 / G1-14)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T19** | 06 / Codex | `src/i18n/pt-BR.ts` + `src/i18n/index.ts` com `t(key)`; refatora CLI, `report-generator` (textos do template fixo, não LLM-output), `errors.ts` (mensagens amigáveis) para usar `t()` | 1.0 | — | `src/i18n/` | CAP-10 / ADR-013 |
| **T20** | 06 / Codex | `scripts/check-no-user-strings.ts` (lint custom): varre `src/cli/`, `src/runtime/report-generator.ts`, `src/core/errors.ts`; falha se literal de string fora de `src/i18n/`. Integra como `npm run lint:i18n` | 0.5 | T19 | `scripts/check-no-user-strings.ts` + npm script | G1-14 |
| **T21** | 12 / Gemini | Testes: `t('chave-inexistente')` lança erro claro; smoke do lint custom passa em `src/` limpa | 0.5 | T19, T20 | `tests/unit/i18n.test.ts` | G1-14 |

### Grupo H — Paridade (D9 / G1-13)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T22** | 06 / Codex | `scripts/parity-usabilidade.ts`: lê `baselines/claude/usabilidade/*.md` (fornecido pelo owner), roda skill com Cursor sobre as mesmas URLs, computa score combinado (cosine 0.5 / Nielsen 0.3 / length 0.2). Saída JSON + summary MD | 1.0 | T17 + baseline owner | `scripts/parity-usabilidade.ts` + `outputs/parity/<data>.json` | D9 / G1-13 |
| **T23** | 12 / Gemini | Testes parity com fixtures sintéticas (cursor=baseline → 1.0; cursor sem Nielsen → < 0.95) | 0.5 | T22 | `tests/unit/parity-usabilidade.test.ts` | D9 / G1-13 |

### Grupo I — Gate 1 validator + passada oficial (G1-4, G1-15)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T24** | 06 / Codex | `scripts/gate1-validate.ts`: (1) reexecuta `gate0-validate` (G1-15 sem regressão), (2) loop nas 13 skills com `--llm cursor` (G1-4), (3) verifica G1-1..G1-14 com checks objetivos. Exit 0 ⇔ 15/15 | 1.0 | T01–T23 | `scripts/gate1-validate.ts` + npm script `gate1` | G1-1..G1-15 |
| **T25** | 06 / Codex | Passada oficial: `npm run gate1` com Cursor real; evidência em `docs/maia/06-implementacao/gate1-cursor-<data>.md` (tabela 15/15 + outputs por skill) | 0.5 | T24 + GROQ/Cursor key | doc + commit | G1-1..G1-15 |

### Grupo J — Encerramento Sprint 1 (replica padrão Gate 0)
| # | Dono | Tarefa | Dias | Dep | Entrega | Cobre |
|---|---|---|---|---|---|---|
| **T26** | 07 / deepseek-v4-pro | QA final independente: roda `gate1`, valida cada G1-X com evidência concreta; relatório próprio | 1.0 | T25 | `docs/maia/07-qa-validacao/relatorio-gate1-<data>.md` | meta-G1 |
| **T27** | 07 / Gemini 3.1 Pro | Cobertura QA (segunda lente, ARTEFATO DISTINTO — 1 modelo = 1 tarefa = 1 arquivo): roda `gate1` próprio, confronta com QA do deepseek, veredito CONCORDA/RESSALVA/DISCORDA | 0.5 | T26 | `docs/maia/07-qa-validacao/cobertura-gemini-gate1-<data>.md` | meta-G1 |
| **T28** | 08 / Cursor + Opus | Review final do código Sprint 1 + Gate 1; veredito APROVA/RESSALVAS/REPROVA | 0.5 | T27 | `docs/maia/08-review/review-gate1-<data>.md` | meta-G1 |
| **T29** | 10 / Cursor + Opus | Memória/encerramento Sprint 1 + abertura Sprint 2 (D3 + worker/fila como backlog); HANDOFFs dos 2 repos atualizados | 0.5 | T28 | `docs/maia/10-memoria/memoria-gate1-<data>.md` + HANDOFFs | encerramento |

---

## 4. Caminho crítico e paralelismo

Total tarefas: **29**. Soma dias-pessoa: **0.5 × 16 + 1.0 × 13 = 21 dias-pessoa**.

Caminho crítico (sequencial obrigatório):

```
T01 → T05 → T07 → T17 → T22 → T24 → T25 → T26 → T27 → T28 → T29
0.5    1.0    1.0    0.5    1.0    1.0    0.5    1.0    0.5    0.5    0.5    = 8.0 dias úteis
```

Frentes paralelas (não estendem o crítico):
- **Frente 2 (Runtime debts):** T09 → T11 → T13 (debts de Runner) e seus testes T10/T12/T14 — caminhe em paralelo a T05/T07; converge antes de T17. Soma 3.5d que cabem na janela T05+T07+T17 (2.5d).
- **Frente 3 (pino):** T15+T16 (1d) totalmente paralela.
- **Frente 4 (i18n):** T19+T20+T21 (2d) — começa após T01/T03 (refactor toca `errors.ts`), termina antes de T24.
- **Testes Gemini (T02/T04/T06/T08/T10/T12/T14/T16/T18/T21/T23):** rodam atrás de cada implementação; somam ~6.5d que cabem nas folgas paralelas.

**Caminho crítico final estimado: 7–8 dias úteis.** Margem ~1–2 dias dentro do teto 7–10 (risco P11 controlado).

---

## 5. Dependências externas críticas

| # | Dependência | Dono | Quando | Se faltar |
|---|---|---|---|---|
| EXT-1 | **Baseline Claude p/ Usabilidade** (≥3 URLs, `report.md` por URL) | Owner | Antes do dia 4 da sprint (antes de T22) | T22/T23/G1-13 = FAIL; replanejar meta de paridade ou diferir |
| EXT-2 | **Chave/endpoint Cursor (Groq)** disponível no ambiente | Owner | Antes de T17 (dia 3) | T17/T18/T22/T25 = FAIL; cair p/ Mock e marcar Gate 1 incompleto |
| EXT-3 | Orçamento de tokens p/ T25 (passada Cursor 13 skills) e T22 (paridade) | Owner | Antes de T22/T25 | reduzir N de URLs na paridade; cap operacional já em ≤50 exec/dia (P6) |

---

## 6. Riscos do plano

| # | Risco | Sev | Mitigação |
|---|---|---|---|
| P11 | Estouro do teto 7–10 dias | ALTA | Marcador no fim do dia 5: se T17 não está pronto, replanejar com owner |
| P12 | Baseline Claude (EXT-1) atrasa | ALTA | T22/T23 desliza p/ 2ª metade; se baseline não chega até dia 6, congelar G1-13 e seguir os outros 14 |
| P13 | Frontmatter das 12 skills heterogêneo demora T07 | MÉDIA | T07 cap de 1d; skill incompatível vira exceção registrada (G1-3 aceita parcial documentado) |
| P14 | Refactor i18n quebra testes existentes | MÉDIA | T19 acompanhado de smoke da suite Gate 0; lint `check-no-user-strings` só em paths definidos (não varre tudo) |
| P15 | Cursor real instável em CI (latência/quota) | MÉDIA | CI roda Mock; Cursor só nas execuções de aceite (T18, T22, T25) localmente |

---

## 7. Definição de "planejamento aprovado"

Aprovação do owner sobre:
1. Backlog T01–T29 (sem alteração de papéis ou ordem).
2. Caminho crítico 7–8d dentro do teto.
3. Dependências externas EXT-1..EXT-3 (compromisso do owner em fornecer EXT-1 e EXT-2 no prazo).

Após aprovação → `06-maia-implementacao` T01.

---

## 8. Veredito

**APROVADO COM RESSALVAS.**

**Ressalvas:** EXT-1 (baseline Claude) e EXT-2 (chave Cursor) são pré-condição p/ fechar Gate 1 (G1-4, G1-13). Sem essas, Sprint 1 entrega o motor real mas o gate fica parcial. Owner já comprometido com ambas (spec §12).

**Próxima skill MAIA:** `06-maia-implementacao` — Sprint 1 **T01** (D6 metrics required, schema). Dono: Codex / GPT-5.3. Validação T02: Gemini 3.1 Pro.

---

## 9. Assinatura

- **Autor:** Guardião MAIA (Cursor + Opus 4.7) — 2026-05-27
- **Código alterado:** NENHUM
- **Commits:** Guardião faz backstop
- **Push:** automático nesta sessão
- **Segredos versionados:** NENHUM

*BugKillers — Setor de Inteligência Artificial — MAIA Skill Pack*
