'use client';

// Lease & Tenant Insights — commercial-specific view.
// Headline lease terms live in the Executive Summary; this section
// focuses on the remaining lease detail rows and back-links to the
// Lease Documents folder in the DD repo.

import { usePropertyData } from '@/lib/PropertyDataContext';

// These keys are shown in the Executive Summary, so they're filtered
// out here to avoid duplication.
const EXEC_SUMMARY_KEYS = ['Tenant', 'Tenant Covenant', 'Occupancy', 'Lease Type', 'WALE (yrs)', 'Lease Expiry'];

export default function TenantLeaseSection() {
  const propertyData = usePropertyData();
  const { tenantLease } = propertyData;

  const items = tenantLease.items;
  const remainder = items.filter((i) => !EXEC_SUMMARY_KEYS.includes(i.label));

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
        Lease structure detail. Headline terms (tenant, WALE, expiry) are in the Executive Summary.
      </p>

      {!hasData && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Lease and tenant details will appear here once populated in the CF sheet Settings tab.
        </p>
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
