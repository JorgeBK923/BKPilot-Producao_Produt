# Plano Mobile Appium MCP - BKPilot

## Objetivo da sessao

Criar a base mobile do BKPilot para testar:

1. sistemas web abertos em navegador real de celular;
2. APKs/apps nativos em celulares ou device farms.

A decisao principal foi usar Appium para tudo que roda em device real ou device farm. Playwright continua apenas no fluxo web atual do BKPilot.

## Decisoes tomadas

### 1. Separacao entre mobile web e mobile APK

Foram criadas skills separadas para evitar confusao operacional:

Web mobile:

- `/explorar-mobile-web`
- `/gerar-cenarios-mobile-web`
- `/testar-modulo-mobile-web`
- `/executar-planilha-mobile-web`

APK/app nativo:

- `/explorar-mobile-apk`
- `/gerar-cenarios-mobile-apk`
- `/testar-modulo-mobile-apk`
- `/executar-planilha-mobile-apk`

Motivo: web mobile e APK usam Appium, mas os riscos, seletores, fluxos e evidencias sao diferentes.

### 2. Appium obrigatorio na camada mobile

Foi decidido que:

- mobile web em celular real usa Appium;
- APK/app nativo usa Appium;
- device farm online usa Appium/WebDriver remoto;
- Playwright nao entra na camada mobile.

### 3. Comercial e Producao devem usar as mesmas skills

As skills mobile devem estar disponiveis no BKPilot Comercial e no BKPilot Producao.

A logica reutilizavel deve viver em `@bugkillers/bkpilot-core`. Em 2026-05-10, o runtime mobile foi extraido para o Core e publicado na tag `v0.2.0`. Em seguida, a montagem de capabilities para cloud foi corrigida e publicada na tag `v0.2.1`.

Este repositorio fica com:

- skills;
- regras operacionais;
- integracoes especificas de Producao.

## Skills criadas

As 8 skills foram criadas como fonte canonica em:

```text
src/
```

Arquivos:

```text
src/explorar-mobile-web.md
src/explorar-mobile-apk.md
src/gerar-cenarios-mobile-web.md
src/gerar-cenarios-mobile-apk.md
src/testar-modulo-mobile-web.md
src/testar-modulo-mobile-apk.md
src/executar-planilha-mobile-web.md
src/executar-planilha-mobile-apk.md
```

Depois foram distribuidas pelo conversor para:

```text
dist/claude/
dist/codex/
dist/opencode/
.claude/commands/
```

Importante: o projeto ja tinha um conversor multi-target. A fonte correta e `src/`, nao editar tres agentes manualmente.

Comando usado para gerar distribuicoes:

```bash
node converter/render.js --build-all
```

## Conversor multi-target

Foi confirmado que o projeto usa:

```text
converter/
```

para transformar uma unica skill canonica em distribuicoes para:

- Claude;
- Codex;
- OpenCode.

Foi atualizado:

```text
converter/tools_map.yaml
```

para reconhecer o contrato mobile:

- `mobile.startSession`
- `mobile.getState`
- `mobile.tap`
- `mobile.type`
- `mobile.swipe`
- `mobile.back`
- `mobile.waitFor`
- `mobile.captureEvidence`
- `mobile.endSession`

## MCP Mobile/Appium

Foi implementado um servidor MCP local:

```text
scripts/mobile-mcp-server.js
```

Ele roda por stdio. Ou seja, ele nao precisa de porta propria.

Quem precisa de porta e o Appium Server, normalmente:

```text
http://127.0.0.1:4723
```

O MCP foi registrado em:

```text
.claude/settings.json
```

Servidor:

```json
"mobile": {
  "command": "node",
  "args": ["scripts/mobile-mcp-server.js"]
}
```

Script npm criado:

```bash
npm run mobile:mcp
```

## Cliente Appium reutilizavel

A logica comum foi extraida para:

```text
scripts/lib/mobile-appium-client.js
```

Essa camada e usada por:

- MCP Mobile;
- smoke test mobile.

Ela prepara a futura migracao para `@bugkillers/bkpilot-core`.

## Device Manager

Foi criado:

```text
scripts/lib/mobile-device-manager.js
```

Para Android local/USB, ele deve:

- listar devices via `adb devices`;
- identificar fisico/emulador;
- validar se o device esta autorizado;
- bloquear se houver multiplos devices sem selecao;
- validar bateria minima;
- validar tela acordada quando possivel;
- validar Chrome instalado para mobile web.

Para device farm online, a validacao acontece pela criacao de sessao remota.

## Smoke test mobile

Foi criado:

```text
scripts/mobile-smoke.js
```

Script npm:

```bash
npm run mobile:smoke
```

Como o PowerShell pode bloquear `npm.ps1`, tambem funciona direto:

```bash
node scripts/mobile-smoke.js --cliente acme --target web
```

Para APK:

```bash
node scripts/mobile-smoke.js --cliente acme --target apk --app clients/acme/app/app-release.apk
```

O smoke:

- le `clients/<id>/config.json`;
- valida Appium `/status`;
- valida device local quando `provider` e `local`;
- cria sessao Appium;
- abre URL no web mobile;
- captura screenshot;
- salva source XML;
- salva state JSON;
- encerra sessao;
- gera relatorio.

Relatorio:

```text
clients/<id>/resultado/<timestamp>/mobile/reports/mobile_smoke_report.json
```

O smoke tambem evita falso positivo:

- rejeita `about:blank`;
- rejeita source sem elementos;
- rejeita APK preso no launcher quando detectavel.

## Estrutura de evidencias mobile

O padrao antigo continua:

```text
clients/<id>/resultado/<timestamp>/screenshots/
clients/<id>/resultado/<timestamp>/videos/
```

Foi adicionada estrutura mobile:

```text
clients/<id>/resultado/<timestamp>/mobile/
  screenshots/
  sources/
  logs/
  states/
  reports/
```

Na Release Tecnica 0.1, evidencias obrigatorias:

- screenshot;
- source XML;
- state JSON.

Video ficou como best-effort.

## Contrato forte do `mobile.getState`

`mobile.getState` foi tratado como a ferramenta mais importante.

Ele deve retornar:

- `sessionId`;
- `target`;
- `provider`;
- `platform`;
- `udid`;
- `context`;
- `contexts`;
- `url`;
- `activity`;
- `orientation`;
- `screenName`;
- `elements`;
- `locatorCandidates`;
- `evidence.screenshot`;
- `evidence.source`;
- `rawPath`.

Importante: screenshot e auxiliar. A fonte confiavel para automacao e a arvore de elementos do Appium.

Para reduzir custo e contexto, `getState` agora retorna payload compacto por padrao:

- top-K elementos relevantes;
- XML completo salvo em arquivo;
- state completo salvo em arquivo.

Para diagnostico completo:

```json
{
  "includeAll": true
}
```

## Config amigavel e capabilities reais

O QA pode usar config simples:

```json
{
  "mobile": {
    "target": "web",
    "platform": "android",
    "device": "R58N123ABC",
    "browser": "chrome",
    "baseUrl": "https://app.cliente.com"
  }
}
```

O MCP converte internamente para capabilities Appium:

```json
{
  "platformName": "Android",
  "browserName": "Chrome",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "R58N123ABC"
}
```

Para Android fisico, `udid` e o campo principal.

`deviceName` fica opcional/descritivo.

## Modos de execucao

Foram definidos tres modos:

```text
observe
explore
execute
```

`observe`:

- apenas le estado;
- captura evidencias;
- bloqueia tap/type/swipe/back.

`explore`:

- permite navegacao;
- bloqueia acoes destrutivas sem confirmacao.

`execute`:

- usado para executar roteiro/cenario;
- permite acoes com maior controle.

Exemplos:

```bash
/explorar-mobile-web --cliente acme --mode explore
/testar-modulo-mobile-apk --cliente acme --mode execute
```

## Seguranca operacional

Foi definido:

- web mobile sem `allowedUrls`: permitido com warning;
- APK com `appPackage` sem `allowedAppPackages`: bloqueado;
- tokens, senhas, access keys e secrets devem sofrer redaction;
- campos sensiveis por cliente podem ser declarados em `mobile.sensitiveFields`;
- acoes destrutivas sao bloqueadas fora de `execute` ou sem confirmacao.

