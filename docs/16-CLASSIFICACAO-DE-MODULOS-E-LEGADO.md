# Classificacao de modulos e legado

Atualizado em: 2026-04-17

## Objetivo

Classificar os modulos reais do repositorio entre:

- `GHCO OS`
- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

E registrar o que e:

- fonte principal
- frente complementar
- experimental
- legado
- ou artefato que nao deve ser editado como origem

## Regra de leitura da classificacao

Cada item abaixo responde quatro perguntas:

1. a qual linha pertence
2. em qual branch deve evoluir
3. se o item e estavel, experimental ou legado
4. se ele pode ser editado como fonte real

## 1. GHCO OS

Branch principal de trabalho:

- `ghco/core`

Responsabilidade:

- contratos compartilhados
- autenticacao
- integracoes centrais
- infraestrutura de runtime
- entidades comuns entre produtos

### Fonte principal classificada em `GHCO OS`

- `worker/index.ts`
- `worker/app.ts`
- `worker/lib/`
- `worker/types.ts`
- `functions/_middleware.js`
- `functions/robots.txt.js`
- `wrangler.jsonc`
- `package.json`
- `tailwind.config.ts`
- `vite.config.ts`
- `tsconfig*.json`

### Integracoes compartilhadas classificadas em `GHCO OS`

- `worker/services/google/adsAuth.ts`
- `worker/services/google/adsService.ts`
- `worker/services/google/googleAdsAuth.ts`
- `worker/services/google/googleAdsService.ts`
- `worker/services/google/verifyIdToken.ts`
- `worker/services/google/calendarService.ts`
- `worker/services/meta/metaConversions.ts`
- `functions/api/meta-conversions.js`
- `src/lib/analytics.ts`

### Migracoes classificadas em `GHCO OS`

- `migrations/0001_initial_crm.sql`
- `migrations/0002_google_auth.sql`
- `migrations/0003_public_interactions_and_zoho_sync.sql`
- `migrations/0006_media_connectors.sql`

Observacao:

- essas migracoes sao compartilhadas ou estruturais; qualquer refactor nelas deve partir de `ghco/core`.

## 2. Cuiabar Web

Branch principal de trabalho:

- `web/cuiabar-web`

Frentes complementares:

- `blog/*`
- `burger/*`

Responsabilidade:

- site publico
- cardapio
- discovery organico
- blog/editorial
- landing pages do cliente final

### Fonte principal classificada em `Cuiabar Web`

- `src/app/`
- `src/pages/HomePage.tsx`
- `src/pages/MenuPage.tsx`
- `src/pages/PedidosOnlinePage.tsx`
- `src/pages/LinksPage.tsx`
- `src/pages/AgendaPage.tsx`
- `src/pages/AgendaEventPage.tsx`
- `src/pages/LocalGuidePage.tsx`
- `src/pages/PesquisaPage.tsx`
- `src/pages/PartnerRedirectPage.tsx`
- `src/pages/ProRefeicaoPage.tsx`
- `src/pages/VagasPage.tsx`
- `src/sections/`
- `src/components/` quando o componente for publico
- `src/data/`
- `public/`

### Subfrente Burger classificada em `Cuiabar Web`

- `src/pages/BurguerCuiabarPage.tsx`
- `src/pages/EspetariaCuiabarPage.tsx`
- `src/burger/`
- `public/burguer/`

Regra:

- evolucao de burger pode ocorrer em `burger/*`, mas o produto continua subordinado a `Cuiabar Web`.

### Subfrente Blog classificada em `Cuiabar Web`

- `src/blog/`
- `src/pages/BlogPage.tsx`
- `src/pages/BlogPostPage.tsx`
- `src/pages/BlogSubdomainRedirectPage.tsx`
- `worker/blog/routes.ts`
- `blog-options/`
- `blog-app/`
- scripts editoriais em `scripts/` com prefixo ou uso claro de blog

Regra:

- evolucao editorial pode ocorrer em `blog/*`, mas o produto continua subordinado a `Cuiabar Web`.

## 3. MeuCuiabar

Branch principal de trabalho:

- `meucuiabar/operacao`

Responsabilidade:

- controle interno
- qualidade
- HACCP
- checklists
- rotinas da casa

### Estado atual

`MeuCuiabar` agora possui uma superficie operacional dedicada no repositorio.

Isso significa:

- existe uma superficie dedicada em `src/meucuiabar/`
- a versao atual do frontend foi transplantada do Base44 para `src/meucuiabar/base44/`
- o produto ainda depende do Base44 para auth e dados ate a extracao do backend proprio

### Fonte principal classificada em `MeuCuiabar`

- `src/meucuiabar/MeuCuiabarApp.tsx`
- `src/meucuiabar/branding.ts`
- `src/meucuiabar/base44/`

Observacao:

- a primeira extracao de auditoria/hub foi substituida pela versao operacional raspada do Base44.
- o frontend de `MeuCuiabar` agora sobe em app proprio com codigo local, mas ainda consome auth e dados da plataforma Base44.

