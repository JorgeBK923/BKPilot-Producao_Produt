# HANDOFF.md

## 1. Identificação

**Data:**  
**Origem:**  
**Destino:**  
**Fluxo MAIA:**  
**Escopo:**  
**Status:**  
**Última skill executada:**  
**Próxima skill recomendada:**  
**Bloqueadores atuais:**  
**Nível de risco:** Baixo / Médio / Alto / Crítico

---

## 2. Resumo de contexto

Descreva de forma curta o projeto, o estado atual, a tarefa em andamento e o motivo da passagem de bastão.

---

## 3. Objetivo atual

Explique claramente o que deve ser feito agora.

---

## 4. Decisões já tomadas

- Decisão 1
- Decisão 2
- Decisão 3

---

## 5. Arquivos relevantes

| Arquivo | Propósito |
|---|---|
| `arquivo.md` | Descrição |

---

## 6. Subtarefas sugeridas

- [ ] Etapa 1
- [ ] Etapa 2
- [ ] Etapa 3

---

## 7. Restrições críticas

- NUNCA expor `.env`, tokens ou credenciais.
- NUNCA alterar produção sem aprovação humana.
- NUNCA sair do escopo sem registrar.
- NUNCA marcar como concluído sem validação.
- NUNCA remover testes para fazer a suíte passar.

---

## 8. Segurança obrigatória

- [ ] Não há `.env` versionado
- [ ] Não há tokens ou senhas no código
- [ ] Logs não expõem dados sensíveis
- [ ] Prints/vídeos não expõem dados reais indevidos
- [ ] Dados enviados para IA externa foram avaliados
- [ ] Ações críticas exigem aprovação humana

---

## 9. Validações obrigatórias

```bash
npm test
node --check arquivo.js
```

---

## 10. Definition of Done

A tarefa só pode ser considerada concluída quando:

- [ ] Todas as etapas obrigatórias foram executadas
- [ ] Os testes obrigatórios foram rodados
- [ ] Os outputs reais foram registrados
- [ ] Os riscos foram registrados
- [ ] As pendências foram separadas de bloqueadores
- [ ] O HANDOFF.md foi atualizado
- [ ] Não existe risco crítico aberto

---

## 11. Comando de chamada para próxima IA

```text
Continue este projeto usando o HANDOFF.md como fonte principal de contexto.
Aplique a skill MAIA indicada.
Antes de alterar arquivos, leia decisões, pendências, riscos e restrições.
Ao finalizar, atualize novamente o HANDOFF.md.
```

---

## 12. Atualização obrigatória ao final

Ao concluir, a IA deve atualizar este arquivo com:

- status final;
- o que foi implementado;
- o que não foi implementado;
- comandos executados;
- resultados reais;
- arquivos alterados;
- riscos encontrados;
- pendências;
- próxima skill MAIA recomendada;
- próxima IA/CLI recomendada.
