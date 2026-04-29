# Burger Cuiabar - cardapio e assets

Atualizado em: 2026-04-25

## Objetivo

Preservar a fonte de verdade historica do cardapio do `Burger Cuiabar`, os nomes corretos dos burgers, a origem das fotos e o fluxo de atualizacao usado antes do arquivamento do projeto.

## Status atual

O `Burger Cuiabar` e um projeto:

- encerrado
- arquivado por tempo indeterminado
- fora da frente publica ativa

Regra operacional:

- nao mexer, publicar, excluir ou reaproveitar esse material sem autorizacao expressa do responsavel

Frente ativa atual:

- `Burger N' Smoke`
- documentacao operacional em `docs/runbooks/BURGER-N-SMOKE-SITE.md`

## Fonte de verdade atual

Os dados canonicos do Burger ficam em:

- `src/data/burgerMenu.json`

Esse arquivo concentra:

- nomes oficiais dos burgers
- descricoes oficiais do cardapio
- notas curtas de apoio
- combos atuais
- precos de loja/site e referencia de iFood
- imagem hero
- imagem OG
- ordem de destaque na pagina

As paginas e o SEO do Burger devem refletir esse arquivo.

## Pagina publica e pontos que consomem esses dados

- `src/pages/BurguerCuiabarPage.tsx`
  Landing publica do Burger Cuiabar.

- `src/data/seo.ts`
  Enriquece a rota `/burguer` com schema e imagem social a partir do cardapio atual.

- `scripts/generate-seo-assets.mjs`
  Usa o mesmo cardapio para gerar HTML estatico, metas e schema da rota `/burguer`.

- `src/crm/emailPresets.ts`
  Reaproveita os assets atualizados nas campanhas de e-mail do Burger.

## Origem das fotos usadas em 2026-04-25

Material mestre local recebido nesta maquina:

- PDF de nomes, descricoes e estrutura do cardapio:
  `C:\Users\usuario\Downloads\Super Rede - Dell\cardápio v2 - burger cuiabar.pdf`

- PDF de precos de loja e iFood:
  `C:\Users\usuario\Downloads\Super Rede - Dell\menu burger - precificado - loja e ifood.pdf`

