#!/usr/bin/env node

import {
  readFileSync,
  lstatSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { createProject } from './create.js';

const command = process.argv[2];

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand() {
  switch (command) {
    case 'create':
      await createProject();
      break;
    case 'link':
      execSync('npm link dastro', { stdio: 'inherit' });
      break;
    case 'unlink':
      execSync('npm unlink dastro --no-save', { stdio: 'inherit' });
      execSync('npm ci', { stdio: 'inherit' });
      break;
    case 'upgrade':
      const cmd = `npm install dastro@github:gridonic/dastro#${getLatestRemoteVersionTag()}`;
      console.log(`🔄 Running command: ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
      console.log(
        `\n✅ Upgraded to latest version: ${getLatestRemoteVersionTag()}`,
      );

      // Copy cursor rules from the installed dastro package
      copyCursorRules();
      break;
    case 'radar':
      const radarUrl = 'https://boilerplate-radar.gridonic.io';
      console.log(`🔗 Opening Boilerplate Radar: ${radarUrl}`);
      try {
        execSync(`open "${radarUrl}"`, { stdio: 'inherit' });
      } catch (error) {
        console.log(
          `⚠️ Could not open browser automatically. Please visit: ${radarUrl}`,
        );
      }
      break;
    case 'info':
      console.log(`ℹ️ Installed version: v${getPackageVersion()}`);
      console.log(`ℹ️ Latest version: ${getLatestRemoteVersionTag()}`);
      console.log(
        `ℹ️ Boilerplate Radar: https://boilerplate-radar.gridonic.io`,
      );
      console.log(
        'ℹ️ Changelog: https://github.com/gridonic/dastro/blob/main/CHANGELOG.md',
      );
      break;
    default:
      if (command && command !== 'help') {
        console.log(`⚠️ Command not found: ${command}\n`);
      }

      // Check if the dastro package is a symlink (local development)
      try {
        const stats = lstatSync('node_modules/dastro');
        if (stats.isSymbolicLink()) {
          console.log(
            chalk.yellow(
              '⚠️  Warning: You are using a local development version of dastro (symlinked)',
            ),
          );
          console.log(
            chalk.yellow(
              "   Run 'dastro unlink' to switch back to the published version\n",
            ),
          );
        }
      } catch (error) {
        // Package doesn't exist or can't be accessed, ignore
        console.log(error);
      }

      console.log(
        '⭐️ Welcome to',
        chalk.red.bold(`Dastro v${getPackageVersion()}`),
      );
      console.log(
        'ℹ️ Changelog:',
        chalk.blue('https://github.com/gridonic/dastro/blob/main/CHANGELOG.md'),
      );

      console.log();

      console.log('Usage: dastro <command>\n');
      console.log('Commands:');
      console.log('  help - show this help message');
      console.log('  create - create a new dastro project');
      console.log('  link - link the local dastro package');
      console.log('  unlink - unlink the local dastro package');
      console.log(
        '  upgrade - upgrade to the latest version of the dastro package',
      );
      console.log('  radar - open the boilerplate radar in your browser');
      console.log('  info - show current and latest version information');
      break;
  }
}

runCommand()
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });

function copyCursorRules() {
  try {
    console.log('\n📋 Copying cursor rules from dastro package...');

    // Path to the installed dastro package's cursor rules
    const dastroPackagePath = join(process.cwd(), 'node_modules', 'dastro');
    const sourceRulesPath = join(dastroPackagePath, '.cursor', 'rules');

    // Path to the current project's cursor rules
    const targetRulesPath = join(process.cwd(), '.cursor', 'rules');

    // Check if the source rules directory exists
    if (!existsSync(sourceRulesPath)) {
      console.log('ℹ️  No cursor rules found in dastro package, skipping...');
      return;
    }

    // Create target directory if it doesn't exist
    if (!existsSync(targetRulesPath)) {
      mkdirSync(targetRulesPath, { recursive: true });
      console.log('📁 Created .cursor/rules directory');
    }

    // Read all files in the source rules directory
    const ruleFiles = readdirSync(sourceRulesPath);

    // Filter for files that start with 'dastro' and have .mdc extension
    const dastroRuleFiles = ruleFiles.filter(
      (file) => file.startsWith('dastro') && file.endsWith('.mdc'),
    );

    if (dastroRuleFiles.length === 0) {
      console.log('ℹ️  No dastro cursor rules found, skipping...');
      return;
    }

    // Copy each dastro rule file
    let copiedCount = 0;
    dastroRuleFiles.forEach((file) => {
      const sourceFile = join(sourceRulesPath, file);
      const targetFile = join(targetRulesPath, file);

      copyFileSync(sourceFile, targetFile);
      console.log(`📄 Copied: ${file}`);
      copiedCount++;
    });

    console.log(
      `\n✅ Successfully copied ${copiedCount} cursor rule(s) from dastro package`,
    );
  } catch (error) {
    console.log(`\n⚠️  Warning: Could not copy cursor rules: ${error.message}`);
    console.log(
      '   You can manually copy them from node_modules/dastro/.cursor/rules/',
    );
  }
}

function getPackageVersion() {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
  );
  return packageJson.version;
}

function getLatestRemoteVersionTag() {
  const remoteTags = execSync(
    'git ls-remote --tags git@github.com:gridonic/dastro.git',
    { encoding: 'utf8' },
  );
  const versionTags = remoteTags
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split('\t');
      return parts[1]?.replace('refs/tags/', '');
    })
    .filter((tag) => tag && tag.match(/^v\d+\.\d+\.\d+$/))
    .sort((a, b) => {
      const versionA = a.replace('v', '').split('.').map(Number);
      const versionB = b.replace('v', '').split('.').map(Number);
      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const numA = versionA[i] || 0;
        const numB = versionB[i] || 0;
        if (numA !== numB) return numB - numA;
      }
      return 0;
    });

  if (versionTags.length === 0) {
    throw new Error(
      'No valid version tags found, please update manually: npm install dastro@github:gridonic/dastro#vX.Y.Z',
    );
  }

  return versionTags[0];
}
