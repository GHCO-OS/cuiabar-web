const LEGACY_REDIRECTS = new Map([
  ['/bio', '/links'],
  ['/acessos', '/links'],
  ['/canal', '/links'],
  ['/burger', '/burguer'],
  ['/burguer-cuiabar', '/burguer'],
  ['/marmita', '/pedidos-online'],
  ['/delivery', '/pedidos-online'],
  ['/online-ordering', '/pedidos-online'],
  ['/services-5', '/pedidos-online'],
  ['/asianrestaurant', '/'],
]);

const normalizePathname = (pathname) => {
  if (pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '') || '/';
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const normalizedPathname = normalizePathname(url.pathname);

  if (url.hostname === 'www.cuiabar.com') {
    url.hostname = 'cuiabar.com';
    url.pathname = normalizedPathname;
    return Response.redirect(url.toString(), 301);
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
