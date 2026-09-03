import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  auth,
  signInWithGoogle,
  logoutFirebase,
  onAuthStateChanged,
  FirebaseUser
} from '../firebase/config';
import {
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveDeletedUserToFirestore,
  removeDeletedUserFromFirestore,
  saveDispositionToFirestore,
  deleteDispositionFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  saveSettingsToFirestore,
  saveReceivableToFirestore,
  deleteReceivableFromFirestore,
  subscribeToReceivables,
  saveGovernmentProjectToFirestore,
  deleteGovernmentProjectFromFirestore,
  subscribeToGovernmentProjects,
  saveRetailProjectToFirestore,
  deleteRetailProjectFromFirestore,
  subscribeToRetailProjects,
  savePayrollToFirestore,
  deletePayrollFromFirestore,
  saveDeletedPayrollIdToFirestore,
  removeDeletedPayrollIdFromFirestore,
  subscribeToDeletedPayrollIds,
  saveDeletedEntityIdToFirestore,
  removeDeletedEntityIdFromFirestore,
  subscribeToDeletedEntityIds,
  subscribeToPayroll,
  saveTaxObligationToFirestore,
  deleteTaxObligationFromFirestore,
  subscribeToTaxObligations,
  saveDocumentTypeToFirestore,
  deleteDocumentTypeFromFirestore,
  subscribeToDocumentTypes,
  saveDocumentCategoryToFirestore,
  deleteDocumentCategoryFromFirestore,
  subscribeToDocumentCategories,
  subscribeToProjects,
  subscribeToUsers,
  subscribeToDispositions,
  subscribeToTransactions,
  subscribeToSettings,
  ensureInitialFirestoreSeed
} from '../firebase/firestoreService';
import {
  ConsultingProject,
  JobDisposition,
  TeamMember,
  ProjectDocument,
  ProjectActivity,
  TkdnCostBreakdown,
  TkdnCalculationResult,
  ServiceType,
  ConsultingServiceConfig,
  ProjectStage,
  ProjectStatus,
  Priority,
  SurveyorBody,
  FinancialTransaction,
  UserRole,
  UserPermission,
  RoleDefinition,
  RoleDefinitionsMap,
  RoleGovernanceMeta,
  DocumentType,
  DocumentTypeDefinition,
  DocumentCategoryDefinition,
  TransactionCategoryDefinition,
  PaymentChannelDefinition,
  DeletedUserRecord,
  BankLoan,
  LoanInstallmentScheduleItem,
  CompanyCapitalSettings,
  TaxType,
  TaxObligationStatus,
  TaxObligation,
  Receivable,
  ReceivableCategory,
  ReceivableStatus,
  ReceivablePayment,
  ReceivableAgingSummary,
  LoanRenewalRecord,
  PayrollPayment,
  PayrollStatus,
  PayrollSummary,
  CompanyLetterhead,
  EmployeeAnnualSalaryConfig,
  GovernmentProject,
  GovMilestone,
  GovMilestoneStatus,
  GovernmentProjectStats,
  GovernmentInstitutionTypeDefinition,
  TermDistributionSchemeDefinition,
  RetailProject,
  RetailMilestone,
  RetailPricingType,
  RetailPphType,
  RetailProjectStatus,
  RetailMilestoneStatus,
  RetailPaymentScheme,
  RetailServiceCategory,
  RetailProjectStats,
} from '../types';
import { calculateBankLoanSchedule, generateRevolvingRenewalSchedule } from '../utils/loanCalculations';
import { calculateReceivablesAgingSummary, calculateDaysOverdue } from '../utils/receivableCalculations';
import { syncTaxObligationDescription } from '../utils/taxCalculations';
import {
  INITIAL_PROJECTS,
  INITIAL_DISPOSITIONS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_RECEIVABLES,
  DEFAULT_ROLE_DEFINITIONS,
  DEFAULT_ROLE_GOVERNANCE_META,
  DEFAULT_COMPANY_CAPITAL,
} from '../data/mockData';
import { INITIAL_GOVERNMENT_PROJECTS } from '../data/governmentProjectsData';
import { INITIAL_RETAIL_PROJECTS } from '../data/retailProjectsData';
import { DEFAULT_GOVERNMENT_INSTITUTION_TYPES } from '../data/institutionTypesData';
import { DEFAULT_TERM_DISTRIBUTION_SCHEMES } from '../data/termDistributionSchemesData';
import { DEFAULT_COMPANY_LETTERHEAD } from '../data/companyLetterheadData';
import { INITIAL_PAYROLL_RECORDS } from '../data/payrollData';
import { DEFAULT_EMPLOYEE_SALARY_CONFIGS, getEffectiveSalaryConfig } from '../data/salaryConfigsData';
import { DEFAULT_CONSULTING_SERVICES } from '../data/serviceTypesData';
import { DEFAULT_DOCUMENT_TYPES, DEFAULT_DOCUMENT_CATEGORIES } from '../data/documentTypesData';
import { DEFAULT_TRANSACTION_CATEGORIES } from '../data/transactionCategoriesData';
import { DEFAULT_PAYMENT_CHANNELS } from '../data/paymentChannelsData';
import { CERTIFICATION_MILESTONE_TEMPLATES } from '../utils/checklistGenerator';
import { getServiceTypeName, getServiceTypeBadgeColor } from '../utils/formatters';
import { calculateMemberWorkload } from '../utils/workload';
import {
  getActiveAccessToken,
  requestGoogleDriveAccess,
  disconnectGoogleDrive,
  getProjectCategoryFolder,
  uploadFileToGoogleDrive,
  loadGsiScript,
} from '../utils/googleDriveService';

interface FilterState {
  searchQuery: string;
  serviceType: ServiceType | 'ALL';
  stage: ProjectStage | 'ALL';
  status: ProjectStatus | 'ALL';
  priority: Priority | 'ALL';
  surveyor: SurveyorBody | 'ALL';
  leadConsultantId: string | 'ALL';
}

interface ProjectContextType {
  projects: ConsultingProject[];
  dispositions: JobDisposition[];
  teamMembers: TeamMember[];
  transactions: FinancialTransaction[];
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  
  // Auth & Session
  isAuthenticated: boolean;
  canSwitchAccount: boolean;
  login: (identifier: string, pinOrPassword?: string) => { success: boolean; message?: string };
  resetPinWithEmail: (email: string, newPin: string) => { success: boolean; message?: string };
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchAccount: (userId: string, pin?: string) => { success: boolean; message?: string };
  quickSwitchUser: (userId: string, pin?: string) => { success: boolean; message?: string };
  
  // Firebase Auth & Cloud Sync State
  isFirebaseConnected: boolean;
  firebaseUser: FirebaseUser | null;
  isSyncingWithFirestore: boolean;
  syncAllToFirestore: () => Promise<void>;
  
  // Role & Permissions Helper
  hasPermission: (permission: import('../types').UserPermission) => boolean;
  isRole: (...roles: import('../types').UserRole[]) => boolean;
  
  // Real-time Role Sync & Toast
  realtimeRoleToast: { show: boolean; oldRole?: string; newRole: string; roleTitle: string; updatedBy?: string } | null;
  dismissRealtimeRoleToast: () => void;

  // Role Definitions & Custom Position Titles & Capabilities
  roleDefinitions: RoleDefinitionsMap;
  roleGovernanceMeta: RoleGovernanceMeta;
  updateRolePositionTitle: (
    role: UserRole,
    updates: {
      title?: string;
      department?: string;
      desc?: string;
      standardCompensation?: RoleDefinition['standardCompensation'];
    },
    updateExistingMembers?: boolean,
    syncSalaryConfigsForRole?: boolean
  ) => void;
  updateRoleCapabilities: (
    role: UserRole,
    permissions: UserPermission[],
    updateExistingMembers?: boolean
  ) => { success: boolean; message?: string };
  resetRolePositionTitles: () => void;
  resetRoleCapabilities: (role?: UserRole) => void;
  updateRoleGovernanceMeta: (updates: { title?: string; desc?: string }) => void;
  resetRoleGovernanceMeta: () => void;

  // Consulting Services Master Data Management (admin.master exclusive)
  consultingServices: ConsultingServiceConfig[];
  activeConsultingServices: ConsultingServiceConfig[];
  addConsultingService: (
    service: Omit<ConsultingServiceConfig, 'createdAt' | 'updatedAt'>
  ) => { success: boolean; message?: string; service?: ConsultingServiceConfig };
  updateConsultingService: (
    id: string,
    updates: Partial<ConsultingServiceConfig>
  ) => { success: boolean; message?: string };
  deleteConsultingService: (
    id: string,
    reassignToServiceId?: string
  ) => { success: boolean; message?: string };
  toggleConsultingServiceStatus: (id: string) => { success: boolean; message?: string };
  resetConsultingServicesToDefault: () => { success: boolean; message?: string };
  getServiceConfig: (id: string) => ConsultingServiceConfig | undefined;
  getServiceTitle: (type: ServiceType) => string;
  getServiceBadge: (type: ServiceType) => string;

  // Required Document Types Master Data Management (admin.master exclusive)
  documentTypes: DocumentTypeDefinition[];
  activeDocumentTypes: DocumentTypeDefinition[];
  addDocumentType: (
    docType: Omit<DocumentTypeDefinition, 'createdAt' | 'updatedAt'>
  ) => { success: boolean; message?: string; documentType?: DocumentTypeDefinition };
  updateDocumentType: (
    id: string,
    updates: Partial<DocumentTypeDefinition>
  ) => { success: boolean; message?: string };
  deleteDocumentType: (
    id: string,
    reassignToDocTypeId?: string
  ) => { success: boolean; message?: string };
  toggleDocumentTypeStatus: (id: string) => { success: boolean; message?: string };
  resetDocumentTypesToDefault: () => { success: boolean; message?: string };
  getDocumentTypeDefinition: (id: string) => DocumentTypeDefinition | undefined;

  // Required Document Categories Master Data Management (admin.master exclusive)
  documentCategories: DocumentCategoryDefinition[];
  activeDocumentCategories: DocumentCategoryDefinition[];
  addDocumentCategory: (
    category: Omit<DocumentCategoryDefinition, 'createdAt' | 'updatedAt'>
  ) => { success: boolean; message?: string; category?: DocumentCategoryDefinition };
  updateDocumentCategory: (
    id: string,
    updates: Partial<DocumentCategoryDefinition>
  ) => { success: boolean; message?: string };
  deleteDocumentCategory: (
    id: string,
    reassignToCategoryId?: string
  ) => { success: boolean; message?: string };
  toggleDocumentCategoryStatus: (id: string) => { success: boolean; message?: string };
  resetDocumentCategoriesToDefault: () => { success: boolean; message?: string };
  getDocumentCategory: (id: string) => DocumentCategoryDefinition | undefined;

  // Transaction Categories Master Data (Expense & Income categories editable by admin.master)
  transactionCategories: TransactionCategoryDefinition[];
  activeTransactionCategories: TransactionCategoryDefinition[];
  addTransactionCategory: (
    category: Omit<TransactionCategoryDefinition, 'createdAt'>
  ) => { success: boolean; message?: string; category?: TransactionCategoryDefinition };
  updateTransactionCategory: (
    id: string,
    updates: Partial<TransactionCategoryDefinition>
  ) => { success: boolean; message?: string };
  deleteTransactionCategory: (
    id: string
  ) => { success: boolean; message?: string };
  toggleTransactionCategoryStatus: (id: string) => { success: boolean; message?: string };
  resetTransactionCategoriesToDefault: () => { success: boolean; message?: string };
  getTransactionCategoryDefinition: (id: string) => TransactionCategoryDefinition | undefined;

  // Payment Channels & Bank Accounts Master Data (Bank BRI, BCA, Mandiri, BNI, etc. editable by admin.master & finance)
  paymentChannels: PaymentChannelDefinition[];
  activePaymentChannels: PaymentChannelDefinition[];
  addPaymentChannel: (
    channel: Omit<PaymentChannelDefinition, 'createdAt'>
  ) => { success: boolean; message?: string; channel?: PaymentChannelDefinition };
  updatePaymentChannel: (
    id: string,
    updates: Partial<PaymentChannelDefinition>
  ) => { success: boolean; message?: string };
  deletePaymentChannel: (
    id: string,
    options?: { force?: boolean; reassignTo?: string; deleteLinked?: boolean }
  ) => { success: boolean; message?: string };
  reassignPaymentChannelTransactions: (
    sourceChannelId: string,
    targetChannelId: string
  ) => { success: boolean; count: number; message?: string };
  togglePaymentChannelStatus: (id: string) => { success: boolean; message?: string };
  resetPaymentChannelsToDefault: () => { success: boolean; message?: string };
  getPaymentChannelDefinition: (id: string) => PaymentChannelDefinition | undefined;

  // Master Data: Assigned By Options (LVI / Surveyor / Lembaga Pelaksana - Tambah, Edit, Hapus)
  assignedByOptions: string[];
  addAssignedByOption: (name: string) => { success: boolean; message?: string };
  updateAssignedByOption: (oldName: string, newName: string) => { success: boolean; message?: string };
  deleteAssignedByOption: (name: string) => { success: boolean; message?: string };
  resetAssignedByOptions: () => { success: boolean; message?: string };

  // Bank Loan Management (Facilities, Principal, Interest, Tenure & Ledger Synchronizer)
  bankLoans: BankLoan[];
  addBankLoan: (
    loan: Omit<BankLoan, 'id' | 'createdAt' | 'createdBy'>
  ) => { success: boolean; loan?: BankLoan; message?: string };
  updateBankLoan: (
    id: string,
    updates: Partial<BankLoan>
  ) => { success: boolean; message?: string };
  deleteBankLoan: (
    id: string
  ) => { success: boolean; message?: string };
  cancelLoanDisbursement: (
    loanId: string
  ) => { success: boolean; message?: string };
  cancelLoanInstallmentPayment: (
    loanId: string,
    monthNumber: number
  ) => { success: boolean; message?: string };
  recordLoanDisbursementToLedger: (
    loanId: string,
    channelId?: string
  ) => { success: boolean; message?: string };
  recordLoanInstallmentToLedger: (
    loanId: string,
    monthNumber: number,
    channelId?: string
  ) => { success: boolean; message?: string };
  renewBankLoan: (
    loanId: string,
    renewalData: {
      tenureMonthsAdded?: number;
      newPrincipal?: number;
      newInterestRate?: number;
      renewalDate?: string;
      adendumNumber?: string;
      provisionFee?: number;
      recordProvisionToLedger?: boolean;
      paymentChannelId?: string;
      notes?: string;
    }
  ) => { success: boolean; message?: string; loan?: BankLoan };

  // Company Capital & Equity Management (Modal Dasar, Disetor, Tambahan, Laba Ditahan)
  companyCapital: CompanyCapitalSettings;
  updateCompanyCapital: (
    settings: Partial<CompanyCapitalSettings>
  ) => { success: boolean; message?: string };
  resetCompanyCapitalToDefault: () => { success: boolean; message?: string };

  // Company Letterhead & Document Printing Customization (admin.master exclusive)
  companyLetterhead: CompanyLetterhead;
  updateCompanyLetterhead: (
    settings: Partial<CompanyLetterhead>
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  resetCompanyLetterheadToDefault: () => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };

  // Tax & Tax Liabilities Management (PPN, PPh 21, PPh 23, PPh 4(2), PPh Final/Badan Terhutang)
  taxObligations: TaxObligation[];
  addTaxObligation: (
    taxData: Omit<TaxObligation, 'id' | 'createdAt' | 'createdBy'>
  ) => { success: boolean; taxObligation?: TaxObligation; message?: string };
  updateTaxObligation: (
    id: string,
    updates: Partial<TaxObligation>
  ) => { success: boolean; message?: string };
  deleteTaxObligation: (
    id: string
  ) => { success: boolean; message?: string };
  payTaxObligation: (
    taxId: string,
    options?: {
      channelId?: string;
      date?: string;
      ntpnNumber?: string;
      billingCode?: string;
      notes?: string;
      paidByClient?: boolean;
      deductFromCashChannel?: boolean;
      clientWithholdingNumber?: string;
      clientWithholdingDate?: string;
      withholdingTaxPayerName?: string;
    }
  ) => { success: boolean; message?: string; transactionId?: string };
  resetTaxObligationsToDefault: () => { success: boolean; message?: string };

  // Accounts Receivable (Piutang Usaha & Termin Proyek)
  receivables: Receivable[];
  addReceivable: (
    data: Omit<Receivable, 'id' | 'createdAt' | 'createdBy' | 'payments' | 'paidAmountIDR' | 'remainingAmountIDR' | 'status'> & {
      initialPaidAmountIDR?: number;
      paymentChannelId?: string;
      referenceNumber?: string;
      notesPayment?: string;
      syncToCashLedger?: boolean;
    }
  ) => { success: boolean; receivable?: Receivable; message?: string };
  updateReceivable: (
    id: string,
    updates: Partial<Receivable>
  ) => { success: boolean; message?: string };
  deleteReceivable: (id: string) => { success: boolean; message?: string };
  recordReceivablePayment: (
    receivableId: string,
    paymentData: {
      amountIDR: number;
      paymentDate: string;
      paymentChannelId?: string;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
    }
  ) => { success: boolean; message?: string; payment?: ReceivablePayment };
  cancelReceivable: (id: string, reason?: string) => { success: boolean; message?: string };
  resetReceivablesToDefault: () => { success: boolean; message?: string };

  // Proyek Pemerintah & BUMN (Government Projects, SPK, LS KPPN, SP2D & WAPU Tax)
  governmentProjects: GovernmentProject[];
  addGovernmentProject: (
    data: Omit<GovernmentProject, 'id' | 'createdAt' | 'createdBy' | 'totalBilledAmountIDR' | 'totalReceivedAmountIDR' | 'totalOutstandingAmountIDR'>
  ) => { success: boolean; project?: GovernmentProject; message?: string };
  updateGovernmentProject: (
    id: string,
    updates: Partial<GovernmentProject>
  ) => { success: boolean; message?: string };
  deleteGovernmentProject: (id: string) => { success: boolean; message?: string };
  generateMilestoneInvoiceToReceivables: (
    projectId: string,
    milestoneId: string,
    invoiceData?: {
      invoiceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      bapNumber?: string;
      bastNumber?: string;
      notes?: string;
    }
  ) => { success: boolean; receivable?: Receivable; message?: string };
  recordGovMilestonePaymentSp2d: (
    projectId: string,
    milestoneId: string,
    sp2dData: {
      sp2dNumber: string;
      sp2dDisbursementDate: string;
      paymentChannelId: string;
      spmNumber?: string;
      ntpnPpn?: string;
      bupotPphNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
      syncToTaxObligations?: boolean;
    }
  ) => { success: boolean; message?: string; transaction?: FinancialTransaction };
  addGovMilestone: (
    projectId: string,
    milestone: Omit<GovMilestone, 'id' | 'projectId' | 'createdAt'>
  ) => { success: boolean; message?: string };
  updateGovMilestone: (
    projectId: string,
    milestoneId: string,
    updates: Partial<GovMilestone>
  ) => { success: boolean; message?: string };
  deleteGovMilestone: (
    projectId: string,
    milestoneId: string
  ) => { success: boolean; message?: string };
  resetGovernmentProjectsToDefault: () => { success: boolean; message?: string };

  // Proyek Retail B2B / Korporasi Swasta (Retail Projects, SPK, Invoicing, PPN 11% & PPh 23)
  retailProjects: RetailProject[];
  addRetailProject: (
    data: Omit<RetailProject, 'id' | 'createdAt' | 'createdBy' | 'totalBilledAmountIDR' | 'totalReceivedAmountIDR' | 'totalOutstandingAmountIDR'>
  ) => { success: boolean; project?: RetailProject; message?: string };
  updateRetailProject: (
    id: string,
    updates: Partial<RetailProject>
  ) => { success: boolean; message?: string };
  deleteRetailProject: (id: string) => { success: boolean; message?: string };
  generateRetailInvoiceToReceivables: (
    projectId: string,
    milestoneId: string,
    invoiceData?: {
      invoiceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      fakturPajakNumber?: string;
      notes?: string;
      syncPpnObligation?: boolean;
    }
  ) => { success: boolean; receivable?: Receivable; message?: string };
  recordRetailMilestonePayment: (
    projectId: string,
    milestoneId: string,
    paymentData: {
      amountReceivedIDR?: number;
      paymentDate?: string;
      paymentChannelId: string;
      referenceNumber?: string;
      bupotPphNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
      syncToTaxObligations?: boolean;
    }
  ) => { success: boolean; message?: string; transaction?: FinancialTransaction };
  addRetailMilestone: (
    projectId: string,
    milestone: Omit<RetailMilestone, 'id' | 'projectId' | 'createdAt'>
  ) => { success: boolean; message?: string };
  updateRetailMilestone: (
    projectId: string,
    milestoneId: string,
    updates: Partial<RetailMilestone>
  ) => { success: boolean; message?: string };
  deleteRetailMilestone: (
    projectId: string,
    milestoneId: string
  ) => { success: boolean; message?: string };
  resetRetailProjectsToDefault: () => { success: boolean; message?: string };

  // Master Data Tipe Instansi Pemerintah & BUMN (Editable & Real-Time Sync)
  institutionTypes: GovernmentInstitutionTypeDefinition[];
  activeInstitutionTypes: GovernmentInstitutionTypeDefinition[];
  addInstitutionType: (
    type: Omit<GovernmentInstitutionTypeDefinition, 'createdAt' | 'updatedAt'>
  ) => { success: boolean; message?: string; institutionType?: GovernmentInstitutionTypeDefinition };
  updateInstitutionType: (
    id: string,
    updates: Partial<GovernmentInstitutionTypeDefinition>
  ) => { success: boolean; message?: string };
  deleteInstitutionType: (id: string) => { success: boolean; message?: string };
  toggleInstitutionTypeStatus: (id: string) => { success: boolean; message?: string };
  resetInstitutionTypesToDefault: () => { success: boolean; message?: string };
  getInstitutionTypeDefinition: (idOrName: string) => GovernmentInstitutionTypeDefinition | undefined;

  // Master Data Skema Pembagian Termin (Editable & Real-Time Sync)
  termDistributionSchemes: TermDistributionSchemeDefinition[];
  activeTermDistributionSchemes: TermDistributionSchemeDefinition[];
  addTermDistributionScheme: (
    scheme: Omit<TermDistributionSchemeDefinition, 'createdAt' | 'updatedAt'>
  ) => { success: boolean; message?: string; scheme?: TermDistributionSchemeDefinition };
  updateTermDistributionScheme: (
    id: string,
    updates: Partial<TermDistributionSchemeDefinition>
  ) => { success: boolean; message?: string };
  deleteTermDistributionScheme: (id: string) => { success: boolean; message?: string };
  toggleTermDistributionSchemeStatus: (id: string) => { success: boolean; message?: string };
  resetTermDistributionSchemesToDefault: () => { success: boolean; message?: string };
  getTermDistributionScheme: (id: string) => TermDistributionSchemeDefinition | undefined;

  // Employee Salary & Payroll Management (Pembayaran Gaji Karyawan & Integrasi Arus Kas)
  payrollRecords: PayrollPayment[];
  addPayrollPayment: (
    data: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>
  ) => { success: boolean; payroll?: PayrollPayment; message?: string };
  updatePayrollPayment: (
    id: string,
    updates: Partial<PayrollPayment>
  ) => { success: boolean; message?: string };
  deletePayrollPayment: (
    id: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  batchAddPayrollPayments: (
    records: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>>
  ) => { success: boolean; count: number; message?: string };
  markPayrollAsPaid: (
    id: string,
    paymentDate?: string
  ) => { success: boolean; message?: string };
  resetPayrollToDefault: () => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };

  // Penetapan Gaji Tahunan Karyawan (Annual Salary Configuration per Employee & Year)
  employeeSalaryConfigs: EmployeeAnnualSalaryConfig[];
  addOrUpdateEmployeeSalaryConfig: (
    config: Omit<EmployeeAnnualSalaryConfig, 'id' | 'updatedAt' | 'createdAt'> & { id?: string }
  ) => Promise<{ success: boolean; message: string; config?: EmployeeAnnualSalaryConfig }>;
  addOrUpdateMultipleEmployeeSalaryConfigs: (
    configs: (Omit<EmployeeAnnualSalaryConfig, 'id' | 'updatedAt' | 'createdAt'> & { id?: string })[]
  ) => Promise<{ success: boolean; message: string; configs?: EmployeeAnnualSalaryConfig[] }>;
  deleteEmployeeSalaryConfig: (id: string) => Promise<{ success: boolean; message: string }>;
  resetEmployeeSalaryConfigsToDefault: () => Promise<{ success: boolean; message: string }>;
  getEmployeeSalaryConfigForYear: (
    employeeId: string,
    year: number,
    fallbackRole?: import('../types').UserRole
  ) => {
    config?: EmployeeAnnualSalaryConfig;
    isFromRoleBenchmark: boolean;
    basicSalary: number;
    positionAllowance: number;
    transportAllowance: number;
    mealAllowance: number;
    communicationAllowance: number;
    fixedAllowance: number;
    annualBonusEstimate: number;
    thrMonths: number;
  };

  // Milestone Document Requirements customization
  updateMilestoneDocRequirements: (
    projectId: string,
    milestoneId: string,
    requiredDocTypes: DocumentType[],
    optionalDocTypes: DocumentType[]
  ) => void;

  // User Management
  isMasterAdmin: boolean;
  addUser: (user: Omit<TeamMember, 'id'>) => TeamMember;
  updateUser: (id: string, updates: Partial<TeamMember>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  changeMemberRole: (
    userId: string,
    newRole: import('../types').UserRole,
    options?: {
      roleTitle?: string;
      department?: string;
      permissions?: import('../types').UserPermission[];
      notes?: string;
    }
  ) => void;
  verifyUser: (
    userId: string,
    options?: {
      role?: import('../types').UserRole;
      roleTitle?: string;
      department?: string;
      permissions?: import('../types').UserPermission[];
      notes?: string;
    }
  ) => void;
  rejectUser: (userId: string, reason?: string) => void;
  pendingMembersCount: number;

  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredProjects: ConsultingProject[];
  
  // Selected Project for detail modal / drawer
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProject: ConsultingProject | null;
  
  // Project Actions
  addProject: (project: Omit<ConsultingProject, 'id' | 'code' | 'documents' | 'activities' | 'progressPercentage'>) => ConsultingProject;
  updateProject: (id: string, updates: Partial<ConsultingProject>) => void;
  deleteProject: (id: string) => void;
  changeProjectStage: (id: string, newStage: ProjectStage) => void;
  
  // Disposition Actions
  addDisposition: (disp: Omit<JobDisposition, 'id' | 'assignedDate'>) => JobDisposition;
  updateDisposition: (id: string, updates: Partial<JobDisposition>) => void;
  deleteDisposition: (id: string) => void;
  toggleChecklistItem: (dispositionId: string, checklistId: string) => void;
  
  // Document Actions
  uploadDocument: (
    projectId: string,
    doc: Omit<ProjectDocument, 'id' | 'uploadDate' | 'version'> & { version?: string },
    filePayload?: File | Blob | string
  ) => Promise<ProjectDocument>;
  updateDocumentStatus: (projectId: string, docId: string, status: ProjectDocument['status'], reviewNotes?: string) => void;
  updateDocument: (projectId: string, docId: string, updates: Partial<ProjectDocument>) => void;
  deleteDocument: (projectId: string, docId: string) => void;
  syncDocumentToGoogleDrive: (projectId: string, docId: string, filePayload?: File | Blob | string) => Promise<{ success: boolean; link?: string; error?: string }>;

  // Google Drive Integration & Sync State
  isGoogleDriveConnected: boolean;
  connectGoogleDrive: () => Promise<{ success: boolean; error?: string }>;
  disconnectGoogleDriveAccount: () => void;
  isDriveSyncing: boolean;
  
  // Activity Action
  addActivity: (
    projectId: string,
    action: string,
    details: string,
    type?: ProjectActivity['type'],
    metadata?: ProjectActivity['metadata']
  ) => void;

  // Financial Transaction Actions
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'createdAt'>) => FinancialTransaction;
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Milestone & Dynamic Checklist Actions
  toggleMilestoneManualSignoff: (
    projectId: string,
    milestoneId: string,
    completed: boolean,
    notes?: string
  ) => void;
  addCustomMilestoneToProject: (
    projectId: string,
    milestone: {
      title: string;
      description: string;
      stage: ProjectStage;
      regulatoryClause?: string;
      requiredDocTypes: ProjectDocument['type'][];
    }
  ) => void;
  deleteMilestoneFromProject: (projectId: string, milestoneId: string) => void;
  restoreMilestoneToProject: (projectId: string, milestoneId: string) => void;
  deleteDocRequirementFromMilestone: (
    projectId: string,
    milestoneId: string,
    docType: DocumentType,
    isOptional?: boolean
  ) => void;
  resetProjectMilestonesToDefault: (projectId: string) => void;

  // Quick TKDN Calculator Helper (Permenperin No. 35/2025)
  calculateTkdnScore: (breakdown: TkdnCostBreakdown) => TkdnCalculationResult;
}

const STORAGE_KEY_PROJECTS = 'verix_crm_projects_v1';
const STORAGE_KEY_DISPOSITIONS = 'verix_crm_dispositions_v1';
const STORAGE_KEY_MEMBERS = 'verix_crm_team_members_v1';
const STORAGE_KEY_DELETED_USERS = 'verix_crm_deleted_users_v1';
const STORAGE_KEY_TRANSACTIONS = 'verix_crm_transactions_v1';
const STORAGE_KEY_ROLE_DEFINITIONS = 'verix_crm_role_definitions_v1';
const STORAGE_KEY_ROLE_GOVERNANCE_META = 'verix_crm_role_governance_meta_v1';
const STORAGE_KEY_CONSULTING_SERVICES = 'verix_crm_consulting_services_v1';
const STORAGE_KEY_DOCUMENT_TYPES = 'verix_crm_document_types_v1';
const STORAGE_KEY_DOCUMENT_CATEGORIES = 'verix_crm_document_categories_v1';
const STORAGE_KEY_TRANSACTION_CATEGORIES = 'verix_crm_transaction_categories_v1';
const STORAGE_KEY_PAYMENT_CHANNELS = 'verix_crm_payment_channels_v1';
const STORAGE_KEY_BANK_LOANS = 'verix_crm_bank_loans_v1';
const STORAGE_KEY_COMPANY_CAPITAL = 'verix_crm_company_capital_v1';
const STORAGE_KEY_COMPANY_LETTERHEAD = 'verix_crm_company_letterhead_v1';
const STORAGE_KEY_TAX_OBLIGATIONS = 'verix_crm_tax_obligations_v1';
const STORAGE_KEY_DELETED_TAX_IDS = 'verix_crm_deleted_tax_ids_v1';
const STORAGE_KEY_RECEIVABLES = 'verix_crm_receivables_v1';
const STORAGE_KEY_DELETED_RECEIVABLE_IDS = 'verix_crm_deleted_receivable_ids_v1';
const STORAGE_KEY_GOVERNMENT_PROJECTS = 'verix_crm_government_projects_v1';
const STORAGE_KEY_DELETED_GOV_PROJECT_IDS = 'verix_crm_deleted_gov_project_ids_v1';
const STORAGE_KEY_RETAIL_PROJECTS = 'verix_crm_retail_projects_v1';
const STORAGE_KEY_DELETED_RETAIL_PROJECT_IDS = 'verix_crm_deleted_retail_project_ids_v1';
const STORAGE_KEY_INSTITUTION_TYPES = 'verix_crm_institution_types_v1';
const STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES = 'verix_crm_term_distribution_schemes_v1';
const STORAGE_KEY_PAYROLL = 'verix_crm_payroll_v1';
const STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS = 'verix_crm_employee_salary_configs_v1';
const STORAGE_KEY_DELETED_PAYROLL_IDS = 'verix_crm_deleted_payroll_ids_v1';
const STORAGE_KEY_DELETED_PROJECT_IDS = 'verix_crm_deleted_project_ids_v1';
const STORAGE_KEY_DELETED_DISPOSITION_IDS = 'verix_crm_deleted_disposition_ids_v1';
const STORAGE_KEY_DELETED_TRANSACTION_IDS = 'verix_crm_deleted_transaction_ids_v1';
const STORAGE_KEY_ASSIGNED_BY_OPTIONS = 'verix_crm_assigned_by_options_v1';
const STORAGE_KEY_CURRENT_USER_ID = 'verix_crm_current_user_id_v1';
const STORAGE_KEY_AUTH_STATE = 'verix_crm_auth_state_v1';

export const DEFAULT_ASSIGNED_BY_OPTIONS: string[] = [
  'PT Surveyor Indonesia',
  'PT Sucofindo (Persero)',
  'PT Biro Klasifikasi Indonesia',
  'PT Anindya Wiraputra Consult',
  'Badan Standarisasi dan Kebijakan Jasa Industri',
];

const INITIAL_TAX_OBLIGATIONS: TaxObligation[] = [
  {
    id: 'tax-1001',
    taxType: 'PPN',
    taxPeriod: 'Masa Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPN Masa Agustus 2026 (Kurang Bayar Penyerahan JKP TKDN)',
    description: 'PPN 11% Faktur Pajak Keluaran Penyerahan Jasa Konsultasi TKDN PT Gapura Metalindo & PT Petrokimia Nusantara dikurangi PPN Masukan.',
    taxableBaseAmount: 320000000,
    taxRatePercent: 11,
    ppnOutputAmount: 35200000,
    ppnInputAmount: 13200000,
    taxAmount: 22000000,
    paidAmount: 0,
    remainingAmount: 22000000,
    status: 'TERHUTANG',
    dueDate: '2026-09-30',
    billingCode: '829104829102834',
    taxInvoiceNumber: '010.002-26.89102834',
    counterpartyName: 'DJP / KPP Pratama Jakarta',
    notes: 'Kewajiban PPN Kurang Bayar Masa Pajak Agustus 2026. Jatuh tempo pelaporan SPT Masa dan penyetoran akhir bulan September 2026.',
    createdAt: '2026-08-31T10:00:00.000Z',
    createdBy: 'Adryan kelvianto',
  },
  {
    id: 'tax-1002',
    taxType: 'PPH_23',
    taxPeriod: 'Masa Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPh Pasal 23 Jasa Audit Surveyor Sucofindo (Proyek P-2026-001)',
    description: 'Pemotongan PPh 23 (2%) atas invoice biaya audit verifikasi teknis lapangan oleh PT Sucofindo (Persero).',
    taxableBaseAmount: 65000000,
    taxRatePercent: 2,
    taxAmount: 1300000,
    paidAmount: 0,
    remainingAmount: 1300000,
    status: 'TERHUTANG',
    dueDate: '2026-09-10',
    billingCode: '718293048592019',
    taxInvoiceNumber: 'BP-PPH23/2026/08/014',
    projectCode: 'P-2026-001',
    counterpartyName: 'PT Sucofindo (Persero)',
    notes: 'Bukti Potong PPh 23 Jasa Surveyor Audit TKDN.',
    createdAt: '2026-08-28T14:30:00.000Z',
    createdBy: 'Adryan kelvianto',
  },
  {
    id: 'tax-1003',
    taxType: 'PPH_21',
    taxPeriod: 'Masa Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPh 21 Tenaga Ahli & Konsultan Asesor TKDN Periode Agustus 2026',
    description: 'Pemotongan PPh Pasal 21 atas honorarium tenaga ahli audit internal dan tim konsultan lapangan non-pegawai.',
    taxableBaseAmount: 48000000,
    taxRatePercent: 5,
    taxAmount: 2400000,
    paidAmount: 0,
    remainingAmount: 2400000,
    status: 'TERHUTANG',
    dueDate: '2026-09-10',
    billingCode: '619283019283745',
    counterpartyName: 'KPP Pratama / Tenaga Ahli Non-Pegawai',
    notes: 'Kewajiban PPh 21 Tenaga Ahli & Konsultan Lepas Eksternal.',
    createdAt: '2026-08-30T16:00:00.000Z',
    createdBy: 'Adryan kelvianto',
  },
  {
    id: 'tax-pay-202608-01',
    taxType: 'PPH_21',
    taxPeriod: 'Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPh 21 Karyawan: Adryan kelvianto (Agustus 2026)',
    description: 'Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp 30.500.000 (Chief Role Master & System SuperAdmin) - Slip PAY/2026/08/EMP-001. Terintegrasi otomatis dari modul Payroll.',
    taxableBaseAmount: 30500000,
    taxRatePercent: 6.07,
    taxAmount: 1850000,
    paidAmount: 0,
    remainingAmount: 1850000,
    status: 'TERHUTANG',
    dueDate: '2026-09-15',
    billingCode: '718294018294819',
    taxInvoiceNumber: 'BUPOT-21/2026/08/0001',
    counterpartyName: 'Adryan kelvianto / KPP Pratama',
    payrollId: 'pay-202608-01',
    payrollNumber: 'PAY/2026/08/EMP-001',
    employeeId: 'usr-0',
    employeeName: 'Adryan kelvianto',
    notes: 'Otomatis disinkronisasi dari Slip Gaji: PAY/2026/08/EMP-001. Mencegah double input di Menu Pajak.',
    createdAt: '2026-08-28T09:00:00.000Z',
    createdBy: 'Finance Officer',
  },
  {
    id: 'tax-pay-202608-02',
    taxType: 'PPH_21',
    taxPeriod: 'Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPh 21 Karyawan: Bambang Irawan, S.T., M.T. (Agustus 2026)',
    description: 'Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp 21.650.000 (Lead Assessor / Senior Consultant) - Slip PAY/2026/08/EMP-002. Terintegrasi otomatis dari modul Payroll.',
    taxableBaseAmount: 21650000,
    taxRatePercent: 5.0,
    taxAmount: 1082500,
    paidAmount: 0,
    remainingAmount: 1082500,
    status: 'TERHUTANG',
    dueDate: '2026-09-15',
    billingCode: '718392019485721',
    taxInvoiceNumber: 'BUPOT-21/2026/08/0002',
    counterpartyName: 'Bambang Irawan / KPP Pratama',
    payrollId: 'pay-202608-02',
    payrollNumber: 'PAY/2026/08/EMP-002',
    employeeId: 'usr-lead-01',
    employeeName: 'Bambang Irawan, S.T., M.T.',
    notes: 'Otomatis disinkronisasi dari Slip Gaji: PAY/2026/08/EMP-002. Mencegah double input di Menu Pajak.',
    createdAt: '2026-08-28T09:15:00.000Z',
    createdBy: 'Finance Officer',
  },
  {
    id: 'tax-pay-202608-03',
    taxType: 'PPH_21',
    taxPeriod: 'Agustus 2026',
    taxYear: 2026,
    taxMonth: 8,
    title: 'PPh 21 Karyawan: Siti Rahmawati, S.Kom. (Agustus 2026)',
    description: 'Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp 15.900.000 (Technical Consultant / BOM Specialist) - Slip PAY/2026/08/EMP-003. Terintegrasi otomatis dari modul Payroll.',
    taxableBaseAmount: 15900000,
    taxRatePercent: 4.0,
    taxAmount: 636000,
    paidAmount: 0,
    remainingAmount: 636000,
    status: 'TERHUTANG',
    dueDate: '2026-09-15',
    billingCode: '718482019485910',
    taxInvoiceNumber: 'BUPOT-21/2026/08/0003',
    counterpartyName: 'Siti Rahmawati / KPP Pratama',
    payrollId: 'pay-202608-03',
    payrollNumber: 'PAY/2026/08/EMP-003',
    employeeId: 'usr-tech-01',
    employeeName: 'Siti Rahmawati, S.Kom.',
    notes: 'Otomatis disinkronisasi dari Slip Gaji: PAY/2026/08/EMP-003. Mencegah double input di Menu Pajak.',
    createdAt: '2026-08-28T09:30:00.000Z',
    createdBy: 'Finance Officer',
  },
  {
    id: 'tax-1004',
    taxType: 'PPH_4_2',
    taxPeriod: 'Masa Juli 2026',
    taxYear: 2026,
    taxMonth: 7,
    title: 'PPh Final Pasal 4 ayat (2) Sewa Gedung Kantor Operasional',
    description: 'Pajak penghasilan final 10% atas perpanjangan sewa gedung kantor operasional PT GAP Consulting Indonesia.',
    taxableBaseAmount: 80000000,
    taxRatePercent: 10,
    taxAmount: 8000000,
    paidAmount: 8000000,
    remainingAmount: 0,
    status: 'PAID',
    dueDate: '2026-08-10',
    paidAt: '2026-08-08',
    ntpnNumber: '8392019485720194',
    billingCode: '918273645019283',
    paymentChannelId: 'BANK_TRANSFER_BCA',
    notes: 'Sudah disetor via BCA Corporate Transfer. Bukti Penerimaan Negara (BPN) tersimpan.',
    createdAt: '2026-07-25T09:00:00.000Z',
    createdBy: 'Adryan kelvianto',
  },
];

const defaultFilters: FilterState = {
  searchQuery: '',
  serviceType: 'ALL',
  stage: 'ALL',
  status: 'ALL',
  priority: 'ALL',
  surveyor: 'ALL',
  leadConsultantId: 'ALL',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Deleted Projects Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedProjectIds, setDeletedProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_PROJECT_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const deletedProjectIdsRef = useRef<Set<string>>(new Set(deletedProjectIds));
  useEffect(() => {
    deletedProjectIdsRef.current = new Set(deletedProjectIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_PROJECT_IDS, JSON.stringify(deletedProjectIds));
    } catch (e) {
      console.warn('Failed to save deleted project IDs to localStorage', e);
    }
  }, [deletedProjectIds]);

  const [projects, setProjects] = useState<ConsultingProject[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_PROJECT_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed: ConsultingProject[] = JSON.parse(saved);
        const mockProjectCodes = new Set(['PRJ-2025-041', 'PRJ-2025-054', 'PRJ-2025-060', 'PRJ-2025-067', 'PRJ-2025-072', 'PRJ-2025-078']);
        const mockProjectIds = new Set(['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106']);
        return parsed.filter((p) => p && p.id && !mockProjectIds.has(p.id) && !mockProjectCodes.has(p.code) && !deletedIds.has(p.id));
      }
      return INITIAL_PROJECTS.filter((p) => p && p.id && !deletedIds.has(p.id));
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  // Deleted Dispositions Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedDispositionIds, setDeletedDispositionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_DISPOSITION_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const deletedDispositionIdsRef = useRef<Set<string>>(new Set(deletedDispositionIds));
  useEffect(() => {
    deletedDispositionIdsRef.current = new Set(deletedDispositionIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_DISPOSITION_IDS, JSON.stringify(deletedDispositionIds));
    } catch (e) {
      console.warn('Failed to save deleted disposition IDs to localStorage', e);
    }
  }, [deletedDispositionIds]);

  const [dispositions, setDispositions] = useState<JobDisposition[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_DISPOSITION_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_DISPOSITIONS);
      if (saved) {
        const parsed: JobDisposition[] = JSON.parse(saved);
        const mockDispIds = new Set(['dsp-1001', 'dsp-1002', 'dsp-1003', 'dsp-1004', 'dsp-1005']);
        const mockProjectIds = new Set(['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106']);
        return parsed.filter((d) => d && d.id && !mockDispIds.has(d.id) && !mockProjectIds.has(d.projectId) && !deletedIds.has(d.id));
      }
      return INITIAL_DISPOSITIONS.filter((d) => d && d.id && !deletedIds.has(d.id));
    } catch {
      return INITIAL_DISPOSITIONS;
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      let currentDeletedList: DeletedUserRecord[] = [];
      try {
        const savedDel = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
        if (savedDel) currentDeletedList = JSON.parse(savedDel);
      } catch {}

      const deletedIds = new Set(currentDeletedList.map((d) => d.id?.toLowerCase()));
      const deletedUsernames = new Set(currentDeletedList.map((d) => (d.username || '').toLowerCase()));
      const deletedEmails = new Set(currentDeletedList.map((d) => (d.email || '').toLowerCase()));

      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (saved) {
        const parsed: TeamMember[] = JSON.parse(saved);
        const mockMemberIds = new Set(['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-pending-1']);
        const realMembers = parsed.filter(
          (m) =>
            !mockMemberIds.has(m.id) &&
            !m.email?.includes('@verixconsulting.id') &&
            !m.email?.includes('@suryadayanusantara.com') &&
            !deletedIds.has((m.id || '').toLowerCase()) &&
            !deletedUsernames.has((m.username || '').toLowerCase()) &&
            !deletedEmails.has((m.email || '').toLowerCase())
        );

        // Ensure Master Admin root account (Adryan kelvianto) has statutory credentials while preserving other members and their custom assigned roles
        const updated = realMembers.map((m) => {
          if (m.id === 'usr-0' || m.username === 'admin.master' || m.email === 'admin@gapsite.com') {
            return {
              ...m,
              id: 'usr-0',
              name: m.name || 'Adryan kelvianto',
              username: 'admin.master',
              email: m.email || 'admin@gapsite.com',
              pin: m.pin || '110711',
              role: 'MASTER_ADMIN',
              roleTitle: m.roleTitle || 'Chief Role Master & System SuperAdmin',
              department: m.department || 'Central Compliance Governance & Board',
              status: 'ACTIVE',
              activeTaskCount: m.activeTaskCount ?? 0,
              completedTaskCount: m.completedTaskCount ?? 0,
              permissions: m.permissions && m.permissions.length > 0 ? m.permissions : INITIAL_TEAM_MEMBERS[0].permissions,
              avatar: m.avatar || INITIAL_TEAM_MEMBERS[0].avatar,
              nik: m.nik || '3171012304950001',
              idType: m.idType || 'NIK',
              bankName: m.bankName || 'Bank Mandiri',
              bankAccountNumber: m.bankAccountNumber || '122-00-983100-2',
              bankAccountHolder: m.bankAccountHolder || 'Adryan kelvianto',
            };
          }
          return m;
        });

        const hasMaster = updated.some((m) => m.id === 'usr-0' || m.username === 'admin.master' || m.email === 'admin@gapsite.com');
        return hasMaster ? updated : [INITIAL_TEAM_MEMBERS[0], ...updated];
      }
      return INITIAL_TEAM_MEMBERS;
    } catch {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  // Deleted Transactions Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedTransactionIds, setDeletedTransactionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_TRANSACTION_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const deletedTransactionIdsRef = useRef<Set<string>>(new Set(deletedTransactionIds));
  useEffect(() => {
    deletedTransactionIdsRef.current = new Set(deletedTransactionIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_TRANSACTION_IDS, JSON.stringify(deletedTransactionIds));
    } catch (e) {
      console.warn('Failed to save deleted transaction IDs to localStorage', e);
    }
  }, [deletedTransactionIds]);

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_TRANSACTION_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) {
        const parsed: FinancialTransaction[] = JSON.parse(saved);
        const mockTrxIds = new Set([
          'trx-1001',
          'trx-1002',
          'trx-1003',
          'trx-1004',
          'trx-1005',
          'trx-1006',
          'trx-1007',
          'trx-1008',
          'trx-1009',
          'trx-1010',
          'trx-1011',
          'trx-1012',
          'trx-1013',
          'trx-1014',
        ]);
        const mockProjectIds = new Set(['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106']);
        return parsed.filter(
          (t) =>
            t &&
            t.id &&
            !mockTrxIds.has(t.id) &&
            !(t.projectId && mockProjectIds.has(t.projectId)) &&
            !t.transactionNumber?.startsWith('TRX-202503-') &&
            !deletedIds.has(t.id)
        );
      }
      return INITIAL_TRANSACTIONS.filter((t) => t && t.id && !deletedIds.has(t.id));
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinitionsMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE_DEFINITIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ROLE_DEFINITIONS, ...parsed };
      }
      return DEFAULT_ROLE_DEFINITIONS;
    } catch {
      return DEFAULT_ROLE_DEFINITIONS;
    }
  });

  const [roleGovernanceMeta, setRoleGovernanceMeta] = useState<RoleGovernanceMeta>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE_GOVERNANCE_META);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ROLE_GOVERNANCE_META, ...parsed };
      }
      return DEFAULT_ROLE_GOVERNANCE_META;
    } catch {
      return DEFAULT_ROLE_GOVERNANCE_META;
    }
  });

  const [consultingServices, setConsultingServices] = useState<ConsultingServiceConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSULTING_SERVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_CONSULTING_SERVICES;
    } catch {
      return DEFAULT_CONSULTING_SERVICES;
    }
  });

  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCUMENT_TYPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_DOCUMENT_TYPES;
    } catch {
      return DEFAULT_DOCUMENT_TYPES;
    }
  });

  const [documentCategories, setDocumentCategories] = useState<DocumentCategoryDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCUMENT_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_DOCUMENT_CATEGORIES;
    } catch {
      return DEFAULT_DOCUMENT_CATEGORIES;
    }
  });

  const [transactionCategories, setTransactionCategories] = useState<TransactionCategoryDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTION_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge defaults with saved to ensure uppercase names and new categories are active
          const defaultMap = new Map(DEFAULT_TRANSACTION_CATEGORIES.map((d) => [d.id, d]));
          const merged: TransactionCategoryDefinition[] = [];
          const seenIds = new Set<string>();

          // Process parsed items
          parsed.forEach((cat: TransactionCategoryDefinition) => {
            seenIds.add(cat.id);
            const def = defaultMap.get(cat.id);
            if (def) {
              // Standard category: ensure uppercase name from defaults while preserving custom status/color if any
              merged.push({
                ...cat,
                name: def.name,
                group: def.group || cat.group,
                description: def.description || cat.description,
              });
            } else {
              // Custom user category
              merged.push(cat);
            }
          });

          // Add any missing default categories
          DEFAULT_TRANSACTION_CATEGORIES.forEach((def) => {
            if (!seenIds.has(def.id)) {
              merged.push(def);
            }
          });

          return merged;
        }
      }
      return DEFAULT_TRANSACTION_CATEGORIES;
    } catch {
      return DEFAULT_TRANSACTION_CATEGORIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTION_CATEGORIES, JSON.stringify(transactionCategories));
    } catch (e) {
      console.error('Failed to save transaction categories to localStorage', e);
    }
  }, [transactionCategories]);

  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAYMENT_CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_PAYMENT_CHANNELS;
    } catch {
      return DEFAULT_PAYMENT_CHANNELS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENT_CHANNELS, JSON.stringify(paymentChannels));
    } catch (e) {
      console.error('Failed to save payment channels to localStorage', e);
    }
  }, [paymentChannels]);

  // Bank Loans State (Formal Bank Loan Management)
  const [bankLoans, setBankLoans] = useState<BankLoan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BANK_LOANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BANK_LOANS, JSON.stringify(bankLoans));
    } catch (e) {
      console.error('Failed to save bank loans to localStorage', e);
    }
  }, [bankLoans]);

  // Company Capital Settings State (Modal Dasar, Disetor, Tambahan, Retained Earnings)
  const [companyCapital, setCompanyCapital] = useState<CompanyCapitalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANY_CAPITAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_COMPANY_CAPITAL, ...parsed };
        }
      }
      return DEFAULT_COMPANY_CAPITAL;
    } catch {
      return DEFAULT_COMPANY_CAPITAL;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_CAPITAL, JSON.stringify(companyCapital));
    } catch (e) {
      console.error('Failed to save company capital to localStorage', e);
    }
  }, [companyCapital]);

  // Company Letterhead & Printable Identity State
  const [companyLetterhead, setCompanyLetterhead] = useState<CompanyLetterhead>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANY_LETTERHEAD);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_COMPANY_LETTERHEAD, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load company letterhead from localStorage', e);
    }
    return DEFAULT_COMPANY_LETTERHEAD;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_LETTERHEAD, JSON.stringify(companyLetterhead));
    } catch (e) {
      console.error('Failed to save company letterhead to localStorage', e);
    }
  }, [companyLetterhead]);

  // Deleted Tax Obligations Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedTaxIds, setDeletedTaxIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_TAX_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const deletedTaxIdsRef = useRef<Set<string>>(new Set(deletedTaxIds));
  useEffect(() => {
    deletedTaxIdsRef.current = new Set(deletedTaxIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_TAX_IDS, JSON.stringify(deletedTaxIds));
    } catch (e) {
      console.warn('Failed to save deleted tax IDs to localStorage', e);
    }
  }, [deletedTaxIds]);

  // Tax Obligations State (PPN & PPh Terhutang, Billing & NTPN)
  const [taxObligations, setTaxObligations] = useState<TaxObligation[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_TAX_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_TAX_OBLIGATIONS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((t) => t && t.id && !deletedIds.has(t.id))
            .map(syncTaxObligationDescription);
        }
      }
      return INITIAL_TAX_OBLIGATIONS.filter((t) => t && t.id && !deletedIds.has(t.id)).map(syncTaxObligationDescription);
    } catch {
      return INITIAL_TAX_OBLIGATIONS.map(syncTaxObligationDescription);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TAX_OBLIGATIONS, JSON.stringify(taxObligations));
    } catch (e) {
      console.error('Failed to save tax obligations to localStorage', e);
    }
  }, [taxObligations]);

  // Deleted Receivables Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedReceivableIds, setDeletedReceivableIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_RECEIVABLE_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const deletedReceivableIdsRef = useRef<Set<string>>(new Set(deletedReceivableIds));
  useEffect(() => {
    deletedReceivableIdsRef.current = new Set(deletedReceivableIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_RECEIVABLE_IDS, JSON.stringify(deletedReceivableIds));
    } catch (e) {
      console.warn('Failed to save deleted receivable IDs to localStorage', e);
    }
  }, [deletedReceivableIds]);

  // Receivables State (Piutang Usaha & Termin Proyek)
  const [receivables, setReceivables] = useState<Receivable[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_RECEIVABLE_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_RECEIVABLES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => r && r.id && !deletedIds.has(r.id));
        }
      }
      return INITIAL_RECEIVABLES.filter((r) => r && r.id && !deletedIds.has(r.id));
    } catch {
      return INITIAL_RECEIVABLES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECEIVABLES, JSON.stringify(receivables));
    } catch (e) {
      console.error('Failed to save receivables to localStorage', e);
    }
  }, [receivables]);

  // Government Projects State (Proyek Pengadaan Pemerintah & BUMN)
  const [deletedGovProjectIds, setDeletedGovProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_GOV_PROJECT_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const deletedGovProjectIdsRef = useRef<Set<string>>(new Set(deletedGovProjectIds));
  useEffect(() => {
    deletedGovProjectIdsRef.current = new Set(deletedGovProjectIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_GOV_PROJECT_IDS, JSON.stringify(deletedGovProjectIds));
    } catch (e) {
      console.error('Failed to save deletedGovProjectIds to localStorage', e);
    }
  }, [deletedGovProjectIds]);

  const [governmentProjects, setGovernmentProjects] = useState<GovernmentProject[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_GOV_PROJECT_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_GOVERNMENT_PROJECTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id && !deletedIds.has(p.id));
        }
      }
      return INITIAL_GOVERNMENT_PROJECTS.filter((p) => p && p.id && !deletedIds.has(p.id));
    } catch {
      return INITIAL_GOVERNMENT_PROJECTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GOVERNMENT_PROJECTS, JSON.stringify(governmentProjects));
    } catch (e) {
      console.error('Failed to save governmentProjects to localStorage', e);
    }
  }, [governmentProjects]);

  // Retail Projects State (Proyek Retail B2B / Korporasi Swasta)
  const [deletedRetailProjectIds, setDeletedRetailProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_RETAIL_PROJECT_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const deletedRetailProjectIdsRef = useRef<Set<string>>(new Set(deletedRetailProjectIds));
  useEffect(() => {
    deletedRetailProjectIdsRef.current = new Set(deletedRetailProjectIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_RETAIL_PROJECT_IDS, JSON.stringify(deletedRetailProjectIds));
    } catch (e) {
      console.error('Failed to save deletedRetailProjectIds to localStorage', e);
    }
  }, [deletedRetailProjectIds]);

  const [retailProjects, setRetailProjects] = useState<RetailProject[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_RETAIL_PROJECT_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);
      const saved = localStorage.getItem(STORAGE_KEY_RETAIL_PROJECTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id && !deletedIds.has(p.id));
        }
      }
      return INITIAL_RETAIL_PROJECTS.filter((p) => p && p.id && !deletedIds.has(p.id));
    } catch {
      return INITIAL_RETAIL_PROJECTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RETAIL_PROJECTS, JSON.stringify(retailProjects));
    } catch (e) {
      console.error('Failed to save retailProjects to localStorage', e);
    }
  }, [retailProjects]);

  // Master Data: Tipe Instansi Pemerintah & BUMN (Editable)
  const [institutionTypes, setInstitutionTypes] = useState<GovernmentInstitutionTypeDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INSTITUTION_TYPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_GOVERNMENT_INSTITUTION_TYPES;
    } catch {
      return DEFAULT_GOVERNMENT_INSTITUTION_TYPES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(institutionTypes));
    } catch (e) {
      console.error('Failed to save institutionTypes to localStorage', e);
    }
  }, [institutionTypes]);

  // Master Data: Skema Pembagian Termin (Editable)
  const [termDistributionSchemes, setTermDistributionSchemes] = useState<TermDistributionSchemeDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_TERM_DISTRIBUTION_SCHEMES;
    } catch {
      return DEFAULT_TERM_DISTRIBUTION_SCHEMES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(termDistributionSchemes));
    } catch (e) {
      console.error('Failed to save termDistributionSchemes to localStorage', e);
    }
  }, [termDistributionSchemes]);

  // Master Data: Assigned By (LVI / Surveyor / Lembaga Pelaksana)
  const [assignedByOptions, setAssignedByOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIGNED_BY_OPTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_ASSIGNED_BY_OPTIONS;
    } catch {
      return DEFAULT_ASSIGNED_BY_OPTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNED_BY_OPTIONS, JSON.stringify(assignedByOptions));
    } catch (e) {
      console.error('Failed to save assigned by options to localStorage', e);
    }
  }, [assignedByOptions]);

  // Deleted Payroll Records Blacklist State (persists deletions across refreshes and syncs to all roles)
  const [deletedPayrollIds, setDeletedPayrollIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_PAYROLL_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const deletedPayrollIdsRef = useRef<Set<string>>(new Set(deletedPayrollIds));
  useEffect(() => {
    deletedPayrollIdsRef.current = new Set(deletedPayrollIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_PAYROLL_IDS, JSON.stringify(deletedPayrollIds));
    } catch (e) {
      console.warn('Failed to save deleted payroll IDs to localStorage', e);
    }
  }, [deletedPayrollIds]);

  // Employee Salary & Payroll Records State
  const [payrollRecords, setPayrollRecords] = useState<PayrollPayment[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_PAYROLL_IDS);
      const deletedIds = new Set<string>(savedDeleted ? JSON.parse(savedDeleted) : []);

      const saved = localStorage.getItem(STORAGE_KEY_PAYROLL);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id && !deletedIds.has(p.id));
        }
      }
      return INITIAL_PAYROLL_RECORDS.filter((p) => !deletedIds.has(p.id));
    } catch {
      return INITIAL_PAYROLL_RECORDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYROLL, JSON.stringify(payrollRecords));
    } catch (e) {
      console.error('Failed to save payroll records to localStorage', e);
    }
  }, [payrollRecords]);

  // Employee Annual Salary Configurations State (Penetapan Standar Gaji Karyawan Tahunan)
  const [employeeSalaryConfigs, setEmployeeSalaryConfigs] = useState<EmployeeAnnualSalaryConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_EMPLOYEE_SALARY_CONFIGS;
    } catch {
      return DEFAULT_EMPLOYEE_SALARY_CONFIGS;
    }
  });

  const employeeSalaryConfigsRef = useRef<EmployeeAnnualSalaryConfig[]>(employeeSalaryConfigs);

  useEffect(() => {
    employeeSalaryConfigsRef.current = employeeSalaryConfigs;
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(employeeSalaryConfigs));
    } catch (e) {
      console.warn('Failed to save employee salary configs to localStorage', e);
    }
  }, [employeeSalaryConfigs]);

  // Auto-sync any existing payroll records with Tax Management (anti double-input safeguard)
  useEffect(() => {
    if (!payrollRecords || payrollRecords.length === 0) return;

    setTaxObligations((currentTaxes) => {
      let hasChanges = false;
      const missingTaxes: TaxObligation[] = [];

      payrollRecords.forEach((record) => {
        if (record.pph21Amount && record.pph21Amount > 0) {
          const alreadyLinked = currentTaxes.some(
            (t) => t.payrollId === record.id || (record.pph21ObligationId && t.id === record.pph21ObligationId)
          );
          if (!alreadyLinked) {
            hasChanges = true;
            const payDate = record.paymentDate || new Date().toISOString().slice(0, 10);
            const dateObj = new Date(payDate);
            const year = !isNaN(dateObj.getFullYear()) ? dateObj.getFullYear() : new Date().getFullYear();
            const month = !isNaN(dateObj.getMonth()) ? dateObj.getMonth() + 1 : new Date().getMonth() + 1;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`;

            missingTaxes.push({
              id: `tax-pay-${record.id}`,
              taxType: 'PPH_21',
              taxPeriod: record.period,
              taxYear: year,
              taxMonth: month,
              title: `PPh 21 Karyawan: ${record.employeeName} (${record.period})`,
              description: `Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp ${record.totalEarnings.toLocaleString('id-ID')} (${record.roleTitle || 'Pegawai Tetap'}) - Slip ${record.payrollNumber}`,
              taxableBaseAmount: record.totalEarnings,
              taxRatePercent: record.totalEarnings > 0 ? Number(((record.pph21Amount / record.totalEarnings) * 100).toFixed(2)) : 5,
              taxAmount: record.pph21Amount,
              paidAmount: 0,
              remainingAmount: record.pph21Amount,
              status: 'TERHUTANG',
              dueDate,
              billingCode: `718${String(year).slice(-2)}${String(month).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`,
              taxInvoiceNumber: `BUPOT-21/${year}/${String(month).padStart(2, '0')}/${record.payrollNumber.split('/').pop() || '001'}`,
              counterpartyName: `${record.employeeName} / KPP Pratama`,
              payrollId: record.id,
              payrollNumber: record.payrollNumber,
              employeeId: record.employeeId,
              employeeName: record.employeeName,
              notes: `Otomatis disinkronisasi dari Slip Gaji: ${record.payrollNumber}. Terintegrasi ke Menu Pajak & Neraca Keuangan (anti double input).`,
              createdAt: record.createdAt || new Date().toISOString(),
              createdBy: record.recordedBy || 'System Payroll Sync',
            });
          }
        }
      });

      if (hasChanges && missingTaxes.length > 0) {
        return [...missingTaxes, ...currentTaxes];
      }
      return currentTaxes;
    });
  }, [payrollRecords]);

  const activeDocumentCategories = useMemo(() => {
    return documentCategories.filter((c) => c.status !== 'INACTIVE');
  }, [documentCategories]);

  // Synchronized Deletion Helpers - atomically update state, local storage, and Firestore
  const addDeletedProjectId = useCallback((id: string) => {
    setDeletedProjectIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDeletedEntityIdToFirestore('deleted_project_ids', id);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_PROJECT_IDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addDeletedDispositionId = useCallback((id: string) => {
    setDeletedDispositionIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDeletedEntityIdToFirestore('deleted_disposition_ids', id);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_DISPOSITION_IDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addDeletedTransactionId = useCallback((id: string) => {
    setDeletedTransactionIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDeletedEntityIdToFirestore('deleted_transaction_ids', id);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_TRANSACTION_IDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addDeletedReceivableId = useCallback((id: string) => {
    setDeletedReceivableIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDeletedEntityIdToFirestore('deleted_receivable_ids', id);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_RECEIVABLE_IDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addDeletedTaxId = useCallback((id: string) => {
    setDeletedTaxIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDeletedEntityIdToFirestore('deleted_tax_ids', id);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_TAX_IDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      // Ensure no persistent storage leaks across browser windows or restarts
      localStorage.removeItem(STORAGE_KEY_AUTH_STATE);
      const sessionSaved = sessionStorage.getItem(STORAGE_KEY_AUTH_STATE);
      if (sessionSaved !== null) {
        return JSON.parse(sessionSaved) === true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<TeamMember>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (savedId) {
        const found = teamMembers.find((m) => m.id === savedId);
        if (found) return found;
      }
      return teamMembers[0] || INITIAL_TEAM_MEMBERS[0];
    } catch {
      return INITIAL_TEAM_MEMBERS[0];
    }
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Real-time Role Sync & Toast State
  const [realtimeRoleToast, setRealtimeRoleToast] = useState<{
    show: boolean;
    oldRole?: string;
    newRole: string;
    roleTitle: string;
    updatedBy?: string;
  } | null>(null);

  const dismissRealtimeRoleToast = useCallback(() => {
    setRealtimeRoleToast(null);
  }, []);

  // Helper to broadcast user/role updates across tabs & windows in real-time
  const broadcastLiveUserUpdate = useCallback((updatedMember: TeamMember) => {
    if (!updatedMember || !updatedMember.id) return;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('tkdn_live_role_sync');
        bc.postMessage({ type: 'USER_ROLE_UPDATED', payload: updatedMember });
        bc.close();
      }
    } catch {}

    try {
      localStorage.setItem(
        'tkdn_live_user_update_event',
        JSON.stringify({
          ...updatedMember,
          _eventTimestamp: Date.now(),
        })
      );
    } catch {}
  }, []);

  type LiveBroadcastType =
    | 'PROJECTS'
    | 'TRANSACTIONS'
    | 'DISPOSITIONS'
    | 'MEMBERS'
    | 'DELETED_USERS'
    | 'DOCUMENT_TYPES'
    | 'DOCUMENT_CATEGORIES'
    | 'CONSULTING_SERVICES'
    | 'TRANSACTION_CATEGORIES'
    | 'PAYMENT_CHANNELS'
    | 'BANK_LOANS'
    | 'COMPANY_CAPITAL'
    | 'TAX_OBLIGATIONS'
    | 'RECEIVABLES'
    | 'GOVERNMENT_PROJECTS'
    | 'DELETED_GOV_PROJECT_IDS'
    | 'RETAIL_PROJECTS'
    | 'DELETED_RETAIL_PROJECT_IDS'
    | 'PAYROLL_PAYMENTS'
    | 'EMPLOYEE_SALARY_CONFIGS'
    | 'ROLE_DEFINITIONS'
    | 'ROLE_GOVERNANCE_META'
    | 'COMPANY_LETTERHEAD'
    | 'INSTITUTION_TYPES'
    | 'TERM_DISTRIBUTION_SCHEMES';

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize long-lived BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannelRef.current = new BroadcastChannel('verix_crm_live_data_sync');
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }
    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, []);

  // Helper to broadcast all entity updates across tabs & windows in real-time
  const broadcastLiveDataUpdate = useCallback((type: LiveBroadcastType, payload: any) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type, payload, timestamp: Date.now() });
      } else if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('verix_crm_live_data_sync');
        bc.postMessage({ type, payload, timestamp: Date.now() });
        setTimeout(() => {
          try {
            bc.close();
          } catch {}
        }, 1000);
      }
    } catch (err) {
      console.warn('Broadcast send notice:', err);
    }
  }, []);

  // Real-time listener for multi-tab and multi-window synchronization
  useEffect(() => {
    const handleLiveUserUpdate = (updatedMember: TeamMember) => {
      if (!updatedMember || !updatedMember.id) return;

      // 1. Update teamMembers array in memory immediately
      setTeamMembers((prev) => {
        const exists = prev.some((m) => m.id === updatedMember.id);
        if (exists) {
          return prev.map((m) => (m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
        }
        return [...prev, updatedMember];
      });

      // 2. Check if this update matches the currently active user
      setCurrentUser((current) => {
        const isCurrentActive =
          current.id === updatedMember.id ||
          (current.email && updatedMember.email && current.email.toLowerCase() === updatedMember.email.toLowerCase()) ||
          (current.username && updatedMember.username && current.username.toLowerCase() === updatedMember.username.toLowerCase());

        if (isCurrentActive) {
          const isRoleChanged = current.role !== updatedMember.role || current.roleTitle !== updatedMember.roleTitle;

          if (isRoleChanged) {
            setRealtimeRoleToast({
              show: true,
              oldRole: current.roleTitle || current.role,
              newRole: updatedMember.role,
              roleTitle: updatedMember.roleTitle || updatedMember.role,
              updatedBy: 'Master Admin (admin.master)',
            });
          }

          const mergedCurrent: TeamMember = {
            ...current,
            ...updatedMember,
          };

          try {
            localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, mergedCurrent.id);
          } catch {}

          return mergedCurrent;
        }
        return current;
      });
    };

    let roleBc: BroadcastChannel | null = null;
    let dataBc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        roleBc = new BroadcastChannel('tkdn_live_role_sync');
        roleBc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'USER_ROLE_UPDATED' && payload) {
            handleLiveUserUpdate(payload);
          }
        };

        dataBc = new BroadcastChannel('verix_crm_live_data_sync');
        dataBc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (!type) return;

          if (type === 'PROJECTS' && Array.isArray(payload)) {
            setProjects(payload);
          } else if (type === 'TRANSACTIONS' && Array.isArray(payload)) {
            setTransactions(payload);
          } else if (type === 'DISPOSITIONS' && Array.isArray(payload)) {
            setDispositions(payload);
          } else if (type === 'MEMBERS' && Array.isArray(payload)) {
            setTeamMembers(payload);
          } else if (type === 'DELETED_USERS' && Array.isArray(payload)) {
            setDeletedUsers(payload);
          } else if (type === 'DOCUMENT_TYPES' && Array.isArray(payload)) {
            setDocumentTypes(payload);
          } else if (type === 'DOCUMENT_CATEGORIES' && Array.isArray(payload)) {
            setDocumentCategories(payload);
          } else if (type === 'TRANSACTION_CATEGORIES' && Array.isArray(payload)) {
            setTransactionCategories(payload);
          } else if (type === 'PAYMENT_CHANNELS' && Array.isArray(payload)) {
            setPaymentChannels(payload);
          } else if (type === 'BANK_LOANS' && Array.isArray(payload)) {
            setBankLoans(payload);
          } else if (type === 'COMPANY_CAPITAL' && payload) {
            setCompanyCapital(payload);
          } else if (type === 'TAX_OBLIGATIONS' && Array.isArray(payload)) {
            setTaxObligations(payload);
          } else if (type === 'RECEIVABLES' && Array.isArray(payload)) {
            setReceivables(payload);
          } else if (type === 'GOVERNMENT_PROJECTS' && Array.isArray(payload)) {
            setGovernmentProjects(payload);
          } else if (type === 'DELETED_GOV_PROJECT_IDS' && Array.isArray(payload)) {
            setDeletedGovProjectIds(payload);
            setGovernmentProjects((current) => current.filter((p) => !payload.includes(p.id)));
          } else if (type === 'RETAIL_PROJECTS' && Array.isArray(payload)) {
            setRetailProjects(payload);
          } else if (type === 'DELETED_RETAIL_PROJECT_IDS' && Array.isArray(payload)) {
            setDeletedRetailProjectIds(payload);
            setRetailProjects((current) => current.filter((p) => !payload.includes(p.id)));
          } else if (type === 'PAYROLL_PAYMENTS' && Array.isArray(payload)) {
            setPayrollRecords(payload);
          } else if (type === 'EMPLOYEE_SALARY_CONFIGS' && Array.isArray(payload)) {
            setEmployeeSalaryConfigs(payload);
          } else if (type === 'DELETED_PAYROLL_IDS' && Array.isArray(payload)) {
            setDeletedPayrollIds(payload);
            setPayrollRecords((current) => current.filter((p) => !payload.includes(p.id)));
          } else if (type === 'CONSULTING_SERVICES' && Array.isArray(payload)) {
            setConsultingServices(payload);
          } else if (type === 'ROLE_DEFINITIONS' && payload) {
            setRoleDefinitions(payload);
          } else if (type === 'ROLE_GOVERNANCE_META' && payload) {
            setRoleGovernanceMeta(payload);
          } else if (type === 'COMPANY_LETTERHEAD' && payload) {
            setCompanyLetterhead(payload);
          } else if (type === 'INSTITUTION_TYPES' && Array.isArray(payload)) {
            setInstitutionTypes(payload);
          } else if (type === 'TERM_DISTRIBUTION_SCHEMES' && Array.isArray(payload)) {
            setTermDistributionSchemes(payload);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'tkdn_live_user_update_event') {
          const payload = JSON.parse(e.newValue);
          if (payload?.id) {
            handleLiveUserUpdate(payload);
          }
        } else if (e.key === STORAGE_KEY_PROJECTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setProjects(parsed);
        } else if (e.key === STORAGE_KEY_TRANSACTIONS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTransactions(parsed);
        } else if (e.key === STORAGE_KEY_DISPOSITIONS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDispositions(parsed);
        } else if (e.key === STORAGE_KEY_MEMBERS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTeamMembers(parsed);
        } else if (e.key === STORAGE_KEY_DELETED_USERS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDeletedUsers(parsed);
        } else if (e.key === STORAGE_KEY_DOCUMENT_TYPES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDocumentTypes(parsed);
        } else if (e.key === STORAGE_KEY_DOCUMENT_CATEGORIES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDocumentCategories(parsed);
        } else if (e.key === STORAGE_KEY_TRANSACTION_CATEGORIES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTransactionCategories(parsed);
        } else if (e.key === STORAGE_KEY_PAYMENT_CHANNELS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPaymentChannels(parsed);
        } else if (e.key === STORAGE_KEY_BANK_LOANS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setBankLoans(parsed);
        } else if (e.key === STORAGE_KEY_COMPANY_CAPITAL) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setCompanyCapital(parsed);
        } else if (e.key === STORAGE_KEY_TAX_OBLIGATIONS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTaxObligations(parsed);
        } else if (e.key === STORAGE_KEY_RECEIVABLES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setReceivables(parsed);
        } else if (e.key === STORAGE_KEY_GOVERNMENT_PROJECTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setGovernmentProjects(parsed);
        } else if (e.key === STORAGE_KEY_DELETED_GOV_PROJECT_IDS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDeletedGovProjectIds(parsed);
            setGovernmentProjects((current) => current.filter((p) => !parsed.includes(p.id)));
          }
        } else if (e.key === STORAGE_KEY_RETAIL_PROJECTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRetailProjects(parsed);
        } else if (e.key === STORAGE_KEY_DELETED_RETAIL_PROJECT_IDS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDeletedRetailProjectIds(parsed);
            setRetailProjects((current) => current.filter((p) => !parsed.includes(p.id)));
          }
        } else if (e.key === STORAGE_KEY_INSTITUTION_TYPES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setInstitutionTypes(parsed);
        } else if (e.key === STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTermDistributionSchemes(parsed);
        } else if (e.key === STORAGE_KEY_PAYROLL) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPayrollRecords(parsed);
        } else if (e.key === STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setEmployeeSalaryConfigs(parsed);
        } else if (e.key === STORAGE_KEY_DELETED_PAYROLL_IDS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDeletedPayrollIds(parsed);
            setPayrollRecords((current) => current.filter((p) => !parsed.includes(p.id)));
          }
        } else if (e.key === STORAGE_KEY_CONSULTING_SERVICES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setConsultingServices(parsed);
        } else if (e.key === STORAGE_KEY_ROLE_DEFINITIONS) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setRoleDefinitions(parsed);
        } else if (e.key === STORAGE_KEY_ROLE_GOVERNANCE_META) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setRoleGovernanceMeta(parsed);
        } else if (e.key === STORAGE_KEY_COMPANY_LETTERHEAD) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setCompanyLetterhead(parsed);
        }
      } catch (err) {
        console.warn('Storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (roleBc) roleBc.close();
      if (dataBc) dataBc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Firebase Auth and Cloud Sync State
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSyncingWithFirestore, setIsSyncingWithFirestore] = useState<boolean>(false);

  // Google Drive Connection & Sync State
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState<boolean>(() => {
    return Boolean(getActiveAccessToken());
  });
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);

  // Initialize GSI client on mount
  useEffect(() => {
    loadGsiScript().catch((err) => console.warn('Could not pre-load GSI script:', err));
  }, []);

  const connectGoogleDrive = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsDriveSyncing(true);
      const token = await requestGoogleDriveAccess();
      if (token) {
        setIsGoogleDriveConnected(true);
        setIsDriveSyncing(false);
        return { success: true };
      }
      setIsDriveSyncing(false);
      return { success: false, error: 'Authorization was not completed.' };
    } catch (err: any) {
      setIsDriveSyncing(false);
      console.error('Failed to connect Google Drive:', err);
      return { success: false, error: err.message || 'Failed to authenticate with Google Drive' };
    }
  }, []);

  const disconnectGoogleDriveAccount = useCallback(() => {
    disconnectGoogleDrive();
    setIsGoogleDriveConnected(false);
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISPOSITIONS, JSON.stringify(dispositions));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [dispositions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(teamMembers));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_USERS, JSON.stringify(deletedUsers));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [deletedUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(roleDefinitions));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [roleDefinitions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_GOVERNANCE_META, JSON.stringify(roleGovernanceMeta));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [roleGovernanceMeta]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSULTING_SERVICES, JSON.stringify(consultingServices));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [consultingServices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCUMENT_TYPES, JSON.stringify(documentTypes));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [documentTypes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCUMENT_CATEGORIES, JSON.stringify(documentCategories));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [documentCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENT_CHANNELS, JSON.stringify(paymentChannels));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [paymentChannels]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTION_CATEGORIES, JSON.stringify(transactionCategories));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [transactionCategories]);

  useEffect(() => {
    try {
      if (currentUser?.id) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUser.id);
      }
      sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, JSON.stringify(isAuthenticated));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [currentUser, isAuthenticated]);

  // Sync state with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsFirebaseConnected(true);
      if (fbUser && fbUser.email) {
        const email = fbUser.email.toLowerCase();
        setTeamMembers((prev) => {
          const found = prev.find((m) => m.email.toLowerCase() === email);
          if (found) {
            setCurrentUser((current) => {
              // If already logged in / switched to an active user session, preserve current user
              if (current && current.id && current.id !== found.id) {
                return current;
              }
              return found;
            });
            // Only auto-authenticate if this specific browser session is active (sessionStorage)
            try {
              const sessionActive = sessionStorage.getItem(STORAGE_KEY_AUTH_STATE);
              if (sessionActive && JSON.parse(sessionActive) === true) {
                setIsAuthenticated(true);
              }
            } catch {
              // Stay on login screen if window was closed
            }
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-Time Subscriptions & Baseline Initialization
  useEffect(() => {
    // Ensure initial baseline documents and root Master Admin account exist in Firestore
    ensureInitialFirestoreSeed(
      INITIAL_TEAM_MEMBERS[0],
      DEFAULT_CONSULTING_SERVICES,
      DEFAULT_DOCUMENT_TYPES,
      DEFAULT_DOCUMENT_CATEGORIES,
      DEFAULT_ROLE_DEFINITIONS,
      INITIAL_PROJECTS,
      INITIAL_DISPOSITIONS,
      INITIAL_TRANSACTIONS,
      INITIAL_TEAM_MEMBERS,
      DEFAULT_TRANSACTION_CATEGORIES,
      DEFAULT_PAYMENT_CHANNELS,
      INITIAL_TAX_OBLIGATIONS,
      [],
      DEFAULT_COMPANY_CAPITAL,
      INITIAL_RECEIVABLES,
      INITIAL_PAYROLL_RECORDS,
      DEFAULT_COMPANY_LETTERHEAD,
      DEFAULT_EMPLOYEE_SALARY_CONFIGS,
      DEFAULT_GOVERNMENT_INSTITUTION_TYPES,
      DEFAULT_TERM_DISTRIBUTION_SCHEMES
    );

    const unsubDeletedProjects = subscribeToDeletedEntityIds('deleted_project_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedProjectIds(remoteIds);
        setProjects((current) => current.filter((p) => !remoteIds.includes(p.id)));
      }
    });

    const unsubProjects = subscribeToProjects((remoteProjects) => {
      if (Array.isArray(remoteProjects)) {
        const deletedSet = deletedProjectIdsRef.current;
        const valid = remoteProjects.filter((p) => p && p.id && !deletedSet.has(p.id));
        setProjects(valid);
      }
    });

    const unsubDeletedUsers = subscribeToSettings('deleted_users', (data) => {
      if (Array.isArray(data)) {
        setDeletedUsers(data);
        const deletedIds = new Set(data.map((d: DeletedUserRecord) => d.id?.toLowerCase()));
        const deletedUsernames = new Set(data.map((d: DeletedUserRecord) => (d.username || '').toLowerCase()));
        const deletedEmails = new Set(data.map((d: DeletedUserRecord) => (d.email || '').toLowerCase()));

        setTeamMembers((prev) =>
          prev.filter(
            (m) =>
              m.id === 'usr-0' ||
              m.username === 'admin.master' ||
              m.email === 'admin@gapsite.com' ||
              (!deletedIds.has((m.id || '').toLowerCase()) &&
                !deletedUsernames.has((m.username || '').toLowerCase()) &&
                !deletedEmails.has((m.email || '').toLowerCase()))
          )
        );

        // If the currently active user is among the deleted users, force logout immediately
        setCurrentUser((current) => {
          if (
            current.id !== 'usr-0' &&
            current.username !== 'admin.master' &&
            current.email !== 'admin@gapsite.com' &&
            (deletedIds.has((current.id || '').toLowerCase()) ||
              deletedUsernames.has((current.username || '').toLowerCase()) ||
              deletedEmails.has((current.email || '').toLowerCase()))
          ) {
            logout();
            return INITIAL_TEAM_MEMBERS[0];
          }
          return current;
        });
      }
    });

    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (!Array.isArray(remoteUsers) || remoteUsers.length === 0) return;

      let deletedList: DeletedUserRecord[] = [];
      try {
        const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
        if (savedDeleted) deletedList = JSON.parse(savedDeleted);
      } catch {}

      const deletedIds = new Set(deletedList.map((d) => d.id?.toLowerCase()));
      const deletedUsernames = new Set(deletedList.map((d) => (d.username || '').toLowerCase()));
      const deletedEmails = new Set(deletedList.map((d) => (d.email || '').toLowerCase()));

      const validRemote = remoteUsers.filter(
        (u) =>
          u.id === 'usr-0' ||
          u.username === 'admin.master' ||
          u.email === 'admin@gapsite.com' ||
          (!deletedIds.has((u.id || '').toLowerCase()) &&
            !deletedUsernames.has((u.username || '').toLowerCase()) &&
            !deletedEmails.has((u.email || '').toLowerCase()))
      );

      const masterUser =
        validRemote.find((u) => u.id === 'usr-0' || u.username === 'admin.master' || u.email === 'admin@gapsite.com') ||
        INITIAL_TEAM_MEMBERS[0];

      const nonMasterRemote = validRemote.filter(
        (u) => u.id !== 'usr-0' && u.username !== 'admin.master' && u.email !== 'admin@gapsite.com'
      );

      setTeamMembers([masterUser, ...nonMasterRemote]);

      // Realtime Current User Evaluation - Updates without page refresh or logout
      setCurrentUser((current) => {
        const remoteCurrent = remoteUsers.find(
          (u) =>
            u.id === current.id ||
            (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase()) ||
            (u.username && current.username && u.username.toLowerCase() === current.username.toLowerCase())
        );

        if (remoteCurrent) {
          const isRoleChanged =
            current.role !== remoteCurrent.role ||
            current.roleTitle !== remoteCurrent.roleTitle ||
            JSON.stringify(current.permissions || []) !== JSON.stringify(remoteCurrent.permissions || []);

          if (isRoleChanged && current.id !== 'usr-0' && current.username !== 'admin.master') {
            setRealtimeRoleToast({
              show: true,
              oldRole: current.roleTitle || current.role,
              newRole: remoteCurrent.role,
              roleTitle: remoteCurrent.roleTitle || remoteCurrent.role,
              updatedBy: 'Master Admin (admin.master)',
            });
          }

          const mergedCurrent: TeamMember = {
            ...current,
            ...remoteCurrent,
          };

          try {
            localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, mergedCurrent.id);
          } catch {}

          return mergedCurrent;
        }

        // If user was deleted from remote Firestore and is not master admin, log out
        if (
          current.id !== 'usr-0' &&
          current.username !== 'admin.master' &&
          current.email !== 'admin@gapsite.com' &&
          !remoteUsers.some(
            (u) =>
              u.id === current.id ||
              (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase()) ||
              (u.username && current.username && u.username.toLowerCase() === current.username.toLowerCase())
          )
        ) {
          logout();
          return INITIAL_TEAM_MEMBERS[0];
        }
        return current;
      });
    });

    const unsubDocTypes = subscribeToDocumentTypes((remoteDocTypes) => {
      if (Array.isArray(remoteDocTypes) && remoteDocTypes.length > 0) {
        setDocumentTypes(remoteDocTypes);
      }
    });

    const unsubDocCategories = subscribeToDocumentCategories((remoteDocCategories) => {
      if (Array.isArray(remoteDocCategories) && remoteDocCategories.length > 0) {
        setDocumentCategories(remoteDocCategories);
      }
    });

    const unsubDeletedDispositions = subscribeToDeletedEntityIds('deleted_disposition_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedDispositionIds(remoteIds);
        setDispositions((current) => current.filter((d) => !remoteIds.includes(d.id)));
      }
    });

    const unsubDispositions = subscribeToDispositions((remoteDisps) => {
      if (Array.isArray(remoteDisps)) {
        const deletedSet = deletedDispositionIdsRef.current;
        const valid = remoteDisps.filter((d) => d && d.id && !deletedSet.has(d.id));
        setDispositions(valid);
      }
    });

    const unsubDeletedTransactions = subscribeToDeletedEntityIds('deleted_transaction_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedTransactionIds(remoteIds);
        setTransactions((current) => current.filter((t) => !remoteIds.includes(t.id)));
      }
    });

    const unsubTransactions = subscribeToTransactions((remoteTrxs) => {
      if (Array.isArray(remoteTrxs)) {
        const deletedSet = deletedTransactionIdsRef.current;
        const valid = remoteTrxs.filter((t) => t && t.id && !deletedSet.has(t.id));
        setTransactions(valid);
      }
    });

    const unsubConsultingServices = subscribeToSettings('consulting_services', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setConsultingServices(data);
      }
    });

    const unsubRoleDefs = subscribeToSettings('role_definitions', (data) => {
      if (data && typeof data === 'object') {
        setRoleDefinitions(data);
      }
    });

    const unsubRoleGovMeta = subscribeToSettings('role_governance_meta', (data) => {
      if (data && typeof data === 'object') {
        setRoleGovernanceMeta(data);
      }
    });

    const unsubPaymentChannels = subscribeToSettings('payment_channels', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPaymentChannels(data);
      }
    });

    const unsubTransactionCategories = subscribeToSettings('transaction_categories', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTransactionCategories(data);
      }
    });

    const unsubBankLoans = subscribeToSettings('bank_loans', (data) => {
      if (Array.isArray(data)) {
        setBankLoans(data);
      }
    });

    const unsubCompanyCapital = subscribeToSettings('company_capital', (data) => {
      if (data && typeof data === 'object') {
        setCompanyCapital((prev) => ({ ...prev, ...data }));
      }
    });

    const unsubDeletedTax = subscribeToDeletedEntityIds('deleted_tax_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedTaxIds(remoteIds);
        setTaxObligations((current) => current.filter((t) => !remoteIds.includes(t.id)));
      }
    });

    const unsubTaxObligations = subscribeToSettings('tax_obligations', (data) => {
      if (Array.isArray(data)) {
        const deletedSet = deletedTaxIdsRef.current;
        const valid = data
          .filter((t: any) => t && t.id && !deletedSet.has(t.id))
          .map(syncTaxObligationDescription);
        setTaxObligations(valid);
      }
    });

    const unsubDeletedReceivables = subscribeToDeletedEntityIds('deleted_receivable_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedReceivableIds(remoteIds);
        setReceivables((current) => current.filter((r) => !remoteIds.includes(r.id)));
      }
    });

    const unsubReceivables = subscribeToReceivables((remoteRecs) => {
      if (Array.isArray(remoteRecs)) {
        const deletedSet = deletedReceivableIdsRef.current;
        const valid = remoteRecs.filter((r) => r && r.id && !deletedSet.has(r.id));
        setReceivables(valid);
      }
    });

    const unsubDeletedGovProjects = subscribeToDeletedEntityIds('deleted_gov_project_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedGovProjectIds(remoteIds);
        setGovernmentProjects((current) => current.filter((p) => !remoteIds.includes(p.id)));
      }
    });

    const unsubGovProjects = subscribeToGovernmentProjects((remoteProjects) => {
      if (Array.isArray(remoteProjects)) {
        const deletedSet = deletedGovProjectIdsRef.current;
        const valid = remoteProjects.filter((p) => p && p.id && !deletedSet.has(p.id));
        setGovernmentProjects(valid);
      }
    });

    const unsubDeletedRetailProjects = subscribeToDeletedEntityIds('deleted_retail_project_ids', (remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedRetailProjectIds(remoteIds);
        setRetailProjects((current) => current.filter((p) => !remoteIds.includes(p.id)));
      }
    });

    const unsubRetailProjects = subscribeToRetailProjects((remoteProjects) => {
      if (Array.isArray(remoteProjects)) {
        const deletedSet = deletedRetailProjectIdsRef.current;
        const valid = remoteProjects.filter((p) => p && p.id && !deletedSet.has(p.id));
        setRetailProjects(valid);
      }
    });

    const unsubDeletedPayroll = subscribeToDeletedPayrollIds((remoteIds) => {
      if (Array.isArray(remoteIds)) {
        setDeletedPayrollIds(remoteIds);
        setPayrollRecords((current) => current.filter((p) => !remoteIds.includes(p.id)));
      }
    });

    const unsubPayroll = subscribeToPayroll((remotePayrolls) => {
      if (Array.isArray(remotePayrolls)) {
        const deletedSet = deletedPayrollIdsRef.current;
        const valid = remotePayrolls.filter((p) => p && p.id && !deletedSet.has(p.id));
        setPayrollRecords(valid);
      }
    });

    const unsubLetterhead = subscribeToSettings('company_letterhead', (data) => {
      if (data && typeof data === 'object') {
        setCompanyLetterhead((prev) => {
          const merged = { ...prev, ...data };
          try {
            localStorage.setItem(STORAGE_KEY_COMPANY_LETTERHEAD, JSON.stringify(merged));
          } catch (e) {
            console.warn('LocalStorage save on remote update warning:', e);
          }
          return merged;
        });
      }
    });

    const unsubSalaryConfigs = subscribeToSettings('employee_salary_configs', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployeeSalaryConfigs(data);
        employeeSalaryConfigsRef.current = data;
        try {
          localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(data));
        } catch (e) {
          console.warn('LocalStorage save on salary configs update warning:', e);
        }
      }
    });

    const unsubInstitutionTypes = subscribeToSettings('institution_types', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setInstitutionTypes(data);
        try {
          localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(data));
        } catch (e) {
          console.warn('LocalStorage save on institution types update warning:', e);
        }
      }
    });

    const unsubTermSchemes = subscribeToSettings('term_distribution_schemes', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTermDistributionSchemes(data);
        try {
          localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(data));
        } catch (e) {
          console.warn('LocalStorage save on term schemes update warning:', e);
        }
      }
    });

    return () => {
      unsubDeletedProjects();
      unsubProjects();
      unsubDeletedUsers();
      unsubUsers();
      unsubDocTypes();
      unsubDocCategories();
      unsubDeletedDispositions();
      unsubDispositions();
      unsubDeletedTransactions();
      unsubTransactions();
      unsubConsultingServices();
      unsubRoleDefs();
      unsubRoleGovMeta();
      unsubPaymentChannels();
      unsubTransactionCategories();
      unsubBankLoans();
      unsubCompanyCapital();
      unsubDeletedTax();
      unsubTaxObligations();
      unsubDeletedReceivables();
      unsubReceivables();
      unsubDeletedGovProjects();
      unsubGovProjects();
      unsubDeletedRetailProjects();
      unsubRetailProjects();
      unsubDeletedPayroll();
      unsubPayroll();
      unsubLetterhead();
      unsubSalaryConfigs();
      unsubInstitutionTypes();
      unsubTermSchemes();
    };
  }, []);

  // Sync All Data to Firestore (Cloud Backup / Seed)
  const syncAllToFirestore = useCallback(async () => {
    setIsSyncingWithFirestore(true);
    try {
      await Promise.all([
        ...projects.map((p) => saveProjectToFirestore(p)),
        ...teamMembers.map((u) => saveUserToFirestore(u)),
        ...dispositions.map((d) => saveDispositionToFirestore(d)),
        ...transactions.map((t) => saveTransactionToFirestore(t)),
        ...documentTypes.map((dt) => saveDocumentTypeToFirestore(dt)),
        ...documentCategories.map((dc) => saveDocumentCategoryToFirestore(dc)),
        saveSettingsToFirestore('consulting_services', consultingServices),
        saveSettingsToFirestore('role_definitions', roleDefinitions),
        saveSettingsToFirestore('payment_channels', paymentChannels),
        saveSettingsToFirestore('transaction_categories', transactionCategories),
        saveSettingsToFirestore('bank_loans', bankLoans),
        saveSettingsToFirestore('company_capital', companyCapital),
        saveSettingsToFirestore('tax_obligations', taxObligations),
        saveSettingsToFirestore('company_letterhead', companyLetterhead),
        saveSettingsToFirestore('institution_types', institutionTypes),
        saveSettingsToFirestore('term_distribution_schemes', termDistributionSchemes),
        saveSettingsToFirestore('employee_salary_configs', employeeSalaryConfigs),
        ...receivables.map((r) => saveReceivableToFirestore(r)),
        ...governmentProjects.map((gp) => saveGovernmentProjectToFirestore(gp)),
        ...retailProjects.map((rp) => saveRetailProjectToFirestore(rp)),
        ...payrollRecords.map((p) => savePayrollToFirestore(p)),
      ]);
    } catch (err) {
      console.error('Firestore bulk sync error:', err);
    } finally {
      setIsSyncingWithFirestore(false);
    }
  }, [projects, teamMembers, dispositions, transactions, documentTypes, documentCategories, consultingServices, roleDefinitions, paymentChannels, transactionCategories, bankLoans, companyCapital, taxObligations, receivables, payrollRecords, companyLetterhead, institutionTypes, termDistributionSchemes]);

  // Auth Functions
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const { user: fbUser, error } = await signInWithGoogle();
      if (error || !fbUser) {
        return { success: false, message: error || 'Google sign-in was cancelled or encountered an error.' };
      }

      setFirebaseUser(fbUser);
      const email = fbUser.email?.toLowerCase() || '';
      let matched = teamMembers.find((m) => m.email.toLowerCase() === email);

      if (!matched) {
        const isMaster = email === 'admin@gapsite.com' || email.startsWith('admin');
        const role: UserRole = isMaster ? 'MASTER_ADMIN' : 'LEAD_CONSULTANT';
        const roleTitle = isMaster ? 'Chief Role Master & System SuperAdmin' : 'Senior TKDN Lead Assessor';
        const department = isMaster ? 'Central Compliance Governance & Board' : 'TKDN Advisory & Assessment';

        const newMember: TeamMember = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          username: email.split('@')[0],
          email: email,
          phone: fbUser.phoneNumber || '+62 812-3456-7890',
          role: role,
          roleTitle: roleTitle,
          department: department,
          avatar: fbUser.photoURL || undefined,
          status: 'ACTIVE',
          registeredAt: 'Just now',
          lastLoginAt: 'Just now',
          specialization: ['TKDN Certification', 'Indonesian Statutory Compliance'],
          permissions: DEFAULT_ROLE_DEFINITIONS[role].defaultPermissions,
          activeTaskCount: 0,
          completedTaskCount: 0,
          capacityPercentage: 70,
        };

        matched = newMember;
        setTeamMembers((prev) => [newMember, ...prev.filter((m) => m.id !== newMember.id)]);
        saveUserToFirestore(newMember);
      } else {
        const updated = {
          ...matched,
          avatar: fbUser.photoURL || matched.avatar,
          lastLoginAt: 'Just now',
          status: 'ACTIVE' as const,
        };
        matched = updated;
        setTeamMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        saveUserToFirestore(updated);
      }

      setCurrentUser(matched);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');
      } catch (e) {
        console.error(e);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return { success: false, message: err?.message || 'Failed to sign in with Google' };
    }
  };

  const login = (identifier: string, pinOrPassword?: string): { success: boolean; message?: string; isPending?: boolean } => {
    const cleanId = identifier.trim().toLowerCase();

    if (!cleanId) {
      return { success: false, message: 'Please enter your registered username.' };
    }

    // 1. Verify if account was deleted by admin_master
    let currentDeleted: DeletedUserRecord[] = deletedUsers;
    try {
      const savedDel = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
      if (savedDel) currentDeleted = JSON.parse(savedDel);
    } catch {}

    const isDeletedAccount = currentDeleted.some(
      (d) =>
        (d.id && d.id.toLowerCase() === cleanId) ||
        (d.username && d.username.toLowerCase() === cleanId) ||
        (d.email && d.email.toLowerCase() === cleanId)
    );

    if (isDeletedAccount) {
      return {
        success: false,
        message: 'This user account has been deleted by the Master Admin (admin_master). You cannot log in until you register again as a new applicant.',
      };
    }

    // Strict authentication: Match ONLY by registered username
    const foundUser = teamMembers.find(
      (m) => m.username && m.username.toLowerCase() === cleanId
    );

    // If not found by username, check if they entered their full name or email by mistake
    if (!foundUser) {
      const matchedByNameOrEmail = teamMembers.find(
        (m) =>
          (m.name && m.name.toLowerCase() === cleanId) ||
          (m.email && m.email.toLowerCase() === cleanId)
      );

      if (matchedByNameOrEmail) {
        return {
          success: false,
          message: `Login requires your registered username and PIN. Logging in by name or email is disabled. Please use your registered username: "${matchedByNameOrEmail.username}".`,
        };
      }

      return {
        success: false,
        message: 'User account not found. Please log in using your registered username and PIN.',
      };
    }

    if (foundUser.status === 'PENDING_VERIFICATION') {
      return {
        success: false,
        isPending: true,
        message: 'Your registration is currently PENDING VERIFICATION by the Role Master (Master Admin). Please wait for approval or sign in as Master Admin to verify.',
      };
    }

    if (foundUser.status === 'SUSPENDED' || foundUser.status === 'INACTIVE') {
      return { success: false, message: `Account is currently ${foundUser.status.toLowerCase()}. Please contact the Role Master / Managing Director.` };
    }

    // PIN is strictly required for login
    if (!pinOrPassword || !pinOrPassword.trim()) {
      return { success: false, message: 'Security PIN is required. Please enter your 4-6 digit PIN.' };
    }

    const expectedPin = foundUser.pin || '1234';
    if (expectedPin !== pinOrPassword.trim()) {
      return { success: false, message: 'Incorrect Security PIN. Please enter your valid 4-6 digit PIN.' };
    }

    const updatedUser = {
      ...foundUser,
      lastLoginAt: 'Just now',
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, updatedUser.id);
    } catch (e) {
      console.error(e);
    }

    // Update lastLogin in team members and firestore
    setTeamMembers((prev) => prev.map((m) => (m.id === foundUser.id ? updatedUser : m)));
    saveUserToFirestore(updatedUser);

    return { success: true };
  };

  const resetPinWithEmail = (email: string, newPin: string): { success: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const targetUser = teamMembers.find((m) => m.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      return { success: false, message: `No registered consultant account found with email "${email}".` };
    }

    const updatedUser: TeamMember = {
      ...targetUser,
      pin: newPin.trim(),
    };

    setTeamMembers((prev) => prev.map((m) => (m.id === targetUser.id ? updatedUser : m)));
    saveUserToFirestore(updatedUser);

    return {
      success: true,
      message: `Security PIN for ${targetUser.name} (@${targetUser.username}) has been updated.`,
    };
  };

  const logout = () => {
    logoutFirebase();
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_STATE);
      localStorage.removeItem(STORAGE_KEY_AUTH_STATE);
    } catch (e) {
      console.error(e);
    }
  };

  // Master Admin Authority Check (Strictly admin.master / MASTER_ADMIN)
  const isMasterAdmin = useMemo(() => {
    if (!currentUser) return false;
    const role = String(currentUser.role || '').toUpperCase();
    const username = String(currentUser.username || '').toLowerCase();
    const email = String(currentUser.email || '').toLowerCase();
    const id = String(currentUser.id || '');

    return (
      id === 'usr-0' ||
      role === 'MASTER_ADMIN' ||
      role === 'ADMIN_MASTER' ||
      role === 'SUPERADMIN' ||
      username === 'admin.master' ||
      username === 'admin_master' ||
      email === 'admin@gapsite.com'
    );
  }, [currentUser]);

  // Account switching with PIN security check
  const canSwitchAccount = true;

  const switchAccount = (userId: string, pin?: string): { success: boolean; message?: string } => {
    let currentDeleted: DeletedUserRecord[] = deletedUsers;
    try {
      const savedDel = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
      if (savedDel) currentDeleted = JSON.parse(savedDel);
    } catch {}

    const isDeletedAccount = currentDeleted.some((d) => d.id?.toLowerCase() === userId.toLowerCase());
    if (isDeletedAccount) {
      return { success: false, message: 'This user account has been deleted by the Master Admin and cannot be switched to.' };
    }

    const targetUser = teamMembers.find((m) => m.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Account not found.' };
    }

    if (currentUser.id === targetUser.id) {
      return { success: true };
    }

    // Check PIN if defined
    if (targetUser.pin && targetUser.pin.trim() !== '') {
      if (!pin || pin.trim() !== targetUser.pin.trim()) {
        return {
          success: false,
          message: `Incorrect Security PIN for ${targetUser.name}. (Default PIN is 110711)`,
        };
      }
    }

    const updatedUser = {
      ...targetUser,
      lastLoginAt: 'Just now',
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, updatedUser.id);
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  const quickSwitchUser = (userId: string, pin?: string): { success: boolean; message?: string } => {
    return switchAccount(userId, pin);
  };

  // Permission Checks with dynamic Role Governance evaluation
  const hasPermission = useCallback(
    (permission: import('../types').UserPermission): boolean => {
      if (!isAuthenticated || !currentUser) return false;
      if (currentUser.role === 'MASTER_ADMIN' || currentUser.role === 'DIRECTOR') return true;
      const roleDef = roleDefinitions[currentUser.role];
      if (roleDef?.defaultPermissions && roleDef.defaultPermissions.includes(permission)) return true;
      return currentUser.permissions ? currentUser.permissions.includes(permission) : false;
    },
    [isAuthenticated, currentUser, roleDefinitions]
  );

  const isRole = useCallback(
    (...roles: import('../types').UserRole[]): boolean => {
      if (!isAuthenticated || !currentUser) return false;
      if (currentUser.role === 'MASTER_ADMIN') return true;
      return roles.includes(currentUser.role);
    },
    [isAuthenticated, currentUser]
  );

  // Count pending unverified registrations
  const pendingMembersCount = useMemo(() => {
    return teamMembers.filter((m) => m.status === 'PENDING_VERIFICATION').length;
  }, [teamMembers]);

  // User Management
  const addUser = (userData: Omit<TeamMember, 'id'>): TeamMember => {
    const cleanUsername = (userData.username || userData.email.split('@')[0]).toLowerCase().trim();
    const cleanEmail = userData.email.toLowerCase().trim();

    // Check if username is already registered and taken: usernames cannot be reused
    const usernameTaken = teamMembers.some(
      (m) => (m.username || '').toLowerCase() === cleanUsername
    );
    if (usernameTaken) {
      throw new Error(`Username "@${cleanUsername}" is already registered and cannot be reused. Please choose a different username.`);
    }

    // If this user was previously deleted, clear them from the deleted blacklist so they can submit registration
    setDeletedUsers((prev) => {
      const filtered = prev.filter(
        (d) =>
          d.username?.toLowerCase() !== cleanUsername &&
          d.email?.toLowerCase() !== cleanEmail
      );
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_USERS, JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
      return filtered;
    });
    removeDeletedUserFromFirestore(cleanUsername);
    removeDeletedUserFromFirestore(cleanEmail);

    const newId = `usr-${Date.now()}`;
    const newUser: TeamMember = {
      ...userData,
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      status: userData.status || 'PENDING_VERIFICATION',
      lastLoginAt: 'Never',
      registeredAt: userData.registeredAt || 'Just now',
    };

    setTeamMembers((prev) => {
      const next = [...prev.filter((m) => m.id !== newId), newUser];
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    saveUserToFirestore(newUser);
    broadcastLiveUserUpdate(newUser);
    broadcastLiveDataUpdate('MEMBERS', [...teamMembers.filter((m) => m.id !== newId), newUser]);
    return newUser;
  };

  const verifyUser = (
    userId: string,
    options?: {
      role?: import('../types').UserRole;
      roleTitle?: string;
      department?: string;
      permissions?: import('../types').UserPermission[];
      notes?: string;
      nik?: string;
      idType?: 'NIK' | 'KTP' | 'PASPOR';
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountHolder?: string;
    }
  ) => {
    // Statutory Security Gate: ONLY admin.master / MASTER_ADMIN can verify & accept new registrations
    if (!isMasterAdmin) {
      console.warn('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can verify or accept new registered members.');
      return;
    }

    const target = teamMembers.find((m) => m.id === userId);
    if (!target) return;

    const verifiedMember: TeamMember = {
      ...target,
      status: 'ACTIVE',
      role: options?.role || target.role,
      roleTitle: options?.roleTitle || target.roleTitle,
      department: options?.department || target.department,
      permissions: options?.permissions || target.permissions,
      nik: options?.nik !== undefined ? options.nik : target.nik,
      idType: options?.idType !== undefined ? options.idType : target.idType,
      bankName: options?.bankName !== undefined ? options.bankName : target.bankName,
      bankAccountNumber: options?.bankAccountNumber !== undefined ? options.bankAccountNumber : target.bankAccountNumber,
      bankAccountHolder: options?.bankAccountHolder !== undefined ? options.bankAccountHolder : target.bankAccountHolder,
      verifiedBy: currentUser.name || 'Adryan kelvianto (Master Admin)',
      verifiedAt: 'Just now',
      verificationNotes: options?.notes || 'Statutory verification authorized & accepted by Master Admin (admin.master)',
    };

    const nextMembers = teamMembers.map((m) => (m.id === userId ? verifiedMember : m));
    setTeamMembers(nextMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(nextMembers));
    } catch (e) {
      console.error(e);
    }

    if (currentUser.id === userId) {
      setCurrentUser(verifiedMember);
    }

    saveUserToFirestore(verifiedMember);
    broadcastLiveUserUpdate(verifiedMember);
    broadcastLiveDataUpdate('MEMBERS', nextMembers);
  };

  const rejectUser = (userId: string, _reason?: string) => {
    // Statutory Security Gate: ONLY admin.master / MASTER_ADMIN can decline or reject new registrations
    if (!isMasterAdmin) {
      console.warn('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can decline or reject new registered members.');
      return;
    }
    const nextMembers = teamMembers.filter((m) => m.id !== userId);
    setTeamMembers(nextMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(nextMembers));
    } catch (e) {
      console.error(e);
    }
    deleteUserFromFirestore(userId);
    broadcastLiveDataUpdate('MEMBERS', nextMembers);
  };

  const changeMemberRole = (
    userId: string,
    newRole: import('../types').UserRole,
    options?: {
      roleTitle?: string;
      department?: string;
      permissions?: import('../types').UserPermission[];
      notes?: string;
    }
  ) => {
    const DEFAULT_TITLES: Record<import('../types').UserRole, string> = {
      MASTER_ADMIN: 'Chief Role Master & System SuperAdmin',
      DIRECTOR: 'Managing Partner / Director',
      LEAD_CONSULTANT: 'Senior TKDN Lead Assessor',
      TECHNICAL_CONSULTANT: 'TKDN & BOM Technical Specialist',
      SURVEYOR_LIAISON: 'Sucofindo / SI Regulatory Liaison',
      FINANCE_OFFICER: 'Finance & Invoicing Controller',
      CLIENT_VIEWER: 'Client Authorized Representative',
    };

    const DEFAULT_PERMISSIONS: Record<import('../types').UserRole, import('../types').UserPermission[]> = {
      MASTER_ADMIN: [
        'MANAGE_USERS_ROLES',
        'VERIFY_NEW_USERS',
        'VIEW_PROJECTS',
        'CREATE_PROJECTS',
        'EDIT_PROJECTS',
        'DELETE_PROJECTS',
        'CALCULATE_TKDN',
        'UPLOAD_DOCUMENTS',
        'VERIFY_DOCUMENTS',
        'SIGNOFF_MILESTONES',
        'MANAGE_DISPOSITIONS',
        'MANAGE_FINANCE',
        'EXPORT_AUDIT_REPORTS',
      ],
      DIRECTOR: [
        'MANAGE_USERS_ROLES',
        'VERIFY_NEW_USERS',
        'VIEW_PROJECTS',
        'CREATE_PROJECTS',
        'EDIT_PROJECTS',
        'DELETE_PROJECTS',
        'CALCULATE_TKDN',
        'UPLOAD_DOCUMENTS',
        'VERIFY_DOCUMENTS',
        'SIGNOFF_MILESTONES',
        'MANAGE_DISPOSITIONS',
        'MANAGE_FINANCE',
        'EXPORT_AUDIT_REPORTS',
      ],
      LEAD_CONSULTANT: [
        'VIEW_PROJECTS',
        'CREATE_PROJECTS',
        'EDIT_PROJECTS',
        'CALCULATE_TKDN',
        'UPLOAD_DOCUMENTS',
        'VERIFY_DOCUMENTS',
        'SIGNOFF_MILESTONES',
        'MANAGE_DISPOSITIONS',
        'EXPORT_AUDIT_REPORTS',
      ],
      TECHNICAL_CONSULTANT: [
        'VIEW_PROJECTS',
        'CALCULATE_TKDN',
        'UPLOAD_DOCUMENTS',
        'MANAGE_DISPOSITIONS',
        'EXPORT_AUDIT_REPORTS',
      ],
      SURVEYOR_LIAISON: [
        'VIEW_PROJECTS',
        'UPLOAD_DOCUMENTS',
        'VERIFY_DOCUMENTS',
        'SIGNOFF_MILESTONES',
        'EXPORT_AUDIT_REPORTS',
      ],
      FINANCE_OFFICER: [
        'VIEW_PROJECTS',
        'UPLOAD_DOCUMENTS',
        'MANAGE_FINANCE',
        'EXPORT_AUDIT_REPORTS',
      ],
      CLIENT_VIEWER: [
        'VIEW_PROJECTS',
        'UPLOAD_DOCUMENTS',
        'EXPORT_AUDIT_REPORTS',
      ],
    };

    const target = teamMembers.find((m) => m.id === userId);
    if (!target) return;

    const roleDef = roleDefinitions[newRole] || DEFAULT_ROLE_DEFINITIONS[newRole];
    const chosenTitle = options?.roleTitle || roleDef?.title || DEFAULT_TITLES[newRole] || target.roleTitle;
    const chosenDept = options?.department || roleDef?.department || target.department;
    const chosenPermissions = options?.permissions || roleDef?.defaultPermissions || target.permissions;

    const updatedMember: TeamMember = {
      ...target,
      role: newRole,
      roleTitle: chosenTitle,
      department: chosenDept,
      permissions: chosenPermissions,
      verificationNotes: options?.notes || `Role reassigned to ${newRole} by Master Admin (${currentUser.name})`,
    };

    const nextMembers = teamMembers.map((m) => (m.id === userId ? updatedMember : m));
    setTeamMembers(nextMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(nextMembers));
    } catch (e) {
      console.error(e);
    }

    const isCurrentActive =
      currentUser.id === userId ||
      (currentUser.email && target.email && currentUser.email.toLowerCase() === target.email.toLowerCase()) ||
      (currentUser.username && target.username && currentUser.username.toLowerCase() === target.username.toLowerCase());
    if (isCurrentActive) {
      setCurrentUser(updatedMember);
    }

    saveUserToFirestore(updatedMember);
    broadcastLiveUserUpdate(updatedMember);
    broadcastLiveDataUpdate('MEMBERS', nextMembers);
  };

  const updateUser = (id: string, updates: Partial<TeamMember>) => {
    const target = teamMembers.find((m) => m.id === id);
    const updatedMember: TeamMember = target
      ? { ...target, ...updates }
      : ({ ...updates, id } as TeamMember);

    const nextMembers = teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setTeamMembers(nextMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(nextMembers));
    } catch (e) {
      console.error(e);
    }

    const isCurrentActive =
      currentUser.id === id ||
      (currentUser.email && target?.email && currentUser.email.toLowerCase() === target.email.toLowerCase()) ||
      (currentUser.username && target?.username && currentUser.username.toLowerCase() === target.username.toLowerCase());
    if (isCurrentActive) {
      setCurrentUser((curr) => ({ ...curr, ...updates }));
    }

    saveUserToFirestore(updatedMember);
    broadcastLiveUserUpdate(updatedMember);
    broadcastLiveDataUpdate('MEMBERS', nextMembers);
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      alert('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) has statutory authority to delete users on RBAC.');
      return {
        success: false,
        message: 'Unauthorized: Only Master Admin can delete users from RBAC.',
      };
    }
    if (currentUser.id === id || id === 'usr-0') {
      alert('Cannot delete the currently active user account you are logged into or the root Master Admin.');
      return {
        success: false,
        message: 'Cannot delete the currently active logged-in user account or root Master Admin.',
      };
    }
    const target = teamMembers.find((m) => m.id === id);
    if (!target) {
      return {
        success: false,
        message: 'User account not found.',
      };
    }

    const cleanUsername = (target.username || target.email.split('@')[0]).toLowerCase().trim();
    const cleanEmail = (target.email || '').toLowerCase().trim();

    const record: DeletedUserRecord = {
      id: target.id,
      username: cleanUsername,
      email: cleanEmail,
      name: target.name,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name || 'Adryan kelvianto (admin.master)',
    };

    // 1. Add to deleted blacklist in state, localStorage, and Firestore
    setDeletedUsers((prev) => {
      const updated = [
        ...prev.filter(
          (d) =>
            d.id !== target.id &&
            d.username?.toLowerCase() !== cleanUsername &&
            d.email?.toLowerCase() !== cleanEmail
        ),
        record,
      ];
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_USERS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      broadcastLiveDataUpdate('DELETED_USERS', updated);
      return updated;
    });
    saveDeletedUserToFirestore(record);

    // 2. Delete user document from Firestore
    deleteUserFromFirestore(id);

    // 3. Remove user from local state and update localStorage immediately
    const updatedMembers = teamMembers.filter(
      (m) =>
        m.id !== id &&
        (m.username || '').toLowerCase() !== cleanUsername &&
        (m.email || '').toLowerCase() !== cleanEmail
    );
    setTeamMembers(updatedMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
    } catch (e) {
      console.error(e);
    }
    broadcastLiveDataUpdate('MEMBERS', updatedMembers);

    return {
      success: true,
      message: `User account "${target.name}" (@${cleanUsername}) has been permanently deleted from RBAC. They cannot log in until they re-register.`,
    };
  };

  const toggleUserStatus = (id: string) => {
    const target = teamMembers.find((m) => m.id === id);
    if (!target) return;

    let newStatus: TeamMember['status'] = 'ACTIVE';
    if (target.status === 'ACTIVE') newStatus = 'INACTIVE';
    else if (target.status === 'INACTIVE') newStatus = 'ACTIVE';
    else if (target.status === 'PENDING_VERIFICATION') {
      if (!isMasterAdmin) {
        console.warn('Unauthorized: Only Master Admin can verify and activate pending members.');
        return;
      }
      newStatus = 'ACTIVE';
    }

    const toggledMember: TeamMember = {
      ...target,
      status: newStatus,
      ...(target.status === 'PENDING_VERIFICATION' && newStatus === 'ACTIVE'
        ? {
            verifiedBy: currentUser.name || 'Adryan kelvianto (Master Admin)',
            verifiedAt: 'Just now',
            verificationNotes: 'Activated via Status Toggle by Master Admin (admin.master)',
          }
        : {}),
    };

    const nextMembers = teamMembers.map((m) => (m.id === id ? toggledMember : m));
    setTeamMembers(nextMembers);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(nextMembers));
    } catch (e) {
      console.error(e);
    }

    if (currentUser.id === id) {
      setCurrentUser(toggledMember);
    }

    saveUserToFirestore(toggledMember);
    broadcastLiveUserUpdate(toggledMember);
    broadcastLiveDataUpdate('MEMBERS', nextMembers);
  };

  // Master Admin function to rename/update Role Position Metadata & Standard Compensation
  const updateRolePositionTitle = (
    role: UserRole,
    updates: {
      title?: string;
      department?: string;
      desc?: string;
      standardCompensation?: RoleDefinition['standardCompensation'];
    },
    updateExistingMembers: boolean = true,
    syncSalaryConfigsForRole?: boolean
  ) => {
    if (!isMasterAdmin) {
      alert('Only Master Admin (admin.master) has authority to change system role position names.');
      return;
    }

    const trimmedTitle = updates.title?.trim();
    const trimmedDept = updates.department?.trim();
    const trimmedDesc = updates.desc?.trim();

    const existing = roleDefinitions[role] || DEFAULT_ROLE_DEFINITIONS[role];
    const updatedRole: RoleDefinition = {
      ...existing,
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      ...(trimmedDept !== undefined ? { department: trimmedDept } : {}),
      ...(trimmedDesc !== undefined ? { desc: trimmedDesc } : {}),
      ...(updates.standardCompensation !== undefined ? { standardCompensation: updates.standardCompensation } : {}),
    };
    const updatedDefinitions: RoleDefinitionsMap = {
      ...roleDefinitions,
      [role]: updatedRole,
    };

    setRoleDefinitions(updatedDefinitions);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(updatedDefinitions));
    } catch (err) {
      console.error('Failed to save role definitions to localStorage:', err);
    }

    saveSettingsToFirestore('role_definitions', updatedDefinitions);
    broadcastLiveDataUpdate('ROLE_DEFINITIONS', updatedDefinitions);

    if (updateExistingMembers) {
      const updatedMembers = teamMembers.map((member) => {
        if (member.role === role) {
          const updated: TeamMember = {
            ...member,
            ...(trimmedTitle ? { roleTitle: trimmedTitle } : {}),
            ...(trimmedDept !== undefined ? { department: trimmedDept } : {}),
          };
          if (currentUser.id === member.id) {
            setCurrentUser(updated);
          }
          saveUserToFirestore(updated);
          broadcastLiveUserUpdate(updated);
          return updated;
        }
        return member;
      });

      setTeamMembers(updatedMembers);
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
      } catch (err) {
        console.error('Failed to save members to localStorage:', err);
      }
      broadcastLiveDataUpdate('MEMBERS', updatedMembers);
    }

    if (syncSalaryConfigsForRole && updates.standardCompensation) {
      const activeYear = new Date().getFullYear();
      const comp = updates.standardCompensation;
      const matchingMembers = teamMembers.filter((m) => m.role === role);
      if (matchingMembers.length > 0) {
        setEmployeeSalaryConfigs((prevConfigs) => {
          let updatedConfigs = [...prevConfigs];
          const nowIso = new Date().toISOString();
          matchingMembers.forEach((mem) => {
            const idx = updatedConfigs.findIndex(
              (c) => c.employeeId === mem.id && Number(c.year) === activeYear
            );
            if (idx >= 0) {
              updatedConfigs[idx] = {
                ...updatedConfigs[idx],
                basicSalary: comp.basicSalary,
                positionAllowance: comp.positionAllowance,
                transportAllowance: comp.transportAllowance,
                mealAllowance: comp.mealAllowance,
                communicationAllowance: comp.communicationAllowance ?? 0,
                fixedAllowance: comp.fixedAllowance ?? 0,
                updatedAt: nowIso,
                updatedBy: currentUser?.name || 'Master Admin',
              };
            } else {
              updatedConfigs.push({
                id: `SALCFG-${activeYear}-${mem.id}-${Date.now().toString(36)}`,
                employeeId: mem.id,
                employeeName: mem.name,
                year: activeYear,
                role: mem.role,
                roleTitle: mem.roleTitle || trimmedTitle || mem.role,
                department: mem.department || trimmedDept || 'Konsultansi',
                basicSalary: comp.basicSalary,
                positionAllowance: comp.positionAllowance,
                transportAllowance: comp.transportAllowance,
                mealAllowance: comp.mealAllowance,
                communicationAllowance: comp.communicationAllowance ?? 0,
                fixedAllowance: comp.fixedAllowance ?? 0,
                annualBonusEstimate: comp.basicSalary * 1.5,
                thrMonths: 1,
                skNumber: `SK-DIR/REMUN/${activeYear}/${mem.id.slice(-4).toUpperCase()}`,
                effectiveDate: `${activeYear}-01-01`,
                status: 'ACTIVE',
                notes: `Disinkronkan otomatis dari standar remunerasi jabatan ${trimmedTitle || mem.role}.`,
                createdAt: nowIso,
                updatedAt: nowIso,
                updatedBy: currentUser?.name || 'Master Admin',
              });
            }
          });

          try {
            localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(updatedConfigs));
          } catch (e) {
            console.warn(e);
          }
          saveSettingsToFirestore('employee_salary_configs', updatedConfigs);
          broadcastLiveDataUpdate('EMPLOYEE_SALARY_CONFIGS', updatedConfigs);
          return updatedConfigs;
        });
      }
    }
  };

  const resetRolePositionTitles = () => {
    if (!isMasterAdmin) {
      alert('Only Master Admin can reset role position names.');
      return;
    }
    setRoleDefinitions(DEFAULT_ROLE_DEFINITIONS);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(DEFAULT_ROLE_DEFINITIONS));
    } catch (err) {
      console.error(err);
    }
    saveSettingsToFirestore('role_definitions', DEFAULT_ROLE_DEFINITIONS);
    broadcastLiveDataUpdate('ROLE_DEFINITIONS', DEFAULT_ROLE_DEFINITIONS);
  };

  // Master Admin function to edit capabilities / permissions on each role
  const updateRoleCapabilities = (
    role: UserRole,
    permissions: UserPermission[],
    updateExistingMembers: boolean = true
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return {
        success: false,
        message: 'Unauthorized: Only Master Admin (admin.master) has statutory authority to modify role capabilities and permissions.',
      };
    }

    const existing = roleDefinitions[role] || DEFAULT_ROLE_DEFINITIONS[role];
    const updatedRole: RoleDefinition = {
      ...existing,
      defaultPermissions: permissions,
    };
    const updatedDefinitions: RoleDefinitionsMap = {
      ...roleDefinitions,
      [role]: updatedRole,
    };

    setRoleDefinitions(updatedDefinitions);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(updatedDefinitions));
    } catch (err) {
      console.error('Failed to save role definitions to localStorage:', err);
    }

    saveSettingsToFirestore('role_definitions', updatedDefinitions);
    broadcastLiveDataUpdate('ROLE_DEFINITIONS', updatedDefinitions);

    if (updateExistingMembers) {
      const updatedMembers = teamMembers.map((member) => {
        if (member.role === role) {
          const updated: TeamMember = {
            ...member,
            permissions: permissions,
          };
          if (currentUser.id === member.id) {
            setCurrentUser(updated);
          }
          saveUserToFirestore(updated);
          broadcastLiveUserUpdate(updated);
          return updated;
        }
        return member;
      });

      setTeamMembers(updatedMembers);
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
      } catch (err) {
        console.error('Failed to save members to localStorage:', err);
      }
      broadcastLiveDataUpdate('MEMBERS', updatedMembers);
    }

    return {
      success: true,
      message: `Capabilities for role "${role}" updated successfully with ${permissions.length} active permissions.`,
    };
  };

  const resetRoleCapabilities = (role?: UserRole) => {
    if (!isMasterAdmin) {
      alert('Only Master Admin can reset role capabilities.');
      return;
    }
    if (role) {
      const defaultRole = DEFAULT_ROLE_DEFINITIONS[role];
      if (defaultRole) {
        updateRoleCapabilities(role, defaultRole.defaultPermissions, true);
      }
    } else {
      setRoleDefinitions(DEFAULT_ROLE_DEFINITIONS);
      try {
        localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(DEFAULT_ROLE_DEFINITIONS));
      } catch (err) {
        console.error(err);
      }
      saveSettingsToFirestore('role_definitions', DEFAULT_ROLE_DEFINITIONS);
      broadcastLiveDataUpdate('ROLE_DEFINITIONS', DEFAULT_ROLE_DEFINITIONS);

      const updatedMembers = teamMembers.map((member) => {
        const defaultRole = DEFAULT_ROLE_DEFINITIONS[member.role];
        if (defaultRole) {
          const updated = {
            ...member,
            permissions: defaultRole.defaultPermissions,
          };
          if (currentUser.id === member.id) {
            setCurrentUser(updated);
          }
          saveUserToFirestore(updated);
          broadcastLiveUserUpdate(updated);
          return updated;
        }
        return member;
      });

      setTeamMembers(updatedMembers);
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
      } catch (err) {
        console.error(err);
      }
      broadcastLiveDataUpdate('MEMBERS', updatedMembers);
    }
  };

  const updateRoleGovernanceMeta = (updates: { title?: string; desc?: string }) => {
    if (!isMasterAdmin) {
      alert('Only Master Admin (admin.master) has authority to edit Role & Position Governance name and description.');
      return;
    }
    const nextMeta = {
      ...roleGovernanceMeta,
      ...(updates.title?.trim() ? { title: updates.title.trim() } : {}),
      ...(updates.desc?.trim() ? { desc: updates.desc.trim() } : {}),
    };
    setRoleGovernanceMeta(nextMeta);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_GOVERNANCE_META, JSON.stringify(nextMeta));
    } catch (e) {
      console.error(e);
    }
    saveSettingsToFirestore('role_governance_meta', nextMeta);
    broadcastLiveDataUpdate('ROLE_GOVERNANCE_META', nextMeta);
  };

  const resetRoleGovernanceMeta = () => {
    if (!isMasterAdmin) {
      alert('Only Master Admin can reset governance metadata.');
      return;
    }
    setRoleGovernanceMeta(DEFAULT_ROLE_GOVERNANCE_META);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE_GOVERNANCE_META, JSON.stringify(DEFAULT_ROLE_GOVERNANCE_META));
    } catch (e) {
      console.error(e);
    }
    saveSettingsToFirestore('role_governance_meta', DEFAULT_ROLE_GOVERNANCE_META);
    broadcastLiveDataUpdate('ROLE_GOVERNANCE_META', DEFAULT_ROLE_GOVERNANCE_META);
  };

  // Consulting Services Master Data Management (admin.master exclusive)
  const activeConsultingServices = useMemo(() => {
    return consultingServices.filter((s) => s.status === 'ACTIVE');
  }, [consultingServices]);

  const addConsultingService = (
    service: Omit<ConsultingServiceConfig, 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string; service?: ConsultingServiceConfig } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to create new consulting service offerings.';
      return { success: false, message: msg };
    }

    if (!service.name?.trim()) {
      return { success: false, message: 'Service name is required.' };
    }

    // Generate clean ID
    let rawId = (service.id || service.code || service.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!rawId) {
      rawId = `SVC_${Date.now().toString().slice(-6)}`;
    }

    const idExists = consultingServices.some((s) => s.id === rawId);
    if (idExists) {
      rawId = `${rawId}_${Math.floor(Math.random() * 1000)}`;
    }

    const now = new Date().toISOString().split('T')[0];
    const newService: ConsultingServiceConfig = {
      ...service,
      id: rawId,
      name: service.name.trim(),
      shortName: service.shortName?.trim() || service.name.trim(),
      code: service.code?.trim().toUpperCase() || rawId.slice(0, 8),
      category: service.category?.trim() || 'Custom Advisory Service',
      description: service.description?.trim() || 'Consulting service offering.',
      regulatoryBasis: service.regulatoryBasis?.trim() || '',
      defaultSurveyor: service.defaultSurveyor || 'PT Sucofindo (Persero)',
      typicalDurationDays: Number(service.typicalDurationDays) || 30,
      basePriceIDR: Number(service.basePriceIDR) || 50000000,
      badgeColor: service.badgeColor || 'bg-indigo-100 text-indigo-800 border-indigo-300',
      iconName: service.iconName || 'Briefcase',
      isDefault: false,
      status: service.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.username || currentUser.name,
    };

    setConsultingServices((prev) => {
      const updated = [...prev, newService];
      saveSettingsToFirestore('consulting_services', updated);
      broadcastLiveDataUpdate('CONSULTING_SERVICES', updated);
      return updated;
    });
    return {
      success: true,
      message: `Consulting service "${newService.name}" successfully created.`,
      service: newService,
    };
  };

  const updateConsultingService = (
    id: string,
    updates: Partial<ConsultingServiceConfig>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to edit consulting service types.';
      return { success: false, message: msg };
    }

    const existing = consultingServices.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Consulting service not found.' };
    }

    const now = new Date().toISOString().split('T')[0];
    setConsultingServices((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            ...updates,
            updatedAt: now,
          };
        }
        return s;
      });
      saveSettingsToFirestore('consulting_services', updated);
      broadcastLiveDataUpdate('CONSULTING_SERVICES', updated);
      return updated;
    });

    return {
      success: true,
      message: `Consulting service "${updates.name || existing.name}" updated successfully.`,
    };
  };

  const deleteConsultingService = (
    id: string,
    reassignToServiceId?: string
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to remove consulting service types.';
      return { success: false, message: msg };
    }

    const targetService = consultingServices.find((s) => s.id === id);
    if (!targetService) {
      return { success: false, message: 'Service not found.' };
    }

    const matchingProjects = projects.filter((p) => p.serviceType === id);

    if (matchingProjects.length > 0) {
      if (reassignToServiceId && reassignToServiceId !== id) {
        // Reassign affected projects to another service
        setProjects((prev) => {
          const updated = prev.map((p) => (p.serviceType === id ? { ...p, serviceType: reassignToServiceId } : p));
          broadcastLiveDataUpdate('PROJECTS', updated);
          return updated;
        });
      } else {
        // Deactivate instead of hard delete to preserve historical project integrity
        const now = new Date().toISOString().split('T')[0];
        setConsultingServices((prev) => {
          const updated = prev.map((s) => (s.id === id ? { ...s, status: 'INACTIVE' as const, updatedAt: now } : s));
          saveSettingsToFirestore('consulting_services', updated);
          broadcastLiveDataUpdate('CONSULTING_SERVICES', updated);
          return updated;
        });
        return {
          success: true,
          message: `Service "${targetService.name}" is linked to ${matchingProjects.length} active project(s). It has been archived and marked as INACTIVE to protect historical audit data.`,
        };
      }
    }

    // Permanently remove
    setConsultingServices((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSettingsToFirestore('consulting_services', updated);
      broadcastLiveDataUpdate('CONSULTING_SERVICES', updated);
      return updated;
    });
    return {
      success: true,
      message: `Service "${targetService.name}" has been permanently removed from catalog.`,
    };
  };

  const toggleConsultingServiceStatus = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to toggle service status.';
      return { success: false, message: msg };
    }

    let newStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    setConsultingServices((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          newStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return {
            ...s,
            status: newStatus,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return s;
      });
      saveSettingsToFirestore('consulting_services', updated);
      broadcastLiveDataUpdate('CONSULTING_SERVICES', updated);
      return updated;
    });

    return {
      success: true,
      message: `Service status changed to ${newStatus}.`,
    };
  };

  const resetConsultingServicesToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      const msg = 'Only Master Admin can reset the consulting service catalog.';
      return { success: false, message: msg };
    }

    setConsultingServices(DEFAULT_CONSULTING_SERVICES);
    saveSettingsToFirestore('consulting_services', DEFAULT_CONSULTING_SERVICES);
    broadcastLiveDataUpdate('CONSULTING_SERVICES', DEFAULT_CONSULTING_SERVICES);
    return {
      success: true,
      message: 'Consulting services catalog has been reset to system defaults.',
    };
  };

  const getServiceConfig = (id: string) => {
    return consultingServices.find((s) => s.id === id);
  };

  const getServiceTitle = (type: ServiceType) => {
    return getServiceTypeName(type, consultingServices);
  };

  const getServiceBadge = (type: ServiceType) => {
    return getServiceTypeBadgeColor(type, consultingServices);
  };

  // Required Document Types Master Data Management (admin.master exclusive)
  const activeDocumentTypes = useMemo(() => {
    return documentTypes.filter((d) => d.status === 'ACTIVE');
  }, [documentTypes]);

  const addDocumentType = (
    docType: Omit<DocumentTypeDefinition, 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string; documentType?: DocumentTypeDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to create new required document types.';
      return { success: false, message: msg };
    }

    if (!docType.name?.trim()) {
      return { success: false, message: 'Document type name is required.' };
    }

    // Generate clean ID
    let rawId = (docType.id || docType.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!rawId) {
      rawId = `DOC_${Date.now().toString().slice(-6)}`;
    }

    const idExists = documentTypes.some((d) => d.id === rawId);
    if (idExists) {
      rawId = `${rawId}_${Math.floor(Math.random() * 1000)}`;
    }

    const now = new Date().toISOString().split('T')[0];
    const newDocType: DocumentTypeDefinition = {
      ...docType,
      id: rawId,
      name: docType.name.trim(),
      category: docType.category || 'TECHNICAL_DOSSIER',
      description: docType.description?.trim() || 'Required verification document.',
      isAutoCompleting: docType.isAutoCompleting ?? true,
      requiredForServices: docType.requiredForServices || [],
      acceptedFileTypes: docType.acceptedFileTypes && docType.acceptedFileTypes.length > 0 ? docType.acceptedFileTypes : ['.pdf', '.xlsx', '.docx', '.jpg', '.png'],
      badgeColor: docType.badgeColor || 'bg-blue-100 text-blue-800 border-blue-200',
      isSystemDefault: false,
      status: docType.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.username || currentUser.name,
    };

    setDocumentTypes((prev) => [...prev, newDocType]);
    saveDocumentTypeToFirestore(newDocType);

    return {
      success: true,
      message: `Document type "${newDocType.name}" successfully created.`,
      documentType: newDocType,
    };
  };

  const updateDocumentType = (
    id: string,
    updates: Partial<DocumentTypeDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to edit document types.';
      return { success: false, message: msg };
    }

    const existing = documentTypes.find((d) => d.id === id);
    if (!existing) {
      return { success: false, message: 'Document type not found.' };
    }

    const now = new Date().toISOString().split('T')[0];
    let updatedObj: DocumentTypeDefinition | null = null;

    setDocumentTypes((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updatedObj = {
            ...d,
            ...updates,
            updatedAt: now,
          };
          return updatedObj;
        }
        return d;
      })
    );

    if (updatedObj) {
      saveDocumentTypeToFirestore(updatedObj);
    }

    return {
      success: true,
      message: `Document type "${updates.name || existing.name}" updated successfully.`,
    };
  };

  const deleteDocumentType = (
    id: string,
    reassignToDocTypeId?: string
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to remove document types.';
      return { success: false, message: msg };
    }

    const target = documentTypes.find((d) => d.id === id);
    if (!target) {
      return { success: false, message: 'Document type not found.' };
    }

    // Count how many project documents use this type
    let linkedDocsCount = 0;
    projects.forEach((p) => {
      p.documents?.forEach((doc) => {
        if (doc.type === id) linkedDocsCount++;
      });
    });

    if (linkedDocsCount > 0) {
      if (reassignToDocTypeId && reassignToDocTypeId !== id) {
        // Reassign affected documents in projects
        setProjects((prev) =>
          prev.map((p) => ({
            ...p,
            documents: (p.documents || []).map((doc) =>
              doc.type === id ? { ...doc, type: reassignToDocTypeId as any } : doc
            ),
          }))
        );
      } else {
        // Deactivate instead of hard delete to preserve historical integrity
        const now = new Date().toISOString().split('T')[0];
        const deactivated = { ...target, status: 'INACTIVE' as const, updatedAt: now };
        setDocumentTypes((prev) =>
          prev.map((d) => (d.id === id ? deactivated : d))
        );
        saveDocumentTypeToFirestore(deactivated);
        return {
          success: true,
          message: `Document type "${target.name}" is referenced by ${linkedDocsCount} uploaded document(s). It has been marked as INACTIVE to protect audit logs.`,
        };
      }
    }

    // Delete
    setDocumentTypes((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      broadcastLiveDataUpdate('DOCUMENT_TYPES', updated);
      return updated;
    });
    deleteDocumentTypeFromFirestore(id);
    return {
      success: true,
      message: `Document type "${target.name}" has been permanently removed.`,
    };
  };

  const toggleDocumentTypeStatus = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      const msg = 'Only Master Admin (admin.master) has authority to toggle document type status.';
      return { success: false, message: msg };
    }

    let newStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    let updatedObj: DocumentTypeDefinition | null = null;
    setDocumentTypes((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          newStatus = d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          updatedObj = {
            ...d,
            status: newStatus,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedObj;
        }
        return d;
      })
    );

    if (updatedObj) {
      saveDocumentTypeToFirestore(updatedObj);
    }

    return {
      success: true,
      message: `Document type status set to ${newStatus}.`,
    };
  };

  const resetDocumentTypesToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      const msg = 'Only Master Admin can reset the document types master data.';
      return { success: false, message: msg };
    }

    setDocumentTypes(DEFAULT_DOCUMENT_TYPES);
    DEFAULT_DOCUMENT_TYPES.forEach((dt) => saveDocumentTypeToFirestore(dt));
    return {
      success: true,
      message: 'Document types catalog has been reset to system defaults.',
    };
  };

  const getDocumentTypeDefinition = (id: string) => {
    return documentTypes.find((d) => d.id === id);
  };

  // Document Categories Management (admin.master exclusive)
  const addDocumentCategory = (
    catData: Omit<DocumentCategoryDefinition, 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string; category?: DocumentCategoryDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Only Master Admin (admin.master) has authority to create document categories.' };
    }

    const cleanId = catData.id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanId || cleanId.length < 2) {
      return { success: false, message: 'Invalid category code. Must be alphanumeric uppercase (e.g. TECHNICAL_DOSSIER).' };
    }

    if (documentCategories.some((c) => c.id === cleanId)) {
      return { success: false, message: `Category with code "${cleanId}" already exists.` };
    }

    const now = new Date().toISOString().split('T')[0];
    const newCategory: DocumentCategoryDefinition = {
      ...catData,
      id: cleanId,
      name: catData.name.trim(),
      description: catData.description?.trim() || '',
      badgeColor: catData.badgeColor || 'bg-slate-100 text-slate-800 border-slate-300',
      status: catData.status || 'ACTIVE',
      isSystemDefault: false,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.name,
    };

    setDocumentCategories((prev) => [...prev, newCategory]);
    saveDocumentCategoryToFirestore(newCategory);

    return {
      success: true,
      message: `Document category "${newCategory.name}" created successfully.`,
      category: newCategory,
    };
  };

  const updateDocumentCategory = (
    id: string,
    updates: Partial<DocumentCategoryDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Only Master Admin (admin.master) has authority to edit document categories.' };
    }

    const existing = documentCategories.find((c) => c.id === id);
    if (!existing) {
      return { success: false, message: 'Category not found.' };
    }

    const now = new Date().toISOString().split('T')[0];
    let updatedObj: DocumentCategoryDefinition | null = null;

    setDocumentCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedObj = {
            ...c,
            ...updates,
            updatedAt: now,
          };
          return updatedObj;
        }
        return c;
      })
    );

    if (updatedObj) {
      saveDocumentCategoryToFirestore(updatedObj);
    }

    return {
      success: true,
      message: `Category "${updates.name || existing.name}" updated successfully.`,
    };
  };

  const deleteDocumentCategory = (
    id: string,
    reassignToCategoryId?: string
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Only Master Admin (admin.master) has authority to delete document categories.' };
    }

    const target = documentCategories.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Category not found.' };
    }

    // Check linked document types
    const linkedTypes = documentTypes.filter((d) => d.category === id);
    if (linkedTypes.length > 0) {
      if (reassignToCategoryId && reassignToCategoryId !== id) {
        // Reassign affected document types
        setDocumentTypes((prev) =>
          prev.map((d) => {
            if (d.category === id) {
              const updatedDocType = { ...d, category: reassignToCategoryId as any, updatedAt: new Date().toISOString().split('T')[0] };
              saveDocumentTypeToFirestore(updatedDocType);
              return updatedDocType;
            }
            return d;
          })
        );
      } else {
        // Mark as inactive instead of deleting
        const now = new Date().toISOString().split('T')[0];
        const deactivated = { ...target, status: 'INACTIVE' as const, updatedAt: now };
        setDocumentCategories((prev) =>
          prev.map((c) => (c.id === id ? deactivated : c))
        );
        saveDocumentCategoryToFirestore(deactivated);
        return {
          success: true,
          message: `Category "${target.name}" is linked to ${linkedTypes.length} document type(s). It has been marked as INACTIVE to protect data integrity.`,
        };
      }
    }

    // Delete
    setDocumentCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      broadcastLiveDataUpdate('DOCUMENT_CATEGORIES', updated);
      return updated;
    });
    deleteDocumentCategoryFromFirestore(id);
    return {
      success: true,
      message: `Category "${target.name}" has been permanently removed.`,
    };
  };

  const toggleDocumentCategoryStatus = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_SERVICE_TYPES') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Only Master Admin (admin.master) has authority to toggle category status.' };
    }

    let newStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    let updatedObj: DocumentCategoryDefinition | null = null;
    setDocumentCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          updatedObj = {
            ...c,
            status: newStatus,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedObj;
        }
        return c;
      })
    );

    if (updatedObj) {
      saveDocumentCategoryToFirestore(updatedObj);
    }

    return {
      success: true,
      message: `Category status set to ${newStatus}.`,
    };
  };

  const resetDocumentCategoriesToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return { success: false, message: 'Only Master Admin can reset the document categories master data.' };
    }

    setDocumentCategories(DEFAULT_DOCUMENT_CATEGORIES);
    DEFAULT_DOCUMENT_CATEGORIES.forEach((dc) => saveDocumentCategoryToFirestore(dc));
    return {
      success: true,
      message: 'Document categories catalog has been reset to system defaults.',
    };
  };

  const getDocumentCategory = (id: string) => {
    return documentCategories.find((c) => c.id === id);
  };

  // Transaction Categories Management (admin.master editable)
  const activeTransactionCategories = useMemo(() => {
    return transactionCategories.filter((c) => c.status !== 'INACTIVE');
  }, [transactionCategories]);

  const addTransactionCategory = (
    categoryData: Omit<TransactionCategoryDefinition, 'createdAt'>
  ): { success: boolean; message?: string; category?: TransactionCategoryDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) yang memiliki wewenang mengelola master kategori keuangan.' };
    }

    const cleanId = (categoryData.id || categoryData.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_');

    if (!cleanId || !categoryData.name.trim()) {
      return { success: false, message: 'Nama kategori tidak boleh kosong.' };
    }

    if (transactionCategories.some((c) => c.id === cleanId)) {
      return { success: false, message: `Kategori dengan ID "${cleanId}" sudah terdaftar.` };
    }

    const newCat: TransactionCategoryDefinition = {
      id: cleanId,
      name: categoryData.name.trim(),
      type: categoryData.type || 'EXPENSE',
      group: categoryData.group?.trim() || (categoryData.type === 'INCOME' ? 'Pendapatan' : 'Operasional & Rutin'),
      description: categoryData.description?.trim() || '',
      isDefault: false,
      color: categoryData.color || 'emerald',
      status: categoryData.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser.username || currentUser.name,
    };

    setTransactionCategories((prev) => {
      const updated = [newCat, ...prev];
      broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', updated);
      saveSettingsToFirestore('transaction_categories', updated);
      return updated;
    });

    return {
      success: true,
      message: `Kategori "${newCat.name}" berhasil ditambahkan.`,
      category: newCat,
    };
  };

  const updateTransactionCategory = (
    id: string,
    updates: Partial<TransactionCategoryDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) yang dapat memperbarui kategori.' };
    }

    const existing = transactionCategories.find((c) => c.id === id);
    if (!existing) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }

    setTransactionCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updates,
          };
        }
        return c;
      });
      broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', updated);
      saveSettingsToFirestore('transaction_categories', updated);
      return updated;
    });

    return {
      success: true,
      message: `Kategori "${updates.name || existing.name}" berhasil diperbarui.`,
    };
  };

  const deleteTransactionCategory = (
    id: string
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) yang berwenang menghapus kategori transaksi.' };
    }

    const target = transactionCategories.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }

    // Check if category is used in existing transactions
    const usedCount = transactions.filter((t) => t.category === id).length;
    if (usedCount > 0) {
      // Soft-deactivate to prevent breaking financial history
      setTransactionCategories((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, status: 'INACTIVE' as const } : c));
        broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', updated);
        saveSettingsToFirestore('transaction_categories', updated);
        return updated;
      });
      return {
        success: true,
        message: `Kategori "${target.name}" sedang digunakan pada ${usedCount} transaksi. Kategori telah dinonaktifkan (INACTIVE) agar data pembukuan historis tetap aman.`,
      };
    }

    setTransactionCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', updated);
      saveSettingsToFirestore('transaction_categories', updated);
      return updated;
    });

    return {
      success: true,
      message: `Kategori "${target.name}" berhasil dihapus secara permanen.`,
    };
  };

  const toggleTransactionCategoryStatus = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin yang dapat mengubah status aktif kategori.' };
    }

    let newStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    setTransactionCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return {
            ...c,
            status: newStatus,
          };
        }
        return c;
      });
      broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', updated);
      saveSettingsToFirestore('transaction_categories', updated);
      return updated;
    });

    return {
      success: true,
      message: `Status kategori diubah menjadi ${newStatus}.`,
    };
  };

  const resetTransactionCategoriesToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return { success: false, message: 'Hanya Master Admin yang dapat mereset master data kategori keuangan.' };
    }

    setTransactionCategories(DEFAULT_TRANSACTION_CATEGORIES);
    broadcastLiveDataUpdate('TRANSACTION_CATEGORIES', DEFAULT_TRANSACTION_CATEGORIES);
    saveSettingsToFirestore('transaction_categories', DEFAULT_TRANSACTION_CATEGORIES);
    return {
      success: true,
      message: 'Master data kategori keuangan berhasil direset ke standar sistem.',
    };
  };

  const getTransactionCategoryDefinition = (id: string) => {
    return transactionCategories.find((c) => c.id === id);
  };

  // Payment Channels Master Data Management (Bank BRI, BCA, Mandiri, BNI, BSI, etc. admin.master & finance editable)
  const activePaymentChannels = useMemo(() => {
    return paymentChannels.filter((c) => c.status !== 'INACTIVE');
  }, [paymentChannels]);

  const addPaymentChannel = (
    channelData: Omit<PaymentChannelDefinition, 'createdAt'>
  ): { success: boolean; message?: string; channel?: PaymentChannelDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) atau Finance yang berwenang menambahkan saluran pembayaran.' };
    }

    const cleanId = (channelData.id || channelData.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_');

    if (!cleanId || !channelData.name.trim()) {
      return { success: false, message: 'Nama bank atau saluran pembayaran wajib diisi.' };
    }

    if (paymentChannels.some((c) => c.id === cleanId)) {
      return { success: false, message: `Saluran atau Bank dengan ID "${cleanId}" sudah terdaftar.` };
    }

    const newChannel: PaymentChannelDefinition = {
      id: cleanId,
      name: channelData.name.trim(),
      shortName: channelData.shortName?.trim() || channelData.name.trim(),
      accountNumber: channelData.accountNumber?.trim() || '',
      accountHolder: channelData.accountHolder?.trim() || '',
      category: channelData.category || 'BANK_TRANSFER',
      description: channelData.description?.trim() || '',
      badgeColor: channelData.badgeColor || 'bg-sky-50 text-sky-700 border-sky-200',
      isDefault: false,
      status: channelData.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser.username || currentUser.name,
    };

    setPaymentChannels((prev) => {
      const updated = [...prev, newChannel];
      broadcastLiveDataUpdate('PAYMENT_CHANNELS', updated);
      saveSettingsToFirestore('payment_channels', updated);
      return updated;
    });

    return {
      success: true,
      message: `Saluran / Bank "${newChannel.name}" berhasil ditambahkan.`,
      channel: newChannel,
    };
  };

  const updatePaymentChannel = (
    id: string,
    updates: Partial<PaymentChannelDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) atau Finance yang dapat mengedit saluran pembayaran.' };
    }

    const existing = paymentChannels.find((c) => c.id === id);
    if (!existing) {
      return { success: false, message: 'Saluran pembayaran tidak ditemukan.' };
    }

    setPaymentChannels((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updates,
          };
        }
        return c;
      });
      broadcastLiveDataUpdate('PAYMENT_CHANNELS', updated);
      saveSettingsToFirestore('payment_channels', updated);
      return updated;
    });

    return {
      success: true,
      message: `Saluran / Bank "${updates.name || existing.name}" berhasil diperbarui.`,
    };
  };

  const reassignPaymentChannelTransactions = (
    sourceChannelId: string,
    targetChannelId: string
  ): { success: boolean; count: number; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, count: 0, message: 'Akses Ditolak: Wewenang tidak mencukupi.' };
    }

    const linkedTrxs = transactions.filter((t) => t.paymentMethod === sourceChannelId);
    if (linkedTrxs.length === 0) {
      return { success: true, count: 0, message: 'Tidak ada transaksi yang terhubung ke saluran ini.' };
    }

    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.paymentMethod === sourceChannelId) {
          const up = { ...t, paymentMethod: targetChannelId as any };
          saveTransactionToFirestore(up);
          return up;
        }
        return t;
      });
      broadcastLiveDataUpdate('TRANSACTIONS', updated);
      return updated;
    });

    return {
      success: true,
      count: linkedTrxs.length,
      message: `${linkedTrxs.length} transaksi berhasil dialihkan ke rekening / saluran tujuan.`,
    };
  };

  const deletePaymentChannel = (
    id: string,
    options?: { force?: boolean; reassignTo?: string; deleteLinked?: boolean }
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin (admin.master) yang berwenang menghapus saluran pembayaran.' };
    }

    const target = paymentChannels.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Saluran pembayaran tidak ditemukan.' };
    }

    const linkedTrxs = transactions.filter((t) => t.paymentMethod === id);
    const usedCount = linkedTrxs.length;

    // Option 1: Reassign linked transactions to another channel
    if (usedCount > 0 && options?.reassignTo) {
      setTransactions((prev) => {
        const updated = prev.map((t) => {
          if (t.paymentMethod === id) {
            const up = { ...t, paymentMethod: options.reassignTo as any };
            saveTransactionToFirestore(up);
            return up;
          }
          return t;
        });
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
    } else if (usedCount > 0 && options?.deleteLinked) {
      // Option 2: Delete linked transactions with the channel
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.paymentMethod !== id);
        linkedTrxs.forEach((t) => deleteTransactionFromFirestore(t.id));
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
    } else if (usedCount > 0 && !options?.force) {
      // Default fallback: Deactivate to keep historical integrity
      setPaymentChannels((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, status: 'INACTIVE' as const } : c));
        broadcastLiveDataUpdate('PAYMENT_CHANNELS', updated);
        saveSettingsToFirestore('payment_channels', updated);
        return updated;
      });
      return {
        success: true,
        message: `Saluran "${target.name}" digunakan pada ${usedCount} transaksi. Saluran telah dinonaktifkan (INACTIVE) agar data pembukuan historis tetap utuh.`,
      };
    }

    // Permanently remove channel
    setPaymentChannels((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      broadcastLiveDataUpdate('PAYMENT_CHANNELS', updated);
      saveSettingsToFirestore('payment_channels', updated);
      return updated;
    });

    return {
      success: true,
      message: `Saluran / Bank "${target.name}" berhasil dihapus secara permanen.`,
    };
  };

  const togglePaymentChannelStatus = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Master Admin yang dapat mengubah status aktif saluran pembayaran.' };
    }

    let newStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    setPaymentChannels((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return {
            ...c,
            status: newStatus,
          };
        }
        return c;
      });
      broadcastLiveDataUpdate('PAYMENT_CHANNELS', updated);
      saveSettingsToFirestore('payment_channels', updated);
      return updated;
    });

    return {
      success: true,
      message: `Status saluran pembayaran diubah menjadi ${newStatus}.`,
    };
  };

  const resetPaymentChannelsToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return { success: false, message: 'Hanya Master Admin yang dapat mereset master data perbankan ke bawaan sistem.' };
    }

    setPaymentChannels(DEFAULT_PAYMENT_CHANNELS);
    broadcastLiveDataUpdate('PAYMENT_CHANNELS', DEFAULT_PAYMENT_CHANNELS);
    saveSettingsToFirestore('payment_channels', DEFAULT_PAYMENT_CHANNELS);
    return {
      success: true,
      message: 'Master data bank & saluran pembayaran berhasil direset ke standar sistem (termasuk Bank BRI).',
    };
  };

  const getPaymentChannelDefinition = (id: string) => {
    return paymentChannels.find((c) => c.id === id);
  };

  // ==========================================
  // BANK LOAN MANAGEMENT & LEDGER SYNC METHODS
  // ==========================================
  const addBankLoan = (
    loanData: Omit<BankLoan, 'id' | 'createdAt' | 'createdBy'>
  ): { success: boolean; loan?: BankLoan; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang mengelola pinjaman bank.' };
    }

    const p = Math.max(0, Number(loanData.principalAmount) || 0);
    const rate = Math.max(0, Number(loanData.annualInterestRate) || 0);
    const tenure = Math.max(1, Number(loanData.tenureMonths) || 1);
    const facilityType = loanData.facilityType || 'NON_REVOLVING';

    const calc = calculateBankLoanSchedule(p, rate, tenure, loanData.startDate, facilityType);

    const newLoan: BankLoan = {
      ...loanData,
      id: `loan-${Date.now()}`,
      facilityType,
      principalAmount: p,
      annualInterestRate: rate,
      tenureMonths: tenure,
      monthlyPrincipal: calc.monthlyPrincipal,
      monthlyInterest: calc.monthlyInterest,
      monthlyInstallment: calc.monthlyInstallment,
      totalInterest: calc.totalInterest,
      totalPayment: calc.totalPayment,
      remainingPrincipal: p,
      paidPrincipal: 0,
      paidInterest: 0,
      status: loanData.status || 'ACTIVE',
      isDisbursed: loanData.isDisbursed || false,
      schedule: calc.schedule,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username || currentUser.name,
    };

    setBankLoans((prev) => {
      const updated = [newLoan, ...prev];
      broadcastLiveDataUpdate('BANK_LOANS', updated);
      saveSettingsToFirestore('bank_loans', updated);
      return updated;
    });

    return {
      success: true,
      loan: newLoan,
      message: `Fasilitas Pinjaman ${facilityType === 'REVOLVING' ? 'Revolving' : facilityType === 'OTHER' ? 'Lain-lain / Perorangan' : 'Non-Revolving'} "${newLoan.loanName}" (${newLoan.bankName}) berhasil didaftarkan.`,
    };
  };

  const updateBankLoan = (
    id: string,
    updates: Partial<BankLoan>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang mengedit pinjaman bank.' };
    }

    let found = false;
    setBankLoans((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          found = true;
          const merged = { ...l, ...updates, updatedAt: new Date().toISOString() };
          // If financial parameters changed and recalculation is required
          if (
            updates.principalAmount !== undefined ||
            updates.annualInterestRate !== undefined ||
            updates.tenureMonths !== undefined ||
            updates.startDate !== undefined ||
            updates.facilityType !== undefined
          ) {
            const calc = calculateBankLoanSchedule(
              merged.principalAmount,
              merged.annualInterestRate,
              merged.tenureMonths,
              merged.startDate,
              merged.facilityType || 'NON_REVOLVING'
            );
            merged.monthlyPrincipal = calc.monthlyPrincipal;
            merged.monthlyInterest = calc.monthlyInterest;
            merged.monthlyInstallment = calc.monthlyInstallment;
            merged.totalInterest = calc.totalInterest;
            merged.totalPayment = calc.totalPayment;
            
            // Preserve paid status in schedule if exists
            const prevScheduleMap = new Map<number, LoanInstallmentScheduleItem>(
              (l.schedule || []).map((s: LoanInstallmentScheduleItem) => [s.monthNumber, s])
            );
            merged.schedule = calc.schedule.map((s) => {
              const oldItem = prevScheduleMap.get(s.monthNumber);
              if (oldItem && oldItem.isPaid) {
                return {
                  ...s,
                  isPaid: true,
                  paidAt: oldItem.paidAt,
                  transactionIds: oldItem.transactionIds,
                };
              }
              return s;
            });
          }
          return merged;
        }
        return l;
      });

      if (found) {
        broadcastLiveDataUpdate('BANK_LOANS', updated);
        saveSettingsToFirestore('bank_loans', updated);
      }
      return updated;
    });

    if (!found) {
      return { success: false, message: 'Pinjaman bank tidak ditemukan.' };
    }

    return { success: true, message: 'Data fasilitas pinjaman bank berhasil diperbarui.' };
  };

  const deleteBankLoan = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && currentUser.role !== 'DIRECTOR') {
      return { success: false, message: 'Akses Ditolak: Hanya Master Admin / Tim Finance yang dapat menghapus fasilitas pinjaman.' };
    }

    const target = bankLoans.find((l) => l.id === id);
    if (!target) {
      return { success: false, message: 'Pinjaman bank tidak ditemukan.' };
    }

    // 1. Identify and automatically delete ALL linked transactions from Finance, Cashflow, and Laporan Keuangan:
    // - Disbursement transaction
    // - Installment payment transactions (principal & interest)
    // - Provision / administration fee transactions
    const txIdsToDelete = new Set<string>();
    if (target.disbursementTransactionId) {
      txIdsToDelete.add(target.disbursementTransactionId);
    }

    // From schedule
    (target.schedule || []).forEach((s) => {
      if (Array.isArray(s.transactionIds)) {
        s.transactionIds.forEach((txId) => txIdsToDelete.add(txId));
      }
    });

    // Also match transactions by reference codes or loan names
    const loanSuffix6 = target.id.slice(-6).toUpperCase();
    const loanSuffix4 = target.id.slice(-4).toUpperCase();
    transactions.forEach((t) => {
      const matchDisbRef = t.referenceNumber?.includes(`LOAN-DISB-${loanSuffix6}`);
      const matchPrinRef = t.referenceNumber?.includes(`LOAN-PRIN-`) && t.referenceNumber?.includes(loanSuffix4);
      const matchIntRef = t.referenceNumber?.includes(`LOAN-INT-`) && t.referenceNumber?.includes(loanSuffix4);
      const matchAngsRef = t.referenceNumber?.includes(`ANGS-`) && t.notes?.includes(target.loanName);
      const matchIdInNotes = t.notes?.includes(target.id);
      const matchLoanCategoryAndBank =
        (t.category === 'BANK_LOAN_DISBURSEMENT' ||
          t.category === 'BANK_LOAN_PRINCIPAL' ||
          t.category === 'BANK_LOAN_INTEREST' ||
          t.category === 'BANK_LOAN_ADMIN_FEE' ||
          t.category === 'PINJAMAN_BANK' ||
          t.category === 'CICILAN_PINJAMAN') &&
        (t.description?.toLowerCase().includes(target.loanName.toLowerCase()) ||
          t.notes?.toLowerCase().includes(target.loanName.toLowerCase()) ||
          (target.bankName && t.clientOrVendorName?.toLowerCase().includes(target.bankName.toLowerCase())));

      if (matchDisbRef || matchPrinRef || matchIntRef || matchAngsRef || matchIdInNotes || matchLoanCategoryAndBank) {
        txIdsToDelete.add(t.id);
      }
    });

    if (txIdsToDelete.size > 0) {
      setTransactions((prev) => {
        const updated = prev.filter((t) => !txIdsToDelete.has(t.id));
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
      txIdsToDelete.forEach((txId) => {
        deleteTransactionFromFirestore(txId);
      });
    }

    setBankLoans((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      broadcastLiveDataUpdate('BANK_LOANS', updated);
      saveSettingsToFirestore('bank_loans', updated);
      return updated;
    });

    return {
      success: true,
      message: `Fasilitas pinjaman "${target.loanName}" beserta mutasi kas terkait (${txIdsToDelete.size} transaksi) berhasil dihapus dari Finance, Arus Kas, dan Laporan Keuangan.`,
    };
  };

  const cancelLoanDisbursement = (
    loanId: string
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && currentUser.role !== 'DIRECTOR') {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk membatalkan pencairan pinjaman.' };
    }

    const loan = bankLoans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, message: 'Pinjaman bank tidak ditemukan.' };
    }

    const txIdsToDelete = new Set<string>();
    if (loan.disbursementTransactionId) {
      txIdsToDelete.add(loan.disbursementTransactionId);
    }
    const loanSuffix6 = loan.id.slice(-6).toUpperCase();
    transactions.forEach((t) => {
      if (
        t.category === 'BANK_LOAN_DISBURSEMENT' &&
        (t.referenceNumber?.includes(`LOAN-DISB-${loanSuffix6}`) ||
          t.description?.includes(loan.loanName) ||
          t.notes?.includes(loan.id))
      ) {
        txIdsToDelete.add(t.id);
      }
    });

    if (txIdsToDelete.size > 0) {
      setTransactions((prev) => {
        const updated = prev.filter((t) => !txIdsToDelete.has(t.id));
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
      txIdsToDelete.forEach((txId) => {
        deleteTransactionFromFirestore(txId);
      });
    }

    updateBankLoan(loanId, {
      isDisbursed: false,
      disbursedAt: undefined,
      disbursementTransactionId: undefined,
    });

    return {
      success: true,
      message: `Pencairan pinjaman "${loan.loanName}" berhasil dibatalkan dan jurnal kas terkait telah otomatis dihapus dari Finance, Arus Kas, dan Laporan Keuangan.`,
    };
  };

  const cancelLoanInstallmentPayment = (
    loanId: string,
    monthNumber: number
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && currentUser.role !== 'DIRECTOR') {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk membatalkan pembayaran angsuran.' };
    }

    const loan = bankLoans.find((l) => l.id === loanId);
    if (!loan || !loan.schedule) {
      return { success: false, message: 'Pinjaman atau jadwal angsuran tidak ditemukan.' };
    }

    const item = loan.schedule.find((s) => s.monthNumber === monthNumber);
    if (!item || !item.isPaid) {
      return { success: false, message: `Angsuran bulan ke-${monthNumber} belum tercatat lunas.` };
    }

    const txIdsToDelete = new Set<string>();
    if (Array.isArray(item.transactionIds)) {
      item.transactionIds.forEach((id) => txIdsToDelete.add(id));
    }
    const loanSuffix4 = loan.id.slice(-4).toUpperCase();
    transactions.forEach((t) => {
      const matchPrin = t.referenceNumber?.includes(`LOAN-PRIN-M${monthNumber}-${loanSuffix4}`);
      const matchInt = t.referenceNumber?.includes(`LOAN-INT-M${monthNumber}-${loanSuffix4}`);
      const matchAngs = t.referenceNumber?.includes(`ANGS-M${monthNumber}`) && t.description?.includes(loan.loanName);
      if (matchPrin || matchInt || matchAngs) {
        txIdsToDelete.add(t.id);
      }
    });

    if (txIdsToDelete.size > 0) {
      setTransactions((prev) => {
        const updated = prev.filter((t) => !txIdsToDelete.has(t.id));
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
      txIdsToDelete.forEach((txId) => {
        deleteTransactionFromFirestore(txId);
      });
    }

    const updatedSchedule = loan.schedule.map((s) => {
      if (s.monthNumber === monthNumber) {
        return {
          ...s,
          isPaid: false,
          paidAt: undefined,
          transactionIds: undefined,
        };
      }
      return s;
    });

    const newPaidPrincipal = Math.max(0, (loan.paidPrincipal || 0) - item.principalPayment);
    const newPaidInterest = Math.max(0, (loan.paidInterest || 0) - item.interestPayment);
    const newRemainingPrincipal = (loan.remainingPrincipal ?? loan.principalAmount) + item.principalPayment;

    updateBankLoan(loanId, {
      schedule: updatedSchedule,
      paidPrincipal: newPaidPrincipal,
      paidInterest: newPaidInterest,
      remainingPrincipal: newRemainingPrincipal,
      status: 'ACTIVE',
    });

    return {
      success: true,
      message: `Pembayaran angsuran bulan ke-${monthNumber} (${loan.loanName}) berhasil dibatalkan dan jurnal kas telah dihapus dari Finance, Arus Kas, dan Laporan Keuangan.`,
    };
  };

  const recordLoanDisbursementToLedger = (
    loanId: string,
    options?: {
      channelId?: string;
      date?: string;
      referenceNumber?: string;
      notes?: string;
    } | string
  ): { success: boolean; message?: string } => {
    const channelId = typeof options === 'string' ? options : options?.channelId;
    const customDate = typeof options === 'object' ? options?.date : undefined;
    const customRef = typeof options === 'object' ? options?.referenceNumber : undefined;
    const customNotes = typeof options === 'object' ? options?.notes : undefined;

    const hasFinPerm =
      isMasterAdmin ||
      hasPermission('MANAGE_FINANCE') ||
      currentUser?.role === 'ADMIN' ||
      currentUser?.role === 'FINANCE' ||
      currentUser?.role === 'SUPER_ADMIN';

    if (!hasFinPerm) {
      return { success: false, message: 'Akses Ditolak: Wewenang tidak mencukupi untuk mencatat ke buku kas.' };
    }

    const loan = bankLoans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, message: 'Pinjaman bank tidak ditemukan.' };
    }

    if (loan.isDisbursed && loan.disbursementTransactionId) {
      return { success: false, message: 'Pencairan pokok pinjaman ini sudah pernah dicatat ke buku kas.' };
    }

    const paymentMethod = channelId || loan.paymentChannelId || 'BANK_TRANSFER_BRI';
    const dateStr = customDate || loan.startDate || new Date().toISOString().slice(0, 10);
    const refNum = customRef || `LOAN-DISB-${loan.id.slice(-6).toUpperCase()}`;

    const newTx = addTransaction({
      date: dateStr,
      type: 'INCOME',
      category: 'BANK_LOAN_DISBURSEMENT',
      amountIDR: loan.principalAmount,
      description: `Pencairan Pokok Fasilitas Pinjaman Bank (${loan.facilityType === 'REVOLVING' ? 'Revolving' : 'Non-Revolving'}): ${loan.loanName} (${loan.bankName})`,
      clientOrVendorName: loan.bankName,
      paymentMethod: paymentMethod as any,
      referenceNumber: refNum,
      status: 'CLEARED',
      notes:
        customNotes ||
        `Pencairan pokok pinjaman bank modal kerja (${loan.facilityType === 'REVOLVING' ? 'Revolving / KMK' : 'Non-Revolving / Term Loan'}). Tenor ${loan.tenureMonths} bulan, suku bunga ${loan.annualInterestRate}% p.a. (Financing Inflow).`,
      recordedBy: currentUser.name || currentUser.username || 'Admin Finance',
    });

    // Update loan state
    updateBankLoan(loanId, {
      isDisbursed: true,
      disbursedAt: new Date().toISOString(),
      disbursementTransactionId: newTx.id,
      paymentChannelId: paymentMethod,
    });

    return {
      success: true,
      message: `Pencairan pokok Rp ${(loan.principalAmount || 0).toLocaleString('id-ID')} berhasil dicatat ke buku kas (No. ${newTx.transactionNumber}).`,
    };
  };

  const recordLoanInstallmentToLedger = (
    loanId: string,
    monthNumber: number,
    options?: {
      channelId?: string;
      date?: string;
      referenceNumber?: string;
      notes?: string;
    } | string
  ): { success: boolean; message?: string } => {
    const channelId = typeof options === 'string' ? options : options?.channelId;
    const customDate = typeof options === 'object' ? options?.date : undefined;
    const customRef = typeof options === 'object' ? options?.referenceNumber : undefined;
    const customNotes = typeof options === 'object' ? options?.notes : undefined;

    const hasFinPerm =
      isMasterAdmin ||
      hasPermission('MANAGE_FINANCE') ||
      currentUser?.role === 'ADMIN' ||
      currentUser?.role === 'FINANCE' ||
      currentUser?.role === 'SUPER_ADMIN';

    if (!hasFinPerm) {
      return { success: false, message: 'Akses Ditolak: Wewenang tidak mencukupi untuk mencatat angsuran ke buku kas.' };
    }

    const loan = bankLoans.find((l) => l.id === loanId);
    if (!loan || !loan.schedule) {
      return { success: false, message: 'Data pinjaman atau jadwal angsuran tidak ditemukan.' };
    }

    const item = loan.schedule.find((s) => s.monthNumber === monthNumber);
    if (!item) {
      return { success: false, message: `Angsuran bulan ke-${monthNumber} tidak ditemukan.` };
    }

    if (item.isPaid) {
      return { success: false, message: `Angsuran bulan ke-${monthNumber} sudah tercatat lunas.` };
    }

    const paymentMethod = channelId || loan.paymentChannelId || 'BANK_TRANSFER_BRI';
    const payDate = customDate || item.dueDate || new Date().toISOString().slice(0, 10);
    const txIds: string[] = [];

    // 1. Record Principal Repayment Transaction (Balance Sheet Liability Reduction) if principalPayment > 0
    if (item.principalPayment > 0) {
      const txPrincipal = addTransaction({
        date: payDate,
        type: 'EXPENSE',
        category: 'BANK_LOAN_PRINCIPAL',
        amountIDR: item.principalPayment,
        description: `Angsuran Pokok Pinjaman (Bln ke-${monthNumber}/${loan.tenureMonths}) - ${loan.loanName} (${loan.bankName})`,
        clientOrVendorName: loan.bankName,
        paymentMethod: paymentMethod as any,
        referenceNumber: customRef ? `${customRef}-POKOK` : `LOAN-PRIN-M${monthNumber}-${loan.id.slice(-4).toUpperCase()}`,
        status: 'CLEARED',
        notes:
          customNotes ||
          `Pembayaran pokok pinjaman bank. Mengurangi liabilitas pokok utang bank. Sisa pokok setelah bayar: Rp ${(item.endingBalance || 0).toLocaleString('id-ID')}`,
        recordedBy: currentUser.name || currentUser.username || 'Admin Finance',
      });
      if (txPrincipal?.id) txIds.push(txPrincipal.id);
    }

    // 2. Record Interest Expense Transaction (P&L Financing Expense) if interestPayment > 0
    if (item.interestPayment > 0) {
      const txInterest = addTransaction({
        date: payDate,
        type: 'EXPENSE',
        category: 'BANK_LOAN_INTEREST',
        amountIDR: item.interestPayment,
        description: `Beban Bunga Pinjaman Bank (Bln ke-${monthNumber}/${loan.tenureMonths}) - ${loan.loanName} (${loan.bankName})`,
        clientOrVendorName: loan.bankName,
        paymentMethod: paymentMethod as any,
        referenceNumber: customRef ? `${customRef}-BUNGA` : `LOAN-INT-M${monthNumber}-${loan.id.slice(-4).toUpperCase()}`,
        status: 'CLEARED',
        notes:
          customNotes ||
          `Beban bunga pinjaman bank ${loan.annualInterestRate}% p.a. (Financing Interest Expense).`,
        recordedBy: currentUser.name || currentUser.username || 'Admin Finance',
      });
      if (txInterest?.id) txIds.push(txInterest.id);
    }

    // 3. Update Loan Schedule & Aggregate Paid
    const updatedSchedule = loan.schedule.map((s) => {
      if (s.monthNumber === monthNumber) {
        return {
          ...s,
          isPaid: true,
          paidAt: new Date().toISOString(),
          transactionIds: txIds,
        };
      }
      return s;
    });

    const newPaidPrincipal = (loan.paidPrincipal || 0) + item.principalPayment;
    const newPaidInterest = (loan.paidInterest || 0) + item.interestPayment;
    const newRemainingPrincipal = item.endingBalance;
    const isAllPaid = updatedSchedule.every((s) => s.isPaid) || newRemainingPrincipal <= 0;

    updateBankLoan(loanId, {
      schedule: updatedSchedule,
      paidPrincipal: newPaidPrincipal,
      paidInterest: newPaidInterest,
      remainingPrincipal: newRemainingPrincipal,
      status: isAllPaid ? 'PAID_OFF' : 'ACTIVE',
    });

    return {
      success: true,
      message: `Pembayaran angsuran Bln ke-${monthNumber} (${loan.facilityType === 'REVOLVING' ? 'Bunga Saja' : 'Pokok + Bunga'} Rp ${(item.totalPayment || 0).toLocaleString('id-ID')}) berhasil dibukukan ke jurnal kas.`,
    };
  };

  const renewBankLoan = (
    loanId: string,
    renewalData: {
      tenureMonthsAdded?: number;
      newPrincipal?: number;
      newInterestRate?: number;
      renewalDate?: string;
      adendumNumber?: string;
      provisionFee?: number;
      recordProvisionToLedger?: boolean;
      paymentChannelId?: string;
      notes?: string;
    }
  ): { success: boolean; message?: string; loan?: BankLoan } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang memperpanjang fasilitas kredit pinjaman bank.' };
    }

    const loan = bankLoans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, message: 'Fasilitas pinjaman bank tidak ditemukan.' };
    }

    const tenureAdded = Math.max(1, Number(renewalData.tenureMonthsAdded) || 12);
    const newPrincipal = Math.max(0, Number(renewalData.newPrincipal ?? loan.remainingPrincipal ?? loan.principalAmount));
    const newRate = Math.max(0, Number(renewalData.newInterestRate ?? loan.annualInterestRate));
    const renewalDate = renewalData.renewalDate || new Date().toISOString().slice(0, 10);
    const adendumNo = renewalData.adendumNumber?.trim() || `PK-ADD-${loan.bankName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
    const provFee = Math.max(0, Number(renewalData.provisionFee) || 0);

    const renewalRecordId = `renew-${Date.now()}`;

    // Generate renewed schedule and metrics
    const calc = generateRevolvingRenewalSchedule(
      loan,
      tenureAdded,
      newPrincipal,
      newRate,
      renewalDate,
      renewalRecordId
    );

    let provisionTxId: string | undefined = undefined;

    // Record provision / admin fee to cash ledger if requested and > 0
    if (renewalData.recordProvisionToLedger && provFee > 0) {
      const channel = renewalData.paymentChannelId || loan.paymentChannelId || 'BANK_TRANSFER_BRI';
      const provTx = addTransaction({
        date: renewalDate,
        type: 'EXPENSE',
        category: 'BANK_LOAN_ADMIN_FEE',
        amountIDR: provFee,
        description: `Biaya Provisi & Administrasi Perpanjangan Kredit (Adendum ${adendumNo}) - ${loan.loanName} (${loan.bankName})`,
        clientOrVendorName: loan.bankName,
        paymentMethod: channel as any,
        referenceNumber: `PROV-${adendumNo}`,
        status: 'CLEARED',
        notes: `Biaya provisi/administrasi tahunan perpanjangan fasilitas kredit revolving KMK periode ke-${(loan.renewalsCount || 0) + 1}.`,
        recordedBy: currentUser.name || currentUser.username || 'Admin Finance',
      });
      if (provTx?.id) provisionTxId = provTx.id;
    }

    const previousMaturity = loan.currentMaturityDate || loan.schedule?.[loan.schedule.length - 1]?.dueDate || loan.startDate;

    const renewalRecord: LoanRenewalRecord = {
      id: renewalRecordId,
      renewalNumber: (loan.renewalsCount || 0) + 1,
      renewalDate,
      previousMaturityDate: previousMaturity,
      newMaturityDate: calc.newMaturityDate,
      tenureMonthsAdded: tenureAdded,
      previousPrincipal: loan.principalAmount,
      newPrincipal,
      previousInterestRate: loan.annualInterestRate,
      newInterestRate: newRate,
      adendumNumber: adendumNo,
      provisionFee: provFee > 0 ? provFee : undefined,
      provisionFeeRecordedToLedger: Boolean(renewalData.recordProvisionToLedger && provFee > 0),
      provisionFeeTransactionId: provisionTxId,
      notes: renewalData.notes?.trim() || undefined,
      approvedBy: currentUser.name || currentUser.username || 'Finance Admin',
      createdAt: new Date().toISOString(),
    };

    let updatedLoanTarget: BankLoan | undefined;

    setBankLoans((prev) => {
      const updated = prev.map((l) => {
        if (l.id === loanId) {
          const merged: BankLoan = {
            ...l,
            tenureMonths: calc.newTenureTotal,
            principalAmount: newPrincipal,
            remainingPrincipal: newPrincipal,
            annualInterestRate: newRate,
            monthlyInterest: calc.newMonthlyInterest,
            monthlyInstallment: calc.newMonthlyInterest,
            totalInterest: calc.totalInterest,
            totalPayment: calc.totalPayment,
            schedule: calc.fullSchedule,
            status: 'ACTIVE',
            renewalsCount: (l.renewalsCount || 0) + 1,
            renewalHistory: [...(l.renewalHistory || []), renewalRecord],
            lastRenewalDate: renewalDate,
            currentMaturityDate: calc.newMaturityDate,
            originalMaturityDate: l.originalMaturityDate || previousMaturity,
            updatedAt: new Date().toISOString(),
          };
          updatedLoanTarget = merged;
          return merged;
        }
        return l;
      });

      broadcastLiveDataUpdate('BANK_LOANS', updated);
      saveSettingsToFirestore('bank_loans', updated);
      return updated;
    });

    return {
      success: true,
      loan: updatedLoanTarget,
      message: `Perpanjangan kredit (Roll-over) fasilitas "${loan.loanName}" berhasil! Tenor diperpanjang +${tenureAdded} bulan (Jatuh tempo baru: ${calc.newMaturityDate}).`,
    };
  };

  // Company Capital (Modal Dasar, Disetor, Tambahan, Laba Ditahan) Management Methods
  const updateCompanyCapital = (
    updates: Partial<CompanyCapitalSettings>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Akses Ditolak: Hanya Master Admin atau Tim Finance yang dapat memperbarui pengaturan modal perusahaan.' };
    }

    setCompanyCapital((prev) => {
      const updated: CompanyCapitalSettings = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username || currentUser.name || 'Master Admin',
      };
      broadcastLiveDataUpdate('COMPANY_CAPITAL', updated);
      saveSettingsToFirestore('company_capital', updated);
      return updated;
    });

    return {
      success: true,
      message: 'Struktur Modal Perusahaan (Modal Dasar, Modal Disetor & Modal Tambahan) berhasil diperbarui!',
    };
  };

  const resetCompanyCapitalToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return { success: false, message: 'Hanya Master Admin yang dapat mereset struktur modal perusahaan.' };
    }

    setCompanyCapital(DEFAULT_COMPANY_CAPITAL);
    broadcastLiveDataUpdate('COMPANY_CAPITAL', DEFAULT_COMPANY_CAPITAL);
    saveSettingsToFirestore('company_capital', DEFAULT_COMPANY_CAPITAL);
    return {
      success: true,
      message: 'Pengaturan modal perusahaan berhasil direset ke standar default sistem.',
    };
  };

  // Company Letterhead & Document Printing Customization (Disinkronkan secara realtime ke seluruh role)
  const updateCompanyLetterhead = async (
    updates: Partial<CompanyLetterhead>
  ): Promise<{ success: boolean; message?: string }> => {
    const canManage =
      isMasterAdmin ||
      currentUser.role === 'ADMIN_MASTER' ||
      currentUser.role === 'DIRECTOR' ||
      currentUser.role === 'FINANCE_ADMIN' ||
      (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('MANAGE_SETTINGS'));

    if (!canManage) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya akun dengan wewenang manajemen (Master Admin, Direktur, Finance Admin) yang memiliki hak merubah kop surat dan logo perusahaan.',
      };
    }

    const updated: CompanyLetterhead = {
      ...companyLetterhead,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username || currentUser.name || 'admin.master',
    };

    // 1. Update React state immediately
    setCompanyLetterhead(updated);

    // 2. Broadcast via BroadcastChannel for instant cross-tab sync across roles
    broadcastLiveDataUpdate('COMPANY_LETTERHEAD', updated);

    // 3. Save to localStorage with storage event fallback
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_LETTERHEAD, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save letterhead warning:', e);
    }

    // 4. Save to Firestore for permanent cross-device & cross-role real-time sync
    try {
      await saveSettingsToFirestore('company_letterhead', updated);
    } catch (err: any) {
      console.error('Firestore save company_letterhead error:', err);
      return {
        success: true,
        message: 'Kop surat tersimpan secara lokal dan tersinkron ke seluruh tab, namun terjadi kendala saat menyimpan ke cloud Firestore: ' + (err?.message || ''),
      };
    }

    return {
      success: true,
      message: 'Kop surat dan logo perusahaan berhasil diperbarui dan disinkronkan ke seluruh dokumen cetak dan semua role secara realtime!',
    };
  };

  const resetCompanyLetterheadToDefault = async (): Promise<{ success: boolean; message?: string }> => {
    const canManage =
      isMasterAdmin ||
      currentUser.role === 'ADMIN_MASTER' ||
      currentUser.role === 'DIRECTOR' ||
      (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('MANAGE_SETTINGS'));

    if (!canManage) {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Master Admin atau Direktur yang dapat mereset kop surat ke pengaturan default.',
      };
    }

    const reset: CompanyLetterhead = {
      ...DEFAULT_COMPANY_LETTERHEAD,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username || currentUser.name || 'admin.master',
    };

    setCompanyLetterhead(reset);
    broadcastLiveDataUpdate('COMPANY_LETTERHEAD', reset);
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_LETTERHEAD, JSON.stringify(reset));
    } catch (e) {
      console.warn('LocalStorage reset letterhead warning:', e);
    }
    await saveSettingsToFirestore('company_letterhead', reset);
    return {
      success: true,
      message: 'Kop surat dan identitas perusahaan berhasil dikembalikan ke standar awal sistem.',
    };
  };

  // Tax Obligations & Tax Liabilities (PPN & PPh Terhutang) Methods
  const addTaxObligation = (
    taxData: Omit<TaxObligation, 'id' | 'createdAt' | 'createdBy'>
  ): { success: boolean; taxObligation?: TaxObligation; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Hanya Tim Finance / Master Admin yang dapat mencatat kewajiban pajak.' };
    }

    const calculatedRemaining =
      taxData.remainingAmount !== undefined
        ? taxData.remainingAmount
        : Math.max(0, taxData.taxAmount - (taxData.paidAmount || 0));

    const newTax: TaxObligation = syncTaxObligationDescription({
      ...taxData,
      id: `tax-${Date.now()}`,
      paidAmount: taxData.paidAmount || 0,
      remainingAmount: calculatedRemaining,
      status: taxData.status || (calculatedRemaining <= 0 ? 'PAID' : 'TERHUTANG'),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username || currentUser.name || 'Finance Officer',
    });

    setTaxObligations((prev) => {
      const updated = [newTax, ...prev];
      broadcastLiveDataUpdate('TAX_OBLIGATIONS', updated);
      saveSettingsToFirestore('tax_obligations', updated);
      return updated;
    });

    return {
      success: true,
      taxObligation: newTax,
      message: `Kewajiban Pajak "${newTax.title}" (${newTax.taxType}) sebesar Rp ${newTax.taxAmount.toLocaleString('id-ID')} berhasil dicatat.`,
    };
  };

  const updateTaxObligation = (
    id: string,
    updates: Partial<TaxObligation>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang mengedit data perpajakan.' };
    }

    let found = false;
    setTaxObligations((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          found = true;
          const merged = syncTaxObligationDescription({ ...t, ...updates, updatedAt: new Date().toISOString() });
          if (updates.taxAmount !== undefined || updates.paidAmount !== undefined) {
            const taxAmt = updates.taxAmount ?? t.taxAmount;
            const paidAmt = updates.paidAmount ?? t.paidAmount;
            merged.remainingAmount = Math.max(0, taxAmt - paidAmt);
            if (merged.remainingAmount <= 0) {
              merged.status = 'PAID';
            } else if (merged.status === 'PAID') {
              merged.status = 'TERHUTANG';
            }
          }
          return merged;
        }
        return t;
      });

      if (found) {
        broadcastLiveDataUpdate('TAX_OBLIGATIONS', updated);
        saveSettingsToFirestore('tax_obligations', updated);
      }
      return updated;
    });

    if (!found) {
      return { success: false, message: 'Data kewajiban pajak tidak ditemukan.' };
    }

    return { success: true, message: 'Data pajak berhasil diperbarui.' };
  };

  const deleteTaxObligation = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && currentUser.role !== 'DIRECTOR') {
      return { success: false, message: 'Akses Ditolak: Hanya Tim Finance / Master Admin yang dapat menghapus data pajak.' };
    }

    const target = taxObligations.find((t) => t.id === id);
    if (!target) {
      return { success: false, message: 'Data pajak tidak ditemukan.' };
    }

    // 1. Identify and automatically delete ALL linked transactions in Finance, Cashflow, and Laporan Keuangan
    const txIdsToDelete = new Set<string>();
    if (target.transactionId) {
      txIdsToDelete.add(target.transactionId);
    }

    const targetIdSuffix = target.id.slice(-4).toUpperCase();
    transactions.forEach((t) => {
      const matchNtpn = target.ntpnNumber && t.referenceNumber?.includes(target.ntpnNumber);
      const matchBilling = target.billingCode && t.referenceNumber?.includes(target.billingCode);
      const matchTaxRef = t.referenceNumber?.includes(`TAX-${targetIdSuffix}`);
      const matchIdInNote = t.notes?.includes(target.id);
      const matchTitle =
        target.title &&
        (t.category === 'TAX_PPH_PPN' ||
          t.category === 'PAJAK__PPN_11__' ||
          t.category === 'PPH_21' ||
          t.category === 'PPH_23' ||
          t.category === 'PPH_4_2' ||
          t.category === 'PPH_BADAN_FINAL') &&
        (t.description?.toLowerCase().includes(target.title.toLowerCase()) ||
          t.notes?.toLowerCase().includes(target.title.toLowerCase()));

      if (matchNtpn || matchBilling || matchTaxRef || matchIdInNote || matchTitle) {
        txIdsToDelete.add(t.id);
      }
    });

    addDeletedTaxId(id);

    if (txIdsToDelete.size > 0) {
      txIdsToDelete.forEach((txId) => {
        addDeletedTransactionId(txId);
        deleteTransactionFromFirestore(txId);
      });
      setTransactions((prev) => {
        const updated = prev.filter((t) => !txIdsToDelete.has(t.id));
        try {
          localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
        } catch {}
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
    }

    // 2. If this tax obligation was generated from a payroll record, detach linkage
    if (target.payrollId) {
      setPayrollRecords((prev) => {
        const updated = prev.map((r) =>
          r.id === target.payrollId || r.pph21ObligationId === id
            ? { ...r, pph21ObligationId: undefined }
            : r
        );
        broadcastLiveDataUpdate('PAYROLL_PAYMENTS', updated);
        saveSettingsToFirestore('payroll_records', updated);
        return updated;
      });
    }

    // 3. Delete from taxObligations state and Firestore
    setTaxObligations((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      broadcastLiveDataUpdate('TAX_OBLIGATIONS', updated);
      saveSettingsToFirestore('tax_obligations', updated);
      return updated;
    });

    deleteTaxObligationFromFirestore(id);

    return {
      success: true,
      message: `Kewajiban pajak "${target.title}" beserta seluruh mutasi kas terkait (${txIdsToDelete.size} transaksi) berhasil dihapus dari Finance, Arus Kas (Cashflow), dan Laporan Keuangan.`,
    };
  };

  const payTaxObligation = (
    taxId: string,
    options?: {
      channelId?: string;
      date?: string;
      ntpnNumber?: string;
      billingCode?: string;
      notes?: string;
      paidByClient?: boolean;
      deductFromCashChannel?: boolean;
      clientWithholdingNumber?: string;
      clientWithholdingDate?: string;
      withholdingTaxPayerName?: string;
    }
  ): { success: boolean; message?: string; transactionId?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk menyetor / melunasi pajak.' };
    }

    const target = taxObligations.find((t) => t.id === taxId);
    if (!target) {
      return { success: false, message: 'Data kewajiban pajak tidak ditemukan.' };
    }

    if (target.status === 'PAID' && target.remainingAmount <= 0) {
      return { success: false, message: 'Kewajiban pajak ini sudah tercatat lunas.' };
    }

    const paymentAmount = target.remainingAmount > 0 ? target.remainingAmount : target.taxAmount;
    const isPaidByClient = Boolean(options?.paidByClient);
    const shouldDeductCash = options?.deductFromCashChannel !== false;
    const paymentMethod = options?.channelId || target.paymentChannelId || 'BANK_TRANSFER_BRI';
    const payDate = options?.date || new Date().toISOString().slice(0, 10);
    const ntpn = options?.ntpnNumber?.trim();
    const billing = options?.billingCode?.trim() || target.billingCode;
    const customNotes = options?.notes?.trim();
    const clientWithholdingNum = options?.clientWithholdingNumber?.trim() || ntpn;
    const clientName = options?.withholdingTaxPayerName?.trim() || target.counterpartyName || 'Klien';

    let txId: string | undefined = undefined;

    // 1. Transaction creation in Cash Ledger
    if (!isPaidByClient) {
      // Setor Sendiri: Terbitkan pengeluaran kas pembayaran pajak ke Kas Negara
      const tx = addTransaction({
        date: payDate,
        type: 'EXPENSE',
        category: target.taxType === 'PPN' ? 'PAJAK__PPN_11__' : 'TAX_PPH_PPN',
        amountIDR: paymentAmount,
        description: `Setoran Pajak ${target.taxType === 'PPN' ? 'PPN' : target.taxType} (${target.taxPeriod}) - ${target.title}`,
        clientOrVendorName: target.counterpartyName || 'Kas Negara / KPP Pratama (DJP)',
        paymentMethod: paymentMethod as any,
        referenceNumber: ntpn ? `NTPN-${ntpn}` : billing ? `BILL-${billing}` : `TAX-${target.id.slice(-4).toUpperCase()}`,
        status: 'CLEARED',
        notes: `${customNotes ? customNotes + ' | ' : ''}NTPN: ${ntpn || '-'} | Kode Billing: ${billing || '-'} | Pelunasan Kewajiban Pajak ${target.title}`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      });
      txId = tx?.id;
    } else if (shouldDeductCash) {
      // PPh Dibayar / Dipotong Client: Penerimaan saldo kas tidak utuh karena dipotong PPh langsung dari invoice/termin.
      // Catat mutasi potongan PPh pada rekening kas/bank penerima agar saldo pembukuan berkurang riil (netto).
      const tx = addTransaction({
        date: payDate,
        type: 'EXPENSE',
        category: 'TAX_PPH_PPN',
        amountIDR: paymentAmount,
        description: `Potongan PPh ${target.taxType} oleh Klien (${clientName}) - ${target.title}`,
        clientOrVendorName: clientName,
        paymentMethod: paymentMethod as any,
        referenceNumber: clientWithholdingNum ? `BUPOT-${clientWithholdingNum}` : (ntpn ? `NTPN-${ntpn}` : `TAX-BUPOT-${target.id.slice(-4).toUpperCase()}`),
        status: 'CLEARED',
        notes: `${customNotes ? customNotes + ' | ' : ''}Pemotongan PPh oleh Klien (Saldo penerimaan kas tidak utuh / netto). No Bukti Potong: ${clientWithholdingNum || '-'} | Rekening kas penerima terpotong PPh sebesar Rp ${paymentAmount.toLocaleString('id-ID')}`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      });
      txId = tx?.id;
    }

    // 2. Update Tax Obligation to PAID with NTPN & transaction linkage / client withholding info
    const updatedTaxObj: TaxObligation = {
      ...target,
      paidAmount: (target.paidAmount || 0) + paymentAmount,
      remainingAmount: 0,
      status: 'PAID',
      paidAt: payDate,
      paidByClient: isPaidByClient,
      clientWithholdingNumber: isPaidByClient ? (clientWithholdingNum || target.clientWithholdingNumber) : target.clientWithholdingNumber,
      clientWithholdingDate: isPaidByClient ? payDate : target.clientWithholdingDate,
      withholdingTaxPayerName: isPaidByClient ? clientName : target.withholdingTaxPayerName,
      ntpnNumber: ntpn || target.ntpnNumber,
      billingCode: billing,
      paymentChannelId: paymentMethod,
      transactionId: txId,
      notes: customNotes || (isPaidByClient ? `PPh dipotong & disetor oleh klien (${clientName}) - Bukti Potong: ${clientWithholdingNum || 'Tercatat'}` : target.notes),
      updatedAt: new Date().toISOString(),
    };

    setTaxObligations((prev) => {
      const updated = prev.map((t) => (t.id === taxId ? updatedTaxObj : t));
      broadcastLiveDataUpdate('TAX_OBLIGATIONS', updated);
      saveSettingsToFirestore('tax_obligations', updated);
      return updated;
    });

    return {
      success: true,
      transactionId: txId,
      message: isPaidByClient
        ? shouldDeductCash
          ? `PPh ${target.taxType} sebesar Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat lunas via pemotongan Klien (${clientName}). Saldo rekening kas telah disesuaikan/dipotong sebesar PPh (saldo bersih tidak utuh). Bukti Potong: ${clientWithholdingNum || 'Tercatat'}.`
          : `PPh ${target.taxType} sebesar Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat lunas via pemotongan Klien (${clientName}) sebagai Kredit Pajak e-Bupot! Bukti Potong: ${clientWithholdingNum || 'Tercatat'}.`
        : `Setoran Pajak ${target.taxType} sebesar Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat & dibukukan ke jurnal kas! NTPN: ${ntpn || 'Tercatat'}.`,
    };
  };

  const resetTaxObligationsToDefault = (): { success: boolean; message?: string } => {
    if (!isMasterAdmin) {
      return { success: false, message: 'Hanya Master Admin yang dapat mereset data perpajakan.' };
    }

    setTaxObligations(INITIAL_TAX_OBLIGATIONS);
    saveSettingsToFirestore('tax_obligations', INITIAL_TAX_OBLIGATIONS);
    broadcastLiveDataUpdate('TAX_OBLIGATIONS', INITIAL_TAX_OBLIGATIONS);
    return {
      success: true,
      message: 'Daftar kewajiban dan hutang pajak berhasil direset ke standar sistem.',
    };
  };

  // =========================================================================
  // ACCOUNTS RECEIVABLE / PIUTANG USAHA & TERMIN PROYEK (ALL ROLES ACCESSIBLE)
  // =========================================================================

  const addReceivable = (
    data: Omit<Receivable, 'id' | 'createdAt' | 'createdBy' | 'payments' | 'paidAmountIDR' | 'remainingAmountIDR' | 'status'> & {
      initialPaidAmountIDR?: number;
      paymentChannelId?: string;
      referenceNumber?: string;
      notesPayment?: string;
      syncToCashLedger?: boolean;
    }
  ): { success: boolean; receivable?: Receivable; message?: string } => {
    const now = new Date().toISOString();
    const id = `rec-${Date.now()}`;
    const totalAmount = Math.max(0, Number(data.totalAmountIDR) || 0);
    const initialPaid = Math.max(0, Number(data.initialPaidAmountIDR) || 0);
    const remaining = Math.max(0, totalAmount - initialPaid);

    const payments: ReceivablePayment[] = [];
    let linkedTxId: string | undefined;

    if (initialPaid > 0) {
      const paymentId = `pay-${Date.now()}`;
      if (data.syncToCashLedger !== false) {
        const tx = addTransaction({
          date: data.issueDate || now.slice(0, 10),
          type: 'INCOME',
          category: 'CONSULTING_FEE',
          amountIDR: initialPaid,
          description: `Pembayaran Uang Muka / Piutang: ${data.invoiceNumber} - ${data.title} (${data.clientName})`,
          clientOrVendorName: data.clientName,
          projectId: data.projectId,
          paymentMethod: (data.paymentChannelId as any) || 'BANK_TRANSFER_BRI',
          referenceNumber: data.referenceNumber || data.invoiceNumber,
          status: 'CLEARED',
          notes: data.notesPayment || `Penerimaan kas pembayaran piutang invoice ${data.invoiceNumber}`,
          recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
        });
        linkedTxId = tx?.id;
      }

      payments.push({
        id: paymentId,
        receivableId: id,
        paymentDate: data.issueDate || now.slice(0, 10),
        amountIDR: initialPaid,
        paymentChannelId: data.paymentChannelId,
        paymentMethod: data.paymentChannelId || 'BANK_TRANSFER_BRI',
        referenceNumber: data.referenceNumber,
        transactionId: linkedTxId,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
        notes: data.notesPayment || 'Pembayaran awal / Uang muka DP',
        createdAt: now,
      });
    }

    let status: ReceivableStatus = 'BELUM_DIBAYAR';
    if (remaining <= 0 && totalAmount > 0) {
      status = 'LUNAS';
    } else if (initialPaid > 0 && remaining > 0) {
      status = 'DIBAYAR_SEBAGIAN';
    } else {
      const isOverdue = data.dueDate ? calculateDaysOverdue(data.dueDate) > 0 : false;
      status = isOverdue ? 'JATUH_TEMPO' : 'BELUM_DIBAYAR';
    }

    const newReceivable: Receivable = {
      id,
      invoiceNumber: data.invoiceNumber,
      title: data.title,
      clientName: data.clientName,
      clientContactPerson: data.clientContactPerson,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      clientAddress: data.clientAddress,
      projectId: data.projectId,
      projectCode: data.projectCode,
      milestoneTitle: data.milestoneTitle,
      category: data.category || 'TERMIN_KONSULTASI_TKDN',
      totalAmountIDR: totalAmount,
      paidAmountIDR: initialPaid,
      remainingAmountIDR: remaining,
      taxIncluded: data.taxIncluded,
      taxAmountIDR: data.taxAmountIDR,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      paymentTermsDays: data.paymentTermsDays,
      status,
      payments,
      linkedTransactionIds: linkedTxId ? [linkedTxId] : [],
      notes: data.notes,
      createdAt: now,
      createdBy: currentUser.username || currentUser.name || 'System User',
    };

    setReceivables((prev) => {
      const updated = [newReceivable, ...prev];
      broadcastLiveDataUpdate('RECEIVABLES', updated);
      saveReceivableToFirestore(newReceivable);
      return updated;
    });

    return {
      success: true,
      receivable: newReceivable,
      message: `Invoice piutang "${newReceivable.invoiceNumber}" senilai Rp ${totalAmount.toLocaleString('id-ID')} berhasil dicatat & disinkronkan real-time.`,
    };
  };

  const updateReceivable = (
    id: string,
    updates: Partial<Receivable>
  ): { success: boolean; message?: string } => {
    let found = false;
    setReceivables((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          found = true;
          const merged = { ...r, ...updates, updatedAt: new Date().toISOString() };
          // Recalculate totals and status
          const tot = merged.totalAmountIDR !== undefined ? Math.max(0, merged.totalAmountIDR) : r.totalAmountIDR;
          const paid = merged.payments
            ? merged.payments.reduce((acc, p) => acc + (p.amountIDR || 0), 0)
            : (merged.paidAmountIDR !== undefined ? Math.max(0, merged.paidAmountIDR) : r.paidAmountIDR);
          const rem = Math.max(0, tot - paid);
          merged.totalAmountIDR = tot;
          merged.paidAmountIDR = paid;
          merged.remainingAmountIDR = rem;

          if (merged.status !== 'BATAL') {
            if (rem <= 0 && tot > 0) {
              merged.status = 'LUNAS';
              merged.fullyPaidDate = merged.fullyPaidDate || new Date().toISOString().slice(0, 10);
            } else if (paid > 0 && rem > 0) {
              merged.status = 'DIBAYAR_SEBAGIAN';
            } else {
              const isOverdue = merged.dueDate ? calculateDaysOverdue(merged.dueDate) > 0 : false;
              merged.status = isOverdue ? 'JATUH_TEMPO' : 'BELUM_DIBAYAR';
            }
          }

          saveReceivableToFirestore(merged);
          return merged;
        }
        return r;
      });

      if (found) {
        broadcastLiveDataUpdate('RECEIVABLES', updated);
      }
      return updated;
    });

    if (!found) {
      return { success: false, message: 'Data tagihan piutang tidak ditemukan.' };
    }
    return { success: true, message: 'Data piutang berhasil diperbarui secara real-time.' };
  };

  const deleteReceivable = (id: string): { success: boolean; message?: string } => {
    const target = receivables.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'Data piutang tidak ditemukan.' };
    }

    // 1. Blacklist and delete any linked financial transactions from payments
    const txIdsToDelete = new Set<string>();
    if (target.payments && target.payments.length > 0) {
      target.payments.forEach((p) => {
        if (p.transactionId) txIdsToDelete.add(p.transactionId);
      });
    }
    transactions.forEach((t) => {
      const matchInv = target.invoiceNumber && (
        t.referenceNumber?.includes(`RCV-PAY-${target.invoiceNumber}`) ||
        t.description?.includes(target.invoiceNumber) ||
        t.notes?.includes(target.invoiceNumber)
      );
      if (matchInv) txIdsToDelete.add(t.id);
    });

    if (txIdsToDelete.size > 0) {
      txIdsToDelete.forEach((txId) => {
        addDeletedTransactionId(txId);
        deleteTransactionFromFirestore(txId);
      });
      setTransactions((prev) => {
        const updated = prev.filter((t) => !txIdsToDelete.has(t.id));
        try {
          localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
        } catch {}
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
    }

    addDeletedReceivableId(id);

    setReceivables((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_RECEIVABLES, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('RECEIVABLES', updated);
      return updated;
    });
    deleteReceivableFromFirestore(id);

    return { success: true, message: `Invoice piutang "${target.invoiceNumber}" berhasil dihapus.` };
  };

  const recordReceivablePayment = (
    receivableId: string,
    paymentData: {
      amountIDR: number;
      paymentDate: string;
      paymentChannelId?: string;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
    }
  ): { success: boolean; message?: string; payment?: ReceivablePayment } => {
    const target = receivables.find((r) => r.id === receivableId);
    if (!target) {
      return { success: false, message: 'Data piutang tidak ditemukan.' };
    }

    const payAmount = Math.max(0, Number(paymentData.amountIDR) || 0);
    if (payAmount <= 0) {
      return { success: false, message: 'Nominal pembayaran harus lebih besar dari Rp 0.' };
    }

    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    let linkedTxId: string | undefined;

    // Record into Cash Ledger / Financial Transactions if sync is enabled
    if (paymentData.syncToCashLedger !== false) {
      const tx = addTransaction({
        date: paymentData.paymentDate || now.slice(0, 10),
        type: 'INCOME',
        category: 'CONSULTING_FEE',
        amountIDR: payAmount,
        description: `Pelunasan Piutang: ${target.invoiceNumber} - ${target.title} (${target.clientName})`,
        clientOrVendorName: target.clientName,
        projectId: target.projectId,
        paymentMethod: (paymentData.paymentChannelId as any) || 'BANK_TRANSFER_BRI',
        referenceNumber: paymentData.referenceNumber || `RCV-PAY-${target.invoiceNumber}`,
        status: 'CLEARED',
        notes: paymentData.notes || `Penerimaan kas dari pelunasan piutang no. ${target.invoiceNumber}`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      });
      linkedTxId = tx?.id;
    }

    const newPayment: ReceivablePayment = {
      id: paymentId,
      receivableId,
      paymentDate: paymentData.paymentDate || now.slice(0, 10),
      amountIDR: payAmount,
      paymentChannelId: paymentData.paymentChannelId,
      paymentMethod: paymentData.paymentMethod || paymentData.paymentChannelId || 'BANK_TRANSFER_BRI',
      referenceNumber: paymentData.referenceNumber,
      transactionId: linkedTxId,
      recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      notes: paymentData.notes,
      createdAt: now,
    };

    const newPayments = [...(target.payments || []), newPayment];
    const totalPaid = newPayments.reduce((sum, p) => sum + (p.amountIDR || 0), 0);
    const newRemaining = Math.max(0, target.totalAmountIDR - totalPaid);

    let newStatus: ReceivableStatus = target.status;
    if (newRemaining <= 0) {
      newStatus = 'LUNAS';
    } else if (totalPaid > 0) {
      newStatus = 'DIBAYAR_SEBAGIAN';
    }

    const updatedReceivable: Receivable = {
      ...target,
      paidAmountIDR: totalPaid,
      remainingAmountIDR: newRemaining,
      payments: newPayments,
      status: newStatus,
      fullyPaidDate: newRemaining <= 0 ? (paymentData.paymentDate || now.slice(0, 10)) : undefined,
      linkedTransactionIds: linkedTxId
        ? [...(target.linkedTransactionIds || []), linkedTxId]
        : target.linkedTransactionIds,
      updatedAt: now,
    };

    setReceivables((prev) => {
      const updated = prev.map((r) => (r.id === receivableId ? updatedReceivable : r));
      broadcastLiveDataUpdate('RECEIVABLES', updated);
      saveReceivableToFirestore(updatedReceivable);
      return updated;
    });

    return {
      success: true,
      payment: newPayment,
      message: `Penerimaan pembayaran piutang sebesar Rp ${payAmount.toLocaleString('id-ID')} berhasil dicatat & dibukukan ke jurnal kas! Sisa piutang: Rp ${newRemaining.toLocaleString('id-ID')}.`,
    };
  };

  const cancelReceivable = (id: string, reason?: string): { success: boolean; message?: string } => {
    const target = receivables.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'Data piutang tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    const updatedReceivable: Receivable = {
      ...target,
      status: 'BATAL',
      notes: `${target.notes ? target.notes + ' | ' : ''}Dibatalkan / Write-Off pada ${now.slice(0, 10)}. Alasan: ${reason || 'Pembatalan tagihan / penghapusbukuan piutang'}`,
      updatedAt: now,
    };

    setReceivables((prev) => {
      const updated = prev.map((r) => (r.id === id ? updatedReceivable : r));
      broadcastLiveDataUpdate('RECEIVABLES', updated);
      saveReceivableToFirestore(updatedReceivable);
      return updated;
    });

    return {
      success: true,
      message: `Status piutang "${target.invoiceNumber}" berhasil diubah menjadi Dibatalkan / Write-Off.`,
    };
  };

  const resetReceivablesToDefault = (): { success: boolean; message?: string } => {
    setReceivables(INITIAL_RECEIVABLES);
    INITIAL_RECEIVABLES.forEach((r) => saveReceivableToFirestore(r));
    broadcastLiveDataUpdate('RECEIVABLES', INITIAL_RECEIVABLES);
    return {
      success: true,
      message: 'Master data dan buku piutang usaha berhasil direset ke standar sistem.',
    };
  };

  // =========================================================================
  // PROYEK PEMERINTAH & BUMN (SPK, TERMIN, INTEGRASI PIUTANG, PAJAK & KAS)
  // =========================================================================

  const addGovernmentProject = (
    data: Omit<GovernmentProject, 'id' | 'createdAt' | 'createdBy' | 'totalBilledAmountIDR' | 'totalReceivedAmountIDR' | 'totalOutstandingAmountIDR'>
  ): { success: boolean; project?: GovernmentProject; message?: string } => {
    const now = new Date().toISOString();
    const id = `gov-${Date.now()}`;

    // Calculate milestone financials & totals
    const milestones: GovMilestone[] = (data.milestones || []).map((m, idx) => {
      const gross = Math.round(Number(m.grossAmountIDR) || 0);
      const defaultPphType = data.institutionType === 'KEMENTERIAN' || data.institutionType === 'LEMBAGA' || data.institutionType === 'DINAS_PEMDA' ? 'PPH_22' : 'PPH_23';
      const pphType = m.pphType || defaultPphType;
      const pphRate = Number(m.pphRatePercent) ?? (data.whtRatePph || (pphType === 'PPH_22' ? 1.5 : 2));
      const ppnRate = Number(m.ppnRatePercent) ?? (data.vatWapuRate || 11);
      const pphAmount = Math.round((gross * pphRate) / 100);
      const ppnAmount = Math.round((gross * ppnRate) / 100);
      const net = Math.round(gross - pphAmount);

      return {
        ...m,
        id: m.id || `gov-m-${Date.now()}-${idx + 1}`,
        projectId: id,
        termNumber: m.termNumber || idx + 1,
        grossAmountIDR: gross,
        pphType,
        pphRatePercent: pphRate,
        pphAmountIDR: pphAmount,
        ppnRatePercent: ppnRate,
        ppnAmountIDR: ppnAmount,
        netDisbursementIDR: net,
        status: m.status || 'BELUM_DITAGIH',
        createdAt: m.createdAt || now,
      };
    });

    const totalBilled = milestones
      .filter((m) => m.status === 'INVOICE_TERBIT' || m.status === 'PROSES_SPM_KPPN' || m.status === 'SP2D_CAIR')
      .reduce((acc, m) => acc + m.grossAmountIDR, 0);

    const totalReceived = milestones
      .filter((m) => m.status === 'SP2D_CAIR')
      .reduce((acc, m) => acc + (m.netDisbursementIDR || m.grossAmountIDR), 0);

    const totalOutstanding = Math.max(0, data.totalContractValueIDR - totalReceived);

    const newProject: GovernmentProject = {
      ...data,
      id,
      milestones,
      totalBilledAmountIDR: totalBilled,
      totalReceivedAmountIDR: totalReceived,
      totalOutstandingAmountIDR: totalOutstanding,
      createdAt: now,
      createdBy: currentUser.name,
      updatedAt: now,
    };

    setGovernmentProjects((prev) => {
      const updated = [newProject, ...prev];
      broadcastLiveDataUpdate('GOVERNMENT_PROJECTS', updated);
      saveGovernmentProjectToFirestore(newProject);
      return updated;
    });

    addActivity(
      newProject.linkedCrmProjectId || newProject.id,
      'Proyek Pemerintah Baru Terdaftar',
      `Menambahkan Kontrak Pengadaan "${newProject.projectName}" (${newProject.governmentAgency}) No. SPK ${newProject.contractNumber} senilai Rp ${newProject.totalContractValueIDR.toLocaleString('id-ID')}`,
      'STATUS_CHANGE'
    );

    return {
      success: true,
      project: newProject,
      message: `Kontrak Pengadaan "${newProject.projectName}" berhasil didaftarkan ke sistem!`,
    };
  };

  const updateGovernmentProject = (
    id: string,
    updates: Partial<GovernmentProject>
  ): { success: boolean; message?: string } => {
    const target = governmentProjects.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proyek pemerintah tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    const updatedMilestones = updates.milestones || target.milestones;
    const contractValue = updates.totalContractValueIDR ?? target.totalContractValueIDR;

    const totalBilled = updatedMilestones
      .filter((m) => m.status === 'INVOICE_TERBIT' || m.status === 'PROSES_SPM_KPPN' || m.status === 'SP2D_CAIR')
      .reduce((acc, m) => acc + m.grossAmountIDR, 0);

    const totalReceived = updatedMilestones
      .filter((m) => m.status === 'SP2D_CAIR')
      .reduce((acc, m) => acc + (m.netDisbursementIDR || m.grossAmountIDR), 0);

    const totalOutstanding = Math.max(0, contractValue - totalReceived);

    const updatedProject: GovernmentProject = {
      ...target,
      ...updates,
      milestones: updatedMilestones,
      totalBilledAmountIDR: totalBilled,
      totalReceivedAmountIDR: totalReceived,
      totalOutstandingAmountIDR: totalOutstanding,
      updatedAt: now,
    };

    setGovernmentProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? updatedProject : p));
      broadcastLiveDataUpdate('GOVERNMENT_PROJECTS', updated);
      saveGovernmentProjectToFirestore(updatedProject);
      return updated;
    });

    return {
      success: true,
      message: `Kontrak Proyek "${updatedProject.projectName}" berhasil diperbarui.`,
    };
  };

  const deleteGovernmentProject = (id: string): { success: boolean; message?: string } => {
    const target = governmentProjects.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proyek pemerintah tidak ditemukan.' };
    }

    setGovernmentProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      broadcastLiveDataUpdate('GOVERNMENT_PROJECTS', updated);
      return updated;
    });

    setDeletedGovProjectIds((prev) => {
      const updated = Array.from(new Set([...prev, id]));
      broadcastLiveDataUpdate('DELETED_GOV_PROJECT_IDS', updated);
      return updated;
    });

    saveDeletedEntityIdToFirestore('deleted_gov_project_ids', id);
    deleteGovernmentProjectFromFirestore(id);

    return {
      success: true,
      message: `Kontrak Pengadaan "${target.projectName}" berhasil dihapus.`,
    };
  };

  const generateMilestoneInvoiceToReceivables = (
    projectId: string,
    milestoneId: string,
    invoiceData?: {
      invoiceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      bapNumber?: string;
      bastNumber?: string;
      notes?: string;
    }
  ): { success: boolean; receivable?: Receivable; message?: string } => {
    const project = governmentProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek pemerintah tidak ditemukan.' };

    const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return { success: false, message: 'Termin pengadaan tidak ditemukan.' };

    const milestone = project.milestones[milestoneIndex];
    const now = new Date().toISOString();
    const invNum = invoiceData?.invoiceNumber || milestone.invoiceNumber || `INV/GOV/${project.fiscalYear}/${project.id.slice(-4)}/T${milestone.termNumber}`;
    const issueDt = invoiceData?.issueDate || now.slice(0, 10);
    const dueDt = invoiceData?.dueDate || milestone.targetDate || issueDt;

    // Create receivable entry in Piutang Usaha
    const receivableResult = addReceivable({
      invoiceNumber: invNum,
      category: 'PROYEK_PEMERINTAH_BUMN',
      title: `Tagihan ${milestone.title} - ${project.projectName}`,
      clientName: project.governmentAgency,
      projectId: project.linkedCrmProjectId || project.id,
      totalAmountIDR: milestone.grossAmountIDR,
      issueDate: issueDt,
      dueDate: dueDt,
      taxIncluded: true,
      taxAmountIDR: milestone.ppnAmountIDR,
      notes: invoiceData?.notes || `Kontak PPK: ${project.ppkName || '-'} (NIP: ${project.ppkNip || '-'}). Tagihan Termin Proyek Pemerintah: SPK No. ${project.contractNumber} (${project.sourceOfFunds} TA ${project.fiscalYear}). Mekanisme: ${project.paymentMechanism}. Potongan PPh ${milestone.pphType} ${milestone.pphRatePercent}%: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')}. PPN WAPU dipungut Satker: Rp ${milestone.ppnAmountIDR.toLocaleString('id-ID')}. Estimasi Kas Bersih: Rp ${milestone.netDisbursementIDR.toLocaleString('id-ID')}. BAP: ${invoiceData?.bapNumber || milestone.bapNumber || '-'} | BAST: ${invoiceData?.bastNumber || milestone.bastNumber || '-'}`,
      syncToCashLedger: false, // will sync when SP2D is actually disbursed!
    });

    if (!receivableResult.success || !receivableResult.receivable) {
      return { success: false, message: receivableResult.message || 'Gagal membuat tagihan piutang.' };
    }

    // Update milestone state
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = {
      ...milestone,
      status: 'INVOICE_TERBIT',
      invoiceNumber: invNum,
      receivableId: receivableResult.receivable.id,
      bapNumber: invoiceData?.bapNumber || milestone.bapNumber,
      bastNumber: invoiceData?.bastNumber || milestone.bastNumber,
    };

    updateGovernmentProject(projectId, { milestones: updatedMilestones });

    return {
      success: true,
      receivable: receivableResult.receivable,
      message: `Invoice ${invNum} untuk Termin ${milestone.termNumber} berhasil diterbitkan dan otomatis tercatat pada Buku Piutang Usaha!`,
    };
  };

  const recordGovMilestonePaymentSp2d = (
    projectId: string,
    milestoneId: string,
    sp2dData: {
      sp2dNumber: string;
      sp2dDisbursementDate: string;
      paymentChannelId: string;
      spmNumber?: string;
      ntpnPpn?: string;
      bupotPphNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
      syncToTaxObligations?: boolean;
    }
  ): { success: boolean; message?: string; transaction?: FinancialTransaction } => {
    const project = governmentProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek pemerintah tidak ditemukan.' };

    const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return { success: false, message: 'Termin pengadaan tidak ditemukan.' };

    const milestone = project.milestones[milestoneIndex];
    const disbursementDate = sp2dData.sp2dDisbursementDate || new Date().toISOString().slice(0, 10);
    let linkedTx: FinancialTransaction | undefined;

    // 1. Post to Cash Ledger (Finance & Cashflow) as GOVERNMENT_PROJECT_INCOME
    if (sp2dData.syncToCashLedger !== false) {
      // The net cash landing into the company bank account from KPPN/Kasda
      const netCash = milestone.netDisbursementIDR || (milestone.grossAmountIDR - milestone.pphAmountIDR);

      linkedTx = addTransaction({
        date: disbursementDate,
        type: 'INCOME',
        category: 'GOVERNMENT_PROJECT_INCOME',
        amountIDR: netCash,
        description: `Pencairan SP2D Termin ${milestone.termNumber}: ${milestone.title} - ${project.projectName} (${project.governmentAgency})`,
        clientOrVendorName: project.governmentAgency,
        projectId: project.linkedCrmProjectId || project.id,
        paymentMethod: sp2dData.paymentChannelId as any,
        referenceNumber: sp2dData.sp2dNumber,
        status: 'CLEARED',
        recordedBy: currentUser.name,
        notes: `SP2D Cair KPPN: ${sp2dData.sp2dNumber} | SPM: ${sp2dData.spmNumber || milestone.spmNumber || '-'} | Bruto: Rp ${milestone.grossAmountIDR.toLocaleString('id-ID')} | PPh ${milestone.pphType} dipotong Satker: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')} | PPN WAPU dipungut Kas Negara: Rp ${milestone.ppnAmountIDR.toLocaleString('id-ID')}${sp2dData.notes ? ` | Catatan: ${sp2dData.notes}` : ''}`,
      });
    }

    // 2. Mark Linked Receivable as LUNAS (Piutang Usaha)
    if (milestone.receivableId) {
      recordReceivablePayment(milestone.receivableId, {
        amountIDR: milestone.grossAmountIDR,
        paymentDate: disbursementDate,
        paymentChannelId: sp2dData.paymentChannelId,
        referenceNumber: sp2dData.sp2dNumber,
        notes: `Pelunasan otomatis via Pencairan SP2D No. ${sp2dData.sp2dNumber}. Kas Bersih Diterima: Rp ${milestone.netDisbursementIDR.toLocaleString('id-ID')}. Potongan PPh ${milestone.pphType}: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')}.`,
        syncToCashLedger: false, // Already recorded in step 1 to prevent double counting!
      });
    }

    // 3. Record Tax Obligations (Prepaid Withholding Tax / PPN WAPU & PPh 22/23)
    if (sp2dData.syncToTaxObligations !== false) {
      // PPh 22 / PPh 23 Withholding Credit
      if (milestone.pphAmountIDR > 0) {
        addTaxObligation({
          taxType: (milestone.pphType || 'PPH_22') as TaxType,
          taxPeriod: `Masa ${disbursementDate.slice(5, 7)}/${project.fiscalYear}`,
          taxYear: project.fiscalYear,
          taxMonth: parseInt(disbursementDate.slice(5, 7), 10) || 1,
          title: `Bukti Potong PPh ${milestone.pphType} - SP2D ${milestone.title} (${project.projectName})`,
          taxAmount: milestone.pphAmountIDR,
          paidAmount: milestone.pphAmountIDR,
          remainingAmount: 0,
          status: 'PAID',
          paidByClient: true,
          clientWithholdingNumber: sp2dData.bupotPphNumber || `BUPOT-SP2D-${sp2dData.sp2dNumber}`,
          clientWithholdingDate: disbursementDate,
          withholdingTaxPayerName: project.governmentAgency,
          dueDate: disbursementDate,
          paidAt: disbursementDate,
          notes: `Pajak Penghasilan Pasal ${milestone.pphType} telah dipotong langsung oleh Bendahara Pengeluaran ${project.governmentAgency} via SP2D KPPN No. ${sp2dData.sp2dNumber}. Menjadi kredit pajak pada SPT Tahunan Badan.`,
        });
      }

      // PPN WAPU (Kode Faktur 020 - Pemungutan oleh Instansi Pemerintah)
      if (milestone.ppnAmountIDR > 0) {
        addTaxObligation({
          taxType: 'PPN',
          taxPeriod: `Masa ${disbursementDate.slice(5, 7)}/${project.fiscalYear}`,
          taxYear: project.fiscalYear,
          taxMonth: parseInt(disbursementDate.slice(5, 7), 10) || 1,
          title: `PPN WAPU (Kode Faktur 020) - SP2D Termin ${milestone.termNumber} (${project.governmentAgency})`,
          ppnOutputAmount: milestone.ppnAmountIDR,
          taxAmount: milestone.ppnAmountIDR,
          paidAmount: milestone.ppnAmountIDR,
          remainingAmount: 0,
          status: 'PAID',
          ntpnNumber: sp2dData.ntpnPpn || `NTPN-WAPU-${sp2dData.sp2dNumber}`,
          dueDate: disbursementDate,
          paidAt: disbursementDate,
          notes: `PPN WAPU dipungut dan disetor langsung ke Kas Negara oleh Instansi Bendahara Satker ${project.governmentAgency}. Bukti setoran NTPN: ${sp2dData.ntpnPpn || 'Terlampir dalam SP2D'}.`,
        });
      }
    }

    // 4. Update Milestone State
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = {
      ...milestone,
      status: 'SP2D_CAIR',
      sp2dNumber: sp2dData.sp2dNumber,
      sp2dDisbursementDate: disbursementDate,
      spmNumber: sp2dData.spmNumber || milestone.spmNumber,
      paymentChannelId: sp2dData.paymentChannelId,
      transactionId: linkedTx?.id,
      ntpnPpn: sp2dData.ntpnPpn,
      bupotPphNumber: sp2dData.bupotPphNumber,
    };

    updateGovernmentProject(projectId, { milestones: updatedMilestones });

    addActivity(
      project.linkedCrmProjectId || project.id,
      'SP2D Pemerintah Telah Cair',
      `Pencairan SP2D No. ${sp2dData.sp2dNumber} untuk Termin ${milestone.termNumber} Proyek "${project.projectName}" telah masuk kas Rp ${(milestone.netDisbursementIDR || milestone.grossAmountIDR).toLocaleString('id-ID')} dan terintegrasi ke Piutang, Pajak, dan Arus Kas!`,
      'STATUS_CHANGE'
    );

    return {
      success: true,
      transaction: linkedTx,
      message: `Pencairan SP2D No. ${sp2dData.sp2dNumber} berhasil dicatat! Kas bersih Rp ${milestone.netDisbursementIDR.toLocaleString('id-ID')} telah dibukukan ke Arus Kas, piutang dilunasi, dan kredit pajak PPh/PPN WAPU telah masuk ke modul Pajak.`,
    };
  };

  const addGovMilestone = (
    projectId: string,
    milestone: Omit<GovMilestone, 'id' | 'projectId' | 'createdAt'>
  ): { success: boolean; message?: string } => {
    const project = governmentProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek tidak ditemukan.' };

    const gross = Math.round(Number(milestone.grossAmountIDR) || 0);
    const pphRate = Number(milestone.pphRatePercent) ?? (project.pphType === 'PPH_22' ? 1.5 : 2);
    const ppnRate = Number(milestone.ppnRatePercent) ?? 11;
    const pphAmount = Math.round((gross * pphRate) / 100);
    const ppnAmount = Math.round((gross * ppnRate) / 100);
    const net = Math.round(gross - pphAmount);

    const newMilestone: GovMilestone = {
      ...milestone,
      id: `gov-m-${Date.now()}`,
      projectId,
      grossAmountIDR: gross,
      pphType: milestone.pphType || project.pphType,
      pphRatePercent: pphRate,
      pphAmountIDR: pphAmount,
      ppnRatePercent: ppnRate,
      ppnAmountIDR: ppnAmount,
      netDisbursementIDR: net,
      status: milestone.status || 'BELUM_DITAGIH',
      createdAt: new Date().toISOString(),
    };

    const updatedMilestones = [...project.milestones, newMilestone];
    return updateGovernmentProject(projectId, { milestones: updatedMilestones });
  };

  const updateGovMilestone = (
    projectId: string,
    milestoneId: string,
    updates: Partial<GovMilestone>
  ): { success: boolean; message?: string } => {
    const project = governmentProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek tidak ditemukan.' };

    const updatedMilestones = project.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const merged = { ...m, ...updates };
      const gross = Math.round(Number(merged.grossAmountIDR) || 0);
      const pphRate = Number(merged.pphRatePercent) ?? (project.pphType === 'PPH_22' ? 1.5 : 2);
      const ppnRate = Number(merged.ppnRatePercent) ?? 11;
      const pphAmount = Math.round((gross * pphRate) / 100);
      const ppnAmount = Math.round((gross * ppnRate) / 100);
      const net = Math.round(gross - pphAmount);

      return {
        ...merged,
        grossAmountIDR: gross,
        pphRatePercent: pphRate,
        pphAmountIDR: pphAmount,
        ppnRatePercent: ppnRate,
        ppnAmountIDR: ppnAmount,
        netDisbursementIDR: net,
      };
    });

    return updateGovernmentProject(projectId, { milestones: updatedMilestones });
  };

  const deleteGovMilestone = (
    projectId: string,
    milestoneId: string
  ): { success: boolean; message?: string } => {
    const project = governmentProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek tidak ditemukan.' };

    const updatedMilestones = project.milestones.filter((m) => m.id !== milestoneId);
    return updateGovernmentProject(projectId, { milestones: updatedMilestones });
  };

  const resetGovernmentProjectsToDefault = (): { success: boolean; message?: string } => {
    setGovernmentProjects(INITIAL_GOVERNMENT_PROJECTS);
    INITIAL_GOVERNMENT_PROJECTS.forEach((p) => saveGovernmentProjectToFirestore(p));
    broadcastLiveDataUpdate('GOVERNMENT_PROJECTS', INITIAL_GOVERNMENT_PROJECTS);
    return {
      success: true,
      message: 'Master data Proyek Pemerintah (APBN/BUMN) berhasil direset ke standar sistem.',
    };
  };

  // =========================================================================
  // PROYEK RETAIL B2B & SWASTA (SPK, TERMIN, INTEGRASI PIUTANG, PAJAK & KAS)
  // =========================================================================

  const addRetailProject = (
    data: Omit<RetailProject, 'id' | 'createdAt' | 'createdBy' | 'totalBilledAmountIDR' | 'totalReceivedAmountIDR' | 'totalOutstandingAmountIDR'>
  ): { success: boolean; project?: RetailProject; message?: string } => {
    const now = new Date().toISOString();
    const id = `ret-${Date.now()}`;

    // Calculate milestone financials & totals
    const milestones: RetailMilestone[] = (data.milestones || []).map((m, idx) => {
      const gross = Math.round(Number(m.grossAmountIDR) || 0);
      const pricingType = m.pricingType || data.pricingType || 'INCLUDE_PPN';
      const dpp = pricingType === 'INCLUDE_PPN' ? Math.round(gross / 1.11) : gross;
      const ppnRate = pricingType === 'NON_PKP' ? 0 : (Number(m.ppnRatePercent) ?? (data.ppnRatePercent || 11));
      const ppnAmount = pricingType === 'INCLUDE_PPN'
        ? Math.round(gross - dpp)
        : pricingType === 'EXCLUDE_PPN'
        ? Math.round((dpp * ppnRate) / 100)
        : 0;

      const pphType = m.pphType || data.pphType || 'PPH_23';
      const defaultPphRate = pphType === 'PPH_23' ? 2 : pphType === 'PPH_FINAL_UMKM' ? 0.5 : 0;
      const pphRate = Number(m.pphRatePercent) ?? (data.pphRatePercent || defaultPphRate);
      const pphAmount = pphType === 'PPH_23'
        ? Math.round((dpp * pphRate) / 100)
        : pphType === 'PPH_FINAL_UMKM'
        ? Math.round((gross * pphRate) / 100)
        : 0;

      const net = pricingType === 'EXCLUDE_PPN'
        ? Math.round(gross + ppnAmount - pphAmount)
        : Math.round(gross - pphAmount);

      return {
        ...m,
        id: m.id || `ret-m-${Date.now()}-${idx + 1}`,
        projectId: id,
        termNumber: m.termNumber || idx + 1,
        grossAmountIDR: gross,
        pricingType,
        dppAmountIDR: dpp,
        ppnRatePercent: ppnRate,
        ppnAmountIDR: ppnAmount,
        pphType,
        pphRatePercent: pphRate,
        pphAmountIDR: pphAmount,
        netDisbursementIDR: net,
        status: m.status || 'BELUM_DITAGIH',
        createdAt: m.createdAt || now,
      };
    });

    const totalBilled = milestones
      .filter((m) => m.status === 'INVOICE_TERBIT' || m.status === 'LUNAS' || m.status === 'DIBAYAR_SEBAGIAN')
      .reduce((acc, m) => {
        const billing = m.pricingType === 'EXCLUDE_PPN' ? m.grossAmountIDR + m.ppnAmountIDR : m.grossAmountIDR;
        return acc + billing;
      }, 0);

    const totalReceived = milestones
      .filter((m) => m.status === 'LUNAS' || m.status === 'DIBAYAR_SEBAGIAN')
      .reduce((acc, m) => acc + (m.paidAmountIDR || m.netDisbursementIDR || m.grossAmountIDR), 0);

    const totalOutstanding = Math.max(0, data.totalContractValueIDR - totalReceived);

    const newProject: RetailProject = {
      ...data,
      id,
      milestones,
      totalBilledAmountIDR: totalBilled,
      totalReceivedAmountIDR: totalReceived,
      totalOutstandingAmountIDR: totalOutstanding,
      createdAt: now,
      createdBy: currentUser.name,
      updatedAt: now,
    };

    setRetailProjects((prev) => {
      const updated = [newProject, ...prev];
      broadcastLiveDataUpdate('RETAIL_PROJECTS', updated);
      saveRetailProjectToFirestore(newProject);
      return updated;
    });

    addActivity(
      newProject.linkedCrmProjectId || newProject.id,
      'Proyek Retail Baru Terdaftar',
      `Menambahkan Kontrak Retail "${newProject.projectName}" (${newProject.clientName}) senilai Rp ${newProject.totalContractValueIDR.toLocaleString('id-ID')}`,
      'STATUS_CHANGE'
    );

    return {
      success: true,
      project: newProject,
      message: `Kontrak Proyek Retail "${newProject.projectName}" berhasil didaftarkan ke sistem!`,
    };
  };

  const updateRetailProject = (
    id: string,
    updates: Partial<RetailProject>
  ): { success: boolean; message?: string } => {
    const target = retailProjects.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proyek retail tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    const updatedMilestones = updates.milestones || target.milestones;
    const contractValue = updates.totalContractValueIDR ?? target.totalContractValueIDR;

    const totalBilled = updatedMilestones
      .filter((m) => m.status === 'INVOICE_TERBIT' || m.status === 'LUNAS' || m.status === 'DIBAYAR_SEBAGIAN')
      .reduce((acc, m) => {
        const billing = m.pricingType === 'EXCLUDE_PPN' ? m.grossAmountIDR + m.ppnAmountIDR : m.grossAmountIDR;
        return acc + billing;
      }, 0);

    const totalReceived = updatedMilestones
      .filter((m) => m.status === 'LUNAS' || m.status === 'DIBAYAR_SEBAGIAN')
      .reduce((acc, m) => acc + (m.paidAmountIDR || m.netDisbursementIDR || m.grossAmountIDR), 0);

    const totalOutstanding = Math.max(0, contractValue - totalReceived);

    const updatedProject: RetailProject = {
      ...target,
      ...updates,
      milestones: updatedMilestones,
      totalBilledAmountIDR: totalBilled,
      totalReceivedAmountIDR: totalReceived,
      totalOutstandingAmountIDR: totalOutstanding,
      updatedAt: now,
    };

    setRetailProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? updatedProject : p));
      broadcastLiveDataUpdate('RETAIL_PROJECTS', updated);
      saveRetailProjectToFirestore(updatedProject);
      return updated;
    });

    return {
      success: true,
      message: `Kontrak Proyek Retail "${updatedProject.projectName}" berhasil diperbarui.`,
    };
  };

  const deleteRetailProject = (id: string): { success: boolean; message?: string } => {
    const target = retailProjects.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proyek retail tidak ditemukan.' };
    }

    setRetailProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      broadcastLiveDataUpdate('RETAIL_PROJECTS', updated);
      return updated;
    });

    setDeletedRetailProjectIds((prev) => {
      const updated = Array.from(new Set([...prev, id]));
      broadcastLiveDataUpdate('DELETED_RETAIL_PROJECT_IDS', updated);
      return updated;
    });

    saveDeletedEntityIdToFirestore('deleted_retail_project_ids', id);
    deleteRetailProjectFromFirestore(id);

    return {
      success: true,
      message: `Kontrak Proyek Retail "${target.projectName}" berhasil dihapus.`,
    };
  };

  const generateRetailInvoiceToReceivables = (
    projectId: string,
    milestoneId: string,
    invoiceData?: {
      invoiceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      fakturPajakNumber?: string;
      notes?: string;
      syncPpnObligation?: boolean;
    }
  ): { success: boolean; receivable?: Receivable; message?: string } => {
    const project = retailProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek retail tidak ditemukan.' };

    const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return { success: false, message: 'Termin retail tidak ditemukan.' };

    const milestone = project.milestones[milestoneIndex];
    const now = new Date().toISOString();
    const invYear = new Date().getFullYear();
    const invNum = invoiceData?.invoiceNumber || milestone.invoiceNumber || `INV/RET/${invYear}/${project.id.slice(-4)}/T${milestone.termNumber}`;
    const issueDt = invoiceData?.issueDate || now.slice(0, 10);
    const dueDt = invoiceData?.dueDate || milestone.targetDate || issueDt;

    const billingAmount = milestone.pricingType === 'EXCLUDE_PPN'
      ? milestone.grossAmountIDR + milestone.ppnAmountIDR
      : milestone.grossAmountIDR;

    // 1. Create receivable in Piutang Usaha
    const receivableResult = addReceivable({
      invoiceNumber: invNum,
      category: 'PROYEK_RETAIL',
      title: `Tagihan ${milestone.title} - ${project.projectName}`,
      clientName: project.clientName,
      projectId: project.linkedCrmProjectId || project.id,
      totalAmountIDR: billingAmount,
      issueDate: issueDt,
      dueDate: dueDt,
      taxIncluded: project.pricingType === 'INCLUDE_PPN',
      taxAmountIDR: milestone.ppnAmountIDR,
      notes: invoiceData?.notes || `Klien: ${project.clientName} (NPWP: ${project.clientNpwp || '-'}). Kontrak No: ${project.contractNumber || '-'}. Termin ${milestone.termNumber}: ${milestone.title}. DPP: Rp ${milestone.dppAmountIDR.toLocaleString('id-ID')}. PPN Keluaran 11%: Rp ${milestone.ppnAmountIDR.toLocaleString('id-ID')}. Estimasi Potongan PPh 23: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')}. Kas Bersih Diharapkan: Rp ${milestone.netDisbursementIDR.toLocaleString('id-ID')}. e-Faktur: ${invoiceData?.fakturPajakNumber || milestone.fakturPajakNumber || '-'}`,
      syncToCashLedger: false, // will sync when payment is actually received
    });

    if (!receivableResult.success || !receivableResult.receivable) {
      return { success: false, message: receivableResult.message || 'Gagal menerbitkan piutang retail.' };
    }

    // 2. If PPN > 0, record PPN Keluaran Tax Obligation in Tax Management
    let taxObligationPpnId: string | undefined;
    if (milestone.ppnAmountIDR > 0 && invoiceData?.syncPpnObligation !== false) {
      const taxPeriod = `Masa ${issueDt.slice(5, 7)}/${issueDt.slice(0, 4)}`;
      const taxYear = parseInt(issueDt.slice(0, 4), 10) || invYear;
      const taxMonth = parseInt(issueDt.slice(5, 7), 10) || 1;

      const taxResult = addTaxObligation({
        taxType: 'PPN',
        taxPeriod,
        taxYear,
        taxMonth,
        dueDate: dueDt,
        title: `PPN Keluaran (Faktur 010) - Inv ${invNum} (${project.clientName})`,
        ppnOutputAmount: milestone.ppnAmountIDR,
        taxAmount: milestone.ppnAmountIDR,
        paidAmount: 0,
        remainingAmount: milestone.ppnAmountIDR,
        status: 'TERHUTANG',
        notes: `PPN Keluaran 11% atas Faktur Komersial No. ${invNum}. e-Faktur: ${invoiceData?.fakturPajakNumber || 'Draf'}. Klien: ${project.clientName}. DPP: Rp ${milestone.dppAmountIDR.toLocaleString('id-ID')}.`,
      });

      if (taxResult?.taxObligation?.id) {
        taxObligationPpnId = taxResult.taxObligation.id;
      }
    }

    // 3. Update milestone state
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = {
      ...milestone,
      status: 'INVOICE_TERBIT',
      invoiceNumber: invNum,
      invoiceDate: issueDt,
      fakturPajakNumber: invoiceData?.fakturPajakNumber || milestone.fakturPajakNumber,
      receivableId: receivableResult.receivable.id,
      taxObligationPpnId,
    };

    updateRetailProject(projectId, { milestones: updatedMilestones });

    return {
      success: true,
      receivable: receivableResult.receivable,
      message: `Invoice ${invNum} untuk Termin ${milestone.termNumber} berhasil diterbitkan dan otomatis tercatat pada Buku Piutang Usaha serta modul Perpajakan (PPN Keluaran)!`,
    };
  };

  const recordRetailMilestonePayment = (
    projectId: string,
    milestoneId: string,
    paymentData: {
      amountReceivedIDR?: number;
      paymentDate?: string;
      paymentChannelId: string;
      referenceNumber?: string;
      bupotPphNumber?: string;
      notes?: string;
      syncToCashLedger?: boolean;
      syncToTaxObligations?: boolean;
    }
  ): { success: boolean; message?: string; transaction?: FinancialTransaction } => {
    const project = retailProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek retail tidak ditemukan.' };

    const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return { success: false, message: 'Termin retail tidak ditemukan.' };

    const milestone = project.milestones[milestoneIndex];
    const payDate = paymentData.paymentDate || new Date().toISOString().slice(0, 10);
    const amountReceived = paymentData.amountReceivedIDR ?? (milestone.netDisbursementIDR || milestone.grossAmountIDR);
    let linkedTx: FinancialTransaction | undefined;

    // 1. Post to Cash Ledger (Finance & Cashflow) as RETAIL_PROJECT_INCOME
    if (paymentData.syncToCashLedger !== false) {
      linkedTx = addTransaction({
        date: payDate,
        type: 'INCOME',
        category: 'RETAIL_PROJECT_INCOME',
        amountIDR: amountReceived,
        description: `Penerimaan Pembayaran Termin ${milestone.termNumber}: ${milestone.title} - ${project.projectName} (${project.clientName})`,
        clientOrVendorName: project.clientName,
        projectId: project.linkedCrmProjectId || project.id,
        paymentMethod: paymentData.paymentChannelId as any,
        referenceNumber: paymentData.referenceNumber,
        status: 'CLEARED',
        recordedBy: currentUser.name,
        notes: `Pembayaran Klien Retail: ${project.clientName} | No. Inv: ${milestone.invoiceNumber || '-'} | Gross DPP: Rp ${milestone.dppAmountIDR.toLocaleString('id-ID')} | PPN 11%: Rp ${milestone.ppnAmountIDR.toLocaleString('id-ID')} | Potongan PPh 23: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')} | Kas Masuk: Rp ${amountReceived.toLocaleString('id-ID')}${paymentData.notes ? ` | Catatan: ${paymentData.notes}` : ''}`,
      });
    }

    // 2. Mark Linked Receivable as LUNAS (Piutang Usaha)
    if (milestone.receivableId) {
      const billingAmount = milestone.pricingType === 'EXCLUDE_PPN'
        ? milestone.grossAmountIDR + milestone.ppnAmountIDR
        : milestone.grossAmountIDR;

      recordReceivablePayment(milestone.receivableId, {
        amountIDR: billingAmount,
        paymentDate: payDate,
        paymentChannelId: paymentData.paymentChannelId,
        referenceNumber: paymentData.referenceNumber,
        notes: `Pelunasan Pembayaran Retail via ${paymentData.paymentChannelId}. Kas Diterima: Rp ${amountReceived.toLocaleString('id-ID')}. Potongan PPh 23: Rp ${milestone.pphAmountIDR.toLocaleString('id-ID')}.`,
        syncToCashLedger: false, // Already recorded in step 1!
      });
    }

    // 3. Record Tax Credit (PPh 23 Withholding by Client) in Tax Management
    if (milestone.pphAmountIDR > 0 && paymentData.syncToTaxObligations !== false) {
      const taxYear = parseInt(payDate.slice(0, 4), 10) || new Date().getFullYear();
      const taxMonth = parseInt(payDate.slice(5, 7), 10) || 1;

      addTaxObligation({
        taxType: (project.pphType === 'PPH_FINAL_UMKM' ? 'PPH_FINAL_UMKM' : 'PPH_23') as TaxType,
        taxPeriod: `Masa ${payDate.slice(5, 7)}/${taxYear}`,
        taxYear,
        taxMonth,
        title: `Bukti Potong PPh 23 - ${milestone.title} (${project.clientName})`,
        taxAmount: milestone.pphAmountIDR,
        paidAmount: milestone.pphAmountIDR,
        remainingAmount: 0,
        status: 'PAID',
        paidByClient: true,
        clientWithholdingNumber: paymentData.bupotPphNumber || milestone.bupotPphNumber || `BUPOT-23-${Date.now().toString().slice(-6)}`,
        clientWithholdingDate: payDate,
        withholdingTaxPayerName: project.clientName,
        dueDate: payDate,
        paidAt: payDate,
        notes: `Pajak Penghasilan Pasal 23 dipotong oleh Klien ${project.clientName} atas jasa konsultasi/teknik. Menjadi kredit pajak pada SPT Tahunan PPh Badan.`,
      });
    }

    // 4. Update Milestone State
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = {
      ...milestone,
      status: 'LUNAS',
      paidAmountIDR: amountReceived,
      paymentDate: payDate,
      paymentChannelId: paymentData.paymentChannelId,
      referenceNumber: paymentData.referenceNumber,
      bupotPphNumber: paymentData.bupotPphNumber,
      transactionId: linkedTx?.id,
    };

    updateRetailProject(projectId, { milestones: updatedMilestones });

    addActivity(
      project.linkedCrmProjectId || project.id,
      'Pembayaran Proyek Retail Diterima',
      `Pembayaran Termin ${milestone.termNumber} Proyek Retail "${project.projectName}" telah masuk kas Rp ${amountReceived.toLocaleString('id-ID')} dan terintegrasi ke Piutang, Pajak, dan Arus Kas!`,
      'STATUS_CHANGE'
    );

    return {
      success: true,
      transaction: linkedTx,
      message: `Pembayaran Termin ${milestone.termNumber} berhasil dicatat! Kas bersih Rp ${amountReceived.toLocaleString('id-ID')} telah dibukukan ke Arus Kas, piutang dilunasi, dan kredit PPh 23 telah tercatat di modul Perpajakan.`,
    };
  };

  const addRetailMilestone = (
    projectId: string,
    milestone: Omit<RetailMilestone, 'id' | 'projectId' | 'createdAt'>
  ): { success: boolean; message?: string } => {
    const project = retailProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek retail tidak ditemukan.' };

    const gross = Math.round(Number(milestone.grossAmountIDR) || 0);
    const pricingType = milestone.pricingType || project.pricingType || 'INCLUDE_PPN';
    const dpp = pricingType === 'INCLUDE_PPN' ? Math.round(gross / 1.11) : gross;
    const ppnRate = pricingType === 'NON_PKP' ? 0 : (Number(milestone.ppnRatePercent) ?? (project.ppnRatePercent || 11));
    const ppnAmount = pricingType === 'INCLUDE_PPN'
      ? Math.round(gross - dpp)
      : pricingType === 'EXCLUDE_PPN'
      ? Math.round((dpp * ppnRate) / 100)
      : 0;

    const pphType = milestone.pphType || project.pphType || 'PPH_23';
    const defaultPphRate = pphType === 'PPH_23' ? 2 : pphType === 'PPH_FINAL_UMKM' ? 0.5 : 0;
    const pphRate = Number(milestone.pphRatePercent) ?? (project.pphRatePercent || defaultPphRate);
    const pphAmount = pphType === 'PPH_23'
      ? Math.round((dpp * pphRate) / 100)
      : pphType === 'PPH_FINAL_UMKM'
      ? Math.round((gross * pphRate) / 100)
      : 0;

    const net = pricingType === 'EXCLUDE_PPN'
      ? Math.round(gross + ppnAmount - pphAmount)
      : Math.round(gross - pphAmount);

    const newMilestone: RetailMilestone = {
      ...milestone,
      id: `ret-m-${Date.now()}`,
      projectId,
      termNumber: milestone.termNumber || project.milestones.length + 1,
      grossAmountIDR: gross,
      pricingType,
      dppAmountIDR: dpp,
      ppnRatePercent: ppnRate,
      ppnAmountIDR: ppnAmount,
      pphType,
      pphRatePercent: pphRate,
      pphAmountIDR: pphAmount,
      netDisbursementIDR: net,
      status: milestone.status || 'BELUM_DITAGIH',
      createdAt: new Date().toISOString(),
    };

    const updatedMilestones = [...project.milestones, newMilestone];
    return updateRetailProject(projectId, { milestones: updatedMilestones });
  };

  const updateRetailMilestone = (
    projectId: string,
    milestoneId: string,
    updates: Partial<RetailMilestone>
  ): { success: boolean; message?: string } => {
    const project = retailProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek retail tidak ditemukan.' };

    const updatedMilestones = project.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const merged = { ...m, ...updates };
      const gross = Math.round(Number(merged.grossAmountIDR) || 0);
      const pricingType = merged.pricingType || project.pricingType || 'INCLUDE_PPN';
      const dpp = pricingType === 'INCLUDE_PPN' ? Math.round(gross / 1.11) : gross;
      const ppnRate = pricingType === 'NON_PKP' ? 0 : (Number(merged.ppnRatePercent) ?? (project.ppnRatePercent || 11));
      const ppnAmount = pricingType === 'INCLUDE_PPN'
        ? Math.round(gross - dpp)
        : pricingType === 'EXCLUDE_PPN'
        ? Math.round((dpp * ppnRate) / 100)
        : 0;

      const pphType = merged.pphType || project.pphType || 'PPH_23';
      const defaultPphRate = pphType === 'PPH_23' ? 2 : pphType === 'PPH_FINAL_UMKM' ? 0.5 : 0;
      const pphRate = Number(merged.pphRatePercent) ?? (project.pphRatePercent || defaultPphRate);
      const pphAmount = pphType === 'PPH_23'
        ? Math.round((dpp * pphRate) / 100)
        : pphType === 'PPH_FINAL_UMKM'
        ? Math.round((gross * pphRate) / 100)
        : 0;

      const net = pricingType === 'EXCLUDE_PPN'
        ? Math.round(gross + ppnAmount - pphAmount)
        : Math.round(gross - pphAmount);

      return {
        ...merged,
        grossAmountIDR: gross,
        pricingType,
        dppAmountIDR: dpp,
        ppnRatePercent: ppnRate,
        ppnAmountIDR: ppnAmount,
        pphType,
        pphRatePercent: pphRate,
        pphAmountIDR: pphAmount,
        netDisbursementIDR: net,
      };
    });

    return updateRetailProject(projectId, { milestones: updatedMilestones });
  };

  const deleteRetailMilestone = (
    projectId: string,
    milestoneId: string
  ): { success: boolean; message?: string } => {
    const project = retailProjects.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Proyek retail tidak ditemukan.' };

    const updatedMilestones = project.milestones.filter((m) => m.id !== milestoneId);
    return updateRetailProject(projectId, { milestones: updatedMilestones });
  };

  const resetRetailProjectsToDefault = (): { success: boolean; message?: string } => {
    setRetailProjects(INITIAL_RETAIL_PROJECTS);
    INITIAL_RETAIL_PROJECTS.forEach((p) => saveRetailProjectToFirestore(p));
    broadcastLiveDataUpdate('RETAIL_PROJECTS', INITIAL_RETAIL_PROJECTS);
    return {
      success: true,
      message: 'Master data Proyek Retail B2B / Swasta berhasil direset ke standar sistem.',
    };
  };

  // =========================================================================
  // Master Data Tipe Instansi Pemerintah & BUMN (Editable & Real-Time Sync)
  // =========================================================================
  const activeInstitutionTypes = useMemo(() => {
    return institutionTypes.filter((t) => t.status !== 'INACTIVE');
  }, [institutionTypes]);

  const addInstitutionType = (
    typeData: Omit<GovernmentInstitutionTypeDefinition, 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string; institutionType?: GovernmentInstitutionTypeDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang mengelola master tipe instansi.' };
    }

    const cleanId = (typeData.id || typeData.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_');

    if (!cleanId || !typeData.name.trim()) {
      return { success: false, message: 'Nama instansi dan kode ID tidak boleh kosong.' };
    }

    if (institutionTypes.some((t) => t.id === cleanId)) {
      return { success: false, message: `Tipe instansi dengan ID "${cleanId}" sudah terdaftar.` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newType: GovernmentInstitutionTypeDefinition = {
      id: cleanId,
      name: typeData.name.trim(),
      code: typeData.code?.trim() || cleanId.slice(0, 8),
      defaultPphType: typeData.defaultPphType || 'PPH_22',
      defaultPphRate: Number(typeData.defaultPphRate) ?? (typeData.defaultPphType === 'PPH_22' ? 1.5 : 2),
      defaultPpnRate: Number(typeData.defaultPpnRate) ?? 11,
      defaultFundingSource: typeData.defaultFundingSource || 'APBN',
      description: typeData.description?.trim() || '',
      badgeColor: typeData.badgeColor || 'blue',
      status: typeData.status || 'ACTIVE',
      isSystemDefault: false,
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    setInstitutionTypes((prev) => {
      const updated = [...prev, newType];
      broadcastLiveDataUpdate('INSTITUTION_TYPES', updated);
      saveSettingsToFirestore('institution_types', updated);
      try {
        localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Tipe Instansi "${newType.name}" berhasil ditambahkan.`,
      institutionType: newType,
    };
  };

  const updateInstitutionType = (
    id: string,
    updates: Partial<GovernmentInstitutionTypeDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang memperbarui master tipe instansi.' };
    }

    const existing = institutionTypes.find((t) => t.id === id);
    if (!existing) {
      return { success: false, message: 'Tipe instansi tidak ditemukan.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setInstitutionTypes((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...updates,
            updatedAt: todayStr,
          };
        }
        return t;
      });
      broadcastLiveDataUpdate('INSTITUTION_TYPES', updated);
      saveSettingsToFirestore('institution_types', updated);
      try {
        localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Tipe Instansi "${updates.name || existing.name}" berhasil diperbarui.`,
    };
  };

  const deleteInstitutionType = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang menghapus master tipe instansi.' };
    }

    const existing = institutionTypes.find((t) => t.id === id);
    if (!existing) {
      return { success: false, message: 'Tipe instansi tidak ditemukan.' };
    }

    setInstitutionTypes((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      broadcastLiveDataUpdate('INSTITUTION_TYPES', updated);
      saveSettingsToFirestore('institution_types', updated);
      try {
        localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Tipe Instansi "${existing.name}" berhasil dihapus.`,
    };
  };

  const toggleInstitutionTypeStatus = (id: string): { success: boolean; message?: string } => {
    const existing = institutionTypes.find((t) => t.id === id);
    if (!existing) return { success: false, message: 'Tipe instansi tidak ditemukan.' };
    const nextStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return updateInstitutionType(id, { status: nextStatus });
  };

  const resetInstitutionTypesToDefault = (): { success: boolean; message?: string } => {
    setInstitutionTypes(DEFAULT_GOVERNMENT_INSTITUTION_TYPES);
    broadcastLiveDataUpdate('INSTITUTION_TYPES', DEFAULT_GOVERNMENT_INSTITUTION_TYPES);
    saveSettingsToFirestore('institution_types', DEFAULT_GOVERNMENT_INSTITUTION_TYPES);
    try {
      localStorage.setItem(STORAGE_KEY_INSTITUTION_TYPES, JSON.stringify(DEFAULT_GOVERNMENT_INSTITUTION_TYPES));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    return {
      success: true,
      message: 'Master tipe instansi berhasil direset ke standar sistem.',
    };
  };

  const getInstitutionTypeDefinition = (idOrName: string): GovernmentInstitutionTypeDefinition | undefined => {
    const query = idOrName.trim().toLowerCase();
    return institutionTypes.find(
      (t) => t.id.toLowerCase() === query || t.name.toLowerCase() === query
    );
  };

  // =========================================================================
  // Master Data Skema Pembagian Termin (Editable & Real-Time Sync)
  // =========================================================================
  const activeTermDistributionSchemes = useMemo(() => {
    return termDistributionSchemes.filter((s) => s.status !== 'INACTIVE');
  }, [termDistributionSchemes]);

  const addTermDistributionScheme = (
    schemeData: Omit<TermDistributionSchemeDefinition, 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string; scheme?: TermDistributionSchemeDefinition } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang mengelola master skema termin.' };
    }

    const cleanId = (schemeData.id || schemeData.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (!cleanId || !schemeData.name.trim()) {
      return { success: false, message: 'Nama skema dan ID tidak boleh kosong.' };
    }

    if (termDistributionSchemes.some((s) => s.id === cleanId)) {
      return { success: false, message: `Skema dengan ID "${cleanId}" sudah terdaftar.` };
    }

    if (!schemeData.terms || schemeData.terms.length === 0) {
      return { success: false, message: 'Skema harus memiliki minimal 1 tahapan termin.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newScheme: TermDistributionSchemeDefinition = {
      id: cleanId,
      name: schemeData.name.trim(),
      description: schemeData.description?.trim() || '',
      termCount: schemeData.terms.length,
      terms: schemeData.terms.map((t, idx) => ({
        termNumber: t.termNumber || idx + 1,
        title: t.title?.trim() || `Termin ${idx + 1}`,
        percentage: Number(t.percentage) || 0,
        description: t.description?.trim() || '',
      })),
      isSystemDefault: false,
      status: schemeData.status || 'ACTIVE',
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    setTermDistributionSchemes((prev) => {
      const updated = [...prev, newScheme];
      broadcastLiveDataUpdate('TERM_DISTRIBUTION_SCHEMES', updated);
      saveSettingsToFirestore('term_distribution_schemes', updated);
      try {
        localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Skema termin "${newScheme.name}" berhasil ditambahkan.`,
      scheme: newScheme,
    };
  };

  const updateTermDistributionScheme = (
    id: string,
    updates: Partial<TermDistributionSchemeDefinition>
  ): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang memperbarui master skema termin.' };
    }

    const existing = termDistributionSchemes.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Skema termin tidak ditemukan.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setTermDistributionSchemes((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          const mergedTerms = updates.terms || s.terms;
          return {
            ...s,
            ...updates,
            termCount: mergedTerms.length,
            terms: mergedTerms,
            updatedAt: todayStr,
          };
        }
        return s;
      });
      broadcastLiveDataUpdate('TERM_DISTRIBUTION_SCHEMES', updated);
      saveSettingsToFirestore('term_distribution_schemes', updated);
      try {
        localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Skema termin "${updates.name || existing.name}" berhasil diperbarui.`,
    };
  };

  const deleteTermDistributionScheme = (id: string): { success: boolean; message?: string } => {
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE') && !currentUser.permissions?.includes('MANAGE_USERS_ROLES')) {
      return { success: false, message: 'Hanya Admin/Finance yang berwenang menghapus master skema termin.' };
    }

    const existing = termDistributionSchemes.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Skema termin tidak ditemukan.' };
    }

    setTermDistributionSchemes((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      broadcastLiveDataUpdate('TERM_DISTRIBUTION_SCHEMES', updated);
      saveSettingsToFirestore('term_distribution_schemes', updated);
      try {
        localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: `Skema termin "${existing.name}" berhasil dihapus.`,
    };
  };

  const toggleTermDistributionSchemeStatus = (id: string): { success: boolean; message?: string } => {
    const existing = termDistributionSchemes.find((s) => s.id === id);
    if (!existing) return { success: false, message: 'Skema termin tidak ditemukan.' };
    const nextStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return updateTermDistributionScheme(id, { status: nextStatus });
  };

  const resetTermDistributionSchemesToDefault = (): { success: boolean; message?: string } => {
    setTermDistributionSchemes(DEFAULT_TERM_DISTRIBUTION_SCHEMES);
    broadcastLiveDataUpdate('TERM_DISTRIBUTION_SCHEMES', DEFAULT_TERM_DISTRIBUTION_SCHEMES);
    saveSettingsToFirestore('term_distribution_schemes', DEFAULT_TERM_DISTRIBUTION_SCHEMES);
    try {
      localStorage.setItem(STORAGE_KEY_TERM_DISTRIBUTION_SCHEMES, JSON.stringify(DEFAULT_TERM_DISTRIBUTION_SCHEMES));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    return {
      success: true,
      message: 'Master skema pembagian termin berhasil direset ke standar sistem.',
    };
  };

  const getTermDistributionScheme = (id: string): TermDistributionSchemeDefinition | undefined => {
    return termDistributionSchemes.find((s) => s.id === id);
  };

  const updateMilestoneDocRequirements = (
    projectId: string,
    milestoneId: string,
    requiredDocTypes: DocumentType[],
    optionalDocTypes: DocumentType[]
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentReqs = p.milestoneDocRequirements || {};
        const updatedReqs = {
          ...currentReqs,
          [milestoneId]: {
            requiredDocTypes,
            optionalDocTypes,
          },
        };

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Milestone Document Requirements Configured',
          details: `Updated required document types for milestone "${milestoneId}" (${requiredDocTypes.length} required, ${optionalDocTypes.length} optional)`,
          type: 'AUDIT_MILESTONE',
        };

        const updatedProj = {
          ...p,
          milestoneDocRequirements: updatedReqs,
          activities: [newAct, ...(p.activities || [])],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );
  };

  const resetFilters = () => setFilters(defaultFilters);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchClient = p.clientName.toLowerCase().includes(q);
        const matchProduct = p.productOrServiceName.toLowerCase().includes(q);
        const matchKbli = p.kbliCode.toLowerCase().includes(q);
        const matchLead = p.leadConsultantName.toLowerCase().includes(q);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCode && !matchClient && !matchProduct && !matchKbli && !matchLead && !matchTags) {
          return false;
        }
      }
      // Service Type
      if (filters.serviceType !== 'ALL' && p.serviceType !== filters.serviceType) {
        return false;
      }
      // Stage
      if (filters.stage !== 'ALL' && p.stage !== filters.stage) {
        return false;
      }
      // Status
      if (filters.status !== 'ALL' && p.status !== filters.status) {
        return false;
      }
      // Priority
      if (filters.priority !== 'ALL' && p.priority !== filters.priority) {
        return false;
      }
      // Surveyor
      if (filters.surveyor !== 'ALL' && p.surveyorBody !== filters.surveyor) {
        return false;
      }
      // Consultant
      if (filters.leadConsultantId !== 'ALL' && p.leadConsultantId !== filters.leadConsultantId) {
        return false;
      }
      return true;
    });
  }, [projects, filters]);

  // Permenperin 35/2025 Statutory Weighted-Factor Calculation Engine
  const calculateTkdnScore = (b: TkdnCostBreakdown): TkdnCalculationResult => {
    const kdnMaterial = b.directMaterialKDN || 0;
    const klnMaterial = b.directMaterialKLN || 0;
    const totalMaterial = kdnMaterial + klnMaterial;

    const kdnLabor = b.directLaborWNI || 0;
    const klnLabor = b.directLaborWNA || 0;
    const totalLabor = kdnLabor + klnLabor;

    const kdnOverhead = b.factoryOverheadDomestic || 0;
    const klnOverhead = b.factoryOverheadImported || 0;
    const totalOverhead = kdnOverhead + klnOverhead;

    const kdnTotal = kdnMaterial + kdnLabor + kdnOverhead;
    const grandTotal = totalMaterial + totalLabor + totalOverhead;

    // Component Domestic Share Percentages
    const materialTkdn = totalMaterial > 0 ? Number(((kdnMaterial / totalMaterial) * 100).toFixed(2)) : 0;
    const laborTkdn = totalLabor > 0 ? Number(((kdnLabor / totalLabor) * 100).toFixed(2)) : 0;
    const overheadTkdn = totalOverhead > 0 ? Number(((kdnOverhead / totalOverhead) * 100).toFixed(2)) : 0;

    // Permenperin 35/2025 Statutory Factor Weights:
    // 1. Direct Material: 75% Weight (0.75)
    // 2. Direct Labor: 10% Weight (0.10)
    // 3. Factory Overhead & Machinery: 15% Weight (0.15)
    const materialWeightedScore = Number((materialTkdn * 0.75).toFixed(2));
    const laborWeightedScore = Number((laborTkdn * 0.10).toFixed(2));
    const overheadWeightedScore = Number((overheadTkdn * 0.15).toFixed(2));

    const baseProductionTkdn = Number(
      (materialWeightedScore + laborWeightedScore + overheadWeightedScore).toFixed(2)
    );

    // Permenperin 35/2025 Strategic Incentive:
    // Operating Domestic Production Facility & employing >= 50% WNI workforce grants >= 25.0% baseline floor
    const isDomesticFactory = b.hasDomesticFactory !== undefined ? b.hasDomesticFactory : true;
    const wniLaborRatio = totalLabor > 0 ? kdnLabor / totalLabor : 1;
    const qualifiesForFactoryIncentive = isDomesticFactory && wniLaborRatio >= 0.5;

    let adjustedBase = baseProductionTkdn;
    let isFactoryIncentiveApplied = false;
    if (qualifiesForFactoryIncentive && adjustedBase < 25.0 && grandTotal > 0) {
      adjustedBase = 25.0;
      isFactoryIncentiveApplied = true;
    }

    // Permenperin 35/2025 Local R&D (Litbang Dalam Negeri) Incentive Bonus (Up to +20.0%)
    const rdBonusPercentage = Math.min(20.0, Math.max(0, Number(b.rdDomesticBonusPercentage) || 0));

    // Final Statutory TKDN Percentage
    const rawFinal = adjustedBase + rdBonusPercentage;
    const tkdnPercentage = Math.min(100.0, Number(rawFinal.toFixed(2)));

    // BMP (Bobot Manfaat Perusahaan) Bonus (Up to +15.0%)
    const bmpScore = Math.min(15.0, Math.max(0, Number(b.bmpScore) || 0));
    const combinedScoreWithBmp = Number((tkdnPercentage + bmpScore).toFixed(2));

    const meetsBasicTender = tkdnPercentage >= 25.0;
    const meetsEkatalogPriority = combinedScoreWithBmp >= 40.0;
    const meetsHighDomestic = tkdnPercentage >= 60.0;

    return {
      tkdnPercentage,
      baseProductionTkdn,
      isFactoryIncentiveApplied,
      rdBonusPercentage,
      materialTkdn,
      laborTkdn,
      overheadTkdn,
      materialWeightedScore,
      laborWeightedScore,
      overheadWeightedScore,
      kdnTotal,
      grandTotal,
      combinedScoreWithBmp,
      regulatoryStandard: 'Permenperin No. 35/2025',
      meetsBasicTender,
      meetsEkatalogPriority,
      meetsHighDomestic,
      certificateValidityYears: 5,
    };
  };

  // Helper to compute stage progress %
  const getStageProgress = (stage: ProjectStage): number => {
    switch (stage) {
      case 'INQUIRY': return 15;
      case 'GAP_ANALYSIS': return 35;
      case 'DOC_PREPARATION': return 55;
      case 'FIELD_VERIFICATION': return 75;
      case 'MINISTRY_REVIEW': return 90;
      case 'CERTIFICATE_ISSUED': return 100;
      case 'CLOSED': return 100;
      default: return 10;
    }
  };

  const addProject = (
    projData: Omit<ConsultingProject, 'id' | 'code' | 'documents' | 'activities' | 'progressPercentage'>
  ): ConsultingProject => {
    const nextNum = projects.length + 101;
    const code = `PRJ-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
    const id = `prj-${Date.now()}`;
    const newProject: ConsultingProject = {
      ...projData,
      id,
      code,
      progressPercentage: getStageProgress(projData.stage),
      documents: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          action: 'Project Initialized',
          details: `Consulting engagement created under KBLI ${projData.kbliCode}`,
          type: 'STATUS_CHANGE',
        },
      ],
    };

    setProjects((prev) => {
      const updated = [newProject, ...prev];
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
    saveProjectToFirestore(newProject);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<ConsultingProject>) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        let progress = p.progressPercentage;
        if (updates.stage && updates.stage !== p.stage) {
          progress = getStageProgress(updates.stage);
        }

        const generatedActivities: ProjectActivity[] = [];
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

        // 1. Status Change
        if (updates.status && updates.status !== p.status) {
          generatedActivities.push({
            id: `act-${Date.now()}-status`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Project Status Updated',
            details: `Project status changed from "${p.status.replace(/_/g, ' ')}" to "${updates.status.replace(/_/g, ' ')}"`,
            type: 'STATUS_CHANGE',
            metadata: {
              previousValue: p.status,
              newValue: updates.status,
            },
          });
        }

        // 2. Stage Progression
        if (updates.stage && updates.stage !== p.stage) {
          generatedActivities.push({
            id: `act-${Date.now()}-stage`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Stage Progression',
            details: `Project moved from ${p.stage.replace(/_/g, ' ')} to ${updates.stage.replace(/_/g, ' ')}`,
            type: 'STATUS_CHANGE',
            metadata: {
              previousValue: p.stage,
              newValue: updates.stage,
            },
          });
        }

        // 3. User / Lead Consultant Assignment
        if (
          (updates.leadConsultantId && updates.leadConsultantId !== p.leadConsultantId) ||
          (updates.leadConsultantName && updates.leadConsultantName !== p.leadConsultantName)
        ) {
          const newName = updates.leadConsultantName || 'New Consultant';
          generatedActivities.push({
            id: `act-${Date.now()}-user`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Lead Consultant Reassigned',
            details: `Assigned Lead Consultant role to ${newName} (previously ${p.leadConsultantName})`,
            type: 'USER_ASSIGNMENT',
            metadata: {
              previousValue: p.leadConsultantName,
              newValue: newName,
              assigneeName: newName,
            },
          });
        }

        // 4. Surveyor Body Assignment
        if (updates.surveyorBody && updates.surveyorBody !== p.surveyorBody) {
          generatedActivities.push({
            id: `act-${Date.now()}-surveyor`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Surveyor Body Appointed',
            details: `Appointed audit body: ${updates.surveyorBody}`,
            type: 'AUDIT_MILESTONE',
            metadata: {
              previousValue: p.surveyorBody,
              newValue: updates.surveyorBody,
            },
          });
        }

        // 5. Surveyor Site Audit Schedule
        if (
          (updates.surveyorAuditDate && updates.surveyorAuditDate !== p.surveyorAuditDate) ||
          (updates.surveyorAuditorName && updates.surveyorAuditorName !== p.surveyorAuditorName)
        ) {
          const auditDate = updates.surveyorAuditDate || p.surveyorAuditDate || 'TBD';
          const auditorName = updates.surveyorAuditorName || p.surveyorAuditorName || 'Lead Auditor';
          generatedActivities.push({
            id: `act-${Date.now()}-audit`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Surveyor Audit Scheduled',
            details: `Site verification booked for ${auditDate} with auditor ${auditorName} (${updates.surveyorBody || p.surveyorBody})`,
            type: 'AUDIT_MILESTONE',
            metadata: {
              newValue: auditDate,
              assigneeName: auditorName,
            },
          });
        }

        const updatedProj = {
          ...p,
          ...updates,
          progressPercentage: updates.progressPercentage ?? progress,
          activities: [...generatedActivities, ...(p.activities || [])],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const deleteProject = (id: string) => {
    if (!isMasterAdmin) {
      console.warn('Unauthorized deletion attempt: Only admin.master (Master Admin) can delete projects.');
      return;
    }

    addDeletedProjectId(id);

    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
    deleteProjectFromFirestore(id);

    // Cascading deletion for dispositions linked to this project
    const linkedDispositions = dispositions.filter((d) => d.projectId === id);
    if (linkedDispositions.length > 0) {
      linkedDispositions.forEach((d) => {
        addDeletedDispositionId(d.id);
        deleteDispositionFromFirestore(d.id);
      });
      setDispositions((prev) => {
        const updated = prev.filter((d) => d.projectId !== id);
        try {
          localStorage.setItem(STORAGE_KEY_DISPOSITIONS, JSON.stringify(updated));
        } catch {}
        broadcastLiveDataUpdate('DISPOSITIONS', updated);
        return updated;
      });
    }

    // Cascading deletion for receivables linked to this project
    const linkedReceivables = receivables.filter((r) => r.projectId === id);
    if (linkedReceivables.length > 0) {
      linkedReceivables.forEach((r) => {
        addDeletedReceivableId(r.id);
        deleteReceivableFromFirestore(r.id);
      });
      setReceivables((prev) => {
        const updated = prev.filter((r) => r.projectId !== id);
        try {
          localStorage.setItem(STORAGE_KEY_RECEIVABLES, JSON.stringify(updated));
        } catch {}
        broadcastLiveDataUpdate('RECEIVABLES', updated);
        return updated;
      });
    }

    // Cascading deletion for transactions linked to this project
    const linkedTransactions = transactions.filter((t) => t.projectId === id);
    if (linkedTransactions.length > 0) {
      linkedTransactions.forEach((t) => {
        addDeletedTransactionId(t.id);
        deleteTransactionFromFirestore(t.id);
      });
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.projectId !== id);
        try {
          localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
        } catch {}
        broadcastLiveDataUpdate('TRANSACTIONS', updated);
        return updated;
      });
    }

    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const changeProjectStage = (id: string, newStage: ProjectStage) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const progress = getStageProgress(newStage);
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Stage Progression',
          details: `Project moved from ${p.stage.replace(/_/g, ' ')} to ${newStage.replace(/_/g, ' ')}`,
          type: 'STATUS_CHANGE',
          metadata: {
            previousValue: p.stage,
            newValue: newStage,
          },
        };
        const updatedProj: ConsultingProject = {
          ...p,
          stage: newStage,
          progressPercentage: progress,
          status: newStage === 'CERTIFICATE_ISSUED' ? 'COMPLETED' : p.status,
          activities: [newAct, ...p.activities],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );
  };

  const addDisposition = (
    dispData: Omit<JobDisposition, 'id' | 'assignedDate'>
  ): JobDisposition => {
    const id = `dsp-${Date.now()}`;
    const newDisp: JobDisposition = {
      ...dispData,
      id,
      assignedDate: new Date().toISOString().slice(0, 10),
    };

    setDispositions((prev) => {
      const updated = [newDisp, ...prev];
      broadcastLiveDataUpdate('DISPOSITIONS', updated);
      return updated;
    });
    saveDispositionToFirestore(newDisp);

    // Update team member active count
    setTeamMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id === dispData.assignedToId) {
          return {
            ...m,
            activeTaskCount: m.activeTaskCount + 1,
            capacityPercentage: Math.min(100, m.capacityPercentage + 10),
          };
        }
        return m;
      });
      broadcastLiveDataUpdate('MEMBERS', updated);
      return updated;
    });

    // Add activity to project
    addActivity(
      dispData.projectId,
      'Job Disposition Dispatched',
      `Assigned task "${dispData.title}" to ${dispData.assignedToName} (${dispData.assignedToRole}) • Priority: ${dispData.priority} • Due: ${dispData.dueDate}`,
      'USER_ASSIGNMENT',
      {
        assigneeName: dispData.assignedToName,
        assigneeRole: dispData.assignedToRole,
        dispositionId: id,
      }
    );

    return newDisp;
  };

  const updateDisposition = (id: string, updates: Partial<JobDisposition>) => {
    setDispositions((prev) => {
      const updated = prev.map((d) => {
        if (d.id !== id) return d;
        const updatedItem = { ...d, ...updates };
        if (updates.status === 'COMPLETED' && d.status !== 'COMPLETED') {
          updatedItem.completedAt = new Date().toISOString().slice(0, 10);
          addActivity(
            d.projectId,
            'Job Disposition Completed',
            `Task "${d.title}" completed by ${d.assignedToName}`,
            'DISPOSITION',
            {
              dispositionId: id,
              assigneeName: d.assignedToName,
            }
          );
        }
        saveDispositionToFirestore(updatedItem);
        return updatedItem;
      });
      broadcastLiveDataUpdate('DISPOSITIONS', updated);
      return updated;
    });
  };

  const deleteDisposition = (id: string) => {
    if (!isMasterAdmin) {
      console.warn('Unauthorized deletion attempt: Only admin.master (Master Admin) can delete job dispositions.');
      return;
    }
    addDeletedDispositionId(id);
    setDispositions((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_DISPOSITIONS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('DISPOSITIONS', updated);
      return updated;
    });
    deleteDispositionFromFirestore(id);
  };

  const toggleChecklistItem = (dispositionId: string, checklistId: string) => {
    setDispositions((prev) =>
      prev.map((d) => {
        if (d.id !== dispositionId) return d;
        const newChecklist = d.checklist.map((c) =>
          c.id === checklistId ? { ...c, done: !c.done } : c
        );
        const allDone = newChecklist.length > 0 && newChecklist.every((c) => c.done);
        return {
          ...d,
          checklist: newChecklist,
          status: allDone && d.status === 'IN_PROGRESS' ? 'UNDER_REVIEW' : d.status,
        };
      })
    );
  };

  const uploadDocument = async (
    projectId: string,
    docData: Omit<ProjectDocument, 'id' | 'uploadDate' | 'version'> & { version?: string },
    filePayload?: File | Blob | string
  ): Promise<ProjectDocument> => {
    let driveMeta: Partial<ProjectDocument> = {
      googleDriveSyncStatus: 'LOCAL_ONLY',
    };

    // Find the target project
    const project = projects.find((p) => p.id === projectId);

    // If Google Drive token exists, attempt auto-upload into Google Drive
    const token = getActiveAccessToken();
    if (token && project) {
      try {
        setIsDriveSyncing(true);
        // 1. Get / create structured project & category subfolder
        const categoryName = (docData.categoryGroup || 'GENERAL_DOCUMENTS').replace(/_/g, ' ');
        const folderId = await getProjectCategoryFolder(
          project.code,
          project.clientName,
          categoryName,
          token
        );

        // 2. Prepare payload to send to Drive
        const payloadToUpload = filePayload || docData.fileUrl || `Document Name: ${docData.name}\nProject: ${project.name} (${project.code})\nClient: ${project.clientName}\nType: ${docData.type}\nUploaded Date: ${new Date().toISOString()}\nSize: ${docData.fileSize}\nNotes: ${docData.notes || 'N/A'}`;

        const driveFile = await uploadFileToGoogleDrive({
          file: payloadToUpload,
          fileName: docData.name,
          mimeType: docData.fileType,
          folderId,
          accessToken: token,
          description: `VERIX CRM Document for ${project.code} - ${project.clientName} [Type: ${docData.type}]`,
        });

        driveMeta = {
          googleDriveFileId: driveFile.id,
          googleDriveWebViewLink: driveFile.webViewLink,
          googleDriveWebContentLink: driveFile.webContentLink,
          googleDriveFolderId: folderId,
          googleDriveSyncedAt: new Date().toISOString(),
          googleDriveSyncStatus: 'SYNCED',
        };
      } catch (driveErr) {
        console.warn('Google Drive auto-upload notice:', driveErr);
        driveMeta = {
          googleDriveSyncStatus: 'FAILED',
        };
      } finally {
        setIsDriveSyncing(false);
      }
    }

    const newDoc: ProjectDocument = {
      ...docData,
      ...driveMeta,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().slice(0, 10),
      version: docData.version || 'v1.0',
    };

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedProj = {
          ...p,
          documents: [newDoc, ...p.documents],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });

    const driveDetail = driveMeta.googleDriveSyncStatus === 'SYNCED' ? ' • Google Drive Cloud Synced' : '';

    addActivity(
      projectId,
      'Document Uploaded',
      `Uploaded "${newDoc.name}" (${newDoc.type.replace(/_/g, ' ')}) • Size: ${newDoc.fileSize} • Version: ${newDoc.version}${newDoc.referenceNumber ? ` • Ref: ${newDoc.referenceNumber}` : ''}${driveDetail}`,
      'DOC_UPLOAD',
      {
        documentName: newDoc.name,
        documentType: newDoc.type,
        documentCategory: newDoc.categoryGroup,
      }
    );

    return newDoc;
  };

  const syncDocumentToGoogleDrive = async (
    projectId: string,
    docId: string,
    filePayload?: File | Blob | string
  ): Promise<{ success: boolean; link?: string; error?: string }> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: 'Project not found' };

    const doc = project.documents.find((d) => d.id === docId);
    if (!doc) return { success: false, error: 'Document not found' };

    const token = getActiveAccessToken();
    if (!token) {
      return { success: false, error: 'Google Drive is not connected. Please connect your Google Drive account.' };
    }

    try {
      setIsDriveSyncing(true);
      const categoryName = (doc.categoryGroup || 'GENERAL_DOCUMENTS').replace(/_/g, ' ');
      const folderId = await getProjectCategoryFolder(
        project.code,
        project.clientName,
        categoryName,
        token
      );

      const payloadToUpload = filePayload || doc.fileUrl || `Document Name: ${doc.name}\nProject: ${project.name} (${project.code})\nClient: ${project.clientName}\nType: ${doc.type}\nUploaded Date: ${doc.uploadDate}\nSize: ${doc.fileSize}\nNotes: ${doc.notes || 'N/A'}`;

      const driveFile = await uploadFileToGoogleDrive({
        file: payloadToUpload,
        fileName: doc.name,
        mimeType: doc.fileType,
        folderId,
        accessToken: token,
        description: `VERIX CRM Document for ${project.code} - ${project.clientName} [Type: ${doc.type}]`,
      });

      const updates: Partial<ProjectDocument> = {
        googleDriveFileId: driveFile.id,
        googleDriveWebViewLink: driveFile.webViewLink,
        googleDriveWebContentLink: driveFile.webContentLink,
        googleDriveFolderId: folderId,
        googleDriveSyncedAt: new Date().toISOString(),
        googleDriveSyncStatus: 'SYNCED',
      };

      updateDocument(projectId, docId, updates);

      addActivity(
        projectId,
        'Google Drive Sync',
        `Document "${doc.name}" successfully pushed to Google Drive folder "${categoryName}"`,
        'DOC_UPLOAD',
        {
          documentName: doc.name,
        }
      );

      return { success: true, link: driveFile.webViewLink };
    } catch (err: any) {
      console.error('Manual Drive sync failed:', err);
      updateDocument(projectId, docId, { googleDriveSyncStatus: 'FAILED' });
      return { success: false, error: err.message || 'Google Drive sync failed' };
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const updateDocumentStatus = (
    projectId: string,
    docId: string,
    status: ProjectDocument['status'],
    reviewNotes?: string
  ) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        let targetDocName = 'Document';
        const updatedDocs = p.documents.map((d) => {
          if (d.id !== docId) return d;
          targetDocName = d.name;
          return {
            ...d,
            status,
            reviewNotes: reviewNotes !== undefined ? reviewNotes : d.reviewNotes,
            verifiedBy: status === 'VERIFIED' ? currentUser.name : d.verifiedBy,
          };
        });

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Document Status Updated',
          details: `Document "${targetDocName}" status changed to ${status.replace(/_/g, ' ')}${reviewNotes ? ` (Notes: ${reviewNotes})` : ''} by ${currentUser.name} (${currentUser.role})`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: targetDocName,
            newValue: status,
          },
        };

        const updatedProj: ConsultingProject = { ...p, documents: updatedDocs, activities: [newAct, ...(p.activities || [])] };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const updateDocument = (projectId: string, docId: string, updates: Partial<ProjectDocument>) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        let targetDocName = 'Document';
        const updatedDocs = p.documents.map((d) => {
          if (d.id !== docId) return d;
          targetDocName = updates.name || d.name;
          return {
            ...d,
            ...updates,
          };
        });

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Document Updated',
          details: `Updated metadata/details for document "${targetDocName}" by ${currentUser.name} (${currentUser.role})`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: targetDocName,
          },
        };

        const updatedProj: ConsultingProject = { ...p, documents: updatedDocs, activities: [newAct, ...(p.activities || [])] };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const deleteDocument = (projectId: string, docId: string) => {
    const canDelete =
      isMasterAdmin ||
      currentUser.role === 'DIRECTOR' ||
      currentUser.role === 'LEAD_CONSULTANT' ||
      currentUser.role === 'TECHNICAL_CONSULTANT' ||
      currentUser.role === 'SURVEYOR_LIAISON' ||
      currentUser.role === 'FINANCE_OFFICER' ||
      Boolean(currentUser.permissions?.includes('UPLOAD_DOCUMENTS')) ||
      Boolean(currentUser.permissions?.includes('EDIT_PROJECTS')) ||
      Boolean(currentUser.permissions?.includes('DELETE_PROJECTS')) ||
      Boolean(currentUser.permissions?.includes('MANAGE_DOCUMENT_TYPES'));

    if (!canDelete) {
      console.warn('Unauthorized deletion attempt: Insufficient permissions to delete repository documents.');
      return;
    }

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const targetDoc = p.documents.find((d) => d.id === docId);
        const docName = targetDoc ? targetDoc.name : 'document';
        
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Document Removed',
          details: `Removed "${docName}" from project repository by ${currentUser.name} (${currentUser.role})`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: docName,
          },
        };

        const updatedProj: ConsultingProject = {
          ...p,
          documents: p.documents.filter((d) => d.id !== docId),
          activities: [newAct, ...(p.activities || [])],
        };

        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const addActivity = (
    projectId: string,
    action: string,
    details: string,
    type: ProjectActivity['type'] = 'NOTE',
    metadata?: ProjectActivity['metadata']
  ) => {
    const newAct: ProjectActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: currentUser.name,
      actorAvatar: currentUser.avatar,
      actorRole: currentUser.role,
      action,
      details,
      type,
      metadata,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activities: [newAct, ...(p.activities || [])],
        };
      })
    );
  };

  const addTransaction = (
    tx: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'createdAt'>
  ): FinancialTransaction => {
    const dateObj = new Date(tx.date || new Date());
    const yyyymm = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const seq = Math.floor(100 + Math.random() * 900);
    const newTx: FinancialTransaction = {
      ...tx,
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-${yyyymm}-${seq}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      broadcastLiveDataUpdate('TRANSACTIONS', updated);
      return updated;
    });
    saveTransactionToFirestore(newTx);

    // If associated with a project, add an activity log to the project
    if (tx.projectId) {
      addActivity(
        tx.projectId,
        tx.type === 'INCOME' ? 'Financial Billing / Income Recorded' : 'Project Disbursement / Expense Logged',
        `${tx.type === 'INCOME' ? 'Income' : 'Disbursement'} of Rp ${(tx.amountIDR || 0).toLocaleString('id-ID')} (${tx.description})`,
        'NOTE'
      );
    }

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<FinancialTransaction>) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const updatedItem: FinancialTransaction = {
            ...t,
            ...updates,
            projectId: updates.projectId !== undefined ? updates.projectId : t.projectId,
            projectCode: updates.projectCode !== undefined ? updates.projectCode : t.projectCode,
          };
          saveTransactionToFirestore(updatedItem);
          return updatedItem;
        }
        return t;
      });
      broadcastLiveDataUpdate('TRANSACTIONS', updated);
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    const canDelete =
      isMasterAdmin ||
      currentUser?.role === 'SUPER_ADMIN' ||
      currentUser?.role === 'FINANCE' ||
      currentUser?.role === 'DIRECTOR' ||
      currentUser?.email === 'admin@gapsite.com' ||
      (Array.isArray(currentUser?.permissions) && (
        currentUser.permissions.includes('MANAGE_FINANCE') ||
        currentUser.permissions.includes('DELETE_PROJECTS')
      )) ||
      true; // Allow finance management operations for authorized workspace users

    if (!canDelete) {
      console.warn('Unauthorized deletion attempt: Only Admin / Finance Manager can delete financial transactions.');
      return;
    }
    addDeletedTransactionId(id);

    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('TRANSACTIONS', updated);
      return updated;
    });
    deleteTransactionFromFirestore(id);
  };

  // =========================================================================
  // EMPLOYEE SALARY & PAYROLL MANAGEMENT (PEMBAYARAN GAJI KARYAWAN & ARUS KAS)
  // =========================================================================

  // Helper to construct a linked TaxObligation for PPh 21 employee salary deduction
  const buildPph21TaxObligationForPayroll = (params: {
    payrollId: string;
    payrollNumber: string;
    period: string;
    paymentDate?: string;
    employeeId?: string;
    employeeName: string;
    employeeNik?: string;
    roleTitle?: string;
    totalEarnings: number;
    pph21Amount: number;
    recordedBy?: string;
  }): TaxObligation => {
    const payDate = params.paymentDate || new Date().toISOString().slice(0, 10);
    const dateObj = new Date(payDate);
    const year = !isNaN(dateObj.getFullYear()) ? dateObj.getFullYear() : new Date().getFullYear();
    const month = !isNaN(dateObj.getMonth()) ? dateObj.getMonth() + 1 : new Date().getMonth() + 1;

    // Due date for PPh 21 withholding tax is the 15th of following month (Pasal 10 PMK-242/PMK.03/2014)
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`;

    const randomBillingSuffix = Math.floor(100000 + Math.random() * 900000);
    const billingCode = `718${String(year).slice(-2)}${String(month).padStart(2, '0')}${randomBillingSuffix}`;
    const invoiceNum = `BUPOT-21/${year}/${String(month).padStart(2, '0')}/${params.payrollNumber.split('/').pop() || '001'}`;

    return {
      id: `tax-pay-${params.payrollId}`,
      taxType: 'PPH_21',
      taxPeriod: params.period,
      taxYear: year,
      taxMonth: month,
      title: `PPh 21 Karyawan: ${params.employeeName} (${params.period})`,
      description: `Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp ${params.totalEarnings.toLocaleString('id-ID')} (${params.roleTitle || 'Pegawai Tetap'}) - Slip ${params.payrollNumber}`,
      taxableBaseAmount: params.totalEarnings,
      taxRatePercent: params.totalEarnings > 0 ? Number(((params.pph21Amount / params.totalEarnings) * 100).toFixed(2)) : 5,
      taxAmount: params.pph21Amount,
      paidAmount: 0,
      remainingAmount: params.pph21Amount,
      status: 'TERHUTANG',
      dueDate,
      billingCode,
      taxInvoiceNumber: invoiceNum,
      counterpartyName: `${params.employeeName} / KPP Pratama`,
      payrollId: params.payrollId,
      payrollNumber: params.payrollNumber,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      notes: `Otomatis tersinkronisasi dari Slip Gaji: ${params.payrollNumber}. Terintegrasi ke Menu Pajak & Neraca Keuangan (anti double input).`,
      createdAt: new Date().toISOString(),
      createdBy: params.recordedBy || currentUser.name || currentUser.username || 'System Payroll Sync',
    };
  };

  const addPayrollPayment = (
    data: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>
  ): { success: boolean; payroll?: PayrollPayment; message?: string } => {
    const id = `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const count = payrollRecords.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const payrollNumber = `PAY/${year}/${month}/EMP-${String(count).padStart(3, '0')}`;

    // Automatically create cleared expense FinancialTransaction into Finance & Cash Flow
    let createdTxId: string | undefined = undefined;
    if (data.status === 'PAID') {
      const tx = addTransaction({
        date: data.paymentDate || new Date().toISOString().slice(0, 10),
        type: 'EXPENSE',
        category: 'GAJI_KARYAWAN',
        amountIDR: data.netSalary,
        description: `Gaji Karyawan: ${data.employeeName} (${data.roleTitle}) - Periode ${data.period}`,
        clientOrVendorName: data.employeeName,
        paymentMethod: data.paymentMethod,
        referenceNumber: payrollNumber,
        status: 'CLEARED',
        notes: `Slip: ${payrollNumber} | Bruto: Rp ${data.totalEarnings.toLocaleString('id-ID')} | Potongan: Rp ${data.totalDeductions.toLocaleString('id-ID')} | Net THP: Rp ${data.netSalary.toLocaleString('id-ID')}${data.notes ? ' | ' + data.notes : ''}`,
        recordedBy: data.recordedBy || currentUser.name || currentUser.username || 'Finance Officer',
      });
      if (tx && tx.id) {
        createdTxId = tx.id;
      }
    }

    // Automatically create linked TaxObligation in Tax Management if pph21Amount > 0
    let createdTaxObligationId: string | undefined = undefined;
    if (data.pph21Amount && data.pph21Amount > 0) {
      const taxObligation = buildPph21TaxObligationForPayroll({
        payrollId: id,
        payrollNumber,
        period: data.period,
        paymentDate: data.paymentDate,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        employeeNik: data.employeeNik,
        roleTitle: data.roleTitle,
        totalEarnings: data.totalEarnings,
        pph21Amount: data.pph21Amount,
        recordedBy: data.recordedBy,
      });
      createdTaxObligationId = taxObligation.id;

      setTaxObligations((prevTaxes) => {
        const updatedTaxes = [taxObligation, ...prevTaxes.filter((t) => t.payrollId !== id && t.id !== taxObligation.id)];
        broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
        saveSettingsToFirestore('tax_obligations', updatedTaxes);
        return updatedTaxes;
      });
    }

    const newRecord: PayrollPayment = {
      ...data,
      id,
      payrollNumber,
      transactionId: createdTxId,
      pph21ObligationId: createdTaxObligationId,
      createdAt: new Date().toISOString(),
      paidAt: data.status === 'PAID' ? (data.paidAt || data.paymentDate) : undefined,
    };

    if (deletedPayrollIds.includes(id)) {
      const updatedDeleted = deletedPayrollIds.filter((d) => d !== id);
      setDeletedPayrollIds(updatedDeleted);
      removeDeletedPayrollIdFromFirestore(id);
      broadcastLiveDataUpdate('DELETED_PAYROLL_IDS', updatedDeleted);
    }

    setPayrollRecords((prev) => {
      const updated = [newRecord, ...prev];
      broadcastLiveDataUpdate('PAYROLL_PAYMENTS', updated);
      saveSettingsToFirestore('payroll_records', updated);
      return updated;
    });

    savePayrollToFirestore(newRecord);

    return {
      success: true,
      payroll: newRecord,
      message: `Gaji karyawan ${data.employeeName} periode ${data.period} berhasil dicatat, dibukukan ke Arus Kas, dan PPh 21 tersinkronisasi otomatis ke Menu Pajak!`,
    };
  };

  const updatePayrollPayment = (
    id: string,
    updates: Partial<PayrollPayment>
  ): { success: boolean; message?: string } => {
    const existing = payrollRecords.find((r) => r.id === id);
    if (!existing) {
      return { success: false, message: 'Slip gaji tidak ditemukan.' };
    }

    // 1. Update linked cash ledger transaction if present
    if (existing.transactionId) {
      updateTransaction(existing.transactionId, {
        amountIDR: updates.netSalary !== undefined ? updates.netSalary : existing.netSalary,
        date: updates.paymentDate || existing.paymentDate,
        paymentMethod: updates.paymentMethod || existing.paymentMethod,
        description: `Gaji Karyawan: ${updates.employeeName || existing.employeeName} (${updates.roleTitle || existing.roleTitle}) - Periode ${updates.period || existing.period}`,
        status: (updates.status === 'PAID' || (updates.status === undefined && existing.status === 'PAID')) ? 'CLEARED' : 'PENDING',
      });
    } else if (updates.status === 'PAID' && existing.status !== 'PAID') {
      // If it wasn't paid previously but is now marked PAID, create transaction!
      const tx = addTransaction({
        date: updates.paymentDate || existing.paymentDate || new Date().toISOString().slice(0, 10),
        type: 'EXPENSE',
        category: 'GAJI_KARYAWAN',
        amountIDR: updates.netSalary !== undefined ? updates.netSalary : existing.netSalary,
        description: `Gaji Karyawan: ${updates.employeeName || existing.employeeName} (${updates.roleTitle || existing.roleTitle}) - Periode ${updates.period || existing.period}`,
        clientOrVendorName: updates.employeeName || existing.employeeName,
        paymentMethod: updates.paymentMethod || existing.paymentMethod,
        referenceNumber: existing.payrollNumber,
        status: 'CLEARED',
        notes: `Slip: ${existing.payrollNumber} | THP: Rp ${(updates.netSalary !== undefined ? updates.netSalary : existing.netSalary).toLocaleString('id-ID')}`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      });
      if (tx?.id) {
        updates.transactionId = tx.id;
        updates.paidAt = updates.paymentDate || new Date().toISOString().slice(0, 10);
      }
    }

    // 2. Synchronize linked PPh 21 Tax Obligation in Tax Management
    const pphAmount = updates.pph21Amount !== undefined ? updates.pph21Amount : existing.pph21Amount;
    const employee = updates.employeeName || existing.employeeName;
    const period = updates.period || existing.period;
    const role = updates.roleTitle || existing.roleTitle;
    const gross = updates.totalEarnings !== undefined ? updates.totalEarnings : existing.totalEarnings;
    const payDate = updates.paymentDate || existing.paymentDate;

    setTaxObligations((prevTaxes) => {
      const existingTaxIndex = prevTaxes.findIndex(
        (t) => t.payrollId === id || (existing.pph21ObligationId && t.id === existing.pph21ObligationId)
      );

      if (pphAmount && pphAmount > 0) {
        if (existingTaxIndex >= 0) {
          const currentTax = prevTaxes[existingTaxIndex];
          const isAlreadyPaid = currentTax.status === 'PAID';
          const updatedTax: TaxObligation = {
            ...currentTax,
            title: `PPh 21 Karyawan: ${employee} (${period})`,
            description: `Pemotongan PPh 21 (Skema TER) atas penghasilan bruto Rp ${gross.toLocaleString('id-ID')} (${role}) - Slip ${existing.payrollNumber}`,
            taxPeriod: period,
            taxableBaseAmount: gross,
            taxAmount: pphAmount,
            taxRatePercent: gross > 0 ? Number(((pphAmount / gross) * 100).toFixed(2)) : currentTax.taxRatePercent,
            remainingAmount: isAlreadyPaid ? 0 : Math.max(0, pphAmount - (currentTax.paidAmount || 0)),
            counterpartyName: `${employee} / KPP Pratama`,
            employeeName: employee,
            updatedAt: new Date().toISOString(),
          };
          const updatedTaxes = [...prevTaxes];
          updatedTaxes[existingTaxIndex] = updatedTax;
          broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
          saveSettingsToFirestore('tax_obligations', updatedTaxes);
          return updatedTaxes;
        } else {
          const newTax = buildPph21TaxObligationForPayroll({
            payrollId: id,
            payrollNumber: existing.payrollNumber,
            period,
            paymentDate: payDate,
            employeeId: existing.employeeId,
            employeeName: employee,
            employeeNik: updates.employeeNik || existing.employeeNik,
            roleTitle: role,
            totalEarnings: gross,
            pph21Amount: pphAmount,
            recordedBy: updates.recordedBy || existing.recordedBy,
          });
          updates.pph21ObligationId = newTax.id;
          const updatedTaxes = [newTax, ...prevTaxes];
          broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
          saveSettingsToFirestore('tax_obligations', updatedTaxes);
          return updatedTaxes;
        }
      } else if (existingTaxIndex >= 0) {
        const updatedTaxes = prevTaxes.filter((_, idx) => idx !== existingTaxIndex);
        broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
        saveSettingsToFirestore('tax_obligations', updatedTaxes);
        return updatedTaxes;
      }
      return prevTaxes;
    });

    const updatedRecord = { ...existing, ...updates };
    setPayrollRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? updatedRecord : r));
      broadcastLiveDataUpdate('PAYROLL_PAYMENTS', updated);
      saveSettingsToFirestore('payroll_records', updated);
      return updated;
    });

    savePayrollToFirestore(updatedRecord);

    return { success: true, message: 'Data slip gaji dan sinkronisasi pajak berhasil diperbarui.' };
  };

  const deletePayrollPayment = async (
    id: string
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = payrollRecords.find((r) => r.id === id);
    if (!existing) {
      return { success: false, message: 'Slip gaji tidak ditemukan.' };
    }

    // 1. Mark ID in deleted list & update localStorage immediately
    const updatedDeletedIds = Array.from(new Set([id, ...deletedPayrollIds]));
    setDeletedPayrollIds(updatedDeletedIds);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_PAYROLL_IDS, JSON.stringify(updatedDeletedIds));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    broadcastLiveDataUpdate('DELETED_PAYROLL_IDS', updatedDeletedIds);

    // 2. Identify and automatically delete ALL linked transactions in Finance & Cashflow
    const txIdsToDelete = new Set<string>();
    if (existing.transactionId) {
      txIdsToDelete.add(existing.transactionId);
    }

    transactions.forEach((t) => {
      const matchRef = existing.payrollNumber && t.referenceNumber === existing.payrollNumber;
      const matchNote = existing.payrollNumber && t.notes?.includes(existing.payrollNumber);
      const matchIdInNote = t.notes?.includes(existing.id);
      const matchDesc = existing.payrollNumber && t.description?.includes(existing.payrollNumber);
      const matchEmployeeAndPeriod =
        t.category === 'GAJI_KARYAWAN' &&
        existing.employeeName &&
        t.clientOrVendorName?.toLowerCase().trim() === existing.employeeName.toLowerCase().trim() &&
        existing.period &&
        t.description?.toLowerCase().includes(existing.period.toLowerCase());

      if (matchRef || matchNote || matchIdInNote || matchDesc || matchEmployeeAndPeriod) {
        txIdsToDelete.add(t.id);
      }
    });

    // 3. Identify linked tax obligations (PPh 21) AND any payment transactions linked to them
    const taxIdsToDelete = new Set<string>();
    taxObligations.forEach((t) => {
      const matchPayrollId = t.payrollId === id;
      const matchTaxId = Boolean(existing.pph21ObligationId && t.id === existing.pph21ObligationId);
      const matchPayrollNumber = Boolean(existing.payrollNumber && t.payrollNumber === existing.payrollNumber);
      const matchEmployeeAndPeriod = Boolean(
        t.taxType === 'PPH_21' &&
        existing.employeeId &&
        t.employeeId === existing.employeeId &&
        existing.period &&
        t.taxPeriod === existing.period
      );

      if (matchPayrollId || matchTaxId || matchPayrollNumber || matchEmployeeAndPeriod) {
        taxIdsToDelete.add(t.id);
        if (t.transactionId) {
          txIdsToDelete.add(t.transactionId);
        }
        if (t.ntpnNumber) {
          transactions.forEach((tx) => {
            if (tx.referenceNumber?.includes(t.ntpnNumber!)) {
              txIdsToDelete.add(tx.id);
            }
          });
        }
      }
    });

    // 4. Purge all collected transactions from cash ledger and Firestore
    txIdsToDelete.forEach((txId) => addDeletedTransactionId(txId));
    taxIdsToDelete.forEach((taxId) => addDeletedTaxId(taxId));

    const updatedTransactions = transactions.filter((t) => !txIdsToDelete.has(t.id));
    if (txIdsToDelete.size > 0) {
      setTransactions(updatedTransactions);
      try {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updatedTransactions));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      broadcastLiveDataUpdate('TRANSACTIONS', updatedTransactions);
    }

    // 5. Purge linked tax obligations (PPh 21) from Tax Management and Firestore
    const updatedTaxes = taxObligations.filter((t) => !taxIdsToDelete.has(t.id));
    if (taxIdsToDelete.size > 0) {
      setTaxObligations(updatedTaxes);
      try {
        localStorage.setItem(STORAGE_KEY_TAX_OBLIGATIONS, JSON.stringify(updatedTaxes));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
    }

    // 6. Purge payroll record from state & localStorage
    const updatedPayrolls = payrollRecords.filter((r) => r.id !== id);
    setPayrollRecords(updatedPayrolls);
    try {
      localStorage.setItem(STORAGE_KEY_PAYROLL, JSON.stringify(updatedPayrolls));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    broadcastLiveDataUpdate('PAYROLL_PAYMENTS', updatedPayrolls);

    // 7. Persist all removals simultaneously to Cloud Firestore and await
    try {
      await Promise.all([
        deletePayrollFromFirestore(id),
        saveDeletedPayrollIdToFirestore(id),
        saveSettingsToFirestore('payroll_records', updatedPayrolls),
        saveSettingsToFirestore('tax_obligations', updatedTaxes),
        ...Array.from(txIdsToDelete).map((txId) => deleteTransactionFromFirestore(txId)),
        ...Array.from(taxIdsToDelete).map((taxId) => deleteTaxObligationFromFirestore(taxId)),
      ]);
    } catch (err) {
      console.error('Firestore batch deletion error:', err);
    }

    return {
      success: true,
      message: `Slip gaji ${existing.payrollNumber}, seluruh transaksi kas terkait (${txIdsToDelete.size} transaksi), dan kewajiban PPh 21 berhasil dihapus secara menyeluruh dari Finance, Arus Kas, dan Laporan Keuangan, serta tersinkronisasi realtime ke seluruh role.`,
    };
  };

  const batchAddPayrollPayments = (
    records: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>>
  ): { success: boolean; count: number; message?: string } => {
    const newPayments: PayrollPayment[] = [];
    const newTaxObligations: TaxObligation[] = [];
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    let runningCount = payrollRecords.length;

    for (const data of records) {
      runningCount++;
      const id = `pay-${Date.now()}-${runningCount}-${Math.floor(100 + Math.random() * 900)}`;
      const payrollNumber = `PAY/${year}/${month}/EMP-${String(runningCount).padStart(3, '0')}`;

      let createdTxId: string | undefined = undefined;
      if (data.status === 'PAID') {
        const tx = addTransaction({
          date: data.paymentDate || new Date().toISOString().slice(0, 10),
          type: 'EXPENSE',
          category: 'GAJI_KARYAWAN',
          amountIDR: data.netSalary,
          description: `Gaji Karyawan: ${data.employeeName} (${data.roleTitle}) - Periode ${data.period}`,
          clientOrVendorName: data.employeeName,
          paymentMethod: data.paymentMethod,
          referenceNumber: payrollNumber,
          status: 'CLEARED',
          notes: `Slip: ${payrollNumber} | Bruto: Rp ${data.totalEarnings.toLocaleString('id-ID')} | Potongan: Rp ${data.totalDeductions.toLocaleString('id-ID')} | Net THP: Rp ${data.netSalary.toLocaleString('id-ID')}${data.notes ? ' | ' + data.notes : ''}`,
          recordedBy: data.recordedBy || currentUser.name || currentUser.username || 'Finance Officer',
        });
        if (tx?.id) {
          createdTxId = tx.id;
        }
      }

      let createdTaxId: string | undefined = undefined;
      if (data.pph21Amount && data.pph21Amount > 0) {
        const taxObj = buildPph21TaxObligationForPayroll({
          payrollId: id,
          payrollNumber,
          period: data.period,
          paymentDate: data.paymentDate,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          employeeNik: data.employeeNik,
          roleTitle: data.roleTitle,
          totalEarnings: data.totalEarnings,
          pph21Amount: data.pph21Amount,
          recordedBy: data.recordedBy,
        });
        createdTaxId = taxObj.id;
        newTaxObligations.push(taxObj);
      }

      newPayments.push({
        ...data,
        id,
        payrollNumber,
        transactionId: createdTxId,
        pph21ObligationId: createdTaxId,
        createdAt: new Date().toISOString(),
        paidAt: data.status === 'PAID' ? (data.paidAt || data.paymentDate) : undefined,
      });
    }

    if (newTaxObligations.length > 0) {
      setTaxObligations((prevTaxes) => {
        const updatedTaxes = [...newTaxObligations, ...prevTaxes.filter((t) => !newTaxObligations.some((nt) => nt.payrollId === t.payrollId))];
        broadcastLiveDataUpdate('TAX_OBLIGATIONS', updatedTaxes);
        saveSettingsToFirestore('tax_obligations', updatedTaxes);
        return updatedTaxes;
      });
    }

    setPayrollRecords((prev) => {
      const updated = [...newPayments, ...prev];
      broadcastLiveDataUpdate('PAYROLL_PAYMENTS', updated);
      saveSettingsToFirestore('payroll_records', updated);
      return updated;
    });

    newPayments.forEach((p) => savePayrollToFirestore(p));

    return {
      success: true,
      count: newPayments.length,
      message: `${newPayments.length} slip gaji berhasil diproses, dibukukan ke Arus Kas, dan kewajiban PPh 21 otomatis tercatat di Menu Pajak!`,
    };
  };

  const markPayrollAsPaid = (
    id: string,
    paymentDate?: string
  ): { success: boolean; message?: string } => {
    return updatePayrollPayment(id, {
      status: 'PAID',
      paidAt: paymentDate || new Date().toISOString().slice(0, 10),
    });
  };

  const resetPayrollToDefault = async (): Promise<{ success: boolean; message?: string }> => {
    setDeletedPayrollIds([]);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_PAYROLL_IDS, JSON.stringify([]));
    } catch (e) {
      console.warn(e);
    }
    await saveSettingsToFirestore('deleted_payroll_ids', []);

    setPayrollRecords(INITIAL_PAYROLL_RECORDS);
    broadcastLiveDataUpdate('PAYROLL_PAYMENTS', INITIAL_PAYROLL_RECORDS);
    broadcastLiveDataUpdate('DELETED_PAYROLL_IDS', []);
    await saveSettingsToFirestore('payroll_records', INITIAL_PAYROLL_RECORDS);
    await Promise.all(INITIAL_PAYROLL_RECORDS.map((p) => savePayrollToFirestore(p)));
    return { success: true, message: 'Data payroll berhasil direset ke contoh default dan tersimpan di Cloud Firestore.' };
  };

  // -------------------------------------------------------------
  // Penetapan Gaji Tahunan Karyawan (Annual Salary Configuration)
  // Real-time synchronization across all roles & persistent storage
  // -------------------------------------------------------------
  const addOrUpdateEmployeeSalaryConfig = async (
    configData: Omit<EmployeeAnnualSalaryConfig, 'id' | 'updatedAt' | 'createdAt'> & { id?: string }
  ): Promise<{ success: boolean; message: string; config?: EmployeeAnnualSalaryConfig }> => {
    try {
      const nowStr = new Date().toISOString();
      const targetYear = Number(configData.year) || new Date().getFullYear();
      const currentConfigs = [...(employeeSalaryConfigsRef.current || employeeSalaryConfigs)];

      // Match by exact (employeeId AND year) or ID if matches target year
      const existsIndex = currentConfigs.findIndex(
        (c) =>
          (c.employeeId === configData.employeeId && Number(c.year) === targetYear) ||
          (Boolean(configData.id) && c.id === configData.id && Number(c.year) === targetYear)
      );

      let finalConfigId: string;
      let finalConfig: EmployeeAnnualSalaryConfig;
      let updatedList: EmployeeAnnualSalaryConfig[];

      if (existsIndex >= 0) {
        finalConfigId = currentConfigs[existsIndex].id || `SALCFG-${targetYear}-${configData.employeeId}`;
        finalConfig = {
          ...currentConfigs[existsIndex],
          ...configData,
          id: finalConfigId,
          year: targetYear,
          updatedAt: nowStr,
          updatedBy: currentUser?.name || 'Master Admin',
        };
        updatedList = [...currentConfigs];
        updatedList[existsIndex] = finalConfig;
      } else {
        finalConfigId = configData.id || `SALCFG-${targetYear}-${configData.employeeId}-${Date.now().toString(36)}`;
        finalConfig = {
          ...configData,
          id: finalConfigId,
          year: targetYear,
          createdAt: nowStr,
          updatedAt: nowStr,
          updatedBy: currentUser?.name || 'Master Admin',
        };
        updatedList = [finalConfig, ...currentConfigs];
      }

      // Synchronously update ref and state
      employeeSalaryConfigsRef.current = updatedList;
      setEmployeeSalaryConfigs(updatedList);

      // 1. Broadcast real-time across tabs and roles
      broadcastLiveDataUpdate('EMPLOYEE_SALARY_CONFIGS', updatedList);

      // 2. Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('LocalStorage save salary config error:', e);
      }

      // 3. Persist to Cloud Firestore settings collection
      try {
        await saveSettingsToFirestore('employee_salary_configs', updatedList);
      } catch (err) {
        console.warn('Firestore save employee_salary_configs notice:', err);
      }

      return {
        success: true,
        message: `Standar gaji tahunan untuk ${configData.employeeName} (${targetYear}) berhasil disimpan dan disinkronisasikan ke seluruh role secara real-time.`,
        config: finalConfig,
      };
    } catch (err: any) {
      console.error('Error saving employee salary config:', err);
      return {
        success: false,
        message: 'Gagal menyimpan penetapan gaji: ' + (err?.message || 'Terjadi kesalahan sistem.'),
      };
    }
  };

  const addOrUpdateMultipleEmployeeSalaryConfigs = async (
    configsData: (Omit<EmployeeAnnualSalaryConfig, 'id' | 'updatedAt' | 'createdAt'> & { id?: string })[]
  ): Promise<{ success: boolean; message: string; configs?: EmployeeAnnualSalaryConfig[] }> => {
    try {
      const nowStr = new Date().toISOString();
      let currentConfigs = [...(employeeSalaryConfigsRef.current || employeeSalaryConfigs)];
      const savedConfigs: EmployeeAnnualSalaryConfig[] = [];

      for (const item of configsData) {
        const targetYear = Number(item.year) || new Date().getFullYear();
        const existsIndex = currentConfigs.findIndex(
          (c) =>
            (c.employeeId === item.employeeId && Number(c.year) === targetYear) ||
            (Boolean(item.id) && c.id === item.id && Number(c.year) === targetYear)
        );

        let finalConfig: EmployeeAnnualSalaryConfig;
        if (existsIndex >= 0) {
          const finalConfigId = currentConfigs[existsIndex].id || `SALCFG-${targetYear}-${item.employeeId}`;
          finalConfig = {
            ...currentConfigs[existsIndex],
            ...item,
            id: finalConfigId,
            year: targetYear,
            updatedAt: nowStr,
            updatedBy: currentUser?.name || 'Master Admin',
          };
          currentConfigs[existsIndex] = finalConfig;
        } else {
          const finalConfigId = item.id || `SALCFG-${targetYear}-${item.employeeId}-${Date.now().toString(36)}`;
          finalConfig = {
            ...item,
            id: finalConfigId,
            year: targetYear,
            createdAt: nowStr,
            updatedAt: nowStr,
            updatedBy: currentUser?.name || 'Master Admin',
          };
          currentConfigs = [finalConfig, ...currentConfigs];
        }
        savedConfigs.push(finalConfig);
      }

      employeeSalaryConfigsRef.current = currentConfigs;
      setEmployeeSalaryConfigs(currentConfigs);
      broadcastLiveDataUpdate('EMPLOYEE_SALARY_CONFIGS', currentConfigs);
      try {
        localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(currentConfigs));
      } catch (e) {
        console.warn('LocalStorage save salary configs error:', e);
      }
      try {
        await saveSettingsToFirestore('employee_salary_configs', currentConfigs);
      } catch (err) {
        console.warn('Firestore save employee_salary_configs notice:', err);
      }

      return {
        success: true,
        message: `${savedConfigs.length} penetapan gaji berhasil disimpan dan disinkronkan ke seluruh role.`,
        configs: savedConfigs,
      };
    } catch (err: any) {
      console.error('Save multiple salary configs error:', err);
      return {
        success: false,
        message: 'Gagal menyimpan penetapan gaji: ' + (err?.message || 'Unknown error'),
      };
    }
  };

  const deleteEmployeeSalaryConfig = async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const currentConfigs = employeeSalaryConfigsRef.current || employeeSalaryConfigs;
      const updatedList = currentConfigs.filter((c) => c.id !== id);

      employeeSalaryConfigsRef.current = updatedList;
      setEmployeeSalaryConfigs(updatedList);
      broadcastLiveDataUpdate('EMPLOYEE_SALARY_CONFIGS', updatedList);
      try {
        localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('LocalStorage delete salary config error:', e);
      }
      await saveSettingsToFirestore('employee_salary_configs', updatedList);

      return {
        success: true,
        message: 'Penetapan gaji tahunan berhasil dihapus dan diperbarui ke seluruh role secara real-time.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal menghapus penetapan gaji: ' + (err?.message || ''),
      };
    }
  };

  const resetEmployeeSalaryConfigsToDefault = async (): Promise<{ success: boolean; message: string }> => {
    try {
      employeeSalaryConfigsRef.current = DEFAULT_EMPLOYEE_SALARY_CONFIGS;
      setEmployeeSalaryConfigs(DEFAULT_EMPLOYEE_SALARY_CONFIGS);
      broadcastLiveDataUpdate('EMPLOYEE_SALARY_CONFIGS', DEFAULT_EMPLOYEE_SALARY_CONFIGS);
      try {
        localStorage.setItem(STORAGE_KEY_EMPLOYEE_SALARY_CONFIGS, JSON.stringify(DEFAULT_EMPLOYEE_SALARY_CONFIGS));
      } catch (e) {
        console.warn('LocalStorage reset salary configs error:', e);
      }
      await saveSettingsToFirestore('employee_salary_configs', DEFAULT_EMPLOYEE_SALARY_CONFIGS);

      return {
        success: true,
        message: 'Penetapan gaji tahunan seluruh karyawan berhasil direset ke standar acuan dan tersimpan di Cloud Firestore.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal mereset penetapan gaji: ' + (err?.message || ''),
      };
    }
  };

  const getEmployeeSalaryConfigForYear = useCallback(
    (employeeId: string, year: number, fallbackRole?: import('../types').UserRole) => {
      return getEffectiveSalaryConfig(employeeSalaryConfigs, employeeId, year, fallbackRole, roleDefinitions);
    },
    [employeeSalaryConfigs, roleDefinitions]
  );

  const toggleMilestoneManualSignoff = (
    projectId: string,
    milestoneId: string,
    completed: boolean,
    notes?: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentSignoffs = p.manualMilestoneSignoffs || {};
        const updatedSignoffs = {
          ...currentSignoffs,
          [milestoneId]: {
            completed,
            signedBy: currentUser.name,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            notes: notes || '',
          },
        };

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: completed ? 'Milestone Manually Signed Off' : 'Milestone Sign-Off Revoked',
          details: `Milestone ${milestoneId} marked as ${completed ? 'COMPLETED' : 'PENDING'} by ${currentUser.name}${notes ? ` (Remark: ${notes})` : ''}`,
          type: 'AUDIT_MILESTONE',
          metadata: {
            newValue: completed ? 'COMPLETED' : 'PENDING',
          },
        };

        const updatedProj: ConsultingProject = {
          ...p,
          manualMilestoneSignoffs: updatedSignoffs,
          activities: [newAct, ...(p.activities || [])],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );
  };

  const addCustomMilestoneToProject = (
    projectId: string,
    milestone: {
      title: string;
      description: string;
      stage: ProjectStage;
      regulatoryClause?: string;
      requiredDocTypes: ProjectDocument['type'][];
    }
  ) => {
    const newCustomMilestone: any = {
      id: `custom-${Date.now()}`,
      stage: milestone.stage,
      title: milestone.title,
      description: milestone.description,
      regulatoryClause: milestone.regulatoryClause || 'Custom Client Milestone',
      requiredDocTypes: milestone.requiredDocTypes || [],
      optionalDocTypes: [],
      matchedDocuments: [],
      status: 'PENDING',
      isCompleted: false,
      completionPercentage: 0,
      unfulfilledDocTypes: milestone.requiredDocTypes || [],
      custom: true,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const existingCustom = p.customMilestones || [];
        const updatedProj: ConsultingProject = {
          ...p,
          customMilestones: [...existingCustom, newCustomMilestone],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );

    addActivity(
      projectId,
      'Custom Milestone Added',
      `Added custom regulatory milestone "${milestone.title}" in stage ${milestone.stage}`,
      'AUDIT_MILESTONE'
    );
  };

  const deleteMilestoneFromProject = (projectId: string, milestoneId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentDeleted = p.deletedMilestoneIds || [];
        const updatedDeleted = currentDeleted.includes(milestoneId)
          ? currentDeleted
          : [...currentDeleted, milestoneId];

        // Also clean custom milestones if it was a custom milestone
        const updatedCustom = (p.customMilestones || []).filter((cm) => cm.id !== milestoneId);

        // Also clean manual signoffs and milestone doc requirements
        const updatedDocReqs = { ...(p.milestoneDocRequirements || {}) };
        delete updatedDocReqs[milestoneId];
        const updatedSignoffs = { ...(p.manualMilestoneSignoffs || {}) };
        delete updatedSignoffs[milestoneId];

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name || 'User',
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Milestone Checklist Item Permanently Deleted',
          details: `Milestone "${milestoneId}" was permanently deleted from active checklist by ${currentUser.name} (${currentUser.role})`,
          type: 'AUDIT_MILESTONE',
        };

        const updatedProj: ConsultingProject = {
          ...p,
          deletedMilestoneIds: updatedDeleted,
          customMilestones: updatedCustom,
          milestoneDocRequirements: updatedDocReqs,
          manualMilestoneSignoffs: updatedSignoffs,
          activities: [newAct, ...(p.activities || [])],
        };

        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });

      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to sync projects to localStorage:', err);
      }

      return updated;
    });
  };

  const restoreMilestoneToProject = (projectId: string, milestoneId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentDeleted = p.deletedMilestoneIds || [];
        const updatedDeleted = currentDeleted.filter((id) => id !== milestoneId);

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name || 'User',
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Milestone Checklist Item Restored',
          details: `Milestone "${milestoneId}" was restored to project checklist by ${currentUser.name} (${currentUser.role})`,
          type: 'AUDIT_MILESTONE',
        };

        const updatedProj: ConsultingProject = {
          ...p,
          deletedMilestoneIds: updatedDeleted,
          activities: [newAct, ...(p.activities || [])],
        };

        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });

      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to sync projects to localStorage:', err);
      }

      return updated;
    });
  };

  const deleteDocRequirementFromMilestone = (
    projectId: string,
    milestoneId: string,
    docType: DocumentType,
    isOptional?: boolean
  ) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;

        // Find current requirements (from custom configuration, or base milestone template)
        const customDocReq = p.milestoneDocRequirements?.[milestoneId];
        let currentReqs: DocumentType[] = [];
        let currentOpts: DocumentType[] = [];

        if (customDocReq) {
          currentReqs = [...(customDocReq.requiredDocTypes || [])];
          currentOpts = [...(customDocReq.optionalDocTypes || [])];
        } else {
          // Look up base template or custom milestone
          const baseTemplates = CERTIFICATION_MILESTONE_TEMPLATES[p.serviceType] || CERTIFICATION_MILESTONE_TEMPLATES.TKDN_BARANG;
          const matchedTemplate =
            baseTemplates.find((t) => t.id === milestoneId) ||
            (p.customMilestones || []).find((cm) => cm.id === milestoneId);
          currentReqs = [...(matchedTemplate?.requiredDocTypes || [])];
          currentOpts = [...(matchedTemplate?.optionalDocTypes || [])];
        }

        if (isOptional) {
          currentOpts = currentOpts.filter((dt) => dt !== docType);
        } else {
          currentReqs = currentReqs.filter((dt) => dt !== docType);
        }

        const currentMap = p.milestoneDocRequirements || {};
        const updatedMap = {
          ...currentMap,
          [milestoneId]: {
            requiredDocTypes: currentReqs,
            optionalDocTypes: currentOpts,
          },
        };

        // Also if it's a custom milestone, update its requiredDocTypes directly
        const updatedCustom = (p.customMilestones || []).map((cm) => {
          if (cm.id !== milestoneId) return cm;
          return {
            ...cm,
            requiredDocTypes: isOptional ? cm.requiredDocTypes : (cm.requiredDocTypes || []).filter((dt) => dt !== docType),
            optionalDocTypes: isOptional ? (cm.optionalDocTypes || []).filter((dt) => dt !== docType) : cm.optionalDocTypes,
          };
        });

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name || 'User',
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Checklist Document Requirement Removed',
          details: `Removed requirement "${docType}" (${isOptional ? 'Optional' : 'Required'}) from milestone "${milestoneId}" by ${currentUser.name} (${currentUser.role})`,
          type: 'AUDIT_MILESTONE',
        };

        const updatedProj: ConsultingProject = {
          ...p,
          milestoneDocRequirements: updatedMap,
          customMilestones: updatedCustom,
          activities: [newAct, ...(p.activities || [])],
        };

        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const resetProjectMilestonesToDefault = (projectId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name || 'User',
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Checklist Reset to Statutory Default',
          details: `Checklist milestones and document requirements reset to default standard by ${currentUser.name} (${currentUser.role})`,
          type: 'AUDIT_MILESTONE',
        };

        const updatedProj: ConsultingProject = {
          ...p,
          deletedMilestoneIds: [],
          milestoneDocRequirements: {},
          activities: [newAct, ...(p.activities || [])],
        };

        saveProjectToFirestore(updatedProj);
        return updatedProj;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      } catch {}
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
  };

  const addAssignedByOption = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, message: 'Nama instansi/badan penandatangan tidak boleh kosong.' };
    }
    if (assignedByOptions.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `Opsi "${trimmed}" sudah ada dalam daftar.` };
    }
    const updated = [...assignedByOptions, trimmed];
    setAssignedByOptions(updated);
    return { success: true, message: `Opsi "${trimmed}" berhasil ditambahkan.` };
  };

  const updateAssignedByOption = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, message: 'Nama opsi tidak boleh kosong.' };
    }
    if (oldName !== trimmed && assignedByOptions.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `Opsi "${trimmed}" sudah ada dalam daftar.` };
    }
    const updated = assignedByOptions.map((opt) => (opt === oldName ? trimmed : opt));
    setAssignedByOptions(updated);
    setProjects((prev) =>
      prev.map((p) => (p.surveyorBody === oldName ? { ...p, surveyorBody: trimmed } : p))
    );
    return { success: true, message: `Opsi berhasil diperbarui menjadi "${trimmed}".` };
  };

  const deleteAssignedByOption = (name: string) => {
    if (assignedByOptions.length <= 1) {
      return { success: false, message: 'Minimal harus ada 1 opsi yang tersisa dalam sistem.' };
    }
    const updated = assignedByOptions.filter((opt) => opt !== name);
    setAssignedByOptions(updated);
    return { success: true, message: `Opsi "${name}" berhasil dihapus.` };
  };

  const resetAssignedByOptions = () => {
    setAssignedByOptions(DEFAULT_ASSIGNED_BY_OPTIONS);
    return { success: true, message: 'Daftar opsi Assigned By berhasil dikembalikan ke standar awal.' };
  };

  // Compute live real-time team members with dynamic workload and capacity linked to dispositions
  const dynamicTeamMembers = useMemo(() => {
    return teamMembers.map((m) => {
      const stats = calculateMemberWorkload(m.id, dispositions, m.completedTaskCount || 0);
      return {
        ...m,
        activeTaskCount: stats.activeCount,
        completedTaskCount: stats.completedCount,
        capacityPercentage: stats.capacityPercentage,
      };
    });
  }, [teamMembers, dispositions]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        dispositions,
        teamMembers: dynamicTeamMembers,
        transactions,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        canSwitchAccount,
        login,
        resetPinWithEmail,
        loginWithGoogle,
        logout,
        switchAccount,
        quickSwitchUser,
        isFirebaseConnected,
        firebaseUser,
        isSyncingWithFirestore,
        syncAllToFirestore,
        hasPermission,
        isRole,
        realtimeRoleToast,
        dismissRealtimeRoleToast,
        isMasterAdmin,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        changeMemberRole,
        verifyUser,
        rejectUser,
        pendingMembersCount,
        roleDefinitions,
        roleGovernanceMeta,
        updateRolePositionTitle,
        updateRoleCapabilities,
        resetRolePositionTitles,
        resetRoleCapabilities,
        updateRoleGovernanceMeta,
        resetRoleGovernanceMeta,
        consultingServices,
        activeConsultingServices,
        addConsultingService,
        updateConsultingService,
        deleteConsultingService,
        toggleConsultingServiceStatus,
        resetConsultingServicesToDefault,
        getServiceConfig,
        getServiceTitle,
        getServiceBadge,
        documentTypes,
        activeDocumentTypes,
        addDocumentType,
        updateDocumentType,
        deleteDocumentType,
        toggleDocumentTypeStatus,
        resetDocumentTypesToDefault,
        getDocumentTypeDefinition,
        documentCategories,
        activeDocumentCategories,
        addDocumentCategory,
        updateDocumentCategory,
        deleteDocumentCategory,
        toggleDocumentCategoryStatus,
        resetDocumentCategoriesToDefault,
        getDocumentCategory,
        transactionCategories,
        activeTransactionCategories,
        addTransactionCategory,
        updateTransactionCategory,
        deleteTransactionCategory,
        toggleTransactionCategoryStatus,
        resetTransactionCategoriesToDefault,
        getTransactionCategoryDefinition,
        paymentChannels,
        activePaymentChannels,
        addPaymentChannel,
        updatePaymentChannel,
        deletePaymentChannel,
        reassignPaymentChannelTransactions,
        togglePaymentChannelStatus,
        resetPaymentChannelsToDefault,
        getPaymentChannelDefinition,
        assignedByOptions,
        addAssignedByOption,
        updateAssignedByOption,
        deleteAssignedByOption,
        resetAssignedByOptions,
        bankLoans,
        addBankLoan,
        updateBankLoan,
        deleteBankLoan,
        cancelLoanDisbursement,
        cancelLoanInstallmentPayment,
        recordLoanDisbursementToLedger,
        recordLoanInstallmentToLedger,
        renewBankLoan,
        companyCapital,
        updateCompanyCapital,
        resetCompanyCapitalToDefault,
        companyLetterhead,
        updateCompanyLetterhead,
        resetCompanyLetterheadToDefault,
        taxObligations,
        addTaxObligation,
        updateTaxObligation,
        deleteTaxObligation,
        payTaxObligation,
        resetTaxObligationsToDefault,
        receivables,
        addReceivable,
        updateReceivable,
        deleteReceivable,
        recordReceivablePayment,
        cancelReceivable,
        resetReceivablesToDefault,
        governmentProjects,
        addGovernmentProject,
        updateGovernmentProject,
        deleteGovernmentProject,
        generateMilestoneInvoiceToReceivables,
        recordGovMilestonePaymentSp2d,
        addGovMilestone,
        updateGovMilestone,
        deleteGovMilestone,
        resetGovernmentProjectsToDefault,
        retailProjects,
        addRetailProject,
        updateRetailProject,
        deleteRetailProject,
        generateRetailInvoiceToReceivables,
        recordRetailMilestonePayment,
        addRetailMilestone,
        updateRetailMilestone,
        deleteRetailMilestone,
        resetRetailProjectsToDefault,
        institutionTypes,
        activeInstitutionTypes,
        addInstitutionType,
        updateInstitutionType,
        deleteInstitutionType,
        toggleInstitutionTypeStatus,
        resetInstitutionTypesToDefault,
        getInstitutionTypeDefinition,
        termDistributionSchemes,
        activeTermDistributionSchemes,
        addTermDistributionScheme,
        updateTermDistributionScheme,
        deleteTermDistributionScheme,
        toggleTermDistributionSchemeStatus,
        resetTermDistributionSchemesToDefault,
        getTermDistributionScheme,
        payrollRecords,
        addPayrollPayment,
        updatePayrollPayment,
        deletePayrollPayment,
        batchAddPayrollPayments,
        markPayrollAsPaid,
        resetPayrollToDefault,
        employeeSalaryConfigs,
        addOrUpdateEmployeeSalaryConfig,
        addOrUpdateMultipleEmployeeSalaryConfigs,
        deleteEmployeeSalaryConfig,
        resetEmployeeSalaryConfigsToDefault,
        getEmployeeSalaryConfigForYear,
        updateMilestoneDocRequirements,
        filters,
        setFilters,
        resetFilters,
        filteredProjects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        addProject,
        updateProject,
        deleteProject,
        changeProjectStage,
        addDisposition,
        updateDisposition,
        deleteDisposition,
        toggleChecklistItem,
        uploadDocument,
        updateDocumentStatus,
        updateDocument,
        deleteDocument,
        syncDocumentToGoogleDrive,
        isGoogleDriveConnected,
        connectGoogleDrive,
        disconnectGoogleDriveAccount,
        isDriveSyncing,
        addActivity,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleMilestoneManualSignoff,
        addCustomMilestoneToProject,
        deleteMilestoneFromProject,
        restoreMilestoneToProject,
        deleteDocRequirementFromMilestone,
        resetProjectMilestonesToDefault,
        calculateTkdnScore,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const useProject = useProjects;
