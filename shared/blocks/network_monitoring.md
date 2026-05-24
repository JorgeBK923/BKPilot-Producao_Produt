### Monitoramento de requisições de rede (BLOCK-C)
Ao iniciar o browser, ativar interceptação de rede:
- Registrar requisições com status >= 400 (erros HTTP)
- Registrar requisições que levaram mais de 3000ms (lentas)
- Registrar requisições que falharam (timeout, DNS, conexão recusada)
- Formato: `{ timestamp, method, url, status, duration_ms, size_bytes, error }`
- Salvar em `clients/<id>/resultado/<timestamp>/network_log.json`
- No resultado final, incluir seção "Network Issues" com erros 5xx e requisições lentas
- Muitos erros 5xx consecutivos devem gerar alerta no resumo
