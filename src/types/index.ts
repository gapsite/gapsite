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
  standardCompensation?: {
    basicSalary: number;
    positionAllowance: number;
    transportAllowance: number;
    mealAllowance: number;
    communicationAllowance?: number;
    fixedAllowance?: number;
  };
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
  // Payroll & Statutory Identity Integration
  nik?: string; // Nomor NIK / KTP / Paspor
  idType?: 'NIK' | 'KTP' | 'PASPOR'; // Tipe identitas
  bankName?: string; // Nama Bank
  bankAccountNumber?: string; // Nomor Rekening Bank
  bankAccountHolder?: string; // Nama Pemilik Rekening
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
  | 'GOVERNMENT_PROJECT_INCOME'
  | 'RETAIL_PROJECT_INCOME'
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

// ==========================================
// SEWA KANTOR / OFFICE RENT MANAGEMENT
// ==========================================

export interface OfficeRentRenewalRecord {
  id: string;
  renewalNumber: number; // 1 = Perpanjangan ke-1, 2 = Perpanjangan ke-2, dst.
  renewalDate: string; // Tanggal efektif adendum
  fromYear: number;
  toYear: number;
  previousAnnualRent: number;
  newAnnualRent: number;
  escalationPercent: number; // e.g. 5%
  adendumNumber?: string;
  newContractId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type OfficeRentScheduleStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface OfficeRentMonthlyScheduleItem {
  id: string;
  monthIndex: number; // 1 to 12
  monthName: string; // e.g. "Januari", "Februari"
  periodMonthYear: string; // e.g. "2025-01", "01/2025"
  dueDate: string; // YYYY-MM-DD
  rentAmountIDR: number; // Nilai sewa pokok bulan ini
  serviceChargeIDR?: number; // Biaya IPL / maintenance gedung bulanan
  grossTotalIDR: number; // Total Tagihan Kotor = rentAmountIDR + serviceChargeIDR
  pph42RatePercent: number; // Default 10% (PPh Final Pasal 4(2) Sewa Bangunan)
  pph42AmountIDR: number; // Dipotong PPh 4(2) 10%
  ppnRatePercent?: number; // 11% jika PKP
  ppnAmountIDR?: number; // PPN 11% jika ada
  netPayableToLandlordIDR: number; // Nilai Bersih ditransfer ke Pemilik Gedung
  status: OfficeRentScheduleStatus;
  paidDate?: string;
  paymentChannelId?: string;
  paymentMethod?: string;
  referenceNumber?: string; // Nomor bukti transfer / slip bank
  transactionId?: string; // ID transaksi pengeluaran di Buku Kas (FinancialTransaction)
  taxObligationId?: string; // ID kewajiban pajak PPh 4(2) di TaxObligation
  ppnTaxObligationId?: string; // ID faktur PPN jika ada
  notes?: string;
}

export type OfficeRentStatus = 'ACTIVE' | 'EXTENDED' | 'TERMINATED' | 'DRAFT';

export interface OfficeRentContract {
  id: string;
  contractNumber: string; // e.g. "SPK-SEWA/JKT/2025/001"
  officeName: string; // e.g. "Kantor Pusat Jakarta - Menara Kadin"
  buildingName?: string; // e.g. "Menara Kadin Indonesia Lt. 15"
  address: string; // e.g. "Jl. H.R. Rasuna Said Blok X-5 Kav. 2-3, Jakarta Selatan"
  landlordName: string; // e.g. "PT Graha Sarana Gedung" atau nama pemilik
  landlordType: 'CORPORATE_PKP' | 'CORPORATE_NON_PKP' | 'INDIVIDUAL';
  landlordNpwp?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  landlordBankAccount?: string; // e.g. "BCA 5410-988-123 a/n PT Graha Sarana Gedung"
  year: number; // Tahun Anggaran Sewa e.g. 2025, 2026
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  tenureMonths: number; // Default 12
  annualRentAmountIDR: number; // Harga Sewa Per Tahun
  monthlyRentAmountIDR: number; // Harga Sewa Per Bulan (annual / tenureMonths)
  monthlyServiceChargeIDR?: number; // IPL / Service Charge bulanan
  securityDepositIDR?: number; // Uang jaminan / deposit sewa
  pph42RatePercent: number; // Default 10%
  isSubjectToPpn: boolean; // True jika pemilik gedung PKP (PPN 11%)
  ppnRatePercent: number; // 11%
  autoSyncToLedger: boolean; // Otomatis catat ke Buku Kas & Cashflow saat dibayar
  autoSyncToTax: boolean; // Otomatis catat ke Pajak PPh 4(2) saat dibayar / dijadwalkan
  schedules: OfficeRentMonthlyScheduleItem[];
  status: OfficeRentStatus;
  // Perpanjangan Tahunan
  isRenewed?: boolean;
  renewedToContractId?: string;
  previousContractId?: string;
  renewalHistory?: OfficeRentRenewalRecord[];
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export type OverheadCategory =
  | 'LISTRIK'
  | 'IURAN'
  | 'KONSUMSI'
  | 'TRANSPORTASI'
  | 'AKOMODASI'
  | 'ATK_OFFICE'
  | 'LAIN_LAIN';

export interface OverheadExpense {
  id: string;
  overheadNumber: string; // e.g. "OVH-2026-001"
  date: string; // YYYY-MM-DD
  category: OverheadCategory;
  title: string; // Deskripsi kebutuhan operasional kantor
  vendorOrMerchant: string; // PLN, Pengelola Gedung, Catering, Pertamina, dsb
  amountIDR: number; // Nilai kotor / tagihan
  paymentChannelId: string; // e.g. BANK_TRANSFER_BCA, PETTY_CASH, dsb
  paymentMethod: string;
  referenceNumber?: string; // No. Struk / Kwitansi / Ref Transfer
  status: 'PAID' | 'PENDING' | 'SCHEDULED';
  paidDate?: string;
  hasTax: boolean; // Apakah ada potongan/pungutan pajak
  taxType?: 'PPH_23' | 'PPH_4_2' | 'PPN_11' | 'NONE';
  taxRatePercent?: number; // 2% for PPh 23, 10% for PPh 4(2), 11% for PPN
  taxAmountIDR?: number;
  netPaymentIDR: number; // Nilai bersih yang dibayar
  taxObligationId?: string; // Link ke Tax Management / TaxObligation
  transactionId?: string; // Link ke FinancialTransaction di Buku Kas
  department?: string; // Divisi pemohon
  requestedBy?: string;
  approvedBy?: string;
  receiptName?: string;
  receiptUrl?: string;
  notes?: string;
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
  | 'PPH_22' // PPh Pasal 22 (Pengadaan & Jasa Pemerintah / BUMN 1.5%)
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
  
