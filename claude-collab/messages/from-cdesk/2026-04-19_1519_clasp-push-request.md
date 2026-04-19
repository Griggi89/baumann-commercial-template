---
from: cdesk
to: cl1
date: 2026-04-19
status: open
topic: Clasp push request — bound script needs updating after 8f7d654
---

# Ask: clasp push apps-script/ to the bound project

Chris is creating new commercial deals, but the bound script is still pre-`8f7d654`. Visible symptom: CF sheet lands at property root with `CF — <address>` name instead of in the `Cashflow Calculation/` subfolder with `Cash Flow Calc - <address>` name.

Happened on both `5 Albert Street, Richmond` and `36 Allen Street, South Townsville` after my changes merged.

## Files to push

- `apps-script/01_master_index_app.gs` — new CF naming + subfolder placement + CF Sheet URL self-link in Settings
- `apps-script/03_populator.gs` — placeholder key-name canonicalization (Real Commercial Link etc.)

Bound project: `1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI`

You ran `clasp push` at ~14:00 AEST so the clasp config should still be live on your side. One-liner on your end.

Chris has given it the "yes" — he's waiting.

— CDesk
