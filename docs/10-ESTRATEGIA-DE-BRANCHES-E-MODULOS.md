# Estratégia de branches e módulos

Atualizado em: 2026-04-15

## Objetivo

Melhorar organização sem quebrar a vantagem atual de manter tudo conectado no mesmo repositório.

## Recomendação

Não separar em repositórios agora.

O caminho mais seguro é:

1. manter um monorepo único
2. separar responsabilidades por pastas
3. organizar o trabalho por branches temáticas
4. só depois avaliar split real, se ainda fizer sentido

## Estrutura lógica recomendada

### Sistema-mãe

- `GHCO OS`
  Nucleo compartilhado do repositório.

### Linha 1: Cuiabar Web

- home
- menu
- pedidos
- prorefeição
- vagas
- links
- páginas locais/SEO

Área principal:

- `src/pages/`
- `src/sections/`
- `src/data/`

Branch sugerida:

- `web/*`

Branch-base criada:

- `web/cuiabar-web`

### Linha 2: MeuCuiabar

- controle interno
- qualidade
- HACCP
- rotinas da casa
- procedimentos operacionais

Área principal inicial:

- `src/crm/` para modulos internos administrativos
- `worker/` para regras e persistencia
- `migrations/` para tabelas de operacao

Branch sugerida:

- `meucuiabar/*`

Branch-base criada:

- `meucuiabar/operacao`

Observacao:

- `MeuCuiabar` nao deve nascer como copia do CRM comercial;
- ele deve reutilizar o core do sistema e expor apenas a camada interna da casa.

### Linha 3: Cuiabar Atende

- CRM
- WhatsApp com IA
- integrações
- reservas
- autenticação
- campanhas
- marketing
- fidelidade
- tracking server-side

Área principal:

- `src/crm/`
- `src/reservations/`
- `worker/`
- `functions/`
- `migrations/`
- `services/whatsapp-baileys/`

Branch sugerida:

- `atende/*`

Branch-base criada:

- `atende/omnicanal`

### Frente complementar: Burger Cuiabar

- landing
- assets
- SEO específico
- experiências e cardápio do burger

Área principal:

- `src/pages/BurguerCuiabarPage.tsx`
- `src/burger/`
- `public/burguer/`

Branch sugerida:

- `burger/*`

### Frente complementar: blog

- app editorial
- sincronização CMS
- publicação
- layout e SEO editorial

Área principal:

- `src/blog/`
- `blog-options/`
- scripts editoriais

Branch sugerida:

- `blog/*`

## Branches de manutenção transversal

- `ghco/*`
  mudanças de core compartilhado, contratos centrais, entidades comuns e arquitetura do sistema-mãe

Branch-base criada:

- `ghco/core`

- `infra/*`
  deploy, Cloudflare, build, CI, estrutura, segredos e ambiente

- `seo/*`
  quando a mudança cruzar `Cuiabar Web`, blog e burger ao mesmo tempo

- `assets/*`
  quando a mudança for puramente de mídia/organização visual

## Regra para futuras IAs

Se a tarefa for predominantemente:

- core compartilhado do sistema: atuar em `ghco/*`
- site público, blog e cardápio: atuar em `web/*`
- operação interna da casa: atuar em `meucuiabar/*`
- atendimento, CRM, reservas e marketing: atuar em `atende/*`
- burger: atuar em `burger/*`
- blog/editorial: atuar em `blog/*`
- infraestrutura ou organização: atuar em `infra/*`

## Por que isso é melhor agora

Porque o projeto ainda compartilha:

- build chain
- deploy
- assets
- SEO base
- integrações de analytics
- parte do backend

Separar em repositórios agora aumentaria custo operacional e risco de divergência.

## Momento certo para split real

Só vale considerar repositórios separados quando houver:

- deploys independentes por módulo
- owners diferentes por frente
- pipelines independentes
- redução real de acoplamento entre `src/`, `worker/` e `functions/`

## Regra para o legado `Super`

`Super` nao e mais nome de produto nem familia de branch permanente.

Uso correto daqui para frente:

- material de WhatsApp, CRM, reservas, marketing e fidelidade vai para `atende/*`
- material de controle interno, qualidade, HACCP e rotina da casa vai para `meucuiabar/*`
- contratos compartilhados e entidades comuns vao para `ghco/*`
- somente o que for estavel e integrado deve subir para `main`
