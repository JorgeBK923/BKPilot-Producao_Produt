---
id: plano-automacao
description: "Analisa o sistema e gera um plano estrategico de automacao com escopo, prioridades, riscos, estimativas e recomendacao de stack."
name: "Plano Estrategico de Automacao de Testes"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
  - playwright.browser_navigate
  - playwright.browser_click
  - playwright.browser_fill_form
  - playwright.browser_snapshot
  - playwright.browser_take_screenshot
  - playwright.browser_wait_for
  - playwright.browser_press_key
  - playwright.browser_evaluate
  - playwright.browser_console_messages
  - playwright.browser_network_requests
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks:
  - console_monitoring
  - network_monitoring
  - session_reauth
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: url
    required: true
    description: "URL base do sistema a avaliar"
  - name: login
    required: false
    description: "Email de autenticacao. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: horas-base
    required: false
    description: "Valor hora do profissional de automacao em reais (default: 150)"
  - name: time-size
    required: false
    description: "Quantidade de QAs na equipe de automacao (default: 1)"
  - name: modulo-core
    required: false
    description: "Nome do modulo central do sistema (opcional)"
  - name: dominio
    required: false
    description: "Contexto do negocio em linguagem natural. Ex: ERP de vendas e faturamento para industria textil"
  - name: equipe-junior
    required: false
    description: "Flag para aplicar multiplicador de risco de equipe aprendendo (+25% em horas)"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /plano-automacao — Plano Estratégico de Automação de Testes

> Seguir a regra global de evidência visual obrigatória definida nas instruções do projeto.
>
> Aplica-se a **TODAS as ICLs** (Claude, GLM, Minimax, Kimi, MiMo, Qwen, GPT, Codex). Ver §7.1 do CLAUDE.md.

## Descrição

Skill de **consultoria embarcada** que analisa um sistema web e gera um Plano Estratégico de Automação de Testes completo. Responde as perguntas que todo time de QA/Dev enfrenta antes de automatizar: _"O que automatizamos primeiro? Quanto tempo leva? O sistema está pronto? Vale a pena?"_

A skill mapeia o sistema, identifica o core de negócio, avalia a automatizabilidade técnica de cada módulo, calcula estimativas de horas/custo e entrega um plano de execução por fases (Quick Wins → Core → Completo).

**Diferencial:** ao contrario de uma planilha de estimativa "no escuro", está skill **olha o sistema real** e mede: estabilidade de seletores, presenca de IDs, complexidade de fluxos, dependência de dados, APIs disponiveis, e ambiente. A estimativa é baseada em evidência, não em achismo.

## Uso

```
/plano-automacao --cliente <id> <URL> [--login <email>] [--horas-base <n>] [--time-size <n>] [--modulo-core "<nome>"] [--dominio "<descricao>"]
```

## Parametros

- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL base do sistema a avaliar (obrigatório)
- `--login <email>` — email de autenticacao. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`
- `--horas-base <n>` — valor hora do profissional de automação em reais (default: 150). Usado para calcular custo financeiro
- `--time-size <n>` — quantidade de QAs na equipe de automação (default: 1). Usado para calcular prazo em dias úteis
- `--modulo-core "<nome>"` — se o time já sabe qual é o módulo central, informe para acelerar a análise (opcional)
- `--dominio "<descricao>"` — contexto do negócio em linguagem natural (opcional, mas recomendado). Ex: `"ERP de vendas e faturamento para indústria têxtil"`. Usado para julgar valor de negócio dos módulos com mais precisão
- `--equipe-junior` — flag explicita para aplicar multiplicador de risco de equipe aprendendo (+25% em horas). NÃO é inferida automáticamente

## Instrucoes de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANCA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpastas:
  - `clients/<id>/resultado/<timestamp>/screenshots/` — evidências visuais do mapeamento
  - `clients/<id>/resultado/<timestamp>/videos/` — gravacao da sessão de análise
  - `clients/<id>/resultado/<timestamp>/dados_brutos/` — JSONs de análise intermediária
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/` (em Windows, se symlink falhar por falta de permissao, gerar `clients/<id>/resultado/latest.txt` contendo o timestamp atual como fallback)

### 2.1 Configuração de gravacao de video
Ao iniciar o browser via Playwright MCP, ativar gravacao com `recordVideo` (camelCase) — snake_case (`record_video`) é silenciosamente ignorado no Node.js:
```javascript
browser.newContext({
  recordVideo: {
    dir: 'clients/<id>/resultado/<timestamp>/videos/_raw/',
    size: { width: 1280, height: 720 }
  }
});
```
- Usar `page.video()` para obter o objeto Video e `await page.video().path()` para o caminho do arquivo.
- Fechar o contexto (`await context.close()`) para finalizar o arquivo `.webm` antes de lê-lo.
- Converter `.webm` → `.mp4` com: `ffmpeg -i input.webm -c:v libx264 -crf 23 -preset fast output.mp4`. Se ffmpeg não estiver disponível, manter `.webm`, exibir aviso e continuar (non-blocking).

