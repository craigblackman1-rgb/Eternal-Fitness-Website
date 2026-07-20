# Lane D, unit 1 — Client Auth Design (DESIGN ONLY, GATE unit)

**Status:** Design / approach only. No code, no DB, no implementation.
**GATE flag:** Per the Work Order ASK FIRST list — *"Adding client authentication/login as a new surface"* — this unit is a **GATE**. The approach below is for review and sign-off before any build begins in Lane D, unit 2.
**Date:** 2026-07-20
**Author:** Claude Code (design pass, no implementation)

---

## 1. What already exists — trainer / staff auth

The hub already has a working internal auth surface for trainers/staff (Esther, Craig). It is **not** to be touched or replaced.

| Concern | Current implementation |
|---|---|
| Library | **better-auth** (`lib/auth.ts`), `emailAndPassword.enabled: true`, `requireEmailVerification: false` |
| Session store | better-auth session cookie (`getSessionCookie`, `auth.api.getSession`) |
| Server guard | `app/hub/(protected)/layout.tsx` calls `supabase.auth.getUser()` → actually `auth.api.getSession` via `lib/supabase-server.ts`; redirects to `/hub/login` if no user |
| Edge guard | `middleware.ts` redirects unauthenticated `/hub/*` and `/admin/*` to `/hub/login`, except `/hub/login`, `/hub/forgot-password`, `/hub/reset-password` |
| Login UI | `app/hub/login/page.tsx` — email + password form, talks to better-auth through the Supabase shim in `lib/supabase-client.ts` |
| Password reset | better-auth `sendResetPassword` email (1-hour link) |

**Key observation:** there is exactly **one** better-auth instance and **one** user table today. There is no role/tenant concept. Trainers and clients are not distinguished in the auth model at all. So client auth is genuinely a *new surface* that must not collide with, or weaken, the trainer/staff path.

---

## 2. Recommended approach — magic-link, scoped strictly per client

### 2.1 Magic-link over password

Recommend **email magic-link (passwordless)** for client accounts, implemented as a **second, separate better-auth configuration** (or a second plugin/instance), not an extension of the trainer instance.

Rationale:

- **Lower support burden for a non-technical client base.** No password to forget, no reset flow to maintain, no lockout. Esther/Craig are not running a help desk.
- **Smaller attack surface.** A magic-link token is single-use and short-lived; there is no static credential to phish or brute-force. This matters because the Work Order explicitly flags client auth as a *"new attack surface."*
- **No shared credential model with staff.** Keeping client login on a distinct mechanism makes it trivial to reason about "this session is a client, that session is staff" — see §3.

Trade-offs to note (not blockers):

- Requires the client's email to be deliverable (SendGrid already wired via `getEmailSender()`).
- Magic links can land in spam; mitigation is a clear "check your spam" message and a resend control — both keyboard-operable.
- better-auth supports `emailOTP` / `magicLink` plugins; the exact one is an implementation detail for unit 2.

### 2.2 Scope: each client sees only their own data

- Client accounts are tied to a `clients.id` (the consolidated hub record from Lane A). One auth identity ↔ one client row. No client can browse other clients.
- Authorization is enforced **server-side at the data layer**, never in the UI:
  - Portal API routes (e.g. `app/portal/...`) resolve the authenticated client id from the session, then query `client_documents` / update-email history **filtered by `client_id = session.clientId`**.
  - This is the same "service-role, filter by id" pattern the document engine already uses for the public PAR-Q resume links — reuse it.
- Defense-in-depth: every portal route re-asserts `clientId` ownership before any read; a missing or mismatched id returns 404 (not 403, to avoid leaking existence).
- No client account can reach `/hub/*` or `/admin/*` — the middleware allow-list and the `(protected)` layout only trust the **staff** session cookie, not the client one.

### 2.3 Where the portal lives

Recommend a **separate route tree and separate session cookie** from the staff hub:

- Routes: `/portal/login`, `/portal/*` (read-only views). Distinct prefix keeps middleware and guards unambiguous.
- Session: a second better-auth instance writing its **own** cookie (e.g. `better-auth` `advanced.useSecureCookies` + a scoped cookie name via `cookieCache`/instance config). The staff middleware matcher (`/hub/:path*`) simply does not apply to `/portal/*`, so the two never intersect.
- This also keeps the staff `publicHubPaths` list and the client `publicPortalPaths` list independent and easy to audit.

---

## 3. How it avoids conflicting with existing trainer/staff auth

| Dimension | Trainer/staff | Client (new) | Conflict? |
|---|---|---|---|
| Auth library | better-auth (email+password) | better-auth (magic-link) — **separate instance** | None — isolated instances |
| Session cookie | staff cookie, `/hub` matcher | client cookie, `/portal` matcher | None — different paths, different cookies |
| User table | existing `user` | reuses `clients` as the client identity source (no new staff user created) | None |
| Middleware | `middleware.ts` guards `/hub`, `/admin` | portal guarded by its **own** check or its own matcher entry | None — additive, not modifying staff rules |
| Data access | full CRUD via service role | read-only, `client_id`-filtered | None — client paths never touch staff writes |
| Password reset | better-auth email reset | N/A (passwordless) | None |

