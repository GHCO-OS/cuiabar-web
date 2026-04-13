import { createRemoteJWKSet, jwtVerify } from 'jose';
const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export const verifyGoogleIdToken = async (env, credential, audienceOverride) => {
    const audience = audienceOverride ||
        (env.GOOGLE_AUTH_CLIENT_ID && !env.GOOGLE_AUTH_CLIENT_ID.startsWith('REPLACE_WITH')
            ? env.GOOGLE_AUTH_CLIENT_ID
            : env.GOOGLE_CLIENT_ID);
    if (!audience || audience.startsWith('REPLACE_WITH')) {
        throw new Error('Google Sign-In nao configurado.');
    }
    const { payload } = await jwtVerify(credential, googleJwks, {
        audience,
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });
    if (typeof payload.email !== 'string' || payload.email_verified !== true || typeof payload.sub !== 'string') {
        throw new Error('Token Google invalido ou sem e-mail verificado.');
    }
    return {
        subject: payload.sub,
        email: payload.email,
        name: typeof payload.name === 'string' ? payload.name : payload.email,
        picture: typeof payload.picture === 'string' ? payload.picture : undefined,
        hostedDomain: typeof payload.hd === 'string' ? payload.hd : undefined,
    };
};