### Destino correto para novas extracoes de `MeuCuiabar`

Quando surgirem modulos dedicados, o destino correto e:

- futura pasta `src/meucuiabar/`
- futura pasta `worker/operations/` ou equivalente
- novas migracoes operacionais dedicadas
- documentacao propria ligada a qualidade e rotina da casa

### Itens que nao devem ser jogados automaticamente em `MeuCuiabar`

- CRM comercial
- reservas publicas
- WhatsApp com IA
- campanhas e fidelidade

Esses itens pertencem a `Cuiabar Atende`, nao a `MeuCuiabar`.

## 4. Cuiabar Atende

Branch principal de trabalho:

- `atende/omnicanal`

Responsabilidade:

- CRM
- WhatsApp com IA
- reservas
- marketing
- fidelidade
- relacionamento omnichannel

### Fonte principal classificada em `Cuiabar Atende`

- `src/crm/`
- `src/crm/branding.ts`
- `src/reservations/`
- `worker/reservations/`
- `worker/whatsapp/`
- `services/whatsapp-baileys/`
- `worker/services/gmail/`
- `worker/services/zoho/`

### Superficie de reservas classificada em `Cuiabar Atende`

- `src/pages/ReservasPage.tsx`
- `src/reservations/ReservationsApp.tsx`
- `src/reservations/components/*`
- `worker/reservations/routes.ts`
- `worker/reservations/service.ts`
- `worker/reservations/repository.ts`
- `worker/reservations/types.ts`
- `worker/reservations/validation.ts`

### Superficie de CRM e omnichannel classificada em `Cuiabar Atende`

- `src/crm/pages/DashboardPage.tsx`
- `src/crm/pages/ContactsPage.tsx`
- `src/crm/pages/CampaignsPage.tsx`
- `src/crm/pages/ListsPage.tsx`
- `src/crm/pages/SegmentsPage.tsx`
- `src/crm/pages/TemplatesPage.tsx`
- `src/crm/pages/UsersPage.tsx`
- `src/crm/pages/ReservationsPage.tsx`
- `src/crm/pages/SettingsPage.tsx`
- `src/crm/pages/WhatsAppPage.tsx`
- `src/crm/pages/whatsapp/*`

### Migracoes classificadas em `Cuiabar Atende`

- `migrations/0004_reservations.sql`
- `migrations/0005_whatsapp_ai_assistant.sql`
- `migrations/0005_whatsapp.sql`
- `migrations/0006_whatsapp_baileys_outbound.sql`
- `migrations/0007_campaign_open_tracking.sql`

Observacao importante:

- existe duplicidade de numeracao na familia `0005_*`;
- isso deve ser tratado depois como saneamento tecnico, mas a classificacao funcional dessas migracoes e `Cuiabar Atende`.

## 5. Experimental e transicao

### `worker/whatsapp-intelligence/`

Classificacao:

- `Cuiabar Atende`
- status: experimental/transicao
- branch de trabalho: `atende/*`

Regra:

- nao deve competir como segunda arquitetura oficial permanente
- qualquer parte reaproveitavel deve ser absorvida pela linha canonica de `Cuiabar Atende`

## 6. Legado e triagem do antigo `Super`

Classificacao operacional:

- nome estrutural: legado
- nome de produto: descontinuado
- destino: redistribuicao obrigatoria

Regra de triagem:

- componentes de atendimento, CRM, reservas, marketing ou fidelidade -> `Cuiabar Atende`
- componentes de rotina interna, controle, qualidade e HACCP -> `MeuCuiabar`
- componentes de contratos, identidade e integracoes compartilhadas -> `GHCO OS`

## 7. O que nao e fonte principal

Nao editar como origem de manutencao:

- `dist/`
- `.ssr/`
- `node_modules/`
- `ops-artifacts/`
- `KIT-PORTABILIDADE/`
- arquivos `.js` e `.d.ts` gerados ao lado de `.ts` em `worker/` e `worker/whatsapp/`

Estado atual:

- os `.js` e `.d.ts` gerados dentro de `worker/` foram removidos do versionamento e ficam bloqueados por `.gitignore`

### Casos que exigem cuidado especial

- `KIT-PORTABILIDADE/confidencial/google-service-account-meucuiabar.json`
  arquivo sensivel e legado operacional, nao e documentacao oficial nem fonte de edicao

- `ops-artifacts/cloudflare-debug/*`
  evidencia tecnica e debug, nao e codigo-fonte

- `worker/services/zoho/*`
  legado funcional ligado a CRM/marketing; so mexer se a tarefa realmente envolver essa integracao

## 8. Resultado pratico

Se uma IA abrir o repositorio hoje, a regra e:

1. classificar a mudanca na linha correta
2. trabalhar na branch correspondente
3. tratar `Super` apenas como origem de triagem, nunca como destino final
4. nao promover legado operacional a produto sem passar pela classificacao acima
