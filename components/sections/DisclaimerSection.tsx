'use client';

// Disclaimer + About section combined
// Advisor data from propertyData.about

import { usePropertyData } from '@/lib/PropertyDataContext';

export default function DisclaimerSection() {
  const propertyData = usePropertyData();
  const { about } = propertyData;

  return (
    <section id="disclaimer" style={{ marginBottom: '64px' }}>
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1a2b3c',
          marginBottom: '20px',
        }}
      >
        Disclaimer
      </h2>

      {/* Disclaimer box */}
      <div style={{
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderLeft: '4px solid #2B3C50',
        borderRadius: '6px',
        padding: '20px 24px',
        maxWidth: '780px',
        marginBottom: '48px',
      }}>
        <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.8, margin: 0 }}>
          The contents of this report are of general nature only and should not be relied upon solely when
          making an investment decision. Baumann Property nor any of its directors, associates, staff, or
          associated companies bear any liability from any actions derived from in this document. One should
          always seek third party investment information from relevant parties such as legal, finance, and
          accountancy enquiries.
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: '40px' }} />

      {/* Advisor card */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Photo */}
        {about.photo && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={about.photo}
              alt={about.name}
              style={{
                width: '140px',
                height: '170px',
                borderRadius: '8px',
                objectFit: 'cover',
                objectPosition: 'center 8%',
                display: 'block',
                border: '3px solid #E5E7EB',
              }}
            />
          </div>
        )}

        {/* Contact details */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '2px' }}>
            {about.name}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '2px' }}>
            {about.title}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {about.email && (
              <a
                href={`mailto:${about.email}`}
                style={{ color: '#374151', fontSize: '0.9rem', textDecoration: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
              >
                {about.email}
              </a>
            )}
            <a
              href="https://www.baumannproperty.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#374151', fontSize: '0.9rem', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
            >
              www.baumannproperty.com.au
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
