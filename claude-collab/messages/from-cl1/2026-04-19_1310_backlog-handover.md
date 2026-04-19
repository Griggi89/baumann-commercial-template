---
from: cl1
date: 2026-04-19
status: open
topic: Backlog handover — queued items for CDesk
---

## Context

Chris is focusing on big-picture today. I'm doing the Vercel domain wiring for `commercial.baumannproperty.com.au` (via browser MCP with his approval) and handing the code backlog to you.

## Shipped by me since last sync

Six PRs on `main`:

- **#8** `fix(fetchSheetData)`: read Settings tab by name, not gid=0 (was returning Cash FLow Calc rows)
- **#9** `fix(populator)`: `findCFRowByLabel_` exact > startsWith > includes (fixed `"Rent"` matching "Year 1 Net Rental Income" and blowing up Y2-10)
- **#10** `feat(exec-summary)`: plain Cap Rate card + LVR on Cash Required
- **#11** `feat`: root-slug URLs + legacy `/deals` 301 redirect + Apps Script `DASHBOARD_BASE_URL` without `/deals`
- **#12** `feat(exec-summary)`: Year 5 Net Cashflow card (reads `equityProjection[year=5].netCashflow`)

Plus live Maroochydore trial deal, template schema fix (col A shift), Property Type dropdown on the CF template.

## Queued for you

Priority order. Pick them up whenever.

### 1. Equity & Yield Projection table — Year 0 row is confused

At https://baumann-commercial-template.vercel.app/22-maroochydore-road-maroochydore-qld-4558 scroll to the table. Year 0 row shows:

- `Rent / Yr = $1154` — that's a weekly figure in a per-year column. Either hide the cell for Y0 or don't render the row.
- `Net Equity = $300,000` — at Y0 with 70% LVR that's Purchase − Loan. But the column header is "Net Equity" in the dashboard context (property value − debt − cumulative outlay). Conflates two different measures. Chris flagged it as "something not quite right here".
- Green styling on negative Net Equity values from Y1 onwards — `-$52,200` is rendered green because the column-wide style is green; needs conditional red for negatives.

Fixes I'd suggest (pick what feels right):
- Drop the Year 0 row entirely OR show it only when `cashflow.equityProjection` has no `year === 0` data AND gate the Rent cell with `—`
- Sign-aware color on Net Equity column
- Move "Year 0 Net Equity" semantics to a tooltip or footnote so it's clear it's "initial deposit position"

Code: `components/sections/CashflowSection.tsx`, search for the `Equity & Yield Projection` heading.

### 2. Combined "Rental ans Sales comps (sqm rates)" tab

Chris consolidated the Rental Assessment and Sales Comparables tabs into one on the CF template. The new tab has two vertically-stacked sections:
- Top: Sales Comparables (Address, Price, Sqm, $/sqm, etc.)
- Bottom: Rent Comparables (Address, Lease Date, $ Lease per year, Sqm, $/sqm)

Each section ends with an "Average per sqm" row highlighted yellow.

`lib/fetchSheetData.ts` currently reads two separate tabs (`'Rental Assessment (sqm rates)'` and `'Sales Comparables'`). Needs:
- New `SHEET_TABS.RENTAL_AND_SALES` entry (name matches the new tab: `'Rental ans Sales comps (sqm rates)'` — note the "ans" typo; either match it literally or rename the tab on the template and update the constant)
- Split logic: detect the boundary between sections (probably the blank row pattern I see in the screenshot, or use the row where col A changes from "Sales Comparable" to "Rent Comparable")
- Map sales half → `data.salesComparables`, rent half → `data.rentalAssessment`

Old tabs can be dropped once the combined tab is the source of truth.

### 3. Populator row numbers for the 10-yr table label change

If the combined-tab refactor (#2) also changes Cash FLow Calc headers, re-check `03_populator.gs` labels map. Specifically the 10-yr rows. The label-specificity fix from PR #9 is robust to multi-line and trailing-whitespace labels, but if Chris renames a row outright you'll need to update the `labels` object.

### 4. Token generation

Chris wants per-deal token gating (`?t=<short-token>`) before sharing URLs externally. Master Index column G (Token) is empty for both active deals. Need either:
- A menu item **BPI Commercial → Generate Tokens** that fills empty Token cells with 8-char random strings (URL-safe base64), OR
- Auto-fill in `createCommercialDeal()` at deal creation.

Both Redcliffe (row 2) and Maroochydore (row 3) need tokens; existing deals should get a token on next edit without breaking anyone.

### 5. Delete the old `/deals/[slug]` route files

Now that PR #11 has landed and redirects are 301 to root-slug, the files under `app/deals/[slug]/*` are dead code. Not urgent — they don't conflict with the root route — but cleanup candidate.

## IDs / URLs (reference)

- Master Index: `1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk`
- Apps Script project: `1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI`
- CF Template: `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA`
- Live Maroochydore: https://baumann-commercial-template.vercel.app/22-maroochydore-road-maroochydore-qld-4558

## My lane

Vercel domain wiring (`commercial.baumannproperty.com.au`) + DNS. When that's live I'll swap `DASHBOARD_BASE_URL` and ping you.

— CL1
