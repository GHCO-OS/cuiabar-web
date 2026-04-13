import { useEffect, useState } from 'react';
import { crmRequest } from '../api';
import { Badge, Button, Field, InputClassName, PageHeader, Panel } from '../components';
import { useCrm } from '../context';

type SendingSettings = {
  batchSize: number;
  ratePerMinute: number;
  pauseMs: number;
  campaignMaxRecipients: number;
  retryLimit: number;
};

type DeliverabilitySettings = {
  spfConfigured: boolean;
  dkimConfigured: boolean;
  dmarcConfigured: boolean;
  listUnsubscribeEnabled: boolean;
  optInRequired: boolean;
  doubleOptInEnabled: boolean;
  bounceHandling: string;
  complaintHandling: string;
  warmingPlan: string;
};

type ChecklistItem = { key: string; label: string; ok: boolean; note?: string };

type SettingsPayload = {
  gmail: {
    configured: boolean;
    senderEmail: string;
    senderName: string;
    authorizedEmail: string | null;
    connectedAt: string | null;
    connectionSource: 'panel_oauth' | 'cloudflare_secret' | null;
  };
  sending: SendingSettings;
  deliverability: DeliverabilitySettings;
  checklist: { authentication: ChecklistItem[]; operational: ChecklistItem[] };
  notices: { openTracking: boolean; clickTrackingReliable: boolean; inboxPlacementGuaranteed: boolean };
};

const defaultSending: SendingSettings = {
  batchSize: 25,
  ratePerMinute: 45,
  pauseMs: 1500,
  campaignMaxRecipients: 5000,
  retryLimit: 2,
};

const defaultDeliverability: DeliverabilitySettings = {
  spfConfigured: false,
  dkimConfigured: false,
  dmarcConfigured: false,
  listUnsubscribeEnabled: true,
  optInRequired: true,
  doubleOptInEnabled: false,
  bounceHandling: '',
  complaintHandling: '',
  warmingPlan: '',
};

