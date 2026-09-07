import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  X,
  CreditCard,
  Ban,
  FileText,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  Receivable,
  ReceivableCategory,
  ReceivableStatus,
} from '../../types';
import {
  RECEIVABLE_CATEGORIES,
  getReceivableCategoryLabel,
  getReceivableStatusBadge,
  getAgingBucket,
  getAgingBucketInfo,
  calculateReceivablesAgingSummary,
  calculateAgeDays,
  calculateDaysOverdue,
  AgingBucket,
} from '../../utils/receivableCalculations';
import { formatIDR } from '../../utils/formatters';
import { ReceivableModal } from './ReceivableModal';
import { ReceivablePaymentModal } from './ReceivablePaymentModal';
import { ReceivableDetailModal } from './ReceivableDetailModal';

export const ReceivableManagement: React.FC = () => {
  const {
    receivables,
    projects,
    deleteReceivable,
    cancelReceivable,
    resetReceivablesToDefault,
    currentUser,
  } = useProjects();

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [payingReceivable, setPayingReceivable] = useState<Receivable | null>(null);
  const [detailReceivable, setDetailReceivable] = useState<Receivable | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ReceivableStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<ReceivableCategory | 'ALL'>('ALL');
  const [agingFilter, setAgingFilter] = useState<AgingBucket | 'ALL'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Deletion confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate Aging Metrics
  const agingSummary = useMemo(() => {
    return calculateReceivablesAgingSummary(receivables);
  }, [receivables]);

  // Filtered receivables
  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) {
        return false;
      }

      // 3. Project Filter
      if (selectedProjectId !== 'ALL' && r.projectId !== selectedProjectId) {
        return false;
      }

      // 4. Aging Filter
      if (agingFilter !== 'ALL') {
        const bucket = getAgingBucket(r);
        if (bucket !== agingFilter) return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInv = r.invoiceNumber.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesClient = r.clientName.toLowerCase().includes(q);
        const matchesProj = r.projectCode?.toLowerCase().includes(q);
        const matchesMilestone = r.milestoneTitle?.toLowerCase().includes(q);
        if (!matchesInv && !matchesTitle && !matchesClient && !matchesProj && !matchesMilestone) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [receivables, statusFilter, categoryFilter, selectedProjectId, agingFilter, searchQuery]);

  // Counts by status
  const countsByStatus = useMemo(() => {
    const counts = {
      ALL: receivables.length,
      BELUM_DIBAYAR: 0,
      DIBAYAR_SEBAGIAN: 0,
      LUNAS: 0,
      JATUH_TEMPO: 0,
      BATAL: 0,
    };
    receivables.forEach((r) => {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [receivables]);

  const handleDelete = (id: string) => {
    deleteReceivable(id);
    setDeletingId(null);
  };

  const handleCancelWithPrompt = (id: string) => {
    const reason = window.prompt('Masukkan alasan pembatalan / write-off tagihan piutang:');
    if (reason !== null) {
      cancelReceivable(id, reason);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Piutang Beredar
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatIDR(agingSummary.totalOutstanding)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Faktur Aktif Belum Lunas</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                ({countsByStatus.BELUM_DIBAYAR + countsByStatus.DIBAYAR_SEBAGIAN + countsByStatus.JATUH_TEMPO} Invoice)
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
        </div>

        {/* Total Settled / Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Piutang Telah Terkoleksi
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatIDR(agingSummary.totalSettled)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Telah Masuk ke Kas:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {agingSummary.settlementRate.toFixed(1)}%
              </strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Total Invoiced */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Faktur Diterbitkan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatIDR(agingSummary.totalInvoiced)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Total Volume Komersial:</span>
              <strong className="text-blue-600 dark:text-blue-400 font-bold font-mono">
                {receivables.length} Invoice
              </strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        </div>

        {/* Overdue Alert */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tagihan Jatuh Tempo & Macet
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatIDR(agingSummary.agingOver90 + (receivables.filter(r => r.status === 'JATUH_TEMPO').reduce((acc, r) => acc + (r.remainingAmountIDR || 0), 0)))}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Perlu Follow-up Tagihan Segera</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </div>
      </div>

      {/* 2. Aging Buckets Matrix (Umur Piutang Usaha) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Matriks Umur Piutang (Accounts Receivable Aging Schedule)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Analisis risiko likuiditas dan klasifikasi jatuh tempo pembayaran tagihan klien
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAgingFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                agingFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Semua Umur
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 0 - 30 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === '0_30' ? 'ALL' : '0_30')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === '0_30'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40'
                : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                0 - 30 Hari (Lancar)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold">
                Current
              </span>
            </div>
            <h4 className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-2">
              {formatIDR(agingSummary.current0to30)}
            </h4>
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{
                  width: `${agingSummary.totalOutstanding > 0 ? (agingSummary.current0to30 / agingSummary.totalOutstanding) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* 31 - 60 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === '31_60' ? 'ALL' : '31_60')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === '31_60'
                ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 dark:bg-amber-950/40'
                : 'bg-amber-50/30 border-amber-200 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                31 - 60 Hari (Perhatian)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold">
                Watchlist
              </span>
            </div>
            <h4 className="text-lg font-black font-mono text-amber-700 dark:text-amber-400 mt-2">
              {formatIDR(agingSummary.aging31to60)}
            </h4>
            <div className="w-full bg-amber-200/60 dark:bg-amber-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{
                  width: `${agingSummary.totalOutstanding > 0 ? (agingSummary.aging31to60 / agingSummary.totalOutstanding) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* 61 - 90 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === '61_90' ? 'ALL' : '61_90')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === '61_90'
                ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 dark:bg-orange-950/40'
                : 'bg-orange-50/30 border-orange-200 hover:border-orange-300 dark:bg-orange-950/20 dark:border-orange-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                61 - 90 Hari (Kurang Lancar)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-bold">
                Sub-Standard
              </span>
            </div>
            <h4 className="text-lg font-black font-mono text-orange-700 dark:text-orange-400 mt-2">
              {formatIDR(agingSummary.aging61to90)}
            </h4>
            <div className="w-full bg-orange-200/60 dark:bg-orange-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full"
                style={{
                  width: `${agingSummary.totalOutstanding > 0 ? (agingSummary.aging61to90 / agingSummary.totalOutstanding) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* > 90 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === 'OVER_90' ? 'ALL' : 'OVER_90')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === 'OVER_90'
                ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 dark:bg-rose-950/40'
                : 'bg-rose-50/30 border-rose-200 hover:border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                &gt; 90 Hari (Macet / Loss)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-bold">
                Critical
              </span>
            </div>
            <h4 className="text-lg font-black font-mono text-rose-700 dark:text-rose-400 mt-2">
              {formatIDR(agingSummary.agingOver90)}
            </h4>
            <div className="w-full bg-rose-200/60 dark:bg-rose-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{
                  width: `${agingSummary.totalOutstanding > 0 ? (agingSummary.agingOver90 / agingSummary.totalOutstanding) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Semua ({countsByStatus.ALL})
            </button>

            <button
              onClick={() => setStatusFilter('BELUM_DIBAYAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'BELUM_DIBAYAR'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              <span>Belum Dibayar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono">
                {countsByStatus.BELUM_DIBAYAR}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('DIBAYAR_SEBAGIAN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'DIBAYAR_SEBAGIAN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300'
              }`}
            >
              <span>Sebagian</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-mono">
                {countsByStatus.DIBAYAR_SEBAGIAN}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              <span>Lunas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono">
                {countsByStatus.LUNAS}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('JATUH_TEMPO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'JATUH_TEMPO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              <span>Jatuh Tempo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-mono">
                {countsByStatus.JATUH_TEMPO}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => resetReceivablesToDefault()}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset contoh faktur piutang standar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={() => {
                setEditingReceivable(null);
                setIsNewModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Tagihan Piutang</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no invoice, nama klien, proyek..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
            >
              <option value="ALL">-- Semua Kategori Piutang --</option>
              {RECEIVABLE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
            >
              <option value="ALL">-- Semua Proyek Konsultasi --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.title || p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Interactive Receivables Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">
              Buku Besar Piutang Usaha & Termin Proyek ({filteredReceivables.length} Record)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Tersinkronisasi real-time ke seluruh role & Multi-User
          </span>
        </div>

        {filteredReceivables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">No. Invoice & Tanggal</th>
                  <th className="py-3.5 px-4">Klien & Proyek</th>
                  <th className="py-3.5 px-4">Kategori & Termin</th>
                  <th className="py-3.5 px-4 text-right">Nilai Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Terbayar & Status</th>
                  <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3.5 px-4">Umur & Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceivables.map((rec) => {
                  const statusBadge = getReceivableStatusBadge(rec.status);
                  const agingBucket = getAgingBucket(rec);
                  const agingInfo = getAgingBucketInfo(agingBucket);
                  const ageDays = calculateAgeDays(rec.issueDate);
                  const daysOverdue = calculateDaysOverdue(rec.dueDate);
                  const remaining = rec.remainingAmountIDR !== undefined
                    ? rec.remainingAmountIDR
                    : Math.max(0, rec.totalAmountIDR - (rec.paidAmountIDR || 0));
                  const percentPaid = rec.totalAmountIDR > 0
                    ? Math.min(100, Math.round(((rec.paidAmountIDR || 0) / rec.totalAmountIDR) * 100))
                    : 0;

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/80 transition-colors"
                    >
                      {/* Invoice & Issue Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <span>{rec.invoiceNumber}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Terbit: {rec.issueDate}
                        </span>
                      </td>

                      {/* Client & Project */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {rec.clientName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {rec.projectCode ? `[${rec.projectCode}] ` : ''}{rec.title}
                        </span>
                        {rec.notes && rec.notes.includes('KETERLAMBATAN PEMBAYARAN') && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 mt-1"
                            title={rec.notes}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            Keterlambatan Pembayaran
                          </span>
                        )}
                      </td>

                      {/* Category & Milestone */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getReceivableCategoryLabel(rec.category)}
                        </span>
                        {rec.milestoneTitle && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {rec.milestoneTitle}
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatIDR(rec.totalAmountIDR)}
                        {rec.taxIncluded && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-normal">
                            (Termasuk PPN)
                          </span>
                        )}
                      </td>

                      {/* Paid Amount & Progress */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          {formatIDR(rec.paidAmountIDR || 0)}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            {percentPaid}%
                          </span>
                        </div>
                      </td>

                      {/* Remaining Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                          {formatIDR(remaining)}
                        </span>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full font-bold border ${statusBadge.badgeClass}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Aging & Due Date */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold border ${agingInfo.badge}`}>
                          {agingInfo.label} ({ageDays} hari)
                        </span>
                        <span className={`text-[11px] font-mono block mt-1 ${daysOverdue > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500'}`}>
                          Due: {rec.dueDate} {daysOverdue > 0 ? `(Lewat ${daysOverdue}h)` : ''}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {remaining > 0 && rec.status !== 'BATAL' && (
                            <button
                              onClick={() => setPayingReceivable(rec)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                              title="Catat Pembayaran Masuk"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setDetailReceivable(rec)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail & Riwayat Faktur"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingReceivable(rec);
                              setIsNewModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                            title="Edit Data Faktur"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {rec.status !== 'BATAL' && rec.status !== 'LUNAS' && (
                            <button
                              onClick={() => handleCancelWithPrompt(rec.id)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan / Hapus Buku (Write-off)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {deletingId === rec.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(rec.id)}
                                className="px-1.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                Ya
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-1.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(rec.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Permanen Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak Ada Tagihan Piutang Yang Sesuai
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Belum ada faktur piutang yang cocok dengan filter pencarian saat ini atau database piutang masih kosong.
            </p>
            <button
              onClick={() => {
                setEditingReceivable(null);
                setIsNewModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Terbitkan Invoice Pertama</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Modals */}
      <ReceivableModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingReceivable(null);
        }}
        editingReceivable={editingReceivable}
      />

      <ReceivablePaymentModal
        isOpen={!!payingReceivable}
        onClose={() => setPayingReceivable(null)}
        receivable={payingReceivable}
      />

      <ReceivableDetailModal
        isOpen={!!detailReceivable}
        onClose={() => setDetailReceivable(null)}
        receivable={detailReceivable}
        onRecordPayment={(rec) => setPayingReceivable(rec)}
        onEdit={(rec) => {
          setEditingReceivable(rec);
          setIsNewModalOpen(true);
        }}
      />
    </div>
  );
};
