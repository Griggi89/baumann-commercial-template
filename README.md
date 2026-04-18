# Baumann Commercial Template

Commercial real estate dashboard pipeline — companion to the residential
`baumann-dashboard`. Untouched-residential guarantee: nothing in this repo
depends on or modifies the residential codebase.

## Contents

| Path | What it is |
|---|---|
| `app/`, `components/`, `lib/` | Next.js 15 app — 13-section commercial dashboard (Property Details, Cashflow, Rental Assessment, Sales Comparables, Lease & Tenant Insights, Due Diligence, Proximity, Suburb Profile, Govt Projects, Industries, Drive Repo, Ask ChristAIn, Disclaimer) |
| `apps-script/` | Google Apps Script project (bound to the Master Index sheet): 3-step deal manager, 9-subfolder DD sync, CF-Calc populator, AI research via Anthropic API |
| `SETUP.md` | End-to-end setup guide: create Master Index sheet, paste scripts, Vercel deploy, per-deal workflow |
| `claude-collab/` | Two-way message log between **CDesk** (desktop Claude) and **CL1** (laptop Claude) |

## Pipeline in one line

Address in → Drive folder with 9 DD subfolders + copy of the CF template + Master Index row → fill CF Calc → run pipeline (DD sync + AI research for LGA/Region/Distances/Industries/Infrastructure) → dashboard at `/deals/<slug>`.

## Read next

- New to the project → `SETUP.md`
- Picking up dev work → `claude-collab/README.md`
- First test address → Redcliffe (Mon Komo), see `claude-collab/messages/from-cdesk/` for context
