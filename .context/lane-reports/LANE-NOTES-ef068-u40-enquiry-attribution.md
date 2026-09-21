# Lane Notes — ef068-u40-enquiry-attribution

## What changed

### Migration: `db/migrations/20260921_enquiry_attribution.sql`
- Created a new `leads` table for the general lead-capture forms (contact page form, consultation dialog). Previously these forms only sent an email notification — no DB record.
- Added attribution columns (`referrer`, `landing_page`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) to the existing `discovery_call_leads` table.

### API: `app/api/leads/route.ts`
- Imported `supabase` client (pg shim).
- Extracts attribution fields from the request body: `referrer`, `landing_page`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
- Inserts a `leads` row before sending the notification email. DB insert failure is logged but does not block the email (email is the primary notification path).

### API: `app/api/discovery-call/route.ts`
- Extracts the same attribution fields from the request body.
- Includes them in the `discovery_call_leads` insert.

### Client: `lib/attribution.ts` (new)
- `captureAttribution()` — reads `document.referrer`, `window.location.href`, and UTM query params from the current browser context. Returns empty strings server-side.
- `fireGenerateLeadEvent(attribution, source)` — pushes a `generate_lead` event to `window.dataLayer` (GTM's data layer) with UTM/referrer/landing_page as event params. No-op if GTM isn't loaded (staging/local).

### Client: `app/contact/ContactPageClient.tsx`
- Imports `captureAttribution` and `fireGenerateLeadEvent`.
- On form submit, captures attribution and spreads it into the `fetch` body alongside the existing form fields.
- Fires `generate_lead` GA4 event on successful submission.

### Client: `app/discovery-call/DiscoveryCallClient.tsx`
- Same pattern: captures attribution, spreads into the `fetch` body on confirm, fires GA4 event on success.

## How to verify

1. **DB columns exist** — run the migration against the DB: `psql -f db/migrations/20260921_enquiry_attribution.sql`. Check:
   - `\d leads` shows all 13 columns including 7 attribution fields.
   - `\d discovery_call_leads` shows the 7 new attribution columns appended.

2. **Form submission stores attribution** — visit `/contact` with UTM params in the URL (e.g. `?utm_source=google&utm_medium=cpc&utm_campaign=test`), fill and submit the form. Check the `leads` table:
   ```sql
   SELECT name, source, referrer, landing_page, utm_source, utm_medium, utm_campaign
   FROM leads ORDER BY created_at DESC LIMIT 5;
   ```
   The `utm_source` should be `google`, `utm_medium` should be `cpc`, etc. `landing_page` should be the full contact page URL. `referrer` will be empty for direct visits.

3. **Discovery call stores attribution** — same test on `/discovery-call`. Check `discovery_call_leads`:
   ```sql
   SELECT name, utm_source, utm_medium, utm_campaign, landing_page
   FROM discovery_call_leads ORDER BY created_at DESC LIMIT 5;
   ```

4. **GA4 generate_lead fires** — in production (with GTM loaded), open browser DevTools Console before submitting the form. After successful submission, run:
   ```js
   // The dataLayer should contain an event like:
   window.dataLayer.filter(e => e.event === 'generate_lead')
   ```
   You should see an entry with `lead_source`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, and `landing_page`.

   In GTM Realtime, the `generate_lead` event should appear with the attribution params as custom event parameters. Note: GTM only loads in production (`NEXT_PUBLIC_ALLOW_INDEXING=true`), so this won't fire in local dev or staging.

## Files changed
- `db/migrations/20260921_enquiry_attribution.sql` (new)
- `lib/attribution.ts` (new)
- `app/api/leads/route.ts`
- `app/api/discovery-call/route.ts`
- `app/contact/ContactPageClient.tsx`
- `app/discovery-call/DiscoveryCallClient.tsx`