  // Paid by client / Withholding fields
  paidByClient?: boolean; // PPh dipotong / disetor oleh klien (Bukti Potong)
  clientWithholdingNumber?: string; // Nomor Bukti Potong (e-Bupot) dari Klien
  clientWithholdingDate?: string; // Tanggal Bukti Potong Klien
  withholdingTaxPayerName?: string; // Nama Klien / Perusahaan Pemotong Pajak
  
  // Project / Counterparty Association
  projectId?: string;
  projectCode?: string;
  counterpartyName?: string; // Klien / Vendor / Surveyor / KPP Pratama
  
  // Payroll Linkage (Integrasi Otomatis dari Penggajian Karyawan)
  payrollId?: string;
  payrollNumber?: string;
  employeeId?: string;
  employeeName?: string;

  // Office Rent Linkage (Integrasi Sewa Kantor PPh 4(2))
  officeRentContractId?: string;
  officeRentMonthIndex?: number;
  
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
  | 'PROYEK_PEMERINTAH_BUMN'
  | 'PROYEK_RETAIL'
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

// ==========================================
// EMPLOYEE SALARY & PAYROLL (PENGGAJIAN KARYAWAN)
// ==========================================

export type PayrollStatus = 'PAID' | 'PENDING' | 'DRAFT';

export interface PayrollPayment {
  id: string;
  payrollNumber: string; // e.g. "PAY/2026/08/EMP-001" or "SLIP-202608-01"
  period: string; // e.g. "Agustus 2026", "September 2026", "2026-08"
  paymentDate: string; // YYYY-MM-DD

