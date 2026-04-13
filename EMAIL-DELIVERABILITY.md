# Entregabilidade de E-mail

## O que este sistema deixa claro

- Click tracking e suportado e confiavel.
- Open tracking nao e metrica central e pode ser enganosa.
- Inbox placement nao e garantido.
- Entregabilidade e resultado de reputacao, autenticacao e qualidade de lista.
- O sistema deve ser usado apenas com contatos que consentiram receber mensagens.

## Checklist minimo

## Autenticacao do dominio

- SPF configurado
- DKIM configurado
- DMARC configurado
- remetente consistente com o dominio usado

## Lista e consentimento

- opt-in real
- unsubscribe funcional
- exclusao imediata de descadastrados
- supressao de bounced
- supressao de complained

## Operacao

- volume gradual
- batches pequenos no inicio
- limite por minuto
- pausa entre lotes quando necessario
- testes antes do envio real
- segmentacao cuidadosa

## Higiene de conteudo

- assunto claro e honesto
- HTML leve
- versao text/plain sempre presente
- sem scripts
- sem CSS excentrico que quebre clientes de e-mail

## O que o sistema implementa

- `List-Unsubscribe`
- `List-Unsubscribe-Post`
- endpoint publico de unsubscribe
- fila com batch size e rate per minute
- suppressions
- status de contato
- logs de envio, clique, bounce observado e auditoria

## Boas praticas operacionais

1. Comece com pequenas listas de alta qualidade.
2. Monitore falhas e descadastros logo nos primeiros disparos.
3. Nao compre listas.
4. Nao reaproveite contatos sem historico claro de consentimento.
5. Ajuste ritmo e segmentacao antes de escalar volume.

## Sobre "taxa de recepcao"

Nao use uma metrica falsa de "entregue na caixa de entrada". O sistema separa:

- envios aceitos pela API
- falhas sincronas de envio
- bounces observados
- cliques
- descadastros

Se quiser um indicador observavel, use `delivery_observed_rate` apenas como aproximacao operacional baseada em eventos reais e nunca como garantia de inbox.
