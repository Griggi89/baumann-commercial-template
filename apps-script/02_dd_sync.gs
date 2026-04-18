/**
 * BPI COMMERCIAL — DUE DILIGENCE FOLDER SYNC
 * ==========================================
 * Scans the 9 commercial DD subfolders in Drive and populates the
 * "Due Diligence" tab of the given deal's CF sheet.
 *
 * Called by runPipeline() in 01_master_index_app.gs.
 *
 * Commercial subfolder list (matches MASTER_INDEX_APP.DD_SUBFOLDERS):
 *   Tenant Insights
 *   Lease Documents
 *   Rental Appraisal and Sales Comparables
 *   Suburb and Property Report
 *   Walkthrough videos
 *   Contract and Vendor Disclosure
 *   Due Diligence Checks (Easement, Public Housing, Insurance)
 *   Council Planning information
 *   Cashflow Calculation
 *
 * Rules:
 *   - Only writes to empty cells (never overwrites existing data)
 *   - Adds new rows for any subfolder not yet listed
 *   - Sets Status = "Found" when the subfolder contains files, else "Pending"
 *   - Extracts text from Google Docs; records file names + URLs otherwise
 */

const DD_COMMERCIAL = {
  settingsSheet: 'Settings',
  ddSheet:       'Due Diligence',
  ddFolderField: 'DD Folder URL',

  // Column positions in the Commercial Due Diligence tab (header row from CF template:
  // "Label, Status, Folder, Folder URL, Image ID"). We extend with Type/URLs/Summary.
  cols: {
    label:     1,
    status:    2,
    folder:    3,
    folderUrl: 4,
    imageId:   5,
    fileName:  6,
    type:      7,
    fileUrls:  8,
    summary:   9,
  },

  maxExtractChars: 2000,
};


// ─── ENTRY: called from runPipeline ─────────────────────────────────────────

function syncCommercialDueDiligence_(cfSheetId) {
  const ss = SpreadsheetApp.openById(cfSheetId);

  const ddFolderUrl = getCommercialDDFolderUrl_(ss);
  if (!ddFolderUrl) {
    throw new Error('No "DD Folder URL" in Settings tab of ' + cfSheetId);
  }

  const folderId = extractFolderIdFromUrl_(ddFolderUrl);
  if (!folderId) throw new Error('Invalid DD Folder URL: ' + ddFolderUrl);

  const ddFolder = DriveApp.getFolderById(folderId);

  let ddSheet = ss.getSheetByName(DD_COMMERCIAL.ddSheet);
  if (!ddSheet) {
    ddSheet = ss.insertSheet(DD_COMMERCIAL.ddSheet);
    writeDDHeaders_(ddSheet);
  } else {
    ensureDDHeaders_(ddSheet);
  }

  const existing = buildDDExistingRowMap_(ddSheet);
  const subfolders = listCommercialSubfolders_(ddFolder);

  let newRowsAdded = 0;
  let filesFound = 0;

  for (const sub of subfolders) {
    const result = syncCommercialCategory_(ddSheet, existing, sub);
    newRowsAdded += result.newRow ? 1 : 0;
    filesFound   += result.fileCount;
  }

  // Ensure every standard subfolder has at least a row (even if Drive folder absent)
  for (const cat of BPI_COMMERCIAL.DD_SUBFOLDERS) {
    const key = cat.toLowerCase().trim();
    if (!existing[key]) {
      const newRow = ddSheet.getLastRow() + 1;
      ddSheet.getRange(newRow, DD_COMMERCIAL.cols.label).setValue(cat);
      ddSheet.getRange(newRow, DD_COMMERCIAL.cols.status).setValue('Pending');
      existing[key] = newRow;
      newRowsAdded++;
    }
  }

  return {
    subfoldersScanned: subfolders.length,
    filesFound:        filesFound,
    newRowsAdded:      newRowsAdded,
  };
}


// ─── SETTINGS / HEADER HELPERS ──────────────────────────────────────────────

