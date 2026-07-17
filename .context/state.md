# Eternal Fitness Website — State

## Current
- Next.js 14 / Tailwind / shadcn-ui / self-hosted Postgres on Coolify (migrated off Supabase — see decisions.log 2026-07-xx)
- Hub with client management, training blocks, agreements, PAR-Q
- **Custom icon system**: 36+ SVG icons replacing lucide-react ✅
- 6-week client update email feature: **BUILT** (all phases complete, build+tsc clean)

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

## Known Issues
- RESEND_API_KEY not set — PDF email is dead until configured
- ANTHROPIC_API_KEY empty — Claude generation (blocks + updates) falls back to template
- No SMTP credentials configured yet

## Required Actions
- Set SMTP env vars
- Set ANTHROPIC_API_KEY
- Verify SPF/DKIM
