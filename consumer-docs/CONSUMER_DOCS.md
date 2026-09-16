# Consumer Docs

Docs shipped to **consumer projects** (projects that install dastro), not instructions for working on dastro itself. Edit them as the consumer's agent will read them: paths, commands, and conventions of a consumer project.

## Managed sync

`dastro upgrade` copies each managed doc into the consumer project. The mapping lives in `MANAGED_DOCS` in `scripts/dastro.js`.

| Source | Consumer target |
|--------|-----------------|
| `agents/CONSUMER-AGENTS.md` | `AGENTS.md` |

- Only the block between `<!-- @dastro:managed -->` and `<!-- @dastro:managed:end -->` syncs; consumer content outside it survives upgrades. Keep both markers in every source.
- A missing target gets the full source; a target without markers is left untouched.
- A missing `CLAUDE.md` is created containing `@AGENTS.md`, so Claude Code loads the same doc.
- Adding a doc: create it here with markers, then add a `MANAGED_DOCS` entry.
