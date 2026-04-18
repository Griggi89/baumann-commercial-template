'use client';

// Location Proximity section — interactive amenity map with Google Directions
// Phase 1: Google Maps Embed API (free, no billing)
// Default: place view. Click amenity → directions view with route line + drive time.

import { useState } from 'react';
import { usePropertyData } from '@/lib/PropertyDataContext';

const EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || '';

export default function LocationSection() {
  const propertyData = usePropertyData();
  const { location, address } = propertyData;
  const [selectedAmenity, setSelectedAmenity] = useState<number | null>(null);

  // Place mode (default overview)
  const placeSrc = EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=${encodeURIComponent(address)}&zoom=14&maptype=satellite`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k&z=14&output=embed`;

  // Directions mode (when amenity selected)
  const getDirectionsSrc = (destination: string) => {
    if (EMBED_KEY) {
      return `https://www.google.com/maps/embed/v1/directions?key=${EMBED_KEY}&origin=${encodeURIComponent(address)}&destination=${encodeURIComponent(destination)}&mode=driving`;
    }
    // Fallback: open Google Maps directions in new tab (no embed possible without API key)
    return '';
  };

  const selected = selectedAmenity !== null ? location.distances[selectedAmenity] : null;
  const directionsSrc = selected
    ? getDirectionsSrc(selected.address || selected.place)
    : '';

  const mapSrc = selectedAmenity !== null && directionsSrc ? directionsSrc : placeSrc;

  const handleAmenityClick = (index: number) => {
    const item = location.distances[index];
    if (EMBED_KEY) {
      setSelectedAmenity(index);
    } else {
      // No embed key — open directions in new tab
      const dest = encodeURIComponent(item.address || item.place);
      const origin = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/dir/${origin}/${dest}`, '_blank');
    }
  };

  return (
    <section id="location" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '20px' }}>
        Location Proximity To Amenities
      </h2>

      {/* Map embed */}
      {address && (
        <div
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
            marginBottom: '16px',
            position: 'relative',
          }}
        >
          <iframe
            src={mapSrc}
            width="100%"
            height="400"
            style={{ display: 'block', border: 'none' }}
            title={
              selected
                ? `Directions to ${selected.place}`
                : `${address} — Map`
            }
            loading="lazy"
            allowFullScreen
          />

          {/* Reset button when viewing directions */}
          {selectedAmenity !== null && (
            <button
              onClick={() => setSelectedAmenity(null)}
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 10,
              }}
            >
              ← All Amenities
            </button>
          )}
        </div>
      )}

      {/* Amenity cards */}
      {location.distances.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {location.distances.map((item, i) => {
            const isActive = selectedAmenity === i;
            return (
              <button
                key={i}
                onClick={() => handleAmenityClick(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: isActive ? '#2B3C50' : '#F9FAFB',
                  color: isActive ? '#fff' : '#374151',
                  border: isActive ? '1px solid #2B3C50' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flex: '1 1 auto',
                  minWidth: '150px',
                  maxWidth: '280px',
                  textAlign: 'left',
                }}
              >
                {/* Pin icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
                    fill={isActive ? '#93C5FD' : '#6B7280'}
                  />
                </svg>
                <span style={{ flex: 1 }}>
                  <strong>{item.place}</strong>
                  <span style={{ marginLeft: '6px', opacity: 0.8 }}>
                    {item.distance}
                    {item.driveTime && ` · ${item.driveTime}`}
                  </span>
                </span>
                {/* Arrow indicator */}
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                  {EMBED_KEY ? (isActive ? '✕' : '→') : '↗'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Location data will appear here once populated.
        </p>
      )}

      {/* Caption */}
      {selectedAmenity !== null && selected && (
        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '10px' }}>
          Showing driving directions from {address} to {selected.place}
          {selected.driveTime && ` — approx. ${selected.driveTime}`}
        </p>
      )}
      {!EMBED_KEY && location.distances.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>
          Click any amenity to open driving directions in Google Maps
        </p>
      )}
    </section>
  );
}
