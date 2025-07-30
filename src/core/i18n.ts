import type {DastroConfig, DastroTypes} from "./lib-types.ts";

export function i18n<T extends DastroTypes>(config: DastroConfig<T>) {
  const {defaultLocale, locales, messages} = config.i18n;

  function normalizedIsoLocale(locale: T['SiteLocale']): string | null {
    return locale?.replace(/_/g, '-') ?? null;
  }

  function normalizedSiteLocale(locale: string | T['SiteLocale']): T['SiteLocale'] | null {
    return (locale?.replace(/-/g, '_') as T['SiteLocale']) ?? null;
  }

  function areLocalesEqual(a: T['SiteLocale'], b: T['SiteLocale']): boolean {
    return normalizedIsoLocale(a)?.localeCompare(normalizedIsoLocale(b) ?? '') === 0;
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
  }
}
