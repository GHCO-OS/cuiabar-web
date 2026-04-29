import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { menuHighlights } from '../data/content';
import { getRouteSeo } from '../data/seo';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const channels = [
  { name: 'Site próprio', link: siteConfig.orderLinks.direct },
  { name: 'iFood', link: siteConfig.orderLinks.ifood },
  { name: '99Food', link: siteConfig.orderLinks.food99 },
];

const PedidosOnlinePage = () => {
  useSeo(getRouteSeo('/pedidos-online'));

  return (
    <section className="container-shell space-y-10 py-14">
      <Reveal as="header" className="card p-8">
        <h1 className="font-heading text-5xl">Delivery em Campinas para pedir do seu jeito</h1>
        <p className="mt-3 text-steel">Peça pelo canal que preferir e confira o cardápio completo do Villa Cuiabar.</p>
      </Reveal>
      <Reveal
        as="a"
        href={siteConfig.burgerNSmokeOrigin}
        target="_blank"
        rel="noreferrer"
        className="card block border-2 border-[rgba(234,83,61,0.28)] bg-[linear-gradient(135deg,rgba(255,251,214,0.96),rgba(252,242,208,0.92))] p-8 transition-transform duration-300 hover:-translate-y-1"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">Burger N&apos; Smoke</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-4xl text-brand-ink">Burger N&apos; Smoke</h2>
            <p className="mt-2 max-w-2xl text-steel">Abra a nova marca da hamburgueria com landing própria, canal direto e operação noturna a partir das 18h.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white">
            A partir das 18h
          </span>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel, index) => (
          <Reveal key={channel.name} as="a" delay={index * 70} href={channel.link} target="_blank" rel="noreferrer" className="card p-8">
            <h2 className="font-heading text-3xl">{channel.name}</h2>
            <p className="mt-2 text-steel">Acessar canal de pedidos</p>
          </Reveal>
        ))}
      </div>
      <Reveal as="section" delay={120}>
        <h2 className="font-heading text-3xl">Mais vendidos</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {menuHighlights.map((item, index) => (
            <Reveal key={item.name} as="article" delay={index * 70} className="card overflow-hidden">
              <img src={item.image} alt={item.name} loading="lazy" className="media-lift h-44 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-heading text-2xl">{item.name}</h3>
                <p className="text-steel">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Link to={siteConfig.menuPageUrl} className="btn-secondary mt-6 inline-flex">
          Abrir menu completo
        </Link>
      </Reveal>
    </section>
  );
};

export default PedidosOnlinePage;
