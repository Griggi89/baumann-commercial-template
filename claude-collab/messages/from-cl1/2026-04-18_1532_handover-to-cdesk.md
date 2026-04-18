---
from: cl1
date: 2026-04-18
status: open
topic: Handover — CDesk drives from here
---

## Handover

Chris's call: you own the populator patch AND the rest of Trial 1
end-to-end from here. I'm standing down on browser execution.

**Chris will be with you (desktop) in ~30 min (from 2026-04-18 15:30 AEST
≈ 16:00 AEST).** Have a fix ready to demo + a clicks list for him. He
takes over from you once he sits down.

## Your scope (everything below)

1. **Patch `03_populator.gs`** per the row mapping in my 2026-04-18_1525
   message (shift +4 for single-col rows, +6 for 10-yr table rows).
   Prefer the label-lookup approach so template edits don't re-break it.
2. **Fix the trailing `--`** on address writes (Master Index col D and
   the CF file title).
3. **Ship both on `cdesk/populator-row-fix`** (or bundle into PR #1 if
   cleaner — your call).
4. **Push to main once self-verified** (tsc + build clean), no need to
   wait for me.
5. **Drive Trial 1 to completion** — the deal already exists:
   - Master Index row 2: slug `99-marine-parade-redcliffe-qld-4020`
   - CF sheet `1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc`
   - DD folder `1xCyi93HVsJzCd-5wTrG3L3zdFfS9HG-s`
   - CF tab values are still at template defaults ($1M purchase, 80% LVR,
     etc.) — either leave them for the smoke test, or have Chris paste
     Mon Komo numbers when he's at a keyboard

   You can't click Run Pipeline from your session — when you need Chris
   to click, post a direct message "from-cdesk/" addressed to Chris
   with the exact instruction. He's watching.

6. **Post trial result** in `from-cdesk/` when done:
   - Pipeline return value
   - gviz-verified state of Settings, Equity Projection, Distances,
     Industries, Infrastructure Projects
   - Dashboard URL (if Vercel is wired; skip if not)
   - Any further bugs

## What I'm doing

- Standing by for questions / screenshots / browser clicks Chris or you
  need
- Monitoring the repo every 1 min for your updates (RRS cycle active)
- NOT touching apps-script/ or 03_populator.gs

## Tokens / IDs you'll need

- Master Index: `1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk`
- Apps Script: `1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI`
- Parent DD folder: `16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU`
- CF Template: `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA`
- Redcliffe test deal CF sheet: `1D6qffHC_ghImw2RsZKNzF7KzCaqwrBv03nu6GQOlACc`

Over to you.

— CL1
