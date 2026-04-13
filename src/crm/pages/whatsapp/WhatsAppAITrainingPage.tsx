import { useEffect, useState } from 'react';
import { crmRequest } from '../../api';
import { Button, Field, InputClassName, LoadingSpinner, PageHeader, Panel, Pagination } from '../../components';
import { useCrm } from '../../context';
import type { WaAiTraining } from '../../types';

interface TrainingPayload {
  ok: boolean;
  items: WaAiTraining[];
  total: number;
  totalPages: number;
  categories: Array<{ category: string; total: number }>;
}

interface AiTestPayload {
  ok: boolean;
  suggestion: { answer: string; confidence: number; trainingId: string } | null;
}

type FormState = {
  question: string;
  answer: string;
  category: string;
  sector: string;
  tags: string;
  confidenceScore: string;
};

const defaultForm = (): FormState => ({
  question: '', answer: '', category: 'geral', sector: 'geral', tags: '', confidenceScore: '1.0',
});

const CATEGORY_COLORS: Record<string, string> = {
  geral: 'bg-slate-500/20 text-slate-300',
  cardapio: 'bg-emerald-500/20 text-emerald-300',
  reservas: 'bg-blue-500/20 text-blue-300',
  atendimento: 'bg-amber-500/20 text-amber-300',
  promocoes: 'bg-pink-500/20 text-pink-300',
  horarios: 'bg-cyan-500/20 text-cyan-300',
  pagamento: 'bg-violet-500/20 text-violet-300',
  localizacao: 'bg-orange-500/20 text-orange-300',
};

const DEFAULT_CATEGORIES = ['geral', 'cardapio', 'reservas', 'atendimento', 'promocoes', 'horarios', 'pagamento', 'localizacao'];

const ConfidenceBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${value >= 0.8 ? 'bg-emerald-500' : value >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <span className="text-[10px] text-slate-400">{Math.round(value * 100)}%</span>
  </div>
);

