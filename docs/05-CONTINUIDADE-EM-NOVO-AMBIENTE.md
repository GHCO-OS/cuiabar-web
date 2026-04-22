# Continuidade em novo ambiente

Atualizado em: 2026-04-22

## Objetivo

Permitir que o projeto seja aberto e continuado em outra máquina ou em outra sessão de trabalho sem depender de memória de conversa.

## Passo a passo

1. Abrir ou clonar o repositório oficial:

```txt
https://github.com/GHCO-OS/cuiabar-web
```

2. Ler nesta ordem:

- `START-AQUI.md`
- `docs/00-INDICE-GERAL.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `docs/18-VISAO-GERAL-E-PROPOSITO.md`
- `docs/19-TECNOLOGIA-DESIGN-E-INSPIRACOES.md`

3. Escolher a branch certa antes de editar:

- `main` para leitura do tronco atual
- `ghco/*` para infraestrutura e núcleo compartilhado
- `web/*` para `Cuiabar Web`
- `meucuiabar/*` para `MeuCuiabar`
- `atende/*` para `Cuiabar Atende`

4. Validar ambiente:

```bash
npm install
npm run lint
npm run build
```

5. Se precisar publicar:

```bash
npm run deploy:pages
npm run deploy:worker
```

6. Se o deploy falhar por autenticação:

- validar o acesso ao Cloudflare;
- conferir permissões de Pages, Workers, KV e D1;
- conferir secrets e bindings do ambiente remoto.

## O que um novo ambiente precisa saber

- O projeto usa React, Vite e TypeScript no frontend.
- O deploy operacional é feito em Cloudflare via Wrangler.
- O GitHub é a base oficial de código e documentação.
- O Google Drive é apenas apoio e backup.

## O que não fazer sem checar

- não apagar arquivos de deploy sem confirmar uso;
- não assumir que credenciais antigas continuam válidas;
- não reativar módulos experimentais sem validar o status atual.
