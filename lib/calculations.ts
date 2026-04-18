import type {
  PropertyAssumptions,
  ComputedMetrics,
  YearlyProjection,
  AustralianState,
} from './types'

// ─── Stamp Duty ───────────────────────────────────────────────────────────────
function calcNSW(p: number): number {
  if (p <= 14_000)   return p * 0.0125
  if (p <= 31_000)   return 175   + (p - 14_000) * 0.015
  if (p <= 83_000)   return 430   + (p - 31_000) * 0.0175
  if (p <= 304_000)  return 1_340 + (p - 83_000) * 0.035
  if (p <= 1_013_000)return 9_085 + (p - 304_000) * 0.045
  return 40_895 + (p - 1_013_000) * 0.055
}

function calcVIC(p: number): number {
  if (p <= 25_000)   return p * 0.014
  if (p <= 130_000)  return 350   + (p - 25_000)  * 0.024
  if (p <= 960_000)  return 2_870 + (p - 130_000) * 0.06
  if (p <= 2_000_000)return 55_000 + (p - 960_000) * 0.065
  return 110_000 + (p - 2_000_000) * 0.065
}

function calcQLD(p: number): number {
  if (p <= 5_000)    return 0
  if (p <= 75_000)   return (p - 5_000) * 0.015
  if (p <= 540_000)  return 1_050  + (p - 75_000)  * 0.035
  if (p <= 1_000_000)return 17_325 + (p - 540_000) * 0.045
  return 38_025 + (p - 1_000_000) * 0.0575
}

function calcWA(p: number): number {
  if (p <= 80_000)   return p * 0.019
  if (p <= 100_000)  return 1_520  + (p - 80_000)  * 0.0285
  if (p <= 250_000)  return 2_090  + (p - 100_000) * 0.03
  if (p <= 500_000)  return 6_590  + (p - 250_000) * 0.0415
  if (p <= 1_000_000)return 16_965 + (p - 500_000) * 0.049
  return 41_465 + (p - 1_000_000) * 0.0515
}

function calcSA(p: number): number {
  if (p <= 12_000)   return 1_000
  if (p <= 30_000)   return 1_000  + (p - 12_000)  * 0.02
  if (p <= 50_000)   return 1_360  + (p - 30_000)  * 0.03
  if (p <= 100_000)  return 1_960  + (p - 50_000)  * 0.035
  if (p <= 200_000)  return 3_710  + (p - 100_000) * 0.04
  if (p <= 250_000)  return 7_710  + (p - 200_000) * 0.0425
  if (p <= 300_000)  return 9_835  + (p - 250_000) * 0.05
  if (p <= 500_000)  return 12_335 + (p - 300_000) * 0.055
  return 23_335 + (p - 500_000) * 0.055
}

function calcACT(p: number): number {
  // ACT uses a tiered system
  if (p <= 200_000)  return p * 0.0020
  if (p <= 300_000)  return 400   + (p - 200_000) * 0.0239
  if (p <= 500_000)  return 2_790 + (p - 300_000) * 0.0321
  if (p <= 750_000)  return 9_210 + (p - 500_000) * 0.0424
  if (p <= 1_000_000)return 19_810+ (p - 750_000) * 0.0499
  return 32_285 + (p - 1_000_000) * 0.0567
}

function calcTAS(p: number): number {
  if (p <= 3_000)    return 50
  if (p <= 25_000)   return 50    + (p - 3_000)   * 0.0175
  if (p <= 75_000)   return 435   + (p - 25_000)  * 0.025
  if (p <= 200_000)  return 1_685 + (p - 75_000)  * 0.03
  if (p <= 375_000)  return 5_435 + (p - 200_000) * 0.035
  if (p <= 725_000)  return 11_560+ (p - 375_000) * 0.04
  return 25_560 + (p - 725_000) * 0.045
}

function calcNT(p: number): number {
  // NT uses duty value formula
  const d = (0.06571441 * p + 15) * p / 1_000
  return Math.max(d, 20)
}

export function calculateStampDuty(price: number, state: AustralianState): number {
  switch (state) {
    case 'NSW': return calcNSW(price)
    case 'VIC': return calcVIC(price)
    case 'QLD': return calcQLD(price)
    case 'WA':  return calcWA(price)
    case 'SA':  return calcSA(price)
    case 'ACT': return calcACT(price)
    case 'TAS': return calcTAS(price)
    case 'NT':  return calcNT(price)
    default:    return calcNSW(price)
  }
}

