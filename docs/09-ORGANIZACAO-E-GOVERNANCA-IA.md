# Organizacao e governanca para manutencao por IA

Atualizado em: 2026-04-13

## Diagnostico atual

O projeto ja tem boa base documental, mas ainda sofre com quatro fontes de confusao:

1. a raiz concentra arquivos demais
2. existem documentos importantes espalhados entre `docs/`, raiz e `KIT-PORTABILIDADE/`
3. segredos e inventarios sensiveis convivem perto da documentacao operacional
4. existem artefatos gerados e evidencias tecnicas que podem ser confundidos com fonte de edicao

## Leitura do repositorio em camadas

Para qualquer IA, o projeto deve ser entendido em cinco camadas:

### Camada 1: orientacao

- `START-AQUI.md`
- `AGENTS.md`

Esses arquivos explicam por onde comecar e qual regra seguir.

### Camada 2: documentacao oficial

- `docs/00-INDICE-GERAL.md`
- `docs/01-ARQUITETURA-E-ROTAS.md`
- `docs/02-OPERACAO-E-DEPLOY.md`
- `docs/03-INTEGRACOES-E-CREDENCIAIS.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`
- `docs/05-USO-EM-OUTRO-CODEX.md`
- `docs/06-08-*` para WhatsApp AI
- `docs/10-AMBIENTE-LOCAL-E-IDS.md` para host, bridge e inventario operacional

Essa e a trilha oficial de entendimento do sistema.

### Camada 3: codigo-fonte editavel

- `src/`
- `worker/`
- `functions/`
- `scripts/`
- `services/`
- `migrations/`
- `public/`

Aqui e onde as mudancas devem acontecer.

### Camada 4: apoio de portabilidade

- `KIT-PORTABILIDADE/`

Serve para reaproveitamento externo e continuidade entre maquinas, mas nao substitui `docs/`.

### Camada 5: artefatos e saidas

- `dist/`
- `.ssr/`
- `.ssr-blog/`
- `ops-artifacts/`

Esses itens nao devem ser usados como fonte de projeto.

## Regra de ouro

Toda modificacao precisa responder a tres perguntas:

1. onde esta o arquivo-fonte correto?
2. qual documento oficial precisa ser atualizado por causa dessa mudanca?
3. isso e permanente ou e apenas artefato temporario?

Se a resposta da terceira pergunta for “temporario”, o arquivo nao deve virar referencia principal.

## Mapa inteligente de busca

Quando uma IA precisar atuar, use esta logica:

### Se a mudanca for visual ou de conteudo do site

Pesquisar em:

- `src/pages/`
- `src/sections/`
- `src/components/`
- `src/data/`
- `public/`

### Se a mudanca for CRM, automacao, integracoes ou backend

Pesquisar em:

- `worker/`
- `functions/`
- `migrations/`
- `services/`

### Se a mudanca for SEO, analytics, pixel ou integracao de marketing

Pesquisar em:

- `src/lib/`
- `src/components/AnalyticsTracker.tsx`
- `functions/api/`
- `index.html`
- `src/data/seo.ts`
- `src/data/seoRoutes.json`
- `docs/03-INTEGRACOES-E-CREDENCIAIS.md`

### Se a mudanca for deploy, dominio ou Cloudflare

Pesquisar em:

- `wrangler.jsonc`
- `functions/`
- `worker/`
- `public/_redirects`
- `docs/02-OPERACAO-E-DEPLOY.md`

### Se a mudanca for regra de negocio do restaurante

Pesquisar em:

- `src/data/siteConfig.ts`
- `src/data/content.ts`
- `src/data/menu.ts`
- `src/data/menu.json`
- `src/data/liveMusicPrograms.ts`

### Se a mudanca for runtime local do WhatsApp ou identidade da maquina

Pesquisar em:

- `services/whatsapp-baileys/`
- `scripts/`
- `docs/10-AMBIENTE-LOCAL-E-IDS.md`

## Convencao para futuras IAs

Toda IA deve seguir estas regras:

### 1. Ler antes de editar

Nao comece por tentativa e erro. Leia:

- `START-AQUI.md`
- `AGENTS.md`
- `docs/04-STATUS-ATUAL-E-PENDENCIAS.md`

### 2. Editar o lugar certo

- pagina em `src/pages/`
- asset em `public/<area>/`
- regra server-side em `worker/` ou `functions/`
- configuracao operacional em `docs/`

### 3. Nao espalhar contexto importante em conversa

Se a mudanca altera funcionamento real, registre no documento certo.

### 4. Nao tratar segredo como documentacao publica

Tokens, chaves e contas devem ficar restritos ao inventario confidencial.

### 5. Nao consolidar gambiarra como padrao

Se algo foi criado como teste, prova, debug ou QA, deve ficar claramente separado.

## Organizacao alvo da raiz

A raiz deve funcionar apenas como hall de entrada. O ideal e manter nela:

- `README.md`
- `START-AQUI.md`
- `AGENTS.md`
- configs de build/deploy
- poucos documentos realmente globais

## Situacao atual da raiz

Hoje a raiz ainda concentra:

- arquivos antigos de setup
- inventario de credenciais
- docs historicas
- configs legitimas

Isso nao precisa ser movido agora, mas precisa obedecer esta hierarquia:

1. `AGENTS.md` e `START-AQUI.md` orientam
2. `docs/` documenta
3. raiz antiga serve de apoio e historico

## Recomendacao de manutencao futura

Sprint de organizacao sugerida, sem quebra:

1. manter `docs/` como centro oficial
2. preservar `KIT-PORTABILIDADE/` apenas como pacote de continuidade externa
3. reduzir novos documentos soltos na raiz
4. revisar o que e segredo versionado e mover para cofre/secret manager quando possivel
5. separar melhor material de QA e debug em `ops-artifacts/`
6. revisar a necessidade de manter `.js` e `.d.ts` gerados dentro de `worker/`

## Regras de fechamento de tarefa

Ao terminar uma mudanca, a IA deve sempre informar:

- quais arquivos-fonte foram alterados
- se houve alteracao de deploy
- qual documento foi atualizado
- se existe algum risco residual

## Resultado esperado

Se essa governanca for seguida, qualquer IA nova consegue:

- encontrar rapidamente o ponto certo de edicao
- entender o estado atual do projeto
- evitar mexer em artefatos errados
- manter continuidade sem depender de memoria de chat
