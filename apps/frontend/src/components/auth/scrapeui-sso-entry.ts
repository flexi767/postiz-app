import { resolveSupportedLanguage } from '@gitroom/react/translation/i18n.config';

type AuthSearchParams =
  | Pick<URLSearchParams, 'get'>
  | Record<string, string | string[] | undefined>;

const delegatedAuthEntryPaths = new Set([
  '/auth',
  '/auth/login',
  '/auth/login-required',
  '/auth/register',
]);

function getFirstSearchParam(searchParams: AuthSearchParams, name: string) {
  const getter = searchParams.get;
  if (typeof getter === 'function') return getter.call(searchParams, name);
  const value = (searchParams as Record<string, string | string[] | undefined>)[
    name
  ];
  return Array.isArray(value) ? value[0] : value;
}

export function isNativePostizAuthFlow(searchParams: AuthSearchParams) {
  const org = getFirstSearchParam(searchParams, 'org');
  const provider = getFirstSearchParam(searchParams, 'provider');
  const code = getFirstSearchParam(searchParams, 'code');
  return Boolean(org || (provider && code));
}

export function shouldDelegateScrapeUiAuthEntry(
  pathname: string,
  isAuthenticated: boolean,
  searchParams: AuthSearchParams
) {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const isNativeAuthFlow =
    normalizedPathname === '/auth' && isNativePostizAuthFlow(searchParams);
  return (
    !isAuthenticated &&
    delegatedAuthEntryPaths.has(normalizedPathname) &&
    !isNativeAuthFlow
  );
}

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
