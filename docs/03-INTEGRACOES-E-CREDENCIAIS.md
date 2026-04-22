# Integrações e credenciais

Atualizado em: 2026-04-22

## Onde consultar segredos

O inventário consolidado de segredos fica apenas em materiais restritos, quando presentes localmente:

- `../ACESSOS-CHAVES-PROJETO.md`
- `../KIT-PORTABILIDADE/confidencial/02-APIS-E-CHAVES.md`

Neste documento devem permanecer apenas:

- nomes de integrações
- nomes de variáveis
- responsabilidades operacionais

## Cloudflare

Usado para:

- Cloudflare Pages
- Cloudflare Workers
- D1
- KV
- Workers AI

Arquivos principais:

- `wrangler.jsonc`
- `functions/`
- `worker/`

## Google

Usado para:

- login interno
- Gmail
- Calendar
- Search Console
- Google Ads
- Gemini API

Segredos recorrentes:

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

Observações:

- O `MeuCuiabar` usa Google OAuth no Worker para autenticação e coleta de consentimentos.
- A integração com Gemini está apenas inventariada. Não há uso ativo dessa API no runtime do site, do CRM ou do Worker neste momento.

## Meta

Usado para:

- Pixel
- Conversions API

Segredos esperados:

- `META_GRAPH_API_VERSION`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_CAPI_TOKEN`

## WhatsApp e atendimento

### Backend canônico

- `worker/whatsapp/`

### Worker dedicado e experimental

- `worker/whatsapp-intelligence/`

### Ponte local

- `services/whatsapp-baileys/`

Segredos recorrentes:

- `WHATSAPP_WORKER_BASE_URL`
- `WHATSAPP_INTERNAL_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`
- `CRM_INTERNAL_TOKEN`

Segredos do módulo dedicado:

- `WEBHOOK_SHARED_SECRET`
- `CRM_INTERNAL_SECRET`
- `BAILEYS_GATEWAY_TOKEN`

## CRM e reservas

Usado para:

- contatos
- campanhas
- envio de e-mail
- reservas
- integração com calendários
- atendimento omnichannel

Recursos principais:

- `src/crm/`
- `src/reservations/`
- `worker/reservations/`
- `migrations/`

## Blog e operação editorial

Status atual:

- fora da superfície principal do produto
- mantido como frente separável
- runbooks preservados em `docs/runbooks/`

Variáveis recorrentes:

- `BLOG_EDITOR_UPSTREAM_URL`
- `BLOG_EDITOR_TOKEN`
- `BLOG_EDITOR_ALLOWED_EMAILS`
- `BLOG_MEDIA_PUBLIC_BASE_URL`

## Zoho

Integração legada. Só deve ser retomada quando a demanda exigir.

Segredos históricos:

- `ZOHO_ACCOUNTS_DOMAIN`
- `ZOHO_API_DOMAIN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`

## Regra prática

Para qualquer novo ambiente:

1. não assumir que credenciais antigas continuam válidas;
2. validar acesso no provedor antes de operar;
3. preferir secret manager, Cloudflare Secrets ou GitHub Secrets;
4. documentar nomes de variáveis, nunca valores sensíveis.
