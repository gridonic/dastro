# Deepen routing + i18n into single URL resolution module

## Goal

Merge `src/core/i18n.ts` (shallow, 55 lines) into `src/core/routing.ts`. They're two halves of one concept — every routing function calls i18n, and i18n's routing strategy is consumed only by routing. Split sync URL parsing from async page loading to make the regex testable.

## Design: Caller-Optimized + sync parseUrl

Single factory `routing(config)` returns flat object:

```typescript
// Primary
resolveRecordUrl(record: Linkable<T>, locale): string | null
slugFromRecord(rec, locale): string | undefined
parseUrl(url: string): ParsedUrl<T>              // NEW: sync, no I/O
pageRecordForUrl(context, url): Promise<ResolvedPage<T>>  // thin wrapper: parseUrl + load()
getAllRoutes(context): Promise<Route<T>[]>

// Secondary (absorbed from i18n)
defaultLocale, locales, routingStrategy
normalizedIsoLocale(locale, keepVariant?): string | null
normalizedSiteLocale(locale): T['SiteLocale'] | null
isDefaultLocale(locale): boolean
areLocalesEqual(a, b): boolean
findLocaleWithVariant(locale): string | undefined

// Metadata
pageDefinitionList(): PageDefinition<T>[]
pageRecordTypes(): PageRecordType<T>[]
slugify
```

Key types to add:
- `Linkable<T>` — minimal record shape for URL resolution (replaces inline `{ __typename, _allTranslatedSlugLocales?, parent? }`)
- `ParsedUrl<T>` — `{ locale, pathPrefix, fullSlug?, slug?, pageDefinition: PageDefinition<T> | null }`
- `ResolvedPage<T>` — `ParsedUrl<T> & { page: Page<T> | null }`

## Steps

### 1. Add types + `parseUrl` to routing.ts

- Add `Linkable<T>`, `ParsedUrl<T>`, `ResolvedPage<T>` type exports
- Extract sync parsing logic from `pageRecordForUrl` into new `parseUrl(url)` function
  - Regex construction, locale matching, path prefix lookup — all sync
  - No `context` param, no `pageDefinition.load()` call
- Make `pageRecordForUrl` a thin wrapper: calls `parseUrl`, then `pageDefinition.load()`

### 2. Absorb i18n into routing.ts

- Move all functions from `i18n.ts` into `routing()` closure (they're already called there)
- Remove the redundant `const { ... } = i18n(config)` call on line 92 of `pageRecordForUrl`
- Add i18n properties/methods to the routing return object (flat, not nested)
- Use `Linkable<T>` for `resolveRecordUrl` param type

### 3. Update callers

Files that import from both `routing` and `i18n`:
- `src/core/page.ts` (`renderPage`) — replace `i18n(config)` + `routing(config)` with single `routing(config)`
- `src/core/context.ts` — remove `i18n: () => i18n(dastroConfig)` from `buildDastroContext`
- `src/routes/sitemap.xml.ts` — if it uses i18n separately
- `src/routes/api/cms/preview-links.ts` — uses `normalizedSiteLocale`, `defaultLocale`
- `src/routes/api/cms/seo-analysis.ts` — uses locale utilities
- `src/routes/debug/routes.ts` — uses both routing + i18n

Files that import only `i18n`:
- `src/core/translations.ts` — only needs `messages` from config; change to read `config.i18n.messages` directly
- Any other — switch `i18n(config).foo()` to `routing(config).foo()`

### 4. Delete i18n.ts

- Remove `src/core/i18n.ts`
- Remove `i18n` from package exports if present in `src/index.ts`

### 5. Update tests

- Move `i18n.test.ts` assertions into `routing.test.ts` (test locale utils via `routing()`)
- Add `parseUrl` tests — this is the big win:
  - Root URL `/` → default locale, no slug
  - Locale prefix `/en` → locale=en
  - Simple page `/about-de` → default locale, slug=about-de
  - With path prefix `/en/topics/my-article` → locale=en, pathPrefix=topics, slug=my-article
  - Hierarchical `/en/topics/parent/child` → fullSlug=parent/child, slug=child
  - Ambiguous slug-as-prefix `/seiten` (the TODO edge case)
  - Trailing slashes, empty strings, unknown locales
  - Both routing strategies: prefix-except-default, prefix-always
- Delete `i18n.test.ts` after merging its assertions
- Existing `routing.test.ts` tests for `resolveRecordUrl` stay as-is (signature unchanged)
- Existing `pageRecordForUrl` tests stay but can be simplified (test `parseUrl` for parsing, test `pageRecordForUrl` only for the load integration)

### 6. Update context.ts + public API

- Remove `i18n` lazy initializer from `buildDastroContext`
- Ensure `routing()` return type is exported for consumers who type it
- Check `src/index.ts` — remove `i18n` export, ensure `routing` export covers locale utils

## Invariants

- `resolveRecordUrl` signature unchanged — zero migration for components like RecordLink
- `pageRecordForUrl` signature unchanged — callers don't break
- `getAllRoutes` signature unchanged
- `slugFromRecord` stays public (used by `renderErrorPage`)
- `messages` stays in `translations()` / `config.i18n.messages` — not on routing
- Module is stateless: `routing(config)` is a pure factory, no memoization needed

## Files touched

| File | Change |
|------|--------|
| `src/core/routing.ts` | Absorb i18n, add parseUrl, add types |
| `src/core/i18n.ts` | DELETE |
| `src/core/context.ts` | Remove i18n initializer |
| `src/core/page.ts` | Single routing() call in renderPage |
| `src/core/translations.ts` | Read config.i18n.messages directly |
| `src/index.ts` | Remove i18n export |
| `src/core/routing.test.ts` | Add parseUrl tests, absorb i18n tests |
| `src/core/i18n.test.ts` | DELETE |
| `src/routes/api/cms/preview-links.ts` | routing() instead of i18n() |
| `src/routes/api/cms/seo-analysis.ts` | routing() instead of i18n() |
| `src/routes/debug/routes.ts` | routing() instead of i18n() |
| `src/routes/sitemap.xml.ts` | routing() instead of i18n() |
