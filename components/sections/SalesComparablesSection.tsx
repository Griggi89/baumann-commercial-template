'use client';

// Sales Comparables — commercial-specific.
// Reads propertyData.salesComparables. Summary cards (cap rate, $/sqm) + table.
// Chris populates the underlying "Sales Comparables" tab manually.

import { usePropertyData } from '@/lib/PropertyDataContext';

export default function SalesComparablesSection() {
  const propertyData = usePropertyData();
  const { salesComparables } = propertyData;

  const hasData = salesComparables.summary.length > 0
    || salesComparables.table.rows.length > 0;

  return (
    <section id="sales" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Sales Comparables
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Comparable sales benchmarked by cap rate and $/sqm.
      </p>

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Sales comparables will appear here once populated in the CF sheet.
        </p>
      )}

      {salesComparables.summary.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          {salesComparables.summary.map((item) => (
            <div
              key={item.label}
              style={{
                flex: '1 1 200px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
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

      {salesComparables.table.rows.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {salesComparables.table.headers.map((h) => (
                  <th
                    key={h}
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
              {salesComparables.table.rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E5E7EB' }}>
                  {r.map((cell, j) => (
                    <td key={j} style={{ padding: '10px 16px', color: '#374151' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
