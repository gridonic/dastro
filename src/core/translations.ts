import type {DastroConfig, DastroTypes} from "./lib-types.ts";
import {i18n} from "./i18n.ts";

export type TranslationMessages<T extends DastroTypes> = Record<string, any> & {
  locales: Record<T['SiteLocale'], string>;
};

// TODO: Types not working anymore this way, we need to somehow give him the opportunity to infer the type of the
//  defined messages in the project. For now just allow any string
type TranslationKeys = string;

// type DotNotationKeys<T extends object, Prefix extends string = ''> = {
//   [K in keyof T]: T[K] extends object
//     ? DotNotationKeys<T[K], `${Prefix}${K & string}.`>
//     : `${Prefix}${K & string}`;
// }[keyof T];

// type TranslationKeys =
//   | DotNotationKeys<(typeof messages)[typeof defaultLocale]>
//   | (string & {});

export function translations<T extends DastroTypes>(config: DastroConfig<T>, siteLocale: T['SiteLocale']) {
  const { defaultLocale, messages, isDefaultLocale } = i18n(config);

  function t(
    key: TranslationKeys,
    replacements: Record<string, string> = {},
    locale: T['SiteLocale'] = siteLocale,
  ) {
    const keyParts = key.split('.');
    let value: any = messages[locale];

    for (const part of keyParts) {
      value = value[part];

      if (value === undefined) {
        if (!isDefaultLocale(locale)) {
          return t(key, replacements, defaultLocale);
        }
        return key;
      }
    }

    if (value && typeof value === 'string') {
      Object.keys(replacements).forEach((key) => {
        value = value.replace(`${key}`, replacements[key]);
      });
    }

    return value;
  }

  return {
    t,
  };
}
