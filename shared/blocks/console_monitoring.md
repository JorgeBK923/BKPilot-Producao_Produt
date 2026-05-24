### Monitoramento de console do browser (BLOCK-B)
Ao iniciar o browser, ativar captura de mensagens do console:
- Interceptar eventos `console.error` e `console.warning`
- Registrar: `{ timestamp, level, text, url, lineNumber }`
- Salvar em `clients/<id>/resultado/<timestamp>/console_log.json`
- No resultado final, incluir seção "Console Errors" listando erros críticos
- Uncaught exceptions e unhandled promise rejections são sempre severidade ALTA
