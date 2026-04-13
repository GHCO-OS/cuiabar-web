# Guia operacional para IAs e mantenedores

Este arquivo define a regra de trabalho para qualquer IA ou pessoa que abrir este repositório.

## Objetivo

Manter o projeto Cuiabar editável, rastreável e previsível, sem depender de memória de conversa.

## Ordem obrigatória de leitura

Antes de qualquer alteração relevante, leia nesta ordem:

1. `START-AQUI.md`
2. `AGENTS.md`
3. `docs/00-INDICE-GERAL.md`
4. `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
5. `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
6. `docs/03-INTEGRACOES-E-CREDENCIAIS.md`

Se a tarefa envolver deploy, Cloudflare, CRM ou WhatsApp AI, continue com os documentos específicos indicados no índice.

## Fonte de verdade por assunto

- Estrutura do sistema e rotas: `docs/01-ARQUITETURA-E-ROTAS.md`
- Operação e deploy: `docs/02-OPERACAO-E-DEPLOY.md`
- Integrações e nomes de credenciais: `docs/03-INTEGRACOES-E-CREDENCIAIS.md`
- Estado atual e pendências: `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- Organização do repositório e regra para IA: `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`
- Bootstrap para nova máquina/novo agente: `docs/05-USO-EM-OUTRO-CODEX.md`
- Ambiente local, host IDs e bridge local: `docs/10-AMBIENTE-LOCAL-E-IDS.md`
- Segredos históricos e inventário confidencial: `ACESSOS-CHAVES-PROJETO.md`

## O que cada pasta significa

- `src/`
  Frontend principal do site, páginas públicas, blog em React e apps renderizados no browser.

- `worker/`
  Backend principal em Cloudflare Workers, CRM, reservas, integrações server-side e módulo WhatsApp AI.

- `functions/`
  Pages Functions e middleware do Cloudflare Pages. Use para comportamento ligado ao site estático hospedado no Pages.

- `public/`
  Assets estáticos versionados. Cada funcionalidade deve ter sua própria subpasta.

- `migrations/`
  Migrações D1. Toda mudança de schema entra aqui com prefixo incremental.

- `scripts/`
  Scripts operacionais, geração de conteúdo, QA e rotinas de suporte.

- `services/`
  Serviços locais auxiliares. Hoje o principal é a ponte Baileys do WhatsApp.

- `docs/`
  Documentação oficial do projeto. Esta é a área mais importante para continuidade entre IAs.

- `KIT-PORTABILIDADE/`
  Pacote de reaproveitamento externo. Não é a documentação primária do sistema.

- `ops-artifacts/`
  Evidências, prints, saídas de QA e debug. Não usar como fonte de verdade funcional.

## Pastas e arquivos que nao devem ser tratados como origem de edição

- `dist/`
- `.ssr/`
- `.ssr-blog/`
- `node_modules/`
- `ops-artifacts/`
- arquivos `.js` e `.d.ts` gerados ao lado dos `.ts` no `worker/`, salvo quando houver motivo explícito

Regra prática:

- edite o arquivo-fonte
- gere o artefato apenas quando necessário
- nunca use artefato compilado como base de manutenção

## Regra de colocação de novos arquivos

Se for criar algo novo, siga este mapa:

- nova página pública: `src/pages/`
- nova seção reutilizável do site: `src/sections/`
- novo componente genérico: `src/components/`
- novos dados/config públicos: `src/data/`
- nova lógica utilitária de frontend: `src/lib/` ou `src/hooks/`
- nova rota do Worker: `worker/`
- nova integração server-side: `worker/services/`
- nova regra de reservas: `worker/reservations/`
- nova lógica de WhatsApp AI: `worker/whatsapp/`
- novo asset visual: `public/<area>/`
- nova documentação: `docs/`
- nova automação/script operacional: `scripts/`
- nova migração de banco: `migrations/`

## Regra de atualização documental após mudanças

Toda IA deve atualizar a documentação mínima conforme o tipo de mudança:

- mudança de rota, página ou arquitetura:
  atualizar `docs/01-ARQUITETURA-E-ROTAS.md`

- mudança de deploy, publicação, domínio ou operação:
  atualizar `docs/02-OPERACAO-E-DEPLOY.md`

- mudança de integração, pixel, API, segredo, provedor ou nome de variável:
  atualizar `docs/03-INTEGRACOES-E-CREDENCIAIS.md`

- mudança relevante concluída, decisão de produto, ativação/desativação de módulo ou novo risco:
  atualizar `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`

- mudança de regra de organização, fluxo entre agentes ou convenção de manutenção:
  atualizar `docs/09-ORGANIZACAO-E-GOVERNANCA-IA.md`

- mudança de máquina operacional, runtime local ou identidade do bridge:
  atualizar `docs/10-AMBIENTE-LOCAL-E-IDS.md`

## Política de segredos

- não criar novos arquivos com segredos em texto puro no repositório sem necessidade operacional explícita
- não duplicar token em múltiplos documentos
- preferir documentar nome da secret e local de armazenamento
- considerar `ACESSOS-CHAVES-PROJETO.md` e parte do `KIT-PORTABILIDADE/` como material confidencial
- se um segredo for rotacionado, atualizar só o inventário necessário e evitar espalhar o valor

## Fluxo padrão de trabalho para IA

1. Ler os arquivos obrigatórios.
2. Identificar a área correta do projeto.
3. Editar somente arquivos-fonte.
4. Validar localmente o que for pertinente.
5. Publicar apenas se solicitado.
6. Atualizar a documentação mínima obrigatória.
7. Informar no fechamento:
   - o que mudou
   - quais arquivos foram alterados
   - o que ficou pendente

## Regra de naming

- documentos de operação e governança em `docs/` usam prefixo numérico quando fizerem parte da trilha principal
- assets devem ficar dentro da subpasta da funcionalidade
- novos arquivos técnicos devem ter nome descritivo e estável, sem “final”, “novo”, “corrigido”, “v2”

## O que evitar

- mover arquivos em massa sem necessidade concreta
- deixar documentação estrutural só em conversa
- misturar material temporário com material-fonte
- tratar `KIT-PORTABILIDADE/` como se fosse a documentação principal
- tratar arquivos gerados como fonte oficial do sistema

## Meta de organização

Este repositório deve funcionar assim:

- `docs/` responde “como o sistema funciona”
- `src/`, `worker/` e `functions/` respondem “onde editar”
- `public/` responde “onde ficam os assets”
- `scripts/` responde “como operar”
- `ACESSOS-CHAVES-PROJETO.md` responde “quais acessos existem”, com acesso restrito
