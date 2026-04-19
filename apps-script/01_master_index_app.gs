/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  BPI COMMERCIAL — MASTER INDEX APP                                       ║
 * ║  (bound to the "BPI COMMERCIAL - MASTER Index App" Google Sheet)         ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  3-step pipeline for spinning up a new commercial property dashboard:    ║
 * ║    1. Create DD Folder  — creates Drive folder + 9 subfolders + CF copy  ║
 * ║    2. Run Pipeline      — scans populated DD folders, fills CF tabs      ║
 * ║    3. Get Dashboard URL — returns baumannproperty.com.au/commercial/...  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * THIS FILE contains the Master Index app entry points, menu, and sidebar
 * plumbing. The DD scanner lives in 02_dd_sync.gs and the populator in
 * 03_populator.gs. All three .gs files are pasted into the same Apps Script
 * project bound to the Master Index sheet.
 */

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

const BPI_COMMERCIAL = {
  // Parent Drive folder for all commercial DD folders (one subfolder per deal)
  COMMERCIAL_DD_PARENT_FOLDER_ID: '16I7Zs4dqVZiyqPv9G_MHg85gDjsIX5TU',

  // Commercial CF Sheet Template to copy for each new deal
  CF_TEMPLATE_SHEET_ID: '1VlUOAJhNSFpMLauT3Sq2CG1ORpuBa2-8RJIoAOSy0aA',

  // Dashboard base URL (root-level slug pattern, matches residential).
  // Live custom domain as of 2026-04-19.
  DASHBOARD_BASE_URL: 'https://commercial.baumannproperty.com.au',

  // Master Index sheet columns (1-based)
  MASTER_COLS: {
    slug:       1,  // A
    sheetId:    2,  // B
    address:    3,  // C
    folderUrl:  4,  // D
    cfSheetUrl: 5,  // E
    active:     6,  // F — TRUE/FALSE
    token:      7,  // G — optional auth token
    createdAt:  8,  // H
  },

  // 9 commercial DD subfolders — created under each new property folder
  DD_SUBFOLDERS: [
    'Tenant Insights',
    'Lease Documents',
    'Rental Appraisal and Sales Comparables',
    'Suburb and Property Report',
    'Walkthrough videos',
    'Contract and Vendor Disclosure',
    'Due Diligence Checks (Easement, Public Housing, Insurance)',
    'Council Planning information',
    'Cashflow Calculation',
  ],
};


// ─── MENU / SIDEBAR ─────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BPI Commercial')
    .addItem('Deal Manager', 'showDealManager')
    .addSeparator()
    .addItem('Run AI Research (on CF sheet)', 'runAIResearchFromMenu')
    .addSeparator()
    .addItem('List Active Deals', 'listActiveDeals')
    .addItem('Generate Tokens (fill empty Token cells)', 'generateMissingTokens')
    .addItem('Ensure Master Index Headers', 'ensureMasterIndexHeaders')
    .addToUi();
}

function showDealManager() {
  // Modal dialog (front-and-center), matching the residential Deal Manager.
  // Sidebar mode felt cramped; 620×700 gives the 3-step flow room to breathe.
  const html = HtmlService.createHtmlOutputFromFile('DealManager')
    .setWidth(620)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'BPI Commercial — Deal Manager');
}


// ─── STEP 1: CREATE DEAL ────────────────────────────────────────────────────

/**
 * Called from the sidebar's "Create Deal" button.
 * address: full property address, e.g. "1/37 Yirrigan Drive Mirrabooka WA 6061"
 * Returns: { slug, folderUrl, cfSheetUrl, sheetId }
 */
