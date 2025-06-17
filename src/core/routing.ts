import type {AstroContext} from "../astro.context.ts";
import type {DastroConfig, DastroTypes } from './lib-types.ts';
import {
  getPageRecordsFor,
  type PageDefinition,
  type PageRecordType,
  type RoutingPageRecord,
  type TranslatedSlugLocale
} from "./page.ts";

export interface Route<T extends DastroTypes> {
  locale: T['SiteLocale'];
  url: string | undefined;
  record: RoutingPageRecord<T>;
}

export interface RecordWithParent<T extends DastroTypes> {
  _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
  parent?: RecordWithParent<T> | null;
}


export function routing<T extends DastroTypes>(config: DastroConfig<T>) {
  function pageDefinitionList(): PageDefinition<T>[] {
    return Object.values(config.pageDefinitions);
  }

  function pageRecordTypes(): PageRecordType<T>[] {
    return pageDefinitionList().map(
      (d) => d.type,
    );
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

    // Special case: Home
    if (record.__typename === 'PageRecord' && slug === 'home') {
      if (locale !== config.i18n.defaultLocale) {
        return `/${locale}`;
      }
      return '/';
    }

    // General Route definition
    const routeDefinition = config.pageDefinitions[record.__typename];
    const localeUrlPart =
      !locale || locale === config.i18n.defaultLocale ? undefined : locale;

    return `/${[
      localeUrlPart, // Locale
      routeDefinition.paths[locale], // Base Url for page type
      ...getParentSlugs(record, locale), // Hierarchical Routes
      slug, // Actual Slug
    ]
      .filter((p) => !!p)
      .join('/')}`;
  }

  async function pageRecordForUrl(context: AstroContext<'locals' | 'cookies'>, url: string) {
    const { locales, defaultLocale } = config.i18n;

    const regexLocaleUnion = locales
      .filter((l) => l !== defaultLocale)
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

    const locale = (match[1] || defaultLocale) as T['SiteLocale'];
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
      pageDefinitionList().find((def) => pathPrefix === def.paths[locale]) ?? null;

    return {
      page: pageDefinition ? await pageDefinition.load(slug, locale, context) : null,
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
          .map(({locale}) => {
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

  function getParentSlugs(rec: RecordWithParent<T>, locale: T['SiteLocale']): string[] {
    if (!rec.parent) {
      return [];
    }

    const parentSlug = slugFromRecord(rec.parent, locale);

    return parentSlug ? [parentSlug, ...getParentSlugs(rec.parent, locale)] : [];
  }

  function slugFromRecord(rec: RecordWithParent<T>, locale: T['SiteLocale']) {
    return rec._allTranslatedSlugLocales?.find((tl) => tl.locale === locale)
      ?.value;
  }

  return {
    resolveRecordUrl,
    pageRecordForUrl,
    getAllRoutes,
    pageDefinitionList,
    pageRecordTypes,
  }
}
