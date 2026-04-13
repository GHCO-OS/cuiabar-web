import { asJson, first, nowIso, parseJsonText, run } from '../lib/db';
import { generateId } from '../lib/security';
import type { Env } from '../types';
import { normalizePhoneE164, tryNormalizePhoneE164 } from './utils';

const AUTOMATION_SETTINGS_KEY = 'whatsapp_automation_settings';
const BRIDGE_STATUS_KEY = 'whatsapp_bridge_status';
const BRIDGE_CONTROL_KEY = 'whatsapp_bridge_control';
const LEGACY_AUTOMATION_KEY = 'wa_bot_enabled';
const TEST_MODE_KEY = 'wa_test_mode';
const TEST_NUMBER_KEY = 'wa_test_number';

export type CustomerCategory = 'house' | 'new';
export type BridgeControlAction = 'reset_session';
export type BridgeControlRequestStatus = 'pending' | 'completed' | 'failed' | 'ignored';

export interface WhatsAppAutomationSettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  note: string | null;
}

export interface WhatsAppTestModeSettings {
  enabled: boolean;
  allowedPhoneE164: string | null;
  updatedAt: string | null;
}

export interface BridgeRuntimeStatus {
  machineName: string | null;
  connection: string;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  qrFilePath: string | null;
  pairingCode: string | null;
  pairingMode: 'qr' | 'code' | null;
  pairingTarget: string | null;
  browserLabel: string | null;
  waVersion: string | null;
  waVersionSource: string | null;
  meId: string | null;
  connectedPhoneE164: string | null;
  lastError: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  reconnectAttempts: number;
  lastHeartbeatAt: string | null;
  updatedAt: string | null;
}

export interface BridgeStatusHeartbeatPayload {
  machineName?: string | null;
  connection: string;
  qrAvailable: boolean;
  qrDataUrl?: string | null;
  qrFilePath?: string | null;
  pairingCode?: string | null;
  pairingMode?: 'qr' | 'code' | null;
  pairingTarget?: string | null;
  browserLabel?: string | null;
  waVersion?: string | null;
  waVersionSource?: string | null;
  meId?: string | null;
  lastError?: string | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  reconnectAttempts?: number;
}

export interface BridgeControlRequest {
  id: string;
  action: BridgeControlAction;
  status: BridgeControlRequestStatus;
  requestedAt: string;
  updatedAt: string;
  requestedBy: string;
  note: string | null;
  resultMessage: string | null;
  completedAt: string | null;
}

const defaultAutomationSettings = (): WhatsAppAutomationSettings => ({
  enabled: true,
  updatedAt: null,
  updatedBy: null,
  note: null,
});

const defaultTestModeSettings = (): WhatsAppTestModeSettings => ({
  enabled: false,
  allowedPhoneE164: null,
  updatedAt: null,
});

const defaultBridgeRuntimeStatus = (): BridgeRuntimeStatus => ({
  machineName: null,
  connection: 'offline',
  qrAvailable: false,
  qrDataUrl: null,
  qrFilePath: null,
  pairingCode: null,
  pairingMode: null,
  pairingTarget: null,
  browserLabel: null,
  waVersion: null,
  waVersionSource: null,
  meId: null,
  connectedPhoneE164: null,
  lastError: null,
  lastInboundAt: null,
  lastOutboundAt: null,
  reconnectAttempts: 0,
  lastHeartbeatAt: null,
  updatedAt: null,
});

const readAppSetting = async <T>(env: Env, key: string, fallback: T): Promise<T> => {
  const row = await first<{ value_json: string }>(env.DB.prepare('SELECT value_json FROM app_settings WHERE key = ?').bind(key));
  return row ? parseJsonText<T>(row.value_json, fallback) : fallback;
};

const readAppSettingRow = (env: Env, key: string) =>
  first<{ value_json: string; updated_at: string | null }>(
    env.DB.prepare('SELECT value_json, updated_at FROM app_settings WHERE key = ?').bind(key),
  );

