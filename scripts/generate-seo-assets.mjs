import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import seoRoutesJson from '../src/data/seoRoutes.json' with { type: 'json' };
import burgerNSmokeJson from '../src/data/burgerNSmoke.json' with { type: 'json' };
import burgerNSmokeSeoPagesJson from '../src/data/burgerNSmokeSeoPages.json' with { type: 'json' };
import menuData from '../src/data/menu.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const ssrDir = path.resolve(__dirname, '../.ssr');

const seoConfig = structuredClone(seoRoutesJson);
const burgerNSmokeBrand = {
  ...burgerNSmokeJson.brand,
  origin: burgerNSmokeJson.origin,
  instagramUrl: burgerNSmokeJson.instagramUrl,
  googleProfileUrl: burgerNSmokeJson.googleProfileUrl,
  ifoodUrl: burgerNSmokeJson.ifoodUrl,
  mapsUrl: burgerNSmokeJson.mapsUrl,
  icon: burgerNSmokeJson.brand.mark,
};
const burgerNSmokeCombos = burgerNSmokeJson.combos;
const burgerNSmokeMenuItems = burgerNSmokeJson.menuItems;
const burgerNSmokeFaq = burgerNSmokeJson.faq;
const burgerNSmokeSeoPages = burgerNSmokeSeoPagesJson.pages;

for (const routePath of ['/burger-n-smoke', ...burgerNSmokeSeoPages.map((page) => page.path)]) {
  if (!seoConfig.routes[routePath]) {
    continue;
  }

  seoConfig.routes[routePath] = {
    ...seoConfig.routes[routePath],
    image: `${burgerNSmokeBrand.origin}${burgerNSmokeBrand.ogImage}`,
    imageAlt: burgerNSmokeBrand.ogImageAlt,
    siteName: "Burger N' Smoke",
    twitterHandle: '@burgernsmoke',
  };
}

const siteOrigin = seoConfig.siteOrigin;
const defaultImage = seoConfig.defaultImage;
const routeEntries = Object.entries(seoConfig.routes);
const buildDate = new Date().toISOString().slice(0, 10);
const siteName = 'Villa Cuiabar';
const twitterHandle = '@cuiabar';
const menuSections = menuData;
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const burgerNSmokeRoutePaths = new Set(['/burger-n-smoke', ...burgerNSmokeSeoPages.map((page) => page.path)]);

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const upsertTag = (html, regex, replacement) =>
  regex.test(html)
    ? html.replace(regex, () => replacement)
    : html.replace('</head>', () => `  ${replacement}\n  </head>`);

const removeTag = (html, regex) => html.replace(regex, '');

const routeLabel = (routePath, title) => {
  if (routePath === '/') {
    return 'Home';
  }

  return title.split('|')[0].trim();
};

const isBurgerNSmokeRoute = (routePath) => burgerNSmokeRoutePaths.has(routePath);

const getRouteOrigin = (routePath, routeSeo) => {
  if (routeSeo?.canonicalUrl?.startsWith(burgerNSmokeBrand.origin) || isBurgerNSmokeRoute(routePath)) {
    return burgerNSmokeBrand.origin;
  }

  return siteOrigin;
};

