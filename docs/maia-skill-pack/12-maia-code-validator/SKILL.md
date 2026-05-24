# Skill: 12-maia-code-validator

## Objetivo

Validar tecnicamente código gerado por IA antes que ele siga para QA funcional, segurança, review ou release.

A função desta skill é impedir que código aparentemente correto avance contendo erros técnicos, alucinações, quebras de contrato, regressões, alterações fora de escopo, dependências desnecessárias ou violações de arquitetura.

---

## Quando usar

Obrigatório:

- após `06-maia-implementacao`;
- antes de `07-maia-qa-validacao`;
- antes de `11-maia-security`, quando houver alteração técnica relevante;
- antes de merge, release, hotfix ou deploy;
- quando houver alteração em exports, imports, rotas, scripts, schemas, dependências ou contratos.

---

## Escopo mínimo

Validar:

- escopo;
- sintaxe e compilação;
- imports, exports e contratos públicos;
- alucinações da IA;
- testes;
- regressão;
- arquitetura;
- qualidade do código;
- dependências;
- configuração e ambiente;
- documentação versus implementação;
- comandos e evidências reais.

---

## Validação de TDD

Quando a tarefa for código crítico (Core, regra de negócio, API, parser, validação, cálculo, integração, autenticação, permissão, automação reutilizável ou bugfix), verificar:

- o teste foi criado antes ou junto da implementação?
- existe evidência da falha inicial (motivo esperado)?
- o teste cobre o comportamento esperado?
- o código implementado é o mínimo necessário?
- houve refatoração segura, sem mudar comportamento?
- os testes foram executados após a refatoração, com saída real?
- se TDD não foi usado, existe justificativa válida no resumo de implementação?

Ausência de TDD em código crítico **sem justificativa** é achado de bloqueio ou ressalva, conforme severidade.

---

## Saídas obrigatórias

1. Resumo executivo.
2. Tabela de achados.
3. Checklist técnico.
4. Comandos executados com saídas reais.
5. Decisão final: APROVADO, APROVADO COM RESSALVAS ou BLOQUEADO.
6. Ações recomendadas.
7. Atualização recomendada do `HANDOFF.md`.

---

## Regras obrigatórias

1. Nunca aceitar “funcionou” sem evidência.
2. Nunca aprovar código que não compila.
3. Nunca aprovar teste obrigatório falhando.
4. Nunca aprovar quebra de export, import ou contrato público sem aprovação explícita.
5. Nunca assumir que função, arquivo ou comando existe sem verificar.
6. Nunca remover teste para fazer a suíte passar.
7. Sempre registrar comandos executados e resultados.
8. Sempre indicar decisão final.

---

## Prompt de execução rápida

```text
Use a skill 12-maia-code-validator.

Atue como revisor técnico sênior especializado em validar código gerado por IA.

Valide:
- sintaxe e compilação;
- testes existentes e novos;
- imports e exports;
- contratos públicos;
- regressões;
- arquitetura;
- escopo;
- dependências;
- comandos reais executados;
- documentação versus implementação;
- alucinações da IA;
- aderência ao TDD em código crítico (teste antes, falha inicial, código mínimo, refatoração segura, testes após refatoração) ou justificativa válida quando não aplicável;
- HANDOFF.md.

Não aceite declarações sem evidência. Verifique arquivos, comandos e saídas reais.

Gere resumo executivo, tabela de achados, checklist técnico, comandos executados, decisão final e ações recomendadas.
```
