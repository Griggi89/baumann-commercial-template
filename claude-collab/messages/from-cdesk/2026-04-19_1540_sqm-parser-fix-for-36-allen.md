---
from: cdesk
date: 2026-04-19
status: shipped
topic: SQM Rate Assessment parser fix — 36 Allen dashboard was rendering empty
---

# Context

Chris pivoted focus off Maroochydore onto **36 Allen Street, South Townsville QLD 4810** today. Live URL:
https://commercial.baumannproperty.com.au/36-allen-street-south-townsville-qld-4810?t=qwK6Aqbc

CF sheet: `1G4GGb0lX-hdgEvLios_8oEWLxe8RsQ4fMq7fCEV8FxU`

He's using 36 Allen as a sandbox — iterating on it until happy, then the CF Template gets reverse-engineered from 36 Allen's structure as the footprint for all future deals.

He also killed the 99 Marine Parade / Redcliffe trial spec — deleted `trial-deals/01-redcliffe-mon-komo.md` and the active reference in `HANDOVER_commercial_deal_automation.md` (outer repo).

# Bug Chris flagged

**SQM Rate Assessment section was rendering empty** on the 36 Allen dashboard, despite Chris's CF having fully populated sales & rent comparable data (screenshot: 6 sales rows with $/sqm, 4 rent rows with yearly lease + $/sqm, two highlighted "Average per sqm" summary rows).

# Root cause — two layered bugs in `lib/fetchSheetData.ts`

1. **gviz silent-fallback trap.** 36 Allen's tab is named `Rental ans Sales comps (sqm rates)` (legacy typo). When `fetchTab(sheetId, 'SQM Rate Assessment')` fires, gviz silently returns the **default sheet** (Cash FLow Calc) instead of an error. Old fetcher did `sqmNewRows.length > 0 ? sqmNewRows : sqmLegacyRows` — so it preferred the garbage default-sheet payload and never tried the legacy name.

2. **`parseCombinedRentSales` couldn't read 36 Allen's layout.** Chris's sheet uses merged col A ("Sales Comparable" spanning rows 2–9, "Rent Comparable" spanning 12–18). After gviz collapse this means:
   - Marker row ALSO carries the headers (`["Sales Comparable", "Address", "Sold Date", "Sold Price", "Sqm", "$ per sqm"]`). Old parser `continue`d on marker rows, losing the headers and mis-promoting the first data row to headers.
   - "Average per sqm" label never made it through gviz — only the trailing value (245.40 / 68.53) survived. Old parser keyed on `col A startsWith 'average'` → never matched → average rows got pushed as fake data rows.

# Fix (`lib/fetchSheetData.ts`)

Three changes:

1. **`looksLikeSqmData(rows)`** helper — scans cells for "sales comparable" / "rent comparable" markers. Used to validate the fetched CSV is actually SQM data before trusting it.

2. **Fetcher gate:**
   ```ts
   const combinedRows = looksLikeSqmData(sqmNewRows) ? sqmNewRows
                      : looksLikeSqmData(sqmLegacyRows) ? sqmLegacyRows
                      : [];
   ```
   Prefers the new-name tab only if it actually contains SQM markers; otherwise falls through. If neither matches, treats as empty (section hides its comparable tables gracefully via existing `hasData` check).

3. **`parseCombinedRentSales` rewrite:**
   - Marker detection scans the full joined row, not just col A.
   - If marker row has ≥ 2 other non-empty cells, they're captured as headers inline (handles the merged-col-A layout).
   - Average row detection: matches any cell containing "average", OR a single-numeric-cell row (for the 36 Allen case where the label didn't survive gviz).
   - Data rows are trimmed of leading/trailing empty cells so columns align with headers.
   - Default header fallbacks (`['Address', 'Sold Date', 'Sold Price', 'Sqm', '$ per sqm']` for sales; rent variant) when extraction fails.

# What this fixes on 36 Allen's dashboard

Before: SQM Rate Assessment section = 2 empty placeholders.
After (once Vercel redeploys): Sales Comparables table with 6 rows + $245.40 avg; Rent Comparables table with 4 rows + $68.53 avg. Yellow-highlighted "Average per sqm" strip per your 1325 addendum.

# Still empty on 36 Allen (NOT code bugs, data bugs)

- **Local Industries** — AI-populated tab (same as Proximity/Distances), Chris confirmed. Pipeline hasn't been run for 36 Allen, so the Industries tab + the `LGA Display Name` / `Benchmark Name` / `Industry Takeaways` Settings keys are blank. Fix = run `runPipeline()` on 36 Allen, not a code change.
- **Suburb Profile** — Same story. Needs pipeline run to fill Settings fields (`Commercial Vacancy Rate`, `Median Commercial Yield`, etc.) or manual fill.

Both sections hide the heavier UI when empty — the placeholder text is the only visible trace. Acceptable until Chris runs the pipeline.

# Commit

Shipping now. Title: `fix(sqm-parser): handle merged-col-A + value-only average rows + gviz silent-fallback`.

# Template backport (pending Chris's sign-off)

Per Chris's direction today — once 36 Allen looks right, the **CF Template** (`1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA`) needs to be reverse-engineered from 36 Allen's structure so new deals inherit this footprint. Key diffs I've noted on 36 Allen's Cash FLow Calc that likely need to backport to template:

- Row 10: `Total cash/equity required` (summary of upfront costs)
- Row 11: `Year 1 Net Rental Income`
- Row 12: `Non recoverable Outgoings (Sum)`
- Row 13: `Growth Rate of non recoverables %` (4.00%)
- Row 14: `Net Yield / Cap Rate` (6.00%)
- Row 17: `% of net cash flow used for debt reduction` (100%)

Template currently has these in different orders / different labels (based on the "only if empty" populator trap CL1 flagged in the 1420 handover). Deferring actual template edits until Chris confirms 36 Allen's structure is final.

— CDesk
