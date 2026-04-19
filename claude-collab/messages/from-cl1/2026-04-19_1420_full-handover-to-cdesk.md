---
from: cl1
date: 2026-04-19
status: open
topic: FULL HANDOVER — CDesk champions from here
---

# CDesk: you're driving

Chris wants you to take over end-to-end from here. I'm stepping back. The objective: **push the Maroochydore dashboard to a state Chris can proudly show a client**, then move to the next deal.

## 🎯 The dashboard to show Chris when ready

**https://commercial.baumannproperty.com.au/22-maroochydore-road-maroochydore-qld-4558**

Every time you ship an improvement that lands on this URL, paste the URL back in a `from-cdesk/` message for Chris to re-review. The dashboard is the deliverable — not PRs, not code comments. URL → Chris's eyes.

## Non-negotiable rule (Chris's words today)

**All structural changes go to the CF Template, not to deal-specific CF copies.**

- Template: https://docs.google.com/spreadsheets/d/1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA/edit
- Deal copies inherit at Create Deal time
- Only deal-specific data (actual rent, tenant, address) lives in deal sheets
- See `2026-04-19_1415_template-is-source-of-truth.md`

The template is already in a good state (7% interest, 70% LVR, $352K cash required, 100% debt reduction, 10-yr table populated). Don't undo that.

## Where Chris last left off (live state)

### ✅ Working

- Custom domain `commercial.baumannproperty.com.au` live with SSL
- Root-slug URLs (`/<slug>` not `/deals/<slug>`, residential pattern)
- Apps Script bound project synced to main as of 14:00 AEST today
- Pipeline runs end-to-end (Create Deal → Fill → Run Pipeline → live dashboard)
- Executive Summary 4-card (Purchase $1M / 6% cap / Y5 $8K cashflow / Cash $252K) — except cash now $352K at 70% LVR on Maroochydore, needs dashboard refresh
- 10-year cashflow chart + full Equity & Yield Projection + Loan Amortization tables — pipeline extension (your `3ffc7a7`) working
- AI research tabs (Distances 9, Industries 5, Infrastructure 5 projects with source URLs) — Sunshine Coast / Moreton Bay data looks right
- Property Type dropdown on CF template Settings tab (installed earlier this session)

### ⚠️ Known bugs / gaps Chris flagged today (in order of his vocal emphasis)

1. **Dashboard assumptions text mentions "non-recoverable expenses $4,200/yr"** — Chris: "aka that's the net figure... net yield is already adjusted for non-recoverables". **Action: drop that phrase entirely from CashflowSection.tsx assumptions string.** Don't rename it, delete it.
2. **Add to assumptions:** "Assumption: surplus cashflow reinvested to pay down loan" — matches the 100% debt reduction in CF Calc. This is material info for understanding why Net Cash flow grows year-on-year.
3. **Y5 Net Cashflow card** shows −$200 on stale Settings data, should show +$16,668 (Y5 from CF Calc 10-yr table after Chris's 7%/70%/100%-debt-reduction update). Root cause: populator "only if empty" semantics — first pipeline run wrote Settings!Interest Rate = 0.08, subsequent runs don't overwrite because cell is non-empty. Tangible impact: all derived Y5/Y1 cashflow numbers on dashboard are stale.
4. **Property Details section rendering empty** despite Property Type = "Industrial Showroom" being in Settings. Likely `FeaturesSection.tsx` CLIENT_FIELDS whitelist doesn't include "Property Type" and other commercial fields. Quick fix.
5. **Equity & Yield Projection + Loan Amortization tables should combine** — one 10-col table, shared Year axis. Chris: "seems redundant". See `2026-04-19_1325_ui-consolidations.md`.
6. **Combined "SQM Rate Assessment" tab/section** — Chris renamed per his verbal phrasing. fetchSheetData needs new parser for the combined "Rental ans Sales comps (sqm rates)" tab with sales on top and rent comparables on bottom. See same 1325 message.
7. **Year 0 row in Equity table** shows weekly rent ($1154) under per-year column + confused semantics on Net Equity. See earlier backlog msg.

## Priority order for you (Chris's verbal emphasis, paraphrased)

1. **Fix the populator re-mirror issue** so Y5 cashflow card reflects current CF Calc values. Two approaches:
   - Option A: Change `mirrorCFCalcToSettings_` to always-overwrite for the CF-Calc-sourced fields (not the free-text ones). Split the constants into MIRROR_ALWAYS vs ONLY_IF_EMPTY lists.
   - Option B: Add a menu item `BPI Commercial → Force Re-mirror CF → Settings` that wipes the specific Settings cells and re-runs `mirrorCFCalcToSettings_`.

   I'd ship **Option A** — "force re-mirror" via menu is extra friction. Mirrored CF values should always reflect the CF Calc truth.

2. **Ship the assumptions text fix** (drop expenses line, add reinvestment line). Single-line PR.

3. **Run pipeline on Maroochydore** after #1 lands. Dashboard should show Y5 cashflow ≈ +$16,668, 7% interest, etc.

4. **Fix Property Details empty state** (FeaturesSection whitelist).

5. **Combined SQM Rate Assessment + combined projection table** — bigger refactors, ship after #1–4 are clean.

6. **Token generation** — Chris hasn't given the format yet (my 1353 msg asked, no response). Safe default: 8-char URL-safe base64 per residential; auto-generate at createCommercialDeal(); fill in column G of Master Index.

## What I just did (so you know what's in-flight)

- **PR #13** merged: `DASHBOARD_BASE_URL` → `https://commercial.baumannproperty.com.au`
- Posted 4 msgs in `from-cl1/` today: 1310 backlog, 1325 UI consolidations, 1353 naming, 1410 sync, 1415 template-is-truth, and this one
- Bound Apps Script synced to main
- Custom domain wired (DNS + SSL)
- Did NOT ship assumptions text fix (queued for you, Chris wants you championing)
- Did NOT ship the populator re-mirror fix (queued for you)

## Workflow from here

You own:
- All code PRs
- All Apps Script sync-to-bound via clasp
- All CF template edits (structural only — formulas, defaults, dropdowns, row layout)
- Posting the updated dashboard URL back to Chris each time it improves

I'll be:
- Out of the way
- Available if you need me to run something in the browser (Chris's direction) — but default assumption is you drive
- Monitoring for your messages and relaying to Chris in chat

## Bookmark this

Every `from-cdesk/` message to Chris should include:

> **Live dashboard:** https://commercial.baumannproperty.com.au/22-maroochydore-road-maroochydore-qld-4558

Makes it one-click for him. Over to you.

— CL1
