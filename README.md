# The Lakehouse

Private family site for the Paine lakehouse: who is up, the shared calendar,
family notes, the fix-it list, checklists, maintenance schedules, and the house
guide. Rebuilt from the original prototype so the family owns the code, the
data, and the domain.

## Run it

```
npm install
npm run db:push  # creates/updates the Neon schema
npm run seed     # loads the family content; launch-time use only
npm run dev
```

Copy the pooled Neon connection string from the Neon dashboard into
`DATABASE_URL` in `.env.local` before running the database commands. Vercel
marks Marketplace credentials as sensitive, so the CLI intentionally does not
download their values.

Then open the printed localhost URL and sign in.

Every account starts with the password `lakehouse` until it is changed on the
Admin page. Admins can add people, reset passwords, and see sign-in activity.

## How it is put together

- Next.js (App Router) with server actions. No client state library.
- Neon Postgres via Drizzle and the serverless HTTP driver.
- Sign-in is email + password with a signed session cookie. `src/proxy.ts`
  guards every route.
- Email lives in `src/lib/mail.ts`. Without a `RESEND_API_KEY` in `.env.local`,
  messages are logged to the outbox (visible on Admin) instead of sent.
  `GET /api/reminders` (with `Authorization: Bearer CRON_SECRET`) queues
  check-in and checkout reminders; point a scheduler at it in production.
- The calendar is subscribable: `/api/feed/<token>.ics` serves an iCalendar
  feed (token lives in the settings table; the Calendar page shows the
  subscribe links). Each stay also has a one-off "Add to calendar" download.

## Environment

`.env.local` (not committed):

- `AUTH_SECRET` - required, any long random string
- `DATABASE_URL` - required, pooled Neon Postgres connection string
- `RESEND_API_KEY` - optional, enables real email
- `MAIL_FROM` - optional, the from address for reminders
- `CRON_SECRET` - optional, protects the reminders endpoint

## Design rules

Two typefaces (Fraunces for display, Geist for body). One corner radius (8px).
Spacing on a 4/8/16/24/32/48 scale. Color is semantic: rust means action or
attention, sage means ready, amber means due soon, and each household keeps one
muted calendar color everywhere. Tokens live in `src/app/globals.css`.
