---
from: cdesk
to: chris
date: 2026-04-19
status: open
topic: Dashboard update — assumptions polish live + diagnosis on the "stale Y5" concern
---

# Live dashboard to re-review

**https://commercial.baumannproperty.com.au/22-maroochydore-road-maroochydore-qld-4558**

## What just landed (`66b10b8`, deployed)

### Chart assumptions (under the 10-yr graph)

**Before:** "Purchase $1M, LVR 70%, interest-only at 8%... non-recoverable expenses $4,200/yr growing 3%/yr (CPI), IO interest fixed."

**After:** *"Purchase $1,000,000, LVR 70%, interest at 8% p.a., rent $60,000/yr growing 3%/yr (CPI). Net yield shown is already net of outgoings. Surplus cashflow reinvested to pay down loan (100% of net CF)."*

- Dropped the misleading "non-recoverable expenses $4,200/yr" phrase (net yield is already after outgoings — double-counted in readers' heads).
- Added the reinvestment note, gated on `debtReductionPct > 0` so it only shows when the CF Calc says you're paying down.

### SQM Rate Assessment tab-rename ready

When you rename the CF Template tab from `'Rental ans Sales comps (sqm rates)'` → `'SQM Rate Assessment'`, the dashboard picks it up automatically. Fallback handles existing deal copies with the old tab name. No code change needed when you do the rename.

## Diagnosis on the two "bugs" CL1 flagged

### Y5 Net Cashflow "stale" — not a bug, the numbers are correct

I gviz-fetched Maroochydore's sheets directly to verify:

- **Cash FLow Calc row 19 (Loan interest rate):** `8.00%` — still 8%, not 7%.
- **Settings Interest Rate:** `0.08` — correctly mirrored from CF Calc.
- **Equity Projection tab (Y1 → Y10 Net Cashflow):** `-$200` → `$1,458` → `$3,299` → `$5,339` → **`$7,595`** → `$10,087` → `$12,834` → `$15,860` → `$19,187` → `$22,843`.

This matches what's rendering on the dashboard. The populator IS re-mirroring correctly. CL1's "+$16,668 Y5" figure appears to be based on a 7% interest scenario that doesn't match the current sheet state. **If you want 7%**, edit `Cash FLow Calc` row 19 on the CF Template (source of truth), then re-run the pipeline on Maroochydore.

### Property Details empty — not a code bug either

Maroochydore's Settings tab has these rows but they're blank:
- Property Type: (empty)
- Building Area (sqm): (empty)
- Land Area (sqm): (empty)
- Zoning: (empty)
- Tenancy Count: (empty)

Dashboard correctly renders the empty-state placeholder. Once you pick values via the Property Type dropdown (and type the rest), the section populates. The populator seeds the labelled empty rows but doesn't invent data.

## What CL1 thought was broken but isn't

- `mirrorCFCalcToSettings_` / `setSettingsValue_` → **does always overwrite** (line 355, unconditional `setValue`). No "only if empty" bug. Verified reading the function end-to-end.

## What's open for you (sheet-side, not code)

1. **Fill in Property Type + other feature fields** on the CF Template Settings tab. Future deals inherit; re-run pipeline on Maroochydore to push down.
2. **Decide on 7% vs 8% interest.** Currently CF Calc has 8%. If you want to change, edit the template.
3. **Rename the SQM Rate Assessment tab** on the template whenever you're ready (no rush).
4. **Tokens** — I shipped generation already. Run `BPI Commercial → Generate Tokens` in the Apps Script menu to back-fill existing deals.

## Code backlog still on my plate (not urgent)

- Listing link key normalization (`realcommercial Link` / `commercialrealestate Link` canonical + alias lookups)
- `reaLink` → `listingLink` rename in `PropertyData`
- `floodChecks` → `ddChecks` rename

I'll pick these up when the sheet side stabilises.

— CDesk
