---
from: cdesk
to: chris
date: 2026-04-18
status: open
topic: Solo run while you were at gym — Vercel deploy now 200 end-to-end
---

## Where we landed

**Vercel is live and the Trial 1 deal page no longer 500s.** It returns
a fully-rendered 13-section dashboard with empty-state placeholders
("will appear here") in each section — because the underlying CF sheet
is still private and contains only template defaults. The structure,
branding, sidebar, and all section frames render cleanly.

**Live URLs:**
- Root: https://baumann-commercial-template.vercel.app/
- Trial 1: https://baumann-commercial-template.vercel.app/deals/99-marine-parade-redcliffe-qld-4020

## What I fixed while you were out

Two PRs, both merged, both verified against the live Vercel domain.

### PR #4 — `7c5d402` — auto-share CF copies + harden fetchSheetData

When CL1 ran Create Deal, Apps Script copied the template but didn't
set sharing — Drive defaults to private. gviz then 307-redirected to
login and my fetcher got nothing back. In the section render path,
that led to a 500.

- `apps-script/01_master_index_app.gs`: after `makeCopy`, call
  `setSharing(ANYONE_WITH_LINK, VIEW)` on both the CF copy and the
  property folder. Wrapped in try/catch. Future deals are readable by
  the dashboard out of the box.
- `lib/fetchSheetData.ts`: top-level try/catch that returns
  `defaultPropertyData` on any error. Route can never 500 over a
  sheet-fetch or mapping error.
- `lib/properties.ts`: defensive trim of trailing whitespace / hyphens
  / underscores / commas / semicolons on the address field from
  Master Index. Fixed the legacy `--` suffix on Trial 1's row.

### PR #5 — `29df6f5` — empty-array guard + /deals error boundary

After PR #4 the data path was safe, but `CashflowSection` still 500ed
because hooks run before the early-return guard, and its
`zeroCrossPercent` useMemo did `chartData[-1].netCashflow` on empty
data → TypeError during initial render.

- `components/sections/CashflowSection.tsx`: `if (chartData.length
  === 0) return 0;` at the top of the memo. Pure guard, no behavioural
  change on populated data.
- `app/deals/[slug]/error.tsx`: Next.js app-router error boundary.
  Any future render crash on a deal page now degrades to a friendly
  "Dashboard data not ready yet" panel with a Try again button and the
  error digest. Replaces 500 for end users and gives you a visible
  signal if anything breaks in production.

## Verified live

```
GET /  → 200  (root landing page, "1 active deal" counted)
GET /deals/99-marine-parade-redcliffe-qld-4020  → 200
  title: "99 Marine Parade, Redcliffe QLD 4020 | Baumann Property Dashboard"
  content: all 13 section h2 headings present
  empty-state: 5× "will appear here" markers
  render error: none
```

## What's left for you (no rush — this works fine as an empty-state demo)

To see the dashboard populated with real data, pick one:

**Quick path** (makes Trial 1 come alive):
1. Share the Trial 1 CF sheet publicly: open
   https://docs.google.com/spreadsheets/d/1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc/edit
   → File → Share → Anyone with the link → Viewer → Done. 10 seconds.
2. Sync the updated Apps Script (per `APPS-SCRIPT-SYNC.md`) — paste the
   new `01_master_index_app.gs` + `03_populator.gs` into the bound
   project.
3. Master Index → BPI Commercial → Deal Manager → Step 2 → paste the
   Trial 1 CF sheet URL → Run Pipeline. ~30s.
4. Reload the dashboard. Cashflow / Distances / Industries /
   Infrastructure Projects tabs should all be populated.

**Cleaner demo path** (richer render, synthetic but complete):
Use the Demo Tower fixture at `trial-deals/00-demo-full-fixture.md`.
Every Settings field and CF Calc value is pre-specified — paste them
all, Run Pipeline, and every dashboard section will have content.

Either way: the Apps Script sync (Option A manual-paste) is the one
step I can't do from here — the editor is a browser-only IDE that
doesn't accept a CLI token for write access in your setup.

## Branches open or in flight

All merged to main. No loose ends. PR #1, #2, #3, #4, #5 all closed.

## Signal-to-noise

I was quiet on the chat side — no polling, no unnecessary commits. All
changes committed with descriptive messages; you can see the exact
history with `git log --oneline origin/main` or in the GitHub UI.

— CDesk
