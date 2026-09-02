import { BankLoan, LoanFacilityType, LoanInstallmentScheduleItem } from '../types';

/**
 * Calculates loan amortization and schedule based on principal, annual interest rate, tenure, and facility type.
 * Supports:
 * - NON_REVOLVING: Term Loan / Cicilan Pokok & Bunga Tetap (Principal is amortized equally across tenure)
 * - REVOLVING: Rekening Koran / KMK Bergulir (Monthly payment is interest-only, principal is paid at maturity or flexible rollover)
 */
export interface LoanCalculationResult {
  facilityType: LoanFacilityType;
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: LoanInstallmentScheduleItem[];
}

export const calculateBankLoanSchedule = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  startDate: string = new Date().toISOString(),
  facilityType: LoanFacilityType = 'NON_REVOLVING'
): LoanCalculationResult => {
  const p = Math.max(0, Number(principal) || 0);
  const rate = Math.max(0, Number(annualInterestRate) || 0);
  const tenure = Math.max(1, Number(tenureMonths) || 1);
  const isRevolving = facilityType === 'REVOLVING';

  // Monthly Interest Calculation: (Principal * (Rate / 100)) / 12
  const monthlyInterest = Math.round((p * (rate / 100)) / 12);
  const totalInterest = monthlyInterest * tenure;

  let monthlyPrincipal = 0;
  let monthlyInstallment = 0;
  let totalPayment = 0;

  const schedule: LoanInstallmentScheduleItem[] = [];
  const baseDate = new Date(startDate || new Date());

  if (isRevolving) {
    // REVOLVING FACILITY (Rekening Koran / KMK Bergulir):
    // Regular monthly obligation is Interest-Only
    monthlyPrincipal = 0;
    monthlyInstallment = monthlyInterest;
    totalPayment = p + totalInterest;

    let remainingPrincipal = p;

    for (let i = 1; i <= tenure; i++) {
      const due = new Date(baseDate);
      due.setMonth(due.getMonth() + i);
      const dueDateStr = due.toISOString().slice(0, 10);

      const isLastMonth = i === tenure;
      // On regular months: interest only, 0 principal payment
      // On final month: facility maturity / renewal balloon principal payoff
      const principalPayment = isLastMonth ? remainingPrincipal : 0;
      const totalPay = isLastMonth ? remainingPrincipal + monthlyInterest : monthlyInterest;
      const endingBalance = isLastMonth ? 0 : remainingPrincipal;

      schedule.push({
        monthNumber: i,
        dueDate: dueDateStr,
        beginningBalance: remainingPrincipal,
        principalPayment,
        interestPayment: monthlyInterest,
        totalPayment: totalPay,
        endingBalance,
        isPaid: false,
        paymentType: isLastMonth ? 'BALLOON_PAYOFF' : 'INTEREST_ONLY',
        cycleNumber: Math.ceil(i / 12) || 1,
      });

      if (isLastMonth) {
        remainingPrincipal = 0;
      }
    }
  } else {
    // NON-REVOLVING FACILITY (Term Loan / Cicilan Pokok & Bunga Tetap):
    monthlyPrincipal = Math.round(p / tenure);
    monthlyInstallment = monthlyPrincipal + monthlyInterest;
    totalPayment = p + totalInterest;

    let remainingPrincipal = p;

    for (let i = 1; i <= tenure; i++) {
      const due = new Date(baseDate);
      due.setMonth(due.getMonth() + i);
      const dueDateStr = due.toISOString().slice(0, 10);

      // On last month, reconcile any rounding
      const actualPrincipal = i === tenure ? remainingPrincipal : Math.min(monthlyPrincipal, remainingPrincipal);
      const endingBalance = Math.max(0, remainingPrincipal - actualPrincipal);

      schedule.push({
        monthNumber: i,
        dueDate: dueDateStr,
        beginningBalance: remainingPrincipal,
        principalPayment: actualPrincipal,
        interestPayment: monthlyInterest,
        totalPayment: actualPrincipal + monthlyInterest,
        endingBalance,
        isPaid: false,
        paymentType: 'PRINCIPAL_AND_INTEREST',
      });

      remainingPrincipal = endingBalance;
    }
  }

  return {
    facilityType,
    principalAmount: p,
    annualInterestRate: rate,
    tenureMonths: tenure,
    monthlyPrincipal,
    monthlyInterest,
    monthlyInstallment,
    totalInterest,
    totalPayment,
    schedule,
  };
};