// ─── PMT (loan repayment) ─────────────────────────────────────────────────────
export function pmt(annualRate: number, termYears: number, principal: number): number {
  if (principal <= 0) return 0
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// Annual P&I repayment
export function annualPMT(annualRate: number, termYears: number, principal: number): number {
  return pmt(annualRate, termYears, principal) * 12
}

// Annual interest-only repayment
export function annualInterestOnly(annualRate: number, principal: number): number {
  return principal * (annualRate / 100)
}

// ─── Loan amortisation ────────────────────────────────────────────────────────
interface LoanYearResult {
  openingBalance: number
  interest: number
  principal: number
  repayment: number
  closingBalance: number
}

function loanYear(
  balance: number,
  annualRate: number,
  totalTermYears: number,
  remainingTerm: number,
  loanType: string,
  interestOnlyPeriod: number,
  yearIndex: number, // 1-based
): LoanYearResult {
  if (balance <= 0) {
    return { openingBalance: 0, interest: 0, principal: 0, repayment: 0, closingBalance: 0 }
  }

  const interest = balance * (annualRate / 100)

  // Interest-only phase
  if (yearIndex <= interestOnlyPeriod || loanType === 'IO') {
    return {
      openingBalance: balance,
      interest,
      principal: 0,
      repayment: interest,
      closingBalance: balance,
    }
  }

  // P&I phase — recalculate repayment based on remaining term
  const repayment = annualPMT(annualRate, remainingTerm, balance)
  const principal = repayment - interest

  return {
    openingBalance: balance,
    interest,
    principal: Math.max(principal, 0),
    repayment,
    closingBalance: Math.max(balance - Math.max(principal, 0), 0),
  }
}

// ─── IRR (bisection method) ───────────────────────────────────────────────────
export function irr(cashFlows: number[]): number {
  if (cashFlows.length === 0) return 0
  let low = -0.9999
  let high = 10.0

  const npv = (rate: number) =>
    cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0)

  // Check if solution exists
  if (npv(low) * npv(high) > 0) return 0

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2
    const v = npv(mid)
    if (Math.abs(v) < 0.01) return mid
    if (v > 0) low = mid
    else high = mid
  }

  return (low + high) / 2
}

// ─── Capital Gains Tax (Australian 50% discount rule) ────────────────────────
function calculateCGT(
  purchasePrice: number,
  salePrice: number,
  sellingCosts: number,
  marginalTaxRate: number,
  holdingPeriod: number,
): number {
  const costBase = purchasePrice
  const capitalGain = salePrice - sellingCosts - costBase
  if (capitalGain <= 0) return 0
  const discountedGain = holdingPeriod >= 1 ? capitalGain * 0.5 : capitalGain
  return discountedGain * (marginalTaxRate / 100)
}

