import { useEffect, useState } from 'react';
import { crmRequest } from '../../api';
import { Badge, Button, Field, InputClassName, LoadingSpinner, PageHeader, Panel, Table, Pagination } from '../../components';
import { useCrm } from '../../context';
import type { WaContact, WaSector, WaSubscription } from '../../types';

interface ContactsPayload { ok: boolean; contacts: WaContact[]; total: number; totalPages: number; }
interface SectorsPayload { ok: boolean; sectors: WaSector[]; }
interface SubscriptionsPayload { ok: boolean; subscriptions: WaSubscription[]; total: number; totalPages: number; }

type Tab = 'contacts' | 'subscriptions' | 'sectors';

const STATUS_COLORS: Record<string, string> = {
  ativo: 'success',
  bloqueado: 'danger',
  arquivado: 'neutral',
};

const SECTOR_PALETTE = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#8b5cf6', '#ef4444', '#0ea5e9'];

type ContactFormState = {
  phone: string; name: string; email: string; sector: string; source: string;
  tags: string; notes: string; optedIn: boolean; birthday: string; address: string;
};

const defaultForm = (): ContactFormState => ({
  phone: '', name: '', email: '', sector: 'geral', source: 'manual',
  tags: '', notes: '', optedIn: true, birthday: '', address: '',
});

type SubFormState = { phone: string; name: string; email: string; sector: string; source: string; tags: string; };
const defaultSubForm = (): SubFormState => ({ phone: '', name: '', email: '', sector: 'geral', source: 'formulario', tags: '' });

