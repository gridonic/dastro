import { datocms } from "../datocms/datocms.ts";
import {environmentSwitch} from "../datocms/environment-switch.ts";
import {draftMode} from "../datocms/draft-mode.ts";
import {routing} from "./routing.ts";
import {translations} from "./translations.ts";
import type {DastroConfig, DastroTypes} from "./lib-types.ts";

export function buildDastroContext<T extends DastroTypes>(dastroConfig: DastroConfig<T>) {
  return {
    config: dastroConfig,
    routing: () => routing(dastroConfig),
    draftMode: () => draftMode(dastroConfig),
    environmentSwitch: () => environmentSwitch(dastroConfig),
    datocms: () => datocms(dastroConfig),
    translations: (siteLocale: T['SiteLocale']) => translations(dastroConfig, siteLocale),
  }
}
