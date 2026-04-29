#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync, execFileSync } from 'child_process';
import { isNetlifyCliInstalled, setupNetlifySite } from './netlify.js';

function isGhAuthenticated() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Helper function to convert readable name to repository name
function inferRepositoryName(readableName) {
  return readableName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to validate the project name
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

async function createProject(rl) {
  try {
    console.log('🚀 Welcome to Dastro Project Creator!\n');

    // Pre-flight checks
    console.log('🔎 Running pre-flight checks...');
    const ghAvailable = isGhAuthenticated();
    const netlifyAvailable = isNetlifyCliInstalled();
    console.log(
      `   ${ghAvailable ? '✅' : '⚠️ '} GitHub CLI authenticated${ghAvailable ? '' : ' — GitHub repo + Netlify steps will be skipped'}`,
    );
    console.log(
      `   ${netlifyAvailable ? '✅' : '⚠️ '} Netlify CLI installed${netlifyAvailable ? '' : ' — Netlify step will be skipped'}`,
    );
    console.log();

    // Get readable name from user
    const readableName = await askQuestion(
      "Enter a readable name for your project (e.g., 'Gridonic Website'): ",
    );

    // Infer repository name from readable name
    const inferredRepoName = inferRepositoryName(readableName);
    console.log(`\n📝 Inferred repository name: ${inferredRepoName}`);

    // Get final repository name from user (with default)
    let projectName;
    let validationError;

    do {
      projectName = await askQuestionWithDefault(
        'Repository name',
        inferredRepoName,
      );
      validationError = validateProjectName(projectName);

      if (validationError) {
        console.log(`❌ ${validationError}\n`);
      }
    } while (validationError);

    // Get DatoCMS token from user
    console.log('\n🔑 DatoCMS Configuration');
    const datocmsToken = await askQuestionWithDefault(
      'Enter your DatoCMS Content Delivery API token ("Read-only API token"). Leave blank to use boilerplate token',
      '',
    );

    console.log(`\n📁 Creating project: ${projectName}\n`);

    // Clone the repository template
    console.log('📥 Cloning repository template...');
    const templateRepo = 'git@github.com:gridonic/astro-boilerplate.git';

    execSync(`git clone ${templateRepo} ${projectName}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // Remove the.git directory to start fresh
    console.log('🧹 Cleaning up repository...');
    execSync(`rm -rf ${projectName}/.git`, { stdio: 'inherit' });

    // Navigate to the project directory
    const projectPath = join(process.cwd(), projectName);

    // Update IntelliJ project name
    console.log('🔧 Updating IntelliJ project configuration...');
    const ideaPath = join(projectPath, '.idea');
    if (existsSync(ideaPath)) {
      // Update .idea/.name file
      const ideaNamePath = join(ideaPath, '.name');
      if (existsSync(ideaNamePath)) {
        writeFileSync(ideaNamePath, readableName);
      }

      // Update .idea/modules.xml
      const modulesXmlPath = join(ideaPath, 'modules.xml');
      if (existsSync(modulesXmlPath)) {
        let modulesXml = readFileSync(modulesXmlPath, 'utf8');
        // Replace the old project name with the new one in the filepath and fileurl
        modulesXml = modulesXml.replace(/Astro Boilerplate/g, readableName);
        writeFileSync(modulesXmlPath, modulesXml);
      }

      // Rename the .iml file
      const oldImlPath = join(ideaPath, 'Astro Boilerplate.iml');
      const newImlPath = join(ideaPath, `${readableName}.iml`);
      if (existsSync(oldImlPath)) {
        execSync(`mv "${oldImlPath}" "${newImlPath}"`, { stdio: 'inherit' });
      }
    }

    // Update package.json with a new project name
    console.log('📝 Updating package.json...');
    const packageJsonPath = join(projectPath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = projectName;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Update .env.example with DatoCMS token if provided
    if (datocmsToken.trim()) {
      console.log('📝 Updating DatoCMS token in .env.example...');
      const envExamplePath = join(projectPath, '.env.example');
      if (existsSync(envExamplePath)) {
        let envContent = readFileSync(envExamplePath, 'utf8');
        envContent = envContent.replace(
          /DATO_CMS_TOKEN=.*/,
          `DATO_CMS_TOKEN=${datocmsToken}`,
        );
        writeFileSync(envExamplePath, envContent);
      }
    }

    // Update DATO_CMS_BASE_EDITING_URL with the project name
    console.log('📝 Updating DATO_CMS_BASE_EDITING_URL in .env.example...');
    const envExamplePathForUrl = join(projectPath, '.env.example');
    if (existsSync(envExamplePathForUrl)) {
      let envContent2 = readFileSync(envExamplePathForUrl, 'utf8');
      envContent2 = envContent2.replace(
        /DATO_CMS_BASE_EDITING_URL=.*/,
        `DATO_CMS_BASE_EDITING_URL=https://${projectName}.admin.datocms.com`,
      );
      writeFileSync(envExamplePathForUrl, envContent2);
    }

    // Copy .env.example to .env
    console.log('📋 Setting up environment file...');
    const envExamplePath = join(projectPath, '.env.example');
    const envPath = join(projectPath, '.env');
    if (existsSync(envExamplePath)) {
      execSync(`cp "${envExamplePath}" "${envPath}"`, {
        stdio: 'inherit',
        cwd: projectPath,
      });
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', {
      stdio: 'inherit',
      cwd: projectPath,
    });

    // Initialize git repository
    console.log('🔧 Initializing git repository...');
    execSync('git init -b main', {
      stdio: 'inherit',
      cwd: projectPath,
    });
    execSync('git add .', {
      stdio: 'inherit',
      cwd: projectPath,
    });
    execSync('git commit -m "Initial commit"', {
      stdio: 'inherit',
      cwd: projectPath,
    });
    execSync('git branch production', {
      stdio: 'inherit',
      cwd: projectPath,
    });

    // Optionally create GitHub remote repository
    let ghOrg = null;
    let ghRepoCreated = false;
    let ghDeclined = false;
    if (ghAvailable) {
      console.log('\n🐙 GitHub');
      const wantsGh = await askYesNo(
        'Create a private GitHub remote repository?',
        true,
      );
      if (wantsGh) {
        ghOrg = await askQuestionWithDefault('GitHub organization', 'gridonic');
        try {
          console.log(
            `\n🐙 Creating private GitHub repo ${ghOrg}/${projectName}...`,
          );
          execFileSync(
            'gh',
            [
              'repo',
              'create',
              `${ghOrg}/${projectName}`,
              '--private',
              '--source',
              '.',
              '--remote',
              'origin',
            ],
            { cwd: projectPath, stdio: 'inherit' },
          );
          execSync('git push -u origin main', {
            stdio: 'inherit',
            cwd: projectPath,
          });
          execSync('git push origin production', {
            stdio: 'inherit',
            cwd: projectPath,
          });
          ghRepoCreated = true;
          console.log('✅ GitHub repo created and pushed');
        } catch (error) {
          console.log(`⚠️  GitHub repo creation failed: ${error.message}`);
          console.log('   Continuing without remote setup.');
        }
      } else {
        ghDeclined = true;
      }
    }

    // Optionally deploy to Netlify
    let netlifyResult = null;
    let netlifyDeclined = false;
    if (netlifyAvailable && ghRepoCreated) {
      console.log('\n🌐 Netlify');
      const wantsNetlify = await askYesNo(
        'Deploy this project to Netlify?',
        true,
      );
      if (wantsNetlify) {
        const netlifySiteName = await askQuestionWithDefault(
          'Netlify site name (must be globally unique on netlify.app)',
          projectName,
        );
        const datocmsCmaToken = await askQuestionWithDefault(
          'DatoCMS CMA token (admin token). Leave blank to set later in Netlify UI',
          '',
        );
        try {
          netlifyResult = await setupNetlifySite({
            projectPath,
            projectName,
            siteName: netlifySiteName,
            org: ghOrg,
            datocmsToken: datocmsToken.trim(),
            datocmsCmaToken: datocmsCmaToken.trim(),
          });
        } catch (error) {
          console.log(`⚠️  Netlify setup failed: ${error.message}`);
          console.log('   You can set it up manually later.');
        }
      } else {
        netlifyDeclined = true;
      }
    }

    console.log('\n✅ Project created successfully!');
    console.log(`\n📁 Project location: ${projectPath}`);
    if (ghRepoCreated) {
      console.log(`🐙 GitHub: https://github.com/${ghOrg}/${projectName}`);
    }
    if (netlifyResult) {
      console.log(`🌐 Netlify: ${netlifyResult.siteUrl}`);
    }
    console.log('\n🚀 Run the project:');
    console.log(`   cd ${projectName}`);
    console.log('   npm run dev');
    console.log('\n📚 Documentation: https://github.com/gridonic/dastro');

    console.log('\n🚀 Next steps:');
    console.log(
      '   🤖 Run the dastro-init-project.mdc rule to remove unnecessary prototype code',
    );

    // Manual fallback instructions for missing tools and partial failures
    const manualSteps = [];
    if (!ghAvailable) {
      manualSteps.push(
        '   • Authenticate with `gh auth login`, then create a private GitHub repo and push `main` + `production` branches',
      );
    } else if (!ghRepoCreated && !ghDeclined) {
      manualSteps.push(
        '   • Create the GitHub repo manually and push `main` + `production` branches',
      );
    }
    if (!netlifyAvailable) {
      manualSteps.push(
        '   • Install Netlify CLI (`npm i -g netlify-cli`), then create a site linked to the GitHub repo and configure env vars / branch deploys per the boilerplate docs',
      );
    } else if (ghRepoCreated && !netlifyResult && !netlifyDeclined) {
      manualSteps.push(
        '   • Set up the Netlify site manually (see the Dastro README "Netlify" section)',
      );
    } else if (netlifyResult?.skippedEnvVars?.length) {
      manualSteps.push(
        `   • Set the following env vars in Netlify UI: ${netlifyResult.skippedEnvVars.join(', ')}`,
      );
    }
    if (manualSteps.length > 0) {
      console.log('\n📝 Manual follow-up:');
      manualSteps.forEach((s) => console.log(s));
    }
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }

  // Helper function to get user input
  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  // Helper function to get user input with default value
  function askQuestionWithDefault(question, defaultValue) {
    return new Promise((resolve) => {
      rl.question(`${question} (${defaultValue}): `, (answer) => {
        const trimmedAnswer = answer.trim();
        resolve(trimmedAnswer || defaultValue);
      });
    });
  }

  // Helper function for yes/no prompts
  function askYesNo(question, defaultYes = true) {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    return new Promise((resolve) => {
      rl.question(`${question} [${hint}]: `, (answer) => {
        const trimmed = answer.trim().toLowerCase();
        if (trimmed === '') resolve(defaultYes);
        else resolve(trimmed.startsWith('y'));
      });
    });
  }
}

// Export the function for use in dastro.js
export { createProject };
