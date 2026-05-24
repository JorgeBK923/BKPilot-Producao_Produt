---
id: explorar
description: "Mapeia o sistema alvo, telas, fluxos, elementos interativos, estados, console, rede e endpoints para preparar geracao de cenarios."
name: "Mapeamento do Sistema Alvo"
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
  - playwright.browser_console_messages
  - playwright.browser_network_requests
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks:
  - console_monitoring
  - network_monitoring
  - session_reauth
  - cleanup
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: url
    required: true
    description: "URL base do sistema a explorar"
  - name: login
    required: true
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: delta
    required: false
    description: "Caminho para mapa existente (clients/<id>/estado/mapa.md). Ativa modo delta — compara com estado atual e explora apenas mudanças"
  - name: escopo
    required: false
    description: "Texto livre descrevendo a funcionalidade alvo. Ex: 'checkout com PIX', 'tela de relatórios financeiros'. Restringe exploração ao contexto descrito"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

> Seguir a regra global de evidência visual obrigatória definida nas instruções do projeto.
>
> Aplica-se a **TODAS as ICLs** (Claude, GLM, Minimax, Kimi, MiMo, Qwen, GPT, Codex). Ver §7.1 do CLAUDE.md.

# /explorar — Mapeamento do Sistema Alvo

## Descrição
Mapeia o sistema alvo por completo. Navega por todas as páginas acessíveis, abre modais e wizards, ativa abas, identifica elementos interativos, detecta fluxos, captura console errors, monitora rede, detecta endpoints de API e tira screenshots de cada tela.

A skill executa em **4 fases com portões obrigatórios**. Você não pode encerrar até passar pela auto-auditoria da Fase 4 com 100% de cobertura.

É o ponto de partida obrigatório de todo o pipeline de QA.

## Uso
```
/explorar --cliente <id> <URL> --login <email>
/explorar --cliente <id> <URL> --login <email> --delta clients/<id>/estado/mapa.md
/explorar --cliente <id> <URL>/nova-funcionalidade --login <email> --escopo "checkout com PIX"
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL base do sistema a explorar (obrigatório)
- `--login <email>` — email de autenticação. A senha é lida automaticamente da variável de ambiente `QA_PASSWORD` definida no `.env`
- `--delta <caminho>` — caminho para mapa existente (ex: `clients/<id>/estado/mapa.md`). Ativa **modo delta**: compara o estado atual do sistema com o mapa salvo e explora apenas páginas novas ou modificadas
- `--escopo <texto>` — texto livre descrevendo a funcionalidade alvo (ex: "checkout com PIX", "tela de relatórios financeiros"). Restringe a exploração ao contexto descrito, ignorando áreas não relacionadas

## Modo Delta — Exploração incremental

Quando `--delta clients/<id>/estado/mapa.md` é informado, a skill entra em **modo delta**. Em vez de explorar tudo do zero, ela:

1. **Carrega o mapa existente** de `clients/<id>/estado/mapa.md` e `clients/<id>/estado/elementos.json`
2. **Navega por todas as páginas** do sistema (como no modo normal)
3. **Compara cada página** com a versão salva no mapa:
   - Calcula hash do conteúdo principal (texto + estrutura DOM)
   - Compara com o hash salvo (se existir)
   - Classifica: `nova`, `modificada`, ou `inalterada`
4. **Pula páginas inalteradas** — não executa Fase 2 (modais, wizards, abas) nelas
5. **Explora a fundo** apenas páginas `novas` ou `modificadas` (Fase 2 completa)
6. **Atualiza o mapa** com as descobertas, mantendo o que já existia
7. **Gera `clients/<id>/estado/mapa_delta.md`** com resumo das mudanças detectadas

### Critérios de detecção de mudança

| Critério | Como detectar |
|----------|---------------|
| Página nova | URL não existe no mapa anterior |
| Página modificada | Hash do conteúdo ≠ hash salvo, ou novos elementos DOM (botões, forms, tabelas) |
| Página removida | URL existe no mapa anterior mas retorna 404 ou redirect |
| Inalterada | Hash do conteúdo = hash salvo E mesma contagem de elementos |

### Output do modo delta

Além dos artefatos normais, gera:

```markdown
# Delta Report — Exploração <timestamp>

