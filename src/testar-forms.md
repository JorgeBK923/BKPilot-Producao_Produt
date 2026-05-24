---
id: testar-forms
description: "Testa formularios com validacoes de obrigatoriedade, limites, formatos invalidos, seguranca, upload, wizard, i18n e mensagens de erro."
name: "Teste de Formulários"
type: interactive
language: pt-BR
provider_hint: strong
tools_required:
  - playwright.browser_navigate
  - playwright.browser_click
  - playwright.browser_fill_form
  - playwright.browser_snapshot
  - playwright.browser_take_screenshot
  - playwright.browser_press_key
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
    description: "URL da página com o formulário a testar"
  - name: login
    required: false
    description: "Email de autenticação. Senha via QA_PASSWORD em clients/<id>/.env"
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


# /testar-forms — Teste de Formulários

## Descrição
Especialista em formulários. Identifica todos os campos de um formulário e executa bateria completa de testes: dados válidos, campos vazios, dados inválidos, limites, caracteres especiais, upload de arquivo, wizard multi-etapa, autocomplete, i18n, persistência de estado, segurança expandida e JS desabilitado. Cada grupo de testes gera **screenshot + vídeo MP4** como evidência.

## Uso
```
/testar-forms --cliente <id> <URL> [--login <email>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<URL>` — URL da página com o formulário a testar (obrigatório)
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/` para esta execução
- Criar subpasta `clients/<id>/resultado/<timestamp>/videos/` para os vídeos MP4
- Criar subpasta `clients/<id>/resultado/<timestamp>/screenshots/` para os screenshots
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`

### 2.1 Configuração de gravação de vídeo
Ao iniciar o browser via Playwright MCP, ativar gravação de vídeo:
```
recordVideo: { dir: 'clients/<id>/resultado/<timestamp>/videos/_raw/', size: { width: 1280, height: 720 } }
```
Um único vídeo contínuo cobre toda a sessão de testes do formulário.

### 2.2 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Registrar: `{ timestamp, level, text, url, lineNumber }`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 2.3 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes }`
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 3. Autenticação e navegação
- Se `--login` foi passado: autenticar antes de acessar a URL
- Navegar até a URL informada
- Aguardar carregamento completo do formulário

### 4. Mapeamento do formulário
- Identificar todos os campos: nome, tipo (text, email, password, select, checkbox, radio, file, etc.), se é obrigatório, máscara aparente, valor padrão
- Identificar o botão de submit
- Detectar se é wizard multi-etapa (múltiplas telas/abas)
- Detectar campos com autocomplete/autofill
- Registrar estrutura no arquivo de resultado

### 5. Bateria de testes

Executar cada grupo de testes abaixo. Para cada teste: tirar screenshot do estado resultante e marcar o timestamp no vídeo (para facilitar localização).

#### 5.1 Caminho feliz (dados válidos)
- Preencher todos os campos com dados válidos e realistas
- Submeter o formulário
- Verificar: mensagem de sucesso, redirecionamento esperado, ausência de erros
- Status: PASSOU se comportamento esperado ocorreu

#### 5.2 Campos obrigatórios vazios
Para cada campo marcado como obrigatório:
- Deixar apenas aquele campo vazio, preencher os demais
- Tentar submeter
- Verificar: mensagem de erro de validação aparece para o campo vazio
- Status: PASSOU se erro de validação apareceu | FALHOU se formulário submeteu mesmo assim

#### 5.3 Dados inválidos por tipo de campo
- **Email:** sem `@`, sem domínio, com espaços
- **CPF:** letras no lugar de números, 10 dígitos, todos iguais (111.111.111-11)
- **CNPJ:** formato inválido, dígitos verificadores errados
- **Telefone:** letras, menos dígitos que o mínimo
- **CEP:** menos de 8 dígitos, letras
- **Senha:** abaixo do mínimo de caracteres (se houver)
- **Data:** formato errado, data impossível (32/13/2024)
- Verificar: mensagem de erro adequada aparece para cada caso

#### 5.4 Limites e valores extremos
- **Texto muito longo:** colar 1000 caracteres em campos de texto curto
- **Número negativo:** em campos que esperam valores positivos
- **Zero:** em campos de quantidade ou valor
- **Espaços em branco:** apenas espaços em campos obrigatórios
- Verificar: sistema valida ou trunca adequadamente

#### 5.5 Caracteres especiais e SQL injection
- Inserir: `<script>alert(1)</script>`, `' OR '1'='1`, `; DROP TABLE`, `../../../etc`
- Verificar: sistema não executa, exibe erro ou sanitiza entrada
- Anotar qualquer comportamento suspeito

#### 5.6 Máscaras de input
Para campos com máscara visível (CPF, telefone, CEP, CNPJ):
- Digitar apenas números e verificar se a máscara é aplicada automaticamente
- Colar valor sem formatação e verificar comportamento
- Verificar se o valor enviado ao servidor é limpo (sem máscara) ou formatado

#### 5.7 Upload de arquivo
Para campos do tipo `file` (se existirem):
- Upload de arquivo válido (tipo e tamanho permitidos)
- Upload de arquivo com tipo não permitido (ex: .exe em campo de imagem)
- Upload de arquivo acima do tamanho máximo
- Upload de arquivo com nome contendo caracteres especiais
- Upload de arquivo vazio (0 bytes)
- Verificar: mensagens de validação adequadas em cada caso

#### 5.8 Wizard multi-etapa
Se o formulário tiver múltiplas etapas/abas:
- Navegar para frente e para trás entre etapas — dados devem persistir
- Tentar avançar sem preencher campos obrigatórios da etapa atual
- Submeter diretamente da última etapa — todas as etapas devem ser validadas
- Recarregar a página no meio do wizard — verificar se dados se perdem ou persistem

