import { expect, describe, test } from 'vitest';
import {
  dastroTest,
  defaultTestLocale,
} from '../../test/_testing-core/dastro-test.ts';
import {
  buildTestPageRecord,
  buildHomeRecord,
} from '../../test/_testing-core/routing-test-utils.ts';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import type { DeepPartial } from '../util/type.util.ts';

describe('resolveRecordUrl', () => {
  function resolveRecordUrlTest(configOverrides?: {
    config?: DeepPartial<DastroConfig<DastroTypes>>;
  }) {
    const { routing } = dastroTest(configOverrides);

    const { resolveRecordUrl } = routing();
    return {
      resolveRecordUrl,
      homeRecord: buildHomeRecord(),
    };
  }

  describe('Home page special case', () => {
    test('should resolve home page for default locale to root path', () => {
      const { resolveRecordUrl, homeRecord } = resolveRecordUrlTest();

      expect(resolveRecordUrl(homeRecord, defaultTestLocale)).toBe('/');
    });

    test('should resolve home page for non-default locale with locale prefix', () => {
      const { resolveRecordUrl, homeRecord } = resolveRecordUrlTest();

      expect(resolveRecordUrl(homeRecord, 'en')).toBe('/en');
    });
  });

  describe('Regular page records', () => {
    test('should resolve default language to url without prefix', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), defaultTestLocale),
      ).toBe('/about-de');
    });

    test('should resolve other language url with prefix', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(resolveRecordUrl(buildTestPageRecord('about'), 'en')).toBe(
        '/en/about-en',
      );
    });
  });

  describe('Missing or null slugs', () => {
    test('should return null when record has no translated slug locales', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(
          buildTestPageRecord('test', {
            overrides: { _allTranslatedSlugLocales: null },
          }),
          defaultTestLocale,
        ),
      ).toBeNull();
    });

    test('should return null when record has empty translated slug locales', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const record = {
        ...buildTestPageRecord('test', {
          overrides: { _allTranslatedSlugLocales: [] },
        }),
      };

      expect(resolveRecordUrl(record, defaultTestLocale)).toBeNull();
    });

    test('should return null when no matching locale found in translated slug locales', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const record = {
        ...buildTestPageRecord('test'),
        _allTranslatedSlugLocales: [{ locale: 'fr', value: 'test-fr' }],
      };

      expect(resolveRecordUrl(record, defaultTestLocale)).toBeNull();
    });

    test('should return null when matching locale has null value', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const record = {
        ...buildTestPageRecord('test'),
        _allTranslatedSlugLocales: [
          { locale: defaultTestLocale, value: null as any },
        ],
      };

      expect(resolveRecordUrl(record, defaultTestLocale)).toBeNull();
    });

    test('should return null when matching locale has undefined value', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const record = {
        ...buildTestPageRecord('test'),
        _allTranslatedSlugLocales: [
          { locale: defaultTestLocale, value: undefined as any },
        ],
      };

      expect(resolveRecordUrl(record, defaultTestLocale)).toBeNull();
    });
  });

  describe('Hierarchical routes with parent records', () => {
    test('should resolve child record with single parent', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const parentRecord = buildTestPageRecord('parent');
      const childRecord = buildTestPageRecord('child', {
        overrides: { parent: parentRecord },
      });

      expect(resolveRecordUrl(childRecord, defaultTestLocale)).toBe(
        '/parent-de/child-de',
      );
    });

    test('should resolve child record with multiple levels of parents', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const grandparentRecord = buildTestPageRecord('grandparent');
      const parentRecord = buildTestPageRecord('parent', {
        overrides: { parent: grandparentRecord },
      });
      const childRecord = buildTestPageRecord('child', {
        overrides: { parent: parentRecord },
      });

      expect(resolveRecordUrl(childRecord, defaultTestLocale)).toBe(
        '/grandparent-de/parent-de/child-de',
      );
    });

    test('should resolve child record with parent for non-default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const parentRecord = buildTestPageRecord('parent');
      const childRecord = buildTestPageRecord('child', {
        overrides: { parent: parentRecord },
      });

      expect(resolveRecordUrl(childRecord, 'en')).toBe(
        '/en/parent-en/child-en',
      );
    });

    test('should handle parent with missing slug gracefully', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const parentRecord = {
        ...buildTestPageRecord('parent'),
        _allTranslatedSlugLocales: null,
      };
      const childRecord = {
        ...buildTestPageRecord('child'),
        parent: parentRecord,
      };

      expect(resolveRecordUrl(childRecord, defaultTestLocale)).toBe(
        '/child-de',
      );
    });
  });

  describe('Different page types with path prefixes', () => {
    test('should resolve page with path prefix for default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(
          buildTestPageRecord('about', {
            type: 'ArticleRecord',
          }),
          defaultTestLocale,
        ),
      ).toBe('/themen/about-de');
    });

    test('should resolve page with path prefix for non-default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(
          buildTestPageRecord('about', { type: 'ArticleRecord' }),
          'en',
        ),
      ).toBe('/en/topics/about-en');
    });
  });

  describe('Locale edge cases', () => {
    test('should handle null locale parameter', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), null as any),
      ).toBeNull();
    });

    test('should handle undefined locale parameter', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), undefined as any),
      ).toBeNull();
    });

    test('should handle empty string locale parameter', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), '' as any),
      ).toBeNull();
    });
  });

  describe('Complex scenarios', () => {
    test('should resolve hierarchical page with path prefix and non-default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const grandparentRecord = buildTestPageRecord('grandparent');
      const parentRecord = buildTestPageRecord('parent', {
        type: 'ArticleRecord',
        overrides: { parent: grandparentRecord },
      });
      const childRecord = buildTestPageRecord('child', {
        type: 'ArticleRecord',
        overrides: { parent: parentRecord },
      });

      // Note: getParentSlugs builds the path in reverse order (parent first, then grandparent)
      expect(resolveRecordUrl(childRecord, 'en')).toBe(
        '/en/topics/grandparent-en/parent-en/child-en',
      );
    });

    test('should handle record with mixed locale availability', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const record = {
        ...buildTestPageRecord('test'),
        _allTranslatedSlugLocales: [
          { locale: 'de', value: 'test-de' },
          { locale: 'en', value: 'test-en' },
          { locale: 'fr', value: null as any }, // French has null value
        ],
      };

      expect(resolveRecordUrl(record, 'de')).toBe('/test-de');
      expect(resolveRecordUrl(record, 'en')).toBe('/en/test-en');
      expect(resolveRecordUrl(record, 'fr')).toBeNull();
    });
  });

  describe('Given routing strategy is prefix-always', () => {
    test('should resolve home page for default locale to default locale prefix', () => {
      const { resolveRecordUrl, homeRecord } = resolveRecordUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      expect(resolveRecordUrl(homeRecord, defaultTestLocale)).toBe('/de');
    });

    test('should resolve home page for non-default locale with locale prefix', () => {
      const { resolveRecordUrl, homeRecord } = resolveRecordUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      expect(resolveRecordUrl(homeRecord, 'en')).toBe('/en');
    });

    test('should resolve page record for default locale with empty path prefix', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), defaultTestLocale),
      ).toBe('/de/about-de');
    });

    test('should resolve page record for non-default locale with empty path prefix', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      expect(resolveRecordUrl(buildTestPageRecord('about'), 'en')).toBe(
        '/en/about-en',
      );
    });

    test('should resolve hierarchical page with path prefix and default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest();

      const grandparentRecord = buildTestPageRecord('grandparent');
      const parentRecord = buildTestPageRecord('parent', {
        type: 'ArticleRecord',
        overrides: { parent: grandparentRecord },
      });
      const childRecord = buildTestPageRecord('child', {
        type: 'ArticleRecord',
        overrides: { parent: parentRecord },
      });

      // Note: getParentSlugs builds the path in reverse order (parent first, then grandparent)
      expect(resolveRecordUrl(childRecord, defaultTestLocale)).toBe(
        '/themen/grandparent-de/parent-de/child-de',
      );
    });
  });
});

