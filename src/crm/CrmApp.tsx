import { Suspense, lazy, useMemo, type ReactNode } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { crmRequest } from './api';
import { ATENDE_HOST_LABEL, ATENDE_PRODUCT_NAME, ATENDE_PRODUCT_TAGLINE } from './branding';
import { Button } from './components';
import { CrmContext } from './context';
import { useCrmBootstrap } from './hooks/useCrmBootstrap';
import type { SessionPayload } from './types';

const BootstrapPage = lazy(() => import('./pages/BootstrapPage').then((module) => ({ default: module.BootstrapPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((module) => ({ default: module.ContactsPage })));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage').then((module) => ({ default: module.ReservationsPage })));
const ListsPage = lazy(() => import('./pages/ListsPage').then((module) => ({ default: module.ListsPage })));
const SegmentsPage = lazy(() => import('./pages/SegmentsPage').then((module) => ({ default: module.SegmentsPage })));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage').then((module) => ({ default: module.TemplatesPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then((module) => ({ default: module.CampaignsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const DeliverabilityPage = lazy(() => import('./pages/DeliverabilityPage').then((module) => ({ default: module.DeliverabilityPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage').then((module) => ({ default: module.WhatsAppPage })));
const WhatsAppAITrainingPage = lazy(() => import('./pages/whatsapp/WhatsAppAITrainingPage').then((module) => ({ default: module.WhatsAppAITrainingPage })));
const WhatsAppContactsPage = lazy(() => import('./pages/whatsapp/WhatsAppContactsPage').then((module) => ({ default: module.WhatsAppContactsPage })));
const WhatsAppConversationsPage = lazy(() => import('./pages/whatsapp/WhatsAppConversationsPage').then((module) => ({ default: module.WhatsAppConversationsPage })));
const WhatsAppHubPage = lazy(() => import('./pages/whatsapp/WhatsAppHubPage').then((module) => ({ default: module.WhatsAppHubPage })));
const WhatsAppTemplatesPage = lazy(() => import('./pages/whatsapp/WhatsAppTemplatesPage').then((module) => ({ default: module.WhatsAppTemplatesPage })));

const hasRole = (roles: string[], role: string) => roles.includes(role);

const NavIcon = ({ name }: { name: string }) => {
  const icons: Record<string, ReactNode> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="6.5" y="1" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="12" y="1" width="4.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="1" y="6.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="6.5" y="6.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="12" y="6.5" width="4.5" height="3.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="1" y="12" width="3.5" height="4.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="6.5" y="12" width="3.5" height="4.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/><rect x="12" y="12" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.5" rx="0.5"/></svg>,
    contacts: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 16c0-1.5 2.7-3 6-3s6 1.5 6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    reservations: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="1" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5"/><line x1="13" y1="1" x2="13" y2="5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    lists: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="3" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    segments: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="5" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    templates: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    campaigns: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L12 8H6L9 2Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="8" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    reports: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="10" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5"/><rect x="7.5" y="6" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="2" width="3" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    deliverability: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L14 6V14H4V6L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 9L12 12L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 15c0-1.5 1.5-3 3-3h4c1.5 0 3 1.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15c0-1.5 1.5-3 3-3h4c1.5 0 3 1.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M9 3V2M9 16V15M15 9H16M2 9H3M13 13L13.7 13.7M4.3 4.3L5 5M13 5L13.7 4.3M4.3 13.7L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    whatsapp: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9.5c.5 1 1.5 2 2.5 2.5s2.5-.5 2.5-1.5S9.5 9 8.5 9 7 7.5 7 6.5 8 5 9 5c.8 0 1.5.4 2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    wa_conversations: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 2.5V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    wa_contacts: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 15c0-1.5 2-3 5-3s5 1.5 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 8l1.5 1.5L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    wa_ai: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    wa_templates: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="6.5" x2="16" y2="6.5" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  };

  return <span className="inline-flex items-center justify-center text-slate-300">{icons[name] || null}</span>;
};

const withBase = (basePath: string, path = '') => {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return path ? `${normalizedBase}${normalizedPath}` || '/' : normalizedBase || '/';
};

const LoadingScreen = ({ label }: { label: string }) => (
  <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300 [font-family:Inter,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
    {label}
  </div>
);

type NavItem = { label: string; to: string; icon: string; divider?: boolean };

const CrmShell = ({
  basePath,
  session,
  onLogout,
  children,
}: {
  basePath: string;
  session: SessionPayload;
  onLogout: () => Promise<void>;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const isManager = hasRole(session.user?.roles ?? [], 'gerente');
  const items: NavItem[] = [
    { label: 'Dashboard', to: withBase(basePath), icon: 'dashboard' },
    { label: 'Contatos', to: withBase(basePath, 'contacts'), icon: 'contacts' },
    { label: 'Reservas', to: withBase(basePath, 'reservations'), icon: 'reservations' },
    { label: 'Listas', to: withBase(basePath, 'lists'), icon: 'lists' },
    { label: 'Segmentos', to: withBase(basePath, 'segments'), icon: 'segments' },
    { label: 'Templates', to: withBase(basePath, 'templates'), icon: 'templates' },
    { label: 'Campanhas', to: withBase(basePath, 'campaigns'), icon: 'campaigns' },
    { label: 'Relatórios', to: withBase(basePath, 'reports'), icon: 'reports' },
    { label: 'Entregabilidade', to: withBase(basePath, 'deliverability'), icon: 'deliverability' },
    { label: '', to: '', icon: '', divider: true },
    { label: 'WhatsApp', to: withBase(basePath, 'whatsapp'), icon: 'whatsapp' },
    { label: 'Mensagens', to: withBase(basePath, 'whatsapp/conversations'), icon: 'wa_conversations' },
    { label: 'Clientes WA', to: withBase(basePath, 'whatsapp/contacts'), icon: 'wa_contacts' },
    { label: 'Treinar IA', to: withBase(basePath, 'whatsapp/ai-training'), icon: 'wa_ai' },
    { label: 'Templates WA', to: withBase(basePath, 'whatsapp/templates'), icon: 'wa_templates' },
    ...(isManager
      ? [
          { label: '', to: '', icon: '', divider: true },
          { label: 'Usuários', to: withBase(basePath, 'users'), icon: 'users' },
          { label: 'Configurações', to: withBase(basePath, 'settings'), icon: 'settings' },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white [font-family:Inter,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-sky-600 focus:px-3 focus:py-2 focus:text-white" href="#crm-main-content">
        Pular para conteúdo
      </a>
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 xl:grid-cols-[260px,1fr]">
        <aside className="border-b border-white/10 bg-slate-950 p-5 xl:sticky xl:top-0 xl:h-screen xl:border-b-0 xl:border-r">
          <button className="text-left" onClick={() => navigate(withBase(basePath))}>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">{ATENDE_HOST_LABEL}</p>
            <h1 className="mt-3 text-2xl font-semibold">{ATENDE_PRODUCT_NAME}</h1>
            <p className="mt-2 text-sm text-slate-400">{ATENDE_PRODUCT_TAGLINE}</p>
          </button>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">{session.user?.displayName}</p>
            <p className="mt-1 break-all text-xs text-slate-400">{session.user?.email}</p>
            <p className="mt-3 text-xs text-slate-500">Uso interno. Atendimento e relacionamento só para contatos com base legal e consentimento.</p>
          </div>

          <nav className="mt-6 space-y-1.5" aria-label="Navegação CRM">
            {items.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="my-1 h-px bg-white/5" />
              ) : (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      isActive ? 'bg-amber-300 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`
                  }
                  to={item.to}
                  end={item.to === withBase(basePath)}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ),
            )}
          </nav>

          <div className="mt-6 flex gap-2 xl:flex-col">
            <a href="https://cuiabar.com" target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10">
              Site público ↗
            </a>
            <Button
              className="flex-1"
              variant="ghost"
              onClick={async () => {
                await onLogout();
                navigate(withBase(basePath, 'login'));
              }}
            >
              Sair
            </Button>
          </div>
        </aside>

        <main id="crm-main-content" className="p-4 md:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const CrmApp = ({ basePath = '' }: { basePath?: string }) => {
  const { loading, bootstrap, session, refreshSession } = useCrmBootstrap();

  const contextValue = useMemo(
    () => ({
      session,
      bootstrap,
      csrfToken: session?.csrfToken ?? null,
      user: session?.user ?? null,
      refreshSession,
    }),
    [bootstrap, session, refreshSession],
  );

  const requireSetup = bootstrap?.requiresBootstrap;
  const isAuthenticated = session?.authenticated;
  const loginPath = withBase(basePath, 'login');
  const setupPath = withBase(basePath, 'setup');

  if (loading || !bootstrap || !session) {
    return <LoadingScreen label="Carregando Cuiabar Atende..." />;
  }

  const protectedElement = (page: ReactNode, managerOnly = false) => {
    if (requireSetup) {
      return <Navigate to={setupPath} replace />;
    }
    if (!isAuthenticated) {
      return <Navigate to={loginPath} replace />;
    }
    if (managerOnly && !hasRole(session.user?.roles ?? [], 'gerente')) {
      return <Navigate to={withBase(basePath)} replace />;
    }

    return (
      <CrmShell
        basePath={basePath}
        session={session}
        onLogout={async () => {
          await crmRequest('/api/auth/logout', { method: 'POST' }, session.csrfToken);
          await refreshSession();
        }}
      >
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-300">Carregando módulo...</div>}>{page}</Suspense>
      </CrmShell>
    );
  };

  return (
    <CrmContext.Provider value={contextValue}>
      <Routes>
        <Route path={setupPath} element={requireSetup ? <BootstrapPage onCompleted={refreshSession} /> : <Navigate to={withBase(basePath)} replace />} />
        <Route
          path={loginPath}
          element={
            !requireSetup && !isAuthenticated ? (
              <LoginPage
                onLoggedIn={refreshSession}
                productLabel={ATENDE_PRODUCT_NAME}
                productDescription={ATENDE_PRODUCT_TAGLINE}
              />
            ) : (
              <Navigate to={withBase(basePath)} replace />
            )
          }
        />
        <Route path={withBase(basePath)} element={protectedElement(<DashboardPage />)} />
        <Route path={withBase(basePath, 'contacts')} element={protectedElement(<ContactsPage />)} />
        <Route path={withBase(basePath, 'reservations')} element={protectedElement(<ReservationsPage />)} />
        <Route path={withBase(basePath, 'lists')} element={protectedElement(<ListsPage />)} />
        <Route path={withBase(basePath, 'segments')} element={protectedElement(<SegmentsPage />)} />
        <Route path={withBase(basePath, 'templates')} element={protectedElement(<TemplatesPage />)} />
        <Route path={withBase(basePath, 'campaigns')} element={protectedElement(<CampaignsPage />)} />
        <Route path={withBase(basePath, 'reports')} element={protectedElement(<ReportsPage />)} />
        <Route path={withBase(basePath, 'deliverability')} element={protectedElement(<DeliverabilityPage />)} />
        <Route path={withBase(basePath, 'whatsapp')} element={protectedElement(<WhatsAppPage />)} />
        <Route path={withBase(basePath, 'whatsapp/hub')} element={protectedElement(<WhatsAppHubPage basePath={basePath} />)} />
        <Route path={withBase(basePath, 'whatsapp/conversations')} element={protectedElement(<WhatsAppConversationsPage />)} />
        <Route path={withBase(basePath, 'whatsapp/contacts')} element={protectedElement(<WhatsAppContactsPage />)} />
        <Route path={withBase(basePath, 'whatsapp/ai-training')} element={protectedElement(<WhatsAppAITrainingPage />)} />
        <Route path={withBase(basePath, 'whatsapp/templates')} element={protectedElement(<WhatsAppTemplatesPage />)} />
        <Route path={withBase(basePath, 'users')} element={protectedElement(<UsersPage />, true)} />
        <Route path={withBase(basePath, 'audit')} element={<Navigate to="/meucuiabar/auditoria" replace />} />
        <Route path={withBase(basePath, 'settings')} element={protectedElement(<SettingsPage />, true)} />
        <Route path="*" element={<Navigate to={requireSetup ? setupPath : isAuthenticated ? withBase(basePath) : loginPath} replace />} />
      </Routes>
    </CrmContext.Provider>
  );
};
