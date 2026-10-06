import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import type { AstroContext } from '../astro.context.ts';
import { datocms } from '../datocms/datocms.ts';
import type { AstroGlobal } from 'astro';
import { routing } from './routing.ts';
import { caching, type CachingOptions } from './caching.ts';
import { i18n } from './i18n.ts';
import { resolveRootLocale } from './root-resolution.ts';

export type PageRecordType<T extends DastroTypes> =
  T['RecordLinkFragment']['__typename'];

export type RoutingPageRecord<T extends DastroTypes> = {
  __typename: PageRecordType<T>;
  _updatedAt: string;
  id: string;
  title: string;
  _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
  parent?: {
    _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
  } | null;
  seo?: {
    noIndex?: boolean | null;
  } | null;
  /** Needed when the SEO field is localized: "no index" per locale */
  _allSeoLocales?: LocalizedSeo<T>[] | null;
};

export type AllRecordsQueryType<T extends DastroTypes> = TypedDocumentNode<
  {
    meta: { count: number };
    records: RoutingPageRecord<T>[];
  },
  any
>;

export interface PageDefinition<T extends DastroTypes> {
  type: PageRecordType<T>;
  apiKey: string;
  allRecordsQuery: AllRecordsQueryType<T>;
  paths: {
    [key in T['SiteLocale']]: string;
  };
  component: (props: { page: any; locale: T['SiteLocale'] }) => any;
  load: (
    slug: string | undefined,
    locale: T['SiteLocale'],
    astro: AstroContext<'locals' | 'cookies'>,
  ) => Promise<Page<T> | null>;
}

export interface Page<T extends DastroTypes> {
  __typename: PageRecordType<T>;
  id: string;
  title: string;
  _seoMetaTags: MetaTag[];
  _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
  /** Needed when the SEO field is localized: keeps "no index" locales out of the hreflang cluster */
  _allSeoLocales?: LocalizedSeo<T>[] | null;
  // Note: Extend module data, allows to add module in cms before implementing them in code
  headerModule?: Partial<T['ModuleData'] | { __typename: string & {} }> | null;
  contentModules?: Partial<T['ModuleData'] | { __typename: string & {} }>[];
  structuredDataMainEntity?: any;
}

export interface MetaTag {
  attributes?: Record<string, string> | null;
  content?: string | null;
  tag: string;
}

export interface TranslatedSlugLocale<T extends DastroTypes> {
  locale?: T['SiteLocale'] | null;
  value: string;
}

export interface LocalizedSeo<T extends DastroTypes> {
  locale?: T['SiteLocale'] | null;
  value?: { noIndex?: boolean | null } | null;
}

export type InitGlobalDataStore<T extends DastroTypes, R = any> = (
  locale: T['SiteLocale'],
  context: AstroContext<'locals' | 'cookies' | 'redirect' | 'request'>,
) => Promise<R>;

export async function getPageRecordsFor<T extends DastroTypes>(
  config: DastroConfig<T>,
  query: AllRecordsQueryType<T>,
  context: AstroContext<'locals' | 'cookies'>,
): Promise<RoutingPageRecord<T>[]> {
  const PAGE_SIZE = 100;

  const { datoFetch } = datocms(config);

  // const operationName =
  //   query.definitions.find((d) => d.kind === 'OperationDefinition')?.name
  //     ?.value ?? '?';

  const pageRecords: RoutingPageRecord<T>[] = [];

  let result = await datoFetch(context, query, {
    first: PAGE_SIZE,
    offset: 0,
  });

  let loadedCount = 0;
  // let page = 0;
  do {
    // page++;
    pageRecords.push(...result.records);

    loadedCount += result.records.length;

    result = await datoFetch(context, query, {
      first: PAGE_SIZE,
      offset: loadedCount,
    });

    // console.debug(
    //   `${operationName} -> loaded: ${loadedCount}, total: ${result.meta.count} (page ${page} / ${Math.floor(result.meta.count / PAGE_SIZE + 1)})`,
    // );
  } while (loadedCount < result.meta.count);

  return pageRecords;
}

