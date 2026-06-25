#!/usr/bin/env node

import { buildClient, buildBlockRecord } from '@datocms/cma-client-node';

// Empty Structured Text (DAST) value — a single empty paragraph.
const EMPTY_DAST = {
  schema: 'dast',
  document: {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'span', value: '' }] }],
  },
};

/**
 * Seeds a freshly-copied (and emptied) DatoCMS project with the baseline
 * records the boilerplate ships with:
 *   - a "Home" page and a "404" page
 *   - the Navigation singleton (linking home + 404)
 *   - the Global Content singleton (empty Organization meta block)
 *   - the Customer Onboarding singleton (disabled)
 *
 * Mirrors the records of the reference project
 * https://boilerplate-new-test.admin.datocms.com/
 *
 * Models and blocks are resolved by `api_key` (not hard-coded internal IDs)
 * because every copied DatoCMS project is assigned fresh internal IDs.
 *
 * @param {{ cmaToken: string, projectName?: string }} options
 * @returns {Promise<{ created: string[] }>}
 */
export async function seedDatoCmsData({ cmaToken, projectName }) {
  const client = buildClient({ apiToken: cmaToken });
  const name = (projectName || '').trim() || 'your project';

  // Resolve item type IDs by api_key
  const itemTypes = await client.itemTypes.list();
  const typeRef = (apiKey) => {
    const itemType = itemTypes.find((t) => t.api_key === apiKey);
    if (!itemType) {
      throw new Error(`Model/block "${apiKey}" not found in project`);
    }
    return { type: 'item_type', id: itemType.id };
  };

  // Locales of the target environment (the boilerplate is de + en)
  const site = await client.site.find();
  const locales = site.locales;
  const primary = locales[0];

  // Build a localized field value from a partial { de, en, ... } map, filling
  // any missing locale with the primary locale's value.
  const localize = (byLocale) =>
    Object.fromEntries(
      locales.map((l) => [l, l in byLocale ? byLocale[l] : byLocale[primary]]),
    );

  // Build a localized field value by invoking `factory` once per locale (use
  // this when each locale needs its own fresh object, e.g. nested blocks).
  const perLocale = (factory) =>
    Object.fromEntries(locales.map((l) => [l, factory(l)]));

  const created = [];

  // ---- Pages -------------------------------------------------------------
  const existingPages = await client.items.list({
    filter: { type: 'page' },
    page: { limit: 100 },
  });
  const findPageBySlug = (slug) =>
    existingPages.find((p) =>
      Object.values(p.translated_slug || {}).includes(slug),
    );

  const headerTextType = typeRef('header_text');
  const headerModule = (title) =>
    buildBlockRecord({
      item_type: headerTextType,
      title,
      lead: EMPTY_DAST,
      link: null,
    });

  // Home page
  let homePage = findPageBySlug('home');
  if (!homePage) {
    homePage = await client.items.create({
      item_type: typeRef('page'),
      title: localize({ de: 'Home', en: 'Home' }),
      translated_slug: localize({ de: 'home', en: 'home' }),
      header_module: localize({
        de: headerModule(`Wir sind ${name}`),
        en: headerModule(`We are ${name}`),
      }),
    });
    created.push('Home page');
  }

  // 404 page
  let notFoundPage = findPageBySlug('404');
  if (!notFoundPage) {
    notFoundPage = await client.items.create({
      item_type: typeRef('page'),
      title: localize({ de: '404', en: '404' }),
      translated_slug: localize({ de: '404', en: '404' }),
      header_module: perLocale(() => headerModule('404')),
    });
    created.push('404 page');
  }

  // ---- Singletons --------------------------------------------------------
  // Upsert: a copied project may already contain the singleton item, so
  // update it when present and only create it when missing.
  const upsertSingleton = async (apiKey, attributes, label) => {
    const [existing] = await client.items.list({
      filter: { type: apiKey },
      page: { limit: 1 },
    });
    if (existing) {
      return client.items.update(existing.id, attributes);
    }
    created.push(label);
    return client.items.create({ item_type: typeRef(apiKey), ...attributes });
  };

  // Navigation
  const navigation = await upsertSingleton(
    'navigation',
    {
      home_page: homePage.id,
      page404: notFoundPage.id,
      is_meta_navigation: false,
      nav_links: [],
    },
    'Navigation',
  );

  // Global Content (empty Organization meta block, "Todo" placeholders)
  const organizationType = typeRef('organization');
  const organizationBlock = () =>
    buildBlockRecord({
      item_type: organizationType,
      organization_type: 'Organization',
      logo: null,
      street_address: 'Todo',
      address_locality: 'Todo',
      address_region: 'Todo',
      postal_code: 'Todo',
      address_country: 'Todo',
      name: 'Todo',
      description: '',
      email: '',
      telephone: '',
      url: '',
      founding_date: null,
      legal_name: '',
      vat_id: '',
      lei_code: '',
      custom_attributes: null,
    });

  const globalContent = await upsertSingleton(
    'global_content',
    {
      address: perLocale(() => EMPTY_DAST),
      organization: perLocale(() => organizationBlock()),
      legal_information_links: perLocale(() => []),
      logo: perLocale(() => null),
      links: perLocale(() => []),
    },
    'Global Content',
  );

  // Customer Onboarding (non-localized, disabled by default)
  const customerOnboarding = await upsertSingleton(
    'customer_onboarding',
    {
      enabled: false,
      version: 1,
      title: '',
      copy: EMPTY_DAST,
      button_text: '',
    },
    'Customer Onboarding',
  );

  // ---- Publish -----------------------------------------------------------
  const records = [
    homePage,
    notFoundPage,
    navigation,
    globalContent,
    customerOnboarding,
  ];
  for (const record of records) {
    try {
      await client.items.publish(record.id);
    } catch (error) {
      console.log(
        `   ⚠️  Could not publish record ${record.id}: ${error.message}`,
      );
    }
  }

  return { created };
}
