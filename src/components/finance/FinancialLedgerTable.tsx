import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  X,
  FileCheck,
  CheckSquare,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  FinancialTransaction,
  ConsultingProject,
  TransactionType,
  TransactionStatus,
} from '../../types';
import {
  getTransactionCategoryLabel,
  getPaymentMethodLabel,
  formatIDR,
  formatIDRShort,
} from '../../utils/formatters';
import { TransactionCategoryManagerModal } from './TransactionCategoryManagerModal';
import { PaymentChannelManagerModal } from './PaymentChannelManagerModal';
import { BatchDeleteConfirmModal } from '../common/BatchDeleteConfirmModal';
import { Settings, Landmark, AlertTriangle } from 'lucide-react';
import {
  resolveTransactionToChannelId,
  isTransactionUnassigned,
} from '../../utils/paymentChannelUtils';

interface FinancialLedgerTableProps {
  transactions: FinancialTransaction[];
  projects: ConsultingProject[];
  onOpenNewTransaction?: (type: TransactionType) => void;
  onEditTransaction: (transaction: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteMultipleTransactions?: (ids: string[]) => void;
  onUpdateTransactionStatus?: (id: string, newStatus: TransactionStatus) => void;
  onSelectProject?: (projectId: string) => void;
}

export const FinancialLedgerTable: React.FC<FinancialLedgerTableProps> = ({
  transactions,
  projects,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onUpdateTransactionStatus,
  onSelectProject,
}) => {
  const { isMasterAdmin, transactionCategories, paymentChannels, deleteMultipleTransactions, updateTransaction } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<FinancialTransaction | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPaymentChannelManagerOpen, setIsPaymentChannelManagerOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [isBatchAssignModalOpen, setIsBatchAssignModalOpen] = useState(false);
  const [batchTargetChannel, setBatchTargetChannel] = useState<string>(() => {
    return paymentChannels && paymentChannels.length > 0 ? paymentChannels[0].id : 'BANK_TRANSFER_BCA';
  });
  const [batchAssignSuccess, setBatchAssignSuccess] = useState<string | null>(null);

  // Count unassigned transactions across all transactions
  const unassignedCount = useMemo(() => {
    return (transactions || []).filter((t) => isTransactionUnassigned(t, paymentChannels)).length;
  }, [transactions, paymentChannels]);

  // Date and attribute filtering logic
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const currentYearMonth = todayStr.slice(0, 7); // "YYYY-MM"

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(today.getMonth() - 1);
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

    const sorted = (transactions || []).filter((t) => {
      // Type Filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      // Category Filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Bank / Payment Channel Filter
      if (channelFilter !== 'ALL') {
        if (channelFilter === 'UNASSIGNED') {
          if (!isTransactionUnassigned(t, paymentChannels)) return false;
        } else {
          const assignedId = resolveTransactionToChannelId(t, paymentChannels);
          if (assignedId !== channelFilter) return false;
        }
      }

      // Project Filter
      if (projectFilter !== 'ALL') {
        if (projectFilter === 'NON_PROJECT') {
          if (t.projectId) return false;
        } else if (t.projectId !== projectFilter) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRangeFilter === 'TODAY' && t.date !== todayStr) return false;
      if (dateRangeFilter === '7DAYS' && t.date < sevenDaysAgoStr) return false;
      if (dateRangeFilter === 'THIS_MONTH' && !t.date.startsWith(currentYearMonth)) return false;
      if (dateRangeFilter === 'LAST_MONTH' && !t.date.startsWith(lastMonthStr)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTrxNo = t.transactionNumber.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchClient = t.clientOrVendorName.toLowerCase().includes(q);
        const matchRef = (t.referenceNumber || '').toLowerCase().includes(q);
        const matchProj = (t.projectCode || '').toLowerCase().includes(q);
        const matchCat = getTransactionCategoryLabel(t.category).toLowerCase().includes(q);

        if (!matchTrxNo && !matchDesc && !matchClient && !matchRef && !matchProj && !matchCat) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Deduplicate to guarantee absolute safety and unique keys in all views
    const seenIds = new Set<string>();
    return (sorted || []).filter((t) => {
      if (!t || !t.id) return false;
      const normalizedId = String(t.id).trim();
      if (!normalizedId || seenIds.has(normalizedId)) return false;
      seenIds.add(normalizedId);
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, channelFilter, paymentChannels, projectFilter, dateRangeFilter, searchQuery]);

  const isAllSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => selectedTransactionIds.includes(t.id));
  const isIndeterminate = selectedTransactionIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleToggleTransaction = (id: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTransactions = filteredTransactions.filter((t) =>
    selectedTransactionIds.includes(t.id)
  );
  const selectedIncomeTotal = selectedTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + t.amountIDR, 0);
  const selectedExpenseTotal = selectedTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amountIDR, 0);
  const selectedNet = selectedIncomeTotal - selectedExpenseTotal;

  const handleBatchAssignChannels = () => {
    if (selectedTransactionIds.length === 0) return;
    const target = paymentChannels.find((c) => c.id === batchTargetChannel);
    const targetLabel = target ? target.name : batchTargetChannel;

    selectedTransactionIds.forEach((id) => {
      updateTransaction(id, {
        paymentMethod: batchTargetChannel as any,
      });
    });

    const count = selectedTransactionIds.length;
    setSelectedTransactionIds([]);
    setIsBatchAssignModalOpen(false);
    setBatchAssignSuccess(`Berhasil menautkan ${count} transaksi ke saluran ${targetLabel}.`);
    setTimeout(() => setBatchAssignSuccess(null), 4000);
  };

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'Transaction No',
      'Date',
      'Type',
      'Category',
      'Description',
      'Client/Vendor',
      'Project Code',
      'Amount (IDR)',
      'Payment Method',
      'Reference No',
      'Recorded By',
    ];

    const rows = filteredTransactions.map((t) => [
      t.transactionNumber,
      t.date,
      t.type,
      getTransactionCategoryLabel(t.category),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.clientOrVendorName.replace(/"/g, '""')}"`,
      t.projectCode || 'Overhead',
      t.amountIDR,
      getPaymentMethodLabel(t.paymentMethod, paymentChannels),
      t.referenceNumber || '',
      t.recordedBy,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VERIX_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter tally summary
  const summaryIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountIDR, 0);

  const summaryExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountIDR, 0);

  const summaryNet = summaryIncome - summaryExpense;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Control Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction #, client, description, invoice #..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Kelola Master Kategori Keuangan (Admin Master Editable)"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kelola Kategori</span>
            </button>

            <button
              onClick={() => setIsPaymentChannelManagerOpen(true)}
              className="px-3 py-2 border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 rounded-xl text-xs font-semibold text-sky-800 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Kelola Saluran Pembayaran & Bank (BRI, BCA, Mandiri, dll)"
            >
              <Landmark className="w-3.5 h-3.5 text-sky-600" />
              <span>Saluran Bank & Rekening</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Download CSV Ledger"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Integrated Cash Flow Status Badge */}
            <div
              className="px-3 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-1.5 shadow-2xs select-none"
              title="Data arus kas terhubung dan mengalir otomatis dari menu Overhead, Sewa Kantor, Proyek Retail & Pemerintah, Piutang, Pinjaman Bank, Pajak, dan Payroll"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs">Arus Kas Terintegrasi Otomatis</span>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns & Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Type Filter Pills */}
          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('INCOME')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                typeFilter === 'INCOME' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              Income
            </button>
            <button
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                typeFilter === 'EXPENSE' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              <ArrowDownRight className="w-3 h-3" />
              Expenses
            </button>
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">📅 All Recorded Dates</option>
            <option value="TODAY">⚡ Today Only</option>
            <option value="7DAYS">📆 Last 7 Days</option>
            <option value="THIS_MONTH">🗓️ This Month (March 2025)</option>
            <option value="LAST_MONTH">⏮️ Last Month</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[200px] truncate"
            title="Filter by Associated Project"
          >
            <option value="ALL">All Associated Projects</option>
            <option value="NON_PROJECT">General Firm Overhead</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.clientName}
              </option>
            ))}
          </select>

          {/* Accounting Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[240px] truncate"
            title="Filter by Accounting Category"
          >
            <option value="ALL">🏷️ All Accounting Categories</option>
            {typeFilter !== 'EXPENSE' && (
              <optgroup label="── Pendapatan (Income Categories) ──">
                {transactionCategories
                  .filter((c) => c.type === 'INCOME')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            )}
            {typeFilter !== 'INCOME' && (
              <>
                <optgroup label="── 8 Submenu Pengeluaran Rutin ──">
                  {transactionCategories
                    .filter((c) => c.type === 'EXPENSE' && ['LISTRIK', 'GAJI_KARYAWAN', 'MAKAN_MINUM', 'ENTERTAINMENT', 'TRANSPORTASI', 'AKOMODASI', 'UANG_RAPAT', 'LAIN_LAIN'].includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="── Biaya Proyek & Operasional Lainnya ──">
                  {transactionCategories
                    .filter((c) => c.type === 'EXPENSE' && !['LISTRIK', 'GAJI_KARYAWAN', 'MAKAN_MINUM', 'ENTERTAINMENT', 'TRANSPORTASI', 'AKOMODASI', 'UANG_RAPAT', 'LAIN_LAIN'].includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              </>
            )}
          </select>

          {/* Bank / Payment Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[260px] truncate transition-all ${
              channelFilter === 'UNASSIGNED'
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold ring-1 ring-amber-400/50'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="Filter berdasarkan Saluran Rekening Bank"
          >
            <option value="ALL">🏦 Semua Saluran Rekening</option>
            <option value="UNASSIGNED" className="font-bold text-amber-800">
              ⚠️ Belum Ada Saluran Bank ({unassignedCount})
            </option>
            <optgroup label="── Rekening Bank Terdaftar ──">
              {paymentChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Reset Filters button if any are non-default */}
          {(typeFilter !== 'ALL' || categoryFilter !== 'ALL' || channelFilter !== 'ALL' || projectFilter !== 'ALL' || dateRangeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
                setChannelFilter('ALL');
                setProjectFilter('ALL');
                setDateRangeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Dynamic Ledger Summary Banner */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/80 text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{filteredTransactions.length}</strong> matching transaction{filteredTransactions.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Inflow: <strong className="text-emerald-700">+{formatIDRShort(summaryIncome)}</strong></span>
            <span>Outflow: <strong className="text-rose-700">-{formatIDRShort(summaryExpense)}</strong></span>
            <span>Net: <strong className={summaryNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {summaryNet >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(summaryNet))}
            </strong></span>
          </div>
        </div>

        {/* Unassigned Warning Banner */}
        {channelFilter === 'UNASSIGNED' && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-950">
                  Menampilkan {filteredTransactions.length} Transaksi Non-Rekening Khusus (Belum Terhubung ke Saluran Bank)
                </div>
                <div className="text-[11px] text-amber-800">
                  Transaksi ini masuk ke kategori <em>"Transaksi Kas / Saluran Lainnya"</em> di Laporan Keuangan. Centang transaksi di bawah lalu klik <strong>Tautkan Saluran Bank</strong> untuk memindahkannya ke rekening resmi (BCA, Mandiri, BRI, Kas Kecil, dll).
                </div>
              </div>
            </div>
            {filteredTransactions.length > 0 && selectedTransactionIds.length === 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
              >
                Pilih Semua {filteredTransactions.length} Transaksi Ini
              </button>
            )}
          </div>
        )}

        {/* Batch Feedback Notification */}
        {batchAssignSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchAssignSuccess}</span>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        {/* Batch Actions Banner */}
        {selectedTransactionIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedTransactionIds.length} Transaksi Terpilih</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                <span>Inflow: <strong className="text-emerald-400 font-bold">+{formatIDRShort(selectedIncomeTotal)}</strong></span>
                <span>Outflow: <strong className="text-rose-400 font-bold">-{formatIDRShort(selectedExpenseTotal)}</strong></span>
                <span>Net: <strong className={selectedNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedNet >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(selectedNet))}
                </strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isAllSelected && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                >
                  Pilih Semua ({filteredTransactions.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTransactionIds([])}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Batal</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBatchAssignModalOpen(true)}
                className="px-3 py-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tautkan Saluran Bank ({selectedTransactionIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedTransactionIds.length} Transaksi Bersamaan</span>
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  aria-label="Pilih Semua Transaksi"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
              </th>
              <th className="py-3 px-2.5 text-left w-[110px]">Date & Ref</th>
              <th className="py-3 px-2.5 text-left min-w-[150px]">Description & Project</th>
              <th className="py-3 px-2.5 text-left w-[130px]">Party & Channel</th>
              <th className="py-3 px-2.5 text-center w-[120px]">Category</th>
              <th className="py-3 px-2.5 text-right w-[125px]">Amount (IDR)</th>
              <th className="py-3 px-3 text-center w-[85px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada transaksi yang cocok dengan filter</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-lg mx-auto">
                    Arus kas mengalir otomatis dari transaksi di modul Overhead, Sewa Kantor, Proyek Retail, Proyek Pemerintah, Piutang, Pinjaman Bank, Pajak, dan Payroll
                  </p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, idx) => {
                const categoryLabel = getTransactionCategoryLabel(t.category, transactionCategories);
                const paymentLabel = getPaymentMethodLabel(t.paymentMethod, paymentChannels);

                return (
                  <tr
                    key={`trx-row-${t.id}-${idx}`}
                    className={`hover:bg-slate-50/90 transition-colors group ${
                      selectedTransactionIds.includes(t.id) ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Pilih transaksi ${t.transactionNumber}`}
                        checked={selectedTransactionIds.includes(t.id)}
                        onChange={() => handleToggleTransaction(t.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                      />
                    </td>
                    {/* Date & Ref */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{t.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{t.transactionNumber}</span>
                        {t.referenceNumber && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-[70px]">{t.referenceNumber}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Description & Project */}
                    <td className="py-2.5 px-2.5">
                      <p className="font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {t.projectCode ? (
                          <button
                            onClick={() => t.projectId && onSelectProject && onSelectProject(t.projectId)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{t.projectCode}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            General Overhead
                          </span>
                        )}
                        {t.attachmentName && (
                          <button
                            onClick={() => setSelectedReceipt(t)}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 font-medium"
                            title={`View receipt slip: ${t.attachmentName}`}
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>Receipt Slip</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Party & Channel */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800 truncate max-w-[130px]">{t.clientOrVendorName}</div>
                      <div className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[130px]">
                        <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{paymentLabel}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        t.type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {categoryLabel}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap font-mono text-right">
                      <div className={`font-black text-xs flex items-center justify-end gap-0.5 ${
                        t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {t.type === 'INCOME' ? <ArrowUpRight className="w-3 h-3 stroke-[3]" /> : <ArrowDownRight className="w-3 h-3 stroke-[3]" />}
                        <span>Rp {(t.amountIDR || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatIDRShort(t.amountIDR)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTransaction(t);
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title="Edit transaksi"
                          aria-label={`Edit ${t.transactionNumber}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${t.transactionNumber}" (${t.description}) senilai Rp ${t.amountIDR.toLocaleString('id-ID')}? Tindakan ini tidak dapat dibatalkan.`)) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title="Hapus transaksi"
                          aria-label={`Hapus ${t.transactionNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Delete Confirmation Modal */}
      <BatchDeleteConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeletingBatch(true);
          if (onDeleteMultipleTransactions) {
            onDeleteMultipleTransactions(selectedTransactionIds);
          } else {
            deleteMultipleTransactions(selectedTransactionIds);
          }
          setSelectedTransactionIds([]);
          setIsBatchDeleteModalOpen(false);
          setIsDeletingBatch(false);
        }}
        entityName="Transaksi Keuangan"
        warningMessage={`Menghapus ${selectedTransactions.length} transaksi secara bersamaan akan menghapus mutasi kas dari buku besar, dan saldo arus kas akan dikalkulasi ulang secara otomatis.`}
        totalAmountText={`Net: ${selectedNet >= 0 ? '+' : '-'}${formatIDR(Math.abs(selectedNet))} (Inflow: +${formatIDR(selectedIncomeTotal)}, Outflow: -${formatIDR(selectedExpenseTotal)})`}
        isDeleting={isDeletingBatch}
        items={selectedTransactions.map((t) => ({
          id: t.id,
          title: `${t.transactionNumber} - ${t.description}`,
          subtitle: `${t.date} • ${t.clientOrVendorName || 'General'} • ${t.projectCode || 'Overhead'}`,
          badge: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
          badgeColor:
            t.type === 'INCOME'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-rose-100 text-rose-800 border-rose-200',
          amount: `${t.type === 'INCOME' ? '+' : '-'}${formatIDR(t.amountIDR)}`,
        }))}
      />

      {/* Receipt Slip Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Transaction Receipt Slip</h4>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction No:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-900">{getTransactionCategoryLabel(selectedReceipt.category)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Party:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.clientOrVendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel:</span>
                  <span className="font-bold text-slate-900">{getPaymentMethodLabel(selectedReceipt.paymentMethod, paymentChannels)}</span>
                </div>
                {selectedReceipt.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref / Invoice #:</span>
                    <span className="font-bold text-slate-900">{selectedReceipt.referenceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="text-slate-700 font-bold">Total Amount:</span>
                  <span className={`font-black ${selectedReceipt.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Rp {(selectedReceipt.amountIDR || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Attached Document Preview / Box */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-xs block">Attached Document:</span>
                      <span className="text-[11px] text-indigo-700 font-mono">{selectedReceipt.attachmentName}</span>
                    </div>
                  </div>
                  {selectedReceipt.attachmentSize && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-mono">
                      {selectedReceipt.attachmentSize}
                    </span>
                  )}
                </div>

                {/* If image Data URL, display preview */}
                {selectedReceipt.attachmentUrl && selectedReceipt.attachmentType === 'image' && (
                  <div className="rounded-lg overflow-hidden border border-indigo-200 bg-white max-h-48 flex items-center justify-center">
                    <img
                      src={selectedReceipt.attachmentUrl}
                      alt={selectedReceipt.attachmentName || 'Receipt'}
                      className="max-h-48 w-full object-contain p-1"
                    />
                  </div>
                )}

                {/* Download / Open in New Tab if attachmentUrl exists */}
                {selectedReceipt.attachmentUrl && (
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <a
                      href={selectedReceipt.attachmentUrl}
                      download={selectedReceipt.attachmentName || 'receipt-attachment'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / View File</span>
                    </a>
                  </div>
                )}
              </div>

              {selectedReceipt.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block">Internal Audit Note:</span>
                  <span className="text-[11px] text-amber-800">{selectedReceipt.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Master Transaction Category Manager Modal */}
      <TransactionCategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        initialType="ALL"
      />

      {/* Payment Channel Manager Modal */}
      <PaymentChannelManagerModal
        isOpen={isPaymentChannelManagerOpen}
        onClose={() => setIsPaymentChannelManagerOpen(false)}
      />

      {/* Batch Assign Bank Channel Modal */}
      {isBatchAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tautkan Saluran Rekening Bank</h3>
                  <p className="text-[11px] text-slate-500">{selectedTransactionIds.length} transaksi terpilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pilih rekening bank tujuan. Semua transaksi yang Anda centang akan otomatis diubah saluran pembayarannya ke rekening ini:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rekening Bank / Saluran Pembayaran:
                </label>
                <select
                  value={batchTargetChannel}
                  onChange={(e) => setBatchTargetChannel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.accountNumber ? `(Rek: ${c.accountNumber})` : ''} - {c.accountHolder || 'Aktif'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchAssignModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchAssignChannels}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan ke {selectedTransactionIds.length} Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
