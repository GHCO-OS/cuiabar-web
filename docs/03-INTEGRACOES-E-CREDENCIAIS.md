# Integracoes e credenciais

Atualizado em: 2026-04-13

## Onde consultar os segredos

Inventario consolidado de chaves compartilhadas por conversa:

- `../ACESSOS-CHAVES-PROJETO.md`
- `../KIT-PORTABILIDADE/02-APIS-E-CHAVES.md`

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

### Google

Usado para:
- Google Ads / tag
- Search Console
- Calendar
- Gmail / OAuth
- conta de servico

Documentos de apoio:
- `SEO-SETUP.md`
- `GOOGLE-CALENDAR-SETUP.md`
- `GMAIL-OAUTH-SETUP.md`
- `EMAIL-SETUP.md`

### Bing

Usado para:
- Bing Webmaster

## Regra pratica

Para qualquer Codex novo:

1. nunca assuma que um token no chat ainda esta valido;
2. confirme primeiro no provedor;
3. prefira secrets no Cloudflare/GitHub/cofre em vez de texto puro;
4. se houver duvida, rotacione o token em vez de insistir num acesso antigo.
