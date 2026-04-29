import { Reveal } from '../components/Reveal';
import {
  burgerNSmokeBrand,
  burgerNSmokeCombos,
  burgerNSmokeFaq,
  burgerNSmokeFeaturedIds,
  burgerNSmokeHighlights,
  burgerNSmokeMenuItems,
  burgerNSmokeOccasions,
  burgerNSmokeOrigin,
  burgerNSmokePreviewPath,
  burgerNSmokeQuickFacts,
  burgerNSmokeStats,
  burgerNSmokeTrustSignals,
} from '../data/burgerNSmoke';
import { burgerNSmokeSeoPageList } from '../data/burgerNSmokeSeoPages';
import { getRouteSeo } from '../data/seo';
import { useSeo } from '../hooks/useSeo';
import '../styles/burger-n-smoke.css';
const featuredItems = burgerNSmokeMenuItems.filter((item) => burgerNSmokeFeaturedIds.includes(item.id));

const isBurgerNSmokeHost = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'burgersnsmoke.com' || hostname === 'www.burgersnsmoke.com';
};

const BurgerNSmokePage = () => {
  const onBrandHost = isBurgerNSmokeHost();

  useSeo({
    ...getRouteSeo(burgerNSmokePreviewPath),
    title: "Burger N' Smoke | Hamburgueria em Campinas para pedir a noite",
    description:
      "Hamburgueria em Campinas com burgers autorais, smash burger, combos e pedido noturno no Jardim Aurelia. Peca pelo WhatsApp, iFood ou pelos canais oficiais da casa.",
    canonicalUrl: `${burgerNSmokeOrigin}/`,
    robots: onBrandHost ? 'index,follow,max-image-preview:large' : 'noindex,follow',
    siteName: "Burger N' Smoke",
    twitterHandle: '@burgernsmoke',
  });

  return (
    <article className="smoke-page">
      <nav className="smoke-nav" aria-label="Navegacao principal do Burger N' Smoke">
        <div className="smoke-shell smoke-nav-inner">
          <a href="#topo" aria-label="Voltar ao topo do Burger N' Smoke">
            <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
          </a>
          <div className="smoke-nav-links">
            <a href="#mais-pedidos">Mais pedidos</a>
            <a href="#combos">Combos</a>
            <a href="#cardapio">Cardapio</a>
            <a href="#buscas-campinas">Campinas</a>
            <a href="#localizacao">Onde estamos</a>
          </div>
          <a
            className="smoke-link-button smoke-cta"
            href={burgerNSmokeBrand.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Pedir agora pelo WhatsApp do Burger N' Smoke"
          >
            Pedir agora
          </a>
        </div>
      </nav>

      <header className="smoke-hero" id="topo">
        <div className="smoke-shell smoke-hero-card">
          <Reveal className="smoke-hero-copy" as="div">
            <span className="smoke-eyebrow">
              Hamburgueria em Campinas · {burgerNSmokeBrand.city} / {burgerNSmokeBrand.state}
            </span>
            <h1 className="smoke-display smoke-hero-title">Burger forte para pedir a noite.</h1>
            <p>
              Burgers autorais, smash burger, combos e pedido rapido no Jardim Aurelia. O Burger N&apos; Smoke foi desenhado para quem chega
              com fome e quer fechar o pedido sem perder tempo.
            </p>

            <div className="smoke-pill-row">
              {burgerNSmokeHighlights.map((item) => (
                <span key={item} className="smoke-pill">
                  {item}
                </span>
              ))}
            </div>

            <div className="smoke-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Pedir no WhatsApp do Burger N' Smoke">
                Pedir no WhatsApp
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer" aria-label="Pedir no iFood do Burger N' Smoke">
                Pedir no iFood
              </a>
              <a className="smoke-ghost" href="#cardapio">
                Ver cardapio
              </a>
            </div>

            <div className="smoke-disclaimer">
              <strong>Pedido direto e localizacao clara</strong>
              <p>
                Retirada no Jardim Aurelia, atendimento noturno e canais oficiais reunidos para quem quer pedir sem enrolacao em Campinas.
              </p>
            </div>
          </Reveal>

          <Reveal as="div" delay={80} className="smoke-hero-visual">
            <div className="smoke-hero-image-frame">
              <img
                src={burgerNSmokeBrand.heroImage}
                alt={burgerNSmokeBrand.heroImageAlt}
                loading="eager"
                {...({ fetchpriority: 'high' } as Record<string, string>)}
                decoding="async"
              />
              <div className="smoke-hero-note">
                <strong>Jardim Aurelia, Campinas</strong>
                <span>Pedido noturno com retirada, WhatsApp, iFood e rota facil para quem quer resolver rapido.</span>
              </div>
            </div>

            <div className="smoke-stat-grid">
              {burgerNSmokeStats.map((item) => (
                <div key={item.label} className="smoke-stat-card">
                  <span className="smoke-stat-value">{item.value}</span>
                  <span className="smoke-stat-label">{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </header>

      <section className="smoke-section" id="mais-pedidos">
        <div className="smoke-shell smoke-section-grid">
          <Reveal as="section" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Mais pedidos</span>
            <h2 className="smoke-display smoke-section-title">Os burgers que resolvem a vontade de primeira.</h2>
            <p>
              Quando a fome aperta, O Bruto, O Defumado e O Colosso puxam a fila. Sao os pedidos que mais ajudam a fechar a escolha rapido.
            </p>

            <div className="smoke-info-grid">
              {burgerNSmokeQuickFacts.map((item) => (
                <div key={item.label} className="smoke-info-card">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" delay={90} className="smoke-panel smoke-panel--image">
            <img src={burgerNSmokeCombos[0].image} alt={burgerNSmokeCombos[0].imageAlt} loading="lazy" decoding="async" />
          </Reveal>
        </div>
      </section>

      <section className="smoke-section" id="cardapio">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Cardapio</span>
            <h2 className="smoke-display smoke-section-title">Burgers autorais com foto, descricao e preco claro.</h2>
            <p>
              Fotos claras, descricao objetiva e preco na frente para o cliente bater o olho, escolher bem e seguir para o pedido.
            </p>
          </Reveal>

          <div className="smoke-menu-grid">
            {burgerNSmokeMenuItems.map((item, index) => (
              <Reveal key={item.id} as="article" delay={index * 45} className="smoke-menu-card">
                <div className="smoke-menu-image">
                  <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
                  <span className="smoke-badge">{item.badge}</span>
                </div>
                <div className="smoke-card-copy">
                  <span className="smoke-card-kicker">{item.category}</span>
                  <h3 className="smoke-display smoke-card-title">{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="smoke-price">{item.price}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="smoke-section" id="combos">
        <div className="smoke-shell smoke-combo-grid">
          <Reveal as="section" className="smoke-panel smoke-combo-hero">
            <div className="smoke-combo-hero-image">
              <img
                src={burgerNSmokeCombos[0].image}
                alt={burgerNSmokeCombos[0].imageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="smoke-card-copy">
              <span className="smoke-card-kicker">{burgerNSmokeCombos[0].note}</span>
              <h2 className="smoke-display smoke-card-title">{burgerNSmokeCombos[0].name}</h2>
              <p>{burgerNSmokeCombos[0].description}</p>
              <span className="smoke-price">{burgerNSmokeCombos[0].price}</span>
              <div className="smoke-actions">
                <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer" aria-label={`Pedir o ${burgerNSmokeCombos[0].name} pelo WhatsApp`}>
                  Pedir este combo
                </a>
                <a className="smoke-ghost" href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer" aria-label="Ver o cardápio do Burger N' Smoke no iFood">
                  Ver no iFood
                </a>
              </div>
            </div>
          </Reveal>

          <div className="smoke-combo-list">
            {burgerNSmokeCombos.slice(1).map((item, index) => (
              <Reveal key={item.id} as="article" delay={index * 50} className="smoke-panel smoke-side-card">
                <span className="smoke-card-kicker">{item.note}</span>
                <h3 className="smoke-display smoke-card-title">{item.name}</h3>
                <p>{item.description}</p>
                <span className="smoke-price">{item.price}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="smoke-section">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Curadoria por ocasiao</span>
            <h2 className="smoke-display smoke-section-title">Menos duvida, mais pedido fechado.</h2>
            <div className="smoke-occasion-grid">
              {burgerNSmokeOccasions.map((item) => (
                <article key={item.title} className="smoke-panel smoke-occasion-card">
                  <h3 className="smoke-display smoke-card-title">{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="smoke-section" id="buscas-campinas">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-statement">
            <span className="smoke-eyebrow">Descubra mais</span>
            <h2 className="smoke-display">Jeitos diferentes de chegar no burger certo.</h2>
            <p>
              Se a fome pede smash, burger defumado ou delivery, estes atalhos levam direto para a linha da casa que mais combina com o
              momento.
            </p>
          </Reveal>

          <div className="smoke-search-grid">
            {burgerNSmokeSeoPageList.map((item, index) => (
              <Reveal key={item.path} as="a" delay={index * 50} href={item.path} className="smoke-panel smoke-search-card">
                <span className="smoke-card-kicker">{item.eyebrow}</span>
                <h3 className="smoke-display smoke-card-title">{item.title}</h3>
                <p>{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="smoke-section">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Sinais de confianca</span>
            <h2 className="smoke-display smoke-section-title">Tudo o que o cliente precisa ver antes da primeira mordida.</h2>
            <div className="smoke-review-grid">
              {burgerNSmokeTrustSignals.map((item) => (
                <article key={item.title} className="smoke-panel smoke-review">
                  <span className="smoke-card-kicker">{item.label}</span>
                  <h3 className="smoke-display smoke-card-title">{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="smoke-section" id="localizacao">
        <div className="smoke-shell smoke-location-grid">
          <Reveal as="section" className="smoke-panel smoke-location-card smoke-location-copy">
            <span className="smoke-eyebrow">Onde estamos</span>
            <h2 className="smoke-display smoke-section-title">Campinas, noite, retirada e delivery.</h2>
            <p>
              A base do Burger N&apos; Smoke fica no Jardim Aurelia e reune retirada, WhatsApp, iFood e mapa em um so lugar para facilitar o
              pedido.
            </p>

            <div className="smoke-location-items">
              <div className="smoke-location-item">
                <strong>Endereco</strong>
                <span>{burgerNSmokeBrand.address}</span>
              </div>
              <div className="smoke-location-item">
                <strong>Horario</strong>
                <span>{burgerNSmokeBrand.serviceHours.join(' · ')}</span>
              </div>
              <div className="smoke-location-item">
                <strong>Canais</strong>
                <span>WhatsApp oficial, iFood, Instagram, Google e retirada no local.</span>
              </div>
            </div>

            <div className="smoke-location-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chamar o Burger N' Smoke no WhatsApp">
                Chamar no WhatsApp
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer" aria-label="Abrir o iFood do Burger N' Smoke">
                Abrir iFood
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.instagramUrl} target="_blank" rel="noreferrer" aria-label="Abrir o Instagram do Burger N' Smoke">
                Abrir Instagram
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.googleProfileUrl} target="_blank" rel="noreferrer" aria-label="Abrir o perfil do Burger N' Smoke no Google">
                Ver no Google
              </a>
            </div>
          </Reveal>

          <Reveal as="section" delay={90} className="smoke-panel smoke-map-card">
            <div className="smoke-map-visual">
              <div className="smoke-map-copy">
                <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
                <p>
                  Pedido noturno, burger autoral e canais oficiais reunidos para resolver a noite sem dar volta.
                </p>
                <div className="smoke-delivery-badges">
                  {featuredItems.map((item) => (
                    <span key={item.id} className="smoke-pill">
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="smoke-section">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">FAQ</span>
            <h2 className="smoke-display smoke-section-title">O essencial para fechar o pedido sem travar.</h2>
            <div className="smoke-faq-grid">
              {burgerNSmokeFaq.map((item) => (
                <article key={item.question} className="smoke-panel smoke-faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className="smoke-shell">
        <footer className="smoke-footer">
          <div>
            <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
            <small>Hamburgueria em Campinas com pedido noturno, retirada no Jardim Aurelia e canais oficiais da marca.</small>
          </div>
          <div className="smoke-footer-links">
            <a href="#cardapio">Cardapio</a>
            <a href="#combos">Combos</a>
            <a href={burgerNSmokeBrand.googleProfileUrl} target="_blank" rel="noreferrer">
              Google
            </a>
            <a href={burgerNSmokeBrand.instagramUrl} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
};

export default BurgerNSmokePage;
