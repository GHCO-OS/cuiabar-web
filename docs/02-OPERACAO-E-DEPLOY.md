# Operação e deploy

Atualizado em: 2026-04-27

## Requisitos

- Node.js 20+
- npm 10+
- Wrangler autenticado ou token válido com acesso aos recursos necessários

## Comandos principais

Instalação:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Validação:

```bash
npm run lint
npm run build
```

Publicação do site público:

```bash
npm run deploy:pages
```

Publicação do backend:

```bash
npm run deploy:worker
```

Migrações D1:

```bash
npm run d1:migrate:local
npm run d1:migrate:remote
```

## Como a publicação funciona hoje

### Site público

- O build gera `dist/`.
- O deploy publica no projeto `cuiabar-site` no Cloudflare Pages.
- O comando operacional é `wrangler pages deploy`.
- O subdomínio `prorefeicao.cuiabar.com` consome o artefato público do Pages com roteamento via `functions/_middleware.js`, servindo a landing dedicada do `ProRefeição` na raiz do host.
- `functions/_middleware.js` também aplica os redirecionamentos públicos legados e aposentados, incluindo `blog*`, `agenda*`, `bar-jardim-aurelia-musica-ao-vivo`, `pedidos-online` e aliases de links.
- O gerador estático de SEO publica `canonical` e `sitemap` usando barra final nas rotas do `cuiabar.com`, para alinhar o HTML com o formato real servido pelo Pages.
- O host `burgersnsmoke.com` consome o mesmo `dist/` com roteamento dedicado na borda, promovendo a landing `Burger N' Smoke` na raiz do domínio.
- O host `burger.cuiabar.com` permanece apenas como redirecionamento legado para `https://burgersnsmoke.com/`.

### Worker principal

- O Worker principal é `cuiabar-crm`.
- A configuração está em `wrangler.jsonc`.
- O deploy operacional usa `wrangler deploy`.
- O Worker também protege `crm.cuiabar.com` contra espelhos públicos indevidos, redirecionando páginas do site principal para seus hosts canônicos.

## Regras importantes

- O token de deploy do Worker precisa enxergar `Workers`, `KV` e `D1`.
- O binding `WHATSAPP_KV` deve permanecer com `id` explícito no `wrangler.jsonc`.
- O host oficial do `MeuCuiabar` é `meu.cuiabar.com`.
- O host oficial do `ProRefeição` é `prorefeicao.cuiabar.com`.
- O host oficial do `Burger N' Smoke` é `burgersnsmoke.com`.
- `burger.cuiabar.com` deve existir apenas como legado e não pode voltar a servir landing própria sem autorização expressa.
- `cuiabar.com/prorefeicao` deve permanecer apenas como redirecionamento `301` para o subdomínio dedicado.
- `cuiabar.com/burger`, `cuiabar.com/burguer` e `cuiabar.com/burguer-cuiabar` devem permanecer apenas como redirecionamentos `301` para `https://burgersnsmoke.com/`.
- O alias `crm.cuiabar.com/meucuiabar*` deve permanecer apenas como redirecionamento de compatibilidade.

## Relação com GitHub

- O GitHub é a base oficial de versionamento.
- O deploy operacional não depende de push em `main`.
- O workflow do GitHub permanece apenas como contingência manual.
- O repositório oficial é `GHCO-OS/cuiabar-web`.

## Riscos operacionais

- Token do Cloudflare expirado ou com permissão incompleta.
- Secrets ausentes no ambiente Cloudflare.
- Migrações D1 não aplicadas no banco remoto.
- Sessão do Baileys perdida no runtime local.
- Warnings de SSR com `<Navigate>` ainda presentes no build.
