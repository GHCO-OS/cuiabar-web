# Kit de portabilidade do projeto Cuiabar

Atualizado em: 2026-04-07

## Objetivo

Esta pasta foi criada para deixar o projeto mais facil de reutilizar em outras ferramentas, outras maquinas e outros agentes.

## O que tem aqui

- `01-PROJETO-NO-DRIVE.md`
  Confirmacao de que o projeto-base e a documentacao principal estao no Drive.

- `MASTER-SISTEMA-WEB.json`
  Arquivo mestre com visao consolidada do sistema web inteiro: site, blog, CRM, reservas, rotas, logins, deploy, docs e integracoes.

- `02-APIS-E-CHAVES.md`
  Inventario consolidado de APIs, integracoes e chaves acessiveis no ambiente e no projeto.

- `03-CLOUDFLARE-SECRETS-NOMES.json`
  Lista dos nomes das secrets configuradas no Worker Cloudflare.

- `04-WORKER-VARS-NAO-SENSIVEIS.json`
  Snapshot das variaveis nao sensiveis publicadas em `wrangler.jsonc`.

- `google-service-account-meucuiabar.json`
  Copia local da chave da conta de servico Google que estava fora do Drive.

## Observacao pratica

- O inventario original de chaves compartilhadas em conversa continua em `../ACESSOS-CHAVES-PROJETO.md`.
- Esta pasta nao substitui a documentacao central em `../docs/`.
- Parte das secrets do Cloudflare existe no ambiente remoto, mas seus valores nao sao exportaveis pelo `wrangler secret list`; por isso os nomes foram preservados aqui e os valores acessiveis ficaram documentados em `02-APIS-E-CHAVES.md`.
