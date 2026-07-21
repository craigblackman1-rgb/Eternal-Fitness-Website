# Eternal Fitness Website — State

## Current
- Next.js 14 / Tailwind / shadcn-ui / self-hosted Postgres on Coolify (migrated off Supabase — see decisions.log 2026-07-xx)
- Hub with client management, training blocks, agreements, PAR-Q
- **Custom icon system**: 90+ SVG icons replacing lucide-react (grew from 36+ this session — `IconRefreshCw`, `IconUser`, `IconShieldCheck`, `IconRuler` added where a mockup specified a shape genuinely missing) ✅
- 6-week client update email feature: **BUILT** (all phases complete, build+tsc clean)
- **Active Work Order** (2026-07-20, SOP-008): `.context/workorder-eternal-fitness-hub-consolidation-2026-07-20.md` — client data consolidation + document-led client portal. See that file's DONE checklist for live status; see `.context/handoff.md` for the full per-unit log.
- Client document engine now visually matches the new brand design system (`D:\apps\design-systems\brand-staging-2662e9`) — masthead, accessibility toolbar (text size + high contrast), sign-boxes — applied to all 4 document kinds. New `consent` document type live (checkbox-based content permissions). Documents can now be emailed to clients directly from the hub, not just copy-link.
- Client detail page (`/hub/clients/[id]`) fully rolled out against `hub-client-detail.html`. Live on staging (commits `2acaf4e`, `211f3f7`).
- Six more hub screens restyled to match mockups (dashboard, exercise library, process & quality, reports/updates, SOP detail view, studio equipment) — live on staging.
- **Lane F pushed and deployed 2026-07-21** (was sitting locally since 2026-07-20): every remaining hub route with no source mockup restyled — `clients/new`, training delivery pages, PAR-Q, agreements, top-level documents register, settings, site-content, site-review, templates, tracker, hub auth screens, `PackagePaymentsCard` button fix.
- **Client portal is now actually live** (2026-07-21) — was built 2026-07-20 but had a real infinite-redirect-loop bug (`/portal/login` nested inside its own auth-gating layout) that made it completely unreachable; fixed and deployed. No real client invited yet — that's still a `[GATE]`.
- **Hub-wide icon/status-colour audit (2026-07-21)** — 8 hub pages checked against their OpenDesign mockups after Craig caught a real drift on Site Content; 6 of 8 had genuine defects, several serious (invisible white-on-white badges, silently-blank dashboard status pills, a literal `/* comment */` rendering as visible page text). Full detail in the Work Order's new Lane G. Also fixed the actual root cause of the `ClientUpdatesPanel.tsx:60` TS error that had been flagged "pre-existing, unrelated" three separate times — `tsc --noEmit` is now completely clean project-wide.
- **Site Content page rebuilt into a full inventory** (2026-07-21) — was tracking only 9 static pages; now covers all 47 real+planned pages (static, all 8 condition pages, all 3 legal pages, all 27 blog posts) with status filters (Published/Needs Writing/Needs Updating) and type filters, matching a new OpenDesign mockup. Migration `20260721_site_content_full_inventory.sql` applied to prod.
- **Blog byline fixed** (2026-07-21) — 26 of 27 posts corrected from "Craig Blackman" to "Esther Fair". Content/titles untouched, awaiting Esther's full content review separately.
- **SEO fixes shipped** (2026-07-21) — blog meta descriptions were raw truncated excerpt text (199-200 chars, past Google's ~155-160 limit, occasionally leaking a literal `&nbsp;`); cleaned via a new `cleanMetaDescription()` helper. 4 of 5 raw `<img>` tags converted to `next/image`. Added blog→condition-page internal links (previously zero). Sitemap `lastModified` now uses `updated_at`. `/portal` added to `robots.ts`'s disallow list, matching `/hub`'s existing (already-correct) noindex treatment.
- **Resend now works on every document kind, built, NOT pushed** (2026-07-21, later) — PAR-Q's "Send" action was copy-link-only despite looking like an email button; it now has a real "Email …" action (`app/api/parq/send-email/route.ts`, mirrors the document engine's send flow). 6-week/4-week update emails can now be resent once sent (`UpdateRowActions.tsx`, `app/api/updates/[updateId]/send/route.ts`), which was previously blocked outright. Agreements' email button (`AgreementDetailClient.tsx`) was silently dead — it used an unconfigured `RESEND_API_KEY`/`resend` package instead of the app's real backend; rewired onto `lib/email.ts`, which gained attachment support (`SendEmailInput.attachments`, both SendGrid and SMTP paths) so the PDF attachment still works. A follow-up fix found and closed a real PAR-Q link bug: two places (`AgreementDetailClient.tsx`'s "copy client link", the hub PAR-Q edit page's admin-mode "copy client link") built a bare `/parq/edit/[id]` link with no signature, always rejected as invalid — both now mint the same signed exp/sig pair the working "Send PAR-Q update" flow already used. `tsc --noEmit` clean; not live-verified (no hub credentials this session) or deployed. See handoff.md.
- **Hub mockup-alignment pass, Lane H, built, NOT pushed** (2026-07-21, later still) — 12-agent visual/IA pass against all `hub-*.html` mockups. Most routes already matched from earlier sessions (verified, not assumed). Real fixes: All Documents rebuilt to the hub's own list-page pattern (its mapped mockup turned out to be an SOP detail page, not a list — flagged separately), Site Content list (TokenPill fix), Site Content editor (fixed a literal `&amp;amp;` text bug + missing icon + Title Case labels + missing subtitle). Process & Quality's real CRUD/data confirmed untouched throughout — mockup's onboarding-checklist content deliberately not added, per Craig's decision. `tsc --noEmit` clean project-wide. Three items spawned as separate background-task suggestions rather than actioned: client-edit page missing a right rail/clearance banner (needs new computed logic), `ProcessQualityManager.tsx` badge-markup dedup, and the hub-sop/All-Documents mockup mismatch. See Work Order Lane H and handoff.md.

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
- **Process & Quality System** (2026-07-20): `process_entries`/`sops`/`improvement_log` tables + `/hub/process-quality` CRUD UI, DB-backed so Esther can edit without a code deploy. **Now seeded** with 10 real SOPs + 10 matching Process Register entries (published 2026-07-20, background session — see handoff.md for the full list and how it was published). `improvement_log` still empty — no incidents logged yet.
- **Client portal** (2026-07-20, deployed live 2026-07-21): magic-link auth (`lib/portal-auth.ts`, separate from staff auth) + read-only `/portal/*` view. No real client account exists yet.
- **Site Content inventory** (2026-07-21): `page_keywords` table now covers all 47 pages (static/condition/legal/blog) with `page_type` column and a published/needs_writing/needs_updating status model; `/hub/site-content` list + `/hub/site-content/[slug]` editor rebuilt to match the OpenDesign mockup.

