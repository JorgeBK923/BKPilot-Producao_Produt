# Guia Mobile QA v2 — Possibilidades Expandidas

**Projeto:** BKPilot — BugKillers QA Automation Platform
**Data:** 2026-05-07
**Versão:** 2.0 (consolida v1 + análise de lacunas)

---

## Sumário Executivo

Este documento consolida as possibilidades para evoluir o BKPilot com testes mobile. A versão 2.0 expande o guia original incorporando lacunas técnicas identificadas, novos tipos de teste, possibilidades estratégicas, e diferenciais habilitados por IA.

A trilha original Fase 1 → 4 (mobile web → Android físico → farm → iOS) é mantida como espinha dorsal, mas refinada com fases intermediárias (1.5 e 2.5) e skills premium (segurança, performance profunda, exploração autônoma).

### Tabela-resumo dos caminhos técnicos

| Alvo | Ferramenta principal | Complexidade | Recomendação |
|---|---|---|---|
| Mobile web/PWA em viewport de celular | Playwright | Baixa | Fase 1 |
| Android Emulator (AVD) | Appium + AVD | Baixa/Média | Fase 1.5 |
| Chrome real em Android físico | Appium + ADB | Média | Fase 2 |
| App Android nativo instalado | Appium + ADB | Média/Alta | Fase 2 |
| App híbrido / React Native / Flutter | Appium (driver específico) ou Maestro | Média/Alta | Fase 2 |
| Visual regression mobile | Percy / pixelmatch | Média | Fase 2.5 |
| Performance deep + Security | adb dumpsys + MobSF + Frida | Alta | Fase 2.5 / 3.5 |
| Farm de aparelhos Android local | Appium Grid + ADB | Alta | Fase 3 |
| Farm cloud (BrowserStack, AWS) | Provedor SaaS | Média | Fase 4 |
| iPhone físico / app iOS | Appium + XCUITest + macOS | Alta | Fase 5 |

### Regra prática

```text
Se abre por URL no navegador: Playwright.
Se é app instalado no celular: Appium/ADB (ou Maestro).
Se precisa múltiplos aparelhos reais: farm Android.
Se é app iOS: macOS + Xcode + Appium.
```

---

# Parte I — Base Original (v1 Refinada)

## 1. Mobile Web com Playwright

### Para que serve

Testar sistemas web, sites, dashboards, SaaS, portais e PWAs em contexto mobile, sem precisar de aparelho físico.

Exemplos:

```text
https://app.cliente.com
https://portal.cliente.com
PWA aberta em navegador
sistema responsivo
```

### O que cobre bem

- Layout responsivo
- Menus mobile
- Formulários
- Login
- Fluxos de negócio em tela pequena
- Simulação de dispositivos como iPhone, Pixel, Galaxy e iPad
- `tap`, `swipe`, viewport, orientação e throttle de rede
- Captura de console e rede
- Screenshots e vídeos
- Acessibilidade e performance web

### O que não cobre bem

- App nativo instalado por APK
- Permissões reais de sistema operacional
- Push notification real
- Biometria real
- Câmera real
- Comportamentos específicos de fabricante Android

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

Esse é o caminho mais simples porque reaproveita:

- Playwright MCP
- Scripts Node em `cenarios/`
- Regras de evidência visual
- `console_log.json`
- `network_log.json`
- `cleanup_log.json`
- Estrutura `clients/<id>/resultado/<timestamp>/`
- Relatórios `.md` e `.pdf`

### MVP recomendado

```text
/mobile-web-testar-modulo
```

Parâmetros esperados:

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

---

## 2. Android Físico Individual

### Para que serve

Testar em um celular Android real conectado por USB, tanto app nativo quanto Chrome real/WebView.

### Ferramentas

```text
ADB
Appium
UiAutomator2 driver
Android Platform Tools
```

### Pré-requisitos no aparelho

- Android com opções de desenvolvedor ativadas
- Depuração USB ativada
- Autorização do computador no aparelho
- Cabo USB confiável
- Aparelho visível em `adb devices`

### O que cobre

- App instalado por APK
- App já instalado no aparelho
- Chrome real no aparelho
- WebView, quando exposta ao Appium
- Taps, swipes, long press
- Rotação de tela
- Permissões Android
- Screenshots
- Vídeo (dependendo da estratégia)
- Logs via `adb logcat`
- Crash detection básico

