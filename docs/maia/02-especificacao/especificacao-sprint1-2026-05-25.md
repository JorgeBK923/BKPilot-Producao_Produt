# Especificação MAIA — Sprint 1 — Engine Real Reutilizável (BKPilot-SkillRunner)

**Data:** 2026-05-25
**Skill:** `02-maia-especificacao`
**Executor:** Guardião MAIA (Cursor + Opus 4.7)
**Projeto-alvo:** BKPilot-SkillRunner
**Sprint:** **Sprint 1** (segunda etapa do roadmap; pós Pré-Sprint Técnica / Gate 0 ENCERRADO)
**Entradas:**
- `BKPilot-SkillRunner/HANDOFF.md`
- `BKPilot-SkillRunner/docs/maia/10-memoria/memoria-gate0-2026-05-25.md` (encerramento Gate 0 + débitos D1–D10 com dono)
- `BKPilot-SkillRunner/docs/maia/08-review/review-gate0-2026-05-25.md` (detalhe técnico dos débitos)
- `docs/maia/01-diagnostico/diagnostico-2026-05-23-skillrunner.md` (roadmap de sprints)
- `docs/maia/02-especificacao/especificacao-2026-05-23-skillrunner.md` (modelo do Gate 0 — replicado aqui em formato)
- `docs/maia-skill-pack/` (12 skills web restantes — insumo de escopo)

**Decisões do owner (2026-05-25) consolidadas nesta spec:**
- Sprint 1 abre por especificação (regra dura: nunca codar sem spec/objetivo). ✅ (este doc)
- Teto de duração: **7–10 dias úteis**.
- **i18n adiado para Sprint 3** com hook desde já (sem hardcode de strings de usuário) → vira **ADR-013**.
- **Baseline Claude (D9)** será fornecido pelo owner.

---

## 1. Resumo executivo

A Pré-Sprint Técnica provou o motor com **uma** skill (Usabilidade). A Sprint 1 transforma o motor em **Engine Real Reutilizável**: capaz de executar **as 13 skills web** do catálogo a partir de manifesto, com **CursorLLM real como caminho padrão**, **paridade ≥ 95%** vs Claude Code na Usabilidade (referência), e **D1–D8 saldados**. Gate 1 formaliza critérios mensuráveis análogos aos G0-1..G0-10. Fora de escopo: Worker/Fila (Sprint 2), SaaS Core/multi-tenant/billing/auth (Sprint 3), mobile/MCP-no-Engine/Core (sprints posteriores), i18n (Sprint 3).

---

## 2. Escopo

### 2.1 Dentro do escopo (Sprint 1)

1. **`scripts/convert-skill.ts`** — converte uma skill do skill pack (`docs/maia-skill-pack/<id>.md` com frontmatter YAML + corpo) em três arquivos no formato do Engine: `skills/<id>/manifest.yaml`, `prompt.md`, `report-template.md`. Determinístico (mesmo input → mesmo output).
2. **Conversão das 12 skills web restantes** (Usabilidade já existe). Lista canônica em `docs/maia-skill-pack/` filtrada por plataforma=web.
3. **Carregamento e execução** de todas as 13 skills via CLI atual (`execute --skill <id> --input <json>`).
4. **CursorLLM real como caminho padrão** — Mock vira opt-in (flag `--llm mock` ou `LLM=mock`).
5. **Saldar D1–D8** (ver §5 detalhe técnico).
6. **Paridade ≥ 95% Usabilidade vs Claude Code** (D9) — exige baseline fornecido pelo owner; metodologia em §6.
7. **Hook de i18n** (ADR-013) — todo texto destinado ao usuário (relatório, erro amigável da CLI, mensagens do CLI) é externalizado em constantes/templates; locale `pt-BR` é o único implementado.
8. **`scripts/gate1-validate.ts`** — análogo ao `gate0-validate.ts`, valida G1-1..G1-15 ao final da sprint.

### 2.2 Fora do escopo (não tocar)

- Worker, fila, persistência fora de disco local (Sprint 2)
- Multi-tenant / RLS / auth / billing / Stripe / portal (Sprint 3)
- LLM de produção (Papel C) — Cursor real basta (decisão Sprint 3)
- i18n efetivo (PT/EN/ES) — só o hook entra (Sprint 3 traduz)
- Mobile, MCP no Engine, acoplamento ao BKPilot-Core
- DI framework, monorepo, transpilação além de tsc estrito ESM
- Conversão de skills mobile (não-web)

---

## 3. Capabilities (extensão das CAP-1..8 do Gate 0)

