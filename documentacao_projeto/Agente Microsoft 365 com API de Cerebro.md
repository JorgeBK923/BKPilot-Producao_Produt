# Agente Microsoft 365 com API de Cerebro

## Objetivo

Este documento explica, de forma simples, como a empresa pode criar um agente para aparecer no Microsoft 365 do cliente e usar uma API propria para carregar o "cerebro" do agente.

Esse "cerebro" pode conter:

- prompt do cliente;
- regras de negocio;
- tom de voz;
- fluxos de atendimento;
- permissoes;
- ferramentas disponiveis;
- politicas de seguranca;
- contexto por usuario, area ou empresa.

## Explicacao simples

O Microsoft 365 Copilot nao permite que uma empresa externa troque o cerebro interno dele por completo.

Ou seja, nao devemos pensar assim:

```text
Copilot 365 vazio
    -> nossa API injeta o prompt
    -> Copilot passa a ser controlado por nos
```

Esse modelo e fragil e nao deve ser tratado como a arquitetura principal.

O caminho mais correto e criar um agente nosso, que aparece dentro do Microsoft 365 do cliente.

Nesse modelo, o Microsoft 365 funciona como a tela onde o usuario conversa, mas o agente real roda na nossa estrutura.

```text
Usuario no Microsoft 365
    -> conversa com o agente da BugKillers
    -> agente chama a API de cerebro
    -> agente usa o modelo de IA
    -> resposta volta para o usuario no Microsoft 365
```

## Ideia principal

A API que estamos construindo nao deve ser vista apenas como uma "API de prompt".

Ela deve ser vista como uma **API de cerebro do cliente**.

Ela entrega ao agente tudo o que ele precisa saber para agir corretamente para aquele cliente.

Exemplo:

```text
Cliente A tem regras, tom e processos proprios.
Cliente B tem outras regras, outro tom e outros processos.

O mesmo agente pode consultar a API e carregar o cerebro correto para cada cliente.
```

## Arquitetura recomendada

A arquitetura recomendada e usar um **Custom Engine Agent**.

Isso significa que:

- o agente aparece para o cliente dentro do Microsoft 365 ou Teams;
- a conversa do usuario chega ate o backend da BugKillers;
- o backend da BugKillers carrega o cerebro do cliente;
- o backend chama o modelo de IA escolhido;
- a resposta volta para o usuario no Microsoft 365.

Fluxo simplificado:

```text
Microsoft 365 / Teams
        |
        v
Agente da BugKillers
        |
        v
Backend do agente
        |
        v
API de cerebro do cliente
        |
        v
Modelo de IA
        |
        v
Resposta ao usuario
```

## O que fica com a Microsoft

No Microsoft 365 do cliente ficam:

- o ponto de entrada do agente;
- a interface onde o usuario conversa;
- o app/agente instalado no ambiente do cliente;
- as permissoes aprovadas pelo administrador do cliente.

## O que fica com a BugKillers

Na estrutura da BugKillers ficam:

- a API de cerebro;
- os prompts dos clientes;
- as regras de negocio;
- a logica de orquestracao;
- a chamada ao modelo de IA;
- os logs;
- as validacoes de seguranca;
- a integracao com MCPs, sistemas internos ou APIs externas.

## Como o agente deve funcionar

Quando o usuario envia uma pergunta, o agente deve seguir este fluxo:

1. Receber a mensagem do usuario.
2. Identificar o cliente, tenant, usuario e contexto.
3. Chamar a API de cerebro.
4. Receber as regras e instrucoes aplicaveis.
5. Montar o contexto para a IA.
6. Chamar o modelo de IA.
7. Se necessario, chamar ferramentas, MCPs ou APIs.
8. Validar a resposta.
9. Enviar a resposta para o usuario no Microsoft 365.

Exemplo:

```text
Usuario pergunta:
"Como faco o onboarding de um novo vendedor?"

Agente identifica:
Cliente: ACME
Usuario: gerente comercial
Assunto: onboarding

Agente chama a API:
"Me entregue as regras da ACME para onboarding comercial."

API responde:
"Use o fluxo ACME-ONB-003, confirme a area, envolva RH antes de TI e nunca solicite senha."

Agente responde ao usuario seguindo essas regras.
```

## Como construir o agente

Para o agente aparecer no ambiente do cliente, precisamos criar um pacote de agente para Microsoft 365.

