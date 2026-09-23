@AGENTS.md

## Claude-specific
- `eternal-fitness` skill (Anthropic Skills) is the single source of truth for anything touching
  this project (training plans, client profiles, site content, the app itself) — load it before
  acting, don't restate its content here.
- `.claude/launch.json` currently runs `npm run dev` on port 3000 (not `pnpm`, despite pnpm
  being the project's package manager everywhere else — worth fixing if it causes a lockfile
  mismatch). Use `preview_start` with this config rather than a bare shell dev server.
- Global operating model (worktrees, model routing, gates, hub-first records) lives in
  `~/.claude/CLAUDE.md` and `D:\apps\infrastructure\` SOPs — not restated here.
