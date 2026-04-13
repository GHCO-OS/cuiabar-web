export const logStructured = (event: string, payload: Record<string, unknown>) => {
  console.log(
    JSON.stringify({
      scope: 'whatsapp_ai',
      event,
      ...payload,
    }),
  );
};

export const logStructuredError = (event: string, error: unknown, payload: Record<string, unknown> = {}) => {
  console.error(
    JSON.stringify({
      scope: 'whatsapp_ai',
      event,
      message: error instanceof Error ? error.message : 'unknown_error',
      stack: error instanceof Error ? error.stack ?? null : null,
      ...payload,
    }),
  );
};
