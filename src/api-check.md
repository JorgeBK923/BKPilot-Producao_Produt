---
id: api-check
description: "Testa endpoints de API, validando status code, autenticacao, payloads invalidos, tempo de resposta, seguranca e rate limiting."
name: "Testes de API"
type: script
language: pt-BR
provider_hint: any
tools_required:
  - http.request
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks: []
scripts: []
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: url
    required: true
    description: "URL base da API"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
  - name: endpoints
    required: false
    description: "Fonte dos endpoints: auto (padrão) ou caminho para arquivo JSON"
targets:
  claude:
    supported: true
  opencode:
    supported: true
  codex:
    supported: true
---

# /api-check — Testes de API

## Descrição
Testa endpoints de API automaticamente. Descobre endpoints via network tab (usando `clients/<id>/estado/api_endpoints.json` do `/explorar`) ou recebe lista manual via JSON. Executa testes de status code, autenticação, payloads inválidos, tempo de resposta e detecção de vulnerabilidades de segurança.

## Uso
```
/api-check --cliente <id> <URL> [--login <email>] [--endpoints <auto|arquivo.json>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL base da API (obrigatório). Ex: `https://app.cliente.com.br` ou `https://api.cliente.com.br/v1`
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`. Usado para obter token JWT/session para testes autenticados
- `--endpoints <auto|arquivo.json>` — fonte dos endpoints (padrão: auto)
  - `auto` — usa `clients/<id>/estado/api_endpoints.json` se disponível. Se não existir, abre o browser, navega pela aplicação e descobre endpoints via network tab
  - `<arquivo.json>` — arquivo JSON com lista manual de endpoints a testar

### Formato do arquivo de endpoints manual
```json
{
  "base_url": "https://api.cliente.com.br",
  "endpoints": [
    { "method": "GET", "path": "/api/v1/users", "auth": true, "description": "Lista usuários" },
    { "method": "POST", "path": "/api/v1/users", "auth": true, "body": { "name": "Teste", "email": "teste@test.com" }, "description": "Criar usuário" },
    { "method": "GET", "path": "/api/v1/health", "auth": false, "description": "Health check" }
  ]
}
```

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 3. Descoberta de endpoints

#### 3.1 Modo auto (padrão)
1. Verificar se `clients/<id>/estado/api_endpoints.json` existe:
   - Se existir: ler endpoints descobertos pelo `/explorar`
2. Se não existir: abrir browser via Playwright MCP, navegar pela URL base e páginas linkadas, interceptar requisições XHR/Fetch para identificar endpoints
3. Consolidar lista de endpoints únicos

#### 3.2 Modo arquivo
- Ler o arquivo JSON informado
- Validar estrutura
- Usar `base_url` do arquivo como prefixo para paths relativos

### 4. Autenticação (se --login passado)
- Navegar até a página de login via browser
- Autenticar com `--login` + `QA_PASSWORD`
- Capturar token de autenticação (JWT, session cookie, etc.) das requisições de rede
- Usar este token em todas as requisições autenticadas subsequentes

### 5. Bateria de testes por endpoint

Para cada endpoint descoberto/informado:

#### 5.1 Teste de status code (caminho feliz)
- Enviar requisição com método, URL e body corretos (se POST/PUT)
- Incluir token de autenticação se `auth: true`
- Verificar: status code está na faixa 2xx
- Registrar: tempo de resposta, tamanho da resposta, content-type

#### 5.2 Teste sem autenticação
- Enviar a mesma requisição **sem** token de autenticação
- Verificar:
  - Endpoint protegido: deve retornar 401 ou 403
  - Endpoint público: deve retornar 2xx normalmente
- **Vulnerabilidade:** se endpoint protegido retorna 2xx sem auth → sinalizar como bug de segurança (severidade Crítica)

#### 5.3 Teste com token inválido
- Enviar requisição com token alterado/expirado/malformado
- Verificar: deve retornar 401 ou 403
- **Vulnerabilidade:** se aceita token inválido → sinalizar como bug de segurança (severidade Crítica)

#### 5.4 Teste de payloads inválidos (para POST/PUT/PATCH)
- **Body vazio:** enviar sem body
- **Campos obrigatórios ausentes:** enviar body parcial
- **Tipos errados:** string onde espera número, número onde espera string
- **Valores extremos:** string de 10.000 chars, número negativo, null
- **JSON malformado:** `{invalid`
- Verificar: deve retornar 400 ou 422 com mensagem de erro descritiva
- **Vulnerabilidade:** se aceita dados inválidos sem validação → sinalizar

#### 5.5 Teste de métodos HTTP não permitidos
- Para cada endpoint, enviar requisição com método diferente do esperado (ex: DELETE em endpoint GET-only)
- Verificar: deve retornar 405 Method Not Allowed
- **Vulnerabilidade:** se aceita método inesperado com efeito colateral → sinalizar

#### 5.6 Teste de tempo de resposta
- Medir tempo de resposta de cada requisição
- Classificar:
  - **Rápido:** < 200ms
  - **Aceitável:** 200ms - 1000ms
  - **Lento:** 1000ms - 3000ms
  - **Muito lento:** > 3000ms
- Sinalizar endpoints consistentemente lentos

#### 5.7 Testes de segurança

**SQL Injection:**
- Em parâmetros de query e body, injetar: `' OR '1'='1`, `1; DROP TABLE`, `1 UNION SELECT null`
- Verificar: não deve retornar dados inesperados nem erro SQL exposto

**Path Traversal:**
- Em parâmetros de ID/path: `../../etc/passwd`, `..%2F..%2Fetc%2Fpasswd`
- Verificar: deve retornar 400 ou 404

**SSRF:**
- Em parâmetros de URL: `http://localhost`, `http://169.254.169.254/latest/meta-data/`
- Verificar: não deve fazer requisição interna

**Header Injection:**
- Enviar headers maliciosos: `X-Forwarded-For: 127.0.0.1`, `Host: evil.com`
- Verificar comportamento

**Mass Assignment:**
- Em endpoints de criação/atualização, incluir campos extras não documentados (ex: `role: "admin"`, `is_admin: true`)
- Verificar: campos extras devem ser ignorados

**Rate Limiting:**
- Enviar 50 requisições em sequência rápida ao mesmo endpoint
- Verificar: deve retornar 429 Too Many Requests antes de 100 requisições
- Se não houver rate limiting: sinalizar como vulnerabilidade (severidade Média)

#### 5.8 Teste de CORS
- Enviar requisição com `Origin: https://evil-site.com`
- Verificar headers de resposta:
  - `Access-Control-Allow-Origin` não deve ser `*` em endpoints autenticados
  - Se permite qualquer origin com credentials: sinalizar como vulnerabilidade

#### 5.9 Teste de headers de segurança
- Verificar presença de headers de segurança nas respostas:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` ou `SAMEORIGIN`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy`
  - `X-XSS-Protection`
- Headers ausentes: sinalizar como recomendação (severidade Baixa)

### 6. Geração do relatório
Salvar `clients/<id>/resultado/latest/api-check_<timestamp>.md`:

```markdown
# Resultado — Testes de API
Data: <timestamp>
URL base: <url>
Endpoints testados: <n>
Modo de descoberta: auto | arquivo
Autenticação: sim | não

## Resumo
| Categoria | Passou | Falhou | Total |
|-----------|--------|--------|-------|
| Status code | <n> | <n> | <n> |
| Autenticação | <n> | <n> | <n> |
| Payloads inválidos | <n> | <n> | <n> |
| Métodos HTTP | <n> | <n> | <n> |
| Segurança | <n> | <n> | <n> |
| CORS | <n> | <n> | <n> |
| Headers | <n> | <n> | <n> |
| **Total** | **<n>** | **<n>** | **<n>** |

## Vulnerabilidades de Segurança
| # | Endpoint | Tipo | Severidade | Descrição |
|---|----------|------|------------|-----------|

## Performance de Endpoints
| Endpoint | Método | Tempo médio | Classificação |
|----------|--------|-------------|---------------|

## Detalhes por Endpoint

### <METHOD> <path>
**Descrição:** <descrição>
**Auth:** sim | não

| Teste | Resultado | Status Code | Tempo | Observação |
|-------|-----------|-------------|-------|------------|
| Caminho feliz | ✅/❌ | <n> | <ms> | ... |
| Sem auth | ✅/❌ | <n> | <ms> | ... |
| Token inválido | ✅/❌ | <n> | <ms> | ... |
| Body vazio | ✅/❌ | <n> | <ms> | ... |
| ... | ... | ... | ... | ... |

---

## Endpoints sem Rate Limiting
<lista de endpoints que não retornaram 429>

## Headers de Segurança
| Header | Presente | Valor |
|--------|----------|-------|

## Recomendações
| Prioridade | Ação | Endpoints afetados |
|------------|------|--------------------|
```

### 7. Resumo final
```
✅ Testes de API concluídos
   Endpoints testados: <n>
   Testes executados: <n>
   Passou: <n> | Falhou: <n>
   Vulnerabilidades: Crítica <n> | Alta <n> | Média <n> | Baixa <n>
   Endpoints lentos (>1s): <n>
   Endpoints sem rate limiting: <n>
   Resultado: clients/<id>/resultado/latest/api-check_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/api-check_<timestamp>.md`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
