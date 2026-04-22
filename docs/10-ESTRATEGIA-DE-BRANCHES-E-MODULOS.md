# Estrategia de branches e modulos

Atualizado em: 2026-04-21

## Objetivo

Melhorar organizacao sem quebrar a vantagem atual de manter tudo conectado no mesmo repositorio.

## Recomendacao

Nao separar em repositorios agora.

O caminho mais seguro e:

1. manter um monorepo unico
2. separar responsabilidades por pastas
3. organizar o trabalho por branches tematicas
4. so depois avaliar split real, se ainda fizer sentido

## Estrutura logica recomendada

### Sistema-mae

- `GHCO OS`
  Nucleo compartilhado do repositorio.

### Linha 1: Cuiabar Web

- home
- menu
- pedidos
- prorefeicao
- vagas
- links
- paginas locais e SEO

Area principal:

- `src/pages/`
- `src/sections/`
- `src/data/`

Branch sugerida:

- `web/*`

### Linha 2: MeuCuiabar

- controle interno
- qualidade
- HACCP
- rotinas da casa
- procedimentos operacionais

Area principal inicial:

- `src/crm/` para modulos internos administrativos
- `worker/` para regras e persistencia
- `migrations/` para tabelas de operacao

Branch sugerida:

- `meucuiabar/*`

### Linha 3: Cuiabar Atende

- CRM
- WhatsApp com IA
- integracoes
- reservas
- autenticacao
- campanhas
- marketing
- fidelidade
- tracking server-side

Area principal:

- `src/crm/`
- `src/reservations/`
- `worker/`
- `functions/`
- `migrations/`
- `services/whatsapp-baileys/`

Branch sugerida:

- `atende/*`

### Frente complementar: Burger Cuiabar

- landing
- assets
- SEO especifico
- experiencias e cardapio do burger

Area principal:

- `src/pages/BurguerCuiabarPage.tsx`
- `public/burguer/`

Branch sugerida:

- `burger/*`

### Frente complementar: editorial externo

- presenca em `blog.cuiabar.com`
- refinamento isolado fora do tronco principal
- compatibilidade mantida apenas por redirecionamento

Area principal:

- `src/pages/BlogSubdomainRedirectPage.tsx`

Branch sugerida:

- `blog/*`

## Branches de manutencao transversal

- `ghco/*`
  mudancas de core compartilhado, contratos centrais, entidades comuns e arquitetura do sistema-mae

- `infra/*`
  deploy, Cloudflare, build, CI, estrutura, segredos e ambiente

- `seo/*`
  quando a mudanca cruzar mais de uma superficie publica

- `assets/*`
  quando a mudanca for puramente de midia e organizacao visual

## Regra para futuras IAs

Se a tarefa for predominantemente:

- core compartilhado do sistema: atuar em `ghco/*`
- site publico, redirecionamentos legados e cardapio: atuar em `web/*`
- operacao interna da casa: atuar em `meucuiabar/*`
- atendimento, CRM, reservas e marketing: atuar em `atende/*`
- burger: atuar em `burger/*`
- editorial externo e experimentos do blog: atuar em `blog/*`
- infraestrutura ou organizacao: atuar em `infra/*`
