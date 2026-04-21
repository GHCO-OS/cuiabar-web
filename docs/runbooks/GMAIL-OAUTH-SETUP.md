# Gmail OAuth 2.0 Setup

## Objetivo

Usar a API oficial do Gmail com `users.messages.send`, sem expor credenciais no frontend e sem SMTP improvisado.

## Escopo da integracao

- OAuth 2.0 com refresh token
- Access token renovado no Worker
- MIME multipart/alternative com HTML + text/plain
- Headers `List-Unsubscribe` e `List-Unsubscribe-Post`

## Passo a passo

## 1. Criar projeto no Google Cloud

1. Abra o Google Cloud Console.
2. Crie ou selecione um projeto.
3. Ative a Gmail API.

## 2. Configurar consent screen

1. Configure o OAuth consent screen.
2. Use conta organizacional ou a conta Gmail que sera remetente.
3. Adicione os usuarios de teste, se o app ainda nao estiver publicado.

## 3. Criar OAuth Client

Crie um client OAuth 2.0 do tipo adequado para obter o refresh token.

Em cenarios pequenos, o mais simples costuma ser:

- OAuth client para app web
- Redirect URI local para concluir a concessao

## 4. Obter refresh token

Voce precisa de um fluxo que entregue:

- `client_id`
- `client_secret`
- `refresh_token`

O Worker usa esses tres valores para renovar o access token automaticamente.

## 5. Configurar os secrets no Cloudflare

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
npx wrangler secret put GMAIL_SENDER_NAME
```

## 6. Confirmar remetente

O remetente precisa estar coerente com a conta autorizada no Gmail e com a autenticacao do dominio.

Checklist minimo:

- conta Gmail autorizada
- `GMAIL_SENDER_EMAIL` valido
- `From:` consistente
- `Reply-To:` consistente
- SPF, DKIM e DMARC ajustados para o dominio

## 7. Teste funcional

1. Crie um template
2. Crie uma campanha
3. Use `send test`
4. Verifique:
   - assunto
   - HTML
   - text/plain
   - unsubscribe
   - link tracking

## Limites e observacoes

- O Gmail tem limites operacionais e politicas proprias.
- O sistema trata click tracking como metrica central, nao abertura.
- Falhas sincronas de envio sao registradas em `send_events`.
- Bounces ficam com estrutura pronta, mas sua observacao pode ser parcial dependendo do que o Gmail expuser ao fluxo.
