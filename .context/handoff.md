# Handoff

## Work Order — Lane D, unit 1

- **Unit:** Lane D (Client portal MVP), unit 1 — Design client auth approach
- **Type:** DESIGN ONLY / GATE unit (no implementation, no DB, no code)
- **Date:** 2026-07-20
- **Author:** Claude Code (design pass)
- **Artifacts:**
  - `.context/lane-d1-client-auth-design.md` — recommended approach (passwordless magic-link, separate better-auth instance, per-client data scoping), conflict analysis vs existing trainer/staff auth, WCAG 2.2 AA check of the login flow, open questions for sign-off.
- **Key findings:**
  - Existing staff/trainer auth = better-auth email+password (`lib/auth.ts`), session cookie guarded by `middleware.ts` + `app/hub/(protected)/layout.tsx`. Single user table, no role/tenant concept.
  - Recommended client auth = **magic-link via a second, separate better-auth instance** writing its own cookie, on `/portal/*` routes, each account bound 1:1 to a `clients.id` and server-filtered to that client's own data. Staff auth path left untouched (additive, not modifying).
  - Login flow meets Work Order AA baseline (no CAPTCHA, no puzzle 2FA, keyboard-operable) by design.
  - `EF_Trainerize_Accessibility_Scope_Jul2026.md` **not found in repo** — AA checks derived from the Work Order's stated baseline; re-verify against the charter file if located.
- **GATE status:** This unit is a GATE per the Work Order ASK FIRST list ("Adding client authentication/login as a new surface"). Design is for review/sign-off; Lane D unit 2 (build) and the live-auth GATE require explicit approval before proceeding.
- **Next:** Craig reviews approach + open questions (§5 of design doc); on sign-off, proceed to Lane D unit 2 (build read-only portal view).
