# HANDOFF — BKPilot-Producao → Codex CLI (Ciclo 7 — Remediação QA)

**Data:** 2026-05-15
**Origem:** Claude (DeepSeek V4 Pro qa-validacao: APROVADO COM RESSALVAS, 8 ressalvas)
**Destino:** Codex CLI
**Fluxo MAIA:** `06-maia-implementacao` (remediação)
**Escopo:** corrigir **R3** (bug runtime) + **R5** (gap security). R1/R2/R4/R6/R7/R8 viram backlog Ciclo 8.

Ciclo 6 arquivado em `docs/maia/handoffs/HANDOFF-2026-05-14-ciclo6-security-remediado.md`.

---

## Contexto

- DeepSeek V4 Pro executou `07-maia-qa-validacao` sobre Ciclos 1-6.
- Veredito: **APROVADO COM RESSALVAS** — 8 ressalvas (R1-R8).
- Code-validator (DeepSeek) e security (GLM-5.1) já aprovados em ciclos anteriores.
- Esta remediação foca só os 2 itens que afetam runtime/segurança. Dívida de teste (R1/R2/R6) fica pro Ciclo 8.

## Decisões de escopo

- **R3 e R5 remediados agora** — R3 quebra APK upload em produção; R5 deixa PII vazar.
- **R1, R2, R6, R7, R8 — backlog Ciclo 8** (dívida de cobertura, não bug).
- **R4 — backlog Ciclo 8** (5 CAs não implementados — decidir implementar ou ajustar spec).

---

## Tarefas de remediação (2 itens)

### Etapa 1 — R3 (ALTA): `FormData`/`Blob` não nativos em Node < 21

**Onde:** `BKPilot-Core/mobile-apk.js` — função `uploadApkToSauce`.
**Problema:** usa `FormData`/`Blob` globais. Nativos só Node ≥ 21. Em Node < 21, `uploadApkToSauce` lança `ReferenceError` em runtime. Testes mockam fetch — não pegaram.

**Correção:**
- [ ] Detectar disponibilidade de `FormData`/`Blob` globais.
- [ ] Se ausentes: usar fallback (`form-data` npm package OU construção manual de multipart body com `Buffer`).
- [ ] Preferir solução sem nova dependência se viável (multipart manual). Se exigir pacote, justificar no resumo.
- [ ] Documentar no `package.json` do Core o `engines.node` mínimo realista.
- [ ] Teste unit em `test/mobile-apk.test.js`:
  - `uploadApkToSauce` funciona com `FormData`/`Blob` presentes (mock).
  - `uploadApkToSauce` funciona com fallback quando ausentes (simular `globalThis.FormData = undefined`).
  - Body multipart gerado é válido (Content-Type + boundary corretos).

### Etapa 2 — R5 (MÉDIA, gap security): falha de redação não aborta screenshot

**Onde:** `BKPilot-Core/mobile-appium-client.js:673` — método `screenshot()`.
**Problema:** se redação (`redactPngBuffer`) lançar exception, o screenshot **não-mascarado** ainda é salvo. Viola CA6.7 da spec T6 (`docs/maia/02-especificacao/tarefa-8-video-logs.md` / `criterios-aceite.md`).

**Correção:**
- [ ] Em `screenshot()`: envolver redação + escrita em try/catch.
- [ ] Se redação falhar: **não** salvar o PNG. Lançar erro `SCREENSHOT_REDACTION_FAILED`.
- [ ] Garantir que nenhum arquivo PNG não-mascarado persista em disco em caso de falha (limpar arquivo temporário se houver).
- [ ] Registrar erro como evento crítico (sem expor conteúdo do screenshot).
- [ ] Teste unit em `test/mobile-appium-client.test.js`:
  - Redação bem-sucedida → PNG mascarado salvo.
  - Redação lança exception → nenhum PNG em disco + erro `SCREENSHOT_REDACTION_FAILED`.

---

## Etapa 3 — Validação obrigatória (NÃO PULAR)

