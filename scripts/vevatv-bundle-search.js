#!/usr/bin/env node
'use strict';

const BASE = 'https://app-hml.vevatv.com.br';
const TERMS = /signInWithPassword|signIn|password|email|Entrar|credentials|handleSubmit|isValid|isSubmitting|disabled/gi;

async function main() {
  const html = await fetch(`${BASE}/auth/custom/sign-in`).then((res) => res.text());
  const scripts = Array.from(html.matchAll(/src="([^"]+\.js)"/g)).map((match) => match[1]);
  for (const script of scripts) {
    if (!/app\/auth\/custom\/sign-in\/page/.test(script)) continue;
    const url = script.startsWith('http') ? script : `${BASE}${script}`;
    const body = await fetch(url).then((res) => res.text()).catch(() => '');
    const moduleStart = body.indexOf('667:function');
    if (moduleStart !== -1) {
      console.log(`--- module 667 ${script}`);
      console.log(body.slice(moduleStart, moduleStart + 900).replace(/\s+/g, ' '));
    }
    const matches = Array.from(body.matchAll(/667:function|UF:function|cS:function|db0257940a8c8b29bde574|5bbc59bfeade513d95d72ced2ac9facf0511b06d|signInWithPassword|signIn|password|email|credentials|handleSubmit|isValid|isSubmitting|disabled/gi)).slice(0, 80);
    if (!matches.length) continue;
    console.log(`--- ${script}`);
    for (const match of matches.slice(0, 30)) {
      const start = Math.max(0, match.index - 120);
      const end = Math.min(body.length, match.index + 220);
      console.log(body.slice(start, end).replace(/\s+/g, ' '));
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