  // Employee Identity
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
  employeeNik?: string;
  roleTitle: string;
  department: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;

  // Earnings Breakdown (Komponen Penghasilan / Gaji & Tunjangan)
  basicSalary: number; // Gaji Pokok
  positionAllowance: number; // Tunjangan Jabatan / Fungsional
  transportAllowance: number; // Tunjangan Transportasi & Dinas
  mealAllowance: number; // Tunjangan Makan
  projectBonus: number; // Bonus / Insentif Proyek TKDN & Legal
  overtimeAmount: number; // Upah Lembur
  otherAllowances: number; // Tunjangan Lainnya
  totalEarnings: number; // Total Penghasilan Kotor (Gross)

  // Deductions Breakdown (Komponen Potongan)
  bpjsKesehatan: number; // Potongan BPJS Kesehatan (1%)
  bpjsKetenagakerjaan: number; // Potongan BPJS Ketenagakerjaan (2%)
  pph21Amount: number; // Potongan Pajak PPh Pasal 21
  cashAdvanceDeduction: number; // Potongan Kasbon / Pinjaman Karyawan
  otherDeductions: number; // Potongan Absensi / Lainnya
  totalDeductions: number; // Total Potongan

  // Net Payout (Take Home Pay)
  netSalary: number; // totalEarnings - totalDeductions

  // Payment Method & Bank Channel
  paymentMethod: PaymentMethod;
  paymentChannelId?: string; // ID of source bank account (e.g. Bank Mandiri / BRI / BCA)

  // Ledger & Tax Linkage
  status: PayrollStatus;
  transactionId?: string; // Linked ID in FinancialTransaction (Buku Kas & Arus Kas)
  pph21ObligationId?: string; // Linked TaxObligation ID if recorded to Tax Management

  notes?: string;
  recordedBy: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PayrollSummary {
  totalPaidIDR: number;
  totalGrossIDR: number;
  totalDeductionsIDR: number;
  totalPph21IDR: number;
  totalBpjsIDR: number;
  paidCount: number;
  pendingCount: number;
  employeeCount: number;
}

// ==========================================
// KOP SURAT & IDENTITAS PERUSAHAAN (LETTERHEAD)
// ==========================================
export interface CompanyLetterhead {
  companyName: string; // e.g. "PT GAP CONSULTING INDONESIA"
  shortName?: string; // e.g. "GAP.CRM" or "GAP"
  tagline?: string; // e.g. "Statutory TKDN Verification, SNI & Regulatory Advisory Group"
  address?: string; // e.g. "Menara Cakrawala Lt. 12, Jl. M.H. Thamrin No. 9, Menteng, Jakarta Pusat 10340"
  phone?: string; // e.g. "(021) 390-1288"
  email?: string; // e.g. "finance@gapsite.com"
  website?: string; // e.g. "www.gapsite.com"
  taxId?: string; // e.g. "NPWP: 42.891.204.6-014.000"
  logoUrl?: string; // base64 data URL or external image URL
  logoType?: 'IMAGE' | 'INITIALS' | 'ICON';
  logoIconName?: string; // e.g. 'ShieldCheck' | 'Building2' | 'Briefcase' | 'Landmark' | 'Award' | 'FileCheck'
  documentHeaderTheme?: 'EMERALD' | 'SLATE' | 'BLUE' | 'INDIGO';
  authorizedSignatoryName?: string; // e.g. "Bambang Soediro, S.T., M.M."
  authorizedSignatoryTitle?: string; // e.g. "Managing Director & Lead TKDN Verifier"
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ==========================================
// PENETAPAN GAJI TAHUNAN KARYAWAN (ANNUAL SALARY SETUP)
// ==========================================
export interface EmployeeAnnualSalaryConfig {
  id: string; // e.g. "SALCFG-2026-usr-0"
  employeeId: string; // ID karyawan (AppUser.id / TeamMember.id)
  employeeName: string;
  year: number; // Tahun berlaku penetapan gaji (e.g. 2026, 2025, 2027)
  role: UserRole;
  roleTitle?: string;
  department?: string;

