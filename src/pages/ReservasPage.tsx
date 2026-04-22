import { Reveal } from '../components/Reveal';
import { reservationFaqs } from '../data/content';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';
import '../styles/reservations.css';

const ReservasPage = () => {
  const reservationsAppUrl = siteConfig.reservationPortalUrl;

  useSeo(getRouteSeo('/reservas'));

  return (
    <section className="container-shell space-y-10 py-14">
      <Reveal as="header" className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-terracotta">Portal oficial de reservas</p>
        <h1 className="mt-3 font-heading text-5xl">Reservas no Villa Cuiabar</h1>
        <p className="mt-3 max-w-3xl text-steel">
          Faça sua reserva online em um fluxo proprio, rapido e organizado para o Villa Cuiabar, no Jardim Aurelia, pensado para almoco, jantar e noites com musica ao vivo em Campinas.
        </p>
        <div className="mt-8">
          <a href={reservationsAppUrl} className="reservation-cta">
            <span className="reservation-cta__glow" aria-hidden="true" />
            <span className="reservation-cta__border" aria-hidden="true" />
            <span className="reservation-cta__content">
              <span className="reservation-cta__eyebrow">Reserva imediata</span>
              <span className="reservation-cta__label">Reservar online</span>
              <span className="reservation-cta__hint">Acessar reservas.cuiabar.com</span>
            </span>
          </a>
          <p className="mt-4 text-sm text-steel">Use o portal oficial para escolher data, horario, quantidade de pessoas e preferencias da mesa em um unico envio.</p>
        </div>
      </Reveal>
      <Reveal as="section" delay={80} className="grid gap-8 lg:grid-cols-2">
        <div className="card p-8">
          <h2 className="font-heading text-3xl">Novo portal de reservas</h2>
          <p className="mt-3 text-steel">
            Em <strong>reservas.cuiabar.com</strong> voce escolhe data, horario, quantidade de pessoas, preferencias de mesa, restricoes alimentares e
            observacoes em uma unica confirmacao.
          </p>
          <div className="mt-6 rounded-xl border border-sand/50 bg-white p-4">
            <p className="text-sm font-semibold text-cocoa">Politica de tolerancia</p>
            <p className="mt-2 text-sm text-steel">
              Reservas possuem tolerancia de 10 minutos. Para grupos acima de 10 pessoas, nao ha tolerancia. Apos o horario combinado, a mesa podera ser
              desmontada e liberada por ordem de chegada.
            </p>
          </div>
          <p className="mt-5 text-sm text-steel">
            A pagina atende quem busca reserva de restaurante no Jardim Aurelia e no eixo da John Boyd Dunlop, com uma entrada unica para mesas, aniversarios e grupos.
          </p>
        </div>
        <div className="card p-8">
          <h2 className="font-heading text-3xl">Como funciona</h2>
          <div className="mt-5 space-y-4 text-steel">
            <p>
              Escolha o periodo, informe o numero de pessoas, diga se ha criancas ou restricoes alimentares e registre observacoes importantes em poucos passos.
            </p>
            <p>
              Ao concluir, voce recebe uma confirmacao clara da solicitacao e nossa equipe acompanha tudo pelo painel interno de reservas.
            </p>
            <p className="rounded-xl border border-sand/50 bg-white px-4 py-3 text-sm">
              O acesso oficial fica em <strong>reservas.cuiabar.com</strong> e concentra o fluxo recomendado para clientes do restaurante.
            </p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={110} className="card p-8">
        <h2 className="font-heading text-3xl">Perguntas frequentes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reservationFaqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-sand/50 bg-white p-4">
              <h4 className="font-semibold">{faq.question}</h4>
              <p className="mt-1 text-sm text-steel">{faq.answer}</p>
            </article>
          ))}
        </div>
      </Reveal>
      <Reveal delay={120} className="card p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Pronto para escolher sua mesa?</p>
        <h2 className="mt-3 font-heading text-4xl">Faça sua reserva online</h2>
        <p className="mt-3 text-steel">Entre no portal oficial e conclua sua solicitacao com mais conforto e organizacao.</p>
        <div className="mt-8 flex justify-center">
          <a href={reservationsAppUrl} className="reservation-cta reservation-cta--compact">
            <span className="reservation-cta__glow" aria-hidden="true" />
            <span className="reservation-cta__border" aria-hidden="true" />
            <span className="reservation-cta__content">
              <span className="reservation-cta__label">Reservar online</span>
              <span className="reservation-cta__hint">Ir para reservas.cuiabar.com</span>
            </span>
          </a>
        </div>
      </Reveal>
    </section>
  );
};

export default ReservasPage;
