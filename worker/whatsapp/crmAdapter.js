import { asJson, first, nowIso, parseJsonText, run } from '../lib/db';
import { generateId } from '../lib/security';
import { attachCrmContactLink } from './repository';
import { appendUniqueTags, sanitizeMessageText } from './utils';
const splitName = (value) => {
    const sanitized = sanitizeMessageText(value, 160);
    if (!sanitized) {
        return { firstName: null, lastName: null };
    }
    const parts = sanitized.split(' ').filter(Boolean);
    return {
        firstName: parts[0] ?? null,
        lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
    };
};
const createContactNotes = (existingNotes, summary) => {
    const notes = sanitizeMessageText(existingNotes, 2000);
    if (!notes) {
        return summary;
    }
    if (notes.includes(summary)) {
        return notes;
    }
    return `${summary}\n\n${notes}`.slice(0, 2000);
};
const findExistingContact = async (env, payload) => {
    const profile = await first(env.DB.prepare('SELECT crm_contact_id, email FROM customer_profiles WHERE id = ?').bind(payload.customerProfileId));
    if (profile?.crm_contact_id) {
        const linked = await first(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(profile.crm_contact_id));
        if (linked) {
            return linked;
        }
    }
    if (profile?.email) {
        const byEmail = await first(env.DB.prepare('SELECT * FROM contacts WHERE email = ?').bind(profile.email));
        if (byEmail) {
            return byEmail;
        }
    }
    return first(env.DB.prepare(`SELECT *
       FROM contacts
       WHERE phone = ?
       ORDER BY updated_at DESC
       LIMIT 1`).bind(payload.phoneE164));
};
const upsertEmailContact = async (env, payload) => {
    const profile = await first(env.DB.prepare('SELECT email FROM customer_profiles WHERE id = ?').bind(payload.customerProfileId));
    if (!profile?.email) {
        return null;
    }
    const existing = await first(env.DB.prepare('SELECT * FROM contacts WHERE email = ?').bind(profile.email));
    const names = splitName(payload.displayName);
    const tags = ['whatsapp', ...payload.tags];
    const timestamp = nowIso();
    if (existing) {
        await run(env.DB.prepare(`UPDATE contacts
         SET first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             phone = COALESCE(?, phone),
             source = 'whatsapp_assistant',
             tags_json = ?,
             notes = ?,
             updated_at = ?
         WHERE id = ?`).bind(names.firstName, names.lastName, payload.phoneE164, asJson(appendUniqueTags(parseJsonText(existing.tags_json, []), tags)), createContactNotes(existing.notes, payload.summary), timestamp, existing.id));
        return (await first(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(existing.id)));
    }
    const contactId = generateId('ctc');
    await run(env.DB.prepare(`INSERT INTO contacts (
        id, email, first_name, last_name, phone, source, tags_json, notes, status, opt_in_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'whatsapp_assistant', ?, ?, 'active', 'unknown', ?, ?)`).bind(contactId, profile.email, names.firstName, names.lastName, payload.phoneE164, asJson(tags), payload.summary, timestamp, timestamp));
    return (await first(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId)));
};
const storePublicInteraction = async (env, payload, contactId) => {
    await run(env.DB.prepare(`INSERT INTO public_interaction_events (
        id, event_name, event_category, source, channel, contact_id, identity_phone, external_ref,
        label, metadata_json, created_at
      ) VALUES (?, ?, 'conversation', 'whatsapp_assistant', 'whatsapp', ?, ?, ?, ?, ?, ?)`).bind(generateId('pubint'), payload.interactionType, contactId, payload.phoneE164, payload.conversationId, payload.latestIntent, asJson({
        summary: payload.summary,
        tags: payload.tags,
        messageText: payload.messageText,
        ...payload.metadata,
    }), nowIso()));
};
const syncConversationLocal = async (env, payload) => {
    let contact = await findExistingContact(env, payload);
    if (!contact) {
        contact = await upsertEmailContact(env, payload);
    }
    await storePublicInteraction(env, payload, contact?.id ?? null);
    await attachCrmContactLink(env, payload.customerProfileId, contact?.id ?? null);
    return {
        customerProfileId: payload.customerProfileId,
        crmContactId: contact?.id ?? null,
    };
};
const syncConversationRest = async (env, payload) => {
    const baseUrl = env.CRM_BASE_URL?.trim() || env.APP_BASE_URL;
    const token = env.CRM_INTERNAL_TOKEN?.trim();
    if (!baseUrl || !token) {
        throw new Error('CRM REST adapter nao configurado.');
    }
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/internal/whatsapp/crm/sync`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-internal-token': token,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`CRM REST sync falhou com status ${response.status}`);
    }
    const data = (await response.json());
    return data.result ?? {
        customerProfileId: payload.customerProfileId,
        crmContactId: null,
    };
};
export const createCrmAdapter = (env) => ({
    syncConversation: (payload) => {
        const mode = (env.CRM_INTEGRATION_MODE ?? 'local').trim().toLowerCase();
        if (mode === 'rest') {
            return syncConversationRest(env, payload);
        }
        return syncConversationLocal(env, payload);
    },
});
export const syncConversationToLocalCrm = (env, payload) => syncConversationLocal(env, payload);