const toAbsoluteUrl = (value) => {
  if (!value) {
    return defaultImage;
  }

  if (value.startsWith('http')) {
    return value;
  }

  return `${siteOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};

const normalizeCanonicalPath = (value) => {
  if (value === '/') {
    return '/';
  }

  return `${String(value).replace(/\/+$/, '')}/`;
};

const buildCanonicalUrl = (routePath, routeSeo) =>
  routeSeo.canonicalUrl ?? `${getRouteOrigin(routePath, routeSeo)}${normalizeCanonicalPath(routeSeo.canonicalPath ?? routePath)}`;

const normalizePrice = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
};

const buildOffer = (price) =>
  price
    ? {
        '@type': 'Offer',
        price,
        priceCurrency: 'BRL',
      }
    : undefined;

const buildMenuItemSchema = (item) => {
  if (item.variants?.length) {
    return item.variants
      .map((variant) => {
        const price = normalizePrice(variant.price);
        if (!price) {
          return null;
        }

        return {
          '@type': 'MenuItem',
          name: variant.name === '-' ? item.name : `${item.name} ${variant.name}`,
          description: item.description || undefined,
          image: item.image ? toAbsoluteUrl(item.image) : undefined,
          offers: buildOffer(price),
        };
      })
      .filter(Boolean);
  }

  const price = normalizePrice(item.price);

  return [
    {
      '@type': 'MenuItem',
      name: item.name,
      description: item.description || undefined,
      image: item.image ? toAbsoluteUrl(item.image) : undefined,
      offers: buildOffer(price),
    },
  ];
};

const buildMenuStructuredData = () => {
  const featuredSections = ['Abertura de Trabalhos', 'Fogão Cuiabano', 'Drinks Clássicos'];

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Cardápio Villa Cuiabar',
    url: `${siteOrigin}/menu`,
    inLanguage: 'pt-BR',
    hasMenuSection: menuSections
      .filter((section) => featuredSections.includes(section.name))
      .map((section) => ({
        '@type': 'MenuSection',
        name: section.name,
        description: section.description || undefined,
        hasMenuItem: section.items.slice(0, 8).flatMap((item) => buildMenuItemSchema(item)),
      })),
  };
};

const buildBurgerNSmokeStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: "Cardapio Burger N' Smoke",
  url: `${burgerNSmokeBrand.origin}/`,
  inLanguage: 'pt-BR',
  description: "Cardapio do Burger N' Smoke com burgers autorais, smash burger e combos para pedido noturno em Campinas.",
  hasMenuSection: [
    {
      '@type': 'MenuSection',
      name: 'Burgers',
      hasMenuItem: burgerNSmokeMenuItems.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: `${item.category}. ${item.description}`.trim(),
        image: `${burgerNSmokeBrand.origin}${item.image}`,
        offers: buildOffer(normalizePrice(item.price)),
      })),
    },
    {
      '@type': 'MenuSection',
      name: 'Combos',
      hasMenuItem: burgerNSmokeCombos.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: `${item.note}. ${item.description}`.trim(),
        offers: buildOffer(normalizePrice(item.price)),
      })),
    },
  ],
});

const buildBurgerNSmokeRestaurantStructuredData = (url = `${burgerNSmokeBrand.origin}/`) => ({
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
  openingHoursSpecification: burgerNSmokeBrand.openingHours.map((slot) => ({
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
        urlTemplate: `https://wa.me/551933058878?text=${encodeURIComponent(burgerNSmokeJson.whatsappMessage)}`,
      },
      {
        '@type': 'EntryPoint',
        urlTemplate: burgerNSmokeBrand.ifoodUrl,
      },
    ],
  },
});

const buildBurgerNSmokeFaqStructuredData = (entries = burgerNSmokeFaq) => ({
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

const buildRouteSpecificSchemas = (routePath) => {
  if (routePath === '/menu') {
    return [buildMenuStructuredData()];
  }

  if (routePath === '/burger-n-smoke') {
    return [
      buildBurgerNSmokeRestaurantStructuredData(`${burgerNSmokeBrand.origin}/`),
      buildBurgerNSmokeStructuredData(),
      buildBurgerNSmokeFaqStructuredData(),
    ];
  }

  const localPage = burgerNSmokeSeoPages.find((page) => page.path === routePath);

  if (localPage) {
    return [
      buildBurgerNSmokeRestaurantStructuredData(`${burgerNSmokeBrand.origin}${normalizeCanonicalPath(routePath)}`),
      buildBurgerNSmokeStructuredData(),
      buildBurgerNSmokeFaqStructuredData(localPage.faq),
    ];
  }

  return [];
};

const buildBreadcrumbSchema = (routePath, title) => {
  if (routePath === '/') {
    return null;
  }

  const itemUrl = buildCanonicalUrl(routePath, seoConfig.routes[routePath]);
  const burgerRoute = isBurgerNSmokeRoute(routePath);
  const homeLabel = burgerRoute ? "Burger N' Smoke" : 'Home';
  const homeItem = burgerRoute ? `${burgerNSmokeBrand.origin}/` : `${siteOrigin}/`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: homeItem,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: routeLabel(routePath, title),
        item: itemUrl,
      },
    ],
  };
};

