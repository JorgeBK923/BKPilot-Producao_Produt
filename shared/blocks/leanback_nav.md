## Navegacao Leanback (Android TV)

App de Android TV nao tem toque. A navegacao e feita por **foco** usando o D-pad do controle remoto. `tap` por coordenada ou por elemento NAO funciona de forma confiavel em UI Leanback — usar sempre o helper `scripts/lib/mobile-tv-nav.js`.

### Regras

- Nunca usar `client.tap()` em tela Leanback. Mover o foco com D-pad e acionar com `select` (KEYCODE_DPAD_CENTER, 23).
- O elemento alvo e identificado pelo no com `focused="true"` no source XML.
- Toda varredura de foco e **limitada** (`maxSteps`) — nunca laco infinito. Se o alvo nao for alcancado, registrar falha com screenshot do estado atual.
- Entre cada tecla, respeitar `settleMs` (padrao 250-300ms) para a UI assentar o foco.
- Entrada de texto: nao ha teclado fisico. Usar `adb shell input text` ou o fluxo de pareamento via celular. Nunca digitar caractere a caractere por D-pad.

### API do helper

```js
const nav = require('./scripts/lib/mobile-tv-nav');

await nav.dpad(client, 'down');                 // move foco
await nav.select(client);                       // aciona item focado
await nav.back(client);                         // KEYCODE_BACK
await nav.home(client);                         // KEYCODE_HOME
const focused = await nav.getFocused(client);   // elemento focado atual
await nav.navigateToFocused(client, 'Reproduzir');   // caminha ate o alvo
await nav.activate(client, 'Reproduzir');            // navega + aciona
```

`navigateToFocused` aceita `{ axis: 'vertical'|'horizontal', maxSteps, settleMs }`. O match e por `text`, `content-desc` ou `resource-id` (substring, case-insensitive).

### Teclas de midia

Para validar reproducao de video de signage: `nav.pressKey(client, 'mediaPlayPause')`, `'mediaPlay'`, `'mediaPause'`.
