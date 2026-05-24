# Guia QA - Skill `/plano-automacao`

Versão 1.0 - Abril 2026

## 1. Objetivo deste guia

Este guia ensina o QA a usar a skill `/plano-automacao` do BKPilot.

A skill `/plano-automacao` é uma **consultoria embarcada** que olha o sistema real do cliente e responde, com evidências:

- **Vale a pena** automatizar este sistema?
- **O que** devemos automatizar primeiro?
- **Quanto tempo** leva e **quanto custa**?
- **O sistema está pronto** para automação ou precisa de preparação?
- **Quais bloqueadores** técnicos impedem ou dificultam a automação?

Este guia também explica como acessar a VPS do BKPilot pelo Termius, como executar o comando dentro da VPS e como baixar para o computador local os relatórios gerados pela skill.

---

## 2. Para quem este guia foi escrito

Este guia foi escrito para o QA que vai operar o BKPilot em ambiente remoto, especialmente em uma VPS Linux.

Você não precisa ser especialista em infraestrutura, mas precisa seguir o fluxo com disciplina. A skill `/plano-automacao` gera um **plano estratégico de automação**, não um projeto completo. Ela decide *se* e *o que* automatizar antes de qualquer investimento de tempo.

---

## 3. Visão geral da skill

### 3.1 O que a skill faz

A skill `/plano-automacao` analisa um sistema web e entrega um Plano Estratégico de Automação de Testes, composto por:

- **Mapeamento do sistema:** identifica módulos e o core de negócio
- **Score de automatizabilidade:** nota de 0 a 100 por módulo, baseada em evidências do DOM
- **Matriz de Prioridade:** posiciona cada módulo em quadrantes (Quick Wins, Core, Oportunidades, Depriorizar)
- **Estimativa de horas e custos:** por módulo, com multiplicadores de risco
- **Veredito de Viabilidade:** Viável / Parcialmente Viável / Não Viável
- **Bloqueadores técnicos:** lista de impedimentos com severidade e ação sugerida
- **ROI estimado:** payback em meses (ilustrativo, com defaults de mercado)
- **Plano de execução por fases:** Quick Wins → Core Estratégico → Ampliação → Manutenção

### 3.2 Diferença para outras skills

| Skill | Função | Quando usar |
|-------|--------|-------------|
| `/explorar` | Mapeia tudo (completude) | Antes de gerar cenários |
| `/plano-automacao` | **Decide se vale a pena automatizar** | **Antes** de propor automação ao cliente |
| `/gerar-cenarios` | Gera cenários de teste | Depois que a automação foi aprovada |
| `/gerar-automacao-cliente` | Gera código de automação | Depois que cenários estão validados |

> **Regra de ouro:** se você não sabe se o sistema está pronto para automação, execute `/plano-automacao` primeiro. Ela pode economizar semanas de trabalho em um sistema inviável.

---

## 4. Quando usar esta skill

Use `/plano-automacao` nestes cenários:

- **Antes** de vender ou propor automação para um cliente novo
- **Antes** de iniciar um projeto de automação interno
- **Após** uma grande mudança no sistema (para reavaliar viabilidade)
- **Periodicamente** (a cada 6 meses) para ajustar o roadmap de automação
- **Quando a estimativa anterior saiu errada** e você precisa de dados reais para justificar a correção

**Não use** esta skill:
- como substituto de `/explorar` (ela faz apenas um mapeamento enxuto)
- como substituto de `/gerar-cenarios` (ela não gera cenários executáveis)
- para gerar código de automação (use `/gerar-automacao-cliente` para isso)

---

## 5. Fluxo recomendado de ponta a ponta

O fluxo mais seguro é:

```text
/plano-automacao
  -> avaliar veredito
  -> se Viável ou Parcialmente Viável:
       -> apresentar plano ao cliente
       -> resolver bloqueadores de severidade Alta
       -> executar /explorar completo
       -> executar /gerar-cenarios
       -> executar /testar-modulo ou /executar-planilha
       -> executar /gerar-automacao-cliente
       -> executar /auditar-automacao-cliente
  -> se Não Viável:
       -> apresentar plano de preparação técnica
       -> agendar reavaliação em 3-6 meses
```

