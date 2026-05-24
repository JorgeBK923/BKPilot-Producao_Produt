# Guia Mobile QA v3 — Consolidação Técnica e Comercial

**Projeto:** BKPilot — BugKillers QA Automation Platform
**Data:** 2026-05-07
**Versão:** 3.0 (consolida v2 técnico + linhas de produto + diferencial via IA)

---

## Sumário Executivo

Esta versão consolida três níveis de análise em um único documento de produto:

1. **Trilha técnica** (Parte I) — fundação tecnológica: Playwright para web, Appium/ADB para nativo, farm Android, iOS. Reaproveita integralmente a v2.
2. **Linhas de produto** (Parte II) — empacotamento comercial: Release Gate, Evidence Pack, Matriz de Cobertura, SKUs vendáveis. Incorpora a melhor contribuição da análise externa.
3. **Diferencial via IA** (Parte III) — exploração autônoma, bug triagem inteligente, geração de cenários por tela. Camada que justifica a stack Claude + skills frente a ferramentas tradicionais.
4. **Roadmap unificado** (Parte IV) — sequência MVP otimizada para entrega rápida de valor.
5. **Governança** (Parte V) — regras, segurança, métodos de pontuação para Release Gate.

A trilha original Fase 1 → 5 é mantida como espinha dorsal, mas refinada com fases intermediárias e enriquecida com camadas de produto e IA que a tornam comercialmente diferenciada.

### Tabela-resumo dos caminhos técnicos

| Alvo | Ferramenta principal | Complexidade | Recomendação |
|---|---|---|---|
| Mobile web/PWA em viewport de celular | Playwright | Baixa | Fase 1 |
| Android Emulator (AVD) | Appium + AVD | Baixa/Média | Fase 1.5 |
| Chrome real em Android físico | Appium + ADB | Média | Fase 2 |
| App Android nativo instalado | Appium + ADB | Média/Alta | Fase 2 |
| App híbrido / React Native / Flutter | Appium (driver) ou Maestro | Média/Alta | Fase 2 |
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

# Parte I — Trilha Técnica

## 1. Mobile Web com Playwright

### Para que serve

Testar sistemas web, sites, dashboards, SaaS, portais e PWAs em contexto mobile, sem precisar de aparelho físico.

### O que cobre bem

- Layout responsivo
- Menus mobile, formulários, login, fluxos de negócio em tela pequena
- Simulação de dispositivos (iPhone, Pixel, Galaxy, iPad)
- `tap`, `swipe`, viewport, orientação e throttle de rede
- Captura de console, rede, screenshots e vídeos
- Acessibilidade e performance web

### O que não cobre bem

- App nativo instalado por APK
- Permissões reais de SO, push notification real, biometria, câmera
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

Reaproveita Playwright MCP, scripts Node em `cenarios/`, regras de evidência visual, `console_log.json`, `network_log.json`, `cleanup_log.json`, estrutura `clients/<id>/resultado/<timestamp>/` e relatórios `.md` e `.pdf`.

### Artefatos esperados

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

## 2. Android Emulator (AVD)

### Para que serve

Camada intermediária entre mobile web e Android físico. Permite automação de app nativo em CI/CD sem hardware dedicado.

### Vantagens

- Custo zero de hardware
- Roda em pipeline de CI
- Snapshots reproduzíveis
- Cobertura razoável de fluxos nativos

### Limitações

- Não cobre WebView de fabricante
- Performance não é representativa
- Sensores e permissões funcionam diferente do dispositivo real

### Alternativa

**Genymotion** — emulador Android mais rápido, com snapshots e ADB nativo. Útil em equipes maiores que precisam de paralelização.

### Skills sugeridas

```text
/mobile-android-emulator-check
/mobile-android-emulator-testar-modulo
```

---

## 3. Android Físico Individual

### Para que serve

Testar em celular Android real conectado por USB, tanto app nativo quanto Chrome real / WebView.

### Stack

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

- App instalado por APK ou já presente no aparelho
- Chrome real e WebView
- Taps, swipes, long press, rotação
- Permissões Android reais
- Screenshots e vídeo
- Logs via `adb logcat`
- Crash detection básico

### Avaliação paralela: Maestro vs Appium

Para skills mais simples, **Maestro** (declarativo em YAML) pode reduzir custo de manutenção significativamente. Avaliar lado a lado durante a Fase 2.

### Skills sugeridas

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
/mobile-android-crash-check
/mobile-android-performance
```

### Exemplos de uso

```text
/mobile-android-fisico --client tega --apk clients/tega/mobile/apps/app-debug.apk --udid <udid> --fluxo login
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

