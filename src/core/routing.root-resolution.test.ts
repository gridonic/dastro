import { describe, expect, test } from 'vitest';
import { dastroTest } from '../../test/_testing-core/dastro-test.ts';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import { renderPage } from './page.ts';

type I18nConfig = DastroConfig<DastroTypes>['i18n'];

const regionLocales = ['de_CH', 'fr_CH', 'it_CH', 'en', 'de_DE', 'fr_FR'];

/** A region-aware site: several locales per language, `en` as last resort. */
const regionSite: Partial<I18nConfig> = {
  locales: regionLocales,
  defaultLocale: 'en',
  routingStrategy: 'prefix-always',
  localePrefix: 'locale',
  languageFallbacks: { de: 'de_CH', fr: 'fr_CH' },
  localeCookie: 'locale',
};

/** A site as before the root-resolution options existed. */
const languageSite: Partial<I18nConfig> = {
  routingStrategy: 'prefix-always',
};

/** Requests the site root and returns the redirect response. */
async function requestRoot(
  opts: {
    i18n?: Partial<I18nConfig>;
    acceptLanguage?: string;
    cookies?: Record<string, string>;
    url?: string;
  } = {},
) {
  const { i18n = regionSite, acceptLanguage, cookies = {}, url = '/' } = opts;

  const { astroContext, config } = dastroTest({
    locale: i18n.defaultLocale,
    config: { i18n },
  });

  const requestUrl = new URL(url, 'https://testing.dastro.com');
  const context = {
    url: requestUrl,
    request: new Request(requestUrl, {
      headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : {},
    }),
    locals: astroContext.locals,
    cookies: {
      get: (name: string) =>
        name in cookies ? { value: cookies[name] } : undefined,
    },
    response: { headers: new Headers() },
    redirect: (location: string, status = 302) =>
      new Response(null, { status, headers: { Location: location } }),
    rewrite: (rewrite: string) => ({ rewrite }),
  };

  const response = (await renderPage(
    context as any,
    config,
    async () => ({}),
  )) as Response;

  return { response, context };
}

async function rootTarget(opts: Parameters<typeof requestRoot>[0] = {}) {
  const { response } = await requestRoot(opts);

  expect(response.status).toBe(302);

  return response.headers.get('Location');
}

