# Cuiabar Web - comecar por aqui

Se voce abriu esta pasta em outro Codex, comece por estes arquivos:

1. `AGENTS.md`
2. `docs/00-INDICE-GERAL.md`
3. `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
4. `docs/05-USO-EM-OUTRO-CODEX.md`
5. `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
6. `docs/10-AMBIENTE-LOCAL-E-IDS.md`
7. `ACESSOS-CHAVES-PROJETO.md`
8. `KIT-PORTABILIDADE/00-LEIA-ME.md`

Resumo rapido:
- Este projeto roda em React + Vite + TypeScript.
- A publicacao atual do site nao depende do GitHub para deploy.
- O repositorio GitHub oficial para versionamento e continuidade e `github.com/cuiabar/cuiabar-web`.
- O deploy principal e feito via Cloudflare com `wrangler pages deploy` e `wrangler deploy`.
- Existem modulos adicionais no mesmo repositorio, como reservas e CRM.
- A regra operacional para futuras IAs esta formalizada em `AGENTS.md`.

Pastas de referencia:
- `src/` interface principal do site
- `worker/` backend/worker do CRM e reservas
- `functions/` funcoes server-side do Pages
- `docs/` documentacao centralizada
- `KIT-PORTABILIDADE/` pacote rapido com APIs, chaves e arquivos reaproveitaveis para outras ferramentas

Observacao:
- Os arquivos antigos de setup e operacao continuam na raiz.
- O conjunto organizado e centralizado ficou dentro de `docs/`.
