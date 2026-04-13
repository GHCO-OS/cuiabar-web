# CRM Cuiabar - Status Operacional

Atualizado em: 2026-04-07

## Situacao atual

- CRM reativado no dominio `https://crm.cuiabar.com`
- versao Cloudflare ativa: `65250d82-b28e-4816-a662-80669cd54189`
- autenticacao do painel: Google Sign-In
- e-mails autorizados para acesso: `leonardo@cuiabar.net` e `cuiabar@cuiabar.net`
- disparo de e-mail: Gmail API com OAuth 2.0
- remetente padrao: `Cuiabar Restaurantes | Campinas`
- banco principal: Cloudflare D1
- runtime: Cloudflare Workers
- integracao com Zoho CRM: removida do CRM

## Modulos existentes

- login administrativo com Google
- contatos, listas, segmentos e templates
- campanhas e fila de envio
- envio via Gmail API
- tracking de cliques por redirect
- unsubscribe funcional
- auditoria e metricas operacionais
- captura de interacoes publicas do site
- ficha de contato com abertura e edicao no painel

## Rotas e dominios principais

- CRM: `https://crm.cuiabar.com`
- Reservas: `https://reservas.cuiabar.com`
- Editor do blog: `https://blog.cuiabar.com/editor`

## Operacao

- deploy principal: `npm run deploy:worker`
- validacao de tipos: `npm run lint`
- migrations remotas D1: `npm run d1:migrate:remote`

## Observacoes de continuidade

- a documentacao operacional do projeto deve continuar sendo centralizada nesta pasta do Drive
- novas decisoes tecnicas, credenciais de integracao e status de publicacao devem ser registradas aqui
- proximos trabalhos provaveis: Meta server-side, Google Ads server-side e relatorios de atribuicao

## Modulos com melhorias recentes (2026-04-07)

### Fase A — Nomenclatura consistente
- Criado `src/crm/labels.ts` com mapas de traducao para status de contato, campanha, destinatario e papeis
- Todas as paginas do CRM agora exibem labels em portugues ("Ativo", "Rascunho", "Gerente", etc.)
- Botoes e campos de formulario traduzidos: "Enviar teste", "Nome do remetente", "E-mail remetente", "Responder para"

### Fase B — Configuracoes estruturadas
- Pagina Configuracoes (`SettingsPage`) refatorada: campos numericos no lugar de textareas JSON para controles de envio
- Checkboxes visuais para politicas de entregabilidade (SPF, DKIM, DMARC, List-Unsubscribe, opt-in)
- Checklist de entregabilidade exibido como cards com badge ok/pendente
- Backend `PUT /api/settings/sending` agora valida ranges (batchSize 1-100, ratePerMinute 1-500, etc.)

### Fase C — Layout e UX
- Icones SVG inline em todos os itens do menu lateral
- Componentes novos: `ConfirmModal`, `LoadingSpinner`, `Pagination` em `components.tsx`
- Modais de confirmacao antes de "Enviar agora" e "Processar lote" nas campanhas
- Loading spinners em: Dashboard, Listas, Segmentos, Usuarios, Campanhas, Auditoria
- Empty states em tabelas vazias de: Listas, Segmentos, Usuarios, Campanhas, Auditoria

### Fase D — Disparador aprimorado
- Retry inteligente: falhas `rate_limited` e erros transientes mantem status `queued` ate o limite de tentativas (configuravel via `retryLimit`)
- Pausa entre envios no loop do processador (`send_pause_ms` respeitado por destinatario)
- Endpoint `GET /api/campaigns/:id/progress` para polling leve de progresso de envio
- Barra de progresso em tempo real na pagina Campanhas para campanhas com status `sending` (polling a cada 5s)
- "Disparo rapido" no Dashboard: selecionar template + lista/segmento e disparar campanha em 2 cliques

### Fase E — Paginacao
- Backend: paginacao em `GET /api/contacts`, `GET /api/campaigns`, `GET /api/audit-logs` (parametros `page` e `pageSize`)
- Frontend: componente `<Pagination>` integrado em Contatos, Campanhas e Auditoria

### Limpeza — Zoho removido
- Removidos `worker/services/zoho/` (zohoAuth, zohoCrm, zohoContacts — .ts, .js, .d.ts)
- Variaveis Zoho removidas de `worker/types.ts` (Env) e `wrangler.jsonc`

---

## Proximo deploy

Para publicar todas as melhorias em producao:

```bash
npm run deploy:worker
```

Nao ha migrations novas — todas as mudancas sao em logica de aplicacao.

---

## Proximos trabalhos sugeridos

- Validar DNS de SPF/DKIM/DMARC automaticamente a partir do painel
- Editor visual de segmentos (sem JSON manual)
- Pagina dedicada de detalhe de campanha com rota propria (`/campaigns/:id`)
- Leitura assistida de bounces via caixa Gmail autorizada
- Mapeamento automatico de colunas CSV na importacao
- Seeds/fixtures para ambiente de homologacao

---

## Ultimo marco registrado

- 2026-04-07: CRM e disparador reativados em producao, com confirmacao publica do endpoint `/api/auth/config`
- 2026-04-07: camada inicial de conectores server-side de Meta e Google Ads publicada na versao `ed08d5fa-033e-4698-a1cd-0bb41099001a`
- 2026-04-07: disparador rapido publicado como primeira funcao do dashboard
- 2026-04-07: rastreador de abertura publicado na versao `92ded417-f31b-4bed-a948-469b7b937d3f`
- 2026-04-07: integracao com Zoho removida do CRM publicado
- 2026-04-07: polimento completo do CRM — labels PT, configuracoes estruturadas, icones, modais, paginacao, retry inteligente, progresso de envio e disparo rapido no dashboard
