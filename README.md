# GHCO OS

Monorepo principal do ecossistema digital do Cuiabar.

## Linhas de produto

- `Cuiabar Web`
  site publico, blog, cardapio e discovery organico
- `MeuCuiabar`
  controle interno, qualidade, HACCP e rotinas da casa
- `Cuiabar Atende`
  CRM, reservas, WhatsApp com IA, marketing e fidelidade

## Comece por aqui

1. `START-AQUI.md`
2. `AGENTS.md`
3. `docs/00-INDICE-GERAL.md`
4. `docs/17-MAPA-DE-MANUTENCAO-E-BRANCHES.md`

## Fonte oficial de documentacao

- `docs/`

Documentos mais importantes:

- `docs/01-ARQUITETURA-E-ROTAS.md`
- `docs/02-OPERACAO-E-DEPLOY.md`
- `docs/03-INTEGRACOES-E-CREDENCIAIS.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `docs/14-NOMENCLATURA-E-LINHAS-DE-PRODUTO.md`
- `docs/15-DERIVACOES-E-TOPOLOGIA-GIT.md`
- `docs/16-CLASSIFICACAO-DE-MODULOS-E-LEGADO.md`
- `docs/17-MAPA-DE-MANUTENCAO-E-BRANCHES.md`

## Estrutura minima

- `src/`
  frontend e superficies de produto
- `worker/`
  backend principal em Cloudflare Workers
- `functions/`
  Pages Functions e middleware
- `services/`
  bridges e runtimes locais auxiliares
- `migrations/`
  historico de schema
- `scripts/`
  operacao e automacao
- `public/`
  assets versionados

## Branches

- `main`
- `ghco/*`
- `web/*`
- `meucuiabar/*`
- `atende/*`
- `burger/*`
- `blog/*`
- `infra/*`

## Regras de organizacao

- `docs/` e a documentacao oficial
- `docs/guias-legados/` guarda apoio historico
- `KIT-PORTABILIDADE/` e apoio externo, nao fonte principal
- `ops-artifacts/`, `dist/`, `.ssr/` e compilados gerados nao sao origem de manutencao
