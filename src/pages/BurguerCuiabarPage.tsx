import { Reveal } from '../components/Reveal';
import { burgerComboItems, burgerItems, burgerMenu, featuredBurgerItems } from '../data/burgerMenu';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const heroHighlights = ['Burgers marcantes', 'Combos para decidir rapido', 'Pedido em poucos cliques'];
const directPriceUrl = 'expresso.cuiabar.com';
const directPriceDisclaimer =
  'Os valores exibidos nesta pagina valem para pedidos direto na loja ou no site da loja, em expresso.cuiabar.com. Em apps como iFood e 99Food, os valores podem variar.';

const channels = [
  {
    label: 'Pedir agora',
    href: siteConfig.burguerOrderLinks.direct,
    eyebrow: 'Canal oficial',
    description: 'Abra o pedido direto no site oficial do Burger Cuiabar.',
    highlight: true,
  },
  {
    label: 'Quero pedir no iFood',
    href: siteConfig.burguerOrderLinks.ifood,
    eyebrow: 'Marketplace',
    description: 'Prefere app? Siga para a loja oficial no iFood.',
  },
  {
    label: 'Pedir na 99Food',
    href: siteConfig.burguerOrderLinks.food99,
    eyebrow: 'Marketplace',
    description: 'Mais uma rota rapida para fechar seu pedido.',
  },
];

const supportCopyById: Record<string, string> = {
  'o-raiz': 'Ideal para quem quer um burger classico, direto e sem erro.',
  'o-cuiabar': 'Suculento na medida, com montagem que entrega sabor do primeiro ao ultimo pedaco.',
  'o-brabo': 'Vai ainda melhor com frita e bebida gelada para fechar a noite.',
  'o-crocante': 'Crocancia por fora, cremosidade por dentro e equilibrio para repetir o pedido.',
  'o-parrudo': 'Ideal para quem quer um burger marcante sem pensar demais.',
  'o-colosso': 'Quando a fome aperta de verdade, ele resolve com sobra.',
  'o-insano': 'Para quem quer frango crocante em versao dupla e sem economizar na mordida.',
};

const occasionGuides = [
  {
    title: 'Quero acertar de primeira',
    description: 'Comece pelos favoritos mais faceis de escolher quando a ideia e matar a vontade sem pensar muito.',
    burgerIds: ['o-cuiabar', 'o-raiz'],
  },
  {
    title: 'Quero bacon, cheddar e impacto',
    description: 'Para quem busca mordida mais intensa, cremosa e com cara de pedido da noite.',
    burgerIds: ['o-brabo', 'o-colosso'],
  },
  {
    title: 'Quero crocancia',
    description: 'Se a vontade puxa para frango empanado, aqui estao as escolhas que entregam textura e molho.',
    burgerIds: ['o-crocante', 'o-insano'],
  },
  {
    title: 'Quero sabor mais marcante',
    description: 'Costela, molho e personalidade para quem quer um burger com mais presença.',
    burgerIds: ['o-parrudo'],
  },
];

const differentiators = [
  {
    title: 'Escolha facil',
    description: 'A pagina foi organizada para voce bater o olho, entender os favoritos e pedir sem enrolacao.',
  },
  {
    title: 'Fotos reais',
    description: 'As imagens mostram os burgers atuais da casa, com recorte pensado para leitura rapida em mobile e desktop.',
  },
  {
    title: 'Combos resolvidos',
    description: 'Quando a fome pede praticidade, os combos ajudam a fechar o pedido sem abrir varias telas.',
  },
  {
    title: 'Pedido pelo canal que preferir',
    description: 'Site oficial, iFood ou 99Food. O importante e sair da duvida e entrar no pedido.',
  },
];

const faqItems = [
  {
    question: 'Onde eu peco Burger Cuiabar?',
    answer: 'No site oficial burger.cuiabar.com, com apoio adicional no iFood e na 99Food.',
  },
  {
    question: 'Quais sao os burgers mais pedidos?',
    answer: 'O Cuiabar, O Brabo e O Colosso puxam a vitrine para quem quer decidir rapido e pedir sem erro.',
  },
  {
    question: 'Tem combo pronto?',
    answer: 'Sim. Combo Raiz e Combo Cuiabar permitem escolher frita ou bebida lata. O Combo Brabo ja vem completo com frita e bebida.',
  },
  {
    question: 'Qual burger escolher se eu quiser frango?',
    answer: 'Va de O Crocante para uma escolha mais direta, ou de O Insano se a ideia for frango empanado em versao dupla com honey mustard.',
  },
];

const findBurger = (id: string) => burgerItems.find((item) => item.id === id);

const OrderButton = ({
  href,
  label,
  highlight = false,
  external = true,
  className = '',
}: {
  href: string;
  label: string;
  highlight?: boolean;
  external?: boolean;
  className?: string;
}) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noreferrer' : undefined}
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
  <div className={`relative overflow-hidden rounded-[1.6rem] bg-[#120907] ${className}`.trim()}>
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      className="h-full w-full object-cover"
    />
  </div>
);

