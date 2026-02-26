import type { Page, PageDefinition, PageRecordType } from './page.ts';
import type { RecordWithParent, Route } from './routing.ts';
import type { AstroComponent } from '../components';
import type { TranslationMessages } from './translations.ts';
import type { ComponentProps } from 'astro/types';

export type LikeSiteLocale = string;
export type LikeRecordLink = {
  __typename: string;
  title: string;
};

export type DastroTypes<
  TSiteLocale extends LikeSiteLocale = LikeSiteLocale,
  TRecordLinkFragment extends LikeRecordLink = LikeRecordLink,
  TModuleComponents extends Record<string, AstroComponent> = Record<
    string,
    AstroComponent
  >,
> = {
  SiteLocale: TSiteLocale;
  RecordLinkFragment: TRecordLinkFragment;
  ModuleKey: keyof TModuleComponents;
  ModuleData: {
    [K in keyof TModuleComponents]: 'data' extends keyof ComponentProps<
      TModuleComponents[K]
    >
      ? ComponentProps<TModuleComponents[K]>['data']
      : never;
  }[keyof TModuleComponents];
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
    baseEditingUrl: string;
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
  ModuleKey: T['ModuleKey'];
  ModuleData: T['ModuleData'];
};