A skill `/plano-automacao` entra **antes** de todo o pipeline de execução. Ela é a porta de entrada para decidir se o pipeline deve ser acionado.

---

## 6. Pré-requisitos na VPS

Antes de usar a skill, confirme que a VPS já está preparada:

- repositório do BKPilot clonado;
- dependências instaladas com `npm install`;
- Playwright e Chromium instalados;
- CLI operacional autenticada (Claude Code, OpenCode, etc.);
- arquivo `clients/<id>/.env` do cliente alvo configurado com `QA_PASSWORD` (multi-tenant: cada cliente tem seu próprio `.env` em `clients/<id>/`);
- espaço em disco suficiente para screenshots, vídeos e relatórios.

Comandos rápidos de verificação:

```bash
pwd
ls
node -v
npm -v
npx playwright --version
claude --version
```

Se `package.json`, `.claude/commands/` e `documentacao_projeto/` não aparecerem no `ls`, você provavelmente não está na pasta correta do projeto.

---

## 7. Dados que você precisa antes de executar

Tenha estes dados em mãos:

```text
URL do sistema: <URL_BASE_DO_CLIENTE>
Login de teste: <EMAIL_DE_TESTE>
Senha: QA_PASSWORD (já em clients/<id>/.env)
Contexto do negócio: <DESCRICAO_DO_DOMINIO>
Valor hora do QA: <VALOR> (default: R$ 150)
Tamanho da equipe: <N> (default: 1 QA)
```

Exemplo:

```text
URL: https://erp.cliente.com.br
Login: qa@cliente.com
Dominio: "ERP de vendas e faturamento para indústria têxtil"
Horas-base: 180
Time-size: 2
```

O parâmetro `--dominio` é **opcional mas recomendado**. Sem ele, a skill vai adivinhar o valor de negócio dos módulos apenas pelo DOM, o que pode levar a erros (ex: uma tela de "Configuração de Impostos" pode ter poucos elementos mas ser crítica para o negócio).

---

## 8. Acessar a VPS e entrar no projeto

### 8.1 Conectar pelo Termius

Use o Termius para conectar na VPS (veja o guia "Guia QA - Skills de Automação do Cliente.md" para detalhes de instalação e configuração).

Após conectar:

```bash
cd ~/bkpilot
pwd
ls
```

O `ls` deve mostrar:

```text
AGENTS.md
CLAUDE.md
README.md
package.json
src/
.claude/
clients/<id>/estado/
clients/<id>/resultado/
cenarios/
clients/<id>/entregaveis/
```

### 8.2 Abrir a CLI

Na VPS, dentro da pasta do projeto:

```bash
claude
```

Depois que a CLI abrir, você poderá digitar o slash command.

---

## 9. Skill `/plano-automacao`

### 9.1 Para que serve

Use esta skill para **avaliar a viabilidade de automação** antes de investir tempo e dinheiro.

Ela não gera código. Ela gera um **diagnóstico estratégico** com:

- diagnóstico técnico do sistema (seletores, estabilidade, ambiente);
- matriz de prioridade (o que automatizar primeiro);
- estimativa de horas e custo;
- veredito de viabilidade;
- bloqueadores com ações sugeridas;
- plano de execução por fases.

### 9.2 Sintaxe básica

```text
/plano-automacao <URL> [--login <email>] [--horas-base <n>] [--time-size <n>] [--modulo-core "<nome>"] [--dominio "<descricao>"]
```

Exemplo mínimo:

```text
/plano-automacao https://erp.cliente.com.br --login qa@cliente.com
```

Exemplo completo:

```text
/plano-automacao https://erp.cliente.com.br --login qa@cliente.com --horas-base 180 --time-size 2 --dominio "ERP de vendas e faturamento para indústria têxtil"
```

### 9.3 Parâmetros

