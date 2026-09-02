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
