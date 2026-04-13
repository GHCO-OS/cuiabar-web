import { useEffect, useState } from 'react';
import { crmRequest } from '../api';
import { Badge, Button, ConfirmModal, Field, InputClassName, LoadingSpinner, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import { label, roleLabels } from '../labels';
import type { RoleName, SessionUser } from '../types';

type UserRow = SessionUser & {
  createdAt: string;
  lastLoginAt: string | null;
};

export const UsersPage = () => {
  const { csrfToken, user: currentUser } = useCrm();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ email: '', displayName: '', role: 'operador_marketing' as RoleName });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<RoleName>('operador_marketing');

  const load = async () => {
    const response = await crmRequest<{ ok: true; users: UserRow[] }>('/api/users', {}, csrfToken);
    setUsers(response.users);
  };

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [csrfToken]);

  if (loading) return <LoadingSpinner />;

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    await crmRequest('/api/users', { method: 'POST', body: JSON.stringify(form) }, csrfToken);
    setForm({ email: '', displayName: '', role: 'operador_marketing' });
    await load();
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditRole(user.roles[0] ?? 'operador_marketing');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await crmRequest(`/api/users/${editingId}`, { method: 'PUT', body: JSON.stringify({ role: editRole }) }, csrfToken);
    setEditingId(null);
    await load();
  };

  const deleteUser = async (id: string) => {
    await crmRequest(`/api/users/${id}`, { method: 'DELETE' }, csrfToken);
    setDeletingId(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Em modo Google-only, esta tela prepara os e-mails autorizados e seus papeis para o primeiro login." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.9fr]">
        <Panel>
          <Table>
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.displayName}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editingId === user.id ? (
                      <select className={InputClassName} value={editRole} onChange={(e) => setEditRole(e.target.value as RoleName)}>
                        {Object.entries(roleLabels).map(([value, text]) => (
                          <option key={value} value={value}>{text}</option>
                        ))}
                      </select>
                    ) : (
                      user.roles.map((r) => label(roleLabels, r)).join(', ')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.status === 'active' ? 'success' : 'danger'}>{user.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === user.id ? (
                        <>
                          <Button onClick={saveEdit}>Salvar</Button>
                          <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => startEdit(user)}>Editar papel</Button>
                          {user.id !== currentUser?.id ? (
                            <Button variant="danger" onClick={() => setDeletingId(user.id)}>Excluir</Button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {users.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhum usuario criado ainda. Crie o primeiro usuario no painel ao lado.</p>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">Novo usuario</h2>
          <form className="mt-4 grid gap-4" onSubmit={createUser}>
            <Field label="Nome">
              <input className={InputClassName} value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
            </Field>
            <Field label="E-mail">
              <input className={InputClassName} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </Field>
            <Field label="Papel">
              <select className={InputClassName} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as RoleName }))}>
                {Object.entries(roleLabels).map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </select>
            </Field>
            <Button type="submit">Criar usuario</Button>
          </form>
        </Panel>
      </div>

      <ConfirmModal
        open={deletingId !== null}
        title="Excluir usuario"
        description={`Tem certeza que deseja excluir o usuario "${users.find((u) => u.id === deletingId)?.displayName ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { if (deletingId) deleteUser(deletingId); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
