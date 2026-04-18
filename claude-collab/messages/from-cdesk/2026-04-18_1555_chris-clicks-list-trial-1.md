---
from: cdesk
to: chris (direct) + cl1 (informational)
date: 2026-04-18
status: open
topic: Clicks list for Chris — finish Trial 1 when you sit down
---

## Status as of 15:55 AEST

- PR #1 (cleanup, 8 items) — **merged** to main (`a1a772e`)
- PR #2 (populator row-fix + address trim) — **merged** to main (`d15cbc1`)
- Trial 1 deal already exists from CL1's earlier Create Deal run:
  - CF sheet: `1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc`
  - DD folder: `1xCyi93HVsJzCd-5wTrG3L3zdFfS9HG-s`
  - Master Index row 2
- Trial 1 Pipeline NOT yet run (was blocked on the populator bug — now fixed)

## Chris — clicks list when you sit down

### Step 0 — Re-sync the Apps Script project with `main`

The `.gs` files in the repo have been patched; the Apps Script project
bound to the Master Index still runs the old (buggy) code. You need to
push the updated files into the project. Two options, pick one:

**Option A — `clasp push` (fastest if you have clasp installed)**

```bash
cd "apps-script"
clasp push   # pushes 01_master_index_app.gs / 02_dd_sync.gs / 03_populator.gs / DealManager.html
```

**Option B — manual paste (2 minutes)**

1. Open Apps Script project: https://script.google.com/home/projects/1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI/edit
2. For each of the 4 files, select all + replace with the updated version from GitHub:
   - [01_master_index_app.gs](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/01_master_index_app.gs)
   - [02_dd_sync.gs](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/02_dd_sync.gs) *(unchanged — skip if you want)*
   - [03_populator.gs](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/03_populator.gs) **← the big one**
   - [DealManager.html](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/DealManager.html) *(unchanged — skip if you want)*
3. Save (Ctrl+S)

### Step 1 — (Optional) Paste Mon Komo numbers into the CF sheet

Open the CF sheet:
https://docs.google.com/spreadsheets/d/1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc/edit

It's currently at the template defaults ($1M / 80% / etc.). You can
either:

- **Leave it at template defaults** — fastest smoke test, just proves
  the pipeline runs end-to-end
- **Paste Mon Komo numbers** — more realistic, see
  [`trial-deals/01-redcliffe-mon-komo.md`](https://github.com/Griggi89/baumann-commercial-template/blob/main/trial-deals/01-redcliffe-mon-komo.md)
  for the exact cells

Either works for validating the pipeline. Your call.

### Step 2 — Run Pipeline

1. Open Master Index:
   https://docs.google.com/spreadsheets/d/1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk/edit
2. Menu → **BPI Commercial → Deal Manager** (sidebar opens)
3. Scroll to **Step 2 — Run Pipeline**
4. Paste the CF sheet URL:
   `https://docs.google.com/spreadsheets/d/1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc/edit`
5. Click **Run Pipeline**
6. Wait ~30–60 seconds. The sidebar will show "Pipeline complete."
   with tabs populated summary.

### Step 3 — Post the result

Drop the Pipeline return (copy the sidebar output text) into a new file:

```
claude-collab/messages/from-chris/2026-04-18_XXXX_trial-1-pipeline-result.md
```

…and `git commit && git push`. I'll pick it up on the next poll (~5 min)
and inspect the CF sheet tabs via gviz.

## What I'll verify once you post

- `Settings` tab: `Annual Outgoings`, `Year 1 Capital Growth Rate`,
  `Capital Growth Rate`, `Expense Growth Rate`, `Loan Term Years`,
  `Suggested Questions`, commercial placeholders
- `Settings` tab: `LGA`, `LGA Display Name`, `Region Name`,
  `Benchmark Name`, `Latitude`, `Longitude` (AI-derived from address)
- `Equity Projection` tab: 10 rows, Year 1–10
- `Distances`: 9 rows with km + drive time
- `Industries`: 5 rows with benchmark %
- `Infrastructure Projects`: 5 rows, each `Source URL` HEAD-checked for 200
- `Due Diligence`: 9 Pending rows (folders are empty, expected)

Any failures get diagnosed + a fix branch same day.

— CDesk
