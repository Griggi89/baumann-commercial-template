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

// Money values often arrive from CF Calc formulas with trailing floating-
// point dust (e.g. 2166666.667 instead of 2166667). Round to whole dollars
// at the fetch layer so every section renders a clean integer without
// needing to think about Math.round in each component.
function toMoney(s: string | number | undefined | null): number {
  return Math.round(toNum(s));
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
 * Coerce a percentage-like string to a decimal (0.07 for "7%", 0.0618 for "6.18%").
 * If the value has no % sign it's treated as already-decimal (0.07 stays 0.07).
 * Values without a % sign that look like percentages (>1) are deliberately NOT
 * auto-scaled — keeps the behaviour predictable when a formula returns a raw
 * decimal vs. a number format shows "7%".
 */
function toPct(s: string | number | undefined | null): number {
  if (typeof s === 'number') return isFinite(s) ? s : 0;
  const raw = (s ?? '').toString();
  if (!raw.trim()) return 0;
  const n = toNum(raw);
  return /%/.test(raw) ? n / 100 : n;
}

// ── CF Calc direct readers ────────────────────────────────────────────────
// As of 2026-04-19, the commercial dashboard reads cashflow inputs + the
// 10-yr projection directly from the Cash Flow Calc tab, not the Settings
// mirror. Reason: CL1 is deleting the Settings mirror block + the separate
// Equity Projection tab on the CF template, so the dashboard needs to
// source those numbers from their canonical home.
//
// 36 Allen reference layout (merged col A, labels in col B, values in col C
// for single-value inputs; projection rows 19+ carry years 1-10 across
// cols C..L):
//   Row 2  Purchase price
//   Row 3  LVR
//   Row 4  Total Loan $
//   Row 5  Deposit $
//   Row 6  Stamp duty
//   Row 7  Valuation cost
//   Row 8  Solicitor cost
//   Row 9  Building Inspection
//   Row 10 Total cash/equity required
//   Row 11 Year 1 Net Rental Income
//   Row 12 Non recoverable Outgoings (Sum)
//   Row 13 Growth Rate of non recoverables %
//   Row 14 Net Yield / Cap Rate
//   Row 15 Yearly review / CPI increase
//   Row 16 Loan interest rate
//   Row 17 % of net cash flow used for debt reduction
//   Row 19 Rent
//   Row 20 Yearly yield
//   Row 21 Interest paid
//   Row 22 Minus Non Recoverable outgoings
//   Row 23 Net Cash flow (rent less interest - property mgmt/aux)
//   Row 24 Return on cash (cash on cash)
//   Row 25 Principal remaining (start of year)
//   Row 26 Principal paid
//   Row 27 Remaining Debt
//   Row 28 Property Value at beginning of year
//   Row 29 Net Equity (incl. closing cost)
//   Row 30 Equity gain %

function normalizeLabel(s: string | undefined | null): string {
  return (s ?? '')
    .toString()
    .toLowerCase()
    .replace(/[()%$,:]/g, '')
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Find a CF Calc row whose first non-empty cell (col A or col B) matches any needle as a substring. */
function findCFRow(rows: string[][], ...needles: string[]): string[] | null {
  const normed = needles.map(normalizeLabel).filter(Boolean);
  if (normed.length === 0) return null;
  for (const r of rows) {
    const labelA = normalizeLabel(r[0]);
    const labelB = normalizeLabel(r[1]);
    const label = labelA || labelB;
    if (!label) continue;
    if (normed.some((n) => label.includes(n))) return r;
  }
  return null;
}

/** Single-value input: first non-empty cell from col C (index 2) onward. */
function cfValue(rows: string[][], ...needles: string[]): string {
  const row = findCFRow(rows, ...needles);
  if (!row) return '';
  for (let i = 2; i < row.length; i++) {
    const v = (row[i] ?? '').trim();
    if (v) return v;
  }
  return '';
}

/**
 * 10-yr projection: years 1-10 in cols C..L (indices 2..11). Trailing cols
 * may hold summary / average values; we only return the first 10.
 *
 * Disambiguation: labels like "rent" and "net cash flow" appear on BOTH
 * input rows (single value in col C) and projection rows (10 values in
 * cols C..L). findCFRow returns the first match, which for projection
 * lookups bites us (e.g. row 11 "Year 1 Net Rental Income" beats row 19
 * "Rent"). So here we require the matched row to carry ≥ 3 filled year
 * cells — true for projection rows, false for input rows.
 */
function cfYearlyValues(rows: string[][], ...needles: string[]): string[] {
  const normed = needles.map(normalizeLabel).filter(Boolean);
  if (normed.length === 0) return [];
  for (const r of rows) {
    const labelA = normalizeLabel(r[0]);
    const labelB = normalizeLabel(r[1]);
    const label = labelA || labelB;
    if (!label) continue;
    if (!normed.some((n) => label.includes(n))) continue;
    const years = r.slice(2, 12).map((c) => (c ?? '').toString());
    const filled = years.filter((c) => c.trim() !== '').length;
    if (filled < 3) continue;
    return years;
  }
  return [];
}

/**
 * Parse the combined 'Rental ans Sales comps (sqm rates)' tab into two halves.
 *
 * Real-world layout (36 Allen CF, after merged-col-A collapse):
 *   Row:  ["Sales Comparable", "Address", "Sold Date", "Sold Price", "Sqm", "$/sqm"]
 *   Row:  ["",  "4 Kalina Court ...",  "08 Aug 2025", "615000", "3604", "170.64"]
 *   ...
 *   Row:  ["", "", "", "", "", "245.40"]                    ← average (value-only)
 *   Row:  ["Rent Comparable", "Address"]                    ← rent marker (partial headers)
 *   Row:  ["", "11 Kunara Cres ...", "", "36000", "929", "38.75"]
 *   ...
 *
 * Tolerances:
 *   - Marker row may inline the column headers (merged col A + headers in B+).
 *   - "Average per sqm" row may have no label at all — just a trailing number.
 *   - Rent section may not include a full header row; fall back to defaults.
 */
function parseCombinedRentSales(rows: string[][]): {
  sales:  { headers: string[]; rows: string[][]; summary: { label: string; value: string }[] };
  rental: { headers: string[]; rows: string[][]; summary: { label: string; value: string }[] };
} {
  const sales  = { headers: [] as string[], rows: [] as string[][], summary: [] as { label: string; value: string }[] };
  const rental = { headers: [] as string[], rows: [] as string[][], summary: [] as { label: string; value: string }[] };

  const DEFAULT_SALES_HEADERS  = ['Address', 'Sold Date',  'Sold Price',  'Sqm',  '$ per sqm'];
  const DEFAULT_RENTAL_HEADERS = ['Address', 'Lease Date', '$ Lease / yr', 'Sqm', '$ per sqm'];

  // Trim leading & trailing empty cells (merged col A on 36 Allen produces
  // stray empty leading cells in data rows).
  function trim(r: string[]): string[] {
    let start = 0, end = r.length;
    while (start < end && (!r[start] || r[start].trim() === '')) start++;
    while (end > start && (!r[end - 1] || r[end - 1].trim() === '')) end--;
    return r.slice(start, end);
  }
  const isNumericLike = (s: string) =>
    s !== '' && !isNaN(Number(String(s).replace(/[$,%\s]/g, '').replace(/[()]/g, '')));

  let section: 'sales' | 'rental' | null = null;
  let gotHeaders = false;

  for (const r of rows) {
    const joined = r.map((c) => (c ?? '')).join(' | ').toLowerCase();
    const isSalesMarker = /\bsales\s*comparable/.test(joined);
    const isRentMarker  = /\brent\s*comparable/.test(joined);

    if (isSalesMarker || isRentMarker) {
      section = isSalesMarker ? 'sales' : 'rental';
      gotHeaders = false;

      // Inline headers on the marker row? Capture everything except the
      // marker text itself. Only keep if we have ≥ 2 usable labels.
      const rest = r
        .map((c) => (c ?? '').trim())
        .filter((c) => c && !/\b(sales|rent)\s*comparable/i.test(c));
      if (rest.length >= 2) {
        (section === 'sales' ? sales : rental).headers = rest;
        gotHeaders = true;
      }
      continue;
    }

    if (!section) continue;
    const target = section === 'sales' ? sales : rental;

    // Average summary row — label may be anywhere, or absent entirely.
    const avgCell = r.find((c) => /average/i.test(c ?? ''));
    if (avgCell) {
      const val = [...r]
        .reverse()
        .find((c) => c && c.trim() !== '' && !/average/i.test(c)) ?? '';
      target.summary.push({ label: avgCell.trim(), value: val });
      continue;
    }

    // Value-only summary row: a single numeric cell (36 Allen case — the
    // "Average per sqm" text didn't survive the gviz roundtrip, only the
    // number did).
    const trimmed = trim(r);
    if (trimmed.length === 1 && isNumericLike(trimmed[0])) {
      target.summary.push({ label: 'Average per sqm', value: trimmed[0] });
      continue;
    }

    // First non-empty row after a section marker = headers (fallback when
    // the marker row didn't include them inline).
    if (!gotHeaders) {
      // Guard: if the first non-marker row already looks like data (money,
      // dates, addresses with commas), use default headers instead of
      // stealing the data row.
      const looksLikeData = trimmed.length >= 3 && trimmed.some((c) => isNumericLike(c));
      if (looksLikeData) {
        target.headers = section === 'sales' ? DEFAULT_SALES_HEADERS : DEFAULT_RENTAL_HEADERS;
        gotHeaders = true;
        if (trimmed.length > 0) target.rows.push(trimmed);
        continue;
      }
      target.headers = r.filter((c) => c && c.trim() !== '');
      gotHeaders = true;
      continue;
    }

    // Data row. Trim leading/trailing blanks so columns align with headers.
    if (trimmed.length > 0) {
      target.rows.push(trimmed);
    }
  }

  // Final safety net — if a section has rows but no headers (shouldn't
  // happen after the above but deal sheets are chaotic), apply defaults.
  if (sales.rows.length  > 0 && sales.headers.length  === 0) sales.headers  = DEFAULT_SALES_HEADERS;
  if (rental.rows.length > 0 && rental.headers.length === 0) rental.headers = DEFAULT_RENTAL_HEADERS;

  return { sales, rental };
}

/**
 * Does a fetched CSV actually look like the SQM Rate Assessment tab, or is
 * it gviz's silent fallback to the default sheet (Cash FLow Calc) because
 * the named tab doesn't exist?
 */
function looksLikeSqmData(rows: string[][]): boolean {
  return rows.some((r) =>
    r.some((c) => /sales\s*comparable|rent\s*comparable/i.test(c ?? ''))
  );
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
  // gviz silently returns the default sheet when a named tab doesn't exist.
  // Validate the fetched rows actually contain SQM markers before trusting
  // them; otherwise fall through to the legacy tab name (and if neither
  // looks right, treat as empty).
  const combinedRows = looksLikeSqmData(sqmNewRows)
    ? sqmNewRows
    : looksLikeSqmData(sqmLegacyRows)
      ? sqmLegacyRows
      : [];

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

  // ── Cashflow (CF Calc is source of truth; Settings is soft fallback) ────
  // Prefer direct read from Cash Flow Calc. Falls back to Settings keys for
  // legacy deal sheets that still carry the mirror (pre-CL1 cleanup).
  data.cashflow.purchasePrice      = toNum(cfValue(cashflowRows, 'purchase price'))
                                     || toNum(s['Purchase Price']);
  data.cashflow.lvr                = toPct(cfValue(cashflowRows, 'lvr'))
                                     || toNum(s['LVR']);
  data.cashflow.interestRate       = toPct(cfValue(cashflowRows, 'loan interest rate', 'interest rate'))
                                     || toNum(s['Interest Rate']);
  data.cashflow.loanTermYears      = toNum(s['Loan Term Years']) || 30;
  data.cashflow.annualRent         = toNum(cfValue(cashflowRows, 'year 1 net rental income', 'net rental income'))
                                     || toNum(s['Net Annual Rent']) || toNum(s['Annual Rent']);
  // Rent + capital both escalate off CPI per the commercial CF Calc model
  // (triple-net lease, CPI review clause). If the sheet ever separates
  // them, swap these reads to their own labels.
  data.cashflow.rentGrowthRate     = toPct(cfValue(cashflowRows, 'yearly review cpi', 'cpi increase', 'rent growth'))
                                     || toNum(s['Rent Growth Rate']);
  data.cashflow.capitalGrowthRate  = toPct(cfValue(cashflowRows, 'yearly review cpi', 'cpi increase', 'capital growth'))
                                     || toNum(s['Capital Growth Rate']);
  data.cashflow.year1CapitalGrowthRate = toNum(s['Year 1 Capital Growth Rate']);
  data.cashflow.expenseGrowthRate  = toPct(cfValue(cashflowRows, 'growth rate of non recoverables', 'expense growth'))
                                     || toNum(s['Expense Growth Rate']);
  data.cashflow.annualExpenses     = toNum(cfValue(cashflowRows, 'non recoverable outgoings sum', 'non recoverable outgoings', 'annual outgoings'))
                                     || toNum(s['Annual Outgoings']) || toNum(s['Annual Expenses']);
  // Debt reduction: CF Calc stores as "100%" (percent), Settings as 1.
  data.cashflow.debtReductionPct   = toPct(cfValue(cashflowRows, 'net cash flow used for debt reduction', 'debt reduction'))
                                     || toNum(s['Debt Reduction Pct']) || toNum(s['% Debt Reduction']) || 1;

  data.cashflow.upfrontCosts = {
    deposit:           toMoney(cfValue(cashflowRows, 'deposit'))            || toNum(s['Deposit']),
    stampDuty:         toMoney(cfValue(cashflowRows, 'stamp duty'))         || toNum(s['Stamp Duty']),
    gst:               toNum(s['GST']),  // no CF Calc row in 36 Allen layout
    conveyancing:      toMoney(cfValue(cashflowRows, 'solicitor cost', 'conveyancing'))
                       || toNum(s['Conveyancing']) || toNum(s['Solicitor Cost']),
    buildingAndPest:   toMoney(cfValue(cashflowRows, 'building inspection', 'building and pest'))
                       || toNum(s['Building and Pest']) || toNum(s['Building Inspection']),
    valuation:         toMoney(cfValue(cashflowRows, 'valuation cost', 'valuation'))
                       || toNum(s['Valuation']),
    buildingInsurance: toNum(s['Building Insurance']),
    titleInsurance:    toNum(s['Title Insurance']),
    totalRequired:     toMoney(cfValue(cashflowRows, 'total cash equity required', 'total cash/equity required', 'total required'))
                       || toNum(s['Total Required']),
  };

  data.cashflow.expenseBreakdown = Object.entries(s)
    .filter(([k]) => k.startsWith('Outgoing: ') || k.startsWith('Expense: '))
    .map(([k, v]) => ({ label: k.replace(/^(Outgoing: |Expense: )/, ''), annual: toNum(v) }));

  // ── 10-yr projection (CF Calc is source of truth) ──────────────────────
  // Read directly from Cash Flow Calc rows 19-30 (Rent / Yearly yield /
  // Interest paid / Non-recoverable outgoings / Net Cash flow / Cash on
  // cash / Principal remaining / Principal paid / Property value / Net
  // equity). Falls back to the legacy "Equity Projection" tab for deal
  // sheets that still have it (pre-CL1 cleanup).
  const rentYr          = cfYearlyValues(cashflowRows, 'rent');
  const yieldYr         = cfYearlyValues(cashflowRows, 'yearly yield');
  // Label on 36 Allen (canonical template) is "Interest due". Older deal
  // sheets written by the populator's Equity Projection tab used "Interest
  // Paid". Accept both. Input row "Loan interest rate" is excluded by the
  // ≥3-filled-year-cells guard inside cfYearlyValues.
  const interestYr      = cfYearlyValues(cashflowRows, 'interest due', 'interest paid');
  const nonRecYr        = cfYearlyValues(cashflowRows, 'minus non recoverable outgoings', 'non recoverable outgoings');
  const netCashflowYr   = cfYearlyValues(cashflowRows, 'net cash flow');
  const cashOnCashYr    = cfYearlyValues(cashflowRows, 'return on cash', 'cash on cash');
  const principalRemYr  = cfYearlyValues(cashflowRows, 'principal remaining');
  const principalPaidYr = cfYearlyValues(cashflowRows, 'principal paid');
  const propValueYr     = cfYearlyValues(cashflowRows, 'property value at beginning of year', 'property value');
  const netEquityYr     = cfYearlyValues(cashflowRows, 'net equity');

  const fromCFCalc = rentYr.length > 0 || interestYr.length > 0;
  if (fromCFCalc) {
    const yearCount = Math.min(10, Math.max(
      rentYr.length, interestYr.length, netCashflowYr.length, propValueYr.length,
    ));
    const projection = [];
    for (let i = 0; i < yearCount; i++) {
      const rental    = toMoney(rentYr[i]);
      const cashflow  = toMoney(netCashflowYr[i]);
      const interest  = toMoney(interestYr[i]);
      const outgoings = toMoney(nonRecYr[i]);
      projection.push({
        year:               i + 1,
        rentalIncome:       rental,
        // totalExpenses matches the chart header "Total expenses incl. interest":
        // interest + non-recoverable outgoings. Stored separately as
        // interestPaid for the amortization table.
        totalExpenses:      interest + outgoings,
        annualCashflow:     cashflow,
        rentPerWeek:        rental ? Math.round(rental / 52) : 0,
        propertyValue:      toMoney(propValueYr[i]),
        netEquity:          toMoney(netEquityYr[i]),
        netCashflow:        cashflow,
        yearlyYield:        toPct(yieldYr[i]),
        interestPaid:       interest,
        principalPaid:      toMoney(principalPaidYr[i]),
        principalRemaining: toMoney(principalRemYr[i]),
        cashOnCash:         toPct(cashOnCashYr[i]),
      });
    }
    data.cashflow.equityProjection = projection;
  } else {
    // Legacy path: some deal sheets still carry the populator-written
    // "Equity Projection" tab. Kept as a soft fallback during rollout;
    // can be deleted once no deals carry it (probably a week out).
    // Schema: [Year, Rent, Property Value, Net Equity, Net Cashflow,
    //         Yearly Yield, Interest Paid, Principal Paid,
    //         Principal Remaining, Cash on Cash].
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