const writeAppSetting = async (env: Env, key: string, value: unknown, updatedByUserId: string | null) => {
  const timestamp = nowIso();
  await run(
    env.DB.prepare(
      `INSERT INTO app_settings (key, value_json, updated_by_user_id, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by_user_id = excluded.updated_by_user_id, updated_at = excluded.updated_at`,
    ).bind(key, asJson(value), updatedByUserId, timestamp),
  );
};

const normalizeConnectedPhone = (meId: string | null | undefined) => {
  if (!meId) {
    return null;
  }

  const match = meId.match(/(\d{10,15})/);
  if (!match) {
    return null;
  }

  return `+${match[1]}`;
};

export const getWhatsAppAutomationSettings = (env: Env) =>
  (async () => {
    const modernRow = await readAppSettingRow(env, AUTOMATION_SETTINGS_KEY);
    if (modernRow) {
      return parseJsonText<WhatsAppAutomationSettings>(modernRow.value_json, defaultAutomationSettings());
    }

    const legacyEnabled = await readAppSetting<boolean>(env, LEGACY_AUTOMATION_KEY, true);
    return {
      ...defaultAutomationSettings(),
      enabled: legacyEnabled,
    };
  })();

export const setWhatsAppAutomationSettings = async (
  env: Env,
  params: {
    enabled: boolean;
    updatedBy: string;
    note?: string | null;
  },
) => {
  const nextSettings: WhatsAppAutomationSettings = {
    enabled: params.enabled,
    updatedAt: nowIso(),
    updatedBy: params.updatedBy,
    note: params.note?.trim() || null,
  };

  await writeAppSetting(env, AUTOMATION_SETTINGS_KEY, nextSettings, params.updatedBy);
  await writeAppSetting(env, LEGACY_AUTOMATION_KEY, params.enabled, params.updatedBy);
  return nextSettings;
};

export const getWhatsAppTestModeSettings = async (env: Env): Promise<WhatsAppTestModeSettings> => {
  const [enabledRow, phoneRow] = await Promise.all([
    readAppSettingRow(env, TEST_MODE_KEY),
    readAppSettingRow(env, TEST_NUMBER_KEY),
  ]);

  return {
    enabled: enabledRow ? parseJsonText<boolean>(enabledRow.value_json, false) : false,
    allowedPhoneE164: phoneRow ? tryNormalizePhoneE164(parseJsonText<string | null>(phoneRow.value_json, null)) : null,
    updatedAt: enabledRow?.updated_at ?? phoneRow?.updated_at ?? null,
  };
};

export const setWhatsAppTestModeSettings = async (
  env: Env,
  params: {
    enabled: boolean;
    allowedPhoneE164?: string | null;
    updatedBy: string;
  },
) => {
  const normalizedPhone = params.allowedPhoneE164?.trim() ? normalizePhoneE164(params.allowedPhoneE164) : null;
  await Promise.all([
    writeAppSetting(env, TEST_MODE_KEY, params.enabled, params.updatedBy),
    writeAppSetting(env, TEST_NUMBER_KEY, normalizedPhone, params.updatedBy),
  ]);

  return getWhatsAppTestModeSettings(env);
};

export const getBridgeRuntimeStatus = (env: Env) =>
  readAppSetting<BridgeRuntimeStatus>(env, BRIDGE_STATUS_KEY, defaultBridgeRuntimeStatus());

