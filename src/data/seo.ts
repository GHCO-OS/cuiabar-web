import seoRoutesJson from './seoRoutes.json';
import { burgerComboItems, burgerItems, burgerMenu } from './burgerMenu';

type SchemaBlock = Record<string, unknown>;

export type RouteSeo = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  changefreq?: string;
  priority?: string;
  keywords?: string[];
  robots?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  includeInSitemap?: boolean;
  schema?: SchemaBlock[];
};

type SeoRoutesJson = {
  siteOrigin: string;
  defaultImage: string;
  routes: Record<string, RouteSeo>;
};

const seoRoutes = seoRoutesJson as SeoRoutesJson;

const BURGER_CANONICAL_URL = 'https://burger.cuiabar.com/';

const normalizePrice = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : undefined;
};

const buildOffer = (priceLabel: string | undefined) => {
  const price = normalizePrice(priceLabel);

  return price
    ? {
        '@type': 'Offer',
        price,
        priceCurrency: 'BRL',
      }
    : undefined;
};

const buildBurgerRouteSchema = (): SchemaBlock[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Cardapio Burger Cuiabar',
    description: 'Landing oficial do Burger Cuiabar com burgers, favoritos da casa e combos para pedir agora.',
    url: BURGER_CANONICAL_URL,
    inLanguage: 'pt-BR',
    hasMenuSection: [
      {
        '@type': 'MenuSection',
        name: 'Burgers',
        hasMenuItem: burgerItems.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: `${item.description} ${item.tagline}`.trim(),
          image: `https://cuiabar.com${item.image}`,
          offers: buildOffer(item.storePrice),
        })),
      },
      {
        '@type': 'MenuSection',
        name: 'Combos',
        hasMenuItem: burgerComboItems.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: `${item.description} ${item.note}`.trim(),
          offers: buildOffer(item.storePrice),
        })),
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Onde eu peco Burger Cuiabar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O pedido pode ser feito no site oficial burger.cuiabar.com, com apoio adicional no iFood e na 99Food.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quais sao os burgers mais pedidos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Cuiabar, O Brabo e O Colosso aparecem como destaques para quem quer decidir rapido.',
        },
      },
      {
        '@type': 'Question',
        name: 'Tem combo pronto?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. Combo Raiz e Combo Cuiabar permitem escolher frita ou bebida lata. O Combo Brabo ja vem com frita e bebida.',
        },
      },
      {
        '@type': 'Question',
        name: 'Qual burger escolher se eu quiser frango?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Crocante e a opcao direta para frango empanado. O Insano entrega versao dupla com honey mustard para quem quer uma escolha mais intensa.',
        },
      },
    ],
  },
];

const enrichBurgerRoute = (route: RouteSeo | undefined): RouteSeo | undefined => {
  if (!route) {
    return route;
  }

  return {
    ...route,
    image: burgerMenu.ogImage,
    imageAlt: burgerMenu.ogImageAlt,
    schema: buildBurgerRouteSchema(),
  };
};

seoRoutes.routes['/burguer'] = enrichBurgerRoute(seoRoutes.routes['/burguer']) as RouteSeo;

for (const aliasPath of ['/burger', '/burguer-cuiabar']) {
  if (seoRoutes.routes[aliasPath]) {
    seoRoutes.routes[aliasPath] = {
      ...seoRoutes.routes[aliasPath],
      image: burgerMenu.ogImage,
      imageAlt: burgerMenu.ogImageAlt,
    };
  }
}

export const siteOrigin = seoRoutes.siteOrigin;
export const defaultSeoImage = seoRoutes.defaultImage;
export const routeSeo = seoRoutes.routes;

export const getRouteSeo = (path: string): RouteSeo =>
  routeSeo[path] ?? routeSeo['/'];
