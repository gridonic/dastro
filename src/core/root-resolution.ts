import { langTagOf, languageOf } from './i18n.ts';

interface RootResolutionInput<Locale extends string> {
  /** Site locales, in configured order */
  locales: Locale[];
  defaultLocale: Locale;
  /** Language (`de`) → locale for visitors without an exact match */
  languageFallbacks?: Partial<Record<string, Locale>>;
  /** Value of the locale cookie, if one is configured and sent */
  cookieLocale?: string | null;
  /** Raw `Accept-Language` request header */
  acceptLanguage?: string | null;
}

const lowerCaseLanguageOf = (locale: string) =>
  languageOf(locale).toLowerCase();

const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/;

/**
 * The `Accept-Language` tags, lower-cased, most preferred first: sorted by q-value, header order breaks ties.
 * `*`, malformed entries and entries with `q=0` are dropped.
 */
function preferredLanguageTags(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.split(';').map((part) => part.trim());
      const qParam = params.find((param) => /^q\s*=/i.test(param));
      const q = qParam ? Number(qParam.split('=')[1].trim() || NaN) : 1;

      return { tag: tag.toLowerCase(), q };
    })
    .filter(({ tag, q }) => LANGUAGE_TAG.test(tag) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag);
}

/**
 * Root resolution: the locale for a request to the site root. First hit wins:
 *
 * 1. the locale cookie, if its value is a site locale
 * 2. the visitor's most preferred language the site has a locale of decides the language; within it:
 *    1. exact pass: a tag of that language that equals a locale (`fr-FR` → `fr_FR`)
 *    2. fallback pass: `languageFallbacks` of that language
 *    3. the first locale of that language in configured order
 * 3. the default locale
 */
export function resolveRootLocale<Locale extends string>(
  input: RootResolutionInput<Locale>,
): Locale {
  const { locales, defaultLocale, languageFallbacks = {} } = input;

  const cookieLocale = locales.find((locale) => locale === input.cookieLocale);
  if (cookieLocale) {
    return cookieLocale;
  }

  const tags = preferredLanguageTags(input.acceptLanguage ?? '');
  const language = tags
    .map(languageOf)
    .find((l) => locales.some((locale) => lowerCaseLanguageOf(locale) === l));

  if (!language) {
    return defaultLocale;
  }

  const localesOfLanguage = locales.filter(
    (l) => lowerCaseLanguageOf(l) === language,
  );
  const tagsOfLanguage = tags.filter((tag) => languageOf(tag) === language);

  for (const tag of tagsOfLanguage) {
    const exact = localesOfLanguage.find(
      (locale) => langTagOf(locale).toLowerCase() === tag,
    );

    if (exact) {
      return exact;
    }
  }

  const fallback = languageFallbacks[language];

  return (
    localesOfLanguage.find((locale) => locale === fallback) ??
    localesOfLanguage[0]
  );
}
