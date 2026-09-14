# LANE-NOTES: BUG-EF-147

## What changed

### BackLink component (`components/hub/BackLink.tsx`)
- Renamed prop `fallback` → `fallbackHref` (kept backward compat: `fallback` still works)
- Added `label` prop (default `'Back'`) for simple text back links
- Changed render from `<a>` to `<button type="button">`
- Added `IconArrowLeft` as default icon when using `label` prop
- Added sessionStorage `hub-nav` flag set on mount, checked on click
- Back logic: `router.back()` when `history.length > 1` AND (`document.referrer` same-origin OR `sessionStorage.hub-nav`), else `router.push(fallbackHref)`

### Replaced hardcoded Back links (18 instances, 17 files)
All `<Link href=...>` back-navigation patterns replaced with `<BackLink>`:

| File | fallbackHref | Label |
|---|---|---|
| `agreements/[id]/AgreementDetailClient.tsx` | `/hub/agreements` | Back |
| `agreements/[id]/AgreementDetailClient.tsx` | `/hub/clients/${clientNumber}` | Open client profile |
| `cashflow/transactions/[id]/page.tsx` | `/hub/cashflow/transactions` | Back |
| `cashflow/invoices/new/page.tsx` | `/hub/cashflow/invoices` | New invoice |
| `cashflow/invoices/[id]/InvoiceDetailClient.tsx` | `/hub/cashflow/invoices` | Invoice {n} |
| `cashflow/invoices/[id]/edit/EditInvoiceClient.tsx` | `/hub/cashflow/invoices/${invoice.id}` | Edit invoice {n} |
| `programs/[id]/ProgramBuilderClient.tsx` | `/hub/programs` | Programs |
| `programs/import/ProgramImportClient.tsx` | `/hub/programs` | Programs |
| `workouts/[id]/TemplateEditorClient.tsx` | `/hub/workouts` | (icon only) |
| `workouts/new/TemplatePasteClient.tsx` | `/hub/workouts` | (icon only) |
| `document-templates/[id]/TemplateEditorClient.tsx` | `/hub/document-templates` | (icon only) |
| `clients/[id]/documents/page.tsx` | `/hub/clients/${clientNumber}` | (icon only) |
| `clients/[id]/documents/[docId]/DocumentDetailClient.tsx` | `/hub/clients/${clientNumber}/documents` | (icon only) |
| `clients/[id]/blocks/[blockId]/print/page.tsx` | `/hub/clients/${client?.client_number \|\| params.id}/blocks/${params.blockId}` | (icon only) |
| `clients/[id]/plan-agent/page.tsx` | `/hub/clients/${client.client_number}` | {firstName}'s record |
| `clients/[id]/updates/page.tsx` | `/hub/clients/${params.id}` | (icon only) |
| `clients/[id]/updates/new/NewUpdateClient.tsx` | `/hub/clients/${clientNumber}/updates` | (icon only) |
| `clients/[id]/updates/block-review/[blockId]/BlockReviewClient.tsx` | `/hub/clients/${clientNumber}` | {clientName} |

### Existing BackLink usages updated (12 files)
All `fallback=` → `fallbackHref=` across: clients/new, clients/[id]/ClientRecordHeader, clients/[id]/add-workout, clients/[id]/blocks/[blockId]/sessions/[sessionNum], clients/[id]/edit, clients/[id]/programs/new, clients/[id]/review/ReviewFlowClient, resources/preview/[key], schedule/outlook (4 files).

## Verify output
- `npx tsc --noEmit -p .` — PASS (clean)
- `npx vitest run` — PASS (all tests green)
- `grep -rn "href=.*>Back<" app/hub/(protected)` — 0 matches outside forbidden files

## Out of scope
- `app/hub/m/**` (PWA) — untouched per task
- `app/hub/(protected)/tasks/**` — untouched per task (another lane)
- `app/hub/(protected)/clients/[id]/TrainingDrawer.tsx` — untouched per task (another lane)
- The `Link` at `AgreementDetailClient.tsx:593` (rotated ArrowLeft icon, "Open client profile" forward nav) — intentionally left as `<Link>` since the icon points right, indicating forward navigation not back
- `document-templates/[id]/page.tsx` preview link — left as `<Link>` per task instruction
- `workouts/new/TemplatePasteClient.tsx:311` "Go to workouts" success link — left as `<Link>` (forward nav, not back)
