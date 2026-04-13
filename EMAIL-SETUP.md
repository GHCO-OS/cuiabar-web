# Email Setup

## Objetivo

Enviar:

- notificacao para `cuiabar@cuiabar.net`
- copia para o cliente quando houver e-mail

## Arquitetura

- envio via Gmail API oficial
- credenciais guardadas em Cloudflare Secrets
- HTML + texto simples
- falhas registradas em `reservation_logs`

## Secrets necessarios

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
npx wrangler secret put GMAIL_SENDER_NAME
```

## Vars recomendadas

```txt
DEFAULT_FROM_EMAIL
DEFAULT_FROM_NAME
DEFAULT_REPLY_TO
RESERVATION_NOTIFICATION_EMAIL=cuiabar@cuiabar.net
RESERVATION_APP_BASE_URL=https://reservas.cuiabar.com
```

## Regras do fluxo implementado

- restaurante recebe assunto:
  - `[Nova Reserva] Nome do cliente - data - hora`
- cliente recebe assunto:
  - `Sua reserva no Cuiabar foi registrada`
- se o cliente nao informar e-mail:
  - apenas o restaurante recebe

## Observacoes operacionais

- o remetente precisa ser compativel com a conta autorizada no Google
- SPF, DKIM e DMARC continuam recomendados
- como o projeto reaproveita a camada Gmail do Worker, o header MIME base segue o mesmo padrao interno do repositório

## Validacao

1. envie uma reserva de teste com e-mail
2. confirme o recebimento em `cuiabar@cuiabar.net`
3. confirme a copia no e-mail do cliente
4. se falhar, consulte `reservation_logs`
