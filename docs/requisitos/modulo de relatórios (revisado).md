JCLA BI Platform

Módulo de Geração de Relatórios com IA

Documentação para o Time de QA



Versão: 1.0

Classificação: Uso interno — Time de QA

Última atualização: Julho 2025



1. Objetivo deste Documento

Este documento descreve o funcionamento e as regras de negócio do módulo de relatórios da plataforma JCLA BI.

O módulo permite que usuários criem e gerenciem relatórios corporativos utilizando linguagem natural, sem necessidade de conhecimento técnico em banco de dados. A IA interpreta o pedido do usuário e gera automaticamente o relatório completo.



2. Visão Geral do Módulo

O módulo de relatórios é composto por três operações principais, cada uma com comportamento, custo e frequência distintos:



Operação

O que faz

Usa IA?

Quando ocorre

Geração

Cria um relatório do zero a partir de uma descrição em texto

Sim — intensamente

Apenas na criação

Execução

Re-executa o relatório com novos filtros

Não

A cada atualização de filtro ou acesso

AI Assist (Edição)

Propõe alterações no relatório via IA

Sim — moderadamente

Sob demanda do usuário



3. Fluxo de Geração de Relatório

A geração é o processo mais complexo do módulo. Ocorre apenas uma vez por relatório e passa pelas etapas abaixo em sequência. O usuário acompanha o progresso em tempo real por uma barra de progresso.



3.1 Etapa de Checklist Interativo

Antes de iniciar a geração efetiva, a IA apresenta ao usuário um checklist com 5 pontos de confirmação:

Métricas desejadas (ex.: faturamento total, quantidade de pedidos)

Agrupamentos (ex.: por mês, por representante, por região)

Filtros e parâmetros (ex.: período, filial)

Estilo visual (tema, tamanho de página)

Ordenação dos dados



Regras do checklist:

O checklist é exibido apenas na criação de um novo relatório.

A IA pode inferir automaticamente algumas opções com base no prompt do usuário — essas aparecem marcadas como "inferido".

O usuário pode confirmar os itens inferidos ou ajustá-los antes de prosseguir.

Somente após a confirmação do checklist a geração efetiva começa.



📋 Ponto de atenção para QA: verificar se o checklist é exibido corretamente para novos relatórios, se os itens inferidos estão marcados visivelmente, e se é possível confirmar sem preencher todos os campos.



3.2 Extração de Parâmetros (Filtros)

Após o checklist, o sistema identifica automaticamente quais filtros o relatório precisará. Por exemplo: se o usuário pede "relatório de vendas por mês", o sistema pode identificar um filtro de data de início e data de fim.



Tipos de filtro suportados:

Tipo

Descrição

Exemplo de uso

Texto

Campo de texto livre

Nome do cliente

Número

Campo numérico

Quantidade mínima

Data

Seletor de data única

Data de referência

Intervalo de Data

Dois seletores: início e fim

Período do relatório

Seleção única

Lista de opções — escolhe uma

Filial

Seleção múltipla

Lista de opções — escolhe várias

Categorias de produto



3.3 Geração e Validação dos Dados

O sistema consulta automaticamente o catálogo de dados da empresa (tabelas e colunas disponíveis no banco) e monta a consulta de dados correta. Em seguida, executa essa consulta e verifica os resultados.



Comportamentos importantes:

Se a consulta de dados retornar erro, o sistema tenta se autocorrigir automaticamente uma vez antes de exibir uma mensagem de erro ao usuário.

O total de registros encontrados é informado.



3.4 Geração do Visual (Template)

O sistema gera o layout visual do relatório automaticamente. A IA define a estrutura de apresentação (cabeçalhos, tabelas, agrupamentos) e o sistema injeta os dados de forma segura — sem misturar dados fixos com dados dinâmicos.



Regra importante: o relatório gerado nunca contém valores fixos hardcoded. Todos os valores exibidos vêm sempre dos dados consultados em tempo real. Isso garante que o relatório sempre reflita os dados atuais.



3.5 Tipos de Coluna — Determinismo

A formatação de cada coluna (moeda, data, número, percentual) é definida automaticamente a partir da estrutura do banco de dados, sem intervenção da IA. A IA contribui apenas com os rótulos legíveis (ex.: "Valor Total", "Data da Venda").