## Known Issues
- Client detail page's "Send email" button greyed out for at least one client Craig tested — likely just that client having no email on file (`DocumentDetailClient.tsx` disables intentionally when `clients.email` is empty), but not confirmed which client or ruled out as a real bug
- RESEND_API_KEY not set — PDF email is dead until configured
- ANTHROPIC_API_KEY empty — Claude generation (blocks + updates) falls back to template
- SMTP/SendGrid backend status for the new document-email feature is unconfirmed — check `getEmailStatus()` (`lib/email.ts`) before assuming real client emails go out, not just dry-run
- PAR-Q still lives on the legacy `signed_parq` table — a document-engine migration script exists (`scripts/migrate-parq-to-engine.mjs`) but has not been run against prod
- Client data (Trainerize/Outlook/paper) is not yet consolidated into the hub `clients` table — decided to do this by manual entry, not started
- PAR-Q edit screen inside the hub (`/hub/clients/[id]/parq/[parqId]/edit`) still uses the shared public-facing `ParqEditClient` component's own styling internally — deliberately not restyled, since that component is also live on the public client-signing flow and a deep edit risks breaking it. Needs a scoped decision (fork vs. leave) before touching.
- 5 of 8 `exercise-for-health` condition sub-pages still don't exist (`type-2-diabetes`, `copd`, `heart-conditions`, `chronic-pain`, `adaptive-training`) — gated off (`available: false`) on the index page, not dead links. Scope decision needed on how many to build before launch.
- 27 blog posts are still unedited legacy WordPress content pending Esther's voice/hard-rule review — content/titles deliberately untouched this session (only the byline field was fixed).

## Required Actions
- Set SMTP env vars (or confirm SendGrid is already the live backend)
- Set ANTHROPIC_API_KEY
- Verify SPF/DKIM
