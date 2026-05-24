---
id: performance
description: "Analisa performance, Core Web Vitals, requests lentos, recursos pesados e gargalos de carregamento sob diferentes condicoes de rede."
name: "Análise de Performance e Core Web Vitals"
type: script
language: pt-BR
provider_hint: any
tools_required:
  - playwright.browser_navigate
  - playwright.browser_evaluate
  - playwright.browser_take_screenshot
  - fs.read_file
  - fs.write_file
  - shell.bash
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
    description: "URL base do sistema a analisar"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: paginas
    required: false
    description: "Lista de URLs específicas separadas por vírgula"
  - name: throttle
    required: false
    description: "Condição de rede simulada: 3g, 4g ou wifi (padrão: wifi)"
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


# /performance — Análise de Performance e Core Web Vitals

## Descrição
Mede Core Web Vitals (LCP, FCP, CLS, TTFB, INP), analisa recursos pesados, gera waterfall de rede e atribui score de performance por página. Suporta throttle de rede (3G, 4G, WiFi) para simular condições reais de uso.

## Uso
```
/performance --cliente <id> <URL> [--login <email>] [--paginas <URLs>] [--throttle <3g|4g|wifi>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL base do sistema a analisar (obrigatório)
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`
- `--paginas <URLs>` — lista de URLs específicas separadas por vírgula para analisar (opcional). Se omitido, analisa a URL base e páginas linkadas até profundidade 1
- `--throttle <3g|4g|wifi>` — condição de rede simulada (padrão: wifi — sem throttle)

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpasta `clients/<id>/resultado/<timestamp>/screenshots/` para capturas
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 2.1 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 2.2 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar **todas** as requisições (não apenas erros) para análise de waterfall
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes, type, cached }`
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 3. Configuração de throttle
Configurar condição de rede antes de iniciar as medições:

| Perfil | Download | Upload | Latência |
|--------|----------|--------|----------|
| **3g** | 750 kbps | 250 kbps | 400ms |
| **4g** | 4 Mbps | 3 Mbps | 100ms |
| **wifi** | Sem limite | Sem limite | 0ms (padrão) |

### 4. Autenticação e navegação
- Se `--login` foi passado: autenticar antes de iniciar medições
- Definir lista de páginas a medir:
  - Se `--paginas` informado: usar lista fornecida
  - Se não: usar URL base + links internos até profundidade 1
  - Se `clients/<id>/estado/mapa.md` disponível: usar como referência para páginas críticas

### 5. Medição de Core Web Vitals
Para cada página na lista, executar 3 medições e calcular a mediana:

#### 5.1 Largest Contentful Paint (LCP)
- Tempo até o maior elemento visível ser renderizado
- **Bom:** ≤ 2.5s | **Precisa melhorar:** ≤ 4.0s | **Ruim:** > 4.0s
- Identificar qual elemento é o LCP (imagem, texto, vídeo)

#### 5.2 First Contentful Paint (FCP)
- Tempo até o primeiro conteúdo ser renderizado na tela
- **Bom:** ≤ 1.8s | **Precisa melhorar:** ≤ 3.0s | **Ruim:** > 3.0s

#### 5.3 Cumulative Layout Shift (CLS)
- Soma de todas as mudanças de layout inesperadas durante o carregamento
- **Bom:** ≤ 0.1 | **Precisa melhorar:** ≤ 0.25 | **Ruim:** > 0.25
- Identificar elementos que causam layout shift (imagens sem dimensão, fontes carregando, anúncios)

#### 5.4 Time to First Byte (TTFB)
- Tempo desde a requisição até o primeiro byte da resposta
- **Bom:** ≤ 800ms | **Precisa melhorar:** ≤ 1800ms | **Ruim:** > 1800ms

#### 5.5 Interaction to Next Paint (INP)
- Latência de interação do usuário (clique, toque, tecla)
- Clicar em 3-5 elementos interativos da página e medir tempo de resposta
- **Bom:** ≤ 200ms | **Precisa melhorar:** ≤ 500ms | **Ruim:** > 500ms

### 6. Análise de recursos

#### 6.1 Recursos pesados
Para cada recurso carregado pela página:
- Identificar tipo: JS, CSS, imagem, fonte, vídeo, outro
- Registrar tamanho (bytes), tempo de carregamento, se está cacheado
- Sinalizar recursos acima de:
  - **Imagens:** > 500KB sem compressão adequada
  - **JS bundles:** > 250KB (gzipped)
  - **CSS:** > 100KB
  - **Fontes:** > 100KB por arquivo
  - **Total da página:** > 3MB

#### 6.2 Recursos não otimizados
- Imagens sem formato moderno (WebP/AVIF) quando o browser suporta
- JS/CSS não minificados (detectar por tamanho e padrão de whitespace)
- Recursos sem compressão gzip/brotli
- Recursos sem cache headers adequados (Cache-Control, ETag)
- Imagens carregadas fora da viewport sem lazy loading

#### 6.3 Requisições bloqueantes
- Identificar JS/CSS no `<head>` sem `async` ou `defer` que bloqueiam renderização
- Identificar cadeias de requisições (recurso A carrega recurso B que carrega recurso C)
- Calcular tempo total bloqueado

### 7. Waterfall de rede
Gerar representação visual do waterfall de carregamento:
- Ordenar requisições por tempo de início
- Mostrar: recurso, tipo, tamanho, duração, timing (DNS, TCP, TLS, TTFB, download)
- Destacar requisições bloqueantes e gargalos

### 8. Score de performance
Calcular score de 0 a 100 por página baseado nos Web Vitals:

| Métrica | Peso |
|---------|------|
| LCP | 25% |
| FCP | 15% |
| CLS | 25% |
| TTFB | 15% |
| INP | 20% |

Score por métrica: 100 se "Bom", 50 se "Precisa melhorar", 0 se "Ruim".
Score final = média ponderada.

Classificação:
- **90-100:** Excelente
- **50-89:** Precisa melhorar
- **0-49:** Ruim

### 9. Geração do relatório
Salvar `clients/<id>/resultado/latest/performance_<timestamp>.md`:

```markdown
# Resultado — Análise de Performance
Data: <timestamp>
URL base: <url>
Throttle: <3g|4g|wifi>
Páginas analisadas: <n>
Medições por página: 3 (mediana)

