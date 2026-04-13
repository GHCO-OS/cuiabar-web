# Cuiabar Restaurante — Site institucional/comercial (React + Vite + TypeScript + Tailwind)

Projeto premium, responsivo e otimizado para conversão em **pedidos online** e **reservas**, com página comercial da operação **ProRefeição** e estrutura preparada para SEO local.

## Stack
- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- React Router DOM
- Pronto para Cloudflare Pages (com fallback SPA)

## Estrutura
```txt
src/
  app/            # App principal e roteamento
  components/     # Componentes reutilizáveis
  sections/       # Seções da Home
  pages/          # Rotas/páginas
  data/           # Dados mock e configurações
  assets/         # Reservado para imagens/ícones locais
  hooks/          # Hooks (SEO etc.)
  lib/            # Funções utilitárias
  styles/         # Estilos globais
```

## Requisitos
- Node.js 20+
- npm 10+

## Instalação
```bash
npm install
```

## Desenvolvimento
```bash
npm run dev
```

## Build de produção
```bash
npm run build
npm run preview
```

## Repositório oficial

Este projeto já possui um único repositório oficial no GitHub:

- `https://github.com/cuiabar/cuiabar-web.git`

Regras:

- use apenas esse remoto como origem oficial
- não manter espelho operacional paralelo em outro repositório
- referências a `https://github.com/cuiabar/web.git` devem ser tratadas como legadas/inválidas, salvo decisão explícita futura

## Deploy no Cloudflare Pages

### Opção 1 — Git integrado (recomendado)
1. No Cloudflare Dashboard, acesse **Workers & Pages > Create > Pages > Connect to Git**.
2. Selecione o repositório no GitHub.
3. Configure:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Clique em **Save and Deploy**.

### Opção 2 — Deploy via CLI
```bash
npm run deploy:pages
```

O script de deploy direto publica no projeto Pages `cuiabar-site`. Se o projeto ainda não existir na conta Cloudflare, crie-o primeiro no dashboard ou ajuste o nome no script.

## Entrada rápida

Se este projeto for aberto por outra pessoa ou outra IA, começar por:

- `START-AQUI.md`
- `AGENTS.md`
- `docs/00-INDICE-GERAL.md`

Fonte principal:

- GitHub privado do projeto para código e documentação versionada

Backup complementar:

- Drive da empresa para redundância, mídia bruta e materiais não versionáveis

## Arquivos Cloudflare
- `wrangler.jsonc`: configuração principal do Worker/rotas/bindings
- `wrangler.toml`: compatibilidade legada do Pages build output
- `public/_redirects`: fallback para SPA (`/* /index.html 200`)

## Personalização rápida
Edite `src/data/siteConfig.ts` para trocar:
- WhatsApp (`whatsappNumber`, `whatsappMessage`)
- Links de pedidos (`orderLinks`)
- Link da agenda Google (`calendarEmbedUrl`)
- Contatos, endereço e horários

Edite `src/data/content.ts` para trocar:
- Posts do blog
- Destaques do cardápio
- Diferenciais
- FAQs
- Testimonials

## Editor do blog (Directus)
- Blueprint completo: `blog-options/directus/README-integracao.md`
- Painel de edicao: `https://cms.cuiabar.com` (ou local `http://127.0.0.1:8055`)
- Sincronizacao para o frontend atual:
```bash
npm run sync:blog-content
```
- Build/deploy do blog usando conteudo do editor:
```bash
npm run deploy:blog:cms
```
- Fallback local dos artigos: `src/data/knowledgeArticlesSeed.ts`

## SEO
- SEO por página via hook `useSeo` (`src/hooks/useSeo.ts` + `src/lib/seo.ts`)
- Metatags base no `index.html`
- Estrutura semântica com headings
- Conteúdo orientado para palavras-chave locais de Campinas

## Meta CAPI
- Pixel + Conversions API ja estao preparados no projeto
- A camada server-side roda via Cloudflare Pages Functions, sem servidor dedicado
- Guia operacional: `docs/guias-legados/META-CAPI-SETUP.md`

## Modulo de reservas
- O portal publico de reservas roda em `reservas.cuiabar.com`, usando o mesmo repositório e um Worker Cloudflare com D1.
- O frontend do modulo fica em `src/reservations/`.
- O backend do modulo fica em `worker/reservations/`.
- A migration principal do modulo e `migrations/0004_reservations.sql`.

Guias operacionais:
- `docs/guias-legados/README-RESERVAS.md`
- `docs/guias-legados/RESERVAS-SETUP.md`
- `docs/guias-legados/GOOGLE-CALENDAR-SETUP.md`
- `docs/guias-legados/EMAIL-SETUP.md`
- `docs/guias-legados/DEPLOY-RESERVAS-CLOUDFLARE.md`

## Organização

Documentação oficial:

- `docs/`

Guias antigos preservados:

- `docs/guias-legados/`

Artefatos temporários de QA/debug:

- `ops-artifacts/`

## Evolução futura sugerida
- Integrar formulários com API (Supabase, Formspree, Resend etc.)
- Adicionar página de detalhe de post no blog
- Implementar analytics e eventos de conversão
- Migrar imagens para pipeline otimizado/CDN proprietário
