## Evidencia visual em Android TV

Toda skill `mobile-tv` deve gerar evidencia visual de cada cenario/passo/bug — regra expressa do CLAUDE.md, secao 7.1, valida tambem para TV.

### Regras especificas de TV

- Screenshots sempre em **paisagem** (a TV opera em landscape). Nao rotacionar nem cortar para retrato.
- Capturar o **foco visivel**: em UI Leanback o item focado tem borda/realce. O screenshot deve mostrar qual elemento estava focado no momento — isso prova o estado de navegacao.
- Para reproducao de video (signage): capturar pelo menos 1 frame com o video em execucao, comprovando playback. Registrar tambem `currentActivity` e estado de reproducao.
- Falhas criticas (app travado, tela preta, perda de conexao): capturar video MP4 alem do screenshot.

### Onde salvar

```
clients/<id>/resultado/<timestamp>/screenshots/   <- PNG por passo/cenario/bug (paisagem)
clients/<id>/resultado/<timestamp>/videos/        <- MP4 (falhas criticas, fluxos longos)
clients/<id>/resultado/<timestamp>/mobile/sources/ <- XML de source por tela
```

### Nomeacao

- Cenario: `<cenario>_<passo>_<timestamp>.png`
- Bug retestado: `JBUG-<ID>_reteste_<descricao>.png`
- Estado de reproducao: `playback_<dispositivo>_<timestamp>.png`

### Gate

Antes de marcar cenario como Passou/Falhou/Corrigido, verificar que o arquivo de evidencia existe em disco. Se nao existe, voltar e capturar. Evidencia faltante vira pendencia explicita no relatorio — silencio nao e aceitavel.