Exemplos de acoes destrutivas:

- excluir;
- enviar;
- aprovar;
- finalizar;
- cancelar;
- confirmar pagamento;
- alterar senha.

## Device farm online

Foi decidido preparar o BKPilot para qualquer farm online compativel com Appium/WebDriver, nao apenas Sauce Labs.

Exemplos de providers possiveis:

- Sauce Labs;
- BrowserStack;
- LambdaTest;
- Kobiton;
- Appium Grid proprio.

A configuracao generica usa:

```json
{
  "mobile": {
    "provider": "cloud",
    "target": "web",
    "appiumUrl": "https://hub.exemplo-device-farm.com/wd/hub",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "baseUrl": "https://app.cliente.com",
    "capabilities": {
      "platformName": "Android",
      "browserName": "Chrome",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": "Android Device"
    },
    "options": {
      "vendor:options": {
        "projectName": "BKPilot",
        "buildName": "mobile-web-smoke"
      }
    }
  }
}
```

Na Release Tecnica 0.1, device farm fica experimental ate passar smoke real em pelo menos um provider.

## Upload automatico de APK para farm

Foi decidido que isso NAO fica para Release 0.2.

Release Tecnica 0.1 deve suportar:

1. APK remoto ja enviado ao provider;
2. APK local com upload automatico.

Exemplo de APK remoto:

```json
{
  "mobile": {
    "provider": "cloud",
    "target": "apk",
    "app": "storage:app-release.apk"
  }
}
```

Exemplo de APK local com upload automatico:

```json
{
  "mobile": {
    "provider": "saucelabs",
    "target": "apk",
    "app": "clients/acme/app/app-release.apk",
    "allowExternalUpload": true
  }
}
```

Foi definido o componente:

```text
Mobile Farm Upload Manager
  -> uploadApp(provider, apkPath, config)
  -> remoteAppId
```

Regras:

- se `app` ja for remoto, nao faz upload;
- se `app` for local e provider for cloud, exige `allowExternalUpload: true`;
- calcula hash do APK;
- envia usando adaptador do provider;
- retorna `remoteAppId`;
- usa `remoteAppId` em `appium:app`;
- salva `mobile/reports/mobile_upload_report.json`;
- se o provider nao tiver adaptador, falha com erro claro pedindo app remoto ja existente.

Importante: upload de APK nao e padronizado pelo Appium. Cada farm tem sua propria API.

## VPS sem GPU

Foi discutido que a VPS atual nao tem GPU.

Conclusao:

- nao vale tentar emular Android pesado nessa VPS;
- a VPS pode ser orquestradora;
- o executor pode ser device farm online;
- ou um host fisico com celular USB conectado.

Arquitetura recomendada para host fisico:

```text
VPS BKPilot
  -> MCP mobile
  -> Appium remoto via VPN
  -> mini PC/notebook com celular USB
```

Arquitetura recomendada para farm:

```text
VPS BKPilot
  -> MCP mobile
  -> Appium/WebDriver remoto do farm
  -> device real/emulador do provider
```

## Video

Foi discutido se video deveria sair da Release 0.1.

Decisao final:

- video nao foi removido da visao do produto;
- mas na Release Tecnica 0.1 ele e best-effort;
- evidencia obrigatoria e screenshot + source XML + state JSON;
- video depende do device/provider;
- farm online pode fornecer video por API propria no futuro.

Motivo: video em Appium varia muito entre Android local, web mobile e farms online.

## Skill Runner

Foi registrado que as skills mobile nao criam um runner paralelo.

O modelo continua:

```text
src/*.md
  -> converter/
  -> dist/claude
  -> dist/codex
  -> dist/opencode
  -> .claude/commands
```

O que muda e o conjunto de tools MCP disponiveis:

- skills web usam Playwright MCP;
- skills mobile usam Mobile/Appium MCP;
- skills documentais nao precisam de executor de browser/device.

## Arquivos principais criados ou alterados

Documentos:

```text
docs/arquitetura/BKPilot-Mobile-Appium-MCP.md
docs/arquitetura/Mobile-Appium-MCP-Setup.md
docs/arquitetura/Plano-Mobile-Appium-MCP.md
```

Scripts:

```text
scripts/mobile-mcp-server.js
scripts/mobile-smoke.js
scripts/sync-shared-skills.js
scripts/lib/mobile-appium-client.js
scripts/lib/mobile-device-manager.js
```

Config:

```text
.claude/settings.json
package.json
converter/tools_map.yaml
```

Skills canonicas:

```text
src/*-mobile-*.md
```

Distribuicoes:

```text
dist/claude/*-mobile-*.md
dist/codex/*-mobile-*.md
dist/opencode/*-mobile-*.md
.claude/commands/*-mobile-*.md
```

## Validacoes feitas

Foram executadas validacoes de sintaxe:

```bash
node --check scripts/lib/mobile-appium-client.js
node --check scripts/lib/mobile-device-manager.js
node --check scripts/mobile-smoke.js
node --check scripts/mobile-mcp-server.js
```

Foi validado o conversor:

```bash
node converter/render.js --lint
node converter/render.js --build-all
```

Foi validado handshake MCP:

```text
initialize
tools/list
```

O MCP listou as tools mobile corretamente.

## Atualizacao arquitetural - Core v0.2.1

Em 2026-05-10 foi corrigido o desvio arquitetural inicial: o runtime mobile tinha sido criado dentro do Producao, mas deveria ser compartilhado entre Comercial e Producao. Na mesma janela, o Core recebeu uma correcao de cloud para nao inferir `udid` automaticamente em farms remotas e foi publicado como `v0.2.1`.

### Decisao

- O `BKPilot-Core` e dono da logica JS compartilhada.
- O Producao e o Comercial devem manter apenas wrappers finos e skills especificas.
- As skills Markdown continuam fora do Core por enquanto, porque o Core e biblioteca CommonJS.
- Se as skills precisarem ser compartilhadas como artefato canonico, criar um pacote/repositorio dedicado, por exemplo `BKPilot-Skills`.

### Publicado no BKPilot-Core

Commit publicado:

```text
df5e549 Adicionar runtime mobile compartilhado
```

Tag publicada:

```text
v0.2.1
```

Modulos adicionados ao Core:

```text
mobile-appium-client.js
mobile-device-manager.js
mobile-mcp.js
```

Exports adicionados em `index.js`:

```js
mobileAppium
mobileDeviceManager
mobileMcp
```

### Ajustes feitos no runtime mobile

- `mobile-smoke` agora consulta `/status` usando o provider resolvido, evitando testar Appium local quando o cliente usa farm remoto.
- `buildCapabilities()` remove campos internos de politica/governanca antes de enviar capabilities ao Appium.
- `startSession()` retorna capabilities com redaction.
- `ROOT` do runtime mobile usa `process.cwd()` ou `BKPILOT_ROOT`, para salvar artefatos no consumidor, nao dentro do Core.
- para provider cloud, `buildCapabilities()` so infere `udid` automaticamente quando o provider e local.

### Ajustes feitos no Producao

Commit publicado:

```text
25ff504 Usar runtime mobile compartilhado do Core
```

O Producao agora consome:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.1"
```

Wrappers finos mantidos no Producao:

```text
scripts/lib/mobile-appium-client.js
scripts/lib/mobile-device-manager.js
scripts/mobile-mcp-server.js
```

Esses arquivos nao devem receber logica nova; devem apenas chamar o Core.

## O que ficou pronto

Pronto nesta sessao:

- arquitetura mobile web/APK;
- 8 skills mobile;
- distribuicao Claude/Codex/OpenCode;
- MCP Mobile/Appium por stdio;
- suporte Appium local/remoto;
- suporte generico a device farm;
- smoke test mobile;
- Device Manager local;
- Evidence Manager basico;
- contrato forte de `mobile.getState`;
- modes `observe/explore/execute`;
- politica inicial de seguranca;
- documentacao de setup;
- matriz de compatibilidade;
- criterios de aceite;
- decisao de upload automatico de APK na Release 0.1;
- runtime mobile compartilhado publicado no `BKPilot-Core#v0.2.0`;
- correcao cloud publicada no `BKPilot-Core#v0.2.1`;
- Producao migrado para wrappers finos que chamam o Core.

## O que ficou de fora

Ainda nao foi implementado:

- smoke real contra celular Android USB;
- adaptador real de upload de APK para provider especifico;
- download de videos/logs do provider;
- gravacao local de video via Appium `startRecordingScreen`;
- mascaramento visual de dados sensiveis em screenshot;
- parser XML robusto com biblioteca dedicada;
- extracao das skills Markdown para pacote compartilhado dedicado, se for decidido criar `BKPilot-Skills`;
- execucao real das planilhas mobile ponta a ponta;
- relatorio final cliente com artefatos mobile consolidados;
- suporte iOS;
- suporte a multiplos devices em lote;
- Appium Grid proprio;
- testes automatizados unitarios para o MCP.

Implementado apos a lista inicial:

- smoke real contra Sauce Labs US West 1 aprovado em 2026-05-09 com alocacao dinamica Android + Chrome.
- o smoke carrega `.env` local automaticamente para `MOBILE_FARM_USERNAME`, `MOBILE_FARM_ACCESS_KEY` e `APPIUM_URL`.

## Proximas atividades

## Plano de trabalho por fases

### Fase 1 - Consolidar arquitetura

Objetivo: deixar as responsabilidades claras para evitar nova duplicacao entre Comercial, Producao e Core.

Tarefas:

1. Manter este documento como fonte consolidada do plano mobile.
2. Atualizar `AGENTS.md` dos repositorios envolvidos com a regra:
   - `BKPilot-Core`: runtime JS compartilhado.
   - `BKPilot-Skills`: skills/templates reutilizaveis.
   - `BKPilot-Producao`: execucao operacional real.
   - `BKPilot-Comercial`: demos, venda, experiencias comerciais e `mobile-demo`.
3. Registrar explicitamente que qualquer `mobile-demo` pertence ao Comercial, nao ao Core nem ao Producao.

Status:

- Producao ja aponta para `BKPilot-Core#v0.2.1`.
- Core ja publicou o runtime mobile compartilhado.
- `BKPilot-Skills` foi criado e publicado no GitHub com as 8 skills mobile e conversor multi-target.
- `BKPilot-Skills` foi tagueado como `v0.1.0`.
- Comercial foi alinhado ao Core mobile e recebeu as skills mobile compartilhadas.

### Fase 2 - Criar BKPilot-Skills

Objetivo: criar uma fonte canonica para skills compartilhadas entre Comercial e Producao.

Tarefas:

1. Criar repositorio/pasta `BKPilot-Skills`. Status: feito e publicado.
2. Definir `AGENTS.md` especifico do repo, deixando claro que ali vivem apenas skills compartilhadas. Status: feito.
3. Levar para la as skills mobile canonicas. Status: feito.

```text
src/explorar-mobile-web.md
src/explorar-mobile-apk.md
src/gerar-cenarios-mobile-web.md
src/gerar-cenarios-mobile-apk.md
src/testar-modulo-mobile-web.md
src/testar-modulo-mobile-apk.md
src/executar-planilha-mobile-web.md
src/executar-planilha-mobile-apk.md
```

4. Definir se o conversor completo fica no `BKPilot-Skills` ou se apenas templates de skills sao compartilhados. Decisao inicial: conversor completo fica no `BKPilot-Skills`.
5. Gerar distribuicoes. Status: feito.

```text
dist/claude/
dist/codex/
dist/opencode/
```

Validacoes executadas no `BKPilot-Skills`:

```bash
npm.cmd install
npm.cmd run skills:lint
npm.cmd run skills:build
```

Resultado:

- 8 skills validadas.
- 24 arquivos renderizados em `dist/`.
- 0 vulnerabilidades reportadas pelo npm.
- commit publicado: `d7db9f0 Criar pacote de skills mobile compartilhadas`.
- remote: `https://github.com/JorgeBK923/BKPilot-Skills.git`.

Status adicional:

- mecanismo formal de sync entre consumidores e `BKPilot-Skills` criado em Producao;
- comando padrao: `npm.cmd run skills:sync:mobile`.

Decisao recomendada:

- `BKPilot-Skills` deve conter `src/`, `converter/`, `dist/` e scripts de build/lint de skills.
- Consumidores nao devem editar skills mobile compartilhadas diretamente.

