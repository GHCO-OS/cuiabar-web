export interface MergeContext {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    unsubscribe_url?: string;
    campaign_name?: string;
    reply_to?: string | null;
    [key: string]: string | null | undefined;
}
export declare const extractMergeVariables: (source: string) => string[];
export declare const applyMergeTags: (source: string, context: MergeContext) => string;
export declare const prepareTemplateContent: (html: string, text: string, context: MergeContext) => {
    html: string;
    text: string;
};
export declare const extractHrefLinks: (html: string) => string[];
export declare const replaceHtmlLinks: (html: string, replacements: Map<string, string>) => string;
export declare const replaceTextLinks: (text: string, replacements: Map<string, string>) => string;
