import type { BusinessContext, WhatsAppIntent } from './types';

export const DEFAULT_WHATSAPP_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const CLASSIFICATION_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const CHANNEL_INVITE_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;
export const LARGE_PARTY_GUEST_THRESHOLD = 12;
export const HUMAN_HANDOFF_FALLBACK_THRESHOLD = 2;

export const ALLOWED_INTENTS: WhatsAppIntent[] = [
  'menu',
  'delivery',
  'hamburguer',
  'marmita',
  'reserva',
  'evento',
  'localizacao',
  'horarios',
  'reclamacao',
  'humano',
  'unknown',
];

export const DEFAULT_BUSINESS_CONTEXT: BusinessContext = {
  restaurantName: 'Villa Cuiabar',
  restaurantShortName: 'Villa Cuiabar',
  tone: 'comercial, natural, objetivo e util',
  menuUrl: 'https://cuiabar.com/menu',
  burgerUrl: 'https://cuiabar.com/burguer',
  deliveryUrl: 'https://cuiabar.com/delivery',
  expressoUrl: 'https://expresso.cuiabar.com',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbAcHLXFSAsxCt6lly0a',
  address: 'Av. Brigadeiro Rafael Tobias de Aguiar, 1121 - Jardim Aurelia - Campinas/SP',
  hoursSummary:
    'Delivery no almoco todos os dias, delivery a noite de quarta a sabado e atendimento presencial com musica ao vivo as sextas, sabados e domingos.',
  phoneDisplay: '(19) 3305-8878',
  reservationTimeOptions: ['11:00', '12:00', '13:00', '18:00', '19:00', '20:00'],
};

export const INTENT_KEYWORDS: Record<WhatsAppIntent, string[]> = {
  menu: ['menu', 'cardapio', 'cardápio', 'pratos', 'comidas'],
  delivery: ['delivery', 'entrega', 'pedir', 'pedido', 'ifood', 'ifood', '99food', '99 food', 'expresso'],
  hamburguer: ['hamburguer', 'hambúrguer', 'burger', 'smash', 'lanche'],
  marmita: ['marmita', 'executivo', 'prato do dia', 'prorefeicao', 'pro refeicao', 'quentinha'],
  reserva: ['reserva', 'reservar', 'mesa', 'agendar', 'agendamento'],
  evento: ['evento', 'aniversario', 'aniversário', 'confraternizacao', 'confraternização', 'comemoracao', 'comemoração'],
  localizacao: ['onde fica', 'endereco', 'endereço', 'localizacao', 'localização', 'mapa', 'como chegar'],
  horarios: ['horario', 'horário', 'funciona', 'aberto', 'fecha', 'abre'],
  reclamacao: ['reclamacao', 'reclamação', 'problema', 'atraso', 'ruim', 'horrivel', 'horrível', 'cancelar pedido'],
  humano: ['humano', 'atendente', 'pessoa', 'falar com alguem', 'falar com alguém', 'gerente', 'suporte'],
  unknown: [],
};

export const HUMAN_HANDOFF_KEYWORDS = new Set(INTENT_KEYWORDS.humano);
export const COMPLAINT_KEYWORDS = new Set(INTENT_KEYWORDS.reclamacao);
