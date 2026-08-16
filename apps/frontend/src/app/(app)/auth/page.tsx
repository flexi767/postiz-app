import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
export const dynamic = 'force-dynamic';
import { Register } from '@gitroom/frontend/components/auth/register';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import Link from 'next/link';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import { LoginWithOidc } from '@gitroom/frontend/components/auth/login.with.oidc';
import {
  isNativePostizAuthFlow,
  resolveScrapeUiSsoEntryUrl,
} from '@gitroom/frontend/components/auth/scrapeui-sso-entry';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import {
  cookieName,
  fallbackLng,
  headerName,
  resolveSupportedLanguage,
} from '@gitroom/react/translation/i18n.config';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Register`,
  description: '',
};
export default async function Auth(params: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [cookieStore, headerStore, searchParams] = await Promise.all([
    cookies(),
    headers(),
    params.searchParams,
  ]);
  const language = resolveSupportedLanguage(
    cookieStore.get(cookieName)?.value ||
      headerStore.get(headerName) ||
      fallbackLng
  );
  const scrapeUiEntry = resolveScrapeUiSsoEntryUrl(
    process.env.SCRAPEUI_SSO_URL,
    language
  );
  if (scrapeUiEntry && !isNativePostizAuthFlow(searchParams)) {
    redirect(scrapeUiEntry);
  }
  const t = await getT();
  if (process.env.DISABLE_REGISTRATION === 'true') {
    const canRegister = (
      await (await internalFetch('/auth/can-register')).json()
    ).register;
    if (!canRegister && !searchParams.provider) {
      return (
        <>
          <LoginWithOidc />
          <div className="text-center">
            {t('registration_is_disabled', 'Registration is disabled')}
            <br />
            <Link className="underline hover:font-bold" href="/auth/login">
              {t('login_instead', 'Login instead')}
            </Link>
          </div>
        </>
      );
    }
  }
  return <Register />;
}
