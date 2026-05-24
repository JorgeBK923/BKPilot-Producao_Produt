# Diagnóstico MAIA — Skill Runner Primeiro

**Data:** 2026-05-23
**Skill:** `01-maia-diagnostico`
**Executor:** Guardião MAIA (Cursor + Opus 4.7)
**Projeto-mãe:** BKPilot-Producao_Produt (hub MAIA central)
**Projeto-alvo:** BKPilot-SkillRunner (novo repo, a ser criado)
**Documento-fonte:** `C:\Users\Jorge Alves\Downloads\BKPilot_Plano_SkillRunner_Primeiro.md` (924 linhas)
**Documento de apoio (não-fonte):** `C:\Users\Jorge Alves\Downloads\BKPilot_V1_Plano_30_Dias_v3_2.md` — usar apenas para consulta quando faltar detalhe técnico no documento-fonte (i18n, modelo de dados, custos, escala).

---

## 1. Resumo executivo

O escopo deste novo ciclo é **construir o BKPilot V1 de dentro para fora**, começando pelo **Skill Runner Engine isolado**, antes de qualquer portal, pagamento, autenticação, billing ou multi-tenant. A premissa central — e bem fundamentada — é que **se o motor não funcionar, todo o resto vira casca**.

A ordem proposta é: **Pré-Sprint Técnica** (provar skill local) → **Sprint 1** (Engine real reutilizável) → **Sprint 2** (Worker + Fila + Artefatos) → **Sprint 3** (SaaS Core ao redor do motor) → **Sprint 4** (Operação + Piloto).

Cada sprint só avança se passar no **gate de qualidade** correspondente (Gate 0 a 4). A skill **Usabilidade** é obrigatória, primeira e única no Gate 0.

O Skill Runner Engine nasce em **repo novo separado** (`BKPilot-SkillRunner`), em **TypeScript** sobre Node.js, com governança MAIA própria e referenciando o skill pack que vive neste repo Producao.

Decisão arquitetural crítica: o **Engine** (motor puro) é separado do **Worker SaaS** (operador do motor dentro do produto). Essa separação permite que o motor seja testado, evoluído e versionado de forma independente — e mais tarde consumido pelo Worker como dependência npm/GitHub, exatamente como o Producao atual consome o `BKPilot-Core`.

---

## 2. Achados principais

### A. Estado do repo Producao atual (hub MAIA central)

- **Estado limpo MAIA** — Ciclos 7 e 8 oficialmente encerrados em 2026-05-23. Sem bloqueadores ativos.
- Estrutura `docs/maia/` operacional: `handoffs/` (com 2 HANDOFFs arquivados), `01-diagnostico/`, `10-memoria/`.
- Skill pack completo em `docs/maia-skill-pack/` (12 skills + README + HANDOFF_TEMPLATE).
- Skills do produto antigo (BugKillers QA Agent) vivem em `src/`, `dist/{claude,codex,opencode}/`, `.claude/commands/`.
- Producao consome `@bugkillers/bkpilot-core v0.2.8` via GitHub — modelo de **consumo via dependência versionada** já validado.
- Node local: **v26.1.0**.

### B. Natureza do documento-fonte

- É um documento de **inversão de ordem** sobre o `Plano 30 Dias v3.2`. Mantém a arquitetura macro, muda completamente a ordem de execução.
- Combina elementos de **3 skills MAIA**: especificação (anagramas MOTOR/PILOTO/ESCALA, critérios de aceite por sprint), planejamento (ordem das sprints, ordem das skills), e arquitetura (separação Engine × Worker, contratos de manifesto).
- A **Pré-Sprint Técnica** é a única parte do documento com **definição operacional completa**:
  - Comando: `npm run execute -- --skill usability --input inputs/execution-local.json`
  - Input: JSON com `execution_id`, `target_url`, `language`, `skill`
  - Output: `outputs/local-001/{report.md, screenshot.png, execution-log.json, result.json}`
  - 8 capacidades obrigatórias (ler manifesto, abrir URL, coletar, screenshot, chamar LLM, gerar relatório, salvar logs, retornar status)