## 4. WebView, Híbridos e Frameworks Cross-Platform

Categorias frequentemente subestimadas:

- **Apps híbridos (Cordova, Ionic, Capacitor)** — alternar contextos `NATIVE_APP` ↔ `WEBVIEW` no Appium
- **React Native** — inspeção via testID e accessibility labels
- **Flutter** — driver específico (`flutter_driver` ou Appium Flutter Driver)
- **PWAs instaladas** (Add to Home Screen) — comportamento diferente da PWA aberta no navegador

Boa parte dos apps no mercado brasileiro são híbridos ou React Native. Sem prever isso, o BKPilot fica limitado a apps 100% nativos.

---

## 5. Performance Mobile Específica

| Métrica | Ferramenta |
|---|---|
| Cold start / warm start | `adb shell am start -W` |
| Consumo de bateria | `adb shell dumpsys batterystats` |
| Memória (PSS, RSS) | `adb shell dumpsys meminfo` |
| FPS e jank | `adb shell dumpsys gfxinfo` |
| Tamanho do APK e startup time | Android Profiler / Firebase Performance |
| Frame drops e tracing | systrace / Perfetto |

**Skill:**

```text
/mobile-android-performance-deep
```

---

## 6. Segurança Mobile (OWASP MASVS)

Nicho premium com baixa concorrência local. Conecta com o portfólio de pentest já explorado.

### Capacidades

- Análise estática do APK (MobSF, apkleaks)
- Verificação de armazenamento inseguro (SharedPreferences, SQLite sem criptografia)
- SSL Pinning bypass detection
- Permissões excessivas no Manifest
- Hardcoded secrets/tokens no APK
- Root detection / jailbreak detection
- Frida / Objection para runtime analysis

### Skills sugeridas

```text
/mobile-android-security-static
/mobile-android-security-runtime
```

---

## 7. Visual Regression Mobile

Aproveitando o que o BKPilot já faz bem (evidências visuais):

- **Percy / Chromatic / Applitools** — diff visual automático
- **Resemble.js / pixelmatch** — alternativas open source
- Baseline por dispositivo + orientação

Diferencial: detecta quebras visuais em diferentes resoluções automaticamente — exatamente o ponto fraco da farm Android.

---

## 8. Farm de Aparelhos Android

### Valor prático

Captura problemas que emulador e viewport simulada não pegam: teclado real, permissões reais, WebView de fabricante, lentidão de aparelho de entrada, layout em telas incomuns, customizações Samsung/Motorola/Xiaomi, falhas de versão Android específicas, comportamento real de arquivos, câmera e notificações.

### Tipos de farm

#### Farm local

```text
Servidor Windows/Linux
vários Androids via USB
ADB
Appium server por aparelho ou Appium Grid
```

**Vantagens:** controle total, sem upload de APK para terceiros, bom para apps internos.
**Desvantagens:** manutenção física, escalabilidade limitada.

#### Farm cloud

Exemplos: BrowserStack, Sauce Labs, LambdaTest, Kobiton, AWS Device Farm, Firebase Test Lab.

**Vantagens:** variedade de aparelhos, menos manutenção, melhor escala.
**Desvantagens:** custo recorrente, regras de segurança para APKs, integração específica.

### Skills sugeridas

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-regressao
/mobile-android-farm-crash-check
/mobile-android-farm-performance
/mobile-android-farm-relatorio
/mobile-android-farm-health
```

### Estrutura por cliente

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

### Observabilidade da farm

Quando há 10+ aparelhos rodando, é necessário monitorar saúde de cada device (bateria, temperatura, espaço em disco), reset automático após N execuções, detecção de aparelho fantasma no `adb`, alertas de aparelho offline.

---

## 9. iOS — Cobertura Futura

### Pré-requisitos

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
/mobile-ios-simulator-testar-modulo
```

---

## 10. Outras Capacidades Técnicas

### Deep Links e Universal Links

- Testes de deep links (`app://rota/recurso`)
- Universal Links (iOS) e App Links (Android)
- Fluxos de entrada via push notification ou QR Code

**Skill:** `/mobile-deeplink-validar`

### Acessibilidade Mobile Específica

- **Android:** Accessibility Scanner, TalkBack, espresso-accessibility
- **iOS:** Accessibility Inspector, VoiceOver
- WCAG Mobile + critérios específicos de Google Play e App Store

