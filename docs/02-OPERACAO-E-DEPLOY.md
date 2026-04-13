# Operação e deploy

Atualizado em: 2026-04-13

## Comandos principais

Instalar:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build principal:

```bash
npm run build
```

Build do Worker:

```bash
npm run build:worker
```

Deploy do site no Cloudflare Pages:

```bash
npm run deploy:pages
```

Deploy do blog:

```bash
npm run deploy:blog
```

Deploy do Worker:

```bash
npm run deploy:worker
```

Migrações D1:

```bash
npm run d1:migrate:local
npm run d1:migrate:remote
```

## Arquivos centrais de operação

- `package.json`
- `wrangler.jsonc`
- `public/_redirects`
- `functions/_middleware.js`
- `functions/robots.txt.js`

## Guias operacionais legados preservados

Os guias antigos foram movidos para:

- `docs/guias-legados/DEPLOY-CLOUDFLARE.md`
- `docs/guias-legados/DEPLOY-RESERVAS-CLOUDFLARE.md`
- `docs/guias-legados/README-RESERVAS.md`
- `docs/guias-legados/RESERVAS-SETUP.md`

## Regra operacional importante

Este projeto concentra múltiplos módulos em uma base só. Portanto:

- mudanças em `src/` podem afetar Pages e subdomínios
- mudanças em `worker/` podem afetar CRM, reservas e integrações
- deploy do site e deploy do Worker são fluxos diferentes

## Fonte principal do projeto

A partir desta organização:

- o repositório GitHub privado é a fonte principal de código e documentação versionada
- o único remoto oficial do projeto é `https://github.com/cuiabar/cuiabar-web.git`
- o repositório `https://github.com/cuiabar/web.git` não deve ser usado como destino operacional
- o Drive deve ser tratado apenas como backup complementar e acervo de apoio
- segredos não devem ser mantidos em GitHub nem em documentação aberta do Drive

## Deploy remoto via GitHub

O repositório já possui workflow preparado em:

- `.github/workflows/deploy-cloudflare.yml`

Para ativar publicação remota por push em `main`, falta configurar no GitHub:

- secret `CLOUDFLARE_API_TOKEN`

Com isso, o projeto pode ser operado por GitHub/Codex Web sem depender da máquina local para deploy rotineiro.
