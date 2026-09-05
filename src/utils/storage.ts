/**
 * Safe localStorage wrapper with QuotaExceededError protection and automatic stale cache eviction.
 */

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
export const PURGED_DUMMY_USER_IDS = ['usr-lead-01', 'usr-tech-01', 'usr-survey-01', 'usr-fin-01'];
export const PURGED_DUMMY_USERNAMES = ['bambang.lead', 'siti.tech', 'hendra.survey', 'dewi.finance'];
export const PURGED_DUMMY_EMAILS = [
  'bambang.lead@gapsite.com',
  'siti.rahma@gapsite.com',
  'hendra.survey@gapsite.com',
  'dewi.finance@gapsite.com',
];
export const PURGED_DUMMY_NAMES_LOWER = [
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
    if (payrollRaw) {
      try {
        const list = JSON.parse(payrollRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((p: any) => {
            if (!p) return false;
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
    if (trxsRaw) {
      try {
        const list = JSON.parse(trxsRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((t: any) => {
            if (!t) return false;
            if (['trx-pay-202608-01', 'trx-pay-202608-02', 'trx-pay-202608-03', 'trx-pay-202608-04', 'trx-pay-202608-05', 'trx-pay-202607-02', 'trx-pay-202607-03'].includes(t.id)) return false;
            if (t.referenceNumber === 'PAY/2026/08/EMP-001') return false;
            if (t.transactionNumber === 'TRX-202608-EMP-001' || t.transactionNumber === 'TRX-202608-001') return false;
            if (t.date === '2026-08-28' && t.category === 'GAJI_KARYAWAN' && ((t.clientOrVendorName && t.clientOrVendorName.toLowerCase().includes('adryan')) || (t.description && t.description.toLowerCase().includes('adryan')))) return false;
            if (isPurgedDummyName(t.clientOrVendorName)) return false;
            if (isPurgedDummyName(t.description)) return false;
            return true;
          });
          localStorage.setItem('verix_crm_transactions_v1', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 6. Scrub Tax Obligations
    const taxRaw = localStorage.getItem('verix_crm_tax_obligations_v1');
    if (taxRaw) {
      try {
        const list = JSON.parse(taxRaw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((tax: any) => {
            if (!tax) return false;
            if (['tax-pay-202608-01', 'tax-pay-202608-02', 'tax-pay-202608-03', 'tax-pay-202608-04', 'tax-pay-202608-05', 'tax-pay-202607-02', 'tax-pay-202607-03'].includes(tax.id)) return false;
            if (tax.payrollId === 'pay-202608-01' || tax.payrollNumber === 'PAY/2026/08/EMP-001') return false;
            if (tax.taxPeriod?.toLowerCase().includes('agustus 2026') && tax.taxType === 'PPH_21' && tax.employeeName?.toLowerCase().includes('adryan')) return false;
            if (bannedIds.has(tax.employeeId)) return false;
            if (isPurgedDummyName(tax.employeeName)) return false;
            if (isPurgedDummyName(tax.counterpartyName)) return false;
            if (isPurgedDummyName(tax.title)) return false;
            if (isPurgedDummyName(tax.description)) return false;
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
    PURGED_DUMMY_USER_IDS.forEach((id, idx) => {
      if (!existingDeletedIds.has(id.toLowerCase())) {
        deletedUsersList.push({
          id,
          username: PURGED_DUMMY_USERNAMES[idx],
          email: PURGED_DUMMY_EMAILS[idx],
          name: PURGED_DUMMY_NAMES_LOWER[idx],
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
    localStorage.setItem('verix_crm_deleted_payroll_ids_v1', JSON.stringify(deletedPayrollsList));

    // 10. Blacklist deleted transaction IDs
    const deletedTrxsRaw = localStorage.getItem('verix_crm_deleted_transaction_ids_v1');
    let deletedTrxsList: string[] = [];
    if (deletedTrxsRaw) {
      try {
        deletedTrxsList = JSON.parse(deletedTrxsRaw) || [];
      } catch {}
    }
    const dummyTrxIds = ['trx-pay-202608-02', 'trx-pay-202608-03', 'trx-pay-202608-04', 'trx-pay-202608-05', 'trx-pay-202607-02', 'trx-pay-202607-03'];
    dummyTrxIds.forEach((tid) => {
      if (!deletedTrxsList.includes(tid)) deletedTrxsList.push(tid);
    });
    localStorage.setItem('verix_crm_deleted_transaction_ids_v1', JSON.stringify(deletedTrxsList));

    // 11. Blacklist deleted tax IDs
    const deletedTaxesRaw = localStorage.getItem('verix_crm_deleted_tax_ids_v1');
    let deletedTaxesList: string[] = [];
    if (deletedTaxesRaw) {
      try {
        deletedTaxesList = JSON.parse(deletedTaxesRaw) || [];
      } catch {}
    }
    const dummyTaxIds = ['tax-pay-202608-02', 'tax-pay-202608-03', 'tax-pay-202608-04', 'tax-pay-202608-05', 'tax-pay-202607-02', 'tax-pay-202607-03'];
    dummyTaxIds.forEach((txid) => {
      if (!deletedTaxesList.includes(txid)) deletedTaxesList.push(txid);
    });
    localStorage.setItem('verix_crm_deleted_tax_ids_v1', JSON.stringify(deletedTaxesList));
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

        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // If still exceeded, data is still safe in React state and Firestore cloud database
          console.warn(
            `[storage] LocalStorage quota reached for "${key}". Data is retained in memory and synchronized via Firestore.`
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
