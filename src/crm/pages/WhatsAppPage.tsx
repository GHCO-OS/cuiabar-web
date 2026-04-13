import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { crmRequest } from '../api';
import { Badge, Button, InputClassName, LoadingSpinner, MetricCard, PageHeader, Panel, Table } from '../components';
import { useCrm } from '../context';
import type { WhatsAppControlCenterPayload, WhatsAppConversationSummary, WhatsAppCustomerCategory } from '../types';

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

const statusTone = (connection: string): 'neutral' | 'success' | 'warning' | 'danger' => {
  if (connection === 'open') {
    return 'success';
  }
  if (connection === 'qr_ready' || connection === 'pairing_code_ready' || connection === 'connecting') {
    return 'warning';
  }
  if (connection === 'logged_out' || connection === 'closed') {
    return 'danger';
  }
  return 'neutral';
};

const connectionLabel = (connection: string) => {
  if (connection === 'open') return 'conectado';
  if (connection === 'qr_ready') return 'aguardando QR';
  if (connection === 'pairing_code_ready') return 'aguardando codigo';
  if (connection === 'connecting') return 'conectando';
  if (connection === 'logged_out') return 'sessao encerrada';
  if (connection === 'closed') return 'desconectado';
  return connection || 'offline';
};

const categoryLabel = (category: WhatsAppCustomerCategory) => (category === 'house' ? 'Cliente da casa' : 'Cliente novo');

const QuickLinkCard = ({ to, title, description }: { to: string; title: string; description: string }) => (
  <Link className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10" to={to}>
    <p className="text-sm font-semibold text-white">{title}</p>
    <p className="mt-2 text-xs text-slate-400">{description}</p>
  </Link>
);