### Localização e Sensores

- GPS / mock locations (`adb emu geo fix`)
- Acelerômetro / giroscópio
- Câmera (mock images), microfone
- NFC / Bluetooth
- Modo avião, dual SIM

### Estratégia de Dados de Teste

- Mock de APIs (MockServer, WireMock)
- Stub de serviços externos
- Reset de estado entre execuções
- Contas de teste vs contas reais

---

# Parte II — Linhas de Produto

Esta parte transforma capacidades técnicas em **produtos vendáveis**. Em vez de lista de skills, define propostas de valor que o cliente compra.

## 11. Pilar 1 — Release Gate

### Conceito

Portão de liberação antes de publicar versão mobile. Transforma o BKPilot de **ferramenta de execução** em **apoio à decisão de publicação**.

### Saída

Veredicto estruturado em três níveis:

- **Aprovado** — pode publicar
- **Aprovado com ressalvas** — pode publicar, com lista de itens a corrigir em próxima versão
- **Reprovado** — não publicar até correções

### O que avalia

- App instala corretamente
- App abre sem crash
- Login e fluxos críticos passam
- Permissões são solicitadas corretamente
- Performance mínima é aceitável
- `logcat` sem erros graves
- Evidências geradas
- Cobertura mínima atingida (matriz de dispositivos)

### Skill principal

```text
/mobile-release-gate
```

### Pré-requisitos

Depende de outras skills já implementadas (`/mobile-android-check`, `/mobile-stability-check`, `/mobile-permission-matrix`, etc). É uma **skill orquestradora**, não atômica.

### Método de pontuação

Detalhado na Parte V (Governança). Cada item produz score parcial; o veredicto final é função de ponderação configurável por cliente.

### Produto comercial

```text
Validação de Release Mobile com IA
```

---

## 12. Pilar 2 — Evidence Pack

### Conceito

Pacote padronizado de evidências, em vez de arquivos soltos no diretório de resultado.

### Conteúdo

```text
Resumo executivo
Matriz de dispositivos testados
Versão do app
Versão do Android/iOS
Screenshots principais
Vídeos dos fluxos críticos
Logs sanitizados
Bugs encontrados
Riscos identificados
Recomendação de liberação
Anexos técnicos
```

### Skill

```text
/mobile-evidence-pack
```

### Valor

Aumenta a percepção de entrega. Útil para auditorias, reuniões executivas e decisões de release. Diferencia o BKPilot de ferramentas que entregam logs crus.

### Formato

ZIP estruturado contendo PDF executivo + diretório técnico organizado. Compatível com a estrutura `clients/<id>/resultado/<timestamp>/`.

---

## 13. Pilar 3 — Matriz Inteligente de Cobertura

### Conceito

Responde a pergunta universal "quais celulares testar?" como recomendação técnica, não como adivinhação.

### O que considera

- Tipo do app (nativo, híbrido, web)
- Público-alvo
- Versão mínima Android/iOS
- Criticidade do sistema
- Quantidade estimada de usuários
- Riscos do negócio
- Orçamento do cliente
- Histórico de bugs por dispositivo ou versão

### Exemplo de saída

```text
Cobertura mínima recomendada para [cliente]:
- 1 Android intermediário atual (Samsung A-series)
- 1 Android antigo/de entrada (Motorola E)
- 1 fabricante secundário (Xiaomi)
- 1 tela pequena (5.5")
- 1 tela grande (6.7")
- 1 execução em rede 3G simulada

Cobertura ampliada recomendada (+30% custo):
- +1 Samsung S-series
- +1 versão Android antiga (11)
- +iOS principal (se aplicável)
```

### Skill

```text
/mobile-matriz-cobertura
```

### Conexão com `devices.json`

A matriz gera ou atualiza o `devices.json` do cliente, conectando o produto comercial diretamente à infraestrutura técnica já definida na Parte I.

---

## 14. Skills Concretas de Alto Valor

Skills atômicas com escopo bem definido, ordenadas por valor comercial percebido:

### `/mobile-stability-check`

Detecta crashes, ANRs (Application Not Responding), telas congeladas, loops, falhas após rotação ou background/foreground. Combina `logcat` + heurísticas de tempo de resposta + Frida para hooks de runtime.

### `/mobile-first-run-check`

Valida o ciclo inicial: instalação limpa → primeira abertura → aceite de termos → tutorial → permissões → criação de conta → login inicial → primeiro uso → desinstalar e reinstalar. Cobre o gargalo onde mais se perde usuário.

