'use client';

// Rental Assessment (sqm rates) — commercial-specific.
// Reads propertyData.rentalAssessment. Summary cards + comparable lettings table.
// Chris populates the underlying "Rental Assessment (sqm rates)" tab manually
// once the CF template is generated.

import { usePropertyData } from '@/lib/PropertyDataContext';

export default function RentalAssessmentSection() {
  const propertyData = usePropertyData();
  const { rentalAssessment } = propertyData;

  const hasData = rentalAssessment.summary.length > 0
    || rentalAssessment.comparables.rows.length > 0;

  return (
    <section id="rental" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Rental Assessment
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Commercial lettings benchmarked on a $/sqm basis. Populated manually from the CF sheet tab.
      </p>

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Rental assessment data will appear here once populated in the CF sheet.
        </p>
      )}

      {rentalAssessment.summary.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          {rentalAssessment.summary.map((item) => (
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

      {rentalAssessment.comparables.rows.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {rentalAssessment.comparables.headers.map((h) => (
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
              {rentalAssessment.comparables.rows.map((r, i) => (
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
