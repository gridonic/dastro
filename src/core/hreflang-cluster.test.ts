import { beforeEach, describe, expect, test, vi } from 'vitest';
import { dastroContainerTest } from '../../test/_testing-core/dastro-test.ts';
import { buildTestPageRecord } from '../../test/_testing-core/routing-test-utils.ts';
import { GET as sitemap } from '../routes/sitemap.xml.ts';

// The consumer project's global stylesheet does not exist in dastro itself
vi.mock('@/sass/styles.scss', () => ({}));

// The CMS is the system boundary: the sitemap reads its records from there
const cmsRecords: Record<string, unknown[]> = {};

vi.mock('../datocms/datocms.ts', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../datocms/datocms.ts')>();

  return {
    ...original,
    datocms: (config: any) => ({
      ...original.datocms(config),
      datoFetch: async (
        _context: unknown,
        query: string,
        { first, offset }: { first: number; offset: number },
      ) => {
        const records = cmsRecords[query] ?? [];
        return {
          meta: { count: records.length },
          records: records.slice(offset, offset + first),
        };
      },
    }),
  };
});

// @ts-ignore
import LayoutBase from '../components/layout/LayoutBase.astro';

const BASE_URL = 'https://testing.dastro.com';
const X_DEFAULT = ['x-default', `${BASE_URL}/en/about-en`];

type Alternate = [hreflang: string, href: string];
type TestRecord = ReturnType<typeof pageRecord>;

beforeEach(() => {
  for (const key of Object.keys(cmsRecords)) {
    delete cmsRecords[key];
  }
});

function pageRecord(
  name: string,
  locales: string[],
  opts: { noIndex?: boolean; robots?: string } = {},
) {
  const record = buildTestPageRecord(name, {
    overrides: {
      _allTranslatedSlugLocales: locales.map((locale) => ({
        locale,
        value: name === 'home' ? 'home' : `${name}-${locale}`,
      })),
      seo: { noIndex: !!opts.noIndex },
    },
  });

  return {
    ...record,
    _updatedAt: '2026-01-01T00:00:00Z',
    _seoMetaTags: [
      ...record._seoMetaTags,
      // What DatoCMS adds to `_seoMetaTags` for a record whose SEO field says "no index"
      ...(opts.noIndex
        ? [
            {
              tag: 'meta',
              attributes: { name: 'robots', content: opts.robots ?? 'noindex' },
            },
          ]
        : []),
    ],
  };
}

/** A site with two locales of one language, as a region-aware project configures it. */
async function regionAwareSite(i18n: Record<string, unknown> = {}) {
  return site({
    locales: ['de_CH', 'fr_CH', 'en', 'de_DE'],
    defaultLocale: 'en',
    routingStrategy: 'prefix-always',
    localePrefix: 'locale',
    ...i18n,
  });
}

async function site(i18n: Record<string, unknown> = {}) {
  const containerTest = await dastroContainerTest({
    config: {
      environment: 'production',
      i18n,
      pageDefinitions: {
        PageRecord: {
          allRecordsQuery: 'all-pages',
          paths: { de_CH: '', de_DE: '', fr_CH: '', en: '', de: '' },
        },
      },
    } as any,
  });

  /** The page's `<head>`: canonical and hreflang alternates. */
  async function head(record: TestRecord, locale: string) {
    const html = await containerTest.renderToString(LayoutBase, {
      locals: { ...containerTest.astroContext.locals, locale },
      props: { locale, page: record },
    });

    const linkTags = html.match(/<link [^>]*>/g) ?? [];

    return {
      canonical: linkTags
        .filter((tag) => attr(tag, 'rel') === 'canonical')
        .map((tag) => attr(tag, 'href')),
      alternates: alternatesOf(linkTags),
    };
  }

  /** The `<url>` entries of `/sitemap.xml` for the given CMS records, keyed by `<loc>`. */
  async function sitemapEntries(records: TestRecord[]) {
    cmsRecords['all-pages'] = records;

    const response = await sitemap({
      locals: containerTest.astroContext.locals,
      url: new URL(`${BASE_URL}/sitemap.xml`),
    } as any);
    const xml = await response.text();

    return Object.fromEntries(
      (xml.match(/<url>[\s\S]*?<\/url>/g) ?? []).map((entry) => [
        entry.match(/<loc>(.*?)<\/loc>/)?.[1],
        alternatesOf(entry.match(/<xhtml:link [^>]*>/g) ?? []),
      ]),
    ) as Record<string, Alternate[]>;
  }

  return { head, sitemapEntries };
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1];
}

