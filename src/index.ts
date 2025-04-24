import datoCmsIntegration from "./integration/datocms.integration.ts";
// import {type DastroConfig, type DastroTypes, type Routing} from './lib-types.ts';

import { routing } from "./routing.ts";
export type { Route } from "./routing.ts";
export type {DastroTypes, DastroConfig, ExportTypes, ExportTypesRouting, Routing} from "./lib-types.ts";
export type {AstroContext} from "./astro.context.ts";
export type {SeoMetaTag} from './page.ts';

export {
  datoCmsIntegration,
  routing,
};

