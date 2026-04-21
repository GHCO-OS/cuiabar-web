import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  decorateOutboundUrl,
  trackContact,
  trackEvent,
  trackInitiateCheckout,
  trackLead,
  trackPageView,
  trackViewContent,
} from '../lib/analytics';

const getAnchor = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('a');
};

const classifyInternalPath = (pathname: string) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/agenda' || normalizedPath.startsWith('/agenda/')) {
    return { eventName: normalizedPath === '/agenda' ? 'open_agenda_page' : 'open_agenda_event_page' };
  }

  switch (normalizedPath) {
    case '/links':
      return { eventName: 'open_links_page' };
    case '/menu':
      return { eventName: 'open_menu_page' };
    case '/pesquisa':
      return { eventName: 'open_pesquisa_page' };
    case '/burguer':
      return { eventName: 'open_burguer_page' };
    case '/prorefeicao':
      return { eventName: 'open_prorefeicao_page' };
    case '/reservas':
      return { eventName: 'open_reservas_page' };
    case '/vagas':
      return { eventName: 'open_vagas_page' };
    default:
      return null;
  }
};

const normalizePathname = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

const getContentName = (pathname: string) => {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === '/agenda' || normalizedPath.startsWith('/agenda/')) {
    return 'agenda_musica_ao_vivo';
  }

  switch (normalizedPath) {
    case '/burguer':
      return 'burguer_cuiabar';
    case '/prorefeicao':
      return 'prorefeicao';
    case '/menu':
      return 'menu_villa_cuiabar';
    default:
      return 'site_cuiabar';
  }
};

export const AnalyticsTracker = () => {
  const location = useLocation();
  const normalizedPath = normalizePathname(location.pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      trackPageView(`${location.pathname}${location.search}${location.hash}`, document.title);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    switch (normalizedPath) {
      case '/menu':
        trackViewContent('menu_villa_cuiabar', { content_category: 'menu' });
        break;
      case '/agenda':
        trackViewContent('agenda_musica_ao_vivo', { content_category: 'agenda' });
        break;
      case '/burguer':
        trackViewContent('burguer_cuiabar', { content_category: 'burguer' });
        break;
      case '/prorefeicao':
        trackViewContent('prorefeicao', { content_category: 'corporativo' });
        break;
      default:
        if (normalizedPath.startsWith('/agenda/')) {
          trackViewContent('agenda_event_page', { content_category: 'agenda_event' });
          break;
        }
        break;
    }
  }, [normalizedPath]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = getAnchor(event.target);

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');

      if (!href || href.startsWith('#')) {
        return;
      }

      let url: URL;

      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      const label = anchor.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) || url.pathname;
      const contentName = getContentName(location.pathname);
      const params = {
        href: url.href,
        label,
        page_path: window.location.pathname,
        content_name: contentName,
      };

      if (url.href.includes('whatsapp.com/channel/')) {
        trackEvent('join_whatsapp_channel', params);
        return;
      }

      const normalizedHost = url.hostname.replace(/^www\./, '');

      if (normalizedHost === 'reservas.cuiabar.com') {
        const decoratedUrl = decorateOutboundUrl(url.href, {
          content_name: contentName,
          destination: 'reservas',
        });

        anchor.setAttribute('href', decoratedUrl);
        trackEvent('click_reservas_portal', {
          ...params,
          destination: 'reservas',
        });
        return;
      }

      if (url.hostname === 'wa.me') {
        const decoratedUrl = decorateOutboundUrl(url.href, {
          content_name: contentName,
          destination: 'whatsapp',
        });

        anchor.setAttribute('href', decoratedUrl);
        trackContact('whatsapp', params);
        return;
      }

      if (normalizedHost === 'cuiabar.com' && (url.pathname === '/ifood' || url.pathname === '/99food')) {
        const destination = url.pathname === '/ifood' ? 'ifood' : '99food';
        trackInitiateCheckout(destination, params);
        trackEvent(destination === 'ifood' ? 'click_order_ifood' : 'click_order_99food', params);
        return;
      }

      if (url.hostname.includes('expresso.cuiabar.com')) {
        const decoratedUrl = decorateOutboundUrl(url.href, {
          content_name: contentName,
          destination: 'expresso',
        });

        anchor.setAttribute('href', decoratedUrl);
        trackInitiateCheckout('expresso', params);
        trackEvent('click_order_site', params);
        return;
      }

      if (url.hostname.includes('ifood.com.br')) {
        const decoratedUrl = decorateOutboundUrl(url.href, {
          content_name: contentName,
          destination: 'ifood',
        });

        anchor.setAttribute('href', decoratedUrl);
        trackInitiateCheckout('ifood', params);
        trackEvent('click_order_ifood', params);
        return;
      }

      if (url.hostname.includes('99app.com')) {
        const decoratedUrl = decorateOutboundUrl(url.href, {
          content_name: contentName,
          destination: '99food',
        });

        anchor.setAttribute('href', decoratedUrl);
        trackInitiateCheckout('99food', params);
        trackEvent('click_order_99food', params);
        return;
      }

      if (url.hostname.includes('instagram.com')) {
        trackEvent('click_instagram', params);
        return;
      }

      if (url.hostname.includes('form.jotform.com')) {
        trackLead('job_application', params);
        return;
      }

      if (url.protocol === 'mailto:') {
        trackContact('email', params);
        return;
      }

      if (url.origin === window.location.origin) {
        const internal = classifyInternalPath(url.pathname);

        if (internal) {
          trackEvent(internal.eventName, params);
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
};
