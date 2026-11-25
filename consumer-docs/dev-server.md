# Dev server for browser testing

Verify changes in a real browser against your own dev server. The human's server (port 4321, HTTPS) stays theirs: you start, use and stop only yours.

## Steps

1. Start your server through your harness's background-process facility:

   ```bash
   ASTRO_DEV_BACKGROUND=1 LOCAL_DEVELOPMENT_SSL_DISABLED=true npx astro dev --port 4333 --ignore-lock
   ```

   Port taken? Count up: 4334, 4335, …

   Done when you hold the PID and the port of the process you started.
2. Poll `http://localhost:<port>/_astro/status` (a few seconds). Done when it returns `{"ok":true}`.
3. Test the pages in the browser (Claude Code: chrome-devtools MCP — `new_page`, `take_snapshot`, `take_screenshot`). Leave the server running between checks. Done when every page your change touches has rendered in the browser from your port.
4. At session end, stop your server with `kill <PID>`. `astro dev stop` stops the lock-file server, which is the human's. Done when your port no longer answers and port 4321 is as you found it.

## Why each part of the command

- `ASTRO_DEV_BACKGROUND=1` — opts out of Astro's AI-agent auto-detection, which would force `--background` mode; `--background` conflicts with `--ignore-lock` and refuses to start while another server holds the lock file (`.astro/dev.json`).
- `LOCAL_DEVELOPMENT_SSL_DISABLED=true` — serves plain HTTP; the default HTTPS uses local certs that headless browsers distrust.
- `--ignore-lock` — runs alongside the human's server, untracked: `astro dev stop`/`status`/`logs` can't see it, and its logs land in your background shell's output.

## Related

- Type-checking is separate: run `npx astro check` on demand (`npm run dev` bundles a check watcher for humans).
- Production builds: `astro preview --background` needs Astro ≥ 7.2.
