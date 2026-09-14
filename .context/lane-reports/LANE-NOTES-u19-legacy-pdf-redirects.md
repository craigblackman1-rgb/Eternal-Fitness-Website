# Lane Notes — u19: Legacy WordPress PDF & media redirects

**Unit:** wo-ef-consolidated-2026-09-08 u19 residual
**Ticket:** CR-INF-013
**Commit:** fea61ba
**File changed:** `next.config.js` (redirects array only)

## What changed

11 new 301 permanent redirects added to the "Legacy WordPress site migration redirects" section of `next.config.js`. These catch legacy WordPress media and infrastructure URLs that still rank in Google Search Console and return 404.

## Rules added (in order)

| # | Source | Destination | Notes |
|---|--------|-------------|-------|
| 1 | `/wp-content/uploads/:path(.*\\.pdf)` | `/personal-training` | PDFs were pricing/offer sheets; regex segment ensures only `.pdf` matches |
| 2 | `/wp-content/uploads/:path*` | `/` | Any other legacy media file |
| 3 | `/wp-content/:path*` | `/` | Other wp-content paths |
| 4 | `/wp-includes/:path*` | `/` | WordPress includes |
| 5 | `/wp-admin/:path*` | `/` | WordPress admin (shouldn't hit but defensive) |
| 6 | `/wp-json/:path*` | `/` | WordPress REST API |
| 7 | `/feed` | `/blog` | RSS feed (blog route exists at app/blog/) |
| 8 | `/feed/:path*` | `/blog` | Specific feed variants |
| 9 | `/comments/feed` | `/blog` | Comment feed |
| 10 | `/xmlrpc.php` | `/` | WordPress XML-RPC |
| 11 | `/wp-login.php` | `/` | WordPress login |

## Design decisions

- **PDF rule uses regex segment** `:path(.*\\.pdf)` rather than a has-query filter, per task instruction. This ensures only `.pdf` URLs hit the `/personal-training` destination.
- **Feed redirects go to `/blog`** because `app/blog/page.tsx` exists (though currently re-gated to `/` via the content re-gated section — the redirect chain feed→/blog→/ is fine; Google follows it).
- **All rules are `permanent: true` (301)** — these are legacy URLs with no intent to serve them again.
- **Specific PDF rule ordered before general uploads** to ensure `.pdf` URLs get the smarter destination.

## Post-deploy curl verification

```bash
# PDF from uploads → /personal-training (301)
curl -sI https://eternal-fitness.co.uk/wp-content/uploads/2023/05/pricing.pdf | head -5

# Other media from uploads → / (301)
curl -sI https://eternal-fitness.co.uk/wp-content/uploads/2023/05/photo.jpg | head -5

# wp-content catch-all → / (301)
curl -sI https://eternal-fitness.co.uk/wp-content/some-script.js | head -5

# wp-includes → / (301)
curl -sI https://eternal-fitness.co.uk/wp-includes/js/jquery.js | head -5

# wp-admin → / (301)
curl -sI https://eternal-fitness.co.uk/wp-admin/index.php | head -5

# wp-json → / (301)
curl -sI https://eternal-fitness.co.uk/wp-json/wp/v2/posts | head -5

# Feed → /blog (301)
curl -sI https://eternal-fitness.co.uk/feed | head -5

# Feed with path → /blog (301)
curl -sI https://eternal-fitness.co.uk/feed/comments/ | head -5

# Comments feed → /blog (301)
curl -sI https://eternal-fitness.co.uk/comments/feed | head -5

# xmlrpc → / (301)
curl -sI https://eternal-fitness.co.uk/xmlrpc.php | head -5

# wp-login → / (301)
curl -sI https://eternal-fitness.co.uk/wp-login.php | head -5
```

All should return `HTTP/1.1 301` with a `Location` header pointing to the destination above.

## Verification performed

- `node --input-type=module` load test: all 11 rules printed correctly
- `tsc --noEmit`: passes clean (no unrelated type errors introduced)
- No duplicate sources against existing redirects array
