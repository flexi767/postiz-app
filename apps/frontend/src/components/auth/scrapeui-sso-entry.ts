import { resolveSupportedLanguage } from '@gitroom/react/translation/i18n.config';

export function resolveScrapeUiSsoEntryUrl(
  value: string | undefined,
  locale?: string
): string | null {
  const configured = value?.trim();
  if (!configured) return null;
  try {
    const url = new URL(
      configured
        .split('{locale}')
        .join(encodeURIComponent(resolveSupportedLanguage(locale)))
    );
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
