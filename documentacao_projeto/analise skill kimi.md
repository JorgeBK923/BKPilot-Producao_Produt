# Análise das Skills do Projeto BugKillers QA

## 1. Visão Geral por Categoria

O projeto possui **19 skills** (slash commands) definidos em `.claude/commands/`, organizados em um pipeline completo de QA automatizado com Playwright MCP.

### 🔍 Descoberta & Mapeamento

| Skill | Função | Gate Check |
|-------|--------|------------|
| `/explorar` | Mapeia todo o sistema: páginas, fluxos, elementos, APIs, modais, wizards | ✅ 4 fases com portões obrigatórios e ficha de cobertura 100% |
| `/gerar-cenarios` | Gera planilha de cenários BDD/Gherkin com análise de risco | ✅ 6 fases com perfil_risco.md + ficha de risco 100% |

### 🧪 Execução de Testes

| Skill | Função | Modo |
|-------|--------|------|
| `/executar-planilha` | Execução em lote de cenários .xlsx/csv | Circuit breaker, retry, agrupamento por URL |
| `/executar-fluxo` | Fluxo E2E descrito em linguagem natural | Data-driven com `--dados` |
| `/testar-modulo` | Híbrido: roteiro (Etapa A) + exploração livre (Etapa B) | Acessibilidade, mobile 375px, throttle 3G, memory leak |
| `/testar-forms` | Especialista em formulários | 13 grupos de testes (XSS, SQLi, wizard, upload, JS off) |
| `/testar-ia` | Teste de IA conversacional | 7 categorias de risco, validação semântica por regex, reteste de ambiente |

### 🔬 Especialistas (Não-funcionais)

| Skill | Função | Cobertura |
|-------|--------|-----------|
| `/performance` | Core Web Vitals (LCP, FCP, CLS, TTFB, INP) | Throttle 3G/4G/WiFi, waterfall de rede, score 0-100 |
| `/usabilidade` | Avaliação heurística de Nielsen | 10 heurísticas, eficiência de fluxos, quick wins |
| `/acessibilidade` | Auditoria WCAG 2.1 (A/AA/AAA) | Contraste, ARIA, teclado, alt text, headings, screen reader |

### 🔄 Regressão & Consolidação

| Skill | Função | Destaque |
|-------|--------|----------|
| `/regressao` | Reteste de bugs corrigidos | 3 modos (planilha, bugs externos, combinado), visual diff, ingestão Jira Excel/Word/XML |
| `/reportar-bug` | Gera bug cards BugKillers | Deduplicação, análise de causa raiz, classificação severidade/frequência |
| `/push-bugs` | Exporta bugs para Jira/GitHub/CSV | Nunca expõe tokens inline (BLOCK-F) |
| `/api-check` | Testes de API automáticos | Auth bypass, IDOR, mass assignment, rate limiting, CORS, headers de segurança |

### 🎯 Planejamento & Consultoria

| Skill | Função | Destaque |
|-------|--------|----------|
| `/plano-automacao` | Consultoria embarcada para automação de testes | Análise de viabilidade técnica, estimativa de horas/custo, matriz de prioridade (Quick Wins vs Core), veredito de viabilidade com bloqueadores. **Regra: todo `.md` destinado ao cliente deve ter PDF correspondente** |
| `/gerar-automacao-cliente` | Gera pacote de automacao exportavel no stack do cliente | Especificacao intermediaria, codigo em `clients/<id>/entregaveis/automacao/<stack>/`, cobertura, rastreabilidade e PDFs dos `.md` de cliente |
| `/auditar-automacao-cliente` | Auditoria independente do pacote gerado | Segregacao obrigatoria, remediacao de defeitos tecnicos corrigiveis, revalidacao, parecer independente e PDFs dos `.md` de cliente |

### 📊 Relatórios

| Skill | Função | Formato |
|-------|--------|---------|
| `/gerar-relatorio` | Relatório final para cliente | PDF/PPTX/DOCX com gráficos, tendência, cobertura vs risco |
| `/relatorio-parcial` | Acompanhamento semanal | PDF com semáforo 🟢🟡🔴, projeção de conclusão |

---

## 2. Arquitetura & Padrões Identificados

### Estrutura de Diretórios

