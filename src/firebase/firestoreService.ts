import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from './config';
import {
  ConsultingProject,
  TeamMember,
  JobDisposition,
  FinancialTransaction,
  ProjectActivity,
  ServiceType,
  RoleDefinition,
  DocumentTypeDefinition,
  DocumentCategoryDefinition,
  DeletedUserRecord,
  Receivable,
  TaxObligation,
  PayrollPayment,
  CompanyLetterhead,
  GovernmentProject,
  RetailProject,
  OverheadExpense,
  OfficeRentContract
} from '../types';

export const FirestoreCollections = {
  USERS: 'users',
  PROJECTS: 'projects',
  DISPOSITIONS: 'dispositions',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'app_settings',
  ACTIVITIES: 'activity_logs',
  DOCUMENT_TYPES: 'document_types',
  DOCUMENT_CATEGORIES: 'document_categories',
  RECEIVABLES: 'receivables',
  TAX_OBLIGATIONS: 'tax_obligations',
  PAYROLL: 'payroll_records',
  GOVERNMENT_PROJECTS: 'government_projects',
  RETAIL_PROJECTS: 'retail_projects',
  OVERHEAD: 'overhead_expenses',
  OFFICE_RENTS: 'office_rent_contracts',
};

// Deeply sanitize objects so no `undefined` values are ever sent to Firestore (which causes setDoc to fail)
export const sanitizeForFirestore = <T>(obj: T): T => {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
};

// Sync Projects to Firestore
export const saveProjectToFirestore = async (project: ConsultingProject): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.PROJECTS, project.id);
    const sanitized = sanitizeForFirestore({
      ...project,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Firestore save project error:', error);
  }
};

export const deleteProjectFromFirestore = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.PROJECTS, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete project error:', error);
  }
};

// Sync User to Firestore
export const saveUserToFirestore = async (user: TeamMember): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.USERS, user.id);
    const sanitized = sanitizeForFirestore({
      ...user,
      lastSyncedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Firestore save user error:', error);
  }
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.USERS, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete user error:', error);
  }
};

// Deleted Users Blacklist Management (prevents deleted users from logging in until re-registered)
export const saveDeletedUserToFirestore = async (record: DeletedUserRecord): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, 'deleted_users');
    const snap = await getDoc(docRef);
    let existingList: DeletedUserRecord[] = [];
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.data)) {
        existingList = data.data;
      }
    }
    // Filter out duplicate records for same id/username/email
    const updatedList = [
      ...existingList.filter(
        (item) =>
          item.id !== record.id &&
          item.username?.toLowerCase() !== record.username?.toLowerCase() &&
          item.email?.toLowerCase() !== record.email?.toLowerCase()
      ),
      record,
    ];
    await setDoc(docRef, sanitizeForFirestore({ data: updatedList, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.error('Firestore save deleted user record error:', error);
  }
};

export const removeDeletedUserFromFirestore = async (identifier: string): Promise<void> => {
  try {
    const cleanId = identifier.trim().toLowerCase();
    const docRef = doc(db, FirestoreCollections.SETTINGS, 'deleted_users');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.data)) {
        const filtered = data.data.filter(
          (item: DeletedUserRecord) =>
            item.id !== identifier &&
            item.username?.toLowerCase() !== cleanId &&
            item.email?.toLowerCase() !== cleanId
        );
        await setDoc(docRef, sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }), { merge: true });
      }
    }
  } catch (error) {
    console.error('Firestore remove deleted user record error:', error);
  }
};

// Sync Disposition to Firestore
export const saveDispositionToFirestore = async (disposition: JobDisposition): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DISPOSITIONS, disposition.id);
    await setDoc(docRef, sanitizeForFirestore(disposition), { merge: true });
  } catch (error) {
    console.error('Firestore save disposition error:', error);
  }
};

export const deleteDispositionFromFirestore = async (dispositionId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DISPOSITIONS, dispositionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete disposition error:', error);
  }
};

// Sync Finance Transaction to Firestore
export const saveTransactionToFirestore = async (transaction: FinancialTransaction): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.TRANSACTIONS, transaction.id);
    const sanitized = sanitizeForFirestore({
      ...transaction,
      projectId: transaction.projectId || '',
      projectCode: transaction.projectCode || '',
      referenceNumber: transaction.referenceNumber || '',
      notes: transaction.notes || '',
      attachmentName: transaction.attachmentName || '',
      attachmentUrl: transaction.attachmentUrl || '',
      attachmentType: transaction.attachmentType || '',
      attachmentSize: transaction.attachmentSize || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized);
  } catch (error) {
    console.error('Firestore save transaction error:', error);
  }
};

