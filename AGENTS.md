# Dastro

Astro + DatoCMS library and CLI, installed by consumer projects from git tags (`github:gridonic/dastro#vX.Y.Z`). No build step: `package.json` `exports` point at `src/` directly.

## Pointers

- **Library**: `src/`; public entry points in `package.json` `exports`. Tests sit beside the code (`*.test.ts`), helpers in `test/_testing-core/`.
- **CLI** (`dastro create|link|unlink|upgrade|radar|deploy|info`): `scripts/dastro.js`; project scaffolding in `scripts/create.js` and `scripts/steps/`.
- **Releasing**, beta releases, comparing projects across versions: `RELEASING.md`. Changelog: `CHANGELOG.md`.
- **Upgrade instructions** for consumer projects: `scripts/patches/X.Y.Z.instruction.patch`, printed by `dastro upgrade`.
- **Consumer docs** (shipped to projects, written for the consumer's agent): `consumer-docs/CONSUMER_DOCS.md`.

## Checks

`npm test` and `npx astro check --minimumFailingSeverity hint` (both run pre-commit via lefthook).