Executar e **incluir saídas literais no resumo**:
- [ ] `npm test` no Core — todos passam (deve subir de 39 com novos testes R3+R5).
- [ ] `node --check` em `mobile-apk.js`, `mobile-appium-client.js` — exit 0.
- [ ] `node --test --experimental-test-coverage` — confirmar cobertura de `mobile-apk.js` e `mobile-appium-client.js` subiu nas funções tocadas.
- [ ] Bump Core para `v0.2.6` + tag + push.
- [ ] Atualizar `BKPilot-Producao/package.json` e `BKPilot-Comercial/package.json` para `v0.2.6`. `npm install` em ambos.
- [ ] Verificar `engines.node` no `package.json` do Core reflete realidade pós-fix R3.

## Etapa 4 — Saídas MAIA

- [ ] `docs/maia/06-implementacao/resumo-implementacao-ciclo7-qa.md`:
  - Mapeamento R3, R5 → arquivo:linha alterado + teste
  - Saídas reais das validações (literal)
  - Decisão registrada: R1/R2/R4/R6/R7/R8 movidos pra backlog Ciclo 8
  - Sem auto-contradição "concluída" com pendências abertas
- [ ] `docs/maia/06-implementacao/progresso-ciclo7.md`

---

## Restrições (NUNCA violar)

- **NUNCA** colocar lógica reutilizável no Producao — vai no Core.
- **NUNCA** salvar screenshot/evidência não-mascarada em disco (objetivo do R5).
- **NUNCA** expor `QA_PASSWORD`, `MOBILE_FARM_*`, PII em log/output.
- **NUNCA** marcar concluído sem rodar Etapa 3 com saída literal.
- **NUNCA** renomear funções/exports existentes do Core.
- **NUNCA** commit gigante — um por etapa.
- **NUNCA** adicionar dependência nova sem justificar no resumo (R3 — preferir solução sem dep).
- Não tocar R1, R2, R4, R6, R7, R8 — backlog Ciclo 8.

---

## Backlog Ciclo 8 (não fazer agora — registrar)

| R | Item | Gravidade |
|---|---|---|
| R1 | `mobile-device-manager.js` sem teste (0% cobertura) | ALTA |
| R2 | `downloadSauceVideo` sem teste | ALTA |
| R4 | 5 CAs não implementados (CA2.4, CA2.5, CA8.9, CA8.11, CA4.12) — implementar ou ajustar spec | MÉDIA |
| R6 | `MobileAppiumClient` sem teste de instância (~300 linhas) | MÉDIA |
| R7 | `requestJson` sem teste dedicado | BAIXA |
| R8 | 109 edge cases não cobertos | BAIXA |

---

## Referência

- QA decisão: `docs/maia/07-qa-validacao/decisao-final.md`
- Cobertura: `docs/maia/07-qa-validacao/cobertura-testes.md`
- Edge cases: `docs/maia/07-qa-validacao/edge-cases-nao-cobertos.md`
- Mapeamento CA: `docs/maia/07-qa-validacao/mapeamento-ca-testes.md`

---

## Comando de chamada (cole no Codex)

```text
Tarefa: remediar 2 ressalvas QA conforme HANDOFF.md (Ciclo 7).

Escopo: R3 (FormData/Blob não nativos Node<21 — uploadApkToSauce quebra em runtime) + R5 (falha de redação não aborta salvamento de screenshot — CA6.7 violado).

Passos: seguir Etapas 1-4 do HANDOFF.md. Não pular Etapa 3 (validação).

Restrições críticas:
- R3: preferir fallback sem dependência nova (multipart manual com Buffer). Se exigir pacote, justificar.
- R5: se redação falhar, NÃO salvar PNG; lançar SCREENSHOT_REDACTION_FAILED; garantir zero PNG não-mascarado em disco.
- Lógica no BKPilot-Core. Manter contrato de exports.
- Bump Core v0.2.6 + tag + push + atualizar deps Producao+Comercial.
- npm test e coverage no resumo com saída literal.
- NÃO tocar R1/R2/R4/R6/R7/R8 — backlog Ciclo 8.

Referências:
- docs/maia/07-qa-validacao/decisao-final.md
- docs/maia/07-qa-validacao/cobertura-testes.md
```

---

## Pendências fora deste ciclo

- Backlog Ciclo 8: R1, R2, R4, R6, R7, R8.
- T9 — E2E completo Sauce.
- T10 — Adaptador farm interna.
- R3 ambiente USB (ADB + Appium local) — manual.
- Governança operacional.