✅ Isso significa que a formatação de colunas é determinística e previsível — um ponto de teste relevante é validar se os tipos são aplicados corretamente independentemente do prompt do usuário.



3.6 Temas Visuais Disponíveis

Tema

Características visuais

Corporate

profissional, tipografia limpa — padrão corporativo

Modern

gradiente no cabeçalho — visual contemporâneo

Minimal

Sem ornamentos — layout clean

Classic

Tipografia serifada — estilo clássico





4. Fluxo de Execução (Re-execução com Filtros)

Após a geração inicial, o usuário pode re-executar o relatório com diferentes valores de filtro a qualquer momento. Esta operação não utiliza IA e é significativamente mais rápida que a geração.

4.1 Comportamento do Cache

O sistema utiliza um cache com duração de 5 minutos. Isso significa:

Se o mesmo relatório for executado com os mesmos valores de filtro dentro de 5 minutos, o resultado é retornado instantaneamente do cache — sem nova consulta ao banco de dados.

Ao alterar qualquer valor de filtro, uma nova consulta ao banco é realizada.

Após 5 minutos, o cache expira e a próxima execução sempre busca dados frescos do banco.



O cache é transparente ao usuário — ele não precisa (e não pode) controlá-lo manualmente.



4.2 Fluxo Resumido

Usuário preenche os filtros e clica em Executar

Sistema verifica se existe resultado em cache para esses mesmos filtros

Se sim: exibe resultado imediatamente (dados do cache)

Se não: consulta o banco de dados com os filtros informados

Resultado é renderizado e exibido no painel de preview



4.3 Validação de Filtros Obrigatórios

Filtros marcados como obrigatórios bloqueiam o botão "Executar" até serem preenchidos. O sistema não permite executar o relatório com filtros obrigatórios em branco.



🔍 Teste sugerido: verificar se filtros obrigatórios bloqueiam a execução corretamente, e se filtros opcionais permitem execução mesmo em branco (tratados como "sem filtro" na consulta).





5. AI Assist — Edição Assistida por IA

O AI Assist permite que o usuário solicite alterações no relatório já criado, usando linguagem natural. Exemplos de instruções válidas:

"Adicione uma coluna com a margem de contribuição"

"Mude o tema para Minimal"

"Adicione um filtro por representante"

"Ordene por valor decrescente"



5.1 Princípio Human-in-the-Loop

O AI Assist NUNCA aplica alterações diretamente no relatório. O fluxo segue o seguinte padrão:



Passo

Quem age

O que acontece

1

Usuário

Digita instrução de alteração no chat

2

IA

Analisa o relatório atual e propõe as alterações necessárias

3

Sistema

Exibe as diferenças (diff) entre o estado atual e a proposta da IA no chat

4

Usuário

Aceita ou rejeita a proposta

5

Sistema

Aplica ou descarta as alterações conforme decisão do usuário



✅ Regra de negócio crítica: nenhuma alteração proposta pela IA é aplicada sem confirmação explícita do usuário. O botão "Aplicar" só aparece após a IA retornar uma proposta.



5.2 O que a IA pode alterar

Elemento

Descrição da alteração possível

Consulta de dados (SQL)

Adicionar/remover colunas, alterar agrupamentos, modificar condições de filtro

Filtros do relatório

Adicionar, remover ou modificar parâmetros de filtro

Estilo visual

Alterar tema, cores primária/secundária, fonte, tamanho de página

Template visual

Modificar a estrutura de apresentação (layout, agrupamentos visuais)

Transformação de dados

Adicionar cálculos sobre os dados retornados (opcional, avançado)



5.3 Exibição de Diferenças (Diff)

Quando a IA propõe alterações, o sistema exibe visualmente as diferenças entre o estado atual e a proposta no chat:

Linhas verdes (com +): conteúdo que será adicionado

Linhas vermelhas riscadas (com -): conteúdo que será removido

Alterações em filtros são exibidas com indicação de adicionado (verde), removido (vermelho) ou modificado (amarelo)

Alterações de estilo são exibidas como lista textual das propriedades que mudaram



5.4 Comportamento quando a IA precisa de mais informações

Em alguns casos, a IA pode precisar de esclarecimentos antes de propor a alteração. Nessa situação:

A IA faz uma pergunta ao usuário no chat

O campo de entrada fica ativo aguardando a resposta

Somente após a resposta do usuário a IA conclui e propõe a alteração



