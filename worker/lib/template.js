import { sanitizeTemplateHtml } from './security';
const mergePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
export const extractMergeVariables = (source) => {
    const names = new Set();
    for (const match of source.matchAll(mergePattern)) {
        if (match[1]) {
            names.add(match[1]);
        }
    }
    return [...names];
};
export const applyMergeTags = (source, context) => source.replace(mergePattern, (_, rawName) => {
    const value = context[rawName];
    return value == null ? '' : String(value);
});
export const prepareTemplateContent = (html, text, context) => ({
    html: sanitizeTemplateHtml(applyMergeTags(html, context)),
    text: applyMergeTags(text, context),
});
export const extractHrefLinks = (html) => {
    const urls = new Set();
    const pattern = /href=(["'])(https?:\/\/[^"']+)\1/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
        urls.add(match[2]);
    }
    return [...urls];
};
export const replaceHtmlLinks = (html, replacements) => html.replace(/href=(["'])(https?:\/\/[^"']+)\1/gi, (full, quote, url) => {
    const replacement = replacements.get(url);
    if (!replacement) {
        return full;
    }
    return `href=${quote}${replacement}${quote}`;
});
export const replaceTextLinks = (text, replacements) => {
    let updated = text;
    for (const [original, replacement] of replacements.entries()) {
        updated = updated.split(original).join(replacement);
    }
    return updated;
};
