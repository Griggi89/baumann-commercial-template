'use client';

// Executive Summary — the "at a glance" block commercial investors want
// first: cap rate, WALE, net rent, price, tenant covenant, lease terms.
// Sits between Property Details and Cashflow in the dashboard.

import { usePropertyData } from '@/lib/PropertyDataContext';

function findItem(items: { label: string; value: string }[], label: string): string | undefined {
  const hit = items.find((i) => i.label === label);
  return hit?.value;
}

function fmtMoney(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1_000)     return '$' + Math.round(n / 1_000).toLocaleString() + 'K';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n: number, digits = 2): string {
  if (!n) return '—';
  return (n * 100).toFixed(digits).replace(/\.?0+$/, '') + '%';
}

function monthsUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function lookingRemaining(leaseExpiry: string): string {
  const months = monthsUntil(leaseExpiry);
  if (months === null) return '';
  if (months <= 0) return 'expired';
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${months} mo remaining`;
  if (remMonths === 0) return `${years} yr${years === 1 ? '' : 's'} remaining`;
  return `${years} yr ${remMonths} mo remaining`;
}

function HeadlineCard({ label, value, sub, accent, valueColor }: { label: string; value: string; sub?: string; accent?: boolean; valueColor?: string }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        backgroundColor: accent ? '#0F2A44' : '#F9FAFB',
        border: '1px solid ' + (accent ? '#0F2A44' : '#E5E7EB'),
        borderRadius: '10px',
        padding: '18px 20px',
        color: accent ? '#FFFFFF' : '#1a2b3c',
      }}
    >
      <p style={{
        fontSize: '0.7rem',
        color: accent ? 'rgba(255,255,255,0.7)' : '#6B7280',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '1.6rem',
        fontWeight: 700,
        color: valueColor ?? (accent ? '#F2D82D' : '#1a2b3c'),
        margin: 0,
        lineHeight: 1.15,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: '0.75rem',
          color: accent ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
          margin: '3px 0 0 0',
        }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: '1px solid #F3F4F6',
      gap: '16px',
      fontSize: '0.875rem',
    }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ color: '#1a2b3c', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function ExecutiveSummarySection() {
  const propertyData = usePropertyData();
  const { cashflow, tenantLease } = propertyData;

  // Core investor metrics
  const capRate = cashflow.purchasePrice
    ? cashflow.annualRent / cashflow.purchasePrice
    : 0;

  // Year 1 net cashflow = rent − outgoings − interest (IO)
  const year1Interest = (cashflow.purchasePrice ?? 0) * (cashflow.lvr ?? 0) * (cashflow.interestRate ?? 0);
  const year1NetCashflow = (cashflow.annualRent ?? 0) - (cashflow.annualExpenses ?? 0) - year1Interest;

  // Year 2 net cashflow — sourced from the CF Calc 10-yr projection.
  // Falls back to null if the 10-yr projection is absent; card then falls
  // back to Year 1 (first-year stabilised).
  const year2Row = cashflow.equityProjection?.find((r) => r.year === 2);
  const year2NetCashflow = year2Row ? year2Row.netCashflow : null;

  const tenant = findItem(tenantLease.items, 'Tenant');
  const covenant = findItem(tenantLease.items, 'Tenant Covenant');
  const leaseExpiry = findItem(tenantLease.items, 'Lease Expiry') || '';
  const rentReview = findItem(tenantLease.items, 'Rent Review');
  const optionTerms = findItem(tenantLease.items, 'Option Terms');
  const outgoingsRecovery = findItem(tenantLease.items, 'Outgoings Recovery');

  const remaining = lookingRemaining(leaseExpiry);

  // If nothing is populated yet, show a minimal placeholder instead of
  // four dashes — more useful for empty-state.
  const hasAnyData =
    cashflow.purchasePrice > 0 ||
    cashflow.annualRent > 0 ||
    tenantLease.items.length > 0;

  return (
    <section id="summary" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Executive Summary
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        The at-a-glance numbers for this deal.
      </p>

      {!hasAnyData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Summary will appear here once the deal is populated.
        </p>
      )}

      {hasAnyData && (
        <>
          {/* Headline cards — Chris's sequence: price → cap rate → Y5 cashflow → cash required */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <HeadlineCard
              label="Purchase Price"
              value={fmtMoney(cashflow.purchasePrice)}
              sub={cashflow.lvr ? `${Math.round(cashflow.lvr * 100)}% LVR` : undefined}
            />
            <HeadlineCard
              label="Net Yield / Cap Rate"
              value={capRate ? fmtPct(capRate, 2) : '—'}
              sub={cashflow.annualRent && cashflow.purchasePrice
                ? `${fmtMoney(cashflow.annualRent)} ÷ ${fmtMoney(cashflow.purchasePrice)}`
                : undefined}
            />
            <HeadlineCard
              label={year2NetCashflow !== null ? 'Year 2 Net Cashflow (estimate)' : 'Year 1 Net Cashflow (estimate)'}
              value={cashflow.purchasePrice
                ? (() => {
                    const v = year2NetCashflow !== null ? year2NetCashflow : year1NetCashflow;
                    return (v < 0 ? '−' : '') + fmtMoney(Math.abs(v));
                  })()
                : '—'}
              sub={cashflow.interestRate
                ? `After ${(cashflow.interestRate * 100).toFixed(2).replace(/\.?0+$/, '')}% interest (IO)${year2NetCashflow !== null ? ' · from CF 10-yr projection' : ''}`
                : undefined}
              valueColor={cashflow.purchasePrice
                ? ((year2NetCashflow !== null ? year2NetCashflow : year1NetCashflow) < 0 ? '#EF4444' : '#22C55E')
                : undefined}
            />
            <HeadlineCard
              label="Cash Required"
              value={fmtMoney(cashflow.upfrontCosts?.totalRequired ?? 0)}
              sub={cashflow.purchasePrice && cashflow.upfrontCosts?.totalRequired
                ? `${Math.round((cashflow.upfrontCosts.totalRequired / cashflow.purchasePrice) * 100)}% of price${cashflow.lvr ? ` · ${Math.round(cashflow.lvr * 100)}% LVR` : ''}`
                : undefined}
            />
          </div>

          {/* Lease / tenant / terms strip */}
          {(tenant || covenant || leaseExpiry || rentReview || optionTerms || outgoingsRecovery) && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '18px 22px',
            }}>
              <p style={{
                fontSize: '0.7rem',
                color: '#6B7280',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}>
                Lease & income security
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tenant && <FactRow label="Tenant"              value={covenant ? `${tenant} (${covenant})` : tenant} />}
                {leaseExpiry && (
                  <FactRow
                    label="Lease expiry"
                    value={remaining ? `${leaseExpiry} · ${remaining}` : leaseExpiry}
                  />
                )}
                {rentReview && <FactRow label="Rent review"      value={rentReview} />}
                {optionTerms && <FactRow label="Option terms"    value={optionTerms} />}
                {outgoingsRecovery && <FactRow label="Outgoings" value={outgoingsRecovery} />}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
