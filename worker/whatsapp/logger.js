export const logStructured = (event, payload) => {
    console.log(JSON.stringify({
        scope: 'whatsapp_ai',
        event,
        ...payload,
    }));
};
export const logStructuredError = (event, error, payload = {}) => {
    console.error(JSON.stringify({
        scope: 'whatsapp_ai',
        event,
        message: error instanceof Error ? error.message : 'unknown_error',
        stack: error instanceof Error ? error.stack ?? null : null,
        ...payload,
    }));
};