## Resumo Geral
| Página | Score | LCP | FCP | CLS | TTFB | INP |
|--------|-------|-----|-----|-----|------|-----|
| ...    | <n>   | <s> | <s> | <n> | <ms> | <ms>|

Score médio: <n>/100 — <Excelente|Precisa melhorar|Ruim>

## Detalhes por Página

### <URL da página>
Score: <n>/100

#### Core Web Vitals
| Métrica | Valor | Classificação | Elemento/Causa |
|---------|-------|---------------|----------------|
| LCP     | <s>   | Bom/Melhorar/Ruim | <elemento>  |
| FCP     | <s>   | ...           | —              |
| CLS     | <n>   | ...           | <elemento>     |
| TTFB    | <ms>  | ...           | —              |
| INP     | <ms>  | ...           | <elemento>     |

#### Recursos pesados
| Recurso | Tipo | Tamanho | Tempo | Problema |
|---------|------|---------|-------|----------|

#### Recursos não otimizados
| Recurso | Problema | Economia estimada |
|---------|----------|-------------------|

#### Requisições bloqueantes
| Recurso | Tipo | Tempo bloqueado |
|---------|------|-----------------|

#### Waterfall
<representação textual do waterfall>

## Recomendações de Otimização
| Prioridade | Ação | Impacto estimado | Páginas afetadas |
|------------|------|------------------|------------------|
| Alta       | ...  | ...              | ...              |

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|
```

### 10. Resumo final
```
✅ Análise de performance concluída
   Throttle: <3g|4g|wifi>
   Páginas analisadas: <n>
   Score médio: <n>/100
   Páginas com score Ruim (<50): <n>
   Recursos pesados encontrados: <n>
   Requisições bloqueantes: <n>
   Console errors: <n>
   Resultado: clients/<id>/resultado/latest/performance_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/performance_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/screenshots/perf_*.png`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
