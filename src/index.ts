import dastroIntegration from "./integration/dastro.integration.ts";
import datoCmsIntegration from "./integration/datocms.integration.ts";
import { routing } from "./routing.ts";
import {draftMode} from "./datocms/draft-mode.ts";
import {environmentSwitch} from "./datocms/environment-switch.ts";
import { datocms } from "./datocms/datocms.ts";
import { buildDastroContext } from "./context.ts";
export type { Route } from "./routing.ts";
export type {DastroTypes, DastroConfig, ExportTypes, ExportTypesRouting, Routing} from "./lib-types.ts";
export type {AstroContext} from "./astro.context.ts";
export type {SeoMetaTag} from './page.ts';

export {
  dastroIntegration,
  datoCmsIntegration,
  routing,
  draftMode,
  environmentSwitch,
  datocms,
  buildDastroContext
};

