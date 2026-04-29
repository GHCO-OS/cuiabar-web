import { Reveal } from '../components/Reveal';
import { burgerNSmokeBrand, burgerNSmokeMenuItems } from '../data/burgerNSmoke';
import {
  burgerNSmokeSeoPages,
  type BurgerNSmokeSeoPageKey,
} from '../data/burgerNSmokeSeoPages';
import { getRouteSeo } from '../data/seo';
import { useSeo } from '../hooks/useSeo';
import '../styles/burger-n-smoke.css';

type BurgerNSmokeSeoPageProps = {
  pageKey: BurgerNSmokeSeoPageKey;
};

const BurgerNSmokeSeoPage = ({ pageKey }: BurgerNSmokeSeoPageProps) => {
  const page = burgerNSmokeSeoPages[pageKey];
  const featuredItems = burgerNSmokeMenuItems.filter((item) => page.featuredItemIds.includes(item.id));
  const relatedPages = Object.values(burgerNSmokeSeoPages).filter((item) => item.key !== pageKey);

  useSeo(getRouteSeo(page.path));

  return (
    <article className="smoke-page">
      <nav className="smoke-nav" aria-label={`Navegacao da pagina ${page.title}`}>
        <div className="smoke-shell smoke-nav-inner">
          <a href={burgerNSmokeBrand.origin} aria-label="Abrir a home do Burger N' Smoke">
            <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
          </a>
          <div className="smoke-nav-links">
            <a href={burgerNSmokeBrand.origin}>Home</a>
            <a href={`${burgerNSmokeBrand.origin}/#cardapio`}>Cardapio</a>
            <a href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer">
              iFood
            </a>
          </div>
          <a className="smoke-link-button smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Pedir agora pelo WhatsApp do Burger N' Smoke">
            Pedir agora
          </a>
        </div>
      </nav>

      <section className="smoke-section">
        <div className="smoke-shell smoke-section-grid">
          <Reveal as="section" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">{page.eyebrow}</span>
            <h1 className="smoke-display smoke-section-title smoke-section-title--wide">{page.h1}</h1>
            <p>{page.intro}</p>

            <div className="smoke-pill-row">
              {page.chips.map((chip) => (
                <span key={chip} className="smoke-pill">
                  {chip}
                </span>
              ))}
            </div>

            <div className="smoke-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Pedir agora pelo WhatsApp do Burger N' Smoke">
                Pedir agora
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer" aria-label="Pedir no iFood do Burger N' Smoke">
                Pedir no iFood
              </a>
              <a className="smoke-ghost" href={`${burgerNSmokeBrand.origin}/#cardapio`}>
                Ver cardapio
              </a>
            </div>
          </Reveal>

          <Reveal as="section" delay={80} className="smoke-panel smoke-panel--image">
            <img
              src={burgerNSmokeBrand.heroImage}
              alt={burgerNSmokeBrand.heroImageAlt}
              loading="eager"
              {...({ fetchpriority: 'high' } as Record<string, string>)}
              decoding="async"
            />
          </Reveal>
        </div>
      </section>

      <section className="smoke-section smoke-section--compact">
        <div className="smoke-shell smoke-occasion-grid">
          {page.highlights.map((item, index) => (
            <Reveal key={item.title} as="article" delay={index * 50} className="smoke-panel smoke-occasion-card">
              <h2 className="smoke-display smoke-card-title">{item.title}</h2>
              <p>{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="smoke-section smoke-section--compact">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Escolhas da casa</span>
            <h2 className="smoke-display smoke-section-title smoke-section-title--wide">Burgers que combinam com essa busca</h2>
            <p>Se a vontade ja vem mais definida, aqui estao os burgers da casa que encaixam melhor nesse pedido.</p>
          </Reveal>

          <div className="smoke-menu-grid">
            {featuredItems.map((item, index) => (
              <Reveal key={item.id} as="article" delay={index * 50} className="smoke-menu-card">
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

      <section className="smoke-section smoke-section--compact">
        <div className="smoke-shell smoke-location-grid">
          <Reveal as="section" className="smoke-panel smoke-location-card smoke-location-copy">
            <span className="smoke-eyebrow">Base local</span>
            <h2 className="smoke-display smoke-section-title smoke-section-title--wide">Jardim Aurelia, Campinas, retirada e noite</h2>
            <p>
              O Burger N&apos; Smoke atende no Jardim Aurelia com retirada, delivery noturno e ponto facil para quem circula por Campinas.
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
                <strong>Contato</strong>
                <span>{burgerNSmokeBrand.phone}</span>
              </div>
            </div>

            <div className="smoke-location-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.mapsUrl} target="_blank" rel="noreferrer" aria-label="Ver o Burger N' Smoke no mapa">
                Ver no mapa
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.googleProfileUrl} target="_blank" rel="noreferrer" aria-label="Abrir o perfil do Burger N' Smoke no Google">
                Abrir no Google
              </a>
            </div>
          </Reveal>

          <Reveal as="section" delay={90} className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">FAQ local</span>
            <div className="smoke-faq-grid smoke-faq-grid--single">
              {page.faq.map((item) => (
                <article key={item.question} className="smoke-panel smoke-faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="smoke-section smoke-section--compact">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Explore mais</span>
            <h2 className="smoke-display smoke-section-title smoke-section-title--wide">Outros caminhos para encontrar seu burger</h2>
          </Reveal>

          <div className="smoke-search-grid">
            {relatedPages.map((item, index) => (
              <Reveal key={item.path} as="a" delay={index * 50} href={item.path} className="smoke-panel smoke-search-card">
                <span className="smoke-card-kicker">{item.eyebrow}</span>
                <h3 className="smoke-display smoke-card-title">{item.title}</h3>
                <p>{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="smoke-shell">
        <footer className="smoke-footer">
          <div>
            <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
            <small>Pedido noturno em Campinas com retirada no Jardim Aurelia e canais oficiais da casa.</small>
          </div>
          <div className="smoke-footer-links">
            <a href={burgerNSmokeBrand.origin}>Home</a>
            <a href={`${burgerNSmokeBrand.origin}/#cardapio`}>Cardapio</a>
            <a href={burgerNSmokeBrand.ifoodUrl} target="_blank" rel="noreferrer">
              iFood
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

export default BurgerNSmokeSeoPage;
