import seoRoutesJson from './seoRoutes.json';
import { burgerNSmokeBrand, burgerNSmokeCombos, burgerNSmokeFaq, burgerNSmokeMenuItems } from './burgerNSmoke';
import { burgerNSmokeSeoPageList } from './burgerNSmokeSeoPages';

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

const burgerNSmokeSeoPaths = new Set<string>(['/burger-n-smoke', ...burgerNSmokeSeoPageList.map((page) => page.path)]);

const buildBurgerNSmokeMenuSchema = (url: string): SchemaBlock => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: "Cardapio Burger N' Smoke",
  description: "Cardapio do Burger N' Smoke com burgers autorais, smash burger e combos para pedido noturno em Campinas.",
  url,
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
});

const buildBurgerNSmokeRestaurantSchema = (url: string): SchemaBlock => ({
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: "Burger N' Smoke",
  description: 'Hamburgueria em Campinas com burgers autorais, smash burger, combos, retirada e delivery noturno.',
  url,
  image: `${burgerNSmokeBrand.origin}${burgerNSmokeBrand.ogImage}`,
  telephone: burgerNSmokeBrand.phone,
  priceRange: burgerNSmokeBrand.priceRange,
  servesCuisine: ['Hamburger', 'Smash Burger', 'American'],
  areaServed: burgerNSmokeBrand.serviceArea,
  address: {
    '@type': 'PostalAddress',
    streetAddress: burgerNSmokeBrand.address,
    addressLocality: burgerNSmokeBrand.city,
    addressRegion: burgerNSmokeBrand.state,
    addressCountry: 'BR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '-22.9010251',
    longitude: '-47.0967600',
  },
  openingHoursSpecification: burgerNSmokeBrand.openingHours.map((slot: { dayOfWeek: string; opens: string; closes: string }) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: slot.dayOfWeek,
    opens: slot.opens,
    closes: slot.closes,
  })),
  sameAs: [
    burgerNSmokeBrand.instagramUrl,
    burgerNSmokeBrand.googleProfileUrl,
    burgerNSmokeBrand.mapsUrl,
    burgerNSmokeBrand.ifoodUrl,
  ],
  hasMenu: `${burgerNSmokeBrand.origin}/#cardapio`,
  potentialAction: {
    '@type': 'OrderAction',
    target: [
      {
        '@type': 'EntryPoint',
        urlTemplate: burgerNSmokeBrand.whatsappUrl,
      },
      {
        '@type': 'EntryPoint',
        urlTemplate: burgerNSmokeBrand.ifoodUrl,
      },
    ],
  },
});

const buildFaqSchema = (entries: Array<{ question: string; answer: string }>): SchemaBlock => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

const buildBurgerNSmokeRouteSchema = (routePath: string, canonicalUrl: string): SchemaBlock[] => {
  if (routePath === '/burger-n-smoke') {
    return [
      buildBurgerNSmokeRestaurantSchema(canonicalUrl),
      buildBurgerNSmokeMenuSchema(canonicalUrl),
      buildFaqSchema(burgerNSmokeFaq),
    ];
  }

  const localPage = burgerNSmokeSeoPageList.find((page) => page.path === routePath);

  if (!localPage) {
    return [];
  }

  return [
    buildBurgerNSmokeRestaurantSchema(canonicalUrl),
    buildFaqSchema(localPage.faq),
  ];
};

const enrichBurgerNSmokeRoute = (routePath: string, route: RouteSeo | undefined): RouteSeo | undefined => {
  if (!route) {
    return route;
  }

  const canonicalUrl = route.canonicalUrl ?? `${burgerNSmokeBrand.origin}${normalizeCanonicalPath(routePath === '/burger-n-smoke' ? '/' : routePath)}`;

  return {
    ...route,
    image: burgerNSmokeBrand.ogImage,
    imageAlt: burgerNSmokeBrand.ogImageAlt,
    siteName: "Burger N' Smoke",
    twitterHandle: '@burgernsmoke',
    schema: buildBurgerNSmokeRouteSchema(routePath, canonicalUrl),
  };
};

for (const routePath of burgerNSmokeSeoPaths) {
  if (seoRoutes.routes[routePath]) {
    seoRoutes.routes[routePath] = enrichBurgerNSmokeRoute(routePath, seoRoutes.routes[routePath]) as RouteSeo;
  }
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
