import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type {DastroConfig, DastroTypes} from "./lib-types.ts";
import type {AstroContext} from "./astro.context.ts";
import { datocms } from './datocms/datocms.ts';

export type PageRecordType<T extends DastroTypes> = T['RecordLinkFragment']['__typename'];

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

export interface PageDefinition<
  T extends DastroTypes, TPage extends Page<T> | undefined | null = T['AllPageTypes']
> {
  type: PageRecordType<T>;
  apiKey: string;
  allRecordsQuery: AllRecordsQueryType<T>;
  paths: {
    [key in T['SiteLocale']]: string;
  };
  component: (props: { page: any; locale: T['SiteLocale'] }) => any;
  load: (
    slug: string | undefined,
    astro: AstroContext<'locals' | 'cookies'>,
  ) => Promise<TPage | null>;
}

export interface Page<T extends DastroTypes> {
  __typename: PageRecordType<T>;
  id: string;
  title: string;
  _seoMetaTags: SeoMetaTag[];
  _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
}

export interface SeoMetaTag {
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
