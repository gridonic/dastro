import type { DastroConfig, DastroTypes } from './lib-types.ts';

/** The language tag of a site locale: `de_CH` → `de-CH`. */
export function langTagOf(locale: string): string {
  return locale.replace(/_/g, '-');
}

/** The language of a site locale or language tag: `de_CH`, `de-CH` → `de`. */
export function languageOf(localeOrTag: string): string {
  return localeOrTag.split(/[-_]/)[0];
}

export function i18n<T extends DastroTypes>(config: DastroConfig<T>) {
  const { defaultLocale, locales, messages } = config.i18n;
  const localePrefixMode = config.i18n.localePrefix ?? 'language';

  /**
   * The URL path segment of a locale, without slashes.
   * `'language'` mode: `de_CH` → `de`. `'locale'` mode: `de_CH` → `de-ch`.
   */
  function localePrefix(locale: T['SiteLocale']): string | null {
    if (!locale) {
      return null;
    }

    return localePrefixMode === 'locale'
      ? langTagOf(locale).toLowerCase()
      : languageOf(locale);
  }

  /**
   * The value of a locale for `<html lang>` and hreflang.
   * `'language'` mode: `de_CH` → `de`. `'locale'` mode: `de_CH` → `de-CH` (BCP 47 language tag).
   */
  function localeLangTag(locale: T['SiteLocale']): string | null {
    if (!locale) {
      return null;
    }

    return localePrefixMode === 'locale'
      ? langTagOf(locale)
      : languageOf(locale);
  }

  /**
   * The locale a URL prefix stands for (inverse of `localePrefix`).
   * `'language'` mode: first locale starting with the prefix. `'locale'` mode: exact, case-sensitive match.
   */
  function localeFromPrefix(prefix: string): T['SiteLocale'] | undefined {
    return localePrefixMode === 'locale'
      ? locales.find((l) => localePrefix(l) === prefix)
      : findLocaleWithVariant(prefix);
  }

  // Deprecated for consumers (see the returned object); kept for locale comparison
  function normalizedIsoLocale(
    locale: T['SiteLocale'],
    keepVariant = false,
  ): string | null {
    if (!locale) {
      return null;
    }

    return keepVariant ? locale.replace(/_/g, '-') : locale.split('_')[0];
  }

  function normalizedSiteLocale(
    locale: string | T['SiteLocale'],
  ): T['SiteLocale'] | null {
    return (locale?.replace(/-/g, '_') as T['SiteLocale']) ?? null;
  }

  function areLocalesEqual(a: T['SiteLocale'], b: T['SiteLocale']): boolean {
    return (
      normalizedIsoLocale(a, true)?.localeCompare(
        normalizedIsoLocale(b, true) ?? '',
      ) === 0
    );
  }

  function findLocaleWithVariant(locale: string): string | undefined {
    const exactMatch = locales.find((l) => l === locale);
    if (exactMatch) {
      return exactMatch;
    }

    return locales.find((l) => l.startsWith(locale));
  }

  function isDefaultLocale(locale: T['SiteLocale']): boolean {
    return areLocalesEqual(locale, defaultLocale);
  }

  return {
    localePrefix,
    localeLangTag,
    localeFromPrefix,
    localePrefixMode,
    /**
     * @deprecated Use `localePrefix(locale)` for URL prefixes and `localeLangTag(locale)` for
     * `<html lang>` / hreflang values. Unlike those, this helper ignores `i18n.localePrefix`.
     */
    normalizedIsoLocale,
    normalizedSiteLocale,
    areLocalesEqual,
    isDefaultLocale,
    findLocaleWithVariant,
    defaultLocale,
    locales,
    messages,
    routingStrategy: config.i18n.routingStrategy,
  };
}
