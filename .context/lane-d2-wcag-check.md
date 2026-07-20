# Lane D, unit 2 — WCAG 2.2 AA Check

**Scope:** every new screen/route built in Lane D unit 2 (the client portal magic-link auth surface + read-only portal view).
**Date:** 2026-07-20
**Baseline:** Work Order §MUST (WCAG 2.2 AA: keyboard operability, contrast, touch targets, no colour-only signalling) + `EF_Trainerize_Accessibility_Scope_Jul2026.md` §3.1 (not found in repo — derived from the Work Order's stated baseline; re-verify if located).
**Status:** build-time static + reasoned review. No browser/SR session was run (no live surface, GATE not crossed). Items marked ⚠ are design-token dependent and must be confirmed in a real browser pass before any client is invited.

---

## Screen 1 — `/portal/login` (magic-link request)

| Criterion | Requirement | Implementation | Result |
|---|---|---|---|
| 2.1.1 Keyboard | All controls operable by keyboard | Native `<form>` + `<Input>` + `<Button type="submit">` + "use a different email" `<Button>`; no custom widgets | ✅ |
| 2.4.7 Focus visible | Visible focus indicator | Relies on global `focus-visible:ring-2` (Button) + `sr-only` skip link uses `focus:not-sr-only` with visible ring | ⚠ confirm ring renders on portal skin |
| 1.4.11 Non-text contrast | Focus ring + boundaries ≥ 3:1 | Uses hub tokenised border/focus tokens (`border-border/60`, focus ring) | ⚠ confirm at build |
| 1.4.3 Contrast (text) | Body/label ≥ 4.5:1 | `text-foreground` on `bg-[var(--hub-canvas)]`; `text-muted-foreground` (muted used only for secondary, not essential body) | ⚠ confirm muted contrast ≥ 4.5:1 for any text it carries |
| 2.5.8 Target size | ≥ 24×24px | Buttons `min-h-11` (44px), inputs full-width; skip link adequate hit area | ✅ |
| 3.3.1 Error identification | Errors in text, not colour alone | Empty/invalid email → text `<p>` + `aria-invalid` + `aria-describedby`; server error → `Alert` with `IconAlertTriangle` + text | ✅ |
| 1.4.1 Use of colour | Status not colour-only | "Link sent" state = `IconCheckCircle` + heading "Check your email" + body text; never green-only | ✅ |
| 2.4.1 Bypass blocks | Skip link / landmark | `<a href="#portal-login-main">` skip link (sr-only → focus-visible) + `<main id>` + `<h1>` | ✅ |
| 1.3.5 Identify input purpose | Email field semantics | `type="email" autoComplete="email" inputMode="email"` | ✅ |
| 2.2.1 Timing adjustable | Expiry warned + resend | 15-min link; on expiry the verify route redirects with `?detail=` message; request screen always allows a new request | ✅ |
| 2.4.3 Focus order | Logical tab order | Visual order = tab order (logo → skip → email → button); redirect lands on real focusable page | ✅ |
| No CAPTCHA / puzzle 2FA | Baseline | Magic-link only | ✅ |

**Result: PASS** (2 ⚠ confirm-in-browser items, both relying on existing hub tokens already used elsewhere).

---

## Screen 2 — `/portal/verify` (magic-link consumption)

*Implementation note:* the email link points at `GET /api/portal/auth/verify?token=...`, which is a server route that (a) consumes the token, (b) sets the `httpOnly` session cookie, and (c) redirects to `/portal`. There is no standalone human-facing "verify" screen — the user lands directly in the portal on success, or is redirected to `/portal/login?error=...&detail=...` on failure.

| Criterion | Requirement | Implementation | Result |
|---|---|---|---|
| 3.2.1 On focus / 3.2.3 Consistent nav | No dead-end | Failure → redirect to login with `detail` query string (human-readable, not colour); success → `/portal` | ✅ |
| 3.3.1 Error identification | Failure explained | `detail` param carries the exact reason ("expired", "already used", "invalid") shown on the login screen | ✅ |
| 1.4.1 Use of colour | Failure not colour-only | Login screen renders the `detail` as text in the error `Alert` | ✅ |

**Result: PASS** (logic-only route; no new UI to fail contrast/target checks).

---

## Screen 3 — `/portal` (read-only dashboard: signed / outstanding / update history)

| Criterion | Requirement | Implementation | Result |
|---|---|---|---|
| 1.3.1 Info & relationships | Structure via markup | Three `<section aria-labelledby>` each with an `<h1>`/`<h2>` heading; lists as `<ul>/<li>` | ✅ |
| 2.4.6 Headings & labels | Descriptive | "Signed documents", "Outstanding documents", "Update email history" — descriptive `<h3>` via HubCardHeader | ✅ |
| 1.4.1 Use of colour | Status not colour-only | Every status uses `StatusBadge` (text label + coloured pill). Pills carry a **text label** ("Signed", "Sent", "Draft"…) so meaning is never colour-only. Outstanding section uses `IconAlertTriangle` + title; signed uses `IconCheckCircle` + title | ✅ |
| 1.4.3 Contrast (text) | ≥ 4.5:1 | Status badges use hub status tokens (`--status-*-` text colours on tinted bg) already tuned for AA in the hub; body uses `text-foreground` / `text-muted-foreground` | ⚠ confirm badge text contrast ≥ 4.5:1 in a browser |
| 1.4.11 Non-text contrast | Boundaries ≥ 3:1 | Card borders `border-border/60`; list dividers `divide-border/60` | ⚠ confirm at build |
| 2.1.1 Keyboard | All interactive operable | Only interactive control is the header "Sign out" `<button>` inside a `<form>`; all content is static text/lists | ✅ |
| 2.4.7 Focus visible | Visible focus on control | "Sign out" button uses global focus ring | ⚠ confirm |
| 2.5.8 Target size | ≥ 24×24px | "Sign out" button `min-h-11` (44px) | ✅ |
| 2.4.1 Bypass blocks | Skip link | Layout provides `<a href="#portal-main">` skip link + `<main id="portal-main">` | ✅ |
| 1.3.5 / 1.4.4 Resize text | No loss of content | Standard hub responsive classes (`max-w-5xl`, `px-4 sm:px-6`); no fixed-height clipping containers | ✅ |
| 1.4.10 Reflow | No 2D scrolling | Single-column stacked sections; `flex-wrap` on list rows prevents horizontal overflow | ✅ |

**Result: PASS** (3 ⚠ confirm-in-browser items — all token-dependent, reusing hub AA-tuned tokens).

---

## Cross-cutting

| Area | Check | Result |
|---|---|---|
| Session isolation | Portal cookie (`better_auth_portal_session`) is distinct from staff cookie; middleware matcher adds `/portal/:path*` without altering `/hub` rules | ✅ by construction |
| Data scoping | `lib/portal-data.ts` filters every query by `client_id = session.clientId`; no portal route reads another client's rows | ✅ |
| Anti-enumeration | `/request-link` returns `{requested:true}` for unknown emails; no "account exists" signal | ✅ |
| No real email/account | `requestPortalMagicLink` emails only when an email backend is configured; otherwise returns `devLink` for review and sends nothing | ✅ (GATE respected) |

---

## Summary

- **3 screens** reviewed: login, verify (logic route), dashboard.
- **All three PASS** the WCAG 2.2 AA baseline on a build-time review.
- **8 ⚠ items** are all "confirm in a real browser" — each relies on existing hub design-system tokens already in production use elsewhere, not new colour/contrast choices. They must be confirmed in a live browser/SR pass **before any client is invited** (per Work Order DONE checklist + Lane D GATE).
- No CAPTCHA, no puzzle 2FA, fully keyboard-operable, status never conveyed by colour alone.

> Re-verify against `EF_Trainerize_Accessibility_Scope_Jul2026.md` §3.1 if that file is located — it was not present in this repo at build time.