Um unico video contínuo cobre toda a sessão de avaliação.

### 2.2 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 2.3 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 2.4 Re-autenticacao de sessão (BLOCK-D)
A skill é de longa duracao e pode expirar sessão durante o scan de varios módulos:
- Monitorar redirecionamento para login, 401/403 em requisições autenticadas, modal de sessão expirada
- Re-autenticar com `--login` + `QA_PASSWORD` e retomar
- Registrar contagem de re-autenticacoes no resumo final (indicador de instabilidade que entra na Fase 2.4 como penalidade de ambiente)

---

## Nota sobre Arquitetura de Execução

Esta skill roda **100% via MCP Playwright**. Todo o scan de DOM, screenshot, navegação e julgamento é feito pelo agente LLM em sessão única.

> **Por que não usar scripts Node?** Scripts Node são cegos para contexto. Se um seletor muda, um modal aparece, ou a página re-renderiza, o script quebra. O MCP vê a tela e adapta. Como esta skill roda uma vez por projeto (ou a cada 6 meses), o custo de tokens é irrelevante frente ao valor de uma decisão correta.
>
> Sistemas grandes (>10 módulos) podem levar 20-40 min — isso é esperado para uma skill de consultoria estratégica.

### Cleanup (BLOCK-E)

Esta skill **não cria dados** no sistema por padrão — apenas lê e inspeciona DOM. Se durante a avaliação for feito um teste mutativo (criar registro para avaliar cleanup), este deve ser removido antes do fim da skill e registrado em `cleanup_log.json`. Em modo somente-leitura (default), nenhum cleanup é necessário.

---

## ⛔ Critérios de parada negativa

Voce **NÃO PODE** encerrar a skill nem imprimir o resumo final enquanto qualquer item abaixo estiver falso:

- [ ] O arquivo `clients/<id>/resultado/<timestamp>/dados_brutos/scores_automatizabilidade.json` existe e contém uma entrada para cada módulo listado em `clients/<id>/estado/mapa.md` (ou identificado na mini-exploração). Verificar no disco com Read/Glob antes de marcar como verde
- [ ] O módulo central (core) foi identificado e documentado com evidência
- [ ] Todos os módulos mapeados tem score de automatizabilidade calculado (0-100)
- [ ] A matriz de prioridade (Valor de Negocio x Fácilidade) está preenchida para todos os módulos
- [ ] Estimativas de horas foram calculadas para pelo menos os 3 primeiros módulos do plano
- [ ] O veredito de viabilidade técnica foi emitido (Viável / Parcialmente Viável / Não Viável)
- [ ] Bloqueadores técnicos foram listados com severidade e acao sugerida
- [ ] `clients/<id>/resultado/<timestamp>/automacao_plano_<timestamp>.md` foi gerado com todas as seções
- [ ] `clients/<id>/resultado/<timestamp>/automacao_estimativa_<timestamp>.xlsx` (ou `.md` se Excel não disponível) foi gerado

**Regra de honestidade:** se um sistema não tem IDs estáveis, se os seletores são todos XPath frágeis, ou se o ambiente cai a cada 5 minutos, o veredito deve ser **"Não Viável"** ou **"Parcialmente Viável"** com bloqueadores claros. Não vender automação impossível.

---

## Fase 1 — Mapeamento do Sistema e Identificação do Core

### 1.1 Reaproveitar ou executar exploração
Se `clients/<id>/estado/mapa.md`, `clients/<id>/estado/elementos.json` e `clients/<id>/estado/fluxos.md` já existirem (de um `/explorar` anterior):
- Ler os artefatos existentes
- Validar se estao completos (minimo: 5 páginas mapeadas, 3 fluxos identificados)
- Se incompletos: executar uma mini-exploração para completar

Se não existirem:
- Executar mapeamento rápido do sistema (versao enxuta do `/explorar`):
  - Navegar pela URL base e menus principais
  - Identificar módulos/areas principais
  - Mapear fluxos críticos (login, cadastro, acao principal do sistema)
  - Limite: 30 minutos de exploração ou 30 páginas (o que vier primeiro)
  - Não e necessario abrir todos os modais/wizards — apenas identificar que eles existem

### 1.2 Identificação do Core do Sistema

O **core** é o módulo/fluxo onde está a proposta de valor do sistema. Pergunte:

1. **Sem qual funcionalidade o sistema não faz sentido?** (Ex: num ERP de vendas, é o cadastro de pedido. Num BI, é a geração de relatórios.)
2. **Qual fluxo gera valor direto para o usuário final?**
3. **Qual módulo tem mais elementos interativos, formulários, e regras de negocio?**
4. **Onde os bugs teriam maior impacto no negocio?**