const PriceBadge = ({
  price,
  label = 'Preco direto na loja/site',
  className = '',
}: {
  price: string;
  label?: string;
  className?: string;
}) => (
  <div className={`rounded-[1.2rem] border border-[#f7c34a]/24 bg-[#f7c34a]/10 px-4 py-3 ${className}`.trim()}>
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7c34a]">{label}</p>
    <p className="mt-2 font-heading text-3xl leading-none text-white">{price}</p>
  </div>
);

const BurguerCuiabarPage = () => {
  useSeo(getRouteSeo('/burguer'));

  return (
    <section className="relative overflow-hidden bg-[#170d0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,195,74,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(234,83,61,0.18),transparent_20%),linear-gradient(180deg,#170d0a_0%,#1d100c_46%,#140907_100%)]" />
      <div className="container-shell relative space-y-8 py-10 sm:space-y-10 sm:py-14">
        <Reveal
          as="header"
          className="overflow-hidden rounded-[2.8rem] border border-white/8 bg-[linear-gradient(140deg,rgba(39,23,16,0.94)_0%,rgba(25,14,10,0.98)_54%,rgba(46,22,14,0.96)_100%)] p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.86)] sm:p-8 lg:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[0.98fr_1.02fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#2a1a12] shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)]">
                  <img src={siteConfig.burguerLogoUrl} alt="Logo do Burger Cuiabar" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7c34a]">Burger Cuiabar</p>
                  <p className="mt-1 font-heading text-3xl leading-none text-white sm:text-4xl">Burgers e combos para pedir agora</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {heroHighlights.map((pill) => (
                  <span key={pill} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                    {pill}
                  </span>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f7c34a]">Escolha rapida, pedido facil</p>
                <h1 className="mt-3 max-w-4xl font-heading text-5xl leading-[0.9] text-white sm:text-6xl lg:text-[5.2rem]">
                  Seu burger da noite esta aqui.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                  Peca seus favoritos, descubra os mais pedidos e monte um combo completo em poucos cliques.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir agora" highlight />
                <OrderButton href="#mais-pedidos" label="Ver os mais pedidos" external={false} />
                <OrderButton href="#combos" label="Montar meu combo" external={false} />
              </div>

              <div className="rounded-[1.7rem] border border-[#f7c34a]/24 bg-[#f7c34a]/10 px-5 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Preco de referencia da landing</p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/78">
                  Os precos exibidos nesta pagina valem para pedidos direto na loja ou pelo site da loja em{' '}
                  <a
                    href={siteConfig.orderLinks.direct}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white underline decoration-[#f7c34a]/64 underline-offset-4"
                  >
                    {directPriceUrl}
                  </a>
                  . Em apps como iFood e 99Food, os valores podem variar.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {channels.map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`rounded-[1.7rem] border p-4 transition hover:-translate-y-1 ${
                      channel.highlight ? 'border-[#f7c34a] bg-[#f7c34a] text-[#24150b]' : 'border-white/12 bg-white/6 text-white'
                    }`}
                  >
                    <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${channel.highlight ? 'text-[#24150b]/74' : 'text-white/62'}`}>
                      {channel.eyebrow}
                    </p>
                    <p className="mt-3 font-heading text-2xl leading-none">{channel.label}</p>
                    <p className={`mt-3 text-sm leading-relaxed ${channel.highlight ? 'text-[#24150b]/78' : 'text-white/72'}`}>{channel.description}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <Reveal delay={90} className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.78)]">
                <ProductImage src={burgerMenu.heroImage} alt={burgerMenu.heroImageAlt} eager className="aspect-[5/4]" />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {featuredBurgerItems.map((item) => (
                    <div key={item.id} className="rounded-[1.2rem] border border-white/10 bg-black/18 px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7c34a]">{item.name}</p>
                      <p className="mt-2 font-heading text-2xl leading-none text-white">{item.storePrice}</p>
                      <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">Preco direto na loja/site</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{supportCopyById[item.id]}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>

        <Reveal id="mais-pedidos" className="rounded-[2.5rem] border border-white/8 bg-white/5 p-8 shadow-[0_34px_100px_-58px_rgba(0,0,0,0.84)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Mais pedidos</p>
              <h2 className="mt-3 font-heading text-4xl text-white sm:text-5xl">Os burgers que puxam a fila do pedido.</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">
                Para quem quer resolver a fome sem perder tempo, estes sao os nomes que fazem a decisao ficar mais facil.
              </p>
            </div>
            <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Escolher meu burger" highlight />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featuredBurgerItems.map((item, index) => (
              <Reveal
                key={item.id}
                delay={index * 40}
                className="flex h-full flex-col rounded-[1.8rem] border border-white/8 bg-[#1b0f0b] p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.92)]"
              >
                <ProductImage src={item.image} alt={item.imageAlt} className="aspect-[4/5]" />
                <div className="mt-4 flex flex-1 flex-col">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7c34a]">{item.tagline}</p>
                  <h3 className="mt-2 font-heading text-3xl text-white">{item.name}</h3>
                  <PriceBadge price={item.storePrice} className="mt-4" />
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{item.description}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{supportCopyById[item.id]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
          <Reveal id="combos" className="rounded-[2.4rem] border border-[#f7c34a]/18 bg-[linear-gradient(145deg,rgba(247,195,74,0.18),rgba(234,83,61,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_90px_-54px_rgba(247,195,74,0.32)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Combos e para acompanhar</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Quando a ideia e pedir rapido, comecar por aqui ajuda.</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74">
              Os combos da casa foram pensados para tirar indecisao: frita ou bebida lata nas escolhas diretas, e um combo completo para quem quer tudo de uma vez.
            </p>
            <div className="mt-6 space-y-4">
              {burgerComboItems.map((combo) => (
                <article key={combo.id} className="rounded-[1.5rem] border border-white/10 bg-black/18 px-5 py-5">
                  <h3 className="font-heading text-3xl text-white">{combo.name}</h3>
                  <PriceBadge price={combo.storePrice} className="mt-4" />
                  <p className="mt-2 text-sm leading-relaxed text-white/74">{combo.description}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{combo.note} Vai ainda melhor com frita e bebida gelada.</p>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal id="ocasioes" className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Curadoria por ocasiao</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Se a fome vier com um tipo de vontade, siga por aqui.</h2>
            <div className="mt-6 grid gap-4">
              {occasionGuides.map((guide) => (
                <article key={guide.title} className="rounded-[1.5rem] border border-white/10 bg-black/16 px-5 py-5">
                  <h3 className="font-heading text-3xl text-white">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{guide.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {guide.burgerIds.map((id) => {
                      const burger = findBurger(id);
                      if (!burger) {
                        return null;
                      }

                      return (
                        <span key={id} className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/82">
                          {burger.name}
                        </span>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal id="cardapio" className="rounded-[2.5rem] border border-white/8 bg-white/5 p-8 shadow-[0_34px_100px_-58px_rgba(0,0,0,0.84)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Cardapio completo</p>
              <h2 className="mt-3 font-heading text-4xl text-white sm:text-5xl">Escolha seu burger sem sair da pagina.</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">
                Nomes claros, descricoes objetivas e leitura organizada para voce comparar rapido e fechar o pedido com confianca.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/58">{directPriceDisclaimer}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir agora" highlight />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Quero pedir no iFood" />
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
                  <PriceBadge price={item.storePrice} className="mt-4" />
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{item.description}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{supportCopyById[item.id]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
          <Reveal className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Diferenciais da pagina</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Menos duvida, mais pedido fechado.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {differentiators.map((item) => (
                <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-black/16 px-5 py-5">
                  <h3 className="font-heading text-3xl text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal className="rounded-[2.4rem] border border-white/8 bg-white/5 p-8 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">FAQ rapida</p>
            <h2 className="mt-3 font-heading text-4xl text-white">O essencial antes de pedir.</h2>
            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <article key={item.question} className="rounded-[1.5rem] border border-white/10 bg-black/16 px-5 py-5">
                  <h3 className="text-base font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{item.answer}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="rounded-[2.8rem] border border-[#f7c34a]/18 bg-[linear-gradient(135deg,rgba(247,195,74,0.18),rgba(234,83,61,0.16),rgba(255,255,255,0.04))] px-6 py-8 shadow-[0_40px_110px_-60px_rgba(247,195,74,0.34)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f7c34a]">Fechar pedido</p>
              <h2 className="mt-3 font-heading text-4xl leading-[0.92] text-white sm:text-5xl">Quando a fome aperta, o Burger Cuiabar resolve.</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74">
                Abra o canal que preferir, escolha seu burger e feche a noite com mais sabor e menos indecisao.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir agora" highlight className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.ifood} label="Quero pedir no iFood" className="w-full lg:min-w-[15rem]" />
              <OrderButton href={siteConfig.burguerOrderLinks.food99} label="Pedir na 99Food" className="w-full lg:min-w-[15rem]" />
            </div>
          </div>
        </Reveal>

        <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:hidden">
          <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-white/10 bg-[#1b0f0b]/92 p-2 backdrop-blur-xl">
            <OrderButton href={siteConfig.burguerOrderLinks.direct} label="Pedir" highlight className="px-3 py-3 text-xs" />
            <OrderButton href="#mais-pedidos" label="Favoritos" external={false} className="px-3 py-3 text-xs" />
            <OrderButton href="#combos" label="Combos" external={false} className="px-3 py-3 text-xs" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BurguerCuiabarPage;
