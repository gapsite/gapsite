import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  FileSpreadsheet,
  Check,
  Eye,
  Settings,
  Plus,
  Landmark,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  FinancialTransaction,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
  TransactionStatus,
  TransactionCategoryDefinition,
  PaymentChannelDefinition,
  LoanFacilityType,
} from '../../types';
import {
  getTransactionCategoryLabel,
  getPaymentMethodLabel,
} from '../../utils/formatters';
import { TransactionCategoryManagerModal } from './TransactionCategoryManagerModal';
import { PaymentChannelManagerModal } from './PaymentChannelManagerModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: FinancialTransaction | null;
  defaultProjectId?: string;
}

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
  const {
    projects,
    currentUser,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isMasterAdmin,
    activeTransactionCategories,
    transactionCategories,
    activePaymentChannels,
    paymentChannels,
    bankLoans,
    addBankLoan,
    updateBankLoan,
  } = useProjects();

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
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'image' | 'excel' | 'word' | 'other' | undefined>(undefined);
  const [attachmentSize, setAttachmentSize] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPaymentChannelManagerOpen, setIsPaymentChannelManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Debt / Loan state for Income sourced from Loan / Hutang
  const [isFromDebt, setIsFromDebt] = useState<boolean>(false);
  const [loanFacilityType, setLoanFacilityType] = useState<LoanFacilityType>('NON_REVOLVING');
  const [loanDebtName, setLoanDebtName] = useState<string>('');
  const [loanTenureMonths, setLoanTenureMonths] = useState<number>(12);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(0);

  // Grouped active payment channels
  const groupedPaymentChannels = useMemo(() => {
    const channels = activePaymentChannels && activePaymentChannels.length > 0
      ? activePaymentChannels
      : (paymentChannels && paymentChannels.length > 0 ? paymentChannels : []);
    
    const bankTransfer = channels.filter((c) => c.category === 'BANK_TRANSFER');
    const card = channels.filter((c) => c.category === 'CARD');
    const cash = channels.filter((c) => c.category === 'CASH');
    const digital = channels.filter((c) => c.category === 'DIGITAL');
    const other = channels.filter((c) => c.category === 'OTHER' || !c.category);

    return {
      bankTransfer,
      card,
      cash,
      digital,
      other,
      all: channels,
    };
  }, [activePaymentChannels, paymentChannels]);

  // Grouped active categories for dropdown
  const expenseCategories = useMemo(() => {
    const list = activeTransactionCategories.filter((c) => c.type === 'EXPENSE');
    const priorityIds = [
      'SURVEYOR_AUDIT_FEES',
      'TAX_PPH_PPN',
      'GAJI_KARYAWAN',
      'INTERNET',
      'LISTRIK',
      'OPERATIONAL_OFFICE',
      'MAKAN_MINUM',
      'TRANSPORTASI',
      'BANK_INTEREST',
      'SEWA_KANTOR',
      'OFFICE_UTILITIES_EXPENSE',
      'MISCELLANEOUS_EXPENSE',
      'ENTERTAINMENT',
      'AKOMODASI',
      'UANG_RAPAT',
      'LAIN_LAIN',
    ];
    
    const coreExpense = list.filter((c) => priorityIds.includes(c.id));
    const projectExpense = list.filter((c) => !priorityIds.includes(c.id) && (c.group?.includes('Proyek') || c.group?.includes('LVI') || c.group?.includes('Legal') || c.isDefault));
    const customExpense = list.filter((c) => !priorityIds.includes(c.id) && !projectExpense.some(p => p.id === c.id));

    return {
      coreExpense,
      projectExpense,
      customExpense,
    };
  }, [activeTransactionCategories]);

  const incomeCategories = useMemo(() => {
    return activeTransactionCategories.filter((c) => c.type === 'INCOME');
  }, [activeTransactionCategories]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAmountInput(editingTransaction.amountIDR ? editingTransaction.amountIDR.toLocaleString('id-ID') : '');
      setDescription(editingTransaction.description);
      setClientOrVendorName(editingTransaction.clientOrVendorName);
      setProjectId(editingTransaction.projectId || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setReferenceNumber(editingTransaction.referenceNumber || '');
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
      setAttachmentName(editingTransaction.attachmentName || '');
      setAttachmentUrl(editingTransaction.attachmentUrl);
      setAttachmentType(editingTransaction.attachmentType);
      setAttachmentSize(editingTransaction.attachmentSize);

      const isHutang = editingTransaction.status === 'HUTANG' || editingTransaction.isFromDebt || false;
      setIsFromDebt(isHutang);
      if (isHutang) {
        const linkedLoan = bankLoans?.find(
          (l) => l.id === editingTransaction.loanId || l.disbursementTransactionId === editingTransaction.id
        );
        if (linkedLoan) {
          setLoanDebtName(linkedLoan.loanName || '');
          setLoanFacilityType(linkedLoan.facilityType || 'NON_REVOLVING');
          setLoanTenureMonths(linkedLoan.tenureMonths || 12);
          setLoanInterestRate(linkedLoan.annualInterestRate || 0);
        } else {
          setLoanDebtName(editingTransaction.description || '');
          setLoanFacilityType('NON_REVOLVING');
          setLoanTenureMonths(12);
          setLoanInterestRate(0);
        }
      } else {
        setLoanDebtName('');
        setLoanFacilityType('NON_REVOLVING');
        setLoanTenureMonths(12);
        setLoanInterestRate(0);
      }
    } else {
      const defaultPayMethod = (activePaymentChannels && activePaymentChannels.length > 0)
        ? (activePaymentChannels[0].id as PaymentMethod)
        : (paymentChannels && paymentChannels.length > 0 ? (paymentChannels[0].id as PaymentMethod) : 'BANK_TRANSFER_BCA');

      setType(initialType);
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(initialType === 'INCOME' ? 'CLIENT_CONSULTING_FEE' : 'LISTRIK');
      setAmountInput('');
      setDescription('');
      setClientOrVendorName('');
      setProjectId(defaultProjectId || '');
      setPaymentMethod(defaultPayMethod);
      setReferenceNumber('');
      setStatus('CLEARED');
      setNotes('');
      setAttachmentName('');
      setAttachmentUrl(undefined);
      setAttachmentType(undefined);
      setAttachmentSize(undefined);
      setIsFromDebt(false);
      setLoanDebtName('');
      setLoanFacilityType('NON_REVOLVING');
      setLoanTenureMonths(12);
      setLoanInterestRate(0);
    }
  }, [editingTransaction, initialType, defaultProjectId, isOpen, activePaymentChannels, bankLoans]);

  const processUploadedFile = (file: File) => {
    setAttachmentName(file.name);

    // Determine readable file size
    const sizeInMB = file.size / (1024 * 1024);
    const readableSize = sizeInMB >= 1 
      ? `${sizeInMB.toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setAttachmentSize(readableSize);

    // Determine type
    const lowerName = file.name.toLowerCase();
    let fType: 'pdf' | 'image' | 'excel' | 'word' | 'other' = 'other';
    if (
      file.type.includes('image') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp')
    ) {
      fType = 'image';
    } else if (lowerName.endsWith('.pdf') || file.type.includes('pdf')) {
      fType = 'pdf';
    } else if (
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.csv')
    ) {
      fType = 'excel';
    } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      fType = 'word';
    }
    setAttachmentType(fType);

    // Read Data URL for preview and storage
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setAttachmentUrl(evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentName('');
    setAttachmentUrl(undefined);
    setAttachmentType(undefined);
    setAttachmentSize(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!description.trim() || numericAmount <= 0) {
      return;
    }

    const selectedPrj = projectId ? projects.find((p) => p.id === projectId) : undefined;
    const finalProjectId = projectId.trim() ? projectId.trim() : '';
    const finalProjectCode = selectedPrj?.code ? selectedPrj.code : '';

    const isDebtIncome = type === 'INCOME' && (status === 'HUTANG' || isFromDebt);
    const finalStatus: TransactionStatus = isDebtIncome ? 'HUTANG' : status;

    let registeredLoanId: string | undefined = editingTransaction?.loanId;

    // Automatic synchronizer to Debt & Bank Loan Management List if Income is from Hutang / Pinjaman
    if (isDebtIncome) {
      const existingLoan = bankLoans?.find(
        (l) => l.id === editingTransaction?.loanId || l.disbursementTransactionId === editingTransaction?.id
      );

      const loanTitle = loanDebtName.trim() || description.trim() || `Pinjaman Modal - ${clientOrVendorName.trim() || 'Kreditur'}`;
      const bankOrLender = clientOrVendorName.trim() || 'Pemberi Pinjaman / Rekan Finansial';

      if (existingLoan) {
        updateBankLoan(existingLoan.id, {
          loanName: loanTitle,
          bankName: bankOrLender,
          accountNumber: referenceNumber.trim() || undefined,
          principalAmount: numericAmount,
          annualInterestRate: typeof loanInterestRate === 'number' ? loanInterestRate : 0,
          tenureMonths: typeof loanTenureMonths === 'number' && loanTenureMonths > 0 ? loanTenureMonths : 12,
          facilityType: loanFacilityType,
          startDate: date,
          paymentChannelId: paymentMethod,
          purpose: description.trim() || 'Penerimaan Kas dari Hutang / Pinjaman',
          notes: notes.trim() || existingLoan.notes,
        });
        registeredLoanId = existingLoan.id;
      } else {
        const loanRes = addBankLoan({
          loanName: loanTitle,
          bankName: bankOrLender,
          accountNumber: referenceNumber.trim() || undefined,
          principalAmount: numericAmount,
          annualInterestRate: typeof loanInterestRate === 'number' ? loanInterestRate : 0,
          tenureMonths: typeof loanTenureMonths === 'number' && loanTenureMonths > 0 ? loanTenureMonths : 12,
          startDate: date,
          facilityType: loanFacilityType,
          paymentChannelId: paymentMethod,
          purpose: description.trim() || 'Penerimaan Kas dari Hutang / Pinjaman',
          isDisbursed: true,
          disbursedAt: date,
          status: 'ACTIVE',
          notes: notes.trim() || `Tercatat otomatis dari penerimaan kas (Income Hutang Ref: ${referenceNumber || 'TRX'}).`,
        });
        if (loanRes.loan?.id) {
          registeredLoanId = loanRes.loan.id;
        }
      }
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        date,
        category: isDebtIncome && category === 'CLIENT_CONSULTING_FEE' ? 'BANK_LOAN_DISBURSEMENT' : (category as any),
        amountIDR: numericAmount,
        description: description.trim(),
        clientOrVendorName: clientOrVendorName.trim() || (type === 'INCOME' ? (isDebtIncome ? 'Pemberi Pinjaman / Kreditur' : 'Client') : 'Vendor / Partner'),
        projectId: finalProjectId,
        projectCode: finalProjectCode,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || '',
        status: finalStatus,
        isFromDebt: isDebtIncome,
        loanId: registeredLoanId,
        notes: notes.trim() || '',
        attachmentName: attachmentName.trim() || '',
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: attachmentType || undefined,
        attachmentSize: attachmentSize || undefined,
      });
    } else {
      const newTx = addTransaction({
        type,
        date,
        category: isDebtIncome && category === 'CLIENT_CONSULTING_FEE' ? 'BANK_LOAN_DISBURSEMENT' : (category as any),
        amountIDR: numericAmount,
        description: description.trim(),
        clientOrVendorName: clientOrVendorName.trim() || (type === 'INCOME' ? (isDebtIncome ? 'Pemberi Pinjaman / Kreditur' : 'Client') : 'Vendor / Partner'),
        projectId: finalProjectId || undefined,
        projectCode: finalProjectCode || undefined,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        status: finalStatus,
        isFromDebt: isDebtIncome,
        loanId: registeredLoanId,
        notes: notes.trim() || undefined,
        recordedBy: currentUser.name,
        attachmentName: attachmentName.trim() || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: attachmentType || undefined,
        attachmentSize: attachmentSize || undefined,
      });

      if (isDebtIncome && registeredLoanId && newTx?.id) {
        updateBankLoan(registeredLoanId, {
          disbursementTransactionId: newTx.id,
        });
      }
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Accounting Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  title="Kelola Master Kategori Keuangan (Admin.Master Editable)"
                >
                  <Settings className="w-3 h-3" />
                  <span>Kelola Kategori</span>
                </button>
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {type === 'INCOME' ? (
                    <>
                      <optgroup label="── Kategori Pendapatan (Inflow) ──">
                        {incomeCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="── 8 Submenu Pengeluaran Rutin (Utama) ──">
                        {expenseCategories.coreExpense.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.description ? `(${c.description.slice(0, 30)}...)` : ''}
                          </option>
                        ))}
                      </optgroup>

                      {expenseCategories.projectExpense.length > 0 && (
                        <optgroup label="── Biaya Proyek & Verifikasi LVI ──">
                          {expenseCategories.projectExpense.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {expenseCategories.customExpense.length > 0 && (
                        <optgroup label="── Kategori Kustom Tambahan ──">
                          {expenseCategories.customExpense.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Settlement Status <span className="text-rose-500">*</span>
                </label>
                {type === 'INCOME' && (
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Sourced from Debt? Pilih "Hutang"
                  </span>
                )}
              </div>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TransactionStatus;
                    setStatus(newStatus);
                    if (newStatus === 'HUTANG') {
                      setIsFromDebt(true);
                    } else if (newStatus !== 'TERHUTANG') {
                      setIsFromDebt(false);
                    }
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 bg-white ${
                    status === 'HUTANG'
                      ? 'border-indigo-400 focus:ring-indigo-500 ring-1 ring-indigo-300 font-semibold text-indigo-900 bg-indigo-50/30'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                >
                  <option value="CLEARED">
                    {type === 'EXPENSE' ? 'Cleared / Paid (Sudah Lunas)' : 'Cleared / Settled (Lunas / Masuk)'}
                  </option>
                  <option value="HUTANG">
                    {type === 'INCOME'
                      ? '💳 Hutang (Penerimaan dari Pinjaman / Utang Baru)'
                      : '📌 Hutang / Pinjaman (Liabilitas Utang)'}
                  </option>
                  {type === 'EXPENSE' && (
                    <option value="TERHUTANG">
                      Terhutang (Utang Usaha / Belum Dibayar)
                    </option>
                  )}
                  <option value="PENDING">
                    {type === 'EXPENSE' ? 'Pending Settlement / Diproses' : 'Pending Settlement / Piutang Berjalan'}
                  </option>
                  <option value="OVERDUE">Overdue / Outstanding (Jatuh Tempo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SOURCED FROM DEBT/LOAN DEDICATED PANEL FOR INCOME */}
          {type === 'INCOME' && (status === 'HUTANG' || isFromDebt) && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border-2 border-indigo-200 shadow-xs space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      Integrasi Menu Hutang & Fasilitas Pinjaman
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                        Auto-Sync Menu Hutang
                      </span>
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Pemasukan ini akan otomatis terdaftar ke dalam list di <strong>Menu Hutang (Debt & Bank Loan Management)</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Fasilitas / Judul Hutang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={description || (clientOrVendorName ? `Pinjaman - ${clientOrVendorName}` : 'e.g. Pinjaman Modal Bank BRI / Pinjaman Pemegang Saham')}
                    value={loanDebtName}
                    onChange={(e) => setLoanDebtName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipe Fasilitas Hutang
                  </label>
                  <select
                    value={loanFacilityType}
                    onChange={(e) => setLoanFacilityType(e.target.value as LoanFacilityType)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="NON_REVOLVING">Pinjaman Berjangka (Term Loan / Pokok & Bunga Bulanan)</option>
                    <option value="REVOLVING">Pinjaman Fleksibel (KMK / Rekening Koran - Bunga Bulanan)</option>
                    <option value="OTHER">Hutang Pihak Ketiga / Pemegang Saham (Bebas / Tanpa Bunga)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tenor Pinjaman (Bulan)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={loanTenureMonths}
                    onChange={(e) => setLoanTenureMonths(parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Suku Bunga (% per tahun)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={loanInterestRate}
                    onChange={(e) => setLoanInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-white/90 border border-indigo-100 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Nominal <strong>Rp {numericAmount.toLocaleString('id-ID')}</strong> akan langsung diakui sebagai <strong>Liabilitas Hutang Pokok</strong> aktif di Menu Hutang dengan status pencairan lunas pada tanggal <strong>{date}</strong>.
                </span>
              </div>
            </div>
          )}

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
                {type === 'INCOME' ? 'Payer / Client Name' : 'Vendor'} <span className="text-rose-500">*</span>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Channel / Bank <span className="text-sky-600 font-semibold">(Bank BRI & Lainnya)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsPaymentChannelManagerOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                  title="Kelola Saluran Pembayaran & Bank (Tambah / Kurang Saluran Bank)"
                >
                  <Settings className="w-3 h-3" />
                  <span>Kelola Bank</span>
                </button>
              </div>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    if (e.target.value === '__OPEN_PAYMENT_MANAGER__') {
                      setIsPaymentChannelManagerOpen(true);
                    } else {
                      setPaymentMethod(e.target.value as PaymentMethod);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                >
                  {paymentMethod && !groupedPaymentChannels.all.some((c) => c.id === paymentMethod) && (
                    <option value={paymentMethod}>
                      {getPaymentMethodLabel(paymentMethod, paymentChannels)}
                    </option>
                  )}

                  {groupedPaymentChannels.bankTransfer.length > 0 && (
                    <optgroup label="── Transfer Bank & Giro (BRI, BCA, Mandiri, dll) ──">
                      {groupedPaymentChannels.bankTransfer.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedPaymentChannels.card.length > 0 && (
                    <optgroup label="── Kartu Korporat ──">
                      {groupedPaymentChannels.card.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedPaymentChannels.cash.length > 0 && (
                    <optgroup label="── Kas Tunai & Kas Kecil ──">
                      {groupedPaymentChannels.cash.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedPaymentChannels.digital.length > 0 && (
                    <optgroup label="── Virtual Account & QRIS ──">
                      {groupedPaymentChannels.digital.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedPaymentChannels.other.length > 0 && (
                    <optgroup label="── Metode Lainnya ──">
                      {groupedPaymentChannels.other.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__OPEN_PAYMENT_MANAGER__" className="text-sky-600 font-bold">
                    ➕ Kelola / Tambah Saluran Bank Baru...
                  </option>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Receipt / Bank Slip Attachment
                </label>
                {attachmentName && (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3 h-3" /> File Attached
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.doc,.docx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!attachmentName && !attachmentUrl ? (
                /* Drag & Drop Upload Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                    Click to browse or drag file here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF, PNG, JPG, JPEG, Excel, Word (Max 15MB)
                  </p>
                </div>
              ) : (
                /* Attached File Display Card */
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {attachmentType === 'image' && attachmentUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 relative group">
                          <img
                            src={attachmentUrl}
                            alt="Receipt preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : attachmentType === 'pdf' ? (
                        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          PDF
                        </div>
                      ) : attachmentType === 'excel' ? (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={attachmentName}>
                          {attachmentName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {attachmentSize && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {attachmentSize}
                            </span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                            {attachmentType || 'Document'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Upload a different file"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Optional filename fine-tuning */}
                  <div className="pt-1 border-t border-slate-200/70">
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="File title / reference name"
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Internal Audit / Tax Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. PPh 23 deduction already settled or specific approval note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recorded by: <strong className="text-slate-700">{currentUser.name.split(',')[0]}</strong></span>
            </p>
            {editingTransaction && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${editingTransaction.transactionNumber}" (${editingTransaction.description}) senilai Rp ${editingTransaction.amountIDR.toLocaleString('id-ID')}? Tindakan ini tidak dapat dibatalkan.`)) {
                    deleteTransaction(editingTransaction.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Hapus transaksi ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Transaksi</span>
              </button>
            )}
          </div>
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

      {/* Admin.Master Transaction Category Manager Modal */}
      <TransactionCategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        initialType={type}
        onCategoryCreated={(newCat) => {
          setCategory(newCat.id);
        }}
      />

      {/* Payment Channel / Bank Accounts Manager Modal */}
      <PaymentChannelManagerModal
        isOpen={isPaymentChannelManagerOpen}
        onClose={() => setIsPaymentChannelManagerOpen(false)}
        onSelectChannel={(channelId) => {
          setPaymentMethod(channelId as PaymentMethod);
        }}
      />
    </div>
  );
};