### Fase 3 - Sincronizar Producao

Objetivo: fazer o Producao consumir skills compartilhadas sem virar fonte duplicada.

Tarefas:

1. Criar script de sincronizacao no Producao. Status: feito.

```bash
npm.cmd run skills:sync:mobile
```

2. Sincronizar skills mobile de `BKPilot-Skills` para. Status: feito.

```text
src/
dist/claude/
dist/codex/
dist/opencode/
.claude/commands/
```

3. Documentar que edicoes de skill mobile compartilhada devem acontecer no `BKPilot-Skills`.
4. Rodar. Status: feito.

```bash
npm.cmd run skills:lint
```

Validacoes executadas no Producao:

```bash
node --check scripts/sync-shared-skills.js
npm.cmd run skills:sync:mobile
npm.cmd run skills:lint
```

Resultado:

- 41 arquivos sincronizados a partir de `BKPilot-Skills`;
- lint de skills aprovado;
- aviso esperado mantido para script opcional por cliente `clients/<client>/scripts/limpar-chats.js`.

### Fase 4 - Sincronizar Comercial

Objetivo: permitir que o Comercial use a mesma base mobile sem copiar runtime.

Tarefas:

1. Atualizar `BKPilot-Comercial` para consumir. Status: feito.

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.1"
```

2. Criar wrappers finos no Comercial. Status: feito.

```text
scripts/lib/mobile-appium-client.js
scripts/lib/mobile-device-manager.js
scripts/mobile-mcp-server.js
```

3. Sincronizar skills mobile de `BKPilot-Skills`. Status: feito.
4. Registrar MCP mobile no `.claude/settings.json`, se o Comercial for executar as skills. Status: feito.
5. Criar comando formal de sync no Comercial, equivalente ao Producao. Status: feito.
6. Criar `mobile-demo` dentro do Comercial, se houver necessidade comercial. Esta tarefa fica como ultima prioridade, depois de sync, smoke real e hardening.

Regra:

- `mobile-demo` e fluxo especifico de venda/demo. Portanto pertence ao `BKPilot-Comercial`.

Commit publicado no Comercial:

```text
5e715ba Alinhar Comercial ao mobile compartilhado
46ad115 Adicionar sync de skills mobile compartilhadas
```

Validacoes executadas no Comercial:

```bash
node --check scripts/sync-shared-skills.js
npm.cmd run skills:sync:mobile
node -e "const c=require('@bugkillers/bkpilot-core'); console.log(Boolean(c.mobileAppium.MobileAppiumClient && c.mobileDeviceManager.validateLocalAndroidDevice && c.mobileMcp.runMobileMcpServer))"
node --check scripts/mobile-mcp-server.js
node --check scripts/mobile-smoke.js
npm.cmd run skills:lint
npm.cmd test
```

Resultado:

- import mobile: ok;
- sync formal: 41 arquivos sincronizados a partir de `BKPilot-Skills`;
- lint de 28 skills: ok, com aviso esperado do script opcional `clients/<client>/scripts/limpar-chats.js`;
- testes comerciais: 72 passaram, 1 skip, 0 falhas;
- `npm install` reportou 1 vulnerabilidade alta ja existente/fora do escopo desta migracao.

### Fase 5 - Validacao real

Objetivo: sair da validacao estrutural e executar em device/farm real.

Tarefas:

1. Escolher primeiro alvo real:
   - Android USB local; ou
   - provider cloud Appium/WebDriver.
2. Criar `clients/mobile-demo/config.json` no repositorio adequado.
3. Rodar smoke de importacao em Comercial e Producao.
4. Rodar smoke Appium real:

```bash
node scripts/mobile-smoke.js --cliente mobile-demo --target web
```

5. Registrar resultado neste documento.

Status:

- Sauce Labs US West 1 validado com sucesso usando `clients/sauce-mobile-smoke/config.json`.
- Comando executado:

```bash
npm.cmd run mobile:smoke -- --cliente sauce-mobile-smoke --target web
```

- Resultado:

```text
Smoke passed: clients\sauce-mobile-smoke\resultado\2026-05-09_2321\mobile\reports\mobile_smoke_report.json
```

- Observacao: a alocacao estatica por device falhou com matching error; a alocacao dinamica Android + Chrome passou.

### Fase 6 - Hardening

Objetivo: reduzir risco antes de usar em cliente real.

Tarefas:

1. Criar testes unitarios no Core para:
   - `buildCapabilities()`;
   - `resolveProviderConfig()`;
   - `redact()`;
   - policies `allowedUrls` e `allowedAppPackages`.
2. Trocar parser XML regex por biblioteca dedicada.
3. Implementar mascaramento visual de dados sensiveis em screenshots.
4. Avaliar `startRecordingScreen` para video local best-effort.
5. Planejar upload automatico de APK para o primeiro provider escolhido.
6. Consolidar relatorio final cliente com artefatos mobile.

### Prioridade 1 - Alinhar Comercial ao Core mobile

1. Atualizar `BKPilot-Comercial` para consumir:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.1"
```

