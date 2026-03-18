import { describe, test, expect } from 'vitest';
import { dastroTest } from '../../test/_testing-core/dastro-test.ts';
import { i18n } from './i18n.ts';
import type { DastroConfig, DastroTypes } from './lib-types.ts';

describe('i18n', () => {
  function i18nTest(
    overrides?: { locales?: string[]; defaultLocale?: string },
  ) {
    const locales = overrides?.locales ?? ['de', 'fr_CH', 'en'];
    const defaultLocale = overrides?.defaultLocale ?? 'de';
    return dastroTest({
      config: {
        i18n: {
          locales: locales as any,
          defaultLocale: defaultLocale as any,
          messages: Object.fromEntries(
            locales.map((l) => [l, { locales: {} }]),
          ) as any,
        },
      },
    }).i18n();
  }

  /** Create i18n directly to avoid deepmerge array concatenation */
  function i18nDirect(locales: string[], defaultLocale: string) {
    return i18n({
      i18n: {
        locales,
        defaultLocale,
        routingStrategy: 'prefix-except-default',
        messages: Object.fromEntries(
          locales.map((l) => [l, { locales: {} }]),
        ),
      },
    } as unknown as DastroConfig<DastroTypes>);
  }

  describe('normalizedIsoLocale', () => {
    test('should replace underscores with hyphens when keepVariant is true', () => {
      const { normalizedIsoLocale } = i18nTest();

      expect(normalizedIsoLocale('fr_CH' as any, true)).toBe('fr-CH');
      expect(normalizedIsoLocale('de_AT' as any, true)).toBe('de-AT');
    });

    test('should return null for falsy locale', () => {
      const { normalizedIsoLocale } = i18nTest();

      expect(normalizedIsoLocale('' as any)).toBeNull();
      expect(normalizedIsoLocale(null as any)).toBeNull();
    });
  });

  describe('areLocalesEqual', () => {
    test('should handle null locale without throwing', () => {
      const { areLocalesEqual } = i18nTest();

      // When one locale is null/empty, localeCompare would throw without optional chaining
      expect(areLocalesEqual(null as any, 'de' as any)).toBe(false);
      expect(areLocalesEqual('de' as any, null as any)).toBe(false);
    });
  });

  describe('findLocaleWithVariant', () => {
    test('should return exact match over startsWith match', () => {
      // With locales ['de_CH', 'de', 'en'], searching for 'de':
      // - exact match returns 'de'
      // - without exact match, startsWith('de') returns 'de_CH' (first in list)
      const { findLocaleWithVariant } = i18nDirect(
        ['de_CH', 'de', 'en'],
        'de',
      );

      expect(findLocaleWithVariant('de')).toBe('de');
    });

    test('should fall back to startsWith when no exact match', () => {
      const { findLocaleWithVariant } = i18nTest();

      expect(findLocaleWithVariant('fr')).toBe('fr_CH');
    });

    test('should return undefined when no match at all', () => {
      const { findLocaleWithVariant } = i18nTest();

      expect(findLocaleWithVariant('it')).toBeUndefined();
    });
  });
});
