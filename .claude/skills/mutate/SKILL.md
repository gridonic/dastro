---
name: mutate
description: Mutation testing improvement cycle using Stryker. Run mutation tests, identify weakest files, write targeted tests to kill survived mutants, verify score improvement. Use when the user invokes /mutate, wants to improve mutation coverage, or mentions Stryker, mutation testing, or mutation score.
---

# Mutation Testing

**Usage:** `/mutate` (auto-pick file) or `/mutate src/path/file.ts` (target specific file)

## Tests

### What is a good test

You can look that up in the existing tdd skill. You can ignore the workflow there but just
look up the content from test.md

## Workflow

### Step 1 — Run Stryker

```bash
npx stryker run
```

Use 10-minute timeout. Incremental cache makes re-runs fast.

### Step 2 — Parse clear-text output

Extract from Stryker's clear-text reporter output:
- **Per-file table:** file path, mutation score %, killed count, survived count, no-coverage count
- **Survived mutant diffs:** file path, line number, mutation type, before/after code

### Step 3 — Select best candidate file

If user passed an argument (e.g. `/mutate src/core/context.ts`), use that file directly. Otherwise apply this priority:

1. Skip files with 100% mutation score
2. **Prefer partially-tested files** (survived > 0 AND killed > 0) — surgical improvements
3. Among those, pick the file with the most survived mutants
4. If all files have zero coverage, pick the smallest file (fewest lines)

Output your reasoning for the choice.

### Step 4 — Examine candidate

- Read the source file
- Read the existing test file if one exists (co-located: `foo.ts` → `foo.test.ts`)
- Collect all survived mutant diffs for this file from Step 2

### Step 5 — Design tests

- For each survived mutant, determine what assertion would kill it
- Group related mutants into logical test cases
- Consider edge cases the mutants reveal

### Step 6 — Write tests

Follow project conventions:

- **Location:** co-located at `src/path/foo.test.ts`
- **Imports:** `{ describe, test, expect }` from `vitest`
- **Core logic:** use `dastroTest()` from `../../test/_testing-core/dastro-test.ts` (adjust relative path)
- **Components:** use `dastroContainerTest()`
- **Pure utility functions:** import and test directly
- **Existing files:** append new `describe`/`test` blocks; do not duplicate existing tests
- **New files:** create with same structure as existing test files in the project

### Step 7 — Verify improvement

Run Stryker scoped to the candidate file only:

```bash
npx stryker run --mutate "src/path/candidate.ts"
```

Use 10-minute timeout. Report:
- Previous score → new score
- Number of mutants killed by the new tests
- Any remaining survived mutants (briefly note what they test)
- Brief summary of the tests you wrote or changed.
