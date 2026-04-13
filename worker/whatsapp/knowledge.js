import { DEFAULT_BUSINESS_CONTEXT } from './constants';
export const buildBusinessContext = (env) => ({
    ...DEFAULT_BUSINESS_CONTEXT,
    menuUrl: env.WHATSAPP_MENU_URL?.trim() || DEFAULT_BUSINESS_CONTEXT.menuUrl,
    burgerUrl: env.WHATSAPP_BURGER_URL?.trim() || DEFAULT_BUSINESS_CONTEXT.burgerUrl,
    deliveryUrl: env.WHATSAPP_DELIVERY_URL?.trim() || DEFAULT_BUSINESS_CONTEXT.deliveryUrl,
    expressoUrl: env.WHATSAPP_EXPRESSO_URL?.trim() || DEFAULT_BUSINESS_CONTEXT.expressoUrl,
    whatsappChannelUrl: env.WHATSAPP_CHANNEL_URL?.trim() || DEFAULT_BUSINESS_CONTEXT.whatsappChannelUrl,
    address: env.WHATSAPP_ADDRESS?.trim() || DEFAULT_BUSINESS_CONTEXT.address,
    hoursSummary: env.WHATSAPP_HOURS_SUMMARY?.trim() || DEFAULT_BUSINESS_CONTEXT.hoursSummary,
    phoneDisplay: env.WHATSAPP_PHONE_DISPLAY?.trim() || DEFAULT_BUSINESS_CONTEXT.phoneDisplay,
});
export const buildKnowledgeBullets = (context) => [
    `${context.restaurantName} atende em Campinas com foco comercial e conversao sem enrolacao.`,
    `Melhor condicao para pedido direto costuma ser ${context.expressoUrl}.`,
    `Cardapio principal: ${context.menuUrl}.`,
    `Pagina de hamburguer: ${context.burgerUrl}.`,
    `Delivery institucional: ${context.deliveryUrl}.`,
    `Endereco oficial: ${context.address}.`,
    `Horarios resumidos: ${context.hoursSummary}.`,
    `Canal do WhatsApp para novidades: ${context.whatsappChannelUrl}.`,
    `Nao invente informacoes que nao estejam nesses fatos.`,
];
export const KNOWLEDGE_BY_INTENT = {
    menu: (context) => [`Menu oficial: ${context.menuUrl}`],
    delivery: (context) => [`Pedido direto com melhor condicao: ${context.expressoUrl}`, `Pagina de delivery: ${context.deliveryUrl}`],
    hamburguer: (context) => [`Hamburguer e burger: ${context.burgerUrl}`],
    marmita: (context) => [`Marmitas e executivos: ${context.expressoUrl}`],
    reserva: (context) => [`Reservas guiadas por WhatsApp com horarios: ${context.reservationTimeOptions.join(', ')}`],
    evento: (context) => [`Eventos precisam de atendimento humano para garantir contexto comercial e disponibilidade.`],
    localizacao: (context) => [`Endereco: ${context.address}`],
    horarios: (context) => [`Horarios: ${context.hoursSummary}`],
    reclamacao: () => [`Reclamacoes precisam de acolhimento, registro e handoff rapido para humano.`],
    humano: () => [`Quando o cliente pedir uma pessoa, abrir handoff em vez de insistir na automacao.`],
};
