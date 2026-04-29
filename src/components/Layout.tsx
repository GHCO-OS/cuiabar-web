import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { AnalyticsTracker } from './AnalyticsTracker';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollManager } from './ScrollManager';
import { WhatsAppFloatingButton } from './WhatsAppFloatingButton';

export const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isLinksRoute = ['/links', '/bio', '/acessos'].includes(normalizedPath);
  const isBurgerNSmokeHost = hostname === 'burgersnsmoke.com' || hostname === 'www.burgersnsmoke.com';
  const isBurgerNSmokeRoute = isBurgerNSmokeHost || normalizedPath === '/burger-n-smoke';
  const isReservationsRoute = normalizedPath === '/reservas';
  const isProRefeicaoHost = hostname === 'prorefeicao.cuiabar.com';
  const isProRefeicaoSurface = isProRefeicaoHost || normalizedPath === '/prorefeicao';
  const isExperienceHubRoute = normalizedPath === '/' && !isProRefeicaoHost && !isBurgerNSmokeHost;

  if (isLinksRoute || isBurgerNSmokeRoute || isProRefeicaoSurface || isExperienceHubRoute) {
    return (
      <>
        <AnalyticsTracker />
        <ScrollManager />
        <main>
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AnalyticsTracker />
      <ScrollManager />
      <Header hideWhatsAppActions={isReservationsRoute} />
      <main className="pt-24">
        <div key={location.pathname} className="page-transition">
          {children}
        </div>
      </main>
      <Footer hideWhatsAppActions={isReservationsRoute} />
      <WhatsAppFloatingButton hide={isReservationsRoute} />
    </>
  );
};
