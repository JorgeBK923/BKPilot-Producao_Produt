# Guia Mobile QA - Possibilidades

Data: 2026-05-07

Este documento consolida as possibilidades para evoluir o BKPilot com testes mobile. O objetivo e separar claramente o que pode ser feito com Playwright, o que exige Appium/ADB, e como uma farm de aparelhos Android entraria na arquitetura.

## Resumo Executivo

O projeto atual esta orientado a QA web com Claude Code, Codex/OpenCode como alternativas de agente, Playwright MCP, scripts Node e artefatos multi-tenant em `clients/<id>/`.

Para mobile, existem quatro caminhos:

| Alvo | Ferramenta principal | Complexidade | Recomendacao |
|---|---|---:|---|
| Mobile web/PWA em viewport de celular | Playwright | Baixa | Comecar aqui |
| Chrome real em Android fisico | Appium + ADB | Media | Fase 2 |
| App Android nativo instalado | Appium + ADB | Media/Alta | Fase 2 |
| Farm de aparelhos Android | Appium Grid/servidor + ADB | Alta | Fase 3 |
| iPhone fisico/app iOS | Appium + XCUITest + macOS/Xcode | Alta | Depois |

Regra pratica:

```text
Se abre por URL no navegador: Playwright.
Se e app instalado no celular: Appium/ADB.
Se precisa multiplos aparelhos reais: farm Android.
```

## 1. Mobile Web com Playwright

### Para que serve

Testar sistemas web, sites, dashboards, SaaS, portais e PWAs em contexto mobile, sem precisar de aparelho fisico.

Exemplos:

```text
https://app.cliente.com
https://portal.cliente.com
PWA aberta em navegador
sistema responsivo
```

### O que cobre bem

- Layout responsivo.
- Menus mobile.
- Formularios.
- Login.
- Fluxos de negocio em tela pequena.
- Simulacao de dispositivos como iPhone, Pixel, Galaxy e iPad.
- `tap`, `swipe`, viewport, orientacao e throttle de rede.
- Captura de console e rede.
- Screenshots e videos.
- Acessibilidade e performance web.

### O que nao cobre bem

- App nativo instalado por APK.
- Permissoes reais de sistema operacional.
- Push notification real.
- Biometria real.
- Camera real.
- Comportamentos especificos de fabricante Android.

### Skills sugeridas

```text
/mobile-web-explorar
/mobile-web-testar-modulo
/mobile-web-regressao
/mobile-web-usabilidade
/mobile-web-acessibilidade
/mobile-web-performance
```

### Encaixe no projeto atual

Esse e o caminho mais simples porque reaproveita:

- Playwright MCP.
- Scripts Node em `cenarios/`.
- Regras de evidencia visual.
- `console_log.json`.
- `network_log.json`.
- `cleanup_log.json`.
- Estrutura `clients/<id>/resultado/<timestamp>/`.
- Relatorios `.md` e `.pdf`.

### MVP recomendado

Criar primeiro:

```text
/mobile-web-testar-modulo
```

Parametros esperados:

```text
--client <id>
--device "iPhone 15"
--url <url opcional>
--orientacao portrait|landscape
--rede normal|3g|4g
```

Artefatos:

```text
clients/<id>/resultado/<timestamp>/mobile-web/
  console_log.json
  network_log.json
  screenshots/
  videos/
  mobile_web_summary.json
  relatorio_mobile_web_<timestamp>.md
```

## 2. Android Fisico Individual

### Para que serve

Testar em um celular Android real conectado por USB, tanto app nativo quanto Chrome real/WebView.

### Ferramentas

```text
ADB
Appium
UiAutomator2 driver
Android Platform Tools
```

### Pre-requisitos no aparelho

- Android com opcoes de desenvolvedor ativadas.
- Depuracao USB ativada.
- Autorizacao do computador no aparelho.
- Cabo USB confiavel.
- Aparelho visivel em `adb devices`.

### O que cobre

- App instalado por APK.
- App ja instalado no aparelho.
- Chrome real no aparelho.
- WebView, quando exposta ao Appium.
- Taps, swipes, long press.
- Rotacao de tela.
- Permissoes Android.
- Screenshots.
- Video, dependendo da estrategia.
- Logs via `adb logcat`.
- Crash detection basico.

### Skills sugeridas

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
/mobile-android-crash-check
/mobile-android-performance
```

### Exemplo de uso esperado

Para app nativo:

```text
/mobile-android-fisico --client tega --apk clients/tega/mobile/apps/app-debug.apk --udid <udid> --fluxo login
```

Para Chrome real:

```text
/mobile-android-fisico --client tega --browser chrome --url https://app.cliente.com --udid <udid>
```

### Artefatos sugeridos

```text
clients/<id>/resultado/<timestamp>/mobile-android/
  device_<udid>/
    screenshots/
    videos/
    logcat.txt
    appium_log.txt
    resultado.json
```

## 3. Farm de Aparelhos Android

### Para que serve

Executar testes em varios aparelhos Android reais, cobrindo combinacoes de fabricante, versao Android, resolucao e desempenho.

### Valor pratico

Uma farm Android captura problemas que emulador e viewport simulada geralmente nao pegam:

- Teclado real.
- Permissoes reais.
- WebView do fabricante.
- Lentidao de aparelho de entrada.
- Layout em telas incomuns.
- Customizacoes Samsung, Motorola, Xiaomi etc.
- Falhas especificas de versao Android.
- Comportamento real de arquivos, camera e notificacoes.

### Tipos de farm

#### Farm local

```text
Servidor Windows/Linux
varios Androids via USB
ADB
Appium server por aparelho ou Appium Grid
```

Vantagens:

- Controle total dos aparelhos.
- Bom para clientes com apps internos.
- Sem upload de APK para terceiros.

Desvantagens:

- Manutencao fisica.
- Cabos, bateria, travamentos e disponibilidade.
- Escalabilidade limitada.

#### Farm cloud

Exemplos:

```text
BrowserStack
Sauce Labs
LambdaTest
Kobiton
AWS Device Farm
Firebase Test Lab
```

Vantagens:

- Grande variedade de aparelhos.
- Menos manutencao local.
- Melhor escala.

Desvantagens:

- Custo recorrente.
- Regras de seguranca para APKs e dados.
- Integracao especifica por provedor.

### Skills sugeridas

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-regressao
/mobile-android-farm-crash-check
/mobile-android-farm-performance
/mobile-android-farm-relatorio
```