```
estado/                    ← Artefatos de /explorar (imutáveis durante o ciclo)
  mapa.md, fluxos.md, elementos.json, api_endpoints.json, screenshots/

resultado/<timestamp>/     ← Outputs de cada execução
  *.md, *.json, videos/, screenshots/, graficos/

resultado/latest → symlink para o timestamp mais recente

cenarios/
  cenarios.xlsx            ← Source of truth (atualizada in-place)
  perfil_risco.md          ← Análise de risco do sistema
```

### Regras Transversais (Presentes em TODAS as skills)

1. **Evidência Visual Obrigatória** — Screenshot PNG ou vídeo MP4 por cenário. Sem arquivo em disco = não conta.
2. **Segurança (BLOCK-B/C/D/E/F)** — Senha via `.env` (`QA_PASSWORD`), nunca inline. Tokens do Jira/GitHub também via `.env`.
3. **Monitoramento** — `console_log.json` (erros/warnings) e `network_log.json` (≥400, >3s) em toda execução.
4. **Re-autenticação** — Detecta 401/403/redirect para login e re-autentica automaticamente.
5. **Video** — `recordVideo` (camelCase, não snake_case) + conversão ffmpeg webm→mp4.
6. **Cleanup** — Dados criados em testes devem ser revertidos; pendentes registrados em `cleanup_log.json`.
7. **Timestamps** — `YYYY-MM-DD_HHMM` padronizado.

### Portões Obrigatórios (Gate Checks)

- `/explorar` — Fase 4 com ficha de cobertura 100% verde antes do resumo.
- `/gerar-cenarios` — Fase 6 com ficha de risco 100% justificada.
- `/regressao` — Todos os bugs retestados com screenshot obrigatório.

---

## 3. Análise de Qualidade das Skills

### ✅ Pontos Fortes

| Aspecto | Avaliação |
|---------|-----------|
| **Cobertura de QA** | Pipeline completo: exploração → cenários → execução → especialistas → regressão → relatório |
| **Segurança** | Múltiplos blocks (B-F), proibição explícita de credenciais inline, `.env` gitignored |
| **Especialização** | Skills dedicadas para IA, forms, API, performance, acessibilidade, usabilidade |
| **Rastreabilidade** | Cada cenário tem origem (fluxos.md, formulário, bug, endpoint, Segunda Passada) |
| **Data-driven** | Suporte a JSON de dados, planilhas parametrizadas, massa de dados realista para IA |
| **Anti-regressão** | Regra de massa de dados realista (`pergunta: "..."`) evita falsos positivos de IA |
| **Deduplicação** | `/reportar-bug` evita duplicatas contra bugs anteriores |
| **Encadeamento** | Cada skill indica "Encadeia para" próximo passo natural |

### ⚠️ Oportunidades de Melhoria / Riscos

| # | Problema | Impacto | Sugestão |
|---|----------|---------|----------|
| 1 | **Dependência de ffmpeg** — Skills assumem ffmpeg instalado; fallback é manter `.webm` | Em Windows pode faltar ffmpeg; `.webm` nem sempre é aceito como evidência | Incluir verificação de ffmpeg no `setup.sh` e documentar fallback claro |
| 2 | **Muitas fases com portões** — `/explorar` (4 fases) e `/gerar-cenarios` (6 fases) são muito longos | Risco de timeout ou interrupção do agente antes do portão final | Adicionar checkpoints intermediários que salvam estado |
| 3 | **Planilha in-place** — Atualiza `.xlsx` original com backup `.bak` | Se falhar no meio, pode corromper a planilha | Usar transação (salvar em `.tmp`, renomear ao final) |
| 4 | **Validação semântica de IA por regex** — `/testar-ia` usa regex simples para classificar respostas | Pode gerar falsos positivos/negativos em linguagem natural | Escalar para LLM-as-judge (já mencionado como v2) |
| 5 | **Ausência de skill de smoke test** | Não há uma skill rápida "health check" antes do pipeline completo | Criar `/smoke` para validar ambiente, credenciais e conectividade |
| 6 | **Sobrecarga de evidência visual** — Screenshot/vídeo obrigatório por **cada** passo | Em planilhas grandes (100+ cenários), volume de dados pode explodir | Permitir `--evidencia minima` (screenshot só em falha) para execuções de regressão |
| 7 | **Claude-specific** — Skills usam `CLAUDE.md` e terminologia de blocks | Se migrar para outra plataforma (GLM, GPT), precisa adaptar | Generalizar nome dos blocks para `QA_RULES.md` |

---

## 4. Matriz de Dependências entre Skills

