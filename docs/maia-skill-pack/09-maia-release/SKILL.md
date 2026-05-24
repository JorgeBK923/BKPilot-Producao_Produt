# Skill: 09-maia-release

## Objetivo

Preparar a entrega para publicação, versionamento, comunicação e rastreabilidade.

---

## Saídas esperadas

```text
release-notes.md
changelog.md
checklist-release.md
rollback-plan.md
deployment-summary.md
```

---

## Regras obrigatórias

- Não fazer release com bloqueador crítico aberto.
- Não ignorar falha de teste obrigatório.
- Não publicar sem versionamento correto.
- Não omitir riscos conhecidos.
- Sempre registrar rollback ou plano de reversão quando aplicável.
- Atualizar HANDOFF.md ao final.

---

## Prompt de execução rápida

```text
Use a skill 09-maia-release.

Prepare esta entrega para release.
Gere release notes, changelog, checklist, versão, riscos, rollback e decisão final.
Confirme que code-validator, QA, security e review foram concluídos ou justifique o que ficou pendente.
```