### `/mobile-upgrade-validation`

Fluxo: instalar versão N → criar dados → atualizar para N+1 → validar preservação de dados, sessão e configurações + ausência de crash.

### `/mobile-keyboard-check`

Teclado cobre botão, campo não rola, tipo de teclado errado, máscara quebrada, autocomplete atrapalhando. Banal mas é fonte real de bugs em apps brasileiros, especialmente bancários e ERPs.

### `/mobile-permission-matrix`

Permissão aceita / negada / negada permanentemente / removida nas configurações / ausente. Cobre câmera, localização, microfone, arquivos, notificações, contatos, Bluetooth, biometria. Conecta com LGPD.

### `/mobile-background-resume`

Bug clássico: abrir → background → voltar após N minutos → bloquear/desbloquear → trocar entre apps → receber chamada → sessão expirar em background. Essencial para apps autenticados.

### `/mobile-camera-upload-check`

Abrir câmera, ler QR Code, sem permissão, upload de foto/documento, foto grande, imagem inválida, troca de câmera frontal/traseira. Muito útil para apps de vistoria, logística, assinatura, atendimento.

### `/mobile-auth-check`

Login com senha, biometria habilitada, biometria cancelada/falha, fallback para senha, troca de usuário, sessão expirada, logout, token inválido, múltiplos logins. Premium para fintech, saúde, RH, jurídico.

### `/mobile-network-chaos`

Internet lenta, queda no meio do fluxo, alternância Wi-Fi/4G, modo avião, reconexão, envio duplicado, perda de sessão, sincronização offline. Implementação via toxiproxy, mitmproxy ou Charles Proxy. Alto valor para apps de campo, vendas externas, logística, saúde, vistoria, financeiro.

### `/mobile-system-config-test`

Configurações de sistema: modo escuro, fonte aumentada, idioma, fuso, formato de data, orientação, economia de bateria, notificações bloqueadas, pouco armazenamento. Combinável com outras skills via flags.

### `/mobile-ux-review`

Camada consultiva: facilidade de login, clareza de mensagens de erro, excesso de etapas, botões pequenos, fluxo confuso, telas lentas, fricção percebida. Gera diagnóstico de qualidade mobile, não apenas evidência de automação.

---

## 15. Relatório Executivo

### Conceito

Versão paralela do relatório técnico, voltada para decisão de gestão.

### Formato sugerido

```text
Status da versão: Aprovada com ressalvas
Risco geral: Médio
Principais riscos encontrados: 4
Bugs críticos: 1
Bugs altos: 3
Dispositivos testados: 5
Fluxos testados: 12
Cobertura estimada: 78%
Recomendação: não publicar antes de corrigir login e anexos
```

### Skill

```text
/mobile-executive-report
```

### Posicionamento estratégico

Esta skill deve aparecer **cedo no roadmap**, antes mesmo da farm. Mostrar valor de relatório executivo na Fase 1 cria demanda do próprio cliente puxando as skills técnicas seguintes.

### Método de pontuação

Detalhado na Parte V. Sem critério reproduzível, "Risco: Médio" vira opinião disfarçada de métrica.

---

## 16. Pacotes Comerciais (SKUs)

Empacotamento de skills em ofertas comerciais nomeáveis:

### Pacote 1 — Mobile Web Express

Para sistemas responsivos e PWAs. Entrega rápida.

```text
/mobile-web-testar-modulo
/mobile-web-regressao
/mobile-executive-report
```

### Pacote 2 — Android App Check

Para app Android instalado.

```text
/mobile-android-check
/mobile-android-fisico
/mobile-stability-check
/mobile-evidence-pack
```

### Pacote 3 — Mobile Release Gate

Para validar versão antes de publicação. Produto carro-chefe.

```text
/mobile-release-gate
/mobile-upgrade-validation
/mobile-permission-matrix
/mobile-executive-report
/mobile-evidence-pack
```

### Pacote 4 — Mobile Premium QA

Para clientes mais maduros, com necessidade de qualidade ampla.

```text
/mobile-visual-regression
/mobile-android-performance-deep
/mobile-network-chaos
/mobile-ux-review
/mobile-android-security-static
/mobile-evidence-pack
```

### Pacote 5 — Mobile Monitoring

Venda recorrente, valor mensal previsível.

```text
/mobile-synthetic-monitoring
/mobile-stability-check
/mobile-executive-report
```

### Pacote 6 — Mobile Security (MASVS)

Skill premium com baixa concorrência local.

