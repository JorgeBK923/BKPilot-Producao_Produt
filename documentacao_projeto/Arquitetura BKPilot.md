# Arquitetura BKPilot

## Setor de Inteligência Artificial

Versão 4.1 - Multi-tenant e Multi-CLI
## 1. Objetivo deste documento

Este documento existe para explicar a arquitetura real do `bugkillers-qa-agent` de forma útil para quem precisa manter, evoluir ou operar o projeto.

O objetivo aqui não é apenas listar pastas. É explicar:

- qual problema a arquitetura resolve;
- quais decisões estruturais sustentam o projeto;
- como as partes se conectam;
- o que já está implementado;
- onde termina a implementação atual e começa o roadmap.

Em outras palavras: este documento deve funcionar como uma leitura de orientação para alguém que entra no repositório e precisa entender por que ele foi desenhado assim.

## 2. O que é o BKPilot

O BKPilot é uma plataforma local de automação de QA orientada a skills. Ele foi desenhado para permitir que QAs operem um pipeline completo de testes com:

- exploração do sistema;
- geração de cenários;
- execução guiada ou em lote;
- coleta automática de evidências;
- consolidação de bugs;
- geração de relatórios.

O ponto importante é que o projeto não foi pensado como "um script de teste" nem como "uma aplicação web de QA". Ele foi pensado como um sistema operacional de trabalho do QA, com uma base declarativa de skills e uma camada executável de suporte.

## 3. Problema arquitetural que o projeto resolve

Sem uma arquitetura adequada, um agente de QA como esse tende a cair em três armadilhas:

### 3.1 Acoplamento a um cliente específico

Quando URL, login, fluxo de tela, selectors e particularidades do sistema ficam misturados com o engine genérico, cada novo cliente vira refatoração. Isso torna o projeto frágil e caro de manter.

### 3.2 Acoplamento a uma única CLI ou fornecedor

Se as skills só funcionam em um ambiente específico, o projeto fica preso a um runtime só. Isso reduz flexibilidade operacional e aumenta risco de lock-in.

### 3.3 Mistura entre especificação e execução

Se a mesma camada tenta ser ao mesmo tempo documentação da skill, runtime, script específico e adaptação de plataforma, a evolução vira caos. Pequenas mudanças geram drift entre versões, entre CLIs e entre clientes.

O desenho atual existe justamente para evitar esse cenário.

## 4. Princípios arquiteturais

O projeto se apoia em alguns princípios simples, mas muito importantes.

### 4.1 Fonte única das skills

As skills devem ser escritas uma vez só em formato canônico e depois distribuídas para os ambientes necessários.

Na prática, isso significa que `src/*.md` é a fonte de verdade do comportamento.

### 4.2 Isolamento por cliente

Tudo que é específico de um cliente deve ficar no pack daquele cliente.

Isso evita que o engine precise "saber" detalhes de TEGA, de outro cliente futuro ou de qualquer aplicação testada.

### 4.3 Adaptação por CLI, não reescrita por CLI

Claude Code, Codex e OpenCode devem ser tratados como canais de distribuição e execução, não como três produtos diferentes com manutenção separada.

### 4.4 Evidência e observabilidade como parte da arquitetura

No contexto BKPilot, evidência não é um extra. É parte estrutural do sistema. Se a arquitetura não garante logs, screenshots, vídeos e rastreabilidade por execução, ela falha no propósito do projeto.

## 5. Visão geral da arquitetura

Hoje o projeto pode ser entendido em quatro blocos principais:

1. Fonte canônica das skills
2. Pipeline de conversão e distribuição
3. Engine genérica de execução
4. Client packs

Esses blocos se conectam para permitir que o mesmo framework seja operado em mais de uma CLI, para mais de um cliente, sem duplicar a lógica central.

## 6. Fonte canônica das skills

A pasta `src/` concentra as skills em markdown com frontmatter.

Essa escolha é importante porque separa bem duas coisas:

