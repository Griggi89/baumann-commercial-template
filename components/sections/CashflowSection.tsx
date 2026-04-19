'use client';

// Cashflow section — summary cards + 10-year chart + equity projection table
// All data from propertyData.cashflow

import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { usePropertyData } from '@/lib/PropertyDataContext';

function calcMonthlyRepayment(principal: number, annualRate: number, years: number): number {
  if (!principal || !annualRate || !years) return 0;
  const rate = annualRate > 1 ? annualRate / 100 : annualRate;
  const r = rate / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function formatDollar(value: number): string {
  if (Math.abs(value) >= 1_000_000) return '$' + (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (Math.abs(value) >= 1_000) return '$' + (value / 1_000).toFixed(0) + 'k';
  return '$' + value.toFixed(0);
}

function SummaryCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px 20px',
      }}
    >
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: '1.3rem', fontWeight: 700, color: valueColor ?? '#1a2b3c', margin: '0 0 2px 0' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function CashflowSection() {
  const propertyData = usePropertyData();
  const { cashflow } = propertyData;

  // All calculations use null-safe defaults so hooks always run
  const loanAmount = (cashflow.purchasePrice ?? 0) * (cashflow.lvr ?? 0);
  const annualInterestOnly = loanAmount * (cashflow.interestRate ?? 0);
  const netAnnualCashflow = (cashflow.annualRent ?? 0) - (cashflow.annualExpenses ?? 0) - annualInterestOnly;
  // In commercial under a triple-net lease, "Net Yield / Cap Rate" = net
  // rent ÷ price (tenant pays outgoings, so there's no "gross" distinction).
  // `annualRent` on the PropertyData is already the NET rent.
  const netYieldPct = cashflow.purchasePrice ? ((cashflow.annualRent / cashflow.purchasePrice) * 100).toFixed(2) : '0.00';

  // Chart data sourced from Equity Projection tab (CF Sheet → Deal Sheet → Dashboard)
  const chartData = useMemo(() => {
    // Use sheet-sourced projection data (rentalIncome, totalExpenses, annualCashflow columns)
    const sheetData = cashflow.equityProjection
      .filter(row => row.rentalIncome > 0 || row.totalExpenses > 0)
      .map(row => ({
        year: `Yr ${row.year}`,
        rentalIncome: Math.round(row.rentalIncome),
        expenses: Math.round(row.totalExpenses),
        netCashflow: Math.round(row.annualCashflow),
      }));
    if (sheetData.length > 0) return sheetData;

    // Fallback: if sheet doesn't have the new columns yet, use empty array
    return [];
  }, [cashflow.equityProjection]);

  const zeroCrossPercent = useMemo(() => {
    if (chartData.length === 0) return 0;
    for (let i = 0; i < chartData.length - 1; i++) {
      const a = chartData[i].netCashflow;
      const b = chartData[i + 1].netCashflow;
      if (a <= 0 && b >= 0) {
        const denom = Math.abs(a) + Math.abs(b);
        const fraction = denom === 0 ? 0.5 : Math.abs(a) / denom;
        return Math.round(((i + fraction) / (chartData.length - 1)) * 100);
      }
    }
    return chartData[chartData.length - 1].netCashflow < 0 ? 100 : 0;
  }, [chartData]);

  // Guard: if no data populated yet, show placeholder (AFTER all hooks)
  if (!cashflow.purchasePrice) {
    return (
      <section id="cashflow" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
          Cashflow Estimate
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Cashflow data will appear here once populated.
        </p>
      </section>
    );
  }

  return (
    <section id="cashflow" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Cashflow Estimate
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
          Based on spreadsheet assumptions. Indicative only.
        </p>
        {propertyData.tenantLease.spreadsheetUrl && (
          <a
            href={propertyData.tenantLease.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F9FAFB',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.8rem',
              padding: '8px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              border: '1px solid #E5E7EB',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="14" height="14" rx="2" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="1"/>
              <rect x="3.5" y="4" width="4" height="2" fill="#4CAF50"/>
              <rect x="8.5" y="4" width="4" height="2" fill="#81C784"/>
              <rect x="3.5" y="7" width="4" height="2" fill="#81C784"/>
              <rect x="8.5" y="7" width="4" height="2" fill="#4CAF50"/>
              <rect x="3.5" y="10" width="4" height="2" fill="#4CAF50"/>
              <rect x="8.5" y="10" width="4" height="2" fill="#81C784"/>
            </svg>
            <span>View Cashflow Spreadsheet</span>
            <span style={{ fontSize: '0.7rem' }}>&#8599;</span>
          </a>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <SummaryCard label="Purchase Price (est.)" value={`$${cashflow.purchasePrice.toLocaleString()}`} />
        <SummaryCard label="Net Annual Rent (est.)" value={`$${Math.round(cashflow.annualRent).toLocaleString()}`} sub="From rental appraisal" />
        <SummaryCard label="Net Yield / Cap Rate (est.)" value={`${netYieldPct}%`} sub="Net rent ÷ purchase price (triple net)" />
        <SummaryCard
          label="Total Cash Required (est.)"
          value={formatDollar(cashflow.upfrontCosts.totalRequired)}
          sub={cashflow.purchasePrice
            ? `${Math.round(cashflow.upfrontCosts.totalRequired / cashflow.purchasePrice * 100)}% of purchase price`
            : 'Deposit + costs'}
        />
      </div>

      {/* Expense breakdown */}
      {cashflow.expenseBreakdown.length > 0 && (
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '20px 24px',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Annual Expense Breakdown (est.)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {cashflow.expenseBreakdown.map((exp) => (
              <div key={exp.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#374151', padding: '9px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280' }}>{exp.label}</span>
                <span style={{ fontWeight: 600 }}>
                  {exp.label.toLowerCase().includes('land tax') && exp.annual === 0
                    ? 'To be determined'
                    : `$${exp.annual.toLocaleString()}`}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#374151', padding: '9px 0', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ color: '#6B7280' }}>Interest (IO @ {(cashflow.interestRate * 100).toFixed(2).replace(/\.?0+$/, '')}%)</span>
              <span style={{ fontWeight: 600 }}>${Math.round(annualInterestOnly).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#374151', padding: '10px 0 0 0' }}>
              <span style={{ fontWeight: 700 }}>Total Annual Cost (incl. interest)</span>
              <span style={{ fontWeight: 700, color: '#EF4444' }}>${(cashflow.annualExpenses + Math.round(annualInterestOnly)).toLocaleString()} / yr</span>
            </div>
          </div>
        </div>
      )}

      {/* 10-year chart — data sourced from Equity Projection tab */}
      {chartData.length > 0 && <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '16px' }}>
          10-year cashflow projection — Rental income (area), Total expenses incl. interest (area), Net cashflow (line)
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="netCashflowGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset={`${zeroCrossPercent}%`} stopColor="#EF4444" />
                <stop offset={`${zeroCrossPercent}%`} stopColor="#22C55E" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tickFormatter={formatDollar} tick={{ fontSize: 11, fill: '#6B7280' }} width={60} />
            <Tooltip
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { rentalIncome: 'Rental Income', expenses: 'Interest cost', netCashflow: 'Net Cashflow' };
                return [`$${value.toLocaleString()}`, labels[name] ?? name];
              }}
              contentStyle={{ fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = { rentalIncome: 'Rental Income', expenses: 'Interest cost', netCashflow: 'Net Cashflow' };
                return labels[value] ?? value;
              }}
              wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }}
            />
            <ReferenceLine y={0} stroke="#22C55E" strokeDasharray="6 4" strokeWidth={2} />
            <Area type="monotone" dataKey="rentalIncome" fill="#BFDBFE" stroke="#3B82F6" strokeWidth={2} fillOpacity={0.6} />
            <Area type="monotone" dataKey="expenses" fill="#FEE2E2" stroke="#EF4444" strokeWidth={1.5} fillOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="netCashflow"
              stroke="url(#netCashflowGradient)"
              strokeWidth={2.5}
              dot={(props: { cx: number; cy: number; value: number; index: number }) => {
                const color = props.value >= 0 ? '#22C55E' : '#EF4444';
                return <circle key={`dot-${props.index}`} cx={props.cx} cy={props.cy} r={4} fill={color} stroke={color} />;
              }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#6B7280',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#374151' }}>Assumptions:</strong>{' '}
          Purchase ${cashflow.purchasePrice.toLocaleString()}, LVR {(cashflow.lvr * 100).toFixed(0)}%, interest-only at {(cashflow.interestRate * 100).toFixed(2).replace(/\.?0+$/, '')}% p.a.,
          rent ${cashflow.annualRent.toLocaleString()}/yr growing {(cashflow.rentGrowthRate * 100).toFixed(1).replace(/\.0$/, '')}%/yr,
          non-recoverable expenses ${cashflow.annualExpenses.toLocaleString()}/yr growing {((cashflow.expenseGrowthRate ?? 0.03) * 100).toFixed(0)}%/yr (CPI), IO interest fixed.
        </div>
      </div>}

      {/* Equity & Yield Projection table */}
      {cashflow.equityProjection.length > 0 && (
        <>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Equity &amp; Yield Projection
          </p>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '14px' }}>
            Indicative only — based on assumptions in cashflow spreadsheet.
          </p>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2B3C50' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>Year</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
                    Rent / Yr
                    {cashflow.rentGrowthRate > 0 && <span style={{ color: '#f2d82d', fontWeight: 500, marginLeft: 6 }}>
                      (CPI {(cashflow.rentGrowthRate * 100).toFixed(1).replace(/\.0$/, '')}% p.a.)
                    </span>}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
                    Property Value
                    {cashflow.rentGrowthRate > 0 && <span style={{ color: '#f2d82d', fontWeight: 500, marginLeft: 6 }}>
                      (tracks CPI / rent review)
                    </span>}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>Net Equity</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>Net Annual CF</th>
                </tr>
              </thead>
              <tbody>
                {/* Year 0 (purchase baseline) intentionally omitted — the
                    projection starts at Year 1. Purchase Price + deposit
                    position is already surfaced in the Executive Summary
                    cards above. Including a Y0 row here conflated two
                    different "Net Equity" measures (initial deposit vs
                    ongoing equity position) and put a weekly rent figure
                    in a per-year column. */}
                {cashflow.equityProjection.map((row, i) => {
                  const equityColor    = row.netEquity   < 0 ? '#EF4444' : '#22C55E';
                  const cashflowColor  = row.netCashflow < 0 ? '#EF4444' : '#22C55E';
                  const fmtSigned = (n: number) => n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
                  return (
                    <tr
                      key={row.year}
                      style={{ borderBottom: i < cashflow.equityProjection.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: (i + 1) % 2 === 0 ? '#fff' : '#F9FAFB' }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a2b3c' }}>Year {row.year}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>${Math.round(row.rentalIncome).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>${row.propertyValue.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: equityColor,   fontWeight: 600 }}>{fmtSigned(Math.round(row.netEquity))}</td>
                      <td style={{ padding: '10px 14px', color: cashflowColor, fontWeight: 600 }}>{fmtSigned(Math.round(row.netCashflow))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Loan Amortization — mirrors the CF Calc 10-yr projection block.
          Only renders when the populator has written the expanded schema
          (interestPaid / principalRemaining etc. populated). Older sheets
          on the 5-col schema won't show this block. */}
      {cashflow.equityProjection.length > 0 &&
       cashflow.equityProjection.some(r => r.interestPaid > 0 || r.principalRemaining > 0) && (
        <>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', margin: '28px 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Loan Amortization
          </p>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '14px' }}>
            Interest, principal, and cash-on-cash return per year — matches the CF Calc 10-yr projection.
            {cashflow.debtReductionPct != null && cashflow.debtReductionPct !== 1 && (
              <> Debt reduction: <strong>{Math.round(cashflow.debtReductionPct * 100)}%</strong> of net cashflow directed at principal.</>
            )}
          </p>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2B3C50' }}>
                  {['Year', 'Yearly Yield', 'Interest Paid', 'Principal Paid', 'Principal Remaining', 'Cash on Cash'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflow.equityProjection.map((row, i) => (
                  <tr
                    key={row.year}
                    style={{ borderBottom: i < cashflow.equityProjection.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: (i + 1) % 2 === 0 ? '#fff' : '#F9FAFB' }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a2b3c' }}>Year {row.year}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{row.yearlyYield ? (row.yearlyYield * 100).toFixed(2) + '%' : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#EF4444', fontWeight: 500 }}>
                      {row.interestPaid ? '-$' + Math.round(row.interestPaid).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: row.principalPaid < 0 ? '#EF4444' : '#22C55E', fontWeight: 500 }}>
                      {row.principalPaid === 0
                        ? '—'
                        : (row.principalPaid < 0 ? '-$' : '$') + Math.abs(Math.round(row.principalPaid)).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>
                      {row.principalRemaining ? '$' + Math.round(row.principalRemaining).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: row.cashOnCash < 0 ? '#EF4444' : '#22C55E', fontWeight: 600 }}>
                      {row.cashOnCash ? (row.cashOnCash * 100).toFixed(2) + '%' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Upfront costs breakdown */}
      {cashflow.upfrontCosts.totalRequired > 0 && (
        <>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', margin: '28px 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Upfront Cash Required (est.)
          </p>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {[
                  { label: `Deposit (${100 - Math.round((cashflow.lvr ?? 0) * 100)}%)`, value: cashflow.upfrontCosts.deposit },
                  { label: 'Stamp Duty (est.)', value: cashflow.upfrontCosts.stampDuty },
                  { label: 'Conveyancing', value: cashflow.upfrontCosts.conveyancing },
                  { label: 'Building & Pest Inspection', value: cashflow.upfrontCosts.buildingAndPest },
                  { label: 'Valuation (lender-required)', value: cashflow.upfrontCosts.valuation ?? 0 },
                  { label: 'Building Insurance (est.)', value: cashflow.upfrontCosts.buildingInsurance },
                  { label: 'Title Insurance (est.)', value: cashflow.upfrontCosts.titleInsurance },
                ].filter(item => item.value > 0 || ['Deposit', 'Stamp Duty', 'Conveyancing'].some(k => item.label.startsWith(k))).map((item, i, arr) => (
                  <tr key={item.label} style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: '#fff' }}>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{item.label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>${item.value.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#2B3C50' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 700 }}>Total Cash / Equity Required</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#f2d82d', fontWeight: 700, fontSize: '1rem' }}>${cashflow.upfrontCosts.totalRequired.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