| CAP | Descrição | Estado no Gate 0 | Sprint 1 |
|---|---|---|---|
| CAP-1 | Engine executa skill a partir de manifesto | ✅ 1 skill | **estende p/ 13** |
| CAP-2 | Browser Playwright gerenciável | ✅ | mantém |
| CAP-3 | LLM Client invocável e rastreável | ✅ Mock + Cursor stub | **CursorLLM real default** (CAP-3a) |
| CAP-4 | Relatório gerado com conteúdo útil | ✅ template Usabilidade | **estende p/ 13 templates** |
| CAP-5 | Log de execução estruturado | ✅ schema | **+ pino wiring real** (D4 / CAP-5a) |
| CAP-6 | Execução dentro de limites de tempo | ✅ checagem pós-fato | **timeout global enforçado** (D1 / CAP-6a) |
| CAP-7 | Tratamento de erros sem crash | ✅ | **+ retry** (D2 / CAP-7a) |
| CAP-8 | Cleanup de recursos | ✅ | mantém |
| **CAP-9** | **Conversão automatizada de skill pack → manifesto** | — | **nova** |
| **CAP-10** | **i18n hook (sem hardcode de strings de usuário)** | — | **nova** (ADR-013) |

---

## 4. Gate 1 — Critérios de aceite (mensuráveis)

Análogo aos G0-1..G0-10 do Gate 0. Cada critério é binário (PASS/FAIL) com evidência observável em disco ou via comando. Validados por `scripts/gate1-validate.ts` (exit 0 ⇔ 15/15 PASS).

| # | Critério | Como medir | CAP |
|---|---|---|---|
| **G1-1** | `convert-skill.ts` converte ao menos 1 skill do skill pack em manifesto válido (smoke) | `node scripts/convert-skill.ts <id>` produz `skills/<id>/{manifest.yaml,prompt.md,report-template.md}`; loader valida sem erro | CAP-9 |
| **G1-2** | Conversão é determinística | Rodar 2x sobre a mesma skill produz arquivos byte-idênticos (sha256 igual) | CAP-9 |
| **G1-3** | 12 skills web restantes convertidas | `skills/` contém 13 diretórios; cada `manifest.yaml` passa `skillManifestSchema.safeParse` (zero erro) | CAP-1, CAP-9 |
| **G1-4** | Cada uma das 13 skills é executável E2E com CursorLLM real | `gate1-validate.ts` roda as 13 com `--llm cursor`; todas `status=completed`, 4 artefatos íntegros por skill | CAP-1..CAP-8 |
| **G1-5** | CursorLLM é o caminho padrão da CLI | `npm run execute -- --skill usabilidade --input ...` sem flag `--llm` usa Cursor (chamada real registrada em `execution-log.json`); Mock só via `--llm mock` ou `LLM=mock` | CAP-3a |
| **G1-6** | Timeout global enforçado (D1) | Manifesto com `timeout_seconds: 2`, skill que demora > 2s → `status=timeout` no `result.json`, `execution-log.json` registra evento `timeout`, `duration_ms ≤ 2200` (margem 200ms) | CAP-6a |
| **G1-7** | Retry executado conforme manifesto (D2) | Manifesto com `retry.attempts: 2`, LLM client de teste que falha 1x e sucede no 2º → `metrics.llm_calls ≥ 2`, `status=completed` | CAP-7a |
| **G1-8** | pino consumido pelo Runtime (D4) | Variável `LOG_FORMAT=json` faz CLI emitir JSON-lines pino no stderr; cada linha tem `level/time/msg`; sem `LOG_FORMAT` mantém saída humana | CAP-5a |
| **G1-9** | `result.outputs` imutável pós-`buildResult` (D5) | Teste unitário: mutar `result.outputs.push(...)` após retorno do `buildResult` não altera o array interno usado pelo `Runner` | CAP-7 |
| **G1-10** | `result.metrics` obrigatório no schema (D6) | `resultSchema.shape.metrics.isOptional() === false`; build de `result` sem `metrics` é rejeitado pelo zod | CAP-7 |
| **G1-11** | `llm_override.provider` respeitado (D7) | Passar `--llm-override '{"provider":"mock"}'` quando default=cursor força MockLLMClient; verificado por `model_used` no `execution-log.json` | CAP-3a |
| **G1-12** | Cobertura de testes amplia caminhos de falha (D8) | Suíte ≥ **75 testes** verde (linha base Gate 0 = 50). Pelo menos: 3 testes do `cursor-llm-client` (sucesso, falha de rede, JSON inválido); 2 do Runner caminho `failed`; 2 do Runner caminho `partial` (status PARTIAL_OUTPUTS) | CAP-7 |
| **G1-13** | Paridade ≥ 95% Usabilidade vs Claude Code (D9) | `scripts/parity-usabilidade.ts` compara `report.md` Cursor vs baseline Claude em N (≥ 3) execuções, métrica = média de similaridade semântica (cosine sobre embeddings + presença das 10 heurísticas Nielsen + comprimento ±20%); resultado ≥ 0.95 | CAP-3a |
| **G1-14** | i18n hook sem hardcode de strings de usuário (CAP-10, ADR-013) | Lint custom (`scripts/check-no-user-strings.ts`) varre `src/` proibindo literais de string fora de `src/i18n/pt-BR.ts` em arquivos que produzem saída ao usuário (CLI, report-generator, errors amigáveis); exit 0 | CAP-10 |
| **G1-15** | Smoke E2E final das 13 skills sem regressão Gate 0 | `gate1-validate.ts` reexecuta `gate0-validate.ts` (10/10 Mock) + roda as 13 skills com Cursor; todos os outputs validados; sem processo Playwright zumbi (delta = 0) | CAP-1..CAP-10 |

