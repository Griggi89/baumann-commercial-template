/**
 * BPI COMMERCIAL — DASHBOARD POPULATOR
 * ====================================
 * Reads the Cash FLow Calc sheet of a commercial deal and mirrors the
 * key values into the Settings tab so the Vercel dashboard can read them
 * as simple key/value pairs.
 *
 * Also stubs the AI-filled tabs (Due Diligence, Industries, Infrastructure
 * Projects, Distances) with starter data — full AI research is triggered
 * via the "BPI Commercial > Run AI Research" menu (optional, uses the
 * AI_GATEWAY_API_KEY property if set).
 *
 * Tab map (Commercial CF Template):
 *   Cash FLow Calc  (dollar values at col C rows 2..17, 10-yr table rows 18..28)
 *   Settings        (18 fields — key/value)
 *   Rental Assessment (sqm rates) — user-populated
 *   Sales Comparables               — user-populated
 *   Due Diligence                   — "Filled by AI"
 *   Industries                      — "Filled by AI"
 *   Infrastructure Projects         — "Filled by AI"
 *   Distances                       — "Filled by AI"
 */

const POPULATOR = {
  CF: {
    // Values live in column C (=3) of the Cash FLow Calc sheet.
    // Row numbers are LOOKED UP by label in column B at runtime via
    // findCFRowByLabel_() — the template has a variable number of header
    // rows, so hardcoding rows breaks the moment anyone edits the header.
    // The labels below are matched case-sensitively against col B, trimmed.
    col: 3,
    labels: {
      purchasePrice:           'Purchase price',
      lvr:                     'LVR',
      totalLoan:               'Total Loan $',
      deposit:                 'Deposit $',
      stampDuty:               'Stamp duty (if outside South Australia)',
      valuation:               'Valuation cost',
      solicitor:               'Solicitor cost',
      buildingInspection:      'Building Inspection',
      totalCashRequired:       'Total cash/equity required',
      // Outgoings model as of 2026-04-19 template rev:
      //   'Non recoverable Outgoings (Sum)' — $ flat, annual
      //   'Growth Rate of non recoverables %' — separate from rent CPI
      // Previously the template had 'Property Management Fee + 2% aux' as
      // a percent; that's been removed in favour of an explicit $ figure.
      nonRecoverableOutgoings: 'Non recoverable Outgoings',
      outgoingsGrowthRate:     'Growth Rate of non recoverables',
      year1NetRent:            'Year 1 Net Rental Income',
      netYieldCap:             'Net Yield / Cap Rate',
      yearlyReview:            'Yearly review / CPI increase',
      termOwnership:           'Term of ownership',
      loanInterestRate:        'Loan interest rate',
      netCashDebt:             '% of net cash flow used for debt reduction',
      // 10-year horizontal rows — matched by `includes` / tiered match
      // (exact > startsWith > includes) to tolerate trailing space on
      // "Rent " and multi-line labels like "Net Cash flow (rent less
      // interest - property mgmt/aux)".
      rent:                    'Rent',
      yield:                   'Yearly yield',
      interestPaid:            'Interest paid',
      minusNonRecoverables:    'Minus Non Recoverable',
      netCashflow:             'Net Cash flow',
      returnOnCash:            'Return on cash',
      principalStart:          'Principal remaining',
      principalPaid:           'Principal paid',
      remainingDebt:           'Remaining Debt',
      propertyValue:           'Property Value at beginning',
      netEquity:               'Net Equity',
      equityGainPct:           'Equity gain',
    },
  },
};

/**
 * Find a row in the Cash FLow Calc sheet by matching a label substring
 * in column B. Returns 1-based row number, or null if not found.
 *
 * Uses `includes` (case-insensitive, trimmed) — more tolerant than exact
 * match because the template has multi-line labels and trailing whitespace
 * in several cells. If a label is ambiguous (matches multiple rows),
 * returns the first match.
 */
