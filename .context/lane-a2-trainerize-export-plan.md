# Lane A, unit 2 — Trainerize client-data export path

> Read-only research artifact. **No live Trainerize credentials or browser session were available
> in this environment**, so nothing here was tested against a real client. Every claim about what
> Trainerize *would* expose is inferred from the existing exercise-library scraper and from
> Trainerize's known product surface — flagged as such. **This unit cannot be fully verified
> without Craig's Trainerize login in a session with browser access.** See the explicit flag at
> the end.

## 1. What the existing scraper tells us about Trainerize's access model

Source: `scripts/scrape-trainerize-exercises.mjs` (read in full).

- **Host/tenant**: `https://eternalfitness8.trainerize.com/app/...` — the studio is a single
  Trainerize *company* tenant (`eternalfitness8`), not white-labelled. All data lives under that
  subdomain.
- **Auth**: form-post login at `/app/login` with `#emailInput` + `#passInput`, submitted via a
  `data-testid="signIn-button"`. Credentials are passed as **env vars** (`TRAINERIZE_EMAIL`,
  `TRAINERIZE_PASSWORD`) — never written to disk. The scraper runs **headless Chromium via
  Playwright** (pinned to `playwright@1.61.0` in this repo's `node_modules/.pnpm`).
- **It is a logged-in, browser-rendered app** — not a REST API the scraper talks to directly. The
  scraper navigates real pages (`ExerciseLibrary.aspx?mode=all&level=trainer`), waits for
  lazy-loaded DOM (infinite scroll dispatch), and reads DOM nodes (`[exercise-id]`, the
  `.exerciseDialog-details` panel). There is **no API token, no `Authorization` header, no JSON
  endpoint** in the script.
- **Trainerize role matters**: the scraper uses `level=trainer` — i.e. it authenticates as a
  **trainer/admin account**, which is the perspective that can see the full library. A client
  (client-level login) would see only their own programming, not the studio-wide data.
- **What it scrapes vs what we need**: the scraper pulls *exercise definitions* (name, image,
  type, tags, instructions, video) — a **content/catalog** data type. Client records (name,
  contact, PAR-Q, measurements, session history, program assignments) are a **completely
  different data type** exposed at different Trainerize URLs (e.g. a clients/roster or
  `/app/Clients.aspx`, individual client dashboards). **No existing script touches client data.**
- **Technical precedent we can reuse**: if we go the screen-scrape route, the
  login + Playwright + resumable-JSON-export pattern in this script is directly portable — same
  tenant, same auth, same credential-handling discipline. We would *not* be inventing the access
  mechanism, only pointing it at client-facing pages and a different DOM shape.

## 2. Most likely export options, ranked by feasibility

Ranked from most to least feasible for *extracting real EF client records*. All are unverified
here — see the flag at the end.

### 🥇 1. Manual read-and-type into hub staging files (highest certainty, lowest automation)
- Trainerize's web app shows each client's profile, contact details, PAR-Q, measurements, and
  session/program history in the trainer dashboard. Craig/Esther can open each client and
  transcribe the fields the hub needs (per the field map in `lane-a-client-field-map.md`).
- **Pros**: zero integration risk, works regardless of what Trainerize exposes programmatically,
  no auth/automation fragility, fully reversible (nothing is deleted from Trainerize). Defensible
  as the *first* method while the count of Trainerize-backed clients is established.
- **Cons**: slow, error-prone for large volumes, doesn't scale — but EF is a 1–2 person studio
  with a small active client count (the hub already has ~13+ clients ported via other paths), so
  volume likely does not justify heavy automation.
- **Verdict**: almost certainly the pragmatic default for a handful of clients. The Work Order
  explicitly allows "hand-enter for low-volume sources" (unit A3).

### 🥈 2. Built-in Trainerize CSV / client export (if the tenant plan supports it)
- Trainerize (Trainerize by ABC Fitness) exposes client/roster export features in the trainer
  admin UI for many plan tiers — typically a "Export" action on the clients list or per-client
  profile (progress/measurement CSVs, client list CSV). Whether *this specific tenant*
  (`eternalfitness8`) has that feature enabled depends on its subscription level, which we cannot
  confirm without logging in.
- **Pros**: cleanest, most structured data; no DOM scraping fragility; repeatable per client.
- **Cons**: feature availability is plan-dependent and unverified; even when present, the CSV
  schema may not line up 1:1 with the hub `clients` columns (needs a mapping pass — same job as
  the field map already produced).
- **Verdict**: the best *automated* option **if** it exists on this tenant. Must be confirmed by
  logging in as the trainer account and looking for an Export control on the clients list.

### 🥉 3. Admin-panel / client-list screen-scrape (extend the existing Playwright pattern)
- Port the login + headless-browser pattern from `scrape-trainerize-exercises.mjs` to the
  clients/roster page(s), reading client-profile DOM nodes into a JSON/CSV staging file.
- **Pros**: reuses a proven access model in this repo; handles whatever the UI shows; resumable
  export pattern already exists.
- **Cons**: Trainerize UI is not a stable contract — selectors break on redesign; pagination/lazy
  load must be handled per page; PII (emails, phone, medical notes) would be pulled through a
  headless browser and written to a local JSON file (credential/PII-handling discipline required,
  matching the existing env-var + never-to-disk pattern); likely *more* fragile and slower to
  build than option 2 if a native export exists.
- **Verdict**: the fallback if no native CSV export exists and the client count is high enough to
  justify the build. Not the first choice for a small roster.

### 4. Trainerize partner/REST API (least likely for this tenant)
- Trainerize has a partner API, but it is oriented to the *business/integration* level (typically
  for platform partners, not per-studio ad-hoc client pulls) and requires approved API credentials
  / a partner relationship. The existing scraper uses **no API at all** — strong signal this
  tenant is not on the API tier.
- **Verdict**: do not pursue unless Craig confirms an API key exists. Lowest feasibility for a
  small studio tenant.

## 3. Recommended path (pending live confirmation)

1. **First, log in as the trainer account** and check for a native client/roster **CSV export**
   (option 2). If present → use it, map to the hub `clients` columns via the field map.
2. **If no native export**, and client count is small (likely) → **manual read-and-type** staging
   files (option 1), per the Work Order's low-volume allowance.
3. **Only if** volume is high *and* no native export → invest in a **client-list screen-scrape**
   (option 3), extending the existing Playwright script.
4. **Do not** pursue the partner API (option 4) without explicit confirmation an API key exists.

This mirrors the Work Order's own steer: "Log Trainerize export method used (manual CSV,
screen-scrape, whatever's actually available)" — pick whatever the live tenant actually offers,
documented with a worked example on one real client.

## 4. ⚠ Explicit verification flag

> **This unit is NOT fully verified.** This plan was produced from static analysis of the existing
> exercise-library scraper and Trainerize's general product knowledge. **No live Trainerize
> session was possible** — there are no Trainerize credentials in this environment, no browser
> session with Trainerize access, and no automated test was run against a real client.
>
> Every ranking above (especially whether a native CSV export exists on the `eternalfitness8`
> tenant, and what client-data URLs/pages Trainerize actually serves) is **an inference, not a
> confirmed fact.** The Work Order's VERIFY criterion for A2 — *"method documented with a worked
> example on one real client"* — **cannot be met in this environment.**
>
> **To close this unit:** Craig must open a session with browser access and his Trainerize login,
> log in to `https://eternalfitness8.trainerize.com/app/login`, and (a) confirm the client/roster
> export capability available to this tenant, and (b) run one real client through whichever method
> is chosen, producing a worked staging file. Until then, treat this document as a feasibility
> hypothesis, not a verified method.
>
> Constraints honoured in producing this artifact: **no DB access, no installs, no push.** Local
> commit only.
