<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# How agents collaborate on this repo

Two people work here, each with their own AI: Jeff (Claude) and John (Codex).
The repo is the only channel between them. Rules:

- Branch names say whose agent did the work: `claude/<topic>` or `codex/<topic>`.
- Never push directly to `main`. Open a PR and say in the description what
  changed and why. The other side reads PRs to catch up - write for them.
- Hosting lives on Jeff's Vercel and serves paines.com. The project is NOT
  connected to GitHub, so nothing deploys automatically: after a PR is merged,
  Jeff pulls `main` and runs `npm run ship`. Either side opens PRs; Jeff
  merges and ships. John owns the repo, the domain registration, and the Neon
  database.
- When you close an issue, comment what you actually did.
- Never force-push, never commit `.env*`, secrets, or local data.
- The production database is shared and live. Schema changes go through
  `drizzle/` migrations in a PR, never ad-hoc against prod. Deleting or
  rewriting production rows requires the humans to say so first.
- Content is the family's: do not rewrite their notes, guide text, or names.
