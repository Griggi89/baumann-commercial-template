---
from: cdesk
to: chris
date: 2026-04-18
status: open
topic: /demo route is live + new Executive Summary section
---

## Live now

**https://baumann-commercial-template.vercel.app/demo** — fully-populated
synthetic dashboard. Demo Tower, 1 Collins Street Melbourne VIC. Every
section lit up. No sheet, no pipeline required. Verified 200 + content.

## What you'll see

**Property Details** — office / 4,850 sqm / 5.0 Star NABERS / Capital
City Zone / 28 bays / whole-building tenancy

**Executive Summary** (new section, your idea):
- 4 headline cards in accent navy + grey: **Cap Rate 6.5%** · **WALE
  8.2 yrs** · **Net Annual Rent $813K** · **Purchase Price $12.5M (60%
  LVR)**
- Lease & income security strip:
  - Tenant: Demo Commercial Pty Ltd (ASX-200 listed)
  - Lease expiry: 2033-06-30 · *auto-computes "X yrs Y mo remaining"*
  - Rent review: Annual CPI (collar 3% / cap 5%)
  - Option terms: 2 × 5 years
  - Outgoings: 100% recovered via net lease

**Cashflow** — populated 10-year equity projection with rent / property
value / net equity / net cashflow

**Rental Assessment** — $/sqm summary + 4 comp rows
**Sales Comparables** — cap rate / WACR / $/sqm summary + 4 comp rows
**Lease & Tenant Insights** — 9-row tenant covenant panel
**Due Diligence** — 9 status cards across Complete / Found / Pending
**Location Proximity** — 9 amenities with Melbourne CBD distances
**Suburb Profile** — 4.8% vacancy / 6.25% median yield / 2.8% YoY / supply pipeline
**Govt Projects** — 5 real projects with working source URLs:
- Metro Tunnel · Suburban Rail Loop · West Gate Tunnel · North East Link · Docklands Revitalisation
**Local Industries** — Melbourne LGA 2021 Census-style breakdown (Prof Services 21.8% vs VIC 9.4%, etc.)
**Drive Repo** — 9 subfolder links
**Ask ChristAIn** — chat-ready (needs env var already set)
**Disclaimer** — your advisor block

## Where to find it

- **Landing page**: https://baumann-commercial-template.vercel.app/
- **Demo**: https://baumann-commercial-template.vercel.app/demo ← open this
- **Trial 1 (empty state)**: https://baumann-commercial-template.vercel.app/deals/99-marine-parade-redcliffe-qld-4020

## What shipped

PR #6 (`a89e69a`) merged:
- `lib/demoPropertyData.ts` — the fixture
- `app/demo/page.tsx` — the route
- `components/sections/ExecutiveSummarySection.tsx` — new section
- Sidebar + DashboardClient — wired at position 2
- Fixed React duplicate-key warnings in DriveRepo + SuburbProfile
  surfaced by rendering the fixture with placeholder `#` URLs

## How to reuse Exec Summary on real deals

Once the CF sheet populator runs, Executive Summary pulls automatically
from these Settings fields:
- `Tenant`, `Tenant Covenant`, `Lease Type`, `Lease Expiry`, `WALE (yrs)`,
  `Rent Review`, `Option Terms`, `Outgoings Recovery`
- `Purchase Price`, `LVR`, `Net Annual Rent`

All those keys are what the populator already writes. Zero extra work per
deal — fill those in CF Calc + Settings, Run Pipeline, Executive Summary
appears on the dashboard.

## Small note on Ask ChristAIn on /demo

`/demo` is rendered with a static fixture, but the Ask ChristAIn chat
posts to the live `/api/ask-claude` route. It'll work (the API reads
`ANTHROPIC_API_KEY` from Vercel env), and will answer based on the Demo
Tower context — useful for showing prospects how it reads deal-specific
numbers.

— CDesk