## Resumo
- Páginas no mapa anterior: N
- Páginas novas: N
- Páginas modificadas: N
- Páginas removidas: N
- Páginas inalteradas (puladas): N

## Páginas novas
| URL | Título | Elementos |
|-----|--------|-----------|
| /nova-funcionalidade | Tela de Checkout | 3 forms, 5 botões, 1 tabela |

## Páginas modificadas
| URL | Título | Mudança detectada |
|-----|--------|-------------------|
| /dashboard | Dashboard | +2 botões, +1 modal "Exportar" |

## Páginas removidas
| URL | Título anterior | Status atual |
|-----|-----------------|--------------|
| /relatorio-antigo | Relatório v1 | 404 |

## Mapa atualizado
- `clients/<id>/estado/mapa.md` → atualizado com N páginas (era N, agora N)
- `clients/<id>/estado/elementos.json` → atualizado com novos elementos
```

### Modo delta + escopo

Quando `--delta` e `--escopo` são usados juntos:

```
/explorar --cliente <id> <URL> --login <email> --delta clients/<id>/estado/mapa.md --escopo "checkout com PIX"
```

A skill:
1. Carrega o mapa existente
2. **Foca apenas** nas páginas relacionadas ao escopo descrito
3. Identifica páginas novas/modificadas **dentro do escopo**
4. Ignora páginas fora do escopo (mesmo que sejam novas)
5. Gera delta report filtrado pelo escopo

**Exemplo:** se o escopo é "checkout com PIX", a skill explora a fundo `/checkout`, `/pagamento`, `/confirmacao-pix` mas ignora `/relatorios`, `/configuracoes`, etc.

---

## Comportamento fixo (definido pela spec, não pelo QA)
A profundidade e a completude da exploração não são parametrizáveis — são **contratuais** pela especificação da plataforma. A skill sempre:

- Aguarda renderização JavaScript (`networkidle`) antes de mapear cada página — SPA por padrão
- Abre todos os modais, drawers, popovers e dropdowns descobertos
- Percorre todos os passos de todos os wizards encontrados
- Ativa todas as abas de cada página
- Expande todos os accordions, cards colapsáveis e linhas "Ver mais"
- Respeita rotas listadas em `robots.txt` (`Disallow`) como únicas exclusões
- Aplica timeout de 30000ms por página (descarta se ultrapassar)
- Limite absoluto de 500 páginas (garde-fou de segurança, não de profundidade)

Esses valores são fixos. Se você se viu reduzindo qualquer um deles, você está fazendo errado.

## Modo mutativo — controlado pelo projeto, não pela CLI
A Fase 3 (ações reais POST/PUT/DELETE) é controlada pelo campo **`permite_mutativo`** do projeto cadastrado na plataforma BugKillers.

- Leia o valor de `permite_mutativo` consultando `GET /api/v1/projects/{id}` antes de iniciar
- **Default: `true`** — a exploração nasce profunda. Se o projeto não foi explicitamente configurado como somente-leitura, execute a Fase 3 normalmente
- Se `permite_mutativo: false`: pule a Fase 3 inteira e marque todos os itens dela como `N/A (permite_mutativo=false)` na ficha de cobertura da Fase 4
- Nunca peça confirmação ao cliente — a decisão já está no projeto. O QA operador BugKillers alterou antes se quis desativar

**Lembre-se:** modo mutativo gera escrita real no sistema alvo. A plataforma assume que o projeto aponta para dev/homologação. Responsabilidade do QA operador no cadastro do projeto.

---

## ⛔ Critérios de parada negativa (leia antes de tudo)

Você **NÃO PODE** encerrar a skill nem imprimir o resumo final enquanto qualquer item abaixo estiver falso:

- [ ] Todas as páginas descobertas na Fase 1 passaram pela Fase 2
- [ ] Cada botão de CRUD (Novo/Editar/Excluir/Criar/Adicionar) tem um screenshot do modal aberto
- [ ] Cada wizard teve **todos** os passos percorridos, cada passo com screenshot próprio
- [ ] Cada aba de cada página foi ativada e tem screenshot próprio
- [ ] `tempo_carregamento_ms` foi preenchido (não-nulo) em todas as páginas
- [ ] `console_log.json` e `network_log.json` acumulados existem e estão não-vazios em `clients/<id>/resultado/<timestamp>/`
- [ ] A ficha de cobertura (Fase 4) está 100% verde

Se `permite_mutativo = true` (default), adicione:
- [ ] Pelo menos 1 verbo POST, PUT ou DELETE foi registrado em `api_endpoints.json`
- [ ] `cleanup_log.json` existe e todos os itens criados foram revertidos ou registrados como pendência

**Regra de evidência:** um item só é considerado cumprido se existe um **arquivo no disco** que prove — screenshot com o nome esperado, entrada em JSON, linha em log. Não confie na sua memória do que "fez" durante a execução — antes de marcar qualquer item como verde na Fase 4, confirme o arquivo com Read/Glob/Bash. Sem arquivo = não conta.

**Regra de honestidade:** se não for possível cumprir um item (ex: botão "Novo Usuário" abre uma rota nova em vez de modal), registre isso explicitamente na ficha de cobertura como "N/A (justificativa)". Não invente que cumpriu.

---

## Instruções de Execução

### 1. Validação de segurança
Antes de qualquer ação, verificar se a senha foi passada inline no argumento `--login`:
- Se o argumento contiver `:` (ex: `--login email:senha`), **PARAR** e exibir:
  > ❌ ERRO DE SEGURANÇA: A senha não deve ser passada como argumento.
  > Configure QA_PASSWORD em clients/<id>/.env e use apenas --login <email>.
- Caso contrário, ler a senha da variável de ambiente `QA_PASSWORD`
- Se `QA_PASSWORD` não estiver definida e `--login` foi passado, **PARAR** e exibir:
  > ❌ QA_PASSWORD não encontrada. Crie clients/<id>/.env com: QA_PASSWORD=sua_senha

### 2. Preparação
- Criar pasta `clients/<id>/estado/` na raiz do projeto (se não existir)
- Criar pasta `clients/<id>/resultado/` na raiz do projeto (se não existir)
- Registrar timestamp de início: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/` para logs desta execução
- Atualizar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`
- Consultar `GET /api/v1/projects/{id}` para obter `permite_mutativo`. Se o projeto não for encontrado, abortar com erro claro. Se o campo existir, use-o; se a API não estiver disponível (execução local), assuma `true` como default

### 2.1 Consulta de sitemap.xml e robots.txt
Antes de iniciar a navegação, tentar obter informações prévias:
- **robots.txt:** acessar `<URL>/robots.txt`. Se existir: registrar rotas bloqueadas (`Disallow`) e sitemaps referenciados. Rotas bloqueadas devem ser **respeitadas** (não visitadas).
- **sitemap.xml:** acessar `<URL>/sitemap.xml`. Se existir: extrair URLs listadas como ponto de partida adicional, para não depender só da navegação visível.

### 2.2 Modo Delta — carregamento do mapa existente
Se `--delta <caminho>` foi informado:

1. **Verificar se o arquivo existe:**
   - Se `clients/<id>/estado/mapa.md` ou o arquivo informado **não existir**, abortar com erro:
     > ❌ Arquivo de mapa não encontrado: <caminho>. Execute /explorar sem --delta primeiro para criar o mapa inicial.
2. **Carregar `clients/<id>/estado/mapa.md`** e extrair a lista de páginas conhecidas (URLs, títulos, hashes se disponíveis)
3. **Carregar `clients/<id>/estado/elementos.json`** se existir — contém a estrutura detalhada de cada página (forms, botões, modais, wizards)
4. **Inicializar estrutura de delta:**
   ```json
   {
     "timestamp": "<timestamp>",
     "mapa_anterior": "<caminho>",
     "paginas_anteriores": N,
     "paginas_novas": [],
     "paginas_modificadas": [],
     "paginas_removidas": [],
     "paginas_inalteradas": []
   }
   ```
5. **Se `--escopo` também foi informado:** filtrar as páginas do mapa anterior para identificar quais já estão dentro do escopo. Isso serve como baseline para detectar mudanças relevantes.

### 2.3 Modo Escopo — restrição de contexto
Se `--escopo <texto>` foi informado (com ou sem `--delta`):

1. **Interpretar o escopo:** analisar o texto para identificar palavras-chave relacionadas a funcionalidades (ex: "checkout", "PIX", "relatório", "usuário")
2. **Durante a Fase 1**, ao descobrir páginas:
   - Se a URL, título ou conteúdo da página **corresponde ao escopo**: marcar como `dentro_do_escopo` e explorar normalmente
   - Se **não corresponde ao escopo**: registrar como `fora_do_escopo` e pular (não executa Fase 2)
3. **Critério de correspondência:** uma página está no escopo se:
   - A URL contém palavras-chave do escopo
   - O título da página contém palavras-chave do escopo
   - O conteúdo visível menciona termos do escopo
4. **No resumo final**, listar páginas fora do escopo que foram encontradas mas não exploradas

---

### 3. Autenticação (se --login foi passado)
- Abrir a URL base via Playwright MCP
- Localizar o formulário de login
- Preencher email com o valor de `--login` e senha com `QA_PASSWORD`
- Submeter e aguardar redirecionamento para área autenticada
- Registrar cookies/sessão para uso nas próximas páginas

### 3.1 Monitoramento de console do browser (BLOCK-B)
Ao iniciar o browser, ativar captura de mensagens do console:
- Interceptar eventos `console.error` e `console.warning`
- Registrar: `{ timestamp, level, text, url, lineNumber }`
- **Acumular continuamente em `clients/<id>/resultado/<timestamp>/console_log.json`** — este arquivo acumulado é obrigatório e será verificado na Fase 4
- Associar erros à página onde ocorreram (para inclusão no `elementos.json`)

### 3.2 Monitoramento de requisições de rede (BLOCK-C)
Ao iniciar o browser, ativar interceptação de rede:
- Registrar requisições com status >= 400 (erros HTTP)
- Registrar requisições que levaram mais de 3000ms (lentas)
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes }`
- **Acumular em `clients/<id>/resultado/<timestamp>/network_log.json`** — obrigatório e verificado na Fase 4
- **Detectar endpoints de API:** identificar requisições XHR/Fetch para URLs de API (padrões: `/api/`, `/v1/`, `/graphql`, JSON responses)
- Salvar endpoints descobertos em `clients/<id>/estado/api_endpoints.json`

