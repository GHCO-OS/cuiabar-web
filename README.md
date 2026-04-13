# Cuiabar Web + CRM + WhatsApp AI

Repositorio principal do ecossistema digital do Villa Cuiabar.

Ele concentra:

- site institucional/comercial em React + Vite
- CRM administrativo em Cloudflare Workers + D1
- portal de reservas
- integracoes server-side
- atendimento por WhatsApp com IA via Baileys + Cloudflare Workers AI

## Resumo executivo

O modulo de WhatsApp implementado neste ciclo usa:

- Baileys rodando localmente nesta maquina para a conexao WhatsApp Web
- Cloudflare Workers como backend principal de negocio
- Workers AI com Llama para classificacao, resumo e resposta aterrada
- D1 para historico, perfis omnichannel, handoffs, reservas e fila de saida
- KV para sessao e cache
- integracao com `crm.cuiabar.com` por adaptador local/REST

Decisao importante:

- nao ha integracao com a WhatsApp Cloud API oficial da Meta
- nao ha custo por conversa da API oficial
- o transporte do WhatsApp fica no processo local `services/whatsapp-baileys`
- o Worker continua centralizando IA, regras, CRM e auditoria

## Arquitetura operacional

```txt
WhatsApp Web
  -> Baileys local (Node.js nesta maquina)
  -> POST /api/internal/whatsapp/inbound
  -> GET /api/internal/whatsapp/outbound/pull
  -> POST /api/internal/whatsapp/outbound/:id/ack|fail
  -> POST /api/internal/whatsapp/status

Cloudflare Worker
  -> intent engine
  -> rules engine
  -> reservation flow
  -> human handoff
  -> Workers AI
  -> D1 + KV
  -> CRM adapter local/REST
```

## Estrutura principal

```txt
src/
  app/
  components/
  pages/
  reservations/
  blog/

worker/
  reservations/
  services/
  whatsapp/

services/
  whatsapp-baileys/

migrations/
docs/
tests/
scripts/
```

## Integracao com o CRM

O CRM atual usa `contacts.email` como campo obrigatorio e unico.

Para nao quebrar campanhas e disparos:

1. o WhatsApp grava primeiro em `customer_profiles`
2. o perfil guarda telefone, nome, tags, resumo e link opcional para `contacts`
3. o adaptador sincroniza as interacoes para `public_interaction_events`
4. o vinculo com `contacts` so acontece quando houver match seguro ou e-mail real

Isso evita:

- e-mails falsos
- regressao no modulo de e-mail marketing
- acoplamento ruim entre atendimento conversacional e base de disparo

## O que foi adicionado

### Backend WhatsApp no Worker

- `worker/whatsapp/`
  - service de IA
  - motor de intencoes
  - motor de regras
  - fluxo de reservas
  - fluxo de handoff
  - repositorio D1
  - adaptador CRM local/REST
  - endpoints internos para a ponte Baileys
  - endpoints administrativos minimos

### Ponte local Baileys

- `services/whatsapp-baileys/`
  - `src/config.ts`
  - `src/bridgeClient.ts`
  - `src/messageParser.ts`
  - `src/statusServer.ts`
  - `src/index.ts`

### Banco D1

- `migrations/0005_whatsapp_ai_assistant.sql`
  - `customer_profiles`
  - `whatsapp_conversations`
  - `whatsapp_messages`
  - `whatsapp_reservation_flows`
  - `whatsapp_handoffs`
  - `whatsapp_webhook_events`
  - `whatsapp_audit_logs`

- `migrations/0006_whatsapp_baileys_outbound.sql`
  - `whatsapp_outbound_commands`

## Endpoints do Worker

### Internos da ponte Baileys

- `POST /api/internal/whatsapp/inbound`
- `POST /api/internal/whatsapp/status`
- `GET /api/internal/whatsapp/outbound/pull`
- `POST /api/internal/whatsapp/outbound/:id/ack`
- `POST /api/internal/whatsapp/outbound/:id/fail`
- `GET /api/internal/whatsapp/outbound/:id`
- `POST /api/internal/whatsapp/crm/sync`

### Administrativos

- `GET /api/admin/whatsapp/overview`
- `GET /api/admin/whatsapp/conversations`
- `GET /api/admin/whatsapp/conversations/:id`
- `POST /api/admin/whatsapp/conversations/:id/handoff`
- `POST /api/admin/whatsapp/conversations/:id/reply`

## Variaveis e segredos

### Worker Cloudflare

Use `.dev.vars` localmente e `wrangler secret put` em producao.

Modelo base:

- `.dev.vars.example`

Segredos:

- `SETUP_ADMIN_TOKEN`
- `CRM_INTERNAL_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`

Vars em `wrangler.jsonc`:

- `CRM_INTEGRATION_MODE`
- `WHATSAPP_AI_MODE`
- `WHATSAPP_AI_MODEL`
- `WHATSAPP_MENU_URL`
- `WHATSAPP_BURGER_URL`
- `WHATSAPP_DELIVERY_URL`
- `WHATSAPP_EXPRESSO_URL`
- `WHATSAPP_CHANNEL_URL`
- `WHATSAPP_ADDRESS`
- `WHATSAPP_HOURS_SUMMARY`
- `WHATSAPP_PHONE_DISPLAY`
- `WHATSAPP_RESERVATION_BEST_EFFORT_ENABLED`