export const deleteTransactionFromFirestore = async (transactionId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.TRANSACTIONS, transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete transaction error:', error);
  }
};

// Sync Settings (Service Types / Roles)
export const saveSettingsToFirestore = async (key: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, key);
    await setDoc(docRef, sanitizeForFirestore({ data, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.error(`Firestore save settings (${key}) error:`, error);
  }
};

// Real-time Listeners
export const subscribeToProjects = (onUpdate: (projects: ConsultingProject[]) => void) => {
  const colRef = collection(db, FirestoreCollections.PROJECTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: ConsultingProject[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ConsultingProject;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore projects listener warning:', err)
  );
};

export const subscribeToUsers = (onUpdate: (users: TeamMember[]) => void) => {
  const colRef = collection(db, FirestoreCollections.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: TeamMember[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as TeamMember;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore users listener warning:', err)
  );
};

// Sync Document Types to Firestore
export const saveDocumentTypeToFirestore = async (docType: DocumentTypeDefinition): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DOCUMENT_TYPES, docType.id);
    await setDoc(docRef, sanitizeForFirestore({ ...docType, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.error('Firestore save document type error:', error);
  }
};

export const deleteDocumentTypeFromFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DOCUMENT_TYPES, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete document type error:', error);
  }
};

export const subscribeToDocumentTypes = (onUpdate: (docTypes: DocumentTypeDefinition[]) => void) => {
  const colRef = collection(db, FirestoreCollections.DOCUMENT_TYPES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: DocumentTypeDefinition[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as DocumentTypeDefinition;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore document types listener warning:', err)
  );
};

// Sync Document Categories to Firestore
export const saveDocumentCategoryToFirestore = async (category: DocumentCategoryDefinition): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DOCUMENT_CATEGORIES, category.id);
    await setDoc(docRef, sanitizeForFirestore({ ...category, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.error('Firestore save document category error:', error);
  }
};

export const deleteDocumentCategoryFromFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.DOCUMENT_CATEGORIES, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete document category error:', error);
  }
};

export const subscribeToDocumentCategories = (onUpdate: (categories: DocumentCategoryDefinition[]) => void) => {
  const colRef = collection(db, FirestoreCollections.DOCUMENT_CATEGORIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: DocumentCategoryDefinition[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as DocumentCategoryDefinition;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore document categories listener warning:', err)
  );
};

export const subscribeToDispositions = (onUpdate: (dispositions: JobDisposition[]) => void) => {
  const colRef = collection(db, FirestoreCollections.DISPOSITIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: JobDisposition[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as JobDisposition;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore dispositions listener warning:', err)
  );
};

export const subscribeToTransactions = (onUpdate: (transactions: FinancialTransaction[]) => void) => {
  const colRef = collection(db, FirestoreCollections.TRANSACTIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: FinancialTransaction[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as FinancialTransaction;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore transactions listener warning:', err)
  );
};

// Sync Receivable (Piutang Usaha & Termin Proyek) to Firestore
export const saveReceivableToFirestore = async (receivable: Receivable): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.RECEIVABLES, receivable.id);
    const sanitized = sanitizeForFirestore({
      ...receivable,
      projectId: receivable.projectId || '',
      projectCode: receivable.projectCode || '',
      milestoneTitle: receivable.milestoneTitle || '',
      notes: receivable.notes || '',
      clientContactPerson: receivable.clientContactPerson || '',
      clientEmail: receivable.clientEmail || '',
      clientPhone: receivable.clientPhone || '',
      clientAddress: receivable.clientAddress || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Firestore save receivable error:', error);
  }
};

export const deleteReceivableFromFirestore = async (receivableId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.RECEIVABLES, receivableId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete receivable error:', error);
  }
};

export const subscribeToReceivables = (onUpdate: (receivables: Receivable[]) => void) => {
  const colRef = collection(db, FirestoreCollections.RECEIVABLES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: Receivable[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Receivable;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore receivables listener warning:', err)
  );
};

// Sync Tax Obligation (PPN, PPh, & Pajak Terhutang) to Firestore
export const saveTaxObligationToFirestore = async (tax: TaxObligation): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.TAX_OBLIGATIONS, tax.id);
    const sanitized = sanitizeForFirestore({
      ...tax,
      projectId: tax.projectId || '',
      projectCode: tax.projectCode || '',
      billingCode: tax.billingCode || '',
      taxInvoiceNumber: tax.taxInvoiceNumber || '',
      counterpartyName: tax.counterpartyName || '',
      notes: tax.notes || '',
      ntpnNumber: tax.ntpnNumber || '',
      paymentChannelId: tax.paymentChannelId || '',
      transactionId: tax.transactionId || '',
      paidAt: tax.paidAt || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Firestore save tax obligation error:', error);
  }
};

export const deleteTaxObligationFromFirestore = async (taxId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.TAX_OBLIGATIONS, taxId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete tax obligation error:', error);
  }
};

