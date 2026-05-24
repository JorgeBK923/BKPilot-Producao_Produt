# Diagnóstico MAIA — 2026-05-23

**Skill:** `01-maia-diagnostico`
**Executor:** Guardião MAIA (Claude / Cursor CLI)
**Projeto:** BKPilot-Producao_Produt
**HANDOFF analisado:** `docs/maia/handoffs/HANDOFF-2026-05-15-ciclo7-codex-remediacao.md` (arquivado neste ciclo)

---

## 1. Resumo executivo

O repositório é o **BKPilot-Producao** (BugKillers QA Agent — Claude Code + Playwright MCP, 27 comandos slash, com fatia mobile via Appium MCP). Está em arquitetura híbrida: o runtime compartilhado vive no **BKPilot-Core** (consumido como dependência GitHub `@bugkillers/bkpilot-core`), e este repo mantém apenas wrappers, skills operacionais e clientes.

O `HANDOFF.md` analisado descrevia o **Ciclo 7 — Remediação QA** (R3: `FormData/Blob` em Node<21; R5: falha de redação de screenshot), com destino Codex CLI. Porém, o estado do repo **diverge** do que o HANDOFF descreve: o `package.json` já está em `@bugkillers/bkpilot-core v0.2.8` (o Ciclo 7 previa bump para `v0.2.6`), o que sugere que **Ciclo 7 e Ciclo 8 já foram executados** no Core, mas o HANDOFF deste repo **não foi atualizado** após esses ciclos.

---

## 2. Achados principais

### A. Estado do repositório
- Stack: Node.js (CommonJS), Claude Code + Playwright MCP, distribuição multi-CLI (`dist/claude`, `dist/codex`, `dist/opencode`) via `converter/render.js`.
- Multi-tenant: clientes isolados em `clients/<id>/` com `.env`, `config.json`, `login.js`, `flows/`, `cenarios/`, `resultado/`, `entregaveis/`.
- Arquitetura Producao/Core declarada em `docs/Arquitetura Producao Core.md` e no README.
- Node.js local: **v26.1.0** (acima do mínimo do HANDOFF e do limite do bug R3).

### B. HANDOFF desatualizado vs. realidade
- HANDOFF pedia bump Core para **v0.2.6** (Ciclo 7).
- `package.json` aponta para **v0.2.8**.
- Implicação: os Ciclos 7 (R3+R5) e Ciclo 8 (R1/R2/R4/R6/R7/R8) provavelmente já foram concluídos no Core, mas o HANDOFF deste repo não registrou o avanço.

### C. Documentação MAIA ausente neste repo (antes deste ciclo)
- HANDOFF referenciava 4+ documentos críticos em `docs/maia/07-qa-validacao/*` e `docs/maia/06-implementacao/*`.
- Nenhum existia. `docs/maia/` foi **criada neste ciclo** para destravar a rastreabilidade.

### D. Arquivos R3/R5 não estão neste repo (esperado)
- `scripts/lib/mobile-apk.js` e `scripts/lib/mobile-appium-client.js` existem mas **não contêm** `FormData`/`Blob` nem `redactPng`/`SCREENSHOT_REDACTION_FAILED`.
- Confirma a arquitetura: lógica real está no **BKPilot-Core**. As correções R3/R5 não se aplicam a este repo, e sim ao Core.

### E. Sinais positivos
- `.env.example` presente; `.env` versionado não detectado.
- `.gitignore` presente.
- Pacote MAIA completo (12 skills + README + HANDOFF_TEMPLATE) disponível em `docs/maia-skill-pack/`.
- README detalhado e atualizado (v2.2, abril/2026).
- Estrutura multi-tenant disciplinada.

### F. Pontos de atenção menores
- `package.json` campo `test` é `echo "Error: no test specified" && exit 1` — Etapa 3 do HANDOFF exigia `npm test`, mas este repo **não tem suíte**. Os testes vivem no Core.
- `auditoria Skill versao 1.0.md` e `pontos de atenção para IA.md` estavam na raiz — movidos neste ciclo para `docs/`.