/**
 * Derives aggregate loan statistics across all active/historical bank loans
 */
export const calculateLoansAggregateMetrics = (loans: BankLoan[]) => {
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const paidOffLoans = loans.filter((l) => l.status === 'PAID_OFF');

  const revolvingLoans = loans.filter((l) => l.facilityType === 'REVOLVING');
  const nonRevolvingLoans = loans.filter((l) => l.facilityType === 'NON_REVOLVING' || !l.facilityType);
  const otherLoans = loans.filter((l) => l.facilityType === 'OTHER');

  const totalFacilityAmount = loans.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
  const totalActivePrincipalOutstanding = activeLoans.reduce(
    (acc, l) => acc + (l.remainingPrincipal ?? l.principalAmount ?? 0),
    0
  );
  const totalPrincipalRepaid = loans.reduce((acc, l) => acc + (l.paidPrincipal || 0), 0);
  const totalInterestPaid = loans.reduce((acc, l) => acc + (l.paidInterest || 0), 0);
  const totalMonthlyInterestObligation = activeLoans.reduce((acc, l) => acc + (l.monthlyInterest || 0), 0);
  const totalMonthlyInstallmentObligation = activeLoans.reduce((acc, l) => acc + (l.monthlyInstallment || 0), 0);

  const revolvingFacilityAmount = revolvingLoans.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
  const nonRevolvingFacilityAmount = nonRevolvingLoans.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
  const otherFacilityAmount = otherLoans.reduce((acc, l) => acc + (l.principalAmount || 0), 0);

  return {
    totalLoansCount: loans.length,
    activeLoansCount: activeLoans.length,
    paidOffLoansCount: paidOffLoans.length,
    revolvingLoansCount: revolvingLoans.length,
    nonRevolvingLoansCount: nonRevolvingLoans.length,
    otherLoansCount: otherLoans.length,
    revolvingFacilityAmount,
    nonRevolvingFacilityAmount,
    otherFacilityAmount,
    totalFacilityAmount,
    totalActivePrincipalOutstanding,
    totalPrincipalRepaid,
    totalInterestPaid,
    totalMonthlyInterestObligation,
    totalMonthlyInstallmentObligation,
  };
};

/**
 * Maturity & Renewal information for a bank loan
 */
export interface LoanMaturityInfo {
  maturityDate: string;
  isPastMaturity: boolean;
  isNearMaturity: boolean; // within 45 days of maturity
  daysRemaining: number;
  monthsElapsed: number;
  totalMonths: number;
  currentCycle: number;
  isEligibleForRenewal: boolean;
}

export const getLoanMaturityInfo = (loan: BankLoan): LoanMaturityInfo => {
  const schedule = loan.schedule || [];
  const totalMonths = loan.tenureMonths || 12;
  const lastScheduleItem = schedule[schedule.length - 1];

  let maturityDateStr = lastScheduleItem?.dueDate;
  if (!maturityDateStr) {
    const base = new Date(loan.startDate || new Date());
    base.setMonth(base.getMonth() + totalMonths);
    maturityDateStr = base.toISOString().slice(0, 10);
  }

  const now = new Date();
  const matDate = new Date(maturityDateStr);
  const diffTime = matDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const paidCount = schedule.filter((s) => s.isPaid).length;
  const isPastMaturity = daysRemaining <= 0 || (paidCount >= totalMonths && loan.status === 'ACTIVE');
  const isNearMaturity = daysRemaining > 0 && daysRemaining <= 45;

  const currentCycle = Math.ceil(totalMonths / 12) || 1;
  const isEligibleForRenewal = (loan.facilityType === 'REVOLVING' || !loan.facilityType) && loan.status === 'ACTIVE';

  return {
    maturityDate: maturityDateStr,
    isPastMaturity,
    isNearMaturity,
    daysRemaining,
    monthsElapsed: paidCount,
    totalMonths,
    currentCycle,
    isEligibleForRenewal,
  };
};

