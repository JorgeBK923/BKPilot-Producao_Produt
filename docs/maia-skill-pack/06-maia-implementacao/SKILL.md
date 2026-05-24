# Skill: 06-maia-implementacao

## Objetivo

Executar a mudança planejada de forma controlada, respeitando escopo, arquitetura, especificação, restrições e critérios de aceite.

---

## Regras obrigatórias

- Ler o `HANDOFF.md` antes de alterar arquivos.
- Não sair do escopo.
- Não alterar arquivos sensíveis sem autorização.
- Não fazer commit gigante misturando etapas.
- Não declarar conclusão sem validação.
- Registrar arquivos alterados.
- Encaminhar para `12-maia-code-validator` após implementar.

---

## Modo TDD

Quando a tarefa envolver lógica crítica, regra de negócio, Core, biblioteca compartilhada, API, parser, validação, cálculo, integração, autenticação, permissão, fluxo crítico, automação reutilizável ou bugfix, use TDD sempre que viável.

Ordem obrigatória:

1. Entender o comportamento esperado.
2. Criar ou atualizar o teste antes da implementação.
3. Executar o teste e confirmar que ele falha pelo motivo esperado.
4. Implementar o mínimo necessário.
5. Executar os testes até passar.
6. Refatorar sem alterar comportamento.
7. Executar os testes novamente.
8. Registrar evidência (comando + saída real) no `HANDOFF.md`.

Exemplos no BKPilot que exigem TDD: `BKPilot-Core/mobile-apk.js`, parser XML, mascaramento de dados, validação de config, upload Sauce Labs, regras de `allowedAppPackages`, geração de relatório.

TDD pode ser **opcional** para: documentação, protótipos rápidos, spikes técnicos, telas experimentais, ajustes visuais pequenos, scripts descartáveis e provas de conceito sem contrato definido.

Se TDD não for aplicável, justifique no resumo de implementação.

---

## Saídas esperadas

- Código alterado.
- Testes adicionados/ajustados quando aplicável.
- Documentação técnica atualizada quando necessário.
- Resumo de implementação.
- Lista de arquivos alterados.
- Pendências.
- Próximo passo: `12-maia-code-validator`.

---

## Prompt de execução rápida

```text
Use a skill 06-maia-implementacao.

Implemente a tarefa conforme HANDOFF.md, especificação e plano.
Respeite escopo, arquitetura e restrições.
Se for código crítico (Core, regra de negócio, API, parser, validação, cálculo, integração, autenticação, permissão, automação reutilizável ou bugfix), aplique TDD: teste falhando → código mínimo → teste passando → refatoração → testes novamente. Caso TDD não se aplique, justifique no resumo.
Não marque como concluído sem validação.
Ao finalizar, liste arquivos alterados, comandos executados, pendências e encaminhe para 12-maia-code-validator.
Atualize o HANDOFF.md.
```
