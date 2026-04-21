// Diretriz visual: toda imagem usada nesta seção precisa seguir o padrão
// de marmita redonda preta selada sobre fundo branco (estúdio profissional).
// Regras completas e checklist em `/public/prorefeicao/README.md`.
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { siteConfig } from '../data/siteConfig';

const commercialHref = `https://wa.me/${siteConfig.commercialWhatsappNumber}?text=${encodeURIComponent(siteConfig.commercialWhatsappMessage)}`;

const pills = ['Rotina recorrente', 'Embalagem selada', 'Resposta em horas'];

export const ProRefeicaoSection = () => (
  <section className="container-shell py-14">
    <Reveal className="relative overflow-hidden rounded-card bg-[radial-gradient(circle_at_top_right,#4a3018_0%,#332313_55%,#20160a_100%)] px-6 py-10 text-white shadow-[0_40px_90px_-40px_rgba(20,13,5,0.9)] sm:px-10 sm:py-12 lg:px-14">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-terracotta/25 blur-3xl" aria-hidden />

      <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-0 rounded-full bg-white/90 blur-2xl opacity-60" aria-hidden />
            <picture className="relative block">
              <img
                src="/prorefeicao/marmita-parmegiana.png"
                alt="Marmita corporativa com parmegiana, arroz, feijão e fritas em embalagem selada"
                width="1024"
                height="1024"
                loading="lazy"
                decoding="async"
                className="relative h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]"
              />
            </picture>
          </div>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Para empresas</p>
          <h2 className="font-heading text-[2.1rem] leading-[1.08] text-white sm:text-[2.55rem] lg:text-[2.9rem]">
            Refeição corporativa com padrão e rotina previsível
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Almoço e jantar profissionais para escritórios, obras, clínicas e indústrias em Campinas. Embalagem selada, cardápio recorrente e equipe comercial pronta para responder sua cotação.
          </p>
          <ul className="flex flex-wrap gap-2.5 pt-1">
            {pills.map((pill) => (
              <li
                key={pill}
                className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold"
              >
                {pill}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/prorefeicao" className="btn-primary">
              Fazer cotação
            </Link>
            <a
              href={commercialHref}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary border-white/25 bg-white/5 text-white hover:border-white hover:bg-white hover:text-cocoa"
            >
              WhatsApp comercial
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
