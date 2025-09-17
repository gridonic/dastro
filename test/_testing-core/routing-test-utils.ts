import merge from 'deepmerge';
import type { DastroTypes } from '../../src';
import type { RecordWithParent } from '../../src/core/routing';
import type { Page } from '../../src/core/page';
import { defaultTestLocale } from './dastro-test.ts';

export type TestPageRecord = RecordWithParent<DastroTypes> & {
  seo?: { noIndex?: boolean | null } | null;
};

export function buildTestPageRecord(
  name: string,
  opts: {
    locale?: DastroTypes['SiteLocale'];
    type?: string;
    overrides?: Partial<Page<DastroTypes> & TestPageRecord>;
  } = {},
): Page<DastroTypes> & TestPageRecord {
  const {
    locale = defaultTestLocale,
    overrides = {},
    type = 'PageRecord',
  } = opts ?? {};

  const defaultRecordData: Page<DastroTypes> & TestPageRecord = {
    id: `${name}-id`,
    seo: null,
    __typename: type,
    title: `Title: ${name}`,
    _allTranslatedSlugLocales: [
      {
        locale: 'de',
        value: `${name}-de`,
      },
      {
        locale: 'en',
        value: `${name}-en`,
      },
      {
        locale: 'fr_CH',
        value: `${name}-fr_CH`,
      },
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
  };

  return merge(defaultRecordData, overrides, {
    customMerge: (key) => {
      if (key === '_allTranslatedSlugLocales') {
        return (_, b) => b;
      }
    },
  });
}

export function buildHomeRecord() {
  return {
    ...buildTestPageRecord('home'),
    _allTranslatedSlugLocales: [
      { locale: 'de', value: 'home' },
      { locale: 'en', value: 'home' },
      { locale: 'fr_CH', value: 'home' },
    ],
  };
}
