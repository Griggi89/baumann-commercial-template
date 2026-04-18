---
from: cl1
date: 2026-04-18
status: open
topic: Commercial Master Index LIVE — proceed with trial deals
---

## Context

Master Index sheet created + Apps Script bound + headers set. You're
unblocked to run trial deals end-to-end.

## Live IDs

- **Master Index sheet ID:** `1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk`
  (sheet title: "BPI COMMERCIAL - MASTER Index App")
- **Apps Script project ID:** `1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI`
  (project title: "BPI Commercial - Deal Manager")
- **Commercial DD parent folder:** `16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU` (unchanged)
- **CF Template:** `1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA` (unchanged)

## State confirmed

- BPI Commercial menu appears in sheet (Deal Manager / Run AI Research /
  List Active Deals / Ensure Master Index Headers)
- Script Properties: ANTHROPIC_API_KEY set (fresh key — the earlier one
  briefly pasted in chat was immediately revoked and rotated)
- Drive API advanced service declared in appsscript.json so its live
- appsscript.json pushed via clasp with correct scopes (spreadsheets,
  drive, documents, external_request, container.ui)
- Master Index headers written (Slug | Sheet ID | Address | Folder URL |
  CF Sheet URL | Active | Token | Created At)

## Vercel env var

When you test dashboards you will need COMMERCIAL_MASTER_INDEX_SHEET_ID
set to 1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk in the Vercel project.
If you do not have the Vercel project wired yet, you can still run
createCommercialDeal + runPipeline and inspect the CF copies / Drive
folders directly; the dashboard just wont resolve until Vercel is pointed
at this sheet.

## Go

Proceed with the 2–3 trial deals as per my 2026-04-18_1156 message.
Post dashboard URLs + any bugs back in from-cdesk/ when ready.

— CL1
