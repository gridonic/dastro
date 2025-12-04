import type { buildDastroContext, DastroTypes } from './src';
import type { Context } from '@netlify/functions';

declare global {
  namespace App {
    interface Locals {
      globalStore: any;
      page: Page;
      locale: DastroTypes['SiteLocale'];
      dastro: ReturnType<typeof buildDastroContext<DastroTypes>>;
      netlify: { context: Context | null | undefined } | null | undefined;
    }
  }
}
