import { Reveal } from '../components/Reveal';
import { burgerComboItems, burgerItems, burgerMenu, featuredBurgerItems } from '../data/burgerMenu';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const channels = [
  {
    label: 'Pedir no site',
    href: siteConfig.burguerOrderLinks.direct,
    eyebrow: 'Canal oficial',
    description: 'Abra burger.cuiabar.com e faça seu pedido direto no canal oficial do Burger Cuiabar.',
    accent: 'border-[#f7c34a] bg-[#f7c34a] text-[#24150b]',
  },
  {
    label: 'Pedir no iFood',
    href: siteConfig.burguerOrderLinks.ifood,
    eyebrow: 'Marketplace',
    description: 'Peça pelo app do iFood na loja oficial do Burger Cuiabar.',
    accent: 'border-white/12 bg-white/6 text-white',
  },
  {
    label: 'Pedir no 99Food',
    href: siteConfig.burguerOrderLinks.food99,
    eyebrow: 'Marketplace',
    description: 'Peça pelo app da 99Food e escolha o Burger Cuiabar.',
    accent: 'border-white/12 bg-white/6 text-white',
  },
];

const serviceHighlights = ['7 burgers no cardapio atual', '3 combos confirmados no PDF', 'Fotos novas otimizadas em WebP', 'Pedidos diretos no host oficial'];

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
        ? 'bg-[#f7c34a] text-[#24150b] shadow-[0_24px_60px_-26px_rgba(247,195,74,0.8)] hover:-translate-y-1 hover:bg-white'
        : 'border border-white/14 bg-white/8 text-white hover:-translate-y-1 hover:border-[#f7c34a] hover:bg-[#f7c34a] hover:text-[#24150b]'
    } ${className}`.trim()}
  >
    {label}
  </a>
);

const ProductImage = ({
  src,
  alt,
  eager = false,
  className = '',
}: {
  src: string;
  alt: string;
  eager?: boolean;
  className?: string;
}) => (
  <div className={`relative overflow-hidden rounded-[1.5rem] bg-[#120907] ${className}`.trim()}>
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      className="h-full w-full object-cover"
    />
    <span className="absolute bottom-3 right-3 rounded-full border border-white/14 bg-black/55 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
      Cardapio atual
    </span>
  </div>
);

