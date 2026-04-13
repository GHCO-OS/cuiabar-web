import 'dotenv/config';
import { mkdir, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type ConnectionState,
  type WAMessage,
  type WAMessageUpdate,
  type WASocket,
} from 'baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { BridgeClient } from './bridgeClient.js';
import { loadConfig } from './config.js';
import { buildRecipientJid, normalizeIncomingMessage } from './messageParser.js';
import { startStatusServer } from './statusServer.js';
import type { BridgeConfig, BridgeControlRequest, BridgeHeartbeatPayload, BridgeStatus, PulledOutboundCommand } from './types.js';

const config = loadConfig();
const logger = pino({
  level: config.logLevel,
});
const bridgeClient = new BridgeClient(config.workerBaseUrl, config.internalToken);
const machineName = process.env.COMPUTERNAME?.trim() || os.hostname() || null;
const artifactRoot =
  process.env.BAILEYS_ARTIFACT_ROOT?.trim() ||
  (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'VillaCuiabar', 'logs') : path.join(process.cwd(), 'logs'));
const qrFilePath = path.join(artifactRoot, 'baileys-qr.png');
const HEARTBEAT_INTERVAL_MS = 15000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const maskPhone = (value: string | null) => {
  if (!value) {
    return null;
  }

  return value.replace(/\d(?=\d{4})/g, '*');
};

const formatWaVersion = (value: [number, number, number] | null) => (value ? value.join('.') : null);

const resolveBrowser = (browserPreset: BridgeConfig['browserPreset']) => {
  switch (browserPreset) {
    case 'windows_chrome':
      return {
        browser: Browsers.windows('Chrome'),
        label: 'Windows/Chrome',
      };
    case 'mac_desktop':
      return {
        browser: Browsers.macOS('Desktop'),
        label: 'Mac OS/Desktop',
      };
    case 'mac_chrome':
      return {
        browser: Browsers.macOS('Google Chrome'),
        label: 'Mac OS/Google Chrome',
      };
    case 'windows_desktop':
    default:
      return {
        browser: Browsers.windows('Desktop'),
        label: 'Windows/Desktop',
      };
  }
};

const resolveSocketBootstrap = async (bridgeConfig: BridgeConfig) => {
  const browser = resolveBrowser(bridgeConfig.browserPreset);

  if (bridgeConfig.versionSource === 'pinned') {
    if (!bridgeConfig.pinnedVersion) {
      throw new Error('BAILEYS_PINNED_VERSION e obrigatoria quando BAILEYS_VERSION_SOURCE=pinned.');
    }

    return {
      browser,
      version: bridgeConfig.pinnedVersion,
      versionSource: 'pinned',
      isLatest: false,
      warning: null,
    } as const;
  }

  const versionLookup =
    bridgeConfig.versionSource === 'wa_web'
      ? await fetchLatestWaWebVersion()
      : await fetchLatestBaileysVersion();

  return {
    browser,
    version: versionLookup.version as [number, number, number],
    versionSource: bridgeConfig.versionSource,
    isLatest: versionLookup.isLatest,
    warning:
      versionLookup.error instanceof Error
        ? versionLookup.error.message
        : versionLookup.error
          ? String(versionLookup.error)
          : null,
  } as const;
};

class BaileysBridge {
  private socket: WASocket | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private controlPolling = false;
  private pairingCodeRequested = false;
  private stopped = false;
  private status: BridgeStatus;

  constructor(private readonly bridgeConfig: BridgeConfig) {
    const browser = resolveBrowser(bridgeConfig.browserPreset);
    this.status = {
      connection: 'idle',
      qrAvailable: false,
      qrDataUrl: null,
      qrFilePath: null,
      pairingCode: null,
      pairingMode: bridgeConfig.pairingMode,
      pairingTarget: maskPhone(bridgeConfig.pairingPhone),
      browserLabel: browser.label,
      waVersion: null,
      waVersionSource: null,
      meId: null,
      lastError: null,
      lastInboundAt: null,
      lastOutboundAt: null,
      reconnectAttempts: 0,
    };
  }

