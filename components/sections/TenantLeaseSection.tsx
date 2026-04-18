'use client';

// Lease & Tenant Insights — commercial-specific view.
// Reads propertyData.tenantLease: items (WALE, covenant, rent reviews, lease type, options),
// plus links to the Tenant Insights and Lease Documents Drive subfolders.

import { usePropertyData } from '@/lib/PropertyDataContext';

const HIGHLIGHT_KEYS = ['WALE (yrs)', 'Tenant', 'Tenant Covenant', 'Lease Type', 'Lease Expiry'];

export default function TenantLeaseSection() {
  const propertyData = usePropertyData();
  const { tenantLease } = propertyData;

  const items = tenantLease.items;
  const highlighted = items.filter((i) => HIGHLIGHT_KEYS.includes(i.label));
  const remainder   = items.filter((i) => !HIGHLIGHT_KEYS.includes(i.label));

  const hasData =
    items.length > 0 ||
    tenantLease.vacancyRate ||
    tenantLease.leaseDocsFolder ||
    tenantLease.tenantInsightsFolder;

  return (
    <section id="tenant" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Lease &amp; Tenant Insights
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Tenant covenant, lease structure, and income security.
      </p>

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Lease and tenant details will appear here once populated in the CF sheet Settings tab.
        </p>
      )}

      {highlighted.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          {highlighted.map((item) => (
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
              <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a2b3c', margin: 0 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {remainder.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '18px 22px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {remainder.map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < remainder.length - 1 ? '1px solid #F3F4F6' : 'none',
                  gap: '16px',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: '#6B7280' }}>{item.label}</span>
                <span style={{ color: '#1a2b3c', fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tenantLease.leaseDocsFolder || tenantLease.tenantInsightsFolder) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {tenantLease.tenantInsightsFolder && (
            <a
              href={tenantLease.tenantInsightsFolder}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                color: '#2563EB',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              📁 Tenant Insights folder ↗
            </a>
          )}
          {tenantLease.leaseDocsFolder && (
            <a
              href={tenantLease.leaseDocsFolder}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                color: '#2563EB',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              📁 Lease Documents folder ↗
            </a>
          )}
        </div>
      )}

      {tenantLease.vacancyRate && (
        <p style={{ marginTop: '18px', fontSize: '0.8125rem', color: '#6B7280' }}>
          Suburb vacancy benchmark: <strong>{tenantLease.vacancyRate}</strong>
          {tenantLease.vacancySource ? ` (${tenantLease.vacancySource})` : ''}
        </p>
      )}
    </section>
  );
}
