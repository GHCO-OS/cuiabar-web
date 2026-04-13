import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { crmRequest } from '../../api';
import { InputClassName, LoadingSpinner, MetricCard, PageHeader, Panel } from '../../components';
import { useCrm } from '../../context';
import type { WaConversation, WaDashboardMetrics } from '../../types';

interface DashboardPayload {
  ok: boolean;
  metrics: WaDashboardMetrics;
  sectorDistribution: Array<{ sector: string; total: number }>;
  recentConversations: WaConversation[];
}

interface SettingsPayload {
  ok: boolean;
  settings: Record<string, unknown>;
}

const statusColor: Record<string, string> = {
  aberta: 'bg-emerald-500/20 text-emerald-300',
  pendente: 'bg-amber-500/20 text-amber-300',
  aguardando: 'bg-blue-500/20 text-blue-300',
  bot: 'bg-violet-500/20 text-violet-300',
  fechada: 'bg-slate-500/20 text-slate-400',
};

const statusLabel: Record<string, string> = {
  aberta: 'Aberta',
  pendente: 'Pendente',
  aguardando: 'Aguardando',
  bot: 'Bot',
  fechada: 'Fechada',
};

const sentimentIcon: Record<string, string> = {
  positivo: '😊',
  neutro: '😐',
  negativo: '😞',
};

const SECTOR_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#8b5cf6'];

