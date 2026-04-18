---
from: cdesk
to: chris
date: 2026-04-18
status: open
topic: Audit — YES it's commercial, but two residential leftovers slipped through (now fixed)
---

## TL;DR

You were right to ask. **The pipeline is commercial-targeted** — all the
IDs, sheet tabs, Apps Script flow, system prompt, sidebar nav, and
data model are commercial. But I found **two residential leftovers in
the rendered UI** that would have shown on the dashboard. Both now
fixed and merged in PR #3 (`8e9c165`).

## What's correctly commercial (confirmed)

| Layer | Commercial? | Evidence |
|---|---|---|
| Apps Script parent folder | ✅ | `COMMERCIAL_DD_PARENT_FOLDER_ID` → `16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU` (Commercial Due Diligence Drive folder) |
| Apps Script CF template | ✅ | `CF_TEMPLATE_SHEET_ID` → `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA` (your commercial CF template) |
| Sidebar nav (13 items) | ✅ | Property Details / Cashflow / **Rental Assessment** / **Sales Comparables** / **Lease & Tenant Insights** / Due Diligence / Proximity / Suburb Profile / Govt Projects / Industries / Drive Repo / Ask ChristAIn / Disclaimer |
| fetchSheetData tabs | ✅ | Settings, **Cash FLow Calc**, **Rental Assessment (sqm rates)**, **Sales Comparables**, Due Diligence, Industries, **Infrastructure Projects**, Distances — matches your commercial template exactly |
| Ask ChristAIn system prompt | ✅ | Uses cap rate / WALE / triple-net / tenant covenant framing; no "weekly rent" or residential assumptions (see `app/api/ask-claude/route.ts`) |
| DD subfolder list | ✅ | 9 commercial-specific folders (Tenant Insights, Lease Documents, Rental Appraisal & Sales Comps, Suburb & Property Report, Walkthrough videos, Contract & Vendor Disclosure, DD Checks, Council Planning, Cashflow Calc) |
| PropertyData type | ✅ | `tenantLease.items` (WALE / covenant / lease type), `rentalAssessment.comparables` (sqm), `salesComparables.table` (cap rate / $/sqm), `suburbProfile.summary` (commercial vacancy / median yield) |

## What was wrong (rendering residential in the UI)

### 1. FeaturesSection filter — residential fields

```ts
const CLIENT_FIELDS = ['Bedrooms', 'Bathrooms', 'Car Spaces', 'Floor Area', 'Land Area'];
```

Bedrooms / Bathrooms / Car Spaces are residential-only. The commercial
dashboard was filtering to show those when the CF template had them
(which it currently does — residential leftovers in the CF template
Settings tab).

**Fix**: CLIENT_FIELDS now reads:
```ts
['Property Type', 'Building Area', 'Floor Area', 'Land Area', 'Zoning',
 'Parking Spaces', 'NABERS Rating', 'Year Built', 'Tenancy Count']
```

### 2. CashflowSection — weekly-rent framing

Two summary cards:
- ❌ "Weekly Rent (est.)" — computed `annualRent / 52`, showed `$X pw`
- ❌ "Weekly Shortfall (est.)" — computed `netAnnualCashflow / 52`, showed `$X pw`

Commercial rent is quoted annually or $/sqm, never per week. This was a
direct copy from the residential CashflowSection that I hadn't cleaned up
(you said "we keep this one" earlier — I interpreted that as keeping the
file structure, but these two card labels are clear residential leakage).

**Fix**:
- "Weekly Rent" → "Net Annual Rent" (annual $ — commercial-correct)
- "Weekly Shortfall" → "Year 1 Net Cashflow" (annual $ with sub-label
  "Rent less interest & outgoings, pre-tax"). Same red-if-negative
  styling kept.

## Not touched (by design)

- **`reaLink` variable name** — internal only, not user-visible. Reads
  from any of `Listing Link` / `REA Link` / `Property.com.au link`
  Settings keys. Rename is cosmetic and risky in the active Trial 1
  flow; separate cleanup later.
- **"Mirror of residential" language in code comments and
  `claude-collab/` messages** — accurate historical documentation, not
  a bug.
- **CF template Settings tab residential rows** (Bedrooms, Bathrooms) —
  those are in your Google Sheet template, not my code. CL1 flagged
  cleanup of the template itself as their task; they were going to
  strip those rows from the template. Pipeline will work either way —
  the commercial UI now just won't render those cells even if present.

## Status

- PR #3 merged to main as `8e9c165`
- `tsc` clean, `next build` clean, dev server boots clean
- Does not break Trial 1 setup — just changes what renders when you
  load the dashboard URL

## Where this leaves Trial 1

Your clicks list (`2026-04-18_1555_chris-clicks-list-trial-1.md`) still
stands. When you re-sync the Apps Script project, also pull `main` to
get this UI fix. Then Run Pipeline and load the dashboard — you'll see
commercial summary cards (Net Annual Rent / Cap Rate / Year 1 Cashflow)
instead of residential (Weekly Rent / Weekly Shortfall).

— CDesk
