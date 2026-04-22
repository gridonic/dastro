# Backlog

## Auto-check Netlify deployment

After the PR is created, automatically check if the Netlify preview deployment succeeds.

### Approach options

1. **Poll Netlify API** — Use `gh api` to check commit status checks on the PR, wait for Netlify deploy preview to report back. Netlify posts a status check with the preview URL.

2. **Use Netlify CLI** — `netlify status` or `netlify deploy --build` locally before pushing.

3. **Chrome DevTools MCP** — After deploy preview URL is available, use the chrome-devtools MCP to navigate to the preview, take a screenshot, check for console errors, and run a Lighthouse audit.

### Suggested implementation

After PR creation, add a step:

```
### Step 7 — Verify deployment

Poll PR status checks until Netlify deploy preview is ready:

    gh pr checks <PR_NUMBER> --watch

Once the preview URL is available (from the PR status check):
- Fetch the preview URL and check for HTTP 200
- Optionally: screenshot via chrome-devtools MCP
- Report: DEPLOY: pass|fail, PREVIEW_URL: <url>
```

### Open questions

- Timeout for Netlify builds? (Some projects take 5+ minutes)
- Should failures block the PR or just be noted in report?
- Should we run Lighthouse on the preview?
