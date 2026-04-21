import { useCallback, useEffect, useState } from 'react';
import { crmRequest } from '../api';
import type { BootstrapStatus, SessionPayload } from '../types';

type BootstrapState = {
  loading: boolean;
  bootstrap: BootstrapStatus | null;
  session: SessionPayload | null;
  refreshSession: () => Promise<void>;
};

export const useCrmBootstrap = (): BootstrapState => {
  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<BootstrapStatus | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);

  const refreshSession = useCallback(async () => {
    const [bootstrapResponse, sessionResponse] = await Promise.all([
      crmRequest<BootstrapStatus>('/api/bootstrap/status'),
      crmRequest<SessionPayload>('/api/auth/session'),
    ]);
    setBootstrap(bootstrapResponse);
    setSession(sessionResponse);
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshSession()
      .catch(() => {
        setBootstrap({ ok: true, requiresBootstrap: false, tokenConfigured: false });
        setSession({ ok: true, authenticated: false, user: null, csrfToken: null });
      })
      .finally(() => setLoading(false));
  }, [refreshSession]);

  return {
    loading,
    bootstrap,
    session,
    refreshSession,
  };
};
