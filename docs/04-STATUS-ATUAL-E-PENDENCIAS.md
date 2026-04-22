# Status atual e pendências

Atualizado em: 2026-04-22

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

## Situação do Git

- `main` segue como tronco oficial
- existem branches-base por linha de produto
- o workspace de consolidação está sendo alinhado com a `main` atual
- a limpeza de legados do blog e de materiais paralelos já foi iniciada

## Pendências principais

- reduzir o bundle do `MeuCuiabar`
- revisar warnings de SSR com `<Navigate>`
- continuar a extração do backend próprio do `MeuCuiabar`
- concluir a documentação institucional e o espelhamento no Wiki do GitHub
- ativar o Wiki do repositório no GitHub para publicar as páginas já preparadas em `docs/wiki/`
- manter a política de segredos fora da árvore pública do repositório

## Direção imediata

- consolidar a documentação em pt-BR
- remover documentação paralela e arquivos soltos
- publicar a documentação oficial no Wiki do repositório
- concluir o merge da branch de consolidação na `main`
