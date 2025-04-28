import type {buildDastroContext, DastroTypes, ExportTypesRouting} from "./src";

declare global {
  namespace App {
    interface Locals {
      locale: DastroTypes['SiteLocale'];
      dastro: Omit<ReturnType<typeof buildDastroContext<DastroTypes>>, 'routing'> & { routing: () => ExportTypesRouting<DastroTypes> };
    }
  }
}
