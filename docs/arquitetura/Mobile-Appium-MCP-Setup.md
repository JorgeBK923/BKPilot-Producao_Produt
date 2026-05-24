# Mobile Appium MCP - Setup MVP

## Status

Implementacao MVP local em:

```text
scripts/mobile-mcp-server.js
```

O servidor MCP expoe ferramentas para automacao mobile via Appium:

- `mobile.startSession`
- `mobile.getState`
- `mobile.tap`
- `mobile.type`
- `mobile.swipe`
- `mobile.back`
- `mobile.waitFor`
- `mobile.captureEvidence`
- `mobile.endSession`

No Claude Code, o MCP esta registrado em `.claude/settings.json` com o servidor `mobile`.

## Escopo do MVP

- Android primeiro.
- Appium Server externo.
- Appium remoto/cloud farm compativel com WebDriver/Appium.
- Driver Appium `uiautomator2`.
- Web mobile em Chrome real do Android.
- APK/app nativo via `app`, `appPackage`/`appActivity` ou app ja instalado.
- Evidencias dentro de `clients/<id>/resultado/<timestamp>/`.
- Config amigavel do BKPilot convertida internamente para capabilities Appium W3C com prefixo `appium:`.
- `udid` e o campo principal para device Android fisico.

## Contrato forte do `mobile.getState`

`mobile.getState` e a ferramenta mais importante da camada mobile. Ela deve retornar estado estruturado e evidencias, nao apenas screenshot.

Formato alvo:

```json
{
  "sessionId": "abc123",
  "target": "mobile-web",
  "provider": "local",
  "platform": "Android",
  "udid": "R58N123ABC",
  "context": "CHROMIUM",
  "contexts": ["NATIVE_APP", "CHROMIUM"],
  "url": "https://app.cliente.com/login",
  "activity": "com.android.chrome.Main",
  "orientation": "PORTRAIT",
  "screenName": "Login",
  "elements": [
    {
      "elementId": "source-0",
      "resourceId": "email_input",
      "text": "",
      "contentDesc": "",
      "className": "android.widget.EditText",
      "clickable": true,
      "enabled": true,
      "visible": true,
      "bounds": [32, 220, 690, 280],
      "locatorCandidates": [
        {
          "type": "id",
          "value": "email_input",
          "confidence": 0.95
        }
      ]
    }
  ],
  "evidence": {
    "screenshot": "clients/acme/resultado/.../screenshots/login.png",
    "source": "clients/acme/resultado/.../mobile/sources/login.xml"
  },
  "rawPath": "clients/acme/resultado/.../mobile/states/login.json"
}
```

A imagem ajuda a IA a entender visualmente a tela, mas a base confiavel para automacao deve ser a arvore de elementos do Appium.

Por padrao, `mobile.getState` retorna uma versao compacta:

- elementos visiveis, habilitados, clicaveis ou com bons seletores;
- ordenacao por relevancia;
- limite top-K, padrao 30;
- XML completo salvo em `mobile/sources/`;
- estado completo salvo em `mobile/states/`.

Use `includeAll: true` somente para diagnostico pontual, porque telas grandes podem gerar payload caro para a IA.

## Config amigavel x capabilities reais

O QA pode configurar de forma simples:

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

O MCP converte internamente para capabilities Appium modernas:

```json
{
  "platformName": "Android",
  "browserName": "Chrome",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "R58N123ABC"
}
```

Para APK:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "R58N123ABC",
  "appium:app": "clients/acme/app/app-release.apk"
}
```

`deviceName` fica como campo opcional/descritivo. Para Android fisico, preferir `udid`, que deve vir de `adb devices`.

## Niveis de execucao

Toda sessao mobile deve ter um modo:

| Modo | Descricao | Uso |
|---|---|---|
| `observe` | Apenas le estado e captura evidencia. Bloqueia tap/type/swipe/back. | smoke e diagnostico |
| `explore` | Navega e interage, mas bloqueia acoes destrutivas sem confirmacao. | `/explorar-mobile-*` |
| `execute` | Executa roteiro definido com maior permissao operacional. | `/testar-modulo-mobile-*` e `/executar-planilha-mobile-*` |

Exemplos:

```bash
/explorar-mobile-web --cliente acme --mode explore
/testar-modulo-mobile-apk --cliente acme --mode execute
```

## Device Manager

Para Android local/USB, o Device Manager deve:

- listar devices conectados via `adb devices`;
- identificar Android fisico ou emulador;
- validar se o device esta autorizado;
- impedir execucao se houver multiplos devices sem selecao explicita;
- validar bateria minima;
- validar tela acordada/desbloqueada quando possivel;
- validar Chrome instalado para mobile web;
- deixar a criacao de sessao Appium como validacao final.

Para device farm online, nao ha `adb devices` local. A validacao do device acontece por capabilities, credenciais e criacao de sessao remota.

## Evidence Manager

Os artefatos historicos continuam no padrao BKPilot:

```text
clients/<id>/resultado/<timestamp>/screenshots/
clients/<id>/resultado/<timestamp>/videos/
```

A camada mobile tambem cria uma estrutura especifica:

```text
clients/<id>/resultado/<timestamp>/mobile/
  screenshots/
  sources/
  logs/
  states/
  reports/
