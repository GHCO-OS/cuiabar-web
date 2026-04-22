# Meta CAPI no `cuiabar.com`

## Resposta curta

O `cuiabar.com` nao precisa de um contêiner GTM server-side pago para enviar dados para a Meta.

O contêiner server-side zero-custo do projeto e a propria `Pages Function` da Cloudflare:

- endpoint: `https://cuiabar.com/api/meta-conversions`
- arquivo: `functions/api/meta-conversions.js`
- site/projeto: `cuiabar-site`

Esse endpoint ja recebe eventos do front e encaminha para a Meta Conversions API usando secrets do Cloudflare Pages.

## O que ja existe no projeto

- Pixel Meta carregado no navegador em `index.html`
- disparos de eventos no front em `src/lib/analytics.ts`
- rastreamento automatico em `src/components/AnalyticsTracker.tsx`
- envio server-side para `/api/meta-conversions`
- function server-side em `functions/api/meta-conversions.js`

## Secrets necessarios no Cloudflare Pages

No projeto `cuiabar-site`, ambiente `production`:

- `META_PIXEL_ID`
- `META_CAPI_TOKEN`
- `META_GRAPH_API_VERSION`

## Como validar sem poluir dados

Abra:

```txt
https://cuiabar.com/api/meta-conversions
```

Resposta esperada:

- `configured: true`
- `transport: cloudflare-pages-function`

## Como validar o envio real

1. Abra `https://cuiabar.com`
2. No DevTools > Network, filtre por `meta-conversions`
3. Acesse uma pagina ou clique em um CTA
4. O esperado e:

- `POST /api/meta-conversions`
- status `202`

## Como testar na Meta com `test_event_code`

Se quiser validar no painel de testes da Meta sem misturar com producao, envie um evento manual:

```bash
curl -X POST "https://cuiabar.com/api/meta-conversions" ^
  -H "content-type: application/json" ^
  -d "{\"event_name\":\"PageView\",\"event_time\":1710000000,\"event_id\":\"manual-test-001\",\"action_source\":\"website\",\"event_source_url\":\"https://cuiabar.com/\",\"user_data\":{\"fbp\":\"fb.1.1234567890.abcdef\"},\"custom_data\":{\"page_path\":\"/\"},\"test_event_code\":\"SEU_TEST_EVENT_CODE\"}"
```

## Sobre o modal da Meta pedindo contêiner de servidor

Se a Meta mostrar o fluxo de `Configurar contêiner de servidor` via Google Tag Manager:

- nao e obrigatorio seguir esse caminho para o `cuiabar.com`
- esse fluxo pressupoe um server container GTM hospedado em nuvem
- isso normalmente exige infraestrutura separada
- para este projeto, a alternativa sem custo adicional e usar a `Pages Function` ja existente

## Fluxo recomendado para o Cuiabar

1. Manter `Pixel + CAPI`
2. Usar a Cloudflare como camada server-side
3. Disparar eventos principais:
   - `PageView`
   - `ViewContent`
   - `Contact`
   - `Lead`
   - `InitiateCheckout`
4. Garantir que eventos importantes compartilhem `event_id` entre browser e servidor para deduplicacao

## Observacao operacional

Em validacao feita em producao, o site respondeu com sucesso a:

- `POST https://cuiabar.com/api/meta-conversions => 202`

Isso indica que o envio server-side ja esta ativo no site publicado.
