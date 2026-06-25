#!/usr/bin/env node

import { execSync, execFileSync } from 'child_process';

export function isGhAuthenticated() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// The repo is already set up once the local clone has an `origin` remote.
// `gh repo create` fails if the repo exists, so this guards re-runs.
export function isDone(projectPath) {
  try {
    execSync('git remote get-url origin', { cwd: projectPath, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export async function step(projectPath, ctx) {
  if (!isGhAuthenticated()) {
    console.log('⚠️  GitHub CLI not authenticated — skipping GitHub setup');
    ctx.note(
      'Authenticate with `gh auth login`, then create a private GitHub repo and push `main` + `production` branches',
    );
    return { skipped: true, reason: 'gh-unauthenticated' };
  }

  const { slug, ghOrg } = await ctx.resolve(['slug', 'ghOrg']);

  if (isDone(projectPath)) {
    console.log('✅ GitHub remote already configured — skipping');
    return { skipped: true, reason: 'already-linked', org: ghOrg, slug };
  }

  ctx.persist({ ghOrg });

  try {
    console.log(`\n🐙 Creating private GitHub repo ${ghOrg}/${slug}...`);
    execFileSync(
      'gh',
      [
        'repo',
        'create',
        `${ghOrg}/${slug}`,
        '--private',
        '--source',
        '.',
        '--remote',
        'origin',
      ],
      { cwd: projectPath, stdio: 'inherit' },
    );
    execSync('git push -u origin main', { stdio: 'inherit', cwd: projectPath });
    execSync('git push origin production', {
      stdio: 'inherit',
      cwd: projectPath,
    });
    console.log('✅ GitHub repo created and pushed');
    return {
      created: true,
      org: ghOrg,
      slug,
      url: `https://github.com/${ghOrg}/${slug}`,
    };
  } catch (error) {
    console.log(`⚠️  GitHub repo creation failed: ${error.message}`);
    ctx.note(
      'Create the GitHub repo manually and push `main` + `production` branches',
    );
    return { failed: true };
  }
}
