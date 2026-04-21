# Migrations

Este diretório guarda o histórico real de schema do projeto.

## Regra principal

Migrações já publicadas não devem ser renumeradas nem reordenadas para "ficar bonito".

Se uma numeração antiga ficou duplicada, isso passa a ser tratado como fato histórico do repositório, não como convite para reescrever o passado.

## Ordem operacional atual

1. `0001_initial_crm.sql`
2. `0002_google_auth.sql`
3. `0003_public_interactions_and_zoho_sync.sql`
4. `0004_reservations.sql`
5. `0005_cloudflare_native_blog.sql`
6. `0005_whatsapp.sql`
7. `0005_whatsapp_ai_assistant.sql`
8. `0006_media_connectors.sql`
9. `0006_meucuiabar_google_access.sql`
10. `0006_whatsapp_baileys_outbound.sql`
11. `0007_campaign_open_tracking.sql`

## Convenção daqui para frente

- novas migrações devem usar o próximo prefixo inteiro livre
- não reutilizar prefixo já existente
- nomear por domínio real da mudança, sem `final`, `novo`, `ajuste2`

## Classificação prática

- core compartilhado: `0001`, `0002`, `0003`, `0006_media_connectors`
- Cuiabar Atende: `0004`, `0005_whatsapp*`, `0006_whatsapp_baileys_outbound`, `0007`
- MeuCuiabar: `0006_meucuiabar_google_access`
- Cuiabar Web/blog: `0005_cloudflare_native_blog`
