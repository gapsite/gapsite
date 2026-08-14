export type ServiceType =
  | 'TKDN_BARANG'
  | 'TKDN_JASA'
  | 'BMP_COMPANY'
  | 'OSS_RBA_NIB'
  | 'SNI_CERTIFICATION'
  | 'AMDAL_UKL_UPL';

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
  | 'PT Sucofindo'
  | 'PT Surveyor Indonesia'
  | 'PT Superintending Company'
  | 'Kemenperin SIINas Direct';

export type CompanyType = 'PMDN' | 'PMA' | 'BUMN' | 'UMKM';

export type DocumentCategoryGroup =
  | 'ALL'
  | 'OFFER_QUOTATION'
  | 'INVOICE_RECEIPT'
  | 'EXPENSE_PROOF'
  | 'TECHNICAL_DOSSIER'
  | 'LEGAL_COMPLIANCE';

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
  | 'DEED_AHU_LEGAL';

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
  | 'DIRECTOR'
  | 'LEAD_CONSULTANT'
  | 'TECHNICAL_CONSULTANT'
  | 'SURVEYOR_LIAISON'
  | 'FINANCE_OFFICER'
  | 'CLIENT_VIEWER';

export type UserPermission =
  | 'MANAGE_USERS_ROLES'
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
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions: UserPermission[];
  specialization?: string[];
  activeTaskCount?: number;
  completedTaskCount?: number;
  capacityPercentage?: number;
  lastLoginAt?: string;
  clientCompany?: string; // For CLIENT_VIEWER
  pin?: string;
}

export interface TeamMember extends AppUser {}

export type TransactionType = 'INCOME' | 'EXPENSE';

export type IncomeCategory =
  | 'CLIENT_CONSULTING_FEE'
  | 'TKDN_MILESTONE_PAYMENT'
  | 'SURVEYOR_FACILITATION'
  | 'LEGAL_RETAINER'
  | 'SUCCESS_FEE'
  | 'TRAINING_WORKSHOP'
  | 'OTHER_INCOME';

export type ExpenseCategory =
  | 'SURVEYOR_AUDIT_FEES'
  | 'REGULATORY_FILING'
  | 'CONSULTANT_SALARIES'
  | 'OPERATIONAL_OFFICE'
  | 'TRAVEL_SITE_VISIT'
  | 'SOFTWARE_CLOUD'
  | 'MARKETING_ACQUISITION'
  | 'TAX_PPH_PPN'
  | 'MISCELLANEOUS_EXPENSE';

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type PaymentMethod =
  | 'BANK_TRANSFER_BCA'
  | 'BANK_TRANSFER_MANDIRI'
  | 'BANK_TRANSFER_BNI'
  | 'CORPORATE_CARD'
  | 'PETTY_CASH'
  | 'VIRTUAL_ACCOUNT';

export type TransactionStatus = 'CLEARED' | 'PENDING' | 'OVERDUE';

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
  notes?: string;
  recordedBy: string;
  attachmentName?: string;
  createdAt: string;
}
