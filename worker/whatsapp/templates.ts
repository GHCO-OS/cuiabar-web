import type { BusinessContext } from './types';

const maybeInviteChannel = (context: BusinessContext, enabled: boolean) =>
  enabled ? ` Se quiser acompanhar novidades e promoções, segue nosso canal: ${context.whatsappChannelUrl}` : '';

export const menuTemplate = (context: BusinessContext, inviteChannel: boolean) =>
  `Posso te ajudar por aqui. O cardapio oficial do ${context.restaurantShortName} esta em ${context.menuUrl}.${maybeInviteChannel(context, inviteChannel)}`;

export const deliveryTemplate = (context: BusinessContext, inviteChannel: boolean) =>
  `Para pedir com a melhor condicao direto com a casa, o melhor caminho costuma ser ${context.expressoUrl}. Se quiser comparar, nossa pagina de delivery esta em ${context.deliveryUrl}.${maybeInviteChannel(context, inviteChannel)}`;

export const burgerTemplate = (context: BusinessContext, inviteChannel: boolean) =>
  `Se a ideia e burguer, te direciono direto para ${context.burgerUrl}. Se preferir, eu tambem posso te passar o link de pedido com melhor condicao.${maybeInviteChannel(context, inviteChannel)}`;

export const marmitaTemplate = (context: BusinessContext, inviteChannel: boolean) =>
  `Para marmita e executivos, o pedido direto fica em ${context.expressoUrl}. Esse costuma ser o canal com melhor condicao.${maybeInviteChannel(context, inviteChannel)}`;

export const locationTemplate = (context: BusinessContext) =>
  `${context.restaurantShortName} fica em ${context.address}. Se quiser, eu tambem posso te ajudar com horario ou reserva.`;

export const hoursTemplate = (context: BusinessContext) =>
  `Nosso resumo de horarios hoje e: ${context.hoursSummary} Se quiser, eu posso te orientar para reserva ou pedido direto.`;

export const reservationStartTemplate = (context: BusinessContext) =>
  `Vamos cuidar da sua reserva no ${context.restaurantShortName}. Me envie primeiro a data desejada no formato dia/mes ou ano-mes-dia. Horarios disponiveis: ${context.reservationTimeOptions.join(', ')}.`;

export const reservationAskTimeTemplate = (context: BusinessContext, dateLabel: string) =>
  `Perfeito. Para ${dateLabel}, os horarios disponiveis sao ${context.reservationTimeOptions.join(', ')}. Qual horario voce prefere?`;

export const reservationAskGuestCountTemplate = () => 'Quantas pessoas serao na reserva?';

export const reservationAskNotesTemplate = () =>
  'Tem alguma observacao importante para a mesa? Se nao tiver, pode responder "sem observacoes".';

export const reservationAskNameTemplate = () => 'Para confirmar a reserva, me passe nome e sobrenome do responsavel.';

export const reservationConfirmTemplate = (summary: string) =>
  `Confirma estes dados da reserva?\n${summary}\n\nSe estiver tudo certo, responda "confirmar". Se quiser ajustar, me diga o que precisa mudar.`;

export const reservationSuccessTemplate = (reservationCode: string, dateLabel: string, time: string, guestCount: number) =>
  `Reserva recebida com sucesso. Codigo: ${reservationCode}. Ficou para ${dateLabel} as ${time}, para ${guestCount} pessoa(s). Se precisar ajustar algo, me chame por aqui.`;

export const handoffTemplate = () =>
  'Vou encaminhar agora para o atendimento humano para cuidar disso com mais contexto. Se puder, me mande qualquer detalhe extra que ajude o time a acelerar o retorno.';

export const complaintTemplate = () =>
  'Sinto muito pela experiencia. Vou registrar agora e encaminhar para atendimento humano com prioridade. Se puder, me diga em uma frase o principal problema para agilizar o retorno.';

export const eventTemplate = () =>
  'Eventos e comemoracoes merecem um atendimento dedicado para fecharmos do jeito certo. Vou abrir seu atendimento com o time humano. Se quiser adiantar, me envie data, quantidade de pessoas e tipo do evento.';

export const unknownTemplate = () =>
  'Quero te ajudar sem te passar informacao errada. Posso te direcionar para pedido, cardapio, reserva, horario, localizacao ou chamar um atendente humano.';

export const unsupportedMessageTemplate = () =>
  'Consigo te atender melhor por texto neste canal. Se puder, me envie sua mensagem em texto que eu sigo daqui.';
