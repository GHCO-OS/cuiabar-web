# Operação remota e GitHub

Atualizado em: 2026-04-22

## Objetivo

Permitir que o projeto seja mantido, auditado e versionado remotamente pelo GitHub, sem perder o modelo de publicação operacional em Cloudflare.

## O que já está pronto

- repositório oficial centralizado em `GHCO-OS/cuiabar-web`
- documentação oficial dentro de `docs/`
- runbooks específicos em `docs/runbooks/`
- separação de linhas de produto por branches

## O que continua local

- pareamento manual do WhatsApp Web
- runtime local da ponte Baileys
- qualquer atividade que dependa de sessão operacional da máquina

## Regra de operação

- GitHub é a fonte oficial de código e documentação.
- Cloudflare continua sendo a camada de publicação.
- O deploy operacional permanece local/manual via Wrangler.
- O workflow remoto existe apenas como contingência controlada.
