# Deploy Reservas no Cloudflare

## Estrategia adotada

O modulo de reservas foi integrado ao mesmo repositório e ao mesmo Worker que ja existia para a operacao Cloudflare.

Isso permite:

- reaproveitar D1
- reaproveitar Gmail API
- manter o site principal sem quebra
- servir `reservas.cuiabar.com` com custom domain no Worker

## Configuracao importante

`wrangler.jsonc` agora inclui:

- rota `crm.cuiabar.com`
- rota `reservas.cuiabar.com`
- D1 `cuiabar_crm`
- assets do frontend em `dist`

## Ordem de deploy

1. autentique o Wrangler:

```bash
npx wrangler whoami
```

2. aplique as migrations remotas:

```bash
npm run d1:migrate:remote
```

3. gere o build:

```bash
npm run build
npm run build:worker
```

4. publique o Worker:

```bash
npm run deploy:worker
```

## DNS e custom domain

No Cloudflare, confirme que:

- a zona `cuiabar.com` esta na conta correta
- `reservas.cuiabar.com` esta apontado para o Worker como custom domain
- `crm.cuiabar.com` continua configurado

## Como o frontend escolhe o app certo

O bundle principal detecta o hostname:

- `crm.cuiabar.com` -> CRM
- `reservas.cuiabar.com` -> portal de reservas
- outros hostnames -> site principal

## Smoke test de producao

1. abrir `https://reservas.cuiabar.com`
2. enviar uma reserva de teste
3. validar linha em `reservations`
4. validar `reservation_logs`
5. validar e-mail do restaurante
6. validar evento no Google Calendar

## Rollback

Como a mudanca e incremental:

- o site principal continua sendo servido normalmente
- o rollback principal e republicar a versao anterior do Worker
- se necessario, a rota antiga `/reservas` do site continua apontando para o CTA do subdominio
