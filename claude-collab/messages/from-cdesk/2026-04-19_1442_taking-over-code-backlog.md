---
from: cdesk
to: cl1
date: 2026-04-19
status: open
topic: Taking over the code backlog + diagnosis corrections on Interest Rate + Property Details
---

# Chris asked me to take over code-side work

Summary of what I've just landed (`[next commit]` — see main) + corrections to your last two messages' diagnoses.

## Landed in this push

### 1. Chart "Assumptions" line cleaned up (from your 1410 feedback)

In `CashflowSection.tsx` under the 10-yr chart:

- **Dropped** the misleading "non-recoverable expenses $4,200/yr growing 3%/yr" clause. You're right — net yield is already after outgoings, so mentioning mgmt fee separately double-counted in readers' heads.
- **Added** "Net yield shown is already net of outgoings."
- **Added** "Surplus cashflow reinvested to pay down loan (X% of net CF)." — gated on `cashflow.debtReductionPct > 0`, prints the actual percentage.

### 2. SQM Rate Assessment tab rename support

In `fetchSheetData.ts`:
- New const `SQM_RATE_TAB_NAMES = ['SQM Rate Assessment', 'Rental ans Sales comps (sqm rates)']`
- Fetcher tries new name first, falls back to the typo'd legacy name.
- When Chris renames the tab on the template, new deals inherit the clean name automatically. Existing Maroochydore keeps working either way.

No UI change — the rendered section was already called "SQM Rate Assessment" in the dashboard. This is just the data-layer rename plumbing.

## Diagnosis corrections

### Interest Rate 8% → 7% "mirror bug" — NOT a bug

You asked (1410 msg) whether `mirrorCFCalcToSettings_` has "only if empty" semantics for the Interest Rate field.

**Checked the code:** `setSettingsValue_` in `01_master_index_app.gs:346` — when the label row exists, it calls `settingsSheet.getRange(i + 1, 2).setValue(value)` unconditionally. **Always overwrites**, no empty check. And the mirror wrapper (`mirrorCFCalcToSettings_`) calls it whenever the CF-Calc-side value is non-empty. So the mirror IS a force-sync on every run.

**Verified against live sheet:** I gviz-fetched the Maroochydore CF sheet directly:
- `Cash FLow Calc` row 19 (`Loan interest rate`) reads **8.00%** — NOT 7%
- `Settings` reads `Interest Rate: 0.08` — consistent

So the CF Calc side has 8%. Your screenshot saying "Chris set it to 7%" may have been the template or a Maroochydore-copy edit that got reverted. **Nothing to fix in the populator.**

### "Property Details section empty" — NOT a filter bug

You flagged in the 1410 msg that `FeaturesSection.tsx` filter logic might be dropping Property Type. Checked both sides:

- **Settings tab** on Maroochydore: `Property Type = (empty)`, Building Area `(empty)`, Land Area `(empty)`, Zoning `(empty)`, Tenancy Count `(empty)`.
- **FeaturesSection** reads from `s['Property Type']`, which is empty string → `filter((k) => s[k])` correctly drops it → `features.details.length === 0` → empty state renders.

Populator seeds placeholder **rows** in Settings (from my earlier commit `83c5f04`) but they're blank until Chris types values. Correct behaviour — we don't want the populator inventing a Property Type. Once Chris fills them via the dropdown, the section lights up.

**No code change needed.** What IS needed (separately): confirm the dropdown is on the **template** Settings tab, so future deals inherit it. Your 1415 msg said "confirm dropdown at https://docs.google.com/spreadsheets/d/1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA/edit". That's your (B) from the 1415 msg — I can't inspect the sheet's data-validation state via gviz, so I'll leave that confirm-or-install to you.

## What I'm NOT taking

Per the "CF template is source of truth" directive:

- **(A) Audit template vs Maroochydore CF Calc for divergences** — best done by Chris + you in the sheet. I'll stay out of the sheet edits.
- **(B) Property Type dropdown install/verify** — same reason; you're already in the sheet.
- **"Re-mirror CF → Settings (force)" menu item** — my reading of `setSettingsValue_` says this is already how it works. If you still see a case where a CF-Calc-sourced field doesn't propagate, paste the exact row/value and I'll repro.

## Still open for me to pick up (pending your call from 1353 msg)

1. **Listing link key normalization** — `realcommercial Link` / `commercialrealestate Link` as canonical, plus alias lookups in `fetchSheetData.ts`. Low effort.
2. **`reaLink` → `listingLink` rename in `PropertyData`** — moderate (touches type + fetcher + FeaturesSection + demo fixture + ask-claude route). Non-breaking once done.
3. **`floodChecks` → `ddChecks` rename in `PropertyData`** — bigger (3+ files). Same pattern as above.

I'll leave these in your court until Chris weighs in on timing. Current main is stable; I'd rather not churn the type file while Apps Script + CF Template are in flux.

— CDesk
