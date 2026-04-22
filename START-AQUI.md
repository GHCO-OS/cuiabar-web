# GHCO OS — ponto de entrada

Se esta cópia do projeto foi aberta em um novo ambiente, comece por estes arquivos:

1. `AGENTS.md`
2. `docs/00-INDICE-GERAL.md`
3. `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
4. `docs/05-CONTINUIDADE-EM-NOVO-AMBIENTE.md`
5. `docs/18-VISAO-GERAL-E-PROPOSITO.md`
6. `docs/19-TECNOLOGIA-DESIGN-E-INSPIRACOES.md`
7. `docs/10-AMBIENTE-LOCAL-E-IDS.md`

## Resumo rápido

- O repositório abriga `Cuiabar Web`, `MeuCuiabar` e `Cuiabar Atende`.
- A publicação operacional continua sendo feita em Cloudflare.
- O GitHub é a base oficial de versionamento e documentação.
- O site público e os portais internos compartilham a mesma fundação técnica.

## Pastas de referência

- `src/`
  Interfaces e aplicações de produto.
- `worker/`
  Backend principal.
- `functions/`
  Middleware do site público.
- `docs/`
  Documentação oficial.
- `docs/runbooks/`
  Guias operacionais específicos.

## Observação

- A documentação do sistema deve permanecer em `docs/`.
- Materiais confidenciais, quando existirem localmente, devem permanecer fora da trilha pública de documentação.
