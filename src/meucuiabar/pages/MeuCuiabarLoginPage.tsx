import { useEffect, useRef, useState } from 'react';
import { crmRequest } from '../api';
import { MEUCUIABAR_BASE_PATH } from '../base44/config';
import type { MeuCuiabarAuthConfig, MeuCuiabarGoogleLoginPayload } from '../types';

type GoogleOauthCodeClient = {
  requestCode: () => void;
};

type GoogleOauthApi = {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        client_id: string;
        scope: string;
        ux_mode: 'popup';
        callback: (response: { code?: string; error?: string; error_description?: string }) => void;
        error_callback?: (response: { type: string }) => void;
      }) => GoogleOauthCodeClient;
    };
  };
};

export const MeuCuiabarLoginPage = ({ onLoggedIn }: { onLoggedIn: () => Promise<void> }) => {
  const oauthClientRef = useRef<GoogleOauthCodeClient | null>(null);
  const [config, setConfig] = useState<MeuCuiabarAuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUri = `${window.location.origin}${MEUCUIABAR_BASE_PATH || ''}`;

  useEffect(() => {
    crmRequest<MeuCuiabarAuthConfig>('/api/meucuiabar/auth/config')
      .then((response) => setConfig(response))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Falha ao carregar a autenticacao do MeuCuiabar.'));
  }, []);

  useEffect(() => {
    const clientId = config?.googleClientId;
    const scopes = config?.scopes ?? [];
    if (!clientId || scopes.length === 0) {
      return;
    }

    const boot = () => {
      const googleOauth = window.google as unknown as GoogleOauthApi | undefined;
      if (!googleOauth) {
        return;
      }

      oauthClientRef.current = googleOauth.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: scopes.join(' '),
        ux_mode: 'popup',
        callback: async (response) => {
          if (!response.code) {
            setError(response.error_description || 'O Google nao retornou o codigo de autorizacao do MeuCuiabar.');
            return;
          }

          try {
            setIsSubmitting(true);
            setError(null);
            setPendingApprovalMessage(null);

            const payload = await crmRequest<MeuCuiabarGoogleLoginPayload>('/api/meucuiabar/auth/google/exchange', {
              method: 'POST',
              body: JSON.stringify({
                code: response.code,
                redirectUri,
              }),
            });

            if (!payload.approved) {
              setPendingApprovalMessage(
                payload.approvalMessage ||
                  'Seu acesso foi registrado e depende da aprovacao de leonardo@cuiabar.net ou cuiabar@cuiabar.net.',
              );
              return;
            }

            await onLoggedIn();
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Falha ao autenticar no MeuCuiabar.');
          } finally {
            setIsSubmitting(false);
          }
        },
        error_callback: () => {
          setError('Falha ao abrir a autorizacao Google. Verifique se o navegador bloqueou o popup.');
        },
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-oauth="true"]');
    if (existing) {
      boot();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleOauth = 'true';
    script.onload = boot;
    document.head.appendChild(script);
  }, [config, onLoggedIn, redirectUri]);

  const handleLogin = () => {
    setError(null);
    oauthClientRef.current?.requestCode();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-6 text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[14%] h-80 w-80 -translate-x-1/2 rounded-full bg-[#ffd69b]/25 blur-3xl" />
        <div className="absolute right-[12%] top-[28%] h-52 w-52 rounded-full bg-[#ffedd5]/70 blur-2xl" />
        <div className="absolute left-[12%] bottom-[18%] h-64 w-64 rounded-full bg-[#dbeafe]/80 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-6 rounded-[40px] border border-white/80 bg-white/92 p-6 shadow-[0_36px_120px_-70px_rgba(15,23,42,0.35)] backdrop-blur lg:grid-cols-[1.1fr,0.9fr] lg:p-8">
          <section className="rounded-[32px] bg-[linear-gradient(145deg,#111827,#0f172a_58%,#1d4ed8)] p-8 text-white">
            <p className="text-xs uppercase tracking-[0.34em] text-amber-200/80">MeuCuiabar</p>
            <h1 className="mt-4 font-['Moranga'] text-[3.2rem] leading-[0.92] sm:text-[3.8rem]">Controle interno com acesso Google.</h1>
            <p className="mt-5 max-w-xl text-sm text-slate-200/80">
              O portal agora e totalmente interno da Cuiabar. Cada novo usuario entra com conta Google e so acessa o sistema depois da aprovacao do master.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-200/70">Capturado no login</p>
                <p className="mt-2 text-sm text-white">Nome, sobrenome, e-mail e consentimento de agenda/calendario e lembretes.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-200/70">Aprovacao</p>
                <p className="mt-2 text-sm text-white">Solicitacoes novas sao liberadas por `leonardo@cuiabar.net` ou `cuiabar@cuiabar.net`.</p>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center rounded-[32px] border border-slate-200/80 bg-slate-50/70 p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Entrada segura</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Entrar no MeuCuiabar</h2>
            <p className="mt-3 text-sm text-slate-500">
              Use sua conta Google da rotina operacional. O primeiro acesso sempre passa por aprovacao manual.
            </p>

            <div className="mt-6 space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Permissoes exigidas</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Nome e sobrenome da conta Google</li>
                <li>E-mail autenticado</li>
                <li>Agenda e calendario</li>
                <li>Lembretes e tarefas vinculadas ao Google</li>
              </ul>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex h-14 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!config?.googleClientId || isSubmitting}
              onClick={handleLogin}
            >
              {isSubmitting ? 'Conectando Google...' : 'Continuar com Google'}
            </button>

            {!config?.googleClientId ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Falta configurar `GOOGLE_AUTH_CLIENT_ID` e `GOOGLE_AUTH_CLIENT_SECRET` no Worker.
              </div>
            ) : null}

            {pendingApprovalMessage ? (
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{pendingApprovalMessage}</div>
            ) : null}

            {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
};
