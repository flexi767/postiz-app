import {
  isNativePostizAuthFlow,
  resolveScrapeUiSsoEntryUrl,
  shouldDelegateScrapeUiAuthEntry,
} from './scrapeui-sso-entry';

describe('ScrapeUI auth boundary', () => {
  describe('entry-route delegation', () => {
    it.each([
      '/auth',
      '/auth/',
      '/auth/login',
      '/auth/login/',
      '/auth/login-required',
      '/auth/register',
    ])('delegates unauthenticated entry route %s', (pathname) => {
      expect(
        shouldDelegateScrapeUiAuthEntry(pathname, false, new URLSearchParams())
      ).toBe(true);
    });

    it.each([
      '/auth/logout',
      '/auth/forgot',
      '/auth/forgot/token',
      '/auth/activate',
      '/auth/activate/code',
      '/provider/test',
      '/integrations/social/test',
    ])('preserves non-entry route %s', (pathname) => {
      expect(
        shouldDelegateScrapeUiAuthEntry(pathname, false, new URLSearchParams())
      ).toBe(false);
    });

    it('does not delegate authenticated entry requests', () => {
      expect(
        shouldDelegateScrapeUiAuthEntry(
          '/auth/login',
          true,
          new URLSearchParams()
        )
      ).toBe(false);
    });

    it.each(['x=1', 'provider=GOOGLE', 'code=orphan'])(
      'does not let arbitrary or incomplete query parameters bypass delegation: %s',
      (query) => {
        expect(
          shouldDelegateScrapeUiAuthEntry(
            '/auth',
            false,
            new URLSearchParams(query)
          )
        ).toBe(true);
      }
    );

    it.each(['provider=GOOGLE&code=callback', 'org=invite-token'])(
      'preserves recognized native /auth flow: %s',
      (query) => {
        expect(
          shouldDelegateScrapeUiAuthEntry(
            '/auth',
            false,
            new URLSearchParams(query)
          )
        ).toBe(false);
      }
    );

    it.each(['provider=GOOGLE&code=forged', 'org=forged'])(
      'does not honor native-flow parameters outside exact /auth: %s',
      (query) => {
        expect(
          shouldDelegateScrapeUiAuthEntry(
            '/auth/login',
            false,
            new URLSearchParams(query)
          )
        ).toBe(true);
      }
    );
  });

  describe('native-flow detection', () => {
    it('supports Next page search-param records and array values', () => {
      expect(
        isNativePostizAuthFlow({
          provider: ['WALLET'],
          code: ['callback'],
        })
      ).toBe(true);
    });

    it('does not confuse a query parameter named get with URLSearchParams.get', () => {
      expect(
        isNativePostizAuthFlow({
          get: 'not-a-function',
          provider: 'GOOGLE',
          code: 'callback',
        })
      ).toBe(true);
    });
  });

  describe('localized SSO URL', () => {
    const template = 'https://topkoli.com/{locale}/social-workspace';

    it.each(['en', 'de', 'ru', 'bg'])(
      'interpolates supported locale %s',
      (locale) => {
        expect(resolveScrapeUiSsoEntryUrl(template, locale)).toBe(
          `https://topkoli.com/${locale}/social-workspace`
        );
      }
    );

    it('falls back unsupported locales to English', () => {
      expect(resolveScrapeUiSsoEntryUrl(template, 'fr')).toBe(
        'https://topkoli.com/en/social-workspace'
      );
    });

    it.each([
      undefined,
      '',
      'http://topkoli.com/{locale}/social-workspace',
      'https://user:password@topkoli.com/{locale}/social-workspace',
      'not a URL',
    ])('rejects unsafe or absent SSO configuration: %s', (value) => {
      expect(resolveScrapeUiSsoEntryUrl(value, 'bg')).toBeNull();
    });
  });
});
