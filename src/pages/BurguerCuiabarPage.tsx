import { Reveal } from '../components/Reveal';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const channels = [
  {
    label: 'Pedir no site',
    href: siteConfig.burguerOrderLinks.direct,
    eyebrow: 'Site oficial',
    description: 'Abra burger.cuiabar.com e faça seu pedido direto pelo canal oficial do Burger Cuiabar.',
    accent: 'border-[#f8c23a] bg-[#f8c23a] text-[#24150b]',
  },
  {
    label: 'Pedir no iFood',
    href: siteConfig.burguerOrderLinks.ifood,
    eyebrow: 'iFood',
    description: 'Peça pelo app do iFood na loja oficial do Burger Cuiabar.',
    accent: 'border-white/12 bg-white/6 text-white',
  },
  {
    label: 'Pedir no 99Food',
    href: siteConfig.burguerOrderLinks.food99,
    eyebrow: '99Food',
    description: 'Peça pelo app da 99Food e escolha o Burger Cuiabar.',
    accent: 'border-white/12 bg-white/6 text-white',
  },
];

const featuredItems = [
  {
    title: 'X-Tradicional',
    image: '/burguer/burger-classico.png',
    note: 'Clássico, direto e fácil de escolher.',
  },
  {
    title: 'Picanha Classico',
    image: '/burguer/hero-burguer.jpg',
    note: 'Mais suculência e sabor marcante em cada mordida.',
  },
  {
    title: 'Picanha Bacon',
    image: '/burguer/burger-bacon.png',
    note: 'Cheddar, bacon e chapa quente para quem gosta de um burger mais intenso.',
  },
];

const menuSections = [
  {
    title: 'Lanches',
    items: [
      {
        name: 'X-Tradicional',
        description:
          'Pao brioche levemente tostado, hamburguer Texas sabor picanha, queijo mussarela derretido, alface americana fresca e tomate.',
      },
      {
        name: 'Picanha Classico',
        description:
          'Pao brioche tostado na chapa, hamburguer de picanha 120g, queijo mussarela derretido, alface americana, tomate fresco e baconnese.',
      },
      {
        name: 'Picanha Bacon',
        description:
          'Pao brioche tostado, hamburguer de picanha 120g, queijo cheddar cremoso, bacon em tiras crocantes, cebola salteada na manteiga e baconnese da casa.',
      },
    ],
  },
  {
    title: 'Combos',
    items: [
      {
        name: 'Combo X-Tradicional',
        description: 'X-Tradicional com opção de fritas ou bebida.',
      },
      {
        name: 'Combo Picanha Classico',
        description: 'Picanha Clássico com opção de fritas ou bebida.',
      },
      {
        name: 'Combo Picanha Bacon',
        description: 'Picanha Bacon com opção de fritas ou bebida.',
      },
      {
        name: 'Combos completos',
        description: 'Versões com burger, fritas e bebida para um pedido completo.',
      },
    ],
  },
];

const appetitePills = [
  'Brioche macio e tostado',
  'Carne preparada na chapa',
  'Montagem artesanal',
  'Entrega noturna',
];

const orderReasons = [
  'Pedido direto no site oficial burger.cuiabar.com.',
  'Atendimento também disponível no iFood e no 99Food.',
  'Disponível de quarta a sábado, a partir das 18h.',
];

const IllustrativePhotoBadge = () => (
  <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
    Foto ilustrativa
  </span>
);