export const subscribeToTaxObligations = (onUpdate: (taxes: TaxObligation[]) => void) => {
  const colRef = collection(db, FirestoreCollections.TAX_OBLIGATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: TaxObligation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as TaxObligation;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore tax obligations listener warning:', err)
  );
};

// Sync Payroll Payment (Slip Gaji & Kompensasi Karyawan) to Firestore
export const savePayrollToFirestore = async (payroll: PayrollPayment): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.PAYROLL, payroll.id);
    const sanitized = sanitizeForFirestore({
      ...payroll,
      employeeEmail: payroll.employeeEmail || '',
      employeePhone: payroll.employeePhone || '',
      employeeNik: payroll.employeeNik || '',
      bankName: payroll.bankName || '',
      bankAccountNumber: payroll.bankAccountNumber || '',
      bankAccountHolder: payroll.bankAccountHolder || '',
      paymentChannelId: payroll.paymentChannelId || '',
      transactionId: payroll.transactionId || '',
      pph21ObligationId: payroll.pph21ObligationId || '',
      notes: payroll.notes || '',
      paidAt: payroll.paidAt || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Also update settings backup document
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'payroll_records');
    const snap = await getDoc(settingsRef);
    let list: PayrollPayment[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      list = snap.data().data;
    }
    const filtered = list.filter((p) => p.id !== payroll.id);
    await setDoc(
      settingsRef,
      sanitizeForFirestore({ data: [payroll, ...filtered], updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore save payroll error:', error);
  }
};

export const deletePayrollFromFirestore = async (payrollId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.PAYROLL, payrollId);
    await deleteDoc(docRef);

    // Also update settings backup document
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'payroll_records');
    const snap = await getDoc(settingsRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((p: PayrollPayment) => p.id !== payrollId);
      await setDoc(
        settingsRef,
        sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Firestore delete payroll error:', error);
    throw error;
  }
};

// Deleted Payroll IDs Management (prevents deleted payroll records from resurfacing)
export const saveDeletedPayrollIdToFirestore = async (payrollId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, 'deleted_payroll_ids');
    const snap = await getDoc(docRef);
    let existingList: string[] = [];
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.data)) {
        existingList = data.data;
      }
    }
    if (!existingList.includes(payrollId)) {
      const updated = [payrollId, ...existingList];
      await setDoc(docRef, sanitizeForFirestore({ data: updated, updatedAt: new Date().toISOString() }));
    }
  } catch (err) {
    console.error('Failed to save deleted payroll ID to Firestore:', err);
  }
};

export const removeDeletedPayrollIdFromFirestore = async (payrollId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, 'deleted_payroll_ids');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.data)) {
        const filtered = data.data.filter((id: string) => id !== payrollId);
        await setDoc(docRef, sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }));
      }
    }
  } catch (err) {
    console.error('Failed to remove deleted payroll ID from Firestore:', err);
  }
};

// ==========================================
// GOVERNMENT PROJECTS (PROYEK PEMERINTAH & BUMN) FIRESTORE SYNC
// ==========================================

export const saveGovernmentProjectToFirestore = async (project: GovernmentProject): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.GOVERNMENT_PROJECTS, project.id);
    const sanitized = sanitizeForFirestore({
      ...project,
      satkerCode: project.satkerCode || '',
      ppkName: project.ppkName || '',
      ppkNip: project.ppkNip || '',
      treasurerName: project.treasurerName || '',
      treasurerPhone: project.treasurerPhone || '',
      agencyAddress: project.agencyAddress || '',
      linkedCrmProjectId: project.linkedCrmProjectId || '',
      notes: project.notes || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Also update settings backup document for atomic fallback
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'government_projects');
    const snap = await getDoc(settingsRef);
    let list: GovernmentProject[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      list = snap.data().data;
    }
    const filtered = list.filter((p) => p.id !== project.id);
    await setDoc(
      settingsRef,
      sanitizeForFirestore({ data: [project, ...filtered], updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore save government project error:', error);
  }
};

export const deleteGovernmentProjectFromFirestore = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.GOVERNMENT_PROJECTS, projectId);
    await deleteDoc(docRef);

    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'government_projects');
    const snap = await getDoc(settingsRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((p: GovernmentProject) => p.id !== projectId);
      await setDoc(
        settingsRef,
        sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Firestore delete government project error:', error);
    throw error;
  }
};

