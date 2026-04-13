export declare const nowIso: () => string;
export declare const asJson: <T>(value: T) => string;
export declare const parseJsonText: <T>(value: string | null | undefined, fallback: T) => T;
export declare const first: <T>(statement: D1PreparedStatement) => Promise<T | null>;
export declare const all: <T>(statement: D1PreparedStatement) => Promise<T[]>;
export declare const run: (statement: D1PreparedStatement) => Promise<D1Result<Record<string, unknown>>>;
export declare const parseBoolean: (value: string | undefined, fallback?: boolean) => boolean;
export declare const parseNumber: (value: string | undefined, fallback: number) => number;
