# Eternal Fitness Website — State

## Current
- Next.js 14 / Tailwind / shadcn-ui / self-hosted Postgres on Coolify (migrated off Supabase — see decisions.log 2026-07-xx)
- Hub with client management, training blocks, agreements, PAR-Q
- **Custom icon system**: 36+ SVG icons replacing lucide-react ✅
- 6-week client update email feature: **BUILT** (all phases complete, build+tsc clean)
- **Active Work Order** (2026-07-20, SOP-008): `.context/workorder-eternal-fitness-hub-consolidation-2026-07-20.md` — client data consolidation + document-led client portal. See that file's DONE checklist for live status; see `.context/handoff.md` for the full per-unit log.
- Client document engine now visually matches the new brand design system (`D:\apps\design-systems\brand-staging-2662e9`) — masthead, accessibility toolbar (text size + high contrast), sign-boxes — applied to all 4 document kinds. New `consent` document type live (checkbox-based content permissions). Documents can now be emailed to clients directly from the hub, not just copy-link.
- Client detail page (`/hub/clients/[id]`) fully rolled out against `hub-client-detail.html` (the design folder's complete 6-tab mockup, found 2026-07-20 — had been missed in the earlier design-system pass): new page header, tab strip icons/badges, Profile tab restructured to card-per-subject, Training tab table, plus a button-radius restyle (`rounded-full` → `rounded-lg`) across Compliance/Training/Plan Agent/Updates so all six tabs now read consistently. Live on staging (commits `2acaf4e`, `211f3f7`).

## Built
- DB schema (now on plain Postgres, originally built on Supabase): clients, blocks, sessions, signed_agreements, signed_parq, medical_clearance_tracker, client_tracker
- **6-week update emails**: block_summaries JSONB + sent_updates table (migration)
- **4-week update template**: `four_week_update` kind (lib/email-templates/four-week-update.ts) —
  7 sections incl. "What Every Session Is Actually Doing" / "A Couple of Things to Keep an Eye On",
  for injury/recovery-block reviews. No auto-generate-from-data path yet (six-week only); drafts
  authored via scripts/create-update-draft.mjs or hand-edited in the hub. See handoff.md 2026-07-17.
- **Reusable SMTP send layer**: lib/email.ts — nodemailer, dry-runs gracefully when unconfigured
- **Branded email template**: inline-CSS, 6 sections, Rose/Teal brand colours
- **Generation API**: pulls profile + blocks + summaries → Claude or template-based fallback
- **Send API**: SMTP send + history storage
- **UI**: /hub/clients/[id]/updates (history) + /updates/new (generate → review → send)
- **Updates tab** on client detail page
- Hub: client CRUD, block generation (Claude + fallback), session review, agreement management
- **Custom Icon System**: components/icons/index.tsx — all public and hub pages updated
- **Document engine** (2026-07-20): `document_templates`/`client_documents` covers `terms`/`risk_assessment`/`annual_review`/`consent`; shared `DocumentView` component gives every kind the same real branded structure (masthead/eyebrow/toolbar/sign-boxes/footer); `lib/documents/render.tsx` renders interactive consent checkboxes when a template has `consentGroups`. Email-send action (`app/api/documents/[id]/route.ts`, action `send_email`) reuses `lib/email.ts`; falls back to dry-run if no SendGrid/SMTP env vars are set — **not confirmed which backend is live on this environment, verify before relying on real sends.**
- **Process & Quality System** (2026-07-20): `process_entries`/`sops`/`improvement_log` tables + `/hub/process-quality` CRUD UI, DB-backed so Esther can edit without a code deploy. **Tables are empty** — no real content written yet.
- **Client portal** (2026-07-20): magic-link auth (`lib/portal-auth.ts`, separate from staff auth) + read-only `/portal/*` view — **built but not deployed live**, no real client account exists.

## Known Issues
- `components/hub/PackagePaymentsCard.tsx` still has the old `rounded-full` pill buttons — same fix as the rest of the hub restyle, just not yet done (flagged 2026-07-20, Craig hasn't said whether to include it)
- Client detail page's "Send email" button greyed out for at least one client Craig tested — likely just that client having no email on file (`DocumentDetailClient.tsx` disables intentionally when `clients.email` is empty), but not confirmed which client or ruled out as a real bug
- RESEND_API_KEY not set — PDF email is dead until configured
- ANTHROPIC_API_KEY empty — Claude generation (blocks + updates) falls back to template
- SMTP/SendGrid backend status for the new document-email feature is unconfirmed as of 2026-07-20 — check `getEmailStatus()` (`lib/email.ts`) before assuming real client emails go out, not just dry-run
- PAR-Q still lives on the legacy `signed_parq` table — a document-engine migration script exists (`scripts/migrate-parq-to-engine.mjs`) but has not been run against prod
- Client data (Trainerize/Outlook/paper) is not yet consolidated into the hub `clients` table — decided to do this by manual entry, not started

## Required Actions
- Set SMTP env vars (or confirm SendGrid is already the live backend)
- Set ANTHROPIC_API_KEY
- Verify SPF/DKIM
