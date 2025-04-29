import type {AstroContext} from "./astro.context.ts";
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
  function pageDefinitionList(): PageDefinition<any>[] {
    return Object.values(config.pageDefinitions);
  }

  function pageRecordTypes(): PageRecordType<any>[] {
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

  async function getAllRoutes(
    context: AstroContext<'locals' | 'cookies'>,
  ): Promise<Route<T>[]> {
    const routes: Route<T>[] = [];
    await Promise.all(
      pageDefinitionList().map(async (def) => {
        routes.push(...(await localizedRoutesForRecords(def)));
      }),
    );

    return routes;

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
    getAllRoutes,
    pageDefinitionList,
    pageRecordTypes
  }
}
