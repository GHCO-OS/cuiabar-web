# Cuiabar Web - indice geral

Atualizado em: 2026-04-14

## Objetivo

Este diretorio centraliza a documentacao operacional do `GHCO OS`, para que o projeto possa ser aberto e operado em outros Codex, sem depender de memoria de conversa ou de um unico computador.

## Ordem recomendada de leitura

1. `../AGENTS.md`
2. `09-ORGANIZACAO-E-GOVERNANCA-IA.md`
3. `05-USO-EM-OUTRO-CODEX.md`
4. `01-ARQUITETURA-E-ROTAS.md`
5. `02-OPERACAO-E-DEPLOY.md`
6. `03-INTEGRACOES-E-CREDENCIAIS.md`
7. `04-STATUS-ATUAL-E-PENDENCIAS.md`
8. `06-WHATSAPP-AI-ARQUITETURA.md`
9. `07-WHATSAPP-AI-ENDPOINTS.md`
10. `08-WHATSAPP-AI-PAYLOADS.md`
11. `10-AMBIENTE-LOCAL-E-IDS.md`

## Arquivos centrais

- `01-ARQUITETURA-E-ROTAS.md`
  Mapa do projeto, stack, pastas e principais rotas.

- `02-OPERACAO-E-DEPLOY.md`
  Como rodar, buildar e publicar no Cloudflare.

- `03-INTEGRACOES-E-CREDENCIAIS.md`
  Inventario das integracoes e onde consultar credenciais.

- `04-STATUS-ATUAL-E-PENDENCIAS.md`
  O que esta ativo, o que foi descontinuado e o que ainda precisa de atencao.

- `05-USO-EM-OUTRO-CODEX.md`
  Passo a passo para abrir e continuar o projeto em outra maquina/instancia Codex.

- `09-ORGANIZACAO-E-GOVERNANCA-IA.md`
  Regra de organizacao do repositorio, mapa de busca e convencao obrigatoria para futuras IAs.

- `06-WHATSAPP-AI-ARQUITETURA.md`
  Arquitetura detalhada do atendimento por WhatsApp com IA, estrategia de integracao com o CRM atual, schema D1 e estrutura de pastas.

- `07-WHATSAPP-AI-ENDPOINTS.md`
  Contratos das rotas internas, administrativas e do bridge local do modulo de WhatsApp.

- `08-WHATSAPP-AI-PAYLOADS.md`
  Exemplos de payloads do bridge Baileys, sync CRM e acoes administrativas.

- `10-AMBIENTE-LOCAL-E-IDS.md`
  Inventario do PC operacional, bridge local, host IDs e referencias de runtime para suporte e continuidade.

- `14-NOMENCLATURA-E-LINHAS-DE-PRODUTO.md`
  Nome do sistema-mãe, linhas de produto, fronteiras funcionais e convencao de naming para branches.

- `15-DERIVACOES-E-TOPOLOGIA-GIT.md`
  Topologia oficial do Git, destino do legado `Super` e branches-base ativas do sistema.

- `16-CLASSIFICACAO-DE-MODULOS-E-LEGADO.md`
  Classificacao de pastas, modulos, migracoes e legados entre `GHCO OS`, `Cuiabar Web`, `MeuCuiabar` e `Cuiabar Atende`.

## Material complementar

Esses arquivos continuam validos como apoio:

- `README.md`
- `DEPLOY-CLOUDFLARE.md`
- `DEPLOY-RESERVAS-CLOUDFLARE.md`
- `README-RESERVAS.md`
- `RESERVAS-SETUP.md`
- `GOOGLE-CALENDAR-SETUP.md`
- `EMAIL-SETUP.md`
- `META-CAPI-SETUP.md`
- `SEO-SETUP.md`
- `SEO-TECHNICAL-PLAN.md`

## Credenciais

O inventario de chaves compartilhadas em conversa esta em:

- `../ACESSOS-CHAVES-PROJETO.md`

Esse arquivo contem segredos em texto puro e deve ser tratado como confidencial.

## Kit adicional para outras ferramentas

Tambem existe um pacote rapido em:

- `../KIT-PORTABILIDADE/00-LEIA-ME.md`

Esse conjunto foi montado para facilitar reutilizacao do projeto em outras ferramentas e outras instancias, incluindo copia da chave da conta de servico Google e snapshot das integracoes principais.
