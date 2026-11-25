# DatoCMS schema changes

How to change the DatoCMS schema of this project, and how to run anything against the CMA.

## Rules

- If not stated otherwise, apply schema changes **directly via the CMA**. Migration files are not part of this project's workflow (nothing replays them). The audit trail is the schema manifest comment on the ticket.
- Each change set is a **throwaway script**: rehearsed on a fork, run on `main`, then discarded — never committed.
- One fork per ticket, destroyed at the end.
- Changing the primary `main` env in place is **sanctioned** while the project is pre-launch (placeholder content only).

## CLI handling

- Use the `datocms:datocms-cli` / `datocms-cma` skills via `npx datocms cma:script`. Use the MCP as fallback only.
- Auth: either the user is already authorized for the datocms CLI, or it comes from the profile in `datocms.config.json`. `.env` stays unread.
- Scripts go in a gitignored `.tmp/` inside the repo.

## Steps

1. Destructive changes only (deleting or retyping fields, blocks, models): export the affected records as JSON into the ticket before applying. Done when the ticket holds the JSON of every affected record.
2. Write the change set as one script in `.tmp/`. Done when the script covers every change of the ticket.
3. Run the script against a fresh fork of `main` and verify the result. Done when the fork's schema shows every change and nothing else.
4. Run the same script, unchanged, against `main`. Done when `main`'s schema matches the verified fork.
5. Run `npm run dato:generate-types` before implementing modules or page types on the new schema. Done when `.astro/generated/datocms.types.ts` reflects the change.
6. Clean up: delete the script, destroy the fork, and record the schema manifest as a comment on the ticket. Done when the script is gone, the fork no longer exists, and the ticket carries the manifest comment.