const QuickActionCard = ({ icon, title, desc, to, color }: { icon: React.ReactNode; title: string; desc: string; to: string; color: string }) => (
  <Link to={to} className="group flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/20 hover:bg-slate-900/80">
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${color}`}>{icon}</div>
    <div>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </div>
  </Link>
);

// ── Painel Modo Teste / Produção ────────────────────────────────────────────
const TestModePanel = () => {
  const { csrfToken } = useCrm();
  const [testMode, setTestMode] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [pendingNumber, setPendingNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    crmRequest<SettingsPayload>('/api/crm/wa/settings').then((data) => {
      if (data?.ok) {
        setTestMode(data.settings.wa_test_mode === true);
        const num = (data.settings.wa_test_number as string) ?? '';
        setTestNumber(num);
        setPendingNumber(num);
      }
    }).finally(() => setLoadingSettings(false));
  }, []);

  const handleToggle = async (enabled: boolean) => {
    // Se está ativando sem número definido, não permite
    if (enabled && !pendingNumber.trim()) return;
    setTestMode(enabled);
    await save(enabled, pendingNumber);
  };

  const save = async (mode: boolean, number: string) => {
    setSaving(true);
    try {
      await crmRequest('/api/crm/wa/settings', {
        method: 'PUT',
        body: JSON.stringify({ wa_test_mode: mode, wa_test_number: number.trim() }),
      }, csrfToken);
      setTestNumber(number.trim());
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) return null;

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
      testMode
        ? 'border-amber-500/40 bg-amber-500/8'
        : 'border-emerald-500/30 bg-emerald-500/5'
    }`}>
      {/* Faixa de status superior */}
      <div className={`flex items-center gap-3 px-5 py-3 ${testMode ? 'bg-amber-500/15' : 'bg-emerald-500/10'}`}>
        <div className={`flex h-2 w-2 rounded-full ${testMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
        <p className={`text-xs font-bold uppercase tracking-widest ${testMode ? 'text-amber-300' : 'text-emerald-300'}`}>
          {testMode ? 'Modo Aprendizado Ativo — Bot respondendo apenas o número de teste' : 'Modo Produção — Bot respondendo todos os contatos'}
        </p>
        {saved && (
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">Salvo ✓</span>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        {/* Ícone e descrição */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl ${testMode ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
            {testMode ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-amber-400">
                <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 8l6 6M14 8l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-emerald-400">
                <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">
              {testMode ? 'Aprendizado / Teste' : 'Produção Ativa'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 max-w-sm">
              {testMode
                ? 'O bot está em modo silencioso. Apenas mensagens do número de teste serão processadas. Use para treinar e validar a IA antes de ativar para todos.'
                : 'O bot está respondendo ativamente. Todas as mensagens recebidas serão processadas pela IA e atendentes.'}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-shrink-0 flex-col gap-3 sm:items-end">
          {/* Número de teste */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="tel"
                value={pendingNumber}
                onChange={e => setPendingNumber(e.target.value)}
                placeholder="+55 19 99999-9999"
                className={`${InputClassName} w-48 py-2 text-xs pr-3 ${!testMode && !pendingNumber ? 'opacity-60' : ''}`}
              />
              {pendingNumber && pendingNumber === testNumber && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400">✓</span>
              )}
            </div>
            {pendingNumber !== testNumber && (
              <button
                onClick={() => save(testMode, pendingNumber)}
                disabled={saving || !pendingNumber.trim()}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 disabled:opacity-50 transition"
              >
                {saving ? '...' : 'Salvar nº'}
              </button>
            )}
          </div>

          {/* Toggle principal */}
          <button
            onClick={() => handleToggle(!testMode)}
            disabled={saving || (!testMode && !pendingNumber.trim())}
            className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 ${
              testMode
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            } disabled:cursor-not-allowed disabled:opacity-40`}
            title={!testMode && !pendingNumber.trim() ? 'Informe um número de teste antes de ativar' : ''}
          >
            {/* Switch visual */}
            <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${testMode ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${testMode ? 'translate-x-4' : 'translate-x-1'}`} />
            </span>
            {testMode ? 'Ativar Produção' : 'Ativar Aprendizado'}
          </button>

          {!testMode && !pendingNumber.trim() && (
            <p className="text-[10px] text-amber-400/70">Informe um número de teste para poder ativar</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Hub principal ───────────────────────────────────────────────────────────
export const WhatsAppHubPage = ({ basePath }: { basePath: string }) => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const wb = (path: string) => (basePath ? `${basePath}/whatsapp/${path}` : `/whatsapp/${path}`);

  useEffect(() => {
    crmRequest<DashboardPayload>('/api/crm/wa/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const m = data?.metrics;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Hub"
        description="Central de atendimento, IA e gestão de clientes via WhatsApp"
      />

      {/* ── Painel Modo Teste / Produção ── */}
      <TestModePanel />

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Contatos Ativos" value={m?.totalContacts ?? 0} />
        <MetricCard label="Conversas Abertas" value={m?.openConversations ?? 0} />
        <MetricCard label="Msgs Hoje" value={m?.todayMessages ?? 0} />
        <MetricCard label="Uso da IA" value={m?.aiUsageTotal ?? 0} note="respostas sugeridas" />
        <MetricCard label="Inscrições (7d)" value={m?.newSubscriptionsWeek ?? 0} />
        <MetricCard label="Treinamentos IA" value={m?.trainingPairs ?? 0} note="pares Q&A" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,340px]">
        <div className="space-y-6">
          {/* Conversas recentes */}
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Conversas Recentes</h2>
              <Link to={wb('conversations')} className="text-xs text-amber-400 hover:text-amber-300">
                Ver todas →
              </Link>
            </div>
            {!data?.recentConversations?.length ? (
              <p className="py-6 text-center text-sm text-slate-500">Nenhuma conversa aberta.</p>
            ) : (
              <div className="space-y-2">
                {data.recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    to={wb(`conversations?open=${conv.id}`)}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 p-4 transition hover:bg-white/8"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-bold text-white">
                        {(conv.contact.name || conv.contact.phone).charAt(0).toUpperCase()}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-white">{conv.contact.name || conv.contact.phone}</p>
                        <span className="flex-shrink-0 text-[11px] text-slate-500">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{conv.lastMessagePreview || 'Sem mensagens'}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[conv.status] ?? statusColor.fechada}`}>
                        {statusLabel[conv.status] ?? conv.status}
                      </span>
                      {conv.sentiment && <span className="text-sm">{sentimentIcon[conv.sentiment]}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {/* Ações rápidas */}
          <div>
            <h2 className="mb-4 font-semibold text-white">Ações Rápidas</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard
                to={wb('conversations')}
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 2.5V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
                title="Central de Mensagens"
                desc="Gerencie todas as conversas em tempo real"
                color="bg-emerald-500/20 text-emerald-400"
              />
              <QuickActionCard
                to={wb('contacts')}
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 16c0-1.5 2.7-3 6-3s6 1.5 6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                title="Base de Clientes"
                desc="Contatos, setorização e inscrições"
                color="bg-blue-500/20 text-blue-400"
              />
              <QuickActionCard
                to={wb('ai-training')}
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg>}
                title="Treinar IA"
                desc="Adicione pares Q&A para respostas inteligentes"
                color="bg-violet-500/20 text-violet-400"
              />
              <QuickActionCard
                to={wb('templates')}
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                title="Templates de Resposta"
                desc="Respostas rápidas e mensagens prontas"
                color="bg-amber-500/20 text-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Distribuição por setor */}
          <Panel>
            <h2 className="mb-4 font-semibold text-white">Contatos por Setor</h2>
            {!data?.sectorDistribution?.length ? (
              <p className="text-center text-xs text-slate-500 py-4">Nenhum dado ainda.</p>
            ) : (
              <div className="space-y-3">
                {data.sectorDistribution.map((s, i) => {
                  const total = data.sectorDistribution.reduce((a, b) => a + b.total, 0);
                  const pct = total > 0 ? Math.round((s.total / total) * 100) : 0;
                  return (
                    <div key={s.sector}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-slate-300">{s.sector}</span>
                        <span className="text-slate-400">{s.total} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Funcionalidades futuras */}
          <Panel>
            <h2 className="mb-3 font-semibold text-white">Em Breve</h2>
            <div className="space-y-2">
              {[
                'Pipeline Kanban de Vendas',
                'Broadcast Segmentado',
                'Programa de Fidelidade',
                'Catálogo no Chat',
                'NPS Automático Pós-Venda',
                'Recuperação de Carrinho',
                'Analytics em Tempo Real',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 rounded-xl bg-white/3 px-3 py-2 text-xs text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                  {f}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