The principle: **add, don't modify.** The staff auth path (`lib/auth.ts`, `middleware.ts`, `(protected)/layout.tsx`, `login/page.tsx`) is left exactly as-is. Client auth is a parallel surface that the existing code never references.

---

## 4. WCAG 2.2 AA check — the client login flow itself

Scope: the *login screen and its immediate states* (request link → check email → open link → landed in portal). Full portal AA pass is Lane D, unit 3 — this section only covers the entry flow.

> **Note on the accessibility charter:** `EF_Trainerize_Accessibility_Scope_Jul2026.md` (cited in the Work Order §3.1 as the baseline source) was **NOT found in this repo** (searched root and `.context/`). The checks below are therefore derived from the WCAG 2.2 AA baseline the Work Order itself specifies: *keyboard operability, contrast, touch targets, no colour-only signalling, and explicitly no CAPTCHA / no puzzle 2FA*. If the charter file is located, re-verify §3.1 against it before build.

| Criterion | Login-flow requirement | Proposed design | Pass? |
|---|---|---|---|
| **No CAPTCHA / no puzzle 2FA** (Work Order baseline) | Entry must not require solving a puzzle or a second-factor challenge | Magic-link only; no CAPTCHA, no puzzle MFA at login | ✅ by design |
| **2.1.1 Keyboard** | Every control operable by keyboard | Email field, "send link" button, "resend" link all native/button elements; focus order = visual order | ✅ by design |
| **2.4.7 Focus visible** | Visible focus indicator on all controls | Rely on hub design-system focus ring (`focus:ring-2` / Cerulean border) — confirm on the portal skin in unit 2 | ⚠ verify at build |
| **1.4.11 Non-text contrast** | Focus ring + UI boundaries ≥ 3:1 | Use existing hub tokenised focus/border tokens | ⚠ verify at build |
| **1.4.3 Contrast (text)** | Body/label text ≥ 4.5:1 | Reuse hub `--do-text-*` tokens; do **not** use Cerulean as text (fails AA per design system) | ⚠ verify at build |
| **2.5.8 Target size** | Touch targets ≥ 24×24px | Button `h-11` (44px) already exceeds; ensure resend link has adequate hit area | ✅ by design |
| **3.3.1 Error identification** | Errors identified in text, not colour alone | Invalid/empty email → text `Alert` (existing `Alert` component), not just a red border | ✅ by design |
| **1.4.1 Use of colour** | Status not conveyed by colour only | "Link sent" state uses text + icon, not green-only | ✅ by design |
| **2.4.1 Bypass blocks** | Skip link / landmark | Portal login is single-form; ensure `<main>` landmark and a skip link per hub pattern | ⚠ verify at build |
| **2.2.1 Timing adjustable** | If link expiry, warn + allow resend | Magic-link short expiry → show remaining/“link expired, resend” with resend always available | ✅ by design |
| **1.3.5 Identify input purpose** | Email field uses `type="email"` + `autocomplete="email"` | Native input with correct attrs | ✅ by design |
| **2.4.3 Focus order** | Logical tab order into portal | Redirect lands on a real focusable element, not a dead page | ⚠ verify at build |

**Result:** the magic-link approach satisfies the Work Order's hard accessibility baseline (no CAPTCHA, no puzzle 2FA, keyboard-operable) *by construction*. The ⚠ items are standard hub-design-system tokens already used elsewhere; they need a build-time confirmation pass, not a design change.

---

## 5. Open questions for sign-off (ASK FIRST — not decided here)

These are explicitly **not** resolved in this design pass; they belong to the GATE conversation before unit 2:

1. **Client identity source** — confirm client portal accounts are keyed off the Lane A `clients` table (email must be unique & present per client). What happens for a client with no email on file?
2. **Invite flow** — who triggers the first magic-link? Work Order says client comms are draft → Esther review → send, never auto-sent. Confirm the portal invite is generated in-hub and staged for Esther, not auto-emitted.
3. **Second better-auth instance vs plugin** — implementation detail, but confirm a separate instance (own cookie/DB session table prefix) is acceptable vs one instance with a role flag. Recommendation: separate instance for isolation.
4. **Session lifetime** — how long does a client stay logged in? Recommend short-ish (e.g. 7 days, idle timeout) given read-only personal data.
5. **Account recovery** — with no password, the only recovery is "request a new link." Confirm that is acceptable, and that a compromised email = compromised account (mitigation: Esther can disable a client account from the hub).

---

## 6. Summary

- **Approach:** passwordless magic-link, via a *separate* better-auth instance scoped to `/portal/*`, each account bound 1:1 to a `clients.id` and server-filtered to that client's own documents/updates.
- **No conflict:** staff auth (`lib/auth.ts`, `middleware.ts`, `(protected)` layout) is untouched; client auth is purely additive and isolated by route + cookie.
- **Accessibility:** magic-link entry flow meets the Work Order's WCAG 2.2 AA baseline (no CAPTCHA, no puzzle 2FA, keyboard-operable) by design; residual ⚠ checks are existing hub tokens to confirm at build.
- **GATE:** this is design only. Implementation (Lane D, unit 2) and going live (Lane D, GATE "Implementing client login as a live auth surface on production") require explicit sign-off per the Work Order ASK FIRST list.