| Parâmetro | Obrigatório | Default | Descrição |
|-----------|-------------|---------|-----------|
| `<URL>` | Sim | — | URL base do sistema a avaliar |
| `--login` | Sim (se sistema protegido) | — | Email de autenticação. Senha lida de `QA_PASSWORD` em `clients/<id>/.env` |
| `--horas-base` | Não | 150 | Valor hora do profissional em reais |
| `--time-size` | Não | 1 | Quantidade de QAs na equipe de automação |
| `--modulo-core` | Não | — | Nome do módulo central, se já conhecido |
| `--dominio` | Não | — | Contexto do negócio em linguagem natural |
| `--equipe-junior` | Não | false | Aplica +25% em horas por curva de aprendizado |

**Regras de segurança:**
- Nunca passe senha inline (`--login email:senha`). Use apenas o email.
- A senha é lida automaticamente da variável `QA_PASSWORD` em `clients/<id>/.env` (multi-tenant).

### 9.4 Quando passar `--dominio`

Passe `--dominio` sempre que souber o contexto de negócio. Exemplos:

```text
--dominio "E-commerce de moda feminina com checkout próprio"
--dominio "Sistema de gestão hospitalar com prontuário eletrônico"
--dominio "Plataforma de cursos online com checkout e certificação"
--dominio "ERP de vendas, estoque e faturamento de fábrica de estofados"
```

Sem `--dominio`, a skill vai usar apenas heurísticas do DOM (quantidade de elementos, formulários, fluxos) para julgar o valor de negócio. Isso funciona, mas é menos preciso.

### 9.5 Quando passar `--modulo-core`

Passe `--modulo-core` se o time já souber qual é o módulo mais importante do sistema. Exemplos:

```text
--modulo-core "Pedidos"
--modulo-core "Checkout"
--modulo-core "Chat IA"
```

Se não passar, a skill vai identificar o core automaticamente usando heurísticas.

---

## 10. O que a skill cria

Após a execução, confira:

```bash
ls clients/<id>/resultado/latest/
```

Artefatos esperados:

```text
automacao_plano_<timestamp>.md          # Plano estratégico completo
automacao_estimativa_<timestamp>.md     # Estimativa detalhada (ou .xlsx)
automacao_viabilidade_<timestamp>.md    # Ficha técnica para o time de dev
dados_brutos/
  scores_automatizabilidade.json        # Score por módulo
  automatizabilidade_<modulo>.json      # Dados brutos de cada módulo
screenshots/
  core_modulo_<nome>.png                # Screenshot do módulo core
videos/
  <arquivo>.mp4                         # Gravação da sessão de análise
console_log.json                         # Erros/warnings do browser
network_log.json                         # Requisições com erro e lentas
```

### ⚠️ Regra obrigatória — PDF para todo relatório destinado ao cliente

Todo arquivo `.md` gerado por esta skill que for destinado ao cliente **DEVE** ter um PDF correspondente:

- `automacao_plano_<timestamp>.md` → `automacao_plano_<timestamp>.pdf`
- `automacao_estimativa_<timestamp>.md` → `automacao_estimativa_<timestamp>.pdf`
- `automacao_viabilidade_<timestamp>.md` → `automacao_viabilidade_<timestamp>.pdf`

**Por que PDF é obrigatório:**
> O Markdown pode quebrar formatação, tabelas e quebras de página dependendo do visualizador. PDF garante que stakeholders, gestores e times de desenvolvimento vejam o documento exatamente como foi gerado, com formatação preservada, pronto para apresentação, assinatura ou arquivamento.

**Como gerar:**
- Se o projeto possuir conversor de Markdown para PDF (ex: `node cenarios/_md_to_pdf.js`): usá-lo
- Se não possuir: usar `pandoc` se disponível no sistema
- Se nenhuma ferramenta estiver disponível: manter apenas o `.md` e registrar um aviso no relatório final

**Nunca entregar apenas Markdown** a stakeholders externos ou clientes.

### 10.1 Arquivo mais importante: `automacao_plano_<timestamp>.md`

Este é o entregável principal. Ele contém:

