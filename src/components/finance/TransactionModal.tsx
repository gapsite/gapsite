import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Tag,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  FinancialTransaction,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
  TransactionStatus,
} from '../../types';
import {
  getTransactionCategoryLabel,
  getPaymentMethodLabel,
} from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: FinancialTransaction | null;
  defaultProjectId?: string;
}

const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'CLIENT_CONSULTING_FEE', label: 'Client Consulting Fee' },
  { value: 'TKDN_MILESTONE_PAYMENT', label: 'TKDN Milestone Payment' },
  { value: 'SURVEYOR_FACILITATION', label: 'Surveyor Facilitation Fee' },
  { value: 'LEGAL_RETAINER', label: 'Legal & OSS Retainer' },
  { value: 'SUCCESS_FEE', label: 'Certification Success Fee' },
  { value: 'TRAINING_WORKSHOP', label: 'Training & Workshop Fee' },
  { value: 'OTHER_INCOME', label: 'Other Operating Income' },
];

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'SURVEYOR_AUDIT_FEES', label: 'Surveyor & Audit Official Fee (PTSI / Sucofindo)' },
  { value: 'REGULATORY_FILING', label: 'Regulatory & NIB / PNBP Filing Fee' },
  { value: 'CONSULTANT_SALARIES', label: 'Consultant Honorarium & Payroll' },
  { value: 'OPERATIONAL_OFFICE', label: 'Office & Utilities Expense' },
  { value: 'TRAVEL_SITE_VISIT', label: 'Travel & Plant Site Verification' },
  { value: 'SOFTWARE_CLOUD', label: 'Software, Cloud & SIINas Tools' },
  { value: 'MARKETING_ACQUISITION', label: 'Marketing & Client Acquisition' },
  { value: 'TAX_PPH_PPN', label: 'Tax (PPh 23 / PPN / PPh 21)' },
  { value: 'MISCELLANEOUS_EXPENSE', label: 'Miscellaneous Expense' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER_BCA', label: 'BCA Corporate Transfer' },
  { value: 'BANK_TRANSFER_MANDIRI', label: 'Mandiri Corporate Transfer' },
  { value: 'BANK_TRANSFER_BNI', label: 'BNI Giro Transfer' },
  { value: 'CORPORATE_CARD', label: 'Corporate Credit Card' },
  { value: 'PETTY_CASH', label: 'Petty Cash / Kas Kecil' },
  { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account (VA)' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'INCOME',
  editingTransaction = null,
  defaultProjectId,
}) => {
  const { projects, currentUser, addTransaction, updateTransaction } = useProjects();

  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>('CLIENT_CONSULTING_FEE');
  const [amountInput, setAmountInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [clientOrVendorName, setClientOrVendorName] = useState<string>('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_BCA');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('CLEARED');
  const [notes, setNotes] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAmountInput(editingTransaction.amountIDR.toString());
      setDescription(editingTransaction.description);
      setClientOrVendorName(editingTransaction.clientOrVendorName);
      setProjectId(editingTransaction.projectId || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setReferenceNumber(editingTransaction.referenceNumber || '');
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
      setAttachmentName(editingTransaction.attachmentName || '');
    } else {
      setType(initialType);
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(initialType === 'INCOME' ? 'CLIENT_CONSULTING_FEE' : 'SURVEYOR_AUDIT_FEES');
      setAmountInput('');
      setDescription('');
      setClientOrVendorName('');
      setProjectId(defaultProjectId || '');
      setPaymentMethod('BANK_TRANSFER_BCA');
      setReferenceNumber('');
      setStatus('CLEARED');
      setNotes('');
      setAttachmentName('');
    }
  }, [editingTransaction, initialType, defaultProjectId, isOpen]);

  // When type changes, adjust default category if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'INCOME') {
      setCategory('CLIENT_CONSULTING_FEE');
    } else {
      setCategory('SURVEYOR_AUDIT_FEES');
    }
  };

  // If user selects a project, auto-fill client name if empty
  const handleProjectChange = (pId: string) => {
    setProjectId(pId);
    if (pId) {
      const selectedPrj = projects.find((p) => p.id === pId);
      if (selectedPrj && !clientOrVendorName) {
        setClientOrVendorName(selectedPrj.clientName);
      }
    }
  };

  const numericAmount = parseFloat(amountInput.replace(/[^0-9]/g, '')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || numericAmount <= 0) {
      return;
    }

    const selectedPrj = projects.find((p) => p.id === projectId);

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        date,
        category: category as any,
        amountIDR: numericAmount,
        description: description.trim(),
        clientOrVendorName: clientOrVendorName.trim() || (type === 'INCOME' ? 'Client' : 'Vendor / Partner'),
        projectId: projectId || undefined,
        projectCode: selectedPrj?.code,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined,
      });
    } else {
      addTransaction({
        type,
        date,
        category: category as any,
        amountIDR: numericAmount,
        description: description.trim(),
        clientOrVendorName: clientOrVendorName.trim() || (type === 'INCOME' ? 'Client' : 'Vendor / Partner'),
        projectId: projectId || undefined,
        projectCode: selectedPrj?.code,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        recordedBy: currentUser.name,
        attachmentName: attachmentName.trim() || undefined,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          type === 'INCOME' ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'INCOME' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
            }`}>
              {type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingTransaction ? 'Edit Transaction' : type === 'INCOME' ? 'Record Daily Income / Revenue' : 'Record Daily Expense / Disbursement'}
              </h3>
              <p className="text-xs text-slate-500">
                VERIX Financial Management & Cash Flow Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income / Inflow (Pemasukan)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Expense / Outflow (Pengeluaran)</span>
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount (IDR / Rupiah) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. 75,000,000"
                  value={amountInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAmountInput(val ? Number(val).toLocaleString('id-ID') : '');
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 text-base font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    type === 'INCOME'
                      ? 'border-emerald-200 text-emerald-950 focus:ring-emerald-500 bg-emerald-50/20'
                      : 'border-rose-200 text-rose-950 focus:ring-rose-500 bg-rose-50/20'
                  }`}
                />
              </div>
              {numericAmount > 0 && (
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {type === 'INCOME' ? '+' : '-'} Rp {numericAmount.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Accounting Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {type === 'INCOME'
                    ? INCOME_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))
                    : EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Settlement Status <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="CLEARED">Cleared / Settled (Lunas / Masuk)</option>
                  <option value="PENDING">Pending Settlement / In Process</option>
                  <option value="OVERDUE">Overdue / Outstanding</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & Particulars */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Description of Service / Item <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'INCOME'
                  ? 'e.g. Termin 1 Down Payment TKDN Consulting for Smart Grid Meters'
                  : 'e.g. PT Sucofindo Field Verification & Official Assessor Audit Fee'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Client / Vendor & Project Association */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {type === 'INCOME' ? 'Payer / Client Name' : 'Payee / Vendor / Surveyor Name'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={type === 'INCOME' ? 'e.g. PT Nusantara Power Electric' : 'e.g. PT Sucofindo / Bluebird'}
                  value={clientOrVendorName}
                  onChange={(e) => setClientOrVendorName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Linked Project (Optional)
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">General Firm Overhead / Non-Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.clientName} ({p.productOrServiceName.slice(0, 24)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method & Reference / Invoice # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Channel / Bank
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice / Receipt Reference #
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. INV-2025/VRX/03/001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Attachment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receipt / Bank Slip Attachment
              </label>
              <div className="relative">
                <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Bank_Transfer_Proof_BCA.pdf"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Internal Audit / Tax Notes
              </label>
              <input
                type="text"
                placeholder="e.g. PPh 23 deduction already settled"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recorded by: <strong className="text-slate-700">{currentUser.name.split(',')[0]}</strong></span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={numericAmount <= 0 || !description.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
              }`}
            >
              {type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{editingTransaction ? 'Save Changes' : type === 'INCOME' ? 'Save Income Record' : 'Save Expense Record'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
