import type { buildDastroContext, DastroTypes } from './src';

declare global {
  namespace App {
    interface Locals {
      globalStore: any;
      page: Page;
      locale: DastroTypes['SiteLocale'];
      dastro: ReturnType<typeof buildDastroContext<DastroTypes>>;
      netlify: Context | null | undefined;
    }
  }
}