### 3.3 Re-autenticação de sessão (BLOCK-D)
Durante toda a exploração, monitorar sinais de sessão expirada:
- Redirecionamento inesperado para página de login
- Resposta HTTP 401 ou 403
- Modal ou banner de "sessão expirada"

Se detectado: registrar evento, re-autenticar, voltar ao ponto onde parou, continuar.

---

## Fase 1 — Mapa raso (esqueleto)

**Objetivo:** descobrir todas as páginas acessíveis do sistema. Superficial de propósito — profundidade vem na Fase 2.

**O que fazer:**
- Navegar por links da sidebar, menus principais, breadcrumbs, footer
- Incorporar URLs do sitemap.xml como pontos de entrada adicionais
- Respeitar apenas: rotas bloqueadas por `robots.txt` e o limite absoluto de 500 páginas
- Aguardar `networkidle` antes de mapear cada página (SPA por padrão)
- Para cada página encontrada, registrar:
  - URL, título, profundidade
  - **`tempo_carregamento_ms`** (use `performance.timing` ou `page.metrics()` — não deixe null)
  - 1 screenshot base em `clients/<id>/estado/screenshots/<slug-da-url>.png`
  - Contagem preliminar de: formulários, botões, tabelas, modais visíveis, abas visíveis, wizards visíveis