### Skills sugeridas

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
/mobile-android-crash-check
/mobile-android-performance
```

### Exemplo de uso esperado

App nativo:

```text
/mobile-android-fisico --client tega --apk clients/tega/mobile/apps/app-debug.apk --udid <udid> --fluxo login
```

Chrome real:

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

---

## 3. Farm de Aparelhos Android

### Para que serve

Executar testes em vários aparelhos Android reais, cobrindo combinações de fabricante, versão Android, resolução e desempenho.

### Valor prático

Uma farm Android captura problemas que emulador e viewport simulada geralmente não pegam:

- Teclado real
- Permissões reais
- WebView do fabricante
- Lentidão de aparelho de entrada
- Layout em telas incomuns
- Customizações Samsung, Motorola, Xiaomi etc.
- Falhas específicas de versão Android
- Comportamento real de arquivos, câmera e notificações

### Tipos de farm

#### Farm local

```text
Servidor Windows/Linux
vários Androids via USB
ADB
Appium server por aparelho ou Appium Grid
```

**Vantagens:**
- Controle total dos aparelhos
- Bom para clientes com apps internos
- Sem upload de APK para terceiros

**Desvantagens:**
- Manutenção física
- Cabos, bateria, travamentos e disponibilidade
- Escalabilidade limitada

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

**Vantagens:**
- Grande variedade de aparelhos
- Menos manutenção local
- Melhor escala

**Desvantagens:**
- Custo recorrente
- Regras de segurança para APKs e dados
- Integração específica por provedor

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

```text
/mobile-android-farm-check
```

Responsabilidades:

- Listar aparelhos conectados
- Validar `adb devices`
- Validar versão Android
- Validar Appium
- Tirar screenshot de cada aparelho
- Coletar `adb shell getprop`
- Salvar relatório por aparelho

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

---

## 4. iPhone Físico e iOS

### Possível, mas não recomendado como primeira fase

Testes em iPhone físico exigem mais infraestrutura:

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

- Cliente tem app iOS nativo
- Fluxos iOS são críticos
- Existe Mac dedicado para automação
- Existe política clara de certificados e provisioning

### Skills futuras

```text
/mobile-ios-check
/mobile-ios-fisico
/mobile-ios-regressao
```

---

# Parte II — Expansões e Lacunas Cobertas

## 5. Camadas Intermediárias Esquecidas na v1

### 5.1. Emuladores Android e Simuladores iOS

A v1 saltou de "viewport simulada" para "aparelho real". Existe uma camada intermediária crucial:

| Ambiente | Custo | Cobertura | Uso ideal |
|---|---|---|---|
| Android Emulator (AVD) | Zero | Alta para app nativo | CI/CD, regressão automatizada |
| Genymotion | Médio | Alta + snapshots | Equipes maiores, paralelização |
| iOS Simulator | Zero (requer Mac) | Boa para fluxos | Fluxos iOS sem hardware |

**Por que importa:** Permite uma **Fase 1.5** entre mobile web e Android físico, viabilizando automação de app nativo em CI antes de investir em farm.

**Skills sugeridas:**

```text
/mobile-android-emulator-check
/mobile-android-emulator-testar-modulo
/mobile-ios-simulator-testar-modulo
```

### 5.2. WebView Híbrido e Frameworks Cross-Platform

A v1 mencionou WebView de passagem. Categorias importantes:

- **Apps híbridos (Cordova, Ionic, Capacitor)** — exigem alternar contextos `NATIVE_APP` ↔ `WEBVIEW` no Appium
- **React Native** — particularidades de inspeção (testID, accessibility labels)
- **Flutter** — exige driver específico (`flutter_driver` ou Appium Flutter Driver)
- **PWAs instaladas** (Add to Home Screen) — comportamento diferente da PWA aberta no navegador

Boa parte dos apps no mercado brasileiro são híbridos ou React Native. Sem prever isso, o BKPilot fica limitado a apps 100% nativos.

### 5.3. Deep Links e Universal Links

Não previsto na v1:

- Testes de deep links (`app://rota/recurso`)
- Universal Links (iOS) e App Links (Android)
- Fluxos de entrada via push notification ou QR Code

**Skill sugerida:**

```text
/mobile-deeplink-validar
```

---

## 6. Tipos de Teste Não Cobertos na v1

### 6.1. Performance Mobile Específica

A v1 cita "performance" de forma genérica. Métricas mobile-específicas:

