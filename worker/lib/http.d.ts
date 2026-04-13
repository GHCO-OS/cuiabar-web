import type { Context } from 'hono';
export declare class HttpError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown);
}
export declare const jsonError: (c: Context, status: number, message: string, details?: unknown) => Response & import("hono").TypedResponse<{
    ok: false;
    error: string;
    details: import("hono/utils/types").JSONValue;
}, never, "json">;
export declare const getRequestIp: (request: Request) => string | null;
export declare const isMutationMethod: (method: string) => boolean;
export declare const requireJsonBody: <T>(request: Request) => Promise<T>;
export declare const csvResponse: (content: string, filename: string) => Response;
