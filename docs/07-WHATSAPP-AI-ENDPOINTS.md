# WhatsApp AI - endpoints

Atualizado em: 2026-04-08

## Endpoints internos do Worker

Essas rotas sao consumidas pela ponte local Baileys e exigem `x-internal-token`.

### `POST /api/internal/whatsapp/inbound`

Uso:

- enviar ao Worker uma mensagem recebida pelo Baileys ja normalizada

Body:

```json
{
  "message": {
    "providerMessageId": "BAE5F2A4C9D8",
    "timestamp": "2026-04-08T14:02:11.000Z",
    "fromPhone": "+551933058878",
    "whatsappWaId": "551933058878",
    "contactName": "Leonardo Silva",
    "messageType": "text",
    "text": "Quero pedir marmita",
    "rawPayload": {
      "key": {
        "id": "BAE5F2A4C9D8"
      }
    }
  }
}
```

Resposta:

```json
{
  "ok": true,
  "result": {
    "conversationId": "waconv_123",
    "customerProfileId": "cprof_123",
    "summary": "Cliente pediu marmita; recebeu canal direto.",
    "outboundCommand": {
      "id": "wacmd_123",
      "toPhone": "+551933058878",
      "text": "Para marmita e executivos, o pedido direto fica em https://expresso.cuiabar.com."
    }
  }
}
```

### `POST /api/internal/whatsapp/status`

Uso:

- propagar para o Worker status de mensagens outbound observados pelo Baileys

Body:

```json
{
  "status": {
    "providerMessageId": "BAE5F2A4C9D8",
    "status": "2",
    "timestamp": "2026-04-08T14:03:01.000Z",
    "rawPayload": {
      "source": "messages.update"
    }
  }
}
```

Resposta:

```json
{
  "ok": true
}
```

### `GET /api/internal/whatsapp/outbound/pull`

Uso:

- buscar comandos outbound pendentes para o bridge local

Query params:

- `limit`

Resposta:

```json
{
  "ok": true,
  "commands": [
    {
      "id": "wacmd_456",
      "conversationId": "waconv_123",
      "customerProfileId": "cprof_123",
      "phoneE164": "+551933058878",
      "text": "Oi, aqui e o Leonardo. Vou seguir seu atendimento por aqui.",
      "source": "admin",
      "intent": "humano",
      "templateKey": "manual_admin_reply",
      "ruleName": "manual_admin_reply",
      "createdAt": "2026-04-08T14:05:00.000Z"
    }
  ]
}
```

### `POST /api/internal/whatsapp/outbound/:id/ack`

Uso:

- confirmar envio realizado pelo Baileys

Body:

```json
{
  "providerMessageId": "BAE57E0A9C2D",
  "payload": {
    "jid": "551933058878@s.whatsapp.net",
    "source": "assistant"
  }
}
```

Resposta:

```json
{
  "ok": true,
  "commandId": "wacmd_123"
}
```

### `POST /api/internal/whatsapp/outbound/:id/fail`

Uso:

- registrar falha de envio no bridge local

Body:

```json
{
  "errorMessage": "Socket Baileys indisponivel para envio.",
  "payload": {
    "jid": "551933058878@s.whatsapp.net",
    "source": "admin"
  }
}
```

Resposta:

```json
{
  "ok": true,
  "commandId": "wacmd_456"
}
```

### `GET /api/internal/whatsapp/outbound/:id`

Uso:

- consultar um comando especifico

Resposta:

- retorna o registro completo de `whatsapp_outbound_commands`

### `POST /api/internal/whatsapp/crm/sync`

Uso:

- camada adaptadora REST para sincronizar o modulo WhatsApp com o CRM atual

Body:

```json
{
  "customerProfileId": "cprof_123",
  "conversationId": "waconv_123",
  "phoneE164": "+551933058878",
  "displayName": "Cliente Exemplo",
  "summary": "Cliente perguntou sobre delivery e recebeu o link direto.",
  "tags": ["delivery_interest", "intent:delivery"],
  "latestIntent": "delivery",
  "interactionType": "conversation_message",
  "messageText": "Quero pedir delivery"
}
```

Resposta:

```json
{
  "ok": true,
  "result": {
    "customerProfileId": "cprof_123",
    "crmContactId": "ctc_123"
  }
}
```

## Endpoints administrativos do Worker

### `GET /api/admin/whatsapp/overview`

Autenticacao:

- usuario logado no CRM

Resposta:

```json
{
  "ok": true,
  "metrics": {
    "activeConversations": 12,
    "openHandoffs": 3,
    "activeReservationFlows": 2,
    "pendingOutboundCommands": 1
  }
}
```

### `GET /api/admin/whatsapp/conversations`

Autenticacao:

- usuario logado no CRM

Query params opcionais:

- `status`
- `q`

Retorna:

- lista resumida de conversas
- intent atual
- tags
- resumo
- vinculo com `customer_profiles` e `contacts`

### `GET /api/admin/whatsapp/conversations/:id`

Autenticacao:

- usuario logado no CRM

Retorna:

- cabecalho da conversa
- perfil do cliente
- mensagens
- handoffs
- fluxo de reserva atual/mais recente

### `POST /api/admin/whatsapp/conversations/:id/handoff`

Autenticacao:

- somente `gerente`

Body:

```json
{
  "reason": "Assumir manualmente",
  "priority": "high",
  "notes": "Cliente VIP"
}
```

Efeito:

- abre ou atualiza `whatsapp_handoffs`
- move a conversa para `human_handoff`
- grava auditoria

### `POST /api/admin/whatsapp/conversations/:id/reply`

Autenticacao:

- somente `gerente`

Body:

```json
{
  "text": "Oi, aqui e o Leonardo. Vou seguir seu atendimento por aqui."
}
```

Efeito:

- cria um comando em `whatsapp_outbound_commands`
- o bridge Baileys local faz o envio real
- a conversa permanece em `human_handoff`
- o envio gera `ack` ou `fail` de volta ao Worker

## Endpoint local do bridge Baileys

### `GET http://127.0.0.1:8788/health`

Uso:

- verificar se o processo local esta conectado, com QR pendente ou com erro

Resposta:

```json
{
  "ok": true,
  "status": {
    "connection": "open",
    "qrAvailable": false,
    "pairingCode": null,
    "meId": "551933058878:12@s.whatsapp.net",
    "lastError": null,
    "lastInboundAt": "2026-04-08T14:02:11.000Z",
    "lastOutboundAt": "2026-04-08T14:02:12.000Z"
  }
}
```
