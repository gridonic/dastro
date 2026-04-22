# Subagent prompt template

Copy this block into each Agent prompt, replacing `{REPO}`, `{CURRENT_VERSION}`, `{TARGET_VERSION}`, `{GITHUB_URL}`.

---

## Prompt

You are upgrading the Gridonic project **{REPO}** from dastro v{CURRENT_VERSION} to v{TARGET_VERSION}.

### Step 1 — Clone & branch

```bash
mkdir -p /tmp/boilerplate-upgrade
cd /tmp/boilerplate-upgrade
gh repo clone gridonic/{REPO} -- --depth=50
cd {REPO}
git checkout -b upgrade/dastro-{TARGET_VERSION}
```

**Branch name** must be `upgrade/dastro-<version>` (not `feat/...`). Netlify auto-deploys `feat/*` branches on push; `upgrade/*` branches only deploy via the PR preview, which is what we want.

### Step 2 — Prepare env, install & upgrade

Copy `.env.example` to `.env` **before** `npm install`. Several repos run GraphQL codegen during `postinstall` / build, which needs DatoCMS credentials from `.env` to succeed. The example values are enough for the upgrade flow and build verification.

```bash
[ -f .env.example ] && cp .env.example .env
npm install
npx github:gridonic/dastro upgrade
```

**IMPORTANT**: Always `npx github:gridonic/dastro` — never `npx dastro`.

Capture the full output. It will list:
- The new version installed
- Any patches to apply (printed to console, NOT applied to disk)

Then update all minor/patch dependencies:

```bash
npm update --save
```

Update `.node-version` to match dastro's required version:

```bash
cp node_modules/dastro/.node-version .node-version
```

Commit this upgrade step:

```bash
git add -A
git commit -m "chore: upgrade dastro to v{TARGET_VERSION}"
```

### Step 3 — Apply patches

The dastro upgrade prints patches to console. There are two types:

#### `.patch` files (git-style unified diffs)
- Try applying with `git apply`. If it fails (due to project-specific modifications), apply manually by reading the diff and editing files.
- **Before applying**: review the target files in the project. If the project has diverged significantly from boilerplate defaults (custom logic, different structure), flag the patch as risky in your report rather than blindly applying it.

#### `.instruction.patch` files (markdown instructions)
- These contain step-by-step manual instructions (e.g., "bump dependency X", "move config key Y").
- Follow each instruction. Check if the instruction is already satisfied (e.g., dependency already at the right version) — skip if so.
- **Safety check**: if an instruction would overwrite project-specific customizations, flag it in the report and apply conservatively.

**Commit each patch separately:**

```bash
git add -A
git commit -m "chore: apply patch v<PATCH_VERSION> — <short description>"
```

### Step 4 — Verify build

```bash
npm run build
```

If the build fails:
- Try to fix obvious issues (import paths, config changes).
- Commit fixes separately: `git commit -m "fix: resolve build error after upgrade"`
- If unfixable, note in report.

### Step 5 — Push & create PR

```bash
git push -u origin upgrade/dastro-{TARGET_VERSION}
```

Create a PR:

```bash
gh pr create --title "chore: upgrade dastro to v{TARGET_VERSION}" --body "$(cat <<'EOF'
## Summary

- Upgraded dastro from v{CURRENT_VERSION} to v{TARGET_VERSION}
- Applied patches: <list or "none">

## Patches applied

<for each patch, one bullet: version + what it did>

## Warnings

<any flagged risks, skipped patches, build issues>

## Test plan

- [ ] Check Netlify preview deployment
- [ ] Verify site renders correctly
- [ ] Check CMS integration still works

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 6 — Report

Return a structured report:

```
REPO: {REPO}
FROM: {CURRENT_VERSION}
TO: {TARGET_VERSION}
BRANCH: upgrade/dastro-{TARGET_VERSION}
PR: <PR URL>
PATCHES_APPLIED: <list>
PATCHES_SKIPPED: <list with reasons>
BUILD: pass|fail
WARNINGS: <any issues>
```
