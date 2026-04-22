# Nomenclatura e linhas de produto

Atualizado em: 2026-04-21

## Sistema-mae

O nome geral do sistema e:

- `GHCO OS`

## Linhas de produto

### 1. Cuiabar Web

Responsabilidade:

- site publico
- cardapio
- discovery organico
- paginas comerciais para cliente final

Escopo principal:

- home institucional
- menu
- pedidos online
- SEO local
- paginas especiais publicas

Areas de codigo mais ligadas:

- `src/app/`
- `src/pages/`
- `src/sections/`
- `src/data/`
- `src/lib/seo.ts`
- `public/`

Hosts e rotas associados:

- `cuiabar.com`
- rotas publicas do dominio principal

Observacao:

- `blog.cuiabar.com` existe como superficie editorial externa e nao como modulo ativo do tronco principal.

### 2. MeuCuiabar

Responsabilidade:

- controle interno
- qualidade
- HACCP
- rotinas da casa
- operacao interna nao comercial

### 3. Cuiabar Atende

Responsabilidade:

- WhatsApp com IA
- reservas
- CRM
- marketing
- fidelidade

Areas de codigo mais ligadas:

- `src/crm/`
- `src/reservations/`
- `worker/`
- `worker/reservations/`
- `worker/whatsapp/`
- `worker/whatsapp-intelligence/` apenas enquanto houver transicao
- `migrations/`
- `services/whatsapp-baileys/`

Hosts e rotas associados:

- `crm.cuiabar.com`
- `reservas.cuiabar.com`
- APIs internas do Worker
