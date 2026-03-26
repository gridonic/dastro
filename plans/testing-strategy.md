# Dastro Testing Strategy

**Goal:** Confidence in correctness across the full library surface.
**Target:** 80% mutation score (Stryker).
**Harness:** `dastroTest()` as primary test builder. Minimal mocking — only mock what you must (JWT, cookies, HTTP fetch). Test through real module boundaries.
**Prioritization:** CRAP scores guide which functions to test first within each phase.
**Stryker cadence:** Run after each phase to measure progress and identify weak spots.

---

## Phase 0 — Foundation (DONE)

- [x] Stryker + vitest runner setup
- [x] CRAP analysis script (`scripts/crap.js`)
- [x] `dastroTest()` and `dastroContainerTest()` helpers
- [x] Test coverage reporting (`.test/coverage/`)
- [x] Tests: `core/i18n.ts`, `core/routing.ts`, `core/caching.ts`
- [x] Tests: `datocms/draft-mode.ts`, `datocms/environment-switch.ts`
- [x] Tests: `util/route.util.ts`, `components/link/RecordLink.astro`

**Status:** 6 test files, 102 tests, ~2.4s runtime.

---

## Phase 1 — Core Completion

Finish testing the core logic layer + pure utility modules.

### Files to test

| File | LOC | Why | Notes |
|------|-----|-----|-------|
| `core/page.ts` | ~200 | Most complex untested file. Orchestrates rendering, module filtering, page record loading. | Tightly coupled to routing + datocms. Use `dastroTest()` with test fixtures. Mock `datoFetch` for GraphQL calls. |
| `core/translations.ts` | ~60 | Translation lookup with locale fallback. | Pure-ish — depends on `i18n()` which is already tested. Test through real `i18n`. |
| `core/context.ts` | ~100 | Factory that wires all modules together. | Integration test: call `buildDastroContext()` and verify all properties exist and are callable. |
| `datocms/visual-editing.ts` | ~30 | Feature flag (checks draft mode). | Trivial — test both states. |
| `structured-data/structured-data.utils.ts` | ~200 | Schema.org builder functions. | Pure builders. High testability. Depends on routing context (already tested). |

### Approach

1. Run CRAP analysis to rank functions by risk within these files.
2. Write tests starting with highest-CRAP functions.
3. Use `dastroTest()` for all tests — no module-level mocking.
4. Only mock: `datoFetch` (for page.ts GraphQL calls), JWT verification.

### Exit criteria

- All functions in listed files have at least one test path.
- Run Stryker. Record mutation score for these files.

---

## Phase 2 — HTTP Layer

Test the DatoCMS query wrapper and all API route handlers.

### Files to test

| File | Why | Notes |
|------|-----|-------|
| `datocms/datocms.ts` | Central GraphQL query execution. All data flows through here. | Mock HTTP fetch. Verify query construction, header injection (draft mode, environment), error handling. |
| `routes/cms/draft-mode/enable.ts` | Draft mode toggle endpoint. | Test request → cookie → redirect flow. |
| `routes/cms/draft-mode/disable.ts` | Draft mode disable. | Same pattern. |
| `routes/cms/environment/switch.ts` | Environment switching endpoint. | Test JWT creation, cookie setting, redirect. |
| `routes/cms/preview-links.ts` | Preview link generation for DatoCMS. | Test URL construction for different record types. |
| `routes/cms/seo-analysis.ts` | SEO metadata analysis endpoint. | Test response structure. |
| `routes/debug/routes.ts` | Debug route listing. | Test output format. |
| `routes/debug/system.ts` | System info endpoint. | Test output format. |
| `routes/sitemap.xml.ts` | Sitemap generation. | Test XML output, locale handling, page inclusion/exclusion. |
| `routes/robots.txt.ts` | Robots.txt generation. | Test output for different environments. |
| `middleware/html-streaming-prevention.middleware.ts` | Response buffering. | Test that streaming is disabled. |
| `middleware/request-logger.middleware.ts` | Request logging. | Test log output format. |

### Approach

1. For `datocms.ts`: mock `fetch` at the HTTP level, not the module level. Verify headers, query variables, error paths.
2. For routes: create a lightweight request/response helper if `dastroTest()` doesn't cover HTTP endpoints. May need to construct `APIContext` objects.
3. For middleware: test with mock `next()` functions.

### Exit criteria

- All route handlers have tests for happy path + error cases.
- Run Stryker. Record cumulative mutation score.

---

## Phase 3 — Components

Test Astro components using `dastroContainerTest()`.

### Files to test

All `.astro` components in `src/components/`:

- `layout/LayoutBase.astro`
- `media/ImageAsset.astro`, `VideoAsset.astro`, `MediaAsset.astro`, `VideoPlayer.astro`
- `module/Modules.astro`, `HeaderModule.astro`, `Module.astro`
- `link/RecordLink.astro` (extend existing tests)
- `debug/DebugView.astro`, `DebugGridContainer.astro`, `DebugInfo.astro`, etc.
- `common/DefaultStructuredText.astro`
- `content-link/ContentLink*.astro` + `contentLinkAttrs.ts`

### Approach

1. Use `dastroContainerTest()` for rendering.
2. Test: correct HTML output, prop handling, slot rendering, conditional rendering.
3. For `contentLinkAttrs.ts`: pure function, test without container.
4. Prioritize components by usage frequency in consuming projects.

### Exit criteria

- All exported components have at least smoke tests (render without error + basic output verification).
- Run Stryker. Record cumulative mutation score.

---

## Phase 4 — Cleanup & Target

Test remaining modules and close the gap to 80% mutation score.

### Files to test

| File | Notes |
|------|-------|
| `client/component.client.ts` | Custom element registration. May need jsdom/happy-dom. |
| `client/log.client.ts` | Client-side logging. |
| `netlify/daily-backup-handler.netlify.ts` | Netlify function. Mock fetch. |
| `integration/dastro.integration.ts` | Astro integration hooks. Hard to test — may need Astro test utils. |
| `integration/graphql.integration.ts` | GraphQL codegen config. |

### Approach

1. Run Stryker on full codebase. Identify survived mutants.
2. Use `/mutate` skill to target specific files with low scores.
3. Use CRAP analysis to prioritize remaining high-risk functions.
4. For hard-to-test files (integration/), decide: test or exclude from mutation target.

### Exit criteria

- 80% mutation score across `src/**/*.ts`.
- All public API exports have test coverage.
- CRAP scores below 30 for all functions (or consciously accepted exceptions).

---

## Principles

1. **Minimal mocking.** Mock JWT, cookies, HTTP fetch. Never mock internal module boundaries — test through real code.
2. **`dastroTest()` first.** Use the existing test builder. Only create module-level helpers if `dastroTest()` becomes a bottleneck.
3. **CRAP guides priority.** Within each phase, test highest-CRAP functions first. Don't enforce CRAP thresholds in CI.
4. **Stryker validates.** Mutation score is the measure of test effectiveness, not line coverage.
5. **Co-located tests.** Test files live next to source files (`foo.test.ts` beside `foo.ts`).
6. **No test-only refactoring.** Don't restructure code just to make it testable. If coupling makes testing hard, note it — that's useful signal for future refactoring, but not this effort's scope.
