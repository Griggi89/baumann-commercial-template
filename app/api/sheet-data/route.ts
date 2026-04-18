// ─────────────────────────────────────────────────────────────────────────────
// API Route: /api/sheet-data
// Fetches property data from a Google Sheet and returns it as JSON.
// The sheet ID is read from the GOOGLE_SHEET_ID environment variable.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/fetchSheetData';
import { defaultPropertyData } from '@/lib/propertyData';

// Cache the result for 60 seconds to avoid hammering Google Sheets
let cachedData: { data: typeof defaultPropertyData; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    // No sheet configured — return defaults (blank canvas)
    return NextResponse.json(defaultPropertyData, { status: 200 });
  }

  // Return cached data if fresh
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.data);
  }

  try {
    const data = await fetchSheetData(sheetId);
    cachedData = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error('[sheet-data] Error fetching sheet:', err);
    return NextResponse.json(defaultPropertyData, { status: 200 });
  }
}
