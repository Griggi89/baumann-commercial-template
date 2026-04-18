# BPI Commercial Dashboard — Setup Guide

**Status:** end-to-end scaffold ready. Doesn't touch the residential system.
Last updated: 2026-04-17.

---

## What got built

### 1. `apps-script-commercial/` — Google Apps Script project (bind to the new Master Index sheet)
| File | Purpose |
|---|---|
| `01_master_index_app.gs` | Menu, sidebar, `createCommercialDeal()`, `runPipeline()`, `getDashboardUrl()`, Master Index row writer |
| `02_dd_sync.gs` | Scans the 9 DD subfolders in Drive, populates the Due Diligence tab |
| `03_populator.gs` | Mirrors Cash FLow Calc cell values into Settings; seeds Equity Projection; seeds headers on Distances / Industries / Infrastructure Projects |
| `DealManager.html` | The 3-step sidebar UI (Create Deal → Run Pipeline → Get Dashboard URL) |

### 2. `baumann-commercial-template/` — Next.js 15 app (sibling to `dashboard-template/`)
- 13-item sidebar: Property Details / Cashflow / Rental Assessment / Sales Comparables / Lease & Tenant Insights / Due Diligence / Proximity / Suburb Profile / Govt Projects / Local Industries / Drive Repo / Ask ChristAIn / Disclaimer
- `lib/fetchSheetData.ts` reads the 8 Commercial CF Template tabs via gviz
- `lib/properties.ts` reads the **Commercial** Master Index (via `COMMERCIAL_MASTER_INDEX_SHEET_ID` env var)
- Builds clean (`npx next build` → 8 static pages, no errors)

---

## One-time setup (you do this)

### Step A — Create the Master Index sheet

1. Create a new Google Sheet named **"BPI COMMERCIAL - MASTER Index App"**
2. Extensions → Apps Script. Delete the default `Code.gs`.
3. Paste the three `.gs` files from `apps-script-commercial/` as separate script files (preserve filenames) + the `DealManager.html` as an HTML file.
4. Enable **Drive API** advanced service (Services → + → Drive API → Add) — required for DD file text/OCR extraction.
5. **(Optional, enables AI research)** File → Project properties → Script properties → Add row:
   - key: `ANTHROPIC_API_KEY`
   - value: `sk-ant-...` (your Anthropic API key)
   - Without this, the pipeline still runs but the Distances / Industries / Infrastructure Projects tabs stay empty until you fill them manually.
6. Save. Reload the sheet. A new **"BPI Commercial"** menu appears in the toolbar.
7. Click **BPI Commercial → Ensure Master Index Headers** once to set up columns.
8. Copy the sheet ID from the URL.

### Step B — Create the Vercel project

1. Push `baumann-commercial-template/` to a GitHub repo (separate from residential, or same monorepo, your call).
2. On Vercel, New Project → import → root = `baumann-commercial-template/`.
3. Add env vars:
   - `COMMERCIAL_MASTER_INDEX_SHEET_ID` = (the sheet ID from Step A)
   - `AI_GATEWAY_API_KEY` or `ANTHROPIC_API_KEY` (for the Ask ChristAIn chat — same as residential)
4. Deploy. First deploy will 404 on `/deals/<slug>` until you've created a deal (that's fine).

### Step C — Update the Dashboard base URL in the Apps Script

Open `01_master_index_app.gs`, line `DASHBOARD_BASE_URL`, replace with your Vercel domain (e.g. `https://baumann-commercial-template.vercel.app/deals`). Save.

---

## Using it (every new deal)

1. Open the Master Index sheet → **BPI Commercial → Deal Manager** (opens the 3-step sidebar).
2. **Step 1 — Create DD Folder.** Paste address, click Create Deal. The script:
   - Creates a subfolder in the Commercial Due Diligence parent folder (`16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU`)
   - Creates the 9 DD subfolders inside
   - Copies the Commercial CF Template, renaming it `CF — <address>`
   - Seeds the CF copy's Settings tab with the address + DD folder URL
   - Writes a new row to the Master Index
