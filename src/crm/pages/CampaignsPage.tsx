import { useEffect, useMemo, useState } from 'react';
import { crmRequest } from '../api';
import { Badge, Button, ConfirmModal, Field, InputClassName, LoadingSpinner, Pagination, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import { campaignStatusLabels, label } from '../labels';
import type { Campaign, ContactList, Segment, Template } from '../types';

type CampaignMetrics = {
  metrics: {
    recipients: number;
    sent: number;
    failed: number;
    clicksTotal: number;
    clicksUnique: number;
    clickedContacts: number;
    unsubscribed: number;
    ctr: number;
    deliveryObservedRate: number;
  };
  topLinks: Array<{ id: string; original_url: string; click_count_total: number; click_count_unique: number }>;
  recipients: Array<{ email_snapshot: string; status: string; sent_at: string | null; clicked_at: string | null; unsubscribed_at: string | null; last_error: string | null }>;
};

type CampaignProgress = {
  sent: number;
  failed: number;
  queued: number;
  total: number;
};

export const CampaignsPage = () => {
  const { csrfToken } = useCrm();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [testEmails, setTestEmails] = useState('');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    preheader: '',
    templateId: '',
    listId: '',
    segmentId: '',
    fromName: 'Cuiabar CRM',
    fromEmail: 'contato@cuiabar.com',
    replyTo: 'contato@cuiabar.com',
    scheduledAt: '',
  });

  const loadBase = async (p = page) => {
    const query = new URLSearchParams({ page: String(p), pageSize: '50' });
    const [campaignResponse, templateResponse, listResponse, segmentResponse] = await Promise.all([
      crmRequest<{ ok: true; campaigns: Campaign[]; pagination?: { page: number; totalPages: number } }>(`/api/campaigns?${query}`, {}, csrfToken),
      crmRequest<{ ok: true; templates: Template[] }>('/api/templates', {}, csrfToken),
      crmRequest<{ ok: true; lists: ContactList[] }>('/api/lists', {}, csrfToken),
      crmRequest<{ ok: true; segments: Segment[] }>('/api/segments', {}, csrfToken),
    ]);
    setCampaigns(campaignResponse.campaigns);
    setTotalPages(campaignResponse.pagination?.totalPages ?? 1);
    setTemplates(templateResponse.templates);
    setLists(listResponse.lists);
    setSegments(segmentResponse.segments);
  };

  useEffect(() => {
    loadBase(1)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [csrfToken]);

  useEffect(() => {
    if (page > 1) {
      loadBase(page).catch(() => undefined);
    }
  }, [page]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setMetrics(null);
      return;
    }
    crmRequest<{ ok: true } & CampaignMetrics>(`/api/campaigns/${selectedCampaignId}/metrics`, {}, csrfToken)
      .then((response) => setMetrics({ metrics: response.metrics, topLinks: response.topLinks, recipients: response.recipients }))
      .catch(() => setMetrics(null));
  }, [csrfToken, selectedCampaignId]);

  const selectedCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null, [campaigns, selectedCampaignId]);

  useEffect(() => {
    if (selectedCampaign?.status !== 'sending') {
      setProgress(null);
      return;
    }
    const poll = () => {
      crmRequest<{ ok: true } & CampaignProgress>(`/api/campaigns/${selectedCampaignId}/progress`, {}, csrfToken)
        .then((response) => setProgress({ sent: response.sent, failed: response.failed, queued: response.queued, total: response.total }))
        .catch(() => undefined);
    };
    poll();
    const intervalId = setInterval(poll, 5000);
    return () => clearInterval(intervalId);
  }, [csrfToken, selectedCampaignId, selectedCampaign?.status]);

  const saveCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    await crmRequest('/api/campaigns', { method: 'POST', body: JSON.stringify({ ...form, listId: form.listId || null, segmentId: form.segmentId || null, scheduledAt: form.scheduledAt || null }) }, csrfToken);
    setForm((current) => ({ ...current, name: '', subject: '', preheader: '' }));
    await loadBase();
  };

  const launchCampaign = async (scheduledAt?: string) => {
    if (!selectedCampaignId) return;
    await crmRequest(`/api/campaigns/${selectedCampaignId}/launch`, { method: 'POST', body: JSON.stringify({ scheduledAt: scheduledAt || null }) }, csrfToken);
    await loadBase();
  };

  const deleteCampaign = async () => {
    if (!selectedCampaignId) return;
    await crmRequest(`/api/campaigns/${selectedCampaignId}`, { method: 'DELETE' }, csrfToken);
    setSelectedCampaignId('');
    await loadBase();
  };

  const cloneCampaign = async () => {
    if (!selectedCampaignId) return;
    setCloning(true);
    try {
      await crmRequest(`/api/campaigns/${selectedCampaignId}/duplicate`, { method: 'POST' }, csrfToken);
      await loadBase();
    } finally {
      setCloning(false);
    }
  };

  const pauseCampaign = async () => {
    if (!selectedCampaignId) return;
    await crmRequest(`/api/campaigns/${selectedCampaignId}/pause`, { method: 'POST' }, csrfToken);
    await loadBase();
  };

  const cancelCampaign = async () => {
    if (!selectedCampaignId) return;
    await crmRequest(`/api/campaigns/${selectedCampaignId}/cancel`, { method: 'POST' }, csrfToken);
    await loadBase();
  };

  const sendTest = async () => {
    if (!selectedCampaignId) return;
    await crmRequest(
      `/api/campaigns/${selectedCampaignId}/send-test`,
      { method: 'POST', body: JSON.stringify({ emails: testEmails.split(',').map((entry) => entry.trim()).filter(Boolean) }) },
      csrfToken,
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Campanhas" description="Fluxo completo de rascunho, teste, agendamento, envio em lotes e acompanhamento de cliques por destinatario." />

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Panel className="space-y-4">
          <Table>
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Campanha</th>
                <th className="px-4 py-3">Publico</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Envio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="cursor-pointer hover:bg-white/5" onClick={() => setSelectedCampaignId(campaign.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{campaign.name}</div>
                    <div className="text-xs text-slate-400">{campaign.subject}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{campaign.listId ? (lists.find((l) => l.id === campaign.listId)?.name ?? 'Lista') : campaign.segmentId ? (segments.find((s) => s.id === campaign.segmentId)?.name ?? 'Segmento') : 'Sem publico'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={campaign.status === 'sent' ? 'success' : campaign.status === 'draft' ? 'neutral' : campaign.status === 'failed' ? 'danger' : 'warning'}>{label(campaignStatusLabels, campaign.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{campaign.totalSent}/{campaign.totalRecipients}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhuma campanha criada ainda. Crie a primeira campanha no painel ao lado.</p>
            </div>
          ) : null}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {selectedCampaign ? (
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              {progress && selectedCampaign?.status === 'sending' ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-200">Enviando campanha...</span>
                    <span className="font-semibold text-white">{progress.sent}/{progress.total}</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-amber-400 transition-all"
                      style={{ width: `${progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-amber-300/80">{progress.failed} falhas · {progress.queued} na fila</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {selectedCampaign?.status === 'draft' || selectedCampaign?.status === 'scheduled' ? (
                  <Button onClick={() => setConfirmAction('launch')}>Enviar agora</Button>
                ) : null}
                {selectedCampaign?.status === 'draft' ? (
                  <Button variant="ghost" onClick={() => launchCampaign(new Date(Date.now() + 15 * 60 * 1000).toISOString())}>
                    Agendar +15 min
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={sendTest}>
                  Enviar teste
                </Button>
                {selectedCampaign?.status === 'sending' ? (
                  <>
                    <Button variant="ghost" onClick={() => setConfirmAction('process')}>
                      Processar lote
                    </Button>
                    <Button variant="ghost" onClick={pauseCampaign}>
                      Pausar
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                      Cancelar envio
                    </Button>
                  </>
                ) : null}
                {selectedCampaign?.status === 'paused' ? (
                  <>
                    <Button onClick={() => setConfirmAction('launch')}>Retomar envio</Button>
                    <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                      Cancelar
                    </Button>
                  </>
                ) : null}
                <Button variant="ghost" disabled={cloning} onClick={cloneCampaign}>
                  {cloning ? 'Clonando...' : 'Clonar campanha'}
                </Button>
                {['draft', 'cancelled', 'failed'].includes(selectedCampaign?.status ?? '') ? (
                  <Button variant="danger" onClick={() => setConfirmAction('delete')}>
                    Excluir
                  </Button>
                ) : null}
              </div>
              <Field label="Destinatarios de teste" hint="Separados por virgula">
                <input className={InputClassName} value={testEmails} onChange={(event) => setTestEmails(event.target.value)} />
              </Field>
              {metrics ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Revisao operacional</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      <li>Destinatarios: {metrics.metrics.recipients}</li>
                      <li>Enviados: {metrics.metrics.sent}</li>
                      <li>Falhas: {metrics.metrics.failed}</li>
                      <li>CTR observado: {metrics.metrics.ctr}%</li>
                      <li>Taxa de entrega observada: {metrics.metrics.deliveryObservedRate}%</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Top links clicados</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {metrics.topLinks.slice(0, 5).map((link) => (
                        <li key={link.id}>
                          <span className="block truncate">{link.original_url}</span>
                          <span className="text-xs text-slate-400">{link.click_count_unique} unicos / {link.click_count_total} totais</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">Nova campanha</h2>
          <form className="mt-4 grid gap-4" onSubmit={saveCampaign}>
            <Field label="Nome">
              <input className={InputClassName} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Assunto">
              <input className={InputClassName} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
            </Field>
            <Field label="Preheader">
              <input className={InputClassName} value={form.preheader} onChange={(event) => setForm((current) => ({ ...current, preheader: event.target.value }))} />
            </Field>
            <Field label="Template">
              <select className={InputClassName} value={form.templateId} onChange={(event) => setForm((current) => ({ ...current, templateId: event.target.value }))} required>
                <option value="">Selecione</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lista estatica">
              <select className={InputClassName} value={form.listId} onChange={(event) => setForm((current) => ({ ...current, listId: event.target.value }))}>
                <option value="">Nenhuma</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Segmento dinamico">
              <select className={InputClassName} value={form.segmentId} onChange={(event) => setForm((current) => ({ ...current, segmentId: event.target.value }))}>
                <option value="">Nenhum</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nome do remetente">
              <input className={InputClassName} value={form.fromName} onChange={(event) => setForm((current) => ({ ...current, fromName: event.target.value }))} />
            </Field>
            <Field label="E-mail remetente">
              <input className={InputClassName} type="email" value={form.fromEmail} onChange={(event) => setForm((current) => ({ ...current, fromEmail: event.target.value }))} />
            </Field>
            <Field label="Responder para">
              <input className={InputClassName} type="email" value={form.replyTo} onChange={(event) => setForm((current) => ({ ...current, replyTo: event.target.value }))} />
            </Field>
            <Button type="submit">Salvar campanha</Button>
          </form>
        </Panel>
      </div>

      <ConfirmModal
        open={confirmAction === 'launch' && selectedCampaignId !== ''}
        title="Confirmar envio de campanha"
        description={`Tem certeza que deseja enviar a campanha "${selectedCampaign?.name ?? ''}" agora? O envio sera processado em lotes conforme as configuracoes de taxa.`}
        confirmLabel="Enviar agora"
        onConfirm={() => {
          setConfirmAction(null);
          launchCampaign();
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction === 'process' && selectedCampaignId !== ''}
        title="Processar lote manual"
        description={`Deseja processar o proximo lote de envios da campanha "${selectedCampaign?.name ?? ''}"? Isso nao substitui o agendamento automatico.`}
        confirmLabel="Processar lote"
        onConfirm={() => {
          setConfirmAction(null);
          crmRequest(`/api/campaigns/${selectedCampaignId}/process`, { method: 'POST' }, csrfToken).then(() => loadBase());
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction === 'cancel' && selectedCampaignId !== ''}
        title="Cancelar campanha"
        description={`Tem certeza que deseja cancelar a campanha "${selectedCampaign?.name ?? ''}"? O envio sera interrompido e nao podera ser retomado.`}
        confirmLabel="Cancelar envio"
        isDanger
        onConfirm={() => { setConfirmAction(null); cancelCampaign(); }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction === 'delete' && selectedCampaignId !== ''}
        title="Excluir campanha"
        description={`Tem certeza que deseja excluir a campanha "${selectedCampaign?.name ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { setConfirmAction(null); deleteCampaign(); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