function createCommercialDeal(address) {
  if (!address || !address.trim()) {
    throw new Error('Address is required.');
  }
  // Defensive trim — browser-automation and copy-from-markdown paste paths
  // can leave trailing hyphens, underscores, whitespace, or punctuation
  // on the address. Strip them before the address hits folder/sheet names,
  // the Master Index, or the Settings tab.
  address = address
    .trim()
    .replace(/[\s\-_,;]+$/g, '')  // trailing whitespace/hyphens/underscores/commas/semicolons
    .trim();

  ensureMasterIndexHeaders();

  const slug = addressToSlug_(address);

  // 1. Create the property folder under the Commercial DD parent
  const parent = DriveApp.getFolderById(BPI_COMMERCIAL.COMMERCIAL_DD_PARENT_FOLDER_ID);
  const propFolder = parent.createFolder(address);

  // 2. Create 9 subfolders inside; capture references so we can drop the
  //    CF sheet into the right one below.
  const subFolders = {};
  for (const subName of BPI_COMMERCIAL.DD_SUBFOLDERS) {
    subFolders[subName] = propFolder.createFolder(subName);
  }

  // 3. Copy the CF template INTO the 'Cashflow Calculation' subfolder so
  //    that DD slot is immediately green on the dashboard + the CF file
  //    lives where operators expect it. Fall back to the property root
  //    if the subfolder name ever drifts (defensive).
  const cfTemplate = DriveApp.getFileById(BPI_COMMERCIAL.CF_TEMPLATE_SHEET_ID);
  const cfTarget = subFolders['Cashflow Calculation'] || propFolder;
  const cfCopy = cfTemplate.makeCopy('Cash Flow Calc - ' + address, cfTarget);
  const cfSheetId = cfCopy.getId();
  const cfSheetUrl = cfCopy.getUrl();

  // 3a. Make the copy anyone-with-link viewable so the Vercel dashboard
  //     can read it via gviz. Without this Google returns a 307 login
  //     redirect and the dashboard renders empty / 500s. The property
  //     folder is also shared so Drive Repo + DD file links resolve for
  //     anyone visiting the dashboard.
  try {
    cfCopy.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    propFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Could not set sharing on CF copy / folder: ' + e.message);
  }

  // 4. Seed the CF Settings tab with address + DD folder URL + CF self-link.
  //    Storing 'CF Sheet URL' lets dashboard sections link users back to
  //    the sheet for data-entry ("Open CF Sheet" from empty states).
  try {
    const ss = SpreadsheetApp.openById(cfSheetId);
    let settings = ss.getSheetByName('Settings');
    if (settings) {
      setSettingsValue_(settings, 'Address', address);
      setSettingsValue_(settings, 'Google Drive folder', propFolder.getUrl());
      setSettingsValue_(settings, 'DD Folder URL', propFolder.getUrl());
      setSettingsValue_(settings, 'CF Sheet URL', cfSheetUrl);
      setSettingsValue_(settings, 'Last Updated', new Date().toISOString().slice(0, 10));
    }
  } catch (e) {
    Logger.log('Could not seed Settings tab: ' + e.message);
  }

  // 5. Generate a per-deal access token (URL-safe) and write the Master
  //    Index row. The token is appended to the dashboard URL as `?t=<token>`
  //    so links can be shared externally without exposing unassigned deals.
  const token = generateDealToken_();
  writeMasterIndexRow_({
    slug:       slug,
    sheetId:    cfSheetId,
    address:    address,
    folderUrl:  propFolder.getUrl(),
    cfSheetUrl: cfSheetUrl,
    active:     true,
    token:      token,
  });

  return {
    slug:       slug,
    folderUrl:  propFolder.getUrl(),
    cfSheetUrl: cfSheetUrl,
    sheetId:    cfSheetId,
    token:      token,
    dashboardUrl: BPI_COMMERCIAL.DASHBOARD_BASE_URL + '/' + slug + '?t=' + token,
  };
}

/**
 * 8-char URL-safe random token. Enough entropy to not be guessable by
 * humans; not a crypto-grade secret (Google Drive link sharing is the real
 * gate). 62^8 ≈ 2.2e14 which is fine for a single-operator business.
 */
function generateDealToken_() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

/**
 * Menu-callable: walk the Master Index and fill any empty Token cells
 * (column G) with a fresh random token. Never overwrites an existing token.
 * Run once after this change lands to back-fill pre-token deals.
 */
function generateMissingTokens() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const last = sheet.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getUi().alert('No deals in Master Index yet.');
    return;
  }
  const tokenCol = BPI_COMMERCIAL.MASTER_COLS.token;
  const range = sheet.getRange(2, tokenCol, last - 1, 1);
  const values = range.getValues();
  let filled = 0;
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0] || String(values[i][0]).trim() === '') {
      values[i][0] = generateDealToken_();
      filled++;
    }
  }
  if (filled > 0) range.setValues(values);
  SpreadsheetApp.getUi().alert(
    filled === 0
      ? 'All deals already have tokens — nothing to do.'
      : 'Filled ' + filled + ' empty token cell' + (filled === 1 ? '' : 's') + '.'
  );
}


