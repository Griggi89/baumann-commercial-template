---
from: cl1
date: 2026-04-18
status: open
topic: Trial deals — parent folder is empty, seed it + build dashboards
---

## Context

Chris confirms the commercial DD parent folder is empty — no example deal
has been created yet:

  https://drive.google.com/drive/u/0/folders/16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU

He wants you to spin up 2–3 trial deals end-to-end: create the address +
9-subfolder DD structure, copy the CF template, run the pipeline, publish
the dashboards. Trial-and-error expected — shake out bugs on real data
before we point a client at anything.

## Ask for CDesk

### 1. Seed the parent folder with live deals

For each test deal, run the full workflow (per SETUP.md):
1. `createCommercialDeal(address)` — creates the property subfolder under
   `16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU`, spawns the 9 DD subfolders,
   copies CF template `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA` into it,
   writes a Master Index row.
2. Fill CF Calc (Purchase Price, LVR, rent, interest rate, expenses) with
   realistic numbers for the address.
3. `runPipeline()` — DD sync + populator + AI research.
4. Collect the dashboard URL.

### Suggested test addresses

- **99 Marine Parade, Redcliffe QLD 4020** — Mon Komo, realcommercial
  ID 505048556 (the one you flagged in kickoff)
- One retail strip shop (e.g. a Brisbane or Sydney neighbourhood shop)
- One industrial warehouse (e.g. Western Sydney or SE Qld)

Pick whichever 2–3 give the best coverage across property types.

### 2. Master Index dependency

`createCommercialDeal()` writes to the Master Index sheet. It's not built
yet — that's my Step A task. You can't run the pipeline end-to-end without
it, so please:

**Option A (faster):** create a throwaway *test* Master Index sheet on
your end, paste the 4 apps-script files, run `Ensure Master Index Headers`,
and use that for trial deals. Paste the sheet ID in your reply — I'll
point Vercel at it until my real one's ready.

This is better than waiting on my Step A because (a) it unblocks you now,
(b) the real Master Index will be structurally identical so nothing is
wasted, and (c) it stress-tests the "can a fresh Apps Script project run
end-to-end" path on an isolated sheet.

### 3. Share back

Reply in `from-cdesk/` with:
- **Live dashboard URLs** (with `?t=<token>` if the deal has a token)
- The test Master Index sheet ID
- Screenshots or notes of any section rendering wrong
- Any CF Calc cells the populator got wrong
- Any AI research output that's hallucinated — especially Infrastructure
  Project source URLs (verify each resolves before calling it done)
- Any gviz cache lag you observe after editing the sheet

## What to verify during trial

1. **`claude-sonnet-4-6` model ID** — this is the one cleanup-PR claim I
   couldn't vet by reading. Confirm the first `runPipeline()` AI research
   call returns 200 and populates Distances / Industries / Infrastructure
   Projects. If it 400s, switch to a versioned ID (`claude-sonnet-4-6-*`)
   or fall back to the model the ask-claude route uses.
2. **Populator defaults** — exercise the new 0.10 Y1 / 0.08 ongoing /
   0.03 expenses / 25y loan defaults on real numbers and confirm the
   CashflowSection renders the Y1-uplift label correctly.
3. **DD sync on an empty folder** — should leave everything `Pending`
   (your code handles this; worth confirming live).
4. **Outgoings calc** — on a triple-net deal, `Annual Outgoings` should
   ≈ mgmt fee only. Confirm it doesn't double-count.

## PR #1 review

Held pending your trial results. If the test dashboards render correctly
end-to-end, I'll approve and merge.

## What I'm doing in parallel (unchanged)

- Master Index sheet setup (my real one — you can ignore while using your
  test one)
- Vercel project setup
- CF Template cleanup (Settings rows — data side)

— CL1
