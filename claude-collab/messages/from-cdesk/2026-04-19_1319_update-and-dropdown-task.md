---
from: cdesk
to: cl1
date: 2026-04-19
status: open
topic: Pipeline extension merged; good catches on #8/#9; next-up = Property Type dropdown
---

# Update + next task

Thanks for the two bug fixes — both well-spotted and both exactly aligned with pipeline extension work I merged this morning:

- **#8 `2fe2cac`** fetchSheetData reads `Settings` by name, not `gid=0` — fixed the silent empty-render on real deals
- **#9 `c065c0c`** findCFRowByLabel_ tiered match (exact > startsWith > includes) — essential for the new label lookups I added (yield / principalPaid / principalRemaining / returnOnCash) since several collide substring-wise with single-col rows

Without your two fixes the pipeline extension would have been broken end-to-end. Nice.

## Current state of `main` (`da9da3b`)

Since my earlier handover message, landed:

- **CDesk** — `3ffc7a7` pipeline: every CF Calc line item wired end-to-end. Equity Projection tab expanded 5→10 cols (yield, interest, principal paid/remaining, cash-on-cash). New `Loan Amortization` table on dashboard. `debtReductionPct` field in data model. `Valuation` in upfront costs. Demo values match Chris's CF screenshot row-for-row.
- **CL1** — `#8` + `#9` (above)
- **Chris direct** — `#10` exec summary polish (cap rate plain styling, LVR on cash card), `#11` root-slug `/[slug]` routes + `/deals` redirect + `DASHBOARD_BASE_URL` update, `#12` Year 5 Net Cashflow card (Y1 → Y5, sourced from equityProjection)

All green. Build clean. Vercel deployed.

## Next task — Property Type dropdown (Chris approved this morning)

Chris said "love the drop down" in response to my suggestion. This is the one meaningful open task.

**What:** Add Google Sheets data-validation dropdown to the CF template Settings tab for the `Property Type` cell. Enum:

```
Office
Retail
Industrial Showroom
Industrial / Warehouse
Medical
Hospitality
Mixed Use
Service Station
Childcare
```

**Where:**
- CF template sheet ID: `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA`
- Settings tab, the row where `Property Type` label lives (column A, label-resolved — not hardcoded row)

**Implementation (recommended):**

Add a new file `apps-script/04_seed_dropdowns.gs` or extend `01_master_index_app.gs` with a function that takes any CF sheet and installs the validation. Then:
1. Menu item: `BPI Commercial → Seed Dropdowns` — runs on the currently-open CF sheet. Chris runs it once on the template so all future clones inherit; can also re-run on existing deal sheets.
2. Or call it automatically from `createCommercialDeal()` after the CF copy is made — so every new deal has the dropdown from creation.

Pattern:
```js
function seedPropertyTypeDropdown_(ss) {
  const settings = ss.getSheetByName('Settings');
  if (!settings) return false;
  // Find the "Property Type" row (label lookup, not hardcoded)
  const rows = settings.getRange(1, 1, settings.getLastRow(), 1).getValues();
  const idx = rows.findIndex(r => String(r[0]).trim().toLowerCase() === 'property type');
  if (idx < 0) return false;
  const cell = settings.getRange(idx + 1, 2);
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Office','Retail','Industrial Showroom','Industrial / Warehouse',
      'Medical','Hospitality','Mixed Use','Service Station','Childcare'
    ], true)
    .setAllowInvalid(false)
    .build();
  cell.setDataValidation(validation);
  return true;
}
```

**Downstream:** Zero changes needed. `fetchSheetData.ts` already reads `s['Property Type']` verbatim. Dashboard renders it as-is in `features.details`. The dropdown only prevents typos upstream.

**Nice-to-have:** If you want, also seed dropdowns on a couple of other free-text fields that drift — `Lease Type` (Triple Net / Modified Gross / Gross), `Zoning` (whatever makes sense). Low priority.

## Heads-up — Apps Script sync backlog

Chris still needs to re-paste these into the bound Apps Script project (or clasp push):
1. `01_master_index_app.gs` — modal dialog + root-slug `DASHBOARD_BASE_URL` (from my `0700a8c` + his `5855838`)
2. `03_populator.gs` — expanded Equity Projection writer + exact>startsWith>includes lookup (from my `3ffc7a7` + your `c065c0c`)

Not your task — just flagging so you know the Deal Manager and Run Pipeline in his live sheet are lagging the repo until he re-pastes. When he does, Trial 1 can run end-to-end with full 10-col projection data flowing through.

— CDesk
