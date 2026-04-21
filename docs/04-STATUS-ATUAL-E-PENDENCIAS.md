# Status atual e pendencias

Atualizado em: 2026-04-21

## Estado geral

O projeto esta operacional e publicado via Cloudflare.

## Definicao atual de produto

O sistema passa a ser tratado como:

- `GHCO OS` como sistema-mãe

Com tres linhas de produto:

- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

## O que esta ativo

- site principal do Cuiabar
- pagina de menu
- pagina de pedidos/delivery
- pagina Burger Cuiabar
- pagina Espetaria Cuiabar
- pagina ProRefeicao
- pagina de vagas
- pagina de links
- modulo de reservas
- CRM/Worker
- Meta Pixel e camada server-side de CAPI
- modulo de atendimento WhatsApp com IA preservado em codigo, mas isolado por flag para refinamento
- ponte local Baileys em `services/whatsapp-baileys`
- central operacional de WhatsApp dentro do CRM em `/whatsapp`
- documentacao de governanca em `AGENTS.md` e `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
- inventario operacional desta maquina e do bridge em `docs/10-AMBIENTE-LOCAL-E-IDS.md`
- repositorio GitHub oficial em `github.com/GHCO-OS/cuiabar-web`

## O que ja foi melhorado nesta organizacao

- trilha de leitura obrigatoria para novas IAs
- mapa oficial de documentacao e governanca
- definicao do sistema-mãe `GHCO OS`
- separacao conceitual entre `Cuiabar Web`, `MeuCuiabar` e `Cuiabar Atende`
- padrao de branches por linha de produto e por core compartilhado
- branches-base oficiais abertas no remoto
- classificacao operacional do legado em andamento, com matriz publicada em `docs/16-CLASSIFICACAO-DE-MODULOS-E-LEGADO.md`
- primeiro bloco real de `MeuCuiabar` aberto em `src/meucuiabar/`, com hub proprio e auditoria interna
- identidade visual e textual do shell principal reposicionada para `Cuiabar Atende`
- arquivos `.js` e `.d.ts` gerados dentro de `worker/` removidos do versionamento

## Topologia Git atual

Tronco oficial:

- `main`

Branches-base derivadas do sistema:

- `ghco/core`
- `web/cuiabar-web`
- `meucuiabar/operacao`
- `atende/omnicanal`

Decisao estrutural:

- `Super` deixa de ser nome de produto e de linha permanente no Git;
- qualquer legado associado a `Super` deve ser classificado e redistribuido entre `MeuCuiabar`, `Cuiabar Atende` ou `GHCO OS`.

Estado da classificacao:

- `Cuiabar Web` ja possui superficie estavel e identificavel
- `Cuiabar Atende` ja possui superficie estavel e identificavel
- `MeuCuiabar` ja tem o primeiro bloco extraido, mas ainda depende de novas extracoes para virar linha operacional completa

## O que merece acompanhamento

- revisar warnings de SSR com `<Navigate>` no build
- consolidar de vez a politica de deploy sem GitHub
- separar melhor conteudo editorial/blog do restante do projeto
- revisar periodicamente tokens e permissao do Cloudflare e GitHub
- reduzir arquivos operacionais temporarios na raiz
- manter o runtime local do Baileys fora do Google Drive para evitar lock de arquivos
- preencher segredos reais do bridge interno e da Cloudflare AI
- acompanhar saude do autostart/watchdog do Baileys em producao
- criar IDs formais persistentes para `bridge_instance_id` e `machine_instance_id` se isso virar requisito de auditoria
- decidir o proximo bloco concreto de extracao para `MeuCuiabar` alem da auditoria interna
- refinar `worker/whatsapp-intelligence` em branch dedicada antes de reativar o webhook em ambiente principal
- polir o projeto editorial/blog apenas na branch `codex/polish-blog`, mantendo o principal sem essa superficie

## Decisao importante

A publicacao do site nao depende do GitHub hoje.

Isso significa:
- o repositorio GitHub nao e o mecanismo de deploy do site;
- o workflow `deploy-cloudflare.yml` no GitHub fica restrito a disparo manual de contingencia;
- o que nao pode faltar para publicacao e o acesso de deploy ao Cloudflare;
- o GitHub continua sendo a base oficial de versionamento e continuidade.

## Estado do GitHub

- o repositorio oficial de versionamento e `GHCO-OS/cuiabar-web`
- o repositorio e privado
- a copia operacional principal fica em `C:\workspace\cuiabar-web`
- o Google Drive fica como backup e snapshot, nao como runtime principal

## Itens que podem ser melhorados depois

- pipeline automatizado e seguro de deploy sem depender de maquina local
- centralizacao de secrets em cofre apropriado
- limpeza de artefatos tecnicos locais
- avaliacao futura sobre retorno do blog, mas fora do tronco operacional atual
- refinamento final de QA mobile em paginas especiais
- refinamento adicional de observabilidade do modulo de WhatsApp
- hardening do fluxo de webhook, deduplicacao e entrega antes de considerar o modulo WhatsApp como operacional
