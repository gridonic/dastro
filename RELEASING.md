# Releasing Dastro

Projects install dastro from git tags (`github:gridonic/dastro#vX.Y.Z`). `dastro upgrade` only picks tags matching `vX.Y.Z`, so a prerelease tag such as `v3.3.0-beta.1` reaches only the projects that pin it on purpose.

## Regular release

```bash
npm run release   # asks for the version and changelog entries, commits, tags
git push && git push origin vX.Y.Z
```

If the release needs manual steps in projects, add `scripts/patches/X.Y.Z.instruction.patch`. `dastro upgrade` prints every patch newer than the project's previous version.

## Beta release

Use a beta when a release touches code every project runs (routing, layout, sitemap, caching) and you want it running in real projects before everyone gets it.

### 1. Cut the beta

The version bump goes on a detached commit, never on the branch. The release script reads the branch's `package.json` version and does not accept prereleases, so a bumped branch would block the final release.

```bash
git switch feat/my-feature
git switch --detach
npm version X.Y.Z-beta.N --no-git-tag-version
git commit -am "build(X.Y.Z-beta.N): version bump"
git tag vX.Y.Z-beta.N
git push origin vX.Y.Z-beta.N
git switch feat/my-feature
```

The tag keeps the commit alive. The version inside the tag is what the Boilerplate Radar and `/api/debug/system` report, so beta projects show up as such.

For a fix: commit it on the branch, then cut `beta.N+1` the same way. Never move an existing tag, since lockfiles pin the commit.

### 2. Pin it in the beta projects

Pick the project that needs the feature plus at least one that does not use it.

```bash
npm install "dastro@github:gridonic/dastro#vX.Y.Z-beta.N"
```

Open the pull request as a draft marked "do not merge", so Netlify builds a deploy preview.

- Do not run `dastro upgrade` in a beta project: it would install the latest stable release, i.e. downgrade.
- The beta does not sync consumer docs or print instruction patches. Read `node_modules/dastro/consumer-docs/` and `scripts/patches/` by hand.
- If the local npm rewrites unrelated parts of `package-lock.json` (e.g. drops `libc` fields), keep only the dastro entries.

### 3. Collect evidence

`scripts/compare-upgrade.sh` compares what a project serves on two dastro versions: two throwaway worktrees of the project, one dev server each, then `scripts/compare-sites.js` over every sitemap URL, `/` with several `Accept-Language` headers, the sitemap, `robots.txt` and a 404. The project checkout is not touched. It needs the project's `.env` and generated types (`.astro/generated`).

```bash
# candidate: the branch as it is (the tarball is named after the branch's package.json version)
npm pack --pack-destination /tmp/dastro-compare
scripts/compare-upgrade.sh <project-dir> /tmp/dastro-compare/dastro-<version>.tgz 4351 github:gridonic/dastro#vPREVIOUS

# or the pushed beta tag
scripts/compare-upgrade.sh <project-dir> github:gridonic/dastro#vX.Y.Z-beta.N 4351 github:gridonic/dastro#vPREVIOUS
```

Run several projects in parallel with different ports (4351, 4361, …). The report and the diffs land in `/tmp/dastro-compare/<project>/`.

- Pass the previous release as base, so only the new release's changes show up.
- `REF=origin/main` compares a branch other than the project's checked-out `HEAD`.
- Read the "Base responses" summary first: if pages fail on both sides, the comparison proves nothing. Fix the project setup first.
- Each difference is either intended (list it in the changelog) or a bug (fix it, cut the next beta).

`compare-sites.js` also compares two deployments, e.g. a project's main branch deploy with its beta deploy preview:

```bash
node scripts/compare-sites.js https://main--<site>.netlify.app https://deploy-preview-<n>--<site>.netlify.app
```

Run it once with the same URL on both sides to see noise the normalization misses. Netlify adds `x-robots-tag: noindex` and its preview drawer to deploy previews, which shows up as a difference.

Pick projects that cover different setups: single locale, several locales, region locales (`de_CH`), `prefix-always` vs `prefix-except-default`, latest vs older dastro.

### 4. Go / no-go

- Every difference in the comparisons is understood and intended
- Deploy previews of the beta projects are checked by someone who knows the site
- Tests and `astro check --minimumFailingSeverity hint` are green in dastro and the beta projects

### 5. Release

1. Merge the feature branch.
2. `npm run release` with the final version (`X.Y.Z`) and the changelog, including the intended differences as behaviour changes.
3. Beta projects switch to the final tag: `npm install "dastro@github:gridonic/dastro#vX.Y.Z"`. Close the draft pull requests of projects that only took part to test; they upgrade with `dastro upgrade` like every other project.
