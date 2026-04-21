# Arquitetura e rotas

Atualizado em: 2026-04-17

## Sistema e produtos

O sistema-mãe do repositorio passa a ser:

- `GHCO OS`

Linhas de produto dentro dele:

1. `Cuiabar Web`
   Site, blog e cardapio para o cliente final.
2. `MeuCuiabar`
   Controle interno, qualidade, HACCP e rotinas da casa.
3. `Cuiabar Atende`
   WhatsApp com IA, reservas, CRM, marketing e fidelidade.

## Stack principal

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- React Router DOM
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Workers AI
- Cloudflare KV
- Node.js local para a ponte Baileys

## Estrutura principal

```txt
src/
  app/            app principal e roteamento
  components/     componentes reutilizaveis
  sections/       secoes da home
  pages/          paginas principais do site
  data/           configuracoes e conteudo
  hooks/          SEO, comportamento e utilitarios React
  lib/            analytics e helpers
  styles/         estilos globais
  reservations/   frontend do modulo de reservas
  blog/           estrutura do blog/editorial
  crm/            portal operacional e administrativo

functions/
  api/            funcoes Pages, incluindo Meta CAPI

worker/
  reservations/   backend do modulo de reservas
  services/       servicos auxiliares, ex.: Google
  whatsapp/       backend do atendimento por WhatsApp com IA

services/
  whatsapp-baileys/ ponte local do WhatsApp Web via Baileys

migrations/
  migrations do banco D1
```

## Mapeamento por modulo

- `src/pages/`, `src/sections/`, `src/blog/`, `src/data/`, `public/`
  Base principal do `Cuiabar Web`.

- `src/crm/`
  Interface principal do `Cuiabar Atende` e area administrativa compartilhada.

- `src/crm/branding.ts`
  Branding canonico do `Cuiabar Atende`, mantido junto da superficie real do produto.

- `src/meucuiabar/`
  Superficie propria de `MeuCuiabar`, agora com runtime interno da Cuiabar para login, sessao e operacao do portal.

- `src/meucuiabar/base44/`
  App operacional atual do `MeuCuiabar`, com UI e modulos transplantados do Base44, mas ja desacoplado da autenticacao do Base44 e rodando com storage local seedado a partir do scraping.

- `src/reservations/`
  Frontend do portal de reservas, ligado ao `Cuiabar Atende`.

- `worker/`
  Backend principal em Cloudflare Workers: nucleo compartilhado do `GHCO OS`, cobrindo CRM, integracoes, reservas, autenticacao e rotas server-side dedicadas.

- `services/whatsapp-baileys/`
  Runtime local da ponte de transporte do WhatsApp Web.

- `migrations/`
  Banco D1 e evolução de schema.

- `worker/whatsapp-intelligence/`
  Worker dedicado/experimental para automacoes de WhatsApp com Llama, auditoria e bridge para gateway Baileys dentro da linha `Cuiabar Atende`.

## Configuracao central

Arquivos mais importantes para operacao:

- `src/data/siteConfig.ts`
- `src/data/seoRoutes.json`
- `src/data/content.ts`
- `src/app/App.tsx`
- `src/crm/CrmApp.tsx`
- `wrangler.jsonc`
- `package.json`

## Rotas principais do site

- `/`
  Home institucional/comercial.

- `/menu`
  Cardapio principal do restaurante.

- `/pedidos-online`
  Pagina de pedidos online.

- `/delivery`
  Alias da pagina de pedidos online.

- `/burguer` e `/burger`
  Pagina especial do Burger Cuiabar.

- `/espetaria`
  Pagina especial da Espetaria Cuiabar.

- `/prorefeicao`
  Pagina institucional da operacao ProRefeicao.

- `/vagas`
  Pagina de vagas com links externos para formularios.

- `/links`
  Pagina estilo link-in-bio.

- `/agenda`
  Agenda/programacao.

- `/reservas`
  Fluxo publico de reservas.

## Rotas de infraestrutura

- `cuiabar.com`
  `Cuiabar Web` principal.

- `crm.cuiabar.com`
  Portal principal do `Cuiabar Atende`.

- `meu.cuiabar.com`
  Host oficial do `MeuCuiabar`, com runtime proprio no frontend. A autenticacao e interna via Google OAuth no Worker, com aprovacao manual de novos usuarios por `leonardo@cuiabar.net` ou `cuiabar@cuiabar.net`.

- `crm.cuiabar.com/meucuiabar*`
  Alias legado do `MeuCuiabar`, mantido apenas para compatibilidade e redirecionado para `meu.cuiabar.com`.

- `reservas.cuiabar.com`
  Portal de reservas do `Cuiabar Atende`.

- `blog.cuiabar.com`
  Presenca editorial do `Cuiabar Web`.

- `blog.cuiabar.com/editor*`
  Faixa reservada para editor/blog.

- `crm.cuiabar.com/api/internal/whatsapp/*`
  Endpoints internos consumidos pela ponte Baileys local.

- `crm.cuiabar.com/api/admin/whatsapp/*`
  Endpoints administrativos do modulo de WhatsApp.

- `crm.cuiabar.com/api/internal/whatsapp/crm/sync`
  Camada adaptadora REST para sincronizacao com o CRM.

## Observacoes relevantes

- O projeto mistura frontend estatico no Pages com Worker para modulos dinamicos.
- O site principal usa `dist/` como bundle estatico.
- O Worker usa `worker/index.ts` com assets do `dist`.
- A configuracao atual de deploy e local/manual via Wrangler, nao por integracao GitHub -> Cloudflare.
- O modulo de WhatsApp usa um bridge Baileys local para transporte, KV para sessao/cache e Workers AI com fallback para REST da Cloudflare.
- Para nao quebrar o CRM atual de e-mail marketing, o atendimento WhatsApp grava primeiro em `customer_profiles` e so vincula a `contacts` quando houver match seguro ou e-mail conhecido.
- `MeuCuiabar` agora possui app proprio no frontend, separado do shell do `Cuiabar Atende`.
- `MeuCuiabar` passa a ter host oficial proprio em `meu.cuiabar.com`.
- A versao atual do `MeuCuiabar` foi sobrescrita com a interface operacional raspada do Base44.
- O login do `MeuCuiabar` deixou de depender do Base44 e passa a usar o Worker interno da Cuiabar com Google OAuth e workflow de aprovacao.
- Enquanto o backend dedicado em Worker/D1 nao e aberto, os dados operacionais do `MeuCuiabar` rodam em storage local seedado com o dump raspado do Base44.
- site institucional: `src/pages/`, `src/sections/`, `src/data/`
- SEO público: `src/data/seo.ts`, `src/data/seoRoutes.json`, `src/lib/seo.ts`
- analytics/pixels: `src/lib/analytics.ts`, `src/components/AnalyticsTracker.tsx`, `functions/api/meta-conversions.js`
- burger: `src/pages/BurguerCuiabarPage.tsx`, `src/burger/`, `public/burguer/`
- CRM: `src/crm/`, `worker/`, `worker/whatsapp-intelligence/`
- reservas: `src/reservations/`, `worker/reservations/`, `migrations/0004_reservations.sql`
- blog: `src/blog/`, `blog-options/`, scripts editoriais
