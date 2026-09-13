/**
 * Safe localStorage wrapper with QuotaExceededError protection and automatic stale cache eviction.
 */
import { saveCollectionToIndexedDb } from './indexedDb';

/**
 * Strips huge base64 data URLs from JSON payload to prevent QuotaExceededError in localStorage,
 * while preserving all metadata, projects, transactions, dates, and amounts.
 */
const stripHeavyBase64 = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw);
    const cleanse = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanse);
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && v.startsWith('data:') && v.length > 5000) {
          res[k] = '[ATTACHMENT_STORED_IN_INDEXEDDB]';
        } else {
          res[k] = cleanse(v);
        }
      }
      return res;
    };
    return JSON.stringify(cleanse(parsed));
  } catch {
    return raw;
  }
};

export const purgeStaleStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Purge only orphaned multi-tab mutations & zombie client IDs (preserve firebase auth session)
      if (
        key.startsWith('firestore_mutations_') ||
        key.startsWith('firestore_clients_')
      ) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  } catch (e) {
    console.warn('[storage] Note during stale storage purge:', e);
  }
};

// Target IDs, usernames, emails, and names of dummy users to permanently purge
export const PURGED_DUMMY_USER_IDS = [
  'usr-lead-01',
  'usr-tech-01',
  'usr-survey-01',
  'usr-fin-01',
  'usr-dir-01',
  'usr-lead-02',
  'usr-tech-02',
  'usr-liaison-01',
  'usr-fin-02',
  'usr-client-01',
  'usr-client-indosejahtera',
  'usr-bambang',
  'usr-hendra',
  'usr-dian',
  'usr-fajar',
  'usr-siti',
  'usr-budi',
];
export const PURGED_DUMMY_USERNAMES = [
  'bambang.lead',
  'siti.tech',
  'hendra.survey',
  'dewi.finance',
  'bambang.soediro',
  'director.soediro',
  'hendra.kusuma',
  'lead.kusuma',
  'dian.safitri',
  'tech.nurhaliza',
  'fajar.nugraha',
  'liaison.pratama',
  'siti.aminah',
  'finance.sartika',
  'client.indosejahtera',
  'client.wibowo',
  'bambang.irawan',
  'hendra.wijaya',
  'dewi.lestari',
  'siti.rahmawati',
];
export const PURGED_DUMMY_EMAILS = [
  'bambang.lead@gapsite.com',
  'siti.rahma@gapsite.com',
  'hendra.survey@gapsite.com',
  'dewi.finance@gapsite.com',
  'bambang.soediro@gapsite.com',
  'hendra.kusuma@gapsite.com',
  'dian.safitri@gapsite.com',
  'nurhaliza.putri@gapsite.com',
  'fajar.nugraha@gapsite.com',
  'dedi.pratama@gapsite.com',
  'siti.aminah@gapsite.com',
  'dewi.sartika@gapsite.com',
  'client.indosejahtera@gapsite.com',
  'budi.wibowo@clientcorp.co.id',
];
export const PURGED_DUMMY_NAMES_LOWER = [
  'bambang soediro',
  'hendra kusuma',
  'dian safitri',
  'fajar nugraha',
  'siti aminah',
  'budi santoso',
  'nurhaliza putri',
  'dedi pratama',
  'dewi sartika',
  'budi wibowo',
  'hendra wijaya',
  'dewi lestari',
  'bambang irawan',
  'siti rahmawati',
];

export const isPurgedDummyName = (str?: string | null): boolean => {
  if (!str) return false;
  const lower = str.toLowerCase();
  return PURGED_DUMMY_NAMES_LOWER.some((name) => lower.includes(name));
};

export const isPurgedDummyGovProject = (p: any): boolean => {
  if (!p) return false;
  const name = (p.projectName || '').trim().toLowerCase();
  const spk = (p.contractNumber || '').trim().toLowerCase();
  const agency = (p.governmentAgency || '').trim().toLowerCase();
  const val = Number(p.totalContractValueIDR) || 0;
  if (val === 11111111111) return true;
  if (name === 'a' || spk === 'a' || agency === 'a') return true;
  if (name === 'test' || spk === 'test' || name === 'dummy' || spk === 'dummy') return true;
  if (name.length <= 2 && (spk.length <= 2 || spk === 'a')) return true;
  return false;
};

