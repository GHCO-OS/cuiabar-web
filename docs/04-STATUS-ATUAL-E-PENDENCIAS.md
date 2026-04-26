# Status atual e pendências

Atualizado em: 2026-04-25

## Estado geral

O projeto está operacional como base única do `GHCO OS`, com três linhas de produto ativas:

- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

O repositório oficial é `GHCO-OS/cuiabar-web`.

## Ativos em produção

- site principal
- menu e pedidos online
- páginas especiais do Burger, Espetaria e ProRefeição
- página de vagas
- portal de reservas
- CRM
- `MeuCuiabar` em `meu.cuiabar.com`
- atendimento por WhatsApp com ponte Baileys local

## Melhorias já consolidadas

- divisão oficial em linhas de produto
- documentação central em `docs/`
- runbooks específicos em `docs/runbooks/`
- host próprio para `MeuCuiabar`
- shell principal alinhado ao `Cuiabar Atende`
- binding de KV fixado no `wrangler.jsonc`
- migrações remotas do `MeuCuiabar` já aplicadas
- carregamento do `MeuCuiabar` quebrado por página para reduzir o bundle inicial da aplicação
- frente `ProRefeição` migrada para o host dedicado `prorefeicao.cuiabar.com`, com a rota `cuiabar.com/prorefeicao` mantida apenas como redirecionamento permanente
- arquitetura pública reorganizada em três frentes de entrada na raiz do site: `Presencial`, `Expresso` e `Espetaria`, com a home operacional do restaurante movida para `/presencial` e o delivery concentrado em `/expresso`
- host `burger.cuiabar.com` religado na borda do Cloudflare Worker para eliminar a dependência do origin legado que estava fora do ar
- cardápio do Burger Cuiabar centralizado em `src/data/burgerMenu.json`, com fotos novas convertidas para WebP e runbook próprio para futuras atualizações sem divergência entre página, SEO e campanhas
- landing do Burger Cuiabar reestruturada com foco em conversão, escaneabilidade e decisão rápida, com blocos de hero, mais pedidos, combos, curadoria, cardápio completo, diferenciais, FAQ e CTA final
- preços do Burger sincronizados a partir do PDF precificado de loja e iFood, com exibição principal na landing voltada ao valor direto da loja/site e referência operacional documentada para futuras atualizações

## Situação do Git

- `main` segue como tronco oficial
- existem branches-base por linha de produto
- o workspace de consolidação está sendo alinhado com a `main` atual
- a limpeza de legados do blog e de materiais paralelos já foi iniciada

## Pendências principais

- continuar a redução do bundle do `MeuCuiabar`, agora com foco em dependências pesadas compartilhadas
- revisar warnings de SSR com `<Navigate>`
- continuar a extração do backend próprio do `MeuCuiabar`
- criar a operação de SEO própria do `ProRefeição` no Search Console e acompanhar a indexação do novo host
- concluir a documentação institucional e o espelhamento no Wiki do GitHub
- ativar o Wiki do repositório no GitHub para publicar as páginas já preparadas em `docs/wiki/`
- manter a política de segredos fora da árvore pública do repositório

## Direção imediata

- consolidar a documentação em pt-BR
- remover documentação paralela e arquivos soltos
- publicar a documentação oficial no Wiki do repositório
- concluir o merge da branch de consolidação na `main`
- evoluir o portal de entrada da marca com refinamento visual e acompanhamento dos sinais de navegação e indexação nas novas rotas `/presencial` e `/expresso`
