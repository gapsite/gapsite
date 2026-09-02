import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Download,
  Trash2,
  Edit2,
  Filter,
  Plus,
  Briefcase,
  Receipt,
  CreditCard,
  Layers,
  Scale,
  DollarSign,
  Calendar,
  Building,
  Eye,
  FileSpreadsheet,
  Tag,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  ArrowUpRight,
  Info,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  ProjectDocument,
  DocumentType,
  DocumentCategoryGroup,
  DocumentStatus,
  ConsultingProject,
} from '../types';
import {
  getDocTypeName,
  getDocStatusBadge,
  getDocCategoryGroup,
  getDocCategoryGroupName,
  getDocCategoryBadge,
  formatIDR,
  formatIDRShort,
} from '../utils/formatters';
import { CategorizedUploadModal } from './CategorizedUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentTypeManagerModal } from './DocumentTypeManagerModal';

export const DocumentManager: React.FC = () => {
  const {
    projects,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
    currentUser,
    setSelectedProjectId,
    documentTypes,
    isMasterAdmin,
    isGoogleDriveConnected,
    connectGoogleDrive,
    disconnectGoogleDriveAccount,
    isDriveSyncing,
    syncDocumentToGoogleDrive,
  } = useProjects();

  // Active Sub-menu Category
  const [activeCategoryGroup, setActiveCategoryGroup] = useState<DocumentCategoryGroup>('ALL');

  // Document Types Master Manager Modal
  const [isDocTypeModalOpen, setIsDocTypeModalOpen] = useState<boolean>(false);

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadCategoryTarget, setUploadCategoryTarget] = useState<DocumentCategoryGroup>('OFFER_QUOTATION');

  // Inline Review Notes state
  const [reviewNoteInput, setReviewNoteInput] = useState<{ [docId: string]: string }>({});
  const [editingNotesDocId, setEditingNotesDocId] = useState<string | null>(null);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<(ProjectDocument & { projectCode: string; clientName: string; productName: string }) | null>(null);

  // Flatten all documents across projects and augment with project metadata and categoryGroup
  const allDocs = projects.flatMap((p) =>
    p.documents.map((d) => {
      const derivedCategory = d.categoryGroup || getDocCategoryGroup(d.type);
      return {
        ...d,
        categoryGroup: derivedCategory,
        projectCode: p.code,
        clientName: p.clientName,
        productName: p.productOrServiceName,
      };
    })
  );

  // Category counts
  const categoryCounts = {
    ALL: allDocs.length,
    OFFER_QUOTATION: allDocs.filter((d) => d.categoryGroup === 'OFFER_QUOTATION').length,
    INVOICE_RECEIPT: allDocs.filter((d) => d.categoryGroup === 'INVOICE_RECEIPT').length,
    EXPENSE_PROOF: allDocs.filter((d) => d.categoryGroup === 'EXPENSE_PROOF').length,
    TECHNICAL_DOSSIER: allDocs.filter((d) => d.categoryGroup === 'TECHNICAL_DOSSIER').length,
    LEGAL_COMPLIANCE: allDocs.filter((d) => d.categoryGroup === 'LEGAL_COMPLIANCE').length,
  };

  // Filtered documents
  const filteredDocs = allDocs.filter((doc) => {
    // 1. Sub-menu Category filter
    if (activeCategoryGroup !== 'ALL' && doc.categoryGroup !== activeCategoryGroup) {
      return false;
    }
    // 2. Project filter
    if (selectedProjectFilter !== 'ALL' && doc.projectId !== selectedProjectFilter) {
      return false;
    }
    // 3. Document Type filter
    if (selectedTypeFilter !== 'ALL' && doc.type !== selectedTypeFilter) {
      return false;
    }
    // 4. Status filter
    if (selectedStatusFilter !== 'ALL' && doc.status !== selectedStatusFilter) {
      return false;
    }
    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchClient = doc.clientName.toLowerCase().includes(q);
      const matchCode = doc.projectCode.toLowerCase().includes(q);
      const matchRef = doc.referenceNumber?.toLowerCase().includes(q) || false;
      const matchCounterparty = doc.counterpartyName?.toLowerCase().includes(q) || false;
      const matchNotes = doc.notes?.toLowerCase().includes(q) || false;
      if (!matchName && !matchClient && !matchCode && !matchRef && !matchCounterparty && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  // Calculate dynamic metrics for the active category sub-menu
  const offersDocs = allDocs.filter((d) => d.categoryGroup === 'OFFER_QUOTATION');
  const totalQuotedValue = offersDocs.reduce((sum, d) => sum + (d.amountIDR || 0), 0);

  const invoiceDocs = allDocs.filter((d) => d.categoryGroup === 'INVOICE_RECEIPT');
  const totalInvoicedValue = invoiceDocs.reduce((sum, d) => sum + (d.amountIDR || 0), 0);

  const expenseDocs = allDocs.filter((d) => d.categoryGroup === 'EXPENSE_PROOF');
  const totalExpenseProofValue = expenseDocs.reduce((sum, d) => sum + (d.amountIDR || 0), 0);

  const technicalDocs = allDocs.filter((d) => d.categoryGroup === 'TECHNICAL_DOSSIER');
  const verifiedTechCount = technicalDocs.filter((d) => d.status === 'VERIFIED').length;

  const handleQuickVerify = (projectId: string, docId: string) => {
    updateDocumentStatus(projectId, docId, 'VERIFIED');
  };

  const handleFlagDiscrepancy = (projectId: string, docId: string) => {
    const note = reviewNoteInput[docId] || 'Discrepancy identified in documentation or cost breakdown.';
    updateDocumentStatus(projectId, docId, 'FLAGGED_DISCREPANCY', note);
    setEditingNotesDocId(null);
  };

  const handleSendToSurveyor = (projectId: string, docId: string) => {
    updateDocumentStatus(projectId, docId, 'SUBMITTED_TO_SURVEYOR');
  };

  const openCategorizedUpload = (category: DocumentCategoryGroup) => {
    setUploadCategoryTarget(category);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Document & Commercial File Vault
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Categorized document repository for Commercial Offers, Invoices/Receipts, Expense Proofs, and Technical BOM Files
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Google Drive Status & Connection */}
          <button
            onClick={() => {
              if (isGoogleDriveConnected) {
                if (confirm('Google Drive is connected. Would you like to disconnect or switch account?')) {
                  disconnectGoogleDriveAccount();
                }
              } else {
                connectGoogleDrive();
              }
            }}
            disabled={isDriveSyncing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isGoogleDriveConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 shadow-xs'
            }`}
            title={isGoogleDriveConnected ? "Google Drive Connected (Click to disconnect/reconnect)" : "Connect Google Drive Vault"}
          >
            {isDriveSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <HardDrive className={`w-3.5 h-3.5 ${isGoogleDriveConnected ? 'text-emerald-600' : 'text-indigo-600'}`} />
            )}
            <span>{isGoogleDriveConnected ? 'Drive Connected' : 'Connect Drive'}</span>
            {isGoogleDriveConnected && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Vault Files: <span className="font-mono font-bold text-slate-900">{allDocs.length}</span>
          </div>
          <button
            id="btn-open-doctype-manager-from-docs"
            onClick={() => setIsDocTypeModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isMasterAdmin
                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Configure Required Document Types Master Catalog (admin.master)"
          >
            <FileText className={`w-4 h-4 ${isMasterAdmin ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Master Doc Types ({documentTypes.length})</span>
          </button>
          <button
            onClick={() => openCategorizedUpload(activeCategoryGroup === 'ALL' ? 'OFFER_QUOTATION' : activeCategoryGroup)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Categorized File</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-menus Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-1">
          {/* Sub-menu 1: All Documents */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('ALL')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>All Files</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'ALL'
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categoryCounts.ALL}
            </span>
          </button>

          {/* Sub-menu 2: Offer & Quotations */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('OFFER_QUOTATION')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'OFFER_QUOTATION'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Offers & Quotes</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'OFFER_QUOTATION'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {categoryCounts.OFFER_QUOTATION}
            </span>
          </button>

          {/* Sub-menu 3: Invoices & Receipts */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('INVOICE_RECEIPT')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'INVOICE_RECEIPT'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>Invoices & Kwitansi</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'INVOICE_RECEIPT'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {categoryCounts.INVOICE_RECEIPT}
            </span>
          </button>

          {/* Sub-menu 4: Expense Proofs & Struk */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('EXPENSE_PROOF')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'EXPENSE_PROOF'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/20'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Expense Proofs</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'EXPENSE_PROOF'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {categoryCounts.EXPENSE_PROOF}
            </span>
          </button>

          {/* Sub-menu 5: Technical Files & BOM */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('TECHNICAL_DOSSIER')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'TECHNICAL_DOSSIER'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Technical & BOM</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'TECHNICAL_DOSSIER'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {categoryCounts.TECHNICAL_DOSSIER}
            </span>
          </button>

          {/* Sub-menu 6: Legal & Permits */}
          <button
            type="button"
            onClick={() => setActiveCategoryGroup('LEGAL_COMPLIANCE')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryGroup === 'LEGAL_COMPLIANCE'
                ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/20'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Legal Permits</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeCategoryGroup === 'LEGAL_COMPLIANCE'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {categoryCounts.LEGAL_COMPLIANCE}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Menu Banner & Contextual KPI Ribbon */}
      {activeCategoryGroup === 'OFFER_QUOTATION' && (
        <div className="bg-linear-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-4.5 border border-indigo-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Offers, Proposals & Client Contracts (SPK)
              </h3>
              <p className="text-xs text-indigo-200">
                Official quotation letters with pricing milestones, scopes of work, NDAs, and signed consulting contracts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                Total Quoted Pipeline Value
              </p>
              <p className="text-sm font-mono font-bold text-white">{formatIDR(totalQuotedValue)}</p>
            </div>
            <button
              onClick={() => openCategorizedUpload('OFFER_QUOTATION')}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Offer / SPK</span>
            </button>
          </div>
        </div>
      )}

      {activeCategoryGroup === 'INVOICE_RECEIPT' && (
        <div className="bg-linear-to-r from-emerald-950 to-slate-900 text-white rounded-xl p-4.5 border border-emerald-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Invoices, Official Kwitansi & e-Faktur Pajak
              </h3>
              <p className="text-xs text-emerald-200">
                Client billing requests, paid down-payment receipts, bank payment confirmations, and tax invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                Total Invoiced / Received
              </p>
              <p className="text-sm font-mono font-bold text-white">{formatIDR(totalInvoicedValue)}</p>
            </div>
            <button
              onClick={() => openCategorizedUpload('INVOICE_RECEIPT')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Invoice / Receipt</span>
            </button>
          </div>
        </div>
      )}

      {activeCategoryGroup === 'EXPENSE_PROOF' && (
        <div className="bg-linear-to-r from-rose-950 to-slate-900 text-white rounded-xl p-4.5 border border-rose-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Expense Proofs, LVI Fee Slips & Struk Pengeluaran
              </h3>
              <p className="text-xs text-rose-200">
                LVI official verification fees, factory site inspection travel, hotel bills, and PNBP filings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-300">
                Total Documented Expenses
              </p>
              <p className="text-sm font-mono font-bold text-white">{formatIDR(totalExpenseProofValue)}</p>
            </div>
            <button
              onClick={() => openCategorizedUpload('EXPENSE_PROOF')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Expense Proof</span>
            </button>
          </div>
        </div>
      )}

      {activeCategoryGroup === 'TECHNICAL_DOSSIER' && (
        <div className="bg-linear-to-r from-blue-950 to-slate-900 text-white rounded-xl p-4.5 border border-blue-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Technical BOM Files, Cost Sheets & Supplier Certs
              </h3>
              <p className="text-xs text-blue-200">
                Multi-level Bill of Materials spreadsheets, cost accounting ledgers, direct labor payroll, and machine registries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
                Verified Technical Files
              </p>
              <p className="text-sm font-mono font-bold text-white">
                {verifiedTechCount} / {technicalDocs.length} Files
              </p>
            </div>
            <button
              onClick={() => openCategorizedUpload('TECHNICAL_DOSSIER')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Technical BOM</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Documents */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, reference #, client..."
              className="text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-emerald-500 w-full"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.clientName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as DocumentStatus | 'ALL')}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="FLAGGED_DISCREPANCY">Flagged Discrepancy</option>
            <option value="SUBMITTED_TO_SURVEYOR">Sent</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>
            Displaying <strong className="text-slate-900">{filteredDocs.length}</strong> of{' '}
            <strong className="text-slate-900">{allDocs.length}</strong> files
          </span>
        </div>
      </div>

      {/* Documents Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">
                <th className="py-3 px-4 text-center">Document Title & File</th>
                <th className="py-3 px-3 text-center">Project & Client</th>
                <th className="py-3 px-3 text-center">Category & Subtype</th>
                {activeCategoryGroup === 'OFFER_QUOTATION' && <th className="py-3 px-3 text-center">Quotation Value</th>}
                {activeCategoryGroup === 'INVOICE_RECEIPT' && <th className="py-3 px-3 text-center">Billed / Tax</th>}
                {activeCategoryGroup === 'EXPENSE_PROOF' && <th className="py-3 px-3 text-center">Disbursed Amount</th>}
                <th className="py-3 px-3 text-center">Verification Status</th>
                <th className="py-3 px-3 text-center">Date & Author</th>
                <th className="py-3 px-4 text-center w-[220px] min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No files found in this category</p>
                      <p className="text-[11px] text-slate-500">
                        Upload a file or adjust search filters above.
                      </p>
                      <button
                        onClick={() => openCategorizedUpload(activeCategoryGroup === 'ALL' ? 'OFFER_QUOTATION' : activeCategoryGroup)}
                        className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Now</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const statusInfo = getDocStatusBadge(doc.status);
                  const catBadge = getDocCategoryBadge(doc.categoryGroup || 'TECHNICAL_DOSSIER');
                  const isEditingNotes = editingNotesDocId === doc.id;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* File Name & Format */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5 group-hover:bg-white group-hover:shadow-xs transition-all">
                            {doc.categoryGroup === 'OFFER_QUOTATION' && (
                              <Briefcase className="w-4 h-4 text-indigo-600" />
                            )}
                            {doc.categoryGroup === 'INVOICE_RECEIPT' && (
                              <Receipt className="w-4 h-4 text-emerald-600" />
                            )}
                            {doc.categoryGroup === 'EXPENSE_PROOF' && (
                              <CreditCard className="w-4 h-4 text-rose-600" />
                            )}
                            {doc.categoryGroup === 'TECHNICAL_DOSSIER' && (
                              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            )}
                            {doc.categoryGroup === 'LEGAL_COMPLIANCE' && (
                              <Scale className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="text-left group/title flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="font-bold text-slate-900 text-xs group-hover/title:text-blue-600 transition-colors">
                                {doc.name}
                              </span>
                              {doc.referenceNumber && (
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                                  #{doc.referenceNumber}
                                </span>
                              )}
                              {doc.googleDriveWebViewLink ? (
                                <a
                                  href={doc.googleDriveWebViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200"
                                  title="Open in Google Drive"
                                >
                                  <HardDrive className="w-3 h-3 text-emerald-600" />
                                  <span>Drive</span>
                                  <ArrowUpRight className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const res = await syncDocumentToGoogleDrive(doc.projectId, doc.id, doc.fileUrl);
                                    if (res.success) {
                                      alert('Uploaded to Google Drive project folder!');
                                    } else {
                                      alert(`Drive notice: ${res.error || 'Failed'}`);
                                    }
                                  }}
                                  disabled={isDriveSyncing}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                                  title={isGoogleDriveConnected ? "Sync to Google Drive" : "Connect Drive & Push"}
                                >
                                  <HardDrive className="w-3 h-3" />
                                  <span>Sync Drive</span>
                                </button>
                              )}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>{doc.fileSize}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 font-medium">{doc.version}</span>
                              {doc.counterpartyName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 font-medium truncate max-w-[140px]">
                                    {doc.counterpartyName}
                                  </span>
                                </>
                              )}
                            </div>
                            {doc.notes && (
                              <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1 italic">
                                "{doc.notes}"
                              </p>
                            )}
                            {doc.reviewNotes && (
                              <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 mt-1 font-medium">
                                Flag: {doc.reviewNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project & Client */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedProjectId(doc.projectId)}
                          className="text-left group/btn"
                        >
                          <span className="font-mono font-bold text-slate-900 text-xs block group-hover/btn:text-emerald-700 underline-offset-2 hover:underline">
                            {doc.projectCode}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium line-clamp-1">
                            {doc.clientName}
                          </span>
                        </button>
                      </td>

                      {/* Category & Doc Type */}
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catBadge.color} mb-1`}>
                          {catBadge.label}
                        </span>
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-1">
                          {getDocTypeName(doc.type)}
                        </p>
                      </td>

                      {/* Sub-menu specific valuation columns */}
                      {activeCategoryGroup === 'OFFER_QUOTATION' && (
                        <td className="py-3 px-3">
                          {doc.amountIDR ? (
                            <div>
                              <span className="font-mono font-bold text-xs text-indigo-900 block">
                                {formatIDR(doc.amountIDR)}
                              </span>
                              {doc.validUntil && (
                                <span className="text-[10px] text-slate-400">
                                  Valid to: {doc.validUntil}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      )}

                      {activeCategoryGroup === 'INVOICE_RECEIPT' && (
                        <td className="py-3 px-3">
                          {doc.amountIDR ? (
                            <div>
                              <span className="font-mono font-bold text-xs text-emerald-900 block">
                                {formatIDR(doc.amountIDR)}
                              </span>
                              {doc.taxNumber && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  FP: {doc.taxNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      )}

                      {activeCategoryGroup === 'EXPENSE_PROOF' && (
                        <td className="py-3 px-3">
                          {doc.amountIDR ? (
                            <div>
                              <span className="font-mono font-bold text-xs text-rose-900 block">
                                {formatIDR(doc.amountIDR)}
                              </span>
                              {doc.paymentMethod && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {doc.paymentMethod.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {doc.verifiedBy && (
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            By {doc.verifiedBy.split(',')[0]}
                          </p>
                        )}
                      </td>

                      {/* Upload Date & Author */}
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        <p className="font-medium text-slate-800">{doc.uploadedBy.split(',')[0]}</p>
                        <p className="text-slate-400 font-mono">{doc.uploadDate}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 w-[220px] min-w-[220px]">
                        <div className="flex items-center justify-start gap-2">
                          {/* Fixed Column: Edit & Trash Icons always stay in exact same position */}
                          <div className="flex items-center gap-1 shrink-0 w-14">
                            {/* Edit / Inspect Document Button */}
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit / Inspect Document Details & Verification Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Document Button - ONLY admin.master */}
                            <button
                              onClick={() => {
                                if (!isMasterAdmin) {
                                  alert('Access Denied: Only admin.master (Master Admin) can delete documents from repository.');
                                  return;
                                }
                                if (confirm(`Remove "${doc.name}" from repository? This action cannot be undone.`)) {
                                  deleteDocument(doc.projectId, doc.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isMasterAdmin
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-rose-400 cursor-not-allowed opacity-60'
                              }`}
                              title={isMasterAdmin ? "Delete file (admin.master)" : "Protected: Only admin.master can delete documents"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dynamic Status Action Buttons (Placed to the right without shifting the icon columns) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Quick Verify */}
                            {doc.status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleQuickVerify(doc.projectId, doc.id)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Mark document verified"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {/* Flag Discrepancy */}
                            {doc.status !== 'FLAGGED_DISCREPANCY' && (
                              <button
                                onClick={() => setEditingNotesDocId(doc.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-[10px] font-bold border border-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Flag discrepancy in cost or supplier certificate"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Flag Gap</span>
                              </button>
                            )}

                            {/* Send */}
                            {doc.status === 'VERIFIED' && (
                              <button
                                onClick={() => handleSendToSurveyor(doc.projectId, doc.id)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded text-[10px] font-bold border border-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Send verified file to LVI (Lembaga Verifikasi Independen)"
                              >
                                <span>Send</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Note Input popover if editing */}
                        {isEditingNotes && (
                          <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-left shadow-md animate-in fade-in zoom-in-95">
                            <label className="block text-[10px] font-bold uppercase text-rose-800 mb-1">
                              Specify Gap / Discrepancy Note:
                            </label>
                            <input
                              type="text"
                              value={reviewNoteInput[doc.id] || ''}
                              onChange={(e) =>
                                setReviewNoteInput((prev) => ({ ...prev, [doc.id]: e.target.value }))
                              }
                              placeholder="e.g. Imported resin price exceeds allowance..."
                              className="w-full text-xs bg-white border border-rose-300 rounded px-2 py-1.5 text-slate-800 mb-1.5"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingNotesDocId(null)}
                                className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-900"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleFlagDiscrepancy(doc.projectId, doc.id)}
                                className="px-2.5 py-1 text-[10px] bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                              >
                                Save Flag Note
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail / Full Preview & Compliance Inspector Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* Categorized File Upload Modal */}
      <CategorizedUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialCategory={uploadCategoryTarget}
      />

      {/* Required Document Types Master Manager Modal (admin.master) */}
      <DocumentTypeManagerModal
        isOpen={isDocTypeModalOpen}
        onClose={() => setIsDocTypeModalOpen(false)}
      />
    </div>
  );
};
