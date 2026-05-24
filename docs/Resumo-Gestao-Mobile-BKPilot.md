# Resumo para Gestao - BKPilot Mobile Appium/MCP

**Data:** 2026-05-10  
**Tema:** evolucao do suporte mobile web/APK com Appium, MCP, Core compartilhado e skills reutilizaveis.

## Status Consolidado

- A arquitetura mobile foi consolidada para atender web mobile e APK usando Appium/MCP.
- O runtime compartilhado foi extraido do BKPilot-Producao e movido para o pacote `@bugkillers/bkpilot-core`.
- O `BKPilot-Core` foi publicado com runtime mobile compartilhado e correcao de capabilities cloud na tag `v0.2.1`.
- O `BKPilot-Skills` foi criado como fonte canonica das skills mobile reutilizaveis.
- BKPilot-Producao e BKPilot-Comercial foram alinhados para consumir o Core mobile e sincronizar as skills compartilhadas.
- O primeiro smoke real em device farm foi aprovado na Sauce Labs US West 1 usando Android + Chrome com alocacao dinamica.

## BKPilot-Producao

### Arquitetura e Separacao de Responsabilidades

- O repositorio BKPilot foi definido como futuro `BKPilot-Producao`.
- Foi formalizada a regra de separacao:
  - `BKPilot-Core`: runtime JS compartilhado.
  - `BKPilot-Skills`: skills e templates reutilizaveis.
  - `BKPilot-Producao`: execucao operacional real.
  - `BKPilot-Comercial`: demos, venda, experiencias comerciais e `mobile-demo`.
- Foi removida a responsabilidade de manter logica mobile compartilhada diretamente no Producao.
- Os arquivos locais de runtime mobile foram convertidos para wrappers finos que chamam o Core.

### Integracao com BKPilot-Core

- O Producao foi atualizado para consumir:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.1"
```

- Foram mantidos wrappers de compatibilidade no Producao:
  - `scripts/lib/mobile-appium-client.js`
  - `scripts/lib/mobile-device-manager.js`
  - `scripts/mobile-mcp-server.js`
- Foi validado que a logica nova deve ficar no `BKPilot-Core`, nao nos wrappers do Producao.
- Foi confirmado por smoke de importacao que o pacote Core expoe os modulos mobile esperados.

### Skills Mobile Operacionais

- Foram disponibilizadas 8 skills mobile no Producao:
  - `explorar-mobile-web`
  - `explorar-mobile-apk`
  - `gerar-cenarios-mobile-web`
  - `gerar-cenarios-mobile-apk`
  - `testar-modulo-mobile-web`
  - `testar-modulo-mobile-apk`
  - `executar-planilha-mobile-web`
  - `executar-planilha-mobile-apk`
- As skills foram distribuidas para:
  - `src/`
  - `dist/claude/`
  - `dist/codex/`
  - `dist/opencode/`
  - `.claude/commands/`
- Foi criado comando formal para sincronizar as skills mobile a partir do `BKPilot-Skills`:

```bash
npm.cmd run skills:sync:mobile
```

- A sincronizacao no Producao copiou 41 arquivos a partir do `BKPilot-Skills`.
- O lint das skills foi executado e aprovado, mantendo apenas aviso esperado sobre script opcional por cliente.

### MCP Mobile e Appium

- Foi criado suporte Appium/MCP via stdio.
- O servidor MCP mobile foi registrado para uso pelas skills.
- O MCP mobile passou a expor ferramentas para operacao mobile, incluindo navegacao, estado, screenshots e execucao.
- Foi definido contrato forte para `mobile.getState`, evitando retorno inconsistente para os agentes.
- Foram definidos modos operacionais:
  - `observe`
  - `explore`
  - `execute`
- Foi implementado suporte a Appium local e remoto.
- Foi implementado suporte generico a device farm.

### Evidencias, Device Manager e Smoke

- Foi criado Device Manager local para validacoes mobile.
- Foi criado Evidence Manager basico para screenshots, source XML, estado e relatorios.
- Foi criado smoke test mobile para validar fluxo minimo.
- O `mobile-smoke` passou a consultar `/status` usando o provider resolvido, evitando testar Appium local quando o cliente usa farm remoto.
- O smoke passou a carregar `.env` local automaticamente para:
  - `MOBILE_FARM_USERNAME`
  - `MOBILE_FARM_ACCESS_KEY`
  - `APPIUM_URL`

### Validacao Real em Device Farm

- Foi validado smoke real na Sauce Labs US West 1.
- Configuracao usada: `clients/sauce-mobile-smoke/config.json`.
- Comando executado:

```bash
npm.cmd run mobile:smoke -- --cliente sauce-mobile-smoke --target web
```

- Resultado aprovado:

```text
Smoke passed: clients\sauce-mobile-smoke\resultado\2026-05-09_2321\mobile\reports\mobile_smoke_report.json
```

- Observacao tecnica: a alocacao estatica por device falhou por matching error; a alocacao dinamica Android + Chrome passou.

### Documentacao e Governanca

- Foi criado e consolidado o plano tecnico em `docs/arquitetura/Plano-Mobile-Appium-MCP.md`.
- Foi criada documentacao de setup MVP em `docs/arquitetura/Mobile-Appium-MCP-Setup.md`.
- Foi documentada matriz de compatibilidade mobile.
- Foram definidos criterios de aceite para a entrega mobile.
- Foi registrada a decisao de upload automatico de APK para uma Release 0.1 futura.
- O `AGENTS.md` foi atualizado com regras de arquitetura Core/Comercial/Producao.

## BKPilot-Comercial

### Alinhamento com Core Mobile

- O Comercial foi atualizado para consumir o mesmo runtime mobile compartilhado do `BKPilot-Core`.
- A dependencia foi alinhada para:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.1"
```

