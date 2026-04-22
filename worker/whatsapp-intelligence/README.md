# WhatsApp Intelligence (Llama + CRM interno)

Camada de automacao para mensagens inbound/outbound de WhatsApp com inferencia por Llama, persistencia no D1 e execucao de comandos internos de CRM.

## Fluxo

1. Baileys Gateway publica eventos em `POST /webhook/baileys`.
2. Worker valida segredo interno, reclama o `messageId` de forma idempotente e permite retry apenas quando houve falha antes da entrega.
3. Busca/cria contexto do cliente em `customers`.
4. Chama `@cf/meta/llama-3.1-8b-instruct` para resposta e `actions`.
5. Encaminha primeiro o envio para o gateway de saida via Durable Object (`BaileysSessionDO`).
6. So depois da entrega confirmada persiste conversa/logs e executa comandos permitidos (`create_reservation_request`, `add_loyalty_points`, `send_email_confirmation`, `notify_team`).

## Segredos esperados

- `WEBHOOK_SHARED_SECRET`
- `CRM_INTERNAL_SECRET`
- `BAILEYS_GATEWAY_TOKEN`
- `WHATSAPP_INTELLIGENCE_ENABLED`

Configure com:

```bash
wrangler secret put WEBHOOK_SHARED_SECRET
wrangler secret put CRM_INTERNAL_SECRET
wrangler secret put BAILEYS_GATEWAY_TOKEN
```

Ative o modulo apenas quando o refinamento estiver liberado no ambiente, definindo `WHATSAPP_INTELLIGENCE_ENABLED = "true"` na configuracao do deploy.

## Observacoes de seguranca

- Nao versionar valores reais de segredo.
- Use apenas redes internas/autenticacao forte para endpoint de webhook.
- `create_reservation_request` cria fila de solicitacao, nao grava direto na tabela oficial de reservas.

## Deploy

```bash
wrangler d1 migrations apply cuiabar_crm
wrangler deploy
```
