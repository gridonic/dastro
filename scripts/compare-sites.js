#!/usr/bin/env node

// Compares what two running instances of the same project serve, e.g. before
// and after a dastro upgrade: status, redirects, relevant headers and the
// normalized HTML / XML of every sitemap URL plus a few fixed probes.
//
//   node scripts/compare-sites.js <base-url> <candidate-url> [--out <dir>] [--paths <file>]
//
// Run it once with the same URL on both sides first: whatever differs then is
// noise the normalization misses, not a regression.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const ACCEPT_LANGUAGES = [
  null,
  'de-CH,de;q=0.9,en;q=0.8',
  'fr-CH,fr;q=0.9',
  'it',
  'en-US,en;q=0.9',
  'ja',
];

const COMPARED_HEADERS = [
  'location',
  'content-type',
  'content-language',
  'cache-control',
  'netlify-cdn-cache-control',
  'netlify-vary',
  'x-robots-tag',
  'x-gridonic-cache-provider',
];

const CONCURRENCY = 4;

const args = process.argv.slice(2);
const [baseUrl, candidateUrl] = args
  .filter((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--'))
  .map((url) => url.replace(/\/$/, ''));
const option = (name) => args[args.indexOf(`--${name}`) + 1];
const outDir = args.includes('--out') ? option('out') : 'compare-sites-out';
const pathsFile = args.includes('--paths') ? option('paths') : null;

if (!baseUrl || !candidateUrl) {
  console.error(
    'Usage: node scripts/compare-sites.js <base-url> <candidate-url> [--out <dir>] [--paths <file>]',
  );
  process.exit(1);
}

const paths = pathsFile
  ? readFileSync(pathsFile, 'utf8').split('\n').filter(Boolean)
  : await sitemapPaths(baseUrl);

const probes = [
  ...ACCEPT_LANGUAGES.map((acceptLanguage) => ({ path: '/', acceptLanguage })),
  { path: '/?utm_source=compare' },
  { path: '/sitemap.xml?bypass_indexing_prevention=true' },
  { path: '/robots.txt' },
  { path: '/this-page-does-not-exist-compare-sites' },
  ...paths.filter((path) => path !== '/').map((path) => ({ path })),
];

console.log(
  `Comparing ${probes.length} requests: ${baseUrl} (base) vs ${candidateUrl} (candidate)`,
);

rmSync(outDir, { recursive: true, force: true });
const differing = [];
const baseStatuses = {};

for (let i = 0; i < probes.length; i += CONCURRENCY) {
  await Promise.all(
    probes.slice(i, i + CONCURRENCY).map(async (probe) => {
      const [base, candidate] = await Promise.all([
        snapshot(baseUrl, probe),
        snapshot(candidateUrl, probe),
      ]);
      const status = base.split('\n')[0];
      (baseStatuses[status] ??= []).push(probeLabel(probe));

      if (base !== candidate) {
        const name = fileName(probe);
        for (const [side, content] of [
          ['base', base],
          ['candidate', candidate],
        ]) {
          mkdirSync(join(outDir, side), { recursive: true });
          writeFileSync(join(outDir, side, name), content);
        }
        differing.push(probeLabel(probe));
      }
    }),
  );
  process.stdout.write(
    `\r${Math.min(i + CONCURRENCY, probes.length)}/${probes.length}`,
  );
}

console.log('\n');

// Equal error pages prove nothing: show what the base actually served
console.log('Base responses:');
for (const [status, labels] of Object.entries(baseStatuses).sort()) {
  const errors = /: [45]\d\d$|FETCH FAILED/.test(status);
  console.log(
    `  ${status} × ${labels.length}${errors ? `: ${labels.sort().join(', ')}` : ''}`,
  );
}
console.log();

if (differing.length === 0) {
  console.log(`✅ No differences in ${probes.length} requests`);
  process.exit(0);
}

console.log(`❌ ${differing.length} of ${probes.length} requests differ:`);
differing.sort().forEach((label) => console.log(`  ${label}`));
console.log(
  `\nInspect: git diff --no-index ${join(outDir, 'base')} ${join(outDir, 'candidate')}`,
);
process.exit(1);

async function sitemapPaths(origin) {
  const response = await fetch(
    `${origin}/sitemap.xml?bypass_indexing_prevention=true`,
  );
  const xml = await response.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );

  if (locs.length === 0) {
    console.error(
      `⚠️  ${origin}/sitemap.xml lists no URLs; only the fixed probes are compared. Pass --paths <file> for more.`,
    );
  }

  return [...new Set(locs)];
}

async function snapshot(origin, { path, acceptLanguage }) {
  let response;
  try {
    response = await fetch(`${origin}${path}`, {
      redirect: 'manual',
      headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : {},
    });
  } catch (error) {
    return `FETCH FAILED: ${error.cause?.code ?? error.message}\n`;
  }

  const headers = COMPARED_HEADERS.map((name) => [
    name,
    response.headers.get(name),
  ])
    .filter(([, value]) => value !== null)
    .map(([name, value]) => `${name}: ${normalize(value, origin)}`);

  const body = normalize(await response.text(), origin);

  return [`status: ${response.status}`, ...headers, '', body].join('\n');
}

// Removes what legitimately differs between two instances of the same site
function normalize(text, origin) {
  return (
    text
      .replaceAll(origin, 'ORIGIN')
      // Build and dev asset hashes, dev-only ids and paths
      .replace(
        /(\/_astro\/[^"'\s?]*?)[.-][A-Za-z0-9_-]{8}(\.[a-z0-9]+)/g,
        '$1$2',
      )
      .replace(/\?v=[0-9a-f]{8}/g, '')
      .replace(/ data-vite-dev-id="[^"]*"/g, '')
      .replace(/ data-astro-source-(file|loc)="[^"]*"/g, '')
      .replace(/<script>window\.__astro_dev_toolbar__ = .*?<\/script>/gs, '')
      .replace(/ data-astro-cid-[a-z0-9]+(="[^"]*")?/g, '')
      .replace(/ uid="[^"]*"/g, '')
      // Per-request ids, e.g. crypto.randomUUID() for aria-controls
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        'UUID',
      )
      .replace(/astro-island-[a-z0-9]+/g, 'astro-island')
      // One tag per line, so the diff shows the changed element
      .replace(/>\s*</g, '>\n<')
  );
}

function probeLabel({ path, acceptLanguage }) {
  return acceptLanguage ? `${path} [Accept-Language: ${acceptLanguage}]` : path;
}

function fileName(probe) {
  return (
    (probeLabel(probe)
      .replace(/[^a-zA-Z0-9.=-]+/g, '_')
      .replace(/^_|_$/g, '') || 'root') + '.txt'
  );
}
