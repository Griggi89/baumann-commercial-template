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
  // Cash FLow Calc cell positions (column C = 3, 1-based rows)
  CF: {
    col:               3,
    purchasePrice:     2,
    lvr:               3,
    totalLoan:         4,
    deposit:           5,
    stampDuty:         6,
    valuation:         7,
    solicitor:         8,
    buildingInspection: 9,
    totalCashRequired: 10,
    mgmtFee:           11,
    year1NetRent:      12,
    netYieldCap:       13,
    yearlyReview:      14,
    termOwnership:     15,
    loanInterestRate:  16,
    netCashDebt:       17,
    // Horizontal 10-yr table:
    yearRow:           18, // RENT label in col B (col A), year values across col C..L
    rent:              18,
    yield:             19,
    interestPaid:      20,
    netCashflow:       21,
    returnOnCash:      22,
    principalStart:    23,
    principalPaid:     24,
    remainingDebt:     25,
    propertyValue:     26,
    netEquity:         27,
    equityGainPct:     28,
  },
};


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
  const read = (row) => cf.getRange(row, c).getValue();

  const purchasePrice = read(POPULATOR.CF.purchasePrice);
  const lvr           = read(POPULATOR.CF.lvr);
  const deposit       = read(POPULATOR.CF.deposit);
  const stampDuty     = read(POPULATOR.CF.stampDuty);
  const valuation     = read(POPULATOR.CF.valuation);
  const solicitor     = read(POPULATOR.CF.solicitor);
  const bnp           = read(POPULATOR.CF.buildingInspection);
  const totalCash     = read(POPULATOR.CF.totalCashRequired);
  const mgmtFee       = read(POPULATOR.CF.mgmtFee);
  const year1Rent     = read(POPULATOR.CF.year1NetRent);
  const netYield      = read(POPULATOR.CF.netYieldCap);
  const review        = read(POPULATOR.CF.yearlyReview);
  const interestRate  = read(POPULATOR.CF.loanInterestRate);

  const fields = [
    ['Purchase Price',        purchasePrice],
    ['LVR',                   lvr],
    ['Deposit',               deposit],
    ['Stamp Duty',            stampDuty],
    ['Valuation Cost',        valuation],
    ['Solicitor Cost',        solicitor],
    ['Building and Pest',     bnp],
    ['Total Required',        totalCash],
    ['Property Management Fee', mgmtFee],
    ['Net Annual Rent',       year1Rent],
    ['Net Yield / Cap Rate',  netYield],
    ['Rent Growth Rate',      review],
    ['Interest Rate',         interestRate],
    ['Loan Term Years',       30],
  ];

  for (const [label, value] of fields) {
    if (value !== '' && value !== null && value !== undefined) {
      setSettingsValue_(settings, label, value);
    }
  }

  // Equity projection: years 1..11 horizontal in CF Calc, rows 18..28, cols C..M (3..13)
  const eqSheet = ss.getSheetByName('Equity Projection') || ss.insertSheet('Equity Projection');
  eqSheet.clear();
  eqSheet.getRange(1, 1, 1, 5).setValues([['Year', 'Gross Annual Rent', 'Property Value', 'Net Equity', 'Net Cashflow']]);
  const rows = [];
  for (let y = 1; y <= 10; y++) {
    const col = 2 + y; // C=3 is year 1
    const rent    = cf.getRange(POPULATOR.CF.rent,          col).getValue();
    const propVal = cf.getRange(POPULATOR.CF.propertyValue, col).getValue();
    const equity  = cf.getRange(POPULATOR.CF.netEquity,     col).getValue();
    const cashflow = cf.getRange(POPULATOR.CF.netCashflow,  col).getValue();
    rows.push([y, rent, propVal, equity, cashflow]);
  }
  eqSheet.getRange(2, 1, rows.length, 5).setValues(rows);
  eqSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0F2A44').setFontColor('#FFFFFF');
  eqSheet.setFrozenRows(1);

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
    '3. infrastructure_projects — 5 current or recently-announced government / infrastructure ' +
    'projects affecting the region (federal, state, or LGA). Each with: title, 1-sentence ' +
    'description, key_points (array of 2-4 short bullets e.g. funding, dates, impact), and a ' +
    'source_url (an authoritative source — gov.au, newspaper, project page).\n\n' +
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
