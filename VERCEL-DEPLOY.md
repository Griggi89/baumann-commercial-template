# Vercel Deploy — first commercial dashboard live

~5 minutes of clicks. The repo builds clean on every `main` commit.

## One-click path (fastest)

1. From the repo README, click **Deploy with Vercel**.
2. Vercel asks you to authorise its GitHub app to read `Griggi89/baumann-commercial-template` — click through.
3. **Project name**: `baumann-commercial-template` (default) — leave or customise.
4. **Environment Variables** — Vercel prompts for two:
   - `COMMERCIAL_MASTER_INDEX_SHEET_ID` = `1tkY8vXzeO-OWpWpbQAcvrWXCHPm6G5y8iEUoYbmvifk`
   - `ANTHROPIC_API_KEY` = (same key you put in the Apps Script project properties — Anthropic console → API keys)
5. Click **Deploy**. First build takes ~90 seconds.
6. When it's done, Vercel shows the live URL, e.g.
   `https://baumann-commercial-template.vercel.app`.

## What to visit

| URL | Shows |
|---|---|
| `/` | Minimal landing page confirming the deploy is live + active deal count |
| `/deals/<slug>` | Individual dashboard — works as soon as the Master Index has a matching row AND the CF sheet has been populated via Run Pipeline |
| `/deals` | Intentionally 404s (deals are access-gated by direct link / token) |

## Update `DASHBOARD_BASE_URL` in Apps Script

Once you have the Vercel domain, edit `apps-script/01_master_index_app.gs`
line ~28 on the copy **inside your Apps Script project**:

```js
DASHBOARD_BASE_URL: 'https://<your-vercel-domain>/deals',
```

This is what the "Step 3 — Get Dashboard URL" sidebar button returns.
Save the Apps Script project. Doesn't need a redeploy on Vercel.

## Custom domain (optional, later)

Vercel project → Settings → Domains → add `commercial.baumannproperty.com.au`
or similar. CNAME to `cname.vercel-dns.com`. Cert is automatic.

## Redeploys

Pushing to `main` auto-triggers a new build. No manual redeploy needed
for code changes. Env var changes require a redeploy via the Vercel
dashboard (Deployments → Redeploy).

## If the first deploy fails

Common causes:
1. **Missing env var**: the Ask ChristAIn route falls back gracefully, and
   `/deals/<slug>` will 404 if `COMMERCIAL_MASTER_INDEX_SHEET_ID` is
   missing (see `app/page.tsx`'s try/catch). The build itself won't fail.
2. **Build log shows a missing package**: shouldn't happen — `package.json`
   is complete. If it does, screenshot the log and drop it in
   `claude-collab/messages/from-chris/`.