export const WhatsAppAITrainingPage = () => {
  const { csrfToken } = useCrm();
  const [items, setItems] = useState<WaAiTraining[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Array<{ category: string; total: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const [editItem, setEditItem] = useState<WaAiTraining | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Test
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ answer: string; confidence: number; trainingId: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), category: categoryFilter, search, active: activeOnly ? '1' : '' });
      const data = await crmRequest<TrainingPayload>(`/api/crm/wa/ai-training?${params}`);
      if (data?.ok) {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCategories(data.categories);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [categoryFilter, search, activeOnly]);

  const handleOpenNew = () => { setEditItem(null); setForm(defaultForm()); setShowForm(true); };
  const handleOpenEdit = (item: WaAiTraining) => {
    setEditItem(item);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
      sector: item.sector,
      tags: item.tags.join(', '),
      confidenceScore: String(item.confidenceScore),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const body = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category,
        sector: form.sector,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        confidenceScore: parseFloat(form.confidenceScore) || 1.0,
      };
      const url = editItem ? `/api/crm/wa/ai-training/${editItem.id}` : '/api/crm/wa/ai-training';
      const method = editItem ? 'PUT' : 'POST';
      const data = await crmRequest<{ ok: boolean }>(url, { method, body: JSON.stringify(body) }, csrfToken);
      if (data?.ok) { setShowForm(false); load(page); }
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (item: WaAiTraining) => {
    await crmRequest(`/api/crm/wa/ai-training/${item.id}`, { method: 'PUT', body: JSON.stringify({ active: !item.active }) }, csrfToken);
    load(page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este par de treinamento?')) return;
    await crmRequest(`/api/crm/wa/ai-training/${id}`, { method: 'DELETE' }, csrfToken);
    load(page);
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const data = await crmRequest<AiTestPayload>(
        '/api/crm/wa/ai-suggest',
        { method: 'POST', body: JSON.stringify({ message: testInput }) },
        csrfToken,
      );
      if (data?.ok) setTestResult(data.suggestion);
    } finally { setTesting(false); }
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      // Parse CSV format: question | answer | category
      const lines = importText.split('\n').filter(l => l.trim());
      let imported = 0;
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const body = { question: parts[0], answer: parts[1], category: parts[2] ?? 'geral', sector: parts[3] ?? 'geral' };
          await crmRequest('/api/crm/wa/ai-training', { method: 'POST', body: JSON.stringify(body) }, csrfToken);
          imported++;
        }
      }
      setImportText('');
      setShowImport(false);
      load(1);
      alert(`${imported} pares importados com sucesso!`);
    } finally { setImporting(false); }
  };

  const totalActiveItems = categories.reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treinamento da IA"
        description="Ensine a IA a responder clientes com pares de pergunta e resposta"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowImport(!showImport)}>Importar CSV</Button>
            <Button onClick={handleOpenNew}>+ Adicionar Par</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Panel className="!p-4 bg-slate-900/80">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Pares Ativos</p>
          <p className="mt-2 text-2xl font-bold text-white">{totalActiveItems}</p>
        </Panel>
        <Panel className="!p-4 bg-slate-900/80">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Categorias</p>
          <p className="mt-2 text-2xl font-bold text-white">{categories.length}</p>
        </Panel>
        <Panel className="!p-4 bg-slate-900/80">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Usos IA</p>
          <p className="mt-2 text-2xl font-bold text-white">{items.reduce((a, b) => a + b.usageCount, 0)}</p>
        </Panel>
        <Panel className="!p-4 bg-slate-900/80">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Aprovação</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {(() => {
              const pos = items.reduce((a, b) => a + b.feedbackPositive, 0);
              const total = pos + items.reduce((a, b) => a + b.feedbackNegative, 0);
              return total > 0 ? `${Math.round((pos / total) * 100)}%` : '—';
            })()}
          </p>
        </Panel>
      </div>

      {/* Tester */}
      <Panel>
        <h3 className="mb-3 font-semibold text-white">Testar IA em Tempo Real</h3>
        <p className="mb-3 text-xs text-slate-400">Simule uma mensagem de cliente e veja qual resposta a IA sugerirá.</p>
        <div className="flex gap-3">
          <input
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
            placeholder="Ex: Qual o horário de funcionamento?"
            className={InputClassName + ' flex-1'}
          />
          <Button onClick={handleTest} disabled={testing || !testInput.trim()}>
            {testing ? 'Testando...' : 'Testar'}
          </Button>
        </div>
        {testResult ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-300">✦ Resposta Sugerida pela IA</span>
              <ConfidenceBar value={testResult.confidence} />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{testResult.answer}</p>
          </div>
        ) : testInput && !testing && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-500">Nenhuma resposta encontrada para essa pergunta. Adicione um par de treinamento!</p>
          </div>
        )}
      </Panel>

      {/* Import bulk */}
      {showImport && (
        <Panel>
          <h3 className="mb-2 font-semibold text-white">Importar Pares via Texto</h3>
          <p className="mb-3 text-xs text-slate-400">Formato: <code className="rounded bg-white/10 px-1">pergunta | resposta | categoria | setor</code> (uma por linha)</p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={6}
            placeholder={`Qual o horário? | Funcionamos de ter a dom, 11h às 23h. | horarios | geral\nVocês aceitam cartão? | Sim, aceitamos todos os cartões. | pagamento | geral`}
            className={InputClassName + ' resize-none font-mono text-xs'}
          />
          <div className="mt-3 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
            <Button onClick={handleBulkImport} disabled={importing || !importText.trim()}>{importing ? 'Importando...' : 'Importar'}</Button>
          </div>
        </Panel>
      )}

      {/* Form */}
      {showForm && (
        <Panel>
          <h3 className="mb-4 font-semibold text-white">{editItem ? 'Editar Par de Treinamento' : 'Novo Par de Treinamento'}</h3>
          <div className="space-y-4">
            <Field label="Pergunta do Cliente *">
              <textarea
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                rows={2}
                placeholder="Ex: Qual o horário de funcionamento? / Vocês fazem reserva? / Aceitam cartão?"
                className={InputClassName + ' resize-none'}
              />
            </Field>
            <Field label="Resposta da IA *">
              <textarea
                value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                rows={4}
                placeholder="Escreva a resposta ideal e completa que a IA deve dar para esta pergunta..."
                className={InputClassName + ' resize-none'}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Categoria">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={InputClassName}>
                  {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="outro">outro</option>
                </select>
              </Field>
              <Field label="Setor">
                <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="geral" className={InputClassName} />
              </Field>
              <Field label="Tags">
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="horario, funcionamento" className={InputClassName} />
              </Field>
              <Field label="Confiança (0.0 - 1.0)" hint="Peso da resposta na IA">
                <input
                  type="number" min="0" max="1" step="0.1"
                  value={form.confidenceScore}
                  onChange={e => setForm(f => ({ ...f, confidenceScore: e.target.value }))}
                  className={InputClassName}
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Par'}</Button>
          </div>
        </Panel>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" placeholder="Buscar pergunta ou resposta..." value={search} onChange={e => setSearch(e.target.value)} className={InputClassName + ' max-w-xs text-xs py-2'} />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCategoryFilter('')} className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${categoryFilter === '' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            Todas
          </button>
          {categories.map(c => (
            <button
              key={c.category}
              onClick={() => setCategoryFilter(c.category)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${categoryFilter === c.category ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {c.category} <span className="opacity-60">({c.total})</span>
            </button>
          ))}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="accent-amber-400" />
          Apenas ativos
        </label>
        <span className="text-xs text-slate-500">{total} pares</span>
      </div>

      {/* Lista */}
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <Panel>
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/10">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-violet-400">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2v4M16 26v4M2 16h4M26 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400">Nenhum par de treinamento encontrado.</p>
                <p className="text-xs text-slate-500">Adicione perguntas e respostas para ensinar a IA a atender seus clientes.</p>
                <Button onClick={handleOpenNew}>Adicionar primeiro par</Button>
              </div>
            </Panel>
          ) : items.map(item => (
            <div
              key={item.id}
              className={`rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/20 ${!item.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">Q</span>
                    <p className="text-sm font-medium text-white">{item.question}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">A</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.answer}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.geral}`}>
                      {item.category}
                    </span>
                    {item.sector !== 'geral' && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{item.sector}</span>
                    )}
                    {item.tags.map(t => <span key={t} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">{t}</span>)}
                    <ConfidenceBar value={item.confidenceScore} />
                    <span className="text-[10px] text-slate-500">Usado {item.usageCount}x</span>
                    {(item.feedbackPositive + item.feedbackNegative) > 0 && (
                      <span className="text-[10px] text-slate-500">
                        👍{item.feedbackPositive} 👎{item.feedbackNegative}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${item.active ? 'bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300' : 'bg-white/5 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-300'}`}
                  >
                    {item.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button onClick={() => handleOpenEdit(item)} className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-xl bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); load(p); }} />
    </div>
  );
};
