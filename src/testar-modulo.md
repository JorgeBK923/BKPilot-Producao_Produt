---
id: testar-modulo
description: "Testa um modulo completo combinando cenarios de planilha, exploracao livre, responsividade, acessibilidade, rede, estabilidade e cleanup."
name: "Teste Completo de Módulo"
type: hybrid
language: pt-BR
provider_hint: balanced
tools_required:
  - playwright.browser_navigate
  - playwright.browser_click
  - playwright.browser_fill_form
  - playwright.browser_snapshot
  - playwright.browser_take_screenshot
  - playwright.browser_wait_for
  - fs.read_file
  - fs.write_file
  - shell.bash
inject_blocks:
  - console_monitoring
  - network_monitoring
  - session_reauth
  - cleanup
scripts:
  - cenarios/_executar_planilha.js
inputs:
  - name: cliente
    required: true
    description: "Identificador do cliente em clients/<id> usado para isolar estado, resultados, entregaveis e credenciais"
  - name: nome-do-modulo
    required: true
    description: "Nome do módulo (deve corresponder à coluna Módulo da planilha)"
  - name: arquivo
    required: true
    description: "Caminho da planilha de cenários"
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

# /testar-modulo — Teste Completo de Módulo

## Descrição
Skill híbrida que combina execução de roteiro + exploração livre. Primeiro executa todos os cenários da planilha para o módulo especificado. Depois, explora livremente apenas a área daquele módulo, buscando bugs que os cenários não cobrem. Inclui monitoramento de console/rede, re-autenticação, testes de acessibilidade, responsividade, throttle de rede e cleanup de dados.

## Uso
```
/testar-modulo --cliente <id> <nome-do-modulo> <arquivo> [--login <email>]
```

## Parâmetros
- `--cliente <id>` — identificador da pasta do cliente em `clients/<id>/` (obrigatório para isolar estado, resultados, entregáveis e credenciais)
- `<nome-do-modulo>` — nome do módulo a testar. Deve corresponder à coluna `Módulo` da planilha (obrigatório). Ex: `Login`, `Cadastro`, `Dashboard`
- `<arquivo>` — caminho da planilha de cenários (obrigatório). Ex: `cenarios/cenarios.xlsx`
- `--login <email>` — email de autenticação. A senha é lida de `QA_PASSWORD` em `clients/<id>/.env`

## Instruções de Execução

### 1. Validação de segurança
Se `--login` contiver `:` (senha inline), PARAR e exibir:
> ❌ ERRO DE SEGURANÇA: Use apenas --login <email>. Configure QA_PASSWORD em clients/<id>/.env.

### 2. Validação de pré-condição
Verificar se o arquivo informado existe:
- Se **não existir**, PARAR e exibir:
  > ❌ Arquivo não encontrado: <arquivo>
  > Execute /gerar-cenarios primeiro ou informe o caminho correto.

Verificar se há cenários com `Módulo` = `<nome-do-modulo>` na planilha:
- Se nenhum cenário encontrado, PARAR e exibir:
  > ❌ Nenhum cenário encontrado para o módulo: <nome-do-modulo>
  > Módulos disponíveis na planilha: <lista>

### 3. Preparação
- Registrar timestamp: `YYYY-MM-DD_HHMM`
- Criar pasta `clients/<id>/resultado/<timestamp>/`
- Criar subpasta `clients/<id>/resultado/<timestamp>/videos/` para os vídeos MP4
- Criar subpasta `clients/<id>/resultado/<timestamp>/screenshots/` para os screenshots
- Criar symlink `clients/<id>/resultado/latest → clients/<id>/resultado/<timestamp>/`
- Autenticar se `--login` foi passado

### 3.1 Configuração de gravação de vídeo
- **Etapa A (roteiro):** abrir e fechar o browser por cenário para gerar um vídeo individual por cenário
- **Etapa B (exploração livre):** gravar em sessão contínua única (um único vídeo cobre toda a exploração)
```
recordVideo: { dir: 'clients/<id>/resultado/<timestamp>/videos/_raw/', size: { width: 1280, height: 720 } }
```