- Foram criados wrappers finos equivalentes aos do Producao:
  - `scripts/lib/mobile-appium-client.js`
  - `scripts/lib/mobile-device-manager.js`
  - `scripts/mobile-mcp-server.js`
- Foi validado que o Comercial nao deve copiar runtime do Producao.
- O Comercial deve consumir o Core e as skills compartilhadas como dependencias/fonte sincronizada.

### Skills Mobile Compartilhadas

- O Comercial recebeu as mesmas 8 skills mobile compartilhadas:
  - `explorar-mobile-web`
  - `explorar-mobile-apk`
  - `gerar-cenarios-mobile-web`
  - `gerar-cenarios-mobile-apk`
  - `testar-modulo-mobile-web`
  - `testar-modulo-mobile-apk`
  - `executar-planilha-mobile-web`
  - `executar-planilha-mobile-apk`
- Foi criado comando formal de sincronizacao no Comercial, equivalente ao Producao.
- A sincronizacao copiou 41 arquivos a partir do `BKPilot-Skills`.
- O MCP mobile foi registrado no `.claude/settings.json` do Comercial para permitir execucao das mesmas skills.

### Validacoes Executadas no Comercial

- Foi validado o script de sincronizacao:

```bash
node --check scripts/sync-shared-skills.js
```

- Foi executado o sync de skills mobile:

```bash
npm.cmd run skills:sync:mobile
```

- Foi validado o import do Core mobile:

```bash
node -e "const c=require('@bugkillers/bkpilot-core'); console.log(Boolean(c.mobileAppium.MobileAppiumClient && c.mobileDeviceManager.validateLocalAndroidDevice && c.mobileMcp.runMobileMcpServer))"
```

- Foram validados os scripts mobile:

```bash
node --check scripts/mobile-mcp-server.js
node --check scripts/mobile-smoke.js
```

- Foi executado lint das skills:

```bash
npm.cmd run skills:lint
```

- Foi executada a suite de testes do Comercial:

```bash
npm.cmd test
```

