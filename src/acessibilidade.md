---
id: acessibilidade
description: "Audita paginas contra criterios WCAG, identificando problemas de acessibilidade visual, semantica, navegacao por teclado e compatibilidade com leitores de tela."
name: "Auditoria de Acessibilidade WCAG"
type: hybrid
language: pt-BR
provider_hint: balanced
tools_required:
  - playwright.browser_navigate
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
    description: "URL da página ou sistema a auditar"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: nivel
    required: false
    description: "Nível WCAG a verificar: A, AA ou AAA (padrão: AA)"
  - name: modulo
    required: false
    description: "Auditar apenas páginas do módulo especificado"
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


# /acessibilidade — Auditoria de Acessibilidade WCAG

## Descrição
Auditoria completa de acessibilidade baseada nas diretrizes WCAG 2.1 (níveis A, AA e AAA). Analisa contraste de cores, atributos ARIA, navegação por teclado, textos alternativos, labels de formulário, hierarquia de headings e compatibilidade com screen readers. Gera relatório detalhado com violações classificadas por severidade e sugestões de correção.

## Uso
```
/acessibilidade --cliente <id> <URL> [--login <email>] [--nivel <A|AA|AAA>] [--modulo <nome>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL da página ou sistema a auditar (obrigatório)
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`
- `--nivel <A|AA|AAA>` — nível WCAG a verificar (padrão: AA)
- `--modulo <nome>` — auditar apenas páginas do módulo especificado. Requer `clients/<id>/estado/mapa.md` (opcional)

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpasta `clients/<id>/resultado/<timestamp>/screenshots/` para capturas de violações
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 2.1 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 2.2 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 3. Autenticação e navegação
- Se `--login` foi passado: autenticar antes de acessar a URL
- Se `--modulo` foi passado: ler `clients/<id>/estado/mapa.md` e filtrar URLs do módulo
- Navegar até a URL informada (ou primeira URL do módulo)

### 4. Definição do escopo
- Se URL única: auditar apenas essa página
- Se `--modulo`: auditar todas as páginas mapeadas do módulo
- Se nem URL específica de página nem `--modulo`: auditar a URL fornecida e navegar por links internos até profundidade 2

### 5. Bateria de testes por categoria

Para cada página no escopo:

#### 5.1 Contraste de cores
- Verificar razão de contraste de todo texto visível sobre seu fundo
- **Nível A/AA:** 4.5:1 para texto normal, 3:1 para texto grande (≥18pt ou ≥14pt bold)
- **Nível AAA:** 7:1 para texto normal, 4.5:1 para texto grande
- Verificar contraste de elementos de interface (bordas de input, ícones informativos)
- Registrar: elemento, cor do texto, cor do fundo, razão calculada, mínimo exigido, status

#### 5.2 Atributos ARIA e Roles
- Verificar que elementos interativos têm roles semânticos corretos
- Botões devem ser `<button>` ou ter `role="button"`
- Links devem ser `<a>` com `href`
- Modais devem ter `role="dialog"` e `aria-modal="true"`
- Elementos dinâmicos devem ter `aria-live` para anunciar mudanças
- Verificar que `aria-label`, `aria-labelledby` e `aria-describedby` apontam para IDs existentes
- Registrar: elemento, role esperado, role encontrado, atributos ARIA, status

#### 5.3 Navegação por teclado
- Tab por todos os elementos interativos da página
- Verificar:
  - **Ordem lógica:** a sequência de Tab segue a ordem visual da página
  - **Foco visível:** todo elemento focável tem indicador visual ao receber foco
  - **Nenhum elemento preso:** é possível sair de qualquer elemento com Tab ou Escape
  - **Atalhos de teclado:** Enter ativa botões, Escape fecha modais, Arrow keys navegam em menus
  - **Skip links:** existe link "Pular para conteúdo" no início da página
- Registrar: elemento, tipo de problema, severidade

#### 5.4 Textos alternativos
- Verificar que toda `<img>` tem atributo `alt`
- Imagens decorativas devem ter `alt=""` (vazio) ou `role="presentation"`
- Imagens informativas devem ter `alt` descritivo (não genérico como "imagem" ou "foto")
- Ícones SVG devem ter `<title>` ou `aria-label`
- Verificar `<video>` e `<audio>`: legendas/captions disponíveis?
- Registrar: elemento, tipo, alt encontrado, adequação, status