---

## 3. Riscos

| # | Risco | Gravidade | Tipo |
|---|---|---|---|
| D1 | HANDOFF defasado vs. estado real → próxima IA pode re-executar Ciclo 7 já concluído | ALTA | Bloqueador |
| D2 | HANDOFF referencia artefatos MAIA inexistentes → rastreabilidade quebrada | ALTA | Bloqueador |
| D3 | Ambiguidade Producao × Core para o próximo ciclo | ALTA | Bloqueador |
| D4 | Sem histórico local de ciclos anteriores | MÉDIA | Pendência |
| D5 | `package.json` sem suíte de testes própria do Producao | MÉDIA | Pendência |
| D6 | `.md` soltos na raiz fora do harness MAIA | BAIXA | Pendência (resolvida neste ciclo) |

Nenhum risco crítico de segurança identificado nesta varredura inicial. **Não substitui `11-maia-security`.**

---

## 4. Checklist de conclusão

- [x] Estrutura do repo mapeada
- [x] `HANDOFF.md` lido integralmente
- [x] `README.md` lido integralmente
- [x] `package.json` lido
- [x] Existência de artefatos referenciados pelo HANDOFF verificada (`docs/maia/...` → não existia)
- [x] Versão do Core no `package.json` confrontada com HANDOFF (`v0.2.8` vs. `v0.2.6` esperado)
- [x] Arquivos R3/R5 verificados localmente (não contêm os símbolos — confirma que correção é no Core)
- [x] Node version confirmada (v26.1.0)
- [x] Estrutura `docs/maia/` criada e populada
- [x] HANDOFF antigo arquivado em `docs/maia/handoffs/`
- [x] `.md` soltos da raiz movidos para `docs/`
- [ ] **Pendente humano:** confirmar Ciclos 7 e 8 concluídos no Core
- [ ] **Pendente humano:** confirmar localização dos artefatos `docs/maia/07-qa-validacao/*`
- [ ] **Pendente humano:** definir próximo escopo (Producao × Core)

---

## 5. Decisão final

```text
BLOQUEADO
```

Justificativa: o HANDOFF analisado estava em estado inconsistente com a realidade do repositório e referenciava artefatos inexistentes. Pela regra inviolável do MAIA, não se avança sem evidência.

A reconciliação estrutural (criar `docs/maia/`, arquivar HANDOFF antigo, gravar novo HANDOFF de reconciliação) foi executada neste ciclo. As 3 decisões humanas pendentes seguem registradas no novo `HANDOFF.md` (seção 3).

---

## 6. Próxima skill recomendada

`10-maia-memoria` — para registrar oficialmente o estado real dos Ciclos 7 e 8 (após confirmação humana) e/ou indexar apontando para artefatos no Core.

Depois disso:
- Se houver nova demanda funcional → `02-maia-especificacao`.
- Se for evolução técnica do Producao → `04-maia-arquitetura`.
- Se for retomar trabalho no Core → mover o ciclo para o repo Core.

---

## 7. Ações já aplicadas neste ciclo

| Ação | Origem | Destino |
|---|---|---|
| Arquivar HANDOFF antigo | `HANDOFF.md` (raiz) | `docs/maia/handoffs/HANDOFF-2026-05-15-ciclo7-codex-remediacao.md` |
| Mover doc solto | `auditoria Skill versao 1.0.md` | `docs/auditoria-skill-v1.0.md` |
| Mover doc solto | `pontos de atenção para IA.md` | `docs/pontos-de-atencao-para-ia.md` |
| Criar estrutura MAIA | — | `docs/maia/{handoffs,01-diagnostico,10-memoria}/` |
| Gravar índice MAIA | — | `docs/maia/README.md` |
| Gravar novo HANDOFF | — | `HANDOFF.md` (raiz) |
| Gravar este diagnóstico | — | `docs/maia/01-diagnostico/diagnostico-2026-05-23.md` |

Nenhum código de produção foi tocado. Nenhuma dependência foi alterada. Nenhum teste foi rodado.
