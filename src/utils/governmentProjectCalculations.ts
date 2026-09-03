import {
  GovMilestone,
  GovMilestoneStatus,
  TermDistributionSchemeDefinition,
  TermMilestoneTemplateItem,
} from '../types';

export interface MilestoneCalculationInput {
  totalContractValueIDR: number;
  whtRatePph: number; // e.g. 1.5 or 2.0
  pphType: 'PPH_22' | 'PPH_23' | 'PPH_FINAL' | 'NONE';
  vatWapuRate: number; // e.g. 11 or 12
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  terms: Array<{
    termNumber: number;
    title: string;
    percentage: number;
    targetDate?: string;
  }>;
}

/**
 * Generates an array of GovMilestones with rigorous mathematical formulation:
 * - Gross amount is computed from percentage and total contract value
 * - Any rounding discrepancy is balanced on the final milestone so that SUM(gross) === totalContractValueIDR
 * - PPh is computed per milestone: round(gross * (pphRate / 100))
 * - PPN WAPU is computed per milestone: round(gross * (vatWapuRate / 100))
 * - Net cash disbursement (Landing Bank) = gross - pphAmountIDR
 * - Target dates are interpolated proportionally between startDate and endDate
 */
export const calculateMilestonesWithFormulation = (
  input: MilestoneCalculationInput
): GovMilestone[] => {
  const { totalContractValueIDR, whtRatePph, pphType, vatWapuRate, startDate, endDate, terms } = input;
  const count = terms.length;
  if (count === 0 || totalContractValueIDR <= 0) return [];

  const startMs = new Date(startDate || Date.now()).getTime();
  const endMs = new Date(endDate || Date.now() + 90 * 86400000).getTime();
  const timeSpan = Math.max(0, endMs - startMs);

  let accumulatedGross = 0;

  return terms.map((t, idx) => {
    const isLast = idx === count - 1;
    let gross: number;

    if (isLast) {
      // Balance last milestone to guarantee exact total sum
      gross = Math.max(0, totalContractValueIDR - accumulatedGross);
    } else {
      gross = Math.round((totalContractValueIDR * (t.percentage || 0)) / 100);
      accumulatedGross += gross;
    }

    const pphAmount = pphType === 'NONE' ? 0 : Math.round((gross * (whtRatePph || 0)) / 100);
    const ppnAmount = Math.round((gross * (vatWapuRate || 0)) / 100);
    const netDisbursement = Math.max(0, gross - pphAmount);

    // Compute target date if not provided
    let termTargetDate = t.targetDate;
    if (!termTargetDate) {
      if (count === 1) {
        termTargetDate = endDate;
      } else if (idx === 0) {
        termTargetDate = startDate;
      } else if (isLast) {
        termTargetDate = endDate;
      } else {
        const fraction = (idx + 0.5) / count;
        const computedDate = new Date(startMs + timeSpan * fraction);
        termTargetDate = computedDate.toISOString().slice(0, 10);
      }
    }

    return {
      id: `gov-m-${Date.now()}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: '',
      termNumber: t.termNumber || idx + 1,
      title: t.title || `Termin ${idx + 1} (${t.percentage}%)`,
      percentage: t.percentage || (totalContractValueIDR > 0 ? Math.round((gross / totalContractValueIDR) * 100) : 0),
      grossAmountIDR: gross,
      pphType,
      pphRatePercent: whtRatePph,
      pphAmountIDR: pphAmount,
      ppnRatePercent: vatWapuRate,
      ppnAmountIDR: ppnAmount,
      netDisbursementIDR: netDisbursement,
      status: 'BELUM_DITAGIH' as GovMilestoneStatus,
      targetDate: termTargetDate,
      createdAt: new Date().toISOString(),
    };
  });
};

/**
 * Validate that a term distribution scheme's percentage sum equals 100%
 */
export const validateSchemePercentageSum = (
  terms: Array<{ percentage: number }>
): { isValid: boolean; totalPercentage: number; difference: number } => {
  const totalPercentage = terms.reduce((acc, t) => acc + (Number(t.percentage) || 0), 0);
  const roundedTotal = Math.round(totalPercentage * 100) / 100;
  const difference = Math.round((100 - roundedTotal) * 100) / 100;
  return {
    isValid: Math.abs(roundedTotal - 100) < 0.01,
    totalPercentage: roundedTotal,
    difference,
  };
};