**O que NÃO fazer nesta fase:**
- NÃO abra modais
- NÃO percorra wizards
- NÃO clique em botões de CRUD
- NÃO execute ações mutativas

**Tratamento de erros:**
- Timeout: registrar `status: timeout`, continuar
- Loop: registrar `status: duplicata`, pular
- Erro 404/500: registrar `status: erro_<codigo>`, pular
- Página restrita (403 ou redirect inesperado): registrar em "Padrões de Permissão" do mapa

**Se modo delta (`--delta`) está ativo:**
- Para cada página visitada, calcular hash do conteúdo (texto visível + estrutura DOM simplificada)
- Comparar com a entrada correspondente no mapa anterior:
  - **URL não existe no mapa anterior** → classificar como `nova`
  - **Hash diferente ou contagem de elementos mudou** → classificar como `modificada`
  - **Hash igual e mesma contagem de elementos** → classificar como `inalterada`
  - **URL do mapa anterior retorna 404** → classificar como `removida`
- Páginas `inalteradas`: registrar URL e título, **pular Fase 2** (não abre modais, não percorre wizards)
- Páginas `novas` ou `modificadas`: explorar normalmente (Fase 2 completa)
- Páginas `removidas`: registrar no delta report

**Se modo escopo (`--escopo`) está ativo:**
- Para cada página descoberta, verificar se corresponde ao escopo:
  - URL contém palavras-chave do escopo → `dentro_do_escopo`
  - Título ou conteúdo menciona termos do escopo → `dentro_do_escopo`
  - Caso contrário → `fora_do_escopo`
