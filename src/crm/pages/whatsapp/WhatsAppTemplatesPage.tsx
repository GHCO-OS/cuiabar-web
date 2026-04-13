import { useEffect, useState } from 'react';
import { crmRequest } from '../../api';
import { Button, Field, InputClassName, LoadingSpinner, PageHeader, Panel } from '../../components';
import { useCrm } from '../../context';
import type { WaTemplate } from '../../types';

interface TemplatesPayload { ok: boolean; templates: WaTemplate[]; }

type FormState = {
  name: string;
  category: string;
  content: string;
  tags: string;
  language: string;
};

const defaultForm = (): FormState => ({
  name: '', category: 'geral', content: '', tags: '', language: 'pt_BR',
});

const CATEGORIES = ['geral', 'saudacao', 'cardapio', 'reservas', 'promocoes', 'horarios', 'pagamento', 'pos_venda', 'follow_up', 'nps'];

const CATEGORY_COLORS: Record<string, string> = {
  geral: 'bg-slate-500/20 text-slate-300',
  saudacao: 'bg-emerald-500/20 text-emerald-300',
  cardapio: 'bg-amber-500/20 text-amber-300',
  reservas: 'bg-blue-500/20 text-blue-300',
  promocoes: 'bg-pink-500/20 text-pink-300',
  horarios: 'bg-cyan-500/20 text-cyan-300',
  pagamento: 'bg-violet-500/20 text-violet-300',
  pos_venda: 'bg-orange-500/20 text-orange-300',
  follow_up: 'bg-teal-500/20 text-teal-300',
  nps: 'bg-indigo-500/20 text-indigo-300',
};

const PRESET_TEMPLATES = [
  {
    name: 'Saudação Inicial',
    category: 'saudacao',
    content: 'Olá, {{name}}! Bem-vindo ao Cuiabar 🍖\n\nSou o assistente virtual e estou aqui para te ajudar!\n\nComo posso te ajudar hoje?\n1️⃣ Fazer uma reserva\n2️⃣ Ver o cardápio\n3️⃣ Informações sobre promoções\n4️⃣ Falar com atendente',
  },
  {
    name: 'Horário de Funcionamento',
    category: 'horarios',
    content: 'Nosso horário de funcionamento é:\n\n🕐 *Terça a Sexta:* 11h30 às 15h | 18h às 23h\n🕐 *Sábado e Domingo:* 11h30 às 16h | 18h às 23h\n🚫 *Segunda-feira:* Fechado\n\nTe esperamos por aqui! 😊',
  },
  {
    name: 'Confirmação de Reserva',
    category: 'reservas',
    content: 'Perfeito, {{name}}! ✅\n\nSua reserva foi confirmada:\n📅 Data: {{date}}\n🕐 Horário: {{time}}\n👥 Pessoas: {{guests}}\n📋 Código: {{code}}\n\nEm caso de cancelamento, nos avise com pelo menos 2h de antecedência.\n\nTe esperamos! 🍖',
  },
  {
    name: 'Cardápio Online',
    category: 'cardapio',
    content: 'Que ótimo que você quer conhecer nosso cardápio! 😍\n\nVeja todos os nossos pratos e opções especiais em:\n👉 https://cuiabar.com/cardapio\n\nTemos opções para todos os gostos! Alguma dúvida sobre algum prato específico?',
  },
  {
    name: 'NPS Pós-Visita',
    category: 'nps',
    content: 'Olá, {{name}}! 😊\n\nObrigado por nos visitar no dia {{date}}!\n\nQue nota você daria para a sua experiência no Cuiabar?\n(De 0 a 10)\n\nSua opinião é muito importante para nós! ⭐',
  },
  {
    name: 'Promoção Especial',
    category: 'promocoes',
    content: '🎉 *PROMOÇÃO ESPECIAL* 🎉\n\n{{promo_title}}\n\n{{promo_description}}\n\n📅 Válido até: {{promo_date}}\n\n Não perca! Reserve já pelo nosso site ou responda essa mensagem. 🍖',
  },
];

