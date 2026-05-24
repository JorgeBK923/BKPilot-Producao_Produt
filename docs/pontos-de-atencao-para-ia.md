# Pontos de atenção para IA

## Atualização mobile Appium/MCP

Estes pontos foram identificados após a atualização do commit `e9a7980` (`Adiciona suporte mobile Appium MCP`). Em seguida, a arquitetura foi ajustada para extrair o runtime mobile compartilhado para o `BKPilot-Core`.

Status geral:
- Pontos 1, 2 e 3 foram tratados na extração para o Core `v0.2.0`.
- Pontos 4 e 5 continuam pendentes porque pertencem a um script antigo de documentação comercial/frontend.

## 1. Smoke test pode consultar o Appium errado em farm remoto

Em `scripts/mobile-smoke.js`, o smoke chama `client.status()` antes de `client.startSession()`.

O problema é que `client.status()` usa `this.appiumUrl`, que ainda está no valor padrão local (`http://127.0.0.1:4723`) antes da sessão inicializar. Se o cliente estiver configurado para farm remoto em `clients/<id>/config.json`, o smoke pode falhar consultando o Appium local mesmo com a configuração remota correta.

Arquivos envolvidos:
- `scripts/mobile-smoke.js`
- `scripts/lib/mobile-appium-client.js`

Recomendação:
- Antes de chamar `status()`, aplicar no client o `appiumUrl` e `auth` resolvidos por `resolveProviderConfig()`, ou criar um método `status(providerConfig)` que receba explicitamente a URL/auth.

## 2. Builder de capabilities pode enviar campos internos ao Appium

Em `scripts/lib/mobile-appium-client.js`, `buildCapabilities()` mistura `mobile.capabilities` com o objeto `mobile` inteiro.

Ele remove alguns campos (`target`, `baseUrl`, `provider`, `appiumUrl`, `username`, `accessKey`, etc.), mas não remove campos internos como:

- `security`
- `allowedUrls`
- `allowedAppPackages`
- `sensitiveFields`
- `mode`

Esses campos podem virar capabilities `appium:*` e serem enviados ao Appium ou a um provider remoto. Isso pode causar sessão inválida, comportamento inesperado ou exposição de política interna.

Arquivo envolvido:
- `scripts/lib/mobile-appium-client.js`

Recomendação:
- Separar configuração operacional de capabilities Appium.
- Montar capabilities somente a partir de `mobile.capabilities` e overrides explícitos aceitos.
- Remover/ignorar todos os campos de governança e política antes de gerar `alwaysMatch`.

## 3. `startSession` retorna capabilities sem redaction

O log de sessão usa `redact()`, mas o retorno de `startSession()` expõe `this.capabilities` diretamente.

Se algum provider devolver dados sensíveis em capabilities, o MCP pode retornar isso ao agente/IA sem mascaramento.

Arquivo envolvido:
- `scripts/lib/mobile-appium-client.js`

Recomendação:
- Retornar `capabilities: redact(this.capabilities)` em `startSession()`.
- Manter dados completos apenas internamente, se realmente forem necessários.

## 4. Script antigo aponta para documento removido

O arquivo `scripts/gerar_mvp_doc.js` ainda gera por padrão:

```text
documentacao_projeto/MVP_BKPilot_Frontend.pdf
```

Esse PDF foi removido no commit mobile. O script parece ser resíduo do fluxo comercial/frontend antigo.

Arquivo envolvido:
- `scripts/gerar_mvp_doc.js`

Recomendação:
- Decidir se o script ainda pertence ao Producao.
- Se não pertencer, remover ou arquivar.
- Se pertencer, atualizar o destino padrão e o conteúdo para refletir a arquitetura atual.

## 5. Encoding quebrado em script antigo

`scripts/gerar_mvp_doc.js` contém textos com encoding quebrado, por exemplo `pÃ¡gina`, `nÃ£o`, `â€”`.

Isso não afeta diretamente as novas skills mobile, mas pode gerar PDF com texto corrompido se o script for usado.

Arquivo envolvido:
- `scripts/gerar_mvp_doc.js`

Recomendação:
- Corrigir encoding para UTF-8.
- Revisar se o conteúdo ainda deve existir neste repositório, considerando a separação Producao/Comercial.