export async function renderPage<T extends DastroTypes>(
  context: AstroGlobal,
  dastroConfig: DastroConfig<T>,
  initGlobalDataStore: InitGlobalDataStore<T>,
  options: {
    caching?: CachingOptions;
  } = {},
) {
  const { routingStrategy, locales, defaultLocale, localePrefix } =
    i18n(dastroConfig);
  const { languageFallbacks, localeCookie } = dastroConfig.i18n;
  const { resolveRecordUrl, pageRecordForUrl, lowerCaseLocalePrefixPath } =
    routing(dastroConfig);
  const { setCachingHeaders, preventCaching } = caching(dastroConfig);

  setCachingHeaders(context, options.caching);

  const url = context.url.pathname;

  // Locale prefixes are lower-case: one URL per page
  const lowerCasePrefixPath = lowerCaseLocalePrefixPath(url);
  if (lowerCasePrefixPath) {
    return context.redirect(`${lowerCasePrefixPath}${context.url.search}`, 301);
  }

  const { page, pageDefinition, locale, slug } = await pageRecordForUrl(
    context,
    url,
  );

  // TODO: comment in for debugging routing
  // console.debug('resolved url infos: ', {
  //   pageId: page?.id ?? '-',
  //   pageType: pageDefinition?.type,
  //   locale,
  //   slug,
  //   fullSlug,
  //   pathPrefix,
  // });

  if (routingStrategy === 'prefix-always' && !locale) {
    // if on the root page, redirect to the user's preferred locale
    if (url === '/') {
      const rootLocalePrefix = localePrefix(
        resolveRootLocale({
          locales,
          defaultLocale,
          languageFallbacks,
          cookieLocale: localeCookie
            ? context.cookies.get(localeCookie)?.value
            : undefined,
          acceptLanguage: context.request.headers.get('Accept-Language'),
        }),
      );

      // The target depends on the visitor (cookie, Accept-Language): never cache it, neither in the browser nor in the CDN
      const response = context.redirect(
        `/${rootLocalePrefix}${url}${context.url.search}`,
      );
      for (const headers of [context.response.headers, response.headers]) {
        preventCaching(headers);
      }

      return response;
    }

    // All non-root pages need a locale
    return context.rewrite('/404');
  }

  // Make the page, locale and data store available for all components
  context.locals.locale = locale;
  context.locals.globalStore = await initGlobalDataStore(locale, context);
  context.locals.page = page;

  if (!pageDefinition || !page) {
    // console.warn(
    //   `page (${pageDefinition?.type}, ${locale}, ${slug}): loaded page is empty`,
    // );
    return context.rewrite('/404');
  }

  // Resolve url of the loaded page and check against url -> must match (e.g., for hierarchical pages)
  const actualUrl = url.replace(/\/$/, '');
  const expectedUrl = (resolveRecordUrl(page, locale) ?? '/').replace(
    /\/$/,
    '',
  );
  if (expectedUrl !== actualUrl) {
    console.warn(
      `page (${pageDefinition?.type}, ${locale}, ${slug}): page for slug found, but does not match full url`,
      {
        actualUrl,
        expectedUrl,
      },
    );
    return context.rewrite('/404');
  }

  return {
    Component: pageDefinition.component,
    page,
    locale,
  };
}

export async function renderErrorPage<T extends DastroTypes, R>(
  getRecordLink: (
    globalStore: Awaited<ReturnType<InitGlobalDataStore<T, R>>>,
  ) =>
    | {
        __typename: PageRecordType<T>;
        _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
      }
    | null
    | undefined,
  context: AstroGlobal,
  dastroConfig: DastroConfig<T>,
  initGlobalDataStore: InitGlobalDataStore<T, R>,
  options: { cacheKey?: string; ttl?: number } = {},
) {
  const { i18n } = dastroConfig;
  const { slugFromRecord } = context.locals.dastro.routing();
  const { withCache } = caching(dastroConfig);

  // Note: Locale and globalStore should already be set, as usually we rewrite to error pages.
  //  -> if not, use defaultLocale and initialize globalStore
  const locale = context.locals.locale ?? i18n.defaultLocale;
  const globalStore =
    context.locals.globalStore ?? (await initGlobalDataStore(locale, context));

  const recordLink = getRecordLink(globalStore);

  if (!recordLink) {
    throw new Error('No record link defined for error page');
  }

  const pageDefinition = dastroConfig.pageDefinitions[recordLink.__typename];

  const loadPage = () =>
    pageDefinition.load(slugFromRecord(recordLink, locale), locale, context);

  const page = options.cacheKey
    ? await withCache(
        `${options.cacheKey}:${locale}`,
        context,
        loadPage,
        options.ttl,
      )
    : await loadPage();

  context.locals.locale = locale;
  context.locals.globalStore = globalStore;
  context.locals.page = page;

  return {
    Component: pageDefinition.component,
    page,
    locale,
  };
}

export function page<T extends DastroTypes>(_config: DastroConfig<T>) {
  function modulesOfType<K extends T['ModuleKey']>(
    modules: Partial<T['ModuleData']>[],
    type: K,
  ): Extract<T['ModuleData'], { __typename?: K }>[] {
    return modules.filter(
      (m): m is Extract<T['ModuleData'], { __typename?: K }> =>
        m.__typename === type,
    );
  }

  function usePageRecord(page: Page<T>) {
    function modules(): T['ModuleData'][] {
      return [
        ...(page.headerModule ? [page.headerModule] : []),
        ...(page.contentModules ?? []),
      ];
    }

    return {
      modules,
      modulesOfType<K extends T['ModuleKey']>(type: K) {
        return modulesOfType(modules(), type);
      },
    };
  }

  return {
    usePageRecord,
    modulesOfType,
  };
}
