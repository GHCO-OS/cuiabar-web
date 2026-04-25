# Burger Cuiabar - cardapio e assets

Atualizado em: 2026-04-25

## Objetivo

Centralizar a fonte de verdade do cardapio do Burger Cuiabar, os nomes corretos dos burgers, a origem das fotos e o fluxo de atualizacao dos assets web.

## Fonte de verdade atual

Os dados canonicos do Burger ficam em:

- `src/data/burgerMenu.json`

Esse arquivo concentra:

- nomes oficiais dos burgers
- descricoes oficiais do cardapio
- notas curtas de apoio
- combos atuais
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

- PDF:
  `C:\Users\usuario\Downloads\Super Rede - Dell\cardápio v2 - burger cuiabar.pdf`

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

- `O Cuiabar`
  `Pao brioche, hamburguer de picanha 120g, queijo derretido, alface, tomate e baconnese da casa.`

- `O Brabo`
  `Pao brioche, hamburguer de picanha 120g, cheddar cremoso, bacon crocante, cebola na manteiga e baconnese.`

- `O Crocante`
  `Pao brioche, frango empanado no tempura, cheddar, alface, tomate e baconnese.`

- `O Parrudo`
  `Pao brioche, hamburguer de costela 120g, cheddar, bacon crocante, cebola na manteiga e molho especial.`

- `O Colosso`
  `Duplo burger de costela, cheddar cremoso, bacon crocante, cebola na manteiga e molho da casa no pao brioche.`

- `O Insano`
  `Duplo frango empanado no tempura, super crocante, cheddar derretido e molho honey mustard no brioche.`

### Combos

- `Combo Raiz`
  `O Raiz + escolha: batata frita ou bebida lata.`

- `Combo Cuiabar`
  `O Cuiabar + escolha: batata frita ou bebida lata.`

- `Combo Brabo`
  `O Brabo + batata frita + bebida lata.`

## Regra para futuras atualizacoes

Quando houver novo cardapio ou novo pacote de fotos:

1. substituir ou apontar a nova pasta fonte no script
2. atualizar `src/data/burgerMenu.json`
3. rodar `scripts/update-burger-assets.py`
4. validar visualmente a pagina `/burguer`
5. rodar `npm run lint` e `npm run build`
6. publicar o site e registrar a mudanca em `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`

## O que nao fazer

- nao editar os nomes dos burgers direto na pagina sem atualizar `src/data/burgerMenu.json`
- nao trocar imagem publicada sem registrar o mapeamento de origem
- nao deixar o schema do `/burguer` com itens antigos
- nao usar screenshots comprimidos como fonte mestra de produto
