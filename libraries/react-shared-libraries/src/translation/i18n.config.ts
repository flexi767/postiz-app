export const fallbackLng = 'en';
export const languages = [fallbackLng, 'de', 'ru', 'bg'];
export const languageCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

export function resolveSupportedLanguage(value: string | undefined): string {
  return value && languages.includes(value) ? value : fallbackLng;
}

export const defaultNS = 'translation';
export const cookieName = 'i18next';
export const headerName = 'x-i18next-current-language';
