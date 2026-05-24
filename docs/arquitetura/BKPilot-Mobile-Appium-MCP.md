# BKPilot Mobile com Appium e MCP

## Objetivo

Registrar a tese inicial para criar uma camada mobile do BKPilot usando Appium, mantendo o modelo operacional parecido com o fluxo web atual, mas com skills proprias para evitar confusao entre automacao web desktop, web mobile em device real e automacao de APK.

Este documento descreve uma proposta arquitetural. Ainda nao representa uma implementacao pronta.

Implementacao MVP local iniciada em `scripts/mobile-mcp-server.js`. Plano consolidado, historico de decisoes e proximas atividades ficam em `docs/arquitetura/Plano-Mobile-Appium-MCP.md`.

## Escopo entre Comercial e Producao

As skills mobile devem estar disponiveis tanto no BKPilot Comercial quanto no BKPilot Producao.

Decisao:

- O Comercial deve conseguir usar as mesmas familias de skills mobile:
  - `/explorar-mobile-web`
  - `/gerar-cenarios-mobile-web`
  - `/testar-modulo-mobile-web`
  - `/executar-planilha-mobile-web`
  - `/explorar-mobile-apk`
  - `/gerar-cenarios-mobile-apk`
  - `/testar-modulo-mobile-apk`
  - `/executar-planilha-mobile-apk`
- A logica reutilizavel de Appium/MCP, normalizacao de estado, captura de evidencias e execucao comum deve ficar no `@bugkillers/bkpilot-core`.
- Cada repositorio deve manter apenas suas regras operacionais, comandos/skills e integracoes especificas.
- Se uma regra for comercial, demo, relatorio comercial ou fluxo de venda, ela fica no Comercial.
- Se uma regra for operacional de execucao em cliente real/producao, ela fica no Producao.

O objetivo e evitar duplicacao entre Comercial e Producao sem misturar responsabilidades de produto.

## Decisao inicial

Criar skills mobile com nomes explicitos por tipo de alvo:

Web mobile em navegador real do celular:

- `/explorar-mobile-web`
- `/gerar-cenarios-mobile-web`
- `/testar-modulo-mobile-web`
- `/executar-planilha-mobile-web`

APK/app nativo instalado no celular:

- `/explorar-mobile-apk`
- `/gerar-cenarios-mobile-apk`
- `/testar-modulo-mobile-apk`
- `/executar-planilha-mobile-apk`

O fluxo web atual permanece com:

- `/explorar`
- `/gerar-cenarios`
- `/testar-modulo`
- `/executar-planilha`

No futuro, pode existir um parametro generico como `--platform mobile`, mas para MVP os comandos separados reduzem risco operacional. O nome da skill deve carregar `web` ou `apk` para deixar claro o tipo de teste.

Decisao adicional: todos os testes mobile em device real devem usar Appium. Isso inclui sistemas web para mobile executados no Chrome/Safari do aparelho. Playwright permanece apenas no fluxo web atual fora desta arquitetura mobile.

## Arquitetura proposta

O BKPilot passa a ter motores de execucao separados por contexto:

- Web atual: Playwright, para o fluxo web ja existente.
- Mobile web em device real: Appium controlando o navegador do celular.
- Mobile APK/app nativo: Appium controlando o aplicativo instalado.
- Device farm online: Appium remoto/WebDriver cloud, sem acoplamento a fornecedor especifico.

Fluxo sugerido:

```text
BKPilot skill mobile-web ou mobile-apk
  -> MCP Mobile/Appium
  -> Appium Server
  -> ADB / XCUITest
  -> Android emulator, Android fisico ou iOS
```

O MCP Mobile deve ser uma ponte controlada entre a IA e o Appium. A IA decide os proximos passos, interpreta estados, documenta a exploracao e gera cenarios; o MCP executa acoes no navegador mobile ou no app e devolve estados estruturados.

## Tipos de alvo mobile

### Mobile web

