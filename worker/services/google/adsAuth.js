let cachedAccessToken = null;
export const getGoogleAdsAccessToken = async (env) => {
    const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN } = env;
    if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET || !GOOGLE_ADS_REFRESH_TOKEN) {
        throw new Error('Credenciais do Google Ads nao configuradas.');
    }
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
        return cachedAccessToken.token;
    }
    const body = new URLSearchParams({
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
        grant_type: 'refresh_token',
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao renovar token do Google Ads: ${response.status} ${text.slice(0, 300)}`);
    }
    const payload = (await response.json());
    cachedAccessToken = {
        token: payload.access_token,
        expiresAt: Date.now() + payload.expires_in * 1000,
    };
    return payload.access_token;
};
