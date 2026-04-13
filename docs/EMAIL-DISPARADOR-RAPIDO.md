# Disparador rapido e rastreamento de e-mail

Atualizado em: 2026-04-07

## O que entrou

- o dashboard do CRM agora abre com a area `Disparador rapido`
- o operador pode escolher um template existente
- o operador pode colar varios e-mails ou buscar contatos ativos ja cadastrados no CRM
- o envio usa apenas contatos existentes e elegiveis
- a saudacao pode ser:
  - personalizada com `first_name`
  - generica com a palavra `cliente`
- o envio cria uma campanha automatica, enfileira os destinatarios escolhidos e processa o envio na hora

## Medicao

- cliques continuam sendo medidos por redirect e seguem sendo a metrica mais confiavel
- aberturas agora sao registradas por pixel individual em `/o/<tracking_token>`
- o sistema consolida:
  - aberturas totais observadas
  - aberturas unicas observadas
  - open rate observado

## Leitura correta das metricas

- click tracking: suportado e confiavel
- open tracking: opcional e imperfeito
- inbox placement: nao e garantido
- aberturas devem ser tratadas como sinal auxiliar, nunca como verdade absoluta

## Fluxo operacional

1. entrar no CRM em `https://crm.cuiabar.com`
2. abrir o dashboard
3. escolher o template
4. definir se a saudacao sera personalizada ou generica
5. selecionar contatos do CRM ou colar e-mails ja existentes no CRM
6. clicar em `Enviar disparo`
7. acompanhar cliques, aberturas observadas, falhas e descadastros

## Observacoes

- se um e-mail colado nao existir no CRM, ele nao entra no disparo
- contatos inelegiveis, como descadastrados ou suprimidos, ficam bloqueados
- o rastreio de abertura usa um pixel transparente retornado pelo Worker
- links do corpo do e-mail continuam sendo reescritos para tracking de clique