const VariableHighlight = ({ content }: { content: string }) => {
  const parts = content.split(/(\{\{[\w]+\}\})/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('{{') && part.endsWith('}}') ? (
          <span key={i} className="rounded bg-amber-500/20 px-1 text-amber-300 font-mono text-[11px]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
};

export const WhatsAppTemplatesPage = () => {
  const { csrfToken } = useCrm();
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [editItem, setEditItem] = useState<WaTemplate | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const [showPresets, setShowPresets] = useState(false);
  const [importingPresets, setImportingPresets] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: categoryFilter, search });
      const data = await crmRequest<TemplatesPayload>(`/api/crm/wa/templates?${params}`);
      if (data?.ok) setTemplates(data.templates);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [categoryFilter, search]);

  const handleOpenNew = () => { setEditItem(null); setForm(defaultForm()); setPreviewContent(''); setShowForm(true); };
  const handleOpenEdit = (tpl: WaTemplate) => {
    setEditItem(tpl);
    setForm({ name: tpl.name, category: tpl.category, content: tpl.content, tags: tpl.tags.join(', '), language: tpl.language });
    setPreviewContent(tpl.content);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), category: form.category, content: form.content.trim(), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), language: form.language };
      const url = editItem ? `/api/crm/wa/templates/${editItem.id}` : '/api/crm/wa/templates';
      const method = editItem ? 'PUT' : 'POST';
      const data = await crmRequest<{ ok: boolean }>(url, { method, body: JSON.stringify(body) }, csrfToken);
      if (data?.ok) { setShowForm(false); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    await crmRequest(`/api/crm/wa/templates/${id}`, { method: 'DELETE' }, csrfToken);
    load();
  };

  const handleImportPresets = async () => {
    setImportingPresets(true);
    try {
      for (const preset of PRESET_TEMPLATES) {
        await crmRequest('/api/crm/wa/templates', { method: 'POST', body: JSON.stringify(preset) }, csrfToken);
      }
      setShowPresets(false);
      load();
    } finally { setImportingPresets(false); }
  };

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = templates.filter(t => t.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredTemplates = templates.filter(t =>
    (!categoryFilter || t.category === categoryFilter) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Resposta"
        description="Mensagens prontas para envio rápido no atendimento"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowPresets(!showPresets)}>Templates Prontos</Button>
            <Button onClick={handleOpenNew}>+ Novo Template</Button>
          </div>
        }
      />

      {/* Presets */}
      {showPresets && (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Templates Prontos do Cuiabar</h3>
            <Button onClick={handleImportPresets} disabled={importingPresets}>
              {importingPresets ? 'Importando...' : 'Importar Todos'}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESET_TEMPLATES.map((preset, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/3 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[preset.category] ?? CATEGORY_COLORS.geral}`}>
                    {preset.category}
                  </span>
                  <span className="text-sm font-medium text-white">{preset.name}</span>
                </div>
                <p className="whitespace-pre-line text-xs text-slate-400 line-clamp-3">{preset.content}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Form */}
      {showForm && (
        <Panel>
          <h3 className="mb-4 font-semibold text-white">{editItem ? 'Editar Template' : 'Novo Template'}</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Nome do Template *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Confirmação de Reserva" className={InputClassName} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={InputClassName}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Idioma">
                  <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={InputClassName}>
                    <option value="pt_BR">Português (BR)</option>
                    <option value="en_US">English (US)</option>
                    <option value="es_ES">Español</option>
                  </select>
                </Field>
              </div>
              <Field label="Tags">
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="confirmacao, reserva, boas-vindas" className={InputClassName} />
              </Field>
              <Field label="Conteúdo *" hint="Use {{variavel}} para campos dinâmicos. Ex: {{name}}, {{date}}, {{time}}">
                <textarea
                  value={form.content}
                  onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setPreviewContent(e.target.value); }}
                  rows={8}
                  placeholder="Escreva o template aqui. Use {{name}} para o nome do cliente, {{date}} para data, etc."
                  className={InputClassName + ' resize-none font-mono text-xs leading-relaxed'}
                />
              </Field>
            </div>

            {/* Preview */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Preview</p>
              <div className="rounded-3xl bg-[#0a1929] border border-white/5 p-4 min-h-[200px]">
                <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">C</div>
                  <div>
                    <p className="text-xs font-medium text-white">Cuiabar</p>
                    <p className="text-[10px] text-slate-500">WhatsApp Business</p>
                  </div>
                </div>
                {previewContent ? (
                  <div className="rounded-2xl rounded-bl-sm bg-emerald-600/80 p-3 text-sm text-white leading-relaxed max-w-[85%]">
                    <VariableHighlight content={previewContent} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">O preview aparecerá aqui...</p>
                )}
              </div>

              {/* Variables detected */}
              {form.content && (
                <div className="mt-3">
                  {(() => {
                    const vars = [...(form.content.matchAll(/\{\{(\w+)\}\}/g))].map(m => m[1]);
                    const unique = [...new Set(vars)];
                    return unique.length > 0 ? (
                      <div>
                        <p className="mb-1.5 text-[10px] text-slate-500">Variáveis detectadas:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {unique.map(v => (
                            <span key={v} className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] text-amber-300">{`{{${v}}}`}</span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end border-t border-white/10 pt-4">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Template'}</Button>
          </div>
        </Panel>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" placeholder="Buscar template..." value={search} onChange={e => setSearch(e.target.value)} className={InputClassName + ' max-w-xs text-xs py-2'} />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCategoryFilter('')} className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${categoryFilter === '' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            Todos ({templates.length})
          </button>
          {CATEGORIES.filter(c => categoryCounts[c] > 0).map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${categoryFilter === c ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {c} ({categoryCounts[c]})
            </button>
          ))}
        </div>
      </div>

      {/* Grid de templates */}
      {loading ? <LoadingSpinner /> : filteredTemplates.length === 0 ? (
        <Panel>
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-amber-400">
                <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="4" y1="11" x2="28" y2="11" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="10" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="22" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Nenhum template encontrado.</p>
            <p className="text-xs text-slate-500">Crie templates ou importe os templates prontos do Cuiabar.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" onClick={() => setShowPresets(true)}>Ver templates prontos</Button>
              <Button onClick={handleOpenNew}>Criar template</Button>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className={`group rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/20 ${tpl.status === 'inativo' ? 'opacity-60' : ''}`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{tpl.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[tpl.category] ?? CATEGORY_COLORS.geral}`}>
                      {tpl.category}
                    </span>
                    {tpl.usageCount > 0 && (
                      <span className="text-[10px] text-slate-500">Usado {tpl.usageCount}x</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => handleOpenEdit(tpl)} className="rounded-xl bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10">✏️</button>
                  <button onClick={() => handleDelete(tpl.id)} className="rounded-xl bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20">🗑️</button>
                </div>
              </div>

              {/* Preview da mensagem */}
              <div className="rounded-2xl bg-slate-900/60 p-3">
                <p className="line-clamp-4 whitespace-pre-line text-xs text-slate-300 leading-relaxed">
                  <VariableHighlight content={tpl.content} />
                </p>
              </div>

              {/* Variables */}
              {tpl.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tpl.variables.map(v => (
                    <span key={v} className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}

              {/* Tags */}
              {tpl.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tpl.tags.map(t => <span key={t} className="text-[9px] text-slate-600">#{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
