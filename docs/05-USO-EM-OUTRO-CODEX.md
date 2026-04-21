# Uso em outro Codex

## Objetivo

Permitir que o projeto seja aberto e continuado em outra maquina ou outro Codex sem depender de transferencia manual de contexto.

## Passo a passo

1. Clonar ou abrir o repositorio oficial:

```txt
https://github.com/GHCO-OS/cuiabar-web
```

2. Ler nesta ordem:

- `START-AQUI.md`
- `docs/00-INDICE-GERAL.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `docs/14-NOMENCLATURA-E-LINHAS-DE-PRODUTO.md`
- `docs/15-DERIVACOES-E-TOPOLOGIA-GIT.md`

3. Escolher a branch certa antes de editar:

- `main` para leitura do tronco atual
- `ghco/*` para core compartilhado
- `web/*` para `Cuiabar Web`
- `meucuiabar/*` para `MeuCuiabar`
- `atende/*` para `Cuiabar Atende`

4. Validar ambiente:

```bash
npm install
npm run lint
npm run build
```

5. Se precisar publicar:

```bash
npm run deploy:pages
npm run deploy:worker
```

6. Se o deploy falhar por autenticacao:

- verificar login/token do Cloudflare
- confirmar permissao de Pages e Worker
- confirmar acesso ao banco D1 e secrets

## O que um novo Codex precisa saber

- O projeto usa Vite + React no frontend.
- O deploy atual e Cloudflare manual via Wrangler.
- O GitHub e a fonte oficial do codigo e da documentacao.
- O Google Drive fica apenas como backup operacional e apoio.
- As configuracoes centrais do negocio ficam principalmente em:
  - `src/data/siteConfig.ts`
  - `src/data/content.ts`
  - `src/data/seoRoutes.json`

## O que nao fazer sem checar

- nao apagar arquivos de deploy sem confirmar uso
- nao assumir que todos os tokens em conversas antigas ainda valem
- nao reativar integracoes experimentais sem validar se fazem parte da operacao atual

## Objetivo final desta pasta

Esta pasta deve funcionar como o guia de continuidade do `GHCO OS` entre maquinas, branches e sessoes Codex.
