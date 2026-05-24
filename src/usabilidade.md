---
id: usabilidade
description: "Avalia usabilidade, heuristicas de Nielsen, eficiencia de fluxo, consistencia de UI, feedback visual, erros e atritos de navegacao."
name: "Avaliação Heurística de Usabilidade"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
  - playwright.browser_navigate
  - playwright.browser_click
  - playwright.browser_snapshot
  - playwright.browser_take_screenshot
  - playwright.browser_evaluate
  - fs.read_file
  - fs.write_file
inject_blocks:
  - console_monitoring
  - network_monitoring
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: url
    required: true
    description: "URL do sistema a avaliar"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: modulo
    required: false
    description: "Avaliar apenas páginas do módulo especificado"
  - name: fluxos
    required: false
    description: "Fluxos específicos para medir eficiência (separados por ;)"
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


# /usabilidade — Avaliação Heurística de Usabilidade

## Descrição
Avaliação completa de usabilidade baseada nas 10 heurísticas de Nielsen, análise de eficiência de fluxos, consistência de UI, feedback visual, UX de formulários, UX de erros e navegação. Gera relatório com score por heurística, recomendações de correção priorizadas e quick wins de maior impacto.

## Uso
```
/usabilidade --cliente <id> <URL> [--login <email>] [--modulo <nome>] [--fluxos "<fluxo1>;<fluxo2>"]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL do sistema a avaliar (obrigatório)
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`
- `--modulo <nome>` — avaliar apenas páginas do módulo especificado. Requer `clients/<id>/estado/mapa.md` (opcional)
- `--fluxos "<fluxo1>;<fluxo2>"` — fluxos específicos para medir eficiência (opcional). Ex: `"login → dashboard;cadastro → confirmação"`. Se omitido, os fluxos são inferidos de `clients/<id>/estado/fluxos.md` (se disponível) ou identificados durante a navegação

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpasta `clients/<id>/resultado/<timestamp>/videos/` para os vídeos MP4
- Criar subpasta `clients/<id>/resultado/<timestamp>/screenshots/` para capturas de violações
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 2.1 Configuração de gravação de vídeo
Ao iniciar o browser via Playwright MCP, ativar gravação de vídeo:
```
recordVideo: { dir: 'clients/<id>/resultado/<timestamp>/videos/_raw/', size: { width: 1280, height: 720 } }
```
Um único vídeo contínuo cobre toda a sessão de avaliação.

### 2.2 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 2.3 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 3. Autenticação e escopo
- Se `--login` foi passado: autenticar antes de iniciar a avaliação
- Se `--modulo` foi passado: ler `clients/<id>/estado/mapa.md` e filtrar URLs do módulo
- Se nem `--modulo` nem URL específica de página: avaliar URL base e navegar por links internos até profundidade 2
- Ler `clients/<id>/estado/fluxos.md` se disponível para contexto sobre fluxos do sistema
- Ler `clients/<id>/estado/elementos.json` se disponível para contexto sobre formulários e elementos

### 4. Avaliação heurística — As 10 Heurísticas de Nielsen

Para cada página no escopo, avaliar sistematicamente:

#### H1. Visibilidade do estado do sistema
O sistema informa ao usuário o que está acontecendo em tempo real?
- **Loading states:** ações que levam mais de 300ms têm indicador de carregamento (spinner, skeleton, progress bar)?
- **Feedback de ação:** cliques em botões dão feedback visual imediato (mudança de estado, animação, disable)?
- **Progresso em fluxos multi-etapa:** existe indicador de progresso (stepper, breadcrumb, "passo 2 de 4")?
- **Status de operações:** uploads, salvamentos e processos longos mostram progresso?
- **Notificações:** ações concluídas geram confirmação visível (toast, alert, mensagem)?
- Para cada violação: screenshot + descrição + recomendação

#### H2. Correspondência entre o sistema e o mundo real
A linguagem e os conceitos são familiares ao usuário?
- **Linguagem:** termos técnicos ou jargões internos expostos ao usuário? (ex: "null", "undefined", "error 500", IDs internos)
- **Ícones:** ícones são reconhecíveis e correspondem à ação? (ex: lixeira para excluir, lupa para buscar)
- **Ordem lógica:** informações seguem ordem natural? (ex: nome antes de CPF, endereço agrupado)
- **Metáforas:** metáforas visuais fazem sentido? (ex: "carrinho" para compras, "pasta" para arquivos)
- **Unidades e formatos:** datas, moedas, telefones no formato brasileiro esperado?