### 3.2 Monitoramento de console do browser
Ativar captura de mensagens do console (conforme BLOCK-B do CLAUDE.md):
- Interceptar eventos `console.error` e `console.warning`
- Registrar: `{ timestamp, level, text, url, lineNumber }`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`

### 3.3 Monitoramento de requisições de rede
Ativar interceptação de rede (conforme BLOCK-C do CLAUDE.md):
- Registrar requisições com status >= 400 e requisições lentas (>3s)
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes }`
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`

### 3.4 Re-autenticação de sessão
Durante toda a execução (Etapa A e B), monitorar sinais de sessão expirada (conforme BLOCK-D do CLAUDE.md):
- Redirecionamento inesperado para página de login
- Resposta HTTP 401 ou 403
- Modal ou banner de "sessão expirada"
Se detectado:
1. Registrar evento com timestamp e motivo
2. Re-autenticar usando credenciais originais
3. Retornar à página/ação onde a sessão expirou
4. Continuar execução normalmente

---

## ETAPA A — Execução do Roteiro

### A.1 Filtrar cenários do módulo
- Ler da planilha apenas linhas onde `Módulo` = `<nome-do-modulo>`
- Exibir: `Cenários do módulo <nome>: <n>`

### A.2 Executar cada cenário
Para cada cenário filtrado:
1. Abrir novo contexto de browser (inicia nova gravação de vídeo individual)
2. Usar coluna `URL` como ponto de partida
3. Executar os `Passos` em linguagem natural via Playwright
4. Validar contra o `Resultado Esperado`
5. Tirar screenshot ao final: `screenshots/<ID>_final.png`
6. Fechar o browser — Playwright salva o `.webm` automaticamente
7. Converter para MP4:
   ```bash
   ffmpeg -i _raw/<arquivo>.webm -c:v libx264 -crf 23 -preset fast videos/<ID>_<timestamp>.mp4
   ```
   Se ffmpeg não disponível: manter `.webm`, exibir aviso (conforme BLOCK-A do CLAUDE.md)
8. Marcar `Passou` / `Falhou` / `Pulou` na planilha
9. Preencher colunas `Screenshot` e `Vídeo` na planilha
10. Em falha: preencher `Observações` com descrição da falha

---

## ETAPA B — Exploração Livre

Após concluir o roteiro, iniciar exploração livre **restrita ao módulo**.

### B.1 Escopo da exploração
- Usar as URLs do módulo identificadas na Etapa A como ponto de entrada
- Não navegar para fora das páginas do módulo
- Consultar `clients/<id>/estado/mapa.md` se disponível para conhecer a área do módulo

### B.2 Ações de exploração
Testar comportamentos não cobertos pelos cenários:
- **Duplo clique** em botões e elementos clicáveis
- **Tab entre campos** — verificar ordem de foco e comportamentos inesperados
- **Navegar para trás** (botão voltar do browser) após submissões
- **Colar texto** em campos com máscara ou validação especial
- **Redimensionar** — verificar se elementos quebram em tela menor
- **Teclas de atalho** — Enter para submeter, Escape para fechar modais
- **Clique fora** de modais e dropdowns
- **Recarregar página** (F5) durante preenchimento de formulário
- **Submeter formulário duas vezes** rapidamente (double submit)
- **Sessão expirada** — aguardar e tentar uma ação (se aplicável)

### B.3 Testes de acessibilidade
Durante a exploração livre, verificar:
- **Contraste de cores:** texto sobre fundo atende WCAG AA (4.5:1)?
- **Atributos alt:** imagens têm texto alternativo descritivo?
- **Atributos ARIA:** elementos interativos têm roles e labels adequados?
- **Hierarquia de headings:** h1 → h2 → h3 sem pulos?
- **Foco visível:** elementos focáveis têm indicador visual ao receber foco via Tab?

### B.4 Viewport mobile (375px)
- Redimensionar o viewport para 375px de largura
- Navegar pelas páginas do módulo
- Registrar: elementos que quebram, texto ilegível, botões não tocáveis (< 44x44px), menus que não adaptam

### B.5 Throttle de rede (3G lento)
- Ativar throttle de rede simulando 3G (download: 500kbps, upload: 250kbps, latência: 400ms)
- Navegar pelas páginas principais do módulo
- Registrar: tempos de carregamento, spinners que não aparecem, timeouts, experiência degradada

### B.6 Detecção de memory leak
- Registrar uso de memória (JS heap) no início da exploração
- Após navegar por várias páginas e interagir extensivamente, registrar novamente
- Se o heap cresceu mais de 50MB sem liberação: sinalizar possível memory leak
- Registrar: `{ heap_inicio_mb, heap_fim_mb, paginas_visitadas, delta_mb }`

### B.7 Registro de comportamentos inesperados
Para cada comportamento suspeito encontrado:
- Registrar: ação realizada, comportamento observado, URL, screenshot
- O vídeo contínuo da Etapa B já captura toda a sequência automaticamente

### B.8 Sugestão de novos cenários
Ao final, sugerir cenários que deveriam ser adicionados à planilha com base no que foi descoberto na exploração livre.

---

### 4. Conversão dos vídeos da Etapa B
Após encerrar a exploração livre, converter o vídeo contínuo:
```bash
ffmpeg -i clients/<id>/resultado/<timestamp>/videos/_raw/<arquivo>.webm \
       -c:v libx264 -crf 23 -preset fast \
       clients/<id>/resultado/<timestamp>/videos/exploracao_<timestamp>.mp4
