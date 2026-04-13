import type { Env } from '../../types';
export declare const sendAdConversion: (env: Env, gclid: string, orderId: string, conversionValue: number, conversionTime: Date) => Promise<void>;