- Pasta das fotos:
  `C:\Users\usuario\Downloads\Super Rede - Dell\Burgers - MIX PRODUTO\`

Mapeamento atual:

- `O Raiz`
  Fonte: `O Raiz - Mix produto.png`
  Saida web: `public/burguer/o-raiz.webp`

- `O Cuiabar`
  Fonte: `O Cuiabar - mix produto.png`
  Saida web: `public/burguer/o-cuiabar.webp`

- `O Brabo`
  Fonte: `O Brabo - Mix produto.png`
  Saida web: `public/burguer/o-brabo.webp`

- `O Crocante`
  Fonte: `O Crocante - Mix Produto.png`
  Saida web: `public/burguer/o-crocante.webp`

- `O Parrudo`
  Fonte: `O Parrudo - Mix Produto.png`
  Saida web: `public/burguer/o-parrudo.webp`

- `O Colosso`
  Fonte: `O Colosso – Duplo Costela & Cheddar - Mix Produto.png`
  Saida web: `public/burguer/o-colosso.webp`

- `O Insano`
  Fonte: `Duplo crispy com molho de mostarda - Mix Produto.png`
  Saida web: `public/burguer/o-insano.webp`

Derivacoes auxiliares:

- hero da pagina:
  `public/burguer/burger-cuiabar-hero.webp`

- imagem OG:
  `public/burguer/burger-cuiabar-og.webp`

## Script oficial de conversao

Script:

- `scripts/update-burger-assets.py`

Funcao:

- ler os PNGs fonte
- aplicar crop consistente
- exportar WebP otimizado para web
- manter nomes estaveis dos arquivos publicados

Comando padrao:

```bash
C:\Users\usuario\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts/update-burger-assets.py
```

Se os fontes estiverem em outra pasta:

```bash
C:\Users\usuario\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts/update-burger-assets.py --source-dir "C:\caminho\para\as\fotos"
```

## Cardapio oficial vigente em 2026-04-25

### Burgers

- `O Raiz`
  `Pao brioche, hamburguer sabor picanha, queijo derretido, alface e tomate.`
  Preco loja/site: `R$ 19,90`
  Referencia iFood: `R$ 22,88`

- `O Cuiabar`
  `Pao brioche, hamburguer de picanha 120g, queijo derretido, alface, tomate e baconnese da casa.`
  Preco loja/site: `R$ 29,90`
  Referencia iFood: `R$ 34,38`

- `O Brabo`
  `Pao brioche, hamburguer de picanha 120g, cheddar cremoso, bacon crocante, cebola na manteiga e baconnese.`
  Preco loja/site: `R$ 34,90`
  Referencia iFood: `R$ 40,13`

- `O Crocante`
  `Pao brioche, frango empanado no tempura, cheddar, alface, tomate e baconnese.`
  Preco loja/site: `R$ 29,90`
  Referencia iFood: `R$ 34,38`

- `O Parrudo`
  `Pao brioche, hamburguer de costela 120g, cheddar, bacon crocante, cebola na manteiga e molho especial.`
  Preco loja/site: `R$ 34,90`
  Referencia iFood: `R$ 40,13`

- `O Colosso`
  `Duplo burger de costela, cheddar cremoso, bacon crocante, cebola na manteiga e molho da casa no pao brioche.`
  Preco loja/site: `R$ 44,90`
  Referencia iFood: `R$ 51,63`

- `O Insano`
  `Duplo frango empanado no tempura, super crocante, cheddar derretido e molho honey mustard no brioche.`
  Preco loja/site: `R$ 36,90`
  Referencia iFood: `R$ 42,43`

### Combos

- `Combo Raiz`
  `O Raiz + escolha: batata frita ou bebida lata.`
  Preco loja/site: `R$ 26,90`
  Referencia iFood: `R$ 30,93`

- `Combo Cuiabar`
  `O Cuiabar + escolha: batata frita ou bebida lata.`
  Preco loja/site: `R$ 36,90`
  Referencia iFood: `R$ 42,43`

- `Combo Brabo`
  `O Brabo + batata frita + bebida lata.`
  Preco loja/site: `R$ 46,90`
  Referencia iFood: `R$ 53,93`

## Regra de exibicao de preco na landing

- a landing publica do Burger deve exibir como referencia principal o `storePrice`
- o texto de apoio da pagina deve deixar claro que esse valor vale para pedido direto na loja ou no site da loja `expresso.cuiabar.com`
- o campo `ifoodPrice` fica mantido em `src/data/burgerMenu.json` apenas como referencia operacional para futuras comparacoes e atualizacoes
- se a estrategia comercial mudar e a pagina passar a mostrar preco de app, a documentacao e o schema devem ser revisados na mesma entrega

## Regra para futuras atualizacoes

Quando houver novo cardapio ou novo pacote de fotos:

1. substituir ou apontar a nova pasta fonte no script
2. atualizar `src/data/burgerMenu.json` com nomes, descricoes, `storePrice` e `ifoodPrice`
3. rodar `scripts/update-burger-assets.py`
4. validar visualmente a pagina `/burguer`
5. rodar `npm run lint` e `npm run build`
6. publicar o site e registrar a mudanca em `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`

## O que nao fazer

- nao editar os nomes dos burgers direto na pagina sem atualizar `src/data/burgerMenu.json`
- nao trocar imagem publicada sem registrar o mapeamento de origem
- nao atualizar preco direto na landing sem atualizar primeiro `src/data/burgerMenu.json` e este runbook
- nao deixar o schema do `/burguer` com itens antigos
- nao usar screenshots comprimidos como fonte mestra de produto
