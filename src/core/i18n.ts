import type { DastroConfig, DastroTypes } from './lib-types.ts';

export function i18n<T extends DastroTypes>(config: DastroConfig<T>) {
  const { defaultLocale, locales, messages } = config.i18n;

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

  function isDefaultLocale(locale: T['SiteLocale']): boolean {
    return areLocalesEqual(locale, defaultLocale);
  }

  return {
    normalizedIsoLocale,
    normalizedSiteLocale,
    areLocalesEqual,
    isDefaultLocale,
    defaultLocale,
    locales,
    messages,
    routingStrategy: config.i18n.routingStrategy,
  };
}