- **Demais sprints** têm critérios de aceite mas faltam detalhes operacionais — esperado, e correto: o doc é deliberadamente focado no motor.

### C. Lacunas do documento-fonte (não são defeitos, são pendências)

| Lacuna | Onde resolver | Quando |
|---|---|---|
| Duração de cada sprint (7 dias? 14?) | Decisão humana | Antes da Sprint 1 |
| Stack TS exata (target, módulos, lint, build, test) | `04-maia-arquitetura` | Passo 3 do roadmap MAIA |
| Schema formal do manifesto YAML | `02-maia-especificacao` | Passo 2 |
| Schema formal do `result.json` e `execution-log.json` | `02-maia-especificacao` | Passo 2 |
| Estratégia de tratamento de erro / códigos padronizados | `02-maia-especificacao` | Passo 2 |
| Como skills do Producao atual (`src/`) migram para o Engine | `04-maia-arquitetura` | Passo 3 |
| LLM real em produção (Papel C) | Decisão adiada | Sprint 3 |
| i18n no Engine (relatório PT/EN/ES) | Consultar doc 30 dias | Sprint 1 ou Sprint 3 conforme escopo |
| Multi-tenant / RLS / isolamento | Consultar doc 30 dias | Sprint 3 (SaaS Core) |
| Pré-Sprint 0 do doc anterior (Stripe, Auth, etc.) | Consultar doc 30 dias | Sprint 3 |

### D. Reaproveitamento do ecossistema atual

O documento-fonte **não menciona** o que reaproveitar do BKPilot-Core ou do Producao atual. Esta é uma **decisão pendente importante**:

- O `BKPilot-Core` atual já tem `mobile-appium-client.js`, `mobile-apk.js`, `mobile-device-manager.js`. Mobile NÃO está na primeira sprint (Usabilidade é web), mas pode ser referência de padrões.
- O Producao atual tem 27 skills slash em `.claude/commands/` e `src/`. Provavelmente a skill Usabilidade tem **prompt já escrito** que pode ser adaptado para o manifesto do Engine.

### E. Sinal forte de viabilidade

A separação Engine × Worker proposta no documento-fonte é **arquiteturalmente correta** e **operacionalmente factível**. Já temos prova de conceito do padrão (Producao consumindo Core como dep). Não há risco técnico nesta decisão.

---

## 3. Decisões Arquiteturais Registradas (ADRs)

Todas as decisões tomadas em conversa entre 2026-05-23 15:39 e 17:00 estão cravadas aqui como ADRs do projeto.

### ADR-001 — Repo separado para o Skill Runner

