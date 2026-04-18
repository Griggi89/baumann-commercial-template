'use client';

// ───────────────────────────────────────────────────────────────────────────
// DashboardClient — commercial dashboard (13-section layout).
// Mirrors residential structure; sections adapted for commercial data
// (cap rate / $/sqm / WALE / triple-net).
// ───────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PropertyData } from '@/lib/propertyData';
import { PropertyDataProvider, usePropertyData } from '@/lib/PropertyDataContext';

import Sidebar from '@/components/layout/Sidebar';

import FeaturesSection             from '@/components/sections/FeaturesSection';
import ExecutiveSummarySection     from '@/components/sections/ExecutiveSummarySection';
import CashflowSection             from '@/components/sections/CashflowSection';
import RentalAssessmentSection     from '@/components/sections/RentalAssessmentSection';
import SalesComparablesSection     from '@/components/sections/SalesComparablesSection';
import TenantLeaseSection          from '@/components/sections/TenantLeaseSection';
import DueDiligenceSection         from '@/components/sections/DueDiligenceSection';
import LocationSection             from '@/components/sections/LocationSection';
import SuburbProfileSection        from '@/components/sections/SuburbProfileSection';
import GovernmentSection           from '@/components/sections/GovernmentSection';
import IndustriesSection           from '@/components/sections/IndustriesSection';
import DriveRepoSection            from '@/components/sections/DriveRepoSection';
import AskClaudeSection            from '@/components/sections/AskClaudeSection';
import DisclaimerSection           from '@/components/sections/DisclaimerSection';

const SECTION_IDS = [
  'features',
  'summary',
  'cashflow',
  'rental',
  'sales',
  'tenant',
  'due-diligence',
  'location',
  'suburb',
  'government',
  'industries',
  'drive-repo',
  'ask-claude',
  'disclaimer',
] as const;

interface DashboardClientProps {
  initialData: PropertyData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  return (
    <PropertyDataProvider initialData={initialData}>
      <DashboardContent />
    </PropertyDataProvider>
  );
}

function DashboardContent() {
  const propertyData = usePropertyData();
  const [activeSection, setActiveSection] = useState<string>('features');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  useEffect(() => {
    const toggle = document.getElementById('sidebar-toggle') as HTMLInputElement | null;
    if (toggle) toggle.checked = sidebarOpen;
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    const toggle = document.getElementById('sidebar-toggle') as HTMLInputElement | null;
    if (!toggle) return;
    const handler = () => setSidebarOpen(toggle.checked);
    toggle.addEventListener('change', handler);
    return () => toggle.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const OFFSET = 120;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (nearBottom) {
        setActiveSection(SECTION_IDS[SECTION_IDS.length - 1]);
        return;
      }
      let current: string = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <>
      <input
        type="checkbox"
        id="sidebar-toggle"
        style={{ display: 'none', position: 'absolute' }}
        aria-hidden="true"
        readOnly
        checked={sidebarOpen}
      />

      <div className="mobile-topbar">
        <label
          htmlFor="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-label="Open menu"
        >
          ☰
          <span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>
            MENU
          </span>
        </label>
        <img
          src="https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686d8d54668570cae9b8c760_Logo%20Extended%20Colour-p-500.png"
          alt="Baumann Property"
          style={{ height: '26px', width: 'auto', filter: 'brightness(0) invert(1)', marginLeft: '12px' }}
        />
      </div>

      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex' }}>
        <Sidebar
          activeSection={activeSection}
          onNavClick={handleNavClick}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        <main ref={mainRef} className="dashboard-main">
          <h1 className="dashboard-title">
            {propertyData.address || 'Commercial Property Analysis'}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '0px',
              marginBottom: '24px',
            }}
          >
            {propertyData.lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Last updated: {propertyData.lastUpdated}
              </span>
            )}
          </div>

          <FeaturesSection />
          <ExecutiveSummarySection />
          <CashflowSection />
          <RentalAssessmentSection />
          <SalesComparablesSection />
          <TenantLeaseSection />
          <DueDiligenceSection />
          <LocationSection />
          <SuburbProfileSection />
          <GovernmentSection />
          <IndustriesSection />
          <DriveRepoSection />
          <AskClaudeSection />
          <DisclaimerSection />

          <footer
            style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '24px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                &copy; {new Date().getFullYear()} Baumann Property Pty Ltd. All rights reserved.
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                  Data-Driven Commercial Investment
                </span>
                <span style={{ color: '#D1D5DB', fontSize: '0.8rem' }}>|</span>
                <span
                  style={{
                    color: '#0891B2',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  baumannproperty.com.au
                </span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