🔍 Teste sugerido: verificar se o estado "aguardando resposta" é comunicado claramente ao usuário e se o fluxo de pergunta → resposta → proposta funciona corretamente.





6. Interface do Usuário — Editor de Relatórios

A tela principal do editor é dividida em dois painéis:

Painel esquerdo (Chat): histórico de mensagens entre o usuário e o assistente de IA, onde ocorrem as interações de geração e edição

Painel direito (Preview): visualização em tempo real do relatório gerado



6.1 Ações disponíveis na barra de ferramentas

Ação

O que faz

Executar

Re-executa o relatório com os filtros atuais

Filtros

Abre painel para preenchimento dos filtros do relatório

Estilo

Abre seletor de tema, cores e fonte

Template

Permite edição direta do layout visual (usuário avançado)

Histórico

Exibe versões anteriores do relatório com opção de restaurar

Código

Exibe (somente leitura) a consulta SQL e código de transformação gerados

Favoritar (★)

Marca/desmarca o relatório como favorito



6.2 Comportamentos Automáticos

O editor possui alguns comportamentos automáticos que o time de QA deve conhecer:



Auto-execução na abertura: se o relatório já foi gerado anteriormente, ao abrir o editor o sistema re-executa automaticamente com os últimos filtros usados.

Auto-save de estilo: qualquer alteração de tema, cor ou fonte é salva automaticamente após 1,5 segundos de inatividade — sem necessidade de clicar em "Salvar".

Preview via streaming: o preview do relatório é atualizado progressivamente durante a geração, não apenas ao final.



6.3 Tela de Listagem de Relatórios

A tela de listagem exibe todos os relatórios do usuário:

Meus Relatórios: relatórios criados pelo usuário



Funcionalidades disponíveis na listagem:

Busca por nome, descrição ou tag (busca local, sem acionar o servidor)

Filtro por pasta

Criar novo relatório (abre modal de criação)

Editar metadados (nome, descrição, pasta, tags)

Favoritar relatório

Duplicar relatório (fork)

Excluir relatório





7. Regras de Negócio Críticas

Esta seção lista as principais regras de negócio que devem ser validadas pelo time de QA:



7.1 Segurança e Isolamento de Dados

Cada usuário acessa apenas os relatórios da sua empresa (identificada por um código de licença).

Não é possível acessar ou visualizar relatórios de outra empresa, mesmo conhecendo o identificador do relatório.

Todo acesso ao módulo requer autenticação prévia. Requisições sem token de autenticação são rejeitadas.



🔴 Teste crítico de segurança: verificar que um usuário autenticado não consegue acessar, executar ou modificar relatórios de outra licença — mesmo que manipule os identificadores na URL ou nos parâmetros da requisição.



7.2 Integridade dos Dados nos Relatórios

Os tipos de coluna (moeda, data, número, percentual) são determinados pelo banco de dados, nunca pela IA. A IA apenas define os rótulos das colunas.

O template visual nunca contém valores fixos — todos os dados exibidos são sempre dinâmicos, provenientes da consulta ao banco.

A consulta de dados só referencia colunas que existem no catálogo documentado da empresa.

Filtros sempre usam valores parametrizados — valores de filtro nunca são concatenados diretamente na consulta.



7.3 Histórico e Versionamento

Cada vez que um relatório é salvo com alterações no modal de Histórico, uma nova versão é registrada.

O usuário pode restaurar qualquer versão anterior salva pelo modal de Histórico.

A restauração de uma versão antiga re-executa o relatório com os dados atuais (os dados não são versionados, apenas a estrutura do relatório).

7.4 Transformação de Dados (Python — funcionalidade avançada)

A execução de código de transformação de dados é um recurso opcional e avançado, ativado apenas explicitamente via AI Assist.

O código executado é validado antes da execução — bibliotecas de sistema, acesso à rede e operações perigosas são bloqueados.



7.5 Exportação para PDF

O relatório pode ser exportado para PDF a partir do preview gerado.

O PDF mantém o tema visual (cores, fonte) configurado no relatório.

A exportação usa os dados já carregados no último resultado — não realiza nova consulta ao banco.





8. Cenários de Erro e Comportamentos Esperados



Situação

Comportamento esperado

O usuário vê...

Erro na consulta ao banco de dados