- Páginas `fora_do_escopo`: registrar e pular (não executa Fase 2)
- Páginas `dentro_do_escopo`: explorar normalmente

**Se ambos (`--delta` + `--escopo`) estão ativos:**
- Aplicar filtro de escopo primeiro
- Dentro do escopo, aplicar detecção delta (nova/modificada/inalterada)
- Páginas fora do escopo são ignoradas mesmo se forem novas

### Portão da Fase 1
Verifique antes de avançar:
- [ ] Lista de páginas existe em memória/rascunho
- [ ] `tempo_carregamento_ms` preenchido para **todas** as páginas (nunca null)
- [ ] Cada página tem pelo menos 1 screenshot base

Se qualquer item falhar, volte e complete. Só então prossiga para a Fase 2.

---

## Fase 2 — Aprofundamento por página (músculo)

**Objetivo:** para cada página da Fase 1, capturar tudo que está escondido atrás de cliques — modais, abas, wizards, accordions, expansões.

**Estratégia:** itere sobre cada página da Fase 1 e execute as 4 sub-ações abaixo antes de passar para a próxima página.

### 2.1 Ativar todas as abas
- Identifique componentes de tab (atributos: `role="tab"`, `role="tablist"`, classes `nav-tabs`, ou seletores de aba visíveis)
- Clique em cada aba
- Aguarde renderização
- Capture screenshot: `clients/<id>/estado/screenshots/<pagina>_aba_<nome>.png`
- Registre no array `abas` da página dentro de `elementos.json`, incluindo o conteúdo observado (tabelas, botões, contadores)

### 2.2 Abrir todos os modais de CRUD
- Identifique botões cujo texto ou `aria-label` contenha: `Novo`, `Criar`, `Adicionar`, `Editar`, `Excluir`, `Deletar`, `Configurar`, `Detalhes`, `Ver mais`
- Inclua botões dentro de colunas "Ações" de tabelas (ícones de lápis, lixeira, três-pontos)
- Para cada um:
  1. Clique no trigger
  2. Aguarde o modal/drawer renderizar (role="dialog", overlay, etc.)
  3. Capture **todos** os campos do formulário: nome, tipo, obrigatório, placeholder, validação visível, opções de dropdown
  4. Screenshot: `clients/<id>/estado/screenshots/<pagina>_modal_<acao>.png`
  5. Feche o modal (ESC ou botão Cancelar) — **NÃO salve/envie nada** nesta fase, mesmo com `permite_mutativo=true`. Escrita real só acontece na Fase 3
- Se o "botão" abre uma rota nova em vez de modal, registre como página da Fase 1 tardia e trate como tal
- Registre cada modal como item do array `modais` da página em `elementos.json`

### 2.3 Percorrer wizards de ponta a ponta
- Se a página tem wizard (stepper, passos N/M, carousel de onboarding):
  1. Preencha dados mínimos para avançar em cada passo — use valores neutros de fixture (não dados reais)
  2. Capture screenshot de CADA passo: `clients/<id>/estado/screenshots/<pagina>_wizard_passo<N>.png`
  3. Registre todos os campos de todos os passos
  4. No passo final, **NÃO clique em Finalizar/Confirmar** — volte ou cancele. A conclusão real do wizard só acontece na Fase 3 (quando `permite_mutativo=true`)
- Registre a estrutura completa do wizard (array de passos com campos) em `elementos.json`

### 2.4 Expandir elementos colapsáveis
- Accordions, cards expansíveis, linhas de tabela com "Ver mais", árvores de navegação, detalhes inline
- Para cada um: clique para expandir, capture o conteúdo interno, registre em `elementos.json`
- Relevante especialmente em: Dicionário de Dados (esquemas de tabela), Auditoria (detalhes de log), telas de Permissões, categorias de configuração

