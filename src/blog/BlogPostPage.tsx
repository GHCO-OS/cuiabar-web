import { Link, Navigate, useParams } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { getKnowledgeArticleBySlug, knowledgeArticles } from '../data/knowledgeArticles';
import { useSeo } from '../hooks/useSeo';
import { blogConfig } from './blogConfig';
import { getBlogRouteSeo } from './blogSeo';
import { useCampinasWeather } from './hooks/useCampinasWeather';

export const BlogPostPage = () => {
  const { slug = '' } = useParams();
  const article = getKnowledgeArticleBySlug(slug);
  const { editorialNote } = useCampinasWeather();

  if (!article) {
    return <Navigate to="/" replace />;
  }

  useSeo(getBlogRouteSeo(`/${article.slug}`));

  return (
    <section className="container-shell py-10">
      <Reveal as="header" className="blog-post-hero" delay={30}>
        <div className="blog-post-hero__copy">
          <p className="blog-kicker">{article.eyebrow}</p>
          <h1 className="mt-4 font-heading text-6xl leading-none text-white">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/72">{article.summary}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {article.keywords.map((keyword) => (
              <span key={keyword} className="blog-chip">
                {keyword}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={blogConfig.reservationUrl} className="blog-primary-button" target="_blank" rel="noreferrer">
              Reservar mesa
            </a>
            <a href={blogConfig.menuUrl} className="blog-secondary-button" target="_blank" rel="noreferrer">
              Ver menu
            </a>
          </div>

          <p className="mt-6 text-sm text-white/58">
            Publicado em {article.date} · {article.readTime}
          </p>
        </div>

        <img src={article.image} alt={article.title} className="blog-post-hero__image" loading="eager" />
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.78fr]">
        <Reveal className="blog-surface blog-post-body" delay={70}>
          {article.sections.map((section) => (
            <article key={section.title} className="blog-post-body__section">
              <h2 className="font-heading text-4xl text-white">{section.title}</h2>
              <p className="mt-4 text-base leading-8 text-white/74">{section.body}</p>
            </article>
          ))}
        </Reveal>

        <div className="space-y-6">
          <Reveal className="blog-surface p-6" delay={100}>
            <p className="blog-footnote">Leitura de sinal</p>
            <h3 className="mt-3 font-heading text-3xl text-white">Clima editorial em Campinas</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/72">{editorialNote}</p>
          </Reveal>

          <Reveal className="blog-surface p-6" delay={120}>
            <p className="blog-footnote">Distribuicao</p>
            <h3 className="mt-3 font-heading text-3xl text-white">Empurrar agenda e bastidor sem depender da home.</h3>
            <div className="mt-5 grid gap-3">
              <a href={blogConfig.whatsappChannelUrl} className="blog-sidebar-link" target="_blank" rel="noreferrer">
                Entrar no canal do WhatsApp
              </a>
              <a href={blogConfig.agendaUrl} className="blog-sidebar-link" target="_blank" rel="noreferrer">
                Abrir agenda oficial
              </a>
              <a href={blogConfig.whatsappContactUrl} className="blog-sidebar-link" target="_blank" rel="noreferrer">
                Falar com a equipe
              </a>
            </div>
          </Reveal>

          <Reveal className="blog-surface p-6" delay={140}>
            <p className="blog-footnote">Status da iteracao</p>
            <h3 className="mt-3 font-heading text-3xl text-white">Refino em andamento, sem modulos extras.</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/72">
              Nesta fase o foco e clareza editorial e conversao. Recursos secundarios ficam pausados ate fecharmos variaveis de conteudo e navegacao.
            </p>
          </Reveal>
        </div>
      </div>

      <Reveal className="mt-10" delay={150}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="blog-footnote">Leituras relacionadas</p>
            <h2 className="mt-3 font-heading text-4xl text-white">Continue explorando o editorial da casa.</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {knowledgeArticles
            .filter((item) => item.slug !== article.slug)
            .slice(0, 3)
            .map((relatedArticle) => (
              <Link key={relatedArticle.slug} to={`/${relatedArticle.slug}`} className="blog-article-card">
                <img src={relatedArticle.image} alt={relatedArticle.title} className="blog-article-card__image" loading="lazy" />
                <div className="blog-article-card__body">
                  <p className="blog-footnote">{relatedArticle.category}</p>
                  <h3 className="mt-3 font-heading text-3xl text-white">{relatedArticle.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{relatedArticle.excerpt}</p>
                </div>
              </Link>
            ))}
        </div>
      </Reveal>
    </section>
  );
};
