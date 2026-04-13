import { useEffect, useState } from 'react';
import { crmRequest } from '../api';
import { Badge, Button, ConfirmModal, Field, InputClassName, LoadingSpinner, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import type { Segment } from '../types';

const defaultRules = JSON.stringify(
  {
    match: 'all',
    conditions: [{ field: 'source', operator: 'eq', value: 'site' }],
  },
  null,
  2,
);

type PreviewResult = { total: number; active: number; sample: Array<{ email: string; name: string | null }> } | null;

export const SegmentsPage = () => {
  const { csrfToken } = useCrm();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState(defaultRules);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    const response = await crmRequest<{ ok: true; segments: Segment[] }>('/api/segments', {}, csrfToken);
    setSegments(response.segments);
  };

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [csrfToken]);

  if (loading) return <LoadingSpinner />;

  const createSegment = async (event: React.FormEvent) => {
    event.preventDefault();
    await crmRequest('/api/segments', { method: 'POST', body: JSON.stringify({ name, description, rules: JSON.parse(rules) }) }, csrfToken);
    setName('');
    setDescription('');
    setRules(defaultRules);
    await load();
  };

  const deleteSegment = async (id: string) => {
    await crmRequest(`/api/segments/${id}`, { method: 'DELETE' }, csrfToken);
    setDeletingId(null);
    await load();
  };

  const previewSegment = async (id: string) => {
    setPreviewingId(id);
    setPreview(null);
    setPreviewLoading(true);
    try {
      const result = await crmRequest<{ ok: true; total: number; active: number; sample: Array<{ email: string; name: string | null }> }>(
        `/api/segments/${id}/preview`,
        { method: 'POST' },
        csrfToken,
      );
      setPreview({ total: result.total, active: result.active, sample: result.sample });
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const humanizeRules = (segment: Segment): string => {
    const rules = segment.rules as { match?: string; conditions?: Array<{ field?: string; operator?: string; value?: unknown }> };
    if (!rules?.conditions?.length) return 'Sem condicoes';
    const count = rules.conditions.length;
    const match = rules.match === 'any' ? 'qualquer' : 'todos';
    if (count === 1) {
      const c = rules.conditions[0];
      return `${c?.field} ${c?.operator} "${c?.value}"`;
    }
    return `${count} condicoes (match: ${match})`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Segmentos" description="Os segmentos dinamicos usam regras em JSON para manter flexibilidade com baixo acoplamento." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Panel className="space-y-4">
          <Table>
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Regras</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {segments.map((segment) => (
                <tr key={segment.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{segment.name}</div>
                    {segment.description ? <div className="text-xs text-slate-400">{segment.description}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{humanizeRules(segment)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => previewSegment(segment.id)}>
                        Previsualizar
                      </Button>
                      <Button variant="danger" onClick={() => setDeletingId(segment.id)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {segments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhum segmento criado ainda. Crie o primeiro segmento no painel ao lado.</p>
            </div>
          ) : null}

          {previewingId ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  Preview: {segments.find((s) => s.id === previewingId)?.name}
                </p>
                <button className="text-xs text-slate-400 hover:text-white" onClick={() => { setPreviewingId(null); setPreview(null); }}>Fechar</button>
              </div>
              {previewLoading ? (
                <p className="mt-3 text-sm text-slate-400">Calculando...</p>
              ) : preview ? (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-4">
                    <Badge tone="success">{preview.active} ativos</Badge>
                    <Badge tone="neutral">{preview.total} total</Badge>
                  </div>
                  {preview.sample.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">Amostra (ate 5):</p>
                      {preview.sample.map((contact) => (
                        <p key={contact.email} className="text-xs text-slate-300">{contact.email}{contact.name ? ` — ${contact.name}` : ''}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Nenhum contato encontrado neste segmento.</p>
              )}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">Novo segmento</h2>
          <form className="mt-4 grid gap-4" onSubmit={createSegment}>
            <Field label="Nome">
              <input className={InputClassName} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Descricao">
              <input className={InputClassName} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Regras JSON" hint='Ex.: {"match":"all","conditions":[{"field":"tag","value":"vip"}]}'>
              <textarea className={`${InputClassName} min-h-[260px] font-mono text-xs`} value={rules} onChange={(event) => setRules(event.target.value)} />
            </Field>
            <Button type="submit">Salvar segmento</Button>
          </form>
        </Panel>
      </div>

      <ConfirmModal
        open={deletingId !== null}
        title="Excluir segmento"
        description={`Tem certeza que deseja excluir o segmento "${segments.find((s) => s.id === deletingId)?.name ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { if (deletingId) deleteSegment(deletingId); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
