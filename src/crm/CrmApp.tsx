import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { crmRequest } from './api';
import { CrmContext } from './context';
import { Button } from './components';
import { AuditPage } from './pages/AuditPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ContactsPage } from './pages/ContactsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliverabilityPage } from './pages/DeliverabilityPage';
import { ListsPage } from './pages/ListsPage';
import { LoginPage } from './pages/LoginPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { SegmentsPage } from './pages/SegmentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { UsersPage } from './pages/UsersPage';
import { WhatsAppPage } from './pages/WhatsAppPage';
import { WhatsAppAITrainingPage } from './pages/whatsapp/WhatsAppAITrainingPage';
import { WhatsAppContactsPage } from './pages/whatsapp/WhatsAppContactsPage';
import { WhatsAppConversationsPage } from './pages/whatsapp/WhatsAppConversationsPage';
import { WhatsAppHubPage } from './pages/whatsapp/WhatsAppHubPage';
import { WhatsAppTemplatesPage } from './pages/whatsapp/WhatsAppTemplatesPage';
import type { BootstrapStatus, SessionPayload } from './types';

const hasRole = (roles: string[], role: string) => roles.includes(role);

const NavIcon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
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
    audit: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 7L8 9L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

const CrmShell = ({
  basePath,
  session,
  onLogout,
  children,
}: {
  basePath: string;
  session: SessionPayload;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const isManager = hasRole(session.user?.roles ?? [], 'gerente');
  const items = [
    { label: 'Dashboard', to: withBase(basePath), icon: 'dashboard' },
    { label: 'Contatos', to: withBase(basePath, 'contacts'), icon: 'contacts' },
    { label: 'Reservas', to: withBase(basePath, 'reservations'), icon: 'reservations' },
    { label: 'Listas', to: withBase(basePath, 'lists'), icon: 'lists' },
    { label: 'Segmentos', to: withBase(basePath, 'segments'), icon: 'segments' },
    { label: 'Templates', to: withBase(basePath, 'templates'), icon: 'templates' },
    { label: 'Campanhas', to: withBase(basePath, 'campaigns'), icon: 'campaigns' },
    { label: 'Relatorios', to: withBase(basePath, 'reports'), icon: 'reports' },
    { label: 'Entregabilidade', to: withBase(basePath, 'deliverability'), icon: 'deliverability' },
    { label: '', to: '', icon: '', divider: true },
    { label: 'WhatsApp', to: withBase(basePath, 'whatsapp'), icon: 'whatsapp' },
    { label: 'Mensagens', to: withBase(basePath, 'whatsapp/conversations'), icon: 'wa_conversations' },
    { label: 'Clientes WA', to: withBase(basePath, 'whatsapp/contacts'), icon: 'wa_contacts' },
    { label: 'Treinar IA', to: withBase(basePath, 'whatsapp/ai-training'), icon: 'wa_ai' },
    { label: 'Templates WA', to: withBase(basePath, 'whatsapp/templates'), icon: 'wa_templates' },
    ...(isManager ? [
      { label: '', to: '', icon: '', divider: true },
      { label: 'Usuarios', to: withBase(basePath, 'users'), icon: 'users' },
      { label: 'Auditoria', to: withBase(basePath, 'audit'), icon: 'audit' },
      { label: 'Configuracoes', to: withBase(basePath, 'settings'), icon: 'settings' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_20%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 xl:grid-cols-[280px,1fr]">
        <aside className="border-b border-white/10 bg-slate-950/75 p-5 xl:border-b-0 xl:border-r">
          <button className="text-left" onClick={() => navigate(withBase(basePath))}>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">crm.cuiabar.com</p>
            <h1 className="mt-3 text-2xl font-semibold">Cuiabar CRM</h1>
          </button>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">{session.user?.displayName}</p>
            <p className="mt-1 text-xs text-slate-400">{session.user?.email}</p>
            <p className="mt-3 text-xs text-slate-500">Uso interno. Enviar apenas para contatos com consentimento.</p>
          </div>
          <nav className="mt-6 space-y-1.5">
            {items.map((item, idx) =>
              (item as any).divider ? (
                <div key={idx} className="my-1 h-px bg-white/5" />
              ) : (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-amber-300 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`
                  }
                  to={item.to}
                  end={item.to === withBase(basePath)}
                >
                  <NavIcon name={(item as any).icon} />
                  <span>{item.label}</span>
                </NavLink>
              )
            )}
          </nav>
          <div className="mt-8">
            <Button
              className="w-full"
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

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export const CrmApp = ({ basePath = '' }: { basePath?: string }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<BootstrapStatus | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);

  const refreshSession = async () => {
    const [bootstrapResponse, sessionResponse] = await Promise.all([
      crmRequest<BootstrapStatus>('/api/bootstrap/status'),
      crmRequest<SessionPayload>('/api/auth/session'),
    ]);
    setBootstrap(bootstrapResponse);
    setSession(sessionResponse);
  };

  useEffect(() => {
    setLoading(true);
    refreshSession()
      .catch(() => {
        setBootstrap({ ok: true, requiresBootstrap: false, tokenConfigured: false });
        setSession({ ok: true, authenticated: false, user: null, csrfToken: null });
      })
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const contextValue = useMemo(
    () => ({
      session,
      bootstrap,
      csrfToken: session?.csrfToken ?? null,
      user: session?.user ?? null,
      refreshSession,
    }),
    [bootstrap, session],
  );

  const requireSetup = bootstrap?.requiresBootstrap;
  const isAuthenticated = session?.authenticated;
  const loginPath = withBase(basePath, 'login');
  const setupPath = withBase(basePath, 'setup');

  if (loading || !bootstrap || !session) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300">Carregando CRM...</div>;
  }

  const protectedElement = (page: React.ReactNode, managerOnly = false) => {
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
        {page}
      </CrmShell>
    );
  };

  return (
    <CrmContext.Provider value={contextValue}>
      <Routes>
        <Route path={setupPath} element={requireSetup ? <BootstrapPage onCompleted={refreshSession} /> : <Navigate to={withBase(basePath)} replace />} />
        <Route path={loginPath} element={!requireSetup && !isAuthenticated ? <LoginPage onLoggedIn={refreshSession} /> : <Navigate to={withBase(basePath)} replace />} />
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
        <Route path={withBase(basePath, 'audit')} element={protectedElement(<AuditPage />, true)} />
        <Route path={withBase(basePath, 'settings')} element={protectedElement(<SettingsPage />, true)} />
        <Route path="*" element={<Navigate to={requireSetup ? setupPath : isAuthenticated ? withBase(basePath) : loginPath} replace />} />
      </Routes>
    </CrmContext.Provider>
  );
};
