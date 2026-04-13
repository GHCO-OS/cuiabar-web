import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { crmRequest } from '../../api';
import { Button, InputClassName, LoadingSpinner, PageHeader } from '../../components';
import { useCrm } from '../../context';
import type { WaConversation, WaMessage, WaTemplate } from '../../types';

interface ConversationsPayload { ok: boolean; conversations: WaConversation[]; total: number; totalPages: number; }
interface ConversationDetailPayload { ok: boolean; conversation: WaConversation; messages: WaMessage[]; }
interface TemplatesPayload { ok: boolean; templates: WaTemplate[]; }
interface AiSuggestPayload { ok: boolean; suggestion: { answer: string; confidence: number; trainingId: string } | null; }

const STATUS_LABELS: Record<string, string> = { aberta: 'Aberta', pendente: 'Pendente', aguardando: 'Aguardando', bot: 'Bot', fechada: 'Fechada' };
const STATUS_COLORS: Record<string, string> = {
  aberta: 'bg-emerald-500/20 text-emerald-300',
  pendente: 'bg-amber-500/20 text-amber-300',
  aguardando: 'bg-blue-500/20 text-blue-300',
  bot: 'bg-violet-500/20 text-violet-300',
  fechada: 'bg-slate-500/20 text-slate-400',
};
const SENTIMENT_ICON: Record<string, string> = { positivo: '😊', neutro: '😐', negativo: '😞' };

