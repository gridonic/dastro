import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { DastroConfig, DastroTypes } from './lib-types.ts';
import type { AstroContext } from '../astro.context.ts';
import { datocms } from '../datocms/datocms.ts';
import type { AstroGlobal } from 'astro';
import { routing } from './routing.ts';
import { caching } from './caching.ts';
import { i18n } from './i18n.ts';

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
  initGlobalDataStore: (
    locale: T['SiteLocale'],
    context: AstroContext<'locals' | 'cookies' | 'redirect' | 'request'>,
  ) => Promise<any>,
) {
  const { routingStrategy, locales, defaultLocale, normalizedIsoLocale } =
    i18n(dastroConfig);
  const { resolveRecordUrl, pageRecordForUrl } = routing(dastroConfig);
  const { setCachingHeaders } = caching(dastroConfig);

  setCachingHeaders(context);

  const url = context.url.pathname;
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
      const acceptLanguage =
        context.request.headers.get('Accept-Language') ?? '';

      const preferredLanguage = acceptLanguage
        .split(',')
        .map((lang) => lang.split(';')[0].trim().substring(0, 2).toLowerCase())
        .find((lang) =>
          locales
            .map((l) => normalizedIsoLocale(l))
            ?.includes(lang as DastroTypes['SiteLocale']),
        );

      const redirectLocale = normalizedIsoLocale(
        preferredLanguage ?? defaultLocale,
      );

      if (process.env.NODE_ENV === 'development') {
        console.debug('redirectLocale: ', redirectLocale);
      }

      return context.redirect(`/${redirectLocale}${url}`);
    }

    // All non-root pages need a locale
    return context.rewrite('/404');
  }

  // Make the page, locale and data store available for all components
  context.locals.locale = locale;
  context.locals.globalStore = await initGlobalDataStore(locale, context);
  context.locals.page = page;

  if (!pageDefinition || !page) {
    console.warn(
      `page (${pageDefinition?.type}, ${locale}, ${slug}): loaded page is empty`,
    );
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
