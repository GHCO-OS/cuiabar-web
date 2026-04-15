# Derivacoes e topologia Git

Atualizado em: 2026-04-15

## Objetivo

Formalizar o tronco do sistema e as derivacoes permanentes por linha de produto, para que futuras IAs e mantenedores saibam exatamente onde iniciar trabalho novo.

## Tronco oficial

O tronco do sistema e:

- `main`

Responsabilidade do `main`:

- representar o estado mais integrado e publicavel do `GHCO OS`
- concentrar apenas mudancas que ja passaram pela classificacao correta
- evitar receber blocos operacionais mistos sem triagem

## Branches-base oficiais

As derivacoes permanentes do sistema passam a ser:

### `ghco/core`

Destino de:

- entidades comuns
- autenticacao
- contratos internos
- integracoes compartilhadas
- arquitetura transversal

### `web/cuiabar-web`

Destino de:

- site publico
- blog
- cardapio
- SEO publico
- experiencia do cliente final

### `meucuiabar/operacao`

Destino de:

- controle interno
- qualidade
- HACCP
- checklists
- governanca operacional da casa

### `atende/omnicanal`

Destino de:

- WhatsApp com IA
- CRM
- reservas
- marketing
- fidelidade
- operacao omnichannel

## Mapeamento do legado `Super`

`Super` nao permanece como produto nem como familia oficial de branch.

Todo legado associado a `Super` deve ser classificado assim:

- controle interno e rotina da casa -> `meucuiabar/*`
- WhatsApp, CRM, reservas, marketing e fidelidade -> `atende/*`
- contratos, autenticacao, entidades compartilhadas e integracoes centrais -> `ghco/*`

## Regra de merge

Fluxo recomendado:

1. abrir o trabalho na branch da linha correta
2. estabilizar a mudanca no contexto daquela linha
3. subir para `main` apenas o que estiver integrado e coerente com o sistema-mãe

`main` nao deve ser usado como area de triagem inicial.

## Regra para novas IAs

Antes de começar:

1. ler `docs/14-NOMENCLATURA-E-LINHAS-DE-PRODUTO.md`
2. identificar a linha de produto
3. trabalhar na branch correspondente
4. so depois propor integracao em `main`

## Regra de nomenclatura

Padrao oficial:

- `ghco/*`
- `web/*`
- `meucuiabar/*`
- `atende/*`

Evitar:

- `super/*` como familia permanente
- `crm/*` quando o escopo real for `Cuiabar Atende`
- `site/*` quando o escopo real for `Cuiabar Web`

## Estado inicial adotado

No estado atual do repositorio, as branches-base oficiais criadas foram:

- `ghco/core`
- `web/cuiabar-web`
- `meucuiabar/operacao`
- `atende/omnicanal`
