<!-- @dastro:managed -->
# AGENTS.md

Headless website built with **Astro**, **DatoCMS**, and **[Dastro](https://github.com/gridonic/dastro)**.

## Always

- **Commit** only when explicitly asked.
- **Verify** after changes with the `dastro-verify` skill. Project-specific logic beyond CMS modules (forms, shop, search, …) is checked from `docs/agents/verify/<feature>.md`; update that file when you add or change such a feature.
- **Upgrades** (`dastro upgrade`) overwrite this managed block and `.cursor/rules/dastro-*.mdc`; project-specific instructions go outside the markers and in other rule files.

## By task

Read the named file before starting.

- **New project** from the boilerplate: `.cursor/rules/dastro-init-project.mdc`
- **Module** from DatoCMS: `.cursor/rules/dastro-create-modules.mdc` + `.cursor/rules/dastro-module-structure.mdc`
- **Page type** from DatoCMS: `.cursor/rules/dastro-create-page-types.mdc`
- **Lint** of Astro components: `.cursor/rules/dastro-ai-linter.mdc`
- **DatoCMS schema change** or CMA script: `node_modules/dastro/consumer-docs/datocms-schema-changes.md`. `.env` stays unread.
- **Browser testing**: `node_modules/dastro/consumer-docs/dev-server.md`. The human's dev server (port 4321) stays theirs; start your own.
- **Localization** (`i18n` config, locale routing, hreflang): `node_modules/dastro/consumer-docs/i18n.md`

## Conventions

- **Types**: Import generated types from `@generated/datocms.types.ts`; regenerate them with `npm run dato:generate-types` after any DatoCMS schema change.
- **Commits**: Follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — single-line subject, no body unless needed (see `commits.mdc`).
- **Styling**: Use RSCSS component naming (at least two words, dash-separated). See `rscss.mdc`. Typography via `_font-types.scss`, layout via `_ui-grid.scss`.
- **Localization**: Take locale prefixes and `lang` values from the locale helpers (`localePrefix`, `localeLangTag`).
- **Boilerplate markers**: Files may contain `@boilerplate:init` comments — these indicate placeholder content to adjust when forking this repo.
<!-- @dastro:managed:end -->
