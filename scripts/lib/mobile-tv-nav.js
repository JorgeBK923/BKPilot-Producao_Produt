'use strict';

// Navegacao Leanback (Android TV) via Appium.
// App de TV nao tem toque: navega-se por foco usando o D-pad do controle remoto.
// Este modulo e generico — opera sobre qualquer instancia de MobileAppiumClient
// (BKPilot-Core) que exponha o metodo de baixo nivel `appium(method, suffix, body)`.

const KEYCODES = Object.freeze({
  up: 19,
  down: 20,
  left: 21,
  right: 22,
  center: 23,
  enter: 66,
  back: 4,
  home: 3,
  menu: 82,
  mediaPlayPause: 85,
  mediaPlay: 126,
  mediaPause: 127
});

const DIRECTIONS = ['up', 'down', 'left', 'right'];

function requireSession(client) {
  if (!client || typeof client.appium !== 'function') {
    throw new Error('mobile-tv-nav requires a MobileAppiumClient with appium()');
  }
  if (!client.sessionId) {
    throw new Error('No active Appium session. Call startSession first.');
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Envia um keycode bruto N vezes, com pausa de assentamento entre cada tecla.
async function pressKey(client, keycode, { repeat = 1, settleMs = 250 } = {}) {
  requireSession(client);
  const code = typeof keycode === 'string' ? KEYCODES[keycode] : keycode;
  if (!Number.isInteger(code)) throw new Error(`Unknown keycode: ${keycode}`);
  for (let i = 0; i < Math.max(1, repeat); i++) {
    await client.appium('POST', `/session/${client.sessionId}/appium/device/press_keycode`, { keycode: code });
    if (settleMs > 0) await delay(settleMs);
  }
  return { keycode: code, repeat };
}

function dpad(client, direction, opts = {}) {
  if (!DIRECTIONS.includes(direction)) throw new Error(`Invalid D-pad direction: ${direction}`);
  return pressKey(client, KEYCODES[direction], opts);
}

const select = (client, opts) => pressKey(client, KEYCODES.center, opts);
const back = (client, opts) => pressKey(client, KEYCODES.back, opts);
const home = (client, opts) => pressKey(client, KEYCODES.home, opts);

// Le o XML da tela atual.
async function getSource(client) {
  requireSession(client);
  const raw = await client.appium('GET', `/session/${client.sessionId}/source`);
  return typeof raw === 'string' ? raw : (raw && raw.value) || '';
}

function attr(nodeXml, name) {
  const match = nodeXml.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : '';
}

// Extrai o elemento atualmente focado (focused="true") do XML da tela.
function parseFocused(sourceXml) {
  if (!sourceXml) return null;
  const idx = sourceXml.indexOf('focused="true"');
  if (idx === -1) return null;
  const open = sourceXml.lastIndexOf('<', idx);
  const close = sourceXml.indexOf('>', idx);
  if (open === -1 || close === -1) return null;
  const node = sourceXml.slice(open, close + 1);
  return {
    class: attr(node, 'class'),
    text: attr(node, 'text'),
    contentDesc: attr(node, 'content-desc'),
    resourceId: attr(node, 'resource-id'),
    bounds: attr(node, 'bounds')
  };
}

async function getFocused(client) {
  return parseFocused(await getSource(client));
}

function focusMatches(focused, target) {
  if (!focused || !target) return false;
  const needle = String(target).trim().toLowerCase();
  return [focused.text, focused.contentDesc, focused.resourceId]
    .filter(Boolean)
    .some((value) => value.trim().toLowerCase().includes(needle));
}

// Caminha pelo D-pad ate o elemento com `target` (texto, content-desc ou id)
// ganhar foco. Bounded por maxSteps — nunca entra em loop infinito.
// `axis` define o eixo de varredura: 'vertical' (default) ou 'horizontal'.
async function navigateToFocused(client, target, { axis = 'vertical', maxSteps = 25, settleMs = 300 } = {}) {
  requireSession(client);
  const forward = axis === 'horizontal' ? 'right' : 'down';
  const reverse = axis === 'horizontal' ? 'left' : 'up';

  let focused = await getFocused(client);
  if (focusMatches(focused, target)) return { found: true, steps: 0, focused };

  const seen = new Set();
  for (let step = 1; step <= maxSteps; step++) {
    await dpad(client, forward, { settleMs });
    focused = await getFocused(client);
    if (focusMatches(focused, target)) return { found: true, steps: step, focused };
    const fingerprint = focused ? `${focused.resourceId}|${focused.text}|${focused.bounds}` : `null-${step}`;
    if (seen.has(fingerprint)) break; // foco nao mudou — fim da lista
    seen.add(fingerprint);
  }
  // tentativa no sentido reverso, caso o foco inicial nao fosse o topo
  for (let step = 1; step <= maxSteps; step++) {
    await dpad(client, reverse, { settleMs });
    focused = await getFocused(client);
    if (focusMatches(focused, target)) return { found: true, steps: -step, focused };
  }
  return { found: false, steps: maxSteps, focused };
}

// Navega ate `target` e aciona (D-pad center).
async function activate(client, target, opts = {}) {
  const result = await navigateToFocused(client, target, opts);
  if (!result.found) throw new Error(`Leanback focus target not reachable: "${target}"`);
  await select(client, { settleMs: opts.settleMs || 300 });
  return result;
}

module.exports = {
  KEYCODES,
  pressKey,
  dpad,
  select,
  back,
  home,
  getSource,
  parseFocused,
  getFocused,
  focusMatches,
  navigateToFocused,
  activate
};
