import { useEffect, useMemo, useState } from 'react';
import { crmRequest } from '../api';
import { Badge, Button, ConfirmModal, Field, InputClassName, Pagination, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import { contactStatusLabels, label, optInStatusLabels } from '../labels';
import type { Contact, ContactList } from '../types';

type ContactFormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: string;
  tags: string;
  status: string;
  optInStatus: string;
};

type ContactHistoryPayload = {
  ok: true;
  sendHistory: Array<{
    created_at: string;
    status: string;
    campaign_id: string;
    error_message: string | null;
  }>;
  clicks: Array<{
    created_at: string;
    campaign_id: string;
    link_id: string;
  }>;
  unsubscribes: Array<{
    created_at: string;
    campaign_id: string | null;
  }>;
  publicInteractions: Array<{
    created_at: string;
    event_name: string;
    event_category: string;
    source: string;
    channel: string | null;
    href: string | null;
    label: string | null;
  }>;
};

const parseCsv = (input: string) => {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
};

const toFormState = (contact: Contact): ContactFormState => ({
  email: contact.email,
  firstName: contact.firstName,
  lastName: contact.lastName,
  phone: contact.phone,
  source: contact.source || 'manual',
  tags: contact.tags.join(', '),
  status: contact.status,
  optInStatus: contact.optInStatus,
});

const blankContactForm = (): ContactFormState => ({
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  source: 'manual',
  tags: '',
  status: 'active',
  optInStatus: 'confirmed',
});

const formatDateTime = (value: string | null) => {
  if (!value) return 'Sem registro';
  return new Date(value).toLocaleString('pt-BR');
};

