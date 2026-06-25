#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';
import { createContext, isDastroProject } from './context.js';
import * as scaffold from './steps/scaffold.js';
import * as github from './steps/github.js';
import * as netlify from './steps/netlify.js';
import * as datoConfig from './steps/dato-config.js';
import * as datoSeed from './steps/dato-seed.js';

// Convert a readable name into a repository/slug candidate.
function inferRepositoryName(readableName) {
  return readableName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateProjectName(name) {
  if (!name) {
    return 'Project name cannot be empty';
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, and underscores';
  }
  if (existsSync(name)) {
    return `Directory '${name}' already exists`;
  }
  return null;
}

/**
 * Runs a single step within the `create` orchestrator. When a `gate` prompt is
 * given, the user is asked to confirm the (optional) phase — unless the step
 * already self-detects completion, in which case the prompt is skipped and the
 * step no-ops. The same wrapper backs standalone subcommands, which pass no
 * gate (they never ask yes/no, only prompt for missing inputs).
 */
async function runStep(mod, { projectPath, ctx, gate = null }) {
  if (gate) {
    const done = mod.isDone ? await mod.isDone(projectPath) : false;
    if (!done) {
      const wants = await ctx.askYesNo(gate, true);
      if (!wants) return { declined: true };
    }
  }
  return mod.step(projectPath, ctx, { prompt: !gate });
}

function printPreflight() {
  console.log('🔎 Running pre-flight checks...');
  const ghAvailable = github.isGhAuthenticated();
  const netlifyAvailable = netlify.isNetlifyCliInstalled();
  console.log(
    `   ${ghAvailable ? '✅' : '⚠️ '} GitHub CLI authenticated${
      ghAvailable ? '' : ' — GitHub repo + Netlify steps will be skipped'
    }`,
  );
  console.log(
    `   ${netlifyAvailable ? '✅' : '⚠️ '} Netlify CLI installed${
      netlifyAvailable ? '' : ' — Netlify step will be skipped'
    }`,
  );
  console.log();
}

// Gather the up-front inputs a fresh scaffold needs and seed a context for the
// project-to-be at <cwd>/<slug>.
async function setupFreshContext(rl, nameArg) {
  console.log('🚀 Welcome to Dastro Project Creator!\n');
  printPreflight();

  const ctxPrompt = createContext(process.cwd(), rl);
  const readableName = await ctxPrompt.ask(
    "Enter a readable name for your project (e.g., 'Gridonic Website'): ",
  );

  const inferredRepoName = inferRepositoryName(readableName);
  console.log(`\n📝 Inferred repository name: ${inferredRepoName}`);

  let slug = nameArg;
  let validationError = slug ? validateProjectName(slug) : 'prompt';
  while (validationError) {
    if (validationError !== 'prompt') console.log(`❌ ${validationError}\n`);
    slug = await ctxPrompt.askWithDefault('Repository name', inferredRepoName);
    validationError = validateProjectName(slug);
  }

  console.log('\n🔑 DatoCMS Configuration');
  const datoToken = await ctxPrompt.askWithDefault(
    'Enter your DatoCMS Content Delivery API token ("Read-only API token"). Leave blank to use boilerplate token',
    '',
  );
  const cmaToken = await ctxPrompt.askWithDefault(
    'Enter your DatoCMS CMA token (admin token). Leave blank to set later in Netlify UI',
    '',
  );

  const projectPath = join(process.cwd(), slug);
  const ctx = createContext(projectPath, rl, {
    readableName,
    slug,
    datoToken,
    cmaToken,
  });
  return { projectPath, ctx, fresh: true };
}

async function setupResumeContext(rl) {
  console.log('🔁 Resuming dastro project setup...\n');
  printPreflight();
  const projectPath = process.cwd();
  return { projectPath, ctx: createContext(projectPath, rl), fresh: false };
}

/**
 * `create [name]` orchestrator. Fresh mode when a name is given or the cwd is
 * not a dastro project; resume mode when run with no name inside an existing
 * (possibly half-built) dastro project. Every step is idempotent, so resume
 * simply re-runs all of them and the completed ones no-op.
 */
async function createProject(rl, nameArg) {
  try {
    const fresh = !!nameArg || !isDastroProject(process.cwd());
    const { projectPath, ctx } = fresh
      ? await setupFreshContext(rl, nameArg)
      : await setupResumeContext(rl);

    const results = {};

    // 1. Scaffold (required — hard-fails the whole run on error)
    results.scaffold = await scaffold.step(projectPath, ctx);
    if (fresh) ctx.persist({ readableName: await ctx.resolve('readableName') });

    // 2. DatoCMS plugin configuration (optional, needs the CMA token)
    if (ctx.has('cmaToken')) {
      console.log('\n🔌 DatoCMS plugin configuration');
      results.datoConfig = await runStep(datoConfig, {
        projectPath,
        ctx,
        gate: 'Configure DatoCMS preview & SEO readability plugins now?',
      });
    } else {
      results.datoConfig = await datoConfig.step(projectPath, ctx);
    }

    // 3. GitHub remote (optional, needs gh auth)
    if (github.isGhAuthenticated()) {
      console.log('\n🐙 GitHub');
      results.github = await runStep(github, {
        projectPath,
        ctx,
        gate: 'Create a private GitHub remote repository?',
      });
    } else {
      results.github = await github.step(projectPath, ctx);
    }

    // 4. Netlify (optional, needs the Netlify CLI and a GitHub remote)
    if (netlify.isNetlifyCliInstalled() && github.isDone(projectPath)) {
      console.log('\n🌐 Netlify');
      results.netlify = await runStep(netlify, {
        projectPath,
        ctx,
        gate: 'Deploy this project to Netlify?',
      });
    } else {
      results.netlify = await netlify.step(projectPath, ctx);
    }

    // 5. Seed baseline DatoCMS content (optional, needs the CMA token)
    if (ctx.has('cmaToken')) {
      console.log('\n🌱 DatoCMS content');
      results.datoSeed = await runStep(datoSeed, {
        projectPath,
        ctx,
        gate: 'Seed baseline DatoCMS records (home & 404 pages, navigation, global content)?',
      });
    } else {
      results.datoSeed = await datoSeed.step(projectPath, ctx);
    }

    await printSummary(ctx, projectPath, results, fresh);
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }
}

async function printSummary(ctx, projectPath, results, fresh) {
  const slug = await ctx.resolve('slug');

  console.log('\n✅ Project setup complete!');
  console.log(`\n📁 Project location: ${projectPath}`);
  if (github.isDone(projectPath)) {
    const ghOrg = await ctx.resolve('ghOrg');
    console.log(`🐙 GitHub: https://github.com/${ghOrg}/${slug}`);
  }
  if (results.netlify?.siteUrl) {
    console.log(`🌐 Netlify: ${results.netlify.siteUrl}`);
  }

  console.log('\n🚀 Run the project:');
  if (fresh) console.log(`   cd ${slug}`);
  console.log('   npm run dev');
  console.log('\n📚 Documentation: https://github.com/gridonic/dastro');

  console.log('\n🚀 Next steps:');
  console.log(
    '   🤖 Run the dastro-init-project.mdc rule to remove unnecessary prototype code',
  );

  if (ctx.notes.length > 0) {
    console.log('\n📝 Manual follow-up:');
    ctx.notes.forEach((note) => console.log(`   • ${note}`));
  }
}

/**
 * Runs one step as a standalone subcommand against the current working
 * directory. No yes/no gate — the step prompts only for inputs it cannot
 * derive from disk/state.
 */
async function runStandaloneStep(rl, mod) {
  const projectPath = process.cwd();
  if (!isDastroProject(projectPath)) {
    console.log(
      '❌ This does not look like a dastro project. Run the command from the project root.',
    );
    process.exit(1);
  }

  const ctx = createContext(projectPath, rl);
  try {
    await runStep(mod, { projectPath, ctx });
    if (ctx.notes.length > 0) {
      console.log('\n📝 Manual follow-up:');
      ctx.notes.forEach((note) => console.log(`   • ${note}`));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { createProject, runStandaloneStep };