function getCommercialDDFolderUrl_(ss) {
  const sheet = ss.getSheetByName(DD_COMMERCIAL.settingsSheet);
  if (!sheet) return null;
  const last = sheet.getLastRow();
  if (last < 1) return null;

  const data = sheet.getRange(1, 1, last, 2).getValues();
  for (const row of data) {
    const key = String(row[0]).trim();
    if (key === DD_COMMERCIAL.ddFolderField || key === 'Google Drive folder') {
      const v = String(row[1]).trim();
      if (v) return v;
    }
  }
  return null;
}

function writeDDHeaders_(sheet) {
  const headers = [
    'Label', 'Status', 'Folder', 'Folder URL',
    'Image ID', 'File Name', 'Type', 'File URLs', 'Summary / Extracted Content',
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#0F2A44')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

function ensureDDHeaders_(sheet) {
  const expected = ['Label', 'Status', 'Folder', 'Folder URL', 'Image ID', 'File Name', 'Type', 'File URLs', 'Summary / Extracted Content'];
  const current = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  for (let i = 0; i < expected.length; i++) {
    if (!String(current[i]).trim()) {
      sheet.getRange(1, i + 1).setValue(expected[i]);
    }
  }
  sheet.getRange(1, 1, 1, expected.length)
    .setFontWeight('bold')
    .setBackground('#0F2A44')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

function buildDDExistingRowMap_(sheet) {
  const map = {};
  const last = sheet.getLastRow();
  if (last < 2) return map;
  const labels = sheet.getRange(2, DD_COMMERCIAL.cols.label, last - 1, 1).getValues();
  for (let i = 0; i < labels.length; i++) {
    const label = String(labels[i][0]).trim().toLowerCase();
    if (label) map[label] = i + 2;
  }
  return map;
}


// ─── DRIVE SCANNING ─────────────────────────────────────────────────────────

function listCommercialSubfolders_(parentFolder) {
  const results = [];
  const it = parentFolder.getFolders();
  while (it.hasNext()) {
    const f = it.next();
    results.push({
      id:    f.getId(),
      name:  f.getName(),
      url:   f.getUrl(),
      files: listFilesInCommercialFolder_(f),
    });
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

function listFilesInCommercialFolder_(folder) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    files.push({
      id:       f.getId(),
      name:     f.getName(),
      url:      f.getUrl(),
      mimeType: f.getMimeType(),
    });
  }
  return files;
}


// ─── CATEGORY SYNC ──────────────────────────────────────────────────────────

function syncCommercialCategory_(sheet, existing, sub) {
  const result = { newRow: false, fileCount: sub.files.length };

  let rowNum = findCommercialMatchingRow_(existing, sub.name);
  if (!rowNum) {
    rowNum = sheet.getLastRow() + 1;
    existing[sub.name.toLowerCase().trim()] = rowNum;
    result.newRow = true;
  }

  const setIfEmpty = (col, value) => {
    const cell = sheet.getRange(rowNum, col);
    if (!String(cell.getValue()).trim()) cell.setValue(value);
  };

  setIfEmpty(DD_COMMERCIAL.cols.label, sub.name);
  setIfEmpty(DD_COMMERCIAL.cols.folder, sub.name);
  setIfEmpty(DD_COMMERCIAL.cols.folderUrl, sub.url);

  if (sub.files.length > 0) {
    setIfEmpty(DD_COMMERCIAL.cols.fileName, sub.files.map(f => f.name).join('\n'));
    setIfEmpty(DD_COMMERCIAL.cols.fileUrls, sub.files.map(f => f.url).join('\n'));
    setIfEmpty(DD_COMMERCIAL.cols.type,     sub.files.map(f => friendlyMimeType_(f.mimeType)).join('\n'));

    const statusCell = sheet.getRange(rowNum, DD_COMMERCIAL.cols.status);
    const cur = String(statusCell.getValue()).trim().toLowerCase();
    if (!cur || cur === 'pending') statusCell.setValue('Found');

    const summary = extractCommercialContent_(sub.files);
    setIfEmpty(DD_COMMERCIAL.cols.summary, summary);
  } else {
    setIfEmpty(DD_COMMERCIAL.cols.status, 'Pending');
  }
  return result;
}

function findCommercialMatchingRow_(existing, folderName) {
  const key = folderName.toLowerCase().trim();
  if (existing[key]) return existing[key];

  const normalise = (s) => s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[\/\-–—,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const norm = normalise(folderName);
  for (const [k, rowNum] of Object.entries(existing)) {
    const n = normalise(k);
    if (norm.includes(n) || n.includes(norm)) return rowNum;
    const w1 = new Set(norm.split(' ').filter(w => w.length > 2));
    const w2 = new Set(n.split(' ').filter(w => w.length > 2));
    const overlap = [...w1].filter(w => w2.has(w)).length;
    const minW = Math.min(w1.size, w2.size);
    if (minW > 0 && overlap / minW >= 0.6) return rowNum;
  }
  return null;
}


// ─── CONTENT EXTRACTION ─────────────────────────────────────────────────────

function extractCommercialContent_(files) {
  const parts = [];
  for (const f of files) {
    try {
      let text = null;
      if (f.mimeType === 'application/vnd.google-apps.document') {
        text = DocumentApp.openById(f.id).getBody().getText();
      } else if (f.mimeType === 'application/pdf') {
        text = extractCommercialPdf_(f.id);
      } else if (f.mimeType === 'application/vnd.google-apps.spreadsheet') {
        text = '[Google Sheet — open to view]';
      } else if (f.mimeType.startsWith('image/')) {
        text = '[Image file]';
      } else if (f.mimeType.startsWith('video/')) {
        text = '[Video file — walkthrough]';
      } else if (
        f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        f.mimeType === 'application/msword'
      ) {
        text = extractCommercialWord_(f.id);
      }
      if (text && text.trim()) {
        const truncated = text.trim().substring(0, DD_COMMERCIAL.maxExtractChars);
        const label = (files.length > 1) ? '── ' + f.name + ' ──\n' : '';
        parts.push(label + truncated);
      }
    } catch (e) {
      parts.push('── ' + f.name + ' ── [Error: ' + e.message + ']');
    }
  }
  return parts.join('\n\n');
}

function extractCommercialPdf_(fileId) {
  try {
    const blob = DriveApp.getFileById(fileId).getBlob();
    const resource = { title: 'tmp_ocr_' + fileId, mimeType: 'application/vnd.google-apps.document' };
    const ocrFile = Drive.Files.insert(resource, blob, { ocr: true, ocrLanguage: 'en' });
    const text = DocumentApp.openById(ocrFile.id).getBody().getText();
    DriveApp.getFileById(ocrFile.id).setTrashed(true);
    return text;
  } catch (e) {
    return '[PDF — OCR failed: ' + e.message + ']';
  }
}

function extractCommercialWord_(fileId) {
  try {
    const blob = DriveApp.getFileById(fileId).getBlob();
    const resource = { title: 'tmp_word_' + fileId, mimeType: 'application/vnd.google-apps.document' };
    const conv = Drive.Files.insert(resource, blob, { convert: true });
    const text = DocumentApp.openById(conv.id).getBody().getText();
    DriveApp.getFileById(conv.id).setTrashed(true);
    return text;
  } catch (e) {
    return '[Word doc — conversion failed: ' + e.message + ']';
  }
}

function friendlyMimeType_(mt) {
  const map = {
    'application/pdf':                                                               'PDF',
    'application/vnd.google-apps.document':                                          'Google Doc',
    'application/vnd.google-apps.spreadsheet':                                       'Google Sheet',
    'application/vnd.google-apps.presentation':                                      'Google Slides',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':       'Word Doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':             'Excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':     'PowerPoint',
    'application/msword':                                                            'Word Doc',
    'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/gif': 'GIF',
    'video/mp4':  'MP4 Video', 'video/quicktime': 'MOV Video',
    'text/plain': 'Text', 'text/csv': 'CSV',
  };
  return map[mt] || mt;
}
