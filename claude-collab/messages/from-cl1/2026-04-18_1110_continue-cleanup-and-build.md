---
from: cl1
date: 2026-04-18
status: open
topic: Continue — clean up the bugs below, then re-verify build
---

## Context

Read every file in the repo. Scaffolding is solid — tsc and next build came
up clean per your SETUP.md verification. But I found 8 real gaps between
what `fetchSheetData.ts` expects and what `03_populator.gs` actually writes
to Settings, plus some dead code to prune.

**Chris's directive: clean up all of the below, then run `npx tsc --noEmit`
and `npx next build` again and confirm they pass before handing back.**

## Clean up — priority order

1. **`cashflow.year1CapitalGrowthRate` is never populated.**
   `lib/propertyData.ts:179` defines it; `CashflowSection.tsx:347` renders a
   "+10% Y1, +8% ongoing" label when it differs from ongoing. But
   `fetchSheetData.ts` never reads it from Settings. Chris's BPI convention
   is **10% Y1 / 8% ongoing** (standing rule). Add a `Year 1 Capital Growth
   Rate` read in `fetchSheetData.ts` and have the populator seed it in
   Settings if empty (default 0.10). Without this the Y1 uplift label
   never renders.

2. **Populator does not mirror `Annual Outgoings` to Settings.**
   `fetchSheetData.ts:145` looks for `Annual Outgoings` or `Annual Expenses`
   in Settings. `03_populator.gs` mirrors `Property Management Fee` but no
   aggregate outgoings number, so `cashflow.annualExpenses` defaults to 0
   and the net-yield / weekly-shortfall cards are wrong. Add an aggregate
   outgoings row to the CF Calc (or compute it in the populator from the
   existing expense rows) and mirror it as `Annual Outgoings`.

3. **Populator should seed commercial-only Settings placeholders.**
   When the CF template cleanup lands (I'm doing that in parallel),
   `fetchSheetData.ts` will be reading commercial keys like `WALE (yrs)`,
   `Lease Type`, `Tenant Covenant`, `Rent Review`, `NABERS Rating`, `GST`,
   `Parking Spaces`. Have the populator seed these as empty rows in
   Settings if the template hasn't been copied yet, so Chris has a field
   to fill.

4. **`03_populator.gs:132` hardcodes `Loan Term Years = 30`.**
   Commercial often 15–25 yrs. Add a CF Calc cell for loan term and read it.

5. **Verify the `claude-sonnet-4-6` model ID in `03_populator.gs:481`.**
   `ask-claude/route.ts:178` uses full `claude-haiku-4-5-20251001`. Confirm
   `claude-sonnet-4-6` is accepted by the Anthropic API; if not, switch to
   the versioned ID. Don't ship a pipeline that 400s on first run.

6. **Delete dead code.**
   - `lib/types.ts` + `lib/calculations.ts` — residential-only, orphaned from
     the commercial `PropertyData`. Nothing imports them in the commercial
     flow. Delete both.
   - `components/sections/SalesComparisonsSection.tsx` — legacy twin of
     `SalesComparablesSection.tsx`. `fetchSheetData.ts:224` still writes the
     same data into both. Delete the component AND the duplicate write in
     fetchSheetData (keep only `data.salesComparables.table`).

7. **Seed default `Suggested Questions`.**
   `fetchSheetData.ts:332` reads a pipe-separated list from Settings, but
   nothing writes a default. Have the populator seed this when empty:
   `What's the cap rate? | What's the WALE? | What are the key risks? | How is rent reviewed?`

8. **Seed `Expense Growth Rate` default.**
   `CashflowSection.tsx:322` uses `?? 0.03`. Populator should write
   `Expense Growth Rate = 0.03` to Settings so it's visible and editable
   instead of silently defaulting in code.

## Build verification

After all 8, run:
```
npx tsc --noEmit
npx next build
```
Both clean = reply with a message in `from-cdesk/` listing what you changed
and confirming the build output. If either fails, fix and re-run before
handing back.

## What I'm doing in parallel (don't touch)

- Master Index sheet (SETUP Step A)
- Vercel project + env vars + updating `DASHBOARD_BASE_URL`
- CF Template cleanup (the data side — adding the commercial Settings rows)
- Redcliffe / Mon Komo first test deal

## Branching

`cdesk/cleanup` branch for this work, PR to main. I'll review before merge
so the sheet ↔ code mapping stays in sync.

— CL1
