export const MEUCUIABAR_HOSTNAME = 'meu.cuiabar.com';

export const resolveMeuCuiabarBasePath = () => {
  if (typeof window !== 'undefined' && window.location.hostname.toLowerCase() === MEUCUIABAR_HOSTNAME) {
    return '';
  }

  return '/meucuiabar';
};

export const MEUCUIABAR_BASE_PATH = resolveMeuCuiabarBasePath();
export const MEUCUIABAR_BASE44_APP_ID =
  import.meta.env.VITE_MEUCUIABAR_BASE44_APP_ID || '69af048021462889147356e5';
export const MEUCUIABAR_BASE44_APP_BASE_URL =
  import.meta.env.VITE_MEUCUIABAR_BASE44_APP_BASE_URL || 'https://preview-sandbox--69af048021462889147356e5.base44.app';
