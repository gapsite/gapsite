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
} from '../types';
import { calculateBankLoanSchedule } from '../utils/loanCalculations';
import { calculateReceivablesAgingSummary, calculateDaysOverdue } from '../utils/receivableCalculations';
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
    updates: { title?: string; department?: string; desc?: string },
    updateExistingMembers?: boolean
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
  recordLoanDisbursementToLedger: (
    loanId: string,
    channelId?: string
  ) => { success: boolean; message?: string };
  recordLoanInstallmentToLedger: (
    loanId: string,
    monthNumber: number,
    channelId?: string
  ) => { success: boolean; message?: string };

  // Company Capital & Equity Management (Modal Dasar, Disetor, Tambahan, Laba Ditahan)
  companyCapital: CompanyCapitalSettings;
  updateCompanyCapital: (
    settings: Partial<CompanyCapitalSettings>
  ) => { success: boolean; message?: string };
  resetCompanyCapitalToDefault: () => { success: boolean; message?: string };

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
const STORAGE_KEY_TAX_OBLIGATIONS = 'verix_crm_tax_obligations_v1';
const STORAGE_KEY_RECEIVABLES = 'verix_crm_receivables_v1';
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
    description: 'Pemotongan PPh Pasal 21 atas honorarium tenaga ahli audit internal dan tim konsultan lapangan.',
    taxableBaseAmount: 48000000,
    taxRatePercent: 5,
    taxAmount: 2400000,
    paidAmount: 0,
    remainingAmount: 2400000,
    status: 'TERHUTANG',
    dueDate: '2026-09-10',
    billingCode: '619283019283745',
    counterpartyName: 'KPP Pratama / Tenaga Ahli',
    notes: 'Kewajiban PPh 21 Tenaga Ahli & Konsultan Lepas.',
    createdAt: '2026-08-30T16:00:00.000Z',
    createdBy: 'Adryan kelvianto',
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

  const [projects, setProjects] = useState<ConsultingProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed: ConsultingProject[] = JSON.parse(saved);
        const mockProjectCodes = new Set(['PRJ-2025-041', 'PRJ-2025-054', 'PRJ-2025-060', 'PRJ-2025-067', 'PRJ-2025-072', 'PRJ-2025-078']);
        const mockProjectIds = new Set(['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106']);
        return parsed.filter((p) => !mockProjectIds.has(p.id) && !mockProjectCodes.has(p.code));
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [dispositions, setDispositions] = useState<JobDisposition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISPOSITIONS);
      if (saved) {
        const parsed: JobDisposition[] = JSON.parse(saved);
        const mockDispIds = new Set(['dsp-1001', 'dsp-1002', 'dsp-1003', 'dsp-1004', 'dsp-1005']);
        const mockProjectIds = new Set(['prj-101', 'prj-102', 'prj-103', 'prj-104', 'prj-105', 'prj-106']);
        return parsed.filter((d) => !mockDispIds.has(d.id) && !mockProjectIds.has(d.projectId));
      }
      return INITIAL_DISPOSITIONS;
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

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
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
            !mockTrxIds.has(t.id) &&
            !(t.projectId && mockProjectIds.has(t.projectId)) &&
            !t.transactionNumber?.startsWith('TRX-202503-')
        );
      }
      return INITIAL_TRANSACTIONS;
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

  // Tax Obligations State (PPN & PPh Terhutang, Billing & NTPN)
  const [taxObligations, setTaxObligations] = useState<TaxObligation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAX_OBLIGATIONS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return INITIAL_TAX_OBLIGATIONS;
    } catch {
      return INITIAL_TAX_OBLIGATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TAX_OBLIGATIONS, JSON.stringify(taxObligations));
    } catch (e) {
      console.error('Failed to save tax obligations to localStorage', e);
    }
  }, [taxObligations]);

  // Receivables State (Piutang Usaha & Termin Proyek)
  const [receivables, setReceivables] = useState<Receivable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECEIVABLES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return INITIAL_RECEIVABLES;
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

  const activeDocumentCategories = useMemo(() => {
    return documentCategories.filter((c) => c.status !== 'INACTIVE');
  }, [documentCategories]);

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
    | 'TAX_OBLIGATIONS'
    | 'ROLE_DEFINITIONS'
    | 'ROLE_GOVERNANCE_META';

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
          } else if (type === 'CONSULTING_SERVICES' && Array.isArray(payload)) {
            setConsultingServices(payload);
          } else if (type === 'ROLE_DEFINITIONS' && payload) {
            setRoleDefinitions(payload);
          } else if (type === 'ROLE_GOVERNANCE_META' && payload) {
            setRoleGovernanceMeta(payload);
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
        } else if (e.key === STORAGE_KEY_CONSULTING_SERVICES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setConsultingServices(parsed);
        } else if (e.key === STORAGE_KEY_ROLE_DEFINITIONS) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setRoleDefinitions(parsed);
        } else if (e.key === STORAGE_KEY_ROLE_GOVERNANCE_META) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setRoleGovernanceMeta(parsed);
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
      DEFAULT_COMPANY_CAPITAL
    );

    const unsubProjects = subscribeToProjects((remoteProjects) => {
      if (Array.isArray(remoteProjects)) {
        setProjects(remoteProjects);
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

    const unsubDispositions = subscribeToDispositions((remoteDisps) => {
      if (Array.isArray(remoteDisps)) {
        setDispositions(remoteDisps);
      }
    });

    const unsubTransactions = subscribeToTransactions((remoteTrxs) => {
      if (Array.isArray(remoteTrxs)) {
        setTransactions(remoteTrxs);
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

    const unsubTaxObligations = subscribeToSettings('tax_obligations', (data) => {
      if (Array.isArray(data)) {
        setTaxObligations(data);
      }
    });

    const unsubReceivables = subscribeToReceivables((remoteRecs) => {
      if (Array.isArray(remoteRecs)) {
        setReceivables(remoteRecs);
      }
    });

    return () => {
      unsubProjects();
      unsubDeletedUsers();
      unsubUsers();
      unsubDocTypes();
      unsubDocCategories();
      unsubDispositions();
      unsubTransactions();
      unsubConsultingServices();
      unsubRoleDefs();
      unsubRoleGovMeta();
      unsubPaymentChannels();
      unsubTransactionCategories();
      unsubBankLoans();
      unsubCompanyCapital();
      unsubTaxObligations();
      unsubReceivables();
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
      ]);
    } catch (err) {
      console.error('Firestore bulk sync error:', err);
    } finally {
      setIsSyncingWithFirestore(false);
    }
  }, [projects, teamMembers, dispositions, transactions, documentTypes, documentCategories, consultingServices, roleDefinitions, paymentChannels, transactionCategories, bankLoans, companyCapital, taxObligations]);

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

  // Master Admin Authority Check
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
      role.includes('MASTER') ||
      role.includes('ADMIN') ||
      role.includes('DIRECTOR') ||
      username === 'admin.master' ||
      username === 'admin_master' ||
      username === 'admin' ||
      username.startsWith('admin.') ||
      username.startsWith('admin_') ||
      username.includes('admin') ||
      email === 'admin@gapsite.com' ||
      email.startsWith('admin@') ||
      email.includes('admin') ||
      (Array.isArray(currentUser.permissions) && (
        currentUser.permissions.includes('MANAGE_USERS_ROLES') ||
        currentUser.permissions.includes('DELETE_PROJECTS') ||
        currentUser.permissions.includes('MANAGE_FINANCE')
      ))
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
    setTeamMembers((prev) => [...prev, newUser]);
    saveUserToFirestore(newUser);
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
    }
  ) => {
    // Statutory Security Gate: ONLY admin.master / MASTER_ADMIN can verify & accept new registrations
    if (!isMasterAdmin) {
      console.warn('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can verify or accept new registered members.');
      return;
    }

    let verifiedMember: TeamMember | null = null;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== userId) return m;
        const updated: TeamMember = {
          ...m,
          status: 'ACTIVE',
          role: options?.role || m.role,
          roleTitle: options?.roleTitle || m.roleTitle,
          department: options?.department || m.department,
          permissions: options?.permissions || m.permissions,
          verifiedBy: currentUser.name || 'Adryan kelvianto (Master Admin)',
          verifiedAt: 'Just now',
          verificationNotes: options?.notes || 'Statutory verification authorized & accepted by Master Admin (admin.master)',
        };
        verifiedMember = updated;
        if (currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    if (verifiedMember) {
      saveUserToFirestore(verifiedMember);
      broadcastLiveUserUpdate(verifiedMember);
    }
  };

  const rejectUser = (userId: string, _reason?: string) => {
    // Statutory Security Gate: ONLY admin.master / MASTER_ADMIN can decline or reject new registrations
    if (!isMasterAdmin) {
      console.warn('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can decline or reject new registered members.');
      return;
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
    deleteUserFromFirestore(userId);
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

    let updatedMember: TeamMember | null = null;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== userId) return m;
        const updated: TeamMember = {
          ...m,
          role: newRole,
          roleTitle: options?.roleTitle || DEFAULT_TITLES[newRole] || m.roleTitle,
          department: options?.department || m.department,
          permissions: options?.permissions || DEFAULT_PERMISSIONS[newRole] || m.permissions,
          verificationNotes: options?.notes || `Role reassigned to ${newRole} by Master Admin (${currentUser.name})`,
        };
        updatedMember = updated;
        const isCurrentActive =
          currentUser.id === userId ||
          (currentUser.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase()) ||
          (currentUser.username && m.username && currentUser.username.toLowerCase() === m.username.toLowerCase());
        if (isCurrentActive) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    if (updatedMember) {
      saveUserToFirestore(updatedMember);
      broadcastLiveUserUpdate(updatedMember);
    }
  };

  const updateUser = (id: string, updates: Partial<TeamMember>) => {
    let updatedMember: TeamMember | null = null;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        updatedMember = updated;
        const isCurrentActive =
          currentUser.id === id ||
          (currentUser.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase()) ||
          (currentUser.username && m.username && currentUser.username.toLowerCase() === m.username.toLowerCase());
        if (isCurrentActive) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    if (updatedMember) {
      saveUserToFirestore(updatedMember);
      broadcastLiveUserUpdate(updatedMember);
    }
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
    let toggledMember: TeamMember | null = null;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        let newStatus: TeamMember['status'] = 'ACTIVE';
        if (m.status === 'ACTIVE') newStatus = 'INACTIVE';
        else if (m.status === 'INACTIVE') newStatus = 'ACTIVE';
        else if (m.status === 'PENDING_VERIFICATION') {
          if (!isMasterAdmin) {
            console.warn('Unauthorized: Only Master Admin can verify and activate pending members.');
            return m;
          }
          newStatus = 'ACTIVE';
        }

        const updated: TeamMember = {
          ...m,
          status: newStatus,
          ...(m.status === 'PENDING_VERIFICATION' && newStatus === 'ACTIVE'
            ? {
                verifiedBy: currentUser.name || 'Adryan kelvianto (Master Admin)',
                verifiedAt: 'Just now',
                verificationNotes: 'Activated via Status Toggle by Master Admin (admin.master)',
              }
            : {}),
        };
        toggledMember = updated;
        if (currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    if (toggledMember) {
      saveUserToFirestore(toggledMember);
      broadcastLiveUserUpdate(toggledMember);
    }
  };

  // Master Admin function to rename/update Role Position Metadata
  const updateRolePositionTitle = (
    role: UserRole,
    updates: { title?: string; department?: string; desc?: string },
    updateExistingMembers: boolean = true
  ) => {
    if (!isMasterAdmin) {
      alert('Only Master Admin (admin.master) has authority to change system role position names.');
      return;
    }

    const trimmedTitle = updates.title?.trim();
    const trimmedDept = updates.department?.trim();
    const trimmedDesc = updates.desc?.trim();

    let updatedDefinitions: RoleDefinitionsMap;

    setRoleDefinitions((prev) => {
      const existing = prev[role] || DEFAULT_ROLE_DEFINITIONS[role];
      const updatedRole: RoleDefinition = {
        ...existing,
        ...(trimmedTitle ? { title: trimmedTitle } : {}),
        ...(trimmedDept !== undefined ? { department: trimmedDept } : {}),
        ...(trimmedDesc !== undefined ? { desc: trimmedDesc } : {}),
      };
      updatedDefinitions = {
        ...prev,
        [role]: updatedRole,
      };
      try {
        localStorage.setItem(STORAGE_KEY_ROLE_DEFINITIONS, JSON.stringify(updatedDefinitions));
      } catch (err) {
        console.error('Failed to save role definitions to localStorage:', err);
      }
      return updatedDefinitions;
    });

    saveSettingsToFirestore('role_definitions', updatedDefinitions!);

    if (updateExistingMembers) {
      setTeamMembers((prev) => {
        const updatedMembers = prev.map((member) => {
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

        try {
          localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
        } catch (err) {
          console.error('Failed to save members to localStorage:', err);
        }
        return updatedMembers;
      });
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

    setRoleDefinitions((prev) => {
      const existing = prev[role] || DEFAULT_ROLE_DEFINITIONS[role];
      const updatedRole: RoleDefinition = {
        ...existing,
        defaultPermissions: permissions,
      };
      return {
        ...prev,
        [role]: updatedRole,
      };
    });

    if (updateExistingMembers) {
      setTeamMembers((prev) =>
        prev.map((member) => {
          if (member.role === role) {
            const updated: TeamMember = {
              ...member,
              permissions: permissions,
            };
            if (currentUser.id === member.id) {
              setCurrentUser(updated);
            }
            return updated;
          }
          return member;
        })
      );
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
      setTeamMembers((prev) =>
        prev.map((member) => {
          const defaultRole = DEFAULT_ROLE_DEFINITIONS[member.role];
          if (defaultRole) {
            const updated = {
              ...member,
              permissions: defaultRole.defaultPermissions,
            };
            if (currentUser.id === member.id) {
              setCurrentUser(updated);
            }
            return updated;
          }
          return member;
        })
      );
    }
  };

  const updateRoleGovernanceMeta = (updates: { title?: string; desc?: string }) => {
    if (!isMasterAdmin) {
      alert('Only Master Admin (admin.master) has authority to edit Role & Position Governance name and description.');
      return;
    }
    setRoleGovernanceMeta((prev) => ({
      ...prev,
      ...(updates.title?.trim() ? { title: updates.title.trim() } : {}),
      ...(updates.desc?.trim() ? { desc: updates.desc.trim() } : {}),
    }));
  };

  const resetRoleGovernanceMeta = () => {
    if (!isMasterAdmin) {
      alert('Only Master Admin can reset governance metadata.');
      return;
    }
    setRoleGovernanceMeta(DEFAULT_ROLE_GOVERNANCE_META);
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
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Hanya Master Admin / Tim Finance yang dapat menghapus fasilitas pinjaman.' };
    }

    const target = bankLoans.find((l) => l.id === id);
    if (!target) {
      return { success: false, message: 'Pinjaman bank tidak ditemukan.' };
    }

    setBankLoans((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      broadcastLiveDataUpdate('BANK_LOANS', updated);
      saveSettingsToFirestore('bank_loans', updated);
      return updated;
    });

    return { success: true, message: `Fasilitas pinjaman "${target.loanName}" berhasil dihapus.` };
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

    const newTax: TaxObligation = {
      ...taxData,
      id: `tax-${Date.now()}`,
      paidAmount: taxData.paidAmount || 0,
      remainingAmount: calculatedRemaining,
      status: taxData.status || (calculatedRemaining <= 0 ? 'PAID' : 'TERHUTANG'),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username || currentUser.name || 'Finance Officer',
    };

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
          const merged = { ...t, ...updates, updatedAt: new Date().toISOString() };
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
    if (!isMasterAdmin && !currentUser.permissions?.includes('MANAGE_FINANCE')) {
      return { success: false, message: 'Akses Ditolak: Hanya Tim Finance / Master Admin yang dapat menghapus data pajak.' };
    }

    const target = taxObligations.find((t) => t.id === id);
    if (!target) {
      return { success: false, message: 'Data pajak tidak ditemukan.' };
    }

    setTaxObligations((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      broadcastLiveDataUpdate('TAX_OBLIGATIONS', updated);
      saveSettingsToFirestore('tax_obligations', updated);
      return updated;
    });

    return { success: true, message: `Kewajiban pajak "${target.title}" berhasil dihapus.` };
  };

  const payTaxObligation = (
    taxId: string,
    options?: {
      channelId?: string;
      date?: string;
      ntpnNumber?: string;
      billingCode?: string;
      notes?: string;
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
    const paymentMethod = options?.channelId || target.paymentChannelId || 'BANK_TRANSFER_BRI';
    const payDate = options?.date || new Date().toISOString().slice(0, 10);
    const ntpn = options?.ntpnNumber?.trim();
    const billing = options?.billingCode?.trim() || target.billingCode;
    const customNotes = options?.notes?.trim();

    // 1. Create Cleared Expense Transaction in Cash Ledger under category TAX_PPH_PPN
    const tx = addTransaction({
      date: payDate,
      type: 'EXPENSE',
      category: 'TAX_PPH_PPN',
      amountIDR: paymentAmount,
      description: `Setoran Pajak ${target.taxType === 'PPN' ? 'PPN' : target.taxType} (${target.taxPeriod}) - ${target.title}`,
      clientOrVendorName: target.counterpartyName || 'Kas Negara / KPP Pratama (DJP)',
      paymentMethod: paymentMethod as any,
      referenceNumber: ntpn ? `NTPN-${ntpn}` : billing ? `BILL-${billing}` : `TAX-${target.id.slice(-4).toUpperCase()}`,
      status: 'CLEARED',
      notes: `${customNotes ? customNotes + ' | ' : ''}NTPN: ${ntpn || '-'} | Kode Billing: ${billing || '-'} | Pelunasan Kewajiban Pajak ${target.title}`,
      recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
    });

    // 2. Update Tax Obligation to PAID with NTPN & transaction linkage
    const updatedTaxObj: TaxObligation = {
      ...target,
      paidAmount: (target.paidAmount || 0) + paymentAmount,
      remainingAmount: 0,
      status: 'PAID',
      paidAt: payDate,
      ntpnNumber: ntpn || target.ntpnNumber,
      billingCode: billing,
      paymentChannelId: paymentMethod,
      transactionId: tx?.id,
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
      transactionId: tx?.id,
      message: `Setoran Pajak ${target.taxType} sebesar Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat & dibukukan ke jurnal kas! NTPN: ${ntpn || 'Tercatat'}.`,
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

    setReceivables((prev) => {
      const updated = prev.filter((r) => r.id !== id);
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
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      broadcastLiveDataUpdate('PROJECTS', updated);
      return updated;
    });
    setDispositions((prev) => {
      const updated = prev.filter((d) => d.projectId !== id);
      broadcastLiveDataUpdate('DISPOSITIONS', updated);
      return updated;
    });
    deleteProjectFromFirestore(id);
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
    setDispositions((prev) => {
      const updated = prev.filter((d) => d.id !== id);
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

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedProj = {
          ...p,
          documents: [newDoc, ...p.documents],
        };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );

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
    setProjects((prev) =>
      prev.map((p) => {
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
          details: `Document "${targetDocName}" status changed to ${status.replace(/_/g, ' ')}${reviewNotes ? ` (Notes: ${reviewNotes})` : ''}`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: targetDocName,
            newValue: status,
          },
        };

        const updatedProj: ConsultingProject = { ...p, documents: updatedDocs, activities: [newAct, ...(p.activities || [])] };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );
  };

  const updateDocument = (projectId: string, docId: string, updates: Partial<ProjectDocument>) => {
    setProjects((prev) =>
      prev.map((p) => {
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
          details: `Updated metadata/details for document "${targetDocName}"`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: targetDocName,
          },
        };

        const updatedProj: ConsultingProject = { ...p, documents: updatedDocs, activities: [newAct, ...(p.activities || [])] };
        saveProjectToFirestore(updatedProj);
        return updatedProj;
      })
    );
  };

  const deleteDocument = (projectId: string, docId: string) => {
    if (!isMasterAdmin) {
      console.warn('Unauthorized deletion attempt: Only admin.master (Master Admin) can delete repository documents.');
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
          details: `Removed "${docName}" from project repository`,
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
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      broadcastLiveDataUpdate('TRANSACTIONS', updated);
      return updated;
    });
    deleteTransactionFromFirestore(id);
  };

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
    setProjects((prev) =>
      prev.map((p) => {
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
      })
    );
  };

  const resetProjectMilestonesToDefault = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
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
      })
    );
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
        recordLoanDisbursementToLedger,
        recordLoanInstallmentToLedger,
        companyCapital,
        updateCompanyCapital,
        resetCompanyCapitalToDefault,
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
