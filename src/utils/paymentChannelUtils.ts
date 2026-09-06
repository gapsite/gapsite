import { FinancialTransaction, PaymentChannelDefinition } from '../types';

/**
 * Resolves a financial transaction to a specific PaymentChannelDefinition ID.
 * If the transaction has no payment method or doesn't match any registered bank channel,
 * returns 'UNASSIGNED_OTHER'.
 */
export const resolveTransactionToChannelId = (
  t: FinancialTransaction,
  channels: PaymentChannelDefinition[]
): string => {
  if (!t || !t.paymentMethod) return 'UNASSIGNED_OTHER';
  const pm = String(t.paymentMethod).trim();
  if (!pm) return 'UNASSIGNED_OTHER';

  // 1. Exact ID match (case-sensitive)
  const exactIdMatch = channels.find((ch) => ch.id === pm);
  if (exactIdMatch) return exactIdMatch.id;

  // 2. Case-insensitive ID match
  const caseIdMatch = channels.find((ch) => ch.id.toLowerCase() === pm.toLowerCase());
  if (caseIdMatch) return caseIdMatch.id;

  const pmLower = pm.toLowerCase();

  // 3. Exact full name match (case-insensitive)
  const exactNameMatch = channels.find((ch) => ch.name && ch.name.trim().toLowerCase() === pmLower);
  if (exactNameMatch) return exactNameMatch.id;

  // 4. Exact shortName match (case-insensitive)
  const exactShortMatch = channels.find((ch) => ch.shortName && ch.shortName.trim().toLowerCase() === pmLower);
  if (exactShortMatch) return exactShortMatch.id;

  // 5. Exact digits account number match (only when >= 6 digits)
  const pmDigits = pm.replace(/[^0-9]/g, '');
  if (pmDigits.length >= 6) {
    const accMatch = channels.find((ch) => {
      const chDigits = (ch.accountNumber || '').replace(/[^0-9]/g, '');
      return chDigits.length >= 6 && chDigits === pmDigits;
    });
    if (accMatch) return accMatch.id;
  }

  return 'UNASSIGNED_OTHER';
};

/**
 * Checks whether a transaction is unassigned to any registered bank/payment channel.
 */
export const isTransactionUnassigned = (
  t: FinancialTransaction,
  channels: PaymentChannelDefinition[]
): boolean => {
  return resolveTransactionToChannelId(t, channels) === 'UNASSIGNED_OTHER';
};

/**
 * Filters a list of transactions returning only those without a matched bank channel.
 */
export const getUnassignedTransactions = (
  transactions: FinancialTransaction[],
  channels: PaymentChannelDefinition[]
): FinancialTransaction[] => {
  return (transactions || []).filter((t) => isTransactionUnassigned(t, channels));
};
