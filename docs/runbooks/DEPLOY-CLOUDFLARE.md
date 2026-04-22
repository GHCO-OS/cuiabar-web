# Deploy no Cloudflare

## 1. Autenticar o Wrangler

```bash
npx wrangler login
```

Valide:

```bash
npx wrangler whoami
```

## 2. Criar o banco D1

```bash
npx wrangler d1 create cuiabar_crm
```

Copie o `database_id` retornado e substitua `REPLACE_WITH_D1_DATABASE_ID` em `wrangler.jsonc`.

## 3. Aplicar migrations

Local:

```bash
npm run d1:migrate:local
```

Remoto:

```bash
npm run d1:migrate:remote
```

## 4. Definir secrets obrigatorios

```bash
npx wrangler secret put SETUP_ADMIN_TOKEN
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
npx wrangler secret put GMAIL_SENDER_NAME
```

Opcional, mas recomendado:

```bash
npx wrangler secret put DEFAULT_REPLY_TO
```

## 5. Revisar `wrangler.jsonc`

Pontos principais:

- `name`: `cuiabar-crm`
- `main`: `worker/index.ts`
- `assets.directory`: `./dist`
- `routes[0].pattern`: `crm.cuiabar.com`
- `routes[0].custom_domain`: `true`
- `triggers.crons`: `* * * * *`

## 6. Build e deploy

```bash
npm run build
npm run deploy
```

## 7. DNS / custom domain

O Worker ja esta configurado para custom domain em `crm.cuiabar.com`. Se o deploy reclamar de dominio/zone:

1. Confirme que `cuiabar.com` esta na conta Cloudflare correta.
2. Confirme permissao para criar custom domain.
3. Rode novamente `npx wrangler deploy`.

## 8. Bootstrap do gerente inicial

Depois do deploy:

1. Acesse `https://crm.cuiabar.com/setup`
2. Informe o secret `SETUP_ADMIN_TOKEN`
3. Crie o primeiro usuario `gerente`

## 9. Teste final minimo

1. Login administrativo
2. Criar um contato
3. Criar lista ou segmento
4. Criar template
5. Criar campanha
6. Enviar teste
7. Enviar campanha pequena
8. Clicar em um link rastreado
9. Usar o unsubscribe
10. Ver dashboard, relatorios e auditoria

## Observacao do estado atual

No ambiente em que este trabalho foi executado, `npx wrangler whoami` retornou que o Wrangler nao esta autenticado. Por isso o deploy real nao foi concluido daqui.
