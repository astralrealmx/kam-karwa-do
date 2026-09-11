# KAAM KARWA DO — Phase 1 + Phase 2 + Phase 3

> **Koi bhi local kaam hai? Kaam Karwa Do.**
> Task post karo, trusted worker paao aur kaam complete karwao.

India-first local task marketplace.

- **Phase 1**: foundation, language system, location onboarding.
- **Phase 2**: customer authentication (OTP + password) and the full
  customer dashboard (profile, tasks, addresses, notifications, settings).
- **Phase 3**: worker registration, verification-status tracking (no real
  KYC integrated), and the worker dashboard (browse/accept/complete
  tasks, availability, location, earnings).

Payments, chat/messaging, reviews/ratings collection, and admin tooling
are **not** built yet — see the "What's NOT" sections below.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Prisma** ORM, **PostgreSQL**-ready schema
- DB-backed session auth (no external auth service required)
- Vercel-compatible out of the box

---

## Getting started

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL and Google Maps keys in .env

npx prisma migrate dev --name init
npx prisma db seed

npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment variables

See `.env.example` for the full list.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL of the app |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes (for location features) | Browser key — restrict by domain + to Maps JS, Places, Geocoding APIs |
| `GOOGLE_MAPS_SERVER_API_KEY` | Optional | For future server-side geocoding calls |
| `AUTH_SECRET` | Reserved | Not currently used — sessions are DB-backed opaque tokens (see below), not signed JWTs. Kept for a possible future signed-token mode. |

**Without a Google Maps key**, the app still runs fully — location
onboarding/address entry falls back to a friendly error message and lets
the user Skip or search-fallback instead of crashing.

**No real SMS/OTP provider is configured or required to run this.** Phase
2 ships a DEV-ONLY OTP provider (see below) so the full signup/login flow
is testable out of the box.

### Google Maps setup required

1. Create/select a project in Google Cloud Console.
2. Enable: **Maps JavaScript API**, **Places API**, **Geocoding API**.
3. Create an API key, restrict it to your domain(s) and to the three APIs
   above.
4. Put it in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
5. Billing must be enabled on the Google Cloud project (Google requires
   this even within the free tier).

---

## Phase 2: Customer authentication

### DEV-ONLY OTP provider

No real SMS provider credentials are available yet, so the only OTP
provider wired up is `DevConsoleOtpProvider`
(`src/lib/auth/otpProvider.ts`). It **never sends a real SMS** — it logs
the code to the server console, clearly prefixed `[DEV ONLY OTP]`, and
the API returns the code directly to the client (`devCode`) so the
`/verify` page can display it in a visible **"DEV ONLY"** banner.

To add a real provider later (MSG91, Twilio, Gupshup, etc.): implement
the `OtpProvider` interface and swap it in inside `getOtpProvider()` —
nothing else in the app needs to change.

### Flows implemented

- **Signup** (`/signup`): name, mobile, optional email, password, Terms +
  Privacy consent checkboxes (both required). Creates a `CUSTOMER` user
  and sends a signup OTP.
- **Verify** (`/verify`): 6-digit OTP entry, used for both signup
  verification and OTP-based login. Shows the DEV ONLY code banner when
  the dev provider is active. Has a resend action with server-side
  cooldown.
- **Login** (`/login`): password login or OTP login (tabs). Password
  login returns a generic "invalid credentials" error for both wrong
  password and unknown number, so login can't be used to enumerate
  registered numbers. If the phone hasn't completed OTP verification
  yet, it's routed to `/verify` automatically.
- **Logout**: clears the DB-backed session record and cookie. Available
  from the customer sidebar/nav and from Settings.

### Session model

Sessions are **opaque random tokens stored in Postgres** (`Session`
model), mirrored into an `httpOnly`, `sameSite=lax` cookie
(`kkd_session`). The cookie itself carries no trustable claims — every
read re-validates against the database and checks expiry
(`src/lib/auth/session.ts`). Passwords are hashed with Node's built-in
`scrypt` (no extra native dependency).

