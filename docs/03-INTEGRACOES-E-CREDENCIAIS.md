# Integracoes e credenciais

Atualizado em: 2026-04-21

## Onde consultar os segredos

Inventario consolidado de chaves compartilhadas por conversa:

- `../ACESSOS-CHAVES-PROJETO.md`
- `../KIT-PORTABILIDADE/02-APIS-E-CHAVES.md`

Esse material deve permanecer restrito.

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

Estado operacional atual:
- autostart do bridge local desligado
- modulo `worker/whatsapp-intelligence/` isolado por flag para refinamento futuro

Segredos do bridge local:
- `WHATSAPP_WORKER_BASE_URL`
- `WHATSAPP_INTERNAL_TOKEN`

Segredos Cloudflare e AI:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`

Adaptador CRM:
- `CRM_INTERNAL_TOKEN`

Referencias operacionais:
- `docs/06-WHATSAPP-AI-ARQUITETURA.md`
- `docs/07-WHATSAPP-AI-ENDPOINTS.md`
- `docs/10-AMBIENTE-LOCAL-E-IDS.md`

### GitHub

Usado para:
- versionamento principal do codigo
- continuidade entre maquinas
- backup externo do workspace operacional

Repositorio principal:
- `https://github.com/GHCO-OS/cuiabar-web`

Observacao:
- o GitHub nao substitui o deploy no Cloudflare

### Google

Usado para:
- Google Ads e tag
- Search Console
- Calendar
- Gmail e OAuth
- conta de servico

Documentos de apoio:
- `docs/runbooks/SEO-SETUP.md`
- `docs/runbooks/GOOGLE-CALENDAR-SETUP.md`
- `docs/runbooks/GMAIL-OAUTH-SETUP.md`
- `docs/runbooks/EMAIL-SETUP.md`

Bindings e secrets recorrentes no Worker:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_ADS_API_VERSION`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`

### Zoho

Usado para:
- OAuth e integracoes operacionais legadas com Zoho

Bindings e secrets esperados no Worker:
- `ZOHO_ACCOUNTS_DOMAIN`
- `ZOHO_API_DOMAIN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`

### Bing

Usado para:
- Bing Webmaster

## Integracoes desligadas do tronco principal

- editor e proxy do blog via Worker
- assets editoriais e publicacao local do blog
- autostart do bridge Baileys

Qualquer reativacao desses fluxos deve acontecer primeiro em branch dedicada.

## Regra pratica

Para qualquer Codex novo:

1. nunca assuma que um token no chat ainda esta valido;
2. confirme primeiro no provedor;
3. prefira secrets no Cloudflare, GitHub ou cofre em vez de texto puro;
4. se houver duvida, rotacione o token em vez de insistir num acesso antigo.
