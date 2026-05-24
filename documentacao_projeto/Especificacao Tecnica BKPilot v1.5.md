# Especificação Técnica BKPilot

## Setor de Inteligência Artificial

Versão 1.5 - Abril 2026
| Campo | Valor |
|---|---|
| Versão | 1.5 |
| Data | Abril 2026 |
| Autor | Jorge Vieira Alves - QA Specialist & AI Engineer |
| Status | Especificação atualizada segundo o estado atual do repositório |
| Projeto | BKPilot + Plataforma Web |
| Repositório | `bugkillers-qa-agent` + `bugkillers-qa-platform` |

## 1. Objetivo desta especificação

Esta especificação existe para alinhar visão de produto, visão técnica e realidade de implementação.

Ela não deve servir apenas como documento aspiracional. Ela deve deixar claro:

- o que o ecossistema BKPilot está resolvendo;
- qual é o papel do agente local;
- qual é o papel da plataforma web;
- quais partes já existem no código;
- quais partes ainda são roadmap.

Esse ponto é especialmente importante porque, sem essa distinção, o time corre o risco de tratar ideias futuras como se já fossem capacidade operacional disponível.

## 2. Visão do produto

O ecossistema BKPilot tem hoje dois componentes conceitualmente complementares:

### 2.1 Agente local

O `bugkillers-qa-agent` é a base operacional do QA.

É nele que vivem:

- as skills;
- o conversor de targets;
- a engine genérica;
- os packs de cliente;
- os orquestradores;
- a automação de browser;
- a geração de artefatos e evidências.

Em outras palavras: é aqui que o trabalho operacional real acontece.

### 2.2 Plataforma web

A `bugkillers-qa-platform` é o componente voltado a gestão, acompanhamento e entrega.

Seu papel natural é:

- centralizar visibilidade;
- consolidar indicadores;
- organizar execuções e entregas;
- disponibilizar material final ao cliente;
- apoiar coordenação operacional.

Ela não deve ser confundida com o ambiente principal de trabalho do QA.

## 3. Princípio operacional central

O QA da BKPilot opera o framework via CLI.

Essa afirmação precisa ser explícita porque ela reorganiza a leitura do ecossistema inteiro:

- a plataforma web não substitui a execução local;
- o agente local não é um acessório secundário;
- as skills continuam sendo o núcleo do valor operacional.

Hoje, a execução acontece em CLIs suportadas pelo projeto, e não na interface web da plataforma.

## 4. O que a plataforma realmente entrega

Do ponto de vista de produto, o valor entregue pelo ecossistema não é apenas "rodar testes". O valor é combinar:

- padronização de execução;
- rastreabilidade;
- evidência forte;
- reaproveitamento de conhecimento;
- capacidade de operar mais de um cliente;
- menor acoplamento a uma única CLI.

Quando essas peças estão juntas, a BKPilot ganha escala sem perder qualidade de documentação e de prova.

## 5. Modelo técnico atual do agente

O estado atual do `bugkillers-qa-agent` pode ser lido em quatro camadas:

1. skills canônicas em `src/`;
2. conversão e distribuição em `converter/` e `dist/`;
3. engine genérica em `core/` e `cenarios/`;
4. packs específicos por cliente em `clients/<id>/`.

Esse desenho já está implementado no repositório e precisa ser tratado como a base oficial da especificação.

## 6. Modelo multi-CLI

Um dos pontos mais importantes da atualização desta especificação é deixar explícito que o ecossistema do agente é multi-CLI.

### 6.1 O que isso quer dizer

Quer dizer que a mesma base de skills pode ser operada em mais de um ambiente de agente.

Hoje, os três targets reais do projeto são:

| Target | Destino | Papel operacional |
|---|---|---|
| Claude | `dist/claude/` + `.claude/commands/` | execução via Claude Code |
| Codex | `dist/codex/` | execução via Codex |
| OpenCode | `dist/opencode/` | execução via OpenCode |

### 6.2 O que isso não quer dizer

Não quer dizer que existem três produtos diferentes sendo mantidos separadamente.

Também não quer dizer que cada modelo vira automaticamente um target de build.

O projeto é multi-CLI na distribuição e multi-ICL na operação, mas essas duas camadas precisam ser distinguidas.

## 7. Multi-CLI vs. Multi-ICL

Essa distinção merece uma seção própria porque ela costuma gerar confusão.

### 7.1 Multi-CLI

Refere-se ao ambiente operacional usado pelo QA:

- Claude Code
- Codex
- OpenCode

### 7.2 Multi-ICL

Refere-se ao fato de que um mesmo front-end, especialmente o OpenCode, pode operar com diferentes provedores e modelos.

Ou seja:

- o target de build é um;
- os modelos por trás daquele target podem variar.

Essa leitura é mais precisa do que listar cada modelo como se fosse um target técnico independente do conversor.

## 8. Fonte única das skills

As skills devem continuar sendo tratadas como o centro do produto operacional.

Elas são escritas em `src/*.md` com frontmatter e blocos compartilhados. Essa base canônica é importante porque:

- evita drift entre CLIs;
- reduz retrabalho;
- preserva consistência de comportamento;
- facilita auditoria e evolução.

Sem essa fonte única, o ecossistema rapidamente se fragmentaria.

## 9. Skill Converter

O conversor existe para transformar a base canônica em distribuições por target sem obrigar o time a manter múltiplas versões da mesma skill.

Isso é uma peça técnica e também uma peça estratégica. Ele reduz lock-in.

### 9.1 Componentes principais

- `converter/parser.js`
- `converter/lint.js`
- `converter/render.js`
- `converter/tools_map.yaml`
- `converter/targets/*`

### 9.2 Papel de negócio

Do ponto de vista de produto, isso significa que a BKPilot preserva propriedade sobre suas skills e reduz dependência de um único ambiente de execução.

## 10. Arquitetura multi-tenant

Outro eixo central do projeto é o isolamento por cliente.

Hoje, esse isolamento já existe no desenho implementado:

```text
clients/<id>/            comportamento e material do cliente
clients/<id>/estado/         memória de exploração do cliente
clients/<id>/resultado/<ts>/ evidência e saída daquela execução
```

Isso corrige um problema estrutural comum em agentes acoplados: a mistura de regras específicas de cliente com engine genérica.

## 11. Client packs

Cada cliente é representado por um pack em `clients/<id>/`.

Esse pack pode conter:

- `config.json`
- `login.js`
- `flows/`
- `scripts/`
- `bugs/<data>/`
- `fixtures/`
- `cenarios/`

### 11.1 Por que isso é importante para a plataforma

Porque a escalabilidade real do ecossistema depende muito mais da facilidade de onboarding de cliente do que da sofisticação abstrata da engine.

Se para cada cliente novo o time precisar reescrever lógica do core, a plataforma perde escalabilidade real.

## 12. Engine genérica

O core do agente concentra funções compartilhadas que não devem conhecer particularidades de domínio.

Módulos principais:

| Módulo | Responsabilidade |
|---|---|
| `core/paths.js` | organização de paths por cliente e timestamp |
| `core/env.js` | segurança e carregamento de ambiente |
| `core/client.js` | carregamento de client packs |
| `core/logger.js` | rastreabilidade operacional |
| `core/browser.js` | browser e monitoramento embutido |
| `core/evidence.js` | tratamento de evidências de vídeo |

Esse desenho permite que a inteligência específica do cliente continue fora da base compartilhada.

## 13. Orquestradores do engine

A pasta `cenarios/` concentra orquestradores genéricos.

Hoje os principais são:

| Script | Finalidade |
|---|---|
| `_executar_planilha.js` | execução batch de cenários |
| `_retestar_bug.js` | reteste de bugs |
| `_md_to_pdf.js` | conversão de markdown para PDF |
| `_validar_ia.js` | validação semântica auxiliar |
| `_gerar_planilha_ia.js` | geração de planilhas para domínio de IA |

Esses scripts mostram que o agente não depende apenas do raciocínio do modelo. Há uma camada de execução determinística sustentando o processo.

## 14. Papel das skills no produto

As skills são a superfície operacional do framework. Hoje o projeto trabalha com 19 skills principais cobrindo:

- exploração;
- geração de cenários;
- execução funcional;
- regressão;
- auditorias de acessibilidade, performance, API e usabilidade;
- testes em IA;
- planejamento, geração e auditoria de automação para cliente;
- relatórios;
- consolidação de bugs.

Elas representam o método operacional BKPilot encapsulado em comandos reutilizáveis.

## 15. Evidência, logs e rastreabilidade

No contexto desta plataforma, evidência não é um acessório.

Ela é parte do produto.

Sem estrutura de saída consistente, o sistema pode até executar testes, mas não consegue sustentar:

- auditoria interna;
- entrega confiável ao cliente;
- comparação entre execuções;
- reuso em regressão;
- fechamento defensável de bug.

Por isso, a arquitetura incorpora como parte do desenho:

- screenshots;
- vídeos;
- `console_log.json`;
- `network_log.json`;
- `cleanup_log.json`;
- `progress.log`;
- `reauth.json` quando aplicável.

## 16. Estrutura atual de artefatos

O estado atual do repositório indica o seguinte desenho:

```text
clients/<id>/estado/                  memória da exploração
clients/<id>/resultado/<timestamp>/   artefatos da execução
clients/<id>/resultado/<timestamp>/governanca/ artefatos internos de governança
clients/<client>/cenarios/        planilhas e materiais persistentes
clients/<client>/bugs/<data>/     exports e anexos de bugs
entregaveis/<client>/automacao/<stack>/ pacote de automação entregue ao cliente
```

Essa é a estrutura que a especificação deve considerar como vigente.

### 16.1 Pacotes de automação para cliente

As skills `/plano-automacao`, `/gerar-automacao-cliente` e `/auditar-automacao-cliente` formalizam uma entrega específica: consultoria de viabilidade e código de automação exportável no stack escolhido pelo cliente.

O destino padrão do pacote é:

```text
entregaveis/<cliente>/automacao/<stack>/
```

