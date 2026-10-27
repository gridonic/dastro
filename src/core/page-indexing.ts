import type {DastroConfig, DastroTypes} from "./lib-types.ts";
import type {LocalizedSeo, MetaTag} from "./page.ts";

export function isSearchIndexingPrevented<T extends DastroTypes>(config: DastroConfig<T>) {
  // Only ever allow indexing in the production environment!
  if (config.environment !== 'production') {
    return true;
  }

  // Indexing can be turned off in production, e.g., when not live yet
  return config.dev.preventSearchIndexing;
}

/**
 * Whether a page's `_seoMetaTags` carry a robots `noindex` directive (comma-separated,
 * case-insensitive: `noindex, nofollow` counts). They are the tags of the locale the page was queried in.
 */
export function hasNoindexDirective(seoMetaTags: MetaTag[]): boolean {
  return seoMetaTags.some(
    (mt) =>
      mt.attributes?.name === 'robots' &&
      (mt.attributes?.content ?? '')
        .split(',')
        .some((directive) => directive.trim().toLowerCase() === 'noindex'),
  );
}

/**
 * Whether a record is set to "no index" in a locale.
 *
 * With a localized SEO field the record must carry `_allSeoLocales { locale value { noIndex } }`:
 * a plain `seo { noIndex }` only holds the value of the locale the query ran in. Without
 * `_allSeoLocales` (SEO field not localized, or not queried) `seo.noIndex` counts for every locale.
 */
export function isRecordExcludedFromIndexing<T extends DastroTypes>(
  record: {
    seo?: { noIndex?: boolean | null } | null;
    _allSeoLocales?: LocalizedSeo<T>[] | null;
  },
  locale: T['SiteLocale'],
): boolean {
  if (record._allSeoLocales) {
    return !!record._allSeoLocales.find((seo) => seo.locale === locale)?.value
      ?.noIndex;
  }

  return !!record.seo?.noIndex;
}
