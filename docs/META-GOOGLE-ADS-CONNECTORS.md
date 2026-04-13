# Meta e Google Ads - Conectores server-side

Atualizado em: 2026-04-07

## O que foi publicado

- Meta:
  - endpoint `POST /api/meta-conversions` agora continua gravando no CRM e tambem tenta encaminhar o evento para a Meta Conversions API quando o Worker tiver os secrets corretos
  - painel em `Configuracoes` com status, teste e sync manual
  - sync manual de campanhas por ad account
  - sync manual de leads por lead forms
  - opcao de transformar leads da Meta em `contacts` no CRM

- Google Ads:
  - painel em `Configuracoes` com status, teste e sync manual
  - validacao de customer via Google Ads API
  - indexacao de metricas de campanha no D1
  - estrutura para upload server-side de conversao por `gclid`, `gbraid` e `wbraid`
  - tentativa automatica de upload de conversao no fluxo `POST /api/public/contacts/capture`, quando houver click ID do Google na captura

## Tabelas adicionadas

- `ad_platform_accounts`
- `ad_platform_sync_runs`
- `ad_platform_campaign_metrics`
- `ad_platform_leads`
- `ad_platform_conversion_uploads`

Migration aplicada:

- `0006_media_connectors.sql`

## Configuracoes nao sensiveis do painel

As configuracoes operacionais ficam em `Configuracoes` e sao salvas em `app_settings`:

- `meta_connector`
- `google_ads_connector`

Exemplos de campos esperados:

### Meta

```json
{
  "adAccountId": "act_1234567890",
  "leadFormIds": ["123456789012345", "987654321098765"],
  "lookbackDays": 30,
  "autoCreateContacts": true
}
```

### Google Ads

```json
{
  "customerId": "1234567890",
  "loginCustomerId": "1234567890",
  "conversionAction": "customers/1234567890/conversionActions/111111111",
  "lookbackDays": 30,
  "autoUploadLeadConversions": true,
  "conversionValue": 1,
  "currencyCode": "BRL"
}
```

## Secrets esperados no Worker

### Meta

- `META_PIXEL_ID`
- `META_CAPI_TOKEN`
- `META_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION`

Observacao:
- `META_ACCESS_TOKEN` serve para leitura Graph API
- se o mesmo token cobrir leitura + CAPI, ele pode ser reutilizado

### Google Ads

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- opcionalmente:
  - `GOOGLE_ADS_CUSTOMER_ID`
  - `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
  - `GOOGLE_ADS_CONVERSION_ACTION`
  - `GOOGLE_ADS_API_VERSION`

## Status no momento da publicacao

- Meta server-side no Worker:
  - codigo publicado
  - secrets ainda nao presentes no Worker no momento deste registro
- Google Ads server-side:
  - codigo publicado
  - secrets ainda nao presentes no Worker no momento deste registro

## Proximo passo operacional

1. subir os secrets da Meta no Worker
2. preencher JSON operacional da Meta no painel
3. subir os secrets do Google Ads no Worker
4. preencher JSON operacional do Google Ads no painel
5. testar conexao
6. rodar sync manual
7. validar se capturas com `gclid/gbraid/wbraid` estao gerando uploads de conversao
