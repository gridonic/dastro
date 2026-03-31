#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import chalk from 'chalk';

const MAIN_BRANCH = 'main';
const PRODUCTION_BRANCH = 'production';
const CONFIRMATION_WORD = 'deploy-prod';

function git(command) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
}

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

async function deploy(rl) {
  console.log(`\n🚀 ${chalk.bold('Dastro Deploy to Production')}\n`);

  // 0. Verify this is a dastro project
  if (!existsSync(join(process.cwd(), 'node_modules', 'dastro'))) {
    console.log(
      '❌ This project does not have dastro installed. Deploy is only available for dastro projects.',
    );
    process.exit(1);
  }
  console.log('✅ Dastro project detected');

  // 1. Verify clean working tree
  const status = git('status --porcelain');
  if (status) {
    console.log(
      '❌ Working tree is not clean. Please commit or stash your changes first.\n',
    );
    console.log(status);
    process.exit(1);
  }
  console.log('✅ Working tree is clean');

  // 2. Verify current branch is main
  const currentBranch = git('rev-parse --abbrev-ref HEAD');
  if (currentBranch !== MAIN_BRANCH) {
    console.log(
      `❌ You must be on the ${chalk.bold(MAIN_BRANCH)} branch. Currently on ${chalk.bold(currentBranch)}.`,
    );
    process.exit(1);
  }
  console.log(`✅ On branch ${chalk.bold(MAIN_BRANCH)}`);

  // 3. Fetch latest from remote
  console.log('🔄 Fetching from origin...');
  execSync('git fetch origin', { stdio: ['ignore', 'inherit', 'inherit'] });

  // 4. Verify local main matches origin/main
  const localSha = git(`rev-parse ${MAIN_BRANCH}`);
  const remoteSha = git(`rev-parse origin/${MAIN_BRANCH}`);
  if (localSha !== remoteSha) {
    console.log(
      `\n❌ Local ${chalk.bold(MAIN_BRANCH)} does not match ${chalk.bold(`origin/${MAIN_BRANCH}`)}.`,
    );
    console.log('   Push or pull your changes before deploying.');
    process.exit(1);
  }
  console.log(`✅ Local ${chalk.bold(MAIN_BRANCH)} is up to date with remote`);

  // 5. Version bump
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`\n📦 Current version: ${chalk.bold(`v${currentVersion}`)}`);
  console.log('   Select version bump:');
  console.log(
    `   1) patch → ${chalk.bold(bumpVersion(currentVersion, 'patch'))}`,
  );
  console.log(
    `   2) minor → ${chalk.bold(bumpVersion(currentVersion, 'minor'))}`,
  );
  console.log(
    `   3) major → ${chalk.bold(bumpVersion(currentVersion, 'major'))}`,
  );
  console.log(`   4) keep  → ${chalk.bold(currentVersion)}`);

  const bumpChoice = await askQuestion('   Choice (1/2/3/4, default: 1): ');
  const bumpType =
    bumpChoice === '2'
      ? 'minor'
      : bumpChoice === '3'
        ? 'major'
        : bumpChoice === '4'
          ? 'keep'
          : 'patch';
  const newVersion =
    bumpType === 'keep'
      ? currentVersion
      : bumpVersion(currentVersion, bumpType);

  if (bumpType !== 'keep') {
    console.log(`\n🔄 Bumping version to ${chalk.bold(`v${newVersion}`)}...`);

    // Update package.json
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Update package-lock.json
    execSync('npm install --package-lock-only', { stdio: 'inherit' });

    // Commit and push the version bump
    execSync('git add package.json package-lock.json', { stdio: 'inherit' });
    execSync(`git commit -m "build(${newVersion}): version bump"`, {
      stdio: 'inherit',
    });
    execSync(`git push origin ${MAIN_BRANCH}`, { stdio: 'inherit' });
    console.log(
      `✅ Version bumped to ${chalk.bold(`v${newVersion}`)} and pushed to ${chalk.bold(MAIN_BRANCH)}`,
    );
  } else {
    console.log(`\n✅ Keeping version ${chalk.bold(`v${currentVersion}`)}`);
  }

  // 6. Confirmation prompt
  console.log(
    `\n⚠️  ${chalk.yellow.bold(`You are about to deploy v${newVersion} to production.`)}`,
  );
  const answer = await askQuestion(
    `   Type ${chalk.bold(CONFIRMATION_WORD)} to confirm: `,
  );
  if (answer !== CONFIRMATION_WORD) {
    console.log('\n❌ Deploy cancelled. Confirmation word is not correct');
    process.exit(1);
  }

  // 7. Push main to production
  console.log(
    `\n🚀 Pushing ${chalk.bold(MAIN_BRANCH)} → ${chalk.bold(`origin/${PRODUCTION_BRANCH}`)}...`,
  );
  try {
    execSync(`git push origin ${MAIN_BRANCH}:${PRODUCTION_BRANCH}`, {
      stdio: 'inherit',
    });
  } catch {
    console.log(
      `\n❌ Push failed. The ${chalk.bold(PRODUCTION_BRANCH)} branch may have diverged from ${chalk.bold(MAIN_BRANCH)}.`,
    );
    console.log('   Resolve this manually before deploying.');
    process.exit(1);
  }

  console.log(
    `\n✅ ${chalk.green.bold(`Successfully deployed v${newVersion} to production!`)}`,
  );

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

export { deploy };