**Critério de avanço:** `gate1-validate.ts` exit 0 ⇔ 15/15 PASS. Falha em qualquer um bloqueia encerramento da Sprint 1.

---

## 5. Débitos D1–D10 — saldo dentro da Sprint 1

| Débito | Saldo Sprint 1 | Coberto por |
|---|---|---|
| D1 timeout global não enforçado | **Resolver** | G1-6 |
| D2 retry não implementado | **Resolver** | G1-7 |
| D3 fallback LLM ausente | **Adiado p/ Sprint 2** (não bloqueia Gate 1; registrar em backlog) | — |
| D4 pino sem wiring | **Resolver** | G1-8 |
| D5 aliasing `result.outputs` | **Resolver** | G1-9 |
| D6 `metrics` opcional no schema | **Resolver** | G1-10 |
| D7 `llm_override.provider` ignorado | **Resolver** | G1-11 |
| D8 lacunas de teste | **Resolver** | G1-12 |
| D9 paridade não medida | **Resolver** (depende de baseline) | G1-13 |
| D10 HANDOFF pina SHA stale | **Já mitigado** no T24 | — |

Sprint 1 fecha 8 dos 10 débitos (D3 vai p/ Sprint 2, D10 já saldado).

---

## 6. Metodologia da paridade (D9 / G1-13)

**Baseline:** o owner roda a skill `usabilidade` **no Claude Code** sobre N URLs fixas (mínimo 3, recomendado 5) e fornece os `report.md` resultantes em `baselines/claude/usabilidade/<url-slug>.md`. Sem baseline, G1-13 = FAIL e Sprint 1 não fecha.

**Medição:** `scripts/parity-usabilidade.ts` para cada URL:
1. Executa skill `usabilidade` com CursorLLM real → `report-cursor.md`.
2. Compara contra `baseline-claude.md` com três métricas combinadas (média ponderada):
   - **Semântica:** cosine similarity sobre embeddings (modelo a definir; default `text-embedding-3-small`). Peso 0.5.
   - **Estrutura:** presença das 10 heurísticas de Nielsen (H1..H10) — fração presente em ambos. Peso 0.3.
   - **Volume:** `|len_cursor − len_baseline| / len_baseline ≤ 0.20`. Peso 0.2 (binário pass/fail virado em 1.0/0.0).
3. Média sobre as N URLs ≥ **0.95** → G1-13 PASS.

**Custo/latência:** considerar orçamento (cada execução Cursor real custa tokens). Cap operacional: ≤ 50 execuções Cursor por dia de sprint.

---

## 7. ADR novo

### ADR-013 — i18n adiado para Sprint 3 com hook desde a Sprint 1

**Decisão:** o Engine não implementa i18n na Sprint 1. Mas toda string destinada ao usuário (saída do CLI, mensagens de erro amigáveis, conteúdo de relatório que não venha do LLM, textos de template) é externalizada em `src/i18n/pt-BR.ts` (chave → string). Acesso via função `t(key)`. Locale `pt-BR` é o único implementado; Sprint 3 adiciona `en` e `es`.

**Por quê:** evita refactor caro depois (R7 do diagnóstico). Custo de fazer o hook agora é baixo (estrutura simples); custo de fazer depois com 13 skills é alto (varrer tudo).

**Como prova:** G1-14 + lint custom `scripts/check-no-user-strings.ts`.

**Status:** APROVADO pelo owner em 2026-05-25.

---

## 8. Restrições críticas (Sprint 1)

