// ─────────────────────────────────────────────────────────────────────────────
// API Route: /api/revalidate
// On-demand ISR revalidation endpoint.
// Called by the finalize script (04_Finalize.gs) after adding a new deal
// to the Master Index Sheet.
//
// Query params:
//   path  — the path to revalidate, e.g. /deals/18-sheoke-grove-churchill-vic-3842
//   token — must match REVALIDATE_TOKEN env var
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const path = request.nextUrl.searchParams.get('path');

  // Validate token
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path, now: Date.now() });
}
