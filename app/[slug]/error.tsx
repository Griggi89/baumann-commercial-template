'use client';

// Error boundary for /deals/[slug]. If any section component throws during
// render, this replaces the 500 page with a useful fallback that still
// confirms the deal exists but tells the viewer the data isn't ready.
// The error is logged to Vercel function logs via console.error.

import { useEffect } from 'react';

export default function DealError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[deals/[slug]] render error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <img
        src="https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686d8d54668570cae9b8c760_Logo%20Extended%20Colour-p-500.png"
        alt="Baumann Property"
        style={{ height: '36px', marginBottom: '24px' }}
      />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F2A44', margin: '0 0 8px' }}>
        Dashboard data not ready yet
      </h1>
      <p style={{ color: '#6B7280', fontSize: '0.9rem', textAlign: 'center', maxWidth: '460px', margin: '0 0 20px' }}>
        This deal exists in the index but the underlying spreadsheet couldn&apos;t be rendered.
        This usually means the pipeline hasn&apos;t run yet, the CF sheet isn&apos;t shared
        publicly, or required tabs are missing.
      </p>
      <button
        onClick={() => reset()}
        style={{
          backgroundColor: '#0F2A44',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
      {error.digest && (
        <p style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: '18px', fontFamily: 'ui-monospace, monospace' }}>
          digest: {error.digest}
        </p>
      )}
      <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '18px' }}>
        <a href="mailto:christian@baumannproperty.com.au" style={{ color: '#2563EB', textDecoration: 'none' }}>
          christian@baumannproperty.com.au
        </a>
      </p>
    </main>
  );
}
