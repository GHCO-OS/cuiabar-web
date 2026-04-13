const encodeHeader = (value) => `=?UTF-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
const base64Url = (value) => btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
const toBase64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
};
const wrapBase64Lines = (value, size = 76) => {
    const lines = [];
    for (let index = 0; index < value.length; index += size) {
        lines.push(value.slice(index, index + size));
    }
    return lines.join('\r\n');
};
export const buildMimeMessage = (payload) => {
    const boundary = `crm_${crypto.randomUUID().replace(/-/g, '')}`;
    const encodedText = wrapBase64Lines(toBase64(payload.text));
    const encodedHtml = wrapBase64Lines(toBase64(payload.html));
    const headers = [
        `From: ${encodeHeader(payload.fromName)} <${payload.fromEmail}>`,
        `To: ${payload.to}`,
        payload.replyTo ? `Reply-To: ${payload.replyTo}` : null,
        `Subject: ${encodeHeader(payload.subject)}`,
        'MIME-Version: 1.0',
        `List-Unsubscribe: <${payload.listUnsubscribeUrl}>`,
        'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ...Object.entries(payload.headers ?? {}).map(([key, value]) => `${key}: ${value}`),
    ].filter(Boolean);
    const mime = [
        ...headers,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        encodedText,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        encodedHtml,
        '',
        `--${boundary}--`,
        '',
    ].join('\r\n');
    return {
        raw: base64Url(mime),
        mime,
    };
};