- Resultado registrado:
  - import mobile: ok;
  - sync formal: ok;
  - lint de 28 skills: ok;
  - testes comerciais: 72 passaram, 1 skip, 0 falhas;
  - `npm install` reportou 1 vulnerabilidade alta ja existente e fora do escopo desta migracao.

### Mobile Demo Comercial

- Foi decidido que qualquer `mobile-demo` pertence ao `BKPilot-Comercial`.
- A demo mobile foi explicitamente repriorizada como ultima etapa.
- A demo deve ser criada somente depois de:
  - sync formal de skills estabilizado;
  - Comercial e Producao reproduzindo as skills a partir do `BKPilot-Skills`;
  - smoke real Appium aprovado;
  - hardening minimo do Core concluido.
- Foi registrado que demo, dados fake, UI/API comercial e narrativa de venda nao devem ir para Core nem Producao.

### Commits Registrados no Comercial

- `5e715ba Alinhar Comercial ao mobile compartilhado`
- `46ad115 Adicionar sync de skills mobile compartilhadas`

## BKPilot-Skills

Embora a apresentacao esteja separada entre Producao e Comercial, a criacao do `BKPilot-Skills` foi um ponto central para ambos.

- Foi criado e publicado o repositorio `BKPilot-Skills`.
- O repositorio recebeu `AGENTS.md` proprio, deixando claro que ali vivem apenas skills compartilhadas.
- As 8 skills mobile canonicas foram movidas para `BKPilot-Skills`.
- O conversor multi-target foi mantido no `BKPilot-Skills`.
- Foram geradas distribuicoes para:
  - Claude
  - Codex
  - OpenCode
- Validacoes executadas:

```bash
npm.cmd install
npm.cmd run skills:lint
npm.cmd run skills:build
```

- Resultado:
  - 8 skills validadas;
  - 24 arquivos renderizados em `dist/`;
  - 0 vulnerabilidades reportadas pelo npm;
  - tag publicada: `v0.1.0`;
  - remote: `https://github.com/JorgeBK923/BKPilot-Skills.git`.

## BKPilot-Core

O Core e a base tecnica compartilhada por Producao e Comercial.

- Foi publicado runtime mobile compartilhado.
- Foi publicada a tag `v0.2.1`.
- Modulos adicionados:
  - `mobile-appium-client.js`
  - `mobile-device-manager.js`
  - `mobile-mcp.js`
- Exports adicionados:
  - `mobileAppium`
  - `mobileDeviceManager`
  - `mobileMcp`
- Melhorias aplicadas:
  - remocao de campos internos de politica/governanca antes de enviar capabilities ao Appium;
  - retorno de capabilities com redaction em `startSession()`;
  - uso de `process.cwd()` ou `BKPILOT_ROOT` para salvar artefatos no consumidor;
  - correcao para provider cloud nao inferir `udid` automaticamente;
  - suporte compartilhado a Appium local/remoto e device farm.

## Itens Ainda Pendentes

- Criar testes unitarios no Core para `buildCapabilities()`, `resolveProviderConfig()`, `redact()` e policies de seguranca.
- Trocar parser XML regex por biblioteca dedicada.
- Implementar mascaramento visual de dados sensiveis em screenshots.
- Avaliar `startRecordingScreen` para video local best-effort.
- Implementar adaptador real de upload automatico de APK para provider especifico.
- Rodar smoke real contra APK.
- Baixar videos/logs do provider quando disponivel.
- Executar planilhas mobile ponta a ponta.
- Consolidar relatorio final cliente com artefatos mobile.
- Planejar suporte iOS como fase separada.
- Criar `mobile-demo` no Comercial depois do hardening minimo.

## Proximas Atividades do BKPilot-Producao

