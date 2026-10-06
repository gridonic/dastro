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
    /**
     * What the locale prefix in URLs is derived from.
     * - `'language'` (default): the language only (`de_CH` → `/de`). Two locales of one language collide.
     * - `'locale'`: the full locale, lower-cased (`de_CH` → `/de-ch`, `en` → `/en`). Prefixes match exactly,
     *   and `<html lang>` / hreflang values become language tags (`de-CH`).
     */
    localePrefix?: 'language' | 'locale';
  };
  datocms: {
    token: string;
    environment: string;
    allowEnvironmentSwitch: boolean;
    baseEditingUrl: string;
    /** Enables draft mode without a cookie (e.g. pre-launch stage). Ignored in production. */
    draftModeEnabledByDefault?: boolean;
  };
  api: {
    secretApiToken: string;
    signedCookieJwtSecret: string;
  };
  dev: {
    debugViewEnabled: boolean;
    preventSearchIndexing: boolean;
    cachingEnabled: boolean;
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
