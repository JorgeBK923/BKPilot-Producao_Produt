## Preflight de rede/VPN antes do browser

Antes de abrir Playwright MCP, executar:

```bash
npm run preflight:vpn -- --client <id>
```

Use o `--cliente <id>` informado na skill. Se a URL vier por argumento e ainda nao estiver no `config.json`, executar:

```bash
npm run preflight:vpn -- --client <id> --url <URL>
```

Regra de bloqueio:
- Se o preflight retornar exit code diferente de 0, PARAR antes de navegar.
- Registrar o diagnostico no resultado da execucao e orientar a correcao indicada pelo script.
- Nao marcar o sistema do cliente como indisponivel sem anexar o resumo do preflight.

O preflight valida DNS, TCP 443, `fetch` do Node, Chromium Playwright, proxy configurado, adaptadores VPN e dicas de rota (`vpnRouteHints`). Isso evita falso negativo quando o Chrome manual acessa, mas `node.exe`/Chromium do BKPilot nao herdaram VPN, proxy ou firewall.
