# ContextDesk API Reference

Base URL: `http://localhost:5011/api/v1`. All routes except
`/health`, `/auth/register`, `/auth/login`, `/auth/verify`,
`/auth/resend-code`, and `GET /invitations/:id` (public preview)
require `Authorization: Bearer <token>`. Shared TypeScript contracts
live in `@contextdesk/shared-types`.

Every company lives in an **organization**. All data access is scoped to
the caller's org (from the JWT): other companies' tickets, contacts,
accounts, users, and dashboard numbers return 404/empty. Roles live in
the JWT too, so role changes apply on next login.

## Conventions

Success bodies look like `{ "success": true, ... }`. List endpoints
accept `?page=` (default 1) and `?limit=` (default 50, max 100) and
answer with sibling `total`, `page`, `limit` fields next to the array.
Errors:

| Cause | Status | Body |
|---|---|---|
| `ApiError` (not found, forbidden, bad input) | 4xx | `{ success: false, message }` |
| Zod validation failure | 400 | `{ success: false, message: "Validation failed", issues }` |
| Prisma `P2002` (duplicate) | 409 | `{ success: false, message: "Resource already exists" }` |
| Prisma `P2025` (missing row) | 404 | `{ success: false, message: "Resource not found" }` |
| Prisma `P2003` (bad reference) | 400 | `{ success: false, message: "Invalid reference" }` |
| Anything else | 500 | `{ success: false, message: "Internal Server Error" }` |

## Auth — `/auth`

- `POST /auth/register` `{ name, email, password }` → `201 { user }`
  (**no token**). Always creates an unverified `AGENT` and emails a
  6-digit code (15 min expiry; logged to the server console when no SMTP
  is configured). Promote via DB or the role endpoint after verifying.
- `POST /auth/verify` `{ email, code }` → `{ token, user }`.
  Wrong code → 401, expired/missing code → 400, already verified →
  issues a fresh token (idempotent).
- `POST /auth/resend-code` `{ email }` → fresh code (10/hour/IP rate
  limit; 404 unknown email, 400 already verified).
- `POST /auth/login` `{ email, password }` → `{ token, user }`.
  Unverified accounts get `401 Please verify your email`. Passwordless
  (Google-only) accounts get `401 This account uses Google sign-in`.
- `POST /auth/google` `{ idToken, organizationName?, inviteToken? }` →
  `{ token, user }`. Verifies the Google ID token server-side (audience
  must match `GOOGLE_CLIENT_ID`), requires a Google-verified email, then
  finds-or-creates the user under the same org/invite rules as register
  (new Google users in a fresh company become ADMIN, no email code
  needed). Existing password users keep their password and get their
  Google identity linked on first use.
- Login and register are rate-limited to 30 attempts per IP per
  15 minutes (429 `{ success: false, message }` when exceeded).
- `GET /auth/me` → `{ user }`.

## Health / probe — `/health`, `/protected`

- `GET /health` → `{ status: "ok", service, version }` (no auth).
- `GET /protected` → `{ success, user }` (auth check).

## Tickets — `/tickets`

- `GET /tickets?status=&priority=&assigneeId=` → `{ tickets }`.
  Unknown `status`/`priority` values are rejected with 400. Each ticket
  carries a computed `slaStatus` and its `account`, `contact`, `assignee`.
- `POST /tickets` `{ subject, contactId, accountId, assigneeId?, status?, priority? }`
  → `201 { ticket }`. The contact **must belong** to the account (400
  otherwise). SLA deadline is set from priority (URGENT 1h, HIGH 4h,
  MEDIUM 8h, LOW 24h). Assigning notifies the agent.