```text
/mobile-android-security-static
/mobile-android-security-runtime
/mobile-permission-matrix
/mobile-evidence-pack
```

---

# Parte III — Diferencial Competitivo via IA

Aqui o BKPilot se diferencia de qualquer farm tradicional. Esta camada justifica a stack Claude + skills frente a Appium puro, BrowserStack ou Maestro isolados. Sem IA, o BKPilot é mais uma ferramenta de QA mobile. Com IA, é categoria própria.

## 17. Exploração Autônoma com LLM

### Conceito

Em vez de scripts fixos, o agente:

1. Recebe o APK + descrição do app
2. Explora a UI autonomamente via Appium
3. Identifica fluxos críticos por análise de telas e textos
4. Gera cenários de teste a partir do que viu
5. Executa regressão sem cenários pré-escritos

Isso é **monkey testing inteligente** — algo que ferramentas tradicionais não fazem bem. Combina Appium para execução + Claude para decisão sobre próxima ação + heurísticas para detecção de fluxos críticos.

### Skill

```text
/mobile-explorar-autonomo
```

### Aplicação

Excelente para clientes em fase de descoberta de QA, onde ainda não há cenários documentados. Reduz custo de entrada na operação de QA.

---

## 18. Bug Triagem Automática

### Conceito

- Captura de crash + logcat + screenshot + contexto
- LLM classifica severidade, módulo afetado, similaridade com bugs conhecidos
- Geração automática de bug card no formato BKPilot
- Sugestão de causa raiz e reprodução mínima

### Skill

```text
/mobile-bug-triage
```

### Conexão com skills existentes

Plugável em `/mobile-stability-check`, `/mobile-android-fisico`, `/mobile-network-chaos`. Qualquer skill que produza falha pode rotear o resultado por essa triagem antes de gerar relatório.

---

## 19. Geração de Cenários a partir de Tela

### Conceito

- Screenshot ou vídeo curto da tela
- LLM identifica componentes (campos, botões, validações visuais)
- Gera cenários BDD/Gherkin compatíveis com a skill `/gerar-cenarios` já existente
- Cobre cenários positivos, negativos e de borda

### Skill

```text
/mobile-gerar-cenarios-tela
```

### Integração com portfólio existente

Conecta com a skill `/gerar-cenarios` desenvolvida no contexto Dify e Skill Runner. Reutiliza expertise já acumulada em geração de cenários a partir de Jira.

---

## 20. Outras Aplicações de IA Específicas para Mobile

### Análise de UX por screenshot

LLM avalia heurísticas de Nielsen, contraste, hierarquia visual, fricção percebida — alimenta `/mobile-ux-review` com argumentos concretos.

### Detecção de crash patterns

Cluster de crashes similares ao longo de execuções, identificando regressões e bugs persistentes. Conecta com `/mobile-bug-triage`.

### Tradução automática de relatórios

Relatório técnico em PT-BR → versão executiva em PT-BR + opcionalmente versão em inglês para clientes internacionais.

### Sugestão de cobertura dinâmica

Com base em histórico de bugs do cliente, a Matriz de Cobertura ajusta recomendação automaticamente — devices que mais geraram bugs ganham prioridade.

---

# Parte IV — Roadmap Unificado

A sequência abaixo combina o roadmap técnico do v2 com a reordenação comercial sugerida na análise externa. Privilegia **valor comercial cedo** sobre **completude técnica**.

## 21. Fase 1 — Mobile Web + Relatório Executivo

**Entregar:**

```text
/mobile-web-testar-modulo
/mobile-web-regressao
/mobile-executive-report   ← incluído cedo (estratégico)
```

**Justificativa:**

- Entrega rápida usando Playwright já existente
- Cobre sistemas web responsivos e PWAs
- Relatório executivo já na Fase 1 cria demanda do próprio cliente puxando skills técnicas seguintes

---

## 22. Fase 1.5 — Android Emulator

**Entregar:**

```text
/mobile-android-emulator-check
/mobile-android-emulator-testar-modulo
```

**Justificativa:** viabiliza CI/CD de app nativo sem investir em hardware. Camada intermediária entre Playwright e farm física.

---

## 23. Fase 2 — Android Físico + Skills Concretas + Evidence Pack

