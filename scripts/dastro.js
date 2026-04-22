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
import { createInterface } from 'readline';
import chalk from 'chalk';
import { createProject } from './create.js';
import { deploy } from './deploy.js';

const command = process.argv[2];

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runCommand() {
  switch (command) {
    case 'create':
      await createProject(rl);
      break;
    case 'link':
      execSync('npm link dastro', { stdio: 'inherit' });
      break;
    case 'unlink':
      execSync('npm unlink dastro --no-save', { stdio: 'inherit' });
      execSync('npm ci', { stdio: 'inherit' });
      break;
    case 'upgrade':
      const currentVersion = getPackageVersion();
      console.log(`ℹ️  Current version: v${currentVersion}`);

      const latestTag = getLatestRemoteVersionTag();
      console.log(`ℹ️  Latest version: ${latestTag}\n`);

      // Detect major dependency bumps in dastro's peers *and* its own deps
      // (e.g. Astro 5 → 6, astro-embed 0.9 → 0.13). If the consumer also
      // declares these directly, install them together with dastro in a single
      // `npm install` so npm can resolve the new ranges instead of failing.
      const depBumps = await detectMajorBumps(latestTag);
      if (depBumps.length > 0) {
        console.log(chalk.yellow('⚠️  Major dependency bump(s) detected:'));
        for (const b of depBumps) {
          console.log(
            chalk.yellow(`   ${b.name}: ${b.currentRange} → ${b.newRange}`),
          );
        }
        console.log(
          chalk.yellow(
            '   Installing these together with dastro so peer ranges resolve.\n',
          ),
        );
      }

      const packagesToInstall = [
        `dastro@github:gridonic/dastro#${latestTag}`,
        ...depBumps.map((b) => `${b.name}@${b.newRange}`),
      ];
      const installCmd = `npm install ${packagesToInstall
        .map((p) => `"${p}"`)
        .join(' ')}`;
      console.log(`🔄 Running: ${installCmd}`);
      execSync(installCmd, { stdio: 'inherit' });
      console.log(`\n✅ Upgraded to ${latestTag}`);

      // Copy cursor rules from the installed dastro package
      copyCursorRules();

      // Apply patches for versions between current and latest
      applyPatches(currentVersion);
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
    case 'deploy':
      await deploy(rl);
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
      console.log('  deploy - deploy main branch to production');
      console.log('  info - show current and latest version information');
      break;
  }
}

runCommand()
  .catch(console.error)
  .finally(() => {
    rl.close();
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

function printPatchInstructions(patchContent) {
  const files = patchContent.split(/^diff --git /m).filter(Boolean);

  for (const file of files) {
    const fileMatch = file.match(/^a\/(.+?) b\//);
    if (!fileMatch) continue;

    const filePath = fileMatch[1];
    console.log(chalk.bold.underline(`   File: ${filePath}`));

    console.log(chalk.green(file));
    // const hunks = file.split(/^@@ .+ @@.*$/m).slice(1);
    //
    // for (const hunk of hunks) {
    //   const lines = hunk.split('\n');
    //   const removals = [];
    //   const additions = [];
    //
    //   for (const line of lines) {
    //     if (line.startsWith('-')) removals.push(line.slice(1));
    //     else if (line.startsWith('+')) additions.push(line.slice(1));
    //   }
    //
    //   if (removals.length > 0) {
    //     console.log(chalk.red(`\n   Replace:`));
    //     for (const line of removals) console.log(chalk.red(`   - ${line}`));
    //   }
    //
    //   if (additions.length > 0) {
    //     console.log(
    //       chalk.green(`\n   ${removals.length > 0 ? 'With:' : 'Add:'}`),
    //     );
    //     for (const line of additions) console.log(chalk.green(`   + ${line}`));
    //   }
    // }
    //
    // console.log();
  }
}

function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

function applyPatches(previousVersion) {
  const patchesDir = join(__dirname, 'patches');

  if (!existsSync(patchesDir)) {
    return;
  }

  const patches = readdirSync(patchesDir)
    .filter((f) => f.endsWith('.patch'))
    .map((f) => {
      const isInstruction = f.endsWith('.instruction.patch');
      return {
        file: f,
        version: f.replace(
          isInstruction ? '.instruction.patch' : '.patch',
          '',
        ),
        isInstruction,
      };
    })
    .filter((p) => compareVersions(p.version, previousVersion) > 0)
    .sort((a, b) => compareVersions(a.version, b.version));

  if (patches.length === 0) {
    console.log('\nℹ️  No patches to apply.');
    return;
  }

  console.log(`\n📦 Found ${patches.length} patch(es) to apply:\n`);

  for (const patch of patches) {
    const patchPath = join(patchesDir, patch.file);
    const patchContent = readFileSync(patchPath, 'utf8');
    const subject = patch.isInstruction
      ? patchContent.split('\n')[0].replace(/^#\s*/, '').trim() ||
        'Manual instructions'
      : patchContent.match(/^Subject: \[PATCH\] (.+)$/m)?.[1] ||
        'No description';

    console.log(
      `📋 ${patch.isInstruction ? 'Instructions' : 'Patch'} v${patch.version}: ${subject}\n`,
    );
    if (patch.isInstruction) {
      console.log(patchContent.trim());
      console.log();
    } else {
      printPatchInstructions(patchContent);
    }
  }
}

async function detectMajorBumps(latestTag) {
  let currentDeps, newDeps;
  try {
    currentDeps = getCurrentDastroDeps();
    newDeps = await fetchRemoteDastroDeps(latestTag);
  } catch (err) {
    console.log(
      chalk.yellow(
        `⚠️  Could not inspect dastro dependencies automatically: ${err.message}`,
      ),
    );
    return [];
  }

  let consumerPkg;
  try {
    consumerPkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    );
  } catch {
    return [];
  }
  const consumerDeps = {
    ...consumerPkg.dependencies,
    ...consumerPkg.devDependencies,
  };

  const bumps = [];
  for (const [name, newRange] of Object.entries(newDeps)) {
    if (!consumerDeps[name]) continue;
    const currentRange = currentDeps[name];
    if (!currentRange) continue;
    if (isMajorBump(currentRange, newRange)) {
      bumps.push({ name, currentRange, newRange });
    }
  }
  return bumps;
}

function getCurrentDastroDeps() {
  const pkg = JSON.parse(
    readFileSync(
      join(process.cwd(), 'node_modules', 'dastro', 'package.json'),
      'utf8',
    ),
  );
  return { ...pkg.peerDependencies, ...pkg.dependencies };
}

async function fetchRemoteDastroDeps(tag) {
  const url = `https://raw.githubusercontent.com/gridonic/dastro/${tag}/package.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const pkg = await res.json();
  return { ...pkg.peerDependencies, ...pkg.dependencies };
}

// Extracts [major, minor] from a range. For 0.x versions, the minor is the
// breaking segment per semver convention, so `^0.9` → `^0.13` is a major bump.
function parseRange(range) {
  const match = String(range).match(/(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2] ?? 0) };
}

function isMajorBump(currentRange, newRange) {
  const current = parseRange(currentRange);
  const next = parseRange(newRange);
  if (!current || !next) return false;
  if (current.major === 0 && next.major === 0) return next.minor > current.minor;
  return next.major > current.major;
}

function getPackageVersion() {
  const packageJson = JSON.parse(
    readFileSync(
      join(process.cwd(), 'node_modules', 'dastro', 'package.json'),
      'utf8',
    ),
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
