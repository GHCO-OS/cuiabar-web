# Burger N' Smoke - site, assets e publicacao

Atualizado em: 2026-04-28

## Objetivo

Centralizar a fonte de verdade da frente `Burger N' Smoke`, os arquivos ativos da landing, os assets publicados e as regras de operacao da marca.

## Estado atual

`Burger N' Smoke` e a frente ativa da hamburgueria.

Superficie oficial:

- dominio oficial: `https://burgersnsmoke.com/`
- preview interno: `https://cuiabar.com/burger-n-smoke`

Legado arquivado:

- `burger.cuiabar.com`
- `cuiabar.com/burger`
- `cuiabar.com/burguer`
- `cuiabar.com/burguer-cuiabar`

Esses enderecos devem existir apenas como redirecionamento para a nova marca.

## Fonte de verdade

- conteudo estruturado: `src/data/burgerNSmoke.json`
- paginas satelite de SEO local: `src/data/burgerNSmokeSeoPages.json`
- normalizacao para uso no app: `src/data/burgerNSmoke.ts`
- normalizacao das paginas satelite: `src/data/burgerNSmokeSeoPages.ts`
- pagina publica: `src/pages/BurgerNSmokePage.tsx`
- paginas satelite renderizadas: `src/pages/BurgerNSmokeSeoPage.tsx`
- estilos: `src/styles/burger-n-smoke.css`
- assets: `public/burger-n-smoke/`
- SEO e schema: `src/data/seo.ts`, `src/data/seoRoutes.json` e `scripts/generate-seo-assets.mjs`

## Assets publicados

- `public/burger-n-smoke/branding/smoke-mark.png`
- `public/burger-n-smoke/branding/smoke-wordmark.png`
- `public/burger-n-smoke/fonts/Ganky-Regular.ttf`
- `public/burger-n-smoke/menu/`

## Regras de marca

- nao mencionar `Cuiabar` como marca principal da landing
- manter a comunicacao publica separada da frente antiga
- tratar o burger legado apenas como arquivo historico
- evitar copy tecnica sobre deploy, migracao, branch ou indexacao dentro da landing publica
- manter os sinais locais consistentes entre site, Google e iFood

## SEO local e perfil Google

Sinais obrigatorios da marca:

- nome publico: `Burger N' Smoke`
- cidade foco: `Campinas`
- bairro foco: `Jardim Aurelia`
- telefone: `(19) 3305-8878`
- URL oficial: `https://burgersnsmoke.com/`
- perfil Google: `https://share.google/A72Y2fq0DMi8Yem4j`
- iFood oficial:
  `https://www.ifood.com.br/delivery/campinas-sp/burgers-n-smoke--smash--combos-vila-proost-de-souza/14734c59-f45a-41e2-80b0-f1914971f6e1`

Regras operacionais:

- site, perfil Google e iFood devem usar a marca `Burger N' Smoke`, sem voltar para `Burger Cuiabar`
- qualquer ajuste de descricao no Google deve refletir a mesma proposta da landing: hamburgueria em Campinas, pedido noturno, retirada e delivery
- as paginas satelite ativas hoje sao:
  - `/hamburgueria-campinas/`
  - `/smash-burger-campinas/`
  - `/burger-defumado-campinas/`
  - `/delivery-burger-campinas/`

## Branch de trabalho

- branch dedicada: `codex/burger-n-smoke-site`

Uso esperado:

- layout, copy, SEO, assets e operacao da nova marca devem nascer nessa branch ou em derivadas coerentes

## Checklist de validacao

1. rodar `npm run lint`
2. rodar `npm run build`
3. validar a landing em `http://127.0.0.1:5174/burger-n-smoke` ou preview equivalente
4. conferir `canonical`, `title`, `og:url` e `twitter:url`
5. conferir `robots.txt` e `sitemap.xml` em `https://burgersnsmoke.com/`
6. validar a home e as paginas satelite no dominio novo
7. conferir se a copy publica continua comercial e sem texto tecnico
8. validar Pages e Worker
9. validar `https://burgersnsmoke.com/`
10. validar os redirecionamentos dos aliases legados

## Regras de publicacao

- `burgersnsmoke.com` deve servir somente a landing `Burger N' Smoke`
- `burger.cuiabar.com` nao pode voltar a servir landing propria
- qualquer reativacao do `Burger Cuiabar` exige autorizacao expressa
