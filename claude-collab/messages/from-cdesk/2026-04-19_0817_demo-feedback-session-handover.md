---
from: cdesk
to: cl1
date: 2026-04-19
status: open
topic: /demo feedback session — comprehensive handover (for cross-device continuity)
---

# Handover — `/demo` feedback iteration session

Chris is switching devices. This is the full state so CL1 can pick up cold.

## Session context

Chris spent a session giving rapid feedback on https://baumann-commercial-template.vercel.app/demo. We iterated live (preview + eval + hot reload). Three commits landed:

- `93e8ed3` feat(demo): commercial single-tenant fixture + 30% equity default
- `41d9dd9` feat(demo): align with CF template defaults; polish UX
- `75f412b` feat(exec-summary): 4-card sequence — price, cap, Y1 cashflow, cash req

All pushed to `main`. Vercel auto-deploy. Build + tsc green throughout.

## Final demo state

Demo property: **22 Maroochydore Road, Maroochydore QLD 4558** — Industrial Showroom. All financials now mirror the Commercial Pay Down Calculator defaults Chris showed us from the CF template:

| | |
|---|---|
| Purchase Price | $1,000,000 |
| LVR | 80% |
| Interest Rate | 8.00% |
| Net Annual Rent | $60,000 |
| **Cap Rate** | **6.00%** |
| Mgmt Fee | 7% of rent (5% mgmt + 2% aux) = $4,200 |
| Rent Growth / CPI | 3% |
| Deposit (20%) | $200,000 |
| Stamp Duty (QLD) | $44,000 |
| Conveyancing | $4,000 |
| Building Inspection | $1,000 |
| **Valuation** (NEW field) | **$3,000** |
| **Total Cash Required** | **$252,000** |
| Year 1 Net Cashflow | **−$8,200** (red — 8% IO interest exceeds 6% cap) |

Tenant: **Coastal Marine & Outdoor Pty Ltd** (single tenant, 100% occupied, triple net, lease expiry 2034-02-28, 7.8 yrs remaining).

## What changed in the UI

### Executive Summary — 4-card sequence (per Chris's exact spec)
1. **Purchase Price** $1M (80% LVR)
2. **Net Yield / Cap Rate** 6% (accent — $60K ÷ $1M) ← navy + gold
3. **Year 1 Net Cashflow** −$8K (red — "After 8% interest (IO)")
4. **Cash Required** $252K (25% of price)

Dropped: WALE card + Net Annual Rent card (info still in the "Lease & income security" block below the cards).

### Property Details
- Property Type: `Industrial Showroom` (not Medical — Chris corrected based on actual listing)
- Availability: "Leased (single-tenant triple net)"
- Tenancy Count: "Single tenant (100% occupied)"
- Zoning: "Mixed Use (Sunshine Coast Planning Scheme)"

### Cashflow section
- **Money formatter upgraded** (`CashflowSection.tsx`): $X.XXM for ≥1M, $Xk for ≥1k. Fixes previous "$2234k" ugliness.
- **Valuation row** added to upfront costs table (lender-required).
- **Zero-value rows hidden** (Building Insurance, Title Insurance when $0).
- **Expense breakdown label**: "Property Management Fee + 2% aux (compliance / insurance)" — matches CF template note.

### Lease & Tenant Insights section
- **Highlight card strip removed** (it was duplicating Exec Summary per Chris: "don't think we need that segment").
- Now shows: Lease Start, Rent Review, Option Terms, Outgoings Recovery as detail rows + vacancy benchmark + folder links.
- `leaseDocsFolder` + `tenantInsightsFolder` demo values set to `#due-diligence` so "back-link to Lease in DD folder" works on the demo. Populator will override with actual Drive URLs on real deals.

### Property Details — listing buttons
- **Only render when URL actually matches that platform** — `features.propertyUrl` must include `commercialrealestate.com.au`, `reaLink` must include `realcommercial.com.au`. Prevents misbranded links if populator grabs the wrong URL.
- Brand colors: `#005151` teal (Domain / commercialrealestate) + `#E4002B` red (REA / realcommercial — updated from `#e0151b`).

