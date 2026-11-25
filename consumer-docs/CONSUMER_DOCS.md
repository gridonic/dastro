# Consumer Docs

Docs shipped to **consumer projects** (projects that install dastro), not instructions for working on dastro itself. Edit them as the consumer's agent will read them: paths, commands, and conventions of a consumer project.

## Managed sync

`dastro upgrade` copies each managed doc into the consumer project. The mapping lives in `MANAGED_DOCS` in `scripts/dastro.js`.

| Source | Consumer target |
|--------|-----------------|
| `agents/CONSUMER-AGENTS.md` | `AGENTS.md` |
| `agents/CONSUMER-CODING-STANDARDS.md` | `CODING_STANDARDS.md` |

- Only the block between `<!-- @dastro:managed -->` and `<!-- @dastro:managed:end -->` syncs; consumer content outside it survives upgrades. Keep both markers in every source.
- A missing target gets the full source; a target without markers is left untouched.
- A missing `CLAUDE.md` is created containing `@AGENTS.md`, so Claude Code loads the same doc.
- Adding a doc: create it here with markers, then add a `MANAGED_DOCS` entry.
- The upgrade that installs a release still runs the previous CLI with its `MANAGED_DOCS`, so a newly added doc reaches projects one upgrade late. Ship the copy command in that release's instruction patch.

## Reference docs

Not synced; read from the installed package (`node_modules/dastro/consumer-docs/`).

| Doc | Topic |
|-----|-------|
| `i18n.md` | `i18n` config options (`localePrefix`, `languageFallbacks`, `localeCookie`, `xDefaultLocale`), locale helpers, root resolution, `setLocaleCookie`, hreflang and noindex per locale |
| `datocms-schema-changes.md` | Applying DatoCMS schema changes via the CMA (throwaway script, fork rehearsal, export before destructive changes, manifest comment) and CLI handling (skills, auth, `.tmp/` scripts) |
| `dev-server.md` | Running an agent-owned dev server beside the human's for browser testing: start command with flag rationale, status poll, shutdown |
