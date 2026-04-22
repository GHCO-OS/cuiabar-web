# Tecnologia, design e inspirações

Atualizado em: 2026-04-22

## Tecnologia

### Base de frontend

- React 18
- Vite 5
- TypeScript
- Tailwind CSS

### Base de backend

- Cloudflare Workers
- Cloudflare Pages
- Cloudflare D1
- Cloudflare KV
- Workers AI

### Apoios operacionais

- Node.js local para a ponte Baileys
- GitHub para versionamento e continuidade

## Decisões de arquitetura

- front e back compartilham o mesmo repositório;
- o site público continua leve e orientado a descoberta;
- módulos internos usam o Worker como núcleo de autenticação e regras;
- o transporte do WhatsApp fica fora do provedor oficial e opera por ponte local controlada.

## Direção de design

### Site público

- linguagem acolhedora;
- ênfase em presença, desejo, prova visual e clareza de ação;
- identidade visual coerente com restaurante, bar e operação de bairro.

### MeuCuiabar

- foco em legibilidade, rapidez e rotina;
- telas utilitárias, com baixa distração e prioridade para registro operacional.

### Cuiabar Atende

- foco em operação, leitura de fila, contexto de atendimento e eficiência.

## Inspirações e referências

As frentes do projeto já usaram, como repertório visual e estrutural:

- landing pages de food tech e delivery;
- interfaces de operação interna com leitura rápida;
- páginas locais orientadas a SEO e busca por intenção;
- experiências de boteco brasileiro, bar de bairro e operação regional.

Essas referências devem servir como direção, não como cópia.

## Critérios de qualidade visual

- mobile first;
- tipografia intencional;
- hierarquia clara;
- assets reais sempre que possível;
- páginas especiais com identidade própria;
- sem jargão interno exposto na interface pública.
