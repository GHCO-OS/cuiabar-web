import type { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScrollManager } from '../components/ScrollManager';
import { siteConfig } from '../data/siteConfig';
import { blogConfig } from './blogConfig';
import { BlogAnalyticsTracker } from './BlogAnalyticsTracker';

const topLinks = [
  { label: 'Site principal', href: blogConfig.homeUrl },
  { label: 'Agenda', href: blogConfig.agendaUrl },
  { label: 'Menu', href: blogConfig.menuUrl },
  { label: 'Reservas', href: blogConfig.reservationUrl },
];

export const BlogLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const isHome = (location.pathname.replace(/\/+$/, '') || '/') === '/';

  return (
    <div className="blog-shell min-h-screen text-white">
      <BlogAnalyticsTracker />
      <ScrollManager />
      <div className="blog-noise" aria-hidden="true" />

      <header className="blog-header">
        <div className="container-shell">
          <div className="blog-header__row">
            <Link to="/" className="blog-brand">
              <img
                src={siteConfig.logoUrl}
                alt=""
                width={52}
                height={52}
                decoding="async"
                className="h-[3.25rem] w-[3.25rem] rounded-full object-cover"
              />
              <div>
                <p className="blog-brand__eyebrow">Editorial da casa</p>
                <p className="blog-brand__title">{blogConfig.siteName}</p>
              </div>
            </Link>

            <nav className="blog-nav">
              {topLinks.map((item) => (
                <a key={item.href} href={item.href} className="blog-nav__link">
                  {item.label}
                </a>
              ))}
              <a href={blogConfig.whatsappChannelUrl} className="blog-nav__cta" target="_blank" rel="noreferrer">
                Canal WhatsApp
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className={isHome ? 'pt-0' : 'pt-6'}>
        <div key={location.pathname} className="page-transition">
          {children}
        </div>
      </main>

      <footer className="blog-footer">
        <div className="container-shell grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div>
            <p className="blog-footnote">Blog em refinamento controlado</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Um laboratorio editorial da Cuiabar para testar pauta, distribuicao e conversao.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72">
              O blog segue em calibragem de variaveis, tom editorial, integracoes e blocos de conversao. Por isso ele esta publicado no subdominio, enquanto o site principal continua enxuto.
            </p>
          </div>

          <div>
            <p className="blog-footnote">Rotas principais</p>
            <div className="mt-4 space-y-3 text-sm text-white/74">
              {topLinks.map((item) => (
                <a key={item.href} href={item.href} className="blog-footer__link">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="blog-footnote">Conexao rapida</p>
            <div className="mt-4 space-y-3 text-sm text-white/74">
              <a href={blogConfig.whatsappContactUrl} className="blog-footer__link" target="_blank" rel="noreferrer">
                Falar com a equipe
              </a>
              <a href={blogConfig.whatsappChannelUrl} className="blog-footer__link" target="_blank" rel="noreferrer">
                Entrar no canal
              </a>
              <a href={blogConfig.reservationUrl} className="blog-footer__link" target="_blank" rel="noreferrer">
                Reservar mesa
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
