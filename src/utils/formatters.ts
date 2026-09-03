import {
  ProjectStage,
  ServiceType,
  Priority,
  ProjectStatus,
  DocumentType,
  DocumentTypeDefinition,
  DocumentCategoryGroup,
  DocumentStatus,
  DispositionStatus,
} from '../types';
import { DEFAULT_DOCUMENT_TYPES } from '../data/documentTypesData';

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyIDR = formatIDR;
export const formatRupiah = formatIDR;

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
      return '4. Field Audit (LVI)';
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

import { DEFAULT_CONSULTING_SERVICES } from '../data/serviceTypesData';

export const getServiceTypeName = (
  type: ServiceType,
  services?: import('../types').ConsultingServiceConfig[]
): string => {
  if (services && services.length > 0) {
    const found = services.find((s) => s.id === type);
    if (found) return found.name;
  }
  const defaultFound = DEFAULT_CONSULTING_SERVICES.find((s) => s.id === type);
  if (defaultFound) return defaultFound.name;

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
      if (typeof type === 'string') {
        return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return type;
  }
};

export const getServiceTypeBadgeColor = (
  type: ServiceType,
  services?: import('../types').ConsultingServiceConfig[]
): string => {
  if (services && services.length > 0) {
    const found = services.find((s) => s.id === type);
    if (found && found.badgeColor) return found.badgeColor;
  }
  const defaultFound = DEFAULT_CONSULTING_SERVICES.find((s) => s.id === type);
  if (defaultFound && defaultFound.badgeColor) return defaultFound.badgeColor;

  switch (type) {
    case 'TKDN_BARANG':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'TKDN_JASA':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'BMP_COMPANY':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'OSS_RBA_NIB':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'SNI_CERTIFICATION':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'AMDAL_UKL_UPL':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    default:
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
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

export const getDocTypeName = (
  type: DocumentType,
  customDocTypes?: DocumentTypeDefinition[]
): string => {
  if (customDocTypes && customDocTypes.length > 0) {
    const found = customDocTypes.find((d) => d.id === type);
    if (found) return found.name;
  }
  const defaultFound = DEFAULT_DOCUMENT_TYPES.find((d) => d.id === type);
  if (defaultFound) return defaultFound.name;

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
      return 'LVI Official Fee Proof (Sucofindo / SI / BKI / etc)';
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
      return 'LVI Verification Report (BAV)';
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
      if (typeof type === 'string') {
        return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return type;
  }
};

export const getDocCategoryGroup = (
  type: DocumentType,
  customDocTypes?: DocumentTypeDefinition[]
): DocumentCategoryGroup => {
  if (customDocTypes && customDocTypes.length > 0) {
    const found = customDocTypes.find((d) => d.id === type);
    if (found) return found.category;
  }
  const defaultFound = DEFAULT_DOCUMENT_TYPES.find((d) => d.id === type);
  if (defaultFound) return defaultFound.category;

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

export const getDocCategoryGroupName = (
  group: DocumentCategoryGroup,
  categories?: import('../types').DocumentCategoryDefinition[]
): string => {
  if (categories && categories.length > 0) {
    const found = categories.find((c) => c.id === group);
    if (found) return found.name;
  }

  switch (group) {
    case 'ALL':
      return 'All Vault Documents';
    case 'OFFER_QUOTATION':
      return 'Offers, Proposals & Contracts';
    case 'INVOICE_RECEIPT':
      return 'Invoices & Official Receipts';
    case 'EXPENSE_PROOF':
      return 'Expense Proofs & Disbursements';
    case 'TECHNICAL_DOSSIER':
      return 'Technical BOM & TKDN Files';
    case 'LEGAL_COMPLIANCE':
      return 'Legal & Statutory Licensing';
    default:
      if (typeof group === 'string') {
        return group.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return group;
  }
};

export const getDocCategoryBadge = (
  group: DocumentCategoryGroup,
  categories?: import('../types').DocumentCategoryDefinition[]
) => {
  if (categories && categories.length > 0) {
    const found = categories.find((c) => c.id === group);
    if (found) {
      return {
        label: found.name,
        color: found.badgeColor || 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-blue-500',
      };
    }
  }

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
        label: 'Technical File',
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
        label: typeof group === 'string' ? group.replace(/_/g, ' ') : 'General Document',
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
      return { label: 'Sent', color: 'bg-purple-100 text-purple-800 border-purple-300' };
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

export const getTransactionCategoryLabel = (
  category: string,
  customCategories?: import('../types').TransactionCategoryDefinition[]
): string => {
  if (customCategories && customCategories.length > 0) {
    const found = customCategories.find((c) => c.id === category);
    if (found) return found.name.toUpperCase();
  }

  switch (category) {
    // 12 Requested Standard Categories
    case 'SURVEYOR_AUDIT_FEES':
    case 'LVI_AUDIT_OFFICIAL_FEE':
      return 'LVI & AUDIT OFFICIAL FEE';
    case 'TAX_PPH_PPN':
      return 'PAJAK PPH 23 (JASA & KONSULTANSI)';
    case 'PAJAK_PPN_11':
    case 'PAJAK__PPN_11__':
      return 'PAJAK PPN 11%';
    case 'GAJI_KARYAWAN':
      return 'GAJI KARYAWAN';
    case 'INTERNET':
      return 'INTERNET';
    case 'LISTRIK':
      return 'LISTRIK';
    case 'OPERASIONAL_KANTOR':
      return 'OPERASIONAL KANTOR (RUTIN)';
    case 'OPERATIONAL_OFFICE':
      return 'OPERASIONAL KANTOR (HARIAN)';
    case 'MAKAN_MINUM':
      return 'MAKAN & MINUM';
    case 'TRANSPORTASI':
      return 'TRANSPORTASI';
    case 'BANK_INTEREST':
      return 'BANK INTEREST';
    case 'SEWA_KANTOR':
      return 'SEWA KANTOR';
    case 'OFFICE_UTILITIES_EXPENSE':
      return 'OFFICE & UTILITIES EXPENSE';
    case 'MISCELLANEOUS_EXPENSE':
      return 'MISCELLANEOUS EXPENSE';

    // Additional Standard Expenses
    case 'ENTERTAINMENT':
      return 'ENTERTAINMENT';
    case 'AKOMODASI':
      return 'AKOMODASI';
    case 'UANG_RAPAT':
      return 'UANG RAPAT';
    case 'LAIN_LAIN':
      return 'LAIN - LAIN';
    case 'REGULATORY_FILING':
      return 'REGULATORY & NIB / PNBP FILING FEE';
    case 'CONSULTANT_SALARIES':
      return 'CONSULTANT HONORARIUM & TENAGA AHLI';
    case 'TRAVEL_SITE_VISIT':
      return 'TRAVEL & PLANT SITE VERIFICATION';
    case 'SOFTWARE_CLOUD':
      return 'SOFTWARE, CLOUD & SIINAS TOOLS';
    case 'MARKETING_ACQUISITION':
      return 'MARKETING & CLIENT ACQUISITION';

    // Income Categories
    case 'CLIENT_CONSULTING_FEE':
      return 'CLIENT CONSULTING FEE';
    case 'TKDN_MILESTONE_PAYMENT':
      return 'TKDN MILESTONE PAYMENT (TERMIN)';
    case 'SURVEYOR_FACILITATION':
      return 'LVI FACILITATION FEE';
    case 'LEGAL_RETAINER':
      return 'LEGAL & OSS RETAINER';
    case 'SUCCESS_FEE':
      return 'CERTIFICATION SUCCESS FEE';
    case 'TRAINING_WORKSHOP':
      return 'TRAINING & WORKSHOP FEE';
    case 'GOVERNMENT_PROJECT_INCOME':
      return 'PENDAPATAN PROYEK PEMERINTAH & BUMN (SP2D)';
    case 'RETAIL_PROJECT_INCOME':
      return 'PENDAPATAN PROYEK RETAIL & KORPORASI SWASTA';
    case 'BANK_LOAN_DISBURSEMENT':
      return 'PENCAIRAN PINJAMAN / HUTANG (LOAN INFLOW)';
    case 'OTHER_INCOME':
      return 'OTHER OPERATING INCOME';

    default:
      return category.replace(/_/g, ' ').toUpperCase();
  }
};

export const getPaymentMethodLabel = (
  method: string,
  customChannels?: import('../types').PaymentChannelDefinition[]
): string => {
  if (customChannels && customChannels.length > 0) {
    const found = customChannels.find((c) => c.id === method);
    if (found) return found.name;
  }

  switch (method) {
    case 'BANK_TRANSFER_BCA':
      return 'BCA Corporate Transfer';
    case 'BANK_TRANSFER_MANDIRI':
      return 'Mandiri Corporate Transfer';
    case 'BANK_TRANSFER_BNI':
      return 'BNI Giro Transfer';
    case 'BANK_TRANSFER_BRI':
      return 'BRI Corporate Transfer';
    case 'BANK_TRANSFER_BSI':
      return 'BSI Giro Syariah';
    case 'CORPORATE_CARD':
      return 'Corporate Credit Card';
    case 'PETTY_CASH':
      return 'Petty Cash / Kas Kecil';
    case 'VIRTUAL_ACCOUNT':
      return 'Virtual Account (VA)';
    case 'QRIS_PAYMENT':
      return 'QRIS & Digital Wallet';
    default:
      return method ? method.replace(/_/g, ' ') : 'General Bank';
  }
};

export const getTransactionStatusBadge = (status: string) => {
  switch (status) {
    case 'CLEARED':
      return { label: 'Cleared / Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'HUTANG':
      return { label: 'Hutang / Pinjaman', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' };
    case 'TERHUTANG':
      return { label: 'Terhutang (Utang Usaha)', color: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' };
    case 'PENDING':
      return { label: 'Pending Settlement', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'OVERDUE':
      return { label: 'Overdue / Outstanding', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