export const subscribeToGovernmentProjects = (onUpdate: (projects: GovernmentProject[]) => void) => {
  const colRef = collection(db, FirestoreCollections.GOVERNMENT_PROJECTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: GovernmentProject[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GovernmentProject;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore government projects listener warning:', err)
  );
};

// ==========================================
// RETAIL PROJECTS (PROYEK RETAIL & KORPORASI SWASTA) FIRESTORE SYNC
// ==========================================

export const saveRetailProjectToFirestore = async (project: RetailProject): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.RETAIL_PROJECTS, project.id);
    const sanitized = sanitizeForFirestore({
      ...project,
      clientContactPerson: project.clientContactPerson || '',
      clientPhone: project.clientPhone || '',
      clientEmail: project.clientEmail || '',
      clientAddress: project.clientAddress || '',
      clientNpwp: project.clientNpwp || '',
      contractNumber: project.contractNumber || '',
      linkedCrmProjectId: project.linkedCrmProjectId || '',
      notes: project.notes || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Also update settings backup document for atomic fallback
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'retail_projects');
    const snap = await getDoc(settingsRef);
    let list: RetailProject[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      list = snap.data().data;
    }
    const filtered = list.filter((p) => p.id !== project.id);
    await setDoc(
      settingsRef,
      sanitizeForFirestore({ data: [project, ...filtered], updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore save retail project error:', error);
  }
};

export const deleteRetailProjectFromFirestore = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.RETAIL_PROJECTS, projectId);
    await deleteDoc(docRef);

    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'retail_projects');
    const snap = await getDoc(settingsRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((p: RetailProject) => p.id !== projectId);
      await setDoc(
        settingsRef,
        sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Firestore delete retail project error:', error);
    throw error;
  }
};

export const subscribeToRetailProjects = (onUpdate: (projects: RetailProject[]) => void) => {
  const colRef = collection(db, FirestoreCollections.RETAIL_PROJECTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: RetailProject[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as RetailProject;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore retail projects listener warning:', err)
  );
};

// ==========================================
// OVERHEAD OPERATIONAL EXPENSES FIRESTORE API
// ==========================================
export const saveOverheadExpenseToFirestore = async (expense: OverheadExpense): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.OVERHEAD, expense.id);
    const sanitized = sanitizeForFirestore({
      ...expense,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Also update settings backup document for atomic fallback
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'overhead_expenses');
    const snap = await getDoc(settingsRef);
    let list: OverheadExpense[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      list = snap.data().data;
    }
    const filtered = list.filter((e) => e.id !== expense.id);
    await setDoc(
      settingsRef,
      sanitizeForFirestore({ data: [expense, ...filtered], updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore save overhead expense error:', error);
  }
};

export const deleteOverheadExpenseFromFirestore = async (expenseId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.OVERHEAD, expenseId);
    await deleteDoc(docRef);

    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'overhead_expenses');
    const snap = await getDoc(settingsRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((e: OverheadExpense) => e.id !== expenseId);
      await setDoc(
        settingsRef,
        sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Firestore delete overhead expense error:', error);
    throw error;
  }
};

export const subscribeToOverheadExpenses = (onUpdate: (expenses: OverheadExpense[]) => void) => {
  const colRef = collection(db, FirestoreCollections.OVERHEAD);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: OverheadExpense[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as OverheadExpense;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore overhead expenses listener warning:', err)
  );
};

// ==========================================
// OFFICE RENT CONTRACTS & 12-MONTH SCHEDULE FIRESTORE API
// ==========================================
export const saveOfficeRentContractToFirestore = async (contract: OfficeRentContract): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.OFFICE_RENTS, contract.id);
    const sanitized = sanitizeForFirestore({
      ...contract,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Also update settings backup document for atomic fallback
    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'office_rent_contracts');
    const snap = await getDoc(settingsRef);
    let list: OfficeRentContract[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      list = snap.data().data;
    }
    const filtered = list.filter((c) => c.id !== contract.id);
    await setDoc(
      settingsRef,
      sanitizeForFirestore({ data: [contract, ...filtered], updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore save office rent contract error:', error);
  }
};

export const deleteOfficeRentContractFromFirestore = async (contractId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.OFFICE_RENTS, contractId);
    await deleteDoc(docRef);

    const settingsRef = doc(db, FirestoreCollections.SETTINGS, 'office_rent_contracts');
    const snap = await getDoc(settingsRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((c: OfficeRentContract) => c.id !== contractId);
      await setDoc(
        settingsRef,
        sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Firestore delete office rent contract error:', error);
    throw error;
  }
};

export const subscribeToOfficeRentContracts = (onUpdate: (contracts: OfficeRentContract[]) => void) => {
  const colRef = collection(db, FirestoreCollections.OFFICE_RENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: OfficeRentContract[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as OfficeRentContract;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => console.warn('Firestore office rent contracts listener warning:', err)
  );
};

export const subscribeToDeletedPayrollIds = (onUpdate: (ids: string[]) => void) => {
  const docRef = doc(db, FirestoreCollections.SETTINGS, 'deleted_payroll_ids');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.data)) {
        onUpdate(snap.data().data);
      }
    },
    (err) => console.warn('Firestore deleted_payroll_ids listener warning:', err)
  );
};