### Portão da Fase 2
Antes de avançar, verifique no disco:
- [ ] Para cada página da Fase 1, `elementos.json` tem arrays `abas`, `modais` e `wizards` preenchidos (ou explicitamente vazios com justificativa "não há na página")
- [ ] Existe 1 screenshot por aba, 1 por modal, 1 por passo de wizard
- [ ] Cada formulário capturado tem a lista de campos (não apenas "tem formulário")
- [ ] `tempo_carregamento_ms` continua preenchido (não foi sobrescrito por null)

Se falhar, volte à página específica e complete. Só então prossiga.

---

## Fase 3 — Exercício mutativo (pulso) — condicional ao projeto

**Objetivo:** executar ações reais em fluxos principais para capturar verbos POST/PUT/DELETE da API e validar fluxos ponta a ponta.

**Se `permite_mutativo = false` no projeto:** pule direto para a Fase 4. Na ficha de cobertura, marque todos os itens da Fase 3 como `N/A (permite_mutativo=false)`.

**Se `permite_mutativo = true` (default):** execute cada ação abaixo pelo menos uma vez, respeitando o BLOCK-E do CLAUDE.md (cleanup obrigatório).

### 3.1 Ação de consulta/chat
- Se houver chat, busca principal ou geração (IA): enviar 1 consulta real
- Aguardar resposta completa
- Capturar o endpoint POST correspondente em `network_log.json`
- Screenshot: `clients/<id>/estado/screenshots/fase3_consulta_resposta.png`
- Registrar a conversa/resultado criado em `cleanup_log.json` se aplicável

### 3.2 Ação CRUD de criação
- Escolher uma entidade de baixo impacto (conversa, rascunho, usuário de teste, grupo de teste)
- Criar com dados marcados como teste: prefixo `QA_TEST_<timestamp>`
- Registrar imediatamente em `clients/<id>/resultado/<timestamp>/cleanup_log.json`:
  ```json
  { "item": "QA_TEST_2026-...", "tipo": "usuario", "url": "...", "id": "..." }
  ```
- Captura de tela do registro criado

### 3.3 Ação de upload (se o sistema tiver)
- Upload de fixture mínima — CSV/Excel pequeno de `fixtures/` ou gerado na hora
- Se o upload tiver wizard multi-passo, percorra até o final e execute
- Registre em `cleanup_log.json`

### 3.4 Cleanup (obrigatório ao final da Fase 3)
Para cada item em `cleanup_log.json`:
- Reverter via interface (botão Excluir) ou API, conforme disponível
- Atualizar o mesmo registro com:
  ```json
  { ..., "status": "limpo" }
  ```
- Se não for possível reverter, marcar `"status": "pendente", "motivo": "..."` para o QA humano resolver

### Portão da Fase 3
- [ ] Pelo menos 1 verbo POST, PUT ou DELETE está registrado em `api_endpoints.json` com `descoberto_em` preenchido
- [ ] `cleanup_log.json` existe, com status de cada item criado
- [ ] Nenhum item ficou com status ausente (todos estão `limpo` ou `pendente` com motivo)

---

## Fase 4 — Auto-auditoria (espelho)

**Objetivo:** antes de dizer "terminei", provar que terminou. Verifique arquivos no disco, não sua memória.

### 4.1 Verificar evidência no disco
Use Glob/Read/Bash para contar arquivos reais:
- Quantos screenshots existem em `clients/<id>/estado/screenshots/`?
- Quantos modais foram esperados (contagem de botões CRUD em `elementos.json`)?
- Quantos wizards foram esperados e quantos passos cada um tem?
- `console_log.json` e `network_log.json` existem em `clients/<id>/resultado/<timestamp>/` e têm conteúdo (não são `[]`)?
- `api_endpoints.json` contém verbos mutativos (quando `permite_mutativo=true`)?

### 4.2 Gerar ficha de cobertura
Crie `clients/<id>/resultado/<timestamp>/cobertura.md` neste formato exato:

