// ─────────────────────────────────────────────────────────────────────────────
// Master Properties List — driven by a Google Sheet index
//
// Instead of hardcoding properties in code, the dashboard reads from a
// "Master Index" Google Sheet. Each row = one deal with columns:
//   Slug | Sheet ID | Address | Active
//
// Adding a new deal = adding a row to the index sheet. Zero code changes.
// The populate script auto-registers new deals in this index.
// ─────────────────────────────────────────────────────────────────────────────

export interface PropertyEntry {
  /** URL slug, e.g. "90-harbourne-st-koongal" */
  slug: string;
  /** Google Sheet ID for this property (reduced format v2) */
  sheetId: string;
  /** Full property address (for display) */
  address: string;
  /** Whether to include in the build */
  active: boolean;
  /** Short access token — URL must include ?t=<token> to view */
  token: string;
}

/**
 * Commercial Master Index Sheet ID.
 * Columns: Slug | Sheet ID | Address | Folder URL | CF Sheet URL | Active | Token | Created At
 * First row is headers. Set COMMERCIAL_MASTER_INDEX_SHEET_ID in Vercel env.
 */
const MASTER_INDEX_SHEET_ID =
  process.env.COMMERCIAL_MASTER_INDEX_SHEET_ID ||
  process.env.MASTER_INDEX_SHEET_ID ||
  '';

/** Parse a CSV string into a 2D array */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  // Last row
  row.push(current.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

/** Cached properties list (avoids refetching within a single build/request) */
let _cache: PropertyEntry[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Fetch the property list from the Master Index Google Sheet.
 * Falls back to a hardcoded entry if the fetch fails.
 */
export async function fetchProperties(): Promise<PropertyEntry[]> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;

  if (!MASTER_INDEX_SHEET_ID) {
    console.warn('[properties] COMMERCIAL_MASTER_INDEX_SHEET_ID env var not set — returning empty list');
    return [];
  }

  try {
    // &headers=1 required — without it, gviz serves a stale cached CSV.
    // Commercial Master Index tab name is "Master Index" (created by our Apps Script).
    const url = `https://docs.google.com/spreadsheets/d/${MASTER_INDEX_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Master%20Index&headers=1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Master Index fetch failed: ${res.status}`);
    const rows = parseCSV(await res.text());

    // Skip header row. Columns: Slug | SheetId | Address | FolderUrl | CFSheetUrl | Active | Token | CreatedAt
    const properties: PropertyEntry[] = [];
    for (let i = 1; i < rows.length; i++) {
      const [slug, sheetId, address, , , active, token] = rows[i];
      if (!slug || !sheetId) continue;
      properties.push({
        slug: slug.trim(),
        sheetId: sheetId.trim(),
        // Defensive trim — legacy Master Index rows created before the
        // Apps Script fix (PR #2) carried trailing "--" on the address
        // (input-path artefact). Strip any trailing whitespace/hyphens/
        // underscores/commas/semicolons so the dashboard title and metadata
        // render cleanly.
        address: (address || '').trim().replace(/[\s\-_,;]+$/g, '').trim(),
        active: (active || '').trim().toUpperCase() !== 'FALSE',
        token: (token || '').trim(),
      });
    }

    _cache = properties;
    _cacheTime = now;
    return properties;
  } catch (err) {
    console.error('[properties] Failed to fetch commercial master index:', err);
    return [];
  }
}

/** Returns only active properties */
export async function getActiveProperties(): Promise<PropertyEntry[]> {
  const all = await fetchProperties();
  return all.filter((p) => p.active);
}

/** Look up a property by slug */
export async function getPropertyBySlug(slug: string): Promise<PropertyEntry | undefined> {
  const all = await fetchProperties();
  return all.find((p) => p.slug === slug && p.active);
}