**Se `--módulo-core` foi passado:** validar se o módulo informado realmente existe no mapa. Se não existir, alertar e usar a heurística acima.

**Registrar no relatório:**
```markdown
## Módulo Central (Core) do Sistema
- **Nome:** <módulo>
- **Justificativa:** <por que este é o core>
- **Fluxos críticos:** <lista>
- **Evidência:** <screenshot da página principal do core>
```

**Screenshot obrigatório:** `screenshots/core_módulo_<nome>.png` — evidência visual da página principal do módulo core.

---

## Fase 2 — Avaliação de Automatizabilidade Técnica

Para **cada módulo/página** mapeado, avaliar os seguintes critérios técnicos via Playwright MCP. O agente deve navegar até a página, inspecionar o DOM com `browser_evaluate`, observar comportamento visual e registrar tudo em JSON.

### 2.1 Critérios objetivos (o agente consegue medir diretamente)

| # | Critério | O que medir | Como avaliar |
|---|---|---|---|
| 1 | **IDs estáveis** | Contar elementos interativos (`button, a, input, select, textarea`) que têm `id` não-dinâmico (ex: `id="btn-submit"` ✅ vs `id="react-select-2-input"` ❌) | `browser_evaluate` + regex simples |
| 2 | **data-testid / QA seletores** | Contar elementos com `data-testid`, `data-qa`, `data-automation` | `browser_evaluate` |
| 3 | **Loading state visível** | Ao carregar a página, existe spinner/skeleton com seletor estável? | Observação visual + screenshot |
| 4 | **Modais consistentes** | Modais/toasts usam a mesma estrutura HTML (mesmas classes, mesmo padrão) ou são ad-hoc? | Observação visual em 2-3 interações |
| 5 | **Re-renderizações** | A página pisca, elementos somem e reaparecem sem ação do usuário? | Observação visual ao navegar |
| 6 | **Massa de dados via API** | Existe endpoint de API para criar/excluir registros? (de `clients/<id>/estado/api_endpoints.json` ou interceptação de rede) | Checar `api_endpoints.json` ou `network_log.json` |
| 7 | **Ambiente estável** | A sessão permaneceu ativa? Quantos erros 5xx/timeouts em `network_log.json`? | Dados de `network_log.json` + contagem de re-autenticações |
| 8 | **Performance de carga** | Tempo médio de carregamento das páginas do módulo | `performance.timing` via `browser_evaluate` |

**Execução:**
- Para cada módulo, navegar até sua página principal
- Executar o script de contagem de seletores via `browser_evaluate`:
  ```javascript
  () => {
    const interativos = document.querySelectorAll('button, a, input, select, textarea');
    const comIdEstavel = Array.from(interativos).filter(el => 
      el.id && !el.id.match(/^(react|vue|ng)-\d+$/i)
    ).length;
    const comTestId = Array.from(interativos).filter(el => 
      el.getAttribute('data-testid') || el.getAttribute('data-qa')
    ).length;
    return {
      total: interativos.length,
      comIdEstavel,
      comTestId,
      pctIdEstavel: Math.round((comIdEstavel / interativos.length) * 100),
      pctTestId: Math.round((comTestId / interativos.length) * 100)
    };
  }
  ```
- Tirar screenshot da página
- Observar visualmente: loading, modais, re-renderizações
- Salvar resultado em `dados_brutos/automatizabilidade_<modulo>.json`

### 2.2 Score de Automatizabilidade (simplificado)

O agente atribui uma nota qualitativa a cada critério e converte para score numérico:

| Critério | Peso | Nota possível |
|---|---|---|
| IDs estáveis (% de elementos) | 25 | 0-100% → nota 0-1 |
| data-testid presente | 15 | Sim (≥1 elemento) = 1, Não = 0 |
| Loading state visível | 10 | Sim estável = 1, Sim instável = 0.5, Não = 0 |
| Modais consistentes | 10 | Sim = 1, Misto = 0.5, Não = 0 |
| Re-renderizações | 10 | Nenhuma = 1, Leve = 0.5, Grave = 0 |
| Massa de dados via API | 15 | Sim = 1, Só UI = 0.5, Não = 0 |
| Ambiente estável | 10 | Estável = 1, Alguns erros = 0.5, Muitos erros = 0 |
| Performance < 3s | 5 | Sim = 1, Não = 0 |

```
Score = (IDs% * 0.25) + (data-testid * 15) + (loading * 10) + 
        (modais * 10) + (render * 10) + (massa * 15) + 
        (ambiente * 10) + (performance * 5)

Arredondar para inteiro. Score sempre em [0, 100].
```

