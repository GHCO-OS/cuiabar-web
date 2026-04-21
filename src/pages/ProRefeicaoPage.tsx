import { Reveal } from '../components/Reveal';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';
import '../styles/pro-refeicao.css';

const operationalPillars = [
  {
    title: 'Operação contínua',
    description: 'Atendimento recorrente para almoço, jantar e rotinas corporativas com padrão estável de produção.',
  },
  {
    title: 'Logística organizada',
    description: 'Fluxo pensado para volume, horário combinado e distribuição consistente para equipes e frentes de trabalho.',
  },
  {
    title: 'Embalagem selada',
    description: 'Refeições em embalagens seladas que ajudam a preservar qualidade, integridade e temperatura.',
  },
  {
    title: 'Atendimento comercial',
    description: 'Contato direto para orçamento, alinhamento de demanda e ajustes operacionais conforme a rotina da empresa.',
  },
];

const servedSegments = [
  'Escritórios e sedes administrativas',
  'Clínicas, hospitais e casas de repouso',
  'Indústrias e operações fabris',
  'Obras, construtoras e equipes externas',
  'Condomínios corporativos e centros logísticos',
  'Operações com almoço e jantar recorrentes',
];

const packagingPoints = [
  'Embalagens seladas para reforçar segurança e apresentação profissional.',
  'Montagem padronizada para manter consistência entre lotes e turnos.',
  'Transporte com foco em integridade do pedido até a entrega.',
  'Retenção térmica para apoiar qualidade sensorial no momento do consumo.',
];

const patBenefits = [
  {
    title: 'Benefício alimentar contínuo',
    description: 'O PAT ajuda a estruturar a alimentação do trabalhador como rotina organizada, não como solução improvisada.',
  },
  {
    title: 'Mais previsibilidade operacional',
    description: 'Com fornecimento contínuo, a empresa reduz ruptura na jornada, padroniza horários e melhora a experiência do time.',
  },
  {
    title: 'Apoio à saúde e produtividade',
    description: 'Uma operação estável de alimentação contribui para bem-estar, rendimento e regularidade no dia a dia da equipe.',
  },
];

const commercialSteps = [
  'Levantamento de volume, turnos, frequência e perfil da operação.',
  'Definição do formato de atendimento, cardápio-base e rotina logística.',
  'Início da operação com acompanhamento próximo e canal comercial direto.',
];

const showcaseMeals = [
  {
    src: '/prorefeicao/hero-parmegiana.png',
    webpSrc: '/prorefeicao/hero-parmegiana.webp',
    alt: 'Refeição corporativa com parmegiana, arroz e fritas',
    width: 520,
    height: 520,
    className: 'pro-immersive-card pro-immersive-card-primary',
  },
  {
    src: '/prorefeicao/costela.png',
    webpSrc: '/prorefeicao/costela.webp',
    alt: 'Refeição corporativa com costela, arroz e mandioca',
    width: 520,
    height: 520,
    className: 'pro-immersive-card pro-immersive-card-secondary',
  },
  {
    src: '/prorefeicao/chorizo.png',
    webpSrc: '/prorefeicao/chorizo.webp',
    alt: 'Refeição corporativa com corte grelhado e acompanhamentos',
    width: 520,
    height: 520,
    className: 'pro-immersive-card pro-immersive-card-tertiary',
  },
];