```

Artefatos previstos:

- screenshots;
- `page_source.xml`;
- `mobile_state.json`;
- `mobile_smoke_report.json`;
- logs Appium quando disponiveis;
- logcat/device logs quando disponiveis;
- `execution_summary.md` nas execucoes de skill.

## Seguranca operacional do MCP Mobile

O MCP Mobile executa acoes reais no device. Regras obrigatorias:

- abrir apenas URLs permitidas no config do cliente quando houver allowlist;
- abrir apenas `appPackage` permitido quando houver allowlist;
- default de web mobile sem `allowedUrls`: permitir com warning operacional;
- default de APK com `appPackage` sem `allowedAppPackages`: bloquear;
- senhas, tokens e access keys nao podem ser gravados em logs;
- capabilities e logs devem aplicar redaction para campos sensiveis;
- screenshots podem conter dados sensiveis e devem ficar isoladas em `clients/<id>/resultado/`;
- acoes destrutivas exigem `mode: execute` ou confirmacao explicita;
- toda execucao deve gerar sessionId, timestamp e trilha de auditoria;
- o MCP deve validar o cliente antes de iniciar sessao.

Exemplos de acoes destrutivas:

- excluir;
- enviar;
- aprovar;
- finalizar;
- cancelar;
- confirmar pagamento;
- alterar senha.

## Politica de dados sensiveis

- Nao registrar senha digitada.
- Nao registrar token.
- Nao registrar CPF/CNPJ completo quando detectado.
- Usar `mobile.sensitiveFields` para campos sensiveis especificos do cliente, por exemplo `["cpf", "cnpj", "email"]`.
- Separar evidencia tecnica de evidencia comercial.
- Evitar enviar APK para servicos externos sem autorizacao explicita do cliente.
- Device farm online so deve ser usado quando o cliente autorizar upload de APK e dados de teste fora do ambiente local.

## Pre-requisitos

```bash
npm install -g appium
appium driver install uiautomator2
```

Android Platform Tools precisa estar no `PATH`:

```bash
adb devices
```

Resultado esperado:

```text
List of devices attached
R58N123ABC device
```

Subir o Appium Server antes de usar as skills:

```bash
appium --base-path /
```

Por padrao o MCP usa:

```text
http://127.0.0.1:4723
```

Pode sobrescrever com:

```bash
set APPIUM_URL=http://127.0.0.1:4723
```

## Configuracao mobile web

Exemplo em `clients/<id>/config.json`:

```json
{
  "mobile": {
    "target": "web",
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "udid": "R58N123ABC",
    "browserName": "Chrome",
    "baseUrl": "https://app.cliente.com"
  }
}
```

Uso:

```bash
/explorar-mobile-web --cliente acme --device R58N123ABC
```

## Configuracao para device farm online

O MCP nao e acoplado a um fornecedor. Qualquer farm que exponha endpoint Appium/WebDriver remoto pode ser usado informando:

- `mobile.provider`
- `mobile.appiumUrl`
- `mobile.username`
- `mobile.accessKey`
- `mobile.capabilities`
- `mobile.options`

Credenciais devem vir de variaveis de ambiente. Use o prefixo `env:` no `config.json`.

Exemplo generico para web mobile:

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

Exemplo generico para APK/app em farm online:

```json
{
  "mobile": {
    "provider": "cloud",
    "target": "apk",
    "appiumUrl": "https://hub.exemplo-device-farm.com/wd/hub",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "app": "storage:app-release.apk",
    "capabilities": {
      "platformName": "Android",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": "Android Device"
    },
    "options": {
      "vendor:options": {
        "projectName": "BKPilot",
        "buildName": "mobile-apk-smoke"
      }
    }
  }
}
```

O nome do namespace em `options` deve seguir a documentacao do fornecedor. Exemplos comuns sao `sauce:options`, `bstack:options`, `lt:options` e `kobiton:options`.

Na Release Tecnica 0.1, device farm online e tratado como experimental ate passar smoke real em pelo menos um provider. A arquitetura aceita qualquer endpoint Appium/WebDriver remoto, mas suporte operacional por provider depende de validacao concreta.

## Upload automatico de APK para device farm

Para `mobile-apk` em device farm online, o BKPilot nao deve depender apenas de upload manual feito pelo operador no painel do fornecedor.

Decisao da Release Tecnica 0.1:

- aceitar app remoto ja existente, por exemplo `bs://...`, `storage:...`, `sauce-storage:...` ou identificador equivalente;
- aceitar APK local em `clients/<id>/app/` ou caminho informado na skill;
- quando `provider` for cloud e `app` apontar para arquivo local, o BKPilot deve fazer upload automatico antes de criar a sessao Appium;
- registrar o resultado do upload no relatorio da execucao;
- nunca fazer upload de APK para servico externo sem autorizacao explicita do cliente.

