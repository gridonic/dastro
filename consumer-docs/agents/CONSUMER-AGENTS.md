<!-- @dastro:managed -->
# AGENTS.md

## Project Overview

Headless website built with **Astro**, **DatoCMS**, and **[Dastro](https://github.com/gridonic/dastro)**.

## Common Commands

Run `npm run dato:generate-types` after any DatoCMS schema change before implementing new modules or page types.

## Cursor Rules (Dastro)

Detailed workflows live in `.cursor/rules/`. Read the relevant rule before starting a task.

| Task | Rule |
|------|------|
| Initialize a new project from the boilerplate | `dastro-init-project.mdc` |
| Add a module from DatoCMS | `dastro-create-modules.mdc` + `dastro-module-structure.mdc` |
| Add a page type from DatoCMS | `dastro-create-page-types.mdc` |
| Lint Astro components for common issues | `dastro-ai-linter.mdc` |

Dastro rules are synced automatically when running `dastro upgrade`.

## Conventions

- **Types**: Import generated types from `@generated/datocms.types.ts`.
- **Commits**: Follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — single-line subject, no body unless needed (see `commits.mdc`).
- **Styling**: Use RSCSS component naming (at least two words, dash-separated). See `rscss.mdc`. Typography via `_font-types.scss`, layout via `_ui-grid.scss`.
- **Localization**: `node_modules/dastro/consumer-docs/i18n.md` describes the `i18n` options (`localePrefix`, `languageFallbacks`, `localeCookie`, `xDefaultLocale`), the locale helpers (`localePrefix`, `localeLangTag`), root resolution (which locale the site root redirects to), the client helper `setLocaleCookie`, and the hreflang cluster. Take locale prefixes and `lang` values from the locale helpers.
- **Boilerplate markers**: Files may contain `@boilerplate:init` comments — these indicate placeholder content to adjust when forking this repo.

## Scope

- Only create git commits when explicitly asked.

## DatoCMS schema changes

- If not stated otherwise, apply schema changes **directly via the CMA** — migration files are not part of this project's workflow (nothing replays them). The audit trail is the schema manifest comment on the ticket.
- Rehearse each change set as a **throwaway script**: run it against a fresh fork of `main`, verify, run the same script against `main`, then discard it — never committed. One fork per ticket, destroyed at the end.
- Changing the primary `main` env in place is **sanctioned** while the project is pre-launch (placeholder content only).
- Destructive changes (deleting or retyping fields, blocks, models): export the affected records as JSON into the ticket before applying.

### DatoCMS handling
- Use the `datocms:datocms-cli` / `datocms-cma` skills via `npx datocms cma:script`. Use mcp as fallback only.
- Either the user is already authorized for the datocms cli or then auth comes from the profile in `datocms.config.json`; don't read `.env`.
- Scripts go in a gitignored `.tmp/` inside the repo.

## Dev server for browser testing

Verify changes in a real browser against your own dev server — the human's server (port 4321, HTTPS) stays theirs:

1. Start it through your harness's background-process facility and note the PID:

   ```bash
   ASTRO_DEV_BACKGROUND=1 LOCAL_DEVELOPMENT_SSL_DISABLED=true npx astro dev --port 4333 --ignore-lock
   ```

   Port taken? Count up: 4334, 4335, …
2. Poll `http://localhost:4333/_astro/status` until it returns `{"ok":true}` (a few seconds).
3. Test pages in the browser (Claude Code: chrome-devtools MCP — `new_page`, `take_snapshot`, `take_screenshot`). Leave the server running between checks.
4. At session end, stop your server with `kill <PID>`. `astro dev stop` stops the lock-file server — the human's.

Why each part of the command:

- `ASTRO_DEV_BACKGROUND=1` — opts out of Astro's AI-agent auto-detection, which would force `--background` mode; `--background` conflicts with `--ignore-lock` and refuses to start while another server holds the lock file (`.astro/dev.json`).
- `LOCAL_DEVELOPMENT_SSL_DISABLED=true` — serves plain HTTP; the default HTTPS uses local certs that headless browsers distrust.
- `--ignore-lock` — runs alongside the human's server, untracked: `astro dev stop`/`status`/`logs` can't see it, and its logs land in your background shell's output.

Type-checking is separate: run `npx astro check` on demand (`npm run dev` bundles a check watcher for humans). `astro preview --background` for production builds needs Astro ≥ 7.2.

## Verification

After changes, run the `dastro-verify` skill: it checks every sitemap URL and renders each page type, locale and module in a browser. Project-specific logic beyond CMS modules (forms, shop, search, …) is checked from `docs/agents/verify/<feature>.md`; update that file when you add or change such a feature.
<!-- @dastro:managed:end -->