O caminho tecnico recomendado e:

1. Criar um projeto usando Microsoft 365 Agents Toolkit.
2. Criar um Custom Engine Agent.
3. Configurar o manifesto do app/agente.
4. Criar o endpoint do backend da BugKillers.
5. Conectar o agente ao backend.
6. Fazer o backend chamar a API de cerebro.
7. Fazer o backend chamar o modelo de IA.
8. Publicar ou instalar o agente no tenant do cliente.
9. O administrador do cliente aprova o agente.
10. O usuario passa a encontrar o agente no Microsoft 365 ou Teams.

## Componentes necessarios

### 1. App do agente no Microsoft 365

Esse e o pacote que permite que o agente apareca para o cliente.

Ele contem:

- nome do agente;
- descricao;
- icone;
- permissoes;
- configuracao do bot/agente;
- endpoint do backend.

### 2. Backend do agente

Esse e o servico principal controlado pela BugKillers.

Ele recebe mensagens do Microsoft 365 e decide o que fazer.

Responsabilidades:

- receber perguntas dos usuarios;
- identificar cliente e usuario;
- chamar a API de cerebro;
- montar a chamada para IA;
- chamar ferramentas;
- aplicar seguranca;
- registrar logs;
- devolver resposta.

### 3. API de cerebro

Essa API entrega as regras do cliente para o agente.

Ela pode responder com dados estruturados, por exemplo:

```json
{
  "cliente": "ACME",
  "versao": "v12",
  "tom": "objetivo e consultivo",
  "regrasObrigatorias": [
    "Nunca solicitar senha do usuario.",
    "Confirmar area antes de abrir chamado.",
    "Para assuntos juridicos, direcionar ao departamento legal."
  ],
  "fluxosPermitidos": [
    "onboarding_comercial",
    "abertura_chamado",
    "consulta_politica_interna"
  ],
  "ferramentasPermitidas": [
    "buscarPolitica",
    "abrirTicket",
    "consultarProcedimento"
  ]
}
```

### 4. Modelo de IA

O modelo de IA pode ser:

- Azure OpenAI;
- OpenAI API;
- Azure AI Foundry;
- outro provedor aprovado.

Importante: em Custom Engine Agent, o custo da IA normalmente nao sai automaticamente da licenca Microsoft 365 Copilot do cliente.

O custo fica com quem chama o modelo:

- BugKillers, se usarmos nossa conta;
- cliente, se implantarmos usando a conta Azure/OpenAI dele.

## Nesse formato, a IA usada sera a do cliente?

Nao necessariamente.

No modelo de **Custom Engine Agent**, o Microsoft 365 do cliente funciona principalmente como o local onde o usuario acessa o agente.

Isso significa que a licenca Microsoft 365 Copilot do cliente nao vira automaticamente um "credito de IA" para o nosso agente usar.

O agente da BugKillers precisa chamar algum modelo de IA por fora.

Existem dois formatos possiveis.

### Formato 1: IA paga e controlada pela BugKillers

Nesse formato, a BugKillers usa a propria conta de IA.

Exemplo:

```text
Usuario no Microsoft 365 do cliente
    -> agente da BugKillers
    -> backend da BugKillers
    -> API de cerebro da BugKillers
    -> modelo de IA contratado pela BugKillers
```

Nesse caso:

- o cliente usa o agente dentro do Microsoft 365;
- a IA usada e a da BugKillers;
- os custos de tokens/uso ficam com a BugKillers;
- a BugKillers cobra o cliente no preco do produto, mensalidade, pacote ou consumo.

Esse formato e mais simples para vender e operar no inicio, porque o cliente nao precisa configurar Azure OpenAI ou outro provedor.

Porem, a BugKillers assume:

- custo variavel de IA;
- controle de limites;
- monitoramento de uso;
- seguranca dos dados processados;
- margem comercial sobre o consumo.

### Formato 2: IA paga e controlada pelo cliente

Nesse formato, o cliente usa a propria conta de IA.

Exemplo:

```text
Usuario no Microsoft 365 do cliente
    -> agente da BugKillers
    -> backend da BugKillers ou backend instalado no ambiente do cliente
    -> API de cerebro
    -> Azure OpenAI / Azure AI Foundry do cliente
```

Nesse caso:

- o cliente continua usando o agente dentro do Microsoft 365;
- a IA usada pode ser a do proprio cliente;
- os custos de tokens/uso ficam na conta Azure/OpenAI/Foundry do cliente;
- a BugKillers entrega o agente, a arquitetura, a API de cerebro e a integracao.

Esse formato e mais indicado para clientes maiores, que exigem:

- dados dentro do proprio ambiente;
- controle de compliance;
- faturamento de IA direto no contrato Azure deles;
- menor exposicao de dados para fornecedores externos;
- governanca corporativa mais rigida.

Porem, esse formato e mais complexo, porque exige configuracao tecnica no ambiente do cliente.

## O que nao devemos prometer

Nao devemos prometer que:

```text
Como o cliente ja paga Microsoft 365 Copilot,
o nosso agente usara automaticamente a IA do Copilot sem custo adicional.
```

Essa nao e a leitura correta para Custom Engine Agent.

O Microsoft 365 Copilot do cliente permite que o usuario acesse experiencias de IA dentro do Microsoft 365, mas um agente customizado com motor proprio precisa de uma chamada propria para um modelo de IA.

Essa chamada pode ser paga pela BugKillers ou pelo cliente, dependendo da arquitetura escolhida.

## Recomendacao comercial

Para um MVP ou primeira versao comercial, o caminho mais simples e:

```text
BugKillers hospeda o agente
BugKillers usa sua propria conta de IA
Cliente paga pelo produto
```

Para clientes enterprise, o caminho mais robusto e oferecer uma opcao:

```text
BYO AI: Bring Your Own AI
```

Ou seja:

```text
O cliente usa o agente da BugKillers,
mas o consumo de IA roda na conta Azure/OpenAI/Foundry dele.
```

Assim, a BugKillers pode vender dois modelos:

- **modelo gerenciado**, com IA da BugKillers;
- **modelo enterprise**, com IA do cliente.

## Onde entra o MCP

O MCP pode ser usado dentro do backend da BugKillers.

Ele nao precisa comandar diretamente o Microsoft 365 Copilot.

Uso recomendado:

```text
Agente da BugKillers
    -> chama API de cerebro
    -> chama MCPs para buscar dados ou executar ferramentas
    -> chama IA
    -> responde ao usuario
```

Exemplos de MCPs:

- MCP para consultar documentos do cliente;
- MCP para acessar CRM;
- MCP para abrir chamados;
- MCP para consultar politicas internas;
- MCP para executar automacoes.

## Por que esse caminho e melhor

Esse modelo e melhor porque da mais controle para a BugKillers.

Vantagens:

- controle real do prompt;
- controle das regras por cliente;
- possibilidade de versionar o cerebro;
- maior seguranca;
- logs proprios;
- possibilidade de usar MCP;
- independencia do Copilot Studio;
- agente pode aparecer no ambiente Microsoft 365 do cliente.

## Pontos de atencao

Mesmo nesse modelo, existem pontos importantes:

- o cliente precisa permitir a instalacao do agente;
- o administrador do tenant pode precisar aprovar permissoes;
- a BugKillers precisa hospedar e manter o backend;
- precisamos definir quem paga o uso da IA;
- precisamos proteger prompts, dados e logs;
- precisamos controlar quais ferramentas cada cliente pode usar;
- precisamos tratar falhas da API de cerebro ou do modelo de IA.

## Decisao recomendada

A recomendacao e construir a solucao como:

```text
Custom Engine Agent no Microsoft 365
+ Backend da BugKillers
+ API de cerebro do cliente
+ Modelo de IA escolhido
+ MCPs e ferramentas quando necessario
```

Nao devemos vender internamente a ideia como "vamos injetar um prompt no Copilot 365".

A mensagem correta e:

```text
Vamos criar um agente proprio, que aparece no Microsoft 365 do cliente, mas usa o cerebro, as regras e a inteligencia controlados pela BugKillers.
```

## Resumo executivo

A empresa pode criar um agente para clientes que usam Microsoft 365.

Esse agente pode aparecer no ambiente do cliente, mas o cerebro principal deve ficar em uma estrutura controlada pela BugKillers.

A API que estamos construindo deve entregar as regras e instrucoes do cliente para esse agente.

O melhor caminho tecnico e criar um Custom Engine Agent, porque ele permite que a BugKillers controle o prompt, a logica, as ferramentas, os modelos de IA e os logs.

Esse caminho e mais robusto do que tentar fazer o Copilot 365 puro obedecer a um prompt externo.
