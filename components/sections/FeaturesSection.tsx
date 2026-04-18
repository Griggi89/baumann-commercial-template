'use client';

// Property Details — commercial
// Hero image + listing link + commercial-relevant attributes.

import { usePropertyData } from '@/lib/PropertyDataContext';

// Commercial attributes shown as summary cards. Residential-only fields
// (Bedrooms / Bathrooms / Car Spaces) are intentionally excluded — they
// won't render even if the CF template has those rows.
const CLIENT_FIELDS = [
  'Property Type',
  'Building Area',     // matches "Building Area (sqm)"
  'Floor Area',        // matches "Floor Area (sqm)"
  'Land Area',         // matches "Land Area (sqm)"
  'Zoning',
  'Parking Spaces',
  'NABERS Rating',
  'Year Built',
  'Tenancy Count',
];

/** Upgrade listing-portal CDN image URLs to high resolution (1600x900) */
function hiResImage(url: string): string {
  if (!url) return url;
  return url.replace(/\/\d+x\d+-crop/, '/1600x900-crop');
}

export default function FeaturesSection() {
  const propertyData = usePropertyData();
  const { features, reaLink } = propertyData;
  const visibleDetails = features.details.filter(d => CLIENT_FIELDS.some(f => d.label.includes(f)));

  return (
    <section id="features" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '28px' }}>
        Property Details
      </h2>

      {/* Hero property image from property.com.au CDN */}
      {features.heroImage && (
        <div
          style={{
            maxWidth: '500px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          <img
            src={hiResImage(features.heroImage)}
            alt={propertyData.address}
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Photo links row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        {propertyData.address && !features.heroImage && (
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
            Property photo will appear here once configured.
          </p>
        )}
        {features.heroImage && propertyData.address && (
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
            {propertyData.address}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          {features.propertyUrl && (
            <a
              href={features.propertyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#005151',   // commercialrealestate.com.au brand teal
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 20px',
                borderRadius: '9999px',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <span>commercialrealestate.com.au</span>
              <span style={{ fontSize: '0.75rem' }}>&#8599;</span>
            </a>
          )}
          {reaLink && (
            <a
              href={reaLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#e0151b',   // realcommercial.com.au brand red
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 20px',
                borderRadius: '9999px',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <span>realcommercial.com.au</span>
              <span style={{ fontSize: '0.75rem' }}>&#8599;</span>
            </a>
          )}
        </div>
      </div>

      {/* Property details — horizontal layout, whitelisted fields only */}
      {visibleDetails.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {visibleDetails.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#374151',
              }}
            >
              <strong style={{ color: '#1a2b3c' }}>{item.label}:</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {visibleDetails.length === 0 && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Property details will appear here once populated.
        </p>
      )}
    </section>
  );
}
