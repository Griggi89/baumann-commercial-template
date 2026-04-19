// ─────────────────────────────────────────────────────────────────────────────
// Commercial CF Sheet → PropertyData fetcher
// ─────────────────────────────────────────────────────────────────────────────
// Reads a Commercial Deal Sheet (copy of the Commercial CF Template) and maps
// tabs to the matching section of PropertyData.
//
// Commercial CF Template tabs:
//   Settings, Cash FLow Calc, Rental Assessment (sqm rates),
//   Sales Comparables, Due Diligence, Industries,
//   Infrastructure Projects, Distances
//
// Uses Google's gviz endpoint (no API key; sheet must be "Anyone with link").
// ─────────────────────────────────────────────────────────────────────────────

import type { PropertyData } from './propertyData';
import { defaultPropertyData } from './propertyData';

export const SHEET_TABS = {
  SETTINGS:        'Settings',
  CASHFLOW:        'Cash FLow Calc',
  // Legacy separate tabs — still read as fallback when the combined tab
  // below is empty (covers deals created before the CF template was
  // consolidated).
  RENTAL:          'Rental Assessment (sqm rates)',
  SALES:           'Sales Comparables',
  DD:              'Due Diligence',
  INDUSTRIES:      'Industries',
  INFRASTRUCTURE:  'Infrastructure Projects',
  DISTANCES:       'Distances',
} as const;

// Consolidated rent + sales tab. Support two names:
//   - 'SQM Rate Assessment'                    — target name (matches dashboard heading)
//   - 'Rental ans Sales comps (sqm rates)'     — historical name (with the 'ans' typo) on pre-rename deal copies
// Fetcher tries new → legacy; first non-empty result wins.
const SQM_RATE_TAB_NAMES = [
  'SQM Rate Assessment',
  'Rental ans Sales comps (sqm rates)',
] as const;

async function fetchTab(sheetId: string, tabName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&headers=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return parseCSV(await res.text());
  } catch {
    return [];
  }
}

