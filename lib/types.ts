// ─── Core Enums & Literals ────────────────────────────────────────────────────
export type PropertyType = 'residential' | 'commercial' | 'mixed'
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'ACT' | 'TAS' | 'NT'
export type LoanType = 'P&I' | 'IO'
export type NavSection = 'overview' | 'financials' | 'cashflow' | 'risk' | 'reports'

// ─── User-editable Assumptions ───────────────────────────────────────────────
export interface PropertyAssumptions {
  // Property identity
  propertyName: string
  propertyAddress: string
  propertyType: PropertyType
  state: AustralianState
  propertyDescription: string

  // Acquisition costs
  purchasePrice: number        // $
  legalFees: number            // $
  buildingInspection: number   // $
  otherAcquisitionCosts: number // $

  // Financing
  depositPercent: number       // e.g. 20 = 20%
  interestRate: number         // e.g. 6.5 = 6.5% p.a.
  loanTerm: number             // years
  loanType: LoanType
  interestOnlyPeriod: number   // years (0 = P&I from start)

  // Income
  weeklyRent: number           // $ per week (residential) or converted from annual
  annualRentOverride: number   // $ (commercial — if non-zero, overrides weeklyRent * 52)
  vacancyRate: number          // e.g. 2 = 2%
  rentalGrowthRate: number     // % p.a.

  // Operating Expenses (annual $)
  managementFeePercent: number // % of gross income
  insurance: number
  councilRates: number
  landTax: number
  maintenancePercent: number   // % of property value p.a.
  strataFees: number
  otherExpenses: number

  // Tax & Depreciation
  marginalTaxRate: number      // e.g. 37 = 37%
  buildingDepreciation: number // $ p.a.
  contentsDepreciation: number // $ p.a.

  // Growth assumptions
  capitalGrowthRate: number    // % p.a.
  cpiGrowthRate: number        // % p.a. (expense indexing)

  // Holding & exit
  holdingPeriod: number        // years
  sellingCostsPercent: number  // % of sale price
}

// ─── Year-by-year Projection ─────────────────────────────────────────────────
export interface YearlyProjection {
  year: number
  propertyValue: number
  weeklyRent: number
  annualGrossIncome: number
  vacancy: number
  managementFees: number
  insurance: number
  councilRates: number
  landTax: number
  maintenance: number
  strata: number
  otherExpenses: number
  totalExpenses: number
  netOperatingIncome: number    // Gross income - expenses (pre-financing)
  loanBalance: number
  interestPayment: number
  principalPayment: number
  totalLoanRepayment: number
  cashFlowBeforeTax: number     // NOI - total loan repayment
  totalDepreciation: number
  taxableIncome: number         // NOI - interest - depreciation
  taxBenefit: number            // positive = refund, negative = tax owed
  cashFlowAfterTax: number
  equity: number                // propertyValue - loanBalance
  cumulativeCashFlowAfterTax: number
}

// ─── Computed Top-level Metrics ───────────────────────────────────────────────
export interface ComputedMetrics {
  // Acquisition
  stampDuty: number
  totalAcquisitionCost: number
  depositAmount: number
  loanAmount: number
  lvr: number                   // %

  // Yield (Year 1)
  annualGrossIncome: number
  annualNetIncome: number       // gross income - expenses (no financing)
  grossYield: number            // %
  netYield: number              // %
  capitalisationRate: number    // % (same as net yield, used for commercial label)

  // Debt service (Year 1)
  annualLoanRepayment: number
  monthlyLoanRepayment: number

  // Cash flow (Year 1, annualised)
  cashFlowBeforeTax: number
  cashFlowAfterTax: number
  monthlyCashFlowBeforeTax: number
  monthlyCashFlowAfterTax: number

  // Returns over holding period
  irr: number                   // %
  equityAtExit: number
  projectedPropertyValue: number
  totalCGT: number
  netProceedsAfterCGT: number
  totalReturnOnEquity: number   // %
  annualisedReturn: number      // %

  // Full projections
  yearlyProjections: YearlyProjection[]
}

// ─── Sensitivity Analysis ─────────────────────────────────────────────────────
export interface SensitivityCell {
  row: number    // e.g. interest rate variation
  col: number    // e.g. rental income variation
  value: number  // result metric value
}

export interface ScenarioResult {
  name: string
  interestRate: number
  grossYield: number
  cashFlowAfterTax: number
  irr: number
  equityAtExit: number
}