#### 5.9 Autocomplete e autofill
Para campos que tenham autocomplete:
- Verificar se sugestões aparecem ao digitar
- Selecionar uma sugestão e verificar se o campo é preenchido corretamente
- Verificar se o browser autofill (Chrome, Firefox) preenche campos corretamente
- Verificar se dados do autofill são aceitos pelo formulário

#### 5.10 Internacionalização (i18n)
- Inserir caracteres Unicode: acentos (ção, ñ), CJK (漢字), emojis (😀), RTL (العربية)
- Verificar se são aceitos, armazenados e exibidos corretamente
- Verificar se mensagens de erro estão no idioma esperado

#### 5.11 Persistência de estado
- Preencher parcialmente o formulário e recarregar a página (F5)
- Verificar se dados são perdidos ou recuperados (localStorage, sessionStorage, draft)
- Navegar para outra página e voltar — verificar persistência
- Fechar e reabrir a aba — verificar comportamento

#### 5.12 Segurança expandida (XSS/SQL/SSRF)
Além dos testes básicos do 5.5, testar:
- **XSS stored:** submeter payload e verificar se aparece na listagem/visualização
- **XSS DOM:** testar em campos que refletem na URL ou na página sem reload
- **SQL injection avançado:** `1 UNION SELECT`, `1; WAITFOR DELAY '00:00:05'`
- **SSRF:** inserir URLs internas (`http://localhost`, `http://169.254.169.254`) em campos de URL
- **Path traversal:** `../../etc/passwd`, `..\..\windows\system32`
- Registrar qualquer comportamento suspeito como bug de severidade Alta

#### 5.13 JavaScript desabilitado
- Desabilitar JavaScript no browser
- Tentar submeter o formulário sem validação client-side
- Verificar se o servidor valida os dados corretamente (não depende apenas do JS)
- Verificar se mensagens de erro são exibidas (server-side rendering)
- Re-habilitar JavaScript após o teste

### 6. Conversão do vídeo para MP4
Após fechar o browser (o Playwright salva o `.webm` automaticamente):
```bash
ffmpeg -i clients/<id>/resultado/<timestamp>/videos/_raw/<arquivo>.webm \
       -c:v libx264 -crf 23 -preset fast \
       clients/<id>/resultado/<timestamp>/videos/forms_<timestamp>.mp4
```
- Se `ffmpeg` não estiver disponível, **NÃO instalar automaticamente**. Exibir:
  > ⚠️ ffmpeg não encontrado. Instale manualmente:
  >    Windows: winget install ffmpeg OU https://ffmpeg.org/download.html
  >    macOS: brew install ffmpeg
  >    Linux: sudo apt-get install ffmpeg
- Manter o `.webm` como evidência alternativa se ffmpeg não estiver disponível
- ffmpeg ausente **NÃO bloqueia** a skill — continuar normalmente
- Após conversão bem-sucedida: remover o `.webm` original

### 7. Geração do arquivo de resultado
Salvar `clients/<id>/resultado/latest/forms_<timestamp>.md`:
```markdown
# Resultado — Teste de Formulários
Data: <timestamp>
URL: <url testada>
Status geral: PASSOU | FALHOU | PARCIAL

## Evidências
- Vídeo completo da sessão: clients/<id>/resultado/latest/videos/forms_<timestamp>.mp4
- Screenshots por teste: clients/<id>/resultado/latest/screenshots/

## Campos identificados
| Campo | Tipo | Obrigatório | Máscara | Autocomplete |
|-------|------|-------------|---------|--------------|
| ...   | ...  | Sim/Não     | Sim/Não | Sim/Não      |

## Resultados por grupo de teste

### 1. Caminho feliz
- Status: ✅ PASSOU | ❌ FALHOU
- Screenshot: screenshots/forms_caminho_feliz.png
- Observação: ...

### 2. Campos vazios
| Campo | Erro exibido | Status | Screenshot |
|-------|--------------|--------|------------|
| ...   | ...          | ✅/❌  | ...        |

### 3. Dados inválidos
| Campo | Valor testado | Comportamento | Status | Screenshot |
|-------|---------------|---------------|--------|------------|

### 4. Limites
...

### 5. Caracteres especiais
...

### 6. Máscaras
...

### 7. Upload de arquivo
| Teste | Arquivo | Comportamento | Status | Screenshot |
|-------|---------|---------------|--------|------------|

### 8. Wizard multi-etapa
...

### 9. Autocomplete/Autofill
...

### 10. Internacionalização
| Caractere | Campo | Aceito | Exibido corretamente | Status |
|-----------|-------|--------|---------------------|--------|

### 11. Persistência de estado
...

### 12. Segurança expandida
| Payload | Campo | Comportamento | Status | Severidade |
|---------|-------|---------------|--------|------------|

### 13. JavaScript desabilitado
...

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|

## Bugs encontrados: <n>
```

### 8. Resumo final
```
✅ Teste de formulário concluído
   Campos testados: <n>
   Grupos de teste: 13
   Testes com sucesso: <n>
   Falhas encontradas: <n>
   Console errors: <n>
   Requisições com erro: <n>
   Vídeo: clients/<id>/resultado/latest/videos/forms_<timestamp>.mp4
   Screenshots: clients/<id>/resultado/latest/screenshots/
   Resultado: clients/<id>/resultado/latest/forms_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `clients/<id>/resultado/<timestamp>/forms_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/videos/forms_<timestamp>.mp4`
- `clients/<id>/resultado/<timestamp>/screenshots/forms_*.png`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
