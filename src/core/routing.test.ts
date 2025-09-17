import { expect, describe, test } from 'vitest';
import {
  dastroTest,
  defaultTestLocale,
} from '../../test/_testing-core/dastro-test.ts';
import {
  buildTestPageRecord,
  buildHomeRecord,
} from '../../test/_testing-core/routing-test-utils.ts';

describe('resolveRecordUrl', () => {
  function resolveRecordUrlTest(configOverrides?: { config?: any }) {
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
      const { resolveRecordUrl } = resolveRecordUrlTest({
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

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), defaultTestLocale),
      ).toBe('/seiten/about-de');
    });

    test('should resolve page with path prefix for non-default locale', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest({
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

      expect(resolveRecordUrl(buildTestPageRecord('about'), 'en')).toBe(
        '/en/pages/about-en',
      );
    });

    test('should resolve page with empty path prefix', () => {
      const { resolveRecordUrl } = resolveRecordUrlTest({
        config: {
          pageDefinitions: {
            PageRecord: {
              type: 'PageRecord',
              apiKey: 'page',
              allRecordsQuery: undefined as any,
              paths: {
                de: '',
                en: '',
              },
              component: 'DefaultPage' as any,
              async load() {
                return null;
              },
            },
          },
        },
      });

      expect(
        resolveRecordUrl(buildTestPageRecord('about'), defaultTestLocale),
      ).toBe('/about-de');
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
      const { resolveRecordUrl } = resolveRecordUrlTest({
        config: {
          pageDefinitions: {
            PageRecord: {
              type: 'PageRecord',
              apiKey: 'page',
              allRecordsQuery: undefined as any,
              paths: {
                de: 'pages',
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

      const grandparentRecord = buildTestPageRecord('grandparent');
      const parentRecord = buildTestPageRecord('parent', {
        overrides: { parent: grandparentRecord },
      });
      const childRecord = buildTestPageRecord('child', {
        overrides: { parent: parentRecord },
      });

      // Note: getParentSlugs builds the path in reverse order (parent first, then grandparent)
      expect(resolveRecordUrl(childRecord, 'en')).toBe(
        '/en/pages/grandparent-en/parent-en/child-en',
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
});