#### 5.5 Labels de formulário
- Todo campo de formulário deve ter `<label>` associado via `for`/`id` ou `aria-label`
- Grupos de radio/checkbox devem estar em `<fieldset>` com `<legend>`
- Campos obrigatórios devem ter indicação acessível (`aria-required="true"` ou texto visível)
- Mensagens de erro devem estar associadas ao campo via `aria-describedby`
- Registrar: campo, tipo, label encontrado, associação, status

#### 5.6 Hierarquia de headings
- Verificar que existe exatamente um `<h1>` por página
- Headings devem seguir ordem hierárquica sem pulos (h1 → h2 → h3, nunca h1 → h3)
- Headings não devem ser usados apenas para estilo (conteúdo deve ser descritivo)
- Registrar: heading encontrado, nível, texto, posição, status

#### 5.7 Screen reader (semântica HTML)
- Verificar uso correto de landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`
- Verificar que a linguagem da página está definida (`<html lang="pt-BR">`)
- Verificar que tabelas de dados têm `<th>`, `<caption>` e `scope`
- Verificar que listas são marcadas como `<ul>`/`<ol>` e não como `<div>` com estilos
- Verificar que mudanças de idioma no conteúdo têm `lang` no elemento
- Registrar: elemento, landmark esperado, encontrado, status

### 6. Classificação de violações
Para cada violação encontrada, classificar:

| Severidade | Critério | Exemplo |
|------------|----------|---------|
| **Crítico** | Bloqueia acesso para usuários com deficiência | Formulário sem labels, trap de teclado, conteúdo só por cor |
| **Alto** | Dificulta significativamente o acesso | Contraste abaixo do mínimo, imagens sem alt, headings fora de ordem |
| **Médio** | Degrada a experiência mas não bloqueia | Foco visível fraco, aria-label genérico, landmarks ausentes |
| **Baixo** | Melhoria recomendada, não bloqueante | Skip link ausente, lang não definido, alt genérico em decorativas |

### 7. Geração do relatório
Salvar `clients/<id>/resultado/latest/acessibilidade_<timestamp>.md`:

```markdown
# Resultado — Auditoria de Acessibilidade
Data: <timestamp>
URL: <url auditada>
Nível WCAG: <A|AA|AAA>
Módulo: <nome ou "todos">
Páginas auditadas: <n>

## Resumo
| Severidade | Violações |
|------------|-----------|
| Crítico    | <n>       |
| Alto       | <n>       |
| Médio      | <n>       |
| Baixo      | <n>       |
| **Total**  | **<n>**   |

## Score de Acessibilidade
<nota de 0 a 100 baseada na proporção de checks que passaram>

## Violações por Categoria

### 1. Contraste de Cores
| Elemento | Cor Texto | Cor Fundo | Razão | Mínimo | Severidade | Screenshot |
|----------|-----------|-----------|-------|--------|------------|------------|

### 2. ARIA e Roles
| Elemento | Problema | Role esperado | Role encontrado | Severidade |
|----------|----------|---------------|-----------------|------------|

### 3. Navegação por Teclado
| Elemento | Problema | Tipo | Severidade | Screenshot |
|----------|----------|------|------------|------------|

### 4. Textos Alternativos
| Elemento | Tipo | Alt encontrado | Adequado? | Severidade |
|----------|------|----------------|-----------|------------|

### 5. Labels de Formulário
| Campo | Tipo | Label | Associação | Severidade |
|-------|------|-------|------------|------------|

### 6. Hierarquia de Headings
| Heading | Nível | Texto | Problema | Severidade |
|---------|-------|-------|----------|------------|

### 7. Screen Reader / Semântica
| Elemento | Problema | Esperado | Encontrado | Severidade |
|----------|----------|----------|------------|------------|

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|

## Recomendações de Correção
Para cada violação Crítica e Alta, sugerir a correção específica:
| Violação | Correção sugerida | Prioridade |
|----------|-------------------|------------|
```

### 8. Resumo final
```
✅ Auditoria de acessibilidade concluída
   Nível WCAG: <A|AA|AAA>
   Páginas auditadas: <n>
   Score: <n>/100
   Violações: Crítico <n> | Alto <n> | Médio <n> | Baixo <n>
   Categorias com mais problemas: <lista>
   Screenshots: clients/<id>/resultado/latest/screenshots/
   Resultado: clients/<id>/resultado/latest/acessibilidade_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/acessibilidade_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/screenshots/a11y_*.png`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