**Entregar:**

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
/mobile-stability-check
/mobile-first-run-check
/mobile-evidence-pack       ← entrega vendável
```

**Decisão paralela:** avaliar Maestro vs Appium puro lado a lado.

**Justificativa:** Android físico ganha conjunto de skills concretas que tornam a entrega imediatamente vendável, não apenas tecnicamente possível.

---

## 24. Fase 2.5 — Release Gate + Diferenciais Técnicos

**Entregar:**

```text
/mobile-release-gate            ← carro-chefe comercial
/mobile-upgrade-validation
/mobile-permission-matrix
/mobile-keyboard-check
/mobile-background-resume
/mobile-visual-regression
/mobile-android-performance-deep
/mobile-matriz-cobertura
```

**Justificativa:** Release Gate já operacional, com skills de suporte. Conjunto vendável como Pacote 3 — Mobile Release Gate.

---

## 25. Fase 3 — Farm Android Local + IA Diferencial

**Entregar:**

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-relatorio
/mobile-android-farm-health
/mobile-explorar-autonomo       ← diferencial via IA
/mobile-bug-triage              ← diferencial via IA
```

**Justificativa:** quando há infraestrutura para farm, é o momento de ativar diferenciais via IA que justificam a stack Claude + skills.

---

## 26. Fase 3.5 — Security + Camera + Auth

**Entregar:**

```text
/mobile-android-security-static
/mobile-android-security-runtime
/mobile-camera-upload-check
/mobile-auth-check
/mobile-network-chaos
```

**Justificativa:** skills premium com pouca concorrência local. Habilita Pacote 4 (Premium) e Pacote 6 (Security).

---

## 27. Fase 4 — Farm Cloud + UX Review + Monitoring

**Entregar:**

- Integração com BrowserStack ou AWS Device Farm
- `/mobile-ux-review`
- `/mobile-system-config-test`
- `/mobile-synthetic-monitoring`
- `/mobile-gerar-cenarios-tela`

**Justificativa:** cobertura ampla sem manutenção física. Habilita Pacote 5 (Monitoring) com receita recorrente.

---

## 28. Fase 5 — iOS

Entregar somente se houver demanda real:

```text
/mobile-ios-check
/mobile-ios-fisico
/mobile-ios-simulator-testar-modulo
```

**Justificativa:** exige ambiente macOS dedicado. Validar demanda comercial antes de investir em hardware.

---

## 29. Sequência MVP Recomendada

Para implementação imediata após decisão executiva, a ordem mais prática é:

```text
1. /mobile-web-testar-modulo          (entrega rápida, Playwright)
2. /mobile-executive-report           (relatório vendável já na Fase 1)
3. /mobile-android-check              (validação de ambiente)
4. /mobile-stability-check            (crash + ANR detection)
5. /mobile-evidence-pack              (entrega organizada)
6. /mobile-release-gate               (orquestrador comercial)
```

Essas seis skills criam uma base real de produto, permitem demonstração comercial e reduzem o risco técnico antes de investir em hardware, farm, security ou iOS.

---

# Parte V — Governança

## 30. Ajuste nas Regras do Projeto

Hoje as regras dizem que automação de browser deve usar Playwright MCP e proíbe Selenium/Cypress. Para mobile nativo é necessário adicionar exceção controlada.

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

## 31. Segurança e Evidências

### Regras gerais (mantidas do projeto atual)

- Nunca passar senha inline
- `QA_PASSWORD` somente em `clients/<id>/.env`
- Tokens Jira/GitHub somente no `.env` raiz
- Nunca expor `.env`, tokens ou logs internos ao cliente
- Todos os artefatos devem ficar dentro de `clients/<id>/`
- Cada cenário/bug precisa de screenshot ou vídeo
- Falhas e inconclusivos devem documentar tentativas

### Regras específicas para Android nativo

- Nunca salvar APK confidencial fora de `clients/<id>/mobile/apps/`
- Sanitizar `logcat.txt` antes de entregar ao cliente
- Não publicar identificadores sensíveis do aparelho se relatório for externo
- Separar relatório interno de governança do relatório do cliente

### Regras específicas para skills MASVS

- APKs descompilados nunca devem ser commitados
- Resultados de análise estática devem ser sanitizados (remoção de paths internos do build)
- Vulnerabilidades críticas devem seguir disclosure responsável antes de publicação

### Regras específicas para Evidence Pack

- Pack interno (governança) e pack externo (cliente) devem ser arquivos separados
- Pack externo nunca contém logs crus, tokens, ou paths internos
- Pack externo é PDF + ZIP de evidências sanitizadas

---

## 32. Método de Pontuação para Release Gate

Sem critério reproduzível, qualquer veredicto vira opinião. O Release Gate precisa de framework documentado.

### Categorias de avaliação

