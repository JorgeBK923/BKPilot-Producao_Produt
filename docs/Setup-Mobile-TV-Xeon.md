# Setup do Pilar mobile-tv — Ambiente de Desenvolvimento (Xeon)

Guia de preparacao da maquina de desenvolvimento/testes internos para rodar o pilar de testes Android TV do BKPilot. Host de referencia: Xeon E5-2690 v4, 48 GB RAM, Windows.

## 1. Estado do pilar

Codigo do pilar `mobile-tv` esta pronto no repositorio:

- `scripts/tv-doctor.js` — preflight do ambiente TV (`npm run tv:doctor`)
- `scripts/lib/mobile-tv-nav.js` — navegacao Leanback por D-pad
- `shared/blocks/leanback_nav.md`, `shared/blocks/tv_evidence.md` — blocos compartilhados
- Skills: `explorar-mobile-tv`, `gerar-cenarios-mobile-tv`, `testar-modulo-mobile-tv`, `executar-planilha-mobile-tv`, `gerar-relatorio-final-tv`
- Core: schema aceita `mobile.target: "tv"`

O que falta e ambiente de execucao na maquina e os dados do cliente.

## 2. Onde rodar

Nao e necessario mover a pasta do projeto fisicamente. Clonar o repositorio via git no Xeon e a forma recomendada — mantem dev e producao sincronizados.

```powershell
git clone <repo-url>
cd BKPilot
npm install
```

## 3. Checklist de prontidao

| Item | Como obter |
|---|---|
| Codigo do pilar mobile-tv | Ja no repositorio |
| Core com `target: tv` | Ja aplicado (ver secao 7) |
| Android SDK + emulator | Instalar (secao 4) |
| AVD Android TV | Criar (secao 4) |
| WHPX ativo | Ativar (secao 5) |
| Appium 2 + driver uiautomator2 | Instalar (secao 4) |
| `clients/<id>/` do cliente | Depende dos dados do cliente |
| APK do app TV | Fornecido pelo cliente |

## 4. Instalacao de software (uma vez por maquina)

```powershell
# Android SDK — via Android Studio ou cmdline-tools
sdkmanager "platform-tools" "emulator" "system-images;android-33;android-tv;x86_64"

# Criar AVD Android TV
avdmanager create avd -n bkpilot_tv -k "system-images;android-33;android-tv;x86_64" -d tv_1080p

# Appium 2 + driver Android
npm install -g appium
appium driver install uiautomator2
```

## 5. Virtualizacao (WHPX no Windows)

O emulador Android exige aceleracao de hardware. No Windows isso e o WHPX.

- Ativar em "Recursos do Windows": **Plataforma do Hipervisor do Windows**.
- Confirmar **VT-x** ligado na BIOS.
- Validar: `egrep -c '(vmx|svm)' /proc/cpuinfo` deve retornar valor maior que zero (ou `emulator -accel-check`).

## 6. Primeiro teste

```powershell
# terminal 1 — liga o emulador Android TV
emulator -avd bkpilot_tv

# terminal 2 — sobe o Appium
appium

# terminal 3 — preflight do ambiente (precisa de clients/<id>/config.json)
npm run tv:doctor -- --cliente <id>
```

`tv:doctor` exige `clients/<id>/config.json` com `mobile.target: "tv"`. Sem um cliente configurado, o preflight nao roda completo. Para validar apenas emulador + Appium + navegacao D-pad antes de ter o cliente real, criar um cliente de smoke minimo.

## 7. Suporte a target tv no Core

O schema que aceita `mobile.target: "tv"` esta no pacote `@bugkillers/bkpilot-core`, repositorio separado `github:JorgeBK923/BKPilot-Core`.

O suporte ja esta publicado:

- `v0.2.7` — adiciona `tv` ao schema, `normalizeTarget` e resolucao de APK.
- `v0.2.8` — estende a allowlist de `appPackage` ao target `tv`.

O `package.json` do BKPilot referencia `#v0.2.8`. Um `npm install` limpo em qualquer maquina ja traz o Core com suporte completo a `tv` — nenhuma acao manual necessaria.

## 8. Proximos passos

- Contratar VPS de producao com nested virtualization (ver `docs/Infraestrutura-Mobile-TV.md`).
- Criar `clients/vevatv/` quando o cliente entregar URL de homologacao, conta de teste e APK.
- Rodar `npm run tv:doctor -- --cliente vevatv` e iniciar o pipeline `explorar-mobile-tv` → `gerar-cenarios-mobile-tv` → `testar-modulo-mobile-tv` → `gerar-relatorio-final-tv`.