**Classificação:**
- 80-100: Excelente — altamente automatizável
- 60-79: Bom — automatizável com alguns ajustes
- 40-59: Regular — exige investimento em preparação (IDs, estabilização)
- 20-39: Ruim — difícil de automatizar, alto custo de manutenção
- 0-19: Não viável — não automatizar neste momento

**Salvar em:** `dados_brutos/scores_automatizabilidade.json`

```json
{
  "modulos": [
    {
      "nome": "Pedidos",
      "score": 72,
      "classificacao": "Bom",
      "detalhes": {
        "pctIdEstavel": 45,
        "pctTestId": 10,
        "loadingEstavel": true,
        "modaisConsistentes": true,
        "reRenderizacoes": false,
        "massaViaApi": true,
        "ambienteEstavel": true,
        "performanceOk": true
      }
    }
  ]
}
```

> **Nota:** o regex de IDs dinâmicos na heurística acima (`/^(react|vue|ng)-\d+$/i`) é uma aproximação inicial. Frameworks podem gerar padrões diferentes (ex: `rfs-`, `frc-`, `_ngcontent-`). O agente deve ajustar a regex no `browser_evaluate` se detectar outro padrão dominante no sistema avaliado.
```

---

## Fase 3 — Matriz de Prioridade (Valor de Negocio x Fácilidade)

### 3.1 Classificação de Valor de Negocio por módulo

**Se `--dominio` foi passado:** usar o contexto do negócio para julgar qual módulo é mais crítico. Ex: num ERP de vendas, "Pedidos" é 5 mesmo que tenha poucos elementos.

**Se `--dominio` NÃO foi passado:** usar apenas heurísticas do DOM (número de elementos, formulários, fluxos) + o módulo core identificado na Fase 1.2.

| Valor | Critério |
|---|---|
| 5 (Critico) | Core do sistema. Sem ele, o produto não entrega valor. Ex: checkout, geração de relatório, chat IA |
| 4 (Alto) | Funcionalidade essencial usada diariamente por >50% dos usuários |
| 3 (Médio) | Funcionalidade importante mas não bloqueante, usada semanalmente |
| 2 (Baixo) | Funcionalidade secundaria, usada ocasionalmente |
| 1 (Muito Baixo) | Configuracoes, preferencias, telas de administracao raramente usadas |

### 3.2 Classificação de Fácilidade (baseada no Score de Automatizabilidade)

| Fácilidade | Score |
|---|---|
| 5 (Muito Fácil) | 80-100 |
| 4 (Fácil) | 60-79 |
| 3 (Moderado) | 40-59 |
| 2 (Difícil) | 20-39 |
| 1 (Muito Difícil) | 0-19 |

### 3.3 Matriz de Prioridade

Criar a matriz 5x5 e posicionar cada módulo:

```
                FACILIDADE (Automação)
           1(Dif)  2      3(Mod)  4      5(Fácil)
        ┌────────┬──────┬──────┬──────┬──────────┐
    5   │   Q4   │  Q4  │  Q2  │  Q2  │    Q1    │ ← QUICK WINS
        │Depriori│Deprio│ Core │ Core │ Automat. │
        ├────────┼──────┼──────┼──────┼──────────┤
    4   │   Q4   │  Q4  │  Q2  │  Q1  │    Q1    │
 V      │Depriori│Deprio│ Core │Quick │  Quick   │
 A      ├────────┼──────┼──────┼──────┼──────────┤
 L   3  │   Q4   │  Q3  │  Q3  │  Q2  │    Q2    │
 O      │Depriori│Oport.│Oport.│ Core │   Core   │
 R      ├────────┼──────┼──────┼──────┼──────────┤
    2   │   Q4   │  Q4  │  Q3  │  Q3  │    Q3    │
        │Depriori│Deprio│Oport.│Oport.│ Oportun. │
        ├────────┼──────┼──────┼──────┼──────────┤
    1   │   Q4   │  Q4  │  Q4  │  Q4  │    Q3    │
        │Depriori│Deprio│Deprio│Deprio│ Oportun. │
        └────────┴──────┴──────┴──────┴──────────┘

