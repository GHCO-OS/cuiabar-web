# Operacao e deploy

Atualizado em: 2026-04-13

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

## Conclusao importante sobre GitHub

No estado atual:

- o GitHub nao publica o site;
- o que mantem o site e o CRM publicados e o acesso Cloudflare/Wrangler;
- o repositório GitHub oficial para versionamento e continuidade deste projeto e `https://github.com/cuiabar/cuiabar-web`.

Estado aplicado em 2026-04-13:

- a copia operacional principal passou a ser `C:\workspace\cuiabar-web`;
- `G:\Meu Drive\cuiabar-web` fica como backup, snapshot e base de consulta;
- o remote `origin` local deve apontar para `https://github.com/cuiabar/cuiabar-web.git`;
- a publicacao de codigo no GitHub e independente do deploy no Cloudflare;
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
- Se as secrets nao estiverem presentes no ambiente Cloudflare, partes como login Google, e-mail e tracking server-side podem falhar.
- Existem avisos conhecidos de SSR relacionados a `<Navigate>` em `StaticRouter`; isso nao bloqueia o build, mas merece limpeza futura.
- Se o runtime local do Baileys perder a sessao, o bridge volta para `qr_ready` e exige novo pareamento manual.