- **NUNCA** push remoto da branch de trabalho sem decisão do owner (`main` da Pré-Sprint já pushado; branches de feature seguem padrão a definir no `03-planejamento`).
- **NUNCA** `.env` versionado; chaves Cursor/Claude/embeddings só por env var.
- **NUNCA** acoplar BKPilot-Core.
- **NUNCA** introduzir Worker, fila, SaaS, billing, auth de SUT, mobile, MCP no Engine.
- **NUNCA** hardcoded user-facing strings em `src/` (ADR-013).
- **Seguir backlog** que o `03-maia-planejamento` produzirá; mudança de ordem registra no HANDOFF.

---

## 9. Riscos

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| P6 | 13 skills E2E com Cursor real estoura orçamento de tokens / tempo | MÉDIA | Cap diário de execuções; `--llm mock` em CI; cobrar tokens só nas execuções de aceite |
| P7 | Baseline Claude (D9) atrasa → G1-13 FAIL | ALTA | Owner fornece baseline na 1ª metade da sprint; se não, replanejar antes de codar paridade |
| P8 | Conversão automatizada falha em skills com frontmatter heterogêneo | MÉDIA | `convert-skill.ts` valida com `skillManifestSchema`; skills com schema incompatível viram exceção registrada (não-bloqueante p/ as outras) |
| P9 | Refactor para timeout/retry/pino quebra Gate 0 | ALTA | `gate1-validate.ts` inclui `gate0-validate.ts` como pré-passo (G1-15) — qualquer regressão fura o gate |
| P10 | i18n hook trava produtividade do Codex | BAIXA | `t('key')` simples; sem dependência externa; lint custom dá feedback imediato |
| P11 | 7–10 dias úteis estouram | ALTA | Replanejar com owner antes de seguir; **NUNCA** seguir calado (vale a regra R1 do Gate 0) |

---

## 10. Definição de "Sprint 1 feita"

Sprint 1 considera-se **concluída** quando:
- `gate1-validate.ts` exit 0 (15/15 PASS).
- `gate0-validate.ts` continua exit 0 (zero regressão).
- Suíte de testes ≥ 75/75 verde.
- typecheck exit 0, lint 0 warnings.
- D1, D2, D4, D5, D6, D7, D8, D9 saldados (D3 explicitamente diferido p/ Sprint 2, registrado em backlog).
- ADR-013 implementado e verificado por G1-14.
- Memória de encerramento (`10-maia-memoria` Sprint 1) escrita, débitos remanescentes (incl. D3) com dono na Sprint 2, HANDOFFs dos 2 repos apontando Sprint 2.

---

## 11. Prazo

- **Teto:** 7–10 dias úteis (decisão owner 2026-05-25).
- **Marco intermediário:** ao fim do dia 4–5, ter G1-1..G1-3 (conversor + 13 manifestos válidos) + G1-6..G1-11 (débitos saldados) verdes. G1-4, G1-13, G1-15 dependem de baseline e de execução real — concentram-se na 2ª metade.
- Se estourar o teto, **PARAR e replanejar** com o owner antes de seguir (R1, P11).

---

## 12. Pendências humanas para iniciar a Sprint 1

- [x] **Duração da Sprint 1** — definido: 7–10 dias úteis (owner 2026-05-25).
- [x] **i18n no Engine** — definido: adiado p/ Sprint 3 com hook (ADR-013, owner 2026-05-25).
- [ ] **Baseline Claude para D9** — owner se comprometeu a fornecer; fornecer nos primeiros dias da sprint.
- [x] **Push remoto** — Pré-Sprint pushada (owner 2026-05-25).

---

## 13. Veredito

**APROVADO COM RESSALVAS.**

**Ressalvas:** G1-13 depende do baseline Claude (P7 ALTA). Se o baseline não chegar até o meio da sprint, replanejar a meta de paridade — *não baixar a meta dentro do gate sem renegociar formalmente*.

**Próxima skill MAIA:** `03-maia-planejamento` — quebrar G1-1..G1-15 em tarefas Sprint 1 / T01..T0N (cada uma ≤ 1 dia), com dono por ADR-004 (implementação = Codex/GPT-5.3; validação = Gemini 3.1 Pro; QA = deepseek + Gemini; review = Opus; backstop/commits = Guardião).

---

## 14. Assinatura

- **Autor:** Guardião MAIA (Cursor + Opus 4.7) — 2026-05-25
- **Código alterado:** NENHUM (spec é texto)
- **Commits:** será feito pelo Guardião no backstop
- **Push:** automático nesta sessão (Pré-Sprint pushada; este doc segue na próxima passada de docs)
- **Segredos versionados:** NENHUM

*BugKillers — Setor de Inteligência Artificial — MAIA Skill Pack*
