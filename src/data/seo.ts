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

const buildBurgerRouteSchema = (): SchemaBlock[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Cardapio Burger Cuiabar',
    description: 'Cardapio atual do Burger Cuiabar com sete burgers e tres combos oficiais.',
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
        })),
      },
      {
        '@type': 'MenuSection',
        name: 'Combos',
        hasMenuItem: burgerComboItems.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: `${item.description} ${item.note}`.trim(),
        })),
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
