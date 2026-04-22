# Classificação de módulos e legado

Atualizado em: 2026-04-22

## Objetivo

Classificar os módulos reais do repositório entre:

- `GHCO OS`
- `Cuiabar Web`
- `MeuCuiabar`
- `Cuiabar Atende`

## GHCO OS

Responsável por:

- contratos compartilhados
- autenticação
- integrações centrais
- infraestrutura de runtime
- entidades comuns

Fonte principal:

- `worker/index.ts`
- `worker/app.ts`
- `worker/types.ts`
- `functions/`
- `wrangler.jsonc`
- `package.json`
- `vite.config.ts`
- `tailwind.config.ts`

## Cuiabar Web

Responsável por:

- site público
- cardápio
- discovery orgânico
- landing pages do cliente

Fonte principal:

- `src/app/`
- `src/pages/`
- `src/sections/`
- `src/data/`
- `src/components/` quando o uso for público
- `public/`

Subfrentes públicas:

- `src/burger/`
- `src/pages/EspetariaCuiabarPage.tsx`
- `src/pages/ProRefeicaoPage.tsx`

## MeuCuiabar

Responsável por:

- controle interno
- qualidade
- HACCP
- checklists
- rotinas da operação

Fonte principal:

- `src/meucuiabar/`
- `src/meucuiabar/base44/`

Observações:

- o frontend já foi internalizado;
- o backend dedicado ainda será extraído progressivamente para Worker/D1.

## Cuiabar Atende

Responsável por:

- CRM
- reservas
- marketing
- fidelização
- atendimento omnichannel

Fonte principal:

- `src/crm/`
- `src/reservations/`
- `worker/reservations/`
- `worker/whatsapp/`
- `worker/whatsapp-intelligence/`
- `services/whatsapp-baileys/`

## Itens que não são fonte principal

- `dist/`
- `.ssr/`
- `node_modules/`
- `ops-artifacts/`
- `KIT-PORTABILIDADE/`
- arquivos gerados `.js` e `.d.ts` ao lado dos arquivos-fonte no `worker/`

## Regra prática

Toda nova mudança deve:

1. classificar primeiro a linha de produto;
2. editar o arquivo-fonte correto;
3. atualizar a documentação central correspondente;
4. evitar promover material de apoio a padrão oficial.
