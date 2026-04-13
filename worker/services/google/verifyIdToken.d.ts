import type { Env } from '../../types';
export interface GoogleIdentity {
    subject: string;
    email: string;
    name: string;
    picture?: string;
    hostedDomain?: string;
}
export declare const verifyGoogleIdToken: (env: Env, credential: string, audienceOverride?: string) => Promise<GoogleIdentity>;
