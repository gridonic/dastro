import { describe, expect, test } from 'vitest';
import { dastroTest } from '../../test/_testing-core/dastro-test.ts';
import { buildTestPageRecord } from '../../test/_testing-core/routing-test-utils.ts';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import { renderPage, type PageDefinition } from './page.ts';

type RoutingStrategy = DastroConfig<DastroTypes>['i18n']['routingStrategy'];

const testLocales = ['de_CH', 'fr_CH', 'en', 'de_DE'];

/**
 * A site with two locales of the same language (`de_CH` / `de_DE`), which
 * only `localePrefix: 'locale'` can tell apart.
 */
function localePrefixTest(
  opts: {
    routingStrategy?: RoutingStrategy;
    defaultLocale?: string;
    loadPage?: PageDefinition<DastroTypes>['load'];
  } = {},
) {
  const {
    routingStrategy = 'prefix-always',
    defaultLocale = 'en',
    loadPage = async () => null,
  } = opts;

  const test = dastroTest({
    locale: defaultLocale,
    config: {
      i18n: {
        locales: testLocales,
        defaultLocale,
        routingStrategy,
        localePrefix: 'locale',
      },
      pageDefinitions: {
        PageRecord: {
          paths: { de_CH: '', de_DE: '', fr_CH: '', en: '' },
          load: loadPage,
        },
        ArticleRecord: {
          paths: {
            de_CH: 'themen',
            de_DE: 'themen',
            fr_CH: 'sujets',
            en: 'topics',
          },
        },
      },
    },
  });

  return { ...test, ...test.routing() };
}

function record(name: string, type = 'PageRecord') {
  return buildTestPageRecord(name, {
    type,
    overrides: {
      _allTranslatedSlugLocales: testLocales.map((locale) => ({
        locale,
        value: name === 'home' ? 'home' : `${name}-${locale}`,
      })),
    },
  });
}

