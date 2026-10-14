const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

/**
 * Remembers the visitor's locale choice for root resolution. Call it when the visitor picks a locale
 * (e.g. in a region switch), before navigating.
 *
 * Written client-side because page responses are cached. The cookie is valid for the whole site,
 * `SameSite=Lax`, for one year.
 *
 * @param cookieName The name configured as `i18n.localeCookie`
 * @param locale A site locale as configured (`de_CH`), not a locale prefix or language tag
 * @param options.maxAge Lifetime in seconds, one year by default
 */
export function setLocaleCookie(
  cookieName: string,
  locale: string,
  options: { maxAge?: number } = {},
) {
  const { maxAge = ONE_YEAR_IN_SECONDS } = options;

  document.cookie = [
    `${encodeURIComponent(cookieName)}=${encodeURIComponent(locale)}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ');
}
