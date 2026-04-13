import { useEffect, useState } from 'react';
import { crmRequest } from '../api';
import { LoadingSpinner, Pagination, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import type { AuditLogEntry } from '../types';

export const AuditPage = () => {
  const { csrfToken } = useCrm();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  const load = (p = page) => {
    const query = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    crmRequest<{ ok: true; logs: AuditLogEntry[]; pagination: { page: number; totalPages: number } }>(`/api/audit-logs?${query}`, {}, csrfToken)
      .then((response) => {
        setLogs(response.logs);
        setTotalPages(response.pagination?.totalPages ?? 1);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [csrfToken, page]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Log centralizado de login, alteracoes de dados, importacoes, campanhas, configuracoes e descadastros." />
      <Panel>
        <Table>
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Ator</th>
              <th className="px-4 py-3">Acao</th>
              <th className="px-4 py-3">Entidade</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-slate-300">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-white">{log.actor}</td>
                <td className="px-4 py-3 text-slate-300">{log.action}</td>
                <td className="px-4 py-3 text-slate-300">{log.entityType}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">Nenhuma entrada de auditoria encontrada.</p>
          </div>
        ) : null}
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); setLoading(true); }} />
      </Panel>
    </div>
  );
};
