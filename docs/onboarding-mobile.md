# Onboarding Mobile

Objetivo: configurar um cliente novo para executar smoke mobile em ate 30 minutos quando ADB/Appium ou farm ja estiverem disponiveis.

## 1. Criar Cliente

```bash
./novo-cliente.sh <id> --nome "Nome do Cliente" --url https://app.cliente.com
```

O script cria `clients/<id>/config.json` com bloco `mobile` completo.

Para app nativo Android:

```bash
./novo-cliente.sh <id> --nome "Nome do Cliente" --url https://app.cliente.com --target apk
```

Troque `clients/<id>/fixtures/app-placeholder.apk` pelo APK real antes de executar smoke.

## 2. Configurar Segredos

Edite `clients/<id>/.env`.

Para USB local:

```env
APPIUM_URL=http://localhost:4723
QA_PASSWORD=preencher-localmente
```

Para farm cloud:

```env
MOBILE_FARM_USERNAME=preencher-localmente
MOBILE_FARM_ACCESS_KEY=preencher-localmente
QA_PASSWORD=preencher-localmente
```

Nunca commite `.env`.

## 3. Ajustar Contrato Mobile

Campos obrigatorios em `clients/<id>/config.json`:

- `mobile.provider`: `local`, `cloud`, `saucelabs` ou `farm-propria`
- `mobile.target`: `web` ou `apk`
- `mobile.appiumUrl`
- `mobile.baseUrl`
- `mobile.capabilities`
- `mobile.allowedUrls`
- `mobile.allowedAppPackages`
- `mobile.timeouts`
- `mobile.retry`
- `mobile.limits`
- `mobile.evidence`
- `mobile.redaction`
- `mobile.allowedAppiumHosts`

Para web mobile, mantenha `allowedUrls` com a URL base do cliente. Para APK, preencha `allowedAppPackages`.

## Seguranca, Redaction e Retencao

- Clientes reais devem configurar `mobile.redaction.screenshotFields` com bounding boxes das areas sensiveis. Sem isso, a sessao aborta com `SCREENSHOT_REDACTION_NOT_CONFIGURED`.
- `mobile.redaction.allowEmptyScreenshotFields: true` e excecao auditavel. Use apenas quando nao houver PII visual na tela validada.
- Clientes smoke podem usar bypass auditavel com `SMOKE_REDACTION_BYPASS`.
- `appiumUrl` remoto deve usar HTTPS. HTTP e permitido somente em loopback (`localhost`, `127.0.0.1`, `::1`).
- Credenciais em URL (`user:pass@host`) sao bloqueadas; use `.env` e `env:MOBILE_FARM_USERNAME` / `env:MOBILE_FARM_ACCESS_KEY`.
- Use `mobile.allowedAppiumHosts` para liberar farms internas ou grids privados fora dos hosts padrao.
- Retencao de evidencias: `mobile.evidence.retentionDays` e executado por `npm run mobile:purge -- --cliente <id>` ou opcionalmente por `npm run mobile:smoke -- --cliente <id> --purge`.

## 3.1. APK Android

O bloco APK fica em `mobile.apk`:

```json
{
  "app": "clients/<id>/fixtures/app.apk",
  "appPackage": "com.cliente.app",
  "appActivity": ".MainActivity",
  "uploadStrategy": "auto",
  "storageFilename": "",
  "version": "v1",
  "noReset": true,
  "fullReset": false
}
```

Regras operacionais:

- `mobile.allowedAppPackages` e obrigatorio para cliente real. Somente `local-apk-smoke` e `sauce-apk-smoke` podem usar bypass, com log `WHITELIST_BYPASS_SMOKE`.
- `uploadStrategy` padrao e `auto`; `preuploaded` e opt-in e exige `storageFilename`.
- Para Sauce Labs, o upload automatico gera nome com cliente, versao e timestamp para evitar sobrescrita.
- `noReset` padrao e `true`; use `fullReset: true` apenas quando o cenario exigir app limpo.
- APK acima de 100MB gera alerta no doctor; acima de 500MB aborta com `APK_TOO_LARGE`.
- APK por URL HTTPS e baixado com cache por execucao para nao repetir download em multiplos cenarios.

## 4. Validar Prerequisitos

```bash
npm run mobile:doctor -- --cliente <id>
```

O doctor valida schema, ADB/device local quando provider e local, Appium `/status`, credenciais cloud e capabilities minimas. Credenciais sao mascaradas no output.

## 5. Rodar Primeiro Smoke

USB local:

```bash
npm.cmd run mobile:smoke -- --cliente <id> --target web
```

APK local:

```bash
npm.cmd run mobile:smoke -- --cliente <id> --target apk
```

Farm cloud:

```bash
npm.cmd run mobile:smoke -- --cliente <id> --target web
```

APK Sauce Labs:

```bash
npm.cmd run mobile:smoke -- --cliente <id> --target apk
```

## 6. Gerar Relatorio Final

```bash
npm run mobile:report -- --cliente <id> --target hybrid
```

Saidas:

- `clients/<id>/resultado/<ts>/relatorio_final.md`
- `clients/<id>/resultado/<ts>/relatorio_final.pdf`
- `clients/<id>/resultado/<ts>/demo_summary.json`

## Troubleshooting

- `adb_available failed`: instale Android Platform Tools e coloque `adb` no PATH.
- `appium_status failed`: suba `appium --port 4723` ou corrija `APPIUM_URL`.
- `mobile_config_schema failed`: corrija o campo indicado pelo doctor.
- `APP_PACKAGE_NOT_ALLOWED`: inclua o pacote real em `mobile.allowedAppPackages` ou corrija `mobile.apk.appPackage`.
- `APK_UPLOAD_FAILED`: verifique credenciais Sauce e `mobile.timeouts.uploadApk`; a sessao Appium nao e criada apos falha de upload.
- `APK_FILE_NOT_FOUND`: corrija `mobile.apk.app` ou substitua o placeholder por um APK real.
- `UNSAFE_REDACTION_DISABLE`: remova `disableCategories` ou adicione `allowUnsafeDisable: true` conscientemente.