1. Resumo Executivo (score médio, veredito, custo, prazo, payback)
2. Módulo Central (Core) identificado
3. Score de Automatizabilidade por Módulo
4. Matriz de Prioridade (Q1-Q4)
5. Estimativa Detalhada
6. Bloqueadores Técnicos
7. Plano de Execução por Fases
8. ROI Estimado (ilustrativo)
9. Recomendações Finais

### 10.2 Arquivo para o time de dev: `automacao_viabilidade_<timestamp>.md`

Este documento técnico contém:

- seletores problemáticos encontrados (com exemplos de HTML);
- APIs detectadas e sua usabilidade para testes;
- sugestões de melhorias para facilitar automação (ex: "Adicionar data-testid nos botões de ação").

---

## 11. Como interpretar o resultado

### 11.1 Veredito: Viável (Score médio >= 60)

**Significado:** O sistema está pronto para automação.

**Ação:**
- Apresente o plano aos stakeholders
- Inicie pela Fase A (Quick Wins) em 1-2 semanas
- Reserve 3-8 semanas para o Core Estratégico

### 11.2 Veredito: Parcialmente Viável (Score médio 30-59)

**Significado:** O sistema permite automação parcial, mas existem bloqueadores.

**Ação:**
- Automatize apenas os Quick Wins (Q1) inicialmente
- Resolva bloqueadores de severidade **Alta** antes de expandir
- Reavalie o Core em 1-2 meses

### 11.3 Veredito: Não Viável (Score médio < 30)

**Significado:** O sistema não está preparado. O custo de manutenção superará os benefícios.

**Ação:**
- Não inicie automação agora
- Entregue o plano de preparação técnica (ficha `automacao_viabilidade_*.md`)
- Agende reavaliação em 3-6 meses

### 11.4 Como ler a Matriz de Prioridade

| Quadrante | Nome | Ação |
|-----------|------|------|
| Q1 | Quick Wins | **Automatizar PRIMEIRO** — fácil e de alto valor |
| Q2 | Core Estratégico | **Automatizar DEPOIS** — difícil mas de alto valor |
| Q3 | Oportunidades | **Se sobrar tempo** — fácil mas de baixo valor |
| Q4 | Depriorizar | **NÃO automatizar** — difícil e de baixo valor |

---

## 12. Checklist antes de apresentar o plano

Antes de enviar o relatório ao cliente ou stakeholder, confirme:

- [ ] `/plano-automacao` terminou sem erro
- [ ] `automacao_plano_<timestamp>.md` existe e tem todas as 9 seções
- [ ] `scores_automatizabilidade.json` existe e tem entrada para cada módulo
- [ ] Screenshot do core (`core_modulo_*.png`) existe
- [ ] Matriz de prioridade preenchida para todos os módulos
- [ ] Veredito emitido (Viável / Parcialmente Viável / Não Viável)
- [ ] Bloqueadores listados com severidade e ação sugerida
- [ ] Estimativa de horas calculada para Q1 e Q2
- [ ] Vídeo da sessão gravado (evidência de análise)
- [ ] ROI marcado como "Ilustrativo" (se usar defaults de mercado)
- [ ] **PDF gerado para todo `.md` destinado ao cliente** (`automacao_plano_*.pdf`, `automacao_estimativa_*.pdf`, `automacao_viabilidade_*.pdf`)
- [ ] Nenhum `.md` será entregue a stakeholder sem o PDF correspondente

---

## 13. Como baixar os arquivos da VPS

### 13.1 Compactar o relatório

```bash
mkdir -p exports
tar -czf exports/plano_automacao_<cliente>_<timestamp>.tar.gz \
  clients/<id>/resultado/<timestamp>/automacao_plano_<timestamp>.md \
  clients/<id>/resultado/<timestamp>/automacao_estimativa_<timestamp>.md \
  clients/<id>/resultado/<timestamp>/automacao_viabilidade_<timestamp>.md \
  clients/<id>/resultado/<timestamp>/screenshots/
```

Exemplo:

```bash
tar -czf exports/plano_automacao_acme_2026-04-24_1430.tar.gz \
  clients/<id>/resultado/2026-04-24_1430/automacao_plano_2026-04-24_1430.md \
  clients/<id>/resultado/2026-04-24_1430/automacao_estimativa_2026-04-24_1430.md \
  clients/<id>/resultado/2026-04-24_1430/automacao_viabilidade_2026-04-24_1430.md \
  clients/<id>/resultado/2026-04-24_1430/screenshots/
```

### 13.2 Conferir tamanho

```bash
ls -lh exports/
```

### 13.3 Baixar pelo Termius (SFTP)

1. No Termius, conecte no host `BKPilot VPS`.
2. Abra a área de `SFTP` ou `Files`.
3. Navegue até `/home/<USUARIO_DA_VPS>/bkpilot/exports/`.
4. Baixe o arquivo `.tar.gz` para sua máquina local.

### 13.4 Descompactar localmente

No Windows: use 7-Zip ou WinRAR.

No macOS/Linux:

```bash
tar -xzf plano_automacao_acme_2026-04-24_1430.tar.gz
```

---

## 14. Problemas comuns

### 14.1 A skill diz que o sistema é "Não Viável"

**Não é um erro.** É um resultado válido. O sistema pode realmente não estar pronto.

**Ação:**
- Leia a seção de bloqueadores no `automacao_plano_*.md`
- Entregue a ficha técnica `automacao_viabilidade_*.md` ao time de dev
- Agende reavaliação em 3-6 meses

### 14.2 A sessão expirou durante o scan

A skill monitora sessão expirada (BLOCK-D) e re-autentica automaticamente.

Se houver muitas re-autenticações, isso é um **indicador de instabilidade** e vai reduzir o score de ambiente.

**Ação:**
- Verifique `network_log.json` para erros 401/403
- Considere marcar o ambiente como instável no relatório

### 14.3 O score ficou muito baixo em um módulo que deveria ser alto

**Causas comuns:**
- O módulo usa IDs dinâmicos (React/Vue gerados)
- Não há `data-testid` nos elementos principais
- A página tem re-renderizações excessivas

**Ação:**
- Verifique o `automatizabilidade_<modulo>.json` para detalhes
- Sugira ao time de dev adicionar `data-testid` nos 20 elementos principais

### 14.4 Não consigo avaliar o valor de negócio sem `--dominio`

Sem `--dominio`, a skill usa apenas heurísticas do DOM. Isso pode classificar mal um módulo crítico.

**Ação:**
- Pare a execução
- Reexecute com `--dominio "<descricao do negócio>"`

### 14.5 O relatório não gerou `.xlsx`

A skill tenta gerar `.xlsx` se `exceljs` ou `xlsx` estiverem instalados em `node_modules/`.

Se não estiver, ela gera `.md` equivalente.

**Ação:**
- Verifique se `package.json` tem `exceljs` ou `xlsx`
- Se não tiver, use o `.md` — ele contém as mesmas informações

---

## 15. Exemplo completo de operação

### Contexto

```text
Cliente: acme
Sistema: https://erp.acme.com.br
VPS: 203.0.113.10
Usuário VPS: bkpilot
Projeto na VPS: /home/bkpilot/bkpilot
Login de teste: qa@acme.com
```

### Passo 1: conectar pelo Termius

Conecte na VPS e entre no projeto:

```bash
cd /home/bkpilot/bkpilot
ls
```

### Passo 2: abrir a CLI

```bash
claude
```

### Passo 3: executar o plano

```text
/plano-automacao https://erp.acme.com.br --login qa@acme.com --horas-base 180 --time-size 2 --dominio "ERP de vendas e faturamento para indústria têxtil"
```

### Passo 4: aguardar a execução

A skill vai:
1. Mapear o sistema (ou reaproveitar `/explorar` anterior)
2. Identificar o core
3. Scanear DOM de cada módulo
4. Calcular scores
5. Montar matriz de prioridade
6. Estimar horas e custos
7. Emitir veredito

**Tempo estimado:** 10-40 minutos, dependendo do tamanho do sistema.

### Passo 5: conferir artefatos

No terminal da VPS:

