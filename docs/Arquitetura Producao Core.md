# Arquitetura BKPilot Producao e Core

## Objetivo

Este documento registra o primeiro corte tecnico para preparar o projeto `BKPilot` para virar `BKPilot-Producao`.

A decisao arquitetural e manter tres projetos separados:

```text
BKPilot-Comercial   -> front, back, demo e skills comerciais
BKPilot-Core        -> biblioteca compartilhada
BKPilot-Producao    -> rotinas e skills operacionais
```

A pasta atual `BKPilot` continua com o nome local antigo por enquanto, mas deve ser tratada como o futuro `BKPilot-Producao`.

## Estado atual

Em 2026-05-07 foi criado o repositorio GitHub:`n`n```text`nhttps://github.com/JorgeBK923/BKPilot-Core`n```

O `package.json` do projeto agora consome:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.0"
```

Os modulos compartilhados iniciais foram movidos para esse pacote GitHub:

- `browser`;
- `client`;
- `env`;
- `evidence`;
- `logger`;
- `paths`.

Na versao `v0.2.0`, o Core tambem passa a concentrar o runtime mobile compartilhado:

- `mobile-appium-client`;
- `mobile-device-manager`;
- `mobile-mcp`.

Os consumidores Producao e Comercial devem manter apenas wrappers finos para esses modulos e suas skills operacionais/comerciais.

Os arquivos antigos em `core/*.js` foram mantidos como wrappers de compatibilidade. Assim, imports antigos continuam funcionando, mas a implementacao comum passa a morar no pacote `@bugkillers/bkpilot-core`.

## O que continua no Producao

Continuam neste projeto:

- `src/` com as skills operacionais;
- `converter/` e `dist/`;
- `clients/` e fluxos de cliente;
- `cenarios/` operacionais;
- documentacao e regras especificas de operacao;
- integracoes e automacoes que nao pertencem ao Comercial.

Nao devem entrar aqui:

- front-end comercial;
- back-end/API da demo comercial;
- skill `/demo-comercial`;
- relatorio comercial;
- fluxo `demo_mvp`;
- textos e artefatos de venda.

## Validacao executada

Este projeto nao possui suite `npm test` configurada. A validacao feita foi um smoke test de importacao do pacote GitHub e dos wrappers legados:

```text
node -e "..."
smoke-ok
```

Tambem foi validado que `require('./core/client')` continua funcionando via wrapper e que `require('@bugkillers/bkpilot-core/client')` funciona como dependencia npm local.

## Proximos passos

1. Renomear conceitualmente o repositorio GitHub `BKPilot` para `BKPilot-Producao`, quando o worktree estiver limpo.
2. manter o repositorio separado `BKPilot-Core`.
3. Publicar/taguear o Core, por exemplo `v1.0.0`.
4. Trocar a dependencia local:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v0.2.0"
```

por:

```json
"@bugkillers/bkpilot-core": "github:JorgeBK923/BKPilot-Core#v1.0.0"
```

5. Rodar smoke tests e validacoes operacionais do Producao.
6. So depois remover wrappers antigos, se nao houver mais imports legados.