### Servico local Baileys

Arquivo base:

- `services/whatsapp-baileys/.env.example`

Variaveis:

- `WHATSAPP_WORKER_BASE_URL`
- `WHATSAPP_INTERNAL_TOKEN`
- `BAILEYS_AUTH_DIR`
- `BAILEYS_POLL_INTERVAL_MS`
- `BAILEYS_PULL_BATCH_SIZE`
- `BAILEYS_STATUS_HOST`
- `BAILEYS_STATUS_PORT`
- `BAILEYS_LOG_LEVEL`
- `BAILEYS_MARK_INCOMING_AS_READ`
- `BAILEYS_PAIRING_PHONE`

## Setup local

### 1. Instalar dependencias do projeto principal

```bash
npm install
```

### 2. Configurar variaveis do Worker

Crie `.dev.vars` a partir de `.dev.vars.example`.

### 3. Aplicar migrations locais

```bash
npm run d1:migrate:local
```

### 4. Validar o Worker

```bash
npm run lint
npm test
```

### 5. Preparar o runtime local do Baileys

```bash
npm run baileys:prepare
```

Observacao operacional:

- este repositorio esta em um volume do Google Drive
- por isso o runtime do Baileys e sincronizado para `%LOCALAPPDATA%\\VillaCuiabar\\whatsapp-baileys-runtime`
- isso evita erro de `EPERM/EBADF` no `npm install` e no armazenamento da sessao do WhatsApp Web

### 6. Editar o `.env` do runtime local

Arquivo gerado automaticamente:

- `%LOCALAPPDATA%\\VillaCuiabar\\whatsapp-baileys-runtime\\.env`

Preencha:

- `WHATSAPP_WORKER_BASE_URL`
- `WHATSAPP_INTERNAL_TOKEN`
- opcionalmente `BAILEYS_PAIRING_PHONE`

### 7. Subir a ponte Baileys

```bash
npm run baileys:dev
```

Na primeira execucao:

- o QR sera exibido no terminal
- ou o codigo de pareamento sera gerado se `BAILEYS_PAIRING_PHONE` estiver preenchido
- a sessao ficara persistida no diretorio configurado em `BAILEYS_AUTH_DIR`

## Deploy do Worker

### 1. Configurar segredos

Exemplos:

```bash
echo "token-interno" | npx wrangler secret put CRM_INTERNAL_TOKEN
echo "cf-account-id" | npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
echo "cf-ai-token" | npx wrangler secret put CLOUDFLARE_AI_API_TOKEN
```

### 2. Aplicar migrations remotas

```bash
npm run d1:migrate:remote
```

### 3. Publicar o Worker

```bash
npm run deploy:worker
```

## Operacao do Baileys em producao

Para operacao continua nesta maquina ou em um Windows dedicado:

1. rode `npm run baileys:prepare`
2. ajuste o `.env` do runtime local
3. execute `npm run baileys:build` para validar build do bridge
4. rode o bridge com `npm run baileys:dev` ou use um supervisor local

Supervisores recomendados:

- NSSM
- PM2 para Windows
- Agendador de Tarefas do Windows com restart automatico

## Fluxos de negocio suportados

### Intencoes

- cardapio
- delivery
- hamburguer
- marmita
- reserva
- evento
- localizacao
- horarios
- reclamacao
- humano

### Regras principais

- base local e templates antes do LLM
- o canal direto com melhor condicao prioriza `https://expresso.cuiabar.com`
- convite ao canal do WhatsApp quando fizer sentido
- handoff automatico para humano em pedido explicito, reclamacao, evento, grupo grande ou baixa confianca repetida

### Reserva

Coleta:

1. data
2. horario
3. pessoas
4. observacoes
5. nome completo se faltar
6. confirmacao

Ao confirmar:

- reutiliza o modulo oficial de reservas do projeto
- grava a reserva no schema existente
- devolve `reservation_code` ao cliente

## Scripts uteis

```bash
npm run lint
npm test
npm run build
npm run build:worker
npm run deploy:worker
npm run d1:migrate:local
npm run d1:migrate:remote
npm run baileys:prepare
npm run baileys:dev
npm run baileys:build
npm run baileys:check
```

## Documentacao detalhada

- `AGENTS.md`
- `docs/00-INDICE-GERAL.md`
- `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
- `docs/06-WHATSAPP-AI-ARQUITETURA.md`
- `docs/07-WHATSAPP-AI-ENDPOINTS.md`
- `docs/08-WHATSAPP-AI-PAYLOADS.md`
- `docs/10-AMBIENTE-LOCAL-E-IDS.md`
- `docs/01-ARQUITETURA-E-ROTAS.md`
- `docs/03-INTEGRACOES-E-CREDENCIAIS.md`

## Validacao executada

Executado neste ciclo:

- `npm run lint`
- `npm test`
- `npx tsc -p tsconfig.worker.json --noEmit`
- `npm run baileys:check`

## Limites conhecidos

- o CRM ainda nao tem tela React dedicada para esse modulo; a operacao inicial fica via endpoints administrativos
- a vinculacao com `contacts` depende de e-mail conhecido ou match seguro
- o estado do Baileys usa armazenamento local multi-arquivo; mantenha o runtime em disco NTFS local e sob backup
- grupos, status e newsletters sao ignorados pelo bridge atual; o foco e atendimento 1:1
