# Migracao para operacao via Codex Web

Atualizado em: 2026-04-21

## Objetivo

Tornar o projeto tratavel prioritariamente via GitHub e Codex Web, reduzindo dependencia da maquina local.

## O que ja foi migrado

- repositorio privado criado no GitHub
- `main` publicada como base oficial do projeto
- remoto oficial consolidado em `origin -> https://github.com/GHCO-OS/cuiabar-web.git`
- documentacao central movida para `docs/`
- runbooks movidos da raiz para `docs/runbooks/`
- governanca para novas IAs criada em `AGENTS.md`
- artefatos temporarios movidos para `ops-artifacts/`
- workflow de deploy via GitHub Actions preparado em `.github/workflows/deploy-cloudflare.yml`

## O que ja esta pronto para Codex Web

- edicao de codigo e documentacao
- trabalho por branches
- build do site e SSR
- revisao de SEO e conteudo
- manutencao de burger, site principal e CRM no mesmo repositorio
- deploy automatizavel via GitHub Actions

## O que ainda tem pegada operacional local

- runtime local do Baileys para testes do WhatsApp
- qualquer pareamento manual com WhatsApp Web
- qualquer tarefa de infraestrutura fora do GitHub e Cloudflare

## Conclusao da auditoria

O projeto pode ser tratado como web-first.

Na pratica:

- GitHub e a fonte principal
- existe um unico repositorio oficial para codigo e documentacao: `GHCO-OS/cuiabar-web`
- Codex Web pode operar codigo e documentacao
- a publicacao do site continua preservada
- o unico ajuste externo que ainda falta para fechar o ciclo remoto e configurar `CLOUDFLARE_API_TOKEN` no GitHub