function alternatesOf(tags: string[]): Alternate[] {
  return tags
    .filter((tag) => attr(tag, 'rel') === 'alternate')
    .map((tag) => [attr(tag, 'hreflang')!, attr(tag, 'href')!]);
}

describe('hreflang cluster', () => {
  test('lists every locale the page has a slug in, self included, as language tags', async () => {
    const { head, sitemapEntries } = await regionAwareSite();
    const about = pageRecord('about', ['de_CH', 'en', 'de_DE']);

    const expected = [
      ['de-CH', `${BASE_URL}/de-ch/about-de_CH`],
      ['en', `${BASE_URL}/en/about-en`],
      ['de-DE', `${BASE_URL}/de-de/about-de_DE`],
    ];

    expect((await head(about, 'de_DE')).alternates).toEqual(expected);
    expect(await sitemapEntries([about])).toEqual({
      [`${BASE_URL}/de-ch/about-de_CH`]: expected,
      [`${BASE_URL}/en/about-en`]: expected,
      [`${BASE_URL}/de-de/about-de_DE`]: expected,
    });
  });

  test('head and sitemap emit the same cluster for the same page', async () => {
    const { head, sitemapEntries } = await regionAwareSite({
      xDefaultLocale: 'en',
    });
    // Slug locales in a different order than the configured locales
    const about = pageRecord('about', ['de_DE', 'en', 'fr_CH']);
    const home = pageRecord('home', ['en', 'de_CH']);
    const marketOnly = pageRecord('offer', ['de_DE']);

    const entries = await sitemapEntries([about, home, marketOnly]);

    expect(Object.keys(entries)).toHaveLength(6);
    expect((await head(about, 'fr_CH')).alternates).toEqual(
      entries[`${BASE_URL}/fr-ch/about-fr_CH`],
    );
    expect((await head(about, 'en')).alternates).toEqual(
      entries[`${BASE_URL}/en/about-en`],
    );
    expect((await head(home, 'de_CH')).alternates).toEqual(
      entries[`${BASE_URL}/de-ch`],
    );
    expect((await head(marketOnly, 'de_DE')).alternates).toEqual(
      entries[`${BASE_URL}/de-de/offer-de_DE`],
    );
  });

  test('a page with a slug in one locale only emits no hreflang', async () => {
    const { head, sitemapEntries } = await regionAwareSite();
    const marketOnly = pageRecord('offer', ['de_DE']);

    expect(await head(marketOnly, 'de_DE')).toEqual({
      canonical: [`${BASE_URL}/de-de/offer-de_DE`],
      alternates: [],
    });
    expect(await sitemapEntries([marketOnly])).toEqual({
      [`${BASE_URL}/de-de/offer-de_DE`]: [],
    });
  });

  test("default 'language' mode: values stay bare languages", async () => {
    const { head, sitemapEntries } = await site();
    const about = pageRecord('about', ['de', 'fr_CH']);

    const expected = [
      ['de', `${BASE_URL}/about-de`],
      ['fr', `${BASE_URL}/fr/about-fr_CH`],
    ];

    expect((await head(about, 'de')).alternates).toEqual(expected);
    expect(await sitemapEntries([about])).toEqual({
      [`${BASE_URL}/about-de`]: expected,
      [`${BASE_URL}/fr/about-fr_CH`]: expected,
    });
  });
});

