import { datocms } from "../datocms/datocms.ts";
import {environmentSwitch} from "../datocms/environment-switch.ts";
import {draftMode} from "../datocms/draft-mode.ts";
import {routing} from "./routing.ts";
import {translations} from "./translations.ts";
import type {DastroConfig, DastroTypes} from "./lib-types.ts";
import {caching} from "./caching.ts";
import {i18n} from "./i18n.ts";

export function buildDastroContext<T extends DastroTypes>(dastroConfig: DastroConfig<T>) {
  return {
    config: dastroConfig,
    caching: () => caching(dastroConfig),
    routing: () => routing(dastroConfig),
    draftMode: () => draftMode(dastroConfig),
    environmentSwitch: () => environmentSwitch(dastroConfig),
    datocms: () => datocms(dastroConfig),
    translations: (siteLocale: T['SiteLocale']) => translations(dastroConfig, siteLocale),
    i18n: () => i18n(dastroConfig),
  }
}