3. Drop files into the 9 Drive subfolders. Fill in Cash FLow Calc (Purchase Price at C2, LVR at C3, etc.) and Settings tab fields in the new CF sheet.
4. **Step 2 — Run Pipeline.** Sidebar auto-fills the CF Sheet URL. Click Run Pipeline. The script:
   - Scans the 9 DD subfolders, fills the Due Diligence tab
   - Mirrors CF Calc cell values into Settings (so the Vercel dashboard can read them as key/value)
   - Builds the Equity Projection tab from the CF Calc 10-year table
   - Seeds default headers on Distances, Industries, Infrastructure Projects
5. **Step 3 — Get Dashboard URL.** Click Get URL. Paste into browser. ISR revalidates every 60s.

---

## What still needs your input per deal (by design)

If `ANTHROPIC_API_KEY` is set, the pipeline auto-fills (based on address alone):
- **Location fields in Settings** — LGA code, LGA display name, Region Name, Benchmark Name, Latitude, Longitude. Only written if the field is empty, so you can override by filling them manually in Settings before running the pipeline.
- **Distances** — 9 amenity categories with km + drive time, sourced by Claude (`claude-sonnet-4-6`). Verify against Google Maps for accuracy.
- **Industries** — top 5 for the LGA with benchmark %. Cross-check against [ABS QuickStats](https://www.abs.gov.au/) before presenting.
- **Infrastructure Projects** — 5 current projects with source URLs. Verify each source URL resolves before sending to a client.

Manual either way:
- **Due Diligence** — checks auto-filled from Drive scan; status progression (Found → Complete) is manual.
- **Rental Assessment (sqm rates)** and **Sales Comparables** tabs — fill manually per deal (that's the workflow you specified — you paste in once you've done the appraisal).

**Re-run AI research standalone:** If you update the address or LGA in Settings and want fresh research without re-running the whole pipeline, use **BPI Commercial → Run AI Research (on CF sheet)**.

---

## Known gaps / next session work

1. **Visual polish.** The 3 new section components (RentalAssessment, SalesComparables, DriveRepo) are functional but minimal. The CashflowSection still uses the residential triple-net-less chart logic; may want commercial-specific variant (payback calc, cap rate sensitivity).
2. **Styling reference.** You shared the Palise competitor dashboard (`dash.paliseproperty.com/comm/ini/...`) — it's client-rendered so WebFetch can't see it. Send screenshots if you want me to match specific visual choices.
3. **Commercial CF Template cleanup.** The Settings tab has residential leftovers (Bedrooms, Bathrooms). Edit the template directly to remove these and add commercial-specific fields (WALE, Lease Type, Tenant Covenant, NABERS, GST, Rent Review cadence). The populator + fetchSheetData already know about these commercial fields — they just won't have values until the template has the rows.
4. **AI research cost.** At `claude-sonnet-4-6`, one research call for one property is ~$0.03-0.08 depending on output length. Cheap for per-deal use. If you run it in bulk, monitor spend in the Anthropic console.
5. **AI source URLs.** Always verify `source_url` values in the Infrastructure Projects tab before sending a dashboard to a client — LLMs occasionally hallucinate URLs even when the underlying project is real.

---

## File locations quick-ref

```
Dashboard BPI/
├── apps-script-commercial/             ← paste into new Master Index sheet
│   ├── 01_master_index_app.gs
│   ├── 02_dd_sync.gs
│   ├── 03_populator.gs
│   └── DealManager.html
├── baumann-commercial-template/        ← new Vercel project root
│   ├── app/deals/[slug]/page.tsx
│   ├── app/deals/[slug]/DashboardClient.tsx
│   ├── components/sections/*.tsx       ← 13 section components
│   ├── lib/fetchSheetData.ts           ← CF tab → PropertyData
│   ├── lib/properties.ts               ← reads Master Index via env var
│   └── package.json                    ← name: baumann-commercial-template
└── dashboard-template/                 ← UNTOUCHED residential system
```

---

## Verification done

- `npx tsc --noEmit` → 0 errors
- `npx next build` → 8 pages built successfully
- Apps Script syntax manually validated against Drive/SpreadsheetApp API docs
- All hardcoded IDs resolve:
  - Commercial DD parent folder: `16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU` ✓
  - Commercial CF template: `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA` ✓
