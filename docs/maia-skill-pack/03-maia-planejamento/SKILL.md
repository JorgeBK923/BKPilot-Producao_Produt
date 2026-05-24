# Skill: 03-maia-planejamento

## Objetivo

Quebrar a especificação em etapas executáveis, com ordem, riscos e validações.

---

## Quando usar

Use esta skill quando a tarefa estiver na etapa correspondente do MAIA ou quando houver necessidade clara de:

- organizar contexto;
- reduzir risco;
- gerar artefatos;
- validar avanço;
- registrar decisões;
- orientar outra IA/CLI;
- manter rastreabilidade.

---

## Entrada esperada

Considere, quando disponíveis:

- `HANDOFF.md`;
- descrição da tarefa;
- objetivo de negócio;
- requisitos;
- plano;
- arquivos alterados;
- logs;
- erros;
- testes;
- critérios de aceite;
- decisões anteriores;
- riscos conhecidos.

Se faltar contexto, registre como dúvida. Não invente.

---

## Saídas obrigatórias

1. Resumo executivo.
2. Achados principais.
3. Riscos.
4. Checklist de conclusão.
5. Decisão final.
6. Próxima skill recomendada.
7. Atualização recomendada para o `HANDOFF.md`.

---

## Decisão final

Use uma das opções:

```text
APROVADO
APROVADO COM RESSALVAS
BLOQUEADO
```

---

## Regras obrigatórias

1. Nunca marcar como concluído sem evidência.
2. Nunca ignorar restrições do `HANDOFF.md`.
3. Nunca inventar arquivo, função, comando, teste ou decisão.
4. Sempre separar pendência de bloqueador.
5. Sempre indicar a próxima skill recomendada.
6. Sempre atualizar ou solicitar atualização do `HANDOFF.md`.

---

## Prompt de execução rápida

```text
Use a skill 03-maia-planejamento.

Leia o HANDOFF.md, entenda o escopo e execute esta etapa do MAIA.
Gere resumo executivo, achados, riscos, checklist, decisão final, próximos passos e atualização recomendada do HANDOFF.md.

Não invente evidências. Se faltar contexto, registre como dúvida.
```
