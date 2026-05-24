# Skill: 10-maia-memoria

## Objetivo

Registrar decisões, aprendizados, riscos, pendências e estado final de uma tarefa para que o projeto mantenha memória operacional entre ciclos, IAs e pessoas.

---

## Quando usar

- Ao final de uma tarefa.
- Ao encerrar uma sessão de IA.
- Antes de mudar de CLI/modelo.
- Depois de release.
- Quando houver decisão técnica importante.
- Quando houver pendência ou bloqueador.
- Quando o `HANDOFF.md` precisar ser atualizado.

---

## Saídas esperadas

```text
HANDOFF.md
docs/maia/10-memoria/decisions.md
docs/maia/10-memoria/progress.md
docs/maia/10-memoria/lessons-learned.md
docs/maia/10-memoria/open-issues.md
docs/maia/10-memoria/risk-register.md
```

---

## Regras obrigatórias

- Não registrar como concluído o que ficou pendente.
- Separar pendência de bloqueador.
- Registrar comandos executados e resultados reais.
- Registrar decisões com motivo.
- Registrar próxima skill recomendada.
- Atualizar o `HANDOFF.md` antes de encerrar.

---

## Prompt de execução rápida

```text
Use a skill 10-maia-memoria.

Registre o estado final da tarefa.
Atualize o HANDOFF.md com status, decisões, arquivos alterados, comandos executados, resultados, pendências, riscos, próxima skill e próxima IA/CLI recomendada.

Não diga que está 100% concluído se houver pendências abertas.
```