```
/explorar ─┬─► /gerar-cenarios ─┬─► /executar-planilha ─┬─► /reportar-bug ─┬─► /gerar-relatorio
           │                    │                       │                  │
           │                    ├─► /testar-modulo ─────┘                  │
           │                    │                       │                  │
           │                    ├─► /executar-fluxo ────┘                  │
           │                    │                       │                  │
           │                    └─► /testar-forms ──────┘                  │
           │                                            │                  │
           ├─► /performance ────────────────────────────┘                  │
           ├─► /usabilidade ────────────────────────────┘                  │
           ├─► /acessibilidade ─────────────────────────┘                  │
           ├─► /api-check ──────────────────────────────┘                  │
           │                                                               │
           ├─► /testar-ia ──────────────────────────────┘                  │
           │                                                               │
           └─► /regressao ─────────────────────────────► /push-bugs ───────┘
```

---

## 5. Resumo Executivo

O projeto BugKillers QA apresenta um **pipeline de QA extremamente maduro e bem documentado**, com 17 skills cobrindo desde o mapeamento inicial até a entrega de relatórios ao cliente. Os pontos mais fortes são:

1. **Governança rigorosa** — Portões obrigatórios, evidência em disco, regras de honestidade.
2. **Segurança by design** — Nenhuma credencial inline, múltiplos blocks de proteção.
3. **Especialização profunda** — Skills dedicadas para IA, forms, API, performance, a11y.
4. **Rastreabilidade total** — Cada cenário sabe de onde veio (mapa, bug, endpoint, exploração).

As principais oportunidades estão em: **resiliência do pipeline** (checkpoints, transações), **eficiência de armazenamento** (modo de evidência mínima) e **generalização** (reduzir dependência do ecossistema Claude).

---

## 6. Detalhamento das Skills

### `/explorar` — Mapeamento do Sistema Alvo
- **Arquivo:** `.claude/commands/explorar.md`
- **Descrição:** Mapeia o sistema alvo por completo. Navega por todas as páginas acessíveis, abre modais e wizards, ativa abas, identifica elementos interativos, detecta fluxos, captura console errors, monitora rede, detecta endpoints de API e tira screenshots de cada tela.
- **Gate Check:** Fase 4 com ficha de cobertura 100% verde.
- **Artefatos:** `clients/<id>/estado/mapa.md`, `clients/<id>/estado/fluxos.md`, `clients/<id>/estado/elementos.json`, `clients/<id>/estado/api_endpoints.json`, `clients/<id>/resultado/<timestamp>/cobertura.md`

### `/gerar-cenarios` — Geração de Cenários BDD/Gherkin
- **Arquivo:** `.claude/commands/gerar-cenarios.md`
- **Descrição:** Gera cenários de teste a partir dos artefatos da skill `/explorar`. Executa em 6 fases com portões obrigatórios.
- **Gate Check:** Fase 6 com ficha de risco 100% justificada.
- **Artefatos:** `cenarios/perfil_risco.md`, `cenarios/ficha_risco_<timestamp>.md`, `cenarios/cenarios_<timestamp>.xlsx`

### `/executar-planilha` — Execução em Lote por Planilha
- **Arquivo:** `.claude/commands/executar-planilha.md`
- **Descrição:** Executa cenários de teste em lote a partir de uma planilha `.xlsx` ou `.csv`.
- **Features:** Circuit breaker, retry, agrupamento por URL, monitoramento de console/rede.
- **Artefatos:** Planilha atualizada in-place (com backup `.bak`), `clients/<id>/resultado/<timestamp>/planilha_<timestamp>.md`

