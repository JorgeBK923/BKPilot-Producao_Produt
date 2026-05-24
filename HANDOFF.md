# HANDOFF — BKPilot — Ciclo Skill Runner Primeiro (Pré-Sprint Técnica)

**Data:** 2026-05-23
**Origem:** Guardiao MAIA (skill `03-maia-planejamento`)
**Destino:** Proxima skill MAIA = `12-maia-code-validator` (Antigravity + Gemini 3.1 Pro)
**Fluxo MAIA:** ciclo em andamento — Pré-Sprint Técnica do BKPilot-SkillRunner
**Escopo:** Pré-Sprint Técnica — provar Skill Runner Engine isolado executando a skill **Usabilidade** end-to-end, em repo novo `BKPilot-SkillRunner`, em TypeScript.
**Status:** T01 IMPLEMENTADO e smoke-validado (typecheck/lint/build exit 0 pelo Guardiao). Aguardando commit + validacao formal T02.
**Ultima skill executada:** `06-maia-implementacao` - T01 (Codex CLI + GPT-5.3 Codex), smoke pelo Guardiao
**Proxima skill recomendada:** `12-maia-code-validator` - T02, com **Antigravity + Gemini 3.1 Pro** (emenda ADR-004, 2026-05-23)
**Repo SkillRunner:** materializado em `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\` (bootstrap `a9d0d5b`, HEAD `4837761`, local only, sem remote)
**Bloqueadores atuais:** Nenhum. Pendência humana #2 **RESOLVIDA em 2026-05-23**: criar repo **local primeiro**, push para GitHub depois (decisão do owner).
**Nivel de risco:** Medio (R1, R5 e P1 ALTA mitigaveis; demais MEDIA/BAIXA, incluindo E1-E5, A1-A5, H1-H2, P2-P5)

---

## 1. Resumo do ciclo

A V1 do BKPilot vai ser construída **de dentro para fora**. Antes de portal, pagamento, billing ou auth, é preciso provar que o motor de execução funciona. Esta é a tese do documento-fonte `BKPilot_Plano_SkillRunner_Primeiro.md`, adotada oficialmente neste ciclo.

A meta imediata é o **Gate 0**: rodar a skill Usabilidade localmente, em repo isolado, gerando relatório real, sem depender do Claude Code como motor.

---

## 2. Documento-fonte oficial deste ciclo

- **Fonte primária:** `C:\Users\Jorge Alves\Downloads\BKPilot_Plano_SkillRunner_Primeiro.md`
- **Apoio:** `C:\Users\Jorge Alves\Downloads\BKPilot_V1_Plano_30_Dias_v3_2.md` (consultar quando faltar detalhe técnico no fonte: i18n, modelo de dados, custos, escala — não usar como ordem de execução)

---

## 3. Decisões cravadas (ADRs)

Todas as decisões formais estão registradas no diagnóstico (`docs/maia/01-diagnostico/diagnostico-2026-05-23-skillrunner.md`, seção 3) e na arquitetura (`docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md`, seção 8):

| ADR | Decisão | Origem |
|---|---|---|
| 001 | Repo novo `BKPilot-SkillRunner` em `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\` | Diagnóstico |
| 002 | Linguagem **TypeScript** sobre Node.js | Diagnóstico |
| 003 | Governança MAIA em todos os repos. Producao = hub central. Skill pack referenciado, não duplicado | Diagnóstico |
| 004 | Distribuição de LLMs por papel (A construção / B MAIA / C runtime). Matriz completa no diagnóstico | Diagnóstico |
| 005 | Skill **Usabilidade** primeiro e sozinha no Gate 0. Catálogo do Engine = 13 skills web | Diagnóstico + Especificação |
| 006 | **Engine ≠ Worker** — artefatos separados, Engine consumível como dependência | Diagnóstico |
| 007 | Decisão de LLM em produção (Papel C) **adiada** para Sprint 3 | Diagnóstico |
| 008 | Engine como **biblioteca + CLI fino** (biblioteca consumível desde o dia 1) | Arquitetura |
| 009 | **Playwright direto**, não MCP, no Engine (sem overhead de tool calls IA-mediadas) | Arquitetura |
| 010 | **`zod` como única fonte de verdade** de schemas; tipos TS derivados via `z.infer` | Arquitetura |
| 011 | **Logger estruturado JSON** (`pino`) desde o dia 1 | Arquitetura |
| 012 | **Sem framework de DI** — wiring manual via construtores | Arquitetura |

---

## 4. Proxima acao - `12-maia-code-validator` (T02)

**T01 - CONCLUIDO** pelo `06-maia-implementacao` (Codex/GPT-5.3). Entregue em `BKPilot-SkillRunner/src/core/`: 4 schemas zod (manifest/execution-input/result/execution-log), `types.ts` (tipos via `z.infer`, zero interface manual), `errors.ts` (16 codigos + `SkillRunnerError`), `logger.ts` (pino), `index.ts` (barrel). Smoke do Guardiao (Opus, independente do Codex): `typecheck`/`lint`/`build` exit 0. Arquivos untracked, aguardando commit.

Proximo: **T02 - testes unitarios dos schemas**. Validador = **Antigravity + Gemini 3.1 Pro** (emenda ADR-004 - autor != validador; Codex/GPT-5.3 nao valida o proprio codigo). Comando completo na secao 11.

Restricao mantida: tarefas de schema/validacao nao implementam runtime, Playwright, LLM, CLI, Runner ou assets.

## 4.1 Resultado da `02-maia-especificacao` (concluída)

- **Decisão:** APROVADO
- **Schemas definidos:** `manifest.yaml`, `execution-input.json`, `result.json`, `execution-log.json`
- **Tools mapeadas:** 14 (10 Playwright + 2 FS + 1 script + 1 HTTP)
- **Códigos de erro:** 16 padronizados
- **Gate 0:** 10 critérios mensuráveis + paridade ≥ 80% vs Claude Code
- **8 capacidades:** definição operacional com critérios de aceite testáveis
- **ADR-005 atualizado:** catálogo expandido para 13 skills web (não mais 4)
- **Riscos adicionados:** E1-E5 (específicos da especificação)
- **Relatório completo:** `docs/maia/02-especificacao/especificacao-2026-05-23-skillrunner.md`

## 4.2 Resultado da `04-maia-arquitetura` (concluída)

- **Decisão:** APROVADO
- **Stack:** Node 20 LTS + TS 5.4 strict ESM + Playwright + zod + vitest + pino + commander
- **Camadas:** 4 (core → runtime → tools+llm → cli), com inversão de dependência via interfaces e wiring manual
- **Estrutura de pastas:** desenhada na íntegra (seção 3 do relatório), incluindo `docs/maia/` próprio
- **Build/test:** `tsx` em dev, `tsc` em build/produção; pirâmide unit + integration + Gate 0 validator; CI com 4 jobs
- **Conversão das 13 skills:** mapeamento `frontmatter → manifest.yaml`, `corpo .md → prompt.md`, `template → report-template.md`. `usabilidade` convertida manualmente no Gate 0; script `convert-skill.ts` semi-automático entra na Sprint 1.
- **Reaproveitamento BKPilot-Core:** **não** acoplar nesta fase (ADR-001). Apenas inspiração.
- **ADRs novas:** 008-012 (5 decisões complementares)
- **Riscos novos:** A1-A5 (3 MÉDIA, 2 BAIXA)
- **Relatório completo:** `docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md`

## 4.3 Resultado da `05-maia-harness` (concluída)

- **Decisão:** APROVADO
- **Repo criado:** `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\` — estrutura seção 3 da arquitetura, configs TS/ESLint/Prettier, CI 4 jobs, stubs `src/index.ts` + `src/cli/index.ts`
- **Smoke test:** `npm install`, `lint`, `typecheck`, `build` — exit 0 (Node local 26.1.0 com EBADENGINE warning; CI pinado Node 20)
- **Git:** commit inicial `a9d0d5b63c0d1f1fbe28835e6b7b28d59b202c24`, sem remote/push
- **Fora do escopo (06):** Runner, schemas zod, Playwright executor, gate0-validate, skill usabilidade convertida
- **Relatório completo:** `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\docs\maia\05-harness\relatorio-harness-2026-05-23.md`
- **HANDOFF do repo:** `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\HANDOFF.md`

## 4.4 Resultado da `03-maia-planejamento` (concluida)

- **Decisao:** APROVADO COM RESSALVAS
- **Backlog:** 24 tarefas (`T01` a `T24`), todas com estimativa <= 1 dia, dependencias, arquivos-alvo, CAP/G0 e criterio de done testavel
- **Caminho critico:** 8.5 dias uteis com paralelismo; excede R1 por manter QA, review e memoria separados
- **Cobertura:** CAP-1..CAP-8 e G0-1..G0-10 cobertos; DAG sem ciclo
- **Riscos novos:** P1-P5 (P1 ALTA; P2, P3, P5 MEDIA; P4 BAIXA)
- **Proxima implementacao:** `06-maia-implementacao`, alvo `T01 - Schemas, erros e logger core`
- **Relatorio completo:** `docs/maia/03-planejamento/planejamento-2026-05-23-skillrunner.md`

---

## 5. Arquivos relevantes

| Arquivo | Propósito |
|---|---|
| `HANDOFF.md` | Este arquivo — handoff vivo do ciclo Skill Runner |
| `docs/maia/01-diagnostico/diagnostico-2026-05-23-skillrunner.md` | Diagnóstico completo + ADRs 001-007 + riscos R1-R9 |
| `docs/maia/02-especificacao/especificacao-2026-05-23-skillrunner.md` | Especificação + schemas + 8 capacidades + Gate 0 + riscos E1-E5 |
| `docs/maia/03-planejamento/planejamento-2026-05-23-skillrunner.md` | Planejamento da Pre-Sprint Tecnica: backlog T01-T24, dependencias, caminho critico, CAP/G0 |
| `docs/maia/04-arquitetura/arquitetura-2026-05-23-skillrunner.md` | Arquitetura completa do Engine (stack TS, estrutura, conversão de skills) + ADRs 008-012 + riscos A1-A5 |
| `docs/maia/handoffs/HANDOFF-2026-05-23-fechamento-ciclos-7-8.md` | Handoff anterior arquivado (transição) |
| `docs/maia/handoffs/HANDOFF-2026-05-15-ciclo7-codex-remediacao.md` | Handoff Ciclo 7 (histórico antigo) |
| `docs/maia/README.md` | Índice e regra de ouro do MAIA neste repo |
| `docs/maia-skill-pack/` | 12 skills MAIA oficiais (referenciado pelos repos da família) |
| `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\` | Repo Skill Runner Engine (materializado pela harness) |
| `...\BKPilot-SkillRunner\docs\maia\05-harness\relatorio-harness-2026-05-23.md` | Relatório bootstrap harness |

---

## 6. Pendências humanas

1. **Duração da Pré-Sprint Técnica** — sugestão do Guardião: 5 a 7 dias úteis. *(não bloqueia, mas precisa ser respondida em breve)*
2. ~~**Modo de criação do repo `BKPilot-SkillRunner`**~~ — **RESOLVIDA e EXECUTADA em 2026-05-23**: repo local criado, commit `a9d0d5b`. Push para `JorgeBK923/BKPilot-SkillRunner` permanece **pendência manual do owner** quando desejar.

---

## 7. Riscos ativos (síntese — detalhes nos relatórios de cada skill)

| Tag | Gravidade | Resumo | Origem |
|---|---|---|---|
| R1 | ALTA | Pré-Sprint Técnica sem prazo pode arrastar — definir teto | Diagnóstico |
| R5 | ALTA | Equipe (Backend Sr, Frontend, DevOps/QA) não contratada — Pré-Sprint Técnica viável só com Jorge + Guardião | Diagnóstico |
| R2, R3, R4, R6, R9 | MÉDIA | Lacunas técnicas a fechar nas próximas skills MAIA | Diagnóstico |
| R7, R8 | BAIXA | Aceitáveis e endereçáveis | Diagnóstico |
| E1, E2, E3, E5 | MÉDIA | Tools especiais, auth, paridade — endereçáveis pós-Gate 0 | Especificação |
| E4 | BAIXA | Schema do manifesto extensível | Especificação |
| A1 | MÉDIA | Conversão manual da `usabilidade` pode revelar campo faltante no schema | Arquitetura |
| A3 | MÉDIA | `MockLLMClient` pode passar Gate 0 sem provar LLM real → rodar Gate 0 duas vezes | Arquitetura |
| A2, A4, A5 | BAIXA | Custo CI Playwright, dupla manutenção de exports, verbosidade de wiring | Arquitetura |
| P1 | ALTA | Plano excede o teto R1 de 7 dias mesmo com paralelismo; execucao sequencial pode levar ~17.5 dias brutos | Planejamento |
| P2, P3, P5 | MEDIA | CursorLLM real pode exigir adaptacao manual; conversao `usabilidade` precisa reduzir paths antigos; Node local 26 difere de Node 20 alvo | Planejamento |
| P4 | BAIXA | Checagem G0-10 de processo zumbi pode variar entre Windows local e CI Linux | Planejamento |

---

## 8. Restrições críticas (NUNCA violar)

- **NUNCA** expor `.env`, `clients/*/.env`, tokens, credenciais.
- **NUNCA** misturar código do Skill Runner Engine dentro deste repo Producao (ADR-001).
- **NUNCA** usar Claude Code como motor produtivo (premissa do doc-fonte).
- **NUNCA** acoplar o Engine ao BKPilot-Core como dependência nesta fase (ADR-001 + Arquitetura §7).
- **NUNCA** avançar para Sprint 1 sem passar no Gate 0 (skill Usabilidade rodando E2E localmente).
- **NUNCA** marcar concluído sem evidência (regra MAIA inviolável).
- **NUNCA** apagar arquivos em `docs/maia/handoffs/` — é histórico.
- **NUNCA** alterar uma ADR sem registrar a alteração com data e justificativa.
- **NUNCA** sair do escopo "Pré-Sprint Técnica" sem registrar.
- **NUNCA** criar `interface SkillManifest` à mão — derivar de zod (ADR-010).
- **NUNCA** introduzir framework de DI no Engine nesta fase (ADR-012).

---

## 9. Segurança obrigatória (validação contínua)

- [x] Nenhum `.env` versionado detectado neste repo
- [x] `.gitignore` presente
- [x] `BKPilot-SkillRunner` criado: `.gitignore`, `.env.example`, AGENTS.md, README, `docs/maia/`
- [ ] Skill `11-maia-security` será invocada formalmente quando o Engine começar a chamar LLM real

---

## 10. Definition of Done deste handoff

- [x] Diagnóstico concluído e arquivado
- [x] ADRs 001-007 cravados
- [x] Riscos R1-R9 registrados e classificados
- [x] HANDOFF anterior arquivado
- [x] Executar `02-maia-especificacao` — CONCLUÍDO (APROVADO)
- [x] Executar `04-maia-arquitetura` — CONCLUÍDO (APROVADO)
- [x] ADRs 008-012 cravados
- [x] Riscos E1-E5 e A1-A5 registrados
- [x] HANDOFF atualizado para apontar `05-maia-harness`
- [x] Executar `05-maia-harness` — CONCLUÍDO (APROVADO)
- [x] Executar `03-maia-planejamento` - CONCLUIDO (APROVADO COM RESSALVAS)
- [x] Executar `06-maia-implementacao` - T01 (CONCLUIDO; smoke do Guardiao OK; aguardando commit)
- [x] Emenda ADR-004 registrada: validador do Engine nunca e Codex/GPT-5.3 (12 -> Gemini 3.1 Pro; 07 -> deepseek-v4-pro + Gemini)
- [ ] **Proximo:** executar `12-maia-code-validator` - T02 (Antigravity + Gemini 3.1 Pro)

---

## 11. Comando de chamada para próxima skill

```text
Executar 12-maia-code-validator no contexto BKPilot-SkillRunner, alvo T02.
Validador: Antigravity CLI + Gemini 3.1 Pro (emenda ADR-004 - NAO usar Codex/GPT-5.3, que escreveu o codigo).

Ler antes:
- C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\HANDOFF.md (handoff do repo Engine)
- docs/maia/02-especificacao/especificacao-2026-05-23-skillrunner.md (secoes 3-7: schemas + 16 codigos = CONTRATO)
- docs/maia/03-planejamento/planejamento-2026-05-23-skillrunner.md (linha T02 + adendo A1..A7)
- BKPilot-SkillRunner/src/core/** (implementacao a validar)

Tarefa T02: criar tests/unit/schemas.test.ts (vitest) validando os 4 schemas zod + os 16 codigos de erro. Derivar as EXPECTATIVAS da ESPECIFICACAO (contrato), NAO da implementacao - o objetivo e pegar divergencia entre codigo e spec. Cobrir manifesto valido/invalido (campo obrigatorio faltando), input valido/invalido, result/log validos, 16 codigos exatos. Comentar CAP-1/CAP-7/CAP-8.

Done: `npm run test -- --run tests/unit/schemas.test.ts` passa; typecheck/lint sem regressao. Se um teste falhar por bug do 06, NAO corrigir o codigo - registrar achado para devolver ao 06-implementacao (autor != validador). Nao commitar, nao push.
```

---

## 12. Atualizacao obrigatoria ao final da proxima skill

A skill `06-maia-implementacao`, ao concluir T01, deve:
- Criar/alterar apenas arquivos core previstos em T01 no repo `BKPilot-SkillRunner`
- Registrar evidencia de `npm run typecheck` e criterios de done de T01
- Atualizar `HANDOFF.md` do Producao e do SkillRunner apontando a proxima tarefa planejada (`T02` validacao ou `T03`, conforme execucao)
- Nao arquivar handoffs ainda; arquivamento fica para fechamento do Gate 0 apos `10-maia-memoria`