Esse pacote deve conter, quando aplicável:

- `codigo/`;
- `especificacao_automacao.json`;
- `mapeamento_cenarios.md` e `mapeamento_cenarios.pdf`;
- `README_automacao.md` e `README_automacao.pdf`;
- `cobertura_automacao.md` e `cobertura_automacao.pdf`;
- `pendencias.md` e `pendencias.pdf`;
- `inventario_arquivos.md` e `inventario_arquivos.pdf`;
- `auditoria_codigo.md` e `auditoria_codigo.pdf`;
- `auditoria_independente.md` e `auditoria_independente.pdf`;
- `correcoes_auditoria.md` e `correcoes_auditoria.pdf`, quando houver correção ou pendência técnica;
- `resumo_geracao.md` e `resumo_geracao.pdf`.

Todo relatório `.md` destinado ao cliente deve ter PDF correspondente antes da entrega.

### 16.2 Separação entre cliente e governança interna

Artefatos de governança interna devem ficar fora do pacote enviado ao cliente. O local previsto é:

```text
clients/<id>/resultado/<timestamp>/governanca/
```

Essa pasta pode conter autoria da automação, metadados de execução, auditoria interna, bloqueios por segregação e outras informações que não devem ser enviadas automaticamente ao cliente.

### 16.3 Auditoria com correção obrigatória

A auditoria do pacote de automação não deve apenas apontar defeitos. Quando encontrar erro técnico objetivo e corrigível no código gerado, a skill deve corrigir, revalidar e documentar a alteração antes da entrega.

Se algo não puder ser corrigido com segurança, deve aparecer como pendência explícita no pacote e no parecer final.

## 17. Regras de segurança e operação

Algumas regras não são apenas boas práticas. Elas fazem parte da disciplina operacional do produto.

### 17.1 Credenciais

- senhas devem vir de `.env`;
- senha inline em comando deve ser bloqueada;
- credenciais não devem aparecer em logs ou evidências.

### 17.2 Ambiente mutativo

Se o projeto pode escrever no sistema, isso precisa acontecer apenas em ambiente controlado.

### 17.3 Cleanup

Quando o teste cria dados, a responsabilidade de limpeza ou de registro da pendência precisa estar explícita.

## 18. Papel da plataforma web

É importante deixar isso cristalino.

A plataforma web não deve ser descrita como se fosse o ambiente principal onde o QA opera o agente.

O papel mais coerente para ela é:

- portal de gestão;
- acompanhamento de ciclo;
- consolidação de métricas;
- interface de entrega;
- organização de material final.

Ela não substitui a execução local via CLI.

## 19. Bootstrap de cliente novo: estado atual vs. roadmap

Na versão anterior da especificação, o documento falava em um bootstrap baseado em:

- `templates/projeto-novo/`
- `scripts/novo-projeto.js`
- `projetos/<slug>/`

Esse desenho não corresponde ao estado atual do repositório.

Hoje, o onboarding real acontece pela criação manual de um pack em `clients/<id>/`, seguindo o contrato vigente.

Isso significa que o bootstrap automatizado pode continuar existindo como ideia futura, mas precisa ser tratado como roadmap, não como funcionalidade já implementada.

## 20. Processo de desenvolvimento

O processo de desenvolvimento do ecossistema deve preservar alguns princípios:

- uma única fonte de skill;
- revisão antes de multiplicar distribuição;
- separação clara entre implementação atual e intenção futura;
- commit humano e responsabilidade explícita nas mudanças.

Mais importante do que a combinação exata de modelos por etapa é manter coerência arquitetural no produto.

## 21. O que esta v1.5 corrige

Esta versão corrige principalmente seis distorções:

1. explicita o caráter multi-CLI do agente;
2. corrige a leitura equivocada de multi-ICL como se cada modelo fosse target de build;
3. alinha a especificação ao multi-tenant real em `clients/<id>/`;
4. retira do campo de "implementado" o bootstrap que ainda não existe no código atual;
5. documenta a entrega de automação em `clients/<id>/entregaveis/automacao/<stack>/`;
6. formaliza PDF obrigatório para relatórios `.md` de cliente e remediação obrigatória na auditoria de automação.

## 22. Conclusão

O ecossistema BKPilot deve ser entendido hoje da seguinte forma:

- o agente local é o núcleo operacional do QA;
- a plataforma web é o núcleo de gestão e entrega;
- as skills continuam sendo o principal ativo operacional;
- o projeto é multi-CLI por distribuição;
- o projeto é multi-tenant por cliente;
- entregas de automação para cliente vivem em `clients/<id>/entregaveis/automacao/<stack>/`;
- relatórios `.md` destinados ao cliente também devem ser entregues em PDF;
- a auditoria de automação deve corrigir defeitos técnicos corrigíveis antes da entrega;
- a especificação deve refletir a realidade implementada, sem esconder o roadmap, mas sem misturá-lo com o presente.

Esse alinhamento é essencial para que produto, arquitetura e operação evoluam na mesma direção.

Confidencial - BKPilot - Setor de Inteligência Artificial
