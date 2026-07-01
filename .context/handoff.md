# Handoff

## Session
6-week client update email feature — complete. Phases 1-4 built, build+tsc clean.

## What's Built
- Migration: block_summaries JSONB on clients, sent_updates table
- Reusable lib/email.ts SMTP send layer (dry-runs gracefully when unconfigured)
- Branded inline-CSS email template (6 sections: Attendance, Highlights, Areas to Develop, What's Next, Worth Saying, Sign-off)
- POST /api/clients/[id]/six-week-update/generate — draft from real data (Claude or fallback)
- POST /api/clients/[id]/six-week-update/send — SMTP send + history storage
- GET /api/clients/[id]/six-week-update/history — list sent updates
- UI: /hub/clients/[id]/updates (history list) + /updates/new (generate → preview/edit HTML → enter email → send)
- Updates tab added to client detail page (7th tab)
- nodemailer installed

## What's Next
- **Must do**: Apply migration to Supabase (`20260701_six_week_updates.sql`)
- **Must do**: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local
- **Must do**: Set ANTHROPIC_API_KEY in .env.local for LLM-powered drafting
- **Should do**: Verify SPF/DKIM on eternal-fitness.co.uk for deliverability
- **Optional**: Add trainer-facing block_summaries editor (currently generated from profile.notes + blocks)

## Outstanding Questions
- SMTP credentials / provider?
- SPF/DKIM status on eternal-fitness.co.uk?
- Which LLM provider for generation? (Claude already in deps, key empty)

## Decisions
- API routes (not server actions) to match existing codebase
- Nodemailer for SMTP (reusable across DO hub)
- Anthropic Claude as LLM provider (already packaged)
- Migration-only: no backfill of block_summaries
- Never auto-send; always generate → review → send
