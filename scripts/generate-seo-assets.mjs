import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import seoRoutesJson from '../src/data/seoRoutes.json' with { type: 'json' };
import burgerMenuJson from '../src/data/burgerMenu.json' with { type: 'json' };
import menuData from '../src/data/menu.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const ssrDir = path.resolve(__dirname, '../.ssr');

const burgerMenu = burgerMenuJson;
const seoConfig = structuredClone(seoRoutesJson);

if (seoConfig.routes['/burguer']) {
  seoConfig.routes['/burguer'] = {
    ...seoConfig.routes['/burguer'],
    image: burgerMenu.ogImage,
    imageAlt: burgerMenu.ogImageAlt,
    schema: [],
  };
}

for (const aliasPath of ['/burger', '/burguer-cuiabar']) {
  if (seoConfig.routes[aliasPath]) {
    seoConfig.routes[aliasPath] = {
      ...seoConfig.routes[aliasPath],
      image: burgerMenu.ogImage,
      imageAlt: burgerMenu.ogImageAlt,
    };
  }
}

const siteOrigin = seoConfig.siteOrigin;
const defaultImage = seoConfig.defaultImage;
const routeEntries = Object.entries(seoConfig.routes);
const buildDate = new Date().toISOString().slice(0, 10);
const siteName = 'Villa Cuiabar';
const twitterHandle = '@cuiabar';
const menuSections = menuData;
const burgerCanonicalUrl = 'https://burger.cuiabar.com/';
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

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

const toAbsoluteUrl = (value) => {
  if (!value) {
    return defaultImage;
  }

  if (value.startsWith('http')) {
    return value;
  }

  return `${siteOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};

const buildCanonicalUrl = (routePath, routeSeo) =>
  routeSeo.canonicalUrl ?? `${siteOrigin}${routeSeo.canonicalPath ?? (routePath === '/' ? '/' : routePath)}`;

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

const buildBurgerStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Cardapio Burger Cuiabar',
  url: burgerCanonicalUrl,
  inLanguage: 'pt-BR',
  description: 'Cardapio atual do Burger Cuiabar com sete burgers e tres combos oficiais.',
  hasMenuSection: [
    {
      '@type': 'MenuSection',
      name: 'Burgers',
      hasMenuItem: burgerMenu.burgers.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: `${item.description} ${item.tagline}`.trim(),
        image: toAbsoluteUrl(item.image),
      })),
    },
    {
      '@type': 'MenuSection',
      name: 'Combos',
      hasMenuItem: burgerMenu.combos.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: `${item.description} ${item.note}`.trim(),
      })),
    },
  ],
});

const buildRouteSpecificSchemas = (routePath) => {
  if (routePath === '/menu') {
    return [buildMenuStructuredData()];
  }

  if (routePath === '/burguer') {
    return [buildBurgerStructuredData()];
  }

  return [];
};

const buildBreadcrumbSchema = (routePath, title) => {
  if (routePath === '/') {
    return null;
  }

  const itemUrl = buildCanonicalUrl(routePath, seoConfig.routes[routePath]);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteOrigin}/`,
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

const shouldPrerenderRoute = (routePath, routeSeo) => routeSeo.includeInSitemap !== false && (!routeSeo.canonicalPath || routeSeo.canonicalPath === routePath);

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
  output = upsertTag(output, /<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`);
  output = upsertTag(output, /<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`);
  output = upsertTag(output, /<meta\s+property="og:site_name"\s+content=".*?"\s*\/?>/i, `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`);
  output = upsertTag(output, /<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(ogType)}" />`);
  output = upsertTag(output, /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
  output = upsertTag(output, /<meta\s+name="twitter:site"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:site" content="${escapeHtml(twitterHandle)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:image:alt"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`);
  output = upsertTag(output, /<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`);
  output = upsertTag(output, /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i, `<meta name="keywords" content="${escapeHtml((routeSeo.keywords || []).join(', '))}" />`);
  output = upsertTag(output, /<meta\s+name="robots"\s+content=".*?"\s*\/?>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  output = upsertTag(output, /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);

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
