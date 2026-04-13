export declare const generateId: (prefix: string) => string;
export declare const randomToken: (size?: number) => string;
export declare const hashPassword: (password: string, salt?: string, iterations?: number) => Promise<{
    salt: string;
    iterations: number;
    hash: string;
}>;
export declare const verifyPassword: (password: string, salt: string, iterations: number, expectedHash: string) => Promise<boolean>;
export declare const normalizeEmail: (value: string) => string;
export declare const ensureEmail: (value: string, message?: string) => string;
export declare const sanitizeTemplateHtml: (value: string) => string;
export declare const requireStrongPassword: (value: string) => void;