Cada categoria recebe peso configurável por cliente:

| Categoria | Peso default | Origem dos dados |
|---|---|---|
| Estabilidade (crash + ANR) | 30% | `/mobile-stability-check` |
| Funcionalidade crítica | 25% | `/mobile-android-fisico` (fluxos chave) |
| Compatibilidade de cobertura | 15% | `/mobile-matriz-cobertura` |
| Performance mínima | 10% | `/mobile-android-performance-deep` |
| Permissões e segurança | 10% | `/mobile-permission-matrix` |
| UX e acessibilidade | 5% | `/mobile-ux-review` |
| Migração/upgrade (se aplicável) | 5% | `/mobile-upgrade-validation` |

### Escala de severidade de bugs

| Severidade | Definição | Impacto no veredicto |
|---|---|---|
| Crítico | Crash, perda de dados, brecha de segurança, fluxo principal bloqueado | Reprovado se ≥ 1 |
| Alto | Funcionalidade importante quebrada, sem workaround | Reprovado se ≥ 3 |
| Médio | Funcionalidade quebrada com workaround | Aprovado com ressalvas se ≥ 5 |
| Baixo | Cosmético, edge case, melhoria | Não bloqueia |

### Veredicto final

```text
Score por categoria: 0-100
Score ponderado: soma(categoria × peso)

Aprovado:                  score ≥ 85 e zero críticos e ≤ 2 altos
Aprovado com ressalvas:    score ≥ 70 e zero críticos e ≤ 5 altos
Reprovado:                 demais casos
```

### Configuração por cliente

Pesos e thresholds devem ser configuráveis em `clients/<id>/release-gate.config.json` para acomodar diferentes perfis (fintech mais rigoroso que app interno, por exemplo).

---

## 33. Operação do Evidence Pack

### Quem opera

- **Geração:** automática pela skill `/mobile-evidence-pack` ao final da execução
- **Revisão:** Jorge (ou QA designado) valida antes de entrega ao cliente
- **Distribuição:** via canal definido no contrato (e-mail, Drive, portal)

### Versionamento

Evidence Pack é versionado por execução: `evidence_pack_<cliente>_<versao_app>_<timestamp>.zip`. Histórico fica em `clients/<id>/resultado/<timestamp>/evidence_packs/`.

### Auditoria

Todo Evidence Pack externo gera log interno em `clients/<id>/audit/evidence_pack_log.json` com hash do arquivo, data de geração, data de entrega e destinatário.

---

## 34. Conexão Matriz de Cobertura ↔ devices.json

A Matriz de Cobertura não é abstração — gera ou atualiza diretamente o `devices.json` do cliente.

### Fluxo

```text
1. /mobile-matriz-cobertura --client <id> coleta inputs (tipo de app, público, criticidade)
2. Matriz gera recomendação textual no relatório
3. Mediante aprovação do cliente, /mobile-matriz-cobertura aplica a recomendação ao devices.json
4. Próximas execuções de farm respeitam o novo devices.json
```

Isso conecta a recomendação comercial diretamente à infraestrutura técnica, evitando que a matriz vire documento morto.

---

## 35. Quarentena de Testes Flakey

Mobile é notoriamente instável. Sem estratégia de quarentena, testes flakey poluem o Release Gate.

### Política proposta

- Falha em primeira execução → retry automático (1x)
- Falha em retry → flag `flakey` no relatório, sem bloquear veredicto
- Falha em 3 execuções consecutivas em runs diferentes → bug card automático
- Cenário com >30% de flakiness em 30 dias → quarentena formal, removido do Release Gate até estabilização

---

## 36. Pontos para Decisão Comercial

Decisões que dependem de direção da liderança e devem ser formalizadas antes da Fase 2:

1. **Foco em apps internos de clientes vs apps de mercado?** Muda a necessidade de farm cloud e MASVS.
2. **Vamos vender skill de segurança mobile (MASVS)?** Se sim, antecipar para Fase 2.5.
3. **Maestro vs Appium puro?** Maestro pode reduzir custo de manutenção significativamente.
4. **Aceitamos dependência de macOS para iOS?** Custo de hardware vs demanda real.
5. **Visual regression como produto separado ou bundled?** Pode ser SKU independente.
6. **Release Gate vai ser SKU principal?** Se sim, antecipar `/mobile-executive-report` e `/mobile-evidence-pack`.
7. **Pesos default do Release Gate?** Definir antes da implementação para evitar retrabalho.

---

## 37. Recomendação Final

