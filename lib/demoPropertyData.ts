// ─────────────────────────────────────────────────────────────────────────────
// Fully-populated in-memory PropertyData fixture for the /demo route.
// Every section of the dashboard has content so Chris (and prospective
// clients) can see what a finished commercial dashboard looks like
// without touching the Master Index or a CF sheet.
//
// Address: 22 Maroochydore Road, Maroochydore QLD 4558 (real listing;
// commercialrealestate.com.au ID 2020772962 / realcommercial ID 505113720).
// Numbers below are synthetic placeholders representative of Sunshine Coast
// commercial mid-market — swap to the actual IM figures when available.
// ─────────────────────────────────────────────────────────────────────────────

import type { PropertyData } from './propertyData';

export const demoPropertyData: PropertyData = {
  address: '22 Maroochydore Road, Maroochydore QLD 4558',
  lastUpdated: '2026-04-18',
  reaLink: 'https://www.realcommercial.com.au/for-sale/property-22-maroochydore-road-maroochydore-qld-4558-505113720',

  features: {
    photos: [],
    heroImage: 'https://res-3.cloudinary.com/cre/image/fetch/h_900,f_auto,c_fill,q_auto,d_placeholder_viubzx.png/https%3A%2F%2Fbucket-api.commercialrealestate.com.au%2Fv1%2Fbucket%2Fimage%2F2020772962_1_1_260417_114738-w1600-h1199',
    propertyUrl: 'https://www.commercialrealestate.com.au/property/22-maroochydore-road-maroochydore-qld-4558-2020772962',
    details: [
      { label: 'Property Type',        value: 'Industrial Showroom' },
      { label: 'Building Area (sqm)',  value: '350' },
      { label: 'Land Area (sqm)',      value: '1,699' },
      { label: 'Zoning',               value: 'Mixed Use (Sunshine Coast Planning Scheme)' },
      { label: 'Parking Spaces',       value: '10 (on-site)' },
      { label: 'Availability',         value: 'Leased (single-tenant triple net)' },
      { label: 'Tenancy Count',        value: 'Single tenant (100% occupied)' },
    ],
  },

  tenantLease: {
    spreadsheetUrl: '',
    items: [
      { label: 'Tenant',              value: 'Coastal Marine & Outdoor Pty Ltd' },
      { label: 'Tenant Covenant',     value: 'Strong private — 12-yr operating history, Sunshine Coast flagship showroom' },
      { label: 'Occupancy',           value: 'Single tenant (100%)' },
      { label: 'Lease Type',          value: 'Triple Net (all outgoings recovered)' },
      { label: 'Lease Start',         value: '2024-03-01' },
      { label: 'Lease Expiry',        value: '2034-02-28' },
      { label: 'WALE (yrs)',          value: '7.9' },
      { label: 'Rent Review',         value: 'CPI 3.5%' },
      { label: 'Option Terms',        value: '2 × 5 years' },
      { label: 'Outgoings Recovery',  value: '100% recovered via net lease' },
    ],
    vacancyRate: '5.1% (Sunshine Coast commercial — CY25)',
    vacancySource: 'PCA Office Market Report Jan 2026',
    leaseDocsFolder: '#due-diligence',
    tenantInsightsFolder: '#due-diligence',
  },

  cashflow: {
    // Matches the Commercial Pay Down Calculator defaults (see CF template).
    // Triple-net lease assumed — tenant covers all outgoings incl.
    // land tax + maintenance; landlord pays mgmt fee (5%) + 2% aux cost.
    purchasePrice: 1_000_000,
    lvr: 0.80,
    interestRate: 0.08,
    loanTermYears: 10,
    annualRent: 60_000,  // 6.00% cap rate on $1M
    rentGrowthRate: 0.03,            // CPI / yearly review
    capitalGrowthRate: 0.03,
    year1CapitalGrowthRate: 0.03,
    expenseGrowthRate: 0.03,
    annualExpenses: 4_200,  // 7% of $60,000 (mgmt 5% + aux 2%)
    debtReductionPct: 1.0,  // 100% of net cashflow directed at loan (CF default)
    expenseBreakdown: [
      { label: 'Property Management Fee + 2% aux (compliance / insurance)', annual: 4_200 },
    ],
    upfrontCosts: {
      deposit:            200_000, // 20% of $1M (80% LVR per CF default)
      stampDuty:          44_000,  // QLD commercial on $1M (outside SA)
      gst:                0,
      conveyancing:       4_000,   // solicitor cost
      buildingAndPest:    1_000,   // building inspection
      valuation:          3_000,   // lender-required commercial valuation
      buildingInsurance:  0,
      titleInsurance:     0,
      totalRequired:      252_000,
    },
    equityProjection: (() => {
      // Mirror of the CF Calc 10-year projection (see CF template).
      // Principal paydown recurs year-to-year: Y+1 loan balance = Y loan
      // balance − (netCF × debtReductionPct). Negative netCF grows the loan.
      const purchase = 1_000_000;
      const startLoan = 800_000;
      const cashRequired = 252_000;
      const growth = 0.03;
      const rate = 0.08;
      const mgmtPct = 0.07;
      const debtRed = 1.0;

      const rows = [];
      let loanStart = startLoan;
      for (let i = 0; i < 10; i++) {
        const year = i + 1;
        const rent = Math.round(60_000 * Math.pow(1 + growth, i));
        const outgoings = Math.round(rent * mgmtPct);
        const interest = Math.round(loanStart * rate);
        const netCashflow = rent - outgoings - interest;
        const principalPaid = Math.round(netCashflow * debtRed);
        const principalRemaining = loanStart;
        const propertyValue = Math.round(purchase * Math.pow(1 + growth, i));
        rows.push({
          year,
          rentalIncome: rent,
          totalExpenses: outgoings + interest,
          annualCashflow: netCashflow,
          rentPerWeek: Math.round(rent / 52),
          propertyValue,
          netEquity: propertyValue - loanStart,
          netCashflow,
          yearlyYield: rent / purchase,
          interestPaid: interest,
          principalPaid,
          principalRemaining,
          cashOnCash: netCashflow / cashRequired,
        });
        loanStart = loanStart - principalPaid;  // carry forward
      }
      return rows;
    })(),
  },

  sqmRateAssessment: {
    spreadsheetUrl: '',
    sales: {
      summary: [
        { label: 'Average $/sqm', value: '$2,850' },
      ],
      comparables: {
        headers: ['Address', 'Sold Date', 'Sold Price', '$/sqm', 'Cap Rate'],
        rows: [
          ['80 Aerodrome Road, Maroochydore',    '2025-11', '$1.15M', '$2,900', '5.85%'],
          ['17 First Avenue, Maroochydore',      '2025-09', '$860k',  '$2,700', '6.20%'],
          ['45 Maroochydore Road, Maroochydore', '2026-01', '$1.35M', '$3,050', '5.95%'],
          ['102 Aerodrome Road, Maroochydore',   '2025-08', '$1.05M', '$2,750', '6.10%'],
        ],
      },
    },
    rent: {
      summary: [
        { label: 'Average $/sqm', value: '$176' },
      ],
      comparables: {
        headers: ['Address', 'Lease Date', '$ Lease per year', 'Sqm', '$/sqm'],
        rows: [
          ['12 First Avenue, Maroochydore',   '2024-08', '$52,800', '320', '$165'],
          ['90 Aerodrome Road, Maroochydore', '2024-11', '$73,800', '410', '$180'],
          ['33 Horton Parade, Maroochydore',  '2025-02', '$52,640', '280', '$188'],
          ['5 Plaza Parade, Maroochydore',    '2023-10', '$88,400', '520', '$170'],
        ],
      },
    },
  },

  location: {
    lat: -26.6603,
    lng: 153.0928,
    mapBbox: '',
    distances: [
      { place: 'Maroochydore CBD',              distance: '0.4 km',  driveTime: '2 min',  address: 'Maroochydore QLD 4558' },
      { place: 'Nearest Major Highway (Bruce Hwy)', distance: '5.2 km', driveTime: '7 min',  address: 'Bruce Highway (M1)' },
      { place: 'Nambour Train Station',         distance: '18 km',   driveTime: '22 min', address: 'Nambour QLD 4560' },
      { place: 'Port of Brisbane',              distance: '96 km',   driveTime: '72 min', address: 'Port of Brisbane QLD 4178' },
      { place: 'Sunshine Coast Airport',        distance: '8.2 km',  driveTime: '12 min', address: 'Marcoola QLD 4564' },
      { place: 'Sunshine Coast University Hospital', distance: '14.5 km', driveTime: '17 min', address: 'Birtinya QLD 4575' },
      { place: 'Kunda Park Industrial',         distance: '6.8 km',  driveTime: '10 min', address: 'Kunda Park QLD 4556' },
      { place: 'University of the Sunshine Coast', distance: '12 km', driveTime: '15 min', address: 'Sippy Downs QLD 4556' },
      { place: 'Sunshine Plaza',                distance: '1.1 km',  driveTime: '3 min',  address: 'Horton Parade, Maroochydore QLD 4558' },
    ],
  },

  government: {
    regionName: 'Sunshine Coast',
    projects: [
      {
        title: 'Sunshine Coast Mass Transit (SCMT)',
        description: 'Heavy-rail/trackless-tram corridor Maroochydore → Kawana → Caloundra; business case funded.',
        bullets: ['$1.6B+ federal + state commitment', 'Detailed Business Case delivered 2024', 'Targeting construction FY27–FY31'],
        sourceUrl: 'https://www.sunshinecoast.qld.gov.au/council/planning-and-projects/sunshine-coast-mass-transit',
      },
      {
        title: 'Maroochydore City Centre (SunCentral)',
        description: 'Greenfield CBD built on former Horton Park Golf Club — Australia\'s only newly-built CBD this century.',
        bullets: ['$2.5B+ private + public pipeline', 'Stage 1 complete; Stages 2–4 through 2030', 'Office, residential, retail, civic precinct'],
        sourceUrl: 'https://www.maroochydorecitycentre.com.au/',
      },
      {
        title: 'Sunshine Coast Airport Runway Expansion — Phase 2',
        description: 'Terminal expansion + international route growth following new runway completion 2020.',
        bullets: ['$347M already invested in new runway', 'Phase 2 terminal works $200M+', 'International services to Asia-Pacific from 2026'],
        sourceUrl: 'https://www.sunshinecoastairport.com.au/corporate/expansion',
      },
      {
        title: 'Bruce Highway Upgrade — Cooroy to Curra Section D',
        description: 'Final 26km section of M1 upgrade north of Sunshine Coast, improving Brisbane → Cairns freight corridor.',
        bullets: ['$1B+ federal + state funding', 'Completion target 2028', 'Unlocks +15% freight capacity into SE Qld'],
        sourceUrl: 'https://www.tmr.qld.gov.au/Projects/Name/B/Bruce-Highway-Cooroy-to-Curra',
      },
      {
        title: 'Mooloolaba Foreshore Revitalisation',
        description: 'Staged upgrade of Mooloolaba Esplanade and Beach Reserve — amenity driver for surrounding commercial.',
        bullets: ['$150M+ committed', 'Stages 1–2 delivered 2022–24', 'Final stages 2026–28'],
        sourceUrl: 'https://www.sunshinecoast.qld.gov.au/council/planning-and-projects/mooloolaba-foreshore',
      },
    ],
  },

  population: {
    lga: 'LGA36720',
    lgaName: 'Sunshine Coast',
    benchmarkName: 'Queensland',
    topIndustries: [
      { name: 'Health Care & Social Assistance',       lga: 14.2, benchmark: 13.1 },
      { name: 'Retail Trade',                           lga: 11.8, benchmark: 10.6 },
      { name: 'Accommodation & Food Services',          lga: 10.9, benchmark: 7.4  },
      { name: 'Construction',                           lga: 10.6, benchmark: 9.8  },
      { name: 'Education & Training',                   lga: 8.1,  benchmark: 8.3  },
    ],
    industryTakeaways: [
      'Sunshine Coast employment skews to services + construction vs state average — growth correlates with population inflow (+2.4% p.a. vs QLD +1.7%).',
      'Health Care is the single largest sector, anchored by Sunshine Coast University Hospital — commercial demand from allied-health tenants is structural.',
      'Accommodation & Food Services overweight (10.9% vs 7.4% QLD) reflects tourism + lifestyle migration — positive for retail + hospitality F&B tenants.',
    ],
    industrySources: [
      { name: 'ABS 2021 Census QuickStats — Sunshine Coast (R) LGA', url: 'https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA36720' },
      { name: 'PCA Sunshine Coast Office Market Report',              url: 'https://www.propertycouncil.com.au/' },
    ],
  },

  suburbProfile: {
    summary: [
      { label: 'Commercial Vacancy Rate', value: '5.1%' },
      { label: 'Median Commercial Yield', value: '6.00%' },
      { label: 'Rent Growth (YoY)',       value: '+3.2%' },
      { label: 'Supply Pipeline',         value: '38,000 sqm (2026–28)' },
      { label: 'Absorption Rate',         value: '~12,000 sqm / yr' },
    ],
    reportFolderUrl: '',
    reportFiles: [
      { name: 'Sunshine Coast Q4 2025 Office Market Review.pdf', url: '#' },
      { name: 'PCA Office Vacancy Jan 2026.pdf',                 url: '#' },
    ],
  },

  floodChecks: {
    ddFolderUrl: '',
    checks: [
      { label: 'Tenant Insights',                 status: 'Complete', folder: 'Tenant Insights',                 folderUrl: '#', imageId: '', fileName: 'Tenant_Overview_SCHWG.pdf',         type: 'pdf'   },
      { label: 'Lease Documents',                 status: 'Complete', folder: 'Lease Documents',                 folderUrl: '#', imageId: '', fileName: 'Head_Lease_Executed_2024.pdf',      type: 'pdf'   },
      { label: 'Rental Appraisal & Sales Comps',  status: 'Complete', folder: 'Rental Appraisal & Sales Comps',  folderUrl: '#', imageId: '', fileName: 'Ray_White_Rental_2026.pdf',         type: 'pdf'   },
      { label: 'Suburb and Property Report',      status: 'Complete', folder: 'Suburb and Property Report',      folderUrl: '#', imageId: '', fileName: 'SC_Office_Report_Q4_25.pdf',        type: 'pdf'   },
      { label: 'Walkthrough videos',              status: 'Pending',  folder: 'Walkthrough videos',              folderUrl: '#', imageId: '', fileName: '',                                  type: 'video' },
      { label: 'Contract and Vendor Disclosure',  status: 'Complete', folder: 'Contract and Vendor Disclosure',  folderUrl: '#', imageId: '', fileName: 'Contract_of_Sale_Executed.pdf',     type: 'pdf'   },
      { label: 'DD Checks (Easement / Insurance)', status: 'Found',   folder: 'DD Checks',                       folderUrl: '#', imageId: '', fileName: 'Title_Search_CT_Volume_51234.pdf',  type: 'pdf'   },
      { label: 'Council Planning information',    status: 'Complete', folder: 'Council Planning',                folderUrl: '#', imageId: '', fileName: 'SC_Planning_Scheme_Principal_Centre.pdf', type: 'pdf' },
      { label: 'Cashflow Calculation',            status: 'Complete', folder: 'Cashflow Calculation',            folderUrl: '#', imageId: '', fileName: 'CF_Model_v2.xlsx',                  type: 'link'  },
    ],
    planningReport: {
      label:     'Council Planning Report',
      fileId:    '',
      fileName:  'SC_Planning_Scheme_Principal_Centre_Maroochydore.pdf',
      folderUrl: '#',
    },
  },

  dueDiligence: {
    folderUrl: '#',
    subfolders: [
      'Tenant Insights',
      'Lease Documents',
      'Rental Appraisal & Sales Comparables',
      'Suburb and Property Report',
      'Walkthrough videos',
      'Contract and Vendor Disclosure',
      'DD Checks (Easement / Public Housing / Insurance)',
      'Council Planning information',
      'Cashflow Calculation',
    ],
  },

  driveRepo: {
    folderUrl: '#',
    subfolders: [
      { name: 'Tenant Insights',                url: '#' },
      { name: 'Lease Documents',                url: '#' },
      { name: 'Rental Appraisal & Sales Comps', url: '#' },
      { name: 'Suburb and Property Report',     url: '#' },
      { name: 'Walkthrough videos',             url: '#' },
      { name: 'Contract and Vendor Disclosure', url: '#' },
      { name: 'DD Checks',                      url: '#' },
      { name: 'Council Planning',               url: '#' },
      { name: 'Cashflow Calculation',           url: '#' },
    ],
  },

  askClaude: {
    suggestedQuestions: [
      "What's the cap rate?",
      "What's the WALE?",
      "What are the key risks?",
      "How is rent reviewed?",
      "What's driving Sunshine Coast commercial demand?",
    ],
  },

  about: {
    name: 'Christian Baumann',
    title: 'Director & Qualified Property Investment Advisor',
    email: 'christian@baumannproperty.com.au',
    phone: '',
    photo: 'https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686defd2d19a7867809d5c3e_Profile%20Picture%20Christian%20Baumann%20(2).jpg',
  },
};
