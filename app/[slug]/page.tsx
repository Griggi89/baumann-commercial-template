// ---------------------------------------------------------------------------
// /[slug] - Server Component (Static Generation + ISR)
//
// Root-level dynamic route matching the residential URL convention:
//   https://commercial.baumannproperty.com.au/<slug>?t=<token>
//
// At build time, Next.js calls generateStaticParams() which fetches the
// Master Index Sheet to get all property slugs. Each page is pre-rendered
// by fetching that property's Deal Sheet data server-side.
//
// New properties added to the Master Index Sheet appear automatically
// after ISR revalidation (60s) — no code changes or redeploy needed.
//
// Legacy /deals/<slug> paths are permanently redirected here via
// next.config.ts.
// ---------------------------------------------------------------------------

import { notFound } from 'next/navigation';
import { getActiveProperties, getPropertyBySlug } from '@/lib/properties';
import { fetchSheetData } from '@/lib/fetchSheetData';
import DashboardClient from './DashboardClient';

// Re-validate every 60 seconds (ISR) so sheet edits appear without full redeploy
export const revalidate = 60;

// Allow pages not in generateStaticParams to be rendered on-demand
export const dynamicParams = true;

/** Tell Next.js which slugs to pre-render at build time */
export async function generateStaticParams() {
  const properties = await getActiveProperties();
  return properties.map((p) => ({ slug: p.slug }));
}

/** Generate metadata per property */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: 'Property Not Found' };
  return {
    title: `${property.address} | Baumann Property Dashboard`,
    description: `Investment dashboard for ${property.address}`,
  };
}

/** Server Component - fetches sheet data at build time, passes to client */
export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  // Token validation — if the deal has a token set, require ?t=<token>
  if (property.token) {
    const provided = typeof query.t === 'string' ? query.t : '';
    if (provided !== property.token) {
      notFound();
    }
  }

  // Fetch all tabs from this property's Google Sheet (server-side, at build time)
  const data = await fetchSheetData(property.sheetId);

  return <DashboardClient initialData={data} />;
}
