# Operação e deploy

Atualizado em: 2026-04-22

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

### Worker principal

- O Worker principal é `cuiabar-crm`.
- A configuração está em `wrangler.jsonc`.
- O deploy operacional usa `wrangler deploy`.

## Regras importantes

- O token de deploy do Worker precisa enxergar `Workers`, `KV` e `D1`.
- O binding `WHATSAPP_KV` deve permanecer com `id` explícito no `wrangler.jsonc`.
- O host oficial do `MeuCuiabar` é `meu.cuiabar.com`.
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
