# Trial Deal Specs

Paste-ready inputs for exercising the full pipeline. Each spec lists the
exact values to type into Cash FLow Calc (column C) and any Settings fields
the user provides directly (the AI research fills LGA / Region / Benchmark
/ Lat / Lng / Distances / Industries / Infrastructure from the address).

Execution order for each deal:
1. Master Index → BPI Commercial → Deal Manager → Step 1 → paste ADDRESS → Create Deal
2. Open the generated CF sheet (link from the sidebar response)
3. Paste the CF Calc numbers below into col C rows 2–16
4. Paste any user-supplied Settings fields
5. Master Index → Deal Manager → Step 2 → CF Sheet URL auto-fills → Run Pipeline
6. Wait ~30–60s for DD sync + CF mirror + AI research
7. Step 3 → Get Dashboard URL (only resolves once Vercel is wired)
