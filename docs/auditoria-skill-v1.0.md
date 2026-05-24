# Auditoria de Skills v1.0

## Escopo

Auditoria inicial das skills do projeto `BKPilot`, com foco em:

- organização do catálogo de comandos1
- coerência entre documentação e estrutura real do repositório
- dependências implícitas e explícitas
- riscos operacionais e lacunas documentais

Data da análise: `2026-04-23`

---

## Visão Geral

O projeto possui **16 skills** reais em `.claude/commands/`, apesar de `AGENTS.md` mencionar **14 total**.

As skills estão organizadas em quatro grupos principais:

- pipeline principal de QA
- execução especializada
- auditorias avulsas
- gestão de bugs e reporting

O desenho geral é consistente e segue um padrão forte de operação:

- evidência visual obrigatória em disco
- logs de console e rede acumulados
- autenticação segura via `.env`
- reautenticação de sessão
- artefatos versionados por timestamp
- critérios explícitos de parada

---

## Catálogo de Skills

### Pipeline principal

1. `/explorar`
2. `/gerar-cenarios`
3. `/testar-modulo`
4. `/reportar-bug`
5. `/relatorio-parcial`
6. `/gerar-relatorio`
7. `/regressao`

### Execução especializada

1. `/executar-fluxo`
2. `/executar-planilha`
3. `/testar-forms`
4. `/testar-ia`

### Auditorias avulsas

1. `/acessibilidade`
2. `/performance`
3. `/api-check`
4. `/usabilidade`

### Integração externa

1. `/push-bugs`

---

## Arquitetura Observada

### Núcleo do pipeline

As skills mais importantes do sistema são:

- `.claude/commands/explorar.md`
- `.claude/commands/gerar-cenarios.md`
- `.claude/commands/testar-modulo.md`

Essas três definem o fluxo estrutural do projeto:

1. mapear o sistema
2. gerar cenários baseados em risco
3. executar roteiro e exploração livre por módulo

### Infraestrutura compartilhada

O repositório contém utilitários coerentes com a proposta das skills em `core/`:

- `core/browser.js`
- `core/client.js`
- `core/env.js`
- `core/evidence.js`
- `core/logger.js`
- `core/paths.js`

Também existe configuração explícita de Playwright MCP em:

- `.claude/settings.json`

Comando configurado:

- `npx.cmd @playwright/mcp@latest --headless`

---

## Pontos Fortes

### 1. Modelo operacional consistente

Quase todas as skills seguem um contrato operacional parecido:

- validação de segurança antes da execução
- preparação de diretórios e timestamp
- monitoramento de console
- monitoramento de rede
- captura de evidências
- geração de artefatos estruturados
- resumo final com próximos passos

Isso reduz ambiguidade na execução.

### 2. Portões obrigatórios nas skills centrais

`/explorar` e `/gerar-cenarios` possuem critérios de parada negativa explícitos, o que eleva a qualidade do pipeline e reduz falsas conclusões.

### 3. Boa rastreabilidade de artefatos

O padrão `resultado/<timestamp>/` e `estado/` está bem definido, favorecendo auditoria, reexecução e comparação histórica.

### 4. Especialização real em QA

As skills não são genéricas. Há foco claro em:

- evidência
- cobertura por risco
- regressão
- segurança operacional
- limpeza de dados
- reteste orientado por artefato

### 5. Skill de IA com proposta diferenciada

`/testar-ia` é a skill mais especializada do conjunto. Ela propõe:

- biblioteca adversarial
- geração de planilha dedicada
- captura estruturada da resposta da IA
- validação semântica híbrida
- reteste automático de falhas de ambiente

No nível de design, é uma skill forte.

---

## Achados e Inconsistências

### 1. Divergência na contagem oficial de skills

Em `AGENTS.md`, a seção de quick start informa:

- `Slash commands in .claude/commands/ (14 total)`

Mas a pasta `.claude/commands/` contém **16 arquivos markdown**, e o `README.md` também declara **16 comandos**.

Impacto:

- documentação institucional inconsistente
- risco de confusão para onboarding
- indício de evolução do catálogo sem atualização completa da documentação-base

### 2. Drift documental na skill `/testar-ia`

