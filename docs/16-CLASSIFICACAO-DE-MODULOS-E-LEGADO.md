# Classificacao de modulos e legado

Atualizado em: 2026-04-21

## Objetivo

Classificar os modulos reais do repositorio entre:

- `GHCO OS`
- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

E registrar o que e:

- fonte principal
- frente complementar
- experimental
- legado
- ou artefato que nao deve ser editado como origem

## 1. GHCO OS

Responsabilidade:

- contratos compartilhados
- autenticacao
- integracoes centrais
- infraestrutura de runtime
- entidades comuns entre produtos

Fonte principal:

- `worker/index.ts`
- `worker/app.ts`
- `worker/lib/`
- `worker/types.ts`
- `functions/_middleware.js`
- `functions/robots.txt.js`
- `wrangler.jsonc`
- `package.json`
- `tailwind.config.ts`
- `vite.config.ts`
- `tsconfig*.json`

## 2. Cuiabar Web

Responsabilidade:

- site publico
- cardapio
- discovery organico
- landing pages do cliente final

Fonte principal:

- `src/app/`
- `src/pages/HomePage.tsx`
- `src/pages/MenuPage.tsx`
- `src/pages/PedidosOnlinePage.tsx`
- `src/pages/LinksPage.tsx`
- `src/pages/AgendaPage.tsx`
- `src/pages/AgendaEventPage.tsx`
- `src/pages/LocalGuidePage.tsx`
- `src/pages/PesquisaPage.tsx`
- `src/pages/ProRefeicaoPage.tsx`
- `src/pages/VagasPage.tsx`
- `src/sections/`
- `src/components/` quando o componente for publico
- `src/data/`
- `public/`

Subfrente Burger:

- `src/pages/BurguerCuiabarPage.tsx`
- `src/pages/EspetariaCuiabarPage.tsx`
- `public/burguer/`

Superficie de redirecionamento editorial:

- `src/pages/BlogSubdomainRedirectPage.tsx`

Regra:

- o tronco principal preserva apenas a compatibilidade de rota para `blog.cuiabar.com`;
- qualquer volta do blog como produto ativo deve ocorrer fora de `main`, em branch dedicada.

## 3. MeuCuiabar

Responsabilidade:

- controle interno
- qualidade
- HACCP
- checklists
- rotinas da casa

Fonte principal atual:

- `src/meucuiabar/pages/MeuCuiabarHubPage.tsx`
- `src/meucuiabar/pages/MeuCuiabarAuditPage.tsx`

## 4. Cuiabar Atende

Responsabilidade:

- CRM
- WhatsApp com IA
- reservas
- marketing
- fidelidade
- relacionamento omnichannel

Fonte principal:

- `src/crm/`
- `src/reservations/`
- `worker/reservations/`
- `worker/whatsapp/`
- `services/whatsapp-baileys/`
- `worker/services/gmail/`
- `worker/services/zoho/`

Experimental e transicao:

- `worker/whatsapp-intelligence/`

Regra:

- esse modulo segue isolado por flag e nao deve competir como segunda arquitetura oficial permanente.

## 5. O que nao e fonte principal

Nao editar como origem de manutencao:

- `dist/`
- `.ssr/`
- `node_modules/`
- `ops-artifacts/`
- `KIT-PORTABILIDADE/`
- arquivos `.js` e `.d.ts` gerados ao lado de `.ts` em `worker/` e `worker/whatsapp/`
- `.claude/` e worktrees locais
