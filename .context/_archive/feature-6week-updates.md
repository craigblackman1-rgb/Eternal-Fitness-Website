# Feature: 6-Week Client Update Emails

## Overview
Generate branded 6-week client update emails from real profile/block data and send via SMTP. Never auto-send — always a generate → review → send workflow.

## Data Sources
- `clients` table: profile JSONB (goals, health, notes), compliance fields
- `blocks` table: block_note, summary, status, block_number per client
- `block_summaries` (new JSONB on `clients`): structured 6-week update data
- `sent_updates` (new table): history of sent updates

## Email Template (Branded)
- Sections: Attendance & Consistency, Strength & Fitness Highlights, Areas to Keep Developing, What's Next for You, Worth saying…, Esther x
- Subject: "Your last 6 weeks with me 🏋️"
- Colours: Rose #C1839F, Teal #087E8B, DM Sans font
- Email-safe inline CSS, no external dependencies

## Generation Rules
- Draft from real profile data only
- Never invent progress — use `[CLIENT]` placeholders where data missing
- Clinical framing; no "transformation"/"results-driven"/before-after language
- Esther's voice: warm, expert, first-person

## Workflow
1. Trainer navigates to client → Updates tab
2. Clicks "Generate 6-Week Update"
3. Server builds draft from block_summaries + profile + blocks
4. Trainer reviews + edits the draft
5. Trainer clicks "Send" → email sent via SMTP (nodemailer)
6. Record stored in `sent_updates` table

## Send Layer
- Reusable `lib/email.ts` module — SMTP via nodemailer, env-var config
- Designed so DO hub can adopt same module later
- Credentials: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## History
- `sent_updates` table: client_id, sent_at, subject, body_html, block_number