### Sales Comparables + Suburb Profile
- Rescaled to match $1M subject: prices $860K–$1.35M, cap rates 5.85–6.20%.
- Suburb median yield: **6.00%**.

### Rental Assessment
- $/sqm rescaled to match $60K rent / 350 sqm NLA: Passing $171/sqm, Market $175/sqm, comparables $165–$188.

### Sidebar scrollspy
- `OFFSET` bumped 120 → 220 in `app/deals/[slug]/DashboardClient.tsx`. Chris noticed nav was highlighting the previous section; now tracks the one you're actually reading.

## Files touched

```
.claude/launch.json                                (new, gitignored — local dev)
app/deals/[slug]/DashboardClient.tsx               (scrollspy offset)
components/sections/CashflowSection.tsx            (formatter, valuation, filter 0s, labels)
components/sections/ExecutiveSummarySection.tsx    (4-card reorder, Y1 cashflow, lease-remaining)
components/sections/FeaturesSection.tsx            (button gating + brand colors)
components/sections/TenantLeaseSection.tsx         (dropped highlight cards)
lib/demoPropertyData.ts                            (full reset to CF defaults)
lib/fetchSheetData.ts                              (reads "Valuation" from Settings tab)
lib/propertyData.ts                                (added upfrontCosts.valuation field)
```

## Data model change to be aware of

**`PropertyData.cashflow.upfrontCosts.valuation: number`** is now a required field on the type.

- `defaultPropertyData` sets it to 0.
- `fetchSheetData` reads `toNum(s['Valuation'])` — so the CF Settings tab needs a `Valuation` row for real deals. If not present, it defaults to 0 and the row is hidden in the UI.
- `demoPropertyData` sets it to 3000.

**Action for CL1 / Chris**: next time the populator runs on a real deal, the CF template needs a `Valuation` row in Settings (already in Chris's CF template per screenshot he shared — row: "Valuation cost $3,000"). So populator should pick it up automatically once CF template + Deal Sheet Settings tab include it. Worth verifying on Trial 1.

## Open items — queue for CL1

### 1. Property Type dropdown on CF template (Chris: "love the dropdown")

Chris approved the idea of adding a data-validation dropdown for Property Type on the CF template Settings tab. Proposed enum:
```
Office / Retail / Industrial Showroom / Medical / Warehouse / Hospitality / Mixed Use
```

**Not yet implemented.** Needs:
- Update `apps-script/setup-sheet-template.gs` (or wherever the Settings tab gets seeded) to set a data validation rule on the Property Type cell.
- Populator (`03_populator.gs`) already writes whatever the user picks — no code change needed there.
- Propagates to `fetchSheetData.ts` → `features.details` → dashboard as-is.

### 2. Still flagged but not actioned

- **Listing brand colors** — Chris asked to verify colors from the actual platform sites. WebFetch got 429'd during the session. I used `#005151` (Domain teal, reasonable match) and `#E4002B` (REA red, confirmed their brand). If CL1 can verify via screenshot or CSS inspection, bonus.
- **Hydration warning** — browser extension (likely Dark Reader or similar) adds `className="mob"` client-side. Pre-existing, not from our changes, not blocking. Flag only.

## Verification

Before handover, preview confirmed (via `preview_eval`):
- Property Type: "Industrial Showroom" ✓
- Purchase Price card: "$1M · 80% LVR" ✓
- Cap Rate card: "6% · $60K ÷ $1M" (accent) ✓
- Year 1 Net Cashflow: "−$8K · After 8% interest (IO)" (red) ✓
- Cash Required: "$252K · 25% of price" ✓
- Upfront costs table: Total $252,000 ✓
- Mgmt Fee row: $4,200 ✓
- Stamp Duty row: $44,000 ✓
- Valuation row: $3,000 ✓
- Conveyancing row: $4,000 ✓

Production build: 9 pages ✓. `tsc --noEmit`: 0 errors.

## Where we are

- Commercial template repo `main` is at `75f412b`, Vercel deployed.
- Chris's primary open ask for next session: **add the Property Type dropdown** to the CF template.
- No blockers, no errors, nothing broken.

— CDesk
