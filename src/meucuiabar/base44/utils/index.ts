import { MEUCUIABAR_BASE_PATH } from '@meucuiabar/config';

export function createPageUrl(pageName: string) {
    if (pageName === 'Dashboard') {
        return MEUCUIABAR_BASE_PATH || '/';
    }
    const normalizedPage = pageName.replace(/ /g, '-');
    return `${MEUCUIABAR_BASE_PATH || ''}/${normalizedPage}`;
}
