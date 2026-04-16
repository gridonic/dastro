export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type QueryParamValue = string | number | boolean;

export type QueryParamsInput = Record<
  string,
  QueryParamValue | Array<QueryParamValue | null | undefined> | null | undefined
>;

export interface WithUrlExtrasOptions {
  query?: QueryParamsInput;
  hash?: string;
}

/**
 * Parse a query string into a {@link QueryParamsInput} object suitable for
 * passing to {@link withUrlExtras}.
 *
 * - Leading `?` is optional and stripped if present.
 * - Repeated keys become array values (e.g. `tag=a&tag=b` → `{ tag: ['a', 'b'] }`).
 * - Values are URL-decoded (spaces, unicode, etc.).
 * - An empty or whitespace-only input returns an empty object.
 */
export function parseQueryParams(
  input: string | null | undefined,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  if (!input) {
    return result;
  }

  const trimmed = input.trim().replace(/^\?/, '');

  if (!trimmed) {
    return result;
  }

  const params = new URLSearchParams(trimmed);

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

/**
 * Append query parameters and/or a hash fragment to a URL (absolute or relative).
 *
 * - Nullish query values are skipped.
 * - Array values produce repeated keys (e.g. `?tag=a&tag=b`).
 * - Booleans and numbers are stringified.
 * - Stega metadata is stripped from keys, values and hash.
 * - Existing query/hash on the input URL is preserved and merged (query keys append).
 */
export function withUrlExtras(
  url: string,
  { query, hash }: WithUrlExtrasOptions = {},
): string {
  const hasQuery = query && Object.keys(query).length > 0;
  const hasHash = typeof hash === 'string' && hash.length > 0;

  if (!hasQuery && !hasHash) {
    return url;
  }

  // Use a dummy origin so relative paths parse; we'll strip it back out.
  const DUMMY_ORIGIN = 'http://_';
  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const parsed = new URL(url, DUMMY_ORIGIN);

  if (hasQuery) {
    for (const [rawKey, rawValue] of Object.entries(query!)) {
      if (rawValue === null || rawValue === undefined) {
        continue;
      }

      const key = rawKey;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];

      for (const v of values) {
        if (v === null || v === undefined) {
          continue;
        }
        parsed.searchParams.append(key, String(v));
      }
    }
  }

  if (hasHash) {
    parsed.hash = hash as string;
  }

  if (isAbsolute) {
    return parsed.toString();
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
