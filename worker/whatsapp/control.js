import { asJson, first, nowIso, parseJsonText, run } from '../lib/db';
import { generateId } from '../lib/security';
import { normalizePhoneE164, tryNormalizePhoneE164 } from './utils';
const AUTOMATION_SETTINGS_KEY = 'whatsapp_automation_settings';
const BRIDGE_STATUS_KEY = 'whatsapp_bridge_status';
const BRIDGE_CONTROL_KEY = 'whatsapp_bridge_control';
const LEGACY_AUTOMATION_KEY = 'wa_bot_enabled';
const TEST_MODE_KEY = 'wa_test_mode';
const TEST_NUMBER_KEY = 'wa_test_number';
const defaultAutomationSettings = () => ({
    enabled: true,
    updatedAt: null,
    updatedBy: null,
    note: null,
});
const defaultTestModeSettings = () => ({
    enabled: false,
    allowedPhoneE164: null,
    updatedAt: null,
});
const defaultBridgeRuntimeStatus = () => ({
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
const readAppSetting = async (env, key, fallback) => {
    const row = await first(env.DB.prepare('SELECT value_json FROM app_settings WHERE key = ?').bind(key));
    return row ? parseJsonText(row.value_json, fallback) : fallback;
};
const readAppSettingRow = (env, key) => first(env.DB.prepare('SELECT value_json, updated_at FROM app_settings WHERE key = ?').bind(key));
const writeAppSetting = async (env, key, value, updatedByUserId) => {
    const timestamp = nowIso();
    await run(env.DB.prepare(`INSERT INTO app_settings (key, value_json, updated_by_user_id, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by_user_id = excluded.updated_by_user_id, updated_at = excluded.updated_at`).bind(key, asJson(value), updatedByUserId, timestamp));
};
const normalizeConnectedPhone = (meId) => {
    if (!meId) {
        return null;
    }
    const match = meId.match(/(\d{10,15})/);
    if (!match) {
        return null;
    }
    return `+${match[1]}`;
};
export const getWhatsAppAutomationSettings = (env) => (async () => {
    const modernRow = await readAppSettingRow(env, AUTOMATION_SETTINGS_KEY);
    if (modernRow) {
        return parseJsonText(modernRow.value_json, defaultAutomationSettings());
    }
    const legacyEnabled = await readAppSetting(env, LEGACY_AUTOMATION_KEY, true);
    return {
        ...defaultAutomationSettings(),
        enabled: legacyEnabled,
    };
})();
export const setWhatsAppAutomationSettings = async (env, params) => {
    const nextSettings = {
        enabled: params.enabled,
        updatedAt: nowIso(),
        updatedBy: params.updatedBy,
        note: params.note?.trim() || null,
    };
    await writeAppSetting(env, AUTOMATION_SETTINGS_KEY, nextSettings, params.updatedBy);
    await writeAppSetting(env, LEGACY_AUTOMATION_KEY, params.enabled, params.updatedBy);
    return nextSettings;
};
export const getWhatsAppTestModeSettings = async (env) => {
    const [enabledRow, phoneRow] = await Promise.all([
        readAppSettingRow(env, TEST_MODE_KEY),
        readAppSettingRow(env, TEST_NUMBER_KEY),
    ]);
    return {
        enabled: enabledRow ? parseJsonText(enabledRow.value_json, false) : false,
        allowedPhoneE164: phoneRow ? tryNormalizePhoneE164(parseJsonText(phoneRow.value_json, null)) : null,
        updatedAt: enabledRow?.updated_at ?? phoneRow?.updated_at ?? null,
    };
};
export const setWhatsAppTestModeSettings = async (env, params) => {
    const normalizedPhone = params.allowedPhoneE164?.trim() ? normalizePhoneE164(params.allowedPhoneE164) : null;
    await Promise.all([
        writeAppSetting(env, TEST_MODE_KEY, params.enabled, params.updatedBy),
        writeAppSetting(env, TEST_NUMBER_KEY, normalizedPhone, params.updatedBy),
    ]);
    return getWhatsAppTestModeSettings(env);
};
export const getBridgeRuntimeStatus = (env) => readAppSetting(env, BRIDGE_STATUS_KEY, defaultBridgeRuntimeStatus());
export const updateBridgeRuntimeStatus = async (env, heartbeat) => {
    const previous = await getBridgeRuntimeStatus(env);
    const timestamp = nowIso();
    const nextStatus = {
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
export const getBridgeControlRequest = (env) => readAppSetting(env, BRIDGE_CONTROL_KEY, null);
export const getPendingBridgeControlRequest = async (env) => {
    const request = await getBridgeControlRequest(env);
    if (!request || request.status !== 'pending') {
        return null;
    }
    return request;
};
export const requestBridgeControl = async (env, params) => {
    const timestamp = nowIso();
    const request = {
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
export const resolveBridgeControlRequest = async (env, params) => {
    const current = await getBridgeControlRequest(env);
    if (!current || current.id !== params.id) {
        return null;
    }
    const timestamp = nowIso();
    const nextRequest = {
        ...current,
        status: params.status,
        resultMessage: params.resultMessage?.trim() || null,
        updatedAt: timestamp,
        completedAt: timestamp,
    };
    await writeAppSetting(env, BRIDGE_CONTROL_KEY, nextRequest, null);
    return nextRequest;
};
export const resolveCustomerCategory = (metadataJson, crmContactId) => {
    const metadata = parseJsonText(metadataJson, {});
    const explicitCategory = metadata.customerCategory;
    if (explicitCategory === 'house' || explicitCategory === 'new') {
        return explicitCategory;
    }
    return crmContactId ? 'house' : 'new';
};
export const updateCustomerCategory = async (env, params) => {
    const profile = await first(env.DB.prepare('SELECT metadata_json, tags_json FROM customer_profiles WHERE id = ?').bind(params.profileId));
    if (!profile) {
        return null;
    }
    const metadata = parseJsonText(profile.metadata_json, {});
    metadata.customerCategory = params.category;
    metadata.customerCategoryUpdatedAt = nowIso();
    const tags = parseJsonText(profile.tags_json, []).filter((tag) => tag !== 'customer:house' && tag !== 'customer:new');
    tags.push(`customer:${params.category}`);
    await run(env.DB.prepare('UPDATE customer_profiles SET metadata_json = ?, tags_json = ?, updated_at = ? WHERE id = ?').bind(asJson(metadata), asJson(tags), nowIso(), params.profileId));
    return params.category;
};