async function fetchTabByGid(sheetId: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return parseCSV(await res.text());
  } catch {
    return [];
  }
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) && !inQuotes) {
      if (ch === '\r') i++;
      row.push(current.trim());
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }
  if (current !== '' || row.length > 0) {
    row.push(current.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

function toNum(s: string | number | undefined | null): number {
  if (typeof s === 'number') return isFinite(s) ? s : 0;
  if (!s) return 0;
  const cleaned = String(s).replace(/[$,%\s]/g, '').replace(/[()]/g, '');
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
}

function toSettingsMap(rows: string[][]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    const [key, val] = [row[0] ?? '', row[1] ?? ''];
    if (key && !key.startsWith('──')) map[key.trim()] = (val ?? '').trim();
  }
  return map;
}

/**
 * Parse the combined 'Rental ans Sales comps (sqm rates)' tab into two halves.
 *
 * Layout (per Chris's consolidated template):
 *   [Sales Comparables header marker]
 *   Column headers (Address, Sale Price, $/sqm, Cap Rate, Date, ...)
 *   Data rows
 *   Average per sqm row (highlighted yellow in-sheet)
 *   [Rent Comparables header marker]
 *   Column headers (Address, Lease Date, $ Lease per year, Sqm, $/sqm, ...)
 *   Data rows
 *   Average per sqm row
 *
 * Section boundary detection: col A text transitioning between 'sales' and
 * 'rent' prefixes. 'Average ...' rows get routed to the section's summary.
 */
function parseCombinedRentSales(rows: string[][]): {
  sales:  { headers: string[]; rows: string[][]; summary: { label: string; value: string }[] };
  rental: { headers: string[]; rows: string[][]; summary: { label: string; value: string }[] };
} {
  const sales  = { headers: [] as string[], rows: [] as string[][], summary: [] as { label: string; value: string }[] };
  const rental = { headers: [] as string[], rows: [] as string[][], summary: [] as { label: string; value: string }[] };

  let section: 'sales' | 'rental' | null = null;
  let gotHeaders = false;

  for (const r of rows) {
    const a = (r[0] ?? '').toLowerCase().trim();

    // Section switches (check BEFORE other classifications so a marker row
    // doesn't get captured as headers/data).
    if (a.includes('sales') && a.includes('comparable')) {
      section = 'sales'; gotHeaders = false; continue;
    }
    if (a.includes('rent')  && a.includes('comparable')) {
      section = 'rental'; gotHeaders = false; continue;
    }
    if (!section) continue;

    const target = section === 'sales' ? sales : rental;

    // Average summary row — label/value pair, route to summary, not the grid.
    if (a.startsWith('average')) {
      // Pick the last non-empty numeric-looking cell as the value.
      const val = [...r].reverse().find((c) => c && c.trim() !== '') ?? '';
      target.summary.push({ label: r[0], value: val });
      continue;
    }

    // First non-empty row after a section marker = headers.
    if (!gotHeaders) {
      target.headers = r.filter((c) => c && c.trim() !== '');
      gotHeaders = true;
      continue;
    }

    // Data row — include if it has any content besides col A.
    if (r.slice(1).some((c) => c && c.trim() !== '')) {
      target.rows.push(r);
    }
  }

  return { sales, rental };
}

export async function fetchSheetData(sheetId: string): Promise<PropertyData> {
  if (!sheetId) return defaultPropertyData;
  try {
    return await _fetchSheetDataUnsafe(sheetId);
  } catch (err) {
    // Never 500 the dashboard over a sheet-fetch or mapping error —
    // degrade to defaultPropertyData so the route still renders. Log
    // for Vercel function logs.
    console.error('[fetchSheetData] error, returning defaults:', err);
    return defaultPropertyData;
  }
}

async function _fetchSheetDataUnsafe(sheetId: string): Promise<PropertyData> {
  const [
    settingsRows, cashflowRows, rentalRows, salesRows,
    sqmNewRows, sqmLegacyRows,
    ddRows, industriesRows, infraRows, distancesRows,
  ] = await Promise.all([
    fetchTab(sheetId, SHEET_TABS.SETTINGS),       // Settings tab by name (CF template has Cash FLow Calc at gid=0, not Settings)
    fetchTab(sheetId, SHEET_TABS.CASHFLOW),
    fetchTab(sheetId, SHEET_TABS.RENTAL),          // legacy — kept for back-compat with older deal sheets
    fetchTab(sheetId, SHEET_TABS.SALES),           // legacy — same
    // Combined rent+sales tab: try target name first, then legacy typo'd name.
    fetchTab(sheetId, SQM_RATE_TAB_NAMES[0]),
    fetchTab(sheetId, SQM_RATE_TAB_NAMES[1]),
    fetchTab(sheetId, SHEET_TABS.DD),
    fetchTab(sheetId, SHEET_TABS.INDUSTRIES),
    fetchTab(sheetId, SHEET_TABS.INFRASTRUCTURE),
    fetchTab(sheetId, SHEET_TABS.DISTANCES),
  ]);
  const combinedRows = sqmNewRows.length > 0 ? sqmNewRows : sqmLegacyRows;

  // Prefer the consolidated tab when present; split it into the two halves
  // the UI already expects. If it's missing (older deal sheets) we fall
  // through to the separate tab parsers below.
  const combined = combinedRows.length > 0 ? parseCombinedRentSales(combinedRows) : null;

  const s = toSettingsMap(settingsRows);
  const data: PropertyData = JSON.parse(JSON.stringify(defaultPropertyData));

  // ── Header ────────────────────────────────────────────────────────────────
  data.address     = s['Address']      ?? '';
  data.lastUpdated = s['Last Updated'] ?? '';

  // Listing-link keys — the CF Template Settings uses brand-specific
  // labels:
  //   - 'Real Commercial Link'       → realcommercial.com.au (red brand)
  //   - 'Alternative Real Estate Link' → commercialrealestate.com.au (teal / Domain)
  // Accept canonical names PLUS historical aliases so older deal sheets
  // (before the 'Alternative Real Estate Link' rename) still render.
  data.reaLink = s['Real Commercial Link']
    ?? s['realcommercial Link']
    ?? s['Listing Link']
    ?? s['REA Link']
    ?? s['Property.com.au link']
    ?? '';

  // ── Features ──────────────────────────────────────────────────────────────
  data.features.heroImage   = s['Hero Image URL'] ?? '';
  data.features.propertyUrl = s['Alternative Real Estate Link']
    ?? s['commercial Real Estate Link']
    ?? s['Commercial Real Estate Link']
    ?? s['commercialrealestate Link']
    ?? s['Property URL']
    ?? '';
  const featureLabels = [
    'Property Type', 'Building Area (sqm)', 'Floor Area (sqm)', 'Land Area (sqm)',
    'Year Built', 'Zoning', 'Parking Spaces', 'Car Spaces',
    'NABERS Rating', 'Floor Count', 'Tenancy Count',
  ];
  data.features.details = featureLabels
    .filter((k) => s[k])
    .map((k) => ({ label: k, value: s[k] }));

  // ── Cashflow (mirrored from CF Calc by the populator into Settings) ──────
  data.cashflow.purchasePrice      = toNum(s['Purchase Price']);
  data.cashflow.lvr                = toNum(s['LVR']);
  data.cashflow.interestRate       = toNum(s['Interest Rate']);
  data.cashflow.loanTermYears      = toNum(s['Loan Term Years']) || 30;
  data.cashflow.annualRent         = toNum(s['Net Annual Rent']) || toNum(s['Annual Rent']);
  data.cashflow.rentGrowthRate     = toNum(s['Rent Growth Rate']);
  data.cashflow.capitalGrowthRate       = toNum(s['Capital Growth Rate']);
  data.cashflow.year1CapitalGrowthRate  = toNum(s['Year 1 Capital Growth Rate']);
  data.cashflow.expenseGrowthRate  = toNum(s['Expense Growth Rate']);
  data.cashflow.annualExpenses     = toNum(s['Annual Outgoings']) || toNum(s['Annual Expenses']);
  data.cashflow.debtReductionPct   = toNum(s['Debt Reduction Pct']) || toNum(s['% Debt Reduction']) || 1;

  data.cashflow.upfrontCosts = {
    deposit:           toNum(s['Deposit']),
    stampDuty:         toNum(s['Stamp Duty']),
    gst:               toNum(s['GST']),
    conveyancing:      toNum(s['Conveyancing']) || toNum(s['Solicitor Cost']),
    buildingAndPest:   toNum(s['Building and Pest']) || toNum(s['Building Inspection']),
    valuation:         toNum(s['Valuation']),
    buildingInsurance: toNum(s['Building Insurance']),
    titleInsurance:    toNum(s['Title Insurance']),
    totalRequired:     toNum(s['Total Required']),
  };

  data.cashflow.expenseBreakdown = Object.entries(s)
    .filter(([k]) => k.startsWith('Outgoing: ') || k.startsWith('Expense: '))
    .map(([k, v]) => ({ label: k.replace(/^(Outgoing: |Expense: )/, ''), annual: toNum(v) }));

  // Equity Projection: populator writes a dedicated "Equity Projection" tab.
  // Expanded schema (matches CF Calc 10-yr projection):
  //   [0] Year
  //   [1] Rent
  //   [2] Property Value
  //   [3] Net Equity
  //   [4] Net Cashflow
  //   [5] Yearly Yield           (decimal, e.g. 0.06)
  //   [6] Interest Paid
  //   [7] Principal Paid         (can be negative)
  //   [8] Principal Remaining    (start-of-year loan balance)
  //   [9] Cash on Cash           (decimal)
  //
  // Back-compat: older populators write only cols 0–4. When 5+ are absent,
  // derive sensible defaults from cashflow inputs below.
  const eqTab = await fetchTab(sheetId, 'Equity Projection');
  if (eqTab.length > 1) {
    const purchase = data.cashflow.purchasePrice;
    const totalCash = data.cashflow.upfrontCosts.totalRequired;
    data.cashflow.equityProjection = eqTab.slice(1)
      .filter((r) => r[0] && !isNaN(Number(r[0])))
      .map((r) => {
        const rental = toNum(r[1]);
        const cashflow = toNum(r[4]);
        const hasExpanded = r.length >= 10;
        return {
          year:               toNum(r[0]),
          rentalIncome:       rental,
          totalExpenses:      Math.max(0, rental - cashflow),
          annualCashflow:     cashflow,
          rentPerWeek:        Math.round(rental / 52),
          propertyValue:      toNum(r[2]),
          netEquity:          toNum(r[3]),
          netCashflow:        cashflow,
          yearlyYield:        hasExpanded ? toNum(r[5]) : (purchase ? rental / purchase : 0),
          interestPaid:       hasExpanded ? toNum(r[6]) : 0,
          principalPaid:      hasExpanded ? toNum(r[7]) : 0,
          principalRemaining: hasExpanded ? toNum(r[8]) : 0,
          cashOnCash:         hasExpanded ? toNum(r[9]) : (totalCash ? cashflow / totalCash : 0),
        };
      });
  }

  // ── SQM Rate Assessment (combined rent + sales) ───────────────────────────
  // Prefer the consolidated 'Rental ans Sales comps (sqm rates)' tab. Falls
  // back to the legacy separate tabs so older deal sheets still render.
  data.sqmRateAssessment.spreadsheetUrl = s['Rental Assessment URL'] ?? '';

  if (combined && (combined.sales.rows.length > 0 || combined.rental.rows.length > 0 ||
                   combined.sales.summary.length > 0 || combined.rental.summary.length > 0)) {
    data.sqmRateAssessment.sales = {
      summary:     combined.sales.summary,
      comparables: { headers: combined.sales.headers, rows: combined.sales.rows },
    };
    data.sqmRateAssessment.rent = {
      summary:     combined.rental.summary,
      comparables: { headers: combined.rental.headers, rows: combined.rental.rows },
    };
  } else {
    // Legacy: two separate tabs. Tolerated only for back-compat with deal
    // sheets created before the CF template was consolidated.
    if (rentalRows.length > 0) {
      const summary: { label: string; value: string }[] = [];
      const compRows: string[][] = [];
      let headers: string[] = [];
      let inComps = false;
      for (const r of rentalRows) {
        if (!inComps && r[0] && r[1] && !r[2]) {
          summary.push({ label: r[0], value: r[1] });
        } else if (!inComps && r[0] && r.length > 2) {
          headers = r;
          inComps = true;
        } else if (inComps) {
          compRows.push(r);
        }
      }
      data.sqmRateAssessment.rent = { summary, comparables: { headers, rows: compRows } };
    }
    if (salesRows.length > 0) {
      const summary: { label: string; value: string }[] = [];
      const tblRows: string[][] = [];
      let headers: string[] = [];
      let inTable = false;
      for (const r of salesRows) {
        if (!inTable && r[0] && r[1] && !r[2]) {
          summary.push({ label: r[0], value: r[1] });
        } else if (!inTable && r[0] && r.length > 2) {
          headers = r;
          inTable = true;
        } else if (inTable) {
          tblRows.push(r);
        }
      }
      data.sqmRateAssessment.sales = { summary, comparables: { headers, rows: tblRows } };
    }
  }

  // ── Lease & Tenant Insights (from Settings) ───────────────────────────────
  const tenantLabels = [
    'Tenant', 'Tenant Covenant', 'Lease Type', 'Lease Start', 'Lease Expiry',
    'WALE (yrs)', 'Rent Review', 'Option Terms', 'Outgoings Recovery',
  ];
  data.tenantLease.items = tenantLabels
    .filter((k) => s[k])
    .map((k) => ({ label: k, value: s[k] }));
  data.tenantLease.spreadsheetUrl       = s['CF Sheet URL']                ?? '';
  data.tenantLease.vacancyRate          = s['Vacancy rate (%)']            ?? '';
  data.tenantLease.vacancySource        = s['Vacancy Source']              ?? '';
  data.tenantLease.leaseDocsFolder      = s['Lease Docs Folder URL']       ?? '';
  data.tenantLease.tenantInsightsFolder = s['Tenant Insights Folder URL']  ?? '';

  // ── Location / Distances ──────────────────────────────────────────────────
  data.location.lat     = toNum(s['Latitude']);
  data.location.lng     = toNum(s['Longitude']);
  data.location.mapBbox = s['Map Bbox'] ?? '';
  if (distancesRows.length > 0) {
    const startIdx = String(distancesRows[0][0]).trim().toLowerCase() === 'place' ? 1 : 0;
    data.location.distances = distancesRows.slice(startIdx)
      .filter((r) => r[0])
      .map((r) => ({
        place:     r[0] ?? '',
        distance:  r[1] ?? '',
        driveTime: r[2] ?? '',
        address:   r[3] ?? '',
      }));
  }

  // ── Government (Infrastructure Projects tab) ──────────────────────────────
  data.government.regionName = s['Region Name'] ?? '';
  if (infraRows.length > 1) {
    data.government.projects = infraRows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        title:       r[0] ?? '',
        description: r[1] ?? '',
        bullets:     (r[2] ?? '').split('|').map((x) => x.trim()).filter(Boolean),
        sourceUrl:   r[3] ?? '',
      }));
  }

  // ── Industries ────────────────────────────────────────────────────────────
  data.population.lga           = s['LGA'] ?? '';
  data.population.lgaName       = s['LGA Display Name'] ?? '';
  data.population.benchmarkName = s['Benchmark Name'] ?? '';
  if (industriesRows.length > 1) {
    data.population.topIndustries = industriesRows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({ name: r[0] ?? '', lga: toNum(r[1]), benchmark: toNum(r[2]) }));
  }
  data.population.industryTakeaways = (s['Industry Takeaways'] ?? '')
    .split('|').map((t) => t.trim()).filter(Boolean);
  data.population.industrySources = (s['Industry Sources'] ?? '')
    .split('|')
    .map((entry) => {
      const [name, url] = entry.split('::').map((x) => x.trim());
      return { name: name ?? '', url: url ?? '' };
    })
    .filter((e) => e.name && e.url);

  // ── Suburb Profile ────────────────────────────────────────────────────────
  const suburbLabels = [
    'Commercial Vacancy Rate', 'Median Commercial Yield',
    'Rent Growth (YoY)', 'Supply Pipeline', 'Absorption Rate',
    'Median House Price', 'Median Rent',
  ];
  data.suburbProfile.summary = suburbLabels
    .filter((k) => s[k])
    .map((k) => ({ label: k, value: s[k] }));
  data.suburbProfile.reportFolderUrl = s['Suburb Report Folder URL'] ?? '';

  // ── Due Diligence (populator writes to DD tab; map into floodChecks shape) ─
  const ddFolderUrl = s['DD Folder URL'] ?? s['Google Drive folder'] ?? '';
  data.floodChecks.ddFolderUrl = ddFolderUrl;
  if (ddRows.length > 1) {
    data.floodChecks.checks = ddRows.slice(1)
      .filter((r) => r[0] && r[0] !== 'Filled by AI')
      .map((r) => ({
        label:     r[0] ?? '',
        status:    r[1] ?? '',
        folder:    r[2] ?? '',
        folderUrl: r[3] ?? '',
        imageId:   r[4] ?? '',
        fileName:  r[5] ?? '',
        type:      (r[6] as 'image' | 'pdf' | 'video' | 'link' | 'doc') ?? 'link',
      }));
  }
  data.floodChecks.planningReport = {
    label:     'Council Planning Report',
    fileId:    s['Planning Report File ID']    ?? '',
    fileName:  s['Planning Report File Name']  ?? '',
    folderUrl: s['Planning Report Folder URL'] ?? '',
  };

  // ── Drive Repo (top-level DD subfolders) ──────────────────────────────────
  data.driveRepo.folderUrl  = ddFolderUrl;
  data.driveRepo.subfolders = (data.floodChecks.checks || [])
    .filter((c) => c.folderUrl)
    .map((c) => ({ name: c.folder || c.label, url: c.folderUrl }));

  // ── Ask Claude suggested questions ────────────────────────────────────────
  data.askClaude.suggestedQuestions = (s['Suggested Questions'] ?? '')
    .split('|').map((q) => q.trim()).filter(Boolean);

  // ── About ─────────────────────────────────────────────────────────────────
  data.about.phone = s['Phone'] ?? data.about.phone;

  return data;
}
