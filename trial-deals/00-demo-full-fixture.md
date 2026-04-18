# Dummy Demo Deal — fully-populated fixture for the first Vercel dashboard

Everything below is fake but realistic. Purpose: light up every section of
the commercial dashboard so the first Vercel render shows what the finished
product looks like.

**Address**: `Demo Tower, 1 Collins Street, Melbourne VIC 3000`
**Slug (auto)**: `demo-tower-1-collins-street-melbourne-vic-3000`
**Expected dashboard URL**: `https://<your-vercel-domain>/deals/demo-tower-1-collins-street-melbourne-vic-3000`

## Step 1 — Create Deal

Master Index → BPI Commercial → Deal Manager → Step 1

```
Demo Tower, 1 Collins Street, Melbourne VIC 3000
```

Click **Create Deal**. Open the resulting CF sheet.

## Step 2 — Cash FLow Calc (col C)

Paste by navigating to the named cell (Google Sheets: `Ctrl+G` or directly).
Use the **label** column to confirm you're on the right row — row numbers
are irrelevant now that the populator does label lookup.

| Label in col B | col C value |
|---|---|
| Purchase price | `$12,500,000` |
| LVR | `55%` |
| Stamp duty (if outside South Australia) | `$687,500` |
| Valuation cost | `$8,500` |
| Solicitor cost | `$12,000` |
| Building Inspection | `$4,500` |
| Property Management Fee … | `5%` |
| Year 1 Net Rental Income | `$812,500` |
| Net Yield / Cap Rate | `6.50%` |
| Yearly review / CPI increase | `3.5%` |
| Term of ownership | `10` |
| Loan interest rate | `7.0%` |

## Step 3 — Settings tab (user-supplied fields)

Paste each row into the Settings tab. Label goes in col A, value in col B.
If a row already exists (e.g. `Address` was seeded by Create Deal), skip it.

```
Property Type            | Office (Whole Building)
Building Area (sqm)      | 4,850
Floor Area (sqm)         | 4,850
Land Area (sqm)          | 820
Zoning                   | Capital City Zone (Melbourne Planning Scheme)
Parking Spaces           | 28 (secure basement)
NABERS Rating            | 5.0 Stars Energy
Year Built               | 2014
Tenancy Count            | 1
Listing Link             | https://www.realcommercial.com.au/sold-demo

Tenant                   | Demo Commercial Pty Ltd
Tenant Covenant          | ASX-200 listed
Lease Type               | Triple Net (all outgoings recovered)
Lease Start              | 2023-07-01
Lease Expiry             | 2033-06-30
WALE (yrs)               | 8.2
Rent Review              | Annual CPI (collar 3% / cap 5%)
Option Terms             | 2 × 5 years
Outgoings Recovery       | 100% recovered via net lease

Hero Image URL           | https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686d8d54668570cae9b8c760_Logo%20Extended%20Colour-p-500.png
```

*(Hero image is a placeholder pointing at the Baumann logo CDN — swap for a
real building photo URL when you have one.)*

## Step 4 — Run Pipeline

Master Index → BPI Commercial → Deal Manager → Step 2

- CF Sheet URL should auto-fill from Step 1. If not, paste the URL of the
  demo CF sheet.
- Click **Run Pipeline**. Wait 30–60s.

What the pipeline does:
- `DD sync` — scans the 9 DD subfolders (empty for demo → 9 Pending rows)
- `CF Calc → Settings mirror` — copies Purchase Price / LVR / Cap Rate / etc.
  from the CF Calc tab to Settings so the dashboard can read them
- `Seed defaults` — writes Y1 capital growth 10% / ongoing 8% / expense
  growth 3% / loan term 25yrs / Suggested Questions (if empty)
- `Build Equity Projection tab` — pulls the 10-yr horizontal rows from
  CF Calc into a dashboard-shaped table
- `AI research` — calls `claude-sonnet-4-6` with the address; fills LGA /
  Region / Benchmark / Lat/Lng / Distances (9) / Industries (5) /
  Infrastructure Projects (5)

## Step 5 — Rental Assessment + Sales Comparables tabs

These two stay user-populated (per your workflow). For the demo,
paste representative rows:

### Rental Assessment (sqm rates) tab

```
Metric               | Value
Passing rent $/sqm   | $520
Market rent $/sqm    | $545
Net lettable area    | 4,850 sqm
Vacancy rate         | 3.2%

Address                 | Area (sqm) | Rent $/sqm | Lease Term
555 Collins Street L2   | 1,200      | $530       | 5 yrs + 5
222 Exhibition Street   | 2,100      | $555       | 7 yrs + 5
101 Collins Street L18  | 900        | $580       | 3 yrs + 3
```

### Sales Comparables tab

```
Metric           | Value
Market cap rate  | 6.25%
WACR (weighted)  | 6.40%
$/sqm range      | $3,800 – $4,500

Address                | Sale Price | $/sqm   | Cap Rate | Date
120 Collins Street     | $11.2M     | $4,200  | 6.35%    | 2025-11
350 Queen Street       | $9.8M      | $3,900  | 6.55%    | 2025-09
600 Bourke Street (whole) | $14.5M  | $4,350  | 6.15%    | 2026-01
```

## Step 6 — Visit the dashboard

Once Vercel is deployed (see `VERCEL-DEPLOY.md`):

```
https://<your-vercel-domain>/deals/demo-tower-1-collins-street-melbourne-vic-3000
```

Every one of the 13 sidebar sections should have content.
