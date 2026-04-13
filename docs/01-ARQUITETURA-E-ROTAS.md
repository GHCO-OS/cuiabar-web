# Arquitetura e rotas

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

## Configuracao central

Arquivos mais importantes para operacao:

- `src/data/siteConfig.ts`
- `src/data/seoRoutes.json`
- `src/data/content.ts`
- `src/app/App.tsx`
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

- `crm.cuiabar.com`
  CRM/operacao administrativa hospedada via Worker.

- `reservas.cuiabar.com`
  Portal/infra de reservas hospedada via Worker.

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