  async start() {
    await mkdir(this.bridgeConfig.authDir, { recursive: true });
    await mkdir(path.dirname(qrFilePath), { recursive: true });
    logger.info(
      {
        authDir: this.bridgeConfig.authDir,
        pairingMode: this.bridgeConfig.pairingMode,
        pairingTarget: this.status.pairingTarget,
        testRecipient: this.bridgeConfig.testRecipient,
      },
      'Bridge Baileys inicializado.',
    );
    this.startPolling();
    this.startHeartbeatLoop();
    await this.connect();
  }

  getStatus = () => ({ ...this.status });

  async stop() {
    this.stopped = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.socket = null;
  }

  private async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(this.bridgeConfig.authDir);
    const bootstrap = await resolveSocketBootstrap(this.bridgeConfig);
    const waVersion = formatWaVersion(bootstrap.version);
    if (bootstrap.warning) {
      logger.warn(
        {
          versionSource: bootstrap.versionSource,
          fallbackVersion: waVersion,
          warning: bootstrap.warning,
        },
        'Nao foi possivel validar a ultima versao do WhatsApp Web; usando fallback do Baileys.',
      );
    }

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger.child({ component: 'signal-store' })),
      },
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      connectTimeoutMs: this.bridgeConfig.connectTimeoutMs,
      defaultQueryTimeoutMs: this.bridgeConfig.defaultQueryTimeoutMs,
      countryCode: this.bridgeConfig.countryCode,
      logger: logger.child({ component: 'baileys' }),
      browser: bootstrap.browser.browser,
      version: bootstrap.version,
    });

    this.socket = socket;
    this.status.connection = 'connecting';
    this.status.qrAvailable = false;
    this.status.pairingCode = null;
    this.status.meId = null;
    this.status.lastError = null;
    this.status.browserLabel = bootstrap.browser.label;
    this.status.waVersion = waVersion;
    this.status.waVersionSource = bootstrap.versionSource;
    this.pairingCodeRequested = false;

    logger.info(
      {
        browser: bootstrap.browser.label,
        waVersion,
        versionSource: bootstrap.versionSource,
        isLatest: bootstrap.isLatest,
        countryCode: this.bridgeConfig.countryCode,
      },
      'Conectando o Baileys ao WhatsApp Web.',
    );

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', (update) => {
      void this.handleConnectionUpdate(update, state.creds.registered);
    });
    socket.ev.on('messages.upsert', ({ type, messages }) => {
      logger.info(
        {
          upsertType: type,
          count: messages.length,
          remoteJids: messages.map((message) => message.key.remoteJid ?? null),
        },
        'Evento messages.upsert recebido do Baileys.',
      );

      if (type !== 'notify' && type !== 'append') {
        return;
      }

      void this.handleIncomingMessages(messages);
    });
    socket.ev.on('messages.update', (updates) => {
      void this.handleMessageUpdates(updates);
    });
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>, isRegistered: boolean) {
    logger.debug(
      {
        connection: update.connection ?? null,
        hasQr: Boolean(update.qr),
        isNewLogin: update.isNewLogin ?? null,
        receivedPendingNotifications: update.receivedPendingNotifications ?? null,
      },
      'Evento connection.update recebido do Baileys.',
    );

    if (update.qr) {
      const qrDataUrl = await QRCode.toDataURL(update.qr, {
        margin: 2,
        width: 360,
      });
      this.status.qrAvailable = true;
      this.status.qrDataUrl = qrDataUrl;
      this.status.qrFilePath = qrFilePath;
      this.status.pairingCode = null;
      this.status.connection = 'qr_ready';
      await QRCode.toFile(qrFilePath, update.qr, {
        type: 'png',
        width: 360,
        margin: 2,
      });
      logger.info({ qrFilePath }, 'QR de pareamento salvo em arquivo.');
      logger.info(await QRCode.toString(update.qr, { type: 'terminal', small: true }));
      void this.pushHeartbeat();
    }

    if (
      this.bridgeConfig.pairingMode === 'code' &&
      !this.pairingCodeRequested &&
      !isRegistered &&
      this.bridgeConfig.pairingPhone &&
      (update.connection === 'connecting' || Boolean(update.qr)) &&
      this.socket
    ) {
      this.pairingCodeRequested = true;
      try {
        await wait(this.bridgeConfig.pairingCodeDelayMs);
        const code = await this.socket.requestPairingCode(this.bridgeConfig.pairingPhone);
        this.status.pairingCode = code;
        this.status.qrAvailable = false;
        this.status.qrDataUrl = null;
        this.status.connection = 'pairing_code_ready';
        logger.info({ pairingCode: code }, 'Codigo de pareamento gerado pelo Baileys.');
        void this.pushHeartbeat();
      } catch (error) {
        this.status.lastError = error instanceof Error ? error.message : String(error);
        logger.error({ err: error }, 'Falha ao solicitar codigo de pareamento.');
        void this.pushHeartbeat();
      }
    }

    if (update.connection === 'open') {
      this.status.connection = 'open';
      this.status.qrAvailable = false;
      this.status.qrDataUrl = null;
      this.status.qrFilePath = null;
      this.status.pairingCode = null;
      this.status.meId = this.socket?.user?.id ?? null;
      this.status.reconnectAttempts = 0;
      logger.info({ meId: this.status.meId }, 'Baileys conectado ao WhatsApp Web.');
      void this.pushHeartbeat();
      void this.pollOutboundCommands();
      return;
    }

    if (update.connection === 'close') {
      const statusCode = this.extractDisconnectCode(update);
      this.status.connection = statusCode === DisconnectReason.loggedOut ? 'logged_out' : 'closed';
      this.status.lastError = statusCode ? `disconnect_${statusCode}` : 'connection_closed';
      this.status.meId = null;
      this.socket = null;
      void this.pushHeartbeat();

      if (this.stopped || statusCode === DisconnectReason.loggedOut) {
        logger.error({ statusCode }, 'Sessao Baileys encerrada e exige novo pareamento.');
        return;
      }

      this.status.reconnectAttempts += 1;
      logger.warn({ statusCode, delayMs: this.bridgeConfig.reconnectDelayMs }, 'Conexao Baileys encerrada; reagendando reconexao.');
      this.scheduleReconnect();
    }
  }

  private async handleIncomingMessages(messages: WAMessage[]) {
    for (const message of messages) {
      const normalized = await this.safeNormalizeInbound(message);
      if (!normalized) {
        continue;
      }

      this.status.lastInboundAt = new Date().toISOString();
      logger.info(
        {
          fromPhone: normalized.fromPhone,
          providerMessageId: normalized.providerMessageId,
          messageType: normalized.messageType,
        },
        'Mensagem inbound recebida via Baileys.',
      );

      try {
        if (this.bridgeConfig.markIncomingAsRead && this.socket) {
          await this.socket.readMessages([message.key]);
        }

        const response = await bridgeClient.postInbound(normalized);
        if (response.result.outboundCommand) {
          await this.sendTextCommand({
            id: response.result.outboundCommand.id,
            phoneE164: response.result.outboundCommand.toPhone,
            text: response.result.outboundCommand.text,
            source: 'assistant',
            intent: null,
            templateKey: null,
            ruleName: null,
            conversationId: response.result.conversationId,
            customerProfileId: response.result.customerProfileId,
            createdAt: new Date().toISOString(),
          });
        }
        void this.pushHeartbeat();
      } catch (error) {
        this.status.lastError = error instanceof Error ? error.message : String(error);
        logger.error({ err: error, providerMessageId: normalized.providerMessageId }, 'Falha ao enviar mensagem inbound para o Worker.');
        void this.pushHeartbeat();
      }
    }
  }

  private async handleMessageUpdates(updates: WAMessageUpdate[]) {
    for (const entry of updates) {
      const providerMessageId = entry.key?.id;
      const rawStatus = entry.update?.status;
      if (!providerMessageId || rawStatus == null) {
        continue;
      }

      const normalizedStatus = typeof rawStatus === 'string' ? rawStatus : String(rawStatus);
      try {
        await bridgeClient.postStatus(providerMessageId, normalizedStatus, {
          source: 'messages.update',
        });
      } catch (error) {
        logger.warn({ err: error, providerMessageId }, 'Nao foi possivel propagar o status da mensagem ao Worker.');
      }
    }
  }

  private async sendTextCommand(command: PulledOutboundCommand) {
    if (!this.socket || this.status.connection !== 'open') {
      throw new Error('Socket Baileys indisponivel para envio.');
    }

    const jid = buildRecipientJid(command.phoneE164);
    try {
      await this.socket.sendPresenceUpdate('composing', jid);
      const result = await this.socket.sendMessage(jid, { text: command.text });
      const providerMessageId = result?.key?.id ?? null;
      this.status.lastOutboundAt = new Date().toISOString();

      await bridgeClient.acknowledgeOutbound(command.id, providerMessageId, {
        jid,
        source: command.source,
      });

      logger.info(
        {
          commandId: command.id,
          jid,
          providerMessageId,
        },
        'Mensagem outbound enviada via Baileys.',
      );
      void this.pushHeartbeat();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.status.lastError = errorMessage;
      logger.error({ err: error, commandId: command.id, jid }, 'Falha ao enviar mensagem outbound via Baileys.');
      await bridgeClient.failOutbound(command.id, errorMessage, {
        jid,
        source: command.source,
      });
      void this.pushHeartbeat();
    } finally {
      if (this.socket) {
        await this.socket.sendPresenceUpdate('paused', jid).catch(() => undefined);
      }
    }
  }

  private startPolling() {
    if (this.pollTimer) {
      return;
    }

    this.pollTimer = setInterval(() => {
      void this.pollOutboundCommands();
      void this.pollBridgeControl();
    }, this.bridgeConfig.pollIntervalMs);
    this.pollTimer.unref?.();
  }

  private startHeartbeatLoop() {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      void this.pushHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref?.();
  }

  private async pollOutboundCommands() {
    if (this.polling || !this.socket || this.status.connection !== 'open') {
      return;
    }

    this.polling = true;
    try {
      const commands = await bridgeClient.pullOutbound(this.bridgeConfig.pullBatchSize);
      for (const command of commands) {
        await this.sendTextCommand(command);
      }
    } catch (error) {
      this.status.lastError = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Falha ao puxar comandos outbound do Worker.');
    } finally {
      this.polling = false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.stopped) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error) => {
        this.status.lastError = error instanceof Error ? error.message : String(error);
        logger.error({ err: error }, 'Falha na reconexao do Baileys.');
        this.scheduleReconnect();
      });
    }, this.bridgeConfig.reconnectDelayMs);
    this.reconnectTimer.unref?.();
  }

  private buildHeartbeatPayload(): BridgeHeartbeatPayload {
    return {
      machineName,
      connection: this.status.connection,
      qrAvailable: this.status.qrAvailable,
      qrDataUrl: this.status.qrDataUrl,
      qrFilePath: this.status.qrFilePath,
      pairingCode: this.status.pairingCode,
      pairingMode: this.status.pairingMode,
      pairingTarget: this.status.pairingTarget,
      browserLabel: this.status.browserLabel,
      waVersion: this.status.waVersion,
      waVersionSource: this.status.waVersionSource,
      meId: this.status.meId,
      lastError: this.status.lastError,
      lastInboundAt: this.status.lastInboundAt,
      lastOutboundAt: this.status.lastOutboundAt,
      reconnectAttempts: this.status.reconnectAttempts,
    };
  }

  private async pushHeartbeat() {
    try {
      await bridgeClient.pushHeartbeat(this.buildHeartbeatPayload());
    } catch (error) {
      logger.warn({ err: error }, 'Falha ao publicar heartbeat do bridge para o CRM.');
    }
  }

  private async pollBridgeControl() {
    if (this.controlPolling) {
      return;
    }

    this.controlPolling = true;
    try {
      const request = await bridgeClient.pullBridgeControl();
      if (request) {
        await this.handleBridgeControlRequest(request);
      }
    } catch (error) {
      logger.warn({ err: error }, 'Falha ao consultar comandos remotos do bridge.');
    } finally {
      this.controlPolling = false;
    }
  }

  private async handleBridgeControlRequest(request: BridgeControlRequest) {
    if (request.action !== 'reset_session') {
      await bridgeClient.acknowledgeBridgeControl(request.id, 'ignored', 'Acao de controle nao suportada pelo bridge local.');
      return;
    }

    logger.warn(
      {
        requestId: request.id,
        requestedBy: request.requestedBy,
        note: request.note,
      },
      'Solicitacao remota para trocar o numero conectado recebida pelo bridge.',
    );

    try {
      await this.resetSessionForReconnection();
      await bridgeClient.acknowledgeBridgeControl(
        request.id,
        'completed',
        'Sessao local do WhatsApp limpa com sucesso. Novo pareamento pronto no bridge.',
      );
      await this.pushHeartbeat();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.status.lastError = errorMessage;
      await bridgeClient.acknowledgeBridgeControl(request.id, 'failed', errorMessage);
      await this.pushHeartbeat();
      throw error;
    }
  }

  private async resetSessionForReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const currentSocket = this.socket;
    this.socket = null;
    this.status.connection = 'connecting';
    this.status.meId = null;
    this.status.qrAvailable = false;
    this.status.qrDataUrl = null;
    this.status.qrFilePath = null;
    this.status.pairingCode = null;
    this.status.lastError = null;

    if (currentSocket) {
      await currentSocket.logout().catch(() => undefined);
    }

    await rm(this.bridgeConfig.authDir, { recursive: true, force: true });
    await mkdir(this.bridgeConfig.authDir, { recursive: true });
    await this.connect();
  }

  private extractDisconnectCode(update: Partial<ConnectionState>) {
    const error = update.lastDisconnect?.error as { output?: { statusCode?: number }; statusCode?: number } | undefined;
    return error?.output?.statusCode ?? error?.statusCode ?? null;
  }

  private async safeNormalizeInbound(message: WAMessage) {
    try {
      const resolvedMessage = await this.resolveInboundAddressing(message);
      return normalizeIncomingMessage(resolvedMessage);
    } catch (error) {
      logger.warn({ err: error }, 'Mensagem ignorada por falha de normalizacao.');
      return null;
    }
  }

  private async resolveInboundAddressing(message: WAMessage) {
    const remoteJid = message.key.remoteJid;
    if (!remoteJid || !this.socket) {
      return message;
    }

    const isLidAddress = remoteJid.endsWith('@lid') || remoteJid.endsWith('@hosted.lid');
    if (!isLidAddress) {
      return message;
    }

    const pnJid = await this.socket.signalRepository.lidMapping.getPNForLID(remoteJid);
    if (!pnJid) {
      logger.warn(
        {
          remoteJid,
          key: message.key,
        },
        'Mensagem inbound em formato LID ainda sem mapeamento para numero telefonico.',
      );
      return message;
    }

    logger.info(
      {
        remoteJid,
        pnJid,
      },
      'Endereco LID convertido para numero telefonico pelo lidMapping do Baileys.',
    );

    return {
      ...message,
      key: {
        ...message.key,
        remoteJid: pnJid,
      },
    };
  }
}

const bridge = new BaileysBridge(config);
let statusServer: Server | null = null;

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Encerrando ponte Baileys.');
  await bridge.stop();
  if (statusServer) {
    statusServer.close();
  }
  process.exit(0);
};

statusServer = startStatusServer({
  host: config.statusHost,
  port: config.statusPort,
  logger,
  getStatus: bridge.getStatus,
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

await bridge.start();
