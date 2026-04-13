# Google Calendar Setup

## Objetivo

Criar automaticamente um evento no calendario de reservas do Cuiabar sempre que uma nova reserva for registrada.

## APIs necessarias

- Gmail API
- Google Calendar API

## Escopos recomendados no refresh token

O refresh token usado pelo Worker precisa ter, no minimo:

- envio pelo Gmail API
- criacao e atualizacao de eventos no Google Calendar

Na pratica, gere o token com os escopos necessarios para:

- `gmail.send`
- `calendar.events`

## Passo a passo

1. No Google Cloud, habilite Gmail API e Google Calendar API.
2. Use o mesmo projeto para os dois servicos.
3. Gere ou atualize o OAuth client.
4. Refaca a autorizacao para gerar um `GOOGLE_REFRESH_TOKEN` com os escopos de Gmail e Calendar.
5. Salve as credenciais no Cloudflare com `wrangler secret put`.
6. Configure `GOOGLE_CALENDAR_ID` em `wrangler.jsonc`.

## Qual calendario usar

Use o calendario operacional de reservas, nao o calendario publico do site.

Exemplos de IDs comuns:

- e-mail principal
- calendario compartilhado do Google Workspace
- calendario de grupo `...@group.calendar.google.com`

## O que o Worker cria

- titulo: `Reserva Cuiabar - Nome - X pessoas`
- descricao com todos os dados da reserva
- inicio na data/hora escolhida
- duracao de 2 horas
- convidado do cliente, quando houver e-mail
- reminders explicitos:
  - 720 minutos
  - 300 minutos
  - 60 minutos

## Falhas de calendario

Se a criacao do evento falhar:

- a reserva continua salva no banco
- o erro vai para `reservation_logs`
- o campo `google_calendar_event_id` permanece vazio

## Verificacao

Depois de uma reserva de teste:

1. abra o calendario configurado
2. confirme se o evento existe
3. valide os reminders
4. valide o convidado quando o cliente informou e-mail
