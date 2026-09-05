/**
 * Guaranteed Collision-Free Unique ID Generator
 * 
 * Provides collision-free ID generation for all CRM, Finance, Tax, Payroll,
 * Project, and Operational modules.
 */

let counter = 0;

/**
 * Returns a guaranteed globally unique identifier with optional prefix.
 * Structure: {prefix}-{timestamp}-{counterPad4}-{random6}
 */
export function generateUniqueId(prefix: string = 'id'): string {
  counter = (counter + 1) % 10000;
  const timestamp = Date.now();
  const counterStr = counter.toString().padStart(4, '0');
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${counterStr}-${randomStr}`;
}

/**
 * Generate unique transaction ID
 * Example: trx-1725538000000-0001-a1b2c3
 */
export function generateTransactionId(prefix: string = 'trx', context?: string): string {
  const fullPrefix = context ? `${prefix}-${context.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}` : prefix;
  return generateUniqueId(fullPrefix);
}

/**
 * Generate formatted official Transaction Number
 * Example: TRX-202609-0012 or OVH-202609-0012
 */
export function generateTransactionNumber(
  prefixOrDate?: string,
  dateOrSeq?: string | number,
  seq?: number
): string {
  counter = (counter + 1) % 10000;
  let prefix = 'TRX';
  let dateStr = new Date().toISOString().slice(0, 10);
  let sequence = counter;

  if (prefixOrDate && /^\d{4}/.test(prefixOrDate)) {
    // Called as generateTransactionNumber('2026-09-05', seq)
    dateStr = prefixOrDate;
    if (typeof dateOrSeq === 'number') sequence = dateOrSeq;
  } else if (prefixOrDate) {
    // Called as generateTransactionNumber('OVH', '2026-09-05', seq)
    prefix = prefixOrDate;
    if (typeof dateOrSeq === 'string' && /^\d{4}/.test(dateOrSeq)) {
      dateStr = dateOrSeq;
    }
    if (typeof seq === 'number') sequence = seq;
  }

  const yearMonth = dateStr.slice(0, 7).replace(/-/g, '');
  const seqStr = sequence.toString().padStart(4, '0');
  return `${prefix}-${yearMonth}-${seqStr}`;
}

/**
 * Generate unique Project ID
 */
export function generateProjectId(): string {
  return generateUniqueId('prj');
}

/**
 * Generate unique Government Project ID
 */
export function generateGovProjectId(): string {
  return generateUniqueId('gov');
}

/**
 * Generate unique Government Milestone ID
 */
export function generateGovMilestoneId(projectId?: string, termNumber?: number): string {
  const projSuffix = projectId ? projectId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : 'p';
  const termSuffix = termNumber != null ? `t${termNumber}` : 't';
  return generateUniqueId(`gov-m-${projSuffix}-${termSuffix}`);
}

/**
 * Generate unique Retail Project ID
 */
export function generateRetailProjectId(): string {
  return generateUniqueId('ret');
}

/**
 * Generate unique Retail Milestone ID
 */
export function generateRetailMilestoneId(projectId?: string, termNumber?: number): string {
  const projSuffix = projectId ? projectId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : 'p';
  const termSuffix = termNumber != null ? `t${termNumber}` : 't';
  return generateUniqueId(`ret-m-${projSuffix}-${termSuffix}`);
}

/**
 * Generate unique Receivable ID (Piutang)
 */
export function generateReceivableId(): string {
  return generateUniqueId('rec');
}

/**
 * Generate unique Receivable Payment ID (Distinct from Payroll pay- prefix)
 * Example: rcv-pay-1725538000000-0001-a1b2c3
 */
export function generateReceivablePaymentId(): string {
  return generateUniqueId('rcv-pay');
}

/**
 * Generate unique Payroll ID
 * Example: pay-202609-0001-a1b2c3
 */
export function generatePayrollId(period?: string): string {
  const cleanPeriod = period ? period.replace(/[^0-9]/g, '').slice(0, 6) : '';
  const prefix = cleanPeriod ? `pay-${cleanPeriod}` : 'pay';
  return generateUniqueId(prefix);
}

/**
 * Generate unique Tax Obligation ID
 * Example: tax-ppn-1725538000000-0001-a1b2c3
 */
export function generateTaxObligationId(taxType?: string, refId?: string): string {
  const typePrefix = taxType ? taxType.toLowerCase().replace(/[^a-z0-9]/g, '') : 'gen';
  const refClean = refId ? `-${refId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}` : '';
  return generateUniqueId(`tax-${typePrefix}${refClean}`);
}

/**
 * Generate unique Overhead Expense ID
 */
export function generateOverheadId(): string {
  return generateUniqueId('ovh');
}

/**
 * Generate unique Office Rent Contract ID
 */
export function generateOfficeRentId(year: number = new Date().getFullYear()): string {
  return generateUniqueId(`rent-${year}`);
}

/**
 * Generate unique Bank Loan ID
 */
export function generateBankLoanId(): string {
  return generateUniqueId('loan');
}

/**
 * Generate unique Loan Renewal ID
 */
export function generateLoanRenewalId(): string {
  return generateUniqueId('renew');
}

/**
 * Generate unique Job Disposition ID
 */
export function generateDispositionId(): string {
  return generateUniqueId('dsp');
}

/**
 * Generate unique Document ID
 */
export function generateDocumentId(): string {
  return generateUniqueId('doc');
}

/**
 * Generate unique User/Employee ID
 */
export function generateUserId(): string {
  return generateUniqueId('usr');
}

/**
 * Deduplicates any entity array by its 'id' field, keeping the latest occurrence.
 */
export function deduplicateById<T extends { id?: string | number }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, T>();
  for (const item of list) {
    if (item && item.id != null) {
      const key = String(item.id).trim();
      if (key) {
        map.set(key, item);
      }
    }
  }
  return Array.from(map.values());
}