describe("localePrefix: 'locale'", () => {
  describe('resolveRecordUrl', () => {
    test('two locales of one language get distinct prefixes', () => {
      const { resolveRecordUrl } = localePrefixTest();

      expect(resolveRecordUrl(record('about'), 'de_CH')).toBe(
        '/de-ch/about-de_CH',
      );
      expect(resolveRecordUrl(record('about'), 'de_DE')).toBe(
        '/de-de/about-de_DE',
      );
    });

    test('a locale without a region keeps its bare prefix', () => {
      const { resolveRecordUrl } = localePrefixTest();

      expect(resolveRecordUrl(record('about'), 'en')).toBe('/en/about-en');
    });

    test('the page type path segment follows the locale prefix', () => {
      const { resolveRecordUrl } = localePrefixTest();

      expect(resolveRecordUrl(record('story', 'ArticleRecord'), 'de_DE')).toBe(
        '/de-de/themen/story-de_DE',
      );
      expect(resolveRecordUrl(record('story', 'ArticleRecord'), 'fr_CH')).toBe(
        '/fr-ch/sujets/story-fr_CH',
      );
    });

    test('prefix-always: every home URL is its locale prefix', () => {
      const { resolveRecordUrl } = localePrefixTest();

      expect(resolveRecordUrl(record('home'), 'de_CH')).toBe('/de-ch');
      expect(resolveRecordUrl(record('home'), 'de_DE')).toBe('/de-de');
      expect(resolveRecordUrl(record('home'), 'fr_CH')).toBe('/fr-ch');
      expect(resolveRecordUrl(record('home'), 'en')).toBe('/en');
    });

    test('prefix-except-default: the default locale home is the root, others their prefix', () => {
      const { resolveRecordUrl } = localePrefixTest({
        routingStrategy: 'prefix-except-default',
        defaultLocale: 'de_CH',
      });

      expect(resolveRecordUrl(record('home'), 'de_CH')).toBe('/');
      expect(resolveRecordUrl(record('home'), 'de_DE')).toBe('/de-de');
      expect(resolveRecordUrl(record('home'), 'en')).toBe('/en');
      expect(resolveRecordUrl(record('about'), 'de_CH')).toBe('/about-de_CH');
      expect(resolveRecordUrl(record('about'), 'de_DE')).toBe(
        '/de-de/about-de_DE',
      );
    });
  });

  describe('pageRecordForUrl', () => {
    test('each prefix resolves to its own locale', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest();

      const swiss = await pageRecordForUrl(astroContext, '/de-ch/about-de_CH');
      expect(swiss.locale).toBe('de_CH');
      expect(swiss.fullSlug).toBe('about-de_CH');

      const german = await pageRecordForUrl(astroContext, '/de-de/about-de_DE');
      expect(german.locale).toBe('de_DE');
      expect(german.fullSlug).toBe('about-de_DE');

      const english = await pageRecordForUrl(astroContext, '/en/about-en');
      expect(english.locale).toBe('en');
      expect(english.fullSlug).toBe('about-en');
    });

    test('resolves the page type of a prefixed URL', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest();

      const result = await pageRecordForUrl(
        astroContext,
        '/de-de/themen/story-de_DE',
      );

      expect(result.locale).toBe('de_DE');
      expect(result.pathPrefix).toBe('themen');
      expect(result.slug).toBe('story-de_DE');
      expect(result.pageDefinition?.type).toBe('ArticleRecord');
    });

    test('home URLs resolve to their locale', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest();

      for (const [url, locale] of [
        ['/de-ch', 'de_CH'],
        ['/de-de', 'de_DE'],
        ['/fr-ch', 'fr_CH'],
        ['/en', 'en'],
      ]) {
        const result = await pageRecordForUrl(astroContext, url);
        expect(result.locale).toBe(locale);
        expect(result.slug).toBeUndefined();
      }
    });

    test('a bare language is not a locale prefix', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest();

      expect(
        (await pageRecordForUrl(astroContext, '/de/about-de_CH')).locale,
      ).toBeUndefined();
      expect(
        (await pageRecordForUrl(astroContext, '/de')).locale,
      ).toBeUndefined();
      expect(
        (await pageRecordForUrl(astroContext, '/fr/about-fr_CH')).locale,
      ).toBeUndefined();
    });

    test('a prefix only matches a whole path segment, in lower case', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest();

      for (const url of ['/de-chx/about', '/de-c/about', '/de-CH/about']) {
        expect(
          (await pageRecordForUrl(astroContext, url)).locale,
        ).toBeUndefined();
      }
    });

    test('prefix-except-default: unprefixed URLs belong to the default locale', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest({
        routingStrategy: 'prefix-except-default',
        defaultLocale: 'de_CH',
      });

      const home = await pageRecordForUrl(astroContext, '/');
      expect(home.locale).toBe('de_CH');
      expect(home.slug).toBeFalsy();

      const page = await pageRecordForUrl(astroContext, '/themen/story-de_CH');
      expect(page.locale).toBe('de_CH');
      expect(page.pathPrefix).toBe('themen');
      expect(page.slug).toBe('story-de_CH');

      const german = await pageRecordForUrl(astroContext, '/de-de/about-de_DE');
      expect(german.locale).toBe('de_DE');
      expect(german.slug).toBe('about-de_DE');
    });

    test('prefix-except-default: a bare language is part of the slug, not a prefix', async () => {
      const { pageRecordForUrl, astroContext } = localePrefixTest({
        routingStrategy: 'prefix-except-default',
        defaultLocale: 'de_CH',
      });

      const result = await pageRecordForUrl(astroContext, '/de/about-de_DE');

      expect(result.locale).toBe('de_CH');
      expect(result.fullSlug).toBe('de/about-de_DE');
    });
  });

  describe('renderPage', () => {
    function renderPageTest(
      url: string,
      opts: Parameters<typeof localePrefixTest>[0] & {
        headers?: Record<string, string>;
      } = {},
    ) {
      const pages = ['home', 'about'].map((name) => record(name));

      const { astroContext, config } = localePrefixTest({
        ...opts,
        loadPage: async (slug, locale) =>
          pages.find((p) =>
            p._allTranslatedSlugLocales?.some(
              (s) => s.locale === locale && s.value === (slug || 'home'),
            ),
          ) ?? null,
      });

      const context = {
        url: new URL(url, 'https://testing.dastro.com'),
        request: new Request(new URL(url, 'https://testing.dastro.com'), {
          headers: opts.headers,
        }),
        locals: astroContext.locals,
        cookies: { get: () => undefined },
        response: { headers: new Headers() },
        redirect: (location: string, status = 302) => ({ location, status }),
        rewrite: (rewrite: string) => ({ rewrite }),
      };

      return renderPage(
        context as any,
        config,
        async () => ({}),
      ) as Promise<any>;
    }

    test('serves a page under its locale prefix', async () => {
      const swiss = await renderPageTest('/de-ch/about-de_CH');
      expect(swiss.locale).toBe('de_CH');
      expect(swiss.page.id).toBe('about-id');

      const german = await renderPageTest('/de-de/about-de_DE');
      expect(german.locale).toBe('de_DE');
      expect(german.page.id).toBe('about-id');

      const home = await renderPageTest('/de-de');
      expect(home.locale).toBe('de_DE');
      expect(home.page.id).toBe('home-id');
    });

    test('a slug of another locale under this prefix is a 404', async () => {
      expect(await renderPageTest('/de-de/about-de_CH')).toEqual({
        rewrite: '/404',
      });
    });

    test('a bare language prefix is a 404', async () => {
      expect(await renderPageTest('/de/about-de_CH')).toEqual({
        rewrite: '/404',
      });
      expect(await renderPageTest('/de')).toEqual({ rewrite: '/404' });
    });

    test('an upper-case prefix is redirected permanently to the lower-case URL', async () => {
      expect(await renderPageTest('/de-CH/about-de_CH')).toEqual({
        location: '/de-ch/about-de_CH',
        status: 301,
      });
      expect(await renderPageTest('/DE-DE')).toEqual({
        location: '/de-de',
        status: 301,
      });
      expect(await renderPageTest('/EN/about-en/')).toEqual({
        location: '/en/about-en/',
        status: 301,
      });
    });

    test('the upper-case prefix redirect keeps the query string', async () => {
      expect(
        await renderPageTest('/de-CH/about-de_CH?utm_source=x&a=1'),
      ).toEqual({
        location: '/de-ch/about-de_CH?utm_source=x&a=1',
        status: 301,
      });
    });

    test('only the prefix is lower-cased, and only when it is a locale', async () => {
      expect(await renderPageTest('/de-CH/About')).toEqual({
        location: '/de-ch/About',
        status: 301,
      });
      expect(await renderPageTest('/DE/about-de_CH')).toEqual({
        rewrite: '/404',
      });
      expect(await renderPageTest('/XX-YY/about')).toEqual({ rewrite: '/404' });
    });

    test('prefix-except-default: the default locale has no prefix to redirect to', async () => {
      const opts = {
        routingStrategy: 'prefix-except-default',
        defaultLocale: 'de_CH',
      } as const;

      expect(await renderPageTest('/de-DE/about-de_DE', opts)).toEqual({
        location: '/de-de/about-de_DE',
        status: 301,
      });
      expect(await renderPageTest('/de-CH/about-de_CH', opts)).toEqual({
        rewrite: '/404',
      });
      expect((await renderPageTest('/about-de_CH', opts)).locale).toBe('de_CH');
      expect((await renderPageTest('/', opts)).page.id).toBe('home-id');
    });

    test('the root redirects to a locale prefix', async () => {
      expect(await renderPageTest('/')).toEqual({
        location: '/en/',
        status: 302,
      });
      expect(
        await renderPageTest('/', { headers: { 'Accept-Language': 'fr' } }),
      ).toEqual({ location: '/fr-ch/', status: 302 });
    });
  });
});

