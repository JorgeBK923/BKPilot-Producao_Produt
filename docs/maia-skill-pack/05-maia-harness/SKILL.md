# Skill: 05-maia-harness

## Objetivo

Preparar o projeto para que IAs e CLIs trabalhem com contexto controlado, regras claras, arquivos padronizados e menor risco de perda de informação.

O harness é a estrutura de segurança e orientação do MAIA.

---

## Quando usar

- No início de um projeto.
- Antes de permitir que uma IA altere arquivos.
- Quando o projeto estiver sem padrão.
- Quando várias IAs/CLIs forem usadas.
- Quando houver risco de perda de contexto.
- Quando for necessário criar estrutura `docs/maia`.

---

## Saídas esperadas

```text
HANDOFF.md
AGENTS.md
README.md
docs/maia/
docs/maia/01-diagnostico/
docs/maia/02-especificacao/
docs/maia/03-planejamento/
docs/maia/06-implementacao/
docs/maia/07-qa-validacao/
docs/maia/08-review/
docs/maia/09-release/
docs/maia/10-memoria/
docs/maia/11-security/
docs/maia/12-code-validator/
```

---

## Regras obrigatórias

- O `HANDOFF.md` deve existir na raiz ou em local explícito.
- Toda IA deve ler o `HANDOFF.md` antes de agir.
- Toda IA deve atualizar o `HANDOFF.md` ao final.
- Regras de escopo e segurança devem ficar explícitas.
- Arquivos sensíveis devem ser protegidos.
- O projeto deve ter critérios mínimos de validação.

---

## Prompt de execução rápida

```text
Use a skill 05-maia-harness.

Prepare este projeto para uso com MAIA e IAs.
Crie ou valide HANDOFF.md, AGENTS.md, estrutura docs/maia, regras de uso, limites de alteração, checklist de validação e padrões de atualização de contexto.

Ao final, informe o que foi criado, o que falta e qual skill deve ser usada em seguida.
```
