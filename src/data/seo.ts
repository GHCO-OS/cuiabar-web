import seoRoutesJson from './seoRoutes.json';
import { burgerNSmokeBrand, burgerNSmokeCombos, burgerNSmokeMenuItems } from './burgerNSmoke';

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
  siteName?: string;
  twitterHandle?: string;
};

type SeoRoutesJson = {
  siteOrigin: string;
  defaultImage: string;
  routes: Record<string, RouteSeo>;
};

const seoRoutes = seoRoutesJson as SeoRoutesJson;

const normalizeCanonicalPath = (path: string) => {
  if (path === '/') {
    return '/';
  }

  return `${path.replace(/\/+$/, '')}/`;
};

const buildCanonicalUrl = (routePath: string, route: RouteSeo) =>
  route.canonicalUrl ?? `${siteOrigin}${normalizeCanonicalPath(route.canonicalPath ?? routePath)}`;

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

const buildBurgerNSmokeRouteSchema = (): SchemaBlock[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: "Cardapio Burger N' Smoke",
    description: "Landing oficial do Burger N' Smoke com burgers autorais, combos e leitura pensada para pedido rapido.",
    url: `${burgerNSmokeBrand.origin}/`,
    inLanguage: 'pt-BR',
    hasMenuSection: [
      {
        '@type': 'MenuSection',
        name: 'Burgers',
        hasMenuItem: burgerNSmokeMenuItems.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: `${item.category}. ${item.description}`.trim(),
          image: `${burgerNSmokeBrand.origin}${item.image}`,
          offers: buildOffer(item.price),
        })),
      },
      {
        '@type': 'MenuSection',
        name: 'Combos',
        hasMenuItem: burgerNSmokeCombos.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: `${item.note}. ${item.description}`.trim(),
          offers: buildOffer(item.price),
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
        name: "Onde eu peco no Burger N' Smoke?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "O caminho mais direto e chamar no WhatsApp oficial ou seguir para os canais da marca a partir do proprio site.",
        },
      },
      {
        '@type': 'Question',
        name: 'Quais sao os burgers mais pedidos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Bruto, O Defumado e O Colosso puxam a frente para quem quer resolver a fome sem pensar demais.',
        },
      },
      {
        '@type': 'Question',
        name: 'Tem retirada no local?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A operacao trabalha com retirada e delivery noturno em Campinas.',
        },
      },
      {
        '@type': 'Question',
        name: 'A marca tambem aparece em apps?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A ideia da landing e organizar a entrada da marca e depois apontar para os canais de pedido ativos.',
        },
      },
    ],
  },
];

const enrichBurgerNSmokeRoute = (route: RouteSeo | undefined): RouteSeo | undefined => {
  if (!route) {
    return route;
  }

  return {
    ...route,
    image: burgerNSmokeBrand.ogImage,
    imageAlt: burgerNSmokeBrand.ogImageAlt,
    siteName: "Burger N' Smoke",
    twitterHandle: '@burgernsmoke',
    schema: buildBurgerNSmokeRouteSchema(),
  };
};

if (seoRoutes.routes['/burger-n-smoke']) {
  seoRoutes.routes['/burger-n-smoke'] = enrichBurgerNSmokeRoute(seoRoutes.routes['/burger-n-smoke']) as RouteSeo;
}

export const siteOrigin = seoRoutes.siteOrigin;
export const defaultSeoImage = seoRoutes.defaultImage;
export const routeSeo = seoRoutes.routes;

export const getRouteSeo = (path: string): RouteSeo => {
  const route = routeSeo[path] ?? routeSeo['/'];

  return {
    ...route,
    canonicalUrl: buildCanonicalUrl(path, route),
  };
};
