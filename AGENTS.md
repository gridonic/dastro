<!-- @dastro:managed -->
# AGENTS.md

Entry point for AI agents working on this Dastro project. For human setup and deployment, see [README.md](./README.md).

## Project Overview

Headless website built with **Astro**, **DatoCMS**, and **[Dastro](https://github.com/gridonic/dastro)**. Content comes from DatoCMS via GraphQL; pages and modules are rendered as Astro components.

## Key Directories

| Path | Purpose |
|------|---------|
| `src/components/header-modules/` | Header module components (`Header*` prefix) |
| `src/components/content-modules/` | Content module components (`Content*`, `Cta*`, `Teaser*`, etc.) |
| `src/components/page/` | Page-level components |
| `src/datocms/data/modules/` | GraphQL fragments for modules |
| `src/datocms/data/pages/` | GraphQL queries for page types |
| `src/datocms/data/core/` | Shared GraphQL fragments (`Link`, `Media`, `Record`, …) |
| `src/datocms/data/global/` | Global settings, navigation, routing |
| `src/config/` | App configuration (`dastro.config.ts`, `modules.config.ts`, `pages.config.ts`) |
| `.astro/generated/datocms.types.ts` | Generated TypeScript types from GraphQL |

## Common Commands

```bash
npm run dev                    # Start local dev server
npm run build                  # Type-check and build for production
npm run dato:generate-types    # Regenerate GraphQL types after schema changes
dastro upgrade                 # Upgrade Dastro and sync agent assets
```

Run `npm run dato:generate-types` after any DatoCMS schema change before implementing new modules or page types.

## Cursor Rules (Dastro)

Detailed workflows live in `.cursor/rules/`. Read the relevant rule before starting a task — do not duplicate or override them here.

| Task | Rule |
|------|------|
| Initialize a new project from the boilerplate | `dastro-init-project.mdc` |
| Add a module from DatoCMS | `dastro-create-modules.mdc` + `dastro-module-structure.mdc` |
| Add a page type from DatoCMS | `dastro-create-page-types.mdc` |
| Lint Astro components for common issues | `dastro-ai-linter.mdc` |

Dastro rules are synced automatically when running `dastro upgrade`.

## Conventions

- **Modules**: GraphQL fragment → Astro component → register in `src/config/modules.config.ts`. Header modules go in `header-modules/`, content modules in `content-modules/`.
- **Page types**: GraphQL query → page component → register in `src/config/pages.config.ts`.
- **Types**: Import generated types from `@generated/datocms.types.ts`.

## Scope

- Match existing patterns in neighboring files before introducing new abstractions.
- Keep changes focused; do not modify unrelated code.
- Only create git commits when explicitly asked.
<!-- @dastro:managed:end -->