/**
 * Extends / rolls over a revolving credit facility (KMK) by adding additional tenure months (default 12)
 * Converts prior balloon principal payoff into standard interest-only and appends the new cycle schedule.
 */
export const generateRevolvingRenewalSchedule = (
  loan: BankLoan,
  tenureMonthsAdded: number = 12,
  newPrincipal: number = loan.remainingPrincipal ?? loan.principalAmount,
  newAnnualInterestRate: number = loan.annualInterestRate,
  renewalDateStr: string = new Date().toISOString().slice(0, 10),
  renewalRecordId?: string
) => {
  const existingSchedule: LoanInstallmentScheduleItem[] = (loan.schedule || []).map((item) => {
    // If this item was previously marked as BALLOON_PAYOFF, convert it to INTEREST_ONLY
    // because the principal is being rolled over into the new period
    if (item.paymentType === 'BALLOON_PAYOFF') {
      return {
        ...item,
        paymentType: 'INTEREST_ONLY',
        principalPayment: 0,
        totalPayment: item.interestPayment,
        endingBalance: newPrincipal,
      };
    }
    return { ...item };
  });

  const existingCount = existingSchedule.length;
  const newTenureTotal = existingCount + tenureMonthsAdded;
  const newMonthlyInterest = Math.round((newPrincipal * (newAnnualInterestRate / 100)) / 12);

  // Determine base date for continuing schedule
  let lastDueDate = existingSchedule[existingCount - 1]?.dueDate;
  let baseDate: Date;
  if (lastDueDate) {
    baseDate = new Date(lastDueDate);
  } else {
    baseDate = new Date(renewalDateStr || new Date());
  }

  const newScheduleItems: LoanInstallmentScheduleItem[] = [];

  for (let step = 1; step <= tenureMonthsAdded; step++) {
    const monthNum = existingCount + step;
    const due = new Date(baseDate);
    due.setMonth(due.getMonth() + step);
    const dueDateStr = due.toISOString().slice(0, 10);

    const isFinalMonth = step === tenureMonthsAdded;
    const principalPayment = isFinalMonth ? newPrincipal : 0;
    const endingBalance = isFinalMonth ? 0 : newPrincipal;
    const totalPayment = isFinalMonth ? newPrincipal + newMonthlyInterest : newMonthlyInterest;

    newScheduleItems.push({
      monthNumber: monthNum,
      dueDate: dueDateStr,
      beginningBalance: newPrincipal,
      principalPayment,
      interestPayment: newMonthlyInterest,
      totalPayment,
      endingBalance,
      isPaid: false,
      paymentType: isFinalMonth ? 'BALLOON_PAYOFF' : 'INTEREST_ONLY',
      cycleNumber: Math.ceil(monthNum / 12) || 2,
      renewalId: renewalRecordId,
    });
  }

  const fullSchedule = [...existingSchedule, ...newScheduleItems];
  const totalInterest = fullSchedule.reduce((acc, s) => acc + (s.interestPayment || 0), 0);
  const totalPayment = newPrincipal + totalInterest;

  const newMaturityDate = newScheduleItems[newScheduleItems.length - 1]?.dueDate || '';

  return {
    fullSchedule,
    newTenureTotal,
    newMonthlyInterest,
    totalInterest,
    totalPayment,
    newMaturityDate,
  };
};