Sistema web acessado pelo navegador real do celular, por exemplo Chrome no Android. Deve usar Appium com `browserName`, nunca Playwright.

Configuracao exemplo:

```json
{
  "mobile": {
    "target": "web",
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "R58N123ABC",
    "browserName": "Chrome",
    "baseUrl": "https://app.cliente.com"
  }
}
```

Skill futura:

```bash
/explorar-mobile-web --client acme --device R58N123ABC
```

### Mobile APK/app nativo

Aplicativo instalado no celular ou APK fornecido pelo cliente. Deve usar Appium com `appPackage`/`appActivity` ou com o caminho do APK.

Configuracao exemplo:

```json
{
  "mobile": {
    "target": "apk",
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "R58N123ABC",
    "app": "clients/acme/app/app-release.apk"
  }
}
```

Skill futura:

```bash
/explorar-mobile-apk --client acme --device R58N123ABC
```

## Ferramentas esperadas no MCP Mobile

Contrato inicial sugerido:

- `mobile.startSession`
- `mobile.getState`
- `mobile.tap`
- `mobile.type`
- `mobile.swipe`
- `mobile.back`
- `mobile.waitFor`
- `mobile.captureEvidence`
- `mobile.endSession`

A ferramenta mais importante e `mobile.getState`, que deve retornar a tela atual, arvore de elementos e caminhos das evidencias.

Exemplo:

```json
{
  "platform": "android",
  "activity": "com.app.MainActivity",
  "screen": "Login",
  "elements": [
    {
      "id": "email_input",
      "text": "",
      "class": "android.widget.EditText",
      "clickable": true,
      "bounds": [32, 220, 690, 280]
    }
  ],
  "screenshot": "clients/acme/resultado/2026-05-09_1530/screenshots/login.png"
}
```

Contrato alvo reforcado:

- retornar `sessionId`, `target`, `provider`, `platform`, `udid`, contexto atual, URL/activity e orientacao;
- retornar `elements` estruturados a partir da arvore Appium;
- incluir `locatorCandidates` com confianca para cada elemento relevante;
- salvar screenshot e source XML como evidencias;
- salvar estado bruto em `clients/<id>/resultado/<timestamp>/mobile/states/`.
- retornar payload compacto por padrao, com top-K elementos relevantes, mantendo XML/source completo em arquivo.

O BKPilot nao deve depender apenas de screenshot para automacao. A imagem e auxiliar; a fonte confiavel para interacao deve ser a arvore de elementos do Appium.

## Configuracao e seguranca operacional

A configuracao exposta ao QA deve ser amigavel, por exemplo `platform`, `device`, `browser`, `baseUrl`, `app`. O MCP converte internamente para capabilities Appium modernas com prefixo `appium:`, usando `udid` como campo principal para Android fisico.

Modos de execucao:

- `observe`: somente estado e evidencias.
- `explore`: navegacao exploratoria sem acoes destrutivas.
- `execute`: execucao de roteiro/cenario com maior permissao.

Regras de seguranca:

- permitir allowlist de URLs e `appPackage` por cliente;
- aplicar redaction em tokens, access keys, senhas e secrets;
- bloquear acoes destrutivas fora de `execute` ou sem confirmacao;
- registrar sessionId, timestamp, evidencias e trilha de auditoria;
- nao enviar APK/dados para device farm sem autorizacao do cliente.

Defaults de seguranca:

- mobile web sem `allowedUrls`: permitido com warning operacional;
- APK com `appPackage` sem `allowedAppPackages`: bloqueado;
- campos sensiveis podem ser declarados por cliente em `mobile.sensitiveFields`.

## Skill Runner

As skills mobile nao criam um runner paralelo. Elas continuam sendo skills `.md` mantidas em `src/` e distribuidas pelo conversor para Claude, Codex e OpenCode.

O Skill Runner/orquestrador continua o mesmo. O que muda por skill e o conjunto de tools MCP disponiveis:

- Playwright MCP para skills web atuais;
- Mobile/Appium MCP para skills mobile;
- sem executor de browser/device para skills puramente documentais.

## Escopo da Release Tecnica 0.1

- Device farm online fica experimental ate smoke real passar em pelo menos um provider.
- Video e best-effort, nao evidencia obrigatoria.
- Evidencia obrigatoria: screenshot, source XML e state JSON.
- APK em device farm deve suportar upload automatico quando `app` apontar para arquivo local e houver autorizacao explicita do cliente.
- Como upload de APK nao e padronizado pelo Appium, a Release 0.1 deve incluir um Mobile Farm Upload Manager com pelo menos um adaptador real de provider.
- Criterios de aceite detalhados ficam em `docs/arquitetura/Mobile-Appium-MCP-Setup.md`.

## Como seria o `/explorar-mobile-web`

Responsabilidades:

- iniciar sessao Appium com navegador mobile
- abrir a `baseUrl` no Chrome/Safari do device
- mapear paginas, botoes, campos, menus e navegacao responsiva
- capturar screenshots
- coletar arvore de elementos exposta pelo navegador via Appium
- registrar fluxos principais
- detectar estados de erro, login expirado, travamentos e problemas de responsividade
- gerar mapa de telas e elementos

Artefatos esperados:

```text
clients/<id>/estado/mobile_web_mapa.md
clients/<id>/estado/mobile_web_fluxos.md
clients/<id>/estado/mobile_web_elementos.json
clients/<id>/resultado/<timestamp>/screenshots/
clients/<id>/resultado/<timestamp>/videos/
clients/<id>/resultado/<timestamp>/mobile_web_log.json
```

## Como seria o `/explorar-mobile-apk`

Responsabilidades:

- iniciar sessao Appium
- abrir o APK/app Android ou iOS
- mapear telas, botoes, campos, menus e navegacao
- capturar screenshots
- coletar arvore de elementos
- registrar fluxos principais
- detectar estados de erro, login expirado e travamentos
- gerar mapa de telas e elementos

Artefatos esperados:

```text
clients/<id>/estado/mobile_apk_mapa.md
clients/<id>/estado/mobile_apk_fluxos.md
clients/<id>/estado/mobile_apk_elementos.json
clients/<id>/resultado/<timestamp>/screenshots/
clients/<id>/resultado/<timestamp>/videos/
clients/<id>/resultado/<timestamp>/mobile_apk_log.json
```

A IA pode usar screenshots para entender visualmente a tela, mas a base confiavel deve ser a arvore de elementos do Appium.

## Como seria o `/gerar-cenarios-mobile-web`

Gerar cenarios a partir do mapa mobile web, incluindo riscos especificos de sistemas web em celular:

- layout quebrado em viewport real
- menu, filtros, tabelas e modais em tela pequena
- teclado cobrindo campos
- campos cortados ou texto truncado
- rolagem horizontal indevida
- sticky headers/footers cobrindo acoes
- offline e reconexao
- rede lenta
- background e foreground
- rotacao de tela
- diferencas entre tamanhos de tela
- login expirado no navegador mobile

## Como seria o `/gerar-cenarios-mobile-apk`

Gerar cenarios a partir do mapa mobile, incluindo riscos especificos de apps:

- teclado cobrindo campos
- permissoes do sistema
- offline e reconexao
- rede lenta
- background e foreground
- rotacao de tela
- deep links
- push notifications
- biometria, quando existir
- campos cortados ou texto truncado
- diferencas entre tamanhos de tela

## Como seria o `/testar-modulo-mobile-web` e `/testar-modulo-mobile-apk`

Executar testes focados em uma tela, modulo ou fluxo especifico.

Evidencias recomendadas:

- screenshots antes/depois
- video da sessao
- logs do Appium
- logs do device
- falhas de interacao
- crash logs, quando disponiveis
- resumo em `.md`

