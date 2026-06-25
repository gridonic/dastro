#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { isDastroProject } from '../context.js';

const TEMPLATE_REPO = 'git@github.com:gridonic/astro-boilerplate.git';

// The project is already scaffolded once the boilerplate has been cloned and
// installed (package.json declares `dastro`). In resume mode this no-ops.
export function isDone(projectPath) {
  return isDastroProject(projectPath);
}

// Scaffold is the only non-optional step: a failure here aborts `create`, so it
// intentionally does not catch — the orchestrator's outer handler reports it.
export async function step(projectPath, ctx) {
  if (isDone(projectPath)) {
    console.log('✅ Project already scaffolded — skipping clone');
    return { skipped: true };
  }

  const { readableName, slug, datoToken } = await ctx.resolve([
    'readableName',
    'slug',
    'datoToken',
  ]);

  console.log(`\n📁 Creating project: ${slug}\n`);

  // Clone the boilerplate template, then drop its history to start fresh.
  console.log('📥 Cloning repository template...');
  execSync(`git clone ${TEMPLATE_REPO} "${projectPath}"`, { stdio: 'inherit' });

  console.log('🧹 Cleaning up repository...');
  execSync(`rm -rf "${join(projectPath, '.git')}"`, { stdio: 'inherit' });

  // Update IntelliJ project name
  console.log('🔧 Updating IntelliJ project configuration...');
  const ideaPath = join(projectPath, '.idea');
  if (existsSync(ideaPath)) {
    const ideaNamePath = join(ideaPath, '.name');
    if (existsSync(ideaNamePath)) {
      writeFileSync(ideaNamePath, readableName);
    }

    const modulesXmlPath = join(ideaPath, 'modules.xml');
    if (existsSync(modulesXmlPath)) {
      let modulesXml = readFileSync(modulesXmlPath, 'utf8');
      modulesXml = modulesXml.replace(/Astro Boilerplate/g, readableName);
      writeFileSync(modulesXmlPath, modulesXml);
    }

    const oldImlPath = join(ideaPath, 'Astro Boilerplate.iml');
    const newImlPath = join(ideaPath, `${readableName}.iml`);
    if (existsSync(oldImlPath)) {
      execSync(`mv "${oldImlPath}" "${newImlPath}"`, { stdio: 'inherit' });
    }
  }

  // Update package.json with the new project name
  console.log('📝 Updating package.json...');
  const packageJsonPath = join(projectPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = slug;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Update .env.example with the DatoCMS token (if provided) and editing URL
  const envExamplePath = join(projectPath, '.env.example');
  if (existsSync(envExamplePath)) {
    let envContent = readFileSync(envExamplePath, 'utf8');
    if (datoToken && datoToken.trim()) {
      console.log('📝 Updating DatoCMS token in .env.example...');
      envContent = envContent.replace(
        /DATO_CMS_TOKEN=.*/,
        `DATO_CMS_TOKEN=${datoToken}`,
      );
    }
    console.log('📝 Updating DATO_CMS_BASE_EDITING_URL in .env.example...');
    envContent = envContent.replace(
      /DATO_CMS_BASE_EDITING_URL=.*/,
      `DATO_CMS_BASE_EDITING_URL=https://${slug}.admin.datocms.com`,
    );
    writeFileSync(envExamplePath, envContent);
  }

  // Copy .env.example to .env
  console.log('📋 Setting up environment file...');
  const envPath = join(projectPath, '.env');
  if (existsSync(envExamplePath)) {
    execSync(`cp "${envExamplePath}" "${envPath}"`, { stdio: 'inherit' });
  }

  // Ensure the .dastro CLI state directory is gitignored before committing.
  const gitignorePath = join(projectPath, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf8');
    const ignored = gitignore
      .split('\n')
      .some((line) => line.trim().replace(/\/$/, '') === '.dastro');
    if (!ignored) {
      writeFileSync(
        gitignorePath,
        `${gitignore.replace(/\n*$/, '\n')}\n# Dastro CLI state\n.dastro/\n`,
      );
    }
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: projectPath });

  // Initialize git repository
  console.log('🔧 Initializing git repository...');
  execSync('git init -b main', { stdio: 'inherit', cwd: projectPath });
  execSync('git add .', { stdio: 'inherit', cwd: projectPath });
  execSync('git commit -m "Initial commit"', {
    stdio: 'inherit',
    cwd: projectPath,
  });
  execSync('git branch production', { stdio: 'inherit', cwd: projectPath });

  return { created: true };
}
