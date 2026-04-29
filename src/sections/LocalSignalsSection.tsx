import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { localGuideList } from '../data/localGuides';

export const LocalSignalsSection = () => (
  <section className="container-shell py-12">
    <Reveal className="card p-6 sm:p-8">
      <SectionHeading
        eyebrow="Bairro e regiao"
        title="Villa Cuiabar no radar de Jardim Aurelia e Dunlop"
        description="Paginas criadas para reforcar a associacao da casa com o bairro, o eixo da John Boyd Dunlop, reservas, espaco kids e almoco presencial."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {localGuideList.map((guide, index) => (
          <Reveal
            key={guide.key}
            as="article"
            delay={index * 80}
            className="rounded-2xl border border-sand/50 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(51,35,19,0.44)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">{guide.eyebrow}</p>
            <h3 className="mt-3 font-heading text-2xl text-cocoa">{guide.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-steel">{guide.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {guide.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-sand/60 bg-butter px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cocoa">
                  {chip}
                </span>
              ))}
            </div>
            <Link to={guide.path} className="btn-secondary mt-6 inline-flex">
              Abrir pagina local
            </Link>
          </Reveal>
        ))}
      </div>
    </Reveal>
  </section>
);
