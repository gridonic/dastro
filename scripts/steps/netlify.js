#!/usr/bin/env node

import { execSync, execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { isDone as isGithubDone } from './github.js';

export function isNetlifyCliInstalled() {
  try {
    execSync('netlify --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// A site is already linked when `netlify link` has written a site id into
// .netlify/state.json — `createSite` is not idempotent, so this guards re-runs.
export function isDone(projectPath) {
  const p = join(projectPath, '.netlify', 'state.json');
  if (!existsSync(p)) return false;
  try {
    return !!JSON.parse(readFileSync(p, 'utf8')).siteId;
  } catch {
    return false;
  }
}

export async function step(projectPath, ctx) {
  if (!isNetlifyCliInstalled()) {
    console.log('⚠️  Netlify CLI not installed — skipping Netlify setup');
    ctx.note(
      'Install Netlify CLI (`npm i -g netlify-cli`), then create a site linked to the GitHub repo and configure env vars / branch deploys per the boilerplate docs',
    );
    return { skipped: true, reason: 'netlify-cli-missing' };
  }
  if (isDone(projectPath)) {
    console.log('✅ Netlify site already linked — skipping');
    return { skipped: true, reason: 'already-linked' };
  }
  if (!isGithubDone(projectPath)) {
    console.log(
      '⚠️  No GitHub remote found — create the GitHub repo before Netlify setup',
    );
    ctx.note(
      'Set up the Netlify site manually once the GitHub repo exists (see the Dastro README "Netlify" section)',
    );
    return { skipped: true, reason: 'no-github-remote' };
  }

  const { slug, ghOrg, netlifySiteName, datoToken, cmaToken } =
    await ctx.resolve([
      'slug',
      'ghOrg',
      'netlifySiteName',
      'datoToken',
      'cmaToken',
    ]);
  ctx.persist({ netlifySiteName });

  try {
    const result = await setupNetlifySite({
      projectPath,
      projectName: slug,
      siteName: netlifySiteName,
      org: ghOrg,
      datocmsToken: (datoToken || '').trim(),
      datocmsCmaToken: (cmaToken || '').trim(),
    });
    if (result.skippedEnvVars?.length) {
      ctx.note(
        `Set the following env vars in Netlify UI: ${result.skippedEnvVars.join(', ')}`,
      );
    }
    return { created: true, ...result };
  } catch (error) {
    console.log(`⚠️  Netlify setup failed: ${error.message}`);
    ctx.note(
      'Set up the Netlify site manually (see the Dastro README "Netlify" section)',
    );
    return { failed: true };
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

  console.log(
    `\n🌐 Creating Netlify site "${siteName}" linked to ${repoSlug}...`,
  );
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
    APP_BASE_URL: stageUrl,
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
    NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS: '0',
  };

  const productionOverrides = {
    APP_BASE_URL: productionUrl,
    ENVIRONMENT: 'production',
    NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS: '1',
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

  console.log('🔔 Setting up deploy notifications...');
  const notificationEmail = 'julien+netlify@gridonic.ch';
  const googleChatBridgeUrl =
    'https://gridonic-netlify-google-chat-bridge.netlify.app/google-chat-notification';
  // Netlify event semantics: deploy_building = starts, deploy_created = succeeds,
  // deploy_failed = fails. (No `deploy_succeeded` — when a deploy succeeds, the
  // `deploy` resource transitions to created.)
  const hooksToCreate = [
    // GitHub App: commit status / checks / PR review comment × 3 events
    ...[
      'github_app_commit_status',
      'github_app_checks',
      'github_app_review_comment',
    ].flatMap((type) =>
      ['deploy_building', 'deploy_created', 'deploy_failed'].map((event) => ({
        type,
        event,
        data: {},
      })),
    ),
    // Email notifications on success and failure
    {
      type: 'email',
      event: 'deploy_created',
      data: { email: notificationEmail },
    },
    {
      type: 'email',
      event: 'deploy_failed',
      data: { email: notificationEmail },
    },
    // Google Chat bridge webhook
    {
      type: 'url',
      event: 'deploy_created',
      data: { url: googleChatBridgeUrl },
    },
    { type: 'url', event: 'deploy_failed', data: { url: googleChatBridgeUrl } },
  ];
  for (const { type, event, data } of hooksToCreate) {
    try {
      netlifyApi(
        'createHookBySiteId',
        {
          site_id: siteId,
          body: { type, event, data },
        },
        projectPath,
      );
    } catch (error) {
      console.log(
        `   ⚠️  Could not create ${type}/${event}: ${error.message.split('\n')[0]}`,
      );
    }
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