Quadrantes:
Q1 = Quick Wins (Fácil + Alto Valor) — automatizar PRIMEIRO
Q2 = Core Estratégico (Difícil + Alto Valor) — automatizar DEPOIS dos quick wins
Q3 = Oportunidades (Fácil + Baixo Valor) — automatizar se sobrar tempo
Q4 = Depriorizar (Difícil + Baixo Valor) — NÃO automatizar agora
```

**Entregável obrigatório:** tabela markdown da matriz incluída direto no relatório (§7.1 seção 4). A matriz em formato de tabela é suficiente — não é necessário gerar imagem PNG.

---

## Fase 4 — Estimativa de Horas e Custos

### 4.1 Cálculo de complexidade por cenário

Para cada fluxo/módulo, classificar a complexidade media dos cenários:

| Tipo de Cenario | Complexidade | Horas Base | Regra para escolher dentro da faixa |
|---|---|---|---|
| Navegação simples | Simples | 2h + 1h se score <60 | Login, acessar página, validar titulo/elemento visível |
| Formulário básico | Simples | 3h ate 3 campos; +0.5h por campo adicional (max 5h) | Preencher, submeter, validar mensagem de sucesso |
| Formulário com validação | Médio | 4h base; +1h por cenário de erro validado (max 8h) | Multiplos campos, validações cruzadas, mensagens de erro |
| CRUD completo | Médio | 6h base; +2h se exige validação de listagem com filtro/ordenação (max 10h) | Criar, ler, atualizar, excluir |
| Wizard multi-etapa | Complexo | 8h se ≤3 passos; 12h se 4-5 passos; 16h se >5 passos com validação cruzada | Persistencia de estado entre passos |
| Integração com API | Complexo | 8h se contrato documentado; 12h se exige reverse engineering; +2h se precisa mock | Validar dados via API, teste de contrato |
| Upload de arquivo | Complexo | 6h se unico tipo; 9h se múltiplos tipos; 12h se ha pipeline de processamento assincrono | Upload, validação, verificacao de arquivo |
| Teste de IA/Chat | Muito Complexo | 12h se validação por keywords; 18h se validação semântica; 24h se exige guardrails + contexto | Respostas de LLM |
| Teste de concorrencia | Muito Complexo | 10h se 2 abas; 15h se sessão expirando; 20h se lock otimista + rollback | Multiplas sessoes simultaneas |
| Teste de volume | Muito Complexo | 10h se <1k registros; 14h se páginação + ordenação; 18h se busca com fuzzy match | Grandes volumes de dados |

**Regra geral:** sempre partir do piso da faixa. Subir para o teto apenas quando o cenário acumula ≥2 fatores da coluna "Regra" — cada fator soma aproximadamente 1/3 do intervalo restante. Registrar no relatório qual regra levou ao numero escolhido.

### 4.2 Multiplicadores de risco

Aplicar multiplicadores sobre o total de horas estimado por módulo:

| Risco | Multiplicador | Quando aplicar |
|---|---|---|
| Sistema instavel (muitos 5xx/timeouts) | +30% | Se `network_log.json` tem >5 erros 5xx ou >10 requisições >5s |
| Sem IDs / seletores frágeis | +25% | Se score de "IDs únicos" < 30% dos elementos |
| Dependencia de dados complexa | +20% | Se cleanup_log.json tem itens "pendente" ou massa exige muitos passos |
| Ambiente compartilhado (não isolado) | +15% | Se o ambiente de teste é compartilhado com dev/manual |
| Sistema legado (sem documentação) | +20% | Se não ha documentação de API, não ha swagger, etc. |
| Equipe júnior em automação | +25% | Se a flag `--equipe-junior` foi passada explicitamente pelo usuário. **Nunca inferir a partir de `--time-size`** (ausente/default não implica equipe junior) |

### 4.3 Custos de manutenção

Calcular manutenção anual estimada:

```
Manutenção Anual = (Horas Totais de Automação * 0.25) horas