export const WhatsAppContactsPage = () => {
  const { csrfToken } = useCrm();
  const [tab, setTab] = useState<Tab>('contacts');

  // Contacts
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(1);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [contactSector, setContactSector] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [editContact, setEditContact] = useState<WaContact | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(defaultForm());
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<WaSubscription[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsPage, setSubsPage] = useState(1);
  const [subsTotalPages, setSubsTotalPages] = useState(1);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subsSearch, setSubsSearch] = useState('');
  const [subsSector, setSubsSector] = useState('');
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState<SubFormState>(defaultSubForm());
  const [subSaving, setSubSaving] = useState(false);

  // Sectors
  const [sectors, setSectors] = useState<WaSector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorColor, setNewSectorColor] = useState('#10b981');
  const [newSectorDesc, setNewSectorDesc] = useState('');
  const [savingSector, setSavingSector] = useState(false);

  const loadContacts = async (page = contactsPage) => {
    setLoadingContacts(true);
    try {
      const params = new URLSearchParams({ page: String(page), search: contactSearch, sector: contactSector, status: contactStatus });
      const data = await crmRequest<ContactsPayload>(`/api/crm/wa/contacts?${params}`);
      if (data?.ok) { setContacts(data.contacts); setContactsTotal(data.total); setContactsTotalPages(data.totalPages); }
    } finally { setLoadingContacts(false); }
  };

  const loadSubscriptions = async (page = subsPage) => {
    setLoadingSubs(true);
    try {
      const params = new URLSearchParams({ page: String(page), search: subsSearch, sector: subsSector });
      const data = await crmRequest<SubscriptionsPayload>(`/api/crm/wa/subscriptions?${params}`);
      if (data?.ok) { setSubscriptions(data.subscriptions); setSubsTotal(data.total); setSubsTotalPages(data.totalPages); }
    } finally { setLoadingSubs(false); }
  };

  const loadSectors = async () => {
    setLoadingSectors(true);
    try {
      const data = await crmRequest<SectorsPayload>('/api/crm/wa/sectors');
      if (data?.ok) setSectors(data.sectors);
    } finally { setLoadingSectors(false); }
  };

  useEffect(() => { loadContacts(1); setContactsPage(1); }, [contactSearch, contactSector, contactStatus]);
  useEffect(() => { if (tab === 'subscriptions') loadSubscriptions(1); if (tab === 'sectors') loadSectors(); }, [tab]);

  const handleOpenNewContact = () => { setEditContact(null); setContactForm(defaultForm()); setShowContactForm(true); };
  const handleOpenEditContact = (c: WaContact) => {
    setEditContact(c);
    setContactForm({ phone: c.phone, name: c.name, email: c.email, sector: c.sector, source: c.source, tags: c.tags.join(', '), notes: c.notes, optedIn: c.optedIn, birthday: c.birthday ?? '', address: c.address ?? '' });
    setShowContactForm(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.phone.trim()) return;
    setContactSaving(true);
    try {
      const body = {
        phone: contactForm.phone.trim(),
        name: contactForm.name,
        email: contactForm.email,
        sector: contactForm.sector,
        source: contactForm.source,
        tags: contactForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: contactForm.notes,
        optedIn: contactForm.optedIn,
        birthday: contactForm.birthday || undefined,
        address: contactForm.address || undefined,
      };
      const url = editContact ? `/api/crm/wa/contacts/${editContact.id}` : '/api/crm/wa/contacts';
      const method = editContact ? 'PUT' : 'POST';
      const data = await crmRequest<{ ok: boolean; contact: WaContact }>(url, { method, body: JSON.stringify(body) }, csrfToken);
      if (data?.ok) {
        setShowContactForm(false);
        loadContacts(contactsPage);
      }
    } finally { setContactSaving(false); }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Excluir este contato?')) return;
    await crmRequest(`/api/crm/wa/contacts/${id}`, { method: 'DELETE' }, csrfToken);
    loadContacts(contactsPage);
  };

  const handleSaveSubscription = async () => {
    if (!subForm.phone.trim()) return;
    setSubSaving(true);
    try {
      const body = { phone: subForm.phone.trim(), name: subForm.name, email: subForm.email, sector: subForm.sector, source: subForm.source, tags: subForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
      const data = await crmRequest<{ ok: boolean }>('/api/crm/wa/subscriptions', { method: 'POST', body: JSON.stringify(body) }, csrfToken);
      if (data?.ok) { setShowSubForm(false); setSubForm(defaultSubForm()); loadSubscriptions(1); }
    } finally { setSubSaving(false); }
  };

  const handleCancelSub = async (id: string) => {
    if (!confirm('Cancelar inscrição?')) return;
    await crmRequest(`/api/crm/wa/subscriptions/${id}`, { method: 'DELETE' }, csrfToken);
    loadSubscriptions(subsPage);
  };

  const handleCreateSector = async () => {
    if (!newSectorName.trim()) return;
    setSavingSector(true);
    try {
      const data = await crmRequest<{ ok: boolean }>('/api/crm/wa/sectors', { method: 'POST', body: JSON.stringify({ name: newSectorName.trim(), description: newSectorDesc, color: newSectorColor }) }, csrfToken);
      if (data?.ok) { setNewSectorName(''); setNewSectorDesc(''); loadSectors(); }
    } finally { setSavingSector(false); }
  };

  const allSectors = ['geral', ...sectors.map(s => s.name)];

  return (
    <div className="space-y-6">
      <PageHeader title="Base de Clientes" description="Contatos WhatsApp, setorização e inscrições" />

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {([['contacts', 'Contatos'], ['subscriptions', 'Inscrições'], ['sectors', 'Setores']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-t-2xl px-5 py-2.5 text-sm font-medium transition ${tab === key ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── CONTATOS ── */}
      {tab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="search" placeholder="Buscar por nome, telefone ou email..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className={InputClassName + ' max-w-xs text-xs py-2'} />
            <select value={contactSector} onChange={e => setContactSector(e.target.value)} className={InputClassName + ' max-w-[140px] text-xs py-2'}>
              <option value="">Todos setores</option>
              {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={contactStatus} onChange={e => setContactStatus(e.target.value)} className={InputClassName + ' max-w-[120px] text-xs py-2'}>
              <option value="">Todos status</option>
              <option value="ativo">Ativo</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="arquivado">Arquivado</option>
            </select>
            <span className="ml-auto text-xs text-slate-500">{contactsTotal} contatos</span>
            <Button onClick={handleOpenNewContact}>+ Novo Contato</Button>
          </div>

          {showContactForm && (
            <Panel>
              <h3 className="mb-4 font-semibold text-white">{editContact ? 'Editar Contato' : 'Novo Contato'}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Telefone *"><input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 19 99999-9999" className={InputClassName} disabled={!!editContact} /></Field>
                <Field label="Nome"><input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Email"><input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Setor">
                  <select value={contactForm.sector} onChange={e => setContactForm(f => ({ ...f, sector: e.target.value }))} className={InputClassName}>
                    {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Origem"><input value={contactForm.source} onChange={e => setContactForm(f => ({ ...f, source: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Tags (separadas por vírgula)"><input value={contactForm.tags} onChange={e => setContactForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, cliente, pedido" className={InputClassName} /></Field>
                <Field label="Aniversário"><input type="date" value={contactForm.birthday} onChange={e => setContactForm(f => ({ ...f, birthday: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Endereço"><input value={contactForm.address} onChange={e => setContactForm(f => ({ ...f, address: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Observações"><textarea value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={InputClassName + ' resize-none'} /></Field>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={contactForm.optedIn} onChange={e => setContactForm(f => ({ ...f, optedIn: e.target.checked }))} className="accent-amber-400" />
                  Opt-in confirmado
                </label>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" onClick={() => setShowContactForm(false)}>Cancelar</Button>
                  <Button onClick={handleSaveContact} disabled={contactSaving}>{contactSaving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </div>
            </Panel>
          )}

          {loadingContacts ? <LoadingSpinner /> : (
            <Table>
              <thead><tr className="bg-white/3 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Opt-in</th>
                <th className="px-4 py-3 font-medium">Mensagens</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {contacts.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-slate-500">Nenhum contato encontrado.</td></tr>
                ) : contacts.map(c => (
                  <tr key={c.id} className="hover:bg-white/3">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white">
                          {(c.name || c.phone).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.name || '—'}</p>
                          <p className="text-xs text-slate-500">{c.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{c.sector}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map(t => <span key={t} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{t}</span>)}
                        {c.tags.length > 3 && <span className="text-[10px] text-slate-500">+{c.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={STATUS_COLORS[c.status] as any}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-center text-xs">{c.optedIn ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <span title="Recebidas">↓{c.totalMessagesReceived}</span> <span title="Enviadas">↑{c.totalMessagesSent}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEditContact(c)} className="rounded-xl bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10">Editar</button>
                        <button onClick={() => handleDeleteContact(c.id)} className="rounded-xl bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination page={contactsPage} totalPages={contactsTotalPages} onPageChange={p => { setContactsPage(p); loadContacts(p); }} />
        </div>
      )}

      {/* ── INSCRIÇÕES ── */}
      {tab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="search" placeholder="Buscar inscrito..." value={subsSearch} onChange={e => setSubsSearch(e.target.value)} className={InputClassName + ' max-w-xs text-xs py-2'} />
            <select value={subsSector} onChange={e => setSubsSector(e.target.value)} className={InputClassName + ' max-w-[140px] text-xs py-2'}>
              <option value="">Todos setores</option>
              {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="ml-auto text-xs text-slate-500">{subsTotal} inscritos</span>
            <Button onClick={() => setShowSubForm(!showSubForm)}>+ Inscrever</Button>
          </div>

          {showSubForm && (
            <Panel>
              <h3 className="mb-4 font-semibold text-white">Nova Inscrição na Base</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Telefone *"><input value={subForm.phone} onChange={e => setSubForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 19 99999-9999" className={InputClassName} /></Field>
                <Field label="Nome"><input value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Email"><input type="email" value={subForm.email} onChange={e => setSubForm(f => ({ ...f, email: e.target.value }))} className={InputClassName} /></Field>
                <Field label="Setor">
                  <select value={subForm.sector} onChange={e => setSubForm(f => ({ ...f, sector: e.target.value }))} className={InputClassName}>
                    {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Origem"><input value={subForm.source} onChange={e => setSubForm(f => ({ ...f, source: e.target.value }))} placeholder="site, balcão, evento..." className={InputClassName} /></Field>
                <Field label="Tags"><input value={subForm.tags} onChange={e => setSubForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, evento, promo" className={InputClassName} /></Field>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowSubForm(false)}>Cancelar</Button>
                <Button onClick={handleSaveSubscription} disabled={subSaving}>{subSaving ? 'Inscrevendo...' : 'Inscrever'}</Button>
              </div>
            </Panel>
          )}

          {loadingSubs ? <LoadingSpinner /> : (
            <Table>
              <thead><tr className="bg-white/3 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Inscrito</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500">Nenhuma inscrição encontrada.</td></tr>
                ) : subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-white/3">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{s.name || '—'}</p>
                      <p className="text-xs text-slate-500">{s.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{s.phone}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{s.sector}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{s.source}</td>
                    <td className="px-4 py-3"><Badge tone={s.status === 'ativo' ? 'success' : s.status === 'cancelado' ? 'danger' : 'neutral'}>{s.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.optedInAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      {s.status === 'ativo' && (
                        <button onClick={() => handleCancelSub(s.id)} className="rounded-xl bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20">Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination page={subsPage} totalPages={subsTotalPages} onPageChange={p => { setSubsPage(p); loadSubscriptions(p); }} />
        </div>
      )}

      {/* ── SETORES ── */}
      {tab === 'sectors' && (
        <div className="space-y-6">
          {/* Criar novo setor */}
          <Panel>
            <h3 className="mb-4 font-semibold text-white">Criar Novo Setor</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Nome do Setor *">
                <input value={newSectorName} onChange={e => setNewSectorName(e.target.value)} placeholder="ex: vip, eventos, delivery..." className={InputClassName} />
              </Field>
              <Field label="Descrição">
                <input value={newSectorDesc} onChange={e => setNewSectorDesc(e.target.value)} className={InputClassName} />
              </Field>
              <Field label="Cor">
                <div className="flex gap-2 flex-wrap">
                  {SECTOR_PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewSectorColor(c)}
                      className={`h-7 w-7 rounded-full transition ${newSectorColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </Field>
              <div className="flex items-end">
                <Button onClick={handleCreateSector} disabled={savingSector || !newSectorName.trim()}>{savingSector ? 'Criando...' : 'Criar Setor'}</Button>
              </div>
            </div>
          </Panel>

          {/* Lista de setores */}
          {loadingSectors ? <LoadingSpinner /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Setor padrão */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: '#6b7280' + '33' }}>
                    <span style={{ color: '#6b7280', fontSize: 18 }}>●</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white capitalize">geral</p>
                    <p className="text-xs text-slate-500">Setor padrão</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Padrão do sistema</span>
                </div>
              </div>

              {sectors.map((s) => (
                <div key={s.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: s.color + '33' }}>
                      <span style={{ color: s.color, fontSize: 18 }}>●</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{s.contactCount} contato{s.contactCount !== 1 ? 's' : ''}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: '100%', background: s.color, opacity: 0.5 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
