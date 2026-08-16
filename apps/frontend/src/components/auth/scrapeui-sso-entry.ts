export function resolveScrapeUiSsoEntryUrl(value: string | undefined): string | null {
  const configured = value?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