function findCFRowByLabel_(cfSheet, labelSubstring) {
  const last = cfSheet.getLastRow();
  if (last < 1) return null;
  const colB = cfSheet.getRange(1, 2, last, 1).getValues();
  const needle = String(labelSubstring).toLowerCase().trim();

  // Prefer the MOST SPECIFIC match so generic labels like "Rent" don't hit
  // "Year 1 Net Rental Income" first, and "Net Cash flow" doesn't hit
  // "% of net cash flow used for debt reduction" first.
  // Order: exact > startsWith > includes. Returns the 1st match in the
  // best tier found.
  let exactRow = null;
  let startsRow = null;
  let includesRow = null;
  for (let i = 0; i < colB.length; i++) {
    const cell = String(colB[i][0] || '').toLowerCase().trim();
    if (!cell) continue;
    if (cell === needle && exactRow === null) exactRow = i + 1;
    else if (cell.indexOf(needle) === 0 && startsRow === null) startsRow = i + 1;
    else if (cell.indexOf(needle) !== -1 && includesRow === null) includesRow = i + 1;
  }
  return exactRow || startsRow || includesRow;
}


// ─── ENTRY: called from runPipeline ─────────────────────────────────────────

function populateCommercialDashboard_(cfSheetId) {
  const ss = SpreadsheetApp.openById(cfSheetId);
  const tabsPopulated = [];

  // 1. Mirror CF Calc values to Settings (for the Vercel dashboard)
  if (mirrorCFCalcToSettings_(ss)) tabsPopulated.push('Settings (CF mirror)');

  // 2. Seed default Distances if empty
  if (seedDistancesIfEmpty_(ss)) tabsPopulated.push('Distances');

  // 3. Seed empty Industries header if missing
  if (seedIndustriesHeader_(ss)) tabsPopulated.push('Industries');

  // 4. Seed empty Infrastructure Projects header if missing
  if (seedInfrastructureHeader_(ss)) tabsPopulated.push('Infrastructure Projects');

  // 5. If ANTHROPIC_API_KEY is set, run AI research to fill the 3 research tabs.
  //    Non-fatal — the pipeline still succeeds if this step errors.
  try {
    const aiResult = runCommercialAIResearch_(ss);
    if (aiResult && aiResult.wrote.length) {
      tabsPopulated.push('AI research: ' + aiResult.wrote.join(', '));
    }
  } catch (e) {
    Logger.log('AI research skipped: ' + e.message);
  }

  return { tabsPopulated: tabsPopulated };
}


// ─── CF CALC → SETTINGS MIRROR ──────────────────────────────────────────────

