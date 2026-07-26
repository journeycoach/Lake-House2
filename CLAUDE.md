@AGENTS.md

# The Lakehouse - project notes for agents

Family lakehouse app, live at paines.com. Next.js App Router + Tailwind v4,
Neon Postgres via Drizzle (`npm run db:push` for schema, `npm run seed` for
content), email + password auth with a signed cookie, route guard in
`src/proxy.ts` (Next 16 renamed middleware to proxy; read the bundled docs in
`node_modules/next/dist/docs/` before assuming an API).

Rules that are not negotiable here:

- No emojis anywhere. No em-dashes anywhere. Copy is plain and specific.
- Design tokens live in `src/app/globals.css`. One radius (8px), spacing scale
  4/8/16/24/32/48, Newsreader + Geist, semantic color only (rust = action,
  sage = ready, amber = due, one muted color per household). Do not add
  gradients, glows, eyebrow pills, or decorative borders.
- Occupancy outranks house status everywhere. The hero is who is at the lake;
  status stays a small chip.
- The 7-column month grid renders at md and up only. Small screens get the
  agenda list. Do not squeeze the grid onto phones.
- Content seeded from the family's original site is theirs: do not rewrite
  their notes, guide text, or names. Unfinished guide blanks stay blank for
  them to fill.
- The Neon database is live and holds the family's real bookings and notes.
  `npm run seed` wipes it and refuses to run without `SEED_CONFIRM=wipe`.
  Do not run it. Schema changes go through `drizzle/` migrations in a PR.
