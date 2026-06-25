#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const STATE_DIR = '.dastro';
const STATE_FILE = 'state.json';
const STATE_PATH = join(STATE_DIR, STATE_FILE);

// Keys persisted to .dastro/state.json. Secrets (the CMA admin token) are
// NEVER stored here — state.json is gitignored but still local plaintext.
const PERSISTED_KEYS = ['readableName', 'netlifySiteName', 'ghOrg'];

// A project is a dastro project when its package.json declares `dastro` as a
// dependency. This also matches pre-refactor projects (which lack
// .dastro/state.json), so they can still be resumed.
export function isDastroProject(dir) {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return 'dastro' in deps;
  } catch {
    return false;
  }
}

function readState(projectPath) {
  const p = join(projectPath, STATE_PATH);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(projectPath, state) {
  const dir = join(projectPath, STATE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(projectPath, STATE_PATH),
    JSON.stringify(state, null, 2) + '\n',
  );
}

function readPackageName(projectPath) {
  const p = join(projectPath, 'package.json');
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf8')).name || undefined;
  } catch {
    return undefined;
  }
}

function readEnvVar(projectPath, key) {
  for (const file of ['.env', '.env.example']) {
    const p = join(projectPath, file);
    if (!existsSync(p)) continue;
    const match = readFileSync(p, 'utf8').match(
      new RegExp(`^${key}=(.*)$`, 'm'),
    );
    if (match && match[1].trim()) return match[1].trim();
  }
  return '';
}

function readGitOrg(projectPath) {
  try {
    const url = execSync('git remote get-url origin', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    // git@github.com:gridonic/repo.git  |  https://github.com/gridonic/repo.git
    const match = url.match(/[:/]([^/]+)\/[^/]+?(?:\.git)?$/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Builds a per-project context that resolves the inputs every step needs,
 * memoizing each value so a full `create` run never double-prompts.
 *
 * Each input is resolved through tiers (disk → state.json → prompt). `resolve`
 * is allowed to prompt; `peek`/`has` only inspect disk + already-known values
 * and never prompt (used to decide whether an optional phase applies).
 *
 * @param {string} projectPath absolute path to the project root
 * @param {import('readline').Interface} rl
 * @param {Record<string, string>} [seed] values known up-front (fresh create)
 */
export function createContext(projectPath, rl, seed = {}) {
  const cache = { ...seed };
  let state = readState(projectPath);
  const notes = [];

  const ask = (question) =>
    new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

  const askWithDefault = (question, def) =>
    new Promise((resolve) =>
      rl.question(`${question} (${def}): `, (a) => resolve(a.trim() || def)),
    );

  const askYesNo = (question, defaultYes = true) => {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    return new Promise((resolve) =>
      rl.question(`${question} [${hint}]: `, (a) => {
        const t = a.trim().toLowerCase();
        if (t === '') resolve(defaultYes);
        else resolve(t.startsWith('y'));
      }),
    );
  };

  // Non-prompting lookup: cache/seed → disk/state only. Returns '' / undefined
  // when a prompt would be required.
  function peek(key) {
    if (key in cache) return cache[key];
    switch (key) {
      case 'slug':
        return readPackageName(projectPath);
      case 'datoToken':
        return readEnvVar(projectPath, 'DATO_CMS_TOKEN');
      case 'cmaToken':
        return readEnvVar(projectPath, 'DATO_CMS_CMA_TOKEN');
      case 'ghOrg':
        return readGitOrg(projectPath) || state.ghOrg;
      case 'readableName':
        return state.readableName;
      case 'netlifySiteName':
        return state.netlifySiteName;
      default:
        return undefined;
    }
  }

  // True when a value is available without prompting.
  function has(key) {
    const v = peek(key);
    return typeof v === 'string' ? v.trim().length > 0 : v != null;
  }

  const resolvers = {
    slug: async () =>
      readPackageName(projectPath) ||
      (await ask('Project slug (npm package name): ')),
    datoToken: async () => readEnvVar(projectPath, 'DATO_CMS_TOKEN'),
    cmaToken: async () =>
      readEnvVar(projectPath, 'DATO_CMS_CMA_TOKEN') ||
      (await askWithDefault(
        'Enter your DatoCMS CMA token (admin token). Leave blank to skip DatoCMS steps',
        '',
      )),
    ghOrg: async () =>
      readGitOrg(projectPath) ||
      state.ghOrg ||
      (await askWithDefault('GitHub organization', 'gridonic')),
    readableName: async () =>
      state.readableName ||
      (await ask(
        "Enter a readable name for your project (e.g., 'Gridonic Website'): ",
      )),
    netlifySiteName: async () =>
      state.netlifySiteName ||
      (await askWithDefault(
        'Netlify site name (must be globally unique on netlify.app)',
        await resolve('slug'),
      )),
  };

  async function resolve(keys) {
    const single = !Array.isArray(keys);
    const arr = single ? [keys] : keys;
    const out = {};
    for (const key of arr) {
      if (!(key in cache)) {
        if (!resolvers[key]) throw new Error(`Unknown context key: ${key}`);
        cache[key] = await resolvers[key]();
      }
      out[key] = cache[key];
    }
    return single ? out[keys] : out;
  }

  function persist(values) {
    let changed = false;
    for (const key of PERSISTED_KEYS) {
      const v = values[key];
      if (v == null) continue;
      cache[key] = v;
      if (v !== '' && state[key] !== v) {
        state = { ...state, [key]: v };
        changed = true;
      }
    }
    if (changed) writeState(projectPath, state);
  }

  function note(message) {
    if (!notes.includes(message)) notes.push(message);
  }

  return {
    projectPath,
    resolve,
    peek,
    has,
    persist,
    note,
    notes,
    ask,
    askWithDefault,
    askYesNo,
  };
}