// Generic deleted entity ID helpers for comprehensive cross-module deletion persistence
export const saveDeletedEntityIdToFirestore = async (settingKey: string, entityId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, settingKey);
    const snap = await getDoc(docRef);
    let currentIds: string[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      currentIds = snap.data().data;
    }
    if (!currentIds.includes(entityId)) {
      const updated = [...currentIds, entityId];
      await setDoc(docRef, sanitizeForFirestore({ data: updated, updatedAt: new Date().toISOString() }));
    }
  } catch (err) {
    console.error(`Failed to save deleted ID (${settingKey}) to Firestore:`, err);
  }
};

export const removeDeletedEntityIdFromFirestore = async (settingKey: string, entityId: string): Promise<void> => {
  try {
    const docRef = doc(db, FirestoreCollections.SETTINGS, settingKey);
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.data)) {
      const filtered = snap.data().data.filter((id: string) => id !== entityId);
      await setDoc(docRef, sanitizeForFirestore({ data: filtered, updatedAt: new Date().toISOString() }));
    }
  } catch (err) {
    console.error(`Failed to remove deleted ID (${settingKey}) from Firestore:`, err);
  }
};

export const subscribeToDeletedEntityIds = (settingKey: string, onUpdate: (ids: string[]) => void) => {
  const docRef = doc(db, FirestoreCollections.SETTINGS, settingKey);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.data)) {
        onUpdate(snap.data().data);
      }
    },
    (err) => console.warn(`Firestore ${settingKey} listener warning:`, err)
  );
};

export const subscribeToPayroll = (onUpdate: (payrolls: PayrollPayment[]) => void) => {
  const colRef = collection(db, FirestoreCollections.PAYROLL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const loaded: PayrollPayment[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as PayrollPayment;
        if (data && data.id) {
          loaded.push(data);
        }
      });
      onUpdate(loaded);
    },
    (err) => {
      console.warn('Firestore payroll listener warning:', err);
      // Fallback to settings listener
      subscribeToSettings('payroll_records', (data) => {
        if (Array.isArray(data)) {
          onUpdate(data);
        }
      });
    }
  );
};

export const subscribeToSettings = (key: string, onUpdate: (data: any) => void) => {
  const docRef = doc(db, FirestoreCollections.SETTINGS, key);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const payload = snapshot.data();
        if (payload && payload.data !== undefined) {
          onUpdate(payload.data);
        }
      }
    },
    (err) => console.warn(`Firestore settings (${key}) listener warning:`, err)
  );
};

