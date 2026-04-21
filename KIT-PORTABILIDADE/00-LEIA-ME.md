# Kit de portabilidade do projeto Cuiabar

Atualizado em: 2026-04-07

## Objetivo

Esta pasta foi criada para deixar o projeto mais facil de reutilizar em outras ferramentas, outras maquinas e outros agentes.

## O que tem aqui

- `snapshots/`
  Material historico e snapshots exportados para continuidade externa.

- `confidencial/`
  Material sensivel ou operacional que nao deve ser usado como documentacao principal.

- `snapshots/01-PROJETO-NO-DRIVE.md`
  Nota historica do antigo espelho no Drive.

- `snapshots/MASTER-SISTEMA-WEB.json`
  Arquivo mestre com visao consolidada do sistema web inteiro.

- `confidencial/02-APIS-E-CHAVES.md`
  Inventario consolidado de APIs, integracoes e chaves acessiveis no ambiente e no projeto.

- `snapshots/03-CLOUDFLARE-SECRETS-NOMES.json`
  Lista dos nomes das secrets configuradas no Worker Cloudflare.

- `snapshots/04-WORKER-VARS-NAO-SENSIVEIS.json`
  Snapshot das variaveis nao sensiveis publicadas em `wrangler.jsonc`.

- `confidencial/google-service-account-meucuiabar.json`
  Copia local da chave da conta de servico Google que estava fora do Drive.

## Observacao pratica

- O inventario original de chaves compartilhadas em conversa continua em `../ACESSOS-CHAVES-PROJETO.md`, quando esse arquivo existir nesta copia local.
- Esta pasta nao substitui a documentacao central em `../docs/`.
- Parte das secrets do Cloudflare existe no ambiente remoto, mas seus valores nao sao exportaveis pelo `wrangler secret list`; por isso os nomes foram preservados em `snapshots/` e os valores acessiveis ficaram documentados em `confidencial/02-APIS-E-CHAVES.md`.
