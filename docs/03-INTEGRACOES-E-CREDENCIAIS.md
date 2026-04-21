# Integracoes e credenciais

Atualizado em: 2026-04-17

## Onde consultar os segredos

Inventario consolidado de chaves compartilhadas por conversa:

- `../ACESSOS-CHAVES-PROJETO.md` quando existir nesta copia local
- `../KIT-PORTABILIDADE/confidencial/02-APIS-E-CHAVES.md`

Esse arquivo deve permanecer restrito.

## Integracoes principais

### Cloudflare

Usado para:
- hosting do site principal
- Worker do CRM
- reservas
- D1
- Workers AI
- KV
- Pages Functions

Arquivos principais:
- `wrangler.jsonc`
- `functions/`
- `worker/`

Referencias operacionais:

- `docs/02-OPERACAO-E-DEPLOY.md`
- `docs/10-AMBIENTE-LOCAL-E-IDS.md`

### Meta

Usado para:
- Pixel
- Conversions API

Arquivos principais:
- `functions/api/meta-conversions.js`
- `src/lib/analytics.ts`
- `src/components/AnalyticsTracker.tsx`
- `index.html`

Bindings e secrets esperados no Worker:

- `META_GRAPH_API_VERSION`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_CAPI_TOKEN`

### WhatsApp / atendimento AI

Transporte:

- Baileys local em `services/whatsapp-baileys/`
- runtime local preparado por `scripts/run-baileys-runtime.ps1`

Segredos do bridge local:

- `WHATSAPP_WORKER_BASE_URL`
- `WHATSAPP_INTERNAL_TOKEN`

Segredos Cloudflare/AI:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`

Adaptador CRM:

- `CRM_INTERNAL_TOKEN`

Referencias operacionais:

- `docs/06-WHATSAPP-AI-ARQUITETURA.md`
- `docs/07-WHATSAPP-AI-ENDPOINTS.md`
- `docs/10-AMBIENTE-LOCAL-E-IDS.md`

### WhatsApp Intelligence (Llama + CRM interno)

- worker dedicado: `worker/whatsapp-intelligence/`
- endpoint inbound: `POST /webhook/baileys`
- durable object de sessao/saida: `BaileysSessionDO`
- tabelas operacionais: `customers`, `wa_inbound_events`, `wa_conversations`, `wa_action_logs`, `wa_reservation_requests`
- segredos esperados (somente em ambiente):
  - `WEBHOOK_SHARED_SECRET`
  - `CRM_INTERNAL_SECRET`
  - `BAILEYS_GATEWAY_TOKEN`

Observacao:

- `create_reservation_request` gera fila de solicitacoes para conciliacao com o fluxo oficial de reservas;
- evitar escrita direta na tabela `reservations` fora do contrato ja validado no backend principal.

### GitHub

Usado para:
- versionamento principal do codigo
- continuidade entre maquinas
- backup externo do workspace operacional

Repositorio principal:

- `https://github.com/cuiabar/cuiabar-web`

Observacao:

- o GitHub nao substitui o deploy no Cloudflare
- o inventario desta maquina e do bridge local fica em `docs/10-AMBIENTE-LOCAL-E-IDS.md`

### Base44

Usado para:
- referencia de UI/UX e features do `MeuCuiabar`
- fonte do scraping que originou o seed operacional atual do `MeuCuiabar`

Arquivos principais:
- `src/meucuiabar/base44/`
- `src/meucuiabar/base44/api/base44Client.js`
- `src/meucuiabar/base44/seed/`
- `ops-artifacts/base44-export/`

Observacao:
- o Base44 deixou de ser runtime de autenticacao do `MeuCuiabar`
- o seed raspado continua servindo como base local temporaria ate a extracao definitiva para Worker/D1

### Google

Usado para:
- Google Ads / tag
- Search Console
- Calendar
- Gmail / OAuth
- Gemini API
- conta de servico
- login interno do `MeuCuiabar`
- consentimento de calendario/agenda e lembretes do `MeuCuiabar`

Documentos de apoio:
- `docs/guias-legados/SEO-SETUP.md`
- `docs/guias-legados/GOOGLE-CALENDAR-SETUP.md`
- `docs/guias-legados/GMAIL-OAUTH-SETUP.md`
- `docs/guias-legados/EMAIL-SETUP.md`

Bindings e secrets recorrentes no Worker:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_CLIENT_ID`
- `GOOGLE_AUTH_CLIENT_SECRET`
- `MEUCUIABAR_MASTER_EMAILS`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_ADS_API_VERSION`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_GEMINI_API_KEY`

Observacao:
- o `MeuCuiabar` passa a usar Google OAuth no Worker para coletar nome, sobrenome, e-mail e consentimentos de `calendar` e `tasks`
- novos usuarios ficam pendentes de aprovacao ate liberacao por `leonardo@cuiabar.net` ou `cuiabar@cuiabar.net`
- o acesso Gemini foi apenas inventariado nesta copia local e nao esta integrado ao runtime do site, CRM ou Worker neste momento
- se a Gemini API for ativada depois, preferir guardar a chave no cofre principal e espelhar no runtime apenas por secret com nome estavel

### Blog editorial

Usado para:
- editor protegido em `blog.cuiabar.com/editor`
- upload e entrega de midia do blog
- automacao editorial e operacao de assets

Bindings e secrets esperados no Worker:

- `BLOG_EDITOR_UPSTREAM_URL`
- `BLOG_EDITOR_TOKEN`
- `BLOG_EDITOR_ALLOWED_EMAILS`
- `BLOG_MEDIA_PUBLIC_BASE_URL`
- binding R2 `BLOG_MEDIA`

### Zoho

Usado para:
- OAuth e integracoes operacionais com Zoho

Bindings e secrets esperados no Worker:

- `ZOHO_ACCOUNTS_DOMAIN`
- `ZOHO_API_DOMAIN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`

### Bing

Usado para:
- Bing Webmaster

## Regra pratica

Para qualquer Codex novo:

1. nunca assuma que um token no chat ainda esta valido;
2. confirme primeiro no provedor;
3. prefira secrets no Cloudflare/GitHub/cofre em vez de texto puro;
4. se houver duvida, rotacione o token em vez de insistir num acesso antigo.