const BurguerCuiabarPage = () => {
  useSeo(getRouteSeo('/burguer'));

  return (
    <section className="relative overflow-hidden bg-[#170d0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,195,74,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(234,83,61,0.22),transparent_20%),linear-gradient(180deg,#170d0a_0%,#1d100c_46%,#140907_100%)]" />
      <div className="container-shell relative space-y-8 py-10 sm:space-y-10 sm:py-14">
        <Reveal className="rounded-[2rem] border border-[#f7c34a]/18 bg-[linear-gradient(135deg,rgba(247,195,74,0.18),rgba(255,255,255,0.05))] p-5 shadow-[0_26px_80px_-50px_rgba(247,195,74,0.54)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f7c34a]">Burger Cuiabar atualizado</p>
              <h2 className="mt-2 font-heading text-3xl leading-[0.94] text-white sm:text-4xl">Fotos, nomes e descricoes alinhados ao cardapio atual.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/74 sm:text-base">
                A pagina agora reflete o cardapio v2 do Burger Cuiabar, com sete burgers confirmados no PDF e imagens novas tratadas para carregamento rapido.
              </p>
            </div>
            <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site oficial" highlight className="sm:shrink-0" />
          </div>
        </Reveal>

        <Reveal
          as="header"
          className="overflow-hidden rounded-[2.8rem] border border-white/8 bg-[linear-gradient(140deg,rgba(39,23,16,0.94)_0%,rgba(25,14,10,0.98)_54%,rgba(46,22,14,0.96)_100%)] p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.86)] sm:p-8 lg:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#2a1a12] shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)]">
                  <img src={siteConfig.burguerLogoUrl} alt="Logo do Burger Cuiabar" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7c34a]">Burger Cuiabar</p>
                  <p className="mt-1 font-heading text-3xl leading-none text-white sm:text-4xl">Cardapio atual do delivery</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {serviceHighlights.map((pill) => (
                  <span key={pill} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                    {pill}
                  </span>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f7c34a]">Do O Raiz ao O Insano</p>
                <h1 className="mt-3 max-w-4xl font-heading text-5xl leading-[0.9] text-white sm:text-6xl lg:text-[5.4rem]">
                  Sete burgers atualizados e tres combos confirmados.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                  O host burger.cuiabar.com agora mostra os nomes corretos, as descricoes oficiais do cardapio e fotos novas derivadas do material mestre do Burger Cuiabar.
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

            <div className="grid gap-4">
              <Reveal delay={90} className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.78)]">
                <ProductImage src={burgerMenu.heroImage} alt={burgerMenu.heroImageAlt} eager className="aspect-[5/4]" />
                <div className="mt-4 flex flex-wrap gap-3">
                  {featuredBurgerItems.map((item) => (
                    <div key={item.id} className="rounded-full border border-white/10 bg-black/18 px-4 py-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7c34a]">{item.name}</p>
                      <p className="mt-1 text-xs text-white/72">{item.tagline}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>

        <Reveal className="rounded-[2.5rem] border border-white/8 bg-white/5 p-8 shadow-[0_34px_100px_-58px_rgba(0,0,0,0.84)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Burgers do cardapio atual</p>
              <h2 className="mt-3 font-heading text-4xl text-white sm:text-5xl">As opcoes da casa, uma a uma.</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">
                As descricoes abaixo foram atualizadas a partir do PDF informado e as imagens foram tratadas para recorte consistente e carregamento rapido no site.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site" highlight />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="iFood" />
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {burgerItems.map((item, index) => (
              <Reveal
                key={item.id}
                delay={index * 40}
                className="flex h-full flex-col rounded-[1.8rem] border border-white/8 bg-[#1b0f0b] p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.92)]"
              >
                <ProductImage src={item.image} alt={item.imageAlt} className="aspect-[4/5]" />
                <div className="mt-4 flex flex-1 flex-col">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7c34a]">{item.tagline}</p>
                  <h3 className="mt-2 font-heading text-3xl text-white">{item.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <Reveal className="rounded-[2.4rem] border border-[#f7c34a]/18 bg-[linear-gradient(145deg,rgba(247,195,74,0.18),rgba(234,83,61,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_90px_-54px_rgba(247,195,74,0.32)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Combos confirmados</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Os tres combos que vieram no PDF.</h2>
            <div className="mt-6 space-y-4">
              {burgerComboItems.map((combo) => (
                <article key={combo.id} className="rounded-[1.5rem] border border-white/10 bg-black/18 px-5 py-5">
                  <h3 className="font-heading text-3xl text-white">{combo.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/74">{combo.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f7c34a]">{combo.note}</p>
                </article>
              ))}
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Canais oficiais</p>
              <h2 className="mt-3 font-heading text-4xl text-white">Pedido direto e marketplaces.</h2>
              <ul className="mt-6 space-y-3 text-sm text-white/76">
                <li className="rounded-[1.4rem] border border-white/10 bg-black/16 px-4 py-3">Canal oficial em burger.cuiabar.com.</li>
                <li className="rounded-[1.4rem] border border-white/10 bg-black/16 px-4 py-3">Atendimento complementar no iFood.</li>
                <li className="rounded-[1.4rem] border border-white/10 bg-black/16 px-4 py-3">Operacao complementar no 99Food.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Abrir site oficial" highlight />
                <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Abrir iFood" />
                <OrderButton href={siteConfig.burguerOrderLinks.food99} label="Abrir 99Food" />
              </div>
            </Reveal>

            <Reveal delay={110} className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Instagram</p>
              <h2 className="mt-3 font-heading text-4xl text-white">Acompanhe o Burger Cuiabar.</h2>
              <p className="mt-4 text-base leading-relaxed text-white/72">
                O perfil segue como apoio para novidades, campanhas e bastidores da operacao do Burger Cuiabar.
              </p>
              <a
                href={burgerMenu.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm font-semibold text-[#f7c34a] underline decoration-[#ea533d] underline-offset-4"
              >
                Acompanhar o Burger Cuiabar no Instagram
              </a>
            </Reveal>
          </div>
        </div>

        <Reveal className="rounded-[2.8rem] border border-[#f7c34a]/18 bg-[linear-gradient(135deg,rgba(247,195,74,0.18),rgba(234,83,61,0.16),rgba(255,255,255,0.04))] px-6 py-8 shadow-[0_40px_110px_-60px_rgba(247,195,74,0.34)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Pedido agora</p>
              <h2 className="mt-3 font-heading text-4xl leading-[0.92] text-white sm:text-5xl">
                Cardapio atualizado, fotos novas e clique direto para o pedido.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74">
                Se bateu vontade, abra o canal oficial ou siga para iFood e 99Food com a mesma identidade visual do Burger Cuiabar.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir no site oficial" highlight className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Pedir no iFood" className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.food99} label="Pedir no 99Food" className="w-full lg:min-w-[15rem]" />
            </div>
          </div>
        </Reveal>

        <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:hidden">
          <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-white/10 bg-[#1b0f0b]/92 p-2 backdrop-blur-xl">
            <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Site" highlight className="px-3 py-3 text-xs" />
            <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="iFood" className="px-3 py-3 text-xs" />
            <OrderButton href={siteConfig.burguerOrderLinks.food99} label="99Food" className="px-3 py-3 text-xs" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BurguerCuiabarPage;
