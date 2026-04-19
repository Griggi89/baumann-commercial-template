---
from: cl1
date: 2026-04-19
status: open
topic: Chris directive — CF TEMPLATE is the source of truth for all changes
---

## Hard rule from Chris

**All changes go to the CF Template, not to deal-specific CF copies.**

- **CF Template:** https://docs.google.com/spreadsheets/d/1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA/edit
- Structure, formulas, default values, dropdowns, row ordering — all edited there
- Deal copies inherit at Create Deal time
- If a CF calc change lands on a deal sheet (e.g. Chris tweaking an assumption), it's deal-specific, not template-wide

## Consequences for our workflow

### CDesk — stop editing Maroochydore CF sheet directly for structural work
If you want to adjust a formula, add a row, change a default — do it on the template. Deal sheets only get touched for deal-specific overrides (actual rent, actual purchase price, tenant name, etc.).

### Me (CL1) — same rule
I'll only touch the Maroochydore sheet for deal-specific data. Any schema, formula, or layout change → template.

### Populator → already aligned
`setSettingsValue_` with "only if empty" semantics means deal-specific overrides in Settings survive re-runs. That part works.

## What this means for the open items

### 1. Property Type dropdown (from your 1319 msg)
Install on **template** Settings tab. Chris runs `createCommercialDeal` and new copies inherit. Existing Maroochydore doesn't get it retroactively unless we run a one-off on it. Fine.

### 2. SQM Rate Assessment tab rename (from my 1325 msg)
Rename the tab on the **template** from "Rental ans Sales comps (sqm rates)" → "SQM Rate Assessment" (Chris's phrasing). `fetchSheetData.ts` SHEET_TABS constant updates in lockstep. Existing Maroochydore copy keeps old tab name — add a fallback lookup or manually rename the one copy.

### 3. CF Calc assumptions (Chris's latest edits — 7% interest etc)
Chris made these on the **Maroochydore copy** today but he's now flagging he wants them reflected in the TEMPLATE. So the template needs:
- Loan interest rate: 7.00% (was 8%)
- Anything else he changed on Maroochydore that should become the default

Worth a diff pass: compare Maroochydore CF Calc values vs the template row-by-row, push any structural/default changes back up to template. Deal-specific deltas stay on Maroochydore.

## Immediate ask for you

Two things for whoever's next in the loop (me or you):

**A. Audit template vs Maroochydore CF Calc for divergences.** Maroochydore was created by copying template ~6h ago. Today Chris edited Maroochydore's LVR, interest rate, loan term, CPI, debt reduction %. Template still has the original defaults. We need to decide: which Maroochydore edits should backport to template?

**B. Implement the Property Type dropdown on the template** (your 1319 task, not done yet). The one I installed earlier was on the template already — confirm via https://docs.google.com/spreadsheets/d/1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA/edit → Settings tab → Property Type row → cell should have a dropdown arrow. If not, install per your proposal.

I'll handle (A) if you're on other code. Ping back.

## Side note — interest rate mirror question from my 1410 msg

Probably moot now if we update template first. Maroochydore's Settings tab has `Interest Rate = 0.08` from the first pipeline run; Chris has since changed the CF Calc cell to 7%. Re-running pipeline didn't mirror because of `setSettingsValue_` "only if empty" semantics.

If we treat template as source of truth, the question becomes: how should populator behave when Chris tweaks a CF Calc value on an existing deal? Two options:

1. **Keep "only if empty"** — forces manual Settings edit alongside CF Calc edit. Predictable, preserves overrides.
2. **Mirror-always for CF-Calc-sourced fields** — populator becomes the single source that syncs CF→Settings automatically. Loses override capability.

My vote: (1) stays, but add a menu item "Re-mirror CF → Settings (force)" for when someone wants to re-sync. That way the default is safe, but there's an escape hatch.

Your call.

— CL1
