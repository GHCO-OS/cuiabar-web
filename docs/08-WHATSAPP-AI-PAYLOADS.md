# WhatsApp AI - payloads de exemplo

Atualizado em: 2026-04-08

## 1. Inbound normalizado enviado pelo Baileys

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
        "remoteJid": "551933058878@s.whatsapp.net",
        "id": "BAE5F2A4C9D8",
        "fromMe": false
      },
      "pushName": "Leonardo Silva"
    }
  }
}
```

## 2. Resposta do Worker com comando imediato

```json
{
  "ok": true,
  "result": {
    "conversationId": "waconv_123",
    "customerProfileId": "cprof_123",
    "summary": "Cliente pediu marmita; recebeu orientacao para expresso.cuiabar.com.",
    "outboundCommand": {
      "id": "wacmd_123",
      "toPhone": "+551933058878",
      "text": "Para marmita e executivos, o pedido direto fica em https://expresso.cuiabar.com."
    }
  }
}
```

## 3. Pull de outbound pendente

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

## 4. ACK de envio do Baileys

```json
{
  "providerMessageId": "BAE57E0A9C2D",
  "payload": {
    "jid": "551933058878@s.whatsapp.net",
    "source": "assistant"
  }
}
```

## 5. FAIL de envio do Baileys

```json
{
  "errorMessage": "Socket Baileys indisponivel para envio.",
  "payload": {
    "jid": "551933058878@s.whatsapp.net",
    "source": "admin"
  }
}
```

## 6. Status outbound propagado pelo bridge

```json
{
  "status": {
    "providerMessageId": "BAE57E0A9C2D",
    "status": "2",
    "timestamp": "2026-04-08T14:05:03.000Z",
    "rawPayload": {
      "source": "messages.update"
    }
  }
}
```

## 7. Payload de sync interno com CRM

```json
{
  "customerProfileId": "cprof_123",
  "conversationId": "waconv_123",
  "phoneE164": "+551933058878",
  "displayName": "Leonardo Silva",
  "summary": "Cliente pediu marmita; recebeu orientacao para expresso.cuiabar.com.",
  "tags": [
    "marmita_interest",
    "intent:marmita"
  ],
  "latestIntent": "marmita",
  "interactionType": "conversation_message",
  "messageText": "Quero pedir marmita",
  "metadata": {
    "outboundCommandId": "wacmd_123"
  }
}
```

## 8. Body de reply manual no admin

```json
{
  "text": "Oi, vou seguir daqui com voce. Para adiantar, me confirme quantas pessoas sao."
}
```

## 9. Body de handoff manual no admin

```json
{
  "reason": "Cliente pediu gerente",
  "priority": "urgent",
  "notes": "Tratar ainda hoje"
}
```

## 10. Status local do bridge

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
