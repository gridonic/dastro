import type {Page, PageDefinition, PageRecordType } from "./page.ts";
import type {RecordWithParent, Route} from "./routing.ts";
import type {AstroComponent} from "./components/component.types.ts";

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
  environment: string;
  renderingMode: 'server' | 'static';
  i18n: {
    defaultLocale: T['SiteLocale'];
  };
  datocms: {
    token: string;
    environment: string;
    allowEnvironmentSwitch: boolean;
  },
  api: {
    secretApiToken: string;
    signedCookieJwtSecret: string;
  },
  pageDefinitions: Record<PageRecordType<T>, PageDefinition<T>>;
  moduleComponents: Record<string, AstroComponent>;
}

export type ExportTypes<T extends DastroTypes> = {
  PageDefinition: PageDefinition<T>;
  Page: Page<T>;
  PageRecordType: PageRecordType<T>;
  Route: Route<T>;
  RecordWithParent: RecordWithParent<T>;
}
