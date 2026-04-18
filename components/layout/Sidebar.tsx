'use client';

// Sidebar navigation — CSS-driven responsive layout.
// On desktop: always visible (280px fixed). On mobile: hidden by default (translateX(-100%)),
// slides in when .sidebar-open class is added. No JS flash on load.

interface SidebarProps {
  activeSection: string;
  onNavClick: (sectionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const NAV_ITEMS: { id: string; label: string; badge?: string }[] = [
  { id: 'features',        label: 'Property Details' },
  { id: 'cashflow',        label: 'Cashflow' },
  { id: 'rental',          label: 'Rental Assessment' },
  { id: 'sales',           label: 'Sales Comparables' },
  { id: 'tenant',          label: 'Lease & Tenant Insights' },
  { id: 'due-diligence',   label: 'Due Diligence' },
  { id: 'location',        label: 'Proximity' },
  { id: 'suburb',          label: 'Suburb Profile' },
  { id: 'government',      label: 'Govt Projects' },
  { id: 'industries',      label: 'Local Industries' },
  { id: 'drive-repo',      label: 'Drive Repo' },
  { id: 'ask-claude',      label: 'Ask ChristAIn', badge: 'NEW' },
  { id: 'disclaimer',      label: 'Disclaimer' },
];

export default function Sidebar({ activeSection, onNavClick, isOpen, onClose, isMobile }: SidebarProps) {
  const handleNavClick = (id: string) => {
    onNavClick(id);
    if (isMobile) onClose();
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-nav sidebar-scroll${isOpen ? ' sidebar-open' : ''}`}
        style={{ backgroundColor: '#2B3C50' }}
      >
        {/* Logo + close button row */}
        <div
          style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <img
            src="https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686d8d54668570cae9b8c760_Logo%20Extended.png"
            alt="Baumann Property"
            style={{
              width: '100%',
              maxWidth: '180px',
              height: 'auto',
              display: 'block',
              filter: 'brightness(0) invert(1)',
            }}
          />
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: '1.5rem',
              lineHeight: 1, padding: '4px',
              marginLeft: '8px',
            }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 24px',
                  backgroundColor: isActive ? '#f2d82d' : 'transparent',
                  color: isActive ? '#0f172a' : 'rgba(255,255,255,0.80)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.label}
                  {item.badge && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? '#2B3C50' : '#f2d82d',
                      color: isActive ? '#f2d82d' : '#1a2b3c',
                      lineHeight: 1.4,
                      flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
