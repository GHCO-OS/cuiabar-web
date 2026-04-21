# Mapa de manutenção e branches

Atualizado em: 2026-04-17

## Objetivo

Concentrar em uma página só a resposta para quatro perguntas:

1. qual pasta pertence a qual linha de produto
2. em qual branch a mudança deve nascer
3. se a pasta é fonte real ou apoio
4. se existe alguma observação de transição

## Matriz principal

| Área | Linha | Branch de trabalho | Tipo | Observação |
| --- | --- | --- | --- | --- |
| `src/app/` | `Cuiabar Web` | `web/*` | fonte | shell público |
| `src/pages/` | `Cuiabar Web` | `web/*` | fonte | páginas públicas |
| `src/sections/` | `Cuiabar Web` | `web/*` | fonte | blocos reutilizáveis do site |
| `src/blog/` | `Cuiabar Web` | `blog/*` ou `web/*` | fonte | frente editorial |
| `src/burger/` | `Cuiabar Web` | `burger/*` ou `web/*` | fonte | subfrente pública |
| `src/data/` | `Cuiabar Web` | `web/*` | fonte | conteúdo e configuração pública |
| `src/components/` | depende do uso | `web/*` ou `atende/*` | fonte | classificar pelo consumidor principal |
| `src/crm/` | `Cuiabar Atende` | `atende/*` | fonte | portal operacional principal |
| `src/crm/branding.ts` | `Cuiabar Atende` | `atende/*` | fonte | branding canônico do produto interno |
| `src/meucuiabar/` | `MeuCuiabar` | `meucuiabar/*` | fonte | módulo interno dedicado |
| `src/reservations/` | `Cuiabar Atende` | `atende/*` | fonte | frontend de reservas |
| `worker/` | `GHCO OS` + `Cuiabar Atende` | `ghco/*` ou `atende/*` | fonte | classificar pelo domínio da mudança |
| `worker/reservations/` | `Cuiabar Atende` | `atende/*` | fonte | backend de reservas |
| `worker/whatsapp/` | `Cuiabar Atende` | `atende/*` | fonte | backend WhatsApp canônico |
| `worker/whatsapp-intelligence/` | `Cuiabar Atende` | `atende/*` | experimental | manter em transição controlada |
| `worker/services/google/` | `GHCO OS` | `ghco/*` | fonte | integrações compartilhadas |
| `worker/services/meta/` | `GHCO OS` | `ghco/*` | fonte | integrações compartilhadas |
| `worker/services/gmail/` | `Cuiabar Atende` | `atende/*` | fonte | operação CRM/reservas |
| `worker/services/zoho/` | `Cuiabar Atende` | `atende/*` | legado | mexer só quando a tarefa exigir |
| `functions/` | `GHCO OS` | `ghco/*` ou `infra/*` | fonte | Pages Functions e middleware |
| `services/whatsapp-baileys/` | `Cuiabar Atende` | `atende/*` | fonte | bridge local |
| `public/` | `Cuiabar Web` | `web/*` | fonte | assets versionados |
| `migrations/` | depende do domínio | `ghco/*`, `web/*` ou `atende/*` | fonte | não renumerar histórico publicado |
| `scripts/` | infraestrutura/apoio | `infra/*` ou linha dona | fonte | scripts operacionais |
| `docs/` | `GHCO OS` | `infra/*` | fonte | documentação oficial |
| `docs/guias-legados/` | apoio histórico | `infra/*` | apoio | não é trilha principal |
| `KIT-PORTABILIDADE/` | apoio externo | `infra/*` | apoio confidencial | não usar como fonte principal |
| `ops-artifacts/` | nenhuma | nenhuma | artefato | evidência técnica e QA |

## Branches-base oficiais

- `main`
- `ghco/core`
- `web/cuiabar-web`
- `meucuiabar/operacao`
- `atende/omnicanal`

## Branches complementares

- `burger/cuiabar`
- `blog/editorial`
- `infra/organizacao`

## Regras rápidas

- se a dúvida for entre `ghco/*` e uma linha de produto, prefira `ghco/*` só quando a mudança alterar contrato, runtime ou integração compartilhada
- `src/atende/` não é mais namespace de manutenção; a superfície canônica do produto fica em `src/crm/`, `src/reservations/` e `src/crm/branding.ts`
- não abrir mudança nova em `main`