  // Komponen Remunerasi Bulanan (Monthly Salary Breakdown)
  basicSalary: number; // Gaji Pokok Bulanan
  positionAllowance: number; // Tunjangan Jabatan / Fungsional
  transportAllowance: number; // Tunjangan Transportasi & Dinas
  mealAllowance: number; // Tunjangan Uang Makan
  communicationAllowance?: number; // Tunjangan Komunikasi & Kuota
  fixedAllowance?: number; // Tunjangan Tetap Lainnya

  // Komponen Tahunan & Variabel (Annual Budget & Bonus Projections)
  annualBonusEstimate?: number; // Proyeksi Bonus Kinerja / Insentif Tahunan
  thrMonths?: number; // Pengali Tunjangan Hari Raya (default 1x Gaji Pokok)

  // Pengaturan Statutori & BPJS
  bpjsKesehatanPercentage?: number; // Standar 1% potongan karyawan
  bpjsTkPercentage?: number; // Standar 2% potongan JHT karyawan

  // Legalitas & Riwayat Penetapan
  skNumber?: string; // Nomor SK Direksi / Surat Keputusan (e.g. SK-DIR/001/SAL/2026)
  effectiveDate?: string; // Tanggal Mulai Berlaku (YYYY-MM-DD)
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  notes?: string;

  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AnnualSalaryStats {
  totalAnnualBudgetIDR: number;
  totalMonthlyPayrollIDR: number;
  averageMonthlySalaryIDR: number;
  configuredEmployeesCount: number;
  year: number;
}

// ==========================================
// PROYEK PEMERINTAH & BUMN (GOVERNMENT PROJECTS & SPK)
// ==========================================

export type GovernmentInstitutionType =
  | 'KEMENTERIAN'
  | 'LEMBAGA'
  | 'DINAS_PEMDA'
  | 'BUMN'
  | 'BUMD'
  | 'BLU'
  | 'UNIVERSITAS_NEGERI'
  | (string & {});

export interface GovernmentInstitutionTypeDefinition {
  id: string; // e.g. "KEMENTERIAN", "BUMN", etc.
  name: string; // e.g. "Kementerian RI"
  code?: string; // Short acronym / code
  defaultPphType: 'PPH_22' | 'PPH_23' | 'PPH_FINAL' | 'NONE';
  defaultPphRate: number; // e.g. 1.5, 2.0
  defaultPpnRate: number; // e.g. 11 or 12
  defaultFundingSource: GovernmentFundingSource;
  description?: string;
  badgeColor?: string; // blue, indigo, emerald, violet, amber, teal, rose, slate
  status: 'ACTIVE' | 'INACTIVE';
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TermMilestoneTemplateItem {
  termNumber: number;
  title: string;
  percentage: number; // e.g. 20
  description?: string;
}

export interface TermDistributionSchemeDefinition {
  id: string; // e.g. "SCHEME_3_TERMIN_20_40_40"
  name: string; // e.g. "Standar 3 Termin (20% - 40% - 40%)"
  description?: string;
  termCount: number;
  terms: TermMilestoneTemplateItem[];
  isSystemDefault?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export type GovernmentFundingSource =
  | 'APBN'
  | 'APBD'
  | 'BUMN_INTERNAL'
  | 'BLU'
  | 'DAK_DAU'
  | 'HIBAH';

export type GovernmentPaymentMechanism =
  | 'LS_KPPN' // Pembayaran Langsung via KPPN (Kas Negara)
  | 'LS_KASDA' // Pembayaran Langsung via Kas Daerah
  | 'UP_GU_BENDAHARA' // Uang Persediaan / Ganti Uang Bendahara
  | 'BUMN_SAP' // Sistem Pembayaran BUMN (SAP / Vendor Portal)
  | 'BANK_GARANSI';

export type GovMilestoneStatus =
  | 'BELUM_DITAGIH' // Not yet billed
  | 'INVOICE_TERBIT' // Tagihan Terbit / Diajukan ke Satker
  | 'PROSES_SPM_KPPN' // SPM dalam proses verifikasi KPPN / Kasda
  | 'SP2D_CAIR' // Dana SP2D sudah cair ke rekening bank perusahaan
  | 'DIBATALKAN';

export interface GovMilestone {
  id: string;
  projectId: string;
  termNumber: number; // 1, 2, 3, etc.
  title: string; // e.g. "Termin 1 (Uang Muka 20%)", "Termin 2 (Progres Fisik 50% & Laporan Antara)", "Termin 3 (Pelunasan 30% & BAST)"
  percentage: number; // e.g. 20
  grossAmountIDR: number; // Nominal Bruto Termin
  
