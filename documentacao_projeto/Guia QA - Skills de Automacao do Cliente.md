# Guia Pratico QA - Automacao do Cliente com OrangeHRM

Versao 1.2 - Abril 2026

Este guia ensina o QA a testar o fluxo de automacao do BKPilot usando o site demo do OrangeHRM:

```text
https://opensource-demo.orangehrmlive.com/
```

O objetivo e sair do zero, criar a pasta de um novo cliente, configurar login, rodar exploracao, gerar cenarios, avaliar viabilidade, gerar codigo de automacao e auditar o pacote final.

## 1. Fluxo Completo

```text
1. Criar o cliente orangehrm
2. Configurar senha em clients/orangehrm/.env
3. Ajustar clients/orangehrm/config.json
4. Ajustar clients/orangehrm/login.js
5. Rodar /explorar
6. Rodar /gerar-cenarios
7. Rodar /plano-automacao
8. Rodar /gerar-automacao-cliente
9. Rodar /auditar-automacao-cliente
10. Revisar e compactar o pacote gerado
```

Estrutura esperada:

```text
clients/orangehrm/
  .env
  config.json
  login.js
  estado/
  resultado/
  entregaveis/automacao/<stack>/
```

Todos os artefatos do cliente ficam dentro de `clients/orangehrm/`. Nao crie `resultado/`, `estado/` ou `entregaveis/` na raiz para este teste.

## 2. Dados do Teste

```text
Cliente id: orangehrm
Nome: OrangeHRM Demo
URL: https://opensource-demo.orangehrmlive.com/
Login: Admin
Senha: configurar em clients/orangehrm/.env como QA_PASSWORD
Stack de automacao: playwright-ts
```

Nao passe senha no comando. A senha sempre fica em `clients/<id>/.env`.

## 3. Preparar o Projeto

Entre na pasta do BKPilot.

Linux, macOS, Git Bash ou WSL:

```bash
cd /caminho/do/BKPilot
```

Windows PowerShell:

```powershell
cd "C:\Users\Jorge\Downloads\Estudos Desenvolvimento IA\BKPilot"
```

Confira se voce esta na pasta correta:

```bash
ls
```

Voce deve ver:

```text
AGENTS.md
CLAUDE.md
README.md
package.json
src/
.claude/
clients/
cenarios/
```

Se for a primeira vez usando a maquina:

```bash
bash setup.sh
```

No Windows, rode scripts `.sh` pelo Git Bash ou WSL.

## 4. Criar o Cliente OrangeHRM

Execute:

```bash
./novo-cliente.sh orangehrm --nome "OrangeHRM Demo" --url https://opensource-demo.orangehrmlive.com/
```

O script cria:

```text
clients/orangehrm/.env
clients/orangehrm/config.json
clients/orangehrm/login.js
clients/orangehrm/estado/
clients/orangehrm/resultado/
clients/orangehrm/entregaveis/
clients/orangehrm/flows/
clients/orangehrm/cenarios/
clients/orangehrm/fixtures/
clients/orangehrm/scripts/
```

Confira:

```bash
ls clients/orangehrm
```

Se o cliente ja existir, o script bloqueia para nao sobrescrever.

## 5. Configurar a Senha

Abra:

```text
clients/orangehrm/.env
```

Preencha:

```env
QA_PASSWORD=admin123
```

Ao executar as skills, voce vai passar apenas `--login Admin`. A senha sera lida de `QA_PASSWORD`.

Confira se o arquivo existe:

```bash
ls -la clients/orangehrm/.env
```

Evite mostrar o conteudo do `.env` em terminal compartilhado.

## 6. Ajustar `config.json`

Abra:

```text
clients/orangehrm/config.json
```

Use:

```json
{
  "id": "orangehrm",
  "nome": "OrangeHRM Demo",
  "baseUrl": "https://opensource-demo.orangehrmlive.com/",
  "timeout_ms": 30000,
  "max_paginas": 80,
  "envPassword": "QA_PASSWORD",
  "postLoginSelector": ".oxd-sidepanel",
  "loginMaxAttempts": 3,
  "defaultFlow": "",
  "defaultRetesteFlow": ""
}
```