- o comportamento da skill;
- a forma como esse comportamento será adaptado para cada ambiente operacional.

Cada skill declara, de forma estruturada:

- seu identificador;
- seu tipo;
- seus inputs;
- blocos compartilhados que devem ser injetados;
- ferramentas requeridas;
- compatibilidade por target.

Isso permite que a skill continue legível para humanos e, ao mesmo tempo, suficientemente estruturada para o conversor gerar saídas consistentes.

## 7. Pipeline de conversão e distribuição

O projeto usa um Skill Converter em `converter/` para transformar a fonte canônica em distribuições por target.

Esse é um dos pontos centrais da arquitetura.

### 7.1 Por que esse conversor existe

Sem essa camada, o time teria que manter múltiplas versões da mesma skill:

- uma para Claude;
- outra para Codex;
- outra para OpenCode.

Isso multiplicaria manutenção e criaria divergência com o tempo.

O conversor resolve esse problema gerando essas distribuições a partir de uma única fonte.

### 7.2 Targets reais do projeto

Hoje os targets reais de distribuição são:

| Target | Destino | Uso |
|---|---|---|
| Claude | `dist/claude/` e `.claude/commands/` | Operação via Claude Code |
| Codex | `dist/codex/` | Operação via Codex |
| OpenCode | `dist/opencode/` | Operação via OpenCode |

Aqui existe um ponto importante de interpretação:

`.claude/commands/` não é "o produto inteiro". É apenas a projeção operacional do target Claude.

## 8. Modelo multi-CLI

Um erro comum ao olhar o repositório é imaginar que ele é "feito para Claude". Isso é compreensível, porque `.claude/commands/` é muito visível. Mas essa leitura é incompleta.

O desenho correto é este:

- `src/` é a fonte única;
- `converter/` compila;
- `dist/` guarda distribuições por target;
- `.claude/commands/` existe porque o Claude Code precisa desse formato específico;
- `codex` e `opencode` operam suas respectivas distribuições.

Ou seja: o projeto é multi-CLI por desenho, não por improviso.

## 9. Diagrama da arquitetura

```text
                           +----------------------+
                           |      QA Operador     |
                           | Claude | Codex | OC  |
                           +-----------+----------+
                                       |
                                       v
                    +----------------------------------------+
                    | Distribuições por CLI                  |
                    | .claude/commands | dist/codex |        |
                    | dist/opencode                         |
                    +-------------------+--------------------+
                                        ^
                                        |
                         +--------------+--------------+
                         | Skill Converter (converter/) |
                         +--------------+--------------+
                                        ^
                                        |
         +------------------------------+------------------------------+
         |                 Fonte Canônica de Skills                    |
         |      src/*.md + shared/blocks + tools_map.yaml              |
         +------------------------------+------------------------------+
                                        |
                                        v
                 +----------------------+----------------------+
                 |            Engine Genérica (core/)          |
                 | browser | env | client | paths | evidence   |
                 +----------------------+----------------------+
                                        |
                           +------------+------------+
                           |                         |
                           v                         v
                +-------------------+     +------------------------+
                |  clients/<id>/    |     | clients/<id>/estado/       |
                | config/login/flow |     | mapa, elementos, APIs  |
                +---------+---------+     +------------------------+
                          |
                          v
                +-------------------------------+
                | clients/<id>/resultado/<ts>/      |
                | logs, screenshots, vídeos     |
                | cleanup, network, summaries   |
                +-------------------------------+
                          |
                          v
                +-------------------------------+
                | entregaveis/<client>/         |
                | automacao/<stack>/            |
                | codigo, docs, PDFs, auditoria |
                +-------------------------------+
```

## 10. Engine genérica

A pasta `core/` é a base operacional compartilhada. Ela existe para concentrar comportamentos reutilizáveis que não devem conhecer detalhes de cliente.

Os módulos principais cumprem estes papéis:

| Módulo | Papel arquitetural |
|---|---|
| `paths.js` | Organiza estrutura de saída por cliente e timestamp |
| `env.js` | Carrega credenciais e impõe regra de segurança |
| `client.js` | Localiza e valida packs de cliente e flows |
| `logger.js` | Cria log operacional persistente da execução |
| `browser.js` | Sobe browser com monitoramento embutido |
| `evidence.js` | Trata conversão de vídeo e evidências |

O que isso significa, na prática, é que o comportamento operacional comum não precisa ser reimplementado a cada cliente.

## 11. Client packs

O multi-tenant real do projeto mora em `clients/<id>/`.

Essa é uma decisão arquitetural muito relevante: o cliente não é um conjunto solto de parâmetros; ele é um pack autocontido.

Dentro dele podem viver:

- `config.json`
- `login.js`
- `flows/`
- `scripts/`
- `bugs/<data>/`
- `fixtures/`
- `cenarios/`

### 11.1 Por que isso é importante

Esse modelo reduz o custo de escalar para novos clientes. Em vez de editar o engine para cada caso, o time cria ou adapta um pack específico.

O ganho verdadeiro não é elegância teórica. O ganho verdadeiro é operacional:

- onboarding mais rápido;
- menos risco de quebrar outro cliente;
- menor chance de espalhar regra de negócio no core.

## 12. Contratos entre engine e cliente

O engine e os client packs se conectam por contratos simples e explícitos.

### 12.1 `config.json`

Ele informa dados estruturais do cliente, como:

- identificador;
- nome;
- URL base;
- timeout;
- variável de ambiente da senha;
- seletor pós-login;
- flow padrão.

### 12.2 `login.js`

Ele encapsula o fluxo real de autenticação do cliente.

Essa é uma decisão correta porque login é um dos pontos mais propensos a variação entre sistemas. Colocar isso dentro do pack evita contaminar o core com `if/else` por cliente.

### 12.3 `flows/*.js`

Eles permitem especialização de comportamento por domínio quando a execução exige lógica concreta além da skill declarativa.

Esse desenho mantém a maior parte do sistema genérica sem impedir aprofundamento onde for necessário.

## 13. Orquestradores do engine

A pasta `cenarios/` contém scripts de orquestração genéricos.

Esses scripts fazem a ponte entre:

- a camada declarativa das skills;
- a camada prática de execução em lote, reteste, validação e geração de saída.

Hoje os principais são:

| Script | Finalidade |
|---|---|
| `_executar_planilha.js` | execução em lote |
| `_retestar_bug.js` | reteste de bugs |
| `_md_to_pdf.js` | geração de PDF a partir de markdown |
| `_validar_ia.js` | validação semântica auxiliar |
| `_gerar_planilha_ia.js` | geração de planilhas para domínio de IA |

Esses orquestradores são uma parte importante do projeto porque mostram que a plataforma não é apenas "prompt + browser". Existe runtime real sustentando a operação.

## 14. Observabilidade como decisão de arquitetura

Neste projeto, observabilidade não é detalhe de implementação. Ela faz parte da arquitetura.

As execuções relevantes precisam deixar rastros como:

- `progress.log`
- `console_log.json`
- `network_log.json`
- `cleanup_log.json`
- `reauth.json`
- screenshots
- vídeos

Isso existe por três razões:

1. permitir auditoria;
2. aumentar confiabilidade operacional;
3. sustentar entregáveis BKPilot com evidência rastreável.

## 15. Estrutura de artefatos

Outro ponto importante da arquitetura atual é o isolamento por cliente e timestamp.

O desenho esperado é:

```text
clients/<id>/estado/                  memória de exploração do cliente
clients/<id>/resultado/<timestamp>/   artefatos daquela execução
clients/<id>/resultado/<timestamp>/governanca/ artefatos internos de governança
clients/<client>/cenarios/        materiais persistentes do cliente
clients/<client>/bugs/<data>/     material de bugs e reteste
entregaveis/<client>/automacao/<stack>/ pacote de automação entregue ao cliente
```

