import type { Page, PageDefinition, PageRecordType } from './page.ts';
import type { RecordWithParent, Route } from './routing.ts';
import type { AstroComponent } from '../components';
import type { TranslationMessages } from './translations.ts';

export type LikeSiteLocale = string;
export type LikeRecordLink = {
  __typename: string;
  title: string;
};

export type DastroTypes<
  TSiteLocale extends LikeSiteLocale = LikeSiteLocale,
  TRecordLinkFragment extends LikeRecordLink = LikeRecordLink,
> = {
  SiteLocale: TSiteLocale;
  RecordLinkFragment: TRecordLinkFragment;
};

export interface DastroConfig<T extends DastroTypes> {
  environment: string;
  appBaseUrl: string;
  i18n: {
    defaultLocale: T['SiteLocale'];
    locales: T['SiteLocale'][];
    messages: Record<T['SiteLocale'], TranslationMessages<T>>;
    routingStrategy: 'prefix-except-default' | 'prefix-always';
  };
  datocms: {
    token: string;
    environment: string;
    allowEnvironmentSwitch: boolean;
    editingUrl: string;
  };
  api: {
    secretApiToken: string;
    signedCookieJwtSecret: string;
  };
  dev: {
    debugViewEnabled: boolean;
    preventSearchIndexing: boolean;
  };
  pageDefinitions: Record<PageRecordType<T>, PageDefinition<T>>;
  moduleComponents: Record<string, AstroComponent>;
}

export type ExportTypes<T extends DastroTypes> = {
  PageDefinition: PageDefinition<T>;
  Page: Page<T>;
  PageRecordType: PageRecordType<T>;
  Route: Route<T>;
  RecordWithParent: RecordWithParent<T>;
  TranslationMessages: TranslationMessages<T>;
};