// ─── STEP 2: RUN PIPELINE ───────────────────────────────────────────────────

/**
 * Called from the sidebar's "Run Pipeline" button.
 * cfSheetUrl: URL of the per-deal CF sheet (created in Step 1).
 * Runs DD sync (scans folders) and populator (fills AI research tabs).
 * Returns: { ddFilesFound, tabsPopulated }
 */
function runPipeline(cfSheetUrl) {
  if (!cfSheetUrl) throw new Error('CF Sheet URL is required.');
  const sheetId = extractSheetId_(cfSheetUrl);
  if (!sheetId) throw new Error('Could not extract sheet ID from: ' + cfSheetUrl);

  // 1. DD sync — scans Drive subfolders, fills Due Diligence tab
  const ddResult = syncCommercialDueDiligence_(sheetId);

  // 2. Populator — mirrors CF Calc values to Settings, fills AI research tabs
  const popResult = populateCommercialDashboard_(sheetId);

  return {
    ddSubfoldersScanned: ddResult.subfoldersScanned,
    ddFilesFound:        ddResult.filesFound,
    tabsPopulated:       popResult.tabsPopulated,
    message:             'Pipeline complete.',
  };
}


// ─── STEP 3: GET DASHBOARD URL ──────────────────────────────────────────────

/**
 * Called from the sidebar's "Get Dashboard URL" step.
 * addressOrSlug: either the full address or the slug.
 */
function getDashboardUrl(addressOrSlug) {
  const slug = addressOrSlug.includes(' ')
    ? addressToSlug_(addressOrSlug)
    : addressOrSlug.trim().toLowerCase();
  return BPI_COMMERCIAL.DASHBOARD_BASE_URL + '/' + slug;
}


// ─── MASTER INDEX HELPERS ───────────────────────────────────────────────────

function ensureMasterIndexHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheets()[0];
  if (!sheet) {
    sheet = ss.insertSheet('Master Index');
  } else if (sheet.getName() !== 'Master Index') {
    sheet.setName('Master Index');
  }

  const headers = ['Slug', 'Sheet ID', 'Address', 'Folder URL', 'CF Sheet URL', 'Active', 'Token', 'Created At'];
  const first = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaders = first.every(c => !String(c).trim());
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0F2A44')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 180);
  }
}

function writeMasterIndexRow_(row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const nextRow = sheet.getLastRow() + 1;
  const cols = BPI_COMMERCIAL.MASTER_COLS;
  sheet.getRange(nextRow, cols.slug).setValue(row.slug);
  sheet.getRange(nextRow, cols.sheetId).setValue(row.sheetId);
  sheet.getRange(nextRow, cols.address).setValue(row.address);
  sheet.getRange(nextRow, cols.folderUrl).setValue(row.folderUrl);
  sheet.getRange(nextRow, cols.cfSheetUrl).setValue(row.cfSheetUrl);
  sheet.getRange(nextRow, cols.active).setValue(row.active === false ? false : true);
  if (row.token) sheet.getRange(nextRow, cols.token).setValue(row.token);
  sheet.getRange(nextRow, cols.createdAt).setValue(new Date());
}

function listActiveDeals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const last = sheet.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getUi().alert('No deals in Master Index yet.');
    return;
  }
  const data = sheet.getRange(2, 1, last - 1, 8).getValues();
  const active = data.filter(r => r[5] === true || String(r[5]).toUpperCase() === 'TRUE');
  const lines = active.map(r => `• ${r[2]}  →  ${BPI_COMMERCIAL.DASHBOARD_BASE_URL}/${r[0]}`);
  SpreadsheetApp.getUi().alert(
    'Active Commercial Deals (' + active.length + ')',
    lines.join('\n') || '(none)',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


// ─── UTILITIES ──────────────────────────────────────────────────────────────

function addressToSlug_(address) {
  return address
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractSheetId_(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractFolderIdFromUrl_(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  let m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function setSettingsValue_(settingsSheet, fieldLabel, value) {
  const last = settingsSheet.getLastRow();
  if (last < 1) {
    settingsSheet.getRange(1, 1, 1, 2).setValues([[fieldLabel, value]]);
    return;
  }
  const data = settingsSheet.getRange(1, 1, last, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === fieldLabel) {
      settingsSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  // Not found — append
  settingsSheet.getRange(last + 1, 1, 1, 2).setValues([[fieldLabel, value]]);
}
