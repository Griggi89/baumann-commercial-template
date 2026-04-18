'use client';

// Suburb Profile — commercial market stats for the suburb.
// Reads propertyData.suburbProfile (summary kv pairs + report files).

import { usePropertyData } from '@/lib/PropertyDataContext';

export default function SuburbProfileSection() {
  const propertyData = usePropertyData();
  const { suburbProfile } = propertyData;

  const hasData = suburbProfile.summary.length > 0 || suburbProfile.reportFiles.length > 0;

  return (
    <section id="suburb" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Suburb Profile
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Commercial market indicators for the suburb.
      </p>

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Suburb profile will appear here once the suburb report is uploaded and the pipeline runs.
        </p>
      )}

      {suburbProfile.summary.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          {suburbProfile.summary.map((item) => (
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

      {suburbProfile.reportFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suburbProfile.reportFiles.map((f, i) => (
            <a
              key={`${f.name}-${i}`}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#2563EB',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: '#F9FAFB',
              }}
            >
              📄 {f.name}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