  // Tax calculations for government project (WAPU - Wajib Pungut)
  ppnRatePercent: number; // Standard 11% PPN WAPU
  ppnAmountIDR: number; // PPN dipungut bendahara satker pemerintah
  pphType: 'PPH_22' | 'PPH_23' | 'PPH_FINAL' | 'NONE'; // PPh 22 (1.5%) atau PPh 23 (2%)
  pphRatePercent: number; // 1.5% atau 2.0%
  pphAmountIDR: number; // Potongan PPh oleh bendahara pemerintah
  
  // Net cash disbursement expected to bank account
  netDisbursementIDR: number; // Kas Bersih yang Masuk ke Rekening Bank (Gross - PPh - PPN WAPU jika dipotong KPPN)
  
  // Timeline
  targetDate: string; // Target tanggal penagihan / jatuh tempo (YYYY-MM-DD)
  
  // Status
  status: GovMilestoneStatus;
  
  // Government Statutory Billing References
  invoiceNumber?: string; // Nomor Invoice Resmi (INV/GOV/2026/...)
  bapNumber?: string; // Nomor Berita Acara Pembayaran (BAP)
  bastNumber?: string; // Nomor Berita Acara Serah Terima (BAST)
  spmNumber?: string; // Nomor Surat Perintah Membayar (SPM Satker)
  sp2dNumber?: string; // Nomor SP2D KPPN / Kasda (Surat Perintah Pencairan Dana)
  sp2dDisbursementDate?: string; // Tanggal Dana SP2D Masuk Rekening (YYYY-MM-DD)
  ntpnPpn?: string; // Nomor Transaksi Penerimaan Negara (NTPN Setoran PPN WAPU)
  bupotPphNumber?: string; // Nomor Bukti Potong PPh 22 / PPh 23 dari Satker
  
