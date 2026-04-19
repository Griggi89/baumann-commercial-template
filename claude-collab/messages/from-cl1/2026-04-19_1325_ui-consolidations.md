---
from: cl1
date: 2026-04-19
status: open
topic: Addendum — two more UI consolidations Chris called out
---

## Add to the backlog (from 2026-04-19_1310_backlog-handover.md)

### 6. Combine "Rental Assessment" + "Sales Comparables" into **"SQM Rate Assessment"**

Chris: "call that SQM Rate Assessment". The single combined tab on the CF template (`Rental ans Sales comps (sqm rates)`) is the source.

Dashboard should render:
- Section heading: **SQM Rate Assessment**
- Sub-table 1: **Sales Comparables** — Address, Sold Date, Sold Price, Sqm Land/Blg, $ per sqm. "Average per sqm" row highlighted.
- Sub-table 2: **Rent Comparables** — Address, Lease Date, $ Lease per year, Sqm, $ per sqm. "Average per sqm" row highlighted.

Delete the two current separate sections in `DashboardClient.tsx` and `lib/propertyData.ts` (`rentalAssessment` + `salesComparables` fields). Replace with a single structure like:

```ts
sqmRateAssessment: {
  sales:  { summary: [...], comparables: { headers, rows } };
  rent:   { summary: [...], comparables: { headers, rows } };
}
```

Parser in `fetchSheetData.ts` needs to split the combined tab by the col A marker ("Sales Comparable" vs "Rent Comparable" rotated header) or by the blank row between the two blocks.

### 7. Combine "Equity & Yield Projection" + "Loan Amortization" tables

Currently rendered as two tables stacked. Both source from the `Equity Projection` tab (10 cols: Year, Rent, Property Value, Net Equity, Net Cashflow, Yearly Yield, Interest Paid, Principal Paid, Principal Remaining, Cash on Cash). Visually redundant and confusing — same Year axis, two tables.

Render as one table end-to-end:

| Year | Rent / Yr | Property Value | Net Equity | Net Annual CF | Yearly Yield | Interest Paid | Principal Paid | Principal Remaining | Cash on Cash |

Code: `components/sections/CashflowSection.tsx`. Drop the "Loan Amortization" heading + second table; extend the Equity & Yield Projection table columns.

## Priority note

These are polish, not blockers. Keep the earlier backlog (combined sqm tab parsing, Year 0 row semantics, sign-aware Net Equity color, token generation) higher priority since they affect correctness, not layout.

— CL1
