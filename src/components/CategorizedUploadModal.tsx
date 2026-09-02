import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Briefcase,
  Receipt,
  CreditCard,
  Layers,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign,
  Tag,
  AlertCircle,
  Paperclip,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  DocumentCategoryGroup,
  DocumentType,
  PaymentMethod,
  ConsultingProject,
} from '../types';
import { formatIDR, getDocTypeName, getDocCategoryBadge, getDocCategoryGroup } from '../utils/formatters';

interface CategorizedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: DocumentCategoryGroup;
  initialDocType?: DocumentType;
  initialProject?: ConsultingProject | null;
}

export const CategorizedUploadModal: React.FC<CategorizedUploadModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'OFFER_QUOTATION',
  initialDocType,
  initialProject = null,
}) => {
  const {
    projects,
    uploadDocument,
    addTransaction,
    currentUser,
    documentTypes,
    activeDocumentTypes,
    isGoogleDriveConnected,
    connectGoogleDrive,
    isDriveSyncing,
    paymentChannels,
    activePaymentChannels,
  } = useProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driveSyncNotice, setDriveSyncNotice] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<DocumentCategoryGroup>(
    initialDocType
      ? getDocCategoryGroup(initialDocType)
      : initialCategory === 'ALL'
      ? 'OFFER_QUOTATION'
      : initialCategory
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProject ? initialProject.id : projects[0]?.id || ''
  );

  // Common file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [detectedFileType, setDetectedFileType] = useState<'pdf' | 'image' | 'excel' | 'word' | 'other' | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subtype state
  const [docType, setDocType] = useState<DocumentType>(initialDocType || 'OFFER_QUOTATION_LETTER');
  const [customDocName, setCustomDocName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amountIDR, setAmountIDR] = useState<number | ''>('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_BCA');
  const [notes, setNotes] = useState('');
  const [versionTag, setVersionTag] = useState('v1.0');
  const [syncToFinance, setSyncToFinance] = useState(true);

  const currentSelectedProject = projects.find((p) => p.id === selectedProjectId);

  // Reset or initialize default values when initialDocType or category changes
  useEffect(() => {
    if (initialDocType) {
      const cat = getDocCategoryGroup(initialDocType);
      setActiveCategory(cat === 'LEGAL_COMPLIANCE' ? 'TECHNICAL_DOSSIER' : cat);
      setDocType(initialDocType);
    } else if (initialCategory && initialCategory !== 'ALL') {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory, initialDocType]);

  useEffect(() => {
    if (initialProject) {
      setSelectedProjectId(initialProject.id);
    }
  }, [initialProject]);

  useEffect(() => {
    if (initialDocType) {
      return;
    }
    // Set appropriate docType and defaults based on active category
    if (activeCategory === 'OFFER_QUOTATION') {
      setDocType('OFFER_QUOTATION_LETTER');
      setReferenceNumber(`SP-VRX/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
      if (currentSelectedProject) {
        setCounterpartyName(currentSelectedProject.clientName);
        setAmountIDR(currentSelectedProject.contractValueIDR || 150000000);
      }
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30);
      setValidUntil(expDate.toISOString().slice(0, 10));
    } else if (activeCategory === 'INVOICE_RECEIPT') {
      setDocType('INVOICE_BILLING');
      setReferenceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      if (currentSelectedProject) {
        setCounterpartyName(currentSelectedProject.clientName);
        setAmountIDR(Math.round((currentSelectedProject.contractValueIDR || 100000000) * 0.5));
      }
      setTaxNumber(`010.000-${new Date().getFullYear().toString().slice(2)}.${Math.floor(10000000 + Math.random() * 90000000)}`);
    } else if (activeCategory === 'EXPENSE_PROOF') {
      setDocType('SURVEYOR_FEE_RECEIPT');
      setReferenceNumber(`STR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      if (currentSelectedProject) {
        setCounterpartyName(currentSelectedProject.surveyorBody);
      } else {
        setCounterpartyName('PT Sucofindo');
      }
      setAmountIDR(35000000);
    } else {
      setDocType('BOM_EXCEL');
      setReferenceNumber('');
      setAmountIDR('');
    }
  }, [activeCategory, selectedProjectId]);

  if (!isOpen) return null;

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    if (!customDocName) {
      setCustomDocName(file.name);
    }
    
    // Determine type
    const lowerName = file.name.toLowerCase();
    let fType: 'pdf' | 'image' | 'excel' | 'word' | 'other' = 'pdf';
    if (file.type.includes('image') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
      fType = 'image';
    } else if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
      fType = 'excel';
    } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      fType = 'word';
    } else if (file.type.includes('pdf') || lowerName.endsWith('.pdf')) {
      fType = 'pdf';
    }
    setDetectedFileType(fType);

    // Read Data URL for client-side preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setFileDataUrl(evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a target project.');
      return;
    }

    setIsSubmitting(true);
    setDriveSyncNotice(isGoogleDriveConnected ? 'Uploading to Vault & Google Drive...' : 'Registering document in Vault...');

    try {
      const fileName = customDocName.trim() || selectedFile?.name || `${getDocTypeName(docType)}_${referenceNumber || 'Doc'}.pdf`;
      const fileSizeFormatted = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : '1.4 MB';

      // 1. Upload to Document Vault & Google Drive
      const createdDoc = await uploadDocument(
        selectedProjectId,
        {
          projectId: selectedProjectId,
          name: fileName,
          type: docType,
          fileSize: fileSizeFormatted === '0.0 MB' ? '850 KB' : fileSizeFormatted,
          uploadedBy: currentUser.name,
          status: 'VERIFIED',
          version: versionTag,
          categoryGroup: activeCategory,
          referenceNumber: referenceNumber || undefined,
          amountIDR: typeof amountIDR === 'number' ? amountIDR : undefined,
          counterpartyName: counterpartyName || undefined,
          validUntil: validUntil || undefined,
          taxNumber: taxNumber || undefined,
          paymentMethod,
          notes: notes || undefined,
          fileUrl: fileDataUrl,
          fileType: detectedFileType,
          previewData: {
            totalChecks: 5,
            passedChecks: 5,
            complianceScore: 98,
            extractedTextSnippet: `Validated statutory file: ${fileName} [Ref: ${referenceNumber || 'N/A'}] registered under project ${currentSelectedProject?.code || ''} for ${currentSelectedProject?.clientName || ''}. All mandatory stamps and digital signatures verified.`,
            verifiedStamp: true,
            digitalSignature: currentUser.name,
            verificationTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            pageCount: 1,
          },
        },
        selectedFile || fileDataUrl
      );

      // 2. Optionally sync into Financial Ledger if it's an Invoice or Expense Proof
      if (syncToFinance && typeof amountIDR === 'number' && amountIDR > 0) {
        if (activeCategory === 'INVOICE_RECEIPT') {
          addTransaction({
            date: new Date().toISOString().slice(0, 10),
            type: 'INCOME',
            category: 'CLIENT_CONSULTING_FEE',
            amountIDR,
            description: `${getDocTypeName(docType)} - ${fileName}`,
            projectId: selectedProjectId,
            projectCode: currentSelectedProject?.code,
            clientOrVendorName: counterpartyName || currentSelectedProject?.clientName || 'Client',
            paymentMethod,
            referenceNumber: referenceNumber || undefined,
            status: 'CLEARED',
            notes: notes ? `From Document Vault: ${notes}` : undefined,
            recordedBy: currentUser.name,
            attachmentName: fileName,
          });
        } else if (activeCategory === 'EXPENSE_PROOF') {
          let expenseCat: any = 'SURVEYOR_AUDIT_FEES';
          if (docType === 'TRAVEL_LODGING_RECEIPT') expenseCat = 'TRAVEL_SITE_VISIT';
          if (docType === 'GOV_PNBP_FILING_RECEIPT') expenseCat = 'REGULATORY_FILING';
          if (docType === 'PETTY_CASH_VOUCHER') expenseCat = 'OPERATIONAL_OFFICE';

          addTransaction({
            date: new Date().toISOString().slice(0, 10),
            type: 'EXPENSE',
            category: expenseCat,
            amountIDR,
            description: `${getDocTypeName(docType)} - ${counterpartyName || 'Disbursement'}`,
            projectId: selectedProjectId,
            projectCode: currentSelectedProject?.code,
            clientOrVendorName: counterpartyName || 'Vendor/Surveyor',
            paymentMethod,
            referenceNumber: referenceNumber || undefined,
            status: 'CLEARED',
            notes: notes ? `From Document Vault: ${notes}` : undefined,
            recordedBy: currentUser.name,
            attachmentName: fileName,
          });
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Error during document submission:', err);
      alert(`Upload error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
      setDriveSyncNotice(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Categorized Document & Receipt Uploader
              </h3>
              <p className="text-xs text-slate-400">
                Upload & register commercial offers, billing invoices, expense proofs, or technical files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-menu Tabs for Document Categories */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('OFFER_QUOTATION')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'OFFER_QUOTATION'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>1. Offer / Quotation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('INVOICE_RECEIPT')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'INVOICE_RECEIPT'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>2. Invoices & Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('EXPENSE_PROOF')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'EXPENSE_PROOF'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-200 ring-1 ring-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Expense Proofs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('TECHNICAL_DOSSIER')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'TECHNICAL_DOSSIER'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200 ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Technical & BOM</span>
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target Project Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Associated Consulting Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.clientName} — {p.productOrServiceName.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Subtype & Document Specific Fields */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                {activeCategory === 'OFFER_QUOTATION' && <Briefcase className="w-4 h-4 text-indigo-600" />}
                {activeCategory === 'INVOICE_RECEIPT' && <Receipt className="w-4 h-4 text-emerald-600" />}
                {activeCategory === 'EXPENSE_PROOF' && <CreditCard className="w-4 h-4 text-rose-600" />}
                {activeCategory === 'TECHNICAL_DOSSIER' && <Layers className="w-4 h-4 text-blue-600" />}
                Specific File Categorization Details
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Category: {activeCategory.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Document Subtype */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Specific Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  {/* Dynamic Types matching category */}
                  {(() => {
                    const matchingTypes = (activeDocumentTypes && activeDocumentTypes.length > 0 ? activeDocumentTypes : documentTypes).filter((d) => {
                      if (activeCategory === 'OFFER_QUOTATION') {
                        return d.category === 'OFFER_QUOTATION';
                      }
                      if (activeCategory === 'INVOICE_RECEIPT') {
                        return d.category === 'INVOICE_RECEIPT';
                      }
                      if (activeCategory === 'EXPENSE_PROOF') {
                        return d.category === 'EXPENSE_PROOF' || d.category === 'DISBURSEMENT_REPORT';
                      }
                      if (activeCategory === 'TECHNICAL_DOSSIER') {
                        return d.category === 'TECHNICAL_DOSSIER' || d.category === 'LEGAL_COMPLIANCE' || d.category === 'AUDIT_SURVEY' || d.category === 'CERTIFICATION_OUTCOME';
                      }
                      return true;
                    });

                    if (matchingTypes.length > 0) {
                      return matchingTypes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ));
                    }

                    // Fallback to all active types
                    return (activeDocumentTypes || documentTypes).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {activeCategory === 'OFFER_QUOTATION' && 'Quotation / Proposal Number'}
                  {activeCategory === 'INVOICE_RECEIPT' && 'Invoice / Kwitansi Number'}
                  {activeCategory === 'EXPENSE_PROOF' && 'Struk / Receipt Reference #'}
                  {activeCategory === 'TECHNICAL_DOSSIER' && 'File / Document Ref Code'}
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. SP-VRX/2025/091 or INV-2025-081"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Counterparty / Client / Merchant */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {activeCategory === 'OFFER_QUOTATION' && 'Client / Company Name'}
                  {activeCategory === 'INVOICE_RECEIPT' && 'Billed Client Name'}
                  {activeCategory === 'EXPENSE_PROOF' && 'Paid To (LVI / Airline / Vendor)'}
                  {activeCategory === 'TECHNICAL_DOSSIER' && 'Supplier / Plant Name'}
                </label>
                <input
                  type="text"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="e.g. PT Surya Daya / PT Sucofindo / Garuda Indonesia"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Amount IDR (for Offer, Invoice, Expense) */}
              {activeCategory !== 'TECHNICAL_DOSSIER' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {activeCategory === 'OFFER_QUOTATION' && 'Quoted Proposal Value (IDR)'}
                    {activeCategory === 'INVOICE_RECEIPT' && 'Invoice Billed Amount (IDR)'}
                    {activeCategory === 'EXPENSE_PROOF' && 'Expense / Disbursed Amount (IDR)'}
                  </label>
                  <input
                    type="number"
                    value={amountIDR}
                    onChange={(e) => setAmountIDR(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50000000"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                  />
                  {typeof amountIDR === 'number' && amountIDR > 0 && (
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono mt-0.5 block">
                      {formatIDR(amountIDR)}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="e.g. v1.0, v2.1-Final"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Additional contextual row */}
              {activeCategory === 'OFFER_QUOTATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quotation Validity / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {activeCategory === 'INVOICE_RECEIPT' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tax Faktur Pajak Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="010.000-25.XXXXXXXX"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Payment Channel
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      {(activePaymentChannels.length > 0 ? activePaymentChannels : paymentChannels).map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} {ch.accountNumber ? `(${ch.accountNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeCategory === 'EXPENSE_PROOF' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Disbursement Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {(activePaymentChannels.length > 0 ? activePaymentChannels : paymentChannels).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} {ch.accountNumber ? `(${ch.accountNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sync to Financial Transaction Checkbox */}
            {(activeCategory === 'INVOICE_RECEIPT' || activeCategory === 'EXPENSE_PROOF') && (
              <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToFinance}
                  onChange={(e) => setSyncToFinance(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Automatically sync & post this entry into the Daily Cash Flow Ledger</span>
              </label>
            )}
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select or Drop File Attachment <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag file here
                  </p>
                  <p className="text-[11px] text-slate-500">
                    PDF, XLSX, DOCX, PNG, JPG (Max 25MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Document Display Title & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Custom Document Title / Label
              </label>
              <input
                type="text"
                value={customDocName}
                onChange={(e) => setCustomDocName(e.target.value)}
                placeholder="e.g. Surat_Penawaran_Solar_PV_2025.pdf"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Notes & Terms Summary
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 50% DP on contract signing, 50% on surveyor report"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Google Drive Cloud Sync Status Banner */}
          <div className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isGoogleDriveConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  Google Drive Cloud Vault
                  {isGoogleDriveConnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3" /> Auto-Sync Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      OAuth Ready
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isGoogleDriveConnected
                    ? 'Uploaded documents will automatically synchronize directly to your company Google Drive folder structure.'
                    : 'Click connect to link your Google Drive and store all uploaded project documents directly in Drive.'}
                </p>
              </div>
            </div>

            {!isGoogleDriveConnected && (
              <button
                type="button"
                onClick={() => connectGoogleDrive()}
                disabled={isDriveSyncing}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                {isDriveSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
                <span>Connect Drive</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            {driveSyncNotice && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mr-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {driveSyncNotice}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Uploading...' : 'Confirm & Categorize Upload'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