describe('pageRecordForUrl', () => {
  function pageRecordForUrlTest(configOverrides?: {
    config?: DeepPartial<DastroConfig<DastroTypes>>;
  }) {
    const { routing, astroContext } = dastroTest(configOverrides);

    const { pageRecordForUrl } = routing();
    return {
      pageRecordForUrl,
      astroContext,
    };
  }

  describe('Basic URL parsing', () => {
    test('should parse root URL for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toEqual('');
      expect(result.slug).toEqual('');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse root URL for non-default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/en');

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBeUndefined();
      expect(result.slug).toBeUndefined();
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse simple page URL for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/about-de');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('about-de');
      expect(result.slug).toBe('about-de');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse simple page URL for non-default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/en/about-en');

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('about-en');
      expect(result.slug).toBe('about-en');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });
  });

  describe('URLs with path prefixes', () => {
    test('should parse URL with path prefix for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: {
          pageDefinitions: {
            PageRecord: {
              type: 'PageRecord',
              apiKey: 'page',
              allRecordsQuery: undefined as any,
              paths: {
                de: 'seiten',
                en: 'pages',
              },
              component: 'DefaultPage' as any,
              async load() {
                return null;
              },
            },
          },
        },
      });

      const result = await pageRecordForUrl(astroContext, '/seiten/about-de');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('seiten');
      expect(result.fullSlug).toBe('about-de');
      expect(result.slug).toBe('about-de');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse URL with path prefix for non-default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: {
          pageDefinitions: {
            PageRecord: {
              type: 'PageRecord',
              apiKey: 'page',
              allRecordsQuery: undefined as any,
              paths: {
                de: 'seiten',
                en: 'pages',
              },
              component: 'DefaultPage' as any,
              async load() {
                return null;
              },
            },
          },
        },
      });

      const result = await pageRecordForUrl(astroContext, '/en/pages/about-en');

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('pages');
      expect(result.fullSlug).toBe('about-en');
      expect(result.slug).toBe('about-en');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should handle URL where path prefix matches slug (special case)', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: {
          pageDefinitions: {
            PageRecord: {
              type: 'PageRecord',
              apiKey: 'page',
              allRecordsQuery: undefined as any,
              paths: {
                de: 'seiten',
                en: 'pages',
              },
              component: 'DefaultPage' as any,
              async load() {
                return null;
              },
            },
          },
        },
      });

      const result = await pageRecordForUrl(astroContext, '/seiten');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('seiten');
      expect(result.slug).toBe('seiten');
      expect(result.pageDefinition).toBeNull();
    });
  });

  describe('Hierarchical URLs', () => {
    test('should parse hierarchical URL for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(
        astroContext,
        '/parent-de/child-de',
      );

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('parent-de/child-de');
      expect(result.slug).toBe('child-de');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse hierarchical URL for non-default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(
        astroContext,
        '/en/parent-en/child-en',
      );

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('parent-en/child-en');
      expect(result.slug).toBe('child-en');
      expect(result.pageDefinition?.type).toBe('PageRecord');
    });

    test('should parse complex hierarchical URL with path prefix', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(
        astroContext,
        '/en/topics/grandparent-en/parent-en/child-en',
      );

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('topics');
      expect(result.fullSlug).toBe('grandparent-en/parent-en/child-en');
      expect(result.slug).toBe('child-en');
      expect(result.pageDefinition?.type).toBe('ArticleRecord');
    });
  });

  describe('Edge cases', () => {
    test('should handle URL with trailing slash', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/about-de/');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('about-de');
      expect(result.slug).toBe('about-de');
    });

    test('should handle empty URL', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBeUndefined();
      expect(result.slug).toBeUndefined();
    });

    test('should handle URL with only locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/en');

      expect(result.locale).toBe('en');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBeUndefined();
      expect(result.slug).toBeUndefined();
    });

    test('should handle URL with unknown locale (falls back to default)', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(astroContext, '/fr/about-fr');

      expect(result.locale).toBe(defaultTestLocale);
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('fr/about-fr');
      expect(result.slug).toBe('about-fr');
    });
  });

  describe('With prefix-always routing strategy', () => {
    test('should parse root URL for default locale with prefix', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      const result = await pageRecordForUrl(astroContext, '/de');

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBeUndefined();
      expect(result.slug).toBeUndefined();
    });

    test('should parse page URL for default locale with prefix', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      const result = await pageRecordForUrl(astroContext, '/de/about-de');

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('about-de');
      expect(result.slug).toBe('about-de');
    });

    test('should parse hierarchical URL with path prefix for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest();

      const result = await pageRecordForUrl(
        astroContext,
        '/themen/grandparent-de/parent-de/child-de',
      );

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('themen');
      expect(result.fullSlug).toBe('grandparent-de/parent-de/child-de');
      expect(result.slug).toBe('child-de');
      expect(result.pageDefinition?.type).toBe('ArticleRecord');
    });
  });

  describe('Given routing strategy is prefix-always', () => {
    test('should parse root URL for default locale with prefix', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      const result = await pageRecordForUrl(astroContext, '/de');

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBeUndefined();
      expect(result.slug).toBeUndefined();
    });

    test('should parse page URL for default locale with prefix', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      const result = await pageRecordForUrl(astroContext, '/de/about-de');

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('');
      expect(result.fullSlug).toBe('about-de');
      expect(result.slug).toBe('about-de');
    });

    test('should parse hierarchical URL with path prefix for default locale', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      const result = await pageRecordForUrl(
        astroContext,
        '/de/themen/grandparent-de/parent-de/child-de',
      );

      expect(result.locale).toBe('de');
      expect(result.pathPrefix).toBe('themen');
      expect(result.fullSlug).toBe('grandparent-de/parent-de/child-de');
      expect(result.slug).toBe('child-de');
      expect(result.pageDefinition?.type).toBe('ArticleRecord');
    });

    test('should not find locale when path prefix is not found', async () => {
      const { pageRecordForUrl, astroContext } = pageRecordForUrlTest({
        config: { i18n: { routingStrategy: 'prefix-always' } },
      });

      expect(
        (await pageRecordForUrl(astroContext, '/')).locale,
      ).toBeUndefined();
      expect(
        (
          await pageRecordForUrl(
            astroContext,
            '/themen/grandparent-de/parent-de/child-de',
          )
        ).locale,
      ).toBeUndefined();
    });
  });
});
