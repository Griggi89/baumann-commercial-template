---
from: cdesk
to: chris
date: 2026-04-18
status: open
topic: Everything is ready — 3 clicks + 2 pastes = first live dashboard
---

## What I did autonomously (just pushed, commit `eb2e8b5`)

1. **Root landing page** — `/` now renders "Baumann Commercial — Deal
   Dashboards" with your logo + contact link. Was 307→404 before.
2. **Deploy-with-Vercel button** added to README. One click walks you
   through the Vercel project setup.
3. **`VERCEL-DEPLOY.md`** — ~5-minute exact clicks-list for Vercel.
4. **`APPS-SCRIPT-SYNC.md`** — how to get the latest `.gs` into your
   bound Apps Script project (manual-paste + clasp options).
5. **`trial-deals/00-demo-full-fixture.md`** — fully-populated dummy
   deal (Demo Tower, 1 Collins Street Melbourne). Paste all fields and
   the dashboard renders every section, not bare cards.
6. **`next.config.ts`** — removed the leftover `/ → /deals` redirect
   that was tripping the new root page.

Build verified: tsc clean, next build clean (7 routes), dev server
GET / → 200 with correct heading. Screenshot in my session.

## What's left on your side (~10 minutes total)

### Step A — Vercel deploy (~5 min)

1. Go to repo: https://github.com/Griggi89/baumann-commercial-template
2. Click the **Deploy with Vercel** button in the README.
3. Authorise Vercel → GitHub when prompted.
4. Vercel prompts for 2 env vars:
   - `COMMERCIAL_MASTER_INDEX_SHEET_ID` =
     `1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk`
   - `ANTHROPIC_API_KEY` = your key from Anthropic console
5. Click **Deploy**. ~90s build. You'll get a URL like
   `https://baumann-commercial-template.vercel.app`.
6. Visit `/` to confirm the landing page renders.

### Step B — Apps Script sync (~2 min)

The bound Apps Script still has the pre-fix code. Two options in
`APPS-SCRIPT-SYNC.md`; fastest is manual paste of `03_populator.gs`
and `01_master_index_app.gs` into
https://script.google.com/home/projects/1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI/edit

Verify: `03_populator.gs` should contain `findCFRowByLabel_` near the
top. If it does, sync worked.

Also update the `DASHBOARD_BASE_URL` constant in `01_master_index_app.gs`
(line ~28) to your new Vercel domain, e.g.
`https://baumann-commercial-template.vercel.app/deals`.

### Step C — Run one deal to completion (~3 min)

**Pick one**:

**Option C.1 — Reuse Trial 1** (Mon Komo, already exists)
- Trial 1 CF sheet: `1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc`
- Still has template defaults ($1M / 80% LVR). Dashboard renders but
  some sections will be thin.
- Master Index → Deal Manager → Step 2 → paste CF Sheet URL → Run Pipeline
- Visit `https://<vercel-domain>/deals/99-marine-parade-redcliffe-qld-4020`

**Option C.2 — Demo Tower** (richer render)
- Follow `trial-deals/00-demo-full-fixture.md` end-to-end:
  1. Create Deal with `Demo Tower, 1 Collins Street, Melbourne VIC 3000`
  2. Paste CF Calc values (table in the spec)
  3. Paste Settings fields (block in the spec)
  4. Run Pipeline
  5. Visit `https://<vercel-domain>/deals/demo-tower-1-collins-street-melbourne-vic-3000`

Option C.2 is what you'll want to show someone — every section lit up.

## If something breaks

- Post the error + screenshot in `from-chris/` and I'll turn around a
  fix branch same day.
- If Vercel build fails: the env vars can be set after the first deploy
  (Vercel → Settings → Environment Variables → Redeploy).
- If Run Pipeline 400s: most likely the Apps Script sync didn't take.
  Verify `findCFRowByLabel_` exists in the bound project.

— CDesk
