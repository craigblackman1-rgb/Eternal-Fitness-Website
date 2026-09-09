# Lane: BUG-EF-148 — ongoing packages: no "0 of 0", truthful ledger

Work ONLY here. COMMIT increments to lane/ef-ongoing-pot. No pushes, no dev servers/browsers. `npx tsc --noEmit` clean. NO migrations.

An ongoing client (sessions_purchased NULL, e.g. Emma) currently gets "0 of 0 sessions used", a NaN% bar, "Package started — 0 sessions", and every ledger row clamped to "0 remaining". `deriveSessionPot` (lib/session-pot.ts) already returns `remaining: null` and carries `purchasedIsEstimate`/`estimatedPurchase`/`estimatedRemaining` — the route throws all of it away.

1. `app/api/clients/[id]/pot-ledger/route.ts`:
   - `:92` keep `purchased` nullable (`client.sessions_purchased ?? null`); `:295` `remaining: derivedPot?.remaining ?? null`. Forward `used` (baseline+completed+charged) and an `ongoing: purchased == null` flag in `consumption`.
   - Ledger for ongoing: opening row becomes "Ongoing package — no session cap" (delta null, no purchased number); do NOT clamp — for ongoing, replace the running `remaining` with a running `used` count per row (label it so the UI can render "N used so far"), or emit `remaining: null` per row and let the UI show the used column.
2. `app/hub/(protected)/clients/[id]/PotLedger.tsx`:
   - Type `purchased`/`remaining` nullable. Ongoing renders: header "Ongoing — {used} sessions used" (true completed+charged count), NO progress bar (or a neutral used-only count row), counters show completed/cancelled as now but "remaining" row hidden.
   - Fix `:65` NaN% (guard purchased null/0) and `:80/:89-90/:100`.
   - Ledger rows for ongoing show the running used count instead of "0 remaining".
3. Adjacents: `components/hub/SessionPotCounter.tsx:33` (`purchased || 1`) and `:84` raw `{purchased}` — guard null → render "Ongoing"; `clients/[id]/ClientDrawers.tsx:1099-1101` — don't render "Typed: 0 used" when sessionsUsed is null (say "not set").
4. Capped clients (purchased set) must render EXACTLY as today — no behaviour change.

Done: tsc clean, committed, commit message states the ongoing vs capped render matrix.
