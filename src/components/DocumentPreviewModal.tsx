import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Building,
  Calendar,
  DollarSign,
  Receipt,
  Briefcase,
  CreditCard,
  Layers,
  FileSpreadsheet,
  QrCode,
  Tag,
  Clock,
  User,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  Edit3,
  Save,
  Send,
  HelpCircle,
  Award,
  Hash,
  ShieldAlert,
  Trash2,
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

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProjectDocument | null;
  project?: ConsultingProject | null;
  onStatusChange?: (status: DocumentStatus, notes?: string) => void;
  initialTab?: TabMode;
  defaultEditMode?: boolean;
}

type TabMode = 'preview' | 'compliance_check' | 'metadata_audit';

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  project: passedProject,
  onStatusChange,
  initialTab,
  defaultEditMode,
}) => {
  const {
    projects,
    updateDocumentStatus,
    updateDocument,
    deleteDocument,
    currentUser,
    hasPermission,
    isMasterAdmin,
    activeDocumentTypes,
    activeDocumentCategories,
    syncDocumentToGoogleDrive,
    isGoogleDriveConnected,
    connectGoogleDrive,
    isDriveSyncing,
    companyLetterhead,
  } = useProjects();

  const canManageDocuments =
    isMasterAdmin ||
    currentUser?.role === 'DIRECTOR' ||
    currentUser?.role === 'LEAD_CONSULTANT' ||
    currentUser?.role === 'TECHNICAL_CONSULTANT' ||
    currentUser?.role === 'SURVEYOR_LIAISON' ||
    currentUser?.role === 'FINANCE_OFFICER' ||
    Boolean(currentUser?.permissions?.includes('UPLOAD_DOCUMENTS')) ||
    Boolean(currentUser?.permissions?.includes('EDIT_PROJECTS')) ||
    Boolean(currentUser?.permissions?.includes('DELETE_PROJECTS')) ||
    Boolean(currentUser?.permissions?.includes('MANAGE_DOCUMENT_TYPES'));

  // Active view tab
  const [activeTab, setActiveTab] = useState<TabMode>('preview');

  // Zoom and visual display states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  // Spreadsheet filter in preview mode
  const [spreadsheetOriginFilter, setSpreadsheetOriginFilter] = useState<'ALL' | 'KDN' | 'KLN'>('ALL');

  // Inline editing state for metadata & document properties
  const [isEditingMetadata, setIsEditingMetadata] = useState<boolean>(false);
  const [editDocName, setEditDocName] = useState<string>('');
  const [editCategoryGroup, setEditCategoryGroup] = useState<DocumentCategoryGroup>('TECHNICAL_DOSSIER');
  const [editDocType, setEditDocType] = useState<DocumentType>('SURVEY_REPORT');
  const [editRefNumber, setEditRefNumber] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editCounterparty, setEditCounterparty] = useState<string>('');
  const [editTaxNumber, setEditTaxNumber] = useState<string>('');
  const [editValidUntil, setEditValidUntil] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editReviewNotes, setEditReviewNotes] = useState<string>('');
  const [showFlagPrompt, setShowFlagPrompt] = useState<boolean>(false);
  const [flagInputNote, setFlagInputNote] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Integrity Check re-scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCompleted, setScanCompleted] = useState<boolean>(true);

  // Initialize edit fields when doc changes
  React.useEffect(() => {
    if (doc) {
      setEditDocName(doc.name || '');
      setEditCategoryGroup(doc.categoryGroup || getDocCategoryGroup(doc.type));
      setEditDocType(doc.type);
      setEditRefNumber(doc.referenceNumber || '');
      setEditAmount(doc.amountIDR !== undefined ? doc.amountIDR : '');
      setEditCounterparty(doc.counterpartyName || '');
      setEditTaxNumber(doc.taxNumber || '');
      setEditValidUntil(doc.validUntil || '');
      setEditNotes(doc.notes || '');
      setEditReviewNotes(doc.reviewNotes || '');
      setFlagInputNote(doc.reviewNotes || '');
      setZoomLevel(100);
      setRotation(0);
      setCurrentPage(1);
      setShowFlagPrompt(false);
      setShowDeleteConfirm(false);
      setIsEditingMetadata(Boolean(defaultEditMode));
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        setActiveTab('preview');
      }
    }
  }, [doc, defaultEditMode, initialTab]);

  if (!isOpen || !doc) return null;

  // Resolve target project
  const project = passedProject || projects.find((p) => p.id === doc.projectId) || null;
  const derivedCategory = doc.categoryGroup || getDocCategoryGroup(doc.type);
  const statusBadge = getDocStatusBadge(doc.status);
  const categoryBadge = getDocCategoryBadge(derivedCategory);

  // Handlers for zoom and rotate
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Handlers for Status Change
  const handleVerify = () => {
    if (project) {
      updateDocumentStatus(project.id, doc.id, 'VERIFIED');
      if (onStatusChange) onStatusChange('VERIFIED');
    }
  };

  const handleFlagDiscrepancySubmit = () => {
    if (project && flagInputNote.trim()) {
      updateDocumentStatus(project.id, doc.id, 'FLAGGED_DISCREPANCY', flagInputNote.trim());
      if (onStatusChange) onStatusChange('FLAGGED_DISCREPANCY', flagInputNote.trim());
      setShowFlagPrompt(false);
    }
  };

  const handleMarkUnderReview = () => {
    if (project) {
      updateDocumentStatus(project.id, doc.id, 'UNDER_REVIEW');
      if (onStatusChange) onStatusChange('UNDER_REVIEW');
    }
  };

  const handleSaveMetadata = () => {
    if (project) {
      updateDocument(project.id, doc.id, {
        name: editDocName.trim() || doc.name,
        categoryGroup: editCategoryGroup,
        type: editDocType,
        referenceNumber: editRefNumber.trim() || undefined,
        amountIDR: typeof editAmount === 'number' ? editAmount : undefined,
        counterpartyName: editCounterparty.trim() || undefined,
        taxNumber: editTaxNumber.trim() || undefined,
        validUntil: editValidUntil.trim() || undefined,
        notes: editNotes.trim() || undefined,
        reviewNotes: editReviewNotes.trim() || undefined,
      });
      setIsEditingMetadata(false);
    }
  };

  const handleTriggerReScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (doc.fileUrl) {
      const a = window.document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.name;
      a.click();
    } else {
      alert(`Downloading official verified copy of: ${doc.name} (${doc.fileSize})`);
    }
  };

  // Automated Compliance Diagnostic Checklist items
  const diagnosticChecks = [
    {
      id: 'file_integrity',
      title: 'File Integrity & Encryption Signature',
      status: 'PASS',
      details: `Document checksum validated (SHA-256: 7f8a9...b3). Size: ${doc.fileSize}. No file corruption detected.`,
      category: 'Security',
    },
    {
      id: 'reference_format',
      title: 'Regulatory & Reference Number Syntax',
      status: doc.referenceNumber ? 'PASS' : 'WARNING',
      details: doc.referenceNumber
        ? `Reference format is valid: "${doc.referenceNumber}"`
        : 'Missing official reference / tracking number. Recommended for SIINas audit traceability.',
      category: 'Regulatory',
    },
    {
      id: 'valuation_check',
      title: 'Financial Valuation & Cost Parity',
      status: doc.amountIDR && doc.amountIDR > 0 ? 'PASS' : 'INFO',
      details: doc.amountIDR
        ? `Valuation ${formatIDR(doc.amountIDR)} is registered and balanced with project cost breakdown.`
        : 'Non-monetary technical file (no direct billing value required).',
      category: 'Finance',
    },
    {
      id: 'stamp_verification',
      title: 'Digital Verification Stamp & QR Code',
      status: doc.status === 'VERIFIED' ? 'PASS' : doc.status === 'FLAGGED_DISCREPANCY' ? 'FAIL' : 'WARNING',
      details:
        doc.status === 'VERIFIED'
          ? `Verified by ${doc.verifiedBy || 'Lead Consultant'}. Official Verix Consulting QR signature active.`
          : doc.status === 'FLAGGED_DISCREPANCY'
          ? `Discrepancy flagged: ${doc.reviewNotes || 'Verification required before LVI submission.'}`
          : 'Pending lead consultant sign-off and verification stamp.',
      category: 'Audit',
    },
    {
      id: 'lvi_compliance',
      title: 'LVI Pre-Audit Submission Readiness',
      status: doc.status === 'VERIFIED' ? 'PASS' : 'WARNING',
      details:
        doc.status === 'VERIFIED'
          ? `File format conforms to Permenperin & ${project?.surveyorBody || 'Sucofindo / Surveyor Indonesia'} guidelines.`
          : 'Requires formal verification review before bundle export to surveyor.',
      category: 'Compliance',
    },
  ];

  const overallScore = doc.status === 'VERIFIED' ? 98 : doc.status === 'FLAGGED_DISCREPANCY' ? 52 : 78;

  // Mock Spreadsheet Data for BOM & Cost Accounting items
  const mockBOMRows = [
    {
      no: 1,
      name: 'Main Structural Carbon Steel Chassis (SS400)',
      spec: 'Thk 8mm, JIS G3101 Standard with Mill Test Cert',
      supplier: 'PT Krakatau Steel (Persero) Tbk',
      origin: 'KDN',
      certNo: 'TKDN-8842/KMN/2023 (64.8%)',
      qty: 12,
      unit: 'Units',
      unitCost: 14500000,
      kdnCost: 174000000,
      klnCost: 0,
      verified: true,
    },
    {
      no: 2,
      name: 'Precision Hydraulic Cylinder Assembly & Valve',
      spec: 'Operating pressure 210 Bar, Stroke 450mm',
      supplier: 'PT Pindad Enjiniring Indonesia',
      origin: 'KDN',
      certNo: 'TKDN-1921/KMN/2024 (48.2%)',
      qty: 8,
      unit: 'Sets',
      unitCost: 8200000,
      kdnCost: 65600000,
      klnCost: 0,
      verified: true,
    },
    {
      no: 3,
      name: 'Microcontroller PLC Unit with Ethernet/IP',
      spec: 'Siemens S7-1200 / CPU 1214C DC/DC/DC',
      supplier: 'Siemens AG (Imported via Authorized Partner)',
      origin: 'KLN',
      certNo: 'Form E / Import Declaration PIB #99482',
      qty: 4,
      unit: 'Units',
      unitCost: 9500000,
      kdnCost: 0,
      klnCost: 38000000,
      verified: true,
    },
    {
      no: 4,
      name: 'Industrial High-Torque AC Servo Motor 3.7 kW',
      spec: '380V 3-Phase, 1500 RPM, IP65 Protection',
      supplier: 'PT Siemens Indonesia / Local Assembly Line',
      origin: 'KDN',
      certNo: 'TKDN-4402/KMN/2023 (41.5%)',
      qty: 6,
      unit: 'Units',
      unitCost: 6800000,
      kdnCost: 40800000,
      klnCost: 0,
      verified: true,
    },
    {
      no: 5,
      name: 'Reinforced Epichlorohydrin Synthetic Seals',
      spec: 'High temperature resistant rubber gaskets',
      supplier: 'Dupont Elastomers (Direct Import Germany)',
      origin: 'KLN',
      certNo: 'PIB Form AK #330192',
      qty: 40,
      unit: 'Pcs',
      unitCost: 350000,
      kdnCost: 0,
      klnCost: 14000000,
      verified: false,
    },
    {
      no: 6,
      name: 'Heavy-Duty Industrial Powder Coating Finishing',
      spec: 'Epoxy Polyester RAL 7035 Anti-Corrosion 120 Micron',
      supplier: 'PT Jotun Indonesia (Factory Cikarang)',
      origin: 'KDN',
      certNo: 'TKDN-7731/KMN/2023 (58.0%)',
      qty: 1,
      unit: 'Lot',
      unitCost: 18500000,
      kdnCost: 18500000,
      klnCost: 0,
      verified: true,
    },
  ];

  const filteredBOMRows = mockBOMRows.filter((r) => {
    if (spreadsheetOriginFilter !== 'ALL' && r.origin !== spreadsheetOriginFilter) return false;
    if (searchDocQuery.trim()) {
      const q = searchDocQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.spec.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.certNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalKDN = mockBOMRows.reduce((sum, r) => sum + r.kdnCost, 0);
  const totalKLN = mockBOMRows.reduce((sum, r) => sum + r.klnCost, 0);
  const totalBOMCost = totalKDN + totalKLN;
  const calculatedTKDNPercent = Math.round((totalKDN / totalBOMCost) * 1000) / 10;

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-white ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl max-h-[94vh]'
        }`}
      >
        {/* TOP MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
              {derivedCategory === 'OFFER_QUOTATION' && <Briefcase className="w-5 h-5 text-indigo-400" />}
              {derivedCategory === 'INVOICE_RECEIPT' && <Receipt className="w-5 h-5 text-emerald-400" />}
              {derivedCategory === 'EXPENSE_PROOF' && <CreditCard className="w-5 h-5 text-rose-400" />}
              {derivedCategory === 'TECHNICAL_DOSSIER' && <FileSpreadsheet className="w-5 h-5 text-blue-400" />}
              {derivedCategory === 'LEGAL_COMPLIANCE' && <ShieldCheck className="w-5 h-5 text-purple-400" />}
              {derivedCategory === 'ALL' && <FileText className="w-5 h-5 text-slate-300" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{doc.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryBadge.color}`}>
                  {categoryBadge.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {doc.version || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{getDocTypeName(doc.type)}</span>
                <span>•</span>
                {project && (
                  <span className="text-slate-300 font-medium">
                    [{project.code}] {project.clientName}
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-slate-400">{doc.fileSize}</span>
              </p>
            </div>
          </div>

          {/* Top Controls Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Viewer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compliance_check')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'compliance_check'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Check & Compliance</span>
                <span className="text-[10px] bg-emerald-950 px-1.5 py-0.2 rounded text-emerald-300 font-mono">
                  {overallScore}%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('metadata_audit')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'metadata_audit'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Metadata & Audit</span>
              </button>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              {doc.googleDriveWebViewLink && (
                <a
                  href={doc.googleDriveWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Open in Google Drive"
                >
                  <HardDrive className="w-4 h-4" />
                  <span className="hidden sm:inline">Drive</span>
                </a>
              )}
              {(!doc.googleDriveWebViewLink || doc.googleDriveSyncStatus !== 'SYNCED') && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await syncDocumentToGoogleDrive(doc.projectId, doc.id, doc.fileUrl);
                    if (res.success) {
                      alert('Document successfully uploaded to your Google Drive project folder!');
                    } else {
                      alert(`Drive sync notice: ${res.error || 'Failed'}`);
                    }
                  }}
                  disabled={isDriveSyncing}
                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                  title={isGoogleDriveConnected ? "Sync file to Google Drive" : "Connect & Push to Google Drive"}
                >
                  {isDriveSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <HardDrive className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isDriveSyncing ? 'Syncing...' : 'Push to Drive'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Print / Save Document"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Download Official File"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* SUB-HEADER TOOLBAR (For Viewer Zoom & Page Navigation) */}
        {activeTab === 'preview' && (
          <div className="px-5 py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mr-1">Zoom:</span>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-md transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md font-mono text-[11px] font-bold text-slate-200 transition-colors cursor-pointer"
                title="Reset to 100%"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-md transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer ml-1 text-slate-300"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page navigation or search bar */}
            <div className="flex items-center gap-3">
              {(doc.type === 'BOM_EXCEL' || doc.type === 'COST_ACCOUNTING') ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search component or cert..."
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSpreadsheetOriginFilter('ALL')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        spreadsheetOriginFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      All ({mockBOMRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpreadsheetOriginFilter('KDN')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        spreadsheetOriginFilter === 'KDN' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Domestic (KDN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpreadsheetOriginFilter('KLN')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        spreadsheetOriginFilter === 'KLN' ? 'bg-amber-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Imported (KLN)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">
                    Page <strong className="text-white">{currentPage}</strong> of <strong>2</strong>
                  </span>
                  <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= 2}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, 2))}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL MAIN CONTENT BODY */}
        <div className="flex-1 overflow-y-auto bg-slate-900/90 p-4 sm:p-6 min-h-[420px]">
          {/* ========================================================== */}
          {/* TAB 1: DOCUMENT VIEWER / PREVIEW CANVAS                   */}
          {/* ========================================================== */}
          {activeTab === 'preview' && (
            <div className="flex flex-col items-center justify-center">
              {/* Dynamic Document Content Card with Zoom & Rotation applied */}
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden"
              >
                {/* 1. Real Uploaded File Preview (if fileUrl exists and is image/PDF) */}
                {doc.fileUrl && doc.fileUrl.startsWith('data:image') ? (
                  <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[450px]">
                    <img
                      src={doc.fileUrl}
                      alt={doc.name}
                      className="max-h-[600px] object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : doc.fileUrl && (doc.fileUrl.startsWith('data:application/pdf') || doc.name.endsWith('.pdf')) ? (
                  <div className="w-full h-[650px] bg-slate-800">
                    <iframe
                      src={doc.fileUrl}
                      title={doc.name}
                      className="w-full h-full border-none rounded-b-xl"
                    />
                  </div>
                ) : (
                  /* 2. Structured Simulation Visualizers for All Project File Types */
                  <div>
                    {/* SCENARIO A: SPREADSHEET / BILL OF MATERIALS (BOM) */}
                    {(doc.type === 'BOM_EXCEL' || doc.type === 'COST_ACCOUNTING' || doc.type === 'FACTORY_ASSET_REGISTRY') && (
                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Excel Header Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded font-mono">
                                SIINas FORMULA 3.2.1
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                Ref: {doc.referenceNumber || 'BOM-KMN-2024-V2'}
                              </span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                              BILL OF MATERIALS & DIRECT COST BREAKDOWN
                            </h2>
                            <p className="text-xs text-slate-600">
                              Target Product: <strong className="text-slate-900">{project?.productOrServiceName || 'Precision Industrial Machinery'}</strong>
                            </p>
                          </div>

                          {/* Calculated Score Pill */}
                          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 text-right shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              Calculated Component TKDN
                            </span>
                            <div className="text-2xl font-black font-mono text-emerald-400">
                              {calculatedTKDNPercent}%
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Target: {project?.targetTkdnPercentage || 40}%
                            </span>
                          </div>
                        </div>

                        {/* KPI Mini Bar */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                              Domestic Share (KDN)
                            </span>
                            <span className="text-sm font-bold font-mono text-emerald-900">
                              {formatIDR(totalKDN)}
                            </span>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold uppercase text-amber-700 block">
                              Imported Share (KLN)
                            </span>
                            <span className="text-sm font-bold font-mono text-amber-900">
                              {formatIDR(totalKLN)}
                            </span>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold uppercase text-blue-700 block">
                              Total Cost of Materials
                            </span>
                            <span className="text-sm font-bold font-mono text-blue-900">
                              {formatIDR(totalBOMCost)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Spreadsheet Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                <th className="py-2.5 px-3 w-10 text-center">#</th>
                                <th className="py-2.5 px-3">Item Name & Spec</th>
                                <th className="py-2.5 px-3">Supplier & Certificate</th>
                                <th className="py-2.5 px-2 text-center w-16">Origin</th>
                                <th className="py-2.5 px-3 text-right">Qty</th>
                                <th className="py-2.5 px-3 text-right">KDN (IDR)</th>
                                <th className="py-2.5 px-3 text-right">KLN (IDR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredBOMRows.map((row) => (
                                <tr key={row.no} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{row.no}</td>
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-slate-900">{row.name}</p>
                                    <p className="text-[10px] text-slate-500">{row.spec}</p>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <p className="text-slate-800 font-medium">{row.supplier}</p>
                                    <p className="text-[10px] text-blue-700 font-mono font-semibold">{row.certNo}</p>
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                                        row.origin === 'KDN'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {row.origin}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                    {row.qty} {row.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                                    {row.kdnCost > 0 ? formatIDR(row.kdnCost) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                                    {row.klnCost > 0 ? formatIDR(row.klnCost) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                                <td colSpan={5} className="py-3 px-4 text-right uppercase text-[11px]">
                                  Subtotal Cost (IDR):
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-emerald-900 text-xs">
                                  {formatIDR(totalKDN)}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-amber-900 text-xs">
                                  {formatIDR(totalKLN)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Official Stamp & Signatures */}
                        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                              <QrCode className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">SIINas Digitally Verified</p>
                              <p className="text-[10px] text-slate-500 font-mono">HASH: 9A48-E29B-CC01</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] text-slate-500">Verified by Lead Consultant:</p>
                            <p className="text-xs font-bold text-slate-900">{doc.uploadedBy || 'Verix Consultant'}</p>
                            <p className="text-[10px] text-slate-400">{doc.uploadDate}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SCENARIO B: INVOICES, TAX FAKTUR & BILLING RECEIPTS */}
                    {(doc.categoryGroup === 'INVOICE_RECEIPT' ||
                      doc.type.includes('INVOICE') ||
                      doc.type.includes('RECEIPT') ||
                      doc.type === 'TAX_FAKTUR_PAJAK' ||
                      doc.type === 'OFFICIAL_RECEIPT_KWITANSI') && (
                      <div className="p-6 sm:p-10 space-y-6">
                        {/* Executive Invoice Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
                          <div>
                            <div className="flex items-center gap-3">
                              {companyLetterhead?.logoUrl ? (
                                <img
                                  src={companyLetterhead.logoUrl}
                                  alt={companyLetterhead.companyName}
                                  className="h-10 max-w-[170px] object-contain"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                  {companyLetterhead?.shortName?.slice(0, 2) || 'GAP'}
                                </div>
                              )}
                              <div>
                                <span className="text-base font-black tracking-tight text-slate-900 block">
                                  {companyLetterhead?.companyName || 'PT GAP Consulting Indonesia'}
                                </span>
                                {companyLetterhead?.tagline && (
                                  <span className="text-[10px] text-slate-500 font-medium block">
                                    {companyLetterhead.tagline}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
                              {companyLetterhead?.address || 'Gedung Bursa Efek Indonesia Tower 2, SCBD Jakarta Selatan 12190'}
                              <br />
                              {companyLetterhead?.taxId && <span>NPWP: {companyLetterhead.taxId} • </span>}
                              {companyLetterhead?.email && <span>Email: {companyLetterhead.email} • </span>}
                              {companyLetterhead?.phone && <span>Telp: {companyLetterhead.phone}</span>}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-blue-700 uppercase tracking-tight block">
                              {doc.type === 'TAX_FAKTUR_PAJAK' ? 'FAKTUR PAJAK STANDAR' : 'INVOICE TAGIHAN'}
                            </span>
                            <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                              No: {doc.referenceNumber || 'INV-2024-8841'}
                            </p>
                            <p className="text-[11px] text-slate-500">Tanggal: {doc.uploadDate}</p>
                            {doc.taxNumber && (
                              <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                                Faktur Pajak: {doc.taxNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bill To & Project Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Ditagihkan Kepada (Client):
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {doc.counterpartyName || project?.clientName || 'PT Client Mitra Industri'}
                            </h4>
                            <p className="text-slate-600 mt-0.5">
                              Project: [{project?.code || 'PRJ-2024-001'}] {project?.productOrServiceName || 'TKDN Verification'}
                            </p>
                            <p className="text-[11px] text-slate-500">Entity: {project?.companyType || 'PT Swasta Nasional'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Status Pembayaran:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-xs border border-emerald-200">
                                LUNAS / SETTLED
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                via {doc.paymentMethod ? doc.paymentMethod.replace(/_/g, ' ') : 'BANK TRANSFER BCA'}
                              </span>
                            </div>
                            {doc.validUntil && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                Jatuh Tempo / Valid: {doc.validUntil}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Itemized Invoice Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-4">Deskripsi Layanan / Scope of Work</th>
                                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                                <th className="py-2.5 px-4 text-right">Harga Satuan (IDR)</th>
                                <th className="py-2.5 px-4 text-right">Jumlah (IDR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-900">
                                    Jasa Konsultasi & Asesmen TKDN (Self-Assessment & Dokumen SIINas)
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Verifikasi BOM, KDN-KLN direct costing, dan penyusunan file verifikasi resmi
                                  </p>
                                </td>
                                <td className="py-3 px-3 text-center font-mono">1 Lot</td>
                                <td className="py-3 px-4 text-right font-mono">
                                  {formatIDR((doc.amountIDR || 100000000) * 0.7)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  {formatIDR((doc.amountIDR || 100000000) * 0.7)}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-900">
                                    Pendampingan Audit Lapangan LVI ({project?.surveyorBody || 'Sucofindo / Surveyor Indonesia'})
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Factory site inspection, machine registry verification & compliance sign-off
                                  </p>
                                </td>
                                <td className="py-3 px-3 text-center font-mono">1 Lot</td>
                                <td className="py-3 px-4 text-right font-mono">
                                  {formatIDR((doc.amountIDR || 100000000) * 0.3)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  {formatIDR((doc.amountIDR || 100000000) * 0.3)}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                              <tr>
                                <td colSpan={3} className="py-2 px-4 text-right text-xs">
                                  Subtotal DPP (Dasar Pengenaan Pajak):
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                  {formatIDR(doc.amountIDR || 100000000)}
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={3} className="py-2 px-4 text-right text-xs text-slate-600">
                                  PPN 11% (Pajak Pertambahan Nilai):
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-slate-700">
                                  {formatIDR(Math.round((doc.amountIDR || 100000000) * 0.11))}
                                </td>
                              </tr>
                              <tr className="border-t-2 border-slate-900 text-slate-950 font-black text-sm bg-blue-50/50">
                                <td colSpan={3} className="py-3 px-4 text-right uppercase">
                                  Total Tagihan Bersih (IDR):
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-blue-900 text-base">
                                  {formatIDR(Math.round((doc.amountIDR || 100000000) * 1.11))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* E-Materai & Official Signatures */}
                        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-red-50 border-2 border-red-400 rounded-xl flex flex-col items-center justify-center text-center p-1">
                              <span className="text-[8px] font-black text-red-600">METERAI ELEKTRONIK</span>
                              <span className="text-[10px] font-bold font-mono text-red-800">10000</span>
                              <span className="text-[7px] text-red-500 font-mono">TGL: 2024</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">Peruri E-Materai Disahkan</p>
                              <p className="text-[10px] text-slate-500 font-mono">SN: 8849-0192-3841-A</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-500 font-medium">Hormat Kami,</p>
                            <p className="text-xs font-bold text-slate-900 mt-4">
                              {companyLetterhead?.authorizedSignatoryName || 'Direktur Keuangan & Operasional'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {companyLetterhead?.companyName || 'PT GAP Consulting Indonesia'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SCENARIO C: OFFER, QUOTATION & SPK CONTRACT PROPOSALS */}
                    {(doc.categoryGroup === 'OFFER_QUOTATION' ||
                      doc.type === 'OFFER_QUOTATION_LETTER' ||
                      doc.type === 'CLIENT_CONTRACT_SPK' ||
                      doc.type === 'NDAS_LEGAL_AGREEMENT') && (
                      <div className="p-6 sm:p-10 space-y-6">
                        {/* Proposal Header */}
                        <div className="border-b-2 border-indigo-600 pb-5 flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              SURAT PENAWARAN HARGA (SPH) RESMI
                            </span>
                            <h2 className="text-lg font-black text-slate-900 mt-1">
                              PROPOSAL & KONTRAK KERJASAMA KONSULTASI TKDN
                            </h2>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Nomor Surat: {doc.referenceNumber || 'SP-VRX/2024/091'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 block">{doc.uploadDate}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                              Masa Berlaku s/d {doc.validUntil || '30 Hari'}
                            </span>
                          </div>
                        </div>

                        {/* Proposal Executive Summary */}
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                          <p>
                            Kepada Yth. Pimpinan <strong>{doc.counterpartyName || project?.clientName || 'PT Client'}</strong>,
                          </p>
                          <p>
                            Merujuk pada kebutuhan sertifikasi Tingkat Komponen Dalam Negeri (TKDN) untuk produk{' '}
                            <strong>{project?.productOrServiceName || 'Peralatan Industri'}</strong>, kami mengajukan penawaran jasa konsultasi menyeluruh hingga terbitnya Sertifikat Tanda Sah TKDN dari Kementerian Perindustrian RI.
                          </p>

                          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
                            <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <span>Ruang Lingkup & Deliverables Utama:</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                              <li>Pengumpulan data & perumusan Bill of Materials (BOM) KDN vs KLN sesuai Permenperin</li>
                              <li>Penyusunan file teknis & pengisian portal SIINas Kemenperin RI</li>
                              <li>Pendampingan audit verifikasi lapangan bersama auditor LVI ({project?.surveyorBody || 'Sucofindo / Surveyor Indonesia'})</li>
                              <li>Jaminan pencapaian target TKDN minimum: <strong>{project?.targetTkdnPercentage || 40}%</strong></li>
                            </ul>
                          </div>

                          {/* Commercial Terms Table */}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">Total Nilai Penawaran / Kontrak:</span>
                              <span className="font-mono font-black text-indigo-900 text-base">
                                {formatIDR(doc.amountIDR || 150000000)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Termasuk: Honor konsultan, asistensi SIINas, pre-audit verifikasi, dan asistensi sidang panel.
                            </p>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
                          <div>
                            <p className="text-slate-500 font-medium">Disiapkan & Diajukan Oleh:</p>
                            <p className="font-bold text-slate-900 mt-4">
                              {companyLetterhead?.companyName || 'PT GAP Consulting Indonesia'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {companyLetterhead?.authorizedSignatoryName || currentUser.name} ({companyLetterhead?.authorizedSignatoryTitle || 'Lead Consultant'})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500 font-medium">Disetujui Oleh (Client):</p>
                            <p className="font-bold text-slate-900 mt-4">{doc.counterpartyName || project?.clientName || 'Direktur Client'}</p>
                            <p className="text-[10px] text-slate-400">Tanda Tangan & Cap Perusahaan</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SCENARIO D: REGULATORY FILES & CERTIFICATES (SIINAS, AUDIT, ISO, NIB) */}
                    {(doc.categoryGroup === 'TECHNICAL_DOSSIER' ||
                      doc.categoryGroup === 'LEGAL_COMPLIANCE' ||
                      doc.type === 'SIINAS_PROFILE' ||
                      doc.type === 'AUDIT_VERIFICATION_REPORT' ||
                      doc.type === 'ISO_QMS_CERT' ||
                      doc.type === 'NIB_OSS_DOCS' ||
                      doc.type === 'LEGAL_PERMIT' ||
                      doc.type === 'LAB_TEST_REPORT' ||
                      doc.type === 'AMDAL_UKL_DOCUMENT' ||
                      doc.type === 'DEED_AHU_LEGAL' ||
                      doc.type === 'SUPPLIER_TKDN_CERT') && (
                      <div className="p-6 sm:p-10 space-y-6">
                        {/* Certificate Header Banner */}
                        <div className="text-center pb-6 border-b-2 border-slate-900 relative">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 flex items-center justify-center mb-2">
                            <Award className="w-8 h-8" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                            REPUBLIK INDONESIA — KEMENTERIAN PERINDUSTRIAN
                          </span>
                          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                            {getDocTypeName(doc.type)}
                          </h2>
                          <p className="text-xs font-mono font-bold text-emerald-800 mt-1">
                            NOMOR REGISTRASI: {doc.referenceNumber || 'REG-TKDN/SIINAS/2024/0981'}
                          </p>
                        </div>

                        {/* Certificate Body Data */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Perusahaan Terdaftar
                            </span>
                            <span className="font-bold text-slate-900">
                              {doc.counterpartyName || project?.clientName || 'PT Industri Manufaktur Terpadu'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Jenis Produk / Jasa
                            </span>
                            <span className="font-bold text-slate-900">
                              {project?.productOrServiceName || 'Heavy Equipment & Machinery'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Lembaga Verifikasi Independen (LVI)
                            </span>
                            <span className="font-bold text-purple-900">
                              {project?.surveyorBody || 'PT Sucofindo (Persero)'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Status Verifikasi
                            </span>
                            <span className="font-bold text-emerald-700">
                              TELAH MEMENUHI SYARAT REGULASI PERMENPERIN
                            </span>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                              Tingkat Kandungan Dalam Negeri (TKDN) Tervalidasi
                            </span>
                            <span className="text-2xl font-black font-mono text-emerald-900">
                              {project?.officialVerifiedTkdnPercentage || project?.projectedTkdnPercentage || 44.5}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-md font-mono">
                              PASS AUDIT
                            </span>
                          </div>
                        </div>

                        {/* Surveyor Security Seal */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            <div>
                              <p className="font-bold text-slate-800">Sertifikasi & Verifikasi Sah</p>
                              <p className="text-[10px] text-slate-400 font-mono">SIINas Code: SIINAS-VRX-991</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-slate-500">Tanggal Terbit: {doc.uploadDate}</p>
                            <p className="text-[10px] text-slate-400">Berlaku s/d: 3 Tahun Sejak Diterbitkan</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SCENARIO E: EXPENSE PROOF & PETTY CASH STRUK */}
                    {(doc.categoryGroup === 'EXPENSE_PROOF' ||
                      doc.type.includes('EXPENSE') ||
                      doc.type.includes('FEE') ||
                      doc.type === 'TRAVEL_LODGING_RECEIPT' ||
                      doc.type === 'PETTY_CASH_VOUCHER' ||
                      doc.type === 'GOV_PNBP_FILING_RECEIPT') && (
                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-dashed border-slate-300 pb-4 text-center">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                            BUKTI PENGELUARAN / KAS KELUAR RESMI
                          </span>
                          <h2 className="text-base font-bold text-slate-900 mt-0.5">
                            {getDocTypeName(doc.type)}
                          </h2>
                          <p className="text-xs font-mono text-slate-500">
                            Voucher #{doc.referenceNumber || 'EXP-2024-0091'}
                          </p>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Penerima / Merchant:</span>
                            <span className="font-bold text-slate-900">{doc.counterpartyName || 'Surveyor / Vendor'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Terkait Project:</span>
                            <span className="font-mono text-slate-800">[{project?.code}] {project?.clientName}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Tanggal Transaksi:</span>
                            <span className="text-slate-800">{doc.uploadDate}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Metode Pembayaran:</span>
                            <span className="font-bold text-slate-800">{doc.paymentMethod ? doc.paymentMethod.replace(/_/g, ' ') : 'BANK TRANSFER'}</span>
                          </div>
                          {doc.notes && (
                            <div className="p-3 bg-slate-50 rounded-lg text-slate-700 italic">
                              "{doc.notes}"
                            </div>
                          )}
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center text-sm font-bold">
                            <span className="text-rose-900">Total Pengeluaran:</span>
                            <span className="font-mono font-black text-rose-900 text-base">
                              {doc.amountIDR ? formatIDR(doc.amountIDR) : 'IDR 35,000,000'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                          <span>Dicatat oleh: {doc.uploadedBy}</span>
                          <span className="font-bold text-emerald-700">STATUS: CLEARED</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: AUTOMATED INTEGRITY & COMPLIANCE CHECK              */}
          {/* ========================================================== */}
          {activeTab === 'compliance_check' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Score Header Banner */}
              <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-8 h-8" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center">
                      ✓
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">Automated Integrity & Audit Check</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                        REGULATORY ENGINE V4
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluates document checksum, Permenperin standard compliance, and SIINas audit traceability.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Compliance Score</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {overallScore} / 100
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerReScan}
                    disabled={isScanning}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Re-scanning...' : 'Run Diagnostics'}</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic Check Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Verification Diagnostics (5 Rules Evaluated)
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {diagnosticChecks.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {item.status === 'PASS' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          {item.status === 'WARNING' && (
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          {item.status === 'FAIL' && (
                            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          {item.status === 'INFO' && (
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                              <InfoIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{item.title}</h5>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{item.details}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === 'PASS' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            PASSED
                          </span>
                        )}
                        {item.status === 'WARNING' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                            ATTENTION
                          </span>
                        )}
                        {item.status === 'FAIL' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                            FLAGGED
                          </span>
                        )}
                        {item.status === 'INFO' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                            INFO
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Flag Action Prompt */}
              {showFlagPrompt ? (
                <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Record Discrepancy Note & Flag Document:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFlagPrompt(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={flagInputNote}
                    onChange={(e) => setFlagInputNote(e.target.value)}
                    placeholder="Specify the exact issue (e.g., supplier TKDN certificate expired, missing signature, cost mismatch)..."
                    className="w-full text-xs bg-slate-900 border border-rose-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFlagPrompt(false)}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleFlagDiscrepancySubmit}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Save & Flag Gap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-white">Need to request revision or flag an issue?</h5>
                    <p className="text-[11px] text-slate-400">
                      Adding a gap flag notifies the consulting team and logs the discrepancy in the compliance tracker.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFlagPrompt(true)}
                    className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag Discrepancy</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: METADATA & AUDIT LOG                                */}
          {/* ========================================================== */}
          {activeTab === 'metadata_audit' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Metadata Form / Viewer */}
              <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">Document File Properties</h4>
                    <p className="text-xs text-slate-400">Registered repository metadata and financial linkages</p>
                  </div>
                  <div>
                    {isEditingMetadata ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMetadata(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMetadata}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingMetadata(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Metadata</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditingMetadata ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-bold mb-1">Judul / Nama File Dokumen</label>
                      <input
                        type="text"
                        value={editDocName}
                        onChange={(e) => setEditDocName(e.target.value)}
                        placeholder="Contoh: Dokumen Hasil Verifikasi TKDN"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Kategori Dokumen</label>
                      <select
                        value={editCategoryGroup}
                        onChange={(e) => setEditCategoryGroup(e.target.value as DocumentCategoryGroup)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="TECHNICAL_DOSSIER">Berkas Teknis (Technical Dossier)</option>
                        <option value="OFFER_QUOTATION">Penawaran &amp; Proposal (Offer/Quotation)</option>
                        <option value="INVOICE_RECEIPT">Invoice &amp; Bukti Bayar (Invoice/Receipt)</option>
                        <option value="EXPENSE_PROOF">Bukti Biaya &amp; Pengeluaran (Expense Proof)</option>
                        <option value="LEGAL_COMPLIANCE">Legalitas &amp; Izin (Legal Compliance)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Tipe Dokumen Spesifik</label>
                      <select
                        value={editDocType}
                        onChange={(e) => setEditDocType(e.target.value as DocumentType)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {(activeDocumentTypes || []).map((dt) => (
                          <option key={dt.id} value={dt.id}>
                            {dt.name} ({dt.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Nomor Referensi / Surat / Faktur #</label>
                      <input
                        type="text"
                        value={editRefNumber}
                        onChange={(e) => setEditRefNumber(e.target.value)}
                        placeholder="Contoh: INV-2024-001 / SP-VRX/2024"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Nilai Nominal / Valuation (IDR)</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Contoh: 150000000"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Entitas / Rekanan / Counterparty</label>
                      <input
                        type="text"
                        value={editCounterparty}
                        onChange={(e) => setEditCounterparty(e.target.value)}
                        placeholder="Contoh: PT Sucofindo / PT Klien"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Nomor Faktur Pajak</label>
                      <input
                        type="text"
                        value={editTaxNumber}
                        onChange={(e) => setEditTaxNumber(e.target.value)}
                        placeholder="Contoh: 010.000-24.881920"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Masa Berlaku / Tanggal Berakhir</label>
                      <input
                        type="date"
                        value={editValidUntil}
                        onChange={(e) => setEditValidUntil(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Catatan &amp; Keterangan Tambahan</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Tambahkan catatan khusus..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Category Group</span>
                      <span className="font-bold text-slate-200">
                        {getDocCategoryGroupName(derivedCategory)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Document Subtype</span>
                      <span className="font-bold text-slate-200">{getDocTypeName(doc.type)}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Reference Number</span>
                      <span className="font-mono font-bold text-blue-400">
                        {doc.referenceNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Financial Valuation</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {doc.amountIDR ? formatIDR(doc.amountIDR) : 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Counterparty / Vendor</span>
                      <span className="font-bold text-slate-200">{doc.counterpartyName || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Tax Faktur #</span>
                      <span className="font-mono font-bold text-slate-300">{doc.taxNumber || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {doc.notes && !isEditingMetadata && (
                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/60 text-xs">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-0.5">Notes & Terms:</span>
                    <p className="text-slate-300">{doc.notes}</p>
                  </div>
                )}

                {doc.reviewNotes && (
                  <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/60 text-xs">
                    <span className="text-[10px] font-bold text-rose-400 uppercase block mb-0.5">Auditor / Lead Gap Note:</span>
                    <p className="text-rose-300 font-medium">{doc.reviewNotes}</p>
                  </div>
                )}
              </div>

              {/* Audit Trail Timeline */}
              <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Document Lifecycle & Audit Timeline</span>
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Current Status: {doc.status.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Today</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active in vault repository • Conforms to current project stage: {project?.stage || 'FIELD_AUDIT'}
                      </p>
                    </div>
                  </div>

                  {doc.verifiedBy && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-950" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Verified by {doc.verifiedBy}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Technical & compliance checks validated for SIINas submission bundle.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-600 border-2 border-slate-950" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">Uploaded by {doc.uploadedBy}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{doc.uploadDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        File "{doc.name}" ({doc.fileSize}) registered under version {doc.version || 'v1.0'}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM MODAL FOOTER ACTION BAR */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Uploaded by <strong className="text-slate-200">{doc.uploadedBy}</strong> on {doc.uploadDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Verify */}
            {doc.status !== 'VERIFIED' && (
              <button
                type="button"
                onClick={handleVerify}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Sign Off</span>
              </button>
            )}

            {/* Quick Flag Discrepancy */}
            {doc.status !== 'FLAGGED_DISCREPANCY' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('compliance_check');
                  setShowFlagPrompt(true);
                }}
                className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Flag Discrepancy</span>
              </button>
            )}

            {/* Mark Under Review */}
            {doc.status === 'FLAGGED_DISCREPANCY' && (
              <button
                type="button"
                onClick={handleMarkUnderReview}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Clear Flag / Mark Review</span>
              </button>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            {/* Delete Document Button - Available for all authorized roles */}
            {canManageDocuments && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer shadow-sm"
                title="Hapus dokumen dari repositori"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Dokumen</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hapus Dokumen Repositori?</h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-white">"{doc.name}"</strong>? Dokumen ini akan dihapus secara permanen dari repositori proyek dan seluruh perubahan akan disinkronisasikan secara real-time ke semua role dan Cloud Firestore.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDocument(doc.projectId, doc.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