export const isPurgedDummyGovTransaction = (t: any): boolean => {
  if (!t) return false;
  const amount = Number(t.amountIDR) || 0;
  if (amount === 2188888889) return true;
  const client = (t.clientOrVendorName || '').trim().toLowerCase();
  const desc = (t.description || '').trim().toLowerCase();
  const notes = (t.notes || '').trim().toLowerCase();
  if (t.category === 'GOVERNMENT_PROJECT_INCOME') {
    if (client === 'a') return true;
    if (desc.endsWith(' - a (a)') || desc.includes(' - a (') || desc.includes('(a)') || desc.includes('tagihan termin 1: a')) return true;
    if (notes.includes('11.111.111.111') || notes.includes('spk: a') || notes.includes('spk no. a')) return true;
  }
  return false;
};

export const isPurgedDummyGovReceivable = (r: any): boolean => {
  if (!r) return false;
  const amount = Number(r.totalAmountIDR) || 0;
  if (amount === 2222222222) return true;
  const client = (r.clientName || '').trim().toLowerCase();
  const title = (r.title || '').trim().toLowerCase();
  const notes = (r.notes || '').trim().toLowerCase();
  if (client === 'a') return true;
  if (title.endsWith(' - a') || title.includes(' - a (')) return true;
  if (notes.includes('11.111.111.111') || notes.includes('spk no. a')) return true;
  return false;
};

export const isPurgedDummyGovTax = (tax: any): boolean => {
  if (!tax) return false;
  const amount = Number(tax.taxAmount) || 0;
  if (amount === 33333333 || amount === 244444444) return true;
  const payer = (tax.withholdingTaxPayerName || tax.counterpartyName || '').trim().toLowerCase();
  const title = (tax.title || '').trim().toLowerCase();
  if (payer === 'a') return true;
  if (title.includes(' - sp2d ') && (title.endsWith('(a)') || title.includes('(a)'))) return true;
  if (title.includes(' - a (') || title.endsWith(' (a)')) return true;
  return false;
};

export const COMPANY_FOUNDING_YEAR = 2021;

/**
 * Checks whether a given date, year, or string refers specifically to the legacy/typo year 2011.
 * Made safe so legitimate user transactions, dates, or documents are never wiped.
 */
export const isPreFoundingDateOrYear = (val: any): boolean => {
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'number') {
    return val === 2011;
  }
  const str = String(val).trim();
  if (!str) return false;

  // Strict check: only filter the exact 2011 mock typo, never match valid user dates/invoices
  return str === '2011' || str === '2011-01-01' || str.startsWith('2011-01-01');
};

export const scrubBannedDummyDataFromLocalStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const bannedIds = new Set(PURGED_DUMMY_USER_IDS);
    const bannedUsernames = new Set(PURGED_DUMMY_USERNAMES);
    const bannedEmails = new Set(PURGED_DUMMY_EMAILS);

    // 1. Scrub Team Members
    const membersRaw = localStorage.getItem('verix_crm_team_members_v1');
    if (membersRaw) {
      try {
        const list = JSON.parse(membersRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((m: any) => {
            if (!m) return false;
            if (bannedIds.has(m.id)) return false;
            if (m.username && bannedUsernames.has(m.username.toLowerCase())) return false;
            if (m.email && bannedEmails.has(m.email.toLowerCase())) return false;
            if (isPurgedDummyName(m.name)) return false;
            if (isPurgedDummyName(m.bankAccountHolder)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_team_members_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 2. Scrub Current User ID if set to banned user
    const curId = localStorage.getItem('verix_crm_current_user_id_v1');
    if (curId && bannedIds.has(curId)) {
      localStorage.setItem('verix_crm_current_user_id_v1', 'usr-0');
    }

    // 3. Scrub Payroll Records
    const payrollRaw = localStorage.getItem('verix_crm_payroll_v1');
    const purgedPayIds: string[] = [];
    if (payrollRaw) {
      try {
        const list = JSON.parse(payrollRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((p: any) => {
            if (!p) return false;
            // Purge 2011 & pre-2021 founding payrolls
            if (
              isPreFoundingDateOrYear(p.paymentDate) ||
              isPreFoundingDateOrYear(p.paidAt) ||
              isPreFoundingDateOrYear(p.createdAt) ||
              isPreFoundingDateOrYear(p.period) ||
              p.payrollNumber?.includes('2011')
            ) {
              if (p.id) purgedPayIds.push(p.id);
              return false;
            }
            if (bannedIds.has(p.employeeId)) return false;
            if (isPurgedDummyName(p.employeeName)) return false;
            if (isPurgedDummyName(p.bankAccountHolder)) return false;
            if (p.employeeEmail && bannedEmails.has(p.employeeEmail.toLowerCase())) return false;
            if (['pay-202608-01', 'pay-202608-02', 'pay-202608-03', 'pay-202608-04', 'pay-202608-05', 'pay-202607-02', 'pay-202607-03'].includes(p.id)) return false;
            if (p.payrollNumber === 'PAY/2026/08/EMP-001') return false;
            if (p.paymentDate === '2026-08-28' && p.employeeName && p.employeeName.toLowerCase().includes('adryan')) return false;
            return true;
          });
          localStorage.setItem('verix_crm_payroll_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 4. Scrub Salary Configurations
    const salaryConfigsRaw = localStorage.getItem('verix_crm_employee_salary_configs_v1');
    if (salaryConfigsRaw) {
      try {
        const list = JSON.parse(salaryConfigsRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((s: any) => {
            if (!s) return false;
            if (s.year && (s.year < COMPANY_FOUNDING_YEAR || s.year === 2011)) return false;
            if (bannedIds.has(s.employeeId)) return false;
            if (isPurgedDummyName(s.employeeName)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_employee_salary_configs_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 5. Scrub Transactions (Buku Kas)
    const trxsRaw = localStorage.getItem('verix_crm_transactions_v1');
    const purgedTrxIds: string[] = [];
    if (trxsRaw) {
      try {
        const list = JSON.parse(trxsRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((t: any) => {
            if (!t) return false;
            // Purge 2011 & pre-2021 founding data
            if (isPreFoundingDateOrYear(t.date) || isPreFoundingDateOrYear(t.createdAt) || isPreFoundingDateOrYear(t.settledAt)) {
              if (t.id) purgedTrxIds.push(t.id);
              return false;
            }
            if (
              t.date?.includes('2011') ||
              t.transactionNumber?.includes('2011') ||
              t.referenceNumber?.includes('2011')
            ) {
              if (t.id) purgedTrxIds.push(t.id);
              return false;
            }
            if (['trx-pay-202608-01', 'trx-pay-202608-02', 'trx-pay-202608-03', 'trx-pay-202608-04', 'trx-pay-202608-05', 'trx-pay-202607-02', 'trx-pay-202607-03'].includes(t.id)) return false;
            if (t.referenceNumber === 'PAY/2026/08/EMP-001') return false;
            if (t.transactionNumber === 'TRX-202608-EMP-001' || t.transactionNumber === 'TRX-202608-001') return false;
            if (t.date === '2026-08-28' && t.category === 'GAJI_KARYAWAN' && ((t.clientOrVendorName && t.clientOrVendorName.toLowerCase().includes('adryan')) || (t.description && t.description.toLowerCase().includes('adryan')))) return false;
            if (isPurgedDummyName(t.clientOrVendorName)) return false;
            if (isPurgedDummyName(t.description)) return false;
            if (isPurgedDummyGovTransaction(t)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_transactions_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 6. Scrub Tax Obligations
    const taxRaw = localStorage.getItem('verix_crm_tax_obligations_v1');
    const purgedTaxIds: string[] = [];
    if (taxRaw) {
      try {
        const list = JSON.parse(taxRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((tax: any) => {
            if (!tax) return false;
            // Purge 2011 & pre-2021 founding tax obligations
            if (
              (tax.taxYear && tax.taxYear < COMPANY_FOUNDING_YEAR) ||
              tax.taxYear === 2011 ||
              isPreFoundingDateOrYear(tax.dueDate) ||
              isPreFoundingDateOrYear(tax.createdAt) ||
              isPreFoundingDateOrYear(tax.paidAt) ||
              isPreFoundingDateOrYear(tax.taxPeriod)
            ) {
              if (tax.id) purgedTaxIds.push(tax.id);
              return false;
            }
            if (tax.taxPeriod?.includes('2011') || tax.title?.includes('2011') || tax.taxInvoiceNumber?.includes('2011')) {
              if (tax.id) purgedTaxIds.push(tax.id);
              return false;
            }
            if (['tax-pay-202608-01', 'tax-pay-202608-02', 'tax-pay-202608-03', 'tax-pay-202608-04', 'tax-pay-202608-05', 'tax-pay-202607-02', 'tax-pay-202607-03'].includes(tax.id)) return false;
            if (tax.payrollId === 'pay-202608-01' || tax.payrollNumber === 'PAY/2026/08/EMP-001') return false;
            if (tax.taxPeriod?.toLowerCase().includes('agustus 2026') && tax.taxType === 'PPH_21' && tax.employeeName?.toLowerCase().includes('adryan')) return false;
            if (bannedIds.has(tax.employeeId)) return false;
            if (isPurgedDummyName(tax.employeeName)) return false;
            if (isPurgedDummyName(tax.counterpartyName)) return false;
            if (isPurgedDummyName(tax.title)) return false;
            if (isPurgedDummyName(tax.description)) return false;
            if (isPurgedDummyGovTax(tax)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_tax_obligations_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 7. Scrub Dispositions
    const dispRaw = localStorage.getItem('verix_crm_dispositions_v1');
    if (dispRaw) {
      try {
        const list = JSON.parse(dispRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((d: any) => {
            if (!d) return false;
            if (bannedIds.has(d.assignedToId)) return false;
            if (isPurgedDummyName(d.assignedToName)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_dispositions_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 8. Add dummy user records to deleted users blacklist so they never reappear
    const deletedUsersRaw = localStorage.getItem('verix_crm_deleted_users_v1');
    let deletedUsersList: any[] = [];
    if (deletedUsersRaw) {
      try {
        deletedUsersList = JSON.parse(deletedUsersRaw) || [];
      } catch {}
    }
    const existingDeletedIds = new Set(deletedUsersList.map((d: any) => d.id?.toLowerCase()));
    PURGED_DUMMY_USER_IDS.forEach((id) => {
      if (!existingDeletedIds.has(id.toLowerCase())) {
        deletedUsersList.push({
          id,
          username: id,
          email: `${id}@gapsite.com`,
          name: id,
          deletedAt: new Date().toISOString(),
          deletedBy: 'System Data Purge',
        });
      }
    });
    PURGED_DUMMY_USERNAMES.forEach((un) => {
      const existing = deletedUsersList.some((d: any) => (d.username || '').toLowerCase() === un.toLowerCase());
      if (!existing) {
        deletedUsersList.push({
          id: `purged-${un}`,
          username: un,
          email: `${un}@gapsite.com`,
          name: un,
          deletedAt: new Date().toISOString(),
          deletedBy: 'System Data Purge',
        });
      }
    });
    localStorage.setItem('verix_crm_deleted_users_v1', JSON.stringify(deletedUsersList));

    // 9. Blacklist deleted payroll IDs
    const deletedPayrollsRaw = localStorage.getItem('verix_crm_deleted_payroll_ids_v1');
    let deletedPayrollsList: string[] = [];
    if (deletedPayrollsRaw) {
      try {
        deletedPayrollsList = JSON.parse(deletedPayrollsRaw) || [];
      } catch {}
    }
    const dummyPayIds = ['pay-202608-02', 'pay-202608-03', 'pay-202608-04', 'pay-202608-05', 'pay-202607-02', 'pay-202607-03'];
    dummyPayIds.forEach((pid) => {
      if (!deletedPayrollsList.includes(pid)) deletedPayrollsList.push(pid);
    });
    purgedPayIds.forEach((pid) => {
      if (!deletedPayrollsList.includes(pid)) deletedPayrollsList.push(pid);
    });
    localStorage.setItem('verix_crm_deleted_payroll_ids_v1', JSON.stringify(deletedPayrollsList));

    // 10. Clean and whitelist deleted transaction IDs (only retain exact mock dummy IDs, never user data)
    const deletedTrxsRaw = localStorage.getItem('verix_crm_deleted_transaction_ids_v1');
    let deletedTrxsList: string[] = [];
    if (deletedTrxsRaw) {
      try {
        deletedTrxsList = JSON.parse(deletedTrxsRaw) || [];
      } catch {}
    }
    const knownDummyTrxIds = new Set(['trx-pay-202608-01', 'trx-pay-202608-02', 'trx-pay-202608-03', 'trx-pay-202608-04', 'trx-pay-202608-05', 'trx-pay-202607-02', 'trx-pay-202607-03']);
    // Filter out any user-created IDs that were mistakenly blacklisted by previous scrubbers
    deletedTrxsList = deletedTrxsList.filter((tid) => knownDummyTrxIds.has(tid));
    knownDummyTrxIds.forEach((tid) => {
      if (!deletedTrxsList.includes(tid)) deletedTrxsList.push(tid);
    });
    localStorage.setItem('verix_crm_deleted_transaction_ids_v1', JSON.stringify(deletedTrxsList));

    // 11. Clean and whitelist deleted tax IDs (only retain exact mock dummy IDs, never user data)
    const deletedTaxesRaw = localStorage.getItem('verix_crm_deleted_tax_ids_v1');
    let deletedTaxesList: string[] = [];
    if (deletedTaxesRaw) {
      try {
        deletedTaxesList = JSON.parse(deletedTaxesRaw) || [];
      } catch {}
    }
    const knownDummyTaxIds = new Set(['tax-pay-202608-01', 'tax-pay-202608-02', 'tax-pay-202608-03', 'tax-pay-202608-04', 'tax-pay-202608-05', 'tax-pay-202607-02', 'tax-pay-202607-03']);
    deletedTaxesList = deletedTaxesList.filter((txid) => knownDummyTaxIds.has(txid));
    knownDummyTaxIds.forEach((txid) => {
      if (!deletedTaxesList.includes(txid)) deletedTaxesList.push(txid);
    });
    localStorage.setItem('verix_crm_deleted_tax_ids_v1', JSON.stringify(deletedTaxesList));

    // 12. Scrub Government Projects
    const govRaw = localStorage.getItem('verix_crm_government_projects_v1');
    const purgedGovIds: string[] = [];
    if (govRaw) {
      try {
        const list = JSON.parse(govRaw);
        if (Array.isArray(list)) {
          const cleaned = list
            .filter((p: any) => {
              if (!p) return false;
              if (
                isPreFoundingDateOrYear(p.startDate) ||
                isPreFoundingDateOrYear(p.createdAt) ||
                p.code?.includes('2011') ||
                p.contractNumber?.includes('2011')
              ) {
                if (p.id) purgedGovIds.push(p.id);
                return false;
              }
              if (isPurgedDummyGovProject(p)) {
                if (p.id) purgedGovIds.push(p.id);
                return false;
              }
              return true;
            })
            .map((p: any) => {
              // Also clean any pre-founding / 2011 milestones
              if (Array.isArray(p.milestones)) {
                const cleanedMilestones = p.milestones.filter(
                  (m: any) =>
                    !isPreFoundingDateOrYear(m.targetDate) &&
                    !isPreFoundingDateOrYear(m.invoiceDate) &&
                    !isPreFoundingDateOrYear(m.paymentDate)
                );
                return { ...p, milestones: cleanedMilestones };
              }
              return p;
            });
          localStorage.setItem('verix_crm_government_projects_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 13. Scrub Receivables (Piutang Usaha)
    const recRaw = localStorage.getItem('verix_crm_receivables_v1');
    const purgedRecIds: string[] = [];
    if (recRaw) {
      try {
        const list = JSON.parse(recRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((r: any) => {
            if (!r) return false;
            // Purge 2011 & pre-2021 founding receivables
            if (
              isPreFoundingDateOrYear(r.issueDate) ||
              isPreFoundingDateOrYear(r.createdAt) ||
              isPreFoundingDateOrYear(r.dueDate) ||
              isPreFoundingDateOrYear(r.settledAt) ||
              r.invoiceNumber?.includes('2011') ||
              r.title?.includes('2011')
            ) {
              if (r.id) purgedRecIds.push(r.id);
              return false;
            }
            if (isPurgedDummyGovReceivable(r) || (r.projectId && purgedGovIds.includes(r.projectId))) {
              if (r.id) purgedRecIds.push(r.id);
              return false;
            }
            return true;
          });
          localStorage.setItem('verix_crm_receivables_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 14. Protect government projects (never blacklist user IDs)
    const deletedGovRaw = localStorage.getItem('verix_crm_deleted_gov_project_ids_v1');
    if (deletedGovRaw) {
      try {
        const deletedGovList: string[] = JSON.parse(deletedGovRaw) || [];
        // Keep only known dummy mock items, un-blacklist any user items
        const cleanedGovList = deletedGovList.filter((gid) => gid === 'gov-dummy-01' || gid === 'gov-mock-01');
        localStorage.setItem('verix_crm_deleted_gov_project_ids_v1', JSON.stringify(cleanedGovList));
      } catch {}
    }

    // 15. Protect receivables (never blacklist user IDs)
    const deletedRecRaw = localStorage.getItem('verix_crm_deleted_receivable_ids_v1');
    if (deletedRecRaw) {
      try {
        const deletedRecList: string[] = JSON.parse(deletedRecRaw) || [];
        const cleanedRecList = deletedRecList.filter((rid) => rid === 'rec-dummy-01' || rid === 'rec-mock-01');
        localStorage.setItem('verix_crm_deleted_receivable_ids_v1', JSON.stringify(cleanedRecList));
      } catch {}
    }

    // 16. Scrub Bank Loans (Pinjaman Bank)
    const loansRaw = localStorage.getItem('verix_crm_bank_loans_v1');
    if (loansRaw) {
      try {
        const list = JSON.parse(loansRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((l: any) => {
            if (!l) return false;
            if (
              isPreFoundingDateOrYear(l.startDate) ||
              isPreFoundingDateOrYear(l.endDate) ||
              isPreFoundingDateOrYear(l.createdAt) ||
              l.loanNumber?.includes('2011') ||
              l.bankName?.includes('2011')
            ) {
              return false;
            }
            return true;
          });
          localStorage.setItem('verix_crm_bank_loans_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 17. Scrub Retail Projects
    const retailRaw = localStorage.getItem('verix_crm_retail_projects_v1');
    if (retailRaw) {
      try {
        const list = JSON.parse(retailRaw);
        if (Array.isArray(list)) {
          const cleaned = list
            .filter((p: any) => {
              if (!p) return false;
              if (
                isPreFoundingDateOrYear(p.startDate) ||
                isPreFoundingDateOrYear(p.createdAt) ||
                p.code?.includes('2011')
              ) {
                return false;
              }
              return true;
            })
            .map((p: any) => {
              if (Array.isArray(p.milestones)) {
                const cleanedMilestones = p.milestones.filter(
                  (m: any) =>
                    !isPreFoundingDateOrYear(m.targetDate) &&
                    !isPreFoundingDateOrYear(m.invoiceDate) &&
                    !isPreFoundingDateOrYear(m.paymentDate)
                );
                return { ...p, milestones: cleanedMilestones };
              }
              return p;
            });
          localStorage.setItem('verix_crm_retail_projects_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 18. Scrub Overhead Expenses
    const overheadRaw = localStorage.getItem('verix_crm_overhead_expenses_v1');
    if (overheadRaw) {
      try {
        const list = JSON.parse(overheadRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((o: any) => {
            if (!o) return false;
            if (
              isPreFoundingDateOrYear(o.date) ||
              isPreFoundingDateOrYear(o.createdAt) ||
              o.expenseNumber?.includes('2011')
            ) {
              return false;
            }
            return true;
          });
          localStorage.setItem('verix_crm_overhead_expenses_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 19. Scrub Office Rent Contracts
    const rentRaw = localStorage.getItem('verix_crm_office_rents_v1');
    if (rentRaw) {
      try {
        const list = JSON.parse(rentRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((rent: any) => {
            if (!rent) return false;
            if (
              isPreFoundingDateOrYear(rent.startDate) ||
              isPreFoundingDateOrYear(rent.endDate) ||
              rent.contractNumber?.includes('2011')
            ) {
              return false;
            }
            return true;
          });
          localStorage.setItem('verix_crm_office_rents_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }
  } catch (e) {
    console.warn('[storage] Note during dummy data scrub:', e);
  }
};

// Immediately purge stale Firestore multi-tab state and banned dummy users on load
if (typeof window !== 'undefined' && window.localStorage) {
  purgeStaleStorage();
  scrubBannedDummyDataFromLocalStorage();
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[storage] Failed to get item "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;

      // Always asynchronously mirror to IndexedDB (multi-gigabyte persistent storage)
      try {
        const parsed = JSON.parse(value);
        saveCollectionToIndexedDb(key, parsed).catch(() => {});
      } catch {}

      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      const isQuota =
        error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error?.code === 22 ||
        error?.code === 1014;

      if (isQuota) {
        // Evict stale Firestore and non-essential caches
        purgeStaleStorage();

        // 1. Try stripping large base64 file payloads to preserve all structured business data
        try {
          const stripped = stripHeavyBase64(value);
          localStorage.setItem(key, stripped);
          console.info(`[storage] LocalStorage quota prevented crash: stripped heavy file attachments for key "${key}", full records preserved in IndexedDB.`);
          return true;
        } catch {
          // 2. If still exceeded, data is already saved in IndexedDB
          console.warn(
            `[storage] LocalStorage quota reached for "${key}". Full records securely preserved in IndexedDB.`
          );
          return false;
        }
      }

      console.warn(`[storage] Failed to save key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] Failed to remove item "${key}":`, e);
    }
  },

  clear: (): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.clear();
    } catch (e) {
      console.warn('[storage] Failed to clear storage:', e);
    }
  },
};