describe('x-default', () => {
  test('with xDefaultLocale, a page that exists in that locale points x-default at it', async () => {
    const { head, sitemapEntries } = await regionAwareSite({
      xDefaultLocale: 'en',
    });
    const about = pageRecord('about', ['de_CH', 'en']);

    expect((await head(about, 'de_CH')).alternates).toContainEqual(X_DEFAULT);
    expect((await head(about, 'en')).alternates).toContainEqual(X_DEFAULT);

    const entries = await sitemapEntries([about]);
    expect(entries[`${BASE_URL}/de-ch/about-de_CH`]).toContainEqual(X_DEFAULT);
    expect(entries[`${BASE_URL}/en/about-en`]).toContainEqual(X_DEFAULT);
  });

  test('x-default of the home page is the prefixed home of that locale', async () => {
    const { head, sitemapEntries } = await regionAwareSite({
      xDefaultLocale: 'en',
    });
    const home = pageRecord('home', ['de_CH', 'en']);

    expect((await head(home, 'de_CH')).alternates).toContainEqual([
      'x-default',
      `${BASE_URL}/en`,
    ]);
    expect((await sitemapEntries([home]))[`${BASE_URL}/de-ch`]).toContainEqual([
      'x-default',
      `${BASE_URL}/en`,
    ]);
  });

  test('a page without a version in that locale emits no x-default', async () => {
    const { head, sitemapEntries } = await regionAwareSite({
      xDefaultLocale: 'en',
    });
    const swissOnly = pageRecord('about', ['de_CH', 'fr_CH']);

    const expected = [
      ['de-CH', `${BASE_URL}/de-ch/about-de_CH`],
      ['fr-CH', `${BASE_URL}/fr-ch/about-fr_CH`],
    ];

    expect((await head(swissOnly, 'de_CH')).alternates).toEqual(expected);
    expect(
      (await sitemapEntries([swissOnly]))[`${BASE_URL}/de-ch/about-de_CH`],
    ).toEqual(expected);
  });

  test('a page that exists only in that locale has no cluster, so no x-default', async () => {
    const { head, sitemapEntries } = await regionAwareSite({
      xDefaultLocale: 'en',
    });
    const englishOnly = pageRecord('about', ['en']);

    expect((await head(englishOnly, 'en')).alternates).toEqual([]);
    expect(await sitemapEntries([englishOnly])).toEqual({
      [`${BASE_URL}/en/about-en`]: [],
    });
  });

  test('without the option, no x-default is emitted', async () => {
    const { head, sitemapEntries } = await regionAwareSite();
    const about = pageRecord('about', ['de_CH', 'en']);

    const hreflangs = (alternates: Alternate[]) => alternates.map(([h]) => h);

    expect(hreflangs((await head(about, 'en')).alternates)).toEqual([
      'de-CH',
      'en',
    ]);
    expect(
      hreflangs((await sitemapEntries([about]))[`${BASE_URL}/en/about-en`]),
    ).toEqual(['de-CH', 'en']);
  });
});

describe('noindex pages', () => {
  test('head: canonical only, no hreflang and no x-default', async () => {
    const { head } = await regionAwareSite({ xDefaultLocale: 'en' });
    const hidden = pageRecord('about', ['de_CH', 'en', 'de_DE'], {
      noIndex: true,
    });

    expect(await head(hidden, 'de_CH')).toEqual({
      canonical: [`${BASE_URL}/de-ch/about-de_CH`],
      alternates: [],
    });
  });

  test('head: a combined robots value (`noindex, nofollow`) counts as noindex', async () => {
    const { head } = await regionAwareSite();
    const hidden = pageRecord('about', ['de_CH', 'en'], {
      noIndex: true,
      robots: 'noindex, nofollow',
    });

    expect((await head(hidden, 'en')).alternates).toEqual([]);
  });

  test('sitemap: not listed, and so without alternates', async () => {
    const { sitemapEntries } = await regionAwareSite({ xDefaultLocale: 'en' });
    const hidden = pageRecord('hidden', ['de_CH', 'en'], { noIndex: true });
    const about = pageRecord('about', ['de_CH', 'en']);

    const entries = await sitemapEntries([hidden, about]);

    expect(Object.keys(entries)).toEqual([
      `${BASE_URL}/de-ch/about-de_CH`,
      `${BASE_URL}/en/about-en`,
    ]);
    expect(JSON.stringify(entries)).not.toContain('hidden');
  });
});
