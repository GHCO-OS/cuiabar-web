# Migração para operação via Codex Web

Atualizado em: 2026-04-13

## Objetivo

Tornar o projeto tratável prioritariamente via GitHub/Codex Web, reduzindo dependência da máquina local.

## O que já foi migrado

- repositório privado criado no GitHub
- `main` publicada como base oficial do projeto
- remoto oficial consolidado em `origin -> https://github.com/cuiabar/cuiabar-web.git`
- documentação central movida para `docs/`
- governança para novas IAs criada em `AGENTS.md`
- root organizada para onboarding rápido
- artefatos temporários movidos para `ops-artifacts/`
- arquivos `.env` locais do fluxo editorial removidos da árvore ativa
- workflow de deploy via GitHub Actions preparado em `.github/workflows/deploy-cloudflare.yml`

## O que já está pronto para Codex Web

- edição de código e documentação
- trabalho por branches
- build do site e SSR
- revisão de SEO e conteúdo
- manutenção de páginas públicas
- manutenção de burger, blog e CRM no mesmo repositório
- deploy automatizável via GitHub Actions

## O que ainda depende de configuração externa

### 1. Secret do Cloudflare no GitHub

Para ativar deploy automático pelo GitHub Actions, o repositório precisa do secret:

- `CLOUDFLARE_API_TOKEN`

Sem ele, o workflow já existe, mas fica inativo por segurança.

### 2. Fluxos editoriais locais opcionais

Os scripts abaixo continuam sendo locais/opcionais:

- `scripts/open-local-blog-editor.ps1`
- `scripts/run-editorial-operation.ps1`
- `scripts/start-blog-editor-tunnel.ps1`
- `scripts/stop-local-blog-editor.ps1`

Eles não impedem operação via Codex Web do projeto principal.

### 3. Módulos que ainda têm pegada operacional local

- opções de Blogger/Directus dentro de `blog-options/`
- qualquer túnel local de editor
- qualquer autenticação manual de provedor de conteúdo

## Conclusão da auditoria

O projeto já pode ser tratado como web-first.

Na prática:

- GitHub é a fonte principal
- existe um único repositório oficial para código e documentação: `cuiabar/cuiabar-web`
- Codex Web pode operar código e documentação
- a publicação do site continua preservada
- o único ajuste externo que falta para fechar o ciclo remoto é configurar o secret do Cloudflare no GitHub

## Próximo passo recomendado

1. configurar `CLOUDFLARE_API_TOKEN` em GitHub Actions
2. passar a trabalhar por branches temáticas:
   - `site/*`
   - `crm/*`
   - `burger/*`
   - `blog/*`
   - `infra/*`
3. usar a máquina local apenas para tarefas estritamente externas, quando necessário
