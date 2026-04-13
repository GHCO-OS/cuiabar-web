# WhatsApp AI - arquitetura

Atualizado em: 2026-04-08

## 1. Inspecao do CRM atual e estrategia de integracao

Antes de implementar o modulo, foram validadas:

- a aplicacao publicada em `https://crm.cuiabar.com/api/health`
- a configuracao publica em `https://crm.cuiabar.com/api/auth/config`
- o estado de bootstrap em `https://crm.cuiabar.com/api/bootstrap/status`
- o codigo local do Worker em `worker/app.ts`
- o schema atual em `migrations/0001_initial_crm.sql`, `0003_public_interactions_and_zoho_sync.sql` e `0004_reservations.sql`

### Restricao principal encontrada

A tabela `contacts` do CRM atual exige `email NOT NULL UNIQUE`.

Isso significa que um contato vindo do WhatsApp nao pode ser gravado diretamente nela sem:

- inventar e-mails falsos
- afrouxar a regra e arriscar regressao nas campanhas de e-mail
- misturar atendimento conversacional com base de disparo

### Estrategia adotada

Para nao quebrar o que ja existe:

1. foi criada uma camada omnichannel propria com `customer_profiles`
2. o atendimento por WhatsApp registra telefone, nome, tags e resumo nesse perfil
3. a sincronizacao com o CRM legado acontece por um adaptador
4. o adaptador so vincula o perfil a `contacts` quando houver:
   - match seguro por `crm_contact_id`
   - match por `email`
   - match por `phone`
   - ou criacao de `contacts` apenas quando o perfil tiver e-mail real
5. o historico operacional entra em `public_interaction_events`, preservando a visibilidade do CRM

### Modos de integracao suportados

- `CRM_INTEGRATION_MODE=local`
  O modulo usa D1 localmente dentro do mesmo Worker. E o modo recomendado para este repositorio.

- `CRM_INTEGRATION_MODE=rest`
  O modulo usa `POST /api/internal/whatsapp/crm/sync` com `x-internal-token`.
  Esse modo existe para o caso de o atendimento ser separado em outro Worker no futuro.

## 2. Arquitetura de alto nivel

```txt
Cliente WhatsApp
  -> Baileys local (Node.js)
  -> normaliza mensagem e ignora grupos/status
  -> POST /api/internal/whatsapp/inbound

Cloudflare Worker
  -> deduplica mensagem
  -> carrega sessao do KV
  -> faz intent detection por regras
  -> usa Workers AI apenas quando necessario
  -> aplica regras de negocio
  -> conduz reserva ou abre handoff
  -> grava D1
  -> sincroniza resumo/tags/interacoes no CRM
  -> cria comando outbound para resposta automatica ou manual

Baileys local
  -> envia a resposta imediata quando o Worker devolve `outboundCommand`
  -> faz polling de `GET /api/internal/whatsapp/outbound/pull`
  -> confirma `ack` ou `fail` por comando
  -> propaga status de entrega quando disponiveis

D1
  -> customer_profiles
  -> whatsapp_conversations
  -> whatsapp_messages
  -> whatsapp_reservation_flows
  -> whatsapp_handoffs
  -> whatsapp_audit_logs
  -> whatsapp_outbound_commands
  -> reservations (reaproveitada)
  -> public_interaction_events (reaproveitada)

KV
  -> sessao da conversa
  -> cache de classificacao/resposta

Workers AI
  -> classificacao ambigua
  -> resumo da conversa
  -> resposta aterrada quando template nao basta
```

## 3. Estrutura de pastas

```txt
worker/
  whatsapp/
    aiService.ts
    constants.ts
    crmAdapter.ts
    intentEngine.ts
    knowledge.ts
    logger.ts
    repository.ts
    reservationFlow.ts
    routes.ts
    service.ts
    session.ts
    templates.ts
    types.ts

services/
  whatsapp-baileys/
    src/
      bridgeClient.ts
      config.ts
      index.ts
      messageParser.ts
      statusServer.ts
      types.ts

scripts/
  run-baileys-runtime.ps1

migrations/
  0005_whatsapp_ai_assistant.sql
  0006_whatsapp_baileys_outbound.sql

tests/
  whatsapp-intent-and-rules.test.ts
  whatsapp-reservation-flow.test.ts
  whatsapp-utils.test.ts
```

## 4. Schema D1

### Tabelas novas

- `customer_profiles`
  Perfil omnichannel por telefone/e-mail/wa_id, com tags, resumo e link opcional para `contacts`.

- `whatsapp_conversations`
  Cabecalho da conversa, intent atual, status, stage e resumo.

- `whatsapp_messages`
  Historico inbound/outbound, provider ids, intent e payload bruto normalizado.

- `whatsapp_reservation_flows`
  Estado do fluxo de reserva via WhatsApp ate a criacao da reserva oficial.

- `whatsapp_handoffs`
  Chamados para atendimento humano.

- `whatsapp_audit_logs`
  Eventos tecnicos e operacionais do modulo.

- `whatsapp_outbound_commands`
  Fila persistida de mensagens de saida para o bridge Baileys, com lock, status, erro e `provider_message_id`.

### Tabelas reaproveitadas

- `reservations`
  Continua sendo a reserva oficial do sistema.

- `public_interaction_events`
  Recebe os eventos do atendimento para historico CRM.

- `contacts`
  Continua intacta para e-mail marketing e passa a ser vinculada apenas por adaptador seguro.

