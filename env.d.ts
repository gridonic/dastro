import type {buildDastroContext, ExportTypesRouting} from "./src";

declare global {
  namespace App {
    interface Locals {
      dastro: Omit<ReturnType<typeof buildDastroContext<DastroTypes>>, 'routing'> & { routing: () => ExportTypesRouting<DastroTypes> };
    }
  }
}