---

## Phase 2: Customer area (`/customer/*`)

- **`/customer/dashboard`** — Active / Pending / Completed / Cancelled
  task counts and a recent-tasks list, computed live from the database
  (`prisma.task.groupBy`), scoped to the logged-in customer.
- **`/customer/tasks`** — full task list with status filter tabs.
- **`/customer/tasks/[id]`** — task detail, ownership-scoped (returns 404
  rather than another customer's data), with a Cancel action for
  Pending/Active tasks.
- **`/customer/profile`** — edit name, profile photo (URL for now — see
  note below), email, language; mobile number is shown but read-only
  (it's the verified identity).
- **`/customer/addresses`** — add (via "use current location" or Places
  search, reusing the Phase 1 location architecture), edit label, delete,
  and set-default. Always scoped to `userId` — never exposed publicly.
- **`/customer/notifications`** — list with unread/read visual state,
  mark-one-read (tap) and mark-all-read.
- **`/customer/settings`** — language, location preference, notification
  toggles, account (mobile number shown), and logout.

Empty states are bilingual, e.g. tasks:
> EN: "No tasks yet. Post your first task to get started."
> Hinglish: "Abhi tak koi task nahi hai. Apna pehla task post karein."

**Profile photo note**: there's no file storage configured in this
phase, so the profile photo field accepts an image URL rather than a
direct upload widget. Wiring up real upload (S3/Cloudinary/etc.) is a
follow-up once storage credentials exist.

---

## Phase 3: Worker system

### Registration & verification

- **`/join-as-worker`** — public landing page with the required headline
  ("Complete local tasks in your free time and earn." / Hinglish
  equivalent) and a **"START WORKER REGISTRATION"** CTA. No earnings
  numbers or guarantees anywhere on the page — only a plain disclaimer
  that earnings depend on availability/demand.
- **`/worker/onboarding`** — a single route that branches server-side on
  session state:
  1. **Anonymous visitor** → account-creation step (name, mobile, email,
     password, Terms + Privacy consent) → `POST /api/auth/worker/signup`
     → same DEV-ONLY OTP verification flow as customers, at `/verify`.
  2. **Logged-in WORKER, profile incomplete** → the full profile form:
     photo URL, bio, location (reusing the Phase 1 Google Maps
     architecture — current-location or Places search), service radius,
     categories, skills, experience, languages, availability
     (days/hours), and an **optional** payout-linking section.
  3. **Logged-in WORKER, profile already complete** → redirects straight
     to `/worker/dashboard`.
- **`/worker/verification`** — shows the real status
  (`PENDING` / `UNDER_REVIEW` / `VERIFIED` / `REJECTED` / `SUSPENDED`).
  No KYC is faked anywhere: there is no code path that auto-verifies a
  worker. Since no real provider is configured
  (`src/lib/worker/verificationProvider.ts`), the page honestly shows
  **"Verification integration pending configuration."** instead of
  implying something is happening. No government ID number or document
  is ever collected or stored — that field simply doesn't exist in the
  schema or any form.
- **Payout linking** (`src/lib/worker/payoutProvider.ts`) mirrors the OTP
  provider pattern: a DEV-ONLY provider "links" an account but **never
  persists the raw account number or IFSC** — it computes a masked label
  (e.g. `Ramesh •••• 9012`) and an opaque reference token, and only those
  two values are ever written to the database. This was unit-tested in
  isolation (see Build/test result below).

### Worker area (`/worker/*`)

- **`/worker/dashboard`** — Available / Nearby / Accepted / Active /
  Completed task tabs, Earnings, Pending Payout, Rating, Completion Rate,
  and unread-notification count, all computed live from the database
  (`prisma.task.aggregate` / live counts — nothing cached). Accept/
  Start/Complete actions call `PATCH /api/worker/tasks/[id]`, which
  re-validates the transition and ownership server-side regardless of
  which button the UI showed.
- **`/worker/profile`** — public-safe summary (name, photo, categories,
  skills, area, rating, completed-task count) plus a self-edit form.
  Never shows bank details, government IDs, or exposes another worker's
  data (there is no route that can even query another worker's profile).
- **`/worker/availability`** — Available/Unavailable toggle, working
  days, start/end time, service radius, and a location-change flow
  reusing the same Google Maps architecture from onboarding.
- **`/worker/settings`** — language, location preference, notification
  toggles, account (mobile shown), logout — same shape as customer
  settings, worker-scoped endpoints.

### Task lifecycle & location privacy

`TaskStatus` was extended (additively — nothing removed) with
`ACCEPTED`, sitting between `PENDING` and `ACTIVE`:
`PENDING → ACCEPTED → ACTIVE → COMPLETED` (or `CANCELLED` by the
customer at any point before completion). A customer's task now visibly
shows "Accepted" once a worker takes it — every Phase 2 component that
hardcoded the old 4-value status union was updated to handle the 5th
value (see "Fixed during Phase 3" below).

**Address masking, enforced server-side**: for tasks still in the open
pool (`PENDING`, unassigned), the worker-facing API only ever returns an
**approximate area** (`area, city` — e.g. "Civil Lines, Ludhiana"), never
the exact `formatted` address, pincode, or coordinates. The exact address
is only included in the API response once the task is `assignedWorkerId
=== <that worker's own id>` (Accepted/Active/Completed) — matching the
Phase 1 privacy rule literally. This masking lives in the API route
(`serializeTask()` in `/api/worker/tasks` and the equivalent in the
dashboard's server component), not in the UI, so it can't be bypassed by
a modified client.

**"Nearby"** is a practical proxy, not true geospatial search: it filters
the open pool to tasks whose address shares the worker's own
`WorkerLocation.cityId`. No PostGIS/geo-radius query is wired up in this
phase — `WorkerLocation.radiusKm` is stored and shown in the UI, but
matching is city-level for now.

---

## Role security — how it's enforced

Two layers, and only one of them is authoritative:

1. **`src/middleware.ts`** (Edge runtime) — a coarse, cookie-presence-only
   check on `/customer/*` and `/worker/*`. It cannot query Postgres from
   the Edge runtime, so it only redirects to `/login` if there's *no*
   session cookie at all. **This is a UX shortcut, not the security
   boundary.** `/worker/onboarding` is deliberately excluded from this
   gate — an anonymous visitor has to be able to reach it to create a
   worker account in the first place.
2. **`requireCustomer()` / `requireCustomerApi()` / `requireWorker()` /
   `requireWorkerApi()`** (`src/lib/auth/session.ts`) — the real,
   database-backed checks. Every `/customer/*` and `/worker/(app)/*`
   **page** (via their respective `layout.tsx`) and every
   `/api/customer/*` and `/api/worker/*` **route handler** independently
   calls one of these. Each looks up the session token in Postgres,
   confirms it hasn't expired, and confirms the exact role — never
   trusting anything the client sent. A customer hitting `/worker/*` (or
   vice versa) is redirected away at this layer.

   - `requireCustomer()` / `requireWorker()` are for **pages** — on
     failure they call `redirect()` from `next/navigation`, correct in
     Server Components.
   - `requireCustomerApi()` / `requireWorkerApi()` are for **API
     routes** — they return `{ user }` or `{ response }` instead of
     redirecting, because a redirect response from a JSON API route gets
     silently *followed* by `fetch()` and would hand back an HTML page
     where JSON was expected.

Every list/detail/mutation query is additionally scoped server-side —
customer queries by `customerId`/`userId`, worker queries by
`assignedWorkerId` or `workerProfileId` matching the requesting user's
own id — so even a valid session can never read or modify another
user's data by guessing an ID. Specifically for the worker role's stated
constraints:

- **Cannot access another worker's private information** — there is no
  route in this codebase that accepts another worker's id and returns
  their data; every worker query is implicitly `WHERE userId = <self>`.
- **Cannot modify verification status** — `/api/worker/verification`
  only exports a `GET` handler. There is no `PATCH`/`POST` anywhere that
  can change a `WorkerVerification.status`.
- **Cannot modify earnings** — Earnings/Pending Payout are `SUM(budget)`
  aggregate queries computed at request time from `Task` rows filtered
  by `assignedWorkerId`; there is no mutable "earnings" field a worker
  (or anyone) could write to.
- **Cannot access admin** — no admin routes exist yet; trivially true.
- **Cannot access customer private data** — worker task queries never
  join into `CustomerProfile`, and address exposure is masked as
  described above.

### Fixed during Phase 2

All seven `/api/customer/*` route files originally called the
page-oriented `requireCustomer()`. That works for pages but is wrong for
API routes (see above) — it was caught and corrected to
`requireCustomerApi()` across all of them (`profile`, `tasks`,
`tasks/[id]`, `addresses`, `addresses/[id]`, `notifications`,
`settings`) before considering Phase 2 done.

### Fixed/extended during Phase 3

- Every Phase 2 file that hardcoded the 4-value `TaskStatus` union
  (`TaskStatusBadge`, customer `DashboardClient`, dashboard `page.tsx`,
  `TasksListClient`, `TaskDetailClient`, the customer tasks API's
  `validStatuses` filter) was updated to include the new `ACCEPTED`
  value, so a customer's task correctly displays "Accepted" once a
  worker takes it instead of hitting a TypeScript/runtime mismatch.
- `City`/`Area` gained a `workerLocations` back-relation (they previously
  only had customer-`Address` relations) since `WorkerLocation` is the
  first thing in this codebase to actually populate those tables — a
  small `findOrCreateCity`/`findOrCreateArea` helper
  (`src/lib/location/findOrCreateCityArea.ts`) was added for this.

---

## What's implemented in Phase 1 (unchanged, preserved)

- Mandatory first-open language selection (English/Hinglish), persisted,
  changeable later.
- Location onboarding (Allow/Manual/Skip), Google reverse geocoding +
  Places search.
- Homepage, all public pages, category structure, responsive nav,
  database foundation, security foundation.

See the Phase 1 details inline in the codebase — nothing in Phase 1 was
rebuilt or altered structurally for Phase 2 or Phase 3, only extended
(schema additions, and the `/login` placeholder was replaced with the
real login page as originally scoped for a later phase).

## What's NOT in Phase 3 (by design)

- Matching/dispatch logic beyond city-level "nearby" filtering (no
  geospatial radius query, no automatic worker suggestions)
- Payments and payout execution — `payoutStatus` never transitions to
  `PAID` anywhere in this codebase; that needs a real payout gateway
- Chat/messaging between customer and worker
- Reviews/ratings collection — `WorkerProfile.rating` exists in the
  schema but is always `null` until a review system is built; the UI
  honestly shows "No ratings yet" rather than fabricating a number
- Real KYC/ID verification — status tracking only, see above
- A public worker-directory page (browsing other workers' profiles) —
  intentionally not built, which also means there's no surface at all
  that could leak one worker's data to another
- Admin dashboard/tooling (which is also why verification can never move
  past PENDING in this phase — nothing exists yet to review it)

## Still true from earlier phases

- Task posting *flow* UI (category/description/budget form) — the
  `/post-task` route is still the Phase 1 placeholder; task *creation*
  happens via `POST /api/customer/tasks` so the dashboards have real
  data, but the guided posting UI itself is a later phase
- Real SMS OTP delivery — DEV-ONLY provider only, for both customers and
  workers, clearly labeled everywhere it appears
- Direct profile-photo file upload — URL field only (both customer and
  worker profiles), pending storage setup

---

## Project structure (Phase 2 + Phase 3 additions)

```
src/
  app/
    login/, signup/, verify/        # Customer auth pages
    join-as-worker/                 # Public worker landing (spec headline/CTA)
    customer/
      layout.tsx                    # Authoritative role guard + nav shell
      dashboard/, tasks/, tasks/[id]/, profile/, addresses/,
      notifications/, settings/     # Customer area pages
    worker/
      onboarding/
        page.tsx                    # Branches: signup step / profile step / redirect
        WorkerSignupStep.tsx        # Step 1 — anonymous account creation
        WorkerOnboardingForm.tsx    # Step 2 — full profile form
      (app)/                        # Route group — URL has no "(app)" segment
        layout.tsx                  # Authoritative role guard + onboarding-complete check
        dashboard/, profile/, verification/, availability/, settings/
    api/
      auth/
        signup/, login/, logout/, me/, otp/request/, otp/verify/  # customer
        worker/signup/                                            # worker
      customer/
        profile/, tasks/, tasks/[id]/, addresses/, addresses/[id]/,
        notifications/, settings/
      worker/
        onboarding/, profile/, verification/, availability/,
        location/, settings/, tasks/, tasks/[id]/
  components/
    customer/                       # CustomerNav, TaskStatusBadge (shared, now 5-status)
    worker/                         # WorkerNav
  lib/
    auth/
      session.ts                    # requireCustomer/requireCustomerApi/
                                     # requireWorker/requireWorkerApi
      constants.ts                  # SESSION_COOKIE (edge-safe, no Prisma import)
      password.ts                   # scrypt hash/verify
      otp.ts / otpProvider.ts       # OTP generation + DEV ONLY provider (shared)
    worker/
      payoutProvider.ts             # DEV ONLY payout linking — never persists raw account #
      verificationProvider.ts       # Honest "not configured" reporting, no fake KYC
    location/
      findOrCreateCityArea.ts       # City/Area upsert helper (new in Phase 3)
    validation/auth.ts, validation/worker.ts   # zod schemas
    apiFetch.ts                     # typed fetch helper + ApiError
  middleware.ts                     # Edge-level coarse gate on /customer/* and /worker/*
                                     # (excluding /worker/onboarding)
prisma/
  schema.prisma                     # + WorkerSkill, WorkerAvailability, WorkerLocation,
                                     # WorkerVerification; Task gained assignedWorkerId/
                                     # ACCEPTED status/payoutStatus
```

---

## Build/test result

This code was written in a sandboxed environment without network access
or a live Postgres instance, so `npm install`, `prisma migrate`, and
`npm run build` could not be executed end-to-end here. What *was* done
in this environment:

- Every internal `@/...` import across Phase 1, 2, and 3 was checked
  against the actual file tree (no dangling imports) — re-verified after
  every batch of Phase 3 files, not just once at the end.
- The core crypto logic (`scrypt` password hashing/verification, OTP
  code generation/hashing/expiry, the Indian phone regex) was extracted
  and unit-tested directly with Node — all passed.
- The DEV payout provider's masking logic was extracted and
  unit-tested directly with Node — confirmed the raw account number and
  IFSC never appear in the object that actually gets persisted, only a
  masked label and opaque reference token.
- Every Phase 3 client component's mutation payload (onboarding, profile
  edit, availability, location) was cross-checked field-by-field against
  its corresponding zod schema to catch naming mismatches that would
  otherwise only surface at runtime.
- The `requireCustomer()` vs `requireCustomerApi()` redirect-vs-JSON bug
  (Phase 2) and the `TaskStatus` union-type ripple effect of adding
  `ACCEPTED` (Phase 3) were both found by static review and fixed before
  considering their phases done.

Run `npm install && npx prisma generate && npm run build` locally or in
CI (e.g. on Vercel) to verify the full build — standard Next.js 14 /
Prisma 5 stack, no unusual native dependencies.

### Manual test checklist (walk through once deployed with a real DB)

**Phase 2 — customer**
- [ ] Signup with a new number → DEV OTP banner appears on `/verify` →
      entering it logs you in and lands on `/customer/dashboard`
- [ ] Logout from the sidebar → redirected to `/`, `/customer/dashboard`
      now redirects to `/login`
- [ ] Login with password → lands on dashboard; wrong password → generic
      "invalid credentials" (no enumeration)
- [ ] Login with OTP tab → same DEV banner flow as signup
- [ ] Edit profile (name/email/photo URL/language) → Save → reflected
      immediately, language switch also updates nav/strings site-wide
- [ ] Dashboard counts match `/customer/tasks` filter tabs exactly (both
      read the same DB rows)
- [ ] Add an address via "use current location" (needs Maps key) and via
      manual search → set default → delete non-default → delete default
      (another one is auto-promoted)
- [ ] Notifications: tap one to mark read, "mark all as read" clears the
      unread badge
- [ ] Visit `/customer/dashboard` in an incognito tab (no session) →
      redirected to `/login`
- [ ] Hit `curl -i http://localhost:3000/api/customer/tasks` with no
      cookie → `401 UNAUTHENTICATED` JSON, not a redirect

**Phase 3 — worker**
- [ ] `/join-as-worker` shows the exact spec headline, no earnings
      numbers, CTA goes to `/worker/onboarding`
- [ ] Visiting `/worker/onboarding` with no session shows the
      account-creation step (not a login redirect)
- [ ] Complete signup → DEV OTP banner on `/verify` → verifying lands
      back on `/worker/onboarding`, now showing the profile-completion
      step (not the account step again)
- [ ] Submit the profile form (location, at least one category, terms +
      privacy) → redirected to `/worker/dashboard`
- [ ] Revisiting `/worker/onboarding` after completion redirects
      straight to `/worker/dashboard`, not back into the form
- [ ] `/worker/verification` shows `PENDING` and the "integration
      pending configuration" message — no document upload UI, no ID
      number field anywhere
- [ ] As a customer, post a task via `POST /api/customer/tasks`; as the
      worker, it appears under **Available** (and **Nearby** if same
      city) with only an approximate area shown, no exact address
- [ ] Accept it → moves to the **Accepted** tab; the customer's task
      detail page now shows status "Accepted"
- [ ] Start it → **Active** tab; Complete it → **Completed** tab,
      Earnings/Completion Rate update
- [ ] Once accepted, re-check the task in the worker's own view — the
      exact address is now shown (it wasn't before accepting)
- [ ] Log in as a customer and try navigating to `/worker/dashboard` →
      redirected away; log in as a worker and try `/customer/dashboard`
      → redirected away
- [ ] `curl -i http://localhost:3000/api/worker/verification` with a
      customer's session cookie → `403 FORBIDDEN` JSON
- [ ] Resize to a small viewport → both customer and worker sidebars
      collapse to horizontal scroll tabs

## Anything that still requires external credentials

- A PostgreSQL database (`DATABASE_URL`).
- A Google Cloud Maps API key (optional but recommended — see above);
  used by both customer address entry and worker location/onboarding.
- A real SMS/OTP provider, only when ready to move off the DEV ONLY
  provider before production launch (shared by customer and worker auth).
- A real payout provider (Razorpay Route, Cashfree Payouts, etc.), only
  when ready to move off the DEV ONLY payout linking — see
  `src/lib/worker/payoutProvider.ts`.
- A real KYC/verification provider (DigiLocker, Signzy, IDfy, etc.), only
  when ready to move workers past `PENDING` status — see
  `src/lib/worker/verificationProvider.ts`. Admin tooling to review
  submissions doesn't exist yet either and would be needed alongside it.