2. Criar no Comercial os wrappers finos equivalentes:

```text
scripts/lib/mobile-appium-client.js
scripts/lib/mobile-device-manager.js
scripts/mobile-mcp-server.js
```

3. Registrar o MCP mobile no `.claude/settings.json` do Comercial, se o Comercial precisar executar as mesmas skills.
4. Rodar smoke de importacao no Comercial:

```bash
node -e "const c=require('@bugkillers/bkpilot-core'); console.log(Boolean(c.mobileAppium.MobileAppiumClient && c.mobileMcp.runMobileMcpServer))"
```

### Prioridade 2 - Decidir onde ficam as skills compartilhadas

Hoje as skills mobile canonicas estao no Producao em `src/*-mobile-*.md`.

Decisao pendente:

- manter copia controlada no Comercial e no Producao; ou
- criar um repositorio/pacote dedicado, por exemplo `BKPilot-Skills`, para distribuir skills entre Comercial, Producao, Claude, Codex e OpenCode.

Recomendacao: nao colocar as skills Markdown dentro do `BKPilot-Core` neste momento. O Core deve continuar sendo biblioteca JS compartilhada.

### Prioridade 3 - Primeiro smoke real

1. Escolher o primeiro alvo real:
   - Android USB local; ou
   - provider cloud Appium/WebDriver.
2. Criar `clients/mobile-demo/config.json`.
3. Configurar credenciais se for farm remoto:

```bash
set MOBILE_FARM_USERNAME=...
set MOBILE_FARM_ACCESS_KEY=...
```

4. Rodar smoke web:

```bash
node scripts/mobile-smoke.js --cliente mobile-demo --target web
```

5. Registrar resultado neste documento.

### Prioridade 4 - APK e device farm

1. Escolher provider para APK.
2. Implementar o primeiro adaptador real do Mobile Farm Upload Manager.
3. Rodar smoke APK com upload automatico.
4. Baixar videos/logs do provider quando disponivel.

### Prioridade 5 - Hardening tecnico

- Adicionar testes unitarios para `buildCapabilities()`, `redact()`, `resolveProviderConfig()` e policies de seguranca.
- Trocar parser XML regex por biblioteca dedicada.
- Implementar mascaramento visual de dados sensiveis em screenshots.
- Avaliar `startRecordingScreen` para video local best-effort.
- Consolidar relatorio final cliente com artefatos mobile.
- Documentar suporte iOS como fase separada.

### Ultima prioridade - mobile-demo comercial

Criar `mobile-demo` apenas depois que os itens anteriores estiverem estabilizados:

1. sync formal de skills funcionando;
2. Comercial e Producao reproduzindo as skills a partir do `BKPilot-Skills`;
3. smoke real Appium aprovado;
4. hardening minimo do Core concluido.

Regra:

- `mobile-demo` pertence ao `BKPilot-Comercial`;
- nao mover demo, dados fake, UI/API comercial ou narrativa de venda para Core ou Producao;
- demo deve consumir Core e Skills como dependencia, sem copiar runtime.

## Observacao sobre a skill PDF

Ao final da sessao, foi instalada a skill `pdf` do repositorio `openai/skills` em:

```text
C:\Users\Jorge\.codex\skills\pdf
```

Comando executado via helper da skill-installer.

Para carregar a skill, e necessario reiniciar o Codex.
