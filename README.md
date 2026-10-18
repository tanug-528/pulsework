# PulseWork

Early burnout detection for teams. Employees get a private burnout profile; employers see only anonymous, aggregate team trends.

## Run it locally

You need Node.js 24 or newer.

```bash
npm install
npm run seed      # creates the demo employer admin account
npm run dev       # http://localhost:3000
```

On first run, create `.env.local` with a session secret (see `.env.example`) if it doesn't already exist.

## Demo accounts

- **Employees**: sign up at `/signup`. Use the company name **Acme Corp** to join the demo admin's team.
- **Employer admin**: log in at `/admin/login`. The email and password are set in [`scripts/seed.ts`](scripts/seed.ts) (override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_COMPANY`).
- **Test employee** (created while testing Phase 1, local only): email `jamie@acme.test`, password `testpass123`, log in at `/login`.
- **12 seeded demo employees** at Acme Corp (e.g. `alex.morgan@acme.test`), each with ~10 weeks of baseline, monthly and weekly pulse results so the employer dashboard has data. They use the same password as the test employee above.

`npm run seed` is safe to re-run; it skips accounts that already exist. To regenerate the demo history (e.g. so it ends at the current week), delete `data/pulsework.db` and run it again.

## Mental health benefits portal (demo)

Employees with any score above 3.5 see a banner linking to `/support`, a simulated employer benefits portal with two fictional providers, a booking calendar, session notes, secure messaging and resources. It's demo-only: bookings and messages stay in the browser and reset on reload, and nothing is sent anywhere.

## Testing check-ins

Weekly pulse checks open every Monday and monthly reassessments on the first Monday of each month (each stays open until the following Monday). To test them without waiting, use the **Demo tools** box at the bottom of the employee dashboard (development only) to pretend today is another date, e.g. a Monday or the first Monday of a month. Surveys completed while pretending are stamped with the pretend date; click **Back to real date** when done.

## How it's built

- **Next.js** (App Router) + **Tailwind CSS**
- **SQLite** via Node's built-in `node:sqlite`. The database is the single file `data/pulsework.db`, and tables are created automatically. Delete that file to start fresh.
- Passwords are hashed with scrypt; sessions are HMAC-signed, HTTP-only cookies.

| Path | What's there |
| --- | --- |
| `src/lib/db.ts` | Database connection and table definitions |
| `src/lib/users.ts` | User queries, signup (incl. simulated Slack/Calendar data) |
| `src/lib/simulated-data.ts` | Random demo Slack/Calendar numbers per user |
| `src/lib/session.ts`, `src/lib/auth.ts` | Sessions and page guards |
| `src/app/actions/auth.ts` | Signup, login and logout server actions |

## Build phases

1. ✅ Foundation, signup and login
2. ✅ Baseline survey (autosave) and employee dashboard
3. ✅ Weekly pulse check, monthly reassessment and trend chart
4. ✅ Employer dashboard (built early for the demo)
5. ✅ Polish (titles, favicon, 404/error pages, loading states, login hints)