| Métrica | Ferramenta |
|---|---|
| Tempo de cold start / warm start | `adb shell am start -W` |
| Consumo de bateria | `adb shell dumpsys batterystats` |
| Memória (PSS, RSS) | `adb shell dumpsys meminfo` |
| FPS e jank | `adb shell dumpsys gfxinfo` |
| Tamanho do APK e startup time | Android Profiler / Firebase Performance |
| Frame drops e tracing | systrace / Perfetto |

**Skill sugerida:**

```text
/mobile-android-performance-deep
```

### 6.2. Segurança Mobile (OWASP MASVS)

Área completamente ausente da v1, com altíssimo valor comercial:

- Análise estática do APK (MobSF, apkleaks)
- Verificação de armazenamento inseguro (SharedPreferences, SQLite sem criptografia)
- SSL Pinning bypass detection
- Permissões excessivas no Manifest
- Hardcoded secrets/tokens no APK
- Root detection / jailbreak detection
- Frida / Objection para runtime analysis

**Conexão estratégica:** liga diretamente com a discussão de skill de pentest já explorada no portfólio. Mobile security é nicho premium com pouca concorrência local.

**Skills sugeridas:**

```text
/mobile-android-security-static
/mobile-android-security-runtime
```

### 6.3. Acessibilidade Mobile Específica

A v1 menciona acessibilidade web, mas mobile tem ferramentas próprias:

- **Android:** Accessibility Scanner, TalkBack, espresso-accessibility
- **iOS:** Accessibility Inspector, VoiceOver
- **WCAG Mobile** + critérios específicos do Google Play e App Store

### 6.4. Testes de Localização e Sensores

Apps mobile dependem fortemente de:

- GPS / mock locations (`adb emu geo fix`)
- Acelerômetro / giroscópio
- Câmera (mock images)
- Microfone
- NFC / Bluetooth
- Conectividade (modo avião, dual SIM)

Appium suporta mock de muitos desses, mas não está no escopo atual.

### 6.5. Testes de Atualização e Migração

Cenários frequentemente esquecidos:

- Upgrade de versão N → N+1 com dados existentes
- Downgrade
- Migração de schema de banco local
- Comportamento após `clearData` vs primeira instalação
- Restauração via backup do Google/iCloud

---

## 7. Possibilidades Estratégicas / Comerciais

### 7.1. Visual Regression Mobile

Aproveitando o que o BKPilot já faz bem (evidências visuais):

- **Percy / Chromatic / Applitools** — diff visual automático
- **Resemble.js / pixelmatch** — alternativas open source
- Baseline por dispositivo + orientação

**Diferencial:** Detecta quebras visuais em diferentes resoluções automaticamente — exatamente o ponto fraco da farm Android.

### 7.2. Testes de Loja (Store Compliance)

Pré-publicação em Google Play / App Store:

- Validação de metadados (descrição, screenshots, ícones)
- Política de privacidade
- Permissões justificadas
- Conteúdo etário (rating)
- App Bundle vs APK
- 64-bit compliance

### 7.3. Beta Testing Orquestrado

Skills para gerenciar:

- Distribuição via Firebase App Distribution / TestFlight
- Coleta de feedback estruturado de beta testers
- Análise de crashes via Crashlytics/Sentry
- Relatórios consolidados de campanha de beta

### 7.4. Monitoramento Sintético Mobile

Não é teste tradicional, mas é venda recorrente:

- Execução agendada de fluxos críticos em produção
- Alertas quando login/checkout/etc. falham
- Dashboard de uptime funcional do app

---

## 8. Lacunas de Arquitetura / Operação

### 8.1. Estratégia de Dados de Teste

A v1 não toca em:

- Como popular dados em apps com backend compartilhado
- Reset de estado entre execuções
- Contas de teste vs contas reais
- Mock de APIs (MockServer, WireMock)
- Stub de serviços externos

### 8.2. Gravação e Replay de Sessões

- Appium Inspector para identificar elementos
- **Maestro** (alternativa moderna ao Appium, declarativa em YAML)
- Gravação de fluxos por demonstração

**Recomendação:** avaliar Maestro como alternativa ao Appium para skills mais simples — sintaxe muito mais limpa, baixa curva de aprendizado, manutenção significativamente menor.

### 8.3. CI/CD Mobile

A v1 não definiu:

- Como rodar `/mobile-android-*` em pipeline
- Custo de manter runner com aparelho conectado
- Estratégia de paralelização (1 aparelho = 1 runner?)
- Quarentena de testes flakey (mobile é notoriamente instável)

### 8.4. Observabilidade da Própria Farm

Quando há 10 aparelhos rodando, é necessário monitorar:

- Saúde de cada device (bateria, temperatura, espaço em disco)
- Reset automático após N execuções
- Detecção de aparelho "fantasma" no `adb`
- Alertas de aparelho offline

**Skill sugerida:**

```text
/mobile-android-farm-health
```

---

## 9. Diferenciais Habilitados por IA

Aqui o BKPilot pode se diferenciar de qualquer farm tradicional. Esta é a camada onde a stack atual (Claude + skills) agrega valor que ferramentas convencionais não entregam.

### 9.1. Exploração Autônoma com LLM

Em vez de scripts fixos, o agente:

1. Recebe o APK + descrição do app
2. Explora a UI autonomamente via Appium
3. Identifica fluxos críticos
4. Gera cenários de teste a partir do que viu
5. Executa regressão sem cenários pré-escritos

Isso é **monkey testing inteligente** — algo que ferramentas tradicionais não fazem bem.

### 9.2. Bug Triagem Automática

- Captura de crash + logcat + screenshot
- LLM classifica severidade, módulo afetado, similaridade com bugs conhecidos
- Geração automática de bug card no formato BKPilot

### 9.3. Geração de Cenários a partir de Tela

- Screenshot da tela → LLM identifica componentes → gera cenários BDD
- Conecta com a skill `/gerar-cenarios` existente

---

# Parte III — Governança e Roadmap

## 10. Ajuste Necessário nas Regras do Projeto

Hoje as regras do projeto dizem que automação de browser deve usar Playwright MCP e proíbe Selenium/Cypress. Para mobile nativo, é necessário adicionar uma exceção controlada.

Texto recomendado para `AGENTS.md` e `CLAUDE.md`:

```text
## Mobile Native Automation

For mobile web and browser-based tests, Playwright MCP remains mandatory.
For native Android/iOS mobile skills only, Appium and platform tools are allowed:
- Android: Appium + ADB + UiAutomator2 (or Maestro for declarative flows)
- iOS: Appium + XCUITest + WebDriverAgent

This exception applies only to skills prefixed with /mobile-android-* or /mobile-ios-*.
Selenium and Cypress remain prohibited for web QA.
Credentials, tokens and client secrets must continue to follow the existing multi-tenant .env rules.
```

---

## 11. Segurança e Evidências

As regras atuais continuam valendo:

- Nunca passar senha inline
- `QA_PASSWORD` somente em `clients/<id>/.env`
- Tokens Jira/GitHub somente no `.env` raiz
- Nunca expor `.env`, tokens ou logs internos ao cliente
- Todos os artefatos devem ficar dentro de `clients/<id>/`
- Cada cenário/bug precisa de screenshot ou vídeo
- Falhas e inconclusivos devem documentar tentativas

Para Android nativo, adicionar:

- Nunca salvar APK confidencial fora de `clients/<id>/mobile/apps/`
- Sanitizar `logcat.txt` antes de entregar ao cliente
- Não publicar identificadores sensíveis do aparelho se o relatório for externo
- Separar relatório interno de governança do relatório do cliente

Para skills de segurança mobile (MASVS), adicionar:

- APKs descompilados nunca devem ser commitados
- Resultados de análise estática devem ser sanitizados (remoção de paths internos do build)
- Vulnerabilidades críticas devem seguir disclosure responsável antes de publicação

---

## 12. Roadmap Recomendado v2

### Fase 1 — Mobile Web

**Entregar:**

```text
/mobile-web-testar-modulo
/mobile-web-regressao
```

**Benefício:** Rápido de implementar, usa Playwright e regras atuais, cobre sistemas web responsivos e PWAs.

### Fase 1.5 — Android Emulator (NOVO)

**Entregar:**

```text
/mobile-android-emulator-check
/mobile-android-emulator-testar-modulo
```

**Benefício:** Viabiliza CI/CD de app nativo sem investir em hardware. Entre Playwright e farm física.

### Fase 2 — Android Físico