1. Criar nova skill de relatorio final, consolidando evidencias web e mobile em `.md` e `.pdf`.
2. Definir parametros obrigatorios de execucao mobile por cliente, incluindo template de `config.json`, criterios de aceite, massa de teste, governanca de evidencias, redaction, retry/flakiness, timeouts e limites de uso da Sauce Labs.
3. Executar testes com celular Android conectado via USB, validando Appium local, Chrome mobile, screenshots e `mobile.getState`.
4. Rodar smoke APK local em device real ou emulador e definir estrategia de APK para farm, incluindo `appPackage`, `appActivity`, `allowedAppPackages` e criterio para APK remoto ja enviado versus upload automatico.
5. Fazer hardening minimo do Core mobile com testes unitarios para capabilities, provider config, redaction e policies.
6. Implementar mascaramento de dados sensiveis em evidencias, principalmente screenshots.
7. Trocar o parser XML regex por biblioteca dedicada.
8. Definir estrategia de video e logs, incluindo `startRecordingScreen` local e download de artefatos do provider quando disponivel.
9. Executar teste de ponta a ponta completo pela Sauce Labs, incluindo fluxo por planilha mobile, uso ou upload de APK quando aplicavel, evidencias, logs, videos e relatorio final para validar o pipeline operacional.

## Atividades do BKPilot-Comercial

1. Criar skill `/mobile-demo`.
   - Orquestrar analise, geracao de cenarios, execucao, evidencias e relatorio.
   - Nao duplicar logica do Core ou das skills compartilhadas.

2. Definir roteiro comercial da demo.
   - Web mobile ou APK.
   - App real, app fake ou ambiente controlado.
   - Fluxo principal da demonstracao.
   - Duracao ideal.
   - Artefatos que serao exibidos ao prospect.

3. Criar `clients/mobile-demo`.
   - `config.json`
   - `.env.example`
   - `flows/`
   - `cenarios/`
   - `resultado/`
   - Configuracao para Sauce Labs, farm propria ou Appium local.

4. Integrar execucao com a API comercial.
   - Endpoint para iniciar demo.
   - Endpoint para consultar status.
   - Endpoint para listar artefatos.
   - Endpoint para baixar relatorio.
   - Tratamento de erro amigavel.

5. Integrar paginas criadas no Google Stitch ao frontend.
   - Importar codigo gerado pelo Stitch.
   - Adaptar ao framework atual do Comercial.
   - Conectar botoes a API.
   - Mapear estados: aguardando, executando, aprovado, falhou, fallback.
   - Exibir progresso por etapa.
   - Exibir screenshots, bugs, logs e relatorio.
   - Permitir download do PDF.

6. Criar pipeline interno da demo.
   - Validar parametros.
   - Validar provider/device.
   - Analisar estado inicial.
   - Gerar cenarios.
   - Executar cenarios selecionados.
   - Capturar evidencias.
   - Classificar resultados.
   - Gerar bug cards se houver falhas.
   - Gerar relatorio final.
   - Devolver resumo para API/frontend.

7. Criar modo demo controlado.
   - Limitar quantidade de cenarios.
   - Evitar acoes destrutivas.
   - Usar massa previsivel.
   - Gerar saida bonita.
   - Priorizar estabilidade.
   - Ter fallback se algum passo falhar.

8. Criar template de relatorio comercial mobile.
   - Visao executiva.
   - Cobertura demonstrada.
   - Tempo de execucao.
   - Evidencias visuais.
   - Riscos encontrados.
   - Exemplo de bug card.
   - Potencial de automacao.
   - Proximos passos sugeridos.

9. Adaptar geracao de cenarios para demo.
   - 3 a 5 cenarios principais.
   - Linguagem clara.
   - Foco em valor percebido.
   - Evitar matriz extensa.
   - Separar cenario feliz, validacao visual, erro esperado e responsividade/performance basica.

10. Reaproveitar BKPilot-Core e BKPilot-Skills.
    - Usar `@bugkillers/bkpilot-core`.
    - Sincronizar skills mobile do `BKPilot-Skills`.
    - Nao editar skills compartilhadas diretamente no Comercial.
    - Manter `/mobile-demo` apenas no Comercial.

