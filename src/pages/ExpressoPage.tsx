import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { menuHighlights } from '../data/content';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const expressFronts = [
  {
    title: 'Marmitaria Cuiabar',
    eyebrow: 'Almoço executivo',
    description: 'Pratos do dia, marmitas, pedido direto no site e operação de almoço organizada para quem quer resolver rápido.',
    primaryLabel: 'Pedir no site',
    primaryHref: siteConfig.orderLinks.direct,
    secondaryLabel: 'Abrir iFood',
    secondaryHref: siteConfig.orderLinks.ifood,
    note: 'Ativa todos os dias, das 11h às 14:30.',
  },
  {
    title: "Burger N' Smoke",
    eyebrow: 'Hamburgueria',
    description: 'Marca própria da hamburgueria, com identidade separada, landing dedicada e operação noturna.',
    primaryLabel: 'Abrir site da marca',
    primaryHref: siteConfig.burgerNSmokeOrigin,
    secondaryLabel: 'Abrir Instagram',
    secondaryHref: siteConfig.burgerNSmokeOrderLinks.instagram,
    note: 'Operação noturna de quarta a sábado, a partir das 18h.',
  },
];

const deliveryChannels = [
  { name: 'Site próprio', href: siteConfig.orderLinks.direct, note: 'Canal direto da marmitaria e pratos do dia.' },
  { name: 'iFood', href: siteConfig.orderLinks.ifood, note: 'Loja principal da casa no delivery.' },
  { name: '99Food', href: siteConfig.orderLinks.food99, note: 'Alternativa adicional de pedido online.' },
  { name: "Burger N' Smoke", href: siteConfig.burgerNSmokeOrigin, note: 'Site e vitrine própria da hamburgueria.' },
  { name: 'Instagram do Burger N\' Smoke', href: siteConfig.burgerNSmokeOrderLinks.instagram, note: 'Canal direto da marca para novidades e contato.' },
];

const serviceWindows = [
  { label: 'Delivery almoço', value: 'Todos os dias, 11h às 14:30' },
  { label: 'Burger noite', value: 'Quarta a sábado, a partir das 18h' },
  { label: 'Retirada e apoio', value: 'WhatsApp oficial e canais próprios da casa' },
];

const ExpressoPage = () => {
  useSeo(getRouteSeo('/expresso'));

  return (
    <div className="container-shell space-y-10 py-14">
      <Reveal
        as="header"
        className="overflow-hidden rounded-[2.5rem] border border-cocoa/10 bg-[linear-gradient(160deg,rgba(255,249,237,0.98),rgba(245,224,196,0.94))] p-7 shadow-[0_34px_88px_-56px_rgba(58,39,24,0.42)] sm:p-8 lg:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-terracotta">Expresso Cuiabar</p>
            <h1 className="mt-3 max-w-3xl font-heading text-[2.8rem] leading-[0.9] text-cocoa sm:text-[4rem]">
              Delivery organizado por frente e por canal.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel sm:text-lg">
              A entrada do Expresso reúne marmitaria, a nova frente Burger N&apos; Smoke e os canais ativos de pedido para quem quer sair do
              clique e ir direto para a conversão.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="btn-primary" href={siteConfig.orderLinks.direct}>
                Pedir marmitaria
              </a>
              <a className="btn-secondary" href={siteConfig.burgerNSmokeOrigin}>
                Abrir Burger N&apos; Smoke
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {serviceWindows.map((item) => (
              <div key={item.label} className="rounded-[1.8rem] border border-cocoa/10 bg-white/74 p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-terracotta">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-cocoa">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <section className="grid gap-5 xl:grid-cols-2">
        {expressFronts.map((front, index) => {
          const secondaryIsInternal = front.secondaryHref.startsWith('/');
          const primaryIsInternal = front.primaryHref.startsWith('/');

          return (
            <Reveal key={front.title} delay={index * 90} as="article" className="card p-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-terracotta">{front.eyebrow}</p>
              <h2 className="mt-3 font-heading text-4xl text-cocoa">{front.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-steel sm:text-[0.98rem]">{front.description}</p>
              <p className="mt-5 rounded-[1.4rem] border border-cocoa/10 bg-[#fff8ec] px-4 py-3 text-sm text-cocoa">{front.note}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {primaryIsInternal ? (
                  <Link to={front.primaryHref} className="btn-primary">
                    {front.primaryLabel}
                  </Link>
                ) : (
                  <a href={front.primaryHref} className="btn-primary">
                    {front.primaryLabel}
                  </a>
                )}
                {secondaryIsInternal ? (
                  <Link to={front.secondaryHref} className="btn-secondary">
                    {front.secondaryLabel}
                  </Link>
                ) : (
                  <a href={front.secondaryHref} className="btn-secondary">
                    {front.secondaryLabel}
                  </a>
                )}
              </div>
            </Reveal>
          );
        })}
      </section>

      <Reveal as="section" className="card p-7 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-terracotta">Canais disponíveis</p>
            <h2 className="mt-3 font-heading text-4xl text-cocoa">Todos os acessos do delivery em um só bloco.</h2>
          </div>
          <a href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`} className="btn-secondary">
            Falar com a equipe
          </a>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deliveryChannels.map((channel, index) => (
            <Reveal
              key={channel.name}
              delay={index * 50}
              as="a"
              href={channel.href}
              className="rounded-[1.7rem] border border-cocoa/10 bg-[#fffaf1] p-5 transition duration-300 hover:-translate-y-1 hover:border-terracotta/28 hover:bg-white"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-terracotta">Canal</p>
              <h3 className="mt-3 font-heading text-2xl text-cocoa">{channel.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">{channel.note}</p>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <Reveal as="section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-terracotta">Destaques da casa</p>
            <h2 className="mt-3 font-heading text-4xl text-cocoa">Itens que continuam puxando pedido.</h2>
          </div>
          <Link to={siteConfig.menuPageUrl} className="btn-secondary w-fit">
            Ver menu completo
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {menuHighlights.slice(0, 3).map((item, index) => (
            <Reveal key={item.name} delay={index * 80} as="article" className="card overflow-hidden">
              <img src={item.image} alt={item.name} loading="lazy" className="media-lift h-48 w-full object-cover" />
              <div className="p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-terracotta">{item.category}</p>
                <h3 className="mt-3 font-heading text-2xl text-cocoa">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </div>
  );
};

export default ExpressoPage;
