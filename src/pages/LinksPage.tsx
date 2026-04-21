import { Link } from 'react-router-dom';
import { linksPageConfig } from '../data/linksPageConfig';
import { getRouteSeo } from '../data/seo';
import { useSeo } from '../hooks/useSeo';
import '../styles/links.css';

const isInternalRoute = (href: string) => href.startsWith('/');
const isHashLink = (href: string) => href.startsWith('#');

type LinkRowProps = {
  emoji: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  isFeatured?: boolean;
};

const LinkRow = ({ emoji, eyebrow, title, subtitle, href, isFeatured = false }: LinkRowProps) => {
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-4">
        <span
          aria-hidden="true"
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] text-2xl ${
            isFeatured ? 'bg-white/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]' : 'bg-[#f8efe2]'
          }`}
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p className={`text-[0.7rem] uppercase tracking-[0.24em] ${isFeatured ? 'text-white/76' : 'text-steel/80'}`}>{eyebrow}</p>
          <h2 className={`mt-2 text-xl leading-tight sm:text-2xl ${isFeatured ? 'text-white' : 'text-cocoa'}`}>{title}</h2>
          <p className={`mt-2 max-w-xl text-sm leading-relaxed sm:text-[0.96rem] ${isFeatured ? 'text-white/84' : 'text-steel'}`}>{subtitle}</p>
        </div>
      </div>
      <span
        aria-hidden="true"
        className={`ml-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition duration-300 ${
          isFeatured
            ? 'border border-white/28 bg-white/12 text-white group-hover:bg-white group-hover:text-[#8b3e1e]'
            : 'border border-cocoa/12 text-cocoa group-hover:border-terracotta/35 group-hover:bg-white group-hover:text-terracotta'
        }`}
      >
        ↗
      </span>
    </>
  );

  const className = `links-editorial-row group ${isFeatured ? 'links-editorial-row-featured' : ''}`;

  if (isInternalRoute(href)) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  if (isHashLink(href)) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <a href={href} className={className} aria-label={title}>
      {content}
    </a>
  );
};

const LinksPage = () => {
  useSeo(getRouteSeo('/links'));

  return (
    <div className="links-page min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[45rem] flex-col px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-9">
        <header className="links-surface links-hero rounded-[2.2rem] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.72rem] uppercase tracking-[0.3em] text-terracotta/85">{linksPageConfig.pageEyebrow}</p>
              <h1 className="mt-3 font-heading text-[2.7rem] leading-[0.92] text-cocoa sm:text-[3.7rem]">{linksPageConfig.brandName}</h1>
            </div>
            <img
              src={linksPageConfig.logoUrl}
              alt=""
              width="56"
              height="56"
              className="mt-1 h-14 w-14 rounded-full border border-cocoa/10 object-cover sm:h-16 sm:w-16"
            />
          </div>
          <p className="mt-5 max-w-xl text-xl leading-tight text-cocoa sm:text-[1.65rem]">{linksPageConfig.subheadline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-steel sm:text-[0.98rem]">{linksPageConfig.institutionalIntro}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="links-chip">🍴 Pedido oficial</span>
            <span className="links-chip">🎶 Música ao vivo</span>
            <span className="links-chip">💬 Atendimento direto</span>
          </div>
          <p className="mt-6 text-sm font-medium text-cocoa/86 sm:text-[0.96rem]">{linksPageConfig.headline}</p>
        </header>

        <nav aria-label="Links oficiais da Cuiabar" className="mt-6">
          <div className="links-stack">
            {linksPageConfig.links.map((item) => (
              <LinkRow
                key={item.id}
                emoji={item.emoji}
                eyebrow={item.eyebrow}
                title={item.title}
                subtitle={item.subtitle}
                href={item.href}
                isFeatured={item.isFeatured}
              />
            ))}
          </div>
        </nav>

        <aside className="links-surface mt-5 rounded-[2rem] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1 text-2xl">
              ✨
            </span>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-terracotta/85">{linksPageConfig.featuredChannelLabel}</p>
              <p className="mt-2 text-sm leading-relaxed text-cocoa sm:text-[0.97rem]">{linksPageConfig.featuredChannelNote}</p>
            </div>
          </div>
        </aside>

        <section id="presencial" aria-labelledby="presencial-title" className="mt-6">
          <div className="links-surface rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-terracotta/85">Presença física</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div>
                <h2 id="presencial-title" className="font-heading text-[2rem] leading-tight text-cocoa sm:text-[2.45rem]">
                  {linksPageConfig.liveMusicScheduleTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-steel sm:text-[1.03rem]">{linksPageConfig.liveMusicScheduleText}</p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-cocoa/84 sm:text-[0.97rem]">{linksPageConfig.venueCopy}</p>
              </div>
              <div className="grid gap-4">
                <article className="rounded-[1.5rem] border border-cocoa/10 bg-white/70 px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-steel/80">{linksPageConfig.liveMusicScheduleLabel}</p>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-cocoa sm:text-[0.95rem]">
                    {linksPageConfig.liveMusicScheduleHours.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </article>
                <article className="rounded-[1.5rem] border border-cocoa/10 bg-white/70 px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-steel/80">{linksPageConfig.addressCardLabel}</p>
                  <a
                    href={linksPageConfig.mapsUrl}
                    className="mt-3 inline-flex text-sm leading-relaxed text-cocoa transition hover:text-terracotta focus-visible:text-terracotta sm:text-[0.95rem]"
                    aria-label={`Abrir no Google Maps: ${linksPageConfig.addressLabel}`}
                  >
                    {linksPageConfig.addressLabel}
                  </a>
                </article>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-7 flex items-center justify-between gap-4 px-1 text-xs text-steel/84 sm:text-sm">
          <p>{linksPageConfig.footerCopy}</p>
          <p>© {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default LinksPage;
