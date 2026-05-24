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
4. Estratégia de teste (ver abaixo).
5. Checklist de conclusão.
6. Decisão final.
7. Próxima skill recomendada.
8. Atualização recomendada para o `HANDOFF.md`.

---

## Estratégia de teste

O plano deve definir, antes da implementação:

- se a tarefa exige TDD (obrigatório para Core, biblioteca compartilhada, API, parser, regra de negócio, validação, cálculo, integração, autenticação, permissão, fluxo crítico, automação reutilizável e bugfix);
- quais comportamentos serão cobertos por teste;
- quais testes serão criados ou atualizados antes do código;
- como confirmar a falha inicial esperada;
- comando(s) para executar os testes.

Se TDD não for aplicável (documentação, protótipo, spike, ajuste visual pequeno, script descartável, prova de conceito sem contrato), registrar a justificativa no plano. A `06-maia-implementacao` executa o ciclo TDD; a `12-maia-code-validator` valida se foi seguido.

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
Gere resumo executivo, achados, riscos, estratégia de teste (incluindo se a tarefa exige TDD e quais testes virão antes do código), checklist, decisão final, próximos passos e atualização recomendada do HANDOFF.md.

Não invente evidências. Se faltar contexto, registre como dúvida.
```
