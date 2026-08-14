import {
  ProjectStage,
  ServiceType,
  Priority,
  ProjectStatus,
  DocumentType,
  DocumentCategoryGroup,
  DocumentStatus,
  DispositionStatus,
} from '../types';

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatIDRShort = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  }
  return formatIDR(amount);
};

export const getStageName = (stage: ProjectStage): string => {
  switch (stage) {
    case 'INQUIRY':
      return '1. Inquiry & Scoping';
    case 'GAP_ANALYSIS':
      return '2. Gap Analysis';
    case 'DOC_PREPARATION':
      return '3. BOM & Doc Prep';
    case 'FIELD_VERIFICATION':
      return '4. Field Audit (Surveyor)';
    case 'MINISTRY_REVIEW':
      return '5. SIINas Kemenperin Review';
    case 'CERTIFICATE_ISSUED':
      return '6. Certificate Issued';
    case 'CLOSED':
      return 'Completed / Closed';
    default:
      return stage;
  }
};

export const getStageColor = (stage: ProjectStage) => {
  switch (stage) {
    case 'INQUIRY':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'GAP_ANALYSIS':
      return 'bg-amber-50 text-amber-700 border-amber-300';
    case 'DOC_PREPARATION':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'FIELD_VERIFICATION':
      return 'bg-indigo-50 text-indigo-700 border-indigo-300';
    case 'MINISTRY_REVIEW':
      return 'bg-purple-50 text-purple-700 border-purple-300';
    case 'CERTIFICATE_ISSUED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export const getServiceTypeName = (type: ServiceType): string => {
  switch (type) {
    case 'TKDN_BARANG':
      return 'TKDN Barang (Goods)';
    case 'TKDN_JASA':
      return 'TKDN Jasa (Services)';
    case 'BMP_COMPANY':
      return 'Bobot Manfaat Perusahaan (BMP)';
    case 'OSS_RBA_NIB':
      return 'OSS-RBA Licensing & PB-UMKU';
    case 'SNI_CERTIFICATION':
      return 'SNI Product Certification';
    case 'AMDAL_UKL_UPL':
      return 'AMDAL / UKL-UPL Permit';
    default:
      return type;
  }
};

export const getServiceTypeBadgeColor = (type: ServiceType): string => {
  switch (type) {
    case 'TKDN_BARANG':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'TKDN_JASA':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'BMP_COMPANY':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'OSS_RBA_NIB':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'SNI_CERTIFICATION':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'AMDAL_UKL_UPL':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case 'URGENT':
      return { label: 'Urgent', bg: 'bg-red-500 text-white', dot: 'bg-red-200' };
    case 'HIGH':
      return { label: 'High', bg: 'bg-orange-500 text-white', dot: 'bg-orange-200' };
    case 'MEDIUM':
      return { label: 'Medium', bg: 'bg-sky-600 text-white', dot: 'bg-sky-200' };
    case 'LOW':
      return { label: 'Low', bg: 'bg-slate-500 text-white', dot: 'bg-slate-200' };
    default:
      return { label: priority, bg: 'bg-slate-500 text-white', dot: 'bg-slate-200' };
  }
};

export const getStatusBadge = (status: ProjectStatus) => {
  switch (status) {
    case 'ON_TRACK':
      return { label: 'On Track', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'AT_RISK':
      return { label: 'At Risk', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'DELAYED':
      return { label: 'Delayed', color: 'text-red-700 bg-red-50 border-red-200' };
    case 'COMPLETED':
      return { label: 'Certified / Completed', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    default:
      return { label: status, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
};

export const getDocTypeName = (type: DocumentType): string => {
  switch (type) {
    // Offer & Quotations
    case 'OFFER_QUOTATION_LETTER':
      return 'Offer / Quotation Letter (Surat Penawaran)';
    case 'CLIENT_CONTRACT_SPK':
      return 'Client Contract / SPK / MoA';
    case 'NDAS_LEGAL_AGREEMENT':
      return 'Non-Disclosure Agreement (NDA)';

    // Invoices & Receipts
    case 'INVOICE_BILLING':
      return 'Client Billing Invoice (Tagihan)';
    case 'OFFICIAL_RECEIPT_KWITANSI':
      return 'Official Payment Receipt (Kwitansi)';
    case 'DOWN_PAYMENT_PROOF':
      return 'Down Payment / Retainer Slip';
    case 'TAX_FAKTUR_PAJAK':
      return 'Tax Invoice (e-Faktur Pajak)';

    // Expense Proofs & Disbursements
    case 'EXPENSE_PROOF_STRUK':
      return 'Expense Receipt / Struk Pengeluaran';
    case 'SURVEYOR_FEE_RECEIPT':
      return 'Surveyor Official Fee Proof (Sucofindo/SI)';
    case 'TRAVEL_LODGING_RECEIPT':
      return 'Site Visit Flight & Hotel Receipt';
    case 'GOV_PNBP_FILING_RECEIPT':
      return 'Government PNBP / OSS Filing Proof';
    case 'PETTY_CASH_VOUCHER':
      return 'Petty Cash Voucher / Kas Kecil';

    // Technical & TKDN Dossiers
    case 'BOM_EXCEL':
      return 'Bill of Materials (BOM Sheet)';
    case 'COST_ACCOUNTING':
      return 'Cost Accounting & Labor Payroll';
    case 'SUPPLIER_TKDN_CERT':
      return 'Supplier TKDN Certificate';
    case 'FACTORY_ASSET_REGISTRY':
      return 'Fixed Asset & Machine Registry';
    case 'NIB_OSS_DOCS':
      return 'NIB & OSS-RBA Permit';
    case 'SIINAS_PROFILE':
      return 'SIINas Account & Submission';
    case 'AUDIT_VERIFICATION_REPORT':
      return 'Surveyor Verification Report';
    case 'LEGAL_PERMIT':
      return 'Legal / Environmental Permit';
    case 'ISO_QMS_CERT':
      return 'ISO 9001 / 14001 / OHSAS Certificate';
    case 'LAB_TEST_REPORT':
      return 'Accredited Lab Test Report (LUK/B4T)';
    case 'AMDAL_UKL_DOCUMENT':
      return 'AMDAL / UKL-UPL Environmental Document';
    case 'DEED_AHU_LEGAL':
      return 'Company Deed & AHU Kemenkumham Legal';
    default:
      return type;
  }
};

export const getDocCategoryGroup = (type: DocumentType): DocumentCategoryGroup => {
  switch (type) {
    case 'OFFER_QUOTATION_LETTER':
    case 'CLIENT_CONTRACT_SPK':
    case 'NDAS_LEGAL_AGREEMENT':
      return 'OFFER_QUOTATION';

    case 'INVOICE_BILLING':
    case 'OFFICIAL_RECEIPT_KWITANSI':
    case 'DOWN_PAYMENT_PROOF':
    case 'TAX_FAKTUR_PAJAK':
      return 'INVOICE_RECEIPT';

    case 'EXPENSE_PROOF_STRUK':
    case 'SURVEYOR_FEE_RECEIPT':
    case 'TRAVEL_LODGING_RECEIPT':
    case 'GOV_PNBP_FILING_RECEIPT':
    case 'PETTY_CASH_VOUCHER':
      return 'EXPENSE_PROOF';

    case 'BOM_EXCEL':
    case 'COST_ACCOUNTING':
    case 'SUPPLIER_TKDN_CERT':
    case 'FACTORY_ASSET_REGISTRY':
    case 'SIINAS_PROFILE':
    case 'AUDIT_VERIFICATION_REPORT':
    case 'ISO_QMS_CERT':
    case 'LAB_TEST_REPORT':
    case 'AMDAL_UKL_DOCUMENT':
      return 'TECHNICAL_DOSSIER';

    case 'NIB_OSS_DOCS':
    case 'LEGAL_PERMIT':
    case 'DEED_AHU_LEGAL':
      return 'LEGAL_COMPLIANCE';

    default:
      return 'TECHNICAL_DOSSIER';
  }
};

export const getDocCategoryGroupName = (group: DocumentCategoryGroup): string => {
  switch (group) {
    case 'ALL':
      return 'All Vault Documents';
    case 'OFFER_QUOTATION':
      return 'Offers & Quotation Letters';
    case 'INVOICE_RECEIPT':
      return 'Invoices & Official Receipts';
    case 'EXPENSE_PROOF':
      return 'Expense Proofs & Disbursements';
    case 'TECHNICAL_DOSSIER':
      return 'Technical BOM & TKDN Dossiers';
    case 'LEGAL_COMPLIANCE':
      return 'Legal & Licensing Permits';
    default:
      return group;
  }
};

export const getDocCategoryBadge = (group: DocumentCategoryGroup) => {
  switch (group) {
    case 'OFFER_QUOTATION':
      return {
        label: 'Offer / Proposal',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'INVOICE_RECEIPT':
      return {
        label: 'Invoice / Kwitansi',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'EXPENSE_PROOF':
      return {
        label: 'Expense Proof / Struk',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'TECHNICAL_DOSSIER':
      return {
        label: 'Technical Dossier',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'LEGAL_COMPLIANCE':
      return {
        label: 'Legal & Permit',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: 'General Document',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
      };
  }
};

export const getDocStatusBadge = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED':
      return { label: 'Verified', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'FLAGGED_DISCREPANCY':
      return { label: 'Flagged / Needs Fix', color: 'bg-red-100 text-red-800 border-red-300' };
    case 'SUBMITTED_TO_SURVEYOR':
      return { label: 'Sent to Surveyor', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'DRAFT':
      return { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};

export const getDispositionStatusBadge = (status: DispositionStatus) => {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending Assignment', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'AWAITING_CLIENT':
      return { label: 'Awaiting Client Data', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'UNDER_REVIEW':
      return { label: 'Under Lead Review', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'COMPLETED':
      return { label: 'Done / Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'REVISION_NEEDED':
      return { label: 'Needs Revision', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
};

export const getTransactionCategoryLabel = (category: string): string => {
  switch (category) {
    // Income
    case 'CLIENT_CONSULTING_FEE':
      return 'Client Consulting Fee';
    case 'TKDN_MILESTONE_PAYMENT':
      return 'TKDN Milestone Payment';
    case 'SURVEYOR_FACILITATION':
      return 'Surveyor Facilitation Fee';
    case 'LEGAL_RETAINER':
      return 'Legal & OSS Retainer';
    case 'SUCCESS_FEE':
      return 'Certification Success Fee';
    case 'TRAINING_WORKSHOP':
      return 'Training & Workshop Fee';
    case 'OTHER_INCOME':
      return 'Other Operating Income';

    // Expense
    case 'SURVEYOR_AUDIT_FEES':
      return 'Surveyor & Audit Official Fee';
    case 'REGULATORY_FILING':
      return 'Regulatory & NIB Filing Fee';
    case 'CONSULTANT_SALARIES':
      return 'Consultant Honorarium & Payroll';
    case 'OPERATIONAL_OFFICE':
      return 'Office & Utilities Expense';
    case 'TRAVEL_SITE_VISIT':
      return 'Travel & Plant Site Verification';
    case 'SOFTWARE_CLOUD':
      return 'Software, Cloud & SIINas Tools';
    case 'MARKETING_ACQUISITION':
      return 'Marketing & Client Acquisition';
    case 'TAX_PPH_PPN':
      return 'Tax (PPh 23 / PPN / PPh 21)';
    case 'MISCELLANEOUS_EXPENSE':
      return 'Miscellaneous Expense';
    default:
      return category.replace(/_/g, ' ');
  }
};

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'BANK_TRANSFER_BCA':
      return 'BCA Corporate Transfer';
    case 'BANK_TRANSFER_MANDIRI':
      return 'Mandiri Corporate Transfer';
    case 'BANK_TRANSFER_BNI':
      return 'BNI Giro Transfer';
    case 'CORPORATE_CARD':
      return 'Corporate Credit Card';
    case 'PETTY_CASH':
      return 'Petty Cash / Kas Kecil';
    case 'VIRTUAL_ACCOUNT':
      return 'Virtual Account (VA)';
    default:
      return method.replace(/_/g, ' ');
  }
};

export const getTransactionStatusBadge = (status: string) => {
  switch (status) {
    case 'CLEARED':
      return { label: 'Cleared / Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'PENDING':
      return { label: 'Pending Settlement', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'OVERDUE':
      return { label: 'Overdue / Outstanding', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

