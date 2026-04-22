import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const BLOG_PUBLIC_URL = 'https://blog.cuiabar.com';

const buildBlogUrl = (slug?: string) => {
  if (!slug) {
    return `${BLOG_PUBLIC_URL}/`;
  }

  return `${BLOG_PUBLIC_URL}/${slug}`;
};

const BlogSubdomainRedirectPage = () => {
  const { slug } = useParams();
  const destination = buildBlogUrl(slug);

  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return (
    <section className="container-shell py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-terracotta">Redirecionando</p>
      <h1 className="mt-3 font-heading text-4xl text-cocoa">Abrindo o blog no subdominio oficial.</h1>
      <p className="mt-4 max-w-2xl text-steel">
        Se o redirecionamento nao acontecer automaticamente, acesse{' '}
        <a href={destination} className="font-semibold text-cocoa underline">
          {destination}
        </a>
        .
      </p>
    </section>
  );
};

export default BlogSubdomainRedirectPage;