function mirrorCFCalcToSettings_(ss) {
  const cf = ss.getSheetByName('Cash FLow Calc') || ss.getSheetByName('Cash Flow Calc');
  const settings = ss.getSheetByName('Settings');
  if (!cf || !settings) return false;

  const c = POPULATOR.CF.col;
  const labels = POPULATOR.CF.labels;

  // Resolve each label to its actual row at runtime. Returns undefined if
  // the label isn't found — read() below handles that as "skip this field".
  const rowOf = (key) => findCFRowByLabel_(cf, labels[key]);
  const read  = (key) => {
    const row = rowOf(key);
    if (!row) return undefined;
    return cf.getRange(row, c).getValue();
  };

  const purchasePrice     = read('purchasePrice');
  const lvr               = read('lvr');
  const deposit           = read('deposit');
  const stampDuty         = read('stampDuty');
  const valuation         = read('valuation');
  const solicitor         = read('solicitor');
  const bnp               = read('buildingInspection');
  const totalCash         = read('totalCashRequired');
  const nonRecOutgoings   = read('nonRecoverableOutgoings');
  const outgoingsGrowth   = read('outgoingsGrowthRate');
  const year1Rent         = read('year1NetRent');
  const netYield          = read('netYieldCap');
  const review            = read('yearlyReview');
  const interestRate      = read('loanInterestRate');
  const debtReduction     = read('netCashDebt');

  // Annual Outgoings: now sourced DIRECTLY from 'Non recoverable Outgoings (Sum)'
  // as a $ figure. (Previously computed from mgmt-fee % × rent. The template
  // dropped the % model; this reads the operator's own dollar value, which
  // accounts for insurance, land tax, and anything else not recoverable
  // from the tenant.)
  const annualOutgoings = (typeof nonRecOutgoings === 'number' && nonRecOutgoings > 0)
    ? nonRecOutgoings
    : 0;

  // Fields mirrored from CF Calc (setSettingsValue_ always overwrites the
  // matched label row, so CF is the source of truth for these).
  const fields = [
    ['Purchase Price',          purchasePrice],
    ['LVR',                     lvr],
    ['Deposit',                 deposit],
    ['Stamp Duty',              stampDuty],
    ['Valuation Cost',          valuation],
    ['Solicitor Cost',          solicitor],
    ['Building and Pest',       bnp],
    ['Total Required',          totalCash],
    ['Net Annual Rent',         year1Rent],
    ['Net Yield / Cap Rate',    netYield],
    ['Rent Growth Rate',        review],
    ['Interest Rate',           interestRate],
    ['Annual Outgoings',        annualOutgoings],
    ['Expense Growth Rate',     outgoingsGrowth],
    ['Debt Reduction Pct',      debtReduction],
  ];

  for (const [label, value] of fields) {
    if (value !== '' && value !== null && value !== undefined) {
      setSettingsValue_(settings, label, value);
    }
  }

  // Auto-write a single-line expense breakdown row so the Cashflow
  // section's breakdown panel has something to render. Key uses the
  // 'Outgoing: ' prefix that fetchSheetData picks up into
  // `cashflow.expenseBreakdown`. Chris can replace with itemised rows
  // (e.g. 'Outgoing: Council rates', 'Outgoing: Insurance') by hand —
  // the populator won't overwrite those because the key differs.
  if (annualOutgoings > 0) {
    setSettingsValue_(settings, 'Outgoing: Non-recoverable outgoings', annualOutgoings);
  }

  // Defaults — written only when the Settings row is missing/empty.
  // These back the dashboard UI (e.g. the +10% Y1 uplift label).
  const settingsMap = readSettingsAsMap_(settings);
  const DEFAULTS = [
    ['Year 1 Capital Growth Rate', 0.10],                // BPI convention
    ['Capital Growth Rate',        0.08],                // BPI convention (ongoing)
    ['Expense Growth Rate',        0.03],
    ['Loan Term Years',            25],                  // commercial default
    ['Suggested Questions',
      "What's the cap rate? | What's the WALE? | What are the key risks? | How is rent reviewed?"],
  ];
  for (const [label, def] of DEFAULTS) {
    if (!settingsMap[label]) setSettingsValue_(settings, label, def);
  }

  // Commercial-only placeholders — create empty Settings rows so Chris has
  // a field to type into for every dashboard section that relies on a
  // Settings-tab field. Never overwrite a non-empty cell.
  //
  // Three groups:
  //   A. Property details — feeds the "Property Details" cards under the hero
  //   B. Lease & tenant    — feeds Executive Summary + Lease & Tenant Insights
  //   C. Suburb profile    — feeds the Suburb Profile section summary rows
  const COMMERCIAL_PLACEHOLDERS = [
    // A. Property details (featureLabels in lib/fetchSheetData.ts)
    'Property Type', 'Building Area (sqm)', 'Floor Area (sqm)', 'Land Area (sqm)',
    'Year Built', 'Zoning', 'Parking Spaces', 'Car Spaces',
    'NABERS Rating', 'Floor Count', 'Tenancy Count',
    // Listing-link keys — canonical brand-specific labels per CF Template
    // (fetchSheetData accepts these + historical aliases).
    'Hero Image URL',
    'Real Commercial Link',              // realcommercial.com.au
    'Alternative Real Estate Link',      // commercialrealestate.com.au (Domain)
    // B. Lease & tenant
    'Tenant', 'Tenant Covenant', 'Lease Type', 'Lease Start', 'Lease Expiry',
    'WALE (yrs)', 'Rent Review', 'Option Terms', 'Outgoings Recovery',
    'GST',
    'Vacancy rate (%)', 'Vacancy Source',
    // C. Suburb profile (suburbLabels in lib/fetchSheetData.ts)
    'Commercial Vacancy Rate', 'Median Commercial Yield',
    'Rent Growth (YoY)', 'Supply Pipeline', 'Absorption Rate',
  ];
  for (const label of COMMERCIAL_PLACEHOLDERS) {
    if (!(label in settingsMap)) setSettingsValue_(settings, label, '');
  }

  // Equity projection — years 1..10 laid out horizontally in CF Calc.
  // Year 1 lives in column C (=3), so year N is column (2+N).
  //
  // Writes a 10-column tab that mirrors EVERY row in the CF Calc projection:
  //   Year, Rent, Property Value, Net Equity, Net Cashflow,
  //   Yearly Yield, Interest Paid, Principal Paid, Principal Remaining, Cash on Cash
  //
  // The dashboard's fetchSheetData reads cols 0–9 if present, or falls back
  // to deriving Yearly Yield / Cash on Cash when a template is still on the
  // old 5-col schema.
  const rentRow       = findCFRowByLabel_(cf, labels.rent);
  const propRow       = findCFRowByLabel_(cf, labels.propertyValue);
  const equityRow     = findCFRowByLabel_(cf, labels.netEquity);
  const cashflowRow   = findCFRowByLabel_(cf, labels.netCashflow);
  const yieldRow      = findCFRowByLabel_(cf, labels.yield);
  const interestRow   = findCFRowByLabel_(cf, labels.interestPaid);
  const principalPaidRow      = findCFRowByLabel_(cf, labels.principalPaid);
  const principalRemainingRow = findCFRowByLabel_(cf, labels.principalStart);
  const returnOnCashRow       = findCFRowByLabel_(cf, labels.returnOnCash);

  if (rentRow && propRow && equityRow && cashflowRow) {
    const eqSheet = ss.getSheetByName('Equity Projection') || ss.insertSheet('Equity Projection');
    eqSheet.clear();
    const header = [
      'Year', 'Gross Annual Rent', 'Property Value', 'Net Equity', 'Net Cashflow',
      'Yearly Yield', 'Interest Paid', 'Principal Paid', 'Principal Remaining', 'Cash on Cash',
    ];
    eqSheet.getRange(1, 1, 1, header.length).setValues([header]);
    const read_ = (row, col) => row ? cf.getRange(row, col).getValue() : '';
    const rows = [];
    for (let y = 1; y <= 10; y++) {
      const col = 2 + y;
      rows.push([
        y,
        read_(rentRow,                col),
        read_(propRow,                col),
        read_(equityRow,              col),
        read_(cashflowRow,            col),
        read_(yieldRow,               col),
        read_(interestRow,            col),
        read_(principalPaidRow,       col),
        read_(principalRemainingRow,  col),
        read_(returnOnCashRow,        col),
      ]);
    }
    eqSheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    eqSheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
    eqSheet.setFrozenRows(1);
  } else {
    Logger.log('Equity Projection skipped — missing core label rows ' +
      JSON.stringify({ rent: rentRow, prop: propRow, equity: equityRow, cashflow: cashflowRow }));
  }

  return true;
}


