import type { NavItem } from './types';

export const siteConfig = {
  brandName: 'Villa Cuiabar | Campinas',
  brandShortName: 'Villa Cuiabar',
  siteOrigin: 'https://cuiabar.com',
  burgerNSmokeOrigin: 'https://burgersnsmoke.com',
  burgerNSmokePreviewPath: '/burger-n-smoke',
  prorefeicaoOrigin: 'https://prorefeicao.cuiabar.com',
  city: 'Campinas',
  neighborhood: 'Jardim Aurelia',
  corridor: 'Avenida John Boyd Dunlop',
  logoUrl: '/logo-villa-cuiabar.png',
  burgerNSmokeBrandName: "Burger N' Smoke",
  burgerNSmokeLogoUrl: '/burger-n-smoke/branding/smoke-mark.png',
  burgerNSmokeWordmarkUrl: '/burger-n-smoke/branding/smoke-wordmark.png',
  burgerNSmokeInstagramUrl: 'https://instagram.com/burgernsmoke',
  burguerLogoUrl: '/burger-n-smoke/branding/smoke-mark.png',
  whatsappNumber: '551933058878',
  whatsappMessage: 'Olá, tudo bem?',
  burgerNSmokeWhatsappMessage: "Olá! Quero pedir no Burger N' Smoke.",
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbAcHLXFSAsxCt6lly0a',
  commercialWhatsappNumber: '551933058878',
  commercialWhatsappMessage: 'Olá! Quero falar com o time do ProRefeição.',
  reservationPortalUrl: 'https://reservas.cuiabar.com',
  reservationPageUrl: '/reservas',
  experienceHubPageUrl: '/',
  presencialPageUrl: '/presencial',
  expressoPageUrl: '/expresso',
  calendarEmbedUrl:
    'https://calendar.google.com/calendar/embed?src=c_cb44b5a5c24377de0d7ec7a6bb840f4ed667ce355c9b4611a4b9d9e1ff7e5782%40group.calendar.google.com&ctz=America%2FSao_Paulo',
  orderLinks: {
    direct: 'https://expresso.cuiabar.com',
    ifood:
      'https://www.ifood.com.br/delivery/campinas-sp/villa-cuiabar--executivos--pratos-do-dia-jardim-aurelia/1af0e396-a7c8-46e1-b1a5-dd06486bb4ad',
    food99: 'https://oia.99app.com/dlp9/C94oJv?area=BR',
    whatsapp: 'https://wa.me/551933058878?text=Ol%C3%A1%2C%20tudo%20bem%3F',
  },
  burgerNSmokeOrderLinks: {
    direct: 'https://burgersnsmoke.com',
    ifood:
      'https://www.ifood.com.br/delivery/campinas-sp/burgers-n-smoke--smash--combos-vila-proost-de-souza/14734c59-f45a-41e2-80b0-f1914971f6e1',
    instagram: 'https://instagram.com/burgernsmoke',
    whatsapp:
      'https://wa.me/551933058878?text=Ol%C3%A1!%20Quero%20pedir%20no%20Burger%20N%27%20Smoke.',
  },
  burguerOrderLinks: {
    direct: 'https://burgersnsmoke.com',
    ifood:
      'https://www.ifood.com.br/delivery/campinas-sp/burgers-n-smoke--smash--combos-vila-proost-de-souza/14734c59-f45a-41e2-80b0-f1914971f6e1',
    food99: 'https://burgersnsmoke.com',
  },
  menuPageUrl: '/menu',
  prorefeicaoPageUrl: 'https://prorefeicao.cuiabar.com',
  geo: {
    latitude: '-22.9010251',
    longitude: '-47.0967600',
  },
  socialLinks: {
    instagram: 'https://instagram.com/cuiabar',
    facebook: 'https://facebook.com/villacuiabar',
  },
  address: 'Av. Brigadeiro Rafael Tobias de Aguiar, 1121 - Jardim Aurélia - Campinas/SP',
  openingHours: [
    'Delivery: todos os dias, das 11h às 14:30',
    'Presencial: quinta, das 11h às 14:30',
    'Presencial: sexta, das 11h às 14:30 e das 18h às 23h',
    'Presencial: sábado, das 11h às 15h e das 18h às 23h',
  ],
  inPersonOpeningHours: [
    { day: 'Quinta-feira', opens: '11:00', closes: '14:30' },
    { day: 'Sexta-feira', opens: '11:00', closes: '14:30' },
    { day: 'Sexta-feira', opens: '18:00', closes: '23:00' },
    { day: 'Sabado', opens: '11:00', closes: '15:00' },
    { day: 'Sabado', opens: '18:00', closes: '23:00' },
  ],
  nearbyLandmarks: [
    'Enxuto Dunlop',
    'Atacadao Dunlop',
    'eixo da John Boyd Dunlop',
  ],
  email: 'cuiabar@cuiabar.net',
  phone: '(19) 3305-8878',
};

export const navItems: NavItem[] = [
  { label: 'Experiências', to: siteConfig.experienceHubPageUrl },
  { label: 'Presencial', to: siteConfig.presencialPageUrl },
  { label: 'Menu', to: '/menu' },
  { label: 'Expresso', to: siteConfig.expressoPageUrl, variant: 'highlight' },
  { label: 'Espetaria', to: '/espetaria' },
  { label: 'ProRefeição', to: siteConfig.prorefeicaoPageUrl, variant: 'outline', external: true },
  { label: 'Reservas', to: '/reservas' },
  { label: 'Vagas', to: '/vagas' },
];
