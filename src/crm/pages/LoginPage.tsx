import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmRequest } from '../api';

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

type AuthConfig = {
  authMode: 'google_only' | 'local_password';
  googleClientId: string | null;
  allowedEmails: string[];
};

export const LoginPage = ({ onLoggedIn }: { onLoggedIn: () => Promise<void> }) => {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    crmRequest<{ ok: true } & AuthConfig>('/api/auth/config')
      .then((response) => setConfig({ authMode: response.authMode, googleClientId: response.googleClientId, allowedEmails: response.allowedEmails }))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Falha ao carregar a autenticacao.'));
  }, []);

  useEffect(() => {
    const clientId = config?.googleClientId;
    if (!clientId || !buttonRef.current) {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    const boot = () => {
      const googleAccounts = window.google as unknown as GoogleAccountsApi | undefined;
      if (!googleAccounts || !buttonRef.current) {
        return;
      }
      buttonRef.current.innerHTML = '';
      const buttonWidth = Math.max(220, Math.min(buttonRef.current.clientWidth || 360, 360));
      googleAccounts.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential: string }) => {
          try {
            setError(null);
            await crmRequest('/api/auth/google/verify', { method: 'POST', body: JSON.stringify({ credential }) });
            await onLoggedIn();
            navigate('/');
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Falha ao autenticar com Google.');
          }
        },
      });
      googleAccounts.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        text: 'continue_with',
        shape: 'rectangular',
        size: 'large',
        width: buttonWidth,
        logo_alignment: 'left',
      });
    };

    if (existing) {
      boot();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = boot;
    document.head.appendChild(script);
  }, [config, navigate, onLoggedIn]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8fb] px-4 py-6 text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[18%] h-72 w-72 -translate-x-1/2 rounded-full bg-[#68baf9]/14 blur-3xl" />
        <div className="absolute left-1/2 top-[52%] h-56 w-56 -translate-x-1/2 rounded-full border border-slate-200/70 bg-white/40 blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[36px] border border-white/80 bg-white/92 px-8 py-10 text-center shadow-[0_36px_110px_-70px_rgba(15,23,42,0.4)] backdrop-blur">
          <h1 className="font-['Moranga'] text-[3rem] leading-[0.95] text-slate-950 sm:text-[3.4rem]">CRM Cuiabar®</h1>
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-[360px] min-h-[48px]" ref={buttonRef} />
          </div>

          {!config?.googleClientId ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Falta configurar <code className="font-semibold">GOOGLE_AUTH_CLIENT_ID</code>.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
