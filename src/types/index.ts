export type ServiceType =
  | 'TKDN_BARANG'
  | 'TKDN_JASA'
  | 'BMP_COMPANY'
  | 'OSS_RBA_NIB'
  | 'SNI_CERTIFICATION'
  | 'AMDAL_UKL_UPL'
  | (string & {});

export interface ConsultingServiceConfig {
  id: string; // Unique identifier/slug e.g. 'TKDN_BARANG', 'CUSTOM_GREEN_INDUSTRY'
  name: string; // Full title e.g. 'TKDN Manufaktur Barang (Goods)'
  shortName: string; // Short badge label e.g. 'TKDN Barang'
  code: string; // Statutory acronym e.g. 'TKDN-BRG'
  category: string; // Domain e.g. 'Perindustrian & Manufaktur'
  description: string; // Description & scope of service
  regulatoryBasis?: string; // e.g. 'Permenperin No. 16/2011, Permenperin No. 43/2022'
  defaultSurveyor?: string; // Default accredited surveyor/verifier body
  typicalDurationDays?: number; // Typical SLA in business days
  basePriceIDR?: number; // Base consulting fee in IDR
  badgeColor: string; // Tailwind class string for badge
  iconName?: string; // Lucide icon identifier
  isDefault?: boolean; // True if core built-in system service
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type ProjectStage =
  | 'INQUIRY'
  | 'GAP_ANALYSIS'
  | 'DOC_PREPARATION'
  | 'FIELD_VERIFICATION'
  | 'MINISTRY_REVIEW'
  | 'CERTIFICATE_ISSUED'
  | 'CLOSED';

export type ProjectStatus = 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type SurveyorBody =
  | 'PT Surveyor Indonesia'
  | 'PT Sucofindo (Persero)'
  | 'PT Biro Klasifikasi Indonesia'
  | 'PT Anindya Wiraputra Consult'
  | 'Badan Standarisasi dan Kebijakan Jasa Industri'
  | (string & {});

export type LviBody = SurveyorBody;
export type AssignedByBody = SurveyorBody;

export type CompanyType = 'PMDN' | 'PMA' | 'BUMN' | 'UMKM';

export type EngagementCategory =
  | 'TKDN_CERTIFICATION'
  | 'COMPANY_LICENSING'
  | 'SOFTWARE_DEV'
  | 'OTHER_SERVICES';

export type DocumentCategoryGroup =
  | 'ALL'
  | 'OFFER_QUOTATION'
  | 'INVOICE_RECEIPT'
  | 'EXPENSE_PROOF'
  | 'TECHNICAL_DOSSIER'
  | 'LEGAL_COMPLIANCE'
  | (string & {});

export type DocumentCategory = Exclude<DocumentCategoryGroup, 'ALL'>;

export interface DocumentCategoryDefinition {
  id: string; // e.g. 'TECHNICAL_DOSSIER', 'LEGAL_COMPLIANCE', 'CUSTOM_CATEGORY'
  name: string; // Display name e.g. 'Legal & Statutory Licensing'
  description?: string;
  badgeColor?: string; // Tailwind class e.g. 'bg-cyan-50 text-cyan-700 border-cyan-300'
  isSystemDefault?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type DocumentType =
  // Offer & Quotations
  | 'OFFER_QUOTATION_LETTER'
  | 'CLIENT_CONTRACT_SPK'
  | 'NDAS_LEGAL_AGREEMENT'
  // Invoices & Receipts
  | 'INVOICE_BILLING'
  | 'OFFICIAL_RECEIPT_KWITANSI'
  | 'DOWN_PAYMENT_PROOF'
  | 'TAX_FAKTUR_PAJAK'
  // Expense Proofs & Disbursements
  | 'EXPENSE_PROOF_STRUK'
  | 'SURVEYOR_FEE_RECEIPT'
  | 'TRAVEL_LODGING_RECEIPT'
  | 'GOV_PNBP_FILING_RECEIPT'
  | 'PETTY_CASH_VOUCHER'
  // Technical & TKDN Dossiers
  | 'BOM_EXCEL'
  | 'COST_ACCOUNTING'
  | 'SUPPLIER_TKDN_CERT'
  | 'FACTORY_ASSET_REGISTRY'
  | 'NIB_OSS_DOCS'
  | 'SIINAS_PROFILE'
  | 'AUDIT_VERIFICATION_REPORT'
  | 'LEGAL_PERMIT'
  | 'ISO_QMS_CERT'
  | 'LAB_TEST_REPORT'
  | 'AMDAL_UKL_DOCUMENT'
  | 'DEED_AHU_LEGAL'
  | (string & {});

export interface DocumentTypeDefinition {
  id: string; // Unique slug/code e.g. 'BOM_EXCEL', 'HALAL_CERTIFICATE'
  name: string; // Full human label e.g. 'Bill of Materials (BOM Sheet)'
  category: DocumentCategoryGroup; // Category group
  description: string; // Compliance explanation
  isAutoCompleting: boolean; // True if uploading this document auto-satisfies linked milestone requirements
  requiredForServices?: ServiceType[]; // Specific statutory services linked to this requirement
  acceptedFileTypes?: string[]; // Allowed extensions e.g. ['.pdf', '.xlsx']
  badgeColor?: string; // Custom badge styling
  isSystemDefault?: boolean; // True for built-in statutory documents
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type DocumentStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'FLAGGED_DISCREPANCY'
  | 'SUBMITTED_TO_SURVEYOR';

export type MilestoneStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FLAGGED';

export interface MilestoneTemplate {
  id: string;
  stage: ProjectStage;
  title: string;
  description: string;
  regulatoryClause?: string;
  applicableServices: ServiceType[];
  requiredDocTypes: DocumentType[];
  optionalDocTypes?: DocumentType[];
  weightPercentage?: number;
  estimatedDays?: number;
  helpTip?: string;
}

export interface EvaluatedMilestone {
  id: string;
  stage: ProjectStage;
  title: string;
  description: string;
  regulatoryClause?: string;
  requiredDocTypes: DocumentType[];
  optionalDocTypes?: DocumentType[];
  matchedDocuments: ProjectDocument[];
  status: MilestoneStatus;
  isCompleted: boolean;
  completionPercentage: number;
  completedAt?: string;
  unfulfilledDocTypes: DocumentType[];
  manuallyCompleted?: boolean;
  manualNotes?: string;
  custom?: boolean;
}

export interface CertificationChecklistSummary {
  totalMilestones: number;
  completedMilestones: number;
  progressPercentage: number;
  totalRequiredDocTypes: number;
  uploadedRequiredDocTypes: number;
  docFulfillmentPercentage: number;
  flaggedIssuesCount: number;
  allCompleted: boolean;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  status: DocumentStatus;
  reviewNotes?: string;
  version: string;
  verifiedBy?: string;
  downloadUrl?: string;