### MVP recomendado para farm

Comecar com:

```text
/mobile-android-farm-check
```

Responsabilidades:

- Listar aparelhos conectados.
- Validar `adb devices`.
- Validar versao Android.
- Validar Appium.
- Tirar screenshot de cada aparelho.
- Coletar `adb shell getprop`.
- Salvar relatorio por aparelho.

### Estrutura sugerida por cliente

```text
clients/<id>/
  mobile/
    devices.json
    appium.config.json
    apps/
      app-debug.apk
  resultado/<timestamp>/
    mobile-android-farm/
      device_<udid>/
        screenshots/
        videos/
        logcat.txt
        appium_log.txt
        resultado.json
      farm_summary.json
      relatorio_mobile_android_farm_<timestamp>.md
```

Exemplo de `devices.json`:

```json
[
  {
    "name": "Samsung A54",
    "udid": "R58XXXX",
    "platformVersion": "14",
    "type": "physical",
    "enabled": true
  },
  {
    "name": "Motorola G32",
    "udid": "ZY22XXXX",
    "platformVersion": "13",
    "type": "physical",
    "enabled": true
  }
]
```

## 4. iPhone Fisico e iOS

### Possivel, mas nao recomendado como primeira fase

Testes em iPhone fisico exigem mais infraestrutura:

```text
macOS
Xcode
Appium
XCUITest driver
WebDriverAgent
certificados Apple
Apple Developer account em alguns casos
```

### Quando faz sentido

- Cliente tem app iOS nativo.
- Fluxos iOS sao criticos.
- Existe Mac dedicado para automacao.
- Existe politica clara de certificados e provisioning.

### Skills futuras

```text
/mobile-ios-check
/mobile-ios-fisico
/mobile-ios-regressao
```

## 5. Ajuste Necessario nas Regras do Projeto

Hoje as regras do projeto dizem que automacao de browser deve usar Playwright MCP e proibe Selenium/Cypress. Para mobile nativo, e necessario adicionar uma excecao controlada.

Texto recomendado para `AGENTS.md` e `CLAUDE.md`:

```text
## Mobile Native Automation

For mobile web and browser-based tests, Playwright MCP remains mandatory.
For native Android/iOS mobile skills only, Appium and platform tools are allowed:
- Android: Appium + ADB + UiAutomator2
- iOS: Appium + XCUITest + WebDriverAgent

This exception applies only to skills prefixed with /mobile-android-* or /mobile-ios-*.
Selenium and Cypress remain prohibited for web QA.
Credentials, tokens and client secrets must continue to follow the existing multi-tenant .env rules.
```

## 6. Seguranca e Evidencias

As regras atuais continuam valendo:

- Nunca passar senha inline.
- `QA_PASSWORD` somente em `clients/<id>/.env`.
- Tokens Jira/GitHub somente no `.env` raiz.
- Nunca expor `.env`, tokens ou logs internos ao cliente.
- Todos os artefatos devem ficar dentro de `clients/<id>/`.
- Cada cenario/bug precisa de screenshot ou video.
- Falhas e inconclusivos devem documentar tentativas.

Para Android nativo, adicionar:

- Nunca salvar APK confidencial fora de `clients/<id>/mobile/apps/`.
- Sanitizar `logcat.txt` antes de entregar ao cliente.
- Nao publicar identificadores sensiveis do aparelho se o relatorio for externo.
- Separar relatorio interno de governanca do relatorio do cliente.

## 7. Roadmap Recomendado

### Fase 1 - Mobile Web

Entregar:

```text
/mobile-web-testar-modulo
/mobile-web-regressao
```

Beneficio:

- Rapido de implementar.
- Usa Playwright e regras atuais.
- Cobre sistemas web responsivos e PWAs.

### Fase 2 - Android Fisico

Entregar:

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
```

Beneficio:

- Permite validar app nativo ou Chrome real em celular fisico.
- Introduz Appium/ADB de forma controlada.

### Fase 3 - Farm Android

Entregar:

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-relatorio
```

Beneficio:

- Execucao em varios aparelhos reais.
- Maior valor comercial para QA mobile.
- Base para regressao recorrente.

### Fase 4 - iOS

Entregar somente se houver demanda real:

```text
/mobile-ios-check
/mobile-ios-fisico
```

Beneficio:

- Cobertura de app iOS.
- Exige ambiente macOS dedicado.

## 8. Decisao Recomendada

Comecar por mobile web e preparar a arquitetura para Android fisico/farm.

Ordem sugerida:

```text
1. Criar regra formal para mobile native em AGENTS.md/CLAUDE.md.
2. Criar /mobile-web-testar-modulo.
3. Criar /mobile-android-check para validar ADB/Appium/aparelho.
4. Criar /mobile-android-fisico.
5. Evoluir para /mobile-android-farm-check.
6. Depois criar execucao paralela em farm.
```

Essa ordem reduz risco tecnico, preserva as regras atuais do projeto e cria uma trilha comercial clara para QA mobile.
