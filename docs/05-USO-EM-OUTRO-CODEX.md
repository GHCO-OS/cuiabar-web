# Uso em outro Codex

Atualizado em: 2026-04-13

## Objetivo

Permitir continuidade entre sessões e entre IAs sem depender de histórico de conversa.

## Passo a passo

1. abrir a pasta do projeto
2. confirmar que o remoto oficial continua sendo `origin -> https://github.com/cuiabar/cuiabar-web.git`
3. ler:
   - `START-AQUI.md`
   - `AGENTS.md`
   - `docs/00-INDICE-GERAL.md`
   - `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
4. identificar a área correta da tarefa
5. editar apenas arquivo-fonte
6. atualizar o documento correto se houver mudança estrutural

## Regra de remoto único

- este projeto deve operar com um único repositório GitHub oficial:
  - `https://github.com/cuiabar/cuiabar-web.git`
- não criar fluxo paralelo em outro repositório com o mesmo código
- se aparecer referência a `https://github.com/cuiabar/web.git`, tratar como referência legada/inválida até ordem explícita em contrário

## Validação mínima antes de publicar

```bash
npm install
npm run build
```

Se a tarefa envolver Worker:

```bash
npm run build:worker
```

## Onde procurar por tipo de demanda

- visual e conteúdo: `src/`
- assets: `public/`
- CRM/backend: `worker/`
- Pages middleware: `functions/`
- deploy: `wrangler.jsonc`, `package.json`, `docs/02-OPERACAO-E-DEPLOY.md`
