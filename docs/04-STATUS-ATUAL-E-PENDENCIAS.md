# Status atual e pendências

Atualizado em: 2026-04-27

## Estado geral

O projeto está operacional como base única do `GHCO OS`, com três linhas de produto ativas:

- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

O repositório oficial é `GHCO-OS/cuiabar-web`.

## Ativos em produção

- site principal
- menu e pedidos online
- páginas especiais de `Burger N' Smoke`, Espetaria e ProRefeição
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
- `Burger Cuiabar` rebaixado a projeto encerrado e arquivado por tempo indeterminado, com regra explícita de não alterar, publicar ou excluir sem autorização expressa
- nova frente `Burger N' Smoke` implementada com dados próprios, assets próprios, SEO dedicado, preview interno em `/burger-n-smoke` e domínio oficial `https://burgersnsmoke.com/`
- aliases legados do burger em `cuiabar.com` e o host `burger.cuiabar.com` convertidos para redirecionamento permanente da nova marca
- correção estrutural de canonicalização nas rotas públicas do `cuiabar.com`, com `canonical` e sitemap alinhados ao formato com barra final realmente servido no Pages
- blog público, páginas de agenda e guia local de bar com música removidos da superfície principal; a programação da casa ficou reduzida ao embed oficial do Google Calendar dentro de `/presencial`
- espelhos públicos indevidos em `crm.cuiabar.com` passaram a redirecionar para as URLs canônicas do site principal e dos subdomínios oficiais

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
- iniciar a indexação e o acompanhamento de descoberta orgânica de `https://burgersnsmoke.com/` como marca separada
- acompanhar no Search Console a queda dos relatórios de canonical conflitante e de URLs alternativas de `blog`, `agenda`, `crm.cuiabar.com` e aliases antigos
- concluir a documentação institucional e o espelhamento no Wiki do GitHub
- ativar o Wiki do repositório no GitHub para publicar as páginas já preparadas em `docs/wiki/`
- manter a política de segredos fora da árvore pública do repositório

## Direção imediata

- consolidar a documentação em pt-BR
- remover documentação paralela e arquivos soltos
- publicar a documentação oficial no Wiki do repositório
- concluir o merge da branch de consolidação na `main`
- evoluir o portal de entrada da marca com refinamento visual e acompanhamento dos sinais de navegação e indexação nas novas rotas `/presencial` e `/expresso`
- operar `Burger N' Smoke` como frente separada, mantendo o burger legado apenas como arquivo histórico
