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

export const LoginPage = ({
  onLoggedIn,
  successPath = '/',
  productLabel = 'Cuiabar Atende',
  productDescription = 'CRM, reservas, WhatsApp, marketing e fidelidade em uma unica camada operacional.',
}: {
  onLoggedIn: () => Promise<void>;
  successPath?: string;
  productLabel?: string;
  productDescription?: string;
}) => {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    crmRequest<{ ok: true } & AuthConfig>('/api/auth/config')
      .then((response) =>
        setConfig({
          authMode: response.authMode,
          googleClientId: response.googleClientId,
          allowedEmails: response.allowedEmails,
        }),
      )
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'Falha ao carregar a autenticacao.'),
      );
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
      const buttonWidth = Math.max(240, Math.min(buttonRef.current.clientWidth || 360, 360));

      googleAccounts.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential: string }) => {
          try {
            setError(null);
            await crmRequest('/api/auth/google/verify', {
              method: 'POST',
              body: JSON.stringify({ credential }),
            });
            await onLoggedIn();
            navigate(successPath);
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
  }, [config, navigate, onLoggedIn, successPath]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 [font-family:Inter,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1.05fr,0.95fr]">
          <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-800 px-8 py-10 text-white md:border-b-0 md:border-r">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">{productLabel}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.92]">Controle interno com acesso Google.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-200">{productDescription}</p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Capturado no login</p>
                <p className="mt-4 text-lg leading-8 text-slate-100">Nome, sobrenome, e-mail e consentimento de agenda e calendario.</p>
              </div>
              <div className="rounded-3xl border border-indigo-300/20 bg-indigo-400/12 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-indigo-100">Aprovacao</p>
                <p className="mt-4 text-lg leading-8 text-slate-100">
                  Solicitacoes novas sao liberadas por <code className="rounded bg-black/15 px-1.5 py-0.5 text-sm">leonardo@cuiabar.net</code> ou{' '}
                  <code className="rounded bg-black/15 px-1.5 py-0.5 text-sm">cuiabar@cuiabar.net</code>.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white px-8 py-10">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Entrar no {productLabel}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Use sua conta Google da rotina operacional. O primeiro acesso sempre passa por aprovacao manual.</p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Permissoes exigidas</p>
              <ul className="mt-4 space-y-3 text-lg leading-7 text-slate-700">
                <li>Nome e sobrenome da conta Google</li>
                <li>E-mail autenticado</li>
                <li>Agenda e calendario</li>
                <li>Lembretes e tarefas vinculadas ao Google</li>
              </ul>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="w-full min-h-[48px]" ref={buttonRef} />
            </div>

            {!config?.googleClientId ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Falta configurar <code className="font-semibold">GOOGLE_AUTH_CLIENT_ID</code>.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a
                href="https://cuiabar.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                Ir para o site publico ↗
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
