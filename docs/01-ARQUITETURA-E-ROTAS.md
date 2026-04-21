# Arquitetura e rotas

Atualizado em: 2026-04-21

## Sistema e produtos

O sistema-mae do repositorio e:

- `GHCO OS`

Linhas de produto dentro dele:

1. `Cuiabar Web`
   Site, cardapio, paginas locais e descoberta organica.
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
  styles/         estilos globais e por superficie
  reservations/   frontend do modulo de reservas
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

- `src/pages/`, `src/sections/`, `src/data/`, `public/`
  Base principal do `Cuiabar Web`.

- `src/crm/`
  Interface principal do `Cuiabar Atende` e area administrativa compartilhada.

- `src/meucuiabar/`
  Primeiro bloco extraido de `MeuCuiabar`, dedicado a governanca operacional e auditoria interna.

- `src/reservations/`
  Frontend do portal de reservas, ligado ao `Cuiabar Atende`.

- `worker/`
  Backend principal em Cloudflare Workers, cobrindo CRM, integracoes, reservas, autenticacao e rotas server-side dedicadas.

- `worker/whatsapp-intelligence/`
  Worker dedicado e experimental para automacoes de WhatsApp. Hoje esta isolado por flag e fora do fluxo principal.

- `services/whatsapp-baileys/`
  Runtime local da ponte de transporte do WhatsApp Web. O autostart foi desativado e ele deve ser usado apenas sob demanda.

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
  Home institucional e comercial.

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
  Agenda e programacao.

- `/reservas`
  Fluxo publico de reservas.

- `/blog` e `/blog/:slug`
  Rotas legadas que redirecionam para `https://blog.cuiabar.com`.

## Rotas de infraestrutura

- `cuiabar.com`
  `Cuiabar Web` principal.

- `crm.cuiabar.com`
  Portal principal do `Cuiabar Atende`.

- `crm.cuiabar.com/meucuiabar*`
  Superficie interna inicial de `MeuCuiabar`, ainda hospedada sob o shell autenticado do portal interno.

- `reservas.cuiabar.com`
  Portal de reservas do `Cuiabar Atende`.

- `blog.cuiabar.com`
  Presenca editorial externa ao tronco principal.

- `crm.cuiabar.com/api/internal/whatsapp/*`
  Endpoints internos consumidos pela ponte Baileys local.

- `crm.cuiabar.com/api/admin/whatsapp/*`
  Endpoints administrativos do modulo de WhatsApp.

## Observacoes relevantes

- O projeto mistura frontend estatico no Pages com Worker para modulos dinamicos.
- O site principal usa `dist/` como bundle estatico.
- O Worker usa `worker/index.ts` com assets do `dist`.
- A configuracao atual de deploy e local/manual via Wrangler, com caminho de publicacao protegido por checks.
- O modulo de WhatsApp usa uma ponte Baileys local para transporte, KV para sessao e cache e Workers AI com fallback para REST da Cloudflare.
- O blog saiu da superficie principal e ficou preservado apenas como redirecionamento legado e branch dedicada de refinamento.