describe('locale helpers', () => {
  test("'locale' mode: prefix is the lower-cased locale, language tag keeps the region in upper case", () => {
    const { i18n } = localePrefixTest();
    const { localePrefix, localeLangTag, localeFromPrefix } = i18n();

    expect(localePrefix('de_CH')).toBe('de-ch');
    expect(localePrefix('en')).toBe('en');
    expect(localeLangTag('de_CH')).toBe('de-CH');
    expect(localeLangTag('en')).toBe('en');
    expect(localeFromPrefix('de-de')).toBe('de_DE');
    expect(localeFromPrefix('de')).toBeUndefined();
    expect(localeFromPrefix('de-DE')).toBeUndefined();
  });

  test("default 'language' mode: prefix and language tag are the bare language", () => {
    const { i18n } = dastroTest();
    const { localePrefix, localeLangTag, localeFromPrefix } = i18n();

    expect(localePrefix('fr_CH')).toBe('fr');
    expect(localeLangTag('fr_CH')).toBe('fr');
    expect(localeFromPrefix('fr')).toBe('fr_CH');
  });

  test('the deprecated normalizedIsoLocale still works, in both modes', () => {
    for (const { i18n } of [dastroTest(), localePrefixTest()]) {
      // Typed loosely so the deprecation does not fail `astro check`
      const { normalizedIsoLocale } = i18n() as {
        normalizedIsoLocale: (
          l: string,
          keepVariant?: boolean,
        ) => string | null;
      };

      expect(normalizedIsoLocale('de_CH')).toBe('de');
      expect(normalizedIsoLocale('de_CH', true)).toBe('de-CH');
      expect(normalizedIsoLocale('en')).toBe('en');
    }
  });
});

describe("default 'language' mode is unchanged", () => {
  function renderLanguageModeRoot(url: string, acceptLanguage?: string) {
    const { astroContext, config } = dastroTest({
      config: { i18n: { routingStrategy: 'prefix-always' } },
    });

    const context = {
      url: new URL(url, 'https://testing.dastro.com'),
      request: new Request(new URL(url, 'https://testing.dastro.com'), {
        headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : {},
      }),
      locals: astroContext.locals,
      cookies: { get: () => undefined },
      response: { headers: new Headers() },
      redirect: (location: string, status = 302) => ({ location, status }),
      rewrite: (rewrite: string) => ({ rewrite }),
    };

    return renderPage(context as any, config, async () => ({})) as Promise<any>;
  }

  test('the root redirects to the bare language of the visitor, else of the default locale', async () => {
    expect(await renderLanguageModeRoot('/')).toEqual({
      location: '/de/',
      status: 302,
    });
    expect(await renderLanguageModeRoot('/', 'fr-FR,de;q=0.8')).toEqual({
      location: '/fr/',
      status: 302,
    });
    expect(await renderLanguageModeRoot('/', 'it,en;q=0.8')).toEqual({
      location: '/en/',
      status: 302,
    });
  });

  test('an upper-case prefix is not redirected', async () => {
    expect(await renderLanguageModeRoot('/DE/about-de')).toEqual({
      rewrite: '/404',
    });
  });
});
