import type { AstroContext } from '../astro.context.ts';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import { i18n } from './i18n.ts';
import {
  getPageRecordsFor,
  type PageDefinition,
  type PageRecordType,
  type RoutingPageRecord,
  type TranslatedSlugLocale,
} from './page.ts';
import { slugify } from '../util/route.util.ts';
import { isRecordExcludedFromIndexing } from './page-indexing.ts';

export interface Route<T extends DastroTypes> {
  locale: T['SiteLocale'];
  url: string | undefined;
  record: RoutingPageRecord<T>;
}

export interface HreflangAlternate {
  /** A language tag (see `localeLangTag`) or `x-default` */
  hreflang: string;
  /** Path without the base URL */
  href: string;
}

export interface RecordWithParent<T extends DastroTypes> {
  _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
  parent?: RecordWithParent<T> | null;
}

export function routing<T extends DastroTypes>(config: DastroConfig<T>) {
  const {
    isDefaultLocale,
    areLocalesEqual,
    localePrefix,
    localeLangTag,
    localeFromPrefix,
    localePrefixMode,
    routingStrategy,
  } = i18n(config);

  function pageDefinitionList(): PageDefinition<T>[] {
    return Object.values(config.pageDefinitions);
  }

  function pageRecordTypes(): PageRecordType<T>[] {
    return pageDefinitionList().map((d) => d.type);
  }

  function resolveRecordUrl(
    record: {
      __typename: T['RecordLinkFragment']['__typename'];
      _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
      parent?: RecordWithParent<T> | null;
    },
    locale: T['SiteLocale'],
  ): string | null {
    const slug = slugFromRecord(record, locale);

    if (!slug) {
      return null;
    }

    const normalizedLocale = localePrefix(locale);

    // Special case: Home
    if (record.__typename === 'PageRecord' && slug === 'home') {
      if (routingStrategy === 'prefix-always') {
        return `/${normalizedLocale}`;
      }

      if (!isDefaultLocale(locale)) {
        return `/${normalizedLocale}`;
      }
      return '/';
    }

    // General Route definition
    const routeDefinition = config.pageDefinitions[record.__typename];
    const localeUrlPart =
      routingStrategy === 'prefix-always'
        ? normalizedLocale
        : !locale || isDefaultLocale(locale)
          ? undefined
          : normalizedLocale;

    return `/${[
      localeUrlPart, // Locale
      routeDefinition.paths[locale], // Base Url for page type
      ...getParentSlugs(record, locale), // Hierarchical Routes
      slug, // Actual Slug
    ]
      .filter((p) => !!p)
      .join('/')}`;
  }

  /**
   * The hreflang alternates of a page, for the page head and the sitemap alike: one entry per
   * configured locale the record has a slug in (self included, in configured order), plus
   * `x-default` when `i18n.xDefaultLocale` is one of them. Empty when the record exists in fewer
   * than two locales. `href` is a path, like the result of `resolveRecordUrl`.
   *
   * A locale the record is set to "no index" in is not an alternate (see
   * `isRecordExcludedFromIndexing`). A page that is itself excluded from indexing must not emit
   * alternates at all; that is the caller's decision.
   */
  function hreflangCluster(
    record: Parameters<typeof resolveRecordUrl>[0] &
      Parameters<typeof isRecordExcludedFromIndexing<T>>[0],
  ): HreflangAlternate[] {
    const cluster = config.i18n.locales.flatMap((locale) => {
      if (isRecordExcludedFromIndexing(record, locale)) {
        return [];
      }

      const href = resolveRecordUrl(record, locale);
      const hreflang = localeLangTag(locale);

      return href && hreflang ? [{ locale, hreflang, href }] : [];
    });

    if (cluster.length < 2) {
      return [];
    }

    const { xDefaultLocale } = config.i18n;
    const xDefault = xDefaultLocale
      ? cluster.find((a) => areLocalesEqual(a.locale, xDefaultLocale))
      : undefined;

    return [
      ...cluster.map(({ hreflang, href }) => ({ hreflang, href })),
      ...(xDefault ? [{ hreflang: 'x-default', href: xDefault.href }] : []),
    ];
  }

  /**
   * `'locale'` mode only: the lower-case form of a path whose locale prefix is not written in
   * lower case (`/de-CH/about` → `/de-ch/about`), or `null` when the path needs no redirect.
   */
  function lowerCaseLocalePrefixPath(path: string): string | null {
    if (localePrefixMode !== 'locale') {
      return null;
    }

    const [, prefix, rest = ''] = path.match(/^\/([^/]+)(\/.*)?$/) ?? [];
    const lowerCasePrefix = prefix?.toLowerCase();

    if (!prefix || prefix === lowerCasePrefix) {
      return null;
    }

    const locale = localeFromPrefix(lowerCasePrefix);
    const hasPrefix =
      !!locale &&
      (routingStrategy === 'prefix-always' || !isDefaultLocale(locale));

    return hasPrefix ? `/${lowerCasePrefix}${rest}` : null;
  }

  async function pageRecordForUrl(
    context: AstroContext<'locals' | 'cookies'>,
    url: string,
  ) {
    const { locales, defaultLocale, routingStrategy } = i18n(config);

    const regexLocaleUnion = locales
      .filter((l) => routingStrategy === 'prefix-always' || !isDefaultLocale(l))
      .map((l) => localePrefix(l))
      .join('|');

    const regexPathPrefixUnion = [
      ...new Set(
        pageDefinitionList()
          .flatMap((def) => Object.values(def.paths))
          .filter((p) => !!p),
      ),
    ].join('|');

    const urlRegex = new RegExp(
      `^(?:\\/(${regexLocaleUnion}))?(?:\\/(${regexPathPrefixUnion}))?(?:\\/(.*))?$`,
    );

    const match = url.match(urlRegex) ?? [];

    const locale = resolveLocale(match[1]) as T['SiteLocale'];

    function resolveLocale(prefix: string | undefined) {
      if (localePrefixMode === 'locale') {
        // Exact match only: `/de/...` is not a prefix of `de_CH`
        return prefix
          ? localeFromPrefix(prefix)
          : routingStrategy === 'prefix-always'
            ? undefined
            : defaultLocale;
      }

      return localeFromPrefix(
        routingStrategy === 'prefix-always' ? prefix! : prefix || defaultLocale,
      );
    }

    let pathPrefix = match[2] ?? '';
    let fullSlug = match[3]?.replace(/\/$/, '');
    let slug = fullSlug?.split('/').pop();

    // TODO: refactor this so it can be handled directly via url regex (but we need to add tests for this)
    //  -> handle the case where we want a default page that has the same slug as a path prefix
    if (!fullSlug && !slug && pathPrefix) {
      fullSlug = slug = pathPrefix;
      pathPrefix = '';
    }

    const pageDefinition: PageDefinition<T> | null =
      pageDefinitionList().find((def) => pathPrefix === def.paths[locale]) ??
      null;

    return {
      page: pageDefinition
        ? await pageDefinition.load(slug, locale, context)
        : null,
      pageDefinition,
      locale,
      pathPrefix,
      fullSlug,
      slug,
    };
  }

  async function getAllRoutes(
    context: AstroContext<'locals' | 'cookies'>,
  ): Promise<Route<T>[]> {
    return (
      await Promise.all(
        pageDefinitionList().map(async (def) => localizedRoutesForRecords(def)),
      )
    ).flat();

    async function localizedRoutesForRecords(
      pageDefinition: PageDefinition<T>,
    ): Promise<Route<T>[]> {
      const pageRecords = await getPageRecordsFor(
        config,
        pageDefinition.allRecordsQuery,
        context,
      );

      return pageRecords.flatMap((record) =>
        (record._allTranslatedSlugLocales ?? [])
          .map(({ locale }) => {
            if (!locale) {
              return null;
            }

            const url = resolveRecordUrl(record, locale);
            return url
              ? {
                  url,
                  locale,
                  record,
                }
              : null;
          })
          .filter(<T>(item: T | null): item is T => !!item),
      );
    }
  }

  function getParentSlugs(
    rec: RecordWithParent<T>,
    locale: T['SiteLocale'],
  ): string[] {
    if (!rec.parent) {
      return [];
    }

    const parentSlug = slugFromRecord(rec.parent, locale);

    return parentSlug
      ? [...getParentSlugs(rec.parent, locale), parentSlug]
      : [];
  }

  function slugFromRecord(rec: RecordWithParent<T>, locale: T['SiteLocale']) {
    return rec._allTranslatedSlugLocales?.find(
      (tl) => tl.locale && areLocalesEqual(tl.locale, locale),
    )?.value;
  }

  return {
    resolveRecordUrl,
    hreflangCluster,
    pageRecordForUrl,
    lowerCaseLocalePrefixPath,
    getAllRoutes,
    pageDefinitionList,
    pageRecordTypes,
    slugFromRecord,
    slugify,
  };
}