> O BKPilot Mobile pode começar simples com testes mobile web e Android check, mas deve evoluir para um produto de validação de release, gerando evidências, matriz de cobertura e recomendação executiva de publicação.
>
> O maior diferencial não é apenas rodar testes em celular, mas transformar execução mobile em decisão de qualidade para o cliente, ancorada em IA agentica que outras ferramentas não oferecem.

As três linhas que se reforçam mutuamente são:

1. **Release Gate** — transforma teste em decisão de publicação
2. **Evidence Pack** — transforma execução em entrega organizada e auditável
3. **Matriz Inteligente de Cobertura** — transforma seleção de dispositivos em recomendação técnica

Sustentadas pela camada técnica robusta da Parte I e pelo diferencial competitivo via IA da Parte III.

---

## Apêndice A — Stack Resumido por Fase

| Fase | Stack adicionado |
|---|---|
| 1 | Playwright (já existente) + geração de relatório executivo |
| 1.5 | Android SDK, AVD, Appium server, UiAutomator2 |
| 2 | ADB, aparelho físico Android, Appium Inspector, (opcional) Maestro, Evidence Pack |
| 2.5 | pixelmatch ou Percy, Perfetto, dumpsys parsers, Release Gate orchestration |
| 3 | Appium Grid, devices.json, monitoramento de farm, exploração autônoma via LLM |
| 3.5 | MobSF, Frida, Objection, apkleaks, toxiproxy/mitmproxy |
| 4 | SDK BrowserStack ou AWS Device Farm, monitoramento sintético |
| 5 | macOS, Xcode, XCUITest, WebDriverAgent |

---

## Apêndice B — Lista Consolidada de Skills

### Web e ambiente

```text
/mobile-web-explorar
/mobile-web-testar-modulo
/mobile-web-regressao
/mobile-web-usabilidade
/mobile-web-acessibilidade
/mobile-web-performance
```

### Android emulador

```text
/mobile-android-emulator-check
/mobile-android-emulator-testar-modulo
```

### Android físico

```text
/mobile-android-check
/mobile-android-fisico
/mobile-android-regressao
/mobile-android-crash-check
/mobile-android-performance-deep
```

### Skills concretas de teste

```text
/mobile-stability-check
/mobile-first-run-check
/mobile-upgrade-validation
/mobile-keyboard-check
/mobile-permission-matrix
/mobile-background-resume
/mobile-camera-upload-check
/mobile-auth-check
/mobile-network-chaos
/mobile-system-config-test
/mobile-deeplink-validar
/mobile-ux-review
/mobile-visual-regression
```

### Farm

```text
/mobile-android-farm-check
/mobile-android-farm-testar-modulo
/mobile-android-farm-regressao
/mobile-android-farm-crash-check
/mobile-android-farm-performance
/mobile-android-farm-relatorio
/mobile-android-farm-health
```

### Segurança

```text
/mobile-android-security-static
/mobile-android-security-runtime
```

### Linhas de produto (orquestradoras)

```text
/mobile-release-gate
/mobile-evidence-pack
/mobile-matriz-cobertura
/mobile-executive-report
/mobile-synthetic-monitoring
```

### Diferencial via IA

```text
/mobile-explorar-autonomo
/mobile-bug-triage
/mobile-gerar-cenarios-tela
```

### iOS (futuro)

```text
/mobile-ios-check
/mobile-ios-fisico
/mobile-ios-regressao
/mobile-ios-simulator-testar-modulo
```

---

## Apêndice C — Glossário

- **ADB** — Android Debug Bridge. Ferramenta de linha de comando para interagir com dispositivos Android.
- **ANR** — Application Not Responding. Estado em que o app fica travado sem fechar imediatamente.
- **APK** — Android Package. Formato de instalação de apps Android.
- **AVD** — Android Virtual Device. Emulador Android oficial do Android Studio.
- **MASVS** — Mobile Application Security Verification Standard. Padrão OWASP de segurança mobile.
- **PWA** — Progressive Web App. Aplicação web com experiência similar a app nativo.
- **SKU** — Stock Keeping Unit. Identificador comercial de produto vendável.
- **UDID** — Unique Device Identifier. Identificador único de dispositivo.
- **WebView** — Componente que permite exibir conteúdo web dentro de um app nativo.
- **XCUITest** — Framework de testes UI da Apple para iOS.

---

*Documento consolidado para discussão interna BugKillers. Versão 3.0 — Maio/2026. Substitui v1 e v2 como referência única.*