#### H3. Controle e liberdade do usuário
O usuário pode desfazer ações e sair de estados indesejados?
- **Desfazer/cancelar:** ações destrutivas (excluir, enviar) têm confirmação ou opção de desfazer?
- **Voltar:** botão voltar do browser funciona corretamente em todos os fluxos?
- **Sair de modais:** modais podem ser fechados com Escape, clique fora e botão X?
- **Cancelar fluxos:** formulários multi-etapa permitem cancelar e voltar ao início?
- **Editar após submeter:** dados enviados podem ser editados depois?
- **Saídas de emergência:** o usuário sempre tem como sair de qualquer tela?

#### H4. Consistência e padrões
Elementos iguais se comportam da mesma forma em todo o sistema?
- **Botões:** mesmo estilo para mesma hierarquia (primário, secundário, terciário)?
- **Cores:** mesma cor sempre significa a mesma coisa? (ex: vermelho = erro, verde = sucesso)
- **Tipografia:** tamanhos e pesos de fonte consistentes para títulos, subtítulos, corpo?
- **Espaçamento:** margens e paddings seguem grid consistente?
- **Posicionamento:** botões de ação sempre na mesma posição? (ex: "Salvar" sempre à direita)
- **Terminologia:** mesma ação usa o mesmo verbo em todo o sistema? (ex: "Salvar" vs "Gravar" vs "Confirmar")
- **Padrões de interação:** mesma ação gatilha o mesmo comportamento? (ex: clicar em item de tabela sempre abre detalhes)

#### H5. Prevenção de erros
O sistema previne erros antes que aconteçam?
- **Campos com restrição:** campos numéricos aceitam apenas números? Datas têm datepicker?
- **Confirmação de ações destrutivas:** excluir, enviar irreversível, sair sem salvar — tem confirmação?
- **Validação inline:** campos são validados enquanto o usuário preenche (não só no submit)?
- **Desabilitar opções inválidas:** opções que não se aplicam estão desabilitadas (não escondidas)?
- **Autocomplete:** campos com opções predefinidas sugerem valores?
- **Formatação automática:** CPF, telefone, CEP são formatados automaticamente?
- **Double submit:** botão de submit desabilita após primeiro clique?

#### H6. Reconhecimento em vez de memorização
O usuário precisa lembrar informações de outras telas?
- **Labels visíveis:** campos de formulário têm labels permanentes (não apenas placeholders que somem)?
- **Instruções contextuais:** campos complexos têm help text ou tooltip explicativo?
- **Menus descritivos:** itens de menu têm nomes descritivos (não abreviações ou códigos)?
- **Breadcrumbs:** usuário sabe onde está na hierarquia de navegação?
- **Defaults inteligentes:** campos pré-preenchidos com valores mais prováveis?
- **Histórico:** sistema lembra escolhas anteriores do usuário? (filtros, preferências)

#### H7. Flexibilidade e eficiência de uso
Usuários avançados têm atalhos? Tarefas frequentes são eficientes?
- **Atalhos de teclado:** tarefas comuns têm atalhos? (Ctrl+S para salvar, Enter para submeter)
- **Busca global:** existe busca que encontra qualquer conteúdo do sistema?
- **Filtros e ordenação:** listas e tabelas têm filtros úteis e ordenação por colunas?
- **Ações em lote:** é possível selecionar múltiplos itens e agir sobre todos?
- **Templates/favoritos:** tarefas repetitivas podem ser salvas como template?
- **Personalização:** interface pode ser adaptada ao uso do usuário? (colunas, layout, tema)

#### H8. Estética e design minimalista
A interface mostra apenas o necessário?
- **Densidade de informação:** telas estão sobrecarregadas ou equilibradas?
- **Hierarquia visual:** elementos mais importantes são visualmente destacados?
- **Whitespace:** existe espaço adequado entre elementos para respiração visual?
- **Cores:** paleta de cores é limitada e intencional (não aleatória)?
- **Elementos decorativos:** animações e ícones servem a um propósito ou são ruído?
- **Priorização:** funcionalidades secundárias estão escondidas em menus (não competindo com as principais)?

#### H9. Ajuda ao usuário para reconhecer, diagnosticar e recuperar-se de erros
Mensagens de erro são úteis?
- **Clareza:** mensagens de erro são em linguagem humana (não códigos técnicos)?
- **Especificidade:** a mensagem indica exatamente o que deu errado? (não apenas "Erro ao processar")
- **Orientação:** a mensagem sugere como corrigir o problema?
- **Localização:** a mensagem aparece próxima ao campo/ação que causou o erro?
- **Visibilidade:** erros são visualmente distintos e não passam despercebidos?
- **Tom:** mensagens são respeitosas (não culpam o usuário)?
- **Persistência:** mensagens ficam visíveis tempo suficiente para serem lidas?