// ─── Main calculation engine ──────────────────────────────────────────────────
export function calculateMetrics(a: PropertyAssumptions): ComputedMetrics {
  // ── Acquisition ──────────────────────────────────────────────────────────
  const stampDuty = calculateStampDuty(a.purchasePrice, a.state)
  const totalAcquisitionCost =
    a.purchasePrice + stampDuty + a.legalFees + a.buildingInspection + a.otherAcquisitionCosts
  const depositAmount = a.purchasePrice * (a.depositPercent / 100)
  // Loan funds total acquisition cost minus deposit
  const loanAmount = totalAcquisitionCost - depositAmount
  const lvr = (loanAmount / a.purchasePrice) * 100

  // ── Year 1 Income ─────────────────────────────────────────────────────────
  const annualGrossIncome =
    a.annualRentOverride > 0 ? a.annualRentOverride : a.weeklyRent * 52
  const vacancyLoss = annualGrossIncome * (a.vacancyRate / 100)
  const effectiveIncome = annualGrossIncome - vacancyLoss

  // ── Year 1 Expenses ───────────────────────────────────────────────────────
  const managementFees = effectiveIncome * (a.managementFeePercent / 100)
  const maintenanceCost = a.purchasePrice * (a.maintenancePercent / 100)
  const totalExpensesY1 =
    managementFees + a.insurance + a.councilRates + a.landTax +
    maintenanceCost + a.strataFees + a.otherExpenses
  const annualNetIncome = effectiveIncome - totalExpensesY1

  // ── Yields ────────────────────────────────────────────────────────────────
  const grossYield = (annualGrossIncome / a.purchasePrice) * 100
  const netYield = (annualNetIncome / a.purchasePrice) * 100
  const capitalisationRate = netYield // same number, different label for commercial

  // ── Loan repayments (Year 1) ─────────────────────────────────────────────
  const monthlyRepayment = a.loanType === 'IO' || a.interestOnlyPeriod >= 1
    ? loanAmount * (a.interestRate / 100) / 12
    : pmt(a.interestRate, a.loanTerm, loanAmount)
  const annualLoanRepayment = monthlyRepayment * 12
  const interestY1 = loanAmount * (a.interestRate / 100)
  const cashFlowBeforeTax = annualNetIncome - annualLoanRepayment

  // ── Tax (Year 1) ──────────────────────────────────────────────────────────
  const totalDepreciation = a.buildingDepreciation + a.contentsDepreciation
  const taxableIncome = annualNetIncome - interestY1 - totalDepreciation
  const taxBenefit = -(taxableIncome * (a.marginalTaxRate / 100)) // positive = refund
  const cashFlowAfterTax = cashFlowBeforeTax + taxBenefit

  // ── Year-by-year projections ──────────────────────────────────────────────
  const yearlyProjections: YearlyProjection[] = []
  let loanBalance = loanAmount
  let cumCFAT = 0
  const irrCashFlows: number[] = [-(depositAmount + a.legalFees + a.buildingInspection + a.otherAcquisitionCosts + stampDuty)]

  for (let yr = 1; yr <= a.holdingPeriod; yr++) {
    const growthFactor = Math.pow(1 + a.capitalGrowthRate / 100, yr)
    const rentGrowthFactor = Math.pow(1 + a.rentalGrowthRate / 100, yr - 1)
    const cpiGrowthFactor = Math.pow(1 + a.cpiGrowthRate / 100, yr - 1)
    const propertyValue = a.purchasePrice * growthFactor
    const wkRent = a.weeklyRent * rentGrowthFactor
    const grossInc =
      a.annualRentOverride > 0
        ? a.annualRentOverride * Math.pow(1 + a.rentalGrowthRate / 100, yr - 1)
        : wkRent * 52
    const vacancyAmt = grossInc * (a.vacancyRate / 100)
    const effInc = grossInc - vacancyAmt
    const mgmtFee = effInc * (a.managementFeePercent / 100)
    const ins = a.insurance * cpiGrowthFactor
    const rates = a.councilRates * cpiGrowthFactor
    const ltax = a.landTax * cpiGrowthFactor
    const maint = propertyValue * (a.maintenancePercent / 100)
    const str = a.strataFees * cpiGrowthFactor
    const other = a.otherExpenses * cpiGrowthFactor
    const totExp = mgmtFee + ins + rates + ltax + maint + str + other
    const noi = effInc - totExp

    // Loan year
    const remainingLoanTerm = Math.max(a.loanTerm - (yr - 1), 1)
    const ly = loanYear(
      loanBalance, a.interestRate, a.loanTerm,
      remainingLoanTerm, a.loanType, a.interestOnlyPeriod, yr,
    )
    loanBalance = ly.closingBalance

    const cfBT = noi - ly.repayment
    const taxInc = noi - ly.interest - totalDepreciation
    const txBen = -(taxInc * (a.marginalTaxRate / 100))
    const cfAT = cfBT + txBen
    cumCFAT += cfAT

    const equity = propertyValue - loanBalance

    // IRR cash flow (final year adds exit proceeds)
    let irrCF = cfAT
    if (yr === a.holdingPeriod) {
      const sellingCosts = propertyValue * (a.sellingCostsPercent / 100)
      const cgt = calculateCGT(
        a.purchasePrice, propertyValue, sellingCosts,
        a.marginalTaxRate, a.holdingPeriod,
      )
      irrCF += propertyValue - sellingCosts - cgt - loanBalance
    }
    irrCashFlows.push(irrCF)

    yearlyProjections.push({
      year: yr,
      propertyValue,
      weeklyRent: wkRent,
      annualGrossIncome: grossInc,
      vacancy: vacancyAmt,
      managementFees: mgmtFee,
      insurance: ins,
      councilRates: rates,
      landTax: ltax,
      maintenance: maint,
      strata: str,
      otherExpenses: other,
      totalExpenses: totExp,
      netOperatingIncome: noi,
      loanBalance,
      interestPayment: ly.interest,
      principalPayment: ly.principal,
      totalLoanRepayment: ly.repayment,
      cashFlowBeforeTax: cfBT,
      totalDepreciation,
      taxableIncome: taxInc,
      taxBenefit: txBen,
      cashFlowAfterTax: cfAT,
      equity,
      cumulativeCashFlowAfterTax: cumCFAT,
    })
  }

  // ── Exit metrics ──────────────────────────────────────────────────────────
  const lastYear = yearlyProjections[yearlyProjections.length - 1]
  const projectedPropertyValue = lastYear?.propertyValue ?? a.purchasePrice
  const finalLoanBalance = lastYear?.loanBalance ?? loanAmount
  const sellingCostsAmt = projectedPropertyValue * (a.sellingCostsPercent / 100)
  const totalCGT = calculateCGT(
    a.purchasePrice, projectedPropertyValue,
    sellingCostsAmt, a.marginalTaxRate, a.holdingPeriod,
  )
  const netProceedsAfterCGT = projectedPropertyValue - sellingCostsAmt - totalCGT - finalLoanBalance
  const equityAtExit = netProceedsAfterCGT

  // ── IRR ───────────────────────────────────────────────────────────────────
  const irrValue = irr(irrCashFlows) * 100

  // ── Total return on equity ────────────────────────────────────────────────
  const initialEquity = depositAmount + a.legalFees + a.buildingInspection +
    a.otherAcquisitionCosts + stampDuty
  const totalReturn = initialEquity > 0
    ? ((equityAtExit - initialEquity + cumCFAT) / initialEquity) * 100
    : 0
  const annualisedReturn = initialEquity > 0 && a.holdingPeriod > 0
    ? (Math.pow(equityAtExit / initialEquity, 1 / a.holdingPeriod) - 1) * 100
    : 0

  return {
    stampDuty,
    totalAcquisitionCost,
    depositAmount,
    loanAmount,
    lvr,
    annualGrossIncome,
    annualNetIncome,
    grossYield,
    netYield,
    capitalisationRate,
    annualLoanRepayment,
    monthlyLoanRepayment: monthlyRepayment,
    cashFlowBeforeTax,
    cashFlowAfterTax,
    monthlyCashFlowBeforeTax: cashFlowBeforeTax / 12,
    monthlyCashFlowAfterTax: cashFlowAfterTax / 12,
    irr: irrValue,
    equityAtExit,
    projectedPropertyValue,
    totalCGT,
    netProceedsAfterCGT,
    totalReturnOnEquity: totalReturn,
    annualisedReturn,
    yearlyProjections,
  }
}

