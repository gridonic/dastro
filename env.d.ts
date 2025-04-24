import type {buildDastroContext, ExportTypesRouting} from "./src";

declare global {
  namespace App {
    interface Locals {
      dastro: Except<ReturnType<typeof buildDastroContext>, 'routing'> & { routing: () => ExportTypesRouting<Types> };
    }
  }
}