Isso corrige uma limitação comum em automações mais simples, nas quais o resultado da execução anterior se mistura com a seguinte.

### 15.1 Entrega de automação ao cliente

As skills `/plano-automacao`, `/gerar-automacao-cliente` e `/auditar-automacao-cliente` adicionam uma camada específica de consultoria e entrega de código de automação.

O pacote destinado ao cliente deve ficar em:

```text
entregaveis/<cliente>/automacao/<stack>/
```

Esse pacote concentra:

- código gerado em `codigo/`;
- especificação intermediária em `especificacao_automacao.json`;
- mapeamento de cenários;
- cobertura da automação;
- pendências;
- inventário de arquivos;
- auditoria técnica da geração;
- auditoria independente;
- correções aplicadas pela auditoria, quando existirem;
- resumo final da geração.

Todo relatório `.md` destinado ao cliente deve possuir também a versão `.pdf` correspondente. Essa regra evita que o cliente receba apenas markdown quando a entrega exige leitura direta ou arquivamento formal.

Arquivos de governança interna, como autoria, metadados do executor e bloqueios de segregação, devem ficar em `clients/<id>/clients/<id>/resultado/<timestamp>/governanca/` e não devem ser enviados ao cliente sem revisão.

### 15.2 Auditoria com remediação

A auditoria da automação não é apenas uma revisão passiva. Quando encontrar defeitos técnicos objetivos e corrigíveis no código gerado, a skill deve corrigir antes da entrega e registrar o que foi alterado em `correcoes_auditoria.md` e `correcoes_auditoria.pdf`.

Defeitos não corrigíveis automaticamente devem permanecer documentados como pendência explícita, sem mascarar o risco no parecer final.

## 16. O que já está implementado vs. o que é roadmap

Uma boa documentação arquitetural precisa diferenciar claramente estado atual e intenção futura.

### 16.1 Já implementado

- fonte canônica em `src/`;
- conversor multi-target;
- distribuições para Claude, Codex e OpenCode;
- engine genérica em `core/`;
- client packs em `clients/<id>/`;
- orquestradores em `cenarios/`;
- estrutura de artefatos por cliente e timestamp;
- consultoria de viabilidade via `/plano-automacao`;
- pacote de automação em `clients/<id>/entregaveis/automacao/<stack>/`;
- regra de PDF para relatórios `.md` destinados ao cliente;
- auditoria de automação com remediação obrigatória de defeitos técnicos corrigíveis.

### 16.2 Ainda depende de evolução futura

- qualquer automação de bootstrap que ainda não exista no repositório;
- expansões da plataforma web fora deste repo;
- novos targets de build além dos já suportados.

Essa distinção importa para evitar que o documento descreva desejo como se fosse implementação.

## 17. Como ler corretamente o projeto

Se alguém abrir esse repositório e quiser entender a ordem mental certa, a leitura ideal é:

1. entender `src/` como fonte de comportamento;
2. entender `converter/` como pipeline de distribuição;
3. entender `core/` como engine compartilhada;
4. entender `clients/` como especialização por cliente;
5. entender `clients/<id>/estado/` e `clients/<id>/resultado/` como memória e evidência operacional.

Essa sequência ajuda a não cair na leitura errada de que o sistema é apenas um conjunto de markdowns ou apenas um conjunto de scripts Node.

## 18. Conclusão

O `bugkillers-qa-agent` não deve ser entendido como um projeto monolítico acoplado a um cliente ou a uma única CLI. Ele é, hoje, uma plataforma local de QA com:

- fonte única de skills;
- distribuição multi-CLI;
- engine genérica compartilhada;
- packs isolados por cliente;
- observabilidade e evidência como parte estrutural.

Essa arquitetura faz sentido porque responde exatamente ao problema que a BKPilot precisa resolver: escalar execução de QA com padronização, rastreabilidade e baixo lock-in técnico.

BKPilot - Setor de Inteligência Artificial
