import merge from 'deepmerge';
import type { DastroTypes } from '../../src';
import type { RecordWithParent } from '../../src/core/routing';
import type { Page } from '../../src/core/page';

type RecordWithParentAndSeo<T extends DastroTypes> = RecordWithParent<T> & {
  seo?: { noIndex?: boolean | null } | null;
};

export function buildTestPageRecord<Types extends DastroTypes = DastroTypes>(
  name: string,
  opts: {
    localeCount?: 1 | 2 | 3;
    locale?: Types['SiteLocale'];
  } = {},
  overrides: Partial<Page<Types> & RecordWithParentAndSeo<Types>> = {},
): Page<Types> & RecordWithParentAndSeo<Types> {
  const { localeCount = 2, locale = 'de' } = opts;

  return merge(
    {
      id: `${name}-id`,
      seo: null,
      __typename: 'PageRecord',
      title: `Title: ${name}`,
      _allTranslatedSlugLocales: [
        {
          locale: 'de',
          value: `${name}-de`,
        },
        ...(localeCount === 2
          ? [
              {
                locale: 'en',
                value: `${name}-en`,
              },
            ]
          : []),
        ...(localeCount === 3
          ? [
              {
                locale: 'fr',
                value: `${name}-fr`,
              },
            ]
          : []),
      ],
      _seoMetaTags: [
        {
          attributes: null,
          content: `Title: ${name}`,
          tag: 'title',
        },
        {
          attributes: {
            property: 'og:locale',
            content: locale,
          },
          content: null,
          tag: 'meta',
        },
      ],
      parent: null,
    } satisfies Page<Types> & RecordWithParentAndSeo<Types>,
    overrides,
  );
}
