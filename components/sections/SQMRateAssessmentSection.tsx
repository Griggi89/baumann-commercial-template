'use client';

// SQM Rate Assessment — consolidated commercial-specific section that
// replaces the previous Rental Assessment + Sales Comparables sections.
// Source is the 'Rental ans Sales comps (sqm rates)' tab on the CF
// template, split by parseCombinedRentSales into two halves.
//
// Renders two sub-tables stacked, each with its own headers / data rows /
// "Average per sqm" summary strip. Per CL1 addendum 2026-04-19_1325.
//
// Mobile: tables default to COLLAPSED — average is the headline number;
// full comparables list opens on "View X comparables" button click.
// Desktop: tables auto-expand on mount (see useDefaultExpandedOnDesktop).

import { useState, useEffect } from 'react';
import { usePropertyData } from '@/lib/PropertyDataContext';

function useDefaultExpandedOnDesktop() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) setOpen(true);
  }, []);
  return [open, setOpen] as const;
}

interface SubTableProps {
  title: string;
  subtitle: string;
  summary:     { label: string; value: string }[];
  comparables: { headers: string[]; rows: string[][] };
  emptyLabel:  string;
}

function SubTable({ title, subtitle, summary, comparables, emptyLabel }: SubTableProps) {
  const hasData = summary.length > 0 || comparables.rows.length > 0;
  const [open, setOpen] = useDefaultExpandedOnDesktop();
  const rowCount = comparables.rows.length;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a2b3c', margin: 0 }}>
            {title}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '4px', marginBottom: 0 }}>
            {subtitle}
          </p>
        </div>
        {rowCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: open ? '#F3F4F6' : '#2B3C50',
              color: open ? '#1a2b3c' : '#fff',
              border: open ? '1px solid #E5E7EB' : 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-expanded={open}
          >
            {open ? 'Hide' : `View ${rowCount} comparables`}
            <span style={{ fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Summary strip shown ALWAYS when present — it's the headline
          number ($/sqm average). Works as the collapsed-state summary. */}
      {summary.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', marginBottom: open ? '16px' : '0' }}>
          {summary.map((item, i) => (
            <div
              key={i}
              style={{
                flex: '1 1 200px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '16px 20px',
              }}
            >
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {item.label}
              </p>
              <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2b3c', margin: 0 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic', marginTop: '16px' }}>
          {emptyLabel}
        </p>
      )}

      {open && comparables.rows.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {comparables.headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      backgroundColor: '#0F2A44',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparables.rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E5E7EB' }}>
                  {r.map((cell, j) => (
                    <td key={j} style={{ padding: '10px 16px', color: '#374151' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Average per sqm footer — pulled from `summary`. Highlighted
                  yellow (#FEF08A / amber-200) to match the CF template's
                  yellow fill on the "Average per sqm" row. */}
              {summary.length > 0 && (
                <tr style={{ borderTop: '2px solid #1a2b3c', backgroundColor: '#FEF3C7' }}>
                  {comparables.headers.map((_, j) => {
                    if (j === 0) {
                      return (
                        <td key={j} style={{ padding: '12px 16px', color: '#1a2b3c', fontWeight: 700 }}>
                          {summary[0].label}
                        </td>
                      );
                    }
                    if (j === comparables.headers.length - 1) {
                      return (
                        <td key={j} style={{ padding: '12px 16px', color: '#1a2b3c', fontWeight: 700 }}>
                          {summary[0].value}
                        </td>
                      );
                    }
                    return <td key={j} style={{ padding: '12px 16px' }} />;
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SQMRateAssessmentSection() {
  const propertyData = usePropertyData();
  const { sqmRateAssessment } = propertyData;

  const hasAny =
    sqmRateAssessment.sales.summary.length > 0 ||
    sqmRateAssessment.sales.comparables.rows.length > 0 ||
    sqmRateAssessment.rent.summary.length > 0 ||
    sqmRateAssessment.rent.comparables.rows.length > 0;

  return (
    <section id="sqm-rate" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        SQM Rate Assessment
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '28px' }}>
        Comparable sales + lettings benchmarked on a $/sqm basis. Average per sqm is highlighted.
      </p>

      {!hasAny && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Sales and rent comparables will appear here once populated on the CF sheet&apos;s SQM Rate Assessment tab.
        </p>
      )}

      <SubTable
        title="Sales Comparables"
        subtitle="Recent commercial sales in the area — price, area, rate."
        summary={sqmRateAssessment.sales.summary}
        comparables={sqmRateAssessment.sales.comparables}
        emptyLabel="Sales comparables will appear here once populated."
      />

      <SubTable
        title="Rent Comparables"
        subtitle="Recent commercial lettings — annual rent and $/sqm."
        summary={sqmRateAssessment.rent.summary}
        comparables={sqmRateAssessment.rent.comparables}
        emptyLabel="Rent comparables will appear here once populated."
      />
    </section>
  );
}