const ProRefeicaoPage = () => {
  const commercialHref = `https://wa.me/${siteConfig.commercialWhatsappNumber}?text=${encodeURIComponent(siteConfig.commercialWhatsappMessage)}`;

  useSeo(getRouteSeo('/prorefeicao'));

  return (
    <section className="container-shell space-y-12 py-14">
      <Reveal
        as="header"
        className="overflow-hidden rounded-[2.25rem] border border-[#d8deea] bg-[linear-gradient(135deg,#122033_0%,#1f3149_45%,#304865_100%)] px-6 py-8 text-white shadow-[0_40px_100px_-44px_rgba(12,21,35,0.92)] sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              ProRefeição • Solução B2B
            </div>
            <div>
              <h1 className="max-w-3xl font-heading text-4xl leading-[1.02] text-white sm:text-5xl lg:text-[3.9rem]">
                Refeição corporativa com padrão, volume, controle e presença institucional.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">
                O ProRefeição do Villa Cuiabar atende empresas, clínicas, hospitais, indústrias, obras e operações recorrentes
                com produção profissional, rotina previsível e apresentação compatível com ambientes corporativos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={commercialHref} target="_blank" rel="noreferrer" className="btn-primary">
                Falar com o comercial
              </a>
              <a href="#pat" className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white hover:bg-white hover:text-cocoa">
                Entender o PAT
              </a>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Formato</p>
                <p className="mt-2 text-sm text-white/85">Atendimento contínuo para empresas e operações com rotina diária.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Entrega</p>
                <p className="mt-2 text-sm text-white/85">Montagem padronizada e foco em qualidade até o consumo.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Comercial</p>
                <p className="mt-2 text-sm text-white/85">Canal direto para orçamento, ajustes e expansão de volume.</p>
              </div>
            </div>
          </div>

          <div className="pro-immersive-stage min-h-[440px]">
            <div className="pro-immersive-aura pro-immersive-aura-primary" />
            <div className="pro-immersive-aura pro-immersive-aura-secondary" />
            {showcaseMeals.map((meal) => (
              <div key={meal.src} className={meal.className}>
                <div className="pro-immersive-shell">
                  <picture>
                    <source srcSet={meal.webpSrc} type="image/webp" />
                    <img src={meal.src} alt={meal.alt} width={meal.width} height={meal.height} loading="lazy" decoding="async" className="pro-immersive-image" />
                  </picture>
                </div>
              </div>
            ))}
            <div className="pro-immersive-note">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Integridade da operação</p>
              <p className="mt-3 text-sm leading-relaxed text-white/82">
                Embalagens seladas e montagem padronizada para apoiar qualidade, integridade e retenção de temperatura.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-4">
        {operationalPillars.map((pillar, index) => (
          <Reveal key={pillar.title} as="article" delay={index * 70} className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">{pillar.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-steel">{pillar.description}</p>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal as="section" className="card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">Perfil de atendimento</p>
          <h2 className="mt-3 font-heading text-4xl text-cocoa">Estrutura pensada para alimentação corporativa recorrente</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-steel">
            O Villa Cuiabar opera com lógica de produção profissional para contratos, demandas recorrentes e atendimento sob rotina.
            Isso permite trabalhar volume, repetição de padrão e alinhamento comercial sem perder apresentação e percepção de qualidade.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-steel">
            A proposta atende desde empresas que precisam de almoço diário até operações com múltiplos turnos, equipes externas ou
            ambientes com exigência maior de organização na entrega.
          </p>
        </Reveal>

        <Reveal as="section" delay={90} className="card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">Onde faz sentido</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {servedSegments.map((segment) => (
              <div key={segment} className="rounded-[1.5rem] border border-sand/45 bg-cream/80 px-4 py-4 text-sm leading-relaxed text-cocoa">
                {segment}
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal
        as="section"
        delay={120}
        className="overflow-hidden rounded-[2.1rem] border border-[#c8d4e6] bg-[linear-gradient(135deg,#edf3fb_0%,#f8fbff_42%,#eef2f7_100%)] p-8 shadow-[0_34px_90px_-42px_rgba(31,49,73,0.55)]"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slateBlue">Qualidade na entrega</p>
            <h2 className="font-heading text-4xl text-cocoa sm:text-5xl">Embalagens seladas com foco em qualidade, integridade e temperatura</h2>
            <p className="max-w-2xl text-base leading-relaxed text-steel">
              O ProRefeição trabalha com embalagens seladas para reforçar apresentação profissional, reduzir interferência no trajeto
              e preservar a experiência até o momento da refeição. Isso é central em operações com volume, deslocamento ou consumo fora do ponto de produção.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {packagingPoints.map((point) => (
                <div key={point} className="rounded-[1.4rem] border border-[#d5deea] bg-white/88 px-4 py-4 text-sm leading-relaxed text-cocoa">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <div className="pro-immersive-stage pro-immersive-stage-light h-full min-h-[420px]">
              <div className="pro-immersive-aura pro-immersive-aura-soft" />
              <div className="pro-immersive-card pro-immersive-card-packaging-main">
                <div className="pro-immersive-shell pro-immersive-shell-light">
                  <picture>
                    <source srcSet="/prorefeicao/hero-parmegiana.webp" type="image/webp" />
                    <img src="/prorefeicao/hero-parmegiana.png" alt="Refeição pronta com montagem padronizada" width="520" height="520" loading="lazy" decoding="async" className="pro-immersive-image" />
                  </picture>
                </div>
              </div>
              <div className="pro-immersive-card pro-immersive-card-packaging-support">
                <div className="pro-immersive-shell pro-immersive-shell-light">
                  <picture>
                    <source srcSet="/prorefeicao/costela.webp" type="image/webp" />
                    <img src="/prorefeicao/costela.png" alt="Refeição com proteína, arroz e acompanhamentos" width="520" height="520" loading="lazy" decoding="async" className="pro-immersive-image" />
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" id="pat" delay={160} className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">PAT</p>
        <div className="mt-3 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-heading text-4xl text-cocoa">Programa de Alimentação do Trabalhador com fornecimento contínuo</h2>
            <p className="mt-4 text-base leading-relaxed text-steel">
              Para empresas que operam ou pretendem operar dentro da lógica do PAT, manter fornecimento contínuo de alimentação ajuda
              a estruturar o benefício de forma mais estável, previsível e aderente à rotina da equipe.
            </p>
            <p className="mt-4 text-base leading-relaxed text-steel">
              Na prática, isso reduz improviso na jornada, melhora organização interna e fortalece a percepção de cuidado com o colaborador,
              principalmente em operações com alta recorrência, turnos ou deslocamento.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {patBenefits.map((item) => (
              <article key={item.title} className="rounded-[1.6rem] border border-sand/40 bg-cream/75 p-5">
                <h3 className="font-heading text-2xl text-cocoa">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <Reveal
          as="section"
          delay={200}
          className="overflow-hidden rounded-[2rem] border border-[#253751]/10 bg-[linear-gradient(145deg,#162336_0%,#20324b_100%)] p-8 text-white shadow-[0_34px_90px_-44px_rgba(22,35,54,0.88)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Fluxo comercial</p>
          <h2 className="mt-3 font-heading text-4xl text-white">Como o Villa Cuiabar estrutura a entrada da operação</h2>
          <ol className="mt-6 space-y-4">
            {commercialSteps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-white/82">{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" delay={240} className="card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">Canal comercial</p>
          <h2 className="mt-3 font-heading text-4xl text-cocoa">Fale com o time do ProRefeição</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel">
            Use o WhatsApp comercial do Villa Cuiabar para apresentar sua operação, pedir orçamento e alinhar escopo, frequência e
            volume. O atendimento é direto com o canal oficial do restaurante.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={commercialHref} target="_blank" rel="noreferrer" className="btn-primary">
              Chamar no WhatsApp
            </a>
            <a href="mailto:cuiabar@cuiabar.net" className="btn-secondary">
              Enviar e-mail
            </a>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-sand/45 bg-cream/70 p-5 text-sm leading-relaxed text-steel">
            Atendimento comercial via WhatsApp oficial do Villa Cuiabar. Ideal para empresas com necessidade recorrente de alimentação,
            operação escalável e padrão estável de entrega.
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProRefeicaoPage;