```markdown
# Ficha de Cobertura — Exploração <timestamp>

## Fase 1 — Mapa raso
- Páginas descobertas:              N
- Páginas com tempo_carregamento:   N/N     [✅|❌]
- Páginas com screenshot base:      N/N     [✅|❌]

## Fase 2 — Aprofundamento
- Abas ativadas:                    N/M     [✅|❌]
- Modais CRUD abertos:              N/M     [✅|❌]
- Wizards percorridos (passos):     N/M     [✅|❌]
- Formulários com campos completos: N/M     [✅|❌]
- Elementos colapsáveis expandidos: N/M     [✅|❌]

## Fase 3 — Exercício mutativo
- Modo:                             ativo|N/A (permite_mutativo=false)
- Verbos POST/PUT/DELETE:           N       [✅|❌|N/A]
- Ações de consulta exercitadas:    N       [✅|❌|N/A]
- Ações CRUD exercitadas:           N       [✅|❌|N/A]
- Cleanup executado:                sim|não [✅|❌|N/A]

## Logs acumulados (CLAUDE.md §3 e §4)
- console_log.json existe e não-vazio:  [✅|❌]
- network_log.json existe e não-vazio:  [✅|❌]

## Gaps identificados
<lista cada ❌ com: nome do item, página/elemento afetado, motivo>

## Itens marcados como N/A
<lista cada N/A com justificativa>
```

### 4.3 Regra do portão final
- Se há **qualquer ❌** na ficha: **volte à fase correspondente** e complete o item faltante. Regenere a ficha. Itere até tudo ficar ✅.
- Se todos os itens relevantes são ✅ (os N/A justificados são aceitáveis): prossiga para o passo 5.
- **NÃO** imprima o resumo final enquanto a ficha tiver ❌.

### 4.4 Regra de honestidade
- Não invente números. Se você não pode contar, vá ao disco e conte.
- Não marque ✅ por aproximação. Um único modal faltando é ❌.
- Se um item é genuinamente impossível (ex: página não tem wizard), marque como N/A com justificativa objetiva — isso é diferente de ❌.

---

## 5. Geração dos artefatos finais

Salvar em `clients/<id>/estado/`:

### `clients/<id>/estado/mapa.md` — estrutura completa do sistema
```
# Mapa do Sistema
Gerado em: <timestamp>
URL base: <url>
Total de páginas: <n>
Tempo total de exploração: <duração>
Re-autenticações necessárias: <n>
Modo mutativo: ativo | desativado

## Informações de Estrutura
- Sitemap.xml: encontrado | não encontrado
- Robots.txt: encontrado | não encontrado
- Rotas bloqueadas: <lista ou "nenhuma">
- WebSockets detectados: sim | não
- Service Workers: sim | não
- Scripts de terceiros: <lista>
- Cookie banner: sim | não

## Padrões de Permissão
- Roles/perfis detectados: <lista>
- Páginas restritas: <lista de URLs com 403/redirect>

## Páginas
### <título da página>
- URL: <url>
- Profundidade: <n>
- Status: mapeada | timeout | erro_404
- Tempo de carregamento: <ms>
- Elementos: N formulários, N botões, N tabelas, N modais, N abas, N wizards
- Abas ativadas: <lista>
- Modais abertos: <lista>
- Wizards percorridos: <lista com passos>
- Console errors: <n>
- Screenshots: <lista>
```

### `clients/<id>/estado/fluxos.md` — sequências de navegação identificadas
```
# Fluxos Identificados

## <Nome do Fluxo>
- Início: <url>
- Passos: página A → página B → página C
- Tipo: autenticação | CRUD | checkout | ...
- Formulários envolvidos: <lista>
- Exercitado na Fase 3: sim | não
```

### `clients/<id>/estado/elementos.json` — todos os elementos interativos
```json
{
  "paginas": [
    {
      "url": "...",
      "titulo": "...",
      "tempo_carregamento_ms": 1200,
      "console_errors": [
        { "level": "error", "text": "...", "lineNumber": 42 }
      ],
      "formularios": [
        {
          "id": "form-login",
          "origem": "pagina | modal-novo-usuario | wizard-passo2",
          "campos": [
            { "nome": "email", "tipo": "email", "obrigatorio": true, "placeholder": "..." }
          ]
        }
      ],
      "botoes": [...],
      "tabelas": [...],
      "abas": [
        { "nome": "Usuários", "screenshot": "..._aba_usuarios.png", "conteudo": "..." }
      ],
      "modais": [
        { "trigger": "Novo Usuário", "screenshot": "..._modal_novo.png", "campos": [...] }
      ],
      "wizards": [
        { "nome": "Importar dados", "passos": [ { "n": 1, "screenshot": "...", "campos": [...] } ] }
      ],
      "websockets": false,
      "scripts_terceiros": []
    }
  ]
}
```