export const updateBridgeRuntimeStatus = async (env: Env, heartbeat: BridgeStatusHeartbeatPayload) => {
  const previous = await getBridgeRuntimeStatus(env);
  const timestamp = nowIso();
  const nextStatus: BridgeRuntimeStatus = {
    ...previous,
    machineName: heartbeat.machineName ?? previous.machineName,
    connection: heartbeat.connection,
    qrAvailable: heartbeat.qrAvailable,
    qrDataUrl: heartbeat.qrAvailable ? heartbeat.qrDataUrl ?? previous.qrDataUrl : null,
    qrFilePath: heartbeat.qrAvailable ? heartbeat.qrFilePath ?? previous.qrFilePath : null,
    pairingCode: heartbeat.pairingCode ?? null,
    pairingMode: heartbeat.pairingMode ?? previous.pairingMode ?? null,
    pairingTarget: heartbeat.pairingTarget ?? previous.pairingTarget,
    browserLabel: heartbeat.browserLabel ?? previous.browserLabel,
    waVersion: heartbeat.waVersion ?? previous.waVersion,
    waVersionSource: heartbeat.waVersionSource ?? previous.waVersionSource,
    meId: heartbeat.meId ?? null,
    connectedPhoneE164: normalizeConnectedPhone(heartbeat.meId ?? null),
    lastError: heartbeat.lastError ?? null,
    lastInboundAt: heartbeat.lastInboundAt ?? previous.lastInboundAt,
    lastOutboundAt: heartbeat.lastOutboundAt ?? previous.lastOutboundAt,
    reconnectAttempts: heartbeat.reconnectAttempts ?? previous.reconnectAttempts,
    lastHeartbeatAt: timestamp,
    updatedAt: timestamp,
  };

  await writeAppSetting(env, BRIDGE_STATUS_KEY, nextStatus, null);
  return nextStatus;
};

export const getBridgeControlRequest = (env: Env) =>
  readAppSetting<BridgeControlRequest | null>(env, BRIDGE_CONTROL_KEY, null);

export const getPendingBridgeControlRequest = async (env: Env) => {
  const request = await getBridgeControlRequest(env);
  if (!request || request.status !== 'pending') {
    return null;
  }
  return request;
};

export const requestBridgeControl = async (
  env: Env,
  params: {
    action: BridgeControlAction;
    requestedBy: string;
    note?: string | null;
  },
) => {
  const timestamp = nowIso();
  const request: BridgeControlRequest = {
    id: generateId('wactrl'),
    action: params.action,
    status: 'pending',
    requestedAt: timestamp,
    updatedAt: timestamp,
    requestedBy: params.requestedBy,
    note: params.note?.trim() || null,
    resultMessage: null,
    completedAt: null,
  };

  await writeAppSetting(env, BRIDGE_CONTROL_KEY, request, null);
  return request;
};

export const resolveBridgeControlRequest = async (
  env: Env,
  params: {
    id: string;
    status: Exclude<BridgeControlRequestStatus, 'pending'>;
    resultMessage?: string | null;
  },
) => {
  const current = await getBridgeControlRequest(env);
  if (!current || current.id !== params.id) {
    return null;
  }

  const timestamp = nowIso();
  const nextRequest: BridgeControlRequest = {
    ...current,
    status: params.status,
    resultMessage: params.resultMessage?.trim() || null,
    updatedAt: timestamp,
    completedAt: timestamp,
  };

  await writeAppSetting(env, BRIDGE_CONTROL_KEY, nextRequest, null);
  return nextRequest;
};

export const resolveCustomerCategory = (metadataJson: string | null | undefined, crmContactId: string | null | undefined): CustomerCategory => {
  const metadata = parseJsonText<Record<string, unknown>>(metadataJson, {});
  const explicitCategory = metadata.customerCategory;
  if (explicitCategory === 'house' || explicitCategory === 'new') {
    return explicitCategory;
  }

  return crmContactId ? 'house' : 'new';
};

export const updateCustomerCategory = async (
  env: Env,
  params: {
    profileId: string;
    category: CustomerCategory;
  },
) => {
  const profile = await first<{ metadata_json: string; tags_json: string }>(
    env.DB.prepare('SELECT metadata_json, tags_json FROM customer_profiles WHERE id = ?').bind(params.profileId),
  );

  if (!profile) {
    return null;
  }

  const metadata = parseJsonText<Record<string, unknown>>(profile.metadata_json, {});
  metadata.customerCategory = params.category;
  metadata.customerCategoryUpdatedAt = nowIso();

  const tags = parseJsonText<string[]>(profile.tags_json, []).filter((tag) => tag !== 'customer:house' && tag !== 'customer:new');
  tags.push(`customer:${params.category}`);

  await run(
    env.DB.prepare('UPDATE customer_profiles SET metadata_json = ?, tags_json = ?, updated_at = ? WHERE id = ?').bind(
      asJson(metadata),
      asJson(tags),
      nowIso(),
      params.profileId,
    ),
  );

  return params.category;
};
