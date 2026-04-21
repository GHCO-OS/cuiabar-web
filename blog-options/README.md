# Blog options para `blog.cuiabar.com`

Este pacote foi montado para ajudar a decidir e iniciar o blog sem baguncar o projeto principal.

## O que ja existe no repositorio

- O site atual ja roda em React + Vite + TypeScript.
- Ja existe um `/blog` interno com rotas, SEO e artigos estaticos.
- O projeto ja conversa com Cloudflare, SSR estatico, analytics, WhatsApp e reservas.

Isso muda a decisao: o melhor caminho nao e "qualquer CMS bonito", e sim qual arquitetura entrega:

- publicacao facil
- performance muito alta
- SEO/indexacao forte
- integracoes locais e de conversao
- manutencao simples

## O que voce encontra aqui

- `BLOG-SCOPE.md`: visao de produto, funcionalidades e roadmap.
- `MATRIZ-ARQUITETURAS.md`: comparativo objetivo entre as opcoes.
- `astro-static/`: starter para blog SSG moderno e muito rapido.
- `ghost/`: starter para publicacao editorial com admin pronto.
- `directus/`: blueprint completo de editor (CMS) + sincronizacao com o blog atual.
- `hugo-static/`: starter estatico ultra leve e barato.

## Recomendacao resumida

1. `Astro + Directus` se a Cuiabar quiser o melhor equilibrio entre visual moderno, SEO, performance e controle tecnico.
2. `Ghost` se a prioridade for autonomia editorial, newsletters, memberships e painel de publicacao muito forte.
3. `Hugo` se a prioridade for baixo custo operacional e conteudo mais simples.
4. Evoluir o blog React atual so faz sentido se a equipe topar publicar via codigo ou JSON por mais tempo.

## Integracoes recomendadas para qualquer stack

- Weather API para mudanca dinamica de CTA: delivery em chuva, varanda/musica em noite limpa, almoco executivo em dias uteis.
- WhatsApp channel e WhatsApp direto com eventos de analytics separados.
- Agenda/editorial cruzada com `agenda`, `reservas`, `menu`, `prorefeicao` e guias locais.
- sitemap, RSS, JSON Feed, schema `BlogPosting`, `Event`, `Restaurant`, `FAQPage`, `BreadcrumbList`.
- busca interna, posts relacionados, CTA contextual por categoria e UTM propagation para subdominios.

## Como usar

1. Escolha uma opcao.
2. Copie `.env.example` para `.env` dentro da opcao.
3. Rode `bash deploy.sh` (ou `deploy.ps1` no Windows) / `docker compose up -d`.
4. Aplique o `nginx-blog.conf` no host `blog.cuiabar.com`, com o editor exposto em `/editor`.

## Importante

Nao faz sentido publicar varias opcoes no mesmo `blog.cuiabar.com` ao mesmo tempo.

Por isso, no lugar de um `deploy-all-blogs.sh` que colocaria stacks em conflito, este pacote usa:

- um starter por opcao
- um helper em `scripts/deploy-blog-option.sh`

Assim a equipe escolhe uma arquitetura por vez, sem colisao de portas, banco ou dominio.
