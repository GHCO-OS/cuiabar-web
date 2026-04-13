# Modulo de Reservas Cuiabar

## Objetivo

Este modulo cria uma area publica de reservas para `reservas.cuiabar.com`, integrada ao projeto existente sem reescrever a stack.

## O que foi implementado

- app publico React dedicado ao host `reservas.cuiabar.com`
- formulario completo com os campos do fluxo de reserva
- validacao no frontend e no backend
- persistencia em Cloudflare D1
- envio de e-mail via Gmail API
- criacao automatica de evento no Google Calendar com reminders de 12h, 5h e 1h
- tela final de sucesso com resumo e codigo da reserva
- logs estruturados em `reservation_logs`
- endpoints administrativos iniciais para listagem, exportacao CSV e atualizacao de status

## Estrutura principal

```txt
src/reservations/
  ReservationsApp.tsx
  api.ts
  constants.ts
  types.ts
  utils.ts
  components/
    ReservationFormPage.tsx
    ReservationSuccessPage.tsx

worker/reservations/
  constants.ts
  email.ts
  repository.ts
  routes.ts
  service.ts
  types.ts
  validation.ts

worker/services/google/
  calendarService.ts

migrations/
  0004_reservations.sql
```

## Endpoints criados

- `POST /api/reservations`
- `GET /api/admin/reservations`
- `GET /api/admin/reservations/export.csv`
- `PATCH /api/admin/reservations/:id/status`

## Status suportados

- `pending`
- `confirmed`
- `cancelled`
- `expired`
- `completed`

## Observacao importante sobre envs

Este repositório ja usava `APP_BASE_URL` para o CRM. Por isso, o modulo de reservas usa `RESERVATION_APP_BASE_URL` como URL publica principal do portal. O backend aceita a coexistencia dos dois fluxos no mesmo Worker.
