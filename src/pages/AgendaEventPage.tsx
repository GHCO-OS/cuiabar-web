import { Link, useParams } from 'react-router-dom';
import { ClientRedirect } from '../components/ClientRedirect';
import { Reveal } from '../components/Reveal';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { getLiveMusicProgramBySlug, liveMusicPrograms } from '../data/liveMusicPrograms';
import { useSeo } from '../hooks/useSeo';

const AgendaEventPage = () => {
  const { eventSlug = '' } = useParams();
  const program = getLiveMusicProgramBySlug(eventSlug);

  if (!program) {
    return <ClientRedirect to="/agenda" title="Programacao nao encontrada" />;
  }

  useSeo(getRouteSeo(`/agenda/${program.slug}`));

  return (
    <section className="container-shell space-y-10 py-14">
      <Reveal as="header" className="card overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-terracotta">{program.eyebrow}</p>
            <h1 className="mt-3 font-heading text-5xl">{program.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-steel">{program.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {program.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full border border-sand/60 bg-butter px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cocoa">
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={siteConfig.reservationPortalUrl} target="_blank" rel="noreferrer" className="btn-primary">
                Reservar online
              </a>
              <Link to="/agenda" className="btn-secondary">
                Voltar para agenda
              </Link>
            </div>
          </div>
          <img src={program.image} alt={program.shortTitle} loading="eager" className="h-full min-h-[320px] w-full object-cover" />
        </div>
      </Reveal>

      <Reveal as="section" delay={60} className="grid gap-4 lg:grid-cols-3">
        {program.highlights.map((highlight, index) => (
          <Reveal key={highlight.title} as="article" delay={index * 70} className="card p-6">
            <h2 className="font-heading text-3xl">{highlight.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">{highlight.description}</p>
          </Reveal>
        ))}
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <Reveal as="section" delay={90} className="card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Como ler esta programação</p>
          <div className="mt-5 space-y-3 text-steel">
            <p className="rounded-xl border border-sand/50 bg-white px-4 py-3 text-sm leading-relaxed">
              Esta página representa uma frente recorrente da agenda ao vivo do Villa Cuiabar, e não um anúncio isolado de artista.
            </p>
            <p className="rounded-xl border border-sand/50 bg-white px-4 py-3 text-sm leading-relaxed">
              O objetivo aqui é mostrar o perfil do dia, a leitura da experiência e a melhor forma de combinar programação, jantar e reserva.
            </p>
            <p className="rounded-xl border border-sand/50 bg-white px-4 py-3 text-sm leading-relaxed">{program.reservationHint}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-sand/50 bg-butter p-5">
            <p className="text-sm font-semibold text-cocoa">Base local</p>
            <p className="mt-2 text-sm leading-relaxed text-steel">
              A casa fica no Jardim Aurelia, com acesso pelo eixo da John Boyd Dunlop, e conversa tanto com quem quer sair para ouvir musica
              quanto com quem quer jantar, reservar ou reunir amigos.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" delay={110} className="card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Links para continuar</p>
          <div className="mt-5 grid gap-3">
            <Link to="/reservas" className="rounded-xl border border-sand/50 bg-white px-4 py-4 text-sm font-semibold text-cocoa transition hover:-translate-y-0.5 hover:shadow-soft">
              Abrir página de reservas
            </Link>
            <Link to="/menu" className="rounded-xl border border-sand/50 bg-white px-4 py-4 text-sm font-semibold text-cocoa transition hover:-translate-y-0.5 hover:shadow-soft">
              Ver menu da casa
            </Link>
            <Link to="/bar-jardim-aurelia-musica-ao-vivo" className="rounded-xl border border-sand/50 bg-white px-4 py-4 text-sm font-semibold text-cocoa transition hover:-translate-y-0.5 hover:shadow-soft">
              Ler o guia local de bar e shows
            </Link>
            <Link to="/restaurante-jardim-aurelia-campinas" className="rounded-xl border border-sand/50 bg-white px-4 py-4 text-sm font-semibold text-cocoa transition hover:-translate-y-0.5 hover:shadow-soft">
              Abrir o guia local do restaurante
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={130} className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Outras programações</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {liveMusicPrograms
            .filter((item) => item.slug !== program.slug)
            .map((relatedProgram) => (
              <Link key={relatedProgram.slug} to={`/agenda/${relatedProgram.slug}`} className="rounded-2xl border border-sand/50 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{relatedProgram.dayLabel}</p>
                <h2 className="mt-2 font-heading text-3xl text-cocoa">{relatedProgram.shortTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-steel">{relatedProgram.teaser}</p>
              </Link>
            ))}
        </div>
      </Reveal>
    </section>
  );
};

export default AgendaEventPage;