11. Criar validacoes comerciais automatizadas.
    - Import do Core.
    - Sync das skills.
    - Lint das skills.
    - Smoke mobile.
    - Teste da API.
    - Teste do frontend.
    - Execucao demo curta.

12. Criar fallback de demo.
    - Se Sauce Labs cair, usar farm propria.
    - Se farm falhar, usar resultado gravado/snapshot.
    - Se APK nao estiver disponivel, rodar web mobile.
    - Se video falhar, manter screenshots e relatorio.

13. Definir estrutura de artefatos da demo.
    - `mobile/reports/`
    - `mobile/screenshots/`
    - `mobile/source/`
    - `mobile/logs/`
    - relatorio `.md`
    - relatorio `.pdf`
    - resumo JSON da demo.

14. Criar `demo_summary.json`.
    - Status.
    - Provider.
    - Target.
    - Cenarios executados.
    - Bugs encontrados.
    - Screenshots.
    - Relatorio PDF.
    - Duracao.
    - Mensagem amigavel para frontend.

15. Rodar demo ponta a ponta em Sauce/farm propria.
    - Executar fluxo real.
    - Validar API.
    - Validar frontend integrado.
    - Validar artefatos.
    - Validar relatorio final.
    - Validar fallback.

## Candidatos para V1 se Houver Tempo

- Implementar adaptador real de upload automatico de APK para Sauce Labs, salvando `mobile/reports/mobile_upload_report.json`.
- Garantir que bugs mobile sejam convertidos em bug cards com evidencias antes da skill de relatorio final.
- Executar `/executar-planilha-mobile-web` e `/executar-planilha-mobile-apk` em fluxo real, nao apenas smoke.
- Documentar suporte iOS como fase futura, sem bloquear a Release 0.1.
- Documentar suporte a multiplos devices em lote como fase futura.
- Documentar Appium Grid proprio como infraestrutura futura, fora do escopo imediato.

## Uso com Farm Propria de Devices

O que ja foi criado deve funcionar com uma farm propria se ela expuser um endpoint Appium/WebDriver compativel. A implementacao atual nao e presa a Sauce Labs: o runtime mobile ja aceita Appium remoto por configuracao.

### O que ja existe para suportar farm propria

- `mobile.provider`
- `mobile.appiumUrl`
- `mobile.username`
- `mobile.accessKey`
- `mobile.capabilities`
- `mobile.options`
- `target: web|apk`
- suporte a Appium local ou remoto;
- suporte generico a device farm;
- smoke mobile via `scripts/mobile-smoke.js`;
- evidencias basicas: screenshot, source XML e state JSON;
- wrappers no Producao chamando o `BKPilot-Core`.

### Exemplo de configuracao para farm propria

```json
{
  "mobile": {
    "provider": "cloud",
    "target": "web",
    "appiumUrl": "https://sua-farm/wd/hub",
    "username": "env:MOBILE_FARM_USERNAME",
    "accessKey": "env:MOBILE_FARM_ACCESS_KEY",
    "baseUrl": "https://app.cliente.com",
    "capabilities": {
      "platformName": "Android",
      "browserName": "Chrome",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": "Android Device"
    },
    "allowedUrls": [
      "https://app.cliente.com"
    ]
  }
}
```

### O que provavelmente ja funciona

- web mobile em Chrome Android;
- criacao de sessao remota;
- captura de screenshot;
- captura de source/state;
- smoke basico;
- execucao pelas skills mobile, desde que a sessao Appium responda no padrao esperado.

### O que pode exigir adaptacao especifica da farm

- autenticacao, caso nao use basic auth ou variaveis `username`/`accessKey`;
- formato exato de capabilities exigido pela farm;
- selecao de device fixo ou dinamico;
- upload de APK;
- download de videos e logs;
- endpoint `/status`;
- capabilities especificas do fornecedor ou da infraestrutura propria;
- gerenciamento de fila e disponibilidade de devices.

### Conclusao tecnica

Para web mobile, ha boa chance de funcionar apenas com configuracao se a farm propria for compativel com Appium/WebDriver. Para APK, upload de app e artefatos avancados da farm, provavelmente sera necessario criar um adaptador especifico.

