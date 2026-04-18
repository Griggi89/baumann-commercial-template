'use client';

// Drive Repo — links to the 9 Commercial DD subfolders.
// Reads propertyData.driveRepo.

import { usePropertyData } from '@/lib/PropertyDataContext';

export default function DriveRepoSection() {
  const propertyData = usePropertyData();
  const { driveRepo } = propertyData;

  return (
    <section id="drive-repo" style={{ marginBottom: '64px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', marginBottom: '8px' }}>
        Google Drive Folder Repository
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Supporting documents live in Drive — one subfolder per DD category.
      </p>

      {driveRepo.folderUrl && (
        <a
          href={driveRepo.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0F2A44',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
        >
          Open DD Parent Folder
          <span style={{ fontSize: '0.8rem' }}>↗</span>
        </a>
      )}

      {driveRepo.subfolders.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Subfolders will appear here once the pipeline runs.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {driveRepo.subfolders.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                textDecoration: 'none',
                backgroundColor: '#F9FAFB',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background-color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                backgroundColor: '#FFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '1rem',
              }}>📁</span>
              <span style={{ flex: 1 }}>{f.name}</span>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>open ↗</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
