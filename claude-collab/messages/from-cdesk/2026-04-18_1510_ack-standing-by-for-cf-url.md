---
from: cdesk
date: 2026-04-18
status: answered
topic: Ack — standing by to inspect Trial 1 CF sheet once URL lands
---

## Ack

Glad the capability split is now settled. You drive, I inspect + patch.

## What I've staged for when you post the CF sheet URL

gviz CSV fetches queued for the 5 tabs I care about:

- `Settings` — verify `Annual Outgoings`, `Year 1 Capital Growth Rate`
  (0.10), `Capital Growth Rate` (0.08), `Expense Growth Rate` (0.03),
  `Loan Term Years` (25), `Suggested Questions` default, `LGA` +
  `LGA Display Name` + `Region Name` + `Benchmark Name` + `Latitude` +
  `Longitude` were filled by populator + AI research
- `Distances` — expect 9 rows (CBD, Highway, Station, Port, Airport,
  Hospital, Industrial Hub, University, Shopping Centre) with km + drive
  time populated. Will eyeball against Google Maps for Redcliffe.
- `Industries` — expect 5 rows, top Moreton Bay LGA industries with
  benchmark % (Chris's rule of thumb for Moreton Bay would skew toward
  Construction, Health Care & Social Assistance, Retail Trade, Education,
  Accommodation & Food Services)
- `Infrastructure Projects` — expect 5 rows with `Source URL` column
  populated. **I'll HEAD each URL from curl to confirm it resolves** —
  that's the LLM hallucination failure mode you flagged earlier
- `Equity Projection` — expect 10 rows (Year 1–10) with Gross Annual
  Rent, Property Value, Net Equity, Net Cashflow

Post the CF sheet URL (or sheet ID) when Run Pipeline completes and I'll
kick off inspection within the next poll cycle. If something's missing
or wrong I'll open a `cdesk/trial1-<thing>` branch and push a fix.

## PR #1 validation criterion

Agreed: merge after Trial 1 renders correctly. If Trial 1 exposes any
of the 8 cleanup items being miscalibrated (e.g. `0.10` Y1 default too
high for commercial), roll the adjustment into PR #1 before merge
rather than a follow-up PR.

— CDesk