// ─── SEED DEFAULT HEADERS ───────────────────────────────────────────────────

function seedDistancesIfEmpty_(ss) {
  const sheet = ss.getSheetByName('Distances');
  if (!sheet) return false;
  if (sheet.getLastRow() > 1) return false;

  const defaults = [
    ['Place', 'Distance', 'Drive Time', 'Address'],
    ['CBD', '', '', ''],
    ['Nearest Major Highway', '', '', ''],
    ['Nearest Train Station', '', '', ''],
    ['Port', '', '', ''],
    ['Airport', '', '', ''],
    ['Hospital', '', '', ''],
    ['Industrial Hub', '', '', ''],
    ['University', '', '', ''],
    ['Major Shopping Centre', '', '', ''],
  ];
  sheet.getRange(1, 1, defaults.length, 4).setValues(defaults);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  return true;
}

function seedIndustriesHeader_(ss) {
  const sheet = ss.getSheetByName('Industries');
  if (!sheet) return false;
  const h = sheet.getRange(1, 1, 1, 3).getValues()[0];
  if (String(h[0]).trim() === 'Industry') return false;
  sheet.getRange(1, 1, 1, 3).setValues([['Industry', 'LGA %', 'Benchmark %']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  return true;
}

function seedInfrastructureHeader_(ss) {
  const sheet = ss.getSheetByName('Infrastructure Projects');
  if (!sheet) return false;
  const h = sheet.getRange(1, 1, 1, 4).getValues()[0];
  if (String(h[0]).trim() === 'Title') return false;
  sheet.getRange(1, 1, 1, 4).setValues([['Title', 'Description', 'Key Points (pipe-separated)', 'Source URL']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  return true;
}


// ─── AI RESEARCH (Anthropic API via UrlFetchApp) ────────────────────────────

/**
 * Calls Claude to research a commercial property and fills three tabs:
 *   - Distances                (9 amenity categories)
 *   - Industries               (top 5 for the LGA + benchmark %)
 *   - Infrastructure Projects  (5 current projects with source URLs)
 *
 * Requires ANTHROPIC_API_KEY set in Script Properties:
 *   File → Project properties → Script properties → Add row
 *     key:   ANTHROPIC_API_KEY
 *     value: sk-ant-...
 *
 * DD tab is skipped — that's handled by 02_dd_sync.gs from Drive folder content.
 */
function runCommercialAIResearch_(ss) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    Logger.log('ANTHROPIC_API_KEY not set — skipping AI research.');
    return { wrote: [] };
  }

  const settings = ss.getSheetByName('Settings');
  if (!settings) throw new Error('Settings tab not found.');

  const settingsMap = readSettingsAsMap_(settings);
  const address     = settingsMap['Address']           || '';
  const lga         = settingsMap['LGA Display Name']  || settingsMap['LGA'] || '';
  const region      = settingsMap['Region Name']       || '';
  const benchmark   = settingsMap['Benchmark Name']    || 'Australia';

  if (!address) {
    Logger.log('Address missing in Settings — skipping AI research.');
    return { wrote: [] };
  }

  const research = callClaudeCommercialResearch_(apiKey, {
    address: address,
    lga: lga,
    region: region,
    benchmark: benchmark,
  });

  const wrote = [];

  // ── Location fields (write back to Settings if empty) ────────────────────
  if (research.location) {
    const loc = research.location;
    if (loc.lga_code && !settingsMap['LGA']) {
      setSettingsValue_(settings, 'LGA', loc.lga_code);
      wrote.push('LGA');
    }
    if (loc.lga_display_name && !settingsMap['LGA Display Name']) {
      setSettingsValue_(settings, 'LGA Display Name', loc.lga_display_name);
      wrote.push('LGA Display Name');
    }
    if (loc.region_name && !settingsMap['Region Name']) {
      setSettingsValue_(settings, 'Region Name', loc.region_name);
      wrote.push('Region Name');
    }
    if (loc.benchmark_name && !settingsMap['Benchmark Name']) {
      setSettingsValue_(settings, 'Benchmark Name', loc.benchmark_name);
      wrote.push('Benchmark Name');
    }
    if (typeof loc.latitude === 'number' && !settingsMap['Latitude']) {
      setSettingsValue_(settings, 'Latitude', loc.latitude);
    }
    if (typeof loc.longitude === 'number' && !settingsMap['Longitude']) {
      setSettingsValue_(settings, 'Longitude', loc.longitude);
    }
  }

  // ── Distances tab ────────────────────────────────────────────────────────
  if (research.distances && research.distances.length) {
    const sheet = ss.getSheetByName('Distances');
    if (sheet) {
      sheet.clear();
      const headers = ['Place', 'Distance', 'Drive Time', 'Address'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);

      const rows = research.distances.map(d => [
        d.place || '',
        d.distance_km ? d.distance_km + ' km' : '',
        d.drive_time_minutes ? d.drive_time_minutes + ' min' : '',
        d.address || '',
      ]);
      sheet.getRange(2, 1, rows.length, 4).setValues(rows);
      wrote.push('Distances');
    }
  }

  // ── Industries tab ───────────────────────────────────────────────────────
  if (research.industries && research.industries.length) {
    const sheet = ss.getSheetByName('Industries');
    if (sheet) {
      sheet.clear();
      sheet.getRange(1, 1, 1, 3).setValues([['Industry', 'LGA %', 'Benchmark %']]);
      sheet.getRange(1, 1, 1, 3)
        .setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);

      const rows = research.industries.map(i => [
        i.name || '',
        Number(i.lga_percentage) || 0,
        Number(i.benchmark_percentage) || 0,
      ]);
      sheet.getRange(2, 1, rows.length, 3).setValues(rows);
      wrote.push('Industries');
    }
  }

  // ── Infrastructure Projects tab ──────────────────────────────────────────
  if (research.infrastructure_projects && research.infrastructure_projects.length) {
    const sheet = ss.getSheetByName('Infrastructure Projects');
    if (sheet) {
      sheet.clear();
      sheet.getRange(1, 1, 1, 4).setValues([['Title', 'Description', 'Key Points (pipe-separated)', 'Source URL']]);
      sheet.getRange(1, 1, 1, 4)
        .setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);

      const rows = research.infrastructure_projects.map(p => [
        p.title || '',
        p.description || '',
        (p.key_points || []).join(' | '),
        p.source_url || '',
      ]);
      sheet.getRange(2, 1, rows.length, 4).setValues(rows);
      wrote.push('Infrastructure Projects');
    }
  }

  return { wrote: wrote };
}