O `postLoginSelector` aponta para algo que aparece depois do login. No OrangeHRM, `.oxd-sidepanel` representa a barra lateral autenticada.

## 7. Ajustar `login.js`

Abra:

```text
clients/orangehrm/login.js
```

Substitua o skeleton por:

```js
module.exports = async function login(page, { email, password, config, log = () => {} }) {
  const baseUrl = config.baseUrl;
  const maxAttempts = config.loginMaxAttempts || 3;
  const postLoginSelector = config.postLoginSelector || '.oxd-sidepanel';

  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(baseUrl, { waitUntil: 'commit', timeout: 45000 });
      await page.getByPlaceholder('Username').waitFor({ timeout: 30000 });
      await page.getByPlaceholder('Username').fill(email);
      await page.getByPlaceholder('Password').fill(password);
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForSelector(postLoginSelector, { timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      return;
    } catch (e) {
      lastErr = e;
      log(`Login tentativa ${attempt} falhou: ${(e.message || '').slice(0, 120)}`);
    }
  }

  throw lastErr || new Error(`Login falhou em ${maxAttempts} tentativas`);
};
```

Valide:

```bash
node --check clients/orangehrm/login.js
```

## 8. Abrir a CLI

Dentro da pasta do projeto:

```bash
claude
```

Os slash commands abaixo sao digitados dentro da CLI.

## 9. Rodar `/explorar`

Execute:

```text
/explorar --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin
```

A skill deve:

- autenticar com `Admin` e `QA_PASSWORD`;
- navegar pelo sistema;
- mapear paginas, menus e fluxos;
- capturar elementos;
- detectar endpoints;
- registrar console e rede;
- salvar artefatos dentro de `clients/orangehrm/`.

Arquivos esperados:

```text
clients/orangehrm/estado/mapa.md
clients/orangehrm/estado/fluxos.md
clients/orangehrm/estado/elementos.json
clients/orangehrm/estado/api_endpoints.json
clients/orangehrm/estado/screenshots/
clients/orangehrm/resultado/<timestamp>/console_log.json
clients/orangehrm/resultado/<timestamp>/network_log.json
clients/orangehrm/resultado/<timestamp>/cleanup_log.json
clients/orangehrm/resultado/<timestamp>/cobertura.md
```

Confira no terminal:

```bash
ls clients/orangehrm/estado
ls clients/orangehrm/resultado
```

## 10. Rodar Exploracao Delta

Depois da primeira exploracao:

```text
/explorar --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin --delta clients/orangehrm/estado/mapa.md
```

Use delta para validar mudancas sem refazer tudo.

## 11. Rodar Exploracao por Escopo

Para testar uma area especifica:

```text
/explorar --cliente orangehrm https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList --login Admin --escopo "PIM e cadastro de funcionarios"
```

Escopos uteis:

```text
Admin e usuarios
PIM e cadastro de funcionarios
Leave e solicitacoes de ausencia
Time e apontamento
Recruitment e candidatos
Performance e avaliacoes
Dashboard
```

## 12. Rodar `/gerar-cenarios`

Depois que `clients/orangehrm/estado/` estiver preenchido:

```text
/gerar-cenarios --cliente orangehrm --formato gherkin
```

Para focar em PIM:

```text
/gerar-cenarios --cliente orangehrm --formato gherkin --modulo "PIM"
```

Confira:

```bash
ls cenarios
```

## 13. Rodar `/plano-automacao`

Antes de gerar codigo:

```text
/plano-automacao --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin --stack playwright-ts --dominio "HRMS demo com modulos Admin, PIM, Leave, Time, Recruitment e Dashboard"
```

Para testar uma entrega menor:

```text
/plano-automacao --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin --stack playwright-ts --modulo-core "PIM" --dominio "Gestao de funcionarios no OrangeHRM"
```

Use o resultado para decidir se a automacao deve cobrir tudo ou somente um modulo inicial.

## 14. Rodar `/gerar-automacao-cliente`

Gerar pacote completo:

```text
/gerar-automacao-cliente --cliente orangehrm --stack playwright-ts
```

Gerar somente PIM:

```text
/gerar-automacao-cliente --cliente orangehrm --stack playwright-ts --modulo "PIM"
```

Saida esperada:

```text
clients/orangehrm/entregaveis/automacao/playwright-ts/
```

Arquivos esperados:

```text
especificacao_automacao.json
mapeamento_cenarios.md
mapeamento_cenarios.pdf
codigo/
README_automacao.md
README_automacao.pdf
cobertura_automacao.md
cobertura_automacao.pdf
pendencias.md
pendencias.pdf
inventario_arquivos.md
inventario_arquivos.pdf
auditoria_codigo.md
auditoria_codigo.pdf
resumo_geracao.md
resumo_geracao.pdf
```

Confira:

```bash
find clients/orangehrm/entregaveis/automacao/playwright-ts -maxdepth 4 -type f | sort
```

Leia:

```bash
sed -n '1,180p' clients/orangehrm/entregaveis/automacao/playwright-ts/resumo_geracao.md
sed -n '1,180p' clients/orangehrm/entregaveis/automacao/playwright-ts/cobertura_automacao.md
sed -n '1,180p' clients/orangehrm/entregaveis/automacao/playwright-ts/pendencias.md
```

## 15. Rodar `/auditar-automacao-cliente`

A auditoria deve ser feita por agente, modelo ou instancia independente de quem gerou o codigo.

Execute:

```text
/auditar-automacao-cliente --cliente orangehrm --stack playwright-ts
```

Para auditar PIM:

```text
/auditar-automacao-cliente --cliente orangehrm --stack playwright-ts --modulo "PIM"
```

Se houver mais de uma geracao, use `--origem` com o `geracao_id` interno correto:

```text
/auditar-automacao-cliente --cliente orangehrm --stack playwright-ts --origem auto-orangehrm-playwright-ts-2026-04-27_1530
```

Resultado esperado:

```text
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.md
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/correcoes_auditoria.md
clients/orangehrm/entregaveis/automacao/playwright-ts/correcoes_auditoria.pdf
```

Leia:

```bash
sed -n '1,240p' clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.md
```

## 16. Interpretar a Auditoria

`aprovado`: pacote coerente, rastreavel e sem finding tecnico relevante.

`aprovado com ressalvas`: pacote aproveitavel, mas com riscos documentados.

`reprovado`: existe erro que gera retrabalho, como sintaxe quebrada, import invalido, metodo inexistente, teste sem assert util, pseudo-codigo ou cobertura enganosa.

`bloqueado`: a auditoria nao pode prosseguir por governanca, pacote incompleto ou falta de segregacao.

## 17. Checklist Final

- [ ] `clients/orangehrm/` existe.
- [ ] `clients/orangehrm/.env` existe e tem `QA_PASSWORD`.
- [ ] senha nao foi passada em comando.
- [ ] `clients/orangehrm/config.json` tem `baseUrl` e `postLoginSelector`.
- [ ] `clients/orangehrm/login.js` passou em `node --check`.
- [ ] `/explorar` gerou `mapa.md`, `fluxos.md`, `elementos.json` e `api_endpoints.json`.
- [ ] `/gerar-cenarios` foi executada.
- [ ] `/plano-automacao` foi executada ou houve justificativa para pular.
- [ ] `/gerar-automacao-cliente` criou pacote em `clients/orangehrm/entregaveis/automacao/playwright-ts/`.
- [ ] todo `.md` destinado ao cliente tem `.pdf`.
- [ ] `/auditar-automacao-cliente` foi executada por auditor independente.
- [ ] `auditoria_independente.md` foi revisado.
- [ ] nenhum artefato de cliente contem `geracao_id`, modelo, agente, executor, token ou `.env`.
- [ ] governanca interna ficou somente em `clients/orangehrm/resultado/<timestamp>/governanca/`.

## 18. O que Pode Ser Entregue

Depois da auditoria e revisao:

```text
clients/orangehrm/entregaveis/automacao/playwright-ts/codigo/
clients/orangehrm/entregaveis/automacao/playwright-ts/especificacao_automacao.json
clients/orangehrm/entregaveis/automacao/playwright-ts/mapeamento_cenarios.md
clients/orangehrm/entregaveis/automacao/playwright-ts/mapeamento_cenarios.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/README_automacao.md
clients/orangehrm/entregaveis/automacao/playwright-ts/README_automacao.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/cobertura_automacao.md
clients/orangehrm/entregaveis/automacao/playwright-ts/cobertura_automacao.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/pendencias.md
clients/orangehrm/entregaveis/automacao/playwright-ts/pendencias.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/inventario_arquivos.md
clients/orangehrm/entregaveis/automacao/playwright-ts/inventario_arquivos.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_codigo.md
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_codigo.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.md
clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/correcoes_auditoria.md
clients/orangehrm/entregaveis/automacao/playwright-ts/correcoes_auditoria.pdf
clients/orangehrm/entregaveis/automacao/playwright-ts/resumo_geracao.md
clients/orangehrm/entregaveis/automacao/playwright-ts/resumo_geracao.pdf
```

## 19. O que Nao Pode Ser Entregue

Nao entregue:

```text
.env
clients/orangehrm/.env
clients/orangehrm/resultado/<timestamp>/governanca/
automacao_autoria_*.json
auditoria_interna_*.md
tokens
senhas
geracao_id
identidade de modelo/agente/executor
logs internos
```

## 20. Compactar o Pacote

No terminal:

```bash
mkdir -p exports
tar -czf exports/orangehrm_playwright-ts_automacao.tar.gz \
  clients/orangehrm/entregaveis/automacao/playwright-ts
```

Confira:

```bash
ls -lh exports
```

Nao compacte a raiz do projeto. Nao inclua `.env` nem `clients/orangehrm/resultado/<timestamp>/governanca/`.

## 21. Sequencia Curta para Copiar

Depois de configurar `clients/orangehrm/.env`, `config.json` e `login.js`, execute na CLI:

```text
/explorar --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin
/gerar-cenarios --cliente orangehrm --formato gherkin
/plano-automacao --cliente orangehrm https://opensource-demo.orangehrmlive.com/ --login Admin --stack playwright-ts --dominio "HRMS demo com modulos Admin, PIM, Leave, Time, Recruitment e Dashboard"
/gerar-automacao-cliente --cliente orangehrm --stack playwright-ts --modulo "PIM"
/auditar-automacao-cliente --cliente orangehrm --stack playwright-ts --modulo "PIM"
```

## 22. Problemas Comuns

### Login nao funciona

Verifique:

- `QA_PASSWORD` em `clients/orangehrm/.env`;
- se `--login Admin` foi usado;
- se o campo `Username` ainda existe;
- se o campo `Password` ainda existe;
- se o botao ainda tem nome `Login`;
- se `.oxd-sidepanel` ainda aparece depois do login.

### A exploracao nao gerou `api_endpoints.json`

Rode a exploracao novamente navegando por areas com chamadas de rede, como PIM, Leave e Recruitment. Confira tambem `clients/orangehrm/resultado/latest/network_log.json`.

### A geracao de automacao diz que faltam artefatos

Confira:

```bash
ls clients/orangehrm/estado
ls cenarios
```

Se faltar estado, rode `/explorar`. Se faltar cenario, rode `/gerar-cenarios`.

### A auditoria bloqueou por segregacao

Execute a auditoria em outro agente/modelo/instancia. Nao contorne a regra manualmente.

### Falta PDF de algum relatorio

Gere com:

```bash
node cenarios/_md_to_pdf.js \
  clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.md \
  clients/orangehrm/entregaveis/automacao/playwright-ts/auditoria_independente.pdf
```

## 23. Referencias

- Site demo usado no teste: `https://opensource-demo.orangehrmlive.com/`
- Pagina OrangeHRM Open Source: `https://www.orangehrm.com/open-source/`
- Artigo OrangeHRM sobre demo open source: `https://support.orangehrm.com/portal/en/kb/articles/opensource-demo-instance-upgrade`
