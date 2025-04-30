import dastroIntegration from "./integration/dastro.integration.ts";
import datoCmsIntegration from "./integration/datocms.integration.ts";
import { routing } from "./core/routing.ts";
import {draftMode} from "./datocms/draft-mode.ts";
import {environmentSwitch} from "./datocms/environment-switch.ts";
import { datocms } from "./datocms/datocms.ts";
import { buildDastroContext } from "./core/context.ts";
export type { Route } from "./core/routing.ts";
export type {DastroTypes, DastroConfig, ExportTypes} from "./core/lib-types.ts";
export type {AstroContext} from "./astro.context.ts";
export type {SeoMetaTag} from './core/page.ts';

export {
  dastroIntegration,
  datoCmsIntegration,
  routing,
  draftMode,
  environmentSwitch,
  datocms,
  buildDastroContext,
};

