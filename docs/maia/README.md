# docs/maia — Rastreabilidade MAIA do BKPilot-Producao

Esta pasta concentra a memória operacional do framework **MAIA** aplicada a este repositório.

## Estrutura

```
docs/maia/
├── README.md                  ← este arquivo
├── handoffs/                  ← HANDOFFs arquivados (histórico, nunca apagar)
├── 01-diagnostico/            ← saídas da skill 01-maia-diagnostico
├── 10-memoria/                ← registros de memória / reconciliação
└── [outras 0X-*]              ← criar sob demanda quando a skill correspondente rodar
```

## Regra de ouro

> O `HANDOFF.md` da **raiz** é sempre o **vivo**.
> Quando um HANDOFF é encerrado e substituído, ele é **movido** para `handoffs/` com nome `HANDOFF-YYYY-MM-DD-<ciclo>-<resumo>.md`.
> **Nunca apagar** um handoff arquivado.

## Relação com o BKPilot-Core

Este repo consome `@bugkillers/bkpilot-core` (`package.json`). Trabalhos sobre o runtime mobile compartilhado (Appium client, device manager, MCP mobile, upload APK, redação de screenshot etc.) pertencem ao **Core**, não a este repo.

Quando um HANDOFF descrever trabalho no runtime mobile, ele deve viver no repo Core. Aqui só ficam:

- HANDOFFs sobre o produto Producao (skills `.claude/commands/`, conversor, multi-tenant, distribuição multi-CLI, scripts operacionais);
- referências/índices apontando para artefatos MAIA do Core, quando relevante.

## Skills oficiais

Ver `docs/maia-skill-pack/README.md` — 12 skills, fluxo recomendado e Definition of Done.