  // Cross-Module Integration IDs
  receivableId?: string; // ID Piutang Usaha (terhubung ke modul AR)
  transactionId?: string; // ID Transaksi Buku Kas Masuk (terhubung ke Buku Kas & Arus Kas)
  taxObligationPphId?: string; // ID Pajak PPh 22/23 Terhutang/Kredit Pajak (Tax Management)
  taxObligationPpnId?: string; // ID Pajak PPN Keluaran WAPU (Tax Management)
  paymentChannelId?: string; // Akun Rekening Bank Perusahaan Penerima SP2D
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GovernmentProject {
  id: string;
  contractNumber: string; // Nomor SPK / Kontrak Dinas (e.g. "027/SPK-TKDN/KEMENPERIN/2026")
  projectName: string; // Nama Pengadaan / Konsultansi Pemerintah
  institutionType: GovernmentInstitutionType;
  governmentAgency: string; // Kementerian / Satuan Kerja / Dinas / BUMN
  satkerCode?: string; // Kode Satuan Kerja / DIPA / RKA-K/L (e.g. "Satker 412981")
  fiscalYear: number; // Tahun Anggaran (e.g. 2026)
  sourceOfFunds: GovernmentFundingSource; // APBN / APBD / BUMN
  
  // Contact & Officials
  ppkName?: string; // Pejabat Pembuat Komitmen
  ppkNip?: string; // NIP PPK
  treasurerName?: string; // Bendahara Pengeluaran
  treasurerPhone?: string;
  agencyAddress?: string;
  
  // Contract financials
  totalContractValueIDR: number; // Nilai Kontrak Bruto (Termasuk Pajak)
  paymentMechanism: GovernmentPaymentMechanism;
  whtRatePph: number; // e.g. 1.5 or 2.0 (%)
  vatWapuRate: number; // e.g. 11 (%)
  
  startDate: string;
  endDate: string;
  status: 'AKTIF' | 'SELESAI' | 'BATAL' | 'DRAFT';
  
  // Milestones & Termin List
  milestones: GovMilestone[];
  
  // Aggregates
  totalBilledAmountIDR: number; // Sudah diterbitkan Invoice / Masuk Piutang
  totalReceivedAmountIDR: number; // SP2D yang sudah cair ke Kas & Bank
  totalOutstandingAmountIDR: number; // Sisa piutang / termin belum cair
  
  // Linked standard CRM project (optional)
  linkedCrmProjectId?: string;
  
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface GovernmentProjectStats {
  totalProjects: number;
  activeProjects: number;
  totalContractValueIDR: number;
  totalBilledIDR: number;
  totalDisbursedCashIDR: number;
  totalOutstandingReceivablesIDR: number;
  totalWithholdingTaxPaidIDR: number;
  totalVatWapuIDR: number;
  pendingSp2dCount: number;
}

// ==========================================
// RETAIL & CORPORATE PROJECTS (PROYEK RETAIL B2B / SWASTA)
// ==========================================

export type RetailPricingType =
  | 'INCLUDE_PPN' // Nilai kontrak sudah termasuk PPN 11% (Gross include tax)
  | 'EXCLUDE_PPN' // Nilai kontrak belum termasuk PPN 11% (Gross exclude tax)
  | 'NON_PKP'; // Transaksi non-PPN (0%)

export type RetailPphType =
  | 'PPH_23' // PPh 23 Jasa Konsultansi (2.0%) dipotong pihak ketiga
  | 'PPH_FINAL_UMKM' // PPh Final PP 55/2022 (0.5%)
  | 'NONE'; // Tanpa potongan PPh

export type RetailProjectStatus =
  | 'PROSPEK'
  | 'AKTIF'
  | 'SELESAI'
  | 'BATAL'
  | 'ON_HOLD';

export type RetailMilestoneStatus =
  | 'BELUM_DITAGIH' // Not yet billed
  | 'INVOICE_TERBIT' // Tagihan invoice terbit & tercatat ke Piutang Usaha
  | 'DIBAYAR_SEBAGIAN' // Pembayaran parsial masuk
  | 'LUNAS' // Lunas & dana masuk ke Kas & Bank
  | 'BATAL';

export type RetailPaymentScheme =
  | 'LUNAS_DIMUKA' // 100% Full Payment
  | 'TERMIN_2' // 2 Termin (e.g. 50% DP, 50% Pelunasan)
  | 'TERMIN_3' // 3 Termin (e.g. 30% DP, 40% Progress, 30% BAST)
  | 'TERMIN_CUSTOM' // Custom termin
  | 'RETAINER_BULANAN'; // Pembayaran bulanan berkala

export type RetailServiceCategory =
  | 'KONSULTASI_TKDN' // Pendampingan Sertifikasi TKDN Industri
  | 'SERTIFIKASI_BMP' // Bobot Manfaat Perusahaan (BMP)
  | 'PERIZINAN_LEGAL' // OSS-RBA, AMDAL, UKL-UPL, Legalitas
  | 'AUDIT_INTERNAL' // Pre-audit verifikasi LVI Sucofindo / Surveyor Indonesia
  | 'PELATIHAN_ISO' // Workshop & Training ISO/TKDN
  | 'RETAINER_KONSULTASI' // Retainer Bulanan Kepatuhan Regulasi
  | 'LAINNYA';

export interface RetailMilestone {
  id: string;
  projectId: string;
  termNumber: number; // 1, 2, 3, etc.
  title: string; // e.g. "Termin 1 (DP 30%)", "Termin 2 (Audit LVI 40%)", "Termin 3 (Pelunasan 30%)"
  percentage: number; // e.g. 30
  grossAmountIDR: number; // Nominal Bruto Tagihan Termin
  pricingType?: RetailPricingType;
  dppAmountIDR: number; // Dasar Pengenaan Pajak (DPP)
  ppnRatePercent?: number; // Persentase PPN
  ppnAmountIDR: number; // PPN Keluaran 11% Faktur Pajak Standar
  pphType?: RetailPphType; // Jenis PPh (PPH_23 / PPH_FINAL_UMKM / NON_PPH)
  pphRatePercent?: number; // Persentase PPh
  pphAmountIDR: number; // Potongan PPh 23 (2%) oleh Klien Swasta
  netDisbursementIDR: number; // Kas Bersih Masuk Rekening (Gross - PPh 23)
  targetDate: string; // Target tanggal jatuh tempo (YYYY-MM-DD)
  status: RetailMilestoneStatus;

  // Invoice & Perpajakan
  invoiceNumber?: string;
  invoiceDate?: string;
  fakturPajakNumber?: string; // No. e-Faktur Pajak PPN (010.xxx)
  bupotPphNumber?: string; // Nomor Bukti Potong PPh 23 Klien

  // Pembayaran & Arus Kas
  paidAmountIDR?: number; // Total nominal yang sudah dibayar
  paymentDate?: string; // Tanggal pembayaran diterima
  paymentChannelId?: string; // Akun rekening bank / kas perusahaan penerima
  referenceNumber?: string; // Nomor referensi transfer bank / kwitansi

  // Integrasi Cross-Module
  receivableId?: string; // Terhubung ke Buku Piutang Usaha
  transactionId?: string; // Terhubung ke Transaksi Buku Kas & Arus Kas
  taxObligationPpnId?: string; // Terhubung ke Modul Pajak (PPN Keluaran)
  taxObligationPphId?: string; // Terhubung ke Modul Pajak (Kredit Pajak PPh 23)

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RetailProject {
  id: string;
  projectCode: string; // e.g. "PR-2026-001"
  projectName: string; // Nama Proyek / Konsultansi Retail
  clientName: string; // Nama Perusahaan / Klien Retail
  clientContactPerson?: string; // Kontak PIC Klien
  clientPicName?: string; // Alternatif PIC
  clientPicPhone?: string; // Nomor HP PIC
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientNpwp?: string; // NPWP Klien untuk e-Faktur Pajak & Bukti Potong PPh 23
  serviceCategory: RetailServiceCategory;

  // Detail Kontrak & Pricing
  contractNumber?: string; // No. Kontrak / SPK / Purchase Order
  contractDate: string; // Tanggal Kontrak / SPK (YYYY-MM-DD)
  targetCompletionDate: string; // Target Tanggal Selesai (YYYY-MM-DD)
  invoicePaymentTermDays?: number; // Term of Payment (e.g. 14 or 30 days)
  status: RetailProjectStatus;
  pricingType: RetailPricingType;

  // Formulasi Nilai Keuangan & Pajak
  totalContractValueIDR: number; // Nilai Kontrak Kesepakatan
  dppAmountIDR: number; // Dasar Pengenaan Pajak (DPP)
  ppnRatePercent: number; // 11% (atau 0% jika Non-PKP)
  ppnAmountIDR: number; // PPN Keluaran
  pphType: RetailPphType; // PPH_23 (2%), PPH_FINAL_UMKM (0.5%), NONE
  pphRatePercent: number; // 2% / 0.5% / 0%
  pphAmountIDR: number; // Estimasi Potongan PPh oleh Klien
  netCashExpectedIDR: number; // Kas Bersih yang Masuk Rekening Perusahaan

  // Skema Pembayaran & Termin
  paymentScheme: RetailPaymentScheme;
  milestones: RetailMilestone[];

  // Agregasi Finansial
  totalBilledAmountIDR: number; // Sudah diterbitkan Invoice / Masuk Piutang
  totalReceivedAmountIDR: number; // Pembayaran cair ke Kas & Bank
  totalOutstandingAmountIDR: number; // Sisa piutang yang belum dilunasi

  // Terhubung ke Project CRM Utama (Opsional)
  linkedCrmProjectId?: string;

  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface RetailProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalContractValueIDR: number;
  totalBilledIDR: number;
  totalReceivedCashIDR: number;
  totalOutstandingReceivablesIDR: number;
  totalPpnOutputIDR: number;
  totalPphWithheldIDR: number;
}

