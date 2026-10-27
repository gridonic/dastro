import { expect, test, vi } from 'vitest';
import { dastroContainerTest } from '../../../test/_testing-core/dastro-test.ts';
import { buildTestPageRecord } from '../../../test/_testing-core/routing-test-utils.ts';

// The consumer project's global stylesheet does not exist in dastro itself
vi.mock('@/sass/styles.scss', () => ({}));

// @ts-ignore
import LayoutBase from './LayoutBase.astro';

const regionLocales = ['de_CH', 'en', 'de_DE'];

async function renderRegionAwareLayout(locale: string) {
  const { renderToString } = await dastroContainerTest({
    locale,
    config: {
      i18n: {
        locales: regionLocales,
        defaultLocale: 'en',
        routingStrategy: 'prefix-always',
        localePrefix: 'locale',
      } as any,
    },
  });

  return renderToString(LayoutBase, {
    props: {
      locale,
      page: buildTestPageRecord('about', {
        overrides: {
          _allTranslatedSlugLocales: regionLocales.map((l) => ({
            locale: l,
            value: `about-${l}`,
          })),
        },
      }),
    },
  });
}

test("localePrefix 'locale': <html lang> is the language tag", async () => {
  expect(await renderRegionAwareLayout('de_CH')).toContain(
    '<html lang="de-CH"',
  );
  expect(await renderRegionAwareLayout('de_DE')).toContain(
    '<html lang="de-DE"',
  );
  expect(await renderRegionAwareLayout('en')).toContain('<html lang="en"');
});

test("localePrefix 'locale': hreflang values are language tags pointing at locale-prefixed URLs", async () => {
  const html = await renderRegionAwareLayout('de_CH');

  expect(html).toContain(
    '<link rel="alternate" hreflang="de-CH" href="https://testing.dastro.com/de-ch/about-de_CH" />',
  );
  expect(html).toContain(
    '<link rel="alternate" hreflang="de-DE" href="https://testing.dastro.com/de-de/about-de_DE" />',
  );
  expect(html).toContain(
    '<link rel="alternate" hreflang="en" href="https://testing.dastro.com/en/about-en" />',
  );
  expect(html).toContain(
    '<link rel="canonical" href="https://testing.dastro.com/de-ch/about-de_CH" />',
  );
});

test("default 'language' mode: <html lang> and hreflang stay bare languages", async () => {
  const { renderToString } = await dastroContainerTest();

  const html = await renderToString(LayoutBase, {
    props: { locale: 'fr_CH', page: buildTestPageRecord('about') },
  });

  expect(html).toContain('<html lang="fr"');
  expect(html).toContain(
    '<link rel="alternate" hreflang="fr" href="https://testing.dastro.com/fr/about-fr_CH" />',
  );
  expect(html).toContain(
    '<link rel="alternate" hreflang="de" href="https://testing.dastro.com/about-de" />',
  );
});