## 5. Modulos de integracao com WhatsApp

### Worker

- `worker/whatsapp/routes.ts`
  Rotas internas da ponte e rotas administrativas.

- `worker/whatsapp/service.ts`
  Orquestra inbound, sync CRM, handoff, reservas e criacao de comandos outbound.

- `worker/whatsapp/repository.ts`
  Persistencia D1 de conversas, mensagens, handoffs, reservas e comandos de saida.

### Servico local

- `services/whatsapp-baileys/src/config.ts`
  Leitura de `.env` e configuracoes operacionais.

- `services/whatsapp-baileys/src/messageParser.ts`
  Normalizacao de mensagens Baileys para o contrato interno do Worker.

- `services/whatsapp-baileys/src/bridgeClient.ts`
  Cliente HTTP dos endpoints internos do Worker.

- `services/whatsapp-baileys/src/statusServer.ts`
  Endpoint local de saude do bridge.

- `services/whatsapp-baileys/src/index.ts`
  Socket Baileys, QR/pairing, polling outbound, ACK/fail e status.

## 6. Servico de IA

A IA nao responde sozinha por padrao.

Prioridade:

1. templates comerciais
2. base local
3. Workers AI

Capacidades usadas:

- classificacao ambigua
- resumo da conversa
- resposta aterrada com contexto local

Modos suportados:

- `WHATSAPP_AI_MODE=binding`
- `WHATSAPP_AI_MODE=rest`
- `WHATSAPP_AI_MODE=off`

## 7. Motor de intencao

Ordem de decisao:

1. regras por palavra-chave
2. classificacao via Workers AI apenas se a mensagem vier ambigua
3. fallback para `unknown`

Intents suportados:

- `menu`
- `delivery`
- `hamburguer`
- `marmita`
- `reserva`
- `evento`
- `localizacao`
- `horarios`
- `reclamacao`
- `humano`
- `unknown`

## 8. Motor de regras

Regras prioritarias:

- pedido explicito por humano -> abre handoff
- reclamacao -> abre handoff urgente
- evento/comemoracao -> abre handoff comercial
- reserva -> entra no fluxo de coleta
- links comerciais -> responde por template
- intents ambiguas -> tenta resposta aterrada por AI
- baixa confianca repetida -> abre handoff
- mensagem nao textual -> responde com template pedindo texto

## 9. Fluxo de reservas

Coleta atual:

1. data
2. horario
3. quantidade de pessoas
4. observacoes
5. nome completo, se faltar
6. confirmacao

Ao confirmar:

- o modulo chama `createReservation()` do sistema existente
- reaproveita validacao e logs do modulo oficial
- grava `reservation_code` e `reservation_id` quando encontrados

Defaults usados para nao inventar campos extras:

- `reservationForType=self`
- `guestCountMode=exact`
- `hasChildren=false`
- `dietaryRestrictionType=none`
- `seatingPreference=no_preference`
- `isExistingCustomer=true`
- `notes` recebe prefixo `Via WhatsApp AI`

Se o grupo for maior que `12` pessoas, o fluxo abre handoff humano em vez de confirmar sozinho.

## 10. Fluxo de handoff

Abre handoff quando:

- o cliente pede atendente
- ha reclamacao
- ha lead de evento
- o fluxo fica ambiguo repetidamente
- a reserva vira grupo grande
- o gerente abre manualmente pelo CRM

O handoff grava:

- motivo
- prioridade
- status
- ator solicitante
- metadados de contexto

## 11. Endpoints adicionados

- `POST /api/internal/whatsapp/inbound`
- `POST /api/internal/whatsapp/status`
- `GET /api/internal/whatsapp/outbound/pull`
- `POST /api/internal/whatsapp/outbound/:id/ack`
- `POST /api/internal/whatsapp/outbound/:id/fail`
- `GET /api/internal/whatsapp/outbound/:id`
- `POST /api/internal/whatsapp/crm/sync`
- `GET /api/admin/whatsapp/overview`
- `GET /api/admin/whatsapp/conversations`
- `GET /api/admin/whatsapp/conversations/:id`
- `POST /api/admin/whatsapp/conversations/:id/handoff`
- `POST /api/admin/whatsapp/conversations/:id/reply`

## 12. Seguranca e observabilidade

- autenticacao interna por `x-internal-token`
- payload bruto armazenado nas mensagens e auditoria em `whatsapp_audit_logs`
- logging estruturado em JSON no Worker e no bridge local
- locks com reaproveitamento de comandos outbound presos em `processing`
- CSRF isento apenas para as rotas internas de WhatsApp
- status local do bridge via servidor HTTP de saude

## 13. Observacao operacional importante

Este repositorio esta em um volume do Google Drive.

Para evitar erro de instalacao e lock de arquivos:

- o script `scripts/run-baileys-runtime.ps1` sincroniza o bridge para `%LOCALAPPDATA%\\VillaCuiabar\\whatsapp-baileys-runtime`
- o `npm install` e a sessao do Baileys rodam nesse caminho NTFS local
- o codigo versionado continua em `services/whatsapp-baileys`

Tambem vale a observacao do proprio ecossistema Baileys:

- a persistencia atual usa armazenamento local multi-arquivo
- para operacao nesta maquina isso e aceitavel
- para uma topologia multi-instancia, o store de credenciais deve ser substituido por persistencia dedicada