export const WhatsAppPage = () => {
  const { csrfToken, user } = useCrm();
  const [controlCenter, setControlCenter] = useState<WhatsAppControlCenterPayload | null>(null);
  const [conversations, setConversations] = useState<WhatsAppConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [testPhoneInput, setTestPhoneInput] = useState('');
  const [testPhoneDirty, setTestPhoneDirty] = useState(false);

  const isManager = user?.roles.includes('gerente') ?? false;

  const load = async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [controlResponse, conversationsResponse] = await Promise.all([
        crmRequest<{ ok: true } & WhatsAppControlCenterPayload>('/api/admin/whatsapp/control-center', {}, csrfToken),
        crmRequest<{ ok: true; conversations: WhatsAppConversationSummary[] }>('/api/admin/whatsapp/conversations', {}, csrfToken),
      ]);

      setControlCenter(controlResponse);
      setConversations(conversationsResponse.conversations);
      if (!testPhoneDirty) {
        setTestPhoneInput(controlResponse.testMode.allowedPhoneE164 ?? '');
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o painel do WhatsApp.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => {
      void load(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [csrfToken, testPhoneDirty]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [conversation.phoneE164, conversation.displayName ?? '', conversation.summary ?? '', categoryLabel(conversation.category)]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search]);

  const updateCategoryLocally = (profileId: string, category: WhatsAppCustomerCategory) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.customerProfileId === profileId
          ? {
              ...conversation,
              category,
            }
          : conversation,
      ),
    );

    setControlCenter((current) => {
      if (!current) {
        return current;
      }

      const previousConversation = conversations.find((conversation) => conversation.customerProfileId === profileId);
      if (!previousConversation || previousConversation.category === category) {
        return current;
      }

      return {
        ...current,
        respondedNumbers: current.respondedNumbers.map((row) =>
          row.customerProfileId === profileId
            ? {
                ...row,
                category,
              }
            : row,
        ),
        metrics: {
          ...current.metrics,
          houseCustomers: current.metrics.houseCustomers + (category === 'house' ? 1 : -1),
          newCustomers: current.metrics.newCustomers + (category === 'new' ? 1 : -1),
        },
      };
    });
  };

  const handleToggleAutomation = async (enabled: boolean) => {
    setBusyKey('automation');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const response = await crmRequest<{ ok: true; automation: WhatsAppControlCenterPayload['automation']; cancelledCount?: number }>(
        '/api/admin/whatsapp/automation',
        {
          method: 'POST',
          body: JSON.stringify({
            enabled,
            note: enabled ? 'Automacao religada pelo portal CRM.' : 'Automacao pausada manualmente pelo portal CRM.',
          }),
        },
        csrfToken,
      );

      setControlCenter((current) => (current ? { ...current, automation: response.automation } : current));
      setActionMessage(
        enabled
          ? 'Automacao do WhatsApp ligada novamente.'
          : `Automacao desligada com seguranca.${response.cancelledCount ? ` ${response.cancelledCount} envio(s) automatico(s) pendente(s) foram cancelados.` : ''}`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao alterar a automacao.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveTestMode = async (enabled: boolean) => {
    setBusyKey('test-mode');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const response = await crmRequest<{ ok: true; testMode: WhatsAppControlCenterPayload['testMode']; cancelledCount?: number }>(
        '/api/admin/whatsapp/test-mode',
        {
          method: 'POST',
          body: JSON.stringify({
            enabled,
            phoneE164: testPhoneInput || null,
          }),
        },
        csrfToken,
      );

      setControlCenter((current) => (current ? { ...current, testMode: response.testMode } : current));
      setTestPhoneInput(response.testMode.allowedPhoneE164 ?? '');
      setTestPhoneDirty(false);
      setActionMessage(
        response.testMode.enabled
          ? `Modo teste ativo.${response.cancelledCount ? ` ${response.cancelledCount} resposta(s) automatica(s) fora da lista segura foram canceladas.` : ''}`
          : 'Modo teste desligado. O bot voltou ao modo de producao.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao atualizar o modo teste.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleResetSession = async () => {
    setBusyKey('reset-session');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const response = await crmRequest<{ ok: true; request: WhatsAppControlCenterPayload['bridgeControl'] }>(
        '/api/admin/whatsapp/bridge/reset-session',
        {
          method: 'POST',
          body: JSON.stringify({
            note: 'Troca manual do numero conectado pelo portal CRM.',
          }),
        },
        csrfToken,
      );

      setControlCenter((current) => (current ? { ...current, bridgeControl: response.request } : current));
      setActionMessage('Solicitacao enviada ao bridge local. O QR novo deve aparecer em seguida neste painel.');
      window.setTimeout(() => {
        void load(true);
      }, 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao solicitar a troca do numero conectado.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleClassify = async (profileId: string, category: WhatsAppCustomerCategory) => {
    setBusyKey(`category:${profileId}:${category}`);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await crmRequest(
        `/api/admin/whatsapp/profiles/${profileId}/classification`,
        {
          method: 'POST',
          body: JSON.stringify({ category }),
        },
        csrfToken,
      );
      updateCategoryLocally(profileId, category);
      setActionMessage(`Contato marcado como ${category === 'house' ? 'cliente da casa' : 'cliente novo'}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao classificar o contato.');
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!controlCenter) {
    return (
      <div className="space-y-6">
        <PageHeader title="WhatsApp" description="Painel operacional do atendimento automatizado e do bridge local do Baileys." />
        <Panel>
          <p className="text-sm text-rose-300">{errorMessage ?? 'Nao foi possivel carregar o painel do WhatsApp.'}</p>
          <div className="mt-4">
            <Button onClick={() => void load()}>Tentar novamente</Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Centro de comando do Baileys, automacao com IA, modo seguro de testes e classificacao comercial das conversas."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void load(true)} disabled={refreshing}>
              {refreshing ? 'Atualizando...' : 'Atualizar painel'}
            </Button>
          </div>
        }
      />

      {actionMessage ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{actionMessage}</div> : null}
      {errorMessage ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

      <Panel className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Atalhos operacionais</h2>
          <p className="mt-2 text-sm text-slate-300">Use esta tela para operar o bot e entre nas subareas quando quiser tratar mensagens, contatos, treinamento ou templates.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickLinkCard to="conversations" title="Mensagens" description="Abrir fila, conversas e atendimento manual." />
          <QuickLinkCard to="contacts" title="Clientes WA" description="Consultar contatos, historico e base comercial." />
          <QuickLinkCard to="ai-training" title="Treinar IA" description="Ajustar respostas, pares de treinamento e melhoria continua." />
          <QuickLinkCard to="templates" title="Templates WA" description="Gerenciar respostas padrao e mensagens reutilizaveis." />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Bridge" value={connectionLabel(controlCenter.bridge.connection)} note={`Heartbeat: ${formatDateTime(controlCenter.bridge.lastHeartbeatAt)}`} />
        <MetricCard label="Automacao" value={controlCenter.automation.enabled ? 'ligada' : 'desligada'} note={controlCenter.automation.enabled ? 'Respostas automaticas liberadas.' : 'Sem respostas automaticas.'} />
        <MetricCard label="Modo teste" value={controlCenter.testMode.enabled ? 'ativo' : 'desligado'} note={controlCenter.testMode.enabled ? controlCenter.testMode.allowedPhoneE164 ?? 'Sem numero liberado.' : 'Produzindo para todos.'} />
        <MetricCard label="Respondidos" value={controlCenter.metrics.respondedNumbers} note="Conversas com ao menos uma resposta enviada." />
        <MetricCard label="Handoffs" value={controlCenter.metrics.openHandoffs} note="Atendimentos aguardando humano." />
        <MetricCard label="Fila pendente" value={controlCenter.metrics.pendingOutboundCommands} note="Comandos ainda nao entregues pelo bridge." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.9fr]">
        <Panel className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Bridge e numero conectado</h2>
              <p className="mt-2 text-sm text-slate-300">O CRM recebe heartbeat da maquina local, monitora o pareamento do Baileys e controla a automacao de forma segura.</p>
            </div>
            <Badge tone={statusTone(controlCenter.bridge.connection)}>{connectionLabel(controlCenter.bridge.connection)}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-300">
              <p>Numero conectado: <strong className="text-white">{controlCenter.bridge.connectedPhoneE164 ?? 'nenhum'}</strong></p>
              <p>Bridge local: <strong className="text-white">{controlCenter.bridge.machineName ?? 'maquina local'}</strong></p>
              <p>Browser: <strong className="text-white">{controlCenter.bridge.browserLabel ?? '-'}</strong></p>
              <p>Versao WA Web: <strong className="text-white">{controlCenter.bridge.waVersion ?? '-'}</strong></p>
              <p>Ultima entrada: <strong className="text-white">{formatDateTime(controlCenter.bridge.lastInboundAt)}</strong></p>
              <p>Ultima resposta: <strong className="text-white">{formatDateTime(controlCenter.bridge.lastOutboundAt)}</strong></p>
              <p>Erro atual: <strong className="text-white">{controlCenter.bridge.lastError ?? 'nenhum'}</strong></p>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Automacao com IA</p>
              <p>
                Estado atual:{' '}
                <strong className={controlCenter.automation.enabled ? 'text-emerald-300' : 'text-amber-300'}>
                  {controlCenter.automation.enabled ? 'ligada' : 'desligada'}
                </strong>
              </p>
              <p>Ultima mudanca: <strong className="text-white">{formatDateTime(controlCenter.automation.updatedAt)}</strong></p>
              <p>Alterado por: <strong className="text-white">{controlCenter.automation.updatedBy ?? '-'}</strong></p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => void handleToggleAutomation(!controlCenter.automation.enabled)}
                  disabled={!isManager || busyKey === 'automation'}
                  variant={controlCenter.automation.enabled ? 'danger' : 'primary'}
                >
                  {busyKey === 'automation'
                    ? 'Salvando...'
                    : controlCenter.automation.enabled
                      ? 'Desligar automacao'
                      : 'Ligar automacao'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void handleResetSession()}
                  disabled={!isManager || busyKey === 'reset-session'}
                >
                  {busyKey === 'reset-session' ? 'Solicitando...' : 'Trocar numero conectado'}
                </Button>
              </div>
              {!isManager ? <p className="text-xs text-slate-500">Somente gerentes podem alterar automacao, modo teste e sessao conectada.</p> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Modo teste / seguranca</p>
                <p className="mt-2 text-sm text-slate-300">
                  Quando ativado, apenas o numero liberado recebe respostas automaticas. Todas as outras mensagens continuam registradas, mas sem vazamento de resposta.
                </p>
              </div>
              <Badge tone={controlCenter.testMode.enabled ? 'warning' : 'success'}>
                {controlCenter.testMode.enabled ? 'modo teste ativo' : 'producao ativa'}
              </Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Numero liberado para teste</label>
                <input
                  className={InputClassName}
                  disabled={!isManager || busyKey === 'test-mode'}
                  placeholder="+55 19 99999-9999"
                  value={testPhoneInput}
                  onChange={(event) => {
                    setTestPhoneInput(event.target.value);
                    setTestPhoneDirty(true);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  disabled={!isManager || busyKey === 'test-mode'}
                  onClick={() => void handleSaveTestMode(false)}
                >
                  {busyKey === 'test-mode' && !controlCenter.testMode.enabled ? 'Salvando...' : 'Modo producao'}
                </Button>
                <Button
                  disabled={!isManager || busyKey === 'test-mode'}
                  onClick={() => void handleSaveTestMode(true)}
                >
                  {busyKey === 'test-mode' && controlCenter.testMode.enabled ? 'Salvando...' : 'Ativar modo teste'}
                </Button>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              <p>Estado atual: <strong className="text-white">{controlCenter.testMode.enabled ? 'somente numero de teste' : 'todos os contatos habilitados'}</strong></p>
              <p>Numero permitido: <strong className="text-white">{controlCenter.testMode.allowedPhoneE164 ?? 'nenhum definido'}</strong></p>
              <p>Ultima atualizacao: <strong className="text-white">{formatDateTime(controlCenter.testMode.updatedAt)}</strong></p>
            </div>
          </div>

          {controlCenter.bridgeControl ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <p>
                Ultima solicitacao ao bridge: <strong className="text-white">{controlCenter.bridgeControl.action}</strong>{' '}
                em <strong className="text-white">{formatDateTime(controlCenter.bridgeControl.requestedAt)}</strong>{' '}
                por <strong className="text-white">{controlCenter.bridgeControl.requestedBy}</strong>.
              </p>
              <p className="mt-1">
                Status: <strong className="text-white">{controlCenter.bridgeControl.status}</strong>
                {controlCenter.bridgeControl.resultMessage ? ` | ${controlCenter.bridgeControl.resultMessage}` : ''}
              </p>
            </div>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Pareamento</h2>
              <p className="mt-2 text-sm text-slate-300">Quando voce trocar o numero conectado, o QR do bridge definitivo aparece aqui dentro do portal.</p>
            </div>

            {controlCenter.bridge.qrAvailable && controlCenter.bridge.qrDataUrl ? (
              <div className="space-y-3">
                <div className="rounded-3xl bg-white p-4">
                  <img alt="QR de pareamento do WhatsApp" className="mx-auto w-full max-w-[320px]" src={controlCenter.bridge.qrDataUrl} />
                </div>
                <p className="text-sm text-slate-300">Escaneie com o WhatsApp que vai operar o bot do Villa Cuiabar. Assim que parear, o painel muda para conectado.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-400">
                {controlCenter.bridge.connection === 'open'
                  ? 'O numero atual ja esta conectado. Use o botao de troca de numero para gerar um novo QR.'
                  : 'Ainda nao existe QR pronto neste momento. Se quiser trocar o numero conectado, use o botao acima.'}
              </div>
            )}
          </Panel>

          <Panel className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Numeros respondidos recentemente</h2>
              <p className="mt-2 text-sm text-slate-300">Visao rapida dos contatos que ja receberam ao menos uma resposta enviada pelo sistema.</p>
            </div>

            <div className="space-y-3">
              {controlCenter.respondedNumbers.slice(0, 6).map((row) => (
                <div key={row.conversationId} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{row.displayName ?? 'Contato sem nome'}</p>
                      <p className="mt-1 text-xs text-slate-400">{row.phoneE164}</p>
                    </div>
                    <Badge tone={row.category === 'house' ? 'success' : 'warning'}>{categoryLabel(row.category)}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Saidas: {row.outboundCount} | Entradas: {row.inboundCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Ultima resposta: {formatDateTime(row.lastOutboundAt)}</p>
                </div>
              ))}
              {!controlCenter.respondedNumbers.length ? <p className="text-sm text-slate-400">Nenhum numero respondido pelo sistema ate agora.</p> : null}
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Contatos e respostas</h2>
            <p className="mt-1 text-sm text-slate-300">Aqui voce enxerga quais numeros ja receberam resposta e pode marcar se sao clientes da casa ou clientes novos.</p>
          </div>
          <input
            className={`${InputClassName} md:w-[320px]`}
            placeholder="Buscar por numero, nome ou resumo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Table>
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Respondido</th>
              <th className="px-4 py-3">Ultima entrada</th>
              <th className="px-4 py-3">Ultima resposta</th>
              <th className="px-4 py-3">Mensagens</th>
              <th className="px-4 py-3">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredConversations.map((conversation) => (
              <tr key={conversation.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{conversation.displayName ?? 'Contato sem nome'}</p>
                  <p className="mt-1 text-sm text-slate-300">{conversation.phoneE164}</p>
                  <p className="mt-2 text-xs text-slate-400">{conversation.summary ?? 'Sem resumo ainda.'}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={conversation.category === 'house' ? 'success' : 'warning'}>{categoryLabel(conversation.category)}</Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={conversation.outboundCount > 0 ? 'success' : 'neutral'}>
                    {conversation.outboundCount > 0 ? 'sim' : 'nao'}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatDateTime(conversation.lastInboundAt)}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{formatDateTime(conversation.lastOutboundAt)}</td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  <p>Entrada: {conversation.inboundCount}</p>
                  <p>Saida: {conversation.outboundCount}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={conversation.category === 'house' ? 'primary' : 'ghost'}
                      disabled={busyKey === `category:${conversation.customerProfileId}:house`}
                      onClick={() => void handleClassify(conversation.customerProfileId, 'house')}
                    >
                      Cliente da casa
                    </Button>
                    <Button
                      variant={conversation.category === 'new' ? 'primary' : 'ghost'}
                      disabled={busyKey === `category:${conversation.customerProfileId}:new`}
                      onClick={() => void handleClassify(conversation.customerProfileId, 'new')}
                    >
                      Cliente novo
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredConversations.length ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-400" colSpan={7}>
                  Nenhuma conversa encontrada com esse filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
};