  // File Preview & Storage Properties
  fileUrl?: string; // Data URL or Blob URL for uploaded files / PDFs / images
  fileType?: string; // MIME type or extension e.g. 'application/pdf', 'image/png'
  previewData?: {
    pagesCount?: number;
    extractedText?: string;
    spreadsheetRows?: Array<Record<string, any>>;
    complianceScore?: number;
    signatureVerified?: boolean;
    qrCodeVerified?: boolean;
    checksum?: string;
  };
  
  // Categorization & Financial / Offer Metadata
  categoryGroup?: DocumentCategoryGroup;
  referenceNumber?: string; // Quotation ref #, Invoice #, Struk #, Faktur #
  amountIDR?: number;       // Quoted amount, Invoice amount, Expense amount
  counterpartyName?: string; // Client, Vendor, Surveyor body, Merchant, Airline
  validUntil?: string;      // Validity date for quotation/proposals
  taxNumber?: string;       // Tax Faktur Pajak number
  paymentMethod?: PaymentMethod;
  notes?: string;
  tags?: string[];

  // Google Drive Cloud Sync Metadata
  googleDriveFileId?: string;
  googleDriveWebViewLink?: string;
  googleDriveWebContentLink?: string;
  googleDriveFolderId?: string;
  googleDriveSyncedAt?: string;
  googleDriveSyncStatus?: 'SYNCED' | 'FAILED' | 'PENDING' | 'LOCAL_ONLY';
}

export type DispositionCategory =
  | 'DOC_COLLECTION'
  | 'TKDN_CALCULATION'
  | 'FIELD_AUDIT_PREP'
  | 'REGULATORY_SUBMISSION'
  | 'LEGAL_COMPLIANCE'
  | 'CLIENT_CONSULTATION';

export type DispositionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'REVISION_NEEDED';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface JobDisposition {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  title: string;
  category: DispositionCategory;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignedToAvatar: string;
  assignedById: string;
  assignedByName: string;
  assignedDate: string;
  dueDate: string;
  priority: Priority;
  status: DispositionStatus;
  instructions: string;
  checklist: ChecklistItem[];
  deliverableNotes?: string;
  completedAt?: string;
}

export interface TkdnCostBreakdown {
  directMaterialKDN: number;
  directMaterialKLN: number;
  directLaborWNI: number;
  directLaborWNA: number;
  factoryOverheadDomestic: number;
  factoryOverheadImported: number;
  // Permenperin 35/2025 statutory additions:
  hasDomesticFactory?: boolean; // Active manufacturing facility in Indonesia & >= 50% WNI (Baseline 25% floor)
  rdDomesticBonusPercentage?: number; // Local Research & Development bonus (Max +20.0%)
  bmpScore?: number; // Bobot Manfaat Perusahaan based on 15 criteria (Max +15.0%)
  calculationMethod?: 'PERMENPERIN_35_2025' | 'LEGACY_COST_BASED';
  productCategoryWeightProfile?: 'STANDARD_MANUFACTURING' | 'ELECTRONICS_DIGITAL' | 'HEAVY_EQUIPMENT' | 'PHARMA_CHEMICAL';
}

export interface TkdnCalculationResult {
  tkdnPercentage: number; // Final statutory TKDN percentage
  baseProductionTkdn: number; // Raw weighted factor score (Material 75%, Labor 10%, Overhead 15%)
  isFactoryIncentiveApplied: boolean; // True if 25% baseline threshold was triggered
  rdBonusPercentage: number; // R&D incentive added
  materialTkdn: number; // % Domestic material
  laborTkdn: number; // % Domestic labor (WNI)
  overheadTkdn: number; // % Domestic overhead
  materialWeightedScore: number; // materialTkdn * 0.75
  laborWeightedScore: number; // laborTkdn * 0.10
  overheadWeightedScore: number; // overheadTkdn * 0.15
  kdnTotal: number; // Total nominal KDN
  grandTotal: number; // Total nominal COGS
  combinedScoreWithBmp: number; // TKDN + BMP
  regulatoryStandard: string; // 'Permenperin No. 35/2025'
  meetsBasicTender: boolean; // >= 25%
  meetsEkatalogPriority: boolean; // >= 40% (TKDN + BMP)
  meetsHighDomestic: boolean; // >= 60%
  certificateValidityYears: number; // 5 years under Permenperin 35/2025
}

export type ActivityType =
  | 'STATUS_CHANGE'
  | 'USER_ASSIGNMENT'
  | 'DOC_UPLOAD'
  | 'DISPOSITION'
  | 'AUDIT_MILESTONE'
  | 'NOTE';

export interface ProjectActivity {
  id: string;
  timestamp: string;
  actor: string;
  actorAvatar?: string;
  actorRole?: string;
  action: string;
  details: string;
  type: ActivityType;
  metadata?: {
    previousValue?: string;
    newValue?: string;
    documentName?: string;
    documentType?: DocumentType;
    documentCategory?: DocumentCategoryGroup;
    assigneeName?: string;
    assigneeRole?: string;
    dispositionId?: string;
    statusBadgeColor?: string;
    [key: string]: any;
  };
}

export interface ConsultingProject {
  id: string;
  code: string;
  clientName: string;
  productOrServiceName: string;
  companyType: CompanyType;
  projectCategory?: EngagementCategory;
  industry: string;
  kbliCode: string;
  serviceType: ServiceType;
  stage: ProjectStage;
  status: ProjectStatus;
  priority: Priority;
  progressPercentage: number;
  targetTkdnPercentage: number;
  projectedTkdnPercentage: number;
  officialVerifiedTkdnPercentage?: number;
  contractValueIDR: number;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  leadConsultantId: string;
  leadConsultantName: string;
  surveyorBody: SurveyorBody;
  surveyorAuditorName?: string;
  surveyorAuditDate?: string;
  siinasAccountId?: string;
  costBreakdown?: TkdnCostBreakdown;
  description: string;
  documents: ProjectDocument[];
  activities: ProjectActivity[];
  tags: string[];
  customMilestones?: EvaluatedMilestone[];
  deletedMilestoneIds?: string[];
  milestoneDocRequirements?: Record<
    string,
    {
      requiredDocTypes?: DocumentType[];
      optionalDocTypes?: DocumentType[];
    }
  >;
  manualMilestoneSignoffs?: Record<
    string,
    {
      completed: boolean;
      signedBy: string;
      timestamp: string;
      notes?: string;
    }
  >;
}

export type UserRole =
  | 'MASTER_ADMIN'
  | 'DIRECTOR'
  | 'LEAD_CONSULTANT'
  | 'TECHNICAL_CONSULTANT'
  | 'SURVEYOR_LIAISON'
  | 'FINANCE_OFFICER'
  | 'CLIENT_VIEWER';

export interface RoleDefinition {
  role: UserRole;
  title: string;
  department: string;
  color: string;
  desc: string;
  defaultPermissions: UserPermission[];
  isCustomizable?: boolean;
}

export type RoleDefinitionsMap = Record<UserRole, RoleDefinition>;

export interface RoleGovernanceMeta {
  title: string;
  desc: string;
}

export type UserPermission =
  | 'MANAGE_USERS_ROLES'
  | 'VERIFY_NEW_USERS'
  | 'MANAGE_SERVICE_TYPES'
  | 'MANAGE_DOCUMENT_TYPES'
  | 'VIEW_PROJECTS'
  | 'CREATE_PROJECTS'
  | 'EDIT_PROJECTS'
  | 'DELETE_PROJECTS'
  | 'CALCULATE_TKDN'
  | 'UPLOAD_DOCUMENTS'
  | 'VERIFY_DOCUMENTS'
  | 'SIGNOFF_MILESTONES'
  | 'MANAGE_DISPOSITIONS'
  | 'MANAGE_FINANCE'
  | 'EXPORT_AUDIT_REPORTS';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  permissions: UserPermission[];
  specialization?: string[];
  activeTaskCount?: number;
  completedTaskCount?: number;
  capacityPercentage?: number;
  lastLoginAt?: string;
  clientCompany?: string; // For CLIENT_VIEWER
  pin?: string;
  registeredAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  bio?: string;
  registrationNumber?: string; // e.g. Asesor TKDN ID / Auditor License / SKA
  themeAccent?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate' | 'teal';
  signatureText?: string;
  signatureImage?: string;
  notificationPreferences?: {
    emailNotifications: boolean;
    whatsappAlerts: boolean;
    inAppDispatches: boolean;
    weeklySummary: boolean;
  };
}

export interface TeamMember extends AppUser {}

export interface DeletedUserRecord {
  id: string;
  username: string;
  email: string;
  name?: string;
  deletedAt: string;
  deletedBy: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export type IncomeCategory =
  | 'CLIENT_CONSULTING_FEE'
  | 'TKDN_MILESTONE_PAYMENT'
  | 'SURVEYOR_FACILITATION'
  | 'LEGAL_RETAINER'
  | 'SUCCESS_FEE'
  | 'TRAINING_WORKSHOP'
  | 'BANK_LOAN_DISBURSEMENT'
  | 'OTHER_INCOME';

export type ExpenseCategory =
  | 'LISTRIK'
  | 'GAJI_KARYAWAN'
  | 'MAKAN_MINUM'
  | 'ENTERTAINMENT'
  | 'TRANSPORTASI'
  | 'AKOMODASI'
  | 'UANG_RAPAT'
  | 'LAIN_LAIN'
  | 'SURVEYOR_AUDIT_FEES'
  | 'REGULATORY_FILING'
  | 'CONSULTANT_SALARIES'
  | 'OPERATIONAL_OFFICE'
  | 'TRAVEL_SITE_VISIT'
  | 'SOFTWARE_CLOUD'
  | 'MARKETING_ACQUISITION'
  | 'TAX_PPH_PPN'
  | 'BANK_INTEREST'
  | 'BANK_LOAN_PRINCIPAL'
  | 'BANK_LOAN_INTEREST'
  | 'BANK_LOAN_ADMIN_FEE'
  | 'SEWA_KANTOR'
  | 'OFFICE_UTILITIES_EXPENSE'
  | 'MISCELLANEOUS_EXPENSE';

export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface LoanRenewalRecord {
  id: string;
  renewalNumber: number; // 1 (Perpanjangan ke-1), 2 (Perpanjangan ke-2), dst.
  renewalDate: string; // Tanggal efektif / adendum perpanjangan
  previousMaturityDate: string; // Tanggal jatuh tempo sebelum diperpanjang
  newMaturityDate: string; // Tanggal jatuh tempo baru setelah perpanjangan
  tenureMonthsAdded: number; // Tambahan tenor (default 12 bulan)
  previousPrincipal: number; // Plafon pokok sebelum perpanjangan
  newPrincipal: number; // Plafon pokok baru setelah perpanjangan
  previousInterestRate: number; // Suku bunga sebelum perpanjangan (% p.a.)
  newInterestRate: number; // Suku bunga baru setelah perpanjangan (% p.a.)
  adendumNumber?: string; // Nomor Surat Perjanjian Kredit / Adendum PK
  provisionFee?: number; // Biaya provisi perpanjangan / administrasi bank
  provisionFeeRecordedToLedger?: boolean;
  provisionFeeTransactionId?: string;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface LoanInstallmentScheduleItem {
  monthNumber: number;
  dueDate: string;
  beginningBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  endingBalance: number;
  isPaid: boolean;
  paidAt?: string;
  transactionIds?: string[];
  paymentType?: 'INTEREST_ONLY' | 'PRINCIPAL_AND_INTEREST' | 'BALLOON_PAYOFF';
  cycleNumber?: number; // 1 = Periode 12 Bulan Pertama, 2 = Periode Perpanjangan ke-1, dst.
  renewalId?: string;
}

export type LoanFacilityType = 'REVOLVING' | 'NON_REVOLVING' | 'OTHER';

export interface BankLoan {
  id: string;
  loanName: string;
  bankName: string;
  loanNumber?: string;
  accountNumber?: string;
  purpose?: string;
  facilityType?: LoanFacilityType; // 'REVOLVING' (KMK/Rekening Koran) vs 'NON_REVOLVING' (Term Loan)
  principalAmount: number;
  annualInterestRate: number; // in percentage e.g. 9.5
  tenureMonths: number;
  startDate: string;
  paymentChannelId?: string;
  interestType?: 'FLAT' | 'EFFECTIVE';
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalPayment: number;
  remainingPrincipal: number;
  paidPrincipal: number;
  paidInterest: number;
  status: 'ACTIVE' | 'PAID_OFF' | 'DRAFT';
  isDisbursed: boolean;
  disbursedAt?: string;
  disbursementTransactionId?: string;
  schedule?: LoanInstallmentScheduleItem[];
  notes?: string;
  // Perpanjangan Kredit (Revolving Credit Renewal / Roll-over)
  renewalHistory?: LoanRenewalRecord[];
  renewalsCount?: number;
  originalMaturityDate?: string;
  currentMaturityDate?: string;
  lastRenewalDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface TransactionCategoryDefinition {
  id: string;
  name: string;
  type: TransactionType;
  group?: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  createdBy?: string;
}

export type PaymentChannelCategory = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'DIGITAL' | 'OTHER';

export interface PaymentChannelDefinition {
  id: string; // e.g. 'BANK_TRANSFER_BRI', 'BANK_TRANSFER_BCA', or custom ID
  name: string; // Display label e.g. 'BRI Corporate Transfer'
  shortName?: string; // Short badge label e.g. 'Bank BRI'
  accountNumber?: string; // e.g. '0206-01-002980-30-5'
  accountHolder?: string; // e.g. 'PT GAP CONSULTING INDONESIA'
  category?: PaymentChannelCategory;
  description?: string;
  isDefault?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  badgeColor?: string;
  createdAt?: string;
  createdBy?: string;
}

export type PaymentMethod =
  | 'BANK_TRANSFER_BCA'
  | 'BANK_TRANSFER_MANDIRI'
  | 'BANK_TRANSFER_BNI'
  | 'BANK_TRANSFER_BRI'
  | 'BANK_TRANSFER_BSI'
  | 'CORPORATE_CARD'
  | 'PETTY_CASH'
  | 'VIRTUAL_ACCOUNT'
  | 'QRIS_PAYMENT'
  | (string & {});

export type TransactionStatus = 'CLEARED' | 'PENDING' | 'OVERDUE' | 'TERHUTANG' | 'HUTANG';

export interface CompanyCapitalSettings {
  authorizedCapital: number; // Modal Dasar Perusahaan (e.g. Rp 5.000.000.000)
  paidInCapital: number; // Modal Ditempatkan / Disetor (e.g. Rp 1.250.000.000)
  additionalCapital: number; // Modal Tambahan / Agio Modal / Tambahan Modal Disetor
  retainedEarningsOpening?: number; // Saldo Laba Ditahan Periode Lalu
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FinancialTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amountIDR: number;
  description: string;
  projectId?: string;
  projectCode?: string;
  clientOrVendorName: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  status: TransactionStatus;
  isFromDebt?: boolean;
  loanId?: string;
  notes?: string;
  recordedBy: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: 'pdf' | 'image' | 'excel' | 'word' | 'other';
  attachmentSize?: string;
  createdAt: string;
}

export type TaxType =
  | 'PPN' // Pajak Pertambahan Nilai (PPN 11% / 12%)
  | 'PPH_21' // PPh Pasal 21 (Gaji Pegawai, Tenaga Ahli, Asesor & Konsultan)
  | 'PPH_23' // PPh Pasal 23 (Jasa Konsultasi / Jasa Surveyor / Sewa Harta 2%)
  | 'PPH_4_2' // PPh Final Pasal 4 ayat (2) (Sewa Gedung Kantor 10%, Konstruksi)
  | 'PPH_FINAL_UMKM' // PPh Final PP 23/55 (0.5% Omzet Bruto)
  | 'PPH_25_29' // PPh Badan Pasal 25 / 29 Tahunan
  | 'OTHER_TAX';

export type TaxObligationStatus = 'TERHUTANG' | 'PAID' | 'OVERDUE' | 'DRAFT';

export interface TaxObligation {
  id: string;
  taxType: TaxType;
  taxPeriod: string; // e.g. "Agustus 2026", "2026-08", "Masa 08/2026"
  taxYear: number;
  taxMonth?: number; // 1-12
  title: string;
  description?: string;
  taxableBaseAmount?: number; // DPP (Dasar Pengenaan Pajak)
  taxRatePercent?: number; // e.g. 11%, 2%, 10%, 0.5%
  
  // PPN Specific Breakdown
  ppnOutputAmount?: number; // PPN Keluaran (Faktur Pajak Keluaran ke Klien)
  ppnInputAmount?: number; // PPN Masukan (Faktur Pajak Masukan dari Vendor)
  
  // Final Payable Tax Amount (Hutang Pajak)
  taxAmount: number; // Nominal Pajak Terhutang (IDR)
  paidAmount: number; // Nominal yang sudah disetor (IDR)
  remainingAmount: number; // Sisa Hutang Pajak Terhutang (IDR)
  
  status: TaxObligationStatus;
  dueDate: string; // Tanggal Jatuh Tempo Pembayaran/Pelaporan
  
  // Payment & Settlement Info (NTPN & ID Billing)
  paidAt?: string;
  ntpnNumber?: string; // Nomor Transaksi Penerimaan Negara (NTPN)
  billingCode?: string; // Kode ID Billing DJP (15 digit)
  taxInvoiceNumber?: string; // Nomor Seri Faktur Pajak (NSFP) / Bukti Potong (Bupot)
  paymentChannelId?: string; // Rekening Kas Pengeluaran Pembayar Pajak
  transactionId?: string; // ID Transaksi Pengeluaran di Buku Kas
  
  // Project / Counterparty Association
  projectId?: string;
  projectCode?: string;
  counterpartyName?: string; // Klien / Vendor / Surveyor / KPP Pratama
  
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

// ==========================================
// ACCOUNTS RECEIVABLE / PIUTANG USAHA & TERMIN
// ==========================================

export type ReceivableCategory =
  | 'TERMIN_KONSULTASI_TKDN'
  | 'TERMIN_SERTIFIKASI_BMP'
  | 'JASA_PERIZINAN_LEGAL'
  | 'SUCCESS_FEE_TENDER'
  | 'RETAINER_KONSULTANSI'
  | 'PELATIHAN_WORKSHOP'
  | 'REIMBURSEMENT_AUDIT_SURVEYOR'
  | 'PIUTANG_LAINNYA';

export type ReceivableStatus =
  | 'BELUM_DIBAYAR' // Unpaid (0% paid)
  | 'DIBAYAR_SEBAGIAN' // Partially Paid (>0% and <100%)
  | 'LUNAS' // Fully Paid (100%)
  | 'JATUH_TEMPO' // Overdue
  | 'BATAL'; // Cancelled / Bad Debt

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  paymentDate: string;
  amountIDR: number;
  paymentChannelId?: string;
  paymentMethod?: string;
  referenceNumber?: string; // Bukti Transfer / Kwitansi / Slip Bank
  transactionId?: string; // ID Mutasi Kas Masuk di Buku Kas (FinancialTransaction)
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  invoiceNumber: string; // e.g. "INV/2026/08/TKDN-001"
  clientName: string;
  clientContactPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  category: ReceivableCategory;
  title: string;
  description?: string;
  
  // Project association
  projectId?: string;
  projectCode?: string;
  milestoneTitle?: string; // e.g. "Termin 1 (DP 30%)", "Termin 2 (Audit LVI 40%)", "Pelunasan 30%"
  
  // Financial amounts
  totalAmountIDR: number; // Nilai Total Tagihan
  paidAmountIDR: number; // Total yang Sudah Dibayar
  remainingAmountIDR: number; // Sisa Piutang Terhutang
  
  // Dates
  issueDate: string; // Tanggal Terbit Tagihan (YYYY-MM-DD)
  dueDate: string; // Tanggal Jatuh Tempo (YYYY-MM-DD)
  fullyPaidDate?: string; // Tanggal Pelunasan Penuh
  paymentTermsDays?: number; // Jangka Waktu Pembayaran (14, 30, 45, 60 hari)
  
  // Status
  status: ReceivableStatus;
  
  // Payments ledger
  payments: ReceivablePayment[];
  
  // Linked transaction IDs
  linkedTransactionIds?: string[];
  
  // Notes & Signatures
  notes?: string;
  taxIncluded?: boolean; // PPN 11% / 12% sudah termasuk atau belum
  taxAmountIDR?: number; // Nominal PPN terhutang
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface ReceivableAgingSummary {
  current0to30: number; // 0-30 Hari (Lancar)
  aging31to60: number; // 31-60 Hari (Perhatian Khusus)
  aging61to90: number; // 61-90 Hari (Kurang Lancar)
  agingOver90: number; // >90 Hari (Diragukan/Macet)
  totalOutstanding: number; // Total Sisa Piutang
  totalSettled: number; // Total Piutang Terbayar
  totalInvoiced: number; // Total Keseluruhan Faktur
  settlementRate: number; // Persentase Pelunasan (%)
}