Para `mobile-web`, crash logs podem nao se aplicar; nesse caso, priorizar logs do navegador, console quando disponivel via Appium e falhas de carregamento/interacao.

## Como seria o `/executar-planilha-mobile-web` e `/executar-planilha-mobile-apk`

Executar cenarios definidos em planilha para mobile.

A planilha pode evoluir com colunas como:

- `plataforma`
- `device`
- `appPackage`
- `appActivity`
- `app`
- `browserName`
- `baseUrl`
- `modulo`
- `cenario`
- `dados`
- `esperado`

Para nao quebrar o fluxo atual, a planilha mobile pode comecar separada ou usar uma aba especifica.

## Devices fisicos conectados ao PC

E possivel rodar as futuras skills em aparelhos fisicos conectados ao PC, principalmente Android via USB.

Requisitos para Android:

- Node.js
- Appium 2
- driver Appium `uiautomator2`
- Android Platform Tools
- `adb`
- depuracao USB ativa no aparelho
- app instalado ou APK disponivel

Comando de diagnostico:

```bash
adb devices
```

Resultado esperado:

```text
List of devices attached
R58N123ABC device
```

Configuracao exemplo em `clients/<id>/config.json`:

```json
{
  "mobile": {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "R58N123ABC",
    "appPackage": "com.cliente.app",
    "appActivity": ".MainActivity"
  }
}
```

Ou, para instalar/abrir por APK:

```json
{
  "mobile": {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "R58N123ABC",
    "app": "clients/cliente/app/app-release.apk"
  }
}
```

Skill futura para APK:

```bash
/explorar-mobile-apk --client acme --device R58N123ABC
```

Se houver apenas um device conectado, o device pode ser inferido.

## Android primeiro

O MVP deve priorizar Android fisico ou emulador.

Motivos:

- operacao mais simples no Windows
- ADB e Appium funcionam bem em PC comum
- nao exige Xcode
- menor atrito para conectar devices reais

## iOS depois

iOS tambem e possivel com Appium, mas deve ficar para uma fase posterior.

Requisitos adicionais:

- macOS
- Xcode
- Appium driver `xcuitest`
- WebDriverAgent
- provisioning/signing
- configuracao de confianca no iPhone

## Seletores e acessibilidade

A qualidade da automacao mobile depende muito dos identificadores expostos pelo app.

Prioridade de seletores:

- Android: `resource-id` e `content-desc`
- iOS: `accessibilityIdentifier`
- React Native: `testID` e `accessibilityLabel`
- Flutter: semantics/chaves expostas
- XPath apenas como fallback

Sem bons seletores, a exploracao ainda e possivel, mas a automacao fica mais fragil por depender de texto, posicao ou estrutura interna da tela.

## MVP sugerido

Fase 1:

- Android primeiro
- Appium 2 + UiAutomator2
- device fisico via USB e/ou emulador
- MCP Mobile minimo
- `/explorar-mobile-web`
- `/explorar-mobile-apk`
- `/testar-modulo-mobile-web`
- `/testar-modulo-mobile-apk`
- screenshots, video e logs basicos

Fase 2:

- `/gerar-cenarios-mobile-web`
- `/gerar-cenarios-mobile-apk`
- mapa de telas mais completo
- regras para riscos mobile
- primeiras planilhas mobile

Fase 3:

- `/executar-planilha-mobile-web`
- `/executar-planilha-mobile-apk`
- suporte robusto a multiplos devices
- relatorio consolidado por device
- execucao em lote

Fase 4:

- iOS com XCUITest
- normalizacao de artefatos Android/iOS
- comparativos entre plataformas

## Observacao sobre Core

Como a camada Appium/MCP deve ser acessivel pelo Comercial e pelo Producao, a logica reutilizavel deve ir para o repositorio `BKPilot-Core`, com nova tag publicada. Este repositorio deve manter apenas skills, regras operacionais e integracoes especificas de Producao.
