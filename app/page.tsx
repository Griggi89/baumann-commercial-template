import { getActiveProperties } from '@/lib/properties';

// Root landing page — intentionally spartan. Clients access their own
// dashboard via a direct /deals/<slug>[?t=<token>] URL; this page just
// confirms the deploy is live and (optionally) lists deal count.
export default async function Home() {
  let dealCount = 0;
  try {
    dealCount = (await getActiveProperties()).length;
  } catch {
    // Master Index not reachable — still render the page
  }

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
        style={{ height: '40px', marginBottom: '32px' }}
      />
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F2A44', margin: '0 0 12px' }}>
        Baumann Commercial — Deal Dashboards
      </h1>
      <p style={{ color: '#6B7280', fontSize: '0.95rem', textAlign: 'center', maxWidth: '520px', margin: '0 0 24px' }}>
        Individual commercial investment dashboards are accessed via direct link.
        Contact Christian Baumann for access to a specific deal.
      </p>
      <p style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
        {dealCount > 0 ? `${dealCount} active deal${dealCount === 1 ? '' : 's'} · ` : ''}
        <a href="mailto:christian@baumannproperty.com.au" style={{ color: '#2563EB', textDecoration: 'none' }}>
          christian@baumannproperty.com.au
        </a>
      </p>
    </main>
  );
}
