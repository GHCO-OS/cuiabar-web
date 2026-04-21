import { useEffect, useMemo, useState } from 'react';
import Base44MeuCuiabarApp from '@meucuiabar/App.jsx';
import './base44/index.css';
import { crmRequest } from './api';
import { mapSessionUserToMeuCuiabarUser, MeuCuiabarSessionContext } from './context';
import { MeuCuiabarLoginPage } from './pages/MeuCuiabarLoginPage';
import type { MeuCuiabarSessionPayload } from './types';

const unauthenticatedSession: MeuCuiabarSessionPayload = {
  ok: true,
  authenticated: false,
  user: null,
  csrfToken: null,
};

export const MeuCuiabarApp = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<MeuCuiabarSessionPayload>(unauthenticatedSession);

  const refreshSession = async () => {
    const response = await crmRequest<MeuCuiabarSessionPayload>('/api/auth/session');
    setSession(response);
  };

  useEffect(() => {
    refreshSession()
      .catch(() => setSession(unauthenticatedSession))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    if (session.csrfToken) {
      await crmRequest('/api/auth/logout', { method: 'POST' }, session.csrfToken);
    }
    setSession(unauthenticatedSession);
  };

  const contextValue = useMemo(
    () => ({
      session,
      csrfToken: session.csrfToken,
      currentUser: mapSessionUserToMeuCuiabarUser(session),
      isMaster: Boolean(session.user?.roles?.includes('gerente')),
      refreshSession,
      logout,
    }),
    [session],
  );

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300">Carregando MeuCuiabar...</div>;
  }

  if (!session.authenticated) {
    return <MeuCuiabarLoginPage onLoggedIn={refreshSession} />;
  }

  return (
    <MeuCuiabarSessionContext.Provider value={contextValue}>
      <Base44MeuCuiabarApp />
    </MeuCuiabarSessionContext.Provider>
  );
};
