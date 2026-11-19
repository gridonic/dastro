// `dastro worktree-setup`: make a fresh git worktree of a dastro project usable.
// Links the files listed in `.worktreeinclude` (default: `.env`) from the main
// checkout and installs the git hooks. Run after `npm ci` in the worktree.
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
} from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';


export const DEFAULT_INCLUDES = ['.env'];

// One path per line; blank lines and `#` comments skipped. Glob patterns are
// reported, not expanded.
export function parseWorktreeInclude(content) {
  const paths = [];
  const skipped = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (/[*?[\]!]/.test(line)) {
      skipped.push(line);
      continue;
    }
    paths.push(line.replace(/^\/+/, '').replace(/\/+$/, ''));
  }
  return { paths, skipped };
}

// First entry of `git worktree list --porcelain` is the main checkout.
export function mainWorktreeFrom(porcelain) {
  const match = porcelain.match(/^worktree (.+)$/m);
  return match ? match[1] : null;
}

// lstat: a broken symlink still counts as present
const present = (path) => {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};

export function worktreeSetup(cwd = process.cwd()) {
  const top = execSync('git rev-parse --show-toplevel', { cwd }).toString().trim();
  const main = mainWorktreeFrom(
    execSync('git worktree list --porcelain', { cwd }).toString(),
  );
  if (!main) throw new Error('Could not determine the main checkout.');

  if (realpathSync(main) === realpathSync(top)) {
    console.log('ℹ️  This is the main checkout; nothing to link.');
  } else {
    const includeFile = join(top, '.worktreeinclude');
    const { paths, skipped } = existsSync(includeFile)
      ? parseWorktreeInclude(readFileSync(includeFile, 'utf8'))
      : { paths: DEFAULT_INCLUDES, skipped: [] };

    for (const pattern of skipped) {
      console.log(`⚠️  Skipped glob in .worktreeinclude (list plain paths): ${pattern}`);
    }
    for (const path of paths) {
      const source = join(main, path);
      const target = join(top, path);
      if (present(target)) {
        console.log(`✔ ${path} already present`);
      } else if (!existsSync(source)) {
        console.log(`⚠️  ${path} missing in the main checkout (${main})`);
      } else {
        mkdirSync(dirname(target), { recursive: true });
        symlinkSync(source, target);
        console.log(`🔗 ${path} → ${source}`);
      }
    }
  }

  if (!existsSync(join(top, 'node_modules'))) {
    console.log('⚠️  node_modules missing: run `npm ci` first, then this command again.');
    process.exitCode = 1;
    return;
  }
  execSync('npx lefthook install', { cwd: top, stdio: 'inherit' });
  console.log('✅ Worktree ready.');
}