Exemplo com app remoto ja enviado:

```json
{
  "mobile": {
    "provider": "cloud",
    "target": "apk",
    "appiumUrl": "https://hub.exemplo-device-farm.com/wd/hub",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "app": "storage:app-release.apk"
  }
}
```

Exemplo com APK local e upload automatico:

```json
{
  "mobile": {
    "provider": "saucelabs",
    "target": "apk",
    "appiumUrl": "https://ondemand.us-west-1.saucelabs.com/wd/hub",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "app": "clients/acme/app/app-release.apk",
    "allowExternalUpload": true
  }
}
```

O upload de APK nao e padronizado pelo Appium. O Appium padroniza a criacao da sessao e a automacao, mas cada device farm tem sua propria API para upload de apps.

Portanto, a arquitetura deve ter um componente:

```text
Mobile Farm Upload Manager
  -> uploadApp(provider, apkPath, config)
  -> remoteAppId
```

Regras do Upload Manager:

- se `app` ja for referencia remota, nao fazer upload;
- se `app` for arquivo local e `provider` for cloud, exigir `allowExternalUpload: true`;
- validar existencia do APK local;
- calcular hash do APK para auditoria;
- enviar usando adaptador do provider;
- retornar `remoteAppId`;
- usar `remoteAppId` em `appium:app`;
- salvar `mobile/reports/mobile_upload_report.json`.

Formato minimo do relatorio:

```json
{
  "status": "passed",
  "provider": "saucelabs",
  "localApp": "clients/acme/app/app-release.apk",
  "sha256": "...",
  "remoteAppId": "storage:app-release.apk",
  "uploadedAt": "...",
  "expiresAt": null,
  "warnings": [],
  "errors": []
}
```

Escopo da Release Tecnica 0.1:

- implementar contrato generico do Upload Manager;
- implementar pelo menos um adaptador real de provider para validar o fluxo de ponta a ponta;
- para providers sem adaptador, falhar com erro claro pedindo `app` remoto ja existente.

Variaveis de ambiente esperadas:

```bash
set MOBILE_FARM_USERNAME=usuario
set MOBILE_FARM_ACCESS_KEY=chave
```

Tambem e possivel sobrescrever o endpoint por execucao:

```bash
set APPIUM_URL=https://hub.exemplo-device-farm.com/wd/hub
```

## Configuracao APK

Por APK:

```json
{
  "mobile": {
    "target": "apk",
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "udid": "R58N123ABC",
    "app": "clients/acme/app/app-release.apk"
  }
}
```

Por app instalado:

```json
{
  "mobile": {
    "target": "apk",
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "udid": "R58N123ABC",
    "appPackage": "com.cliente.app",
    "appActivity": ".MainActivity"
  }
}
```

Uso:

```bash
/explorar-mobile-apk --cliente acme --device R58N123ABC
```

## Teste tecnico do MCP

Para validar que o servidor MCP lista tools sem abrir Appium:

```bash
npm run mobile:mcp
```

