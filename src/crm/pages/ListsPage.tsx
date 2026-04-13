import { useEffect, useState } from 'react';
import { crmRequest } from '../api';
import { Button, ConfirmModal, Field, InputClassName, LoadingSpinner, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import type { ContactList } from '../types';

export const ListsPage = () => {
  const { csrfToken } = useCrm();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const load = async () => {
    const response = await crmRequest<{ ok: true; lists: ContactList[] }>('/api/lists', {}, csrfToken);
    setLists(response.lists);
  };

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [csrfToken]);

  if (loading) return <LoadingSpinner />;

  const createList = async (event: React.FormEvent) => {
    event.preventDefault();
    await crmRequest('/api/lists', { method: 'POST', body: JSON.stringify({ name, description }) }, csrfToken);
    setName('');
    setDescription('');
    await load();
  };

  const startEdit = (list: ContactList) => {
    setEditingId(list.id);
    setEditName(list.name);
    setEditDescription(list.description ?? '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await crmRequest(`/api/lists/${editingId}`, { method: 'PUT', body: JSON.stringify({ name: editName, description: editDescription }) }, csrfToken);
    setEditingId(null);
    await load();
  };

  const deleteList = async (id: string) => {
    await crmRequest(`/api/lists/${id}`, { method: 'DELETE' }, csrfToken);
    setDeletingId(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Listas" description="Listas estaticas servem para importacoes, campanhas sazonais e grupos sob controle manual." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.8fr]">
        <Panel>
          <Table>
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Lista</th>
                <th className="px-4 py-3">Descricao</th>
                <th className="px-4 py-3">Contatos</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {lists.map((list) => (
                <tr key={list.id}>
                  <td className="px-4 py-3">
                    {editingId === list.id ? (
                      <input className={InputClassName} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <span className="font-medium text-white">{list.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editingId === list.id ? (
                      <input className={InputClassName} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    ) : (
                      list.description || 'Sem descricao'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{list.contact_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === list.id ? (
                        <>
                          <Button onClick={saveEdit}>Salvar</Button>
                          <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => startEdit(list)}>Editar</Button>
                          <Button variant="danger" onClick={() => setDeletingId(list.id)}>Excluir</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {lists.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhuma lista criada ainda. Crie a primeira lista no painel ao lado.</p>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">Nova lista</h2>
          <form className="mt-4 grid gap-4" onSubmit={createList}>
            <Field label="Nome">
              <input className={InputClassName} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Descricao">
              <textarea className={`${InputClassName} min-h-[120px]`} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Button type="submit">Criar lista</Button>
          </form>
        </Panel>
      </div>

      <ConfirmModal
        open={deletingId !== null}
        title="Excluir lista"
        description={`Tem certeza que deseja excluir a lista "${lists.find((l) => l.id === deletingId)?.name ?? ''}"? Os contatos nao serao excluidos, apenas removidos desta lista.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { if (deletingId) deleteList(deletingId); }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
