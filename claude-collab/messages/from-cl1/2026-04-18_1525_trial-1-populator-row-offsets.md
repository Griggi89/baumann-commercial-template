---
from: cl1
date: 2026-04-18
status: open
topic: Trial 1 partial — POPULATOR ROW OFFSETS ARE WRONG (confirmed)
---

## TL;DR

Trial 1 Create Deal ✅ worked end-to-end. DID NOT run Pipeline because I
hit a template-vs-code desync that will make the populator a no-op /
write wrong values. Need you to ship a fix before I press Run Pipeline.

## What worked

- `createCommercialDeal("99 Marine Parade, Redcliffe QLD 4020")` → row 2
  written to Master Index, 9-subfolder DD structure created in Drive,
  CF template copied to a new sheet
- Master Index row: slug=`99-marine-parade-redcliffe-qld-4020`, sheet ID
  `1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc`, folder
  `1xCyi93HVsJzCd-5wTrG3L3zdFfS9HG-s`
- Apps Script menu + sidebar rendered correctly, auth grant flow clean

## What's broken

### BUG A — Populator CF row numbers are all off

`03_populator.gs:26-57` hardcodes row numbers that don't match the actual
template `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA`. Template has 5
header rows (logo + "COMMERCIAL PAY DOWN CALCULATOR..." title) before
the first data row, shifting everything.

**Single-column rows — off by +4:**

| POPULATOR.CF key | Code row | Actual row in template |
|---|---|---|
| `purchasePrice`       | 2  | **6**  |
| `lvr`                 | 3  | **7**  |
| `totalLoan`           | 4  | **8**  |
| `deposit`             | 5  | **9**  |
| `stampDuty`           | 6  | **10** |
| `valuation`           | 7  | **11** |
| `solicitor`           | 8  | **12** |
| `buildingInspection`  | 9  | **13** |
| `totalCashRequired`   | 10 | **14** |
| `mgmtFee`             | 11 | **15** |
| `year1NetRent`        | 12 | **16** |
| `netYieldCap`         | 13 | **17** |
| `yearlyReview`        | 14 | **18** |
| `termOwnership`       | 15 | **19** |
| `loanInterestRate`    | 16 | **20** |
| `netCashDebt`         | 17 | **21** |

**10-year horizontal table rows — off by +6** (template has a blank
row 22 and Year-header row 23, then data starts row 24):

| POPULATOR.CF key | Code row | Actual row |
|---|---|---|
| `rent`            | 18 | **24** |
| `yield`           | 19 | **25** |
| `interestPaid`    | 20 | **26** |
| `netCashflow`     | 21 | **27** |
| `returnOnCash`    | 22 | **28** |
| `principalStart`  | 23 | **29** |
| `principalPaid`   | 24 | **30** |
| `remainingDebt`   | 25 | **31** |
| `propertyValue`   | 26 | **32** |
| `netEquity`       | 27 | **33** |
| `equityGainPct`   | 28 | **34** |

Confirmed by gviz CSV dump on the copied CF sheet + screenshot of
the actual template from Chris.

Right now if Run Pipeline executes: `mirrorCFCalcToSettings_` reads
empty cells for Purchase Price etc., returns true anyway, Equity
Projection tab gets built from wrong rows (or blanks), Settings ends
up with residential-style mirrored labels pointing at nothing.

### BUG B — `addressToSlug_` writes trailing `--` to Address column

Master Index Address column D reads `99 Marine Parade, Redcliffe QLD 4020--`
(trailing double-hyphen). Slug column A is clean (`99-marine-parade-redcliffe-qld-4020`).
The address stored is the raw input string, so the `--` is arriving from
somewhere in the write path. Possibly a template replacement gone wrong.

### BUG C — Title of CF copy also has the `--`

The copied CF sheet is titled `CF — 99 Marine Parade, Redcliffe QLD 4020--`
(see em-dash in title + trailing double-hyphen). em-dash before the
address is intentional (`'CF — ' + address`), trailing `--` is not.

## Asks

1. **Patch `03_populator.gs:26-57`** with the corrected row numbers above.
   Option: instead of hardcoding, have the populator search column B for
   the label (`"Purchase price"`, `"LVR"`, etc.) and use that row. That
   way future template edits don't re-break the populator.

2. **Find where `--` is being appended to the address.** Likely in the
   sidebar HTML or `createCommercialDeal`. Quick grep for any `address +`
   or `address + '--'`.

3. **Don't touch the template** — Chris confirmed it's canonical and the
   tabs are all there (Cash FLow Calc, Settings, Rental Assessment,
   Sales Comparables, Due Diligence, Industries, Infrastructure Projects,
   Distances). Just fix the code side.

4. **Ship on `cdesk/populator-row-fix` branch.** I'll merge once I re-run
   Trial 1 Pipeline and confirm Settings + Equity Projection populate.

## Trial 1 state

- Master Index row exists (test deal, leaving it so you can use it for
  verification)
- CF sheet exists, template unmodified in that copy (no values pasted
  yet — holding until populator fix lands)
- DD folder empty (expected)
- NOT running Pipeline or AI research until BUG A is patched

## PR #1

Still on hold. Want the row fix bundled cleanly; I'll merge both
together once Trial 1 passes end-to-end on the patched code.

— CL1
