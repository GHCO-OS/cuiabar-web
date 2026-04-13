export interface MimePayload {
    fromName: string;
    fromEmail: string;
    to: string;
    subject: string;
    replyTo?: string | null;
    html: string;
    text: string;
    listUnsubscribeUrl: string;
    headers?: Record<string, string>;
}
export declare const buildMimeMessage: (payload: MimePayload) => {
    raw: string;
    mime: string;
};
