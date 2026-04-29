#!/usr/bin/env node

import { execSync, execFileSync } from 'child_process';
import { randomBytes } from 'crypto';

export function isNetlifyCliInstalled() {
  try {
    execSync('netlify --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function generateJwtSecret() {
  return randomBytes(32).toString('hex');
}

function netlifyApi(command, payload, cwd) {
  const out = execFileSync(
    'netlify',
    ['api', command, '--data', JSON.stringify(payload)],
    { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] },
  );
  return out.trim() ? JSON.parse(out) : {};
}

// Netlify GitHub App installation on the gridonic org.
const GRIDONIC_NETLIFY_INSTALLATION_ID = 38358406;

function setEnv(cwd, key, value, contexts) {
  const args = ['env:set', key, value];
  if (contexts && contexts.length > 0) {
    args.push('--context', ...contexts);
  }
  execFileSync('netlify', args, { cwd, stdio: 'pipe' });
}

export async function setupNetlifySite({
  projectPath,
  projectName,
  siteName,
  org,
  datocmsToken,
  datocmsCmaToken,
}) {
  const installationId = GRIDONIC_NETLIFY_INSTALLATION_ID;
  const repoSlug = `${org}/${projectName}`;
  const jwtSecret = generateJwtSecret();

  console.log(`\n🌐 Creating Netlify site "${siteName}" linked to ${repoSlug}...`);
  const site = netlifyApi(
    'createSite',
    {
      body: {
        name: siteName,
        repo: {
          provider: 'github',
          repo: repoSlug,
          branch: 'production',
          cmd: 'npm run build',
          dir: 'dist',
          installation_id: installationId,
          allowed_branches: ['production', 'main', 'feat/*'],
        },
      },
    },
    projectPath,
  );

  if (!site.id) {
    throw new Error('Netlify API did not return a site id');
  }
  const siteId = site.id;
  console.log(`✅ Site created (id: ${siteId})`);

  console.log('🔗 Linking local directory to Netlify site...');
  execFileSync('netlify', ['link', '--id', siteId], {
    cwd: projectPath,
    stdio: 'inherit',
  });

  console.log('🔧 Ensuring site name and functions region...');
  // Reaffirm the site name (Netlify sometimes auto-slugs at create time)
  // and set the functions region.
  const updated = netlifyApi(
    'updateSite',
    {
      site_id: siteId,
      body: {
        name: siteName,
        functions_region: 'eu-central-1',
      },
    },
    projectPath,
  );
  const finalSiteUrl =
    updated.ssl_url || updated.url || `https://${siteName}.netlify.app`;
  console.log(`   ✅ Site URL: ${finalSiteUrl}`);

  console.log('🔐 Setting environment variables...');
  const productionUrl = `https://${siteName}.netlify.app`;
  const stageUrl = `https://main--${siteName}.netlify.app`;
  const datoEditingUrl = `https://${projectName}.admin.datocms.com`;

  const commonEnv = {
    DATO_CMS_BASE_EDITING_URL: datoEditingUrl,
    DATO_CMS_GRAPHQL_HOST: 'https://graphql.datocms.com',
    DATO_CMS_TOKEN: datocmsToken || '',
    DATO_CMS_CMA_TOKEN: datocmsCmaToken || '',
    DATO_CMS_ENVIRONMENT: 'main',
    SECRET_API_TOKEN: 'gridonic-dato',
    SIGNED_COOKIE_JWT_SECRET: jwtSecret,
    ALLOW_DATO_ENVIRONMENT_SWITCH: 'false',
    DEVELOPMENT_DEBUG_VIEW_ENABLED: 'true',
    DEVELOPMENT_PREVENT_SEARCH_INDEXING: 'true',
  };

  const productionOverrides = {
    APP_BASE_URL: productionUrl,
    ENVIRONMENT: 'production',
    NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS: '2',
  };

  const stageOverrides = {
    APP_BASE_URL: stageUrl,
    ENVIRONMENT: 'stage',
    NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS: '0',
  };
  const stageContexts = ['deploy-preview', 'branch-deploy', 'dev'];

  const skipped = [];
  for (const [key, value] of Object.entries(commonEnv)) {
    if (value === '') {
      skipped.push(key);
      continue;
    }
    setEnv(projectPath, key, value);
  }
  for (const [key, value] of Object.entries(productionOverrides)) {
    setEnv(projectPath, key, value, ['production']);
  }
  for (const [key, value] of Object.entries(stageOverrides)) {
    setEnv(projectPath, key, value, stageContexts);
  }

  if (skipped.length > 0) {
    console.log(
      `⚠️  Skipped empty env vars (set them in Netlify UI later): ${skipped.join(', ')}`,
    );
  }

  console.log('🚀 Triggering initial deploys for production and main...');
  for (const branch of ['production', 'main']) {
    try {
      const hook = netlifyApi(
        'createSiteBuildHook',
        {
          site_id: siteId,
          body: {
            title: `dastro-create initial deploy (${branch})`,
            branch,
          },
        },
        projectPath,
      );
      execFileSync('curl', ['-fsS', '-X', 'POST', '-d', '{}', hook.url], {
        stdio: 'pipe',
      });
      try {
        netlifyApi(
          'deleteSiteBuildHook',
          { site_id: siteId, id: hook.id },
          projectPath,
        );
      } catch {
        // best-effort cleanup
      }
      console.log(`   ✅ Deploy triggered on "${branch}"`);
    } catch (error) {
      console.log(
        `   ⚠️  Could not trigger deploy on "${branch}": ${error.message}`,
      );
    }
  }

  console.log('✅ Netlify site fully configured');
  return {
    siteId,
    siteUrl: finalSiteUrl,
    skippedEnvVars: skipped,
  };
}