// ─── Stress test scenarios ────────────────────────────────────────────────────
export function generateStressTestData(a: PropertyAssumptions) {
  const rates = [
    { label: 'Rate -1%',  delta: -1,   color: '#14B8A6' },
    { label: 'Base Rate', delta: 0,    color: '#0D9488' },
    { label: 'Rate +1%',  delta: 1,    color: '#D97706' },
    { label: 'Rate +2%',  delta: 2,    color: '#EF4444' },
    { label: 'Rate +3%',  delta: 3,    color: '#991B1B' },
  ]

  return rates.map(({ label, delta, color }) => {
    const modified: PropertyAssumptions = { ...a, interestRate: Math.max(0.1, a.interestRate + delta) }
    const m = calculateMetrics(modified)
    return {
      label, color,
      data: m.yearlyProjections.map(y => ({
        year: y.year,
        cashFlowAfterTax: y.cashFlowAfterTax,
        cashFlowBeforeTax: y.cashFlowBeforeTax,
      })),
    }
  })
}

// ─── Sensitivity grid ─────────────────────────────────────────────────────────
export function generateSensitivityGrid(
  a: PropertyAssumptions,
  metric: 'cashFlowAfterTax' | 'grossYield' | 'irr' | 'netYield',
  rowVar: 'interestRate' | 'purchasePrice' | 'weeklyRent' | 'capitalGrowthRate',
  colVar: 'interestRate' | 'purchasePrice' | 'weeklyRent' | 'capitalGrowthRate',
  rowDeltas: number[],
  colDeltas: number[],
) {
  return rowDeltas.map(rDelta => ({
    rowDelta: rDelta,
    cols: colDeltas.map(cDelta => {
      const modified: PropertyAssumptions = {
        ...a,
        [rowVar]: a[rowVar] + rDelta,
        [colVar]: a[colVar] + cDelta,
      }
      const m = calculateMetrics(modified)
      let value: number
      switch (metric) {
        case 'cashFlowAfterTax': value = m.cashFlowAfterTax; break
        case 'grossYield':       value = m.grossYield;       break
        case 'irr':              value = m.irr;              break
        case 'netYield':         value = m.netYield;         break
        default:                 value = 0
      }
      return { colDelta: cDelta, value }
    }),
  }))
}
