import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmRequest } from '../api';
import { Button, Field, InputClassName, LoadingSpinner, MetricCard, PageHeader, Panel } from '../components';
import { useCrm } from '../context';
import type { ContactList, DashboardMetrics, Segment, Template } from '../types';

export const DashboardPage = () => {
  const { csrfToken } = useCrm();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [quickDispatch, setQuickDispatch] = useState({
    name: '',
    templateId: '',
    listId: '',
    segmentId: '',
  });
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([]);
  const [segments, setSegments] = useState<Array<{ id: string; name: string }>>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      crmRequest<{ ok: true; metrics: DashboardMetrics }>('/api/reports/dashboard', {}, csrfToken)
        .then((response) => setMetrics(response.metrics))
        .catch(() => setMetrics(null)),
      crmRequest<{ ok: true; templates: Template[] }>('/api/templates', {}, csrfToken)
        .then((response) => setTemplates(response.templates.map((t) => ({ id: t.id, name: t.name }))))
        .catch(() => undefined),
      crmRequest<{ ok: true; lists: ContactList[] }>('/api/lists', {}, csrfToken)
        .then((response) => setLists(response.lists.map((l) => ({ id: l.id, name: l.name }))))
        .catch(() => undefined),
      crmRequest<{ ok: true; segments: Segment[] }>('/api/segments', {}, csrfToken)
        .then((response) => setSegments(response.segments.map((s) => ({ id: s.id, name: s.name }))))
        .catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, [csrfToken]);

  const handleQuickDispatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setDispatching(true);
    setDispatchMsg(null);
    try {
      const campaign = await crmRequest<{ ok: true; campaign: { id: string } }>(
        '/api/campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            name: quickDispatch.name,
            subject: quickDispatch.name,
            preheader: '',
            templateId: quickDispatch.templateId,
            listId: quickDispatch.listId || null,
            segmentId: quickDispatch.segmentId || null,
            fromName: 'Cuiabar Restaurantes | Campinas',
            fromEmail: 'contato@cuiabar.com',
            replyTo: 'contato@cuiabar.com',
            scheduledAt: null,
          }),
        },
        csrfToken,
      );
      await crmRequest(`/api/campaigns/${campaign.campaign.id}/launch`, { method: 'POST', body: JSON.stringify({ scheduledAt: null }) }, csrfToken);
      navigate('/campaigns');
    } catch {
      setDispatchMsg('Erro ao disparar campanha. Verifique os dados e tente novamente.');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="O painel deixa claro o que e observavel: envios aceitos pela API, falhas detectadas, cliques e descadastros. Nao existe promessa de inbox placement."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Campanhas" value={metrics?.campaignsSent ?? 0} />
        <MetricCard label="Contatos ativos" value={metrics?.activeContacts ?? 0} />
        <MetricCard label="Cliques totais" value={metrics?.totalClicks ?? 0} note="Click tracking por redirect e a metrica central do sistema." />
        <MetricCard label="CTR observado" value={`${metrics?.ctr ?? 0}%`} note="Baseado em eventos observaveis, sem inferir inbox." />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Falhas de envio" value={metrics?.failures ?? 0} />
        <MetricCard label="Descadastros" value={metrics?.unsubscribes ?? 0} />
      </div>

      <Panel>
        <h2 className="text-lg font-semibold text-white">Disparo rapido</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleQuickDispatch}>
          <Field label="Nome da campanha">
            <input
              className={InputClassName}
              value={quickDispatch.name}
              onChange={(event) => setQuickDispatch((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </Field>
          <Field label="Template">
            <select
              className={InputClassName}
              value={quickDispatch.templateId}
              onChange={(event) => setQuickDispatch((current) => ({ ...current, templateId: event.target.value }))}
              required
            >
              <option value="">Selecione</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lista">
            <select
              className={InputClassName}
              value={quickDispatch.listId}
              onChange={(event) => setQuickDispatch((current) => ({ ...current, listId: event.target.value, segmentId: '' }))}
            >
              <option value="">Nenhuma</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Segmento">
            <select
              className={InputClassName}
              value={quickDispatch.segmentId}
              onChange={(event) => setQuickDispatch((current) => ({ ...current, segmentId: event.target.value, listId: '' }))}
            >
              <option value="">Nenhum</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2 lg:col-span-4 flex items-center gap-4">
            <Button type="submit" disabled={dispatching}>
              {dispatching ? 'Disparando...' : 'Disparar agora'}
            </Button>
            {dispatchMsg ? <p className="text-sm text-rose-400">{dispatchMsg}</p> : null}
          </div>
        </form>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-white">Envios por periodo</h2>
        <div className="mt-5 grid gap-3">
          {(metrics?.sentByPeriod ?? []).map((entry) => (
            <div key={entry.day} className="flex items-center gap-4">
              <div className="w-28 text-sm text-slate-300">{entry.day}</div>
              <div className="h-3 flex-1 rounded-full bg-white/5">
                <div className="h-3 rounded-full bg-amber-300" style={{ width: `${Math.max(entry.total * 4, 6)}px` }} />
              </div>
              <div className="w-12 text-right text-sm text-white">{entry.total}</div>
            </div>
          ))}
          {!metrics?.sentByPeriod?.length ? <p className="text-sm text-slate-400">Ainda nao ha volume suficiente para desenhar a serie temporal.</p> : null}
        </div>
      </Panel>
    </div>
  );
};