### `clients/<id>/estado/api_endpoints.json` — endpoints detectados
```json
{
  "descoberto_em": "<timestamp>",
  "modo_mutativo": true,
  "total": 12,
  "endpoints": [
    { "method": "GET", "url": "/api/users", "descoberto_em": "página de listagem", "status": 200, "tempo_ms": 340 },
    { "method": "POST", "url": "/api/users", "descoberto_em": "Fase 3 — criação QA_TEST", "status": 201, "tempo_ms": 520 }
  ]
}
```

### `clients/<id>/resultado/<timestamp>/cobertura.md`
Gerado na Fase 4 (obrigatório).

### `clients/<id>/resultado/<timestamp>/cleanup_log.json`
Gerado na Fase 3 se `permite_mutativo=true` (obrigatório nesse caso).

### `clients/<id>/estado/mapa_delta.md` (se `--delta` foi usado)
Gerado apenas no modo delta. Contém:
- Contagem de páginas: anteriores, novas, modificadas, removidas, inalteradas
- Lista de páginas novas com URL, título e elementos detectados
- Lista de páginas modificadas com descrição da mudança
- Lista de páginas removidas com URL e status atual
- Mapa atualizado (merge do anterior com as descobertas)

---

## 6. Resumo final

**Só execute este passo se a Fase 4 terminou com ficha 100% verde.**

Exibir no terminal:
```
✅ Exploração concluída — cobertura 100%
   Páginas mapeadas:              <n>
   Fluxos identificados:          <n>
   Formulários encontrados:       <n>
   Modais abertos:                <n>
   Wizards percorridos:           <n>
   Abas ativadas:                 <n>
   Endpoints de API detectados:   <n> (GET: n, POST: n, PUT: n, DELETE: n)
   Console errors encontrados:    <n>
   Requisições com erro (4xx/5xx): <n>
   Requisições lentas (>3s):      <n>
   Re-autenticações realizadas:   <n>
   Modo mutativo:                 ativo | desativado
   Itens de cleanup:              <n> limpos, <n> pendentes
   Tempo total:                   <duração>
```

**Se modo delta (`--delta`) estava ativo**, adicionar ao resumo:
```
   Modo delta:                    ativo
   Páginas no mapa anterior:      <n>
   Páginas novas:                 <n>
   Páginas modificadas:           <n>
   Páginas removidas:             <n>
   Páginas inalteradas (puladas): <n>
   Delta report:                  clients/<id>/estado/mapa_delta.md
```

**Se modo escopo (`--escopo`) estava ativo**, adicionar ao resumo:
```
   Escopo:                        "<texto do escopo>"
   Páginas dentro do escopo:      <n>
   Páginas fora do escopo:        <n>
```

   Artefatos:
     clients/<id>/estado/mapa.md
     clients/<id>/estado/fluxos.md
     clients/<id>/estado/elementos.json
     clients/<id>/estado/api_endpoints.json
     clients/<id>/estado/screenshots/ (<n> imagens)
     clients/<id>/resultado/<timestamp>/cobertura.md
     clients/<id>/resultado/<timestamp>/console_log.json
     clients/<id>/resultado/<timestamp>/network_log.json
     clients/<id>/resultado/<timestamp>/cleanup_log.json (se permite_mutativo)
```

**Se modo delta estava ativo**, adicionar:
```
     clients/<id>/estado/mapa_delta.md
```

➡️  Próximo passo: /gerar-cenarios --cliente <id> --formato gherkin
```

---

## Encadeia para
`/gerar-cenarios`

## Artefatos gerados
- `clients/<id>/estado/mapa.md`
- `clients/<id>/estado/fluxos.md`
- `clients/<id>/estado/elementos.json`
- `clients/<id>/estado/api_endpoints.json`
- `clients/<id>/estado/screenshots/*.png`
- `clients/<id>/resultado/<timestamp>/cobertura.md`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/<timestamp>/cleanup_log.json` (se `permite_mutativo=true`)
- `clients/<id>/estado/mapa_delta.md` (se `--delta` foi usado)
