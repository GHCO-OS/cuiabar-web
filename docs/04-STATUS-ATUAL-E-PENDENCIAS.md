# Status atual e pendencias

Atualizado em: 2026-04-13

## Estado geral

O projeto esta operacional e publicado via Cloudflare.

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
- modulo de atendimento WhatsApp com IA no Worker
- ponte local Baileys em `services/whatsapp-baileys`
- central operacional de WhatsApp dentro do CRM em `/whatsapp`
- documentacao de governanca em `AGENTS.md` e `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
- inventario operacional desta maquina e do bridge em `docs/10-AMBIENTE-LOCAL-E-IDS.md`
- repositorio GitHub oficial em `github.com/cuiabar/cuiabar-web`

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

## Decisao importante

A publicacao do site nao depende do GitHub hoje.

Isso significa:
- o repositório GitHub nao e o mecanismo de deploy do site;
- o que nao pode faltar para publicacao e o acesso de deploy ao Cloudflare;
- o GitHub continua sendo a base oficial de versionamento e continuidade.

## Estado do GitHub

- o repositório oficial de versionamento e `cuiabar/cuiabar-web`
- o repositório e privado
- a copia operacional principal fica em `C:\workspace\cuiabar-web`
- o Google Drive fica como backup e snapshot, nao como runtime principal

## Itens que podem ser melhorados depois

- pipeline automatizado e seguro de deploy sem depender de maquina local
- centralizacao de secrets em cofre apropriado
- limpeza de artefatos tecnicos locais
- revisao do modulo de blog
- refinamento final de QA mobile em paginas especiais
- refinamento adicional de observabilidade do modulo de WhatsApp
