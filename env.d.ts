import type {buildDastroContext, DastroTypes } from "./src";

declare global {
  namespace App {
    interface Locals {
      locale: DastroTypes['SiteLocale'];
      dastro: ReturnType<typeof buildDastroContext<DastroTypes>>;
    }
  }
}
