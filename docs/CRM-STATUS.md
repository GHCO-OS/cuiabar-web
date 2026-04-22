# CRM Cuiabar - Status Operacional

Atualizado em: 2026-04-21

## Situacao atual

- CRM reativado no dominio `https://crm.cuiabar.com`
- autenticacao do painel: Google Sign-In
- e-mails autorizados para acesso: `leonardo@cuiabar.net` e `cuiabar@cuiabar.net`
- disparo de e-mail: Gmail API com OAuth 2.0
- remetente padrao: `Cuiabar Restaurantes | Campinas`
- banco principal: Cloudflare D1
- runtime: Cloudflare Workers
- integracao com Zoho removida do CRM

## Rotas e dominios principais

- CRM: `https://crm.cuiabar.com`
- Reservas: `https://reservas.cuiabar.com`
- Blog publico legado: `https://blog.cuiabar.com`

## Operacao

- deploy principal: `npm run deploy:worker`
- validacao de tipos: `npm run lint`
- migrations remotas D1: `npm run d1:migrate:remote`

Estado adicional:

- autostart local do bridge Baileys esta desligado
- `worker/whatsapp-intelligence` segue isolado por flag

## Observacoes de continuidade

- a documentacao operacional do projeto deve continuar centralizada em `docs/`
- novas decisoes tecnicas, credenciais de integracao e status de publicacao devem ser registradas aqui
- runbooks complementares agora vivem em `docs/runbooks/`
