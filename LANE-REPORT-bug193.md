# LANE-REPORT — BUG-EF-193

## Summary

Mobile exercise card on `/hub/m/train/[sessionId]` collapsed into a horizontal row because dead CSS rules in `app/globals.css` leaked `display:flex` into `app/hub/m/mobile.css`'s `.ex` class.

## Files touched

| File | Change |
|---|---|
| `app/globals.css` | Deleted 18-line "Superset card (workout drawer)" block (old L1720-1736) |
| `app/hub/m/mobile.css` | Added `display: block` to `.ex` rule (L312) |

## Rules removed from `app/globals.css`

All of the following were dead — no desktop code uses `.ss`, `.ss-hd`, `.ex`, `.ex-l`, `.ex-n`, or `.ex-p` outside `app/hub/m/`:

```css
/* Superset card (workout drawer) */
.ss { border: 1px solid var(--hub-border); border-left: 4px solid var(--color-body); border-radius: var(--r-nested); margin-bottom: 11px; overflow: hidden; background: var(--hub-card); }
.ss-hd { display: flex; align-items: center; gap: 9px; padding: 8px 12px; background: var(--hub-hover); border-bottom: 1px solid var(--hub-border); font-size: 11.5px; font-weight: 800; color: var(--color-ink); text-transform: uppercase; letter-spacing: .06em; }
.ss-hd .rest { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 500; font-size: 12px; color: var(--color-body); }
.ss:nth-of-type(4n+1) { border-left-color: var(--color-teal); }
.ss:nth-of-type(4n+1) > .ss-hd { background: var(--status-success-bg); color: var(--status-success-text); }
.ss:nth-of-type(4n+2) { border-left-color: var(--color-rose); }
.ss:nth-of-type(4n+2) > .ss-hd { background: var(--status-primary-bg); color: var(--rose-text); }
.ss:nth-of-type(4n+3) { border-left-color: var(--color-ink); }
.ss:nth-of-type(4n+3) > .ss-hd { background: var(--status-neutral-bg); color: var(--color-ink); }
.ss:nth-of-type(4n+4) { border-left-color: var(--status-warning); }
.ss:nth-of-type(4n+4) > .ss-hd { background: var(--status-warning-bg); color: var(--status-warning-text); }
.ex { display: flex; align-items: center; gap: 11px; padding: 10px 12px; font-size: 13px; }
.ex + .ex { border-top: 1px solid var(--hub-border); }
.ex-l { flex-shrink: 0; width: 28px; font-weight: 700; font-size: 12px; color: var(--color-body); text-align: center; }
.ex-n { flex: 1; min-width: 0; color: var(--color-ink); font-weight: 500; }
.ex-p { flex-shrink: 0; font-size: 12px; color: var(--color-body); white-space: nowrap; font-variant-numeric: tabular-nums; }
```

## `.ex-p` handling

`.ex-p` was already defined in `mobile.css:840` with its own rules (`font-size: 11.5px; color: var(--muted); display: block`), used by `app/hub/m/clients/[id]/add-workout/page.tsx` (lines 644, 653). No move needed — the mobile.css definition already covers it.

## `.ex` hardening

`app/hub/m/mobile.css` L312 now reads:

```css
.ex { display: block; background: var(--card); border: 1px solid var(--border); border-radius: 13px; padding: 11px; }
```

The explicit `display: block` prevents a future global CSS leak from overriding the block layout again.

## Class name collisions: `app/globals.css` vs `app/hub/m/mobile.css`

These short class names exist in both files (potential future leak vectors):

| Class | globals.css context | mobile.css context |
|---|---|---|
| `.btn` | Button component | Button component |
| `.btn-primary` | Button variant | Button variant |
| `.btn-outline` | Button variant | Button variant |
| `.btn-ghost` | Button variant | Button variant |
| `.btn-danger` | Button variant | Button variant |
| `.btn-icon` | Button variant | Button variant |
| `.drow` | Row component | Row component |
| `.edit-save-bar` | Edit/save bar | Edit/save bar |
| `.field` | Form field | Form field |
| `.hrow` | Horizontal row | Horizontal row |
| `.pill` | Pill badge | Pill badge |
| `.seg` | Segment | Segment |
| `.seg-btn` | Segment button | Segment button |
| `.srow` | Session row | Session row |
| `.srow-d` | Session row date | Session row date |
| `.t-title` | Title | Title |
| `.tag` | Tag | Tag |

Note: These are shared class names, not necessarily bugs — many are intentionally shared (e.g., `.btn-primary`, `.pill`). The risk is that a globals.css rule adds unexpected layout (e.g., `display: flex`) that leaks into mobile.css block-layout contexts. Only the `.ex` collision actually caused a visible bug; the others may be benign.

## Build verification

### npx tsc --noEmit

```
npm warn Unknown project config "only-built-dependencies". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

Clean — no type errors.

### npm run build

```
 ✓ Compiled successfully
```

Build compiles successfully. Standalone file-tracing fails with EPERM on symlinks — this is a pre-existing Windows/pnpm issue documented in CLAUDE.md, unrelated to this change. Coolify (Linux Docker) builds are unaffected.

## Commit

```
fix(BUG-EF-193): remove dead desktop .ex/.ss rules leaking into the mobile exercise card
```

Commit: `b5a823c` on branch `lane/ef-bug-ex-card-css`.
