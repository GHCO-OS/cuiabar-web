# Arquitetura e rotas

Atualizado em: 2026-04-27

## Estrutura do sistema

O `GHCO OS` reúne três linhas de produto:

1. `Cuiabar Web`
   Site público, cardápio, páginas especiais, conteúdo institucional e descoberta orgânica.
2. `MeuCuiabar`
   Portal interno para qualidade, HACCP, checklists e rotinas da operação.
3. `Cuiabar Atende`
   CRM, reservas, atendimento digital, campanhas, relacionamento e fidelização.

## Stack principal

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- React Router DOM
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare KV
- Workers AI
- Node.js local para a ponte Baileys

## Estrutura de pastas

```txt
src/
  app/            shell principal e roteamento
  components/     componentes compartilhados
  sections/       blocos reutilizáveis do site
  pages/          páginas públicas
  data/           conteúdo, configuração e SEO
  hooks/          hooks de frontend
  lib/            helpers e integrações do cliente
  styles/         estilos globais e por frente
  crm/            portal do Cuiabar Atende
  meucuiabar/     portal interno do MeuCuiabar
  reservations/   frontend do fluxo de reservas

functions/
  api/            funções do Cloudflare Pages

worker/
  reservations/   backend de reservas
  services/       integrações compartilhadas
  whatsapp/       backend canônico do atendimento por WhatsApp
  whatsapp-intelligence/ worker dedicado e experimental

services/
  whatsapp-baileys/ ponte local do WhatsApp Web

migrations/
  evolução de schema do D1
```

## Responsabilidade por área

- `src/pages/`, `src/sections/`, `src/data/`, `public/`
  Superfície principal do `Cuiabar Web`.

- `src/crm/`
  Interface do `Cuiabar Atende`.

- `src/meucuiabar/`
  Interface do `MeuCuiabar`, hoje com frontend transplantado do Base44 e autenticação internalizada no Worker.

- `src/reservations/`
  Jornada pública e operacional de reservas.

- `worker/`
  Backend central do sistema, com autenticação, CRM, integrações, reservas e rotas internas.

- `services/whatsapp-baileys/`
  Transporte local do WhatsApp Web.

## Domínios e hosts

- `https://cuiabar.com`
  Site principal.

- `https://prorefeicao.cuiabar.com`
  Host oficial da frente `ProRefeição`.

- `https://burgersnsmoke.com`
  Host oficial da frente `Burger N' Smoke`.

- `https://burger.cuiabar.com`
  Host legado do burger antigo, mantido apenas como redirecionamento permanente para `https://burgersnsmoke.com/`.

- `https://crm.cuiabar.com`
  Portal oficial do `Cuiabar Atende`.

- `https://meu.cuiabar.com`
  Portal oficial do `MeuCuiabar`.

- `https://crm.cuiabar.com/meucuiabar*`
  Alias legado, hoje redirecionado para `meu.cuiabar.com`.

- `https://reservas.cuiabar.com`
  Portal dedicado de reservas.

- `https://blog.cuiabar.com/editor*`
  Faixa reservada para operação editorial protegida.

## Rotas públicas principais

- `/`
  Portal de entrada da marca, com seletor de experiências para `Presencial`, `Expresso` e `Espetaria`.
- `/presencial`
  Home pública principal do restaurante, com hero institucional, destaque promocional do almoço presencial e acesso para menu, WhatsApp e reservas.
- `/expresso`
  Frente canônica de delivery e operação rápida, concentrando marmitaria, `Burger N' Smoke` e os canais oficiais de pedido.
- `/menu`
- `/pedidos-online`
  Atalho legado, hoje redirecionado para `/expresso`.
- `/delivery`
  Atalho legado, hoje redirecionado para `/expresso`.
- `/burger-n-smoke`
  Preview interno da landing dedicada da nova marca, publicado no site principal apenas para operação e QA.
- `/espetaria`
- `/vagas`
- `/links`
  Hub leve de links oficiais, com foco em reservas, pedido direto, atendimento e horários operacionais da casa.
- `/reservas`

## Redirecionamentos legados relevantes

- `https://cuiabar.com/prorefeicao`
  Redireciona permanentemente para `https://prorefeicao.cuiabar.com/`.

- `https://www.prorefeicao.cuiabar.com`
  Redireciona permanentemente para `https://prorefeicao.cuiabar.com/`.

- `https://cuiabar.com/blog*`
  Frente desativada. Redireciona permanentemente para `https://cuiabar.com/presencial/`.

- `https://cuiabar.com/agenda*`
  Frente desativada. Redireciona permanentemente para `https://cuiabar.com/presencial/#agenda-casa`.

- `https://cuiabar.com/bar-jardim-aurelia-musica-ao-vivo`
  Página local desativada. Redireciona permanentemente para `https://cuiabar.com/presencial/#agenda-casa`.

- `https://cuiabar.com/burger`
- `https://cuiabar.com/burguer`
- `https://cuiabar.com/burguer-cuiabar`
  Aliases legados do burger. Redirecionam permanentemente para `https://burgersnsmoke.com/`.

## Rotas internas e de infraestrutura

- `crm.cuiabar.com/api/*`
  APIs do CRM, autenticação, campanhas, integrações e módulos operacionais.

- `crm.cuiabar.com/api/internal/whatsapp/*`
  Endpoints consumidos pela ponte local Baileys.

- `crm.cuiabar.com/api/admin/whatsapp/*`
  Rotas administrativas do atendimento por WhatsApp.

- `meu.cuiabar.com/oauth/*`
  Fluxo de autenticação do portal interno via Google.

## Observações arquiteturais

- O projeto combina assets estáticos do Pages com backend dinâmico em Workers.
- A navegação pública agora foi reorganizada por experiência: a raiz funciona como hub, enquanto o conteúdo institucional do restaurante opera em `/presencial` e a frente de delivery em `/expresso`.
- O bloco de agenda pública e o blog foram retirados da superfície principal. A referência de programação da casa passou a existir apenas como embed do Google Calendar dentro de `/presencial`.
- A frente `ProRefeição` deixou de ser página principal em `cuiabar.com/prorefeicao` e passou a operar no subdomínio dedicado `prorefeicao.cuiabar.com`, com a rota antiga preservada apenas como `301`.
- O host `burgersnsmoke.com` é atendido por Pages + Worker, usando a mesma base de build do repositório com uma landing dedicada da nova marca.
- O host `burger.cuiabar.com` foi rebaixado a legado e deve existir apenas como redirecionamento permanente para `https://burgersnsmoke.com/`.
- As canonicals públicas do `cuiabar.com` passaram a seguir o formato com barra final, alinhadas ao formato realmente servido pelos diretórios estáticos do Pages.
- Espelhos públicos indevidos em `crm.cuiabar.com` passaram a redirecionar para suas URLs canônicas no site principal ou nos subdomínios oficiais.
- O `MeuCuiabar` já tem host próprio, mas ainda usa parte do frontend transplantado do Base44.
- O módulo `worker/whatsapp-intelligence/` segue isolado por feature flag e não substitui a arquitetura canônica de `worker/whatsapp/`.
- O blog permanece apenas como faixa editorial protegida em `blog.cuiabar.com/editor*`.
