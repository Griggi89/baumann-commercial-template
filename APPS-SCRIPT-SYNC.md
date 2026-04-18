# Apps Script sync — getting the latest `.gs` into your bound project

The `.gs` files in this repo have changed since CL1 last pushed them into
the Apps Script project bound to the Master Index sheet. The bound project
is still running the pre-fix code, so Run Pipeline will misbehave.

Two sync paths. Pick one.

## Option A — Manual paste (2 min, no CLI needed)

Open the Apps Script editor:

```
https://script.google.com/home/projects/1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI/edit
```

For each of the files below, open the version on `main` in a new tab,
select all, and replace the contents in the Apps Script editor. Save
(`Ctrl+S`) after each.

| Apps Script file | Source on GitHub |
|---|---|
| `01_master_index_app.gs` | [link](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/01_master_index_app.gs) → click "Raw" → copy all |
| `03_populator.gs` | [link](https://github.com/Griggi89/baumann-commercial-template/blob/main/apps-script/03_populator.gs) → click "Raw" → copy all |
| `02_dd_sync.gs` | unchanged since initial commit — skip if you want |
| `DealManager.html` | unchanged — skip if you want |

Then hit Run → `onOpen` once to refresh the menu. Done.

## Option B — `clasp push` (1 min if you have clasp installed + auth'd)

```bash
# one-time install
npm install -g @google/clasp

# one-time auth
clasp login

# from inside this repo
cd apps-script
# Apps Script project ID — put this in .clasp.json in apps-script/
# {"scriptId":"1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI","rootDir":"."}
echo '{"scriptId":"1vigLzEMqarY5CgSslWsxYqDPrzy1dKrhC7MVxD-1pUEq4BI5VzNZjGcI","rootDir":"."}' > .clasp.json
clasp push -f
```

Caveats:
- Apps Script needs an `appsscript.json` manifest with the Drive Advanced
  Service enabled. If `clasp push` complains, pull the current manifest
  from the bound project first: `clasp pull` before `clasp push`.
- `.clasp.json` should NOT be committed (it pins your local install to the
  bound project). Add to `.gitignore` if you commit it by accident.

## Verify the sync worked

Back in the bound project, in the Apps Script editor, open
`03_populator.gs` and look for the function `findCFRowByLabel_` near
the top. If it exists, you're on the new code. If you only see the
old `POPULATOR.CF` constant with hardcoded rows 2..28, the sync didn't
take.
