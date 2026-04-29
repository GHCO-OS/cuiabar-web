import { siteConfig } from './siteConfig';

export type LocalGuideKey = 'jardimAureliaRestaurant' | 'enxutoDunlop';

type LocalGuideCta = {
  label: string;
  href: string;
  external?: boolean;
};

type LocalGuideHighlight = {
  title: string;
  description: string;
};

type LocalGuideFaq = {
  question: string;
  answer: string;
};

export type LocalGuide = {
  key: LocalGuideKey;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  highlights: LocalGuideHighlight[];
  visitSignals: string[];
  faqs: LocalGuideFaq[];
  ctas: LocalGuideCta[];
};

export const localGuides: Record<LocalGuideKey, LocalGuide> = {
  jardimAureliaRestaurant: {
    key: 'jardimAureliaRestaurant',
    path: '/restaurante-jardim-aurelia-campinas',
    eyebrow: 'Jardim Aurelia',
    title: 'Restaurante no Jardim Aurelia para almoco, jantar e reservas em Campinas',
    description:
      `Para quem procura um restaurante no Jardim Aurelia, com acesso facil pelo eixo da ${siteConfig.corridor}, o Villa Cuiabar combina comida brasileira, bar completo, ambiente familiar e reservas online em um so lugar.`,
    chips: ['Restaurante', 'Jardim Aurelia', 'Espaco kids', 'Reservas online'],
    highlights: [
      {
        title: 'Almoco e jantar com mais previsibilidade',
        description: 'A casa atende quem quer almocar bem durante a semana e voltar para o presencial em noites selecionadas com reserva organizada.',
      },
      {
        title: 'Espaco familiar com conforto para criancas',
        description: 'O ambiente foi pensado para encontros em familia, com brinquedo para criancas e uma operacao que recebe bem adultos e pequenos.',
      },
      {
        title: 'Bar, porcoes e clima de encontro',
        description: 'Bar completo, petiscos, pratos da casa e estrutura para aniversarios, grupos e encontros casuais.',
      },
    ],
    visitSignals: [
      'Base forte para quem mora ou circula pelo Jardim Aurelia.',
      `Boa opcao para quem vem da ${siteConfig.corridor} e quer parar sem desviar muito da regiao.`,
      'Reserva oficial em reservas.cuiabar.com para mesas, grupos e comemoracoes.',
    ],
    faqs: [
      {
        question: 'O Villa Cuiabar fica no Jardim Aurelia?',
        answer: 'Sim. A casa fica na Avenida Brigadeiro Rafael Tobias de Aguiar, em Campinas, com acesso facil para quem circula pelo Jardim Aurelia e pelo corredor da Dunlop.',
      },
      {
        question: 'Tem espaco para ir com criancas?',
        answer: 'Temos ambiente familiar com brinquedo para criancas, o que ajuda bastante em almocos de fim de semana, aniversarios e encontros em familia.',
      },
      {
        question: 'Como fazer reserva?',
        answer: 'A reserva oficial e feita em reservas.cuiabar.com, com data, horario, quantidade de pessoas e observacoes em um fluxo unico.',
      },
    ],
    ctas: [
      { label: 'Reservar online', href: siteConfig.reservationPortalUrl, external: true },
      { label: 'Ver menu da casa', href: '/menu' },
    ],
  },
  enxutoDunlop: {
    key: 'enxutoDunlop',
    path: '/restaurante-perto-do-enxuto-dunlop',
    eyebrow: 'Dunlop',
    title: 'Restaurante perto do Enxuto Dunlop e do Atacadao Dunlop em Campinas',
    description:
      `Quem procura restaurante perto do Enxuto Dunlop, do Atacadao Dunlop ou em todo o eixo da ${siteConfig.corridor} encontra no Villa Cuiabar uma parada forte para almoco, jantar, delivery e reservas em Campinas.`,
    chips: ['Enxuto Dunlop', 'Atacadao Dunlop', 'John Boyd Dunlop', 'Almoco e reservas'],
    highlights: [
      {
        title: 'Parada pratica para quem circula pela Dunlop',
        description: 'A localizacao funciona bem para quem esta no corredor comercial da John Boyd Dunlop e quer comer bem sem se afastar muito da rota.',
      },
      {
        title: 'Opcao para almoco, jantar e encontro',
        description: 'A casa atende desde refeicao de rotina ate encontro com amigos, familia ou clientes que estejam pela regiao.',
      },
      {
        title: 'Canais oficiais para continuar a jornada',
        description: 'Se o melhor momento for depois, o mesmo ecossistema ja oferece menu, reservas online e pedido direto no site.',
      },
    ],
    visitSignals: [
      'Boa referencia para quem sai do Enxuto Dunlop e procura restaurante nas proximidades.',
      'Tambem atende bem quem vem do Atacadao Dunlop, da John Boyd Dunlop ou de bairros vizinhos.',
      'Menu completo da casa, burgers, delivery e reservas em um so dominio oficial.',
    ],
    faqs: [
      {
        question: 'O Villa Cuiabar fica perto do Enxuto Dunlop?',
        answer: 'Sim. A casa esta em uma regiao de acesso pratico para quem circula pelo eixo da John Boyd Dunlop e procura refeicao perto do Enxuto Dunlop.',
      },
      {
        question: 'Tambem vale para quem esta perto do Atacadao Dunlop?',
        answer: 'Sim. A localizacao atende bem quem esta na area comercial da Dunlop e quer uma opcao de almoco, jantar ou reserva em Campinas.',
      },
      {
        question: 'Da para reservar antes de chegar?',
        answer: 'Sim. O portal oficial reservas.cuiabar.com permite organizar a chegada antes de sair da Dunlop ou do bairro.',
      },
    ],
    ctas: [
      { label: 'Ver como reservar', href: '/reservas' },
      { label: 'Pedir no site', href: siteConfig.orderLinks.direct, external: true },
    ],
  },
};

export const localGuideList = Object.values(localGuides);
