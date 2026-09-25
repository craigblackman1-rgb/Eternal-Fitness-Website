# Lane notes — ef-img-desc-fix2

Replaced the mobile (≤760px) media query block at `app/design-system.css:691` that governed
`ef-desc--overlay` positioning. The old rule kept the pill bottom-right on mobile; the new
rule moves it to top-right (12px inset) to avoid collision with stacked hero/CTA buttons.
On heroes the pill is further nudged down (top: 84px) to clear the fixed nav bar.
`npx tsc --noEmit` clean.