Esse comando inicia o servidor por stdio e fica aguardando um cliente MCP. A validacao completa acontece pelo Claude/Codex/OpenCode ou por um cliente MCP.

## Smoke test antes das skills

Antes de gastar minutos em um device farm ou rodar uma skill completa, valide uma sessao curta:

```bash
npm run mobile:smoke -- --cliente acme --target web
```

Para APK:

```bash
npm run mobile:smoke -- --cliente acme --target apk --app clients/acme/app/app-release.apk
```

O smoke:

- le `clients/<id>/config.json`;
- valida `/status` do Appium;
- valida device local via Device Manager quando `provider` e `local`;
- abre uma sessao Appium local ou remota;
- navega para `mobile.baseUrl` quando `target` e `web`;
- rejeita falso positivo de tela vazia (`about:blank`, source sem elementos, app preso no launcher);
- captura screenshot;
- salva estado bruto;
- encerra a sessao;
- gera `clients/<id>/resultado/<timestamp>/mobile/reports/mobile_smoke_report.json`.

Smoke aprovado quando:

- Appium responde em `/status`;
- device aparece em `adb devices`, quando local;
- sessao e criada;
- contexto ou URL/app e identificado;
- screenshot e salvo;
- source/estado bruto e salvo;
- sessao e encerrada;
- relatorio final e gerado.

Formato resumido do relatorio:

```json
{
  "status": "passed",
  "clientId": "acme",
  "target": "web",
  "device": "R58N123ABC",
  "startedAt": "...",
  "finishedAt": "...",
  "durationSeconds": 34,
  "artifacts": {
    "screenshot": "...",
    "state": "...",
    "source": "...",
    "appiumLog": "..."
  },
  "checks": [],
  "warnings": [],
  "errors": []
}
```

Se falhar, gera relatorio em `clients/<id>/resultado/<timestamp>/` quando a sessao chegou a criar pasta, ou em `clients/<id>/resultado/mobile_smoke_failed/`.

## Matriz de compatibilidade da Release Tecnica 0.1

| Alvo | Android fisico | Android emulador | Device farm | iOS |
|---|---|---|---|---|
| Mobile web | Suportado | Suportado com ressalvas | Experimental | Fora |
| APK instalado | Suportado | Suportado com ressalvas | Experimental | Fora |
| Execucao por planilha | Contrato criado | Contrato criado | Contrato criado | Fora |
| Video | Best-effort | Best-effort | Depende do provider | Fora |

Video nao e evidencia obrigatoria na Release Tecnica 0.1. Evidencia obrigatoria: screenshot, source XML e state JSON. Video entra como best-effort quando o device/provider disponibilizar sem comprometer a execucao.

## Skill Runner e MCP Mobile

As skills mobile nao criam um runner paralelo. Elas continuam sendo skills `.md` mantidas em `src/` e distribuidas pelo conversor para Claude, Codex e OpenCode.

O Skill Runner/orquestrador nao muda de natureza. O que muda por skill e o conjunto de tools disponiveis na sessao:

- skills web atuais usam Playwright MCP;
- skills mobile usam Mobile/Appium MCP;
- skills puramente documentais continuam sem executor de browser/device.

Assim, mobile-web e mobile-apk entram no mesmo modelo operacional do BKPilot, sem criar um segundo universo de execucao.

## Criterios de aceite da Release Tecnica 0.1

A release sera considerada aceita quando:

1. O MCP Mobile for carregado pela CLI e listar suas tools.
2. O smoke mobile web criar sessao, abrir URL real, coletar estado estruturado e salvar screenshot/source/state.
3. O smoke APK/app criar sessao, coletar estado estruturado e salvar screenshot/source/state.
4. O relatorio de smoke for gerado com checks, warnings, errors, duracao e artefatos.
5. Os bloqueios de modo/allowlist impedirem pelo menos uma acao indevida em teste controlado.
6. O fluxo web atual do BKPilot continuar funcionando sem regressao.

## Observacoes

- O servidor nao instala Appium nem drivers automaticamente.
- O Appium precisa estar rodando antes de `mobile.startSession`.
- Video e best-effort na Release Tecnica 0.1; o MVP prioriza screenshots, source XML e estado bruto.
- A logica e candidata a migrar para `@bugkillers/bkpilot-core` quando estabilizar, porque Comercial e Producao devem compartilhar a camada.
