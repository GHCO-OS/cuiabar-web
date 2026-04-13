import { defaultSeoImage, siteOrigin } from '../data/seo';

export type SeoConfig = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  imageAlt?: string;
  canonicalUrl?: string;
  keywords?: string[];
  robots?: string;
};

const DEFAULT_IMAGE = defaultSeoImage;
const SITE_NAME = 'Villa Cuiabar';
const TWITTER_HANDLE = '@cuiabar';

export const applySeo = ({
  title,
  description,
  ogTitle,
  ogDescription,
  image = DEFAULT_IMAGE,
  imageAlt = title,
  canonicalUrl,
  keywords,
  robots = 'index,follow,max-image-preview:large',
}: SeoConfig) => {
  document.title = title;

  const ensureMeta = (selector: string, attribute: 'name' | 'property', value: string) => {
    let tag = document.querySelector<HTMLMetaElement>(selector);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, value);
      document.head.appendChild(tag);
    }
    return tag;
  };

  const resolvedCanonical =
    canonicalUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined);

  ensureMeta('meta[name="description"]', 'name', 'description').setAttribute('content', description);
  ensureMeta('meta[property="og:title"]', 'property', 'og:title').setAttribute('content', ogTitle ?? title);
  ensureMeta('meta[property="og:description"]', 'property', 'og:description').setAttribute(
    'content',
    ogDescription ?? description,
  );
  ensureMeta('meta[property="og:image"]', 'property', 'og:image').setAttribute('content', image);
  ensureMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt').setAttribute('content', imageAlt);
  ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name').setAttribute('content', SITE_NAME);
  ensureMeta('meta[property="og:locale"]', 'property', 'og:locale').setAttribute('content', 'pt_BR');
  ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card').setAttribute('content', 'summary_large_image');
  ensureMeta('meta[name="twitter:site"]', 'name', 'twitter:site').setAttribute('content', TWITTER_HANDLE);
  ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title').setAttribute('content', ogTitle ?? title);
  ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description').setAttribute('content', ogDescription ?? description);
  ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image').setAttribute('content', image);
  ensureMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt').setAttribute('content', imageAlt);
  ensureMeta('meta[name="robots"]', 'name', 'robots').setAttribute('content', robots);
  ensureMeta('meta[name="keywords"]', 'name', 'keywords').setAttribute('content', keywords?.join(', ') ?? '');

  if (resolvedCanonical) {
    let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }

    canonicalTag.setAttribute('href', resolvedCanonical);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url').setAttribute('content', resolvedCanonical);
    ensureMeta('meta[name="twitter:url"]', 'name', 'twitter:url').setAttribute('content', resolvedCanonical);
  }

  ensureMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url').setAttribute(
    'content',
    image.startsWith('http') ? image : `${siteOrigin}${image.startsWith('/') ? image : `/${image}`}`,
  );
};
