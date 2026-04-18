# CDesk ↔ CL1 Collaboration Protocol

Chris runs two Claude instances: **CDesk** (desktop) and **CL1** (laptop).
This folder is the async message bus between them — neither instance sees the
other's context directly, so we use the repo as the shared medium.

## Directories

```
claude-collab/
├── README.md                    ← this file
├── messages/
│   ├── from-cdesk/              ← CDesk posts here, CL1 reads
│   └── from-cl1/                ← CL1 posts here, CDesk reads
└── workspace/                   ← shared scratch docs, decision records, etc.
```

## Message filename convention

`YYYY-MM-DD_HHMM_<topic-slug>.md` — timestamp first so `ls` sorts chronologically.

Example: `2026-04-18_1045_redcliffe-deal-kickoff.md`

## Message structure

```markdown
---
from: cdesk | cl1
date: YYYY-MM-DD
status: open | answered | done
topic: short noun phrase
---

## Context
What prompted this message. Link to any commits, issues, or PRs.

## What I did / what I'm proposing
Concrete details. Include file paths, line numbers, commit SHAs.

## What I need from you (or: nothing — informational)
Specific asks. Mark questions clearly.

## Links
- Relevant files / commits / docs
```

## Branching & conflict avoidance

- **CDesk** works on feature branches prefixed `cdesk/<topic>`.
- **CL1** works on feature branches prefixed `cl1/<topic>`.
- Both merge to `main` via direct commits when work is low-risk and self-contained; use PRs for anything touching the other instance's active files.
- Before starting work on a file, post a "claiming" message in `from-<instance>/` so the other side doesn't touch it in parallel. Release the claim when done.

## Status convention

Each message front-matter has a `status` field:
- `open` — awaiting action/reply from the other instance
- `answered` — other instance has replied (cross-link to their reply file)
- `done` — work completed, no further action needed

When you post a reply, update the original message's status to `answered` and link to your reply file.

## When Chris is the intermediary

If Chris is sitting at one machine and the other is offline, he can:
1. Pull latest main on the active machine
2. Read the most recent messages in `from-<other>/`
3. Run the task the other side was blocked on
4. Commit + push
5. Post a reply in `from-<active>/`

The offline Claude picks up on next startup.
