import type { FaqItem, Feature, MenuHighlight, Testimonial } from './types';

export const differentiators: Feature[] = [
  { title: 'Espaço familiar', description: 'Ambiente pensado para almoço em família e encontros descontraídos.', icon: '👨‍👩‍👧‍👦' },
  { title: 'Brinquedo para crianças', description: 'Mais conforto para quem vai com os pequenos.', icon: '🛝' },
  { title: 'Bar completo', description: 'Drinks, cervejas e acompanhamentos para qualquer ocasião.', icon: '🍹' },
  { title: 'Preço justo', description: 'Pratos bem servidos com custo-benefício honesto.', icon: '💸' },
  { title: 'Espaço aberto', description: 'Clima leve para curtir o presencial com mais conforto.', icon: '🌿' },
  { title: 'Atendimento de primeira', description: 'Equipe próxima, rápida e preparada para receber bem.', icon: '⭐' },
];

export const menuHighlights: MenuHighlight[] = [
  {
    name: 'Bife Chorizo',
    category: 'Corte nobre',
    description: 'Contrafilé alto e marmorizado, servido com mandioca frita da casa.',
    price: 'R$ 56,00',
    image: 'https://static.wixstatic.com/media/f30eee_089ca416fa0f43868ce21b3a0abf46d8~mv2.png',
  },
  {
    name: 'Costela Cuiabar',
    category: 'Especial da casa',
    description: 'Costela bovina sem osso, assada no bafo e servida com mandioca frita.',
    price: 'R$ 41,00',
    image: 'https://static.wixstatic.com/media/f30eee_f034abb51d4d498eb80fcd74901bafbd~mv2.png',
  },
  {
    name: 'Pancetinha',
    category: 'Petisco',
    description: 'Torresmo de rolo carnudo, assado e depois frito, com fritas e barbecue.',
    price: 'R$ 42,00',
    image: 'https://static.wixstatic.com/media/f30eee_b9aa5997e2aa4a0bac11814ce1e355f9~mv2.png',
  },
  {
    name: 'Parmignon',
    category: 'Parmegiana',
    description: 'Parmegiana de mignon com arroz e fritas.',
    price: 'R$ 59,00',
    image: 'https://static.wixstatic.com/media/f30eee_725e61a60a9a4e8e91766fb2975411a2~mv2.png',
  },
];

export const reservationFaqs: FaqItem[] = [
  {
    question: 'Como faço minha reserva?',
    answer: 'As reservas sao feitas no portal oficial reservas.cuiabar.com, com data, horario, quantidade de pessoas e preferencias em um unico fluxo.',
  },
  {
    question: 'Quando tem música ao vivo?',
    answer: 'O presencial com música acontece às sextas, sábados e domingos.',
  },
  {
    question: 'Quais dias têm atendimento noturno?',
    answer: 'O delivery à noite funciona de quarta a sábado.',
  },
];

export const testimonials: Testimonial[] = [];

export const proBenefits = [
  'Almoços e jantares frescos com padrão para equipes, hóspedes, visitantes e pacientes',
  'Atendimento para escritórios, fábricas, obras, clínicas, hospitais e casas de repouso',
  'Operação contínua com qualidade, variedade e organização todos os dias',
  'Pontualidade, previsibilidade e pagamento facilitado para a rotina da empresa',
];
