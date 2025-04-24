import type {Page, PageDefinition, PageRecordType, TranslatedSlugLocale} from "./page.ts";
import type {RecordWithParent, Route} from "./routing.ts";
import type {AstroContext} from "./astro.context.ts";

export type LikeSiteLocale = string;
export type LikeRecordLink = {
  __typename: string;
};
export type LikeAllPageTypes<T extends DastroTypes = any> =
  | Page<T>
  | undefined
  | null;

export type DastroTypes<
  TSiteLocale extends LikeSiteLocale = LikeSiteLocale,
  TRecordLinkFragment extends LikeRecordLink = LikeRecordLink,
  TAllPageTypes extends LikeAllPageTypes = LikeAllPageTypes
> = {
  SiteLocale: TSiteLocale;
  RecordLinkFragment: TRecordLinkFragment;
  AllPageTypes: TAllPageTypes;
};


export interface DastroConfig<T extends DastroTypes> {
  i18n: {
    defaultLocale: T['SiteLocale'];
  };
  pageDefinitions: Record<PageRecordType<T>, PageDefinition<T>>;
  datocms: {
    token: string;
    environment: string;
    allowEnvironmentSwitch: boolean;
  },
  cookies: {
    signedCookieJwtSecret: string;
  }
}

export interface ExportTypesRouting<T extends DastroTypes> {
  resolveRecordUrl(
    record: {
      __typename: T['RecordLinkFragment']['__typename'];
      _allTranslatedSlugLocales?: TranslatedSlugLocale<T>[] | null;
      parent?: RecordWithParent<T> | null;
    },
    locale: T['SiteLocale'],
  ): string | null;
  getAllRoutes(
    context: AstroContext<'locals' | 'cookies'>,
  ): Promise<Route<T>[]>;
  pageRecordTypes:  T["RecordLinkFragment"]["__typename"][];
  pageDefinitionList: PageDefinition<T>[];
}

export type ExportTypes<T extends DastroTypes> = {
  PageDefinition: PageDefinition<T>;
  Page: Page<T>;
  PageRecordType: PageRecordType<T>;
  Route: Route<T>;
  RecordWithParent: RecordWithParent<T>;
}

export interface Routing {
  // no declarations here, we will augment it in the integrating library
}