### `/executar-fluxo` — Execução de Fluxo E2E
- **Arquivo:** `.claude/commands/executar-fluxo.md`
- **Descrição:** Executa um fluxo de ponta a ponta descrito em linguagem natural.
- **Features:** Data-driven testing, monitoramento de console/rede, cleanup de dados.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/fluxo_<timestamp>.md`, vídeo MP4, screenshots

### `/testar-modulo` — Teste Completo de Módulo
- **Arquivo:** `.claude/commands/testar-modulo.md`
- **Descrição:** Skill híbrida que combina execução de roteiro + exploração livre.
- **Etapa A:** Execução dos cenários da planilha para o módulo especificado.
- **Etapa B:** Exploração livre restrita ao módulo (acessibilidade, mobile 375px, throttle 3G, memory leak).
- **Artefatos:** `clients/<id>/resultado/<timestamp>/modulo_<timestamp>.md`, vídeos, screenshots

### `/testar-forms` — Teste de Formulários
- **Arquivo:** `.claude/commands/testar-forms.md`
- **Descrição:** Especialista em formulários. Identifica todos os campos e executa bateria completa de testes.
- **Grupos de teste:** 13 (dados válidos, campos vazios, dados inválidos, limites, caracteres especiais, upload, wizard, autocomplete, i18n, persistência, segurança expandida, JS desabilitado).
- **Artefatos:** `clients/<id>/resultado/<timestamp>/forms_<timestamp>.md`, vídeo MP4, screenshots

### `/testar-ia` — Teste Especializado de IA Conversacional
- **Arquivo:** `.claude/commands/testar-ia.md`
- **Descrição:** Skill dedicada ao teste de sistemas de IA conversacional.
- **Categorias de risco:** F. Core, Guardrails, Permissões, Robustez, UX, Histórico, Performance.
- **Features:** Biblioteca adversarial reutilizável, chat cleanup automático, validação semântica por regex, reteste de ambiente.
- **Artefatos:** `cenarios/cenarios_ia_<timestamp>.xlsx`, `clients/<id>/resultado/<timestamp>/ia_placar_consolidado.md`, `clients/<id>/resultado/<timestamp>/ia_auditoria_pendente.md`

### `/performance` — Análise de Performance e Core Web Vitals
- **Arquivo:** `.claude/commands/performance.md`
- **Descrição:** Mede Core Web Vitals (LCP, FCP, CLS, TTFB, INP), analisa recursos pesados, gera waterfall de rede.
- **Features:** Throttle de rede (3G, 4G, WiFi), score de performance por página.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/performance_<timestamp>.md`, screenshots, logs

### `/usabilidade` — Avaliação Heurística de Usabilidade
- **Arquivo:** `.claude/commands/usabilidade.md`
- **Descrição:** Avaliação completa baseada nas 10 heurísticas de Nielsen.
- **Features:** Análise de eficiência de fluxos, consistência de UI, feedback visual, UX de formulários, UX de erros e navegação.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/usabilidade_<timestamp>.md`, vídeo MP4, screenshots

### `/acessibilidade` — Auditoria de Acessibilidade WCAG
- **Arquivo:** `.claude/commands/acessibilidade.md`
- **Descrição:** Auditoria completa baseada nas diretrizes WCAG 2.1 (níveis A, AA e AAA).
- **Cobertura:** Contraste de cores, atributos ARIA, navegação por teclado, textos alternativos, labels de formulário, hierarquia de headings, compatibilidade com screen readers.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/acessibilidade_<timestamp>.md`, screenshots