describe('root resolution', () => {
  describe('response', () => {
    test('keeps the query string through the redirect', async () => {
      expect(await rootTarget({ url: '/?utm_source=x&a=1' })).toBe(
        '/en/?utm_source=x&a=1',
      );
      expect(
        await rootTarget({ url: '/?utm_source=x', acceptLanguage: 'de-DE' }),
      ).toBe('/de-de/?utm_source=x');
    });

    test('is not cacheable by browser or CDN', async () => {
      const { response, context } = await requestRoot();

      for (const headers of [response.headers, context.response.headers]) {
        expect(headers.get('Cache-Control')).toBe('private, no-store');
        expect(headers.get('Netlify-CDN-Cache-Control')).toBeNull();
        expect(headers.get('CDN-Cache-Control')).toBeNull();
        expect(headers.get('Netlify-Vary')).toBeNull();
      }
    });
  });

  describe('locale cookie', () => {
    test('a valid cookie wins over the Accept-Language header', async () => {
      expect(
        await rootTarget({
          cookies: { locale: 'fr_FR' },
          acceptLanguage: 'de-DE,de;q=0.9',
        }),
      ).toBe('/fr-fr/');
      expect(await rootTarget({ cookies: { locale: 'it_CH' } })).toBe(
        '/it-ch/',
      );
    });

    test('an invalid cookie is ignored and not cleared', async () => {
      for (const value of ['en_CH', 'fr-fr', 'de', '', 'nonsense']) {
        const { response } = await requestRoot({
          cookies: { locale: value },
          acceptLanguage: 'de-DE',
        });

        expect(response.headers.get('Location')).toBe('/de-de/');
        expect(response.headers.get('Set-Cookie')).toBeNull();
      }
    });

    test('only the configured cookie name is read', async () => {
      expect(
        await rootTarget({
          cookies: { lang: 'fr_FR' },
          acceptLanguage: 'de-DE',
        }),
      ).toBe('/de-de/');
      expect(
        await rootTarget({
          i18n: { ...regionSite, localeCookie: 'lang' },
          cookies: { lang: 'fr_FR' },
          acceptLanguage: 'de-DE',
        }),
      ).toBe('/fr-fr/');
    });

    test('without the option no cookie is read', async () => {
      expect(
        await rootTarget({
          i18n: { ...regionSite, localeCookie: undefined },
          cookies: { locale: 'fr_FR' },
          acceptLanguage: 'de-DE',
        }),
      ).toBe('/de-de/');
    });
  });

  describe('exact pass', () => {
    test('a full tag that equals a locale resolves to it', async () => {
      expect(await rootTarget({ acceptLanguage: 'de-DE' })).toBe('/de-de/');
      expect(await rootTarget({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe(
        '/fr-fr/',
      );
      expect(await rootTarget({ acceptLanguage: 'it-CH' })).toBe('/it-ch/');
      expect(await rootTarget({ acceptLanguage: 'en' })).toBe('/en/');
    });

    test('beats the fallback pass: a bare language listed before its full tag', async () => {
      expect(await rootTarget({ acceptLanguage: 'fr,fr-FR;q=0.8' })).toBe(
        '/fr-fr/',
      );
      expect(
        await rootTarget({ acceptLanguage: 'de,de-DE;q=0.8,en;q=0.5' }),
      ).toBe('/de-de/');
    });

    test('tags match regardless of case', async () => {
      expect(await rootTarget({ acceptLanguage: 'DE-de' })).toBe('/de-de/');
      expect(await rootTarget({ acceptLanguage: 'fr-fr' })).toBe('/fr-fr/');
    });
  });

  describe('fallback pass', () => {
    test('a bare language follows languageFallbacks', async () => {
      expect(
        await rootTarget({
          i18n: { ...regionSite, languageFallbacks: { de: 'de_DE' } },
          acceptLanguage: 'de',
        }),
      ).toBe('/de-de/');
      expect(await rootTarget({ acceptLanguage: 'fr' })).toBe('/fr-ch/');
    });

    test('an uncovered region follows languageFallbacks', async () => {
      expect(
        await rootTarget({
          i18n: { ...regionSite, languageFallbacks: { fr: 'fr_FR' } },
          acceptLanguage: 'fr-BE',
        }),
      ).toBe('/fr-fr/');
      expect(await rootTarget({ acceptLanguage: 'de-AT' })).toBe('/de-ch/');
      expect(await rootTarget({ acceptLanguage: 'fr-CA,fr;q=0.9' })).toBe(
        '/fr-ch/',
      );
    });

    test('a fallback to a locale the site does not have is ignored', async () => {
      expect(
        await rootTarget({
          i18n: { ...regionSite, languageFallbacks: { de: 'de_AT' } },
          acceptLanguage: 'de',
        }),
      ).toBe('/de-ch/');
    });
  });

  describe('configured order', () => {
    test('a language without a fallback resolves to its first locale', async () => {
      expect(await rootTarget({ acceptLanguage: 'it' })).toBe('/it-ch/');
      expect(await rootTarget({ acceptLanguage: 'it-IT' })).toBe('/it-ch/');
      expect(await rootTarget({ acceptLanguage: 'en-US,en;q=0.9' })).toBe(
        '/en/',
      );
      expect(
        await rootTarget({
          i18n: { ...regionSite, languageFallbacks: undefined },
          acceptLanguage: 'fr',
        }),
      ).toBe('/fr-ch/');
    });
  });

  describe('default locale', () => {
    test('no header resolves to the default locale', async () => {
      expect(await rootTarget()).toBe('/en/');
      expect(
        await rootTarget({ i18n: { ...regionSite, defaultLocale: 'de_CH' } }),
      ).toBe('/de-ch/');
    });

    test('unsupported languages resolve to the default locale', async () => {
      expect(await rootTarget({ acceptLanguage: 'ja,zh-CN;q=0.8' })).toBe(
        '/en/',
      );
    });

    test('`*` and malformed entries are ignored', async () => {
      expect(
        await rootTarget({
          i18n: { ...regionSite, defaultLocale: 'it_CH' },
          acceptLanguage: '*',
        }),
      ).toBe('/it-ch/');
      expect(await rootTarget({ acceptLanguage: '*, de-DE;q=0.5' })).toBe(
        '/de-de/',
      );
      expect(
        await rootTarget({ acceptLanguage: 'de_DE, ;q=0.9, fr-FR;q=abc, ,' }),
      ).toBe('/en/');
      expect(await rootTarget({ acceptLanguage: 'deutsch-sprache, it' })).toBe(
        '/it-ch/',
      );
    });
  });

  describe('preference order', () => {
    test('entries are sorted by q-value', async () => {
      expect(await rootTarget({ acceptLanguage: 'fr-FR;q=0.5,de-DE' })).toBe(
        '/de-de/',
      );
      expect(
        await rootTarget({ acceptLanguage: 'en;q=0.3,it;q=0.7,ja;q=0.9' }),
      ).toBe('/it-ch/');
      expect(
        await rootTarget({ acceptLanguage: 'de;q=0.8,de-DE;q=0.2,fr;q=0.9' }),
      ).toBe('/fr-ch/');
    });

    test('header order breaks ties', async () => {
      expect(await rootTarget({ acceptLanguage: 'it,de-DE' })).toBe('/it-ch/');
      expect(
        await rootTarget({ acceptLanguage: 'de-DE;q=0.8,fr-FR;q=0.8' }),
      ).toBe('/de-de/');
    });

    test('an entry with q=0 is not acceptable', async () => {
      expect(await rootTarget({ acceptLanguage: 'de-DE;q=0,it;q=0.1' })).toBe(
        '/it-ch/',
      );
    });

    test('the most preferred language the site has decides, not a later exact tag', async () => {
      // Firefox sends the bare language first, then English
      expect(
        await rootTarget({ acceptLanguage: 'de,en-US;q=0.7,en;q=0.3' }),
      ).toBe('/de-ch/');
      expect(
        await rootTarget({ acceptLanguage: 'it,en-US;q=0.7,en;q=0.3' }),
      ).toBe('/it-ch/');
      expect(
        await rootTarget({ acceptLanguage: 'de-AT,de;q=0.9,fr-FR;q=0.8' }),
      ).toBe('/de-ch/');
      expect(await rootTarget({ acceptLanguage: 'ja,fr-FR;q=0.8,de;q=0.5' })).toBe(
        '/fr-fr/',
      );
    });
  });

  describe('without the new options', () => {
    test('the root redirects to the language of the visitor, else of the default locale', async () => {
      const i18n = languageSite;

      expect(await rootTarget({ i18n })).toBe('/de/');
      expect(await rootTarget({ i18n, acceptLanguage: 'fr-FR,de;q=0.8' })).toBe(
        '/fr/',
      );
      expect(await rootTarget({ i18n, acceptLanguage: 'fr,de;q=0.9' })).toBe(
        '/fr/',
      );
      expect(
        await rootTarget({ i18n, acceptLanguage: 'en-US,en;q=0.9,de;q=0.8' }),
      ).toBe('/en/');
      expect(await rootTarget({ i18n, acceptLanguage: 'it,en;q=0.8' })).toBe(
        '/en/',
      );
      expect(await rootTarget({ i18n, acceptLanguage: 'ja' })).toBe('/de/');
    });

    test('a locale cookie is not read', async () => {
      expect(
        await rootTarget({
          i18n: languageSite,
          cookies: { locale: 'fr_CH' },
          acceptLanguage: 'en',
        }),
      ).toBe('/en/');
    });

    test('the query string is kept and the redirect is not cached', async () => {
      const { response } = await requestRoot({
        i18n: languageSite,
        url: '/?utm_source=x',
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/de/?utm_source=x');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      expect(response.headers.get('Netlify-CDN-Cache-Control')).toBeNull();
    });
  });
});
