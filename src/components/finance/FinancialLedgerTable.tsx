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
  getTransactionStatusBadge,
  formatIDRShort,
} from '../../utils/formatters';
import { TransactionCategoryManagerModal } from './TransactionCategoryManagerModal';
import { PaymentChannelManagerModal } from './PaymentChannelManagerModal';
import { Settings, Landmark } from 'lucide-react';

interface FinancialLedgerTableProps {
  transactions: FinancialTransaction[];
  projects: ConsultingProject[];
  onOpenNewTransaction: (type: TransactionType) => void;
  onEditTransaction: (transaction: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransactionStatus: (id: string, newStatus: TransactionStatus) => void;
  onSelectProject?: (projectId: string) => void;
}

export const FinancialLedgerTable: React.FC<FinancialLedgerTableProps> = ({
  transactions,
  projects,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateTransactionStatus,
  onSelectProject,
}) => {
  const { isMasterAdmin, transactionCategories, paymentChannels } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<FinancialTransaction | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPaymentChannelManagerOpen, setIsPaymentChannelManagerOpen] = useState(false);

  // Date filtering logic
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

    return transactions.filter((t) => {
      // Type Filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      // Category Filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

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
  }, [transactions, typeFilter, categoryFilter, statusFilter, projectFilter, dateRangeFilter, searchQuery]);

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
      'Status',
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
      t.status,
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
              className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download CSV Ledger"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => onOpenNewTransaction('EXPENSE')}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>+ Record Expense</span>
            </button>

            <button
              onClick={() => onOpenNewTransaction('INCOME')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Record Income</span>
            </button>
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Settlement Status</option>
            <option value="CLEARED">✅ Cleared / Settled (Lunas)</option>
            <option value="HUTANG">💳 Hutang / Pinjaman</option>
            <option value="TERHUTANG">📌 Terhutang (Utang Usaha)</option>
            <option value="PENDING">⏳ Pending Settlement</option>
            <option value="OVERDUE">⚠️ Overdue</option>
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

          {/* Reset Filters button if any are non-default */}
          {(typeFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || projectFilter !== 'ALL' || dateRangeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
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
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-2.5 text-left w-[110px]">Date & Ref</th>
              <th className="py-3 px-2.5 text-left min-w-[150px]">Description & Project</th>
              <th className="py-3 px-2.5 text-left w-[130px]">Party & Channel</th>
              <th className="py-3 px-2.5 text-center w-[120px]">Category</th>
              <th className="py-3 px-2.5 text-right w-[125px]">Amount (IDR)</th>
              <th className="py-3 px-2.5 text-center w-[110px]">Status</th>
              <th className="py-3 px-3 text-center w-[85px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No transactions match your current filters</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try resetting search filters or record a new daily transaction</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const statusBadge = getTransactionStatusBadge(t.status);
                const categoryLabel = getTransactionCategoryLabel(t.category, transactionCategories);
                const paymentLabel = getPaymentMethodLabel(t.paymentMethod, paymentChannels);

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/90 transition-colors group"
                  >
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

                    {/* Status with 1-click toggle */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTransactionStatus(
                            t.id,
                            t.status === 'CLEARED' ? 'PENDING' : 'CLEARED'
                          )
                        }
                        className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all hover:scale-105 cursor-pointer whitespace-nowrap shadow-2xs ${statusBadge.color}`}
                        title="Klik untuk mengubah status Cleared / Pending"
                      >
                        {t.status === 'CLEARED' ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        ) : t.status === 'HUTANG' ? (
                          <Landmark className="w-3 h-3 shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">{statusBadge.label}</span>
                      </button>
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
    </div>
  );
};
