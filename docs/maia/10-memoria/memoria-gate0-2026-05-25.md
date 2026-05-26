# Memória de Encerramento — Gate 0 — BKPilot-SkillRunner

**Data:** 2026-05-25
**Skill MAIA:** `10-maia-memoria` — T24 (última da Pré-Sprint Técnica)
**Autor:** Cursor + Opus 4.7
**Alvo:** Encerrar a Pré-Sprint Técnica (T01-T23) + abrir Sprint 1
**Repo:** `C:\Users\Jorge\IA\Produto\BKPilot-SkillRunner\`
**HEAD no encerramento:** `3b53034` (branch `main`, NÃO pushado; o backstop do Guardião sobre este T24 avança +N — não fixar SHA como verdade durável, ver D10)
**Status do Gate 0:** ✅ **ENCERRADO — APROVADO COM RESSALVAS, sem pendência sem dono**

---

## 1. O que foi a Pré-Sprint Técnica

Primeira prova de vida do Skill Runner Engine: um motor isolado, em TypeScript, capaz de executar a skill **Usabilidade** end-to-end (manifesto → browser → LLM → relatório → artefatos → status), validado por 10 critérios mensuráveis (G0-1..G0-10). Repo novo, local-first, sem acoplar BKPilot-Core, sem Worker/SaaS/billing.

**24 tarefas (T01-T24)** com implementação e validação separadas (ADR-004). Concluída em 2026-05-25.

---

## 2. Resultado do Gate 0

| Eixo | Resultado |
|---|---|
| **Critérios G0-1..G0-10 (Mock)** | ✅ 10/10 PASS, exit 0 — reproduzido no QA (T22) e no review (T23) |
| **Gate 0 real (Groq `llama-3.3-70b-versatile`)** | ✅ status `completed`, 8581ms, 964 tokens (T21) |
| **Suíte de testes** | ✅ 50/50 verde (8 arquivos) |
| **typecheck / lint** | ✅ exit 0 / 0 warnings |
| **CAP-1..CAP-8** | ✅ todas cobertas |
| **QA final (T22)** | ✅ deepseek-v4-pro APROVADO 10/10 + cobertura Gemini 3.1 Pro CONCORDA |
| **Review final (T23)** | ✅ Cursor + Opus 4.7 — APROVA COM RESSALVAS, nenhum bloqueador |
| **Higiene de segredos** | ✅ só `.env.example` versionado; zero chave hardcoded |
| **Bugs / bloqueadores abertos** | ✅ NENHUM |

**Artefatos canônicos do Gate 0** (`outputs/gate0-001/`, gitignored): `result.json` (956B, `status:completed`), `report.md` (5.9KB, H1..H10 Nielsen), `screenshot.png` (10.4KB PNG válido), `execution-log.json` (10 eventos).

### Mapa de entregas T01-T23

- **Core (T01-T02):** schemas zod (manifest/input/result/log), `errors.ts` (16 códigos), `logger.ts` (pino), 21 testes.
- **Runtime (T03-T07, T12, T14):** `skill-loader`, `artifact-manager`, `status-resolver`, `report-generator`, `runner` (orquestra CAP-1..8, injeção por construtor).
- **Browser (T08-T10):** `PlaywrightExecutor` headless/networkidle, snapshot DOM, screenshot, close idempotente, 7 testes de integração com browser real.
- **LLM (T11):** interface `LLMClient` + `MockLLMClient` (offline) + `CursorLLMClient` (OpenAI-compatível, credencial só de env).
- **Skill + CLI (T15-T17):** CLI `execute` fino, skill `usabilidade` (manifest/prompt/report-template H1..H10), input Gate 0.
- **Gate 0 (T18-T21):** `gate0-validate.ts` (G0-1..G0-10), E2E (T19), Gate 0 Mock (T20) e real Groq (T21).
- **QA + Review (T22-T23):** QA independente deepseek + cobertura Gemini; review final Opus.

---

## 3. ADRs 001-012 (estado no encerramento)

| ADR | Decisão | Estado no Gate 0 |
|---|---|---|
| 001 | Repo separado, local-first | ✅ Cumprido — repo isolado, não pushado |
| 002 | TypeScript Node strict ESM | ✅ Cumprido — `type:module`, node 20, typecheck 0 |
| 003 | Governança MAIA em todos os repos (`docs/maia/` próprio) | ✅ Cumprido — docs espelhados hub ↔ SkillRunner |
| 004 | Distribuição de LLMs por papel + emenda autor≠validador | ✅ Cumprido — Codex implementa, Gemini valida (12), deepseek+Gemini QA (07), Opus review (08), Guardião backstop/commit |
| 005 | Usabilidade primeiro, sozinha; paridade ≥ 95% antes de replicar | ✅ Cumprido no Gate 0 (sozinha); meta de paridade transferida p/ Sprint 1 |
| 006 | Engine ≠ Worker | ✅ Cumprido — nenhuma fila/worker no Engine |
| 007 | LLM de produção (Papel C) adiado p/ Sprint 3 | ✅ Mantido — Mock/Cursor apenas |
| 008 | Biblioteca + CLI fino | ✅ Cumprido — CLI delega 100% ao `Runner` |
| 009 | Playwright direto (sem MCP no Engine) | ✅ Cumprido — `chromium.launch` direto |
| 010 | zod fonte de verdade | ✅ Cumprido — validação em loader/artifact/input/result |
| 011 | pino logs | ⚠️ **Parcial** — `logger.ts` existe/exportado mas não consumido pelo runtime (vira débito D4) |
| 012 | Sem DI framework | ✅ Cumprido — injeção manual via `RunnerDeps` |

Nenhum ADR foi revertido. ADR-011 é a única aderência parcial e está rastreada como débito.

---

## 4. Backlog inicial da Sprint 1 — débitos D1-D10 (cada um com dono)

Origem: review T23 (`docs/maia/08-review/review-gate0-2026-05-25.md`). Nenhum bloqueia o Gate 0; todos são evolução para o Engine real reutilizável. **Donos seguem ADR-004** (implementação = Codex/GPT-5.3; validação ≠ Codex = Gemini 3.1 Pro; QA = deepseek + Gemini; backstop = Guardião/Opus).

| # | Débito | Severidade | Dono (implementação) | Dono (validação) |
|---|---|---|---|---|
| D1 | Timeout global não enforçado (`manifest.timeout_seconds` ignorado; só há timeout de navegação 30s) | MÉDIA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D2 | Retry declarado no manifesto (`retry{}`) mas não implementado no `Runner` | MÉDIA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D3 | Fallback de LLM ausente (`LLM_FALLBACK_EXHAUSTED` nunca lançado) — deferido de propósito | BAIXA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D4 | pino não conectado ao runtime (ADR-011 parcial) | BAIXA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D5 | Aliasing de `result.outputs` (mutação por referência pós-`buildResult`) | BAIXA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D6 | `result.schema` com `metrics` opcional enquanto G0-6 depende da presença | BAIXA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D7 | `llm_override.provider` ignorado no caminho real | BAIXA | Codex / GPT-5.3 | Gemini 3.1 Pro |
| D8 | Lacunas de teste nos caminhos `failed`/`partial` e em `cursor-llm-client` | BAIXA | Gemini 3.1 Pro (12-code-validator) | deepseek-v4-pro (QA) |
| D9 | Paridade ADR-005 não medida (sem baseline Claude no ambiente) | INFO→META | deepseek + Gemini (07-qa) | Guardião / Opus (review) |
| D10 | HANDOFF pinava SHA que envelhece a cada commit de docs (`a14bd82` → `31bae5a` → `d4c0210` → `3b53034`) | INFO | **MITIGADO neste T24** (parar de tratar SHA como verdade durável) | Guardião / Opus |

**Invariante de encerramento:** nenhum débito do Gate 0 fica sem dono. D10 mitigado: o padrão de fixar HEAD no HANDOFF gera staleness garantida porque cada commit de docs (review, handoff, memória) avança o SHA; recomenda-se referir "branch `main`, não pushado" e não pinar SHA exato.

---

## 5. Abertura da Sprint 1 — Engine real reutilizável

**Objetivo:** sair de "1 skill provada" para "Engine que executa as 13 skills web a partir de manifesto".

**Primeira skill MAIA da Sprint 1:** `06-maia-implementacao` (Codex / GPT-5.3), criando `scripts/convert-skill.ts` (ainda não existe no repo).

**Escopo da Sprint 1 (não confundir com Gate 0):**
1. **`convert-skill.ts`** — converter as **12 skills web restantes** do skill pack (`docs/maia-skill-pack/`) em manifestos do Engine.
2. **CursorLLM real** como caminho padrão de qualidade (Mock vira só fluxo/CI).
3. **Meta de paridade ≥ 95%** vs Claude Code (D9) — exige baseline Claude.
4. **Saldar D1-D8** (timeout global, retry, fallback, pino wiring, limpezas de schema/aliasing, cobertura de erro).
5. **Gate 1** como critério de avanço (definição operacional a formalizar em `02-maia-especificacao` da Sprint 1, análogo ao Gate 0).

**Fora da Sprint 1** (mantido adiado): Worker/Fila (Sprint 2), SaaS Core/multi-tenant/RLS/billing/auth (Sprint 3), LLM de produção Papel C (Sprint 3), mobile, MCP no Engine, acoplamento ao BKPilot-Core.

**Roadmap:** Pré-Sprint Técnica ✅ → **Sprint 1 (Engine real)** → Sprint 2 (Worker+Fila) → Sprint 3 (SaaS Core) → Sprint 4 (Operação+Piloto). Cada sprint só avança no respectivo gate.

---

## 6. Pendências humanas para o início da Sprint 1

- Definir **duração da Sprint 1** (decisão humana — diagnóstico §C).
- Decidir **i18n no Engine** (relatório PT/EN/ES): Sprint 1 ou Sprint 3.
- Fornecer **baseline Claude Code** para medir paridade (D9), ou aceitar medição manual.
- Decisão de **push remoto** do repo (segue sem push até decisão do owner).

---

## 7. Encerramento

**Gate 0 ENCERRADO sem pendência sem dono.** Engine sólido, 50/50 testes, 10/10 gates reproduzidos por 3 lentes independentes (QA deepseek, cobertura Gemini, review Opus). Débitos D1-D10 transferidos para a Sprint 1 com dono. HANDOFFs dos dois repos atualizados apontando a Sprint 1.

**Próxima skill:** `06-maia-implementacao` — Sprint 1, T01 (criar `convert-skill.ts`), Codex / GPT-5.3.

---

## 8. Assinatura

- **Autor:** Cursor + Opus 4.7 — 2026-05-25
- **Código alterado:** NENHUM
- **Commits:** NENHUM (Guardião faz backstop)
- **Push:** NÃO
- **Segredos versionados:** NENHUM

*BugKillers — Setor de Inteligência Artificial — MAIA Skill Pack*
</content>
