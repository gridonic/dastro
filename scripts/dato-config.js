#!/usr/bin/env node

import { buildClient } from '@datocms/cma-client-node';

const WEB_PREVIEWS_PACKAGE = 'datocms-plugin-web-previews';
const SEO_READABILITY_PACKAGE = 'datocms-plugin-seo-readability-analysis';

export async function configureDatoCmsPlugins({ cmaToken, netlifySiteName }) {
  const client = buildClient({ apiToken: cmaToken });
  const plugins = await client.plugins.list();

  const baseUrl = `https://main--${netlifySiteName}.netlify.app`;
  const previewWebhook = `${baseUrl}/api/cms/preview-links?token=gridonic-dato`;
  const enableDraftModeUrl = `${baseUrl}/api/cms/draft-mode/enable?token=gridonic-dato`;
  const htmlGeneratorUrl = `${baseUrl}/api/cms/seo-analysis?token=gridonic-dato`;

  const updated = [];
  const skipped = [];

  // Web Previews plugin: update the "Production" frontend's URLs
  const webPreviews = plugins.find(
    (p) => p.package_name === WEB_PREVIEWS_PACKAGE,
  );
  if (!webPreviews) {
    console.log(
      `   ⚠️  Plugin not installed: ${WEB_PREVIEWS_PACKAGE} — skipping`,
    );
    skipped.push(WEB_PREVIEWS_PACKAGE);
  } else {
    const params = { ...(webPreviews.parameters || {}) };
    const frontends = Array.isArray(params.frontends) ? params.frontends : [];
    const productionIndex = frontends.findIndex(
      (f) => f?.name === 'Production',
    );

    if (productionIndex === -1) {
      console.log(
        `   ⚠️  ${WEB_PREVIEWS_PACKAGE}: no frontend named "Production" — skipping`,
      );
      skipped.push(WEB_PREVIEWS_PACKAGE);
    } else {
      const production = { ...frontends[productionIndex] };
      production.previewWebhook = previewWebhook;
      production.visualEditing = {
        ...(production.visualEditing || {}),
        enableDraftModeUrl,
      };
      params.frontends = frontends.map((f, i) =>
        i === productionIndex ? production : f,
      );

      await client.plugins.update(webPreviews.id, { parameters: params });
      console.log(`   ✅ Updated ${WEB_PREVIEWS_PACKAGE}`);
      updated.push(WEB_PREVIEWS_PACKAGE);
    }
  }

  // SEO Readability plugin: update htmlGeneratorUrl
  const seoReadability = plugins.find(
    (p) => p.package_name === SEO_READABILITY_PACKAGE,
  );
  if (!seoReadability) {
    console.log(
      `   ⚠️  Plugin not installed: ${SEO_READABILITY_PACKAGE} — skipping`,
    );
    skipped.push(SEO_READABILITY_PACKAGE);
  } else {
    const params = {
      ...(seoReadability.parameters || {}),
      htmlGeneratorUrl,
    };
    await client.plugins.update(seoReadability.id, { parameters: params });
    console.log(`   ✅ Updated ${SEO_READABILITY_PACKAGE}`);
    updated.push(SEO_READABILITY_PACKAGE);
  }

  return { updated, skipped };
}