#### H10. Ajuda e documentação
Existe ajuda acessível quando necessário?
- **Help contextual:** campos e funcionalidades complexas têm tooltip ou help text?
- **FAQ/documentação:** existe seção de ajuda acessível?
- **Onboarding:** primeira vez no sistema tem orientação guiada?
- **Empty states:** telas vazias (sem dados) orientam o usuário sobre o que fazer?
- **Mensagens de boas-vindas:** novos cadastros recebem orientação inicial?

### 5. Eficiência de fluxos

Para cada fluxo (informado via `--fluxos` ou inferido):

#### 5.1 Medição de cliques e passos
- Executar o fluxo e contar:
  - **Cliques** necessários para completar a tarefa
  - **Páginas** navegadas
  - **Campos** preenchidos
  - **Tempo total** da interação (sem contar carregamento)
- Calcular o **mínimo teórico** de passos para a mesma tarefa
- Razão de eficiência: `cliques reais / mínimo teórico` (quanto mais próximo de 1.0, melhor)

#### 5.2 Pontos de atrito
Identificar momentos onde o fluxo trava ou confunde:
- Páginas onde o usuário "não sabe o que fazer" (sem CTA claro)
- Redirecionamentos desnecessários
- Informações pedidas que já foram fornecidas antes
- Passos que poderiam ser automatizados ou eliminados

### 6. Feedback visual e estados

Para cada página no escopo:

#### 6.1 Loading states
- Testar carregamento: a página mostra skeleton/spinner enquanto carrega?
- Testar ações: botões mostram loading enquanto processam?
- Se o carregamento leva mais de 1s sem feedback visual: registrar como violação

#### 6.2 Empty states
- Acessar telas que podem estar vazias (listas sem itens, dashboards sem dados)
- Verificar: existe mensagem orientando o que fazer? (ex: "Nenhum pedido encontrado. Crie seu primeiro pedido.")
- Tela completamente em branco sem orientação: registrar como violação

#### 6.3 Estados de erro
- Provocar erros (submeter formulário vazio, acessar URL inválida)
- Verificar: página de erro 404/500 é amigável ou é a padrão do framework?
- Verificar: erros de formulário destacam os campos com problema?

#### 6.4 Confirmações e sucesso
- Após ações bem-sucedidas (salvar, enviar, excluir): existe confirmação visual?
- Toast/notification some em tempo adequado (3-5s) ou rápido demais?

### 7. Conversão do vídeo para MP4
Após fechar o browser:
```bash
ffmpeg -i clients/<id>/resultado/<timestamp>/videos/_raw/<arquivo>.webm \
       -c:v libx264 -crf 23 -preset fast \
       clients/<id>/resultado/<timestamp>/videos/usabilidade_<timestamp>.mp4
```
Se ffmpeg não disponível: manter `.webm`, exibir aviso (conforme BLOCK-A do CLAUDE.md)

### 8. Cálculo de scores

#### Score por heurística (0-10)
Para cada heurística (H1 a H10):
- Contar checks realizados e checks que passaram
- Score = `(checks_passaram / checks_total) * 10`
- Ponderar por severidade das violações encontradas

#### Score geral de usabilidade (0-100)
- Média ponderada dos 10 scores de heurísticas
- Pesos:
  | Heurística | Peso | Justificativa |
  |------------|------|---------------|
  | H1 Visibilidade | 12% | Fundamental para qualquer interação |
  | H2 Mundo real | 8% | Linguagem e conceitos |
  | H3 Controle | 12% | Liberdade e segurança do usuário |
  | H4 Consistência | 12% | Previsibilidade do sistema |
  | H5 Prevenção de erros | 12% | Evitar problemas antes de ocorrerem |
  | H6 Reconhecimento | 8% | Reduzir carga cognitiva |
  | H7 Flexibilidade | 8% | Eficiência para usuários avançados |
  | H8 Estética | 8% | Clareza visual |
  | H9 Erros | 12% | Recuperação de problemas |
  | H10 Ajuda | 8% | Suporte ao usuário |

Classificação:
- **90-100:** Excelente — UX madura e bem pensada
- **70-89:** Bom — funcional com oportunidades de melhoria
- **50-69:** Regular — problemas notáveis que afetam a experiência
- **30-49:** Ruim — múltiplas barreiras de usabilidade
- **0-29:** Crítico — experiência severamente comprometida

### 9. Geração do relatório
Salvar `clients/<id>/resultado/latest/usabilidade_<timestamp>.md`:

```markdown
# Resultado — Avaliação de Usabilidade
Data: <timestamp>
URL: <url avaliada>
Módulo: <nome ou "todos">
Páginas avaliadas: <n>
Fluxos medidos: <n>

## Score Geral de Usabilidade: <n>/100 — <classificação>

## Score por Heurística
| # | Heurística | Score | Violações | Mais grave |
|---|------------|-------|-----------|------------|
| H1 | Visibilidade do estado | <n>/10 | <n> | <severidade> |
| H2 | Mundo real | <n>/10 | <n> | <severidade> |
| H3 | Controle e liberdade | <n>/10 | <n> | <severidade> |
| H4 | Consistência | <n>/10 | <n> | <severidade> |
| H5 | Prevenção de erros | <n>/10 | <n> | <severidade> |
| H6 | Reconhecimento | <n>/10 | <n> | <severidade> |
| H7 | Flexibilidade | <n>/10 | <n> | <severidade> |
| H8 | Estética | <n>/10 | <n> | <severidade> |
| H9 | Erros | <n>/10 | <n> | <severidade> |
| H10 | Ajuda | <n>/10 | <n> | <severidade> |

## Eficiência de Fluxos
| Fluxo | Cliques reais | Mínimo teórico | Razão | Páginas | Tempo |
|-------|---------------|----------------|-------|---------|-------|
| ...   | <n>           | <n>            | <n>x  | <n>     | <s>   |

## Pontos de atrito por fluxo
| Fluxo | Ponto de atrito | Página | Descrição | Severidade |
|-------|-----------------|--------|-----------|------------|

## Top 5 Quick Wins
| # | Problema | Heurística | Impacto | Esforço estimado | Recomendação |
|---|----------|------------|---------|------------------|--------------|
| 1 | ...      | H<n>       | Alto    | Baixo            | ...          |
| 2 | ...      | ...        | ...     | ...              | ...          |

## Violações detalhadas

### H1 — Visibilidade do estado do sistema
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H2 — Correspondência com o mundo real
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H3 — Controle e liberdade do usuário
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H4 — Consistência e padrões
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H5 — Prevenção de erros
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H6 — Reconhecimento em vez de memorização
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H7 — Flexibilidade e eficiência
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H8 — Estética e design minimalista
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H9 — Erros
| Página | Mensagem | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

### H10 — Ajuda e documentação
| Página | Elemento | Problema | Severidade | Screenshot | Recomendação |
|--------|----------|----------|------------|------------|--------------|

## Feedback Visual e Estados
### Loading States
| Página | Ação | Tem feedback? | Tempo sem feedback | Severidade |
|--------|------|---------------|-------------------|------------|

### Empty States
| Página | Tem orientação? | Mensagem | Severidade |
|--------|-----------------|----------|------------|

### Estados de Erro
| Página | Tipo de erro | Mensagem amigável? | Orientação? | Severidade |
|--------|-------------|---------------------|-------------|------------|

### Confirmações
| Página | Ação | Tem confirmação? | Tipo | Duração | Severidade |
|--------|------|------------------|------|---------|------------|

## Consistência de UI
| Elemento | Padrão esperado | Variações encontradas | Páginas afetadas |
|----------|-----------------|----------------------|------------------|

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|

## Parecer Técnico de UX
<análise geral da usabilidade do sistema, padrões identificados, comparação com boas práticas de mercado, e priorização de ações>

## Recomendações Priorizadas
| Prioridade | Ação | Heurísticas | Páginas | Impacto esperado |
|------------|------|-------------|---------|------------------|
| 1 (urgente) | ... | H<n>, H<n> | ... | ... |
| 2 (alta) | ... | ... | ... | ... |
| 3 (média) | ... | ... | ... | ... |
```

### 10. Resumo final
```
✅ Avaliação de usabilidade concluída
   Score geral: <n>/100 — <classificação>
   Páginas avaliadas: <n>
   Fluxos medidos: <n>
   Violações: Crítico <n> | Alto <n> | Médio <n> | Baixo <n>
   Heurística mais fraca: H<n> — <nome> (<n>/10)
   Heurística mais forte: H<n> — <nome> (<n>/10)
   Quick wins identificados: <n>
   Vídeo: clients/<id>/resultado/latest/videos/usabilidade_<timestamp>.mp4
   Screenshots: clients/<id>/resultado/latest/screenshots/
   Resultado: clients/<id>/resultado/latest/usabilidade_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/usabilidade_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/videos/usabilidade_<timestamp>.mp4`
- `clients/<id>/resultado/<timestamp>/screenshots/ux_*.png`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
