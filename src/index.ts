// Import global types to make them available
import './global-types.ts';

import dastroIntegration, {
  dastroAdapterConfig,
} from './integration/dastro.integration.ts';
import graphqlIntegration from './integration/graphql.integration.ts';
import { caching } from './core/caching.ts';
import { routing } from './core/routing.ts';
import { translations } from './core/translations.ts';
import { draftMode } from './datocms/draft-mode.ts';
import { environmentSwitch } from './datocms/environment-switch.ts';
import { datocms } from './datocms/datocms.ts';
import { buildDastroContext } from './core/context.ts';
import { renderPage } from './core/page.ts';
import { i18n } from './core/i18n.ts';
export type { Route } from './core/routing.ts';
export type {
  DastroTypes,
  DastroConfig,
  ExportTypes,
} from './core/lib-types.ts';
export type { AstroContext } from './astro.context.ts';
export type { MetaTag } from './core/page.ts';
export type { TranslationMessages } from './core/translations.ts';

export {
  dastroIntegration,
  graphqlIntegration,
  dastroAdapterConfig,
  caching,
  routing,
  translations,
  i18n,
  draftMode,
  environmentSwitch,
  datocms,
  buildDastroContext,
  renderPage,
};
