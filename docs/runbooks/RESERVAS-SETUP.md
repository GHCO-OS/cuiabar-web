# Reservas Setup

## Requisitos

- Node.js 20+
- npm 10+
- Wrangler autenticado
- banco D1 configurado em `wrangler.jsonc`
- credenciais Google com acesso a Gmail API e Google Calendar API

## Variaveis de ambiente

Secrets obrigatorios:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
npx wrangler secret put GMAIL_SENDER_NAME
```

Vars obrigatorias em `wrangler.jsonc`:

```txt
GOOGLE_CALENDAR_ID
RESERVATION_NOTIFICATION_EMAIL=cuiabar@cuiabar.net
RESERVATION_APP_BASE_URL=https://reservas.cuiabar.com
```

## Adaptacao em relacao ao pedido original

- `APP_BASE_URL` continua apontando para o CRM, porque ja era usado pela operacao existente.
- para o modulo de reservas, use `RESERVATION_APP_BASE_URL`
- o refresh token do Google precisa conter escopos de Gmail e Calendar ao mesmo tempo

## Local

1. Instale dependencias:

```bash
npm install
```

2. Aplique migration local:

```bash
npm run d1:migrate:local
```

3. Rode a API/Worker local:

```bash
npx wrangler dev
```

4. Em outro terminal, rode o frontend:

```bash
$env:VITE_RESERVATION_API_BASE_URL='http://127.0.0.1:8787'
npm run dev
```

5. Para abrir o app de reservas na base Vite local:

```txt
http://localhost:5173/?app=reservas
```

## Validacao tecnica

```bash
npm run lint
npm run build
npm run build:worker
```

## Teste funcional minimo

1. Abrir `/?app=reservas`
2. Preencher nome completo, data, horario e WhatsApp
3. Enviar a reserva
4. Conferir gravacao em `reservations`
5. Conferir logs em `reservation_logs`
6. Confirmar envio do e-mail do restaurante
7. Confirmar criacao do evento no Google Calendar