### `/regressao` — Teste de Regressão
- **Arquivo:** `.claude/commands/regressao.md`
- **Descrição:** Retesta bugs corrigidos e verifica se as correções introduziram regressões.
- **Modos:** Planilha, Bugs Externos (Jira Excel/Word/XML), Combinado.
- **Features:** Visual diff, evidências visuais obrigatórias, ingestão de exportações Jira.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/regressao_<timestamp>.md`, vídeos, screenshots, evidências anteriores

### `/reportar-bug` — Geração de Bug Cards
- **Arquivo:** `.claude/commands/reportar-bug.md`
- **Descrição:** Transforma erros encontrados em bug cards completos no padrão BugKillers.
- **Features:** Deduplicação contra bugs anteriores, análise de causa raiz, classificação de severidade e frequência.
- **Artefatos:** `clients/<id>/resultado/latest/bugs_<timestamp>.md`

### `/push-bugs` — Enviar Bugs para Issue Tracker
- **Arquivo:** `.claude/commands/push-bugs.md`
- **Descrição:** Envia bug cards para Jira Cloud, GitHub Issues ou exporta CSV.
- **Segurança:** Nunca expõe tokens inline (BLOCK-F).
- **Artefatos:** `clients/<id>/resultado/latest/push_bugs_<timestamp>.json`, `clients/<id>/resultado/latest/bugs_<timestamp>.csv`

### `/api-check` — Testes de API
- **Arquivo:** `.claude/commands/api-check.md`
- **Descrição:** Testa endpoints de API automaticamente.
- **Cobertura:** Status code, autenticação, payloads inválidos, tempo de resposta, SQL injection, path traversal, SSRF, header injection, mass assignment, rate limiting, CORS, headers de segurança.
- **Artefatos:** `clients/<id>/resultado/<timestamp>/api-check_<timestamp>.md`

### `/gerar-relatorio` — Relatório Final para o Cliente
- **Arquivo:** `.claude/commands/gerar-relatorio.md`
- **Descrição:** Consolida todos os resultados do pipeline em relatório final profissional.
- **Formatos:** PDF, PPTX, DOCX.
- **Features:** Métricas, bugs, evidências, gráficos, análise de tendência, cobertura vs. risco, parecer técnico.
- **Artefatos:** `clients/<id>/resultado/latest/relatorio_<timestamp>.pdf` (ou .pptx / .docx)

### `/plano-automacao` — Plano Estratégico de Automacao de Testes
- **Arquivo:** `.claude/commands/plano-automacao.md`
- **Descrição:** Consultoria embarcada que analisa um sistema web e gera um Plano Estratégico de Automacao completo. Avalia viabilidade tecnica antes de qualquer investimento.
- **Fases:** Mapeamento do sistema, avaliacao de automatizabilidade (score 0-100), matriz de prioridade (Valor x Facilidade), estimativa de horas/custo, veredito de viabilidade (Viavel/Parcialmente Viavel/Nao Viavel), plano de execucao por fases (Quick Wins → Core → Ampliacao).
- **Features:** Score tecnico por modulo (IDs, data-testid, estabilidade, dados, ambiente), multiplicadores de risco, calculo de ROI e payback, identificacao de bloqueadores criticos. **Regra obrigatoria: todo `.md` destinado ao cliente deve ter PDF correspondente.**
- **Artefatos:** `clients/<id>/clients/<id>/resultado/<timestamp>/automacao_plano_<timestamp>.md` **+ `.pdf`**, `clients/<id>/clients/<id>/resultado/<timestamp>/automacao_estimativa_<timestamp>.md` **+ `.pdf`** (ou `.xlsx`), `clients/<id>/clients/<id>/resultado/<timestamp>/automacao_viabilidade_<timestamp>.md` **+ `.pdf`**

### `/gerar-automacao-cliente` — Geracao de Codigo de Automacao para Entrega ao Cliente
- **Arquivo:** `.claude/commands/gerar-automacao-cliente.md`
- **Descricao:** Transforma artefatos de QA em um pacote de automacao exportavel no stack escolhido pelo cliente.
- **Features:** Especificacao intermediaria obrigatoria, mapeamento cenario -> arquivo, cobertura implementada/parcial/nao automatizada, pendencias, auditoria tecnica da geracao e PDF correspondente para cada `.md` destinado ao cliente.
- **Artefatos:** `clients/<id>/entregaveis/automacao/<stack>/especificacao_automacao.json`, `codigo/`, `mapeamento_cenarios.md/.pdf`, `cobertura_automacao.md/.pdf`, `auditoria_codigo.md/.pdf`, `resumo_geracao.md/.pdf`

### `/auditar-automacao-cliente` — Auditoria Independente de Codigo de Automacao do Cliente
- **Arquivo:** `.claude/commands/auditar-automacao-cliente.md`
- **Descricao:** Audita independentemente o pacote gerado, impedindo autoaprovacao, corrigindo defeitos tecnicos objetivos e validando se o codigo reduz retrabalho real.
- **Features:** Bloqueio quando segregacao nao puder ser comprovada, remediacao obrigatoria de falhas corrigiveis, revalidacoes por stack, cruzamento entre especificacao, mapa, inventario, auditoria tecnica e cobertura.
- **Artefatos:** `<pacote>/auditoria_independente.md/.pdf`, `<pacote>/correcoes_auditoria.md/.pdf` quando houver correcao ou pendencia tecnica, e `clients/<id>/clients/<id>/resultado/<timestamp>/governanca/auditoria_interna_<cliente>_<stack>.md` quando houver metadados internos ou bloqueio de governanca

### `/relatorio-parcial` — Relatório Parcial de Acompanhamento
- **Arquivo:** `.claude/commands/relatorio-parcial.md`
- **Descrição:** Gera relatório parcial em PDF para envio ao cliente durante a execução do projeto.
- **Features:** Progresso geral, bugs críticos, riscos, bloqueios, próximos passos, semáforo 🟢🟡🔴.
- **Artefatos:** `clients/<id>/resultado/latest/parcial_semana<n>_<timestamp>.pdf`, `clients/<id>/resultado/parciais_index.json`

---

*Análise gerada em: 2026-04-23*
