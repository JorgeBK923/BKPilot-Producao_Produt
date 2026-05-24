# MAIA Skill Pack v2 — Atualizado

Este pacote transforma o MAIA em um conjunto prático de skills para uso com Codex, Claude Code, OpenCode, Blackbox ou qualquer agente de IA.

## Ideia central

```text
MAIA = método
Skills = execução prática do método
HANDOFF.md = passagem de bastão entre IAs
```

## Skills oficiais

| Ordem | Skill | Função |
|---|---|---|
| 01 | `maia-diagnostico` | Entender o estado atual do projeto |
| 02 | `maia-especificacao` | Transformar demanda em requisitos claros |
| 03 | `maia-planejamento` | Quebrar o trabalho em etapas executáveis |
| 04 | `maia-arquitetura` | Definir/validar arquitetura e decisões técnicas |
| 05 | `maia-harness` | Preparar o projeto para uso com IA |
| 06 | `maia-implementacao` | Executar a mudança controlada |
| 07 | `maia-qa-validacao` | Validar comportamento funcional e regressão |
| 08 | `maia-review` | Revisar a entrega de forma consolidada |
| 09 | `maia-release` | Preparar entrega, versionamento e comunicação |
| 10 | `maia-memoria` | Registrar decisões, aprendizados e atualizar HANDOFF |
| 11 | `maia-security` | Validar segurança, dados, credenciais, LGPD e IA |
| 12 | `maia-code-validator` | Validar tecnicamente código gerado por IA |

## Fluxo recomendado

```text
01-maia-diagnostico
        ↓
02-maia-especificacao
        ↓
03-maia-planejamento
        ↓
04-maia-arquitetura
        ↓
05-maia-harness
        ↓
06-maia-implementacao
        ↓
12-maia-code-validator
        ↓
07-maia-qa-validacao
        ↓
11-maia-security
        ↓
08-maia-review
        ↓
09-maia-release
        ↓
10-maia-memoria
```

## Regra oficial do HANDOFF.md

O `HANDOFF.md` é o arquivo oficial de passagem de contexto entre IAs, CLIs e modelos.

Toda skill deve atualizar o `HANDOFF.md` antes de encerrar, incluindo:

- status atual;
- o que foi feito;
- arquivos alterados;
- decisões tomadas;
- pendências;
- riscos;
- comandos executados;
- resultados reais;
- próxima skill recomendada;
- próxima IA/CLI recomendada.

## Validação em camadas

```text
maia-code-validator
= o código compila, respeita contratos e não tem alucinação?

maia-qa-validacao
= a funcionalidade atende o comportamento esperado?

maia-security
= a entrega está segura para dados, credenciais, IA e ambiente?

maia-review
= a entrega inteira está coerente, documentada e pronta?
```

## Definition of Done do MAIA

Uma tarefa só pode ser considerada concluída quando:

- [ ] escopo entendido;
- [ ] requisitos claros;
- [ ] plano executável;
- [ ] arquitetura respeitada;
- [ ] implementação concluída;
- [ ] código validado tecnicamente;
- [ ] QA funcional executado;
- [ ] segurança avaliada quando aplicável;
- [ ] review final feito;
- [ ] documentação atualizada;
- [ ] HANDOFF.md atualizado;
- [ ] pendências separadas de bloqueadores;
- [ ] riscos registrados.
