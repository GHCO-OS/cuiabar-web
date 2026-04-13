# Status atual e pendências

Atualizado em: 2026-04-13

## Estado geral

O projeto está funcional como base única para:

- site principal
- burger
- blog
- CRM
- reservas
- integrações de marketing

## O que já foi melhorado nesta organização

- criada trilha oficial de leitura para novas IAs
- criada governança de manutenção em `AGENTS.md`
- criada documentação central em `docs/`
- guias antigos foram retirados da raiz e preservados em `docs/guias-legados/`
- artefatos de debug e QA saíram da raiz para `ops-artifacts/`
- arquivos gerados do Worker passaram a ser tratados como não editáveis
- GitHub privado adotado como base principal do repositório e da documentação técnica
- remoto oficial consolidado em `https://github.com/cuiabar/cuiabar-web.git`; `https://github.com/cuiabar/web.git` não deve ser usado
- migração para operação web-first iniciada e documentada em `docs/11-CODEX-WEB-MIGRACAO.md`
- secret `CLOUDFLARE_API_TOKEN` configurado no GitHub e workflow remoto validado com sucesso
- Search Console confirmado por API com acesso à propriedade `sc-domain:cuiabar.com`
- sitemap principal `https://cuiabar.com/sitemap.xml` submetido por API em 2026-04-11
- fluxo OAuth inicial do Google Business Profile preparado no Worker, aguardando autorizacao da conta gestora
- scaffold inicial de WhatsApp Intelligence criado em `worker/whatsapp-intelligence/` com webhook, Llama e trilha de auditoria em D1
- sprint 1 de estabilizacao do CRM executado:
  - `crm.cuiabar.com` agora deve responder com HTML reescrito como portal interno, sem metadados da home publica
  - `x-robots-tag` reforcado para o host do CRM
  - HTML do CRM marcado com `data-app="crm"` para isolar estilo base
  - recarga completa de sessao a cada troca de rota removida do `CrmApp`

## Pontos que ainda exigem acompanhamento

- consolidar a política entre GitHub como fonte principal e Drive como backup complementar
- revisar estratégia de secrets fora do repositório
- implantar Google Secret Manager como cofre-mãe oficial
- decidir separação lógica e operacional entre site, CRM, burger e blog
- reduzir acoplamento entre múltiplos módulos dentro da mesma branch
- revisar política de deploy para evitar confusão entre Pages e Worker
- limpar entradas antigas/erradas de sitemap no Search Console ligadas a rotas do `expresso.cuiabar.com`
- OAuth do Google Business Profile concluido; `refresh token` e credenciais atualizados no Worker
- pendencia atual do Google Business Profile: quota do projeto Google retorna `Requests per minute = 0`, bloqueando leitura da API ate ajuste no Google Cloud
- concluir operacao do gateway Baileys e autenticação interna entre webhook, DO e CRM
- evoluir pipeline de automacoes WhatsApp para integrar com o fluxo oficial de reservas sem bypass de validação

## Próximo passo estrutural recomendado

Separar o trabalho em frentes claras:

1. `site`
2. `crm`
3. `burger`
4. `blog`

Isso pode ser feito primeiro por branches/convenções, sem quebrar o repositório único.