```
Se ffmpeg não disponível: manter `.webm`, exibir aviso (conforme BLOCK-A do CLAUDE.md)

### 5. Cleanup de dados de teste
Ao final de toda a execução (Etapa A + B), realizar limpeza (conforme BLOCK-E do CLAUDE.md):
- Identificar registros criados durante a sessão (formulários submetidos, cadastros feitos)
- Tentar reverter: excluir registros via interface ou API se possível
- Registrar resultado: `{ item, tipo, url, status: "limpo|pendente", motivo }`
- Salvar em `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- Se cleanup não for possível: registrar como pendência

### 6. Geração dos artefatos
Atualizar planilha original in-place (com colunas Status, Observações, Screenshot e Vídeo preenchidas para os cenários executados):
1. Fazer backup: `cp <arquivo> <arquivo>.bak` (preserva versão original)
2. Atualizar a planilha original com os resultados
3. NÃO criar planilha separada — a original é a source of truth consolidada

Salvar `clients/<id>/resultado/latest/modulo_<timestamp>.md`:
```markdown
# Resultado — Teste de Módulo: <nome>
Data: <timestamp>
Arquivo: <arquivo>

## Evidências
- Vídeos por cenário (Etapa A): clients/<id>/resultado/latest/videos/<ID>_*.mp4
- Vídeo exploração livre (Etapa B): clients/<id>/resultado/latest/videos/exploracao_<timestamp>.mp4
- Screenshots: clients/<id>/resultado/latest/screenshots/

## Etapa A — Roteiro
| Status  | Quantidade |
|---------|------------|
| Passou  | <n>        |
| Falhou  | <n>        |
| Pulou   | <n>        |

## Etapa B — Exploração Livre
### Comportamentos inesperados encontrados
| Ação | Comportamento observado | URL | Screenshot |
|------|------------------------|-----|------------|
| ...  | ...                    | ... | ...        |

### Acessibilidade
| Violação | Elemento | URL | Severidade |
|----------|----------|-----|------------|
| ...      | ...      | ... | ...        |

### Viewport Mobile (375px)
| Problema | Elemento | URL | Screenshot |
|----------|----------|-----|------------|
| ...      | ...      | ... | ...        |

### Throttle 3G
| Página | Tempo de carregamento | Problemas | URL |
|--------|-----------------------|-----------|-----|
| ...    | ...                   | ...       | ... |

### Memory Leak
- Heap início: <n> MB
- Heap fim: <n> MB
- Delta: <n> MB
- Páginas visitadas: <n>
- Possível leak: sim/não

### Novos cenários sugeridos
| Fluxo sugerido | Motivo |
|----------------|--------|
| ...            | ...    |

## Console Errors
| Timestamp | Level | Mensagem | URL |
|-----------|-------|----------|-----|

## Network Issues
| Timestamp | Method | URL | Status | Duração |
|-----------|--------|-----|--------|---------|

## Cleanup de Dados
| Item | Tipo | Status | Motivo |
|------|------|--------|--------|

## Bugs encontrados: <n> (Etapa A: <n> | Etapa B: <n>)
```

### 7. Resumo final
```
✅ Teste de módulo concluído: <nome>
   Etapa A (roteiro): Passou <n> | Falhou <n> | Pulou <n>
   Etapa B (exploração): <n> comportamentos inesperados
   Acessibilidade: <n> violações
   Mobile 375px: <n> problemas
   Throttle 3G: <n> páginas lentas
   Memory leak: sim/não (delta <n> MB)
   Novos cenários sugeridos: <n>
   Console errors: <n>
   Requisições com erro: <n>
   Re-autenticações realizadas: <n>
   Cleanup: <n> itens limpos, <n> pendentes
   Resultado: clients/<id>/resultado/latest/modulo_<timestamp>.md

➡️  Próximo passo: /reportar-bug --cliente <id> --fonte clients/<id>/resultado/latest/
```

## Encadeia para
`/reportar-bug`, `/gerar-relatorio`

## Artefatos gerados
- `<arquivo>` — cópia atualizada in-place (com backup `.bak` da versão original)
- `clients/<id>/resultado/<timestamp>/modulo_<timestamp>.md`
- `clients/<id>/resultado/<timestamp>/videos/<ID>_<timestamp>.mp4` (um por cenário da Etapa A)
- `clients/<id>/resultado/<timestamp>/videos/exploracao_<timestamp>.mp4` (Etapa B contínua)
- `clients/<id>/resultado/<timestamp>/screenshots/<ID>_final.png`
- `clients/<id>/resultado/<timestamp>/console_log.json`
- `clients/<id>/resultado/<timestamp>/network_log.json`
- `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- `clients/<id>/resultado/latest/` → symlink para `clients/<id>/resultado/<timestamp>/`