// Ensure critical baseline documents and Master Admin account exist in Firestore
export const ensureInitialFirestoreSeed = async (
  masterAdmin: TeamMember,
  defaultServices: any[],
  defaultDocTypes: any[],
  defaultCategories: any[],
  defaultRoles: any,
  defaultProjects?: ConsultingProject[],
  defaultDispositions?: JobDisposition[],
  defaultTransactions?: FinancialTransaction[],
  defaultTeamMembers?: TeamMember[],
  defaultTransactionCategories?: any[],
  defaultPaymentChannels?: any[],
  defaultTaxObligations?: any[],
  defaultBankLoans?: any[],
  defaultCompanyCapital?: any,
  defaultReceivables?: Receivable[],
  defaultPayrollRecords?: PayrollPayment[],
  defaultCompanyLetterhead?: CompanyLetterhead,
  defaultEmployeeSalaryConfigs?: any[],
  defaultInstitutionTypes?: any[],
  defaultTermSchemes?: any[],
  defaultOfficeRents?: any[]
): Promise<void> => {
  try {
    // 1. Ensure master admin root user exists in Firestore
    const masterDocRef = doc(db, FirestoreCollections.USERS, masterAdmin.id);
    const masterSnap = await getDoc(masterDocRef);
    if (!masterSnap.exists()) {
      await setDoc(masterDocRef, sanitizeForFirestore({ ...masterAdmin, lastSyncedAt: new Date().toISOString() }));
    }

    // Helper to check deleted entity IDs from app_settings
    const getDeletedSet = async (settingKey: string): Promise<Set<string>> => {
      try {
        const snap = await getDoc(doc(db, FirestoreCollections.SETTINGS, settingKey));
        if (snap.exists() && Array.isArray(snap.data()?.data)) {
          return new Set<string>(snap.data().data);
        }
      } catch {}
      return new Set<string>();
    };

    const [
      deletedProjects,
      deletedDispositions,
      deletedTransactions,
      deletedTaxObligations,
      deletedReceivables,
      deletedPayroll,
    ] = await Promise.all([
      getDeletedSet('deleted_project_ids'),
      getDeletedSet('deleted_disposition_ids'),
      getDeletedSet('deleted_transaction_ids'),
      getDeletedSet('deleted_tax_ids'),
      getDeletedSet('deleted_receivable_ids'),
      getDeletedSet('deleted_payroll_ids'),
    ]);

    // 2. Ensure initial users exist if collection is empty
    if (defaultTeamMembers && defaultTeamMembers.length > 0) {
      const usersSnap = await getDocs(collection(db, FirestoreCollections.USERS));
      if (usersSnap.empty) {
        await Promise.all(
          defaultTeamMembers.map((u) => {
            const uRef = doc(db, FirestoreCollections.USERS, u.id);
            return setDoc(uRef, sanitizeForFirestore(u));
          })
        );
      }
    }

    // 3. Ensure consulting services config exists
    const servicesRef = doc(db, FirestoreCollections.SETTINGS, 'consulting_services');
    const servicesSnap = await getDoc(servicesRef);
    if (!servicesSnap.exists()) {
      await setDoc(servicesRef, sanitizeForFirestore({ data: defaultServices, updatedAt: new Date().toISOString() }));
    }

    // 4. Ensure role definitions exist
    const rolesRef = doc(db, FirestoreCollections.SETTINGS, 'role_definitions');
    const rolesSnap = await getDoc(rolesRef);
    if (!rolesSnap.exists()) {
      await setDoc(rolesRef, sanitizeForFirestore({ data: defaultRoles, updatedAt: new Date().toISOString() }));
    }

    // 5. Ensure master document types exist ONLY IF NEVER SEEDED BEFORE
    const docTypesSeedRef = doc(db, FirestoreCollections.SETTINGS, 'doc_types_seed_meta');
    const docTypesSeedSnap = await getDoc(docTypesSeedRef);
    if (!docTypesSeedSnap.exists()) {
      if (defaultDocTypes && defaultDocTypes.length > 0) {
        await Promise.all(
          defaultDocTypes.map((dt) => {
            const dRef = doc(db, FirestoreCollections.DOCUMENT_TYPES, dt.id);
            return setDoc(dRef, sanitizeForFirestore({ ...dt, updatedAt: new Date().toISOString() }));
          })
        );
      }
      await setDoc(docTypesSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 6. Ensure master document categories exist ONLY IF NEVER SEEDED BEFORE
    const docCategoriesSeedRef = doc(db, FirestoreCollections.SETTINGS, 'doc_categories_seed_meta');
    const docCategoriesSeedSnap = await getDoc(docCategoriesSeedRef);
    if (!docCategoriesSeedSnap.exists()) {
      if (defaultCategories && defaultCategories.length > 0) {
        await Promise.all(
          defaultCategories.map((dc) => {
            const cRef = doc(db, FirestoreCollections.DOCUMENT_CATEGORIES, dc.id);
            return setDoc(cRef, sanitizeForFirestore({ ...dc, updatedAt: new Date().toISOString() }));
          })
        );
      }
      await setDoc(docCategoriesSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 7. Ensure projects exist ONLY IF NEVER SEEDED BEFORE (Never resurrect deleted projects on refresh!)
    const projectsSeedRef = doc(db, FirestoreCollections.SETTINGS, 'projects_seed_meta');
    const projectsSeedSnap = await getDoc(projectsSeedRef);
    if (!projectsSeedSnap.exists()) {
      if (defaultProjects && defaultProjects.length > 0) {
        const toSeed = defaultProjects.filter((p) => !deletedProjects.has(p.id));
        await Promise.all(
          toSeed.map((p) => {
            const pRef = doc(db, FirestoreCollections.PROJECTS, p.id);
            return setDoc(pRef, sanitizeForFirestore(p));
          })
        );
      }
      await setDoc(projectsSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 8. Ensure dispositions exist ONLY IF NEVER SEEDED BEFORE (Never resurrect deleted dispositions on refresh!)
    const dispSeedRef = doc(db, FirestoreCollections.SETTINGS, 'dispositions_seed_meta');
    const dispSeedSnap = await getDoc(dispSeedRef);
    if (!dispSeedSnap.exists()) {
      if (defaultDispositions && defaultDispositions.length > 0) {
        const toSeed = defaultDispositions.filter((d) => !deletedDispositions.has(d.id));
        await Promise.all(
          toSeed.map((d) => {
            const dRef = doc(db, FirestoreCollections.DISPOSITIONS, d.id);
            return setDoc(dRef, sanitizeForFirestore(d));
          })
        );
      }
      await setDoc(dispSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 9. Ensure transactions exist ONLY IF NEVER SEEDED BEFORE (Never resurrect deleted transactions on refresh!)
    const trxsSeedRef = doc(db, FirestoreCollections.SETTINGS, 'transactions_seed_meta');
    const trxsSeedSnap = await getDoc(trxsSeedRef);
    if (!trxsSeedSnap.exists()) {
      if (defaultTransactions && defaultTransactions.length > 0) {
        const toSeed = defaultTransactions.filter((t) => !deletedTransactions.has(t.id));
        await Promise.all(
          toSeed.map((t) => {
            const tRef = doc(db, FirestoreCollections.TRANSACTIONS, t.id);
            return setDoc(tRef, sanitizeForFirestore(t));
          })
        );
      }
      await setDoc(trxsSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 10. Ensure transaction categories exist in settings
    if (defaultTransactionCategories && defaultTransactionCategories.length > 0) {
      const catRef = doc(db, FirestoreCollections.SETTINGS, 'transaction_categories');
      const catSnap = await getDoc(catRef);
      if (!catSnap.exists()) {
        await setDoc(catRef, sanitizeForFirestore({ data: defaultTransactionCategories, updatedAt: new Date().toISOString() }));
      }
    }

    // 11. Ensure payment channels (banks & accounts) exist in settings
    if (defaultPaymentChannels && defaultPaymentChannels.length > 0) {
      const payRef = doc(db, FirestoreCollections.SETTINGS, 'payment_channels');
      const paySnap = await getDoc(payRef);
      if (!paySnap.exists()) {
        await setDoc(payRef, sanitizeForFirestore({ data: defaultPaymentChannels, updatedAt: new Date().toISOString() }));
      }
    }

    // 12. Ensure tax obligations exist ONLY IF NEVER SEEDED BEFORE (Never resurrect deleted tax obligations on refresh!)
    const taxSeedRef = doc(db, FirestoreCollections.SETTINGS, 'tax_seed_meta');
    const taxSeedSnap = await getDoc(taxSeedRef);
    if (!taxSeedSnap.exists()) {
      if (defaultTaxObligations !== undefined && defaultTaxObligations.length > 0) {
        const toSeed = defaultTaxObligations.filter((t) => !deletedTaxObligations.has(t.id));
        await Promise.all(
          toSeed.map((t) => {
            const tRef = doc(db, FirestoreCollections.TAX_OBLIGATIONS, t.id);
            return setDoc(tRef, sanitizeForFirestore(t));
          })
        );
        const taxSettingsRef = doc(db, FirestoreCollections.SETTINGS, 'tax_obligations');
        await setDoc(taxSettingsRef, sanitizeForFirestore({ data: toSeed, updatedAt: new Date().toISOString() }));
      }
      await setDoc(taxSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 13. Ensure bank loans exist in settings if not present
    if (defaultBankLoans !== undefined && defaultBankLoans.length > 0) {
      const loanRef = doc(db, FirestoreCollections.SETTINGS, 'bank_loans');
      const loanSnap = await getDoc(loanRef);
      if (!loanSnap.exists()) {
        await setDoc(loanRef, sanitizeForFirestore({ data: defaultBankLoans, updatedAt: new Date().toISOString() }));
      }
    }

    // 14. Ensure company capital exists in settings if not present
    if (defaultCompanyCapital !== undefined && defaultCompanyCapital !== null) {
      const capRef = doc(db, FirestoreCollections.SETTINGS, 'company_capital');
      const capSnap = await getDoc(capRef);
      if (!capSnap.exists()) {
        await setDoc(capRef, sanitizeForFirestore({ data: defaultCompanyCapital, updatedAt: new Date().toISOString() }));
      }
    }

    // 15. Ensure receivables exist ONLY IF NEVER SEEDED BEFORE (Never resurrect deleted receivables on refresh!)
    const recSeedRef = doc(db, FirestoreCollections.SETTINGS, 'receivables_seed_meta');
    const recSeedSnap = await getDoc(recSeedRef);
    if (!recSeedSnap.exists()) {
      if (defaultReceivables && defaultReceivables.length > 0) {
        const toSeed = defaultReceivables.filter((r) => !deletedReceivables.has(r.id));
        await Promise.all(
          toSeed.map((r) => {
            const rRef = doc(db, FirestoreCollections.RECEIVABLES, r.id);
            return setDoc(rRef, sanitizeForFirestore(r));
          })
        );
      }
      await setDoc(recSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 16. Ensure payroll records exist in Firestore collection & settings ONLY IF NEVER SEEDED BEFORE
    const payrollSeedRef = doc(db, FirestoreCollections.SETTINGS, 'payroll_seed_meta');
    const payrollSeedSnap = await getDoc(payrollSeedRef);
    if (!payrollSeedSnap.exists()) {
      if (defaultPayrollRecords && defaultPayrollRecords.length > 0) {
        const toSeed = defaultPayrollRecords.filter((p) => !deletedPayroll.has(p.id));
        await Promise.all(
          toSeed.map((p) => {
            const pRef = doc(db, FirestoreCollections.PAYROLL, p.id);
            return setDoc(pRef, sanitizeForFirestore(p));
          })
        );
        const payrollRef = doc(db, FirestoreCollections.SETTINGS, 'payroll_records');
        await setDoc(payrollRef, sanitizeForFirestore({ data: toSeed, updatedAt: new Date().toISOString() }));
      }
      await setDoc(payrollSeedRef, { seeded: true, initializedAt: new Date().toISOString() });
    }

    // 17. Ensure company letterhead exists in settings if not present
    if (defaultCompanyLetterhead !== undefined && defaultCompanyLetterhead !== null) {
      const letterheadRef = doc(db, FirestoreCollections.SETTINGS, 'company_letterhead');
      const letterheadSnap = await getDoc(letterheadRef);
      if (!letterheadSnap.exists()) {
        await setDoc(letterheadRef, sanitizeForFirestore({ data: defaultCompanyLetterhead, updatedAt: new Date().toISOString() }));
      }
    }

    // 18. Ensure employee salary configs exist in settings if not present
    if (defaultEmployeeSalaryConfigs !== undefined && defaultEmployeeSalaryConfigs.length > 0) {
      const salaryConfigRef = doc(db, FirestoreCollections.SETTINGS, 'employee_salary_configs');
      const salaryConfigSnap = await getDoc(salaryConfigRef);
      if (!salaryConfigSnap.exists()) {
        await setDoc(salaryConfigRef, sanitizeForFirestore({ data: defaultEmployeeSalaryConfigs, updatedAt: new Date().toISOString() }));
      }
    }

    // 19. Ensure master institution types exist in settings if not present
    if (defaultInstitutionTypes !== undefined && defaultInstitutionTypes.length > 0) {
      const instRef = doc(db, FirestoreCollections.SETTINGS, 'institution_types');
      const instSnap = await getDoc(instRef);
      if (!instSnap.exists()) {
        await setDoc(instRef, sanitizeForFirestore({ data: defaultInstitutionTypes, updatedAt: new Date().toISOString() }));
      }
    }

    // 20. Ensure master term distribution schemes exist in settings if not present
    if (defaultTermSchemes !== undefined && defaultTermSchemes.length > 0) {
      const termRef = doc(db, FirestoreCollections.SETTINGS, 'term_distribution_schemes');
      const termSnap = await getDoc(termRef);
      if (!termSnap.exists()) {
        await setDoc(termRef, sanitizeForFirestore({ data: defaultTermSchemes, updatedAt: new Date().toISOString() }));
      }
    }

    // 21. Ensure office rent contracts exist in settings if not present
    if (defaultOfficeRents !== undefined && defaultOfficeRents.length > 0) {
      const rentRef = doc(db, FirestoreCollections.SETTINGS, 'office_rents');
      const rentSnap = await getDoc(rentRef);
      if (!rentSnap.exists()) {
        await setDoc(rentRef, sanitizeForFirestore({ data: defaultOfficeRents, updatedAt: new Date().toISOString() }));
      }
    }
  } catch (err) {
    console.warn('Firestore initial baseline check notice:', err);
  }
};

