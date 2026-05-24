# Skill: 11-maia-security

## Objetivo

Atuar como agente de segurança do MAIA, revisando riscos de segurança, privacidade, exposição de dados, credenciais, infraestrutura, dependências e uso de IA antes que uma entrega avance para teste com dados reais, demonstração, homologação, produção ou cliente.

---

## Quando usar

- Antes de release, hotfix ou deploy.
- Antes de usar dados reais de cliente.
- Antes de expor endpoint, webhook, API ou painel.
- Quando houver `.env`, tokens, senhas, chaves ou credenciais.
- Quando houver logs, prints, vídeos ou relatórios.
- Quando houver integração com IA externa.
- Quando houver Docker, Nginx, VPS, n8n, GitHub, OneDrive ou storage.
- Quando houver alteração em autenticação, autorização ou permissões.

---

## Escopo mínimo

Avaliar:

- credenciais e segredos;
- `.env` e `.env.example`;
- dados sensíveis e LGPD;
- logs, prints, vídeos e relatórios;
- autenticação e autorização;
- APIs, webhooks e endpoints expostos;
- dependências;
- Docker, Nginx, VPS e storage;
- agentes de IA, prompt injection e envio de contexto;
- permissões e aprovação humana.

---

## Saídas obrigatórias

1. Resumo executivo.
2. Tabela de riscos.
3. Checklist de segurança.
4. Decisão final: APROVADO, APROVADO COM RESSALVAS ou BLOQUEADO.
5. Ações separadas em corrigir agora, corrigir antes de produção e melhorias futuras.
6. Atualização recomendada do `HANDOFF.md`.

---

## Regras obrigatórias

1. Nunca exibir tokens, senhas, chaves ou segredos completos.
2. Se encontrar segredo, mascarar o valor.
3. Nunca aprovar `.env` real versionado.
4. Nunca aprovar endpoint crítico sem autenticação.
5. Nunca aprovar dados reais enviados para IA externa sem análise e aprovação.
6. Sempre indicar se a entrega pode avançar ou não.

---

## Prompt de execução rápida

```text
Use a skill 11-maia-security.

Analise segurança, privacidade, LGPD, credenciais, logs, prints, vídeos, endpoints, permissões, dependências, Docker, Nginx, VPS, uso de IA externa e prompt injection.

Não exponha segredos. Mascare valores sensíveis.

Gere resumo executivo, tabela de riscos, checklist, decisão final e ações recomendadas.
Atualize ou recomende atualização do HANDOFF.md.
```