## Checklist Tecnico para V1

Estes pontos nao precisam virar novas atividades principais agora, mas devem ser usados como checklist de robustez antes de fechar a V1.

1. Versionamento e rollback
   - Se atualizar `BKPilot-Core` ou `BKPilot-Skills`, definir como voltar para a versao anterior se quebrar Producao.

2. Compatibilidade de versoes
   - Manter matriz minima de compatibilidade:
     - Node;
     - Appium;
     - Android SDK / ADB;
     - Chrome/Chromedriver;
     - UiAutomator2;
     - Sauce/farm propria.

3. Chromedriver
   - Para web mobile Android, o Chrome do device precisa ser compativel com o Chromedriver usado pelo Appium.
   - Esse ponto costuma quebrar smoke USB e farm propria.

4. Validacao de pre-requisitos
   - Avaliar um comando tipo `mobile:doctor` para validar:
     - ADB instalado;
     - device USB visivel;
     - Appium acessivel;
     - credenciais de farm presentes;
     - `.env` correto;
     - capabilities minimas.

5. Politica de retencao de artefatos
   - Videos, screenshots e XML podem crescer rapido.
   - Definir por quanto tempo manter `clients/<id>/resultado/<timestamp>/`.

6. Naming e rastreabilidade
   - Garantir que cada evidencia tenha vinculo com:
     - cliente;
     - cenario;
     - timestamp;
     - device;
     - provider;
     - sessionId.

7. Sanitizacao de source XML
   - Mascaramento nao deve cobrir apenas screenshots.
   - O XML/source tambem pode conter dados sensiveis.

8. Timeouts por tipo de operacao
   - Separar timeout de:
     - criacao de sessao;
     - carregamento de pagina;
     - busca de elemento;
     - comando Appium;
     - upload de APK;
     - download de video/log.

9. Execucao headless nao se aplica igual
   - Em mobile real/farm nao existe o mesmo conceito de headless do Playwright.
   - Evitar assumir comportamento de desktop nos fluxos mobile.

10. Falha de cleanup
    - Mobile APK pode criar dados no app/servidor e nao conseguir limpar pela UI.
    - Registrar `cleanup_log.json` tambem nos fluxos mobile.

## Governanca Operacional para V1

Estes pontos fecham o lado de processo para gestao e operacao.

1. Dono de cada repositorio
   - Definir quem pode alterar `BKPilot-Core`, `BKPilot-Skills`, `BKPilot-Producao` e `BKPilot-Comercial`.
   - Isso evita corrigir comportamento compartilhado no repositorio errado.

2. Fluxo de release
   - Ordem recomendada:
     - alterar Core;
     - taguear Core;
     - atualizar Producao/Comercial;
     - sincronizar Skills;
     - validar smoke;
     - usar em cliente somente depois da validacao.

3. Ambiente de homologacao
   - Separar claramente:
     - teste local USB;
     - farm Sauce Labs;
     - farm propria;
     - cliente real.

4. Criterio de pronto para cliente
   - Usar uma checklist curta de go/no-go:
     - relatorio final gera;
     - evidencias existem;
     - dados sensiveis mascarados;
     - cleanup registrado;
     - smoke USB ou farm passou;
     - falhas classificadas.

5. Observabilidade minima
   - Logs devem conter:
     - `sessionId`;
     - provider;
     - device;
     - target;
     - cenario;
     - timestamp.
   - Isso facilita diagnostico quando a farm falha.

6. Politica para falha de provider
   - Definir o que fazer se Sauce Labs ou farm propria cair:
     - retry;
     - trocar device;
     - rodar USB;
     - marcar como bloqueio de ambiente.

7. Documentacao de onboarding
   - Criar guia curto de como configurar um novo cliente mobile.
   - O guia deve cobrir:
     - `.env`;
     - `config.json`;
     - device/farm;
     - primeiro smoke.