- `GET /tickets/:id` → `{ ticket }` including `prevTickets` (same
  contact's other tickets).
- `PATCH /tickets/:id` — partial update; changing priority recalculates
  the SLA; re-parenting is guarded like create; re-assigning notifies
  the new agent.
- `DELETE /tickets/:id` — **ADMIN only**. Deletes messages and
  notifications for the ticket first (no DB cascade).

## Contacts — `/contacts`, Accounts — `/accounts`

Full CRUD (`POST`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).
Deletes are **ADMIN only** and blocked with 400 when children exist
(contact with tickets; account with contacts or tickets).

## Messages — `/messages`

- `POST /messages` `{ ticketId, body, isInternalNote? }` — agent reply or
  internal note (sender forced to `AGENT`). Notifies the assignee when
  someone else writes.
- `POST /messages/customer` — customer-side message (sender forced to
  `CUSTOMER`, never an internal note). Notifies the assignee.
- `GET /messages/tickets/:ticketId` → `{ messages }`, oldest first.

## Dashboard — `/dashboard`

- `GET /dashboard` → `{ total_tickets, new_tickets, in_progress, waiting,
  resolved, sla_at_risk, sla_due_soon, sla_on_track, by_priority,
  volume_over_time }`. Quirk: `sla_at_risk` counts **breached** tickets;
  tickets due within 2h are in `sla_due_soon`.
- `GET /dashboard/sla` → `{ tickets }` breached or due within 2h,
  soonest first.

## SLA model

`slaStatus` per ticket: `RESOLVED` (monitoring stops) · `NO_SLA` (no
deadline) · `BREACHED` (deadline passed) · `AT_RISK` (≤ 2h remain) ·
`WITHIN_SLA`. The 2h at-risk window matches the dashboard and frontend.

## AI draft — `/ai-draft`

- `POST /ai-draft` `{ ticketId }` → `{ draft }`. Uses NVIDIA
  (`openai/gpt-oss-20b`, overridable via `NVIDIA_MODEL`);
  requires `NVIDIA_API_KEY`. Replies are drafted from non-internal messages
  only; the model is instructed not to invent facts and never to mention it
  is AI. Note: role changes take effect on next login (roles live in the JWT).

## Users — `/users`

- `GET /users` → `{ users }` (own org members only; used for assignee
  pickers).
- `PATCH /users/me` `{ name?, email? }` → `{ user }` (self only;
  email change rejected with 409 when taken).
- `PATCH /users/me/password` `{ currentPassword, newPassword }` (self
  only; wrong current password → 401, new password min 8 chars).
- `PATCH /users/:id/role` `{ role: "ADMIN" | "AGENT" }` — **ADMIN only**,
  same org only, and never the org's last ADMIN.
- `DELETE /users/me` — delete your own account (self only). Removes your
  messages and notifications, unassigns your tickets (tickets themselves
  stay). Refused with 400 if you're the org's last ADMIN.

## Invitations — `/invitations`

- `POST /invitations` `{ email, role? }` — **ADMIN only**. Creates a
  7-day invite, emails a signup link, and returns it once
  (`inviteLink`) for manual sharing.
- `GET /invitations` — pending invites for the org (**ADMIN only**).
- `GET /invitations/:id` — public preview (`{ email,
  organizationName }`) for the signup page. No auth.
- `DELETE /invitations/:id` — revoke (**ADMIN only**).
- Accept via `POST /auth/register` with `{ ..., inviteToken:
  "<id>.<secret>" }` instead of `organizationName`. New companies
  register with `{ ..., organizationName }` and the creator becomes
  ADMIN; register requires one of the two (400 otherwise).

## Public intake — `/intake/:slug` (no auth)

Each org's shareable support form (`/intake/<slug>`, link on the Team
page). `GET` returns the org name for branding; `POST` takes `{ name,
email, subject, message }` and creates contact (deduped by email),
ticket (`NEW`), and a public customer message in one transaction, then
notifies org admins. Contacts route to an auto-created "General"
account. Spam defenses: 5 submissions/IP/hour (429 after), honeypot
field + minimum fill-time (both answered with fake success so bots
learn nothing).

**AI triage:** intake tickets are urgency-classified by the model
(`URGENT/HIGH/MEDIUM/LOW`) *before* the SLA clock starts, so the
deadline already fits the complaint; the one-sentence reason is stored
as `triageReason` and shown on the ticket. Model failure or bad output
falls back to `MEDIUM` without blocking creation. Agent-created
tickets keep their human-chosen priority.

## Notifications — `/notifications`

- `GET /notifications` → `{ notifications }`, newest first (own only).
- `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`
  mark as read (own only).
- `GET /notifications/preferences` → the 10 email/push toggles
  (defaults when never saved).
- `PATCH /notifications/preferences` — save all 10 toggles (own only).
