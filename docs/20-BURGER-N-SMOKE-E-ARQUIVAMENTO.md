# Burger N' Smoke e arquivamento

Atualizado em: 2026-04-28

## Objetivo

Registrar a transição da frente antiga de burger para a nova marca `Burger N' Smoke`, preservando o histórico do projeto encerrado e definindo a nova superfície pública, branch de trabalho e regras operacionais.

## Estado do Burger legado

O projeto `Burger Cuiabar` passou a ser considerado:

- encerrado
- arquivado por tempo indeterminado
- fora da superfície pública principal

Regra operacional:

- não mexer, alterar, publicar ou excluir o material legado sem autorização expressa do responsável

## O que foi arquivado

O legado permanece apenas como referência interna em:

- `src/pages/BurguerCuiabarPage.tsx`
- `src/data/burgerMenu.json`
- `src/data/burgerMenu.ts`
- `public/burguer/`
- `docs/runbooks/BURGER-CARDAPIO-E-ASSETS.md`

Esses arquivos não são mais a frente ativa da hamburgueria.

## Nova frente ativa

A frente atual da hamburgueria passa a ser:

- marca: `Burger N' Smoke`
- host oficial planejado: `https://burgersnsmoke.com/`
- preview interno no site principal: `/burger-n-smoke`

## Branch de manutenção

Branch dedicada para a nova frente:

- `codex/burger-n-smoke-site`

Uso esperado:

- evoluções de layout, copy e SEO da marca nova devem nascer nessa branch ou em derivadas coerentes dela
- o legado `Burger Cuiabar` não deve receber manutenção rotineira

## Regras de publicação

- `https://burgersnsmoke.com/` deve servir somente a landing da nova marca
- `https://burger.cuiabar.com/` deve funcionar apenas como redirecionamento legado para a nova marca
- `https://cuiabar.com/burger`, `https://cuiabar.com/burguer` e `https://cuiabar.com/burguer-cuiabar` devem funcionar apenas como redirecionamentos legados

## Fonte de verdade da nova marca

- conteúdo e dados: `src/data/burgerNSmoke.json`
- normalização de uso em app: `src/data/burgerNSmoke.ts`
- página pública: `src/pages/BurgerNSmokePage.tsx`
- estilos: `src/styles/burger-n-smoke.css`
- assets: `public/burger-n-smoke/`

## Observação importante

Embora a operação pertença à mesma empresa, a comunicação pública da nova frente deve seguir separada da marca `Cuiabar`, evitando dependência nominal direta na landing e no SEO da hamburgueria.
