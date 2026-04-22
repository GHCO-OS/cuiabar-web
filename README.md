# GHCO OS

Sistema digital integrado do grupo Cuiabar.

## Visão geral

O repositório concentra três linhas de produto que compartilham a mesma base operacional:

- `Cuiabar Web`
  Site público, páginas institucionais, cardápio, discovery orgânico e ativos de marca.
- `MeuCuiabar`
  Operação interna, qualidade, HACCP, checklists e rotinas da casa.
- `Cuiabar Atende`
  CRM, reservas, atendimento por WhatsApp com IA, marketing e fidelização.

## Propósito do sistema

O projeto existe para unificar presença digital, operação interna e relacionamento com o cliente em uma arquitetura única, com publicação em Cloudflare e versionamento central em GitHub.

## Estrutura principal

- `src/`
  Aplicações de frontend, páginas públicas, superfícies internas e módulos de produto.
- `worker/`
  Backend principal em Cloudflare Workers, autenticação, reservas, CRM, integrações e rotas internas.
- `functions/`
  Pages Functions e middleware do site público.
- `public/`
  Assets estáticos versionados.
- `migrations/`
  Evolução de schema no D1.
- `services/`
  Serviços auxiliares locais, com destaque para a ponte Baileys do WhatsApp.
- `docs/`
  Documentação oficial do projeto.

## Leitura inicial

1. `START-AQUI.md`
2. `AGENTS.md`
3. `docs/00-INDICE-GERAL.md`
4. `docs/18-VISAO-GERAL-E-PROPOSITO.md`
5. `docs/19-TECNOLOGIA-DESIGN-E-INSPIRACOES.md`

## Documentação oficial

- `docs/01-ARQUITETURA-E-ROTAS.md`
- `docs/02-OPERACAO-E-DEPLOY.md`
- `docs/03-INTEGRACOES-E-CREDENCIAIS.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `docs/14-NOMENCLATURA-E-LINHAS-DE-PRODUTO.md`
- `docs/15-DERIVACOES-E-TOPOLOGIA-GIT.md`
- `docs/16-CLASSIFICACAO-DE-MODULOS-E-LEGADO.md`
- `docs/17-MAPA-DE-MANUTENCAO-E-BRANCHES.md`
- `docs/18-VISAO-GERAL-E-PROPOSITO.md`
- `docs/19-TECNOLOGIA-DESIGN-E-INSPIRACOES.md`

## Operação atual

- Publicação do site público: Cloudflare Pages
- Publicação do backend: Cloudflare Workers
- Banco principal: Cloudflare D1
- Sessão e cache operacional: Cloudflare KV
- Versionamento: GitHub em `GHCO-OS/cuiabar-web`

## Regras de organização

- `docs/` é a fonte oficial de documentação.
- `docs/runbooks/` concentra guias operacionais específicos.
- `docs/guias-legados/` preserva histórico técnico que não deve voltar para a raiz.
- `KIT-PORTABILIDADE/` é apoio externo, não fonte primária do sistema.
- `ops-artifacts/`, `dist/`, `.ssr/` e compilados gerados não são origem de manutenção.
