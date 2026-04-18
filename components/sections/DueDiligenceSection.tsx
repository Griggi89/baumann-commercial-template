'use client';

// Due Diligence — status of each of the 9 commercial DD categories.
// Reads propertyData.floodChecks.checks (populated by DD_Sync Apps Script).

import { usePropertyData } from '@/lib/PropertyDataContext';

function statusColor(status: string): { bg: string; fg: string } {
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('pass'))    return { bg: '#D1FAE5', fg: '#065F46' };
  if (s.includes('found') || s.includes('in progress')) return { bg: '#DBEAFE', fg: '#1E40AF' };
  if (s.includes('n/a'))                                return { bg: '#E5E7EB', fg: '#4B5563' };
  return { bg: '#FEF3C7', fg: '#92400E' }; // Pending
}

export default function DueDiligenceSection() {
  const propertyData = usePropertyData();
  const { floodChecks } = propertyData;
  const checks = floodChecks.checks;

  return (
    <section id="due-diligence" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Due Diligence
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Progress across the 9 DD categories. Status updates as documents arrive in Drive.
      </p>

      {checks.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          DD status will appear once the pipeline has run.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {checks.map((c) => {
            const { bg, fg } = statusColor(c.status);
            return (
              <div
                key={c.label}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a2b3c', margin: 0, lineHeight: 1.35 }}>
                    {c.label}
                  </h3>
                  <span style={{
                    backgroundColor: bg,
                    color: fg,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {c.status || 'Pending'}
                  </span>
                </div>
                {c.fileName && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {c.fileName}
                  </div>
                )}
                {c.folderUrl && (
                  <a
                    href={c.folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8125rem',
                      color: '#2563EB',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Open folder ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
