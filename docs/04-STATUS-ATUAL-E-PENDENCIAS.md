# Status atual e pendencias

Atualizado em: 2026-04-21

## Estado geral

O projeto esta operacional e publicado via Cloudflare como base unica do `GHCO OS`, com tres linhas de produto:

- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

O repositorio oficial continua sendo `cuiabar/cuiabar-web`, mas o workspace local desta maquina esta mais avancado que o GitHub e exigia consolidacao antes de nova publicacao.

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
- `MeuCuiabar` em `meu.cuiabar.com`, com login Google interno e aprovacao manual
- documentacao de governanca em `AGENTS.md` e `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
- inventario operacional desta maquina e do bridge em `docs/10-AMBIENTE-LOCAL-E-IDS.md`

## O que ja foi melhorado nesta organizacao

- trilha de leitura obrigatoria para novas IAs
- mapa oficial de documentacao e governanca
- definicao do sistema-mãe `GHCO OS`
- separacao conceitual entre `Cuiabar Web`, `MeuCuiabar` e `Cuiabar Atende`
- padrao de branches por linha de produto e por core compartilhado
- branches-base oficiais abertas no remoto
- classificacao operacional do legado em andamento, com matriz publicada em `docs/16-CLASSIFICACAO-DE-MODULOS-E-LEGADO.md`
- `MeuCuiabar` sobrescrito com a versao operacional raspada do Base44, agora localizada em `src/meucuiabar/base44/`
- runtime proprio de `MeuCuiabar` no host `meu.cuiabar.com`
- identidade visual e textual do shell principal reposicionada para `Cuiabar Atende`
- arquivos `.js` e `.d.ts` gerados dentro de `worker/` removidos do versionamento
- guias legados centralizados em `docs/guias-legados/`, reduzindo duplicacao na raiz
- arquivos confidenciais e snapshots do `KIT-PORTABILIDADE` passaram a ficar bloqueados por `.gitignore`

## Topologia Git atual

Tronco oficial:

- `main`

Branches-base derivadas do sistema:

- `ghco/core`
- `web/cuiabar-web`
- `meucuiabar/operacao`
- `atende/omnicanal`

Decisao estrutural:

- `Super` deixa de ser nome de produto e de linha permanente no Git
- qualquer legado associado a `Super` deve ser classificado e redistribuido entre `MeuCuiabar`, `Cuiabar Atende` ou `GHCO OS`

## Atualizacao operacional de 2026-04-17

- o site publico foi publicado no Cloudflare Pages com sucesso
- o Worker `cuiabar-crm` foi republicado com sucesso
- o binding `WHATSAPP_KV` passou a exigir `id` fixado no `wrangler.jsonc`
- o namespace operacional vinculado hoje e `cuiabar-crm-whatsapp-kv`
- o erro inicial de login do `MeuCuiabar` em `meu.cuiabar.com` nao estava no Google Cloud; a causa real era o D1 remoto sem as migracoes `0005_whatsapp.sql` e `0006_meucuiabar_google_access.sql`
- as migracoes remotas foram aplicadas em `2026-04-17` e o schema `users` agora possui os campos de aprovacao e escopos Google exigidos pelo fluxo novo do `MeuCuiabar`

## Atualizacao de auditoria de 2026-04-21

- o workspace local tinha conflitos de merge abertos em `src/crm/pages/LoginPage.tsx` e na documentacao estrutural
- o CRM voltou a compilar apos resolucao de conflito e limpeza do shell principal em `src/crm/CrmApp.tsx`
- `useCrmBootstrap` deixou de recarregar bootstrap e sessao a cada troca de rota, reduzindo flicker e custo desnecessario no portal
- o projeto voltou a passar em `npm run lint` e `npm run build`
- o maior gargalo tecnico imediato agora e o bundle de `MeuCuiabar`, que ainda sai acima do limite de chunk do Vite
- os avisos de SSR com `<Navigate>` continuam presentes e merecem limpeza futura

## O que merece acompanhamento

- reduzir bundle do `MeuCuiabar`, que ficou acima do alerta de chunk do Vite apos a importacao do app Base44
- revisar warnings de SSR com `<Navigate>` no build
- consolidar de vez a politica de deploy sem GitHub
- separar melhor conteudo editorial/blog do restante do projeto
- revisar periodicamente tokens e permissao do Cloudflare e GitHub
- consolidar referencias ao inventario confidencial ausente desta copia local
- manter o runtime local do Baileys fora do Google Drive para evitar lock de arquivos
- preencher segredos reais do bridge interno e da Cloudflare AI
- acompanhar saude do autostart/watchdog do Baileys em producao
- extrair o backend operacional do `MeuCuiabar` do storage local seedado para Worker/D1 quando a estrutura propria for aberta
- empurrar o estado local consolidado para o GitHub em branch de trabalho antes de novo ciclo grande de refactor

## Decisao importante

A publicacao do site nao depende do GitHub hoje.

Isso significa:

- o repositorio GitHub nao e o mecanismo de deploy do site
- o workflow `deploy-cloudflare.yml` no GitHub fica restrito a disparo manual de contingencia
- o que nao pode faltar para publicacao e o acesso de deploy ao Cloudflare
- o GitHub continua sendo a base oficial de versionamento e continuidade

## Estado do GitHub

- o repositorio oficial de versionamento e `cuiabar/cuiabar-web`
- o repositorio e privado
- a copia operacional principal desta maquina fica em `C:\cuiabar-web`
- o Google Drive fica como backup e snapshot, nao como runtime principal
- em `2026-04-21`, o remoto ainda estava atrasado em relacao ao workspace local e sem commits novos no dia

## Itens que podem ser melhorados depois

- pipeline automatizado e seguro de deploy sem depender de maquina local
- centralizacao de secrets em cofre apropriado
- limpeza adicional de artefatos tecnicos locais
- revisao do modulo de blog
- refinamento final de QA mobile em paginas especiais
- refinamento adicional de observabilidade do modulo de WhatsApp
