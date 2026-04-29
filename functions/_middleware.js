const LEGACY_REDIRECTS = new Map([
  ['/bio', '/links'],
  ['/acessos', '/links'],
  ['/canal', '/links'],
  ['/marmita', '/expresso'],
  ['/delivery', '/expresso'],
  ['/online-ordering', '/expresso'],
  ['/pedidos-online', '/expresso'],
  ['/services-5', '/expresso'],
  ['/asianrestaurant', '/presencial'],
]);

const PROREFEICAO_HOST = 'prorefeicao.cuiabar.com';
const BURGER_ARCHIVED_HOST = 'burger.cuiabar.com';
const BURGER_N_SMOKE_HOST = 'burgersnsmoke.com';
const BURGER_N_SMOKE_ROOT = `https://${BURGER_N_SMOKE_HOST}/`;
const BURGER_N_SMOKE_PREVIEW_PATH = '/burger-n-smoke';
const BURGER_N_SMOKE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${BURGER_N_SMOKE_ROOT}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
const BURGER_N_SMOKE_ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${BURGER_N_SMOKE_ROOT}sitemap.xml\n`;

const normalizePathname = (pathname) => {
  if (pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '') || '/';
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const normalizedPathname = normalizePathname(url.pathname);

  if (url.hostname === 'www.prorefeicao.cuiabar.com') {
    url.hostname = PROREFEICAO_HOST;
    url.pathname = normalizedPathname;
    return Response.redirect(url.toString(), 301);
  }

  if (url.hostname === 'www.burgersnsmoke.com') {
    url.hostname = BURGER_N_SMOKE_HOST;
    url.pathname = normalizedPathname;
    return Response.redirect(url.toString(), 301);
  }

  if (url.hostname === 'www.cuiabar.com') {
    url.hostname = 'cuiabar.com';
    url.pathname = normalizedPathname;
    return Response.redirect(url.toString(), 301);
  }

  if (normalizedPathname === '/prorefeicao' && url.hostname === 'cuiabar.com') {
    return Response.redirect(`https://${PROREFEICAO_HOST}/`, 301);
  }

  if (
    url.hostname === BURGER_ARCHIVED_HOST ||
    url.hostname === `www.${BURGER_ARCHIVED_HOST}` ||
    normalizedPathname === '/burguer' ||
    normalizedPathname === '/burger' ||
    normalizedPathname === '/burguer-cuiabar'
  ) {
    return Response.redirect(BURGER_N_SMOKE_ROOT, 301);
  }

  if (normalizedPathname === '/blog' || normalizedPathname.startsWith('/blog/')) {
    return Response.redirect('https://cuiabar.com/presencial/', 301);
  }

  if (
    normalizedPathname === '/agenda' ||
    normalizedPathname.startsWith('/agenda/') ||
    normalizedPathname === '/bar-jardim-aurelia-musica-ao-vivo'
  ) {
    return Response.redirect('https://cuiabar.com/presencial/#agenda-casa', 301);
  }

  if (url.hostname === PROREFEICAO_HOST && normalizedPathname === '/prorefeicao') {
    return Response.redirect(`https://${PROREFEICAO_HOST}/`, 301);
  }

  if (url.hostname === BURGER_N_SMOKE_HOST && normalizedPathname === '/robots.txt') {
    return new Response(BURGER_N_SMOKE_ROBOTS, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  }

  if (url.hostname === BURGER_N_SMOKE_HOST && normalizedPathname === '/sitemap.xml') {
    return new Response(BURGER_N_SMOKE_SITEMAP, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  }

  if (url.hostname === BURGER_N_SMOKE_HOST && normalizedPathname === BURGER_N_SMOKE_PREVIEW_PATH) {
    return Response.redirect(BURGER_N_SMOKE_ROOT, 301);
  }

  if (url.hostname === PROREFEICAO_HOST && normalizedPathname === '/') {
    const assetUrl = new URL('/prorefeicao/', url.origin);
    const response = await context.env.ASSETS.fetch(assetUrl.toString());

    return new HTMLRewriter()
      .on('link[rel="canonical"]', {
        element(element) {
          element.setAttribute('href', `https://${PROREFEICAO_HOST}/`);
        },
      })
      .on('meta[property="og:url"]', {
        element(element) {
          element.setAttribute('content', `https://${PROREFEICAO_HOST}/`);
        },
      })
      .on('meta[name="twitter:url"]', {
        element(element) {
          element.setAttribute('content', `https://${PROREFEICAO_HOST}/`);
        },
      })
      .transform(response);
  }

  if (url.hostname === BURGER_N_SMOKE_HOST && normalizedPathname === '/') {
    const assetUrl = new URL(`${BURGER_N_SMOKE_PREVIEW_PATH}/`, url.origin);
    const response = await context.env.ASSETS.fetch(assetUrl.toString());

    return new HTMLRewriter()
      .on('link[rel="canonical"]', {
        element(element) {
          element.setAttribute('href', BURGER_N_SMOKE_ROOT);
        },
      })
      .on('meta[property="og:url"]', {
        element(element) {
          element.setAttribute('content', BURGER_N_SMOKE_ROOT);
        },
      })
      .on('meta[name="twitter:url"]', {
        element(element) {
          element.setAttribute('content', BURGER_N_SMOKE_ROOT);
        },
      })
      .on('meta[property="og:site_name"]', {
        element(element) {
          element.setAttribute('content', "Burger N' Smoke");
        },
      })
      .on('meta[name="twitter:site"]', {
        element(element) {
          element.setAttribute('content', '@burgernsmoke');
        },
      })
      .transform(response);
  }

  if (normalizedPathname === '/menu' && url.searchParams.has('menu')) {
    url.pathname = '/menu';
    url.searchParams.delete('menu');
    return Response.redirect(url.toString(), 301);
  }

  const redirectTarget = LEGACY_REDIRECTS.get(normalizedPathname);

  if (redirectTarget) {
    url.hostname = 'cuiabar.com';
    url.pathname = redirectTarget;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
