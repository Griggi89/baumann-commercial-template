// ─────────────────────────────────────────────────────────────────────────────
// Baumann Commercial Dashboard — Property Data Type + Defaults
// ─────────────────────────────────────────────────────────────────────────────
// Retains the residential field names for drop-in section compatibility,
// and layers commercial-specific fields on top (rentalAssessment,
// salesComparables, suburbProfile, driveRepo, commercial lease terms).
// ─────────────────────────────────────────────────────────────────────────────

export interface PropertyData {
  address: string;
  lastUpdated: string;
  reaLink: string;           // residential-compat: also used for commercial listing link

  features: {
    photos: string[];
    heroImage: string;
    propertyUrl: string;
    details: { label: string; value: string }[];
  };

  tenantLease: {
    spreadsheetUrl: string;
    items: { label: string; value: string }[];
    vacancyRate: string;
    vacancySource: string;
    // Commercial-specific:
    leaseDocsFolder: string;
    tenantInsightsFolder: string;
  };

  cashflow: {
    purchasePrice: number;
    lvr: number;
    interestRate: number;
    loanTermYears: number;
    annualRent: number;              // commercial: net annual rent
    rentGrowthRate: number;
    capitalGrowthRate: number;
    year1CapitalGrowthRate: number;
    expenseGrowthRate: number;
    annualExpenses: number;          // commercial: annual outgoings (if any to landlord)
    // % of net cashflow diverted to principal paydown (0..1). Commercial
    // CF Calc default = 1.0 (all positive CF pays down loan; negative CF
    // capitalises back onto the loan).
    debtReductionPct: number;
    expenseBreakdown: { label: string; annual: number }[];
    upfrontCosts: {
      deposit: number;
      stampDuty: number;
      gst: number;                   // commercial-specific
      conveyancing: number;
      buildingAndPest: number;
      valuation: number;             // commercial-specific — lender-required valuation
      buildingInsurance: number;
      titleInsurance: number;
      totalRequired: number;
    };
    equityProjection: {
      year: number;
      rentalIncome: number;
      totalExpenses: number;
      annualCashflow: number;
      rentPerWeek: number;
      propertyValue: number;
      netEquity: number;
      netCashflow: number;
      // Amortization detail (matches the CF Calc 10-yr projection rows)
      yearlyYield: number;           // rent ÷ purchase price (decimal)
      interestPaid: number;          // annual interest $ at start-of-year balance
      principalPaid: number;         // netCashflow × debtReductionPct (can be negative)
      principalRemaining: number;    // loan balance at start of year
      cashOnCash: number;            // netCashflow ÷ total cash required (decimal)
    }[];
  };

  // Commercial-specific
  rentalAssessment: {
    spreadsheetUrl: string;
    summary: { label: string; value: string }[];
    comparables: { headers: string[]; rows: string[][] };
  };

  // Commercial-specific
  salesComparables: {
    summary: { label: string; value: string }[];
    table: { headers: string[]; rows: string[][] };
  };

  location: {
    lat: number;
    lng: number;
    mapBbox: string;
    distances: { place: string; distance: string; driveTime?: string; address?: string }[];
  };

  government: {
    regionName: string;
    projects: { title: string; description: string; bullets: string[]; sourceUrl: string }[];
  };

  population: {
    lga: string;
    lgaName: string;
    benchmarkName: string;
    topIndustries: { name: string; lga: number; benchmark: number }[];
    industryTakeaways: string[];
    industrySources: { name: string; url: string }[];
  };

  suburbProfile: {
    summary: { label: string; value: string }[];
    reportFolderUrl: string;
    reportFiles: { name: string; url: string }[];
  };

  // Keep name "floodChecks" for residential section-component compat;
  // for commercial we repurpose it as "DD Checks" which maps to the DD tab.
  floodChecks: {
    ddFolderUrl: string;
    checks: {
      label: string;
      status: string;
      folder: string;
      folderUrl: string;
      imageId: string;
      fileName: string;
      type: 'image' | 'pdf' | 'video' | 'link' | 'doc';
    }[];
    planningReport: {
      label: string;
      fileId: string;
      fileName: string;
      folderUrl: string;
    };
  };

  dueDiligence: {
    folderUrl: string;
    subfolders: string[];
  };

  // Commercial: flat list of top-level subfolders for the Drive Repo section
  driveRepo: {
    folderUrl: string;
    subfolders: { name: string; url: string }[];
  };

  askClaude: {
    suggestedQuestions: string[];
  };

  about: {
    name: string;
    title: string;
    email: string;
    phone: string;
    photo: string;
  };
}

export const defaultPropertyData: PropertyData = {
  address: '',
  lastUpdated: '',
  reaLink: '',

  features: { photos: [], heroImage: '', propertyUrl: '', details: [] },

  tenantLease: {
    spreadsheetUrl: '',
    items: [],
    vacancyRate: '',
    vacancySource: '',
    leaseDocsFolder: '',
    tenantInsightsFolder: '',
  },

  cashflow: {
    purchasePrice: 0,
    lvr: 0,
    interestRate: 0,
    loanTermYears: 0,
    annualRent: 0,
    rentGrowthRate: 0,
    capitalGrowthRate: 0,
    year1CapitalGrowthRate: 0,
    expenseGrowthRate: 0,
    annualExpenses: 0,
    debtReductionPct: 1,
    expenseBreakdown: [],
    upfrontCosts: {
      deposit: 0, stampDuty: 0, gst: 0, conveyancing: 0,
      buildingAndPest: 0, valuation: 0, buildingInsurance: 0, titleInsurance: 0, totalRequired: 0,
    },
    equityProjection: [],
  },

  rentalAssessment: {
    spreadsheetUrl: '',
    summary: [],
    comparables: { headers: [], rows: [] },
  },

  salesComparables: {
    summary: [],
    table: { headers: [], rows: [] },
  },

  location: { lat: 0, lng: 0, mapBbox: '', distances: [] },
  government: { regionName: '', projects: [] },
  population: {
    lga: '', lgaName: '', benchmarkName: '',
    topIndustries: [], industryTakeaways: [], industrySources: [],
  },
  suburbProfile: { summary: [], reportFolderUrl: '', reportFiles: [] },
  floodChecks: {
    ddFolderUrl: '',
    checks: [],
    planningReport: { label: 'Council Planning Report', fileId: '', fileName: '', folderUrl: '' },
  },
  dueDiligence: { folderUrl: '', subfolders: [] },
  driveRepo:    { folderUrl: '', subfolders: [] },
  askClaude:    { suggestedQuestions: [] },
  about: {
    name: 'Christian Baumann',
    title: 'Director & Qualified Property Investment Advisor',
    email: 'christian@baumannproperty.com.au',
    phone: '',
    photo: 'https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/686defd2d19a7867809d5c3e_Profile%20Picture%20Christian%20Baumann%20(2).jpg',
  },
};

export const propertyData = defaultPropertyData;