**Decisão:** Criar repositório novo independente chamado `BKPilot-SkillRunner`, localizado em `C:\Users\Jorge Alves\IA\Produto\BKPilot-SkillRunner\`.

**Alternativas consideradas:**
- Subdiretório do Producao atual → rejeitado por acoplamento involuntário.
- Monorepo (pnpm workspaces / Turborepo) → rejeitado por complexidade desnecessária na fase atual.

**Justificativa:**
1. O documento-fonte (seção 6) exige isolamento: "o motor pode ser testado sozinho, evoluído sozinho e integrado depois".
2. Permite consumo como dependência versionada (padrão já validado: Producao consome `@bugkillers/bkpilot-core`).
3. Producao atual tem propósito distinto e continua vivo.
4. Gate 0 exige isolamento real para ser honesto.
5. Reaproveitamento de skills do Producao fica explícito como contrato de transferência.

### ADR-002 — Linguagem: TypeScript sobre Node.js

**Decisão:** TypeScript.

**Justificativa:**
1. Documento-fonte (seção 9) já sugere `.ts`.
2. Skill Runner tem contratos críticos (manifesto, `result.json`, estados oficiais) que se beneficiam de tipos.
3. É produto comercial — TS reduz bugs de tipo em produção.
4. Padrão de mercado em 2026 para Backend Node sério.

**Implicações:**
- `tsconfig.json`, build pipeline, escolha entre `tsx`/`ts-node`/build-then-run.
- Backend Sênior contratado precisa ser confortável com TS.

### ADR-003 — Governança MAIA em todos os repos do projeto

**Decisão:** O Guardião MAIA atua em todos os repos do projeto BKPilot. Cada repo novo recebe:
- `HANDOFF.md` próprio (HANDOFF vivo do trabalho daquele repo)
- `docs/maia/` próprio (handoffs arquivados, registros das skills MAIA executadas)
- **Referência** ao `maia-skill-pack` que vive neste repo Producao (sem duplicação)

O Producao continua sendo o **hub MAIA central**, com índice cruzado dos HANDOFFs ativos em cada repo da família BKPilot.

### ADR-004 — Distribuição de LLMs por papel

**Decisão:** Três papéis distintos, cada um com sua matriz de ferramentas.

**Papel A — Construção de código:**
| Tarefa | CLI | LLM |
|---|---|---|
| Código TS novo | Codex CLI | GPT-5.3 Codex |
| Decisão arquitetural / refactor crítico | Cursor | Opus 4.7 |
| Análise macro de repo | Antigravity CLI | Gemini 3.1 Pro |
| Tarefas rápidas (rename, config) | Cursor | Composer 2.5 |
| Segunda opinião / confronto | Claude | deepseek-v4-pro (Ollama Cloud) |
| Análise de DOM gigante | Claude | kimi-k2.6 (Ollama Cloud) |

**Papel B — Guardião MAIA:**
| Skill MAIA | CLI | LLM |
|---|---|---|
| 01-diagnostico, 02-especificacao, 04-arquitetura, 08-review, 10-memoria | Cursor | Opus 4.7 |
| 03-planejamento, 09-release | Cursor | GPT-5.5 |
| 05-harness | Cursor | Composer 2.5 |
| 06-implementacao, 12-code-validator | Codex CLI | GPT-5.3 Codex |
| 07-qa-validacao | Codex CLI + Antigravity CLI | GPT-5.3 Codex + Gemini 3.1 Pro |
| 11-security | Claude | deepseek-v4-pro (Ollama Cloud) |

**Papel C — Runtime do produto em produção:**
- **Decisão adiada** para Sprint 3 (SaaS Core).
- Na Pré-Sprint Técnica + Sprint 1, o Engine usa **mock de LLM** ou **Opus 4.7 via Cursor** apenas para validar o motor.
- Decisão real depende de análise comercial/financeira a ser feita quando o SaaS Core começar.

**Justificativa geral:** O laboratório real tem 5 CLIs/IDEs (Cursor, Claude, Codex CLI, Antigravity CLI, OpenCode) e 17 LLMs. Aproveitar o que está pago e calibrar por força específica de cada modelo reduz custo e melhora qualidade.

#### Emenda 2026-05-23 (Guardião MAIA) — separação autor≠validador no Engine

A regra **"a LLM que escreve o código não testa nem valida o próprio código"** conflita com o Papel B acima: `06-implementacao` e `12-code-validator` usavam **ambos** Codex CLI + GPT-5.3 Codex, e o `07-qa-validacao` também incluía GPT-5.3 Codex como executor. Como **100% da implementação do BKPilot-SkillRunner vem do `06` (Codex/GPT-5.3)**, o validador estaria validando o próprio código — violação da regra.

**Correção (vale para o BKPilot-SkillRunner):** o validador do Engine **nunca** pode ser Codex/GPT-5.3 Codex.

| Skill MAIA | CLI | LLM | Substitui |
|---|---|---|---|
| 06-implementacao | Codex CLI | GPT-5.3 Codex | *(inalterado)* |
| 12-code-validator | Antigravity CLI | **Gemini 3.1 Pro** | era Codex/GPT-5.3 |
| 07-qa-validacao | Ollama (executor) + Antigravity (cobertura) | **deepseek-v4-pro** executa/escreve testes + **Gemini 3.1 Pro** cobertura | era GPT-5.3 Codex + Gemini |

**Backstop:** o Guardião (Claude + Opus 4.7) roda um smoke independente (`typecheck`/`lint`/`build`/`test`) a cada entrega de implementação — vendor distinto do Codex.

**Justificativa:** garante independência autor≠validador. deepseek-v4-pro e Gemini 3.1 Pro são vendors distintos do Codex/GPT-5.3. Decisão do owner em 2026-05-23.

### ADR-005 — Skill Usabilidade primeiro, sozinha, no Gate 0

**Decisão:** A Pré-Sprint Técnica entrega **apenas Usabilidade**. LGPD e Regressão só entram depois de Usabilidade estar **perfeita** (paridade ≥ 95% vs Claude Code, segundo critério herdado do doc 30 dias).

**Justificativa:** Reduz risco da Sprint 3 do doc original (que tentava 3 skills em paralelo). Validar 1 skill end-to-end antes de replicar é princípio defensivo do documento-fonte.

### ADR-006 — Engine ≠ Worker

**Decisão:** Skill Runner Engine (motor puro, local, sem SaaS) é **artefato separado** do Worker SaaS (operador do motor dentro do produto). Engine pode ser publicado e consumido como dependência.

**Justificativa:** Documento-fonte seção 6. Permite testes isolados, evolução independente, e versionamento próprio.

### ADR-007 — Decisão de LLM em produção (Papel C) é adiada

**Decisão:** Não decidir agora qual LLM o Skill Runner chamará em produção. Mock ou Opus 4.7 via Cursor durante Pré-Sprint Técnica e Sprint 1. Decisão real entra na Sprint 3.

**Justificativa:** Evita decisão prematura com impacto comercial/financeiro. O LLM Gateway (LiteLLM) abstrai isso — escolha do provider é configuração, não código.

---

## 4. Riscos

| # | Risco | Gravidade | Categoria | Mitigação |
|---|---|---|---|---|
| R1 | Pré-Sprint Técnica sem prazo definido pode arrastar indefinidamente | ALTA | Operacional | Definir teto de 5-7 dias úteis. Se não passar no Gate 0 no prazo, replanejar antes de seguir. |
| R2 | Doc-fonte não detalha schema formal do manifesto/result.json | MÉDIA | Técnico | Resolver em `02-maia-especificacao` (Passo 2 do roadmap MAIA). |
| R3 | Reaproveitamento de skills do Producao atual não está especificado | MÉDIA | Técnico | Resolver em `04-maia-arquitetura` (Passo 3). Mapear quais prompts/templates do Producao migram. |
| R4 | Decisão de LLM em produção (Papel C) adiada — pode virar bloqueio na Sprint 3 | MÉDIA | Comercial | Aceitar agora, criar nota recorrente para revisitar no início da Sprint 3. |
| R5 | Equipe (Backend Sr, Frontend, DevOps/QA) ainda não contratada conforme doc 30 dias | ALTA | Pessoas | Resolver no Pré-Sprint 0 do doc 30 dias. Para a Pré-Sprint Técnica, viável que Jorge + Guardião MAIA executem sozinhos. |
| R6 | Gate 0 sem critério mensurável de "qualidade do relatório" | MÉDIA | Qualidade | Definir em `02-maia-especificacao`: comparação lado a lado vs Claude Code, percentual de paridade aceitável, métricas. |
| R7 | i18n adiado pode virar refactor caro depois | BAIXA | Técnico | Aceitar agora — Engine isolado em PT-BR é suficiente para Gate 0. i18n volta em Sprint 3. |
| R8 | Mock de LLM pode mascarar problemas reais do Engine | BAIXA | Técnico | Usar mock só na fase de fluxo. Para validar qualidade do relatório (Gate 0), usar LLM real (Opus 4.7 via Cursor). |
| R9 | "30 dias" do nome do doc-fonte pode virar pressão indevida | MÉDIA | Comunicação | Comunicar à gestão: "30 dias é alvo, não promessa. Plano de contingência de +7 a +15 dias está embutido no documento original." |

---

## 5. Checklist de conclusão do diagnóstico

- [x] Documento-fonte lido integralmente (924 linhas)
- [x] Documento de apoio (30 dias v3.2) consultado pontualmente
- [x] Estado atual do hub MAIA verificado (estado limpo, sem bloqueadores)
- [x] Lacunas do doc-fonte mapeadas e endereçadas ao passo MAIA correto
- [x] Decisões arquiteturais cravadas como ADRs (001 a 007)
- [x] Riscos identificados, classificados e mitigações propostas
- [x] HANDOFF anterior arquivado em `docs/maia/handoffs/HANDOFF-2026-05-23-fechamento-ciclos-7-8.md`
- [x] Novo HANDOFF a ser gravado neste mesmo ciclo
- [ ] **Pendente humano:** confirmar duração da Pré-Sprint Técnica (sugestão: 5-7 dias úteis)
- [ ] **Pendente humano:** decidir se cria o repo `BKPilot-SkillRunner` no GitHub manualmente ou se o Guardião MAIA assiste a criação local

---

## 6. Decisão final

```text
APROVADO COM RESSALVAS
```

**Justificativa:**

- **APROVADO** porque: o escopo é claro, a arquitetura é sólida, as decisões críticas foram cravadas como ADRs, o estado do hub MAIA está limpo, e o caminho para o Gate 0 é executável.

- **COM RESSALVAS** porque: existem 2 pendências humanas (prazo da Pré-Sprint Técnica e modo de criação do repo) e 9 riscos registrados que precisam ser endereçados nas próximas skills MAIA (especificação, arquitetura, harness). Nenhuma ressalva é bloqueador para começar — todas têm endereço claro no roadmap.

---

## 7. Próxima skill recomendada

**`02-maia-especificacao`** — transformar a Pré-Sprint Técnica do documento-fonte em requisitos formalmente verificáveis.

Saídas esperadas da próxima skill:
- Schema formal do manifesto YAML da skill
- Schema formal do `result.json` e `execution-log.json`
- Definição operacional do Gate 0 (critério mensurável de paridade)
- Códigos de erro padronizados
- Definição operacional de cada uma das 8 capacidades obrigatórias listadas no doc-fonte
- Critérios de aceite testáveis para cada capacidade

Depois disso:
- **Passo 3:** `04-maia-arquitetura` (decidir stack TS detalhada, estrutura de pastas, reaproveitamento do Producao)
- **Passo 4:** `05-maia-harness` (criar o repo `BKPilot-SkillRunner` com MAIA instalado)
- **Passo 5:** `03-maia-planejamento` (quebra fina da Pré-Sprint Técnica)
- **Passo 6:** `06-maia-implementacao` (codar com Codex CLI / GPT-5.3 Codex)

---

## 8. Roadmap MAIA do novo ciclo (visão consolidada)

```text
[CONCLUÍDO]   01-maia-diagnostico                  ← este documento
[PRÓXIMO]     02-maia-especificacao                 ← formaliza Pré-Sprint Técnica
              04-maia-arquitetura                   ← stack TS + estrutura + reaproveitamento
              05-maia-harness                       ← cria repo BKPilot-SkillRunner
              03-maia-planejamento                  ← quebra Pré-Sprint Técnica em tarefas
              06-maia-implementacao                 ← codar até Gate 0
              12-maia-code-validator                ← validar código
              07-maia-qa-validacao                  ← validar Gate 0
              08-maia-review                        ← review do Gate 0
              10-maia-memoria                       ← registrar e abrir Sprint 1
              [Sprint 1: Engine real]
              [Sprint 2: Worker + Fila]
              11-maia-security                      ← entra na transição para Sprint 3
              [Sprint 3: SaaS Core]
              [Sprint 4: Operação + Piloto]
              09-maia-release                       ← go-live do piloto
```

---

## 9. Saída literal MAIA

```text
Skill:              01-maia-diagnostico (escopo Skill Runner)
Decisão final:      APROVADO COM RESSALVAS
Próxima skill:      02-maia-especificacao
Bloqueadores:       Nenhum
Pendências humanas: prazo Pré-Sprint Técnica, modo de criação do repo
Riscos registrados: R1 a R9 (1 ALTA pessoas, 1 ALTA operacional, 5 MÉDIA, 2 BAIXA)
ADRs cravados:      001 a 007
HANDOFF.md:         será gravado na sequência deste documento
Artefatos gerados:  diagnostico-2026-05-23-skillrunner.md + novo HANDOFF.md
```

---

**Fim do diagnóstico.**