Justificativa: em média, 25% do esforço inicial de automação é gasto em manutenção anual
(quedas de teste por mudanca de UI, ajuste de dados, refatoracao).
Se o sistema for muito instavel (score < 40), usar 35%.
```

### 4.4 Consolidação da estimativa

Para cada módulo do Q1 e Q2 (Quick Wins + Core):

```markdown
## Estimativa por Módulo: <Nome>
- **Complexidade media dos cenários:** <Simples/Médio/Complexo/Muito Complexo>
- **Quantidade de cenários estimados:** <n> (baseado na quantidade de fluxos e formulários)
- **Horas por cenário:** <n>h
- **Horas totais (bruto):** <n>h
- **Multiplicadores aplicados:** <lista>
- **Horas totais (ajustado):** <n>h
- **Custo total (R$):** R$ <n> (@ R$<horas-base>/hora)
- **Prazo com <time-size> QA(s):** <n> dias úteis
```

**Salvar tabela completa em:** `automacao_estimativa_<timestamp>.md` (ou `.xlsx` se ferramenta disponível)

---

## Fase 5 — Veredito de Viabilidade Técnica

### 5.1 Análise de bloqueadores

Listar todos os bloqueadores encontrados durante as Fases 1-4:

| Bloqueador | Severidade | Impacto na Estimativa | Acao Sugerida |
|---|---|---|---|
| Exemplo: Sistema usa IDs dinâmicos (React sem data-testid) | Alta | +40% de manutenção | Solicitar ao time de dev adicionar `data-testid` nos 20 elementos principais |
| Exemplo: Ambiente de staging cai frequentemente | Alta | +30% de horas | Estabilizar ambiente antes de começar |
| Exemplo: Não ha API documentada | Media | +20% de horas | Criar contratos de API ou usar apenas UI |
| Exemplo: Sistema tem CAPTCHA no login | Alta | Impossibilita automação completa | Solicitar bypass de CAPTCHA em ambiente de teste |
| Exemplo: 2FA obrigatório sem bypass | Alta | Impossibilita automação | Criar usuário de teste com 2FA desabilitado |

### 5.2 Veredito

Emitir um dos tres vereditos:

#### ✅ **VIÁVEL** (Score médio >= 60)
> O sistema está pronto para automação. Os seletores são estáveis, o ambiente é acessível, e os fluxos principais podem ser automatizados sem bloqueadores críticos. Recomenda-se iniciar pelo plano de Quick Wins.

#### ⚠️ **PARCIALMENTE VIÁVEL** (Score médio 30-59)
> O sistema permite automação parcial. Existem bloqueadores que aumentam o custo e a manutenção, mas ainda é possível obter ROI positivo automatizando os módulos mais estáveis (Quick Wins). Recomenda-se resolver os bloqueadores de severidade Alta antes de expandir para o Core.

#### ❌ **NÃO VIÁVEL** (Score médio < 30)
> O sistema não está preparado para automação neste momento. Os custos de manutenção superarão os benefícios. Recomenda-se investir em preparação técnica primeiro (adicionar IDs, estabilizar ambiente, documentar APIs) e reavaliar em 3-6 meses.

### 5.3 ROI Estimado (quando Viável ou Parcialmente Viável)

> **Aviso:** Esta seção é uma **estimativa ilustrativa**. Os dados de "cenários manuais por sprint" e "tempo médio por cenário" são defaults do mercado (10 cenários/sprint, 15 min/cenário). Para precisão, o time deve substituir pelos números reais da equipe.

Calcular retorno sobre investimento simplificado:

```markdown
## ROI Estimado (Ilustrativo — ajuste com dados reais da equipe)

### Cenario Atual (Manual) — Defaults
- **Cenarios manuais por sprint:** 10 (default de mercado)
- **Tempo médio por cenário manual:** 15 minutos (default de mercado)
- **Horas gastas em teste manual/sprint:** 2.5h
- **Custo manual/ano (R$):** R$ <n> (2.5h × 20 sprints × R$<horas-base>)

### Cenario com Automação
- **Cenarios automatizados (Fase 1):** <n>
- **Horas investidas em automação:** <n>h
- **Custo de automação (R$):** R$ <n>
- **Tempo de execução automatizado/sprint:** <n> minutos (vs <n> horas manual)
- **Economia de horas/sprint:** <n>h
- **Payback (meses):** <n> meses ate o investimento se pagar
- **Economia anual estimada (apos payback):** R$ <n>
```

---

## Fase 6 — Plano de Execução por Fases

### Fase A: Quick Wins (Semanas 1-2)
**Objetivo:** Entregar valor rápido e provar que automação funciona no projeto.
- **Módulos:** Quadrante Q1 da matriz (Fácil + Alto Valor)
- **Quantidade de cenários:** 5-10 cenários simples
- **Horas estimadas:** 20-40h
- **Entregável:** Suite de testes automatizados rodando em CI/CD (se houver)
- **Mensagem para stakeholders:** "Em 2 semanas, os testes de login e cadastro já rodam automáticamente a cada deploy."

### Fase B: Core Estratégico (Semanas 3-8)
**Objetivo:** Automatizar o módulo central do sistema.
- **Módulos:** Quadrante Q2 da matriz (Difícil + Alto Valor)
- **Quantidade de cenários:** 10-20 cenários
- **Horas estimadas:** 60-120h
- **Entregável:** Cobertura automatizada do fluxo principal de negocio
- **Mensagem para stakeholders:** "O fluxo de pedido completo (criar → aprovar → faturar) agora tem regressao automática."

### Fase C: Ampliação (Semanas 9-12)
**Objetivo:** Cobrir módulos secundarios e casos de borda.
- **Módulos:** Q3 da matriz (Oportunidades)
- **Quantidade de cenários:** 5-10 cenários
- **Horas estimadas:** 30-60h

### Fase D: Manutenção Contínua
**Objetivo:** Manter a suite saudavel.
- **Horas/sprint:** 4-8h (ajuste de seletores, dados, revisao de falhas)
- **Revisao trimestral:** Reavaliar se novos módulos surgiram ou se o sistema mudou drasticamente

---

## Fase 7 — Geração dos Artefatos

### ⛔ Regra obrigatória — PDF para todo relatório destinado ao cliente

Todo arquivo `.md` gerado por esta skill que for destinado ao cliente **DEVE** ter um PDF correspondente. Isso inclui obrigatoriamente:

- `automacao_plano_<timestamp>.md` → `automacao_plano_<timestamp>.pdf`
- `automacao_estimativa_<timestamp>.md` (ou `.xlsx`) → `automacao_estimativa_<timestamp>.pdf`
- `automacao_viabilidade_<timestamp>.md` → `automacao_viabilidade_<timestamp>.pdf`

**Por que PDF é obrigatório:**
> O Markdown pode quebrar formatação, tabelas e quebras de página dependendo do visualizador. PDF garante que stakeholders, gestores e times de desenvolvimento vejam o documento exatamente como foi gerado, com formatação preservada, pronto para apresentação, assinatura ou arquivamento.

**Como gerar:**
- Se o projeto possuir conversor de Markdown para PDF (ex: `node cenarios/_md_to_pdf.js`): usá-lo
- Se não possuir: usar `pandoc` se disponível no sistema
- Se nenhuma ferramenta estiver disponível: manter apenas o `.md` e registrar um aviso no relatório final

**Nunca entregar apenas Markdown** a stakeholders externos ou clientes.

---

### 7.1 Plano Estratégico (`automacao_plano_<timestamp>.md`)

```markdown
# Plano Estratégico de Automação de Testes