export const ContactsPage = () => {
  const { csrfToken } = useCrm();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [history, setHistory] = useState<ContactHistoryPayload | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createForm, setCreateForm] = useState<ContactFormState>(() => blankContactForm());
  const [editForm, setEditForm] = useState<ContactFormState | null>(null);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importListId, setImportListId] = useState('');

  const headers = useMemo(() => (csvText ? parseCsv(csvText)[0] ?? [] : []), [csvText]);
  const previewRows = useMemo(() => {
    if (!csvText) {
      return [];
    }
    const [, ...rows] = parseCsv(csvText);
    return rows.slice(0, 5).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  }, [csvText, headers]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  );

  const loadContacts = async (options?: { keepSelection?: boolean; pageOverride?: number }) => {
    const p = options?.pageOverride ?? page;
    const query = new URLSearchParams({ page: String(p), pageSize: '50' });
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);
    const response = await crmRequest<{ ok: true; contacts: Contact[]; pagination?: { page: number; totalPages: number } }>(`/api/contacts?${query.toString()}`, {}, csrfToken);
    setContacts(response.contacts);
    setTotalPages(response.pagination?.totalPages ?? 1);

    if (!options?.keepSelection) {
      setSelectedContactId((current) => current && response.contacts.some((contact) => contact.id === current) ? current : response.contacts[0]?.id ?? null);
    }
  };

  useEffect(() => {
    setPage(1);
    loadContacts({ pageOverride: 1 }).catch(() => undefined);
    crmRequest<{ ok: true; lists: ContactList[] }>('/api/lists', {}, csrfToken)
      .then((response) => setLists(response.lists))
      .catch(() => setLists([]));
  }, [csrfToken]);

  useEffect(() => {
    loadContacts({ pageOverride: page }).catch(() => undefined);
  }, [page]);

  useEffect(() => {
    if (!selectedContactId) {
      setHistory(null);
      setEditForm(null);
      return;
    }

    const current = contacts.find((contact) => contact.id === selectedContactId);
    if (current) {
      setEditForm(toFormState(current));
    }

    crmRequest<ContactHistoryPayload>(`/api/contacts/${selectedContactId}/history`, {}, csrfToken)
      .then((response) => setHistory(response))
      .catch(() => setHistory(null));
  }, [contacts, csrfToken, selectedContactId]);

  const createContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSavingNew(true);
    try {
      await crmRequest(
        '/api/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            ...createForm,
            tags: createForm.tags.split(',').map((entry) => entry.trim()).filter(Boolean),
          }),
        },
        csrfToken,
      );
      setCreateForm(blankContactForm());
      await loadContacts();
      setFeedback('Novo contato salvo no CRM.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel salvar o contato.');
    } finally {
      setIsSavingNew(false);
    }
  };

  const saveSelectedContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedContactId || !editForm) {
      return;
    }

    setError(null);
    setFeedback(null);
    setIsSavingEdit(true);
    try {
      await crmRequest(
        `/api/contacts/${selectedContactId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            phone: editForm.phone,
            source: editForm.source,
            tags: editForm.tags.split(',').map((entry) => entry.trim()).filter(Boolean),
            status: editForm.status,
            optInStatus: editForm.optInStatus,
          }),
        },
        csrfToken,
      );
      await loadContacts({ keepSelection: true });
      setFeedback('Contato atualizado com sucesso.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel atualizar o contato.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      await crmRequest(`/api/contacts/${contactId}`, { method: 'DELETE' }, csrfToken);
      setDeletingContactId(null);
      setSelectedContactId(null);
      await loadContacts();
      setFeedback('Contato excluido com sucesso.');
    } catch (requestError) {
      setDeletingContactId(null);
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel excluir o contato.');
    }
  };

  const importCsv = async () => {
    if (!csvText) {
      return;
    }

    setError(null);
    setFeedback(null);
    try {
      await crmRequest(
        '/api/contacts/import',
        {
          method: 'POST',
          body: JSON.stringify({
            csvText,
            mapping,
            listId: importListId || null,
            source: 'csv_upload',
          }),
        },
        csrfToken,
      );
      setCsvText('');
      setMapping({});
      setImportListId('');
      await loadContacts();
      setFeedback('Importacao concluida e contatos atualizados.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel importar o CSV.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Contatos" description="Busque, abra, edite e acompanhe cada contato no mesmo painel, sem dependencia de integracoes externas." />

      {feedback ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedback}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Panel className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input className={InputClassName} placeholder="Buscar por e-mail ou nome" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className={InputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(contactStatusLabels).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </select>
            <Button onClick={() => loadContacts()}>Filtrar</Button>
          </div>

          <Table>
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ultimo envio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {contacts.map((contact) => (
                <tr key={contact.id} className="cursor-pointer hover:bg-white/5" onClick={() => setSelectedContactId(contact.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{contact.email}</div>
                    <div className="text-xs text-slate-400">{`${contact.firstName} ${contact.lastName}`.trim() || 'Sem nome'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{contact.source || 'n/d'}</td>
                  <td className="px-4 py-3 text-slate-300">{contact.tags.join(', ') || 'Sem tags'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={contact.status === 'active' ? 'success' : contact.status === 'unsubscribed' ? 'warning' : 'danger'}>{label(contactStatusLabels, contact.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(contact.lastSentAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Ficha do contato</h2>
            {selectedContact && editForm ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xl font-semibold text-white">{`${selectedContact.firstName} ${selectedContact.lastName}`.trim() || selectedContact.email}</p>
                  <p className="mt-1 text-sm text-slate-300">{selectedContact.email}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Criado em</p>
                      <p className="mt-2 text-sm text-white">{formatDateTime(selectedContact.createdAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Atualizado em</p>
                      <p className="mt-2 text-sm text-white">{formatDateTime(selectedContact.updatedAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ultimo clique</p>
                      <p className="mt-2 text-sm text-white">{formatDateTime(selectedContact.lastClickedAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Opt-in</p>
                      <p className="mt-2 text-sm text-white">{selectedContact.optInStatus}</p>
                    </div>
                  </div>
                </div>

                <form className="grid gap-4" onSubmit={saveSelectedContact}>
                  <Field label="E-mail">
                    <input className={`${InputClassName} opacity-70`} value={editForm.email} disabled />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Primeiro nome">
                      <input className={InputClassName} value={editForm.firstName} onChange={(event) => setEditForm((current) => (current ? { ...current, firstName: event.target.value } : current))} />
                    </Field>
                    <Field label="Sobrenome">
                      <input className={InputClassName} value={editForm.lastName} onChange={(event) => setEditForm((current) => (current ? { ...current, lastName: event.target.value } : current))} />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Telefone">
                      <input className={InputClassName} value={editForm.phone} onChange={(event) => setEditForm((current) => (current ? { ...current, phone: event.target.value } : current))} />
                    </Field>
                    <Field label="Origem">
                      <input className={InputClassName} value={editForm.source} onChange={(event) => setEditForm((current) => (current ? { ...current, source: event.target.value } : current))} />
                    </Field>
                  </div>
                  <Field label="Tags" hint="Separadas por virgula">
                    <input className={InputClassName} value={editForm.tags} onChange={(event) => setEditForm((current) => (current ? { ...current, tags: event.target.value } : current))} />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Status">
                      <select className={InputClassName} value={editForm.status} onChange={(event) => setEditForm((current) => (current ? { ...current, status: event.target.value } : current))}>
                        {Object.entries(contactStatusLabels).map(([value, text]) => (
                          <option key={value} value={value}>{text}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Status de opt-in">
                      <select className={InputClassName} value={editForm.optInStatus} onChange={(event) => setEditForm((current) => (current ? { ...current, optInStatus: event.target.value } : current))}>
                        {Object.entries(optInStatusLabels).map(([value, text]) => (
                          <option key={value} value={value}>{text}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSavingEdit}>{isSavingEdit ? 'Salvando...' : 'Salvar alteracoes'}</Button>
                    <Button type="button" variant="ghost" onClick={() => selectedContact && setEditForm(toFormState(selectedContact))}>Descartar</Button>
                    <Button type="button" variant="danger" onClick={() => selectedContactId && setDeletingContactId(selectedContactId)}>Excluir contato</Button>
                  </div>
                </form>
              </>
            ) : (
              <p className="text-sm text-slate-400">Selecione um contato para abrir a ficha e editar as informacoes.</p>
            )}
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">Historico do contato</h2>
            {history ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Envios</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{history.sendHistory.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cliques</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{history.clicks.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Descadastros</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{history.unsubscribes.length}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Ultimos eventos publicos</p>
                  <div className="mt-3 space-y-3">
                    {history.publicInteractions.slice(0, 5).map((item) => (
                      <div key={`${item.created_at}-${item.event_name}`} className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                        <p className="text-sm text-white">{item.event_name}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.created_at)} • {item.source}</p>
                        {item.href ? <p className="mt-1 text-xs text-slate-500">{item.href}</p> : null}
                      </div>
                    ))}
                    {!history.publicInteractions.length ? <p className="text-sm text-slate-400">Sem eventos publicos para este contato.</p> : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Selecione um contato para ver envios, cliques e descadastros.</p>
            )}
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">Cadastro manual</h2>
            <form className="mt-4 grid gap-4" onSubmit={createContact}>
              <Field label="E-mail">
                <input className={InputClassName} type="email" value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} required />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Primeiro nome">
                  <input className={InputClassName} value={createForm.firstName} onChange={(event) => setCreateForm((current) => ({ ...current, firstName: event.target.value }))} />
                </Field>
                <Field label="Sobrenome">
                  <input className={InputClassName} value={createForm.lastName} onChange={(event) => setCreateForm((current) => ({ ...current, lastName: event.target.value }))} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Telefone">
                  <input className={InputClassName} value={createForm.phone} onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))} />
                </Field>
                <Field label="Origem">
                  <input className={InputClassName} value={createForm.source} onChange={(event) => setCreateForm((current) => ({ ...current, source: event.target.value }))} />
                </Field>
              </div>
              <Field label="Tags" hint="Separadas por virgula">
                <input className={InputClassName} value={createForm.tags} onChange={(event) => setCreateForm((current) => ({ ...current, tags: event.target.value }))} />
              </Field>
              <Button type="submit" disabled={isSavingNew}>{isSavingNew ? 'Salvando...' : 'Salvar contato'}</Button>
            </form>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">Importacao CSV</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Arquivo CSV" hint="Cole o conteudo ou use upload local">
                <textarea className={`${InputClassName} min-h-[140px]`} value={csvText} onChange={(event) => setCsvText(event.target.value)} />
              </Field>
              <input
                className="text-sm text-slate-300"
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setCsvText(await file.text());
                }}
              />
              {headers.length ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['email', 'first_name', 'last_name', 'phone', 'source', 'tags', 'opt_in_status'].map((field) => (
                      <Field key={field} label={`Mapear ${field}`}>
                        <select className={InputClassName} value={mapping[field] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}>
                          <option value="">Ignorar</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                  </div>
                  <Field label="Lista de destino">
                    <select className={InputClassName} value={importListId} onChange={(event) => setImportListId(event.target.value)}>
                      <option value="">Sem lista</option>
                      {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">Preview das primeiras linhas</p>
                    <pre className="mt-3 overflow-x-auto text-xs text-slate-300">{JSON.stringify(previewRows, null, 2)}</pre>
                  </div>
                  <Button onClick={importCsv}>Importar CSV</Button>
                </>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmModal
        open={deletingContactId !== null}
        title="Excluir contato"
        description={`Tem certeza que deseja excluir o contato "${contacts.find((c) => c.id === deletingContactId)?.email ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { if (deletingContactId) deleteContact(deletingContactId); }}
        onCancel={() => setDeletingContactId(null)}
      />
    </div>
  );
};
