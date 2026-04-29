import { Reveal } from '../components/Reveal';
import {
  burgerNSmokeBrand,
  burgerNSmokeCombos,
  burgerNSmokeFaq,
  burgerNSmokeFeaturedIds,
  burgerNSmokeHighlights,
  burgerNSmokeManifesto,
  burgerNSmokeMenuItems,
  burgerNSmokeOccasions,
  burgerNSmokeOrigin,
  burgerNSmokePreviewPath,
  burgerNSmokeQuickFacts,
  burgerNSmokeReviews,
  burgerNSmokeStats,
} from '../data/burgerNSmoke';
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
    title: "Burger N' Smoke | Dark craft burgers em Campinas",
    description:
      "Burger N' Smoke em Campinas com burgers autorais, combos e uma landing pensada para pedido rapido, leitura forte e marca propria.",
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
            <a href="#cardapio">Cardapio</a>
            <a href="#combos">Combos</a>
            <a href="#manifesto">Manifesto</a>
            <a href="#localizacao">Onde estamos</a>
          </div>
          <a className="smoke-link-button smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer">
            Pedir agora
          </a>
        </div>
      </nav>

      <header className="smoke-hero" id="topo">
        <div className="smoke-shell smoke-hero-card">
          <Reveal className="smoke-hero-copy" as="div">
            <span className="smoke-eyebrow">
              Dark craft burgers · {burgerNSmokeBrand.city} / {burgerNSmokeBrand.state}
            </span>
            <h1 className="smoke-display smoke-hero-title">Carne. Fogo. Fumaca.</h1>
            <p>
              O Burger N&apos; Smoke nasce para operar com identidade propria, leitura forte e um jeito mais direto de vender burger em
              Campinas. Blend alto, fogo alto e uma pagina que segura o pedido sem poluir a decisao.
            </p>

            <div className="smoke-pill-row">
              {burgerNSmokeHighlights.map((item) => (
                <span key={item} className="smoke-pill">
                  {item}
                </span>
              ))}
            </div>

            <div className="smoke-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer">
                Pedir no WhatsApp
              </a>
              <a className="smoke-ghost" href="#cardapio">
                Ver cardapio
              </a>
            </div>

            <div className="smoke-disclaimer">
              <strong>Nova marca da hamburgueria</strong>
              <p>
                Esta landing ja nasce separada da marca anterior e foi montada para indexacao propria, leitura rapida e consolidacao do
                Burger N&apos; Smoke como frente independente.
              </p>
            </div>
          </Reveal>

          <Reveal as="div" delay={80} className="smoke-hero-visual">
            <div className="smoke-hero-image-frame">
              <img src={burgerNSmokeBrand.heroImage} alt={burgerNSmokeBrand.heroImageAlt} loading="eager" decoding="async" />
              <div className="smoke-hero-note">
                <strong>Blend alto e crosta forte</strong>
                <span>O visual da marca foi direcionado para noite, fogo e contraste, sem perder legibilidade.</span>
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

      <div className="smoke-strip" aria-hidden="true">
        <div className="smoke-strip-track">
          {[...burgerNSmokeManifesto, ...burgerNSmokeManifesto].map((item, index) => (
            <span key={`${item}-${index}`} className="smoke-strip-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="smoke-section" id="manifesto">
        <div className="smoke-shell smoke-section-grid">
          <Reveal as="section" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Manifesto da marca</span>
            <h2 className="smoke-display smoke-section-title">Bruto, direto e com cara de marca propria.</h2>
            <p>
              O Burger N&apos; Smoke nao precisa resumir a operacao inteira em um bloco genérico. A frente foi desenhada para trabalhar com
              uma oferta mais curta, mais escura e mais memoravel, com foco total em burger, combo e pedido noturno.
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
            <img src={burgerNSmokeBrand.mark} alt="Arte principal do Burger N' Smoke" loading="lazy" decoding="async" />
          </Reveal>
        </div>
      </section>

      <section className="smoke-section" id="cardapio">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Cardapio</span>
            <h2 className="smoke-display smoke-section-title">Os classicos da casa em leitura simples.</h2>
            <p>
              A estrutura do site privilegia escaneabilidade: nome forte, descricao objetiva, preco claro e imagem recortada para mobile e
              desktop sem perder impacto visual.
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
                <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer">
                  Pedir este combo
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
            <h2 className="smoke-display smoke-section-title">Se a fome vier com um tipo de vontade, siga por aqui.</h2>
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

      <section className="smoke-section">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-statement">
            <span className="smoke-eyebrow">Brand statement</span>
            <h2 className="smoke-display">Especialistas em carne, fogo e fumaca.</h2>
            <p>
              O site foi redesenhado para vender a marca nova com mais clareza: menos dependencia da marca anterior, mais assinatura visual,
              mais ritmo editorial e uma navegacao que deixa o pedido sempre por perto.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="smoke-section">
        <div className="smoke-shell">
          <Reveal as="div" className="smoke-panel smoke-section-copy">
            <span className="smoke-eyebrow">Prova social</span>
            <h2 className="smoke-display smoke-section-title">A marca precisa parecer segura antes da primeira mordida.</h2>
            <div className="smoke-review-grid">
              {burgerNSmokeReviews.map((item) => (
                <article key={item.author} className="smoke-panel smoke-review">
                  <span className="smoke-stars">★★★★★</span>
                  <p>{item.quote}</p>
                  <strong>
                    {item.author} · {item.source}
                  </strong>
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
              A operacao do Burger N&apos; Smoke trabalha com a mesma base fisica da empresa, mas a comunicacao agora vem separada, com marca
              propria, voz propria e pagina independente.
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
                <span>WhatsApp oficial, Instagram da marca e retirada no local.</span>
              </div>
            </div>

            <div className="smoke-location-actions">
              <a className="smoke-cta" href={burgerNSmokeBrand.whatsappUrl} target="_blank" rel="noreferrer">
                Chamar no WhatsApp
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.instagramUrl} target="_blank" rel="noreferrer">
                Abrir Instagram
              </a>
              <a className="smoke-ghost" href={burgerNSmokeBrand.mapsUrl} target="_blank" rel="noreferrer">
                Ver no mapa
              </a>
            </div>
          </Reveal>

          <Reveal as="section" delay={90} className="smoke-panel smoke-map-card">
            <div className="smoke-map-visual">
              <div className="smoke-map-copy">
                <img src={burgerNSmokeBrand.wordmark} alt="Burger N' Smoke" className="smoke-wordmark" />
                <p>
                  A nova marca entra no ar com uma base visual mais forte, mais limpa e mais pronta para indexacao propria em Google e redes.
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
            <h2 className="smoke-display smoke-section-title">O essencial para nao travar a decisao.</h2>
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
            <small>Dark craft burgers em Campinas / SP. Marca em operacao separada e com indexacao propria.</small>
          </div>
          <div className="smoke-footer-links">
            <a href="#cardapio">Cardapio</a>
            <a href="#combos">Combos</a>
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
