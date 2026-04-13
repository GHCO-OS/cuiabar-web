export class HttpError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
export const jsonError = (c, status, message, details) => c.json({
    ok: false,
    error: message,
    details,
}, status);
export const getRequestIp = (request) => request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
export const isMutationMethod = (method) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
export const requireJsonBody = async (request) => {
    try {
        return (await request.json());
    }
    catch {
        throw new HttpError(400, 'JSON invalido.');
    }
};
export const csvResponse = (content, filename) => new Response(content, {
    headers: {
        'content-type': 'text/csv; charset=UTF-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store',
    },
});
