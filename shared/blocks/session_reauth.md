### Re-autenticação de sessão (BLOCK-D)
Durante a execução, monitorar sinais de sessão expirada:
- Redirecionamento inesperado para página de login
- Resposta HTTP 401 ou 403 em requisição autenticada
- Presença de modal ou banner de "sessão expirada" na página

Se detectado:
1. Registrar evento: `{ timestamp, url, motivo }`
2. Re-autenticar usando as credenciais originais (--login + QA_PASSWORD)
3. Retornar à página/ação onde a sessão expirou
4. Continuar execução normalmente
5. Incluir contagem de re-autenticações no resumo final
