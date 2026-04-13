# Uso em outro Codex

## Objetivo

Permitir que o projeto seja aberto e continuado em outra maquina ou outro Codex sem depender de transferencia manual de contexto.

## Passo a passo

1. Abrir a pasta sincronizada:

```txt
G:\Meu Drive\cuiabar-web
```

2. Ler nesta ordem:

- `START-AQUI.md`
- `docs/00-INDICE-GERAL.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `ACESSOS-CHAVES-PROJETO.md`

3. Validar ambiente:

```bash
npm install
npm run lint
npm run build
```

4. Se precisar publicar:

```bash
npm run deploy:pages
npm run deploy:worker
```

5. Se o deploy falhar por autenticacao:

- verificar login/token do Cloudflare
- confirmar permissao de Pages e Worker
- confirmar acesso ao banco D1 e secrets

## O que um novo Codex precisa saber

- O projeto usa Vite + React no frontend.
- O deploy atual e Cloudflare manual via Wrangler.
- O GitHub nao e parte obrigatoria da publicacao atual.
- As configuracoes centrais do negocio ficam principalmente em:
  - `src/data/siteConfig.ts`
  - `src/data/content.ts`
  - `src/data/seoRoutes.json`

## O que nao fazer sem checar

- nao apagar arquivos de deploy sem confirmar uso
- nao assumir que todos os tokens em conversas antigas ainda valem
- nao reativar integracoes experimentais sem validar se fazem parte da operacao atual

## Objetivo final desta pasta

Esta pasta deve funcionar como a copia mestra operacional do website Cuiabar para continuidade de trabalho entre maquinas e entre sessoes Codex.
