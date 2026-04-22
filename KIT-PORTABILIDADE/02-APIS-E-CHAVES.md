# APIs e chaves para reutilizacao

Atualizado em: 2026-04-07

ATENCAO

- Este arquivo contem segredos em texto puro.
- O usuario pediu explicitamente para consolidar as chaves sem se preocupar com a seguranca neste momento.
- Mesmo assim, varias credenciais aqui devem ser rotacionadas depois.

## 1. Cloudflare

### Token acessivel no ambiente atual

- `CLOUDFLARE_API_TOKEN`
- Valor:
  `cfut_EbvYjm7kkFI7EaNgNgATvDwwMAsi1R1SPMwgNWa64c5f3bc6`

### Configuracao principal do Worker

Arquivo:

- `../wrangler.jsonc`

Recursos confirmados:

- Worker principal: `cuiabar-crm`
- dominio CRM: `crm.cuiabar.com`
- dominio reservas: `reservas.cuiabar.com`
- blog publico legado: `blog.cuiabar.com`
- banco D1:
  `1c8de55c-c5f4-4985-8c5b-5ac1a010214d`

### Secrets existentes no Cloudflare Worker

Os nomes foram exportados para:

- `./03-CLOUDFLARE-SECRETS-NOMES.json`

Observacao:

- os valores dessas secrets remotas nao sao recuperaveis via `wrangler secret list`
- se outra ferramenta precisar dos valores, sera preciso usar as credenciais originais ou redefinir as secrets

## 2. Google

### Google OAuth e Calendar publicados em `wrangler.jsonc`

- `GOOGLE_AUTH_CLIENT_ID`
  `649268689379-qsc4itpdh8s8028bn0j6shpijr0ed0qr.apps.googleusercontent.com`

- `GOOGLE_ALLOWED_EMAILS`
  `leonardo@cuiabar.net,cuiabar@cuiabar.net`

- `GOOGLE_MANAGER_EMAILS`
  `leonardo@cuiabar.net,cuiabar@cuiabar.net`

- `GOOGLE_CALENDAR_ID`
  `c_cb44b5a5c24377de0d7ec7a6bb840f4ed667ce355c9b4611a4b9d9e1ff7e5782@group.calendar.google.com`

### Conta de servico Google

Copia salva nesta pasta:

- `./google-service-account-meucuiabar.json`

Campos principais:

- `project_id`
  `meucuiabar`
- `client_email`
  `cuiabar@meucuiabar.iam.gserviceaccount.com`
- `client_id`
  `115666958510285395712`
- `private_key_id`
  `54851451029796332ce43da8b18f94bedf4d996e`

## 3. Gmail / envio

Secrets remotas existentes por nome:

- `GMAIL_SENDER_EMAIL`
- `GMAIL_SENDER_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

Valores nao sensiveis publicados em `wrangler.jsonc`:

- `DEFAULT_FROM_EMAIL`
  `contato@cuiabar.com`
- `DEFAULT_FROM_NAME`
  `Cuiabar Restaurantes | Campinas`
- `DEFAULT_REPLY_TO`
  `contato@cuiabar.com`

## 4. Meta / Facebook

Fonte:

- `../ACESSOS-CHAVES-PROJETO.md`

Inventario reutilizavel:

- Meta Pixel ID / Dataset ID
  `1385099743118536`
- Business Manager ID
  `462678824734850`
- Conta admin
  `61579111250695`
- Test event code
  `TEST29789`
- Token historico 1
  `EAAGkUXrstyABQ28FZAUHXLL1SsXAK4hbdFGuyvCZAIMqPHXtgZANut0RRrwtws2anRadIGbfvdZCbkkZAY11g59aUz9cZAYNLQ67ZBNopXAFxY5gfIAZCOTUj4UdrBj2ZBYA2dT2G9IwQaZCZBx0vSZAd1ntNbzUmoTKYsPKXrsfqOBgllag6yQ5DXOzkPb4u0zZA3wZDZD`
- Token historico 2
  `EAAM552efb5UBQ2aZBpvkONcB4V5k2Thx8sR2uW8YfzXZAnlxA9PkkMdn03VVEd6D6qqaTokMfr3raq3fUhZBRlZAAth6U0E7RzPQxFFNkqoymoH4VkF3yCo1YZBfXHGZCYmV8tlCwIy8ZBFzefZCDiR22o6R0yEN8LYZB7fAmVwr4ZAyEKDSdJFVF6LRvHaNmhgdmicLoqM3uAYsguQzaKLOg5Si88HwYvyw4tmMNF`

## 5. Google Ads / Search / Tag

Fonte:

- `../ACESSOS-CHAVES-PROJETO.md`

Valores encontrados:

- Google Ads ID
  `AW-11311363070`
- Google Tag ID
  `GT-5528H7SD`
- Google CSE `cx`
  `04295c6bbf47e4f65`

## 6. Bing

Fonte:

- `../ACESSOS-CHAVES-PROJETO.md`

Valor encontrado:

- Bing Webmaster API key
  `fb1167784fbb40b7aa9f1881a82d3e57`

## 7. Observacoes para outras ferramentas

- Para deploy e operacao do projeto, os arquivos de referencia mais importantes continuam sendo:
  - `../START-AQUI.md`
  - `../docs/00-INDICE-GERAL.md`
  - `../docs/02-OPERACAO-E-DEPLOY.md`
  - `../docs/03-INTEGRACOES-E-CREDENCIAIS.md`
- Para qualquer ferramenta nova, este kit funciona melhor como ponto de partida rapido, nao como unica fonte de verdade.