const OrderButton = ({
  href,
  label,
  highlight = false,
  className = '',
}: {
  href: string;
  label: string;
  highlight?: boolean;
  className?: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
      highlight
        ? 'bg-[#f8c23a] text-[#24150b] shadow-[0_26px_60px_-28px_rgba(248,194,58,0.88)] hover:-translate-y-1 hover:bg-white'
        : 'border border-white/14 bg-white/8 text-white hover:-translate-y-1 hover:border-[#f8c23a] hover:bg-[#f8c23a] hover:text-[#24150b]'
    } ${className}`.trim()}
  >
    {label}
  </a>
);

const BurguerCuiabarPage = () => {
  useSeo(getRouteSeo('/burguer'));

  return (
    <section className="relative overflow-hidden bg-[#170d0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,194,58,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(234,83,61,0.22),transparent_20%),linear-gradient(180deg,#170d0a_0%,#1d100c_46%,#140907_100%)]" />
      <div className="absolute inset-y-0 left-0 w-24 bg-[linear-gradient(180deg,transparent,rgba(248,194,58,0.1),transparent)] blur-3xl" />
      <div className="absolute inset-y-0 right-0 w-28 bg-[linear-gradient(180deg,transparent,rgba(234,83,61,0.12),transparent)] blur-3xl" />

      <div className="container-shell relative space-y-8 py-10 sm:space-y-10 sm:py-14">
        <Reveal className="rounded-[2rem] border border-[#f8c23a]/18 bg-[linear-gradient(135deg,rgba(248,194,58,0.18),rgba(255,255,255,0.05))] p-5 shadow-[0_26px_80px_-50px_rgba(248,194,58,0.54)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f8c23a]">Peça agora</p>
              <h2 className="mt-2 font-heading text-3xl leading-[0.94] text-white sm:text-4xl">Pedidos no site oficial em burger.cuiabar.com</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/74 sm:text-base">
                Faça seu pedido pelo canal oficial do Burger Cuiabar. Atendimento por enquanto de quarta a sábado, a partir das 18h.
              </p>
            </div>
            <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site oficial" highlight className="sm:shrink-0" />
          </div>
        </Reveal>

        <Reveal
          as="header"
          className="overflow-hidden rounded-[2.8rem] border border-white/8 bg-[linear-gradient(140deg,rgba(39,23,16,0.94)_0%,rgba(25,14,10,0.98)_54%,rgba(46,22,14,0.96)_100%)] p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.86)] sm:p-8 lg:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#2a1a12] shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)]">
                  <img src="/burguer/logo-burger-cuiabar-transparent.png" alt="Logo do Burger Cuiabar" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f8c23a]">Burger Cuiabar</p>
                  <p className="mt-1 font-heading text-3xl leading-none text-white sm:text-4xl">Hambúrguer na chapa</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {appetitePills.map((pill) => (
                  <span key={pill} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                    {pill}
                  </span>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f8c23a]">Projeto especial do Cuiabar</p>
                <h1 className="mt-3 max-w-4xl font-heading text-5xl leading-[0.9] text-white sm:text-6xl lg:text-[5.6rem]">
                  Burger Cuiabar para pedir sem complicação.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                  Pão tostado, carne preparada na chapa, montagem artesanal e três caminhos diretos para fazer seu pedido.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {channels.map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`rounded-[1.7rem] border p-4 transition hover:-translate-y-1 ${channel.accent}`}
                  >
                    <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${channel.label === 'Pedir no site' ? 'text-[#24150b]/74' : 'text-white/62'}`}>
                      {channel.eyebrow}
                    </p>
                    <p className="mt-3 font-heading text-2xl leading-none">{channel.label}</p>
                    <p className={`mt-3 text-sm leading-relaxed ${channel.label === 'Pedir no site' ? 'text-[#24150b]/78' : 'text-white/72'}`}>
                      {channel.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Reveal delay={80} className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.78)]">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-[#26140d]">
                  <img src="/burguer/capa-burger-cuiabar.png" alt="Burger Cuiabar em destaque" loading="eager" className="h-64 w-full object-cover" />
                  <IllustrativePhotoBadge />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f8c23a]">Burger Cuiabar</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">Uma leitura direta da linha de burgers da casa.</p>
                </div>
              </Reveal>

              <Reveal delay={130} className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(248,194,58,0.16),rgba(255,255,255,0.04))] p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.78)] sm:translate-y-8">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-[#26140d]">
                  <img src="/burguer/burger-hand.png" alt="Burger servido na mao" loading="eager" className="h-64 w-full object-cover" />
                  <IllustrativePhotoBadge />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f8c23a]">Delivery</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">Pronto para pedir no site, no iFood ou no 99Food.</p>
                </div>
              </Reveal>

              <Reveal delay={190} className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.78)] sm:col-span-2">
                <div className="relative overflow-hidden rounded-[1.6rem] bg-[#26140d]">
                  <img src="/burguer/combo-burguer.jpg" alt="Combo de burger com fritas" loading="lazy" className="h-72 w-full object-cover" />
                  <IllustrativePhotoBadge />
                </div>
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f8c23a]">Escolha seu canal</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/74">
                      Escolha como prefere pedir e siga para o atendimento oficial do Burger Cuiabar.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Site oficial" highlight />
                    <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="iFood" />
                    <OrderButton href={siteConfig.burguerOrderLinks.food99} label="99Food" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <Reveal className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_34px_100px_-58px_rgba(0,0,0,0.84)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">Destaques do cardapio</p>
            <h2 className="mt-3 font-heading text-4xl text-white sm:text-5xl">Os destaques da casa.</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/72">
              Uma seleção rápida para abrir o apetite e ajudar na escolha.
            </p>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {featuredItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 90} className="h-full rounded-[1.7rem] border border-white/8 bg-[#21120d] p-4 shadow-[0_20px_50px_-36px_rgba(0,0,0,0.9)]">
                  <div className="relative overflow-hidden rounded-[1.4rem] bg-[#120907]">
                    <img src={item.image} alt={item.title} loading="lazy" className="h-56 w-full object-cover" />
                    <IllustrativePhotoBadge />
                  </div>
                  <div className="mt-4 min-h-[7rem]">
                    <h3 className="font-heading text-3xl text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/68">{item.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal className="rounded-[2.4rem] border border-[#f8c23a]/18 bg-[linear-gradient(145deg,rgba(248,194,58,0.18),rgba(234,83,61,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_90px_-54px_rgba(248,194,58,0.32)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">Onde pedir</p>
              <h2 className="mt-3 font-heading text-4xl text-white">Escolha a forma mais prática para você.</h2>
              <ul className="mt-6 space-y-3 text-sm text-white/76">
                {orderReasons.map((reason) => (
                  <li key={reason} className="rounded-[1.4rem] border border-white/10 bg-black/16 px-4 py-3">
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Abrir site oficial" highlight />
                <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Abrir iFood" />
                <OrderButton href={siteConfig.burguerOrderLinks.food99} label="Abrir 99Food" />
              </div>
            </Reveal>

            <Reveal delay={110} className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">Instagram</p>
              <h2 className="mt-3 font-heading text-4xl text-white">Acompanhe o Burger Cuiabar.</h2>
              <p className="mt-4 text-base leading-relaxed text-white/72">
                Siga o perfil para acompanhar novidades, fotos e avisos do Burger Cuiabar.
              </p>
              <a
                href="https://instagram.com/burgercuiabar"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm font-semibold text-[#f8c23a] underline decoration-[#ea533d] underline-offset-4"
              >
                Acompanhar o Burger Cuiabar no Instagram
              </a>
            </Reveal>
          </div>
        </div>

        <Reveal className="rounded-[2.5rem] border border-white/8 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),rgba(248,194,58,0.08),rgba(255,255,255,0.02))] p-8 shadow-[0_36px_100px_-60px_rgba(0,0,0,0.88)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">Cardápio</p>
              <h2 className="mt-3 font-heading text-4xl text-white sm:text-5xl">Escolha seu burger e siga para o pedido.</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">
                Veja os lanches e combos disponíveis e finalize pelo site oficial, iFood ou 99Food.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site" highlight />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="iFood" />
              <OrderButton href={siteConfig.burguerOrderLinks.food99} label="99Food" />
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {menuSections.map((section, sectionIndex) => (
              <Reveal key={section.title} delay={sectionIndex * 100} className="rounded-[1.8rem] border border-white/8 bg-[#1b0f0b] p-5 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.92)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">{section.title}</p>
                <h3 className="mt-2 font-heading text-3xl text-white">{section.title}</h3>
                <div className="mt-5 space-y-4">
                  {section.items.map((item) => (
                    <article key={item.name} className="rounded-[1.4rem] border border-white/8 bg-white/4 px-4 py-4">
                      <h4 className="font-heading text-2xl text-white">{item.name}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-white/68">{item.description}</p>
                    </article>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal className="rounded-[2.8rem] border border-[#f8c23a]/18 bg-[linear-gradient(135deg,rgba(248,194,58,0.18),rgba(234,83,61,0.16),rgba(255,255,255,0.04))] px-6 py-8 shadow-[0_40px_110px_-60px_rgba(248,194,58,0.34)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8c23a]">Peça agora</p>
              <h2 className="mt-3 font-heading text-4xl leading-[0.92] text-white sm:text-5xl">
                Se bateu vontade, é só escolher o canal.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74">
                Abra burger.cuiabar.com ou finalize seu pedido pelo iFood e pelo 99Food.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site oficial" highlight className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Pedir no iFood" className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.food99} label="Pedir no 99Food" className="w-full lg:min-w-[15rem]" />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:hidden">
        <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-white/10 bg-[#1b0f0b]/92 p-2 backdrop-blur-xl">
          <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Site" highlight className="px-3 py-3 text-xs" />
          <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="iFood" className="px-3 py-3 text-xs" />
          <OrderButton href={siteConfig.burguerOrderLinks.food99} label="99Food" className="px-3 py-3 text-xs" />
        </div>
      </div>
    </section>
  );
};

export default BurguerCuiabarPage;