const buildWebPageSchema = (routePath, routeSeo) => ({
  '@context': 'https://schema.org',
  '@type': routePath === '/' ? 'WebPage' : 'CollectionPage',
  name: routeLabel(routePath, routeSeo.title),
  url: buildCanonicalUrl(routePath, routeSeo),
  description: routeSeo.description,
  inLanguage: 'pt-BR',
});

const shouldPrerenderRoute = (routePath, routeSeo) => !routeSeo.canonicalPath || routeSeo.canonicalPath === routePath;

const injectPrerenderedRoot = (html, prerenderedMarkup) => {
  if (!prerenderedMarkup) {
    return html.replace('<div id="root"></div>', '<div id="root" data-prerendered="false"></div>');
  }

  return html.replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${prerenderedMarkup}</div>`);
};

const injectRouteMetadata = (html, routePath, routeSeo, prerenderedMarkup = '') => {
  const title = routeSeo.title;
  const description = routeSeo.description;
  const image = toAbsoluteUrl(routeSeo.image || defaultImage);
  const imageAlt = routeSeo.imageAlt || title;
  const canonicalUrl = buildCanonicalUrl(routePath, routeSeo);
  const ogType = routeSeo.type || 'website';
  const robots = routeSeo.robots || 'index,follow,max-image-preview:large';
  const routeSiteName = routeSeo.siteName || siteName;
  const routeTwitterHandle = routeSeo.twitterHandle || twitterHandle;
  const isBurgerRoute = canonicalUrl.startsWith(burgerNSmokeBrand.origin);
  const routeIcon = isBurgerRoute ? burgerNSmokeBrand.icon : '/favicon.png';
  const schemas = [
    buildWebPageSchema(routePath, routeSeo),
    ...buildRouteSpecificSchemas(routePath),
    ...(routeSeo.schema || []),
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(routePath, title);

  if (breadcrumbSchema) {
    schemas.push(breadcrumbSchema);
  }

  let output = html.replace(/<title>.*?<\/title>/s, () => `<title>${escapeHtml(title)}</title>`);
  output = upsertTag(output, /<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  output = upsertTag(output, /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  output = upsertTag(output, /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  output = upsertTag(output, /<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  output = upsertTag(output, /<meta\s+property="og:image:width"\s+content=".*?"\s*\/?>/i, '<meta property="og:image:width" content="1200" />');
  output = upsertTag(output, /<meta\s+property="og:image:height"\s+content=".*?"\s*\/?>/i, '<meta property="og:image:height" content="630" />');
  output = upsertTag(output, /<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`);
  output = upsertTag(output, /<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`);
  output = upsertTag(output, /<meta\s+property="og:site_name"\s+content=".*?"\s*\/?>/i, `<meta property="og:site_name" content="${escapeHtml(routeSiteName)}" />`);
  output = upsertTag(output, /<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(ogType)}" />`);
  output = upsertTag(output, /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
  output = upsertTag(output, /<meta\s+name="twitter:site"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:site" content="${escapeHtml(routeTwitterHandle)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:image:alt"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`);
  output = upsertTag(output, /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i, `<meta name="keywords" content="${escapeHtml((routeSeo.keywords || []).join(', '))}" />`);
  output = upsertTag(output, /<meta\s+name="robots"\s+content=".*?"\s*\/?>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  output = upsertTag(output, /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  output = removeTag(output, /\s*<link[^>]*rel="icon"[^>]*>\n?/i);
  output = removeTag(output, /\s*<link[^>]*rel="shortcut icon"[^>]*>\n?/i);
  output = removeTag(output, /\s*<link[^>]*rel="apple-touch-icon"[^>]*>\n?/i);
  output = output.replace(
    '</head>',
    () =>
      `  <link rel="icon" href="${escapeHtml(routeIcon)}" />\n  <link rel="shortcut icon" href="${escapeHtml(routeIcon)}" />\n  <link rel="apple-touch-icon" href="${escapeHtml(routeIcon)}" />\n  </head>`,
  );

  if (isBurgerRoute) {
    output = upsertTag(output, /<meta\s+name="geo\.region"\s+content=".*?"\s*\/?>/i, '<meta name="geo.region" content="BR-SP" />');
    output = upsertTag(output, /<meta\s+name="geo\.placename"\s+content=".*?"\s*\/?>/i, '<meta name="geo.placename" content="Campinas" />');
    output = upsertTag(output, /<meta\s+name="geo\.position"\s+content=".*?"\s*\/?>/i, '<meta name="geo.position" content="-22.9010251;-47.0967600" />');
    output = upsertTag(output, /<meta\s+name="ICBM"\s+content=".*?"\s*\/?>/i, '<meta name="ICBM" content="-22.9010251, -47.0967600" />');
  }

  if (googleSiteVerification) {
    output = upsertTag(
      output,
      /<meta\s+name="google-site-verification"\s+content=".*?"\s*\/?>/i,
      `<meta name="google-site-verification" content="${escapeHtml(googleSiteVerification)}" />`,
    );
  } else {
    output = removeTag(output, /\s*<meta\s+name="google-site-verification"\s+content=".*?"\s*\/?>\n?/i);
  }

  output = output.replace(/<script id="route-schema" type="application\/ld\+json">.*?<\/script>\s*/s, '');
  output = output.replace('</head>', () => `  <script id="route-schema" type="application/ld+json">${JSON.stringify(schemas)}</script>\n  </head>`);
  output = injectPrerenderedRoot(output, prerenderedMarkup);

  return output;
};

const generateSitemap = () => {
  const urls = routeEntries
    .filter(([, routeSeo]) => routeSeo.includeInSitemap !== false)
    .map(([routePath, routeSeo]) => {
      const loc = buildCanonicalUrl(routePath, routeSeo);
      const priority = routeSeo.priority || '0.7';
      const changefreq = routeSeo.changefreq || 'weekly';

      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${buildDate}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const generateRobots = () => `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;

const loadSsrRenderer = async () => {
  const ssrFiles = await readdir(ssrDir);
  const renderEntry = ssrFiles.find((fileName) => /^render\.(m?js|cjs)$/.test(fileName));

  if (!renderEntry) {
    throw new Error(`SSR render entry not found in ${ssrDir}.`);
  }

  const renderModule = await import(pathToFileURL(path.join(ssrDir, renderEntry)).href);

  if (typeof renderModule.renderRoute !== 'function') {
    throw new Error('SSR render module does not export renderRoute(routePath).');
  }

  return renderModule.renderRoute;
};

const main = async () => {
  const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
  const renderRoute = await loadSsrRenderer();

  for (const [routePath, routeSeo] of routeEntries) {
    const prerenderedMarkup = shouldPrerenderRoute(routePath, routeSeo) ? await renderRoute(routePath) : '';
    const routeHtml = injectRouteMetadata(baseHtml, routePath, routeSeo, prerenderedMarkup);

    if (routePath === '/') {
      await writeFile(path.join(distDir, 'index.html'), routeHtml, 'utf8');
      continue;
    }

    const routeDir = path.join(distDir, routePath.replace(/^\//, ''));
    await mkdir(routeDir, { recursive: true });
    await writeFile(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
  }

  await writeFile(path.join(distDir, 'robots.txt'), generateRobots(), 'utf8');
  await writeFile(path.join(distDir, 'sitemap.xml'), generateSitemap(), 'utf8');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
