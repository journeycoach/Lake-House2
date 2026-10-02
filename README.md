# Paine Pointe

Private family site for Paine Pointe: who is up, the shared calendar,
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

## Ship it

```
npm run ship     # builds and deploys to paines.com
```

Merging to `main` deploys production on its own, and every pull request gets
its own preview URL. The command above is for deploying without waiting on a
merge.

An admin adds each new person directly on the Admin page and sets their
first password there (at least 8 characters). There is no self-service
sign-up; admins can add people, reset passwords, and see sign-in activity.

## How it is put together

- Next.js (App Router) with server actions. No client state library.
- Neon Postgres via Drizzle and the serverless HTTP driver.
- Sign-in is email + password with a signed session cookie. `src/proxy.ts`
  guards every route.
- Notifications are Web Push, not email: `src/lib/push.ts` sends to every
  subscribed device for a user, via VAPID keys. People turn it on per device
  from the Account page. Without `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` set,
  sends are silently skipped. `GET /api/reminders` (with
  `Authorization: Bearer CRON_SECRET`) queues check-in and checkout
  reminders, and `GET /api/weekly` nudges admins to grab that week's backup
  from `GET /api/backup`; point a scheduler at both in production.
- The calendar is subscribable: `/api/feed/<token>.ics` serves an iCalendar
  feed (token lives in the settings table; the Calendar page shows the
  subscribe links). Each stay also has a one-off "Add to calendar" download.

## Environment

`.env.local` (not committed):

- `AUTH_SECRET` - required, any long random string
- `DATABASE_URL` - required, pooled Neon Postgres connection string
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - optional, enables push
  notifications (generate with `npx web-push generate-vapid-keys`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - same value as `VAPID_PUBLIC_KEY`, exposed
  to the browser so it can subscribe
- `VAPID_SUBJECT` - optional, a `mailto:` contact for push services to reach
  if something's wrong
- `CRON_SECRET` - optional, protects the reminders and weekly endpoints

## Design rules

Two typefaces (Fraunces for display, Geist for body). One corner radius (8px).
Spacing on a 4/8/16/24/32/48 scale. Color is semantic: rust means action or
attention, sage means ready, amber means due soon, and each household keeps one
muted calendar color everywhere. Tokens live in `src/app/globals.css`.
