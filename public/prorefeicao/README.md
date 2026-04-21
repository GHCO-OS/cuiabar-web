# Diretriz de imagens — página ProRefeição

**Escopo:** esta pasta (`/public/prorefeicao/`) e todas as imagens exibidas em `src/pages/ProRefeicaoPage.tsx` e na seção de destaque na home (`src/sections/ProRefeicaoSection.tsx`).

## Regra única

**Só podem ser exibidas fotos de marmitas seladas em embalagem redonda preta, sobre fundo branco, em estilo estúdio profissional.**

Nenhum outro estilo de foto de comida é aceito nessa página — nem pratos servidos em louça, nem flat lays em madeira, nem fotos de restaurante, nem closes de ingredientes soltos.

## Por que

A ProRefeição é a operação **B2B corporativa** do Villa Cuiabar. A promessa comercial da marca nessa frente é:

1. **Embalagem selada** — integridade do pedido até a entrega
2. **Padronização** — mesma apresentação em cada lote, independente do turno
3. **Apresentação profissional** — comida que chega digna para cliente corporativo

A foto tem que vender exatamente essas três coisas de um olhar. Foto de prato servido em louça é linguagem visual do salão/delivery residencial e confunde o comprador B2B.

## Estilo de referência — checklist obrigatório

Uma foto só entra nessa pasta se atende **todos** os itens abaixo:

- [ ] **Embalagem:** bowl/marmita redondo preto, paredes caneladas, lacrável (tipo PP preto de uso corporativo)
- [ ] **Fundo:** branco puro ou branco com sombra muito sutil. Sem madeira, sem linho, sem textura decorativa
- [ ] **Enquadramento:** 3/4 de ângulo (ligeiramente acima da linha da borda), não top-down, não lateral pura
- [ ] **Comida:** proteína + acompanhamentos divididos em setores visíveis dentro do bowl. Porção generosa, sem estar sobrecarregada
- [ ] **Iluminação:** estúdio, luz suave, sombra definida mas não dura, sem flash direto
- [ ] **Pós-produção:** recorte limpo contra o fundo branco (alpha bem feito), saturação natural, sem filtro vintage, sem vinheta
- [ ] **Nada extra em cena:** sem talheres, sem guardanapos, sem garrafas, sem mão humana, sem logo estampado

## O que **não** entra

Para deixar claro — exemplos de fotos **rejeitadas**:

- Prato de louça (redondo ou quadrado) servido em cima de mesa de madeira
- Flat lay com vários pratos, potes e ingredientes espalhados
- Foto de salão com marmita sobre bandeja de entrega
- Close macro só da comida, sem mostrar a embalagem
- Foto com acompanhante humano (mão, garçom, entregador)
- Foto com iluminação ambiente/amarelada de cozinha real
- Foto de outro fornecedor ou banco de imagens genérico sem a embalagem preta redonda correta

## Especificação técnica

Para cada foto nova na pasta, entregar:

| Item | Valor |
|------|-------|
| Formato master | PNG com canal alfa (recorte limpo) |
| Formato web | WebP (qualidade ~85) gerado a partir do PNG |
| Aspect ratio | 1:1 (quadrado) ou 3:2 (paisagem leve) — consistente entre todas |
| Lado maior | ≥ 1200 px |
| Nome do arquivo | kebab-case descritivo: `marmita-picanha-acebolada.png`, `marmita-frango-grelhado.png`, `marmita-tri-mix-vegetais.png` etc |
| Par de arquivos | Sempre salvar `.png` **e** `.webp` com o mesmo basename |

## Uso no código

Todas as tags `<img>` e `<picture>` que referenciam essa pasta devem seguir o padrão já usado em `ProRefeicaoPage.tsx`:

```tsx
<picture>
  <source srcSet="/prorefeicao/<nome>.webp" type="image/webp" />
  <img
    src="/prorefeicao/<nome>.png"
    alt="Marmita corporativa com <proteína> e <acompanhamentos>"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Texto alternativo (`alt`):** descrever em português o conteúdo da marmita com foco no cliente B2B — proteína + 2 acompanhamentos principais. Exemplo: `"Marmita corporativa com picanha, arroz, feijão e fritas"`. Não mencionar a embalagem no alt (é dado visual implícito da linha).

## Status atual dos assets

**Aprovados (em uso):**

- `marmita-parmegiana.png` — parmegiana + arroz + feijão + fritas (bowl selado, fundo branco, estúdio)
- `marmita-carne.png` — carne acebolada + arroz + feijão + fritas + brócolis (bowl selado, fundo branco, estúdio)
- `marmita-mix.png` — cena com 3 bowls ao fundo/primeiro plano mostrando variedade de cardápios (bowl selado, fundo branco, estúdio)

São os três únicos assets de refeição aprovados para exibição na página `/prorefeicao` e na seção de destaque da home. Todos seguem a regra da marmita redonda preta selada sobre fundo branco.

**Legado (não usar):**

Os arquivos `hero-parmegiana.*`, `costela.*`, `chorizo.*` e `frango.png` são de linguagem visual antiga (pratos em louça / fundos variados) e **não devem ser referenciados** em nenhuma seção pública atual do ProRefeição. Mantidos no repositório apenas para histórico e serão removidos depois que eventuais usos residuais em fluxos internos, como `src/crm/emailPresets.ts`, também forem migrados para os novos assets.

**Logo da linha:** `logo-prorefeicao.png` — uso opcional em headers institucionais. Não substitui as fotos das marmitas.

## Ao adicionar uma foto nova

1. Validar a foto contra o checklist acima — se falhar em qualquer item, recusar.
2. Salvar o par `.png` + `.webp` nesta pasta seguindo o padrão de nome.
3. Registrar o novo asset em `src/pages/ProRefeicaoPage.tsx` (array `showcaseMeals`) e, quando aplicável, em `src/sections/ProRefeicaoSection.tsx`.
4. Atualizar este README se a regra precisar evoluir — a diretriz é a única fonte de verdade.