const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 font-bold text-white ${sz}`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const MessageBubble = ({ msg, onAiFeedback }: { msg: WaMessage; onAiFeedback?: (id: string, positive: boolean) => void }) => {
  const isOut = msg.direction === 'saida';
  const isNote = msg.isInternalNote;

  if (isNote) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300">
          <span className="mr-1">📝</span>{msg.content}
          {msg.createdByName && <span className="ml-1 text-amber-400/60">— {msg.createdByName}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] space-y-1 ${isOut ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isOut
              ? 'rounded-br-md bg-emerald-600/90 text-white'
              : 'rounded-bl-md bg-slate-800 text-slate-100'
          }`}
        >
          {msg.content}
          {msg.aiSuggested && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] text-violet-300">
              ✦ IA
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-slate-500">
            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOut && (
            <span className="text-[10px] text-slate-500">
              {msg.status === 'lido' ? '✓✓' : msg.status === 'entregue' ? '✓✓' : '✓'}
            </span>
          )}
          {msg.aiSuggested && msg.direction === 'saida' && onAiFeedback && (
            <div className="flex gap-1">
              <button onClick={() => onAiFeedback(msg.id, true)} className="text-[10px] text-slate-500 hover:text-emerald-400" title="Útil">👍</button>
              <button onClick={() => onAiFeedback(msg.id, false)} className="text-[10px] text-slate-500 hover:text-rose-400" title="Não útil">👎</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WhatsAppConversationsPage = () => {
  const { csrfToken } = useCrm();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('open');

  const [conversations, setConversations] = useState<WaConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('aberta');
  const [search, setSearch] = useState('');

  const [activeConv, setActiveConv] = useState<WaConversation | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isNote, setIsNote] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ answer: string; confidence: number; trainingId: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, search });
      const data = await crmRequest<ConversationsPayload>(`/api/crm/wa/conversations?${params}`);
      if (data?.ok) { setConversations(data.conversations); setTotal(data.total); }
    } finally { setLoading(false); }
  };

  const loadConversation = async (id: string) => {
    setConvLoading(true);
    setAiSuggestion(null);
    try {
      const data = await crmRequest<ConversationDetailPayload>(`/api/crm/wa/conversations/${id}`);
      if (data?.ok) { setActiveConv(data.conversation); setMessages(data.messages); }
    } finally { setConvLoading(false); }
  };

  const loadTemplates = async () => {
    if (templates.length) return;
    const data = await crmRequest<TemplatesPayload>('/api/crm/wa/templates');
    if (data?.ok) setTemplates(data.templates);
  };

  useEffect(() => { loadConversations(); }, [statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadConversations, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (openId) loadConversation(openId);
  }, [openId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (conv: WaConversation) => {
    setSearchParams({ open: conv.id });
    loadConversation(conv.id);
  };

  const handleSend = async () => {
    if (!msgInput.trim() || !activeConv) return;
    setSending(true);
    try {
      const data = await crmRequest<{ ok: boolean; message: WaMessage }>(
        `/api/crm/wa/conversations/${activeConv.id}/messages`,
        { method: 'POST', body: JSON.stringify({ content: msgInput.trim(), isInternalNote: isNote, aiSuggested: aiSuggestion?.answer === msgInput.trim(), aiConfidence: aiSuggestion?.confidence }) },
        csrfToken,
      );
      if (data?.ok) {
        setMessages(prev => [...prev, data.message]);
        setMsgInput('');
        setAiSuggestion(null);
        // update conversation list
        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, lastMessagePreview: msgInput.trim(), lastMessageAt: new Date().toISOString() } : c));
      }
    } finally { setSending(false); }
  };

  const handleInputChange = (val: string) => {
    setMsgInput(val);
    if (!activeConv || val.trim().length < 3) return;
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
  };

  const fetchAiSuggestion = async (lastInboundContent: string) => {
    if (!activeConv) return;
    setAiLoading(true);
    try {
      const data = await crmRequest<AiSuggestPayload>(
        '/api/crm/wa/ai-suggest',
        { method: 'POST', body: JSON.stringify({ message: lastInboundContent, conversationId: activeConv.id }) },
        csrfToken,
      );
      if (data?.ok) setAiSuggestion(data.suggestion);
    } finally { setAiLoading(false); }
  };

  // Auto-suggest when conversation loads with unread inbound message
  useEffect(() => {
    const lastInbound = [...messages].reverse().find(m => m.direction === 'entrada');
    if (lastInbound && activeConv?.unreadCount) {
      fetchAiSuggestion(lastInbound.content);
    }
  }, [messages]);

  const handleAiFeedback = async (msgId: string, positive: boolean) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !aiSuggestion) return;
    await crmRequest('/api/crm/wa/ai-suggest/feedback', { method: 'POST', body: JSON.stringify({ trainingId: aiSuggestion.trainingId, positive }) }, csrfToken);
  };

  const handleCloseConv = async () => {
    if (!activeConv) return;
    await crmRequest(`/api/crm/wa/conversations/${activeConv.id}`, { method: 'PUT', body: JSON.stringify({ status: 'fechada' }) }, csrfToken);
    setActiveConv(prev => prev ? { ...prev, status: 'fechada' } : null);
    setConversations(prev => statusFilter === 'aberta' ? prev.filter(c => c.id !== activeConv.id) : prev.map(c => c.id === activeConv.id ? { ...c, status: 'fechada' } : c));
  };

  const handleTemplateSelect = (tpl: WaTemplate) => {
    setMsgInput(tpl.content);
    setShowTemplates(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-0">
      <PageHeader
        title="Central de Mensagens"
        description={`${total} conversa${total !== 1 ? 's' : ''} ${statusFilter}`}
      />

      <div className="mt-6 flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10">
        {/* Sidebar conversas */}
        <div className="flex w-72 flex-shrink-0 flex-col border-r border-white/10 bg-slate-950/80">
          {/* Filtros */}
          <div className="space-y-2 border-b border-white/10 p-3">
            <input
              type="search"
              placeholder="Buscar contato..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={InputClassName + ' py-2 text-xs'}
            />
            <div className="flex gap-1 flex-wrap">
              {(['aberta', 'pendente', 'aguardando', 'fechada'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${statusFilter === s ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingSpinner />
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-500">Nenhuma conversa.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full border-b border-white/5 p-3 text-left transition hover:bg-white/5 ${activeConv?.id === conv.id ? 'bg-white/8' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Avatar name={conv.contact.name || conv.contact.phone} size="sm" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-medium text-white">{conv.contact.name || conv.contact.phone}</p>
                        <span className="text-[9px] text-slate-500 flex-shrink-0">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{conv.lastMessagePreview || '...'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat principal */}
        <div className="flex flex-1 flex-col bg-slate-950/60">
          {!activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 8h32a2 2 0 012 2v22a2 2 0 01-2 2H14l-6 7V10a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          ) : convLoading ? (
            <div className="flex flex-1 items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <>
              {/* Header da conversa */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={activeConv.contact.name || activeConv.contact.phone} />
                  <div>
                    <p className="font-semibold text-white">{activeConv.contact.name || activeConv.contact.phone}</p>
                    <p className="text-xs text-slate-400">{activeConv.contact.phone}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[activeConv.status]}`}>
                    {STATUS_LABELS[activeConv.status]}
                  </span>
                  {activeConv.sentiment && <span className="text-sm">{SENTIMENT_ICON[activeConv.sentiment]}</span>}
                </div>
                <div className="flex gap-2">
                  {activeConv.status === 'aberta' && (
                    <Button variant="ghost" onClick={handleCloseConv}>
                      Fechar
                    </Button>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto space-y-3 p-5">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">Nenhuma mensagem ainda.</p>
                ) : (
                  messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} onAiFeedback={handleAiFeedback} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sugestão da IA */}
              {aiSuggestion && (
                <div className="mx-5 mb-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-violet-300">✦ Sugestão da IA ({Math.round(aiSuggestion.confidence * 100)}% confiança)</span>
                    <button onClick={() => setAiSuggestion(null)} className="text-xs text-slate-500 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-200">{aiSuggestion.answer}</p>
                  <button
                    onClick={() => setMsgInput(aiSuggestion.answer)}
                    className="mt-2 rounded-xl bg-violet-500/30 px-3 py-1 text-[10px] font-medium text-violet-300 hover:bg-violet-500/50"
                  >
                    Usar resposta
                  </button>
                </div>
              )}
              {aiLoading && (
                <div className="mx-5 mb-2 flex items-center gap-2 text-xs text-violet-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                  IA analisando...
                </div>
              )}

              {/* Templates popup */}
              {showTemplates && (
                <div className="mx-5 mb-2 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-2">
                  <p className="px-2 pb-1 text-[10px] text-slate-400">Templates de Resposta</p>
                  {templates.length === 0 ? (
                    <p className="p-2 text-xs text-slate-500">Nenhum template.</p>
                  ) : (
                    templates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => handleTemplateSelect(tpl)}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5"
                      >
                        <span className="font-medium text-amber-300">{tpl.name}</span>
                        <span className="ml-2 text-slate-500">{tpl.content.substring(0, 60)}...</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-white/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNote(!isNote)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${isNote ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    📝 Nota Interna
                  </button>
                  <button
                    onClick={() => { setShowTemplates(!showTemplates); loadTemplates(); }}
                    className="rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10"
                  >
                    ⚡ Templates
                  </button>
                  <button
                    onClick={() => {
                      const lastInbound = [...messages].reverse().find(m => m.direction === 'entrada');
                      if (lastInbound) fetchAiSuggestion(lastInbound.content);
                    }}
                    className="rounded-xl bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30"
                  >
                    ✦ IA
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={msgInput}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={isNote ? 'Escreva uma nota interna...' : 'Digite uma mensagem... (Enter para enviar)'}
                    rows={2}
                    className={`${InputClassName} resize-none`}
                  />
                  <Button onClick={handleSend} disabled={sending || !msgInput.trim()}>
                    {sending ? '...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
