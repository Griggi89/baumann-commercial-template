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
      { label: 'Property Type',       value: 'Commercial Office / Retail' },
      { label: 'Building Area (sqm)', value: '1,240' },
      { label: 'Land Area (sqm)',     value: '1,890' },
      { label: 'Zoning',              value: 'Principal Centre (Sunshine Coast Planning Scheme)' },
      { label: 'Parking Spaces',      value: '32 (on-grade + basement)' },
      { label: 'NABERS Rating',       value: '4.5 Stars Energy' },
      { label: 'Year Built',          value: '2008 (refurbished 2021)' },
      { label: 'Tenancy Count',       value: '1' },
    ],
  },

  tenantLease: {
    spreadsheetUrl: '',
    items: [
      { label: 'Tenant',              value: 'Sunshine Coast Health & Wellness Group Pty Ltd' },
      { label: 'Tenant Covenant',     value: 'Strong private — 14-yr operating history, Sunshine Coast HQ' },
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
    leaseDocsFolder: '',
    tenantInsightsFolder: '',
  },

  cashflow: {
    purchasePrice: 6_500_000,
    lvr: 0.75,
    interestRate: 0.07,
    loanTermYears: 25,
    annualRent: 438_750,
    rentGrowthRate: 0.035,
    // Commercial property values track rent growth (value = NOI ÷ cap rate;
    // NOI grows with rent). Both set to rentGrowthRate for consistency.
    capitalGrowthRate: 0.035,
    year1CapitalGrowthRate: 0.035,
    expenseGrowthRate: 0.03,
    annualExpenses: 30_713,  // mgmt fee 7% × rent
    expenseBreakdown: [
      { label: 'Property Management Fee', annual: 30_713 },
    ],
    // Total cash = 30% of purchase price = $1.95M at 75% LVR.
    upfrontCosts: {
      deposit:            1_625_000, // 25% of $6.5M
      stampDuty:          272_000,   // QLD commercial transfer duty (approx)
      gst:                0,
      conveyancing:       8_000,
      buildingAndPest:    3_500,
      buildingInsurance:  0,
      titleInsurance:     0,
      totalRequired:      1_950_000, // 30% of $6.5M
    },
    equityProjection: Array.from({ length: 10 }, (_, i) => {
      const year = i + 1;
      const growth = 0.035;
      const annualRent = Math.round(438_750 * Math.pow(1 + growth, i));
      const propertyValue = Math.round(6_500_000 * Math.pow(1 + growth, i));
      const loan = 4_875_000;  // 75% of $6.5M
      const interest = loan * 0.07;
      const outgoings = Math.round(annualRent * 0.07);
      const netCashflow = annualRent - outgoings - interest;
      return {
        year,
        rentalIncome: annualRent,
        totalExpenses: outgoings + interest,
        annualCashflow: netCashflow,
        rentPerWeek: Math.round(annualRent / 52),
        propertyValue,
        netEquity: propertyValue - loan,
        netCashflow,
      };
    }),
  },

  rentalAssessment: {
    spreadsheetUrl: '',
    summary: [
      { label: 'Passing rent $/sqm',           value: '$354' },
      { label: 'Market rent $/sqm',            value: '$365' },
      { label: 'Net lettable area',            value: '1,240 sqm' },
      { label: 'Sunshine Coast CBD vacancy',   value: '5.1%' },
    ],
    comparables: {
      headers: ['Address', 'Area (sqm)', 'Rent $/sqm', 'Lease Term'],
      rows: [
        ['12 First Avenue, Maroochydore',       '880',   '$340', '5 + 5 yrs'],
        ['90 Aerodrome Road, Maroochydore',     '1,450', '$360', '7 + 5 yrs'],
        ['33 Horton Parade, Maroochydore',      '620',   '$378', '3 + 3 yrs'],
        ['5 Plaza Parade, Maroochydore',        '2,100', '$348', '10 yrs'],
      ],
    },
  },

  salesComparables: {
    summary: [
      { label: 'Market cap rate',                 value: '6.75%' },
      { label: 'Weighted Average Cap Rate',       value: '6.90%' },
      { label: '$/sqm range',                     value: '$4,600 – $5,600' },
    ],
    table: {
      headers: ['Address', 'Sale Price', '$/sqm', 'Cap Rate', 'Date'],
      rows: [
        ['80 Aerodrome Road, Maroochydore',         '$5.2M',  '$4,700', '6.85%', '2025-11'],
        ['17 First Avenue, Maroochydore',           '$3.9M',  '$4,600', '7.05%', '2025-09'],
        ['45 Maroochydore Road, Maroochydore',      '$8.4M',  '$5,300', '6.55%', '2026-01'],
        ['102 Aerodrome Road, Maroochydore',        '$6.8M',  '$5,100', '6.80%', '2025-08'],
      ],
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
      { label: 'Median Commercial Yield', value: '6.75%' },
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
