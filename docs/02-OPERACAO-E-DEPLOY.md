# Operacao e deploy

Atualizado em: 2026-04-17

## Requisitos

- Node.js 20+
- npm 10+
- acesso ao Cloudflare com Wrangler autenticado ou token valido

## Comandos principais

Instalacao:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Validacao:

```bash
npm run lint
npm run build
```

Deploy do site principal no Cloudflare Pages:

```bash
npm run deploy:pages
```

Deploy do Worker/CRM/Reservas:

```bash
npm run deploy:worker
```

## Como a publicacao funciona hoje

### Site principal

- O build gera `dist/`
- O deploy vai para o projeto Cloudflare Pages `cuiabar-site`
- O comando usado e `wrangler pages deploy dist --project-name=cuiabar-site`

### Worker

- O Worker principal e `cuiabar-crm`
- A configuracao esta em `wrangler.jsonc`
- O deploy usa `wrangler deploy`
- o token usado para deploy precisa enxergar os recursos de KV/D1/Workers exigidos pelo `wrangler.jsonc`; um token valido para Pages nao basta se nao conseguir listar namespaces KV
- o binding `WHATSAPP_KV` deve permanecer com `id` explicito no `wrangler.jsonc`; sem isso o Wrangler tenta recriar o namespace e pode falhar mesmo com token correto
- o host oficial do `MeuCuiabar` passa a ser `meu.cuiabar.com`; o alias legado `crm.cuiabar.com/meucuiabar*` fica apenas como redirect de compatibilidade

## Conclusao importante sobre GitHub

No estado atual:

- o GitHub nao publica o site;
- o workflow de Cloudflare no GitHub fica somente como fallback manual via `workflow_dispatch`;
- pushes em `main` nao devem mais tentar publicar automaticamente no Cloudflare;
- o que mantem o site e o CRM publicados e o acesso Cloudflare/Wrangler;
- o repositório GitHub oficial para versionamento e continuidade deste projeto e `https://github.com/cuiabar/cuiabar-web`.

Estado aplicado em 2026-04-13:

- a copia operacional principal desta maquina e `C:\cuiabar-web`;
- o Google Drive fica apenas como destino opcional de backup via `scripts/sync-drive-backup.ps1`;
- o remote `origin` local deve apontar para `https://github.com/cuiabar/cuiabar-web.git`;
- a publicacao de codigo no GitHub e independente do deploy no Cloudflare;
- o deploy operacional continua sendo executado localmente por esta maquina, com Wrangler autenticado;
- os identificadores desta maquina e do bridge local ficaram registrados em `docs/10-AMBIENTE-LOCAL-E-IDS.md`.

## D1 / banco

Comandos relevantes:

```bash
npm run d1:migrate:local
npm run d1:migrate:remote
```

Banco configurado em `wrangler.jsonc`:

- binding: `DB`
- database_name: `cuiabar_crm`

## Riscos operacionais

- Se o token do Cloudflare expirar, o deploy manual para.
- Se o token do Cloudflare nao tiver permissao de KV/Workers, o Pages pode publicar e o Worker falhar mesmo com autenticacao valida.
- Se as secrets nao estiverem presentes no ambiente Cloudflare, partes como login Google, e-mail e tracking server-side podem falhar.
- Existem avisos conhecidos de SSR relacionados a `<Navigate>` em `StaticRouter`; isso nao bloqueia o build, mas merece limpeza futura.
- Se o runtime local do Baileys perder a sessao, o bridge volta para `qr_ready` e exige novo pareamento manual.