Sistema tenta autocorreção automática uma vez antes de exibir erro

Mensagem de erro com opção de tentar corrigir automaticamente

Relatório com filtros obrigatórios em branco

Botão Executar desabilitado

Campos obrigatórios destacados

Falha total da IA durante geração

Mensagem de erro — geração cancelada

Mensagem de erro com texto amigável

Falha total da IA no AI Assist

Sistema usa rota alternativa simplificada antes de retornar erro

Erro apenas se a rota alternativa também falhar

Transformação de dados excede tempo limite (30s)

Dados originais são usados (sem transformação)

Relatório exibido normalmente — sem indicação visível de fallback

Template com erro de renderização

Sistema usa renderização simplificada de fallback

Relatório exibido em formato tabular simples

Cache indisponível (Redis fora do ar)

Sistema consulta banco de dados diretamente em toda execução

Sem impacto visível — apenas performance levemente menor

Acesso não autorizado a relatório de outra licença

Requisição rejeitada

Erro de autorização





9. Sugestões de Cobertura de Testes

Com base nas regras e fluxos descritos, seguem sugestões de áreas prioritárias para cobertura de testes:



9.1 Geração de Relatório

Geração com prompt simples (uma métrica, sem filtros)

Geração com múltiplas métricas, agrupamentos e filtros

Geração com checklist — confirmar itens inferidos sem alteração

Geração com checklist — alterar itens antes de confirmar

Comportamento da barra de progresso em cada etapa

Comportamento quando a consulta de dados retorna zero registros

Comportamento quando a consulta ao banco falha



9.2 Execução com Filtros

Execução com todos os filtros preenchidos

Execução sem filtros opcionais (devem ser ignorados, não causar erro)

Bloqueio do botão Executar com filtro obrigatório em branco

Execução repetida com os mesmos filtros (cache deve ser usado)

Execução após expiração do cache (5 minutos)

Execução com filtro de intervalo de data — data início após data fim

Exportação para PDF após execução



9.3 AI Assist

Solicitação de alteração simples (ex.: mudar tema)

Solicitação de alteração complexa (ex.: adicionar coluna com cálculo)

Verificar que a proposta da IA é exibida como diff antes de qualquer aplicação

Aplicar proposta e verificar se o relatório é re-executado automaticamente

Rejeitar proposta e verificar que o relatório não é alterado

Fluxo de pergunta da IA → resposta do usuário → proposta gerada



9.4 Gerenciamento e Permissões

Criação de relatório com nome, descrição, pasta e tags

Edição de metadados de um relatório existente

Favoritar e desfavoritar relatório — reflexo na Sidebar

Duplicar (fork) relatório — verificar independência entre original e cópia

Excluir relatório — verificar remoção da listagem

Tentar acessar relatório de outra licença — deve ser rejeitado

Restaurar versão anterior pelo Histórico



9.5 Temas e Estilo

Aplicar cada um dos 4 temas disponíveis e verificar renderização

Alterar cores primária e secundária via seletor

Alterar fonte e verificar reflexo no preview

Verificar auto-save do estilo (sem botão Salvar, deve persistir após recarregar a página)





10. Glossário



Termo

Definição

Geração

Processo de criação de um relatório do zero usando IA

Execução

Re-execução de um relatório já criado com novos valores de filtro

AI Assist

Funcionalidade que permite editar um relatório existente via instruções em linguagem natural

Human-in-the-loop

Modelo onde a IA propõe alterações, mas a aplicação depende de confirmação humana

Checklist

Questionário interativo exibido pela IA antes de iniciar a geração, para confirmar os parâmetros do relatório

Filtro / Parâmetro

Campo que o usuário preenche antes de executar o relatório para filtrar os dados exibidos

Cache

Armazenamento temporário do resultado de uma execução, válido por 5 minutos

Preview

Visualização prévia do relatório exibida no painel direito do editor

Diff

Comparação visual entre o estado atual e a proposta de alteração da IA

Template

Estrutura visual do relatório que define como os dados são apresentados

Licença

Identificador que agrupa os usuários de uma mesma empresa no sistema

Fork

Duplicação de um relatório existente, criando uma cópia independente

Catálogo

Conjunto de tabelas e colunas de dados disponíveis para cada empresa





JCLA BI Platform — Documentação QA — Módulo de Relatórios

Documento de uso interno. Não distribuir externamente.