**Cliente/Sistema:** <URL>
**Data da Avaliação:** <timestamp>
**Avaliador:** BugKillers QA Agent
**Veredito:** <Viável / Parcialmente Viável / Não Viável>

---

## 1. Resumo Executivo

| Métrica | Valor |
|---|---|
| Módulos mapeados | <n> |
| Score médio de automatizabilidade | <n>/100 |
| Veredito | <Viável/Parcialmente Viável/Não Viável> |
| Horas totais estimadas (Q1 + Q2) | <n>h |
| Custo total estimado | R$ <n> |
| Prazo estimado | <n> semanas |
| Payback estimado | <n> meses |

**Recomendacao principal:** <texto>

---

## 2. Módulo Central (Core)
- **Nome:** <módulo>
- **Justificativa:** <texto>
- **Fluxos críticos:** <lista>
- **Evidência:** <caminho do screenshot>

---

## 3. Score de Automatizabilidade por Módulo

| Módulo | Score | Classificação | IDs (%) | Data-testid (%) | Estabilidade | Dados | Ambiente |
|---|---|---|---|---|---|---|---|
| ...    | <n>   | Excelente     | <n>%    | <n>%            | <n>/10       | <n>/10| <n>/10   |

---

## 4. Matriz de Prioridade

<inserir tabela ou imagem da matriz>

### Q1 — Quick Wins (Automatizar PRIMEIRO)
| Módulo | Valor Negocio | Fácilidade | Horas Est. | Custo (R$) |
|---|---|---|---|---|
| ...    | 5             | 5          | 20h        | R$ 3.000   |

### Q2 — Core Estratégico (Automatizar DEPOIS)
| Módulo | Valor Negocio | Fácilidade | Horas Est. | Custo (R$) |
|---|---|---|---|---|
| ...    | 5             | 3          | 80h        | R$ 12.000  |

### Q3 — Oportunidades (Se sobrar tempo)
| Módulo | Valor Negocio | Fácilidade | Horas Est. | Custo (R$) |
|---|---|---|---|---|
| ...    | 2             | 4          | 30h        | R$ 4.500   |

### Q4 — Depriorizar (Não automatizar agora)
| Módulo | Motivo |
|---|---|
| ...    | Baixo valor + Alta complexidade. ROI negativo. |

---

## 5. Estimativa Detalhada

<inserir tabelas da Fase 4>

---

## 6. Bloqueadores Técnicos

| Bloqueador | Severidade | Acao Sugerida | Responsavel | Prazo |
|---|---|---|---|---|
| ...        | Alta       | ...           | Time de Dev | ...   |

---

## 7. Plano de Execução

### Fase A: Quick Wins (Semanas 1-2)
...

### Fase B: Core Estratégico (Semanas 3-8)
...

### Fase C: Ampliação (Semanas 9-12)
...

### Fase D: Manutenção Contínua
...

---

## 8. ROI Estimado

<inserir cálculo da Fase 5.3>

---

## 9. Recomendações Finais

