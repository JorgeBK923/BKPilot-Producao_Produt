# HANDOFF — BKPilot-Producao — Aguardando novo escopo

**Data:** 2026-05-23
**Origem:** Guardião MAIA (skill `10-maia-memoria` — fechamento Ciclos 7 e 8)
**Destino:** Próxima conversa (humano definirá nova atividade)
**Fluxo MAIA:** entre ciclos — aguardando `01-maia-diagnostico` do novo escopo
**Escopo:** Não definido ainda. Ciclos 7 e 8 oficialmente encerrados.
**Status:** PRONTO PARA NOVO CICLO
**Última skill executada:** `10-maia-memoria` (registro: `docs/maia/10-memoria/memoria-2026-05-23-fechamento-ciclos-7-8.md`)
**Próxima skill recomendada:** `01-maia-diagnostico` (assim que o novo escopo for descrito)
**Bloqueadores atuais:** Nenhum
**Nível de risco:** Baixo (repositório em estado limpo MAIA)

---

## 1. Resumo do estado atual

O repositório **BKPilot-Producao_Produt** está em **estado limpo MAIA**:

- Ciclos 7 e 8 **encerrados por decisão do owner** em 2026-05-23.
- HANDOFF do Ciclo 7 arquivado em `docs/maia/handoffs/HANDOFF-2026-05-15-ciclo7-codex-remediacao.md` (preservado).
- Estrutura `docs/maia/` operacional (`README.md`, `handoffs/`, `01-diagnostico/`, `10-memoria/`).
- Diagnóstico de reconciliação em `docs/maia/01-diagnostico/diagnostico-2026-05-23.md`.
- Memória de fechamento em `docs/maia/10-memoria/memoria-2026-05-23-fechamento-ciclos-7-8.md`.
- Sem código tocado, sem dependência alterada, sem teste executado.
- Sem bloqueadores ativos.

---

## 2. Visão rápida do produto (para a próxima IA/conversa)

- **Nome:** BugKillers QA Agent / BKPilot-Producao
- **Stack:** Node.js (CommonJS, v26.1.0 local), Claude Code + Playwright MCP, Appium MCP para mobile
- **Arquitetura:** híbrida — runtime mobile compartilhado vive em **BKPilot-Core** (consumido como `@bugkillers/bkpilot-core` `v0.2.8` via GitHub). Este repo mantém wrappers, skills operacionais, distribuição multi-CLI (`dist/{claude,codex,opencode}`) e config multi-tenant (`clients/<id>/`).
- **27 comandos slash** cobrem pipeline web e mobile (exploração → cenários → execução → bugs → relatório → automação).
- **Documentação chave:** `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/Arquitetura Producao Core.md`, `docs/maia-skill-pack/`.

---

## 3. Dívida arquivada (não bloqueia, mas registrada)

| Item | Classificação | Notas |
|---|---|---|
| Localização dos artefatos `docs/maia/07-qa-validacao/*` e `06-implementacao/*` | Arqueologia (BAIXA) | Owner confirmou desconhecer. Se aparecerem, indexar em `docs/maia/`. |
| HANDOFF Ciclo 7 arquivado aqui em vez de no Core | Governança (BAIXA) | Owner autorizou manter aqui por enquanto. |
| Suíte de testes própria do Producao (`npm test` é placeholder) | Pendência ativa | Pode virar item do próximo ciclo se aplicável ao escopo. |

Detalhes completos em `docs/maia/10-memoria/memoria-2026-05-23-fechamento-ciclos-7-8.md`.

---

## 4. Restrições críticas (sempre válidas)

- **NUNCA** expor `.env`, `clients/*/.env`, tokens ou `QA_PASSWORD`.
- **NUNCA** colocar lógica reutilizável aqui — vai no `BKPilot-Core`.
- **NUNCA** marcar concluído sem evidência.
- **NUNCA** apagar arquivos em `docs/maia/handoffs/` — é histórico.
- **NUNCA** alterar `package.json` da dep `@bugkillers/bkpilot-core` sem aprovação humana.
- **NUNCA** sair do escopo do novo ciclo sem registrar.

---

## 5. Como o próximo ciclo deve abrir

Quando o owner descrever a nova atividade na próxima mensagem:

1. Guardião MAIA roda **`01-maia-diagnostico`** sobre o novo escopo.
2. Gera relatório em `docs/maia/01-diagnostico/diagnostico-YYYY-MM-DD.md`.
3. Rotaciona este `HANDOFF.md`: o atual vai para `docs/maia/handoffs/HANDOFF-2026-05-23-fechamento-ciclos-7-8.md` e um novo é gravado na raiz refletindo o novo escopo.
4. Segue fluxo MAIA padrão (`01 → 02 → 03 → 04 → 05 → 06 → 12 → 07 → 11 → 08 → 09 → 10`).

---

## 6. Definition of Done deste handoff de transição

- [x] Ciclos 7 e 8 encerrados oficialmente (registro em `docs/maia/10-memoria/`)
- [x] HANDOFF Ciclo 7 preservado em `docs/maia/handoffs/`
- [x] Estrutura `docs/maia/` operacional
- [x] Sem bloqueadores ativos
- [x] Dívida arquivada e classificada
- [x] Próximo passo claro (aguardar descrição do novo escopo)

---

## 7. Comando de chamada para a próxima IA/conversa

```text
O repositório está em estado limpo MAIA, aguardando definição do novo escopo.
Leia este HANDOFF.md, o README.md e docs/maia/10-memoria/memoria-2026-05-23-fechamento-ciclos-7-8.md.
Assim que o humano descrever a nova atividade, execute 01-maia-diagnostico
e rotacione este HANDOFF.md para docs/maia/handoffs/.
```
