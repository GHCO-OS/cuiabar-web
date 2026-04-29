import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { siteConfig } from '../data/siteConfig';

const whatsAppHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`;
const reservationPageHref = siteConfig.reservationPageUrl;

const OwnedPhotoBadge = () => (
  <span className="absolute left-3 top-3 rounded-full border border-white/35 bg-black/50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
    Fotos próprias
  </span>
);

export const HeroSection = () => (
  <section className="container-shell grid items-center gap-8 py-14 lg:grid-cols-2 lg:py-20">
    <Reveal className="lg:pr-4">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-terracotta">Villa Cuiabar em Campinas</p>
      <h1 className="font-heading text-4xl leading-tight text-cocoa sm:text-5xl">
        Comida brasileira servida forte — todo dia.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-steel">
        Almoco presencial, delivery e operacao corporativa para empresas em Campinas. Tres frentes, um so padrao de casa.
      </p>
      <div className="mt-7 overflow-hidden rounded-[1.9rem] border border-[#d9b58a] bg-[linear-gradient(135deg,rgba(255,248,232,0.97),rgba(245,225,198,0.92))] p-5 shadow-[0_28px_60px_-38px_rgba(121,63,26,0.35)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-terracotta">Almoço presencial</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-[2rem] leading-[0.95] text-cocoa sm:text-[2.4rem]">
              A partir de R$ 24,99
              <span className="ml-2 font-body text-base font-semibold uppercase tracking-[0.18em] text-cocoa/70 sm:text-lg">por prato</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-steel sm:text-[0.98rem]">
              Visite-nos e confira os combos e descontos do almoço presencial no salão.
            </p>
          </div>
          <Link className="btn-secondary w-fit shrink-0" to={reservationPageHref}>
            Ver reservas
          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn-primary" to="/menu">Ver menu</Link>
        <a className="btn-secondary" href={whatsAppHref} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
      </div>
    </Reveal>
    <Reveal delay={140} className="card overflow-hidden p-3">
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-2xl">
          <OwnedPhotoBadge />
          <picture className="block">
            <source srcSet="/home/home-salao-dia-da-mulher.webp" type="image/webp" />
            <img
              src="/home/home-salao-dia-da-mulher.jpg"
              alt="Salão do Villa Cuiabar com mesas montadas e ambiente acolhedor"
              width="1200"
              height="900"
              loading="eager"
              {...({ fetchpriority: 'high' } as Record<string, string>)}
              decoding="async"
              className="media-lift h-[420px] w-full object-cover"
            />
          </picture>
        </div>
        <div className="grid gap-3">
          <div className="relative overflow-hidden rounded-2xl">
            <OwnedPhotoBadge />
            <picture className="block">
              <source srcSet="/home/home-mascote-salao.webp" type="image/webp" />
              <img
                src="/home/home-mascote-salao.jpg"
                alt="Entrada do salão do Villa Cuiabar com o mascote da casa"
                width="900"
                height="1350"
                loading="lazy"
                decoding="async"
                className="media-lift h-[203px] w-full object-cover"
              />
            </picture>
          </div>
          <div className="rounded-2xl bg-[linear-gradient(160deg,#fff6ea_0%,#f7e4d0_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Ambiente próprio</p>
            <p className="mt-3 text-sm leading-relaxed text-steel">
              Espaco familiar, clima acolhedor e estrutura preparada para almoco, encontros e reservas da casa.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
