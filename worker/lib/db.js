export const nowIso = () => new Date().toISOString();
export const asJson = (value) => JSON.stringify(value ?? {});
export const parseJsonText = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
};
export const first = async (statement) => {
    const row = await statement.first();
    return row ?? null;
};
export const all = async (statement) => {
    const result = await statement.all();
    return result.results ?? [];
};
export const run = async (statement) => statement.run();
export const parseBoolean = (value, fallback = false) => {
    if (value === undefined) {
        return fallback;
    }
    return value === 'true' || value === '1';
};
export const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