```bash
ls clients/<id>/resultado/latest/
cat clients/<id>/resultado/latest/automacao_plano_*.md | head -n 80
```

### Passo 6: compactar

```bash
mkdir -p exports
tar -czf exports/plano_automacao_acme_$(date +%Y-%m-%d_%H%M).tar.gz \
  resultado/latest/automacao_plano_*.md \
  resultado/latest/automacao_estimativa_*.md \
  resultado/latest/automacao_viabilidade_*.md \
  resultado/latest/screenshots/
ls -lh exports/
```

### Passo 7: baixar pelo Termius

No SFTP do Termius:

```text
/home/bkpilot/bkpilot/exports/plano_automacao_acme_2026-04-24_1430.tar.gz
```

### Passo 8: revisar localmente

Descompacte e leia o plano antes de apresentar.

---

## 16. Boas práticas de segurança

- Nunca coloque senha no comando (`--login email:senha` é proibido).
- Nunca envie `clients/<id>/clients/<id>/resultado/<timestamp>/governanca/` ao cliente.
- Nunca envie `console_log.json` ou `network_log.json` ao cliente sem revisão.
- **Sempre gere PDF para todo `.md` destinado ao cliente. Nunca entregue apenas Markdown.**
- Sempre revise o veredito antes de apresentar — a skill pode ser conservadora demais ou otimista demais.
- Sempre confirme se o screenshot do core existe antes de marcar o gate como verde.
- Sempre remova exports antigos se a VPS estiver ficando cheia.

Para limpar exports antigos:

```bash
ls -lh exports
rm exports/<arquivo_antigo>.tar.gz
```

Use `rm` com cuidado. Confira o nome do arquivo antes de apagar.

---

## 17. Resumo operacional rápido

Comando principal:

```text
/plano-automacao <URL> --login <EMAIL> --dominio "<DESCRICAO>"
```

Pasta de saída:

```text
resultado/<timestamp>/
```

Arquivos mais importantes:

```text
automacao_plano_<timestamp>.md          # Entregável principal
automacao_viabilidade_<timestamp>.md    # Ficha técnica para devs
screenshots/core_modulo_<nome>.png      # Evidência visual
```

Compactar:

```bash
tar -czf exports/plano_automacao_<cliente>_<timestamp>.tar.gz \
  clients/<id>/resultado/<timestamp>/automacao_*.md \
  clients/<id>/resultado/<timestamp>/screenshots/
```

Baixar pelo Termius:

```text
SFTP -> /home/<USUARIO_DA_VPS>/bkpilot/exports/
```

---

## 18. Checklist rápido do QA

Antes de executar:

- [ ] `clients/<id>/.env` configurado com `QA_PASSWORD`
- [ ] URL do sistema confirmada e acessível
- [ ] Login de teste válido
- [ ] `--dominio` preparado (opcional mas recomendado)

Durante a execução:

- [ ] Aguardar todas as fases (não interromper)
- [ ] Verificar se sessão expirou (re-autenticação automática)

Após a execução:

- [ ] `automacao_plano_*.md` gerado com 9 seções
- [ ] `scores_automatizabilidade.json` existe
- [ ] Screenshot do core existe
- [ ] Veredito coerente com a realidade observada
- [ ] Arquivos compactados em `exports/`
- [ ] Pacote baixado pelo Termius
- [ ] Revisão local feita antes de apresentar

---

## 19. Glossário

| Termo | Significado |
|-------|-------------|
| **Quick Win** | Módulo fácil de automatizar e de alto valor — automatizar primeiro |
| **Core** | Módulo central do sistema, onde está a proposta de valor |
| **Score** | Nota de 0 a 100 de automatizabilidade técnica |
| **Matriz Q1-Q4** | Quadrantes de prioridade (Valor de Negócio × Facilidade) |
| **Veredito** | Decisão final: Viável / Parcialmente Viável / Não Viável |
| **Bloqueador** | Impedimento técnico que dificulta ou impede a automação |
| **Payback** | Tempo em meses até o investimento em automação se pagar |

---

*Documento gerado em: Abril 2026*
*Skill: `/plano-automacao` v1.0*
