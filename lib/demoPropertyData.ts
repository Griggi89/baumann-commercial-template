// ─────────────────────────────────────────────────────────────────────────────
// Fully-populated in-memory PropertyData fixture for the /demo route.
// Every section of the dashboard has content so Chris (and prospective
// clients) can see what a finished commercial dashboard looks like
// without touching the Master Index or a CF sheet.
//
// Synthetic but plausible: Demo Tower, 1 Collins Street Melbourne VIC.
// Real Melbourne CBD address (the actual "1 Collins Street" is a
// landmark commercial tower), realistic cap rates, real Moreton/Sydney-
// style projects for mix. Numbers are round for readability.
// ─────────────────────────────────────────────────────────────────────────────

import type { PropertyData } from './propertyData';

export const demoPropertyData: PropertyData = {
  address: 'Demo Tower, 1 Collins Street, Melbourne VIC 3000',
  lastUpdated: '2026-04-18',
  reaLink: 'https://www.realcommercial.com.au/',

  features: {
    photos: [],
    heroImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&h=900&fit=crop',
    propertyUrl: '',
    details: [
      { label: 'Property Type',      value: 'Office (Whole Building)' },
      { label: 'Building Area (sqm)', value: '4,850' },
      { label: 'Floor Area (sqm)',   value: '4,850' },
      { label: 'Land Area (sqm)',    value: '820' },
      { label: 'Zoning',             value: 'Capital City Zone (Melbourne Planning Scheme)' },
      { label: 'Parking Spaces',     value: '28 (secure basement)' },
      { label: 'NABERS Rating',      value: '5.0 Stars Energy' },
      { label: 'Year Built',         value: '2014' },
      { label: 'Tenancy Count',      value: '1' },
    ],
  },

  tenantLease: {
    spreadsheetUrl: '',
    items: [
      { label: 'Tenant',              value: 'Demo Commercial Pty Ltd' },
      { label: 'Tenant Covenant',     value: 'ASX-200 listed' },
      { label: 'Lease Type',          value: 'Triple Net (all outgoings recovered)' },
      { label: 'Lease Start',         value: '2023-07-01' },
      { label: 'Lease Expiry',        value: '2033-06-30' },
      { label: 'WALE (yrs)',          value: '8.2' },
      { label: 'Rent Review',         value: 'Annual CPI (collar 3% / cap 5%)' },
      { label: 'Option Terms',        value: '2 × 5 years' },
      { label: 'Outgoings Recovery',  value: '100% recovered via net lease' },
    ],
    vacancyRate: '4.8% (Melbourne CBD — CY25)',
    vacancySource: 'PCA Office Market Report Jan 2026',
    leaseDocsFolder: '',
    tenantInsightsFolder: '',
  },

  cashflow: {
    purchasePrice: 12_500_000,
    lvr: 0.60,
    interestRate: 0.070,
    loanTermYears: 25,
    annualRent: 812_500,
    rentGrowthRate: 0.035,
    capitalGrowthRate: 0.08,
    year1CapitalGrowthRate: 0.10,
    expenseGrowthRate: 0.03,
    annualExpenses: 48_750, // mgmt fee 6% × rent
    expenseBreakdown: [
      { label: 'Property Management Fee', annual: 48_750 },
    ],
    upfrontCosts: {
      deposit:            5_000_000,
      stampDuty:          687_500,
      gst:                0,
      conveyancing:       12_000,
      buildingAndPest:    4_500,
      buildingInsurance:  0,
      titleInsurance:     0,
      totalRequired:      5_704_000,
    },
    equityProjection: Array.from({ length: 10 }, (_, i) => {
      const year = i + 1;
      const annualRent = Math.round(812_500 * Math.pow(1.035, i));
      const growthRate = year === 1 ? 0.10 : 0.08;
      const propertyValue = Math.round(12_500_000 * Math.pow(1.08, i) * (year === 1 ? 1.10 / 1.08 : 1));
      const loan = 7_500_000;
      const interest = loan * 0.07;
      const outgoings = Math.round(annualRent * 0.06);
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
      { label: 'Passing rent $/sqm',   value: '$520' },
      { label: 'Market rent $/sqm',    value: '$545' },
      { label: 'Net lettable area',    value: '4,850 sqm' },
      { label: 'Melbourne CBD vacancy', value: '4.8%' },
    ],
    comparables: {
      headers: ['Address', 'Area (sqm)', 'Rent $/sqm', 'Lease Term'],
      rows: [
        ['555 Collins Street L2',  '1,200', '$530', '5 + 5 yrs'],
        ['222 Exhibition Street',  '2,100', '$555', '7 + 5 yrs'],
        ['101 Collins Street L18', '900',   '$580', '3 + 3 yrs'],
        ['120 Spencer Street',     '3,400', '$515', '10 yrs'],
      ],
    },
  },

  salesComparables: {
    summary: [
      { label: 'Market cap rate',   value: '6.25%' },
      { label: 'WACR (weighted)',   value: '6.40%' },
      { label: '$/sqm range',       value: '$3,800 – $4,500' },
    ],
    table: {
      headers: ['Address', 'Sale Price', '$/sqm', 'Cap Rate', 'Date'],
      rows: [
        ['120 Collins Street',         '$11.2M', '$4,200', '6.35%', '2025-11'],
        ['350 Queen Street',           '$9.8M',  '$3,900', '6.55%', '2025-09'],
        ['600 Bourke Street (whole)',  '$14.5M', '$4,350', '6.15%', '2026-01'],
        ['80 Collins Street — S3',     '$8.5M',  '$4,100', '6.70%', '2025-08'],
      ],
    },
  },

  location: {
    lat: -37.8136,
    lng: 144.9631,
    mapBbox: '',
    distances: [
      { place: 'Melbourne CBD',          distance: '0.1 km', driveTime: '1 min',  address: 'Melbourne VIC 3000' },
      { place: 'Nearest Major Highway',  distance: '2.5 km', driveTime: '7 min',  address: 'West Gate Freeway (M1)' },
      { place: 'Flinders Street Station', distance: '0.4 km', driveTime: '2 min',  address: 'Flinders Street, Melbourne' },
      { place: 'Port of Melbourne',      distance: '5.8 km', driveTime: '14 min', address: 'Port Melbourne VIC 3207' },
      { place: 'Melbourne Airport',      distance: '22 km',  driveTime: '28 min', address: 'Melbourne Airport VIC 3045' },
      { place: 'Royal Melbourne Hospital', distance: '2.9 km', driveTime: '10 min', address: '300 Grattan Street Parkville' },
      { place: 'Port of Melbourne Industrial', distance: '6.2 km', driveTime: '16 min', address: 'Port Melbourne' },
      { place: 'University of Melbourne', distance: '3.2 km', driveTime: '11 min', address: 'Parkville VIC 3010' },
      { place: 'Emporium Melbourne',     distance: '0.6 km', driveTime: '3 min',  address: '287 Lonsdale Street Melbourne' },
    ],
  },

  government: {
    regionName: 'Melbourne CBD / Greater Melbourne',
    projects: [
      {
        title: 'Metro Tunnel',
        description: 'New 9km rail tunnel with 5 new stations under Melbourne CBD, opening 2025.',
        bullets: ['$13.5B federal + state funding', 'Stations: Anzac, Town Hall, State Library, Parkville, Arden', 'Forecast +39k daily passengers by 2031'],
        sourceUrl: 'https://metrotunnel.vic.gov.au/',
      },
      {
        title: 'Suburban Rail Loop — Stage 1',
        description: 'Underground orbital rail line connecting Cheltenham to Box Hill; first of a four-stage network.',
        bullets: ['$34.5B budget allocation', 'SRL East first, construction underway 2026+', 'Expected 70k–80k boardings/day'],
        sourceUrl: 'https://bigbuild.vic.gov.au/projects/suburban-rail-loop',
      },
      {
        title: 'West Gate Tunnel',
        description: 'New toll road linking the West Gate Freeway to the Port of Melbourne / CityLink.',
        bullets: ['$10B+ project cost', 'Opening 2026', 'Forecast 25% reduction in West Gate Bridge peak congestion'],
        sourceUrl: 'https://bigbuild.vic.gov.au/projects/west-gate-tunnel-project',
      },
      {
        title: 'North East Link',
        description: 'Missing link of Melbourne\'s freeway ring, Greensborough to the Eastern Freeway.',
        bullets: ['$16.5B construction', 'Due 2028', 'Expected 9-minute peak travel saving'],
        sourceUrl: 'https://bigbuild.vic.gov.au/projects/north-east-link-project',
      },
      {
        title: 'Docklands Revitalisation',
        description: 'Melbourne CBD waterfront precinct — public realm upgrades and mixed-use development pipeline.',
        bullets: ['$500M+ announced upgrades', 'New public park + community hub 2026–2028', 'Private development pipeline includes 5 commercial towers'],
        sourceUrl: 'https://www.melbourne.vic.gov.au/building-and-development/urban-planning/local-area-planning/Pages/docklands.aspx',
      },
    ],
  },

  population: {
    lga: 'LGA24600',
    lgaName: 'Melbourne',
    benchmarkName: 'Victoria',
    topIndustries: [
      { name: 'Professional, Scientific & Technical Services', lga: 21.8, benchmark: 9.4  },
      { name: 'Financial & Insurance Services',                lga: 15.2, benchmark: 5.1  },
      { name: 'Accommodation & Food Services',                 lga: 11.4, benchmark: 7.3  },
      { name: 'Health Care & Social Assistance',               lga: 9.1,  benchmark: 13.8 },
      { name: 'Retail Trade',                                  lga: 7.6,  benchmark: 10.2 },
    ],
    industryTakeaways: [
      'Melbourne LGA skews heavily to white-collar sectors — Professional / Financial services together are ~37% of employment vs ~15% for Victoria.',
      'Resilience to retail downturn is stronger here than state average because the employment base is services-led.',
      'Tenant demand for A-grade CBD office aligned with this mix has stayed positive through 2024-25 cycles.',
    ],
    industrySources: [
      { name: 'ABS 2021 Census QuickStats — Melbourne (C) LGA', url: 'https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA24600' },
      { name: 'PCA Melbourne Office Market Report',              url: 'https://www.propertycouncil.com.au/' },
    ],
  },

  suburbProfile: {
    summary: [
      { label: 'Commercial Vacancy Rate', value: '4.8%' },
      { label: 'Median Commercial Yield', value: '6.25%' },
      { label: 'Rent Growth (YoY)',       value: '+2.8%' },
      { label: 'Supply Pipeline',         value: '185,000 sqm (2026–28)' },
      { label: 'Absorption Rate',         value: '~42,000 sqm / yr' },
    ],
    reportFolderUrl: '',
    reportFiles: [
      { name: 'Melbourne CBD Q4 2025 Office Market Review.pdf', url: '#' },
      { name: 'Property Council Office Vacancy Jan 2026.pdf',   url: '#' },
    ],
  },

  floodChecks: {
    ddFolderUrl: '',
    checks: [
      { label: 'Tenant Insights',                 status: 'Complete', folder: 'Tenant Insights',                 folderUrl: '#', imageId: '', fileName: 'Tenant_Overview_DCPL.pdf',          type: 'pdf'   },
      { label: 'Lease Documents',                 status: 'Complete', folder: 'Lease Documents',                 folderUrl: '#', imageId: '', fileName: 'Head_Lease_Executed.pdf',           type: 'pdf'   },
      { label: 'Rental Appraisal & Sales Comps',  status: 'Complete', folder: 'Rental Appraisal & Sales Comps',  folderUrl: '#', imageId: '', fileName: 'Knight_Frank_Rental_2026.pdf',      type: 'pdf'   },
      { label: 'Suburb and Property Report',      status: 'Complete', folder: 'Suburb and Property Report',      folderUrl: '#', imageId: '', fileName: 'CBD_Office_Report_Q4_25.pdf',       type: 'pdf'   },
      { label: 'Walkthrough videos',              status: 'Pending',  folder: 'Walkthrough videos',              folderUrl: '#', imageId: '', fileName: '',                                  type: 'video' },
      { label: 'Contract and Vendor Disclosure',  status: 'Complete', folder: 'Contract and Vendor Disclosure',  folderUrl: '#', imageId: '', fileName: 'Contract_of_Sale_Executed.pdf',     type: 'pdf'   },
      { label: 'DD Checks (Easement / Insurance)', status: 'Found',   folder: 'DD Checks',                       folderUrl: '#', imageId: '', fileName: 'Title_Search_CT_Volume_2456.pdf',   type: 'pdf'   },
      { label: 'Council Planning information',    status: 'Complete', folder: 'Council Planning',                folderUrl: '#', imageId: '', fileName: 'Melbourne_Planning_Scheme.pdf',     type: 'pdf'   },
      { label: 'Cashflow Calculation',            status: 'Complete', folder: 'Cashflow Calculation',            folderUrl: '#', imageId: '', fileName: 'CF_Model_v3.xlsx',                  type: 'link'  },
    ],
    planningReport: {
      label:     'Council Planning Report',
      fileId:    '',
      fileName:  'Melbourne_Planning_Scheme_Capital_City_Zone.pdf',
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
      "What's driving Melbourne CBD demand?",
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
