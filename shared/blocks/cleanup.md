### Cleanup de dados de teste (BLOCK-E)
Ao final da execução, realizar limpeza dos dados criados durante os testes:
- Manter registro de cada dado criado: `{ item, tipo, url }`
- Tentar reverter: excluir registros via interface (botão excluir) ou API se disponível
- Registrar resultado: `{ item, tipo, url, status: "limpo|pendente", motivo }`
- Salvar em `clients/<id>/resultado/<timestamp>/cleanup_log.json`
- No resultado final, incluir seção "Cleanup de Dados"
- Se cleanup não for possível: registrar como pendência para o QA resolver manualmente
