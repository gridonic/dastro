<!-- @dastro:managed -->
# Coding standards

How code in this project is written; review diffs against every rule here. Rules of a `.cursor/rules/` file named below count as part of this document.

## Types

- Import DatoCMS types from `@generated/datocms.types.ts`.
- Regenerate them with `npm run dato:generate-types` after any DatoCMS schema change and after any `.gql` edit, so components compile against the current fragments.

## GraphQL

- Module fragments (name, folder, link fragments, where they are registered): `.cursor/rules/dastro-module-structure.mdc`.

## Components rendering CMS data

- **Structured text**: render with `DefaultStructuredText` from `dastro/components`, or with the project's wrapper component where one exists (e.g. `TextBlock`).
- **Empty structured text**: guard with `!isEmptyDocument(field)` from `datocms-structured-text-utils`. It covers `null` and `undefined`, and a document that is present can still be empty.
- **Links**: `LinkFragment` renders through `<Link link={…} />` from `@/components/link/Link.astro`; `RecordLinkFragment` through `<RecordLink record={…} />` from `dastro/components`.
- **Media**: render through `<MediaAsset data={…} aspectRatio={w / h} />` from `dastro/components`, `w` and `h` being the `imgixParams` dimensions of the fragment.
- **Header media**: `MediaAsset` in a header module carries `priority={true}`.
- **Priority media per viewport**: a `priority` asset shown on one viewport only (`_hidden-vs`, `_hidden-vl`) carries `sizes` with width `0` for the viewport that hides it, e.g. `sizes="(max-width: 899px) 0, 84vw"` — otherwise the hidden variant is preloaded too.

## Styling

- **Naming**: RSCSS; a component class has at least two words, dash-separated. Full rules in `.cursor/rules/rscss.mdc`, if present.
- **Typography**: font types from `_font-types.scss`.
- **Layout**: the grid from `_ui-grid.scss`.

## Localization

- Take locale URL prefixes from `localePrefix(locale)` and `lang` values from `localeLangTag(locale)`, both on `i18n()`; they follow the project's `i18n.localePrefix` setting.

## Boilerplate markers

- A `@boilerplate:init` comment marks placeholder content inherited from the boilerplate: replace the content with the project's own when working on that code.

## Commits

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) with a single-line subject; a body only where the change needs context or a breaking-change footer. Full specification in `.cursor/rules/commits.mdc`, if present.
<!-- @dastro:managed:end -->