/**
 * Menu-callable standalone runner — re-runs AI research on the active sheet
 * (or prompts for a CF Sheet URL if run from the Master Index).
 */
function runAIResearchFromMenu() {
  const ui = SpreadsheetApp.getUi();
  const active = SpreadsheetApp.getActiveSpreadsheet();
  // If we're on the Master Index, prompt for a CF sheet URL; otherwise run on active.
  let ss = active;
  if (active.getName().toLowerCase().indexOf('master index') >= 0 ||
      active.getSheets()[0].getName() === 'Master Index') {
    const resp = ui.prompt('Run AI Research', 'Paste the CF Sheet URL:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    const sheetId = extractSheetId_(resp.getResponseText());
    if (!sheetId) { ui.alert('Could not parse sheet ID'); return; }
    ss = SpreadsheetApp.openById(sheetId);
  }
  try {
    const result = runCommercialAIResearch_(ss);
    ui.alert('AI Research complete', 'Wrote: ' + (result.wrote.join(', ') || '(none)'), ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('AI Research failed', e.message, ui.ButtonSet.OK);
  }
}

function readSettingsAsMap_(sheet) {
  const last = sheet.getLastRow();
  if (last < 1) return {};
  const data = sheet.getRange(1, 1, last, 2).getValues();
  const map = {};
  for (const row of data) {
    const k = String(row[0]).trim();
    if (k) map[k] = String(row[1] || '').trim();
  }
  return map;
}

function callClaudeCommercialResearch_(apiKey, ctx) {
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      location: {
        type: 'object',
        additionalProperties: false,
        properties: {
          lga_code:         { type: 'string' },
          lga_display_name: { type: 'string' },
          region_name:      { type: 'string' },
          benchmark_name:   { type: 'string' },
          latitude:         { type: 'number' },
          longitude:        { type: 'number' },
        },
        required: ['lga_code', 'lga_display_name', 'region_name', 'benchmark_name', 'latitude', 'longitude'],
      },
      distances: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            place:              { type: 'string' },
            distance_km:        { type: 'string' },
            drive_time_minutes: { type: 'string' },
            address:            { type: 'string' },
          },
          required: ['place', 'distance_km', 'drive_time_minutes', 'address'],
        },
      },
      industries: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name:                 { type: 'string' },
            lga_percentage:       { type: 'number' },
            benchmark_percentage: { type: 'number' },
          },
          required: ['name', 'lga_percentage', 'benchmark_percentage'],
        },
      },
      infrastructure_projects: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title:       { type: 'string' },
            description: { type: 'string' },
            key_points:  { type: 'array', items: { type: 'string' } },
            source_url:  { type: 'string' },
          },
          required: ['title', 'description', 'key_points', 'source_url'],
        },
      },
    },
    required: ['location', 'distances', 'industries', 'infrastructure_projects'],
  };

  const prompt =
    'You are researching a commercial property investment in Australia. ' +
    'Return one JSON object matching the provided schema.\n\n' +
    'Property address: ' + ctx.address + '\n' +
    'LGA (if known): ' + (ctx.lga || '(infer from address)') + '\n' +
    'Region (if known): ' + (ctx.region || '(infer from address)') + '\n' +
    'Benchmark comparison (if set): ' + (ctx.benchmark || '(default to Australia)') + '\n\n' +
    'Requirements:\n' +
    '0. location — derived from the address:\n' +
    '   - lga_code: ABS LGA code (e.g. "LGA35740" for Moreton Bay, "LGA36250" for Rockhampton). ' +
    'Use the full ABS identifier with the LGA prefix.\n' +
    '   - lga_display_name: human-readable LGA name (e.g. "Moreton Bay", "Rockhampton").\n' +
    '   - region_name: broader economic region (e.g. "Moreton Bay", "Central Queensland", "Greater Sydney").\n' +
    '   - benchmark_name: comparison benchmark for industry stats — default to the state (e.g. ' +
    '"Queensland", "New South Wales") unless the input specified otherwise.\n' +
    '   - latitude, longitude: approximate centroid of the property address (decimal degrees).\n' +
    '1. distances — exactly 9 entries, one for each of these amenity categories in order: ' +
    'CBD, Nearest Major Highway, Nearest Train Station, Port, Airport, Hospital, ' +
    'Industrial Hub, University, Major Shopping Centre. For each: approximate driving distance in km ' +
    '(string, one decimal), approximate drive time in minutes (string, whole minutes), and the ' +
    'destination address if identifiable (else the amenity name).\n' +
    '2. industries — the top 5 industries of employment for the LGA (2021 ABS Census or most ' +
    'recent data you are confident about). Each with: name, lga_percentage (percentage of employed ' +
    'persons in that LGA working in this industry), benchmark_percentage (same industry percentage ' +
    'for the benchmark region above). Numbers only, no % sign.\n' +
    '3. infrastructure_projects — the TOP 4-5 major government / infrastructure / private ' +
    'investment projects affecting the region, RANKED BY TOTAL DOLLAR VALUE (largest first). ' +
    'Selection criteria (apply in order):\n' +
    '   (a) Forward-looking: under construction, funded, or recently announced. Prefer ongoing ' +
    '       over already-completed. Exclude projects completed more than 3 years ago unless ' +
    '       they are still the biggest drivers in the region and nothing bigger exists.\n' +
    '   (b) Material scale: generally > A$200 million total program value. If the region has ' +
    '       fewer than 4 projects of that scale, fill with the next largest — but never include ' +
    '       projects under A$50M unless the region has almost no major infrastructure.\n' +
    '   (c) Relevance to commercial real estate demand (industrial, logistics, defence, ' +
    '       energy, health, transport corridors, port/airport capacity). Cultural, sporting, ' +
    '       or tourism venues only count if the investment is ≥ A$500M and under construction.\n' +
    '   (d) Exclude "umbrella" agreements (e.g. City Deals) — pick the specific funded projects ' +
    '       inside them instead.\n' +
    '   Each project: title, 1-sentence description (mention the scale and what it enables), ' +
    '   key_points (array of 3-5 short bullets — MUST include the dollar value as the first ' +
    '   bullet, then funding source, timeline, and relevance to commercial property in the ' +
    '   region), and a source_url (authoritative — gov.au, project page, or major newspaper). ' +
    '   Only include URLs you are confident exist.\n\n' +
    'Be conservative: if you cannot verify a fact with reasonable confidence, use a placeholder ' +
    '("TBD") rather than hallucinate. Especially source_url — only include URLs you are confident exist.';

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    output_config: {
      format: { type: 'json_schema', schema: schema },
    },
    messages: [
      { role: 'user', content: prompt },
    ],
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code !== 200) {
    throw new Error('Anthropic API ' + code + ': ' + body.slice(0, 500));
  }

  const parsed = JSON.parse(body);
  const textBlock = (parsed.content || []).find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text block in Anthropic response.');

  try {
    return JSON.parse(textBlock.text);
  } catch (e) {
    throw new Error('Could not parse JSON from Anthropic response: ' + e.message +
                    ' — raw: ' + textBlock.text.slice(0, 300));
  }
}