1. **Imediata:** <acao>
2. **Curto prazo:** <acao>
3. **Médio prazo:** <acao>
```

### 7.2 Estimativa em Planilha (`automacao_estimativa_<timestamp>.xlsx` ou `.md`)

**Critério de decisão xlsx vs md:**
1. Verificar se `package.json` do projeto declara `exceljs` OU `xlsx` como dependência instalada (checar `node_modules/`)
2. Se sim → gerar `.xlsx` via script Node local (usar `require('exceljs')` ou `require('xlsx')` diretamente)
3. Se não → gerar `.md` equivalente. **Não tentar instalar pacote automaticamente** (viola princípio do §7 BLOCK-A sobre dependências externas)

Abas/seções obrigatórias em ambos os formatos:
1. **Resumo** — tabela consolidada por módulo (nome, score, quadrante, horas, custo)
2. **Detalhamento** — cenário a cenário com horas e regra aplicada (da tabela §4.1)
3. **Cronograma** — semana a semana com entregáveis
4. **Custos** — horas × valor hora × multiplicadores

### 7.3 Ficha Técnica (`automacao_viabilidade_<timestamp>.md`)
Documento técnico focado no time de desenvolvimento:
- Seletores problemáticos encontrados (com exemplos de HTML)
- APIs detectadas e sua usabilidade para testes
- Sugestões de melhorias para fácilitar automação (ex: "Adicionar data-testid nos botões de acao")

### 7.4 Entrega ao Cliente
Todo `.md` destinado ao cliente deve ser copiado para `clients/<id>/entregaveis/automacao/<stack>/` com `.pdf` correspondente, conforme convenção do AGENTS.md. Nunca enviar `clients/<id>/resultado/<timestamp>/governanca/`, `.env`, tokens, `geracao_id`, identidade de modelo/agente/executor ou logs internos ao cliente.

---

## 8. Resumo Final

```
✅ Plano Estratégico de Automação concluido
   Sistema: <URL>
   Módulos mapeados: <n>
   Score médio de automatizabilidade: <n>/100
   Veredito: <Viável / Parcialmente Viável / Não Viável>
   
   Quick Wins identificados: <n> módulos
   Core Estratégico: <n> módulos
   Horas totais estimadas: <n>h
   Custo total estimado: R$ <n>
   Prazo com <time-size> QA(s): <n> semanas
   Payback estimado: <n> meses
   
   Bloqueadores críticos: <n>
   
   Artefatos:
     clients/<id>/resultado/latest/automacao_plano_<timestamp>.md
     clients/<id>/resultado/latest/automacao_estimativa_<timestamp>.xlsx (ou .md)
     clients/<id>/resultado/latest/automacao_viabilidade_<timestamp>.md
     clients/<id>/resultado/latest/screenshots/
     clients/<id>/resultado/latest/videos/

➡️ Próximo passo (se Viável ou Parcialmente Viável):
     1. Apresentar plano para stakeholders
     2. Resolver bloqueadores de severidade Alta
     3. Executar /explorar completo para o módulo Q1 (Quick Win)
     4. Iniciar /gerar-cenarios para o primeiro Quick Win
     
➡️ Próximo passo (se Não Viável):
     1. Apresentar plano de preparação técnica
     2. Agendar reavaliação em 3 meses
```

---

## Encadeia para

**Se Viável ou Parcialmente Viável:**
- `/explorar` — para mapeamento profundo do primeiro Quick Win
- `/gerar-cenarios` — para gerar cenários do Quick Win
- `/executar-planilha` — para começar a automatizar

**Se Não Viável:**
- Nenhuma skill de execução. O output é um plano de acao para o time de dev.

## Artefatos Gerados

- `clients/<id>/resultado/<timestamp>/automacao_plano_<timestamp>.md` — Plano estratégico completo
- `clients/<id>/resultado/<timestamp>/automacao_estimativa_<timestamp>.xlsx` (ou `.md`) — Estimativa detalhada
- `clients/<id>/resultado/<timestamp>/automacao_viabilidade_<timestamp>.md` — Ficha técnica de viabilidade
- `clients/<id>/resultado/<timestamp>/dados_brutos/` — JSONs de análise intermediária
- `clients/<id>/resultado/<timestamp>/screenshots/` — Evidências visuais
- `clients/<id>/resultado/<timestamp>/videos/` — Gravacao da sessão
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`

---

## Notas de Implementação

### Diferença entre está skill e `/explorar`
- `/explorar` foca em **mapear tudo** (completude) para gerar cenários de teste funcionais.
- `/plano-automacao` foca em **avaliar a viabilidade** (qualidade técnica) para decidir se e o que automatizar.

### Diferença entre está skill e `/gerar-cenarios`
- `/gerar-cenarios` assume que a automação VAI acontecer e gera cenários.
- `/plano-automacao` decide SE a automação deve acontecer, em que ordem, e quanto custa.

### Quando usar
- **Antes** de vender/propor automação para um cliente
- **Antes** de iniciar um projeto de automação interno
- **Após** uma mudanca grande no sistema (para reavaliar)
- **Periodicamente** (a cada 6 meses) para ajustar o roadmap de automação