A skill `.claude/commands/testar-ia.md` referencia componentes que não existem exatamente como descritos:

- `cenarios/_biblioteca_ia/` não existe
- `cenarios/_limpar_chats.js` não existe

Por outro lado, o repositório contém:

- `cenarios/_executar_planilha.js`
- `cenarios/_validar_ia.js`
- `clients/tega/scripts/limpar-chats.js`

Isso sugere que a skill foi escrita para uma estrutura antiga ou genérica e não foi totalmente alinhada à organização atual por cliente.

Impacto:

- a skill pode falhar se seguida literalmente
- aumenta dependência de conhecimento tácito
- reduz confiabilidade operacional do fluxo de IA

### 3. Documentação aparentemente duplicada ou em transição

Há conteúdo também em `src/` com versões paralelas de documentação, incluindo ajustes mais alinhados à estrutura atual.

Isso sugere uma destas situações:

- processo de migração documental incompleto
- fonte de verdade indefinida entre `.claude/commands/` e `src/`
- duplicação de manutenção

Impacto:

- risco de divergência progressiva
- dificuldade para saber qual documento é normativo

### 4. Dependências implícitas não totalmente encapsuladas

Algumas skills assumem a existência prévia de:

- artefatos de exploração
- planilhas específicas
- scripts auxiliares
- packs de dados

Isso é aceitável no pipeline, mas nem sempre está claramente validado contra a estrutura real do projeto antes da execução.

---

## Avaliação por Grupo

### Pipeline principal

É o grupo mais maduro e melhor especificado. O fluxo entre `/explorar`, `/gerar-cenarios` e `/testar-modulo` é o eixo mais sólido do projeto.

Risco principal:

- dependência de disciplina documental para manter os portões e artefatos coerentes com a implementação real

### Execução especializada

`/executar-fluxo`, `/executar-planilha` e `/testar-forms` parecem consistentes com a proposta geral.

`/testar-ia` é valiosa, mas hoje é o ponto com maior risco de divergência entre documentação e implementação.

### Auditorias avulsas

As skills de acessibilidade, performance, API e usabilidade têm boa forma e seguem padrão previsível. São complementares ao pipeline principal e expandem o valor do framework.

### Gestão de bugs e reporting

`/reportar-bug`, `/regressao`, `/relatorio-parcial`, `/gerar-relatorio` e `/push-bugs` mostram preocupação com fechamento do ciclo, não só com execução técnica.

Esse é um ponto forte do projeto.

---

## Riscos Operacionais

### Risco 1. Execução literal de skill desatualizada

Se um operador seguir `/testar-ia` literalmente, pode procurar arquivos e diretórios que não existem.

### Risco 2. Fonte de verdade documental ambígua

A coexistência de documentação em `.claude/commands/` e `src/` pode gerar interpretação divergente.

### Risco 3. Confiança excessiva na documentação em vez do estado real do repo

Como o framework depende de artefatos, scripts e convenções de nome, pequenas divergências documentais têm efeito operacional alto.

---

## Conclusão

O catálogo de skills do projeto é **forte em concepção** e **maduro no pipeline principal**. A estrutura geral demonstra um framework de QA pensado para operação real, com ênfase correta em evidência, cobertura, regressão e rastreabilidade.

Os principais problemas encontrados não são de visão arquitetural, e sim de **governança documental**:

- contagem inconsistente de skills
- drift entre documentação e implementação
- skill `/testar-ia` com referências parcialmente quebradas
- possível duplicação de fonte normativa

No estado atual, o projeto transmite solidez no fluxo principal e necessidade de ajuste fino na camada documental.

---

## Recomendações Imediatas

1. Corrigir `AGENTS.md` para refletir as 16 skills reais.
2. Definir a fonte oficial de verdade entre `.claude/commands/` e `src/`.
3. Revisar `/testar-ia` para alinhar caminhos, scripts auxiliares e pré-condições ao estado real do repositório.
4. Fazer uma auditoria skill por skill para classificar:
   - consistente
   - consistente com ressalvas
   - desatualizada
   - bloqueada por dependência ausente

---

## Status da Auditoria

- Versão: `1.0`
- Escopo: catálogo inicial
- Profundidade: estrutural e documental
- Próximo passo recomendado: auditoria detalhada individual por skill