**Entregar:**

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
```

**Benefício:** Permite validar app nativo ou Chrome real em celular físico. Introduz Appium/ADB de forma controlada.

**Decisão paralela:** avaliar Maestro como alternativa ao Appium puro para skills mais simples.

### Fase 2.5 — Diferenciais Técnicos (NOVO)

**Entregar:**

```text
/mobile-visual-regression
/mobile-android-performance-deep
```

**Benefício:** Skills premium antes de escalar farm. Justifica preço maior por entrega.

### Fase 3 — Farm Android Local

**Entregar:**

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-relatorio
/mobile-android-farm-health
```

**Benefício:** Execução em vários aparelhos reais. Maior valor comercial para QA mobile. Base para regressão recorrente.

### Fase 3.5 — Security Mobile (NOVO)

**Entregar:**

```text
/mobile-android-security-static
/mobile-android-security-runtime
```

**Benefício:** Skill premium MASVS. Conecta com portfólio de pentest. Nicho com baixa concorrência local.

### Fase 4 — Farm Cloud

**Entregar:** integração com BrowserStack ou AWS Device Farm.

**Benefício:** Cobertura ampla sem manutenção física. Antes de iOS, vale escalar Android cloud.

### Fase 5 — iOS

Entregar somente se houver demanda real:

```text
/mobile-ios-check
/mobile-ios-fisico
/mobile-ios-simulator-testar-modulo
```

**Benefício:** Cobertura de app iOS. Exige ambiente macOS dedicado.

---

## 13. Decisão Recomendada

Começar por mobile web e preparar a arquitetura para Android, intercalando emulador antes de hardware físico.

Ordem sugerida:

```text
1. Criar regra formal para mobile native em AGENTS.md/CLAUDE.md
2. Criar /mobile-web-testar-modulo
3. Criar /mobile-android-emulator-check (entrada barata em mobile nativo)
4. Criar /mobile-android-check para validar ADB/Appium/aparelho físico
5. Criar /mobile-android-fisico
6. Avaliar Maestro vs Appium puro
7. Adicionar diferenciais (visual regression, performance deep)
8. Evoluir para /mobile-android-farm-check
9. Implementar farm e skills MASVS de segurança
10. Considerar farm cloud antes de iOS
```

Essa ordem reduz risco técnico, preserva as regras atuais do projeto e cria uma trilha comercial clara para QA mobile, com pontos de entrada premium ao longo do caminho.

---

## 14. Pontos para Decisão Comercial

Decisões que dependem de direção da liderança e devem ser formalizadas antes da Fase 2:

1. **Foco em apps internos de clientes vs apps de mercado?** Muda a necessidade de farm cloud.
2. **Vamos vender skill de segurança mobile (MASVS)?** Se sim, antecipar para Fase 2.5.
3. **Maestro vs Appium puro?** Maestro pode reduzir custo de manutenção significativamente.
4. **Aceitamos dependência de macOS para iOS?** Custo de hardware vs demanda real.
5. **Visual regression como produto separado ou bundled?** Pode ser SKU independente.

---

## Apêndice A — Stack Resumido por Fase

| Fase | Stack adicionado |
|---|---|
| 1 | Playwright (já existente) |
| 1.5 | Android SDK, AVD, Appium server, UiAutomator2 |
| 2 | ADB, aparelho físico Android, Appium Inspector, (opcional) Maestro |
| 2.5 | pixelmatch ou Percy, Perfetto, dumpsys parsers |
| 3 | Appium Grid, devices.json, monitoramento de farm |
| 3.5 | MobSF, Frida, Objection, apkleaks |
| 4 | SDK BrowserStack ou AWS Device Farm |
| 5 | macOS, Xcode, XCUITest, WebDriverAgent |

---

## Apêndice B — Glossário

- **ADB** — Android Debug Bridge. Ferramenta de linha de comando para interagir com dispositivos Android.
- **APK** — Android Package. Formato de instalação de apps Android.
- **AVD** — Android Virtual Device. Emulador Android oficial do Android Studio.
- **MASVS** — Mobile Application Security Verification Standard. Padrão OWASP de segurança mobile.
- **PWA** — Progressive Web App. Aplicação web que oferece experiência similar a app nativo.
- **UDID** — Unique Device Identifier. Identificador único de dispositivo.
- **WebView** — Componente que permite exibir conteúdo web dentro de um app nativo.
- **XCUITest** — Framework de testes UI da Apple para iOS.

---

*Documento gerado para discussão interna BugKillers. Versão 2.0 — Maio/2026.*