const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200">
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${checked ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-white/20 bg-slate-900/80'}`}
      onClick={() => onChange(!checked)}
    >
      {checked ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
    </span>
    <span>{label}</span>
  </label>
);

export const SettingsPage = () => {
  const { csrfToken, user } = useCrm();
  const [payload, setPayload] = useState<SettingsPayload | null>(null);
  const [sending, setSending] = useState<SendingSettings>(defaultSending);
  const [deliverability, setDeliverability] = useState<DeliverabilitySettings>(defaultDeliverability);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const gmailOauthUrl = '/oauth/gmail/start';

  const load = async () => {
    const response = await crmRequest<{ ok: true } & SettingsPayload>('/api/settings', {}, csrfToken);
    setPayload(response);
    setSending({ ...defaultSending, ...response.sending });
    setDeliverability({ ...defaultDeliverability, ...response.deliverability });
    setTestEmail((current) => current || response.gmail.senderEmail || user?.email || '');
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [csrfToken]);

  const saveSending = async () => {
    setSaveError(null);
    setSaveFeedback(null);
    try {
      await crmRequest('/api/settings/sending', { method: 'PUT', body: JSON.stringify(sending) }, csrfToken);
      setSaveFeedback('Controles de envio salvos.');
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar.');
    }
  };

  const saveDeliverability = async () => {
    setSaveError(null);
    setSaveFeedback(null);
    try {
      await crmRequest('/api/settings/deliverability', { method: 'PUT', body: JSON.stringify(deliverability) }, csrfToken);
      setSaveFeedback('Politicas de entregabilidade salvas.');
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar.');
    }
  };

  const sendGmailTest = async () => {
    setTestError(null);
    setTestStatus(null);
    setIsTesting(true);
    try {
      const response = await crmRequest<{ ok: true; email: string; providerMessageId: string }>(
        '/api/settings/gmail/test',
        { method: 'POST', body: JSON.stringify({ email: testEmail }) },
        csrfToken,
      );
      setTestStatus(`Teste enviado para ${response.email}. Gmail message id: ${response.providerMessageId}.`);
      await load();
    } catch (requestError) {
      setTestError(requestError instanceof Error ? requestError.message : 'Falha ao enviar o teste do Gmail.');
    } finally {
      setIsTesting(false);
    }
  };

  const allChecklist = [
    ...(payload?.checklist?.authentication ?? []),
    ...(payload?.checklist?.operational ?? []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracoes" description="A camada sensivel do CRM fica no ambiente Cloudflare. Aqui voce ajusta parametros operacionais e valida o envio pelo Gmail." />

      {saveFeedback ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{saveFeedback}</div> : null}
      {saveError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{saveError}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Gmail e remetente</h2>
            <Badge tone={payload?.gmail.configured ? 'success' : 'warning'}>{payload?.gmail.configured ? 'configurado' : 'pendente'}</Badge>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Nome do remetente: <strong className="text-white">{payload?.gmail.senderName ?? '-'}</strong></p>
            <p>E-mail remetente: <strong className="text-white">{payload?.gmail.senderEmail ?? '-'}</strong></p>
            <p>Conta autorizada: <strong className="text-white">{payload?.gmail.authorizedEmail ?? 'nenhuma'}</strong></p>
            <p>Origem da conexao: <strong className="text-white">{payload?.gmail.connectionSource === 'cloudflare_secret' ? 'secret do Cloudflare' : payload?.gmail.connectionSource === 'panel_oauth' ? 'OAuth do painel' : 'nao conectada'}</strong></p>
            <p>Conectado em: <strong className="text-white">{payload?.gmail.connectedAt ? new Date(payload.gmail.connectedAt).toLocaleString('pt-BR') : '-'}</strong></p>
            <p>Click tracking confiavel: <strong className="text-white">{payload?.notices.clickTrackingReliable ? 'sim' : 'nao'}</strong></p>
            <p>Open tracking: <strong className="text-white">{payload?.notices.openTracking ? 'habilitado' : 'opcional/desligado'}</strong></p>
            <p>Inbox placement garantido: <strong className="text-white">{payload?.notices.inboxPlacementGuaranteed ? 'sim' : 'nao'}</strong></p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            <p className="font-semibold text-white">Conectar a conta remetente do Gmail</p>
            <p className="mt-2 text-amber-100/90">
              Use este fluxo para autorizar o envio com <strong>{payload?.gmail.senderEmail ?? 'leonardo@cuiabar.net'}</strong>.
              O Google deve abrir em nova aba e, ao concluir, mostrar a mensagem <strong>Autorizacao concluida</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                href={gmailOauthUrl}
                rel="noreferrer"
                target="_blank"
              >
                {payload?.gmail.configured ? 'Reconectar Gmail' : 'Conectar Gmail'}
              </a>
              <a
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/oauth/gmail/setup"
                rel="noreferrer"
                target="_blank"
              >
                Ver instrucoes
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Field
              label="Teste de envio"
              hint="Dispare um e-mail operacional simples para validar token, Gmail API e identidade remetente antes da primeira campanha."
            >
              <input className={InputClassName} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="leonardo@cuiabar.net" />
            </Field>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={!payload?.gmail.configured || isTesting || !testEmail.trim()} onClick={sendGmailTest}>
                {isTesting ? 'Enviando teste...' : 'Enviar teste do Gmail'}
              </Button>
            </div>
            {testStatus ? <p className="mt-4 text-sm text-emerald-300">{testStatus}</p> : null}
            {testError ? <p className="mt-4 text-sm text-rose-300">{testError}</p> : null}
          </div>

          {allChecklist.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-400">Checklist de entregabilidade</p>
              {allChecklist.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    {item.note ? <p className="mt-1 text-xs text-slate-400">{item.note}</p> : null}
                  </div>
                  <Badge tone={item.ok ? 'success' : 'warning'}>{item.ok ? 'ok' : 'pendente'}</Badge>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Controles de envio</h2>
          <div className="grid gap-4">
            <Field label="Tamanho do lote" hint="Quantidade de e-mails por ciclo de envio (1-100)">
              <input className={InputClassName} type="number" min={1} max={100} value={sending.batchSize} onChange={(e) => setSending((s) => ({ ...s, batchSize: Number(e.target.value) }))} />
            </Field>
            <Field label="Limite por minuto" hint="Maximo de e-mails enviados por minuto (1-500)">
              <input className={InputClassName} type="number" min={1} max={500} value={sending.ratePerMinute} onChange={(e) => setSending((s) => ({ ...s, ratePerMinute: Number(e.target.value) }))} />
            </Field>
            <Field label="Pausa entre envios (ms)" hint="Intervalo entre cada e-mail no lote (0-30000)">
              <input className={InputClassName} type="number" min={0} max={30000} value={sending.pauseMs} onChange={(e) => setSending((s) => ({ ...s, pauseMs: Number(e.target.value) }))} />
            </Field>
            <Field label="Maximo de destinatarios" hint="Limite por campanha (1-50000)">
              <input className={InputClassName} type="number" min={1} max={50000} value={sending.campaignMaxRecipients} onChange={(e) => setSending((s) => ({ ...s, campaignMaxRecipients: Number(e.target.value) }))} />
            </Field>
            <Field label="Tentativas de reenvio" hint="Quantas vezes tentar reenviar em caso de falha transiente (0-10)">
              <input className={InputClassName} type="number" min={0} max={10} value={sending.retryLimit} onChange={(e) => setSending((s) => ({ ...s, retryLimit: Number(e.target.value) }))} />
            </Field>
          </div>
          <Button onClick={saveSending}>Salvar controles de envio</Button>
        </Panel>

        <Panel className="space-y-4 xl:col-span-2">
          <h2 className="text-lg font-semibold text-white">Politicas de entregabilidade</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <CheckboxField label="SPF configurado" checked={deliverability.spfConfigured} onChange={(v) => setDeliverability((d) => ({ ...d, spfConfigured: v }))} />
              <CheckboxField label="DKIM configurado" checked={deliverability.dkimConfigured} onChange={(v) => setDeliverability((d) => ({ ...d, dkimConfigured: v }))} />
              <CheckboxField label="DMARC configurado" checked={deliverability.dmarcConfigured} onChange={(v) => setDeliverability((d) => ({ ...d, dmarcConfigured: v }))} />
              <CheckboxField label="List-Unsubscribe habilitado" checked={deliverability.listUnsubscribeEnabled} onChange={(v) => setDeliverability((d) => ({ ...d, listUnsubscribeEnabled: v }))} />
              <CheckboxField label="Opt-in obrigatorio" checked={deliverability.optInRequired} onChange={(v) => setDeliverability((d) => ({ ...d, optInRequired: v }))} />
              <CheckboxField label="Double opt-in habilitado" checked={deliverability.doubleOptInEnabled} onChange={(v) => setDeliverability((d) => ({ ...d, doubleOptInEnabled: v }))} />
            </div>
            <div className="space-y-4">
              <Field label="Tratamento de bounces">
                <textarea className={`${InputClassName} min-h-[80px]`} value={deliverability.bounceHandling} onChange={(e) => setDeliverability((d) => ({ ...d, bounceHandling: e.target.value }))} />
              </Field>
              <Field label="Tratamento de reclamacoes">
                <textarea className={`${InputClassName} min-h-[80px]`} value={deliverability.complaintHandling} onChange={(e) => setDeliverability((d) => ({ ...d, complaintHandling: e.target.value }))} />
              </Field>
              <Field label="Plano de aquecimento">
                <textarea className={`${InputClassName} min-h-[80px]`} value={deliverability.warmingPlan} onChange={(e) => setDeliverability((d) => ({ ...d, warmingPlan: e.target.value }))} />
              </Field>
            </div>
          </div>
          <Button onClick={saveDeliverability}>Salvar politicas</Button>
        </Panel>
      </div>
    </div>
  );
};
