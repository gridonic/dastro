---
name: dastro-upgrade-all
description: Batch-upgrade all Gridonic dastro boilerplate projects to the latest version. Fetches the boilerplate radar, clones each repo, runs dastro upgrade, applies patches, creates PRs. Use when user wants to upgrade all boilerplates, update dastro across projects, or run a radar-wide upgrade.
---

# Dastro Upgrade All

Batch-upgrade all Gridonic boilerplate projects tracked by the [Boilerplate Radar](https://boilerplate-radar.gridonic.io/).

**Each project is processed by a dedicated subagent** (fresh context per repo).

## Orchestrator workflow

### 1. Fetch radar data

Use WebFetch on `https://boilerplate-radar.gridonic.io/api/radar.json`.

Parse `repositories` array. Each entry has:
- `name`, `html_url`, `dastroVersion` (string|null), `archived` (bool)

### 2. Filter & report

- **Skip** archived repos and repos where `dastroVersion` is `null`.
- Print summary table: repo name, current dastroVersion, GitHub URL.
- Ask user to confirm before proceeding.

### 3. Determine target version

Fetch latest dastro version:

```bash
git ls-remote --tags https://github.com/gridonic/dastro.git | grep -oP 'v\K[\d.]+' | sort -V | tail -1
```

This is needed for the branch name `upgrade/dastro-<version>`.

### 4. Clean workspace

Before spawning subagents, wipe any leftover clones from a previous run:

```bash
rm -rf /tmp/boilerplate-upgrade
```

Do **not** clean up at the end — if a subagent fails, the local clone is the only artifact available to diagnose the failure. Fresh state is guaranteed on the next run instead.

### 5. Spawn one subagent per repo

Launch a **general-purpose Agent** per project. Pass it:
- The repo name and GitHub URL
- The current dastroVersion
- The target dastro version
- The full subagent instructions below

Run repos in parallel where practical (batch of 3-5 at a time).

### 6. Collect reports & summarize

Each subagent returns a structured report. Aggregate into a final summary table:

| Repo | From | To | Patches | PR | Status |
|------|------|----|---------|-----|--------|

Print the table + any errors/warnings.

---

## Subagent instructions

> Copy this block verbatim into each Agent prompt, substituting `{REPO}`, `{CURRENT_VERSION}`, `{TARGET_VERSION}`.

See [SUBAGENT.md](SUBAGENT.md) for the full subagent prompt template.
