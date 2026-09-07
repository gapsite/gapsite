import React, { useState, useMemo } from 'react';
import {
  Gift,
  Award,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronDown,
  Building2,
  Edit2,
  Trash2,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { PayrollPayment, PaymentMethod } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatRupiah } from '../../utils/formatters';
import { terbilangRupiah } from '../../utils/payrollCalculations';
import { BonusThrModal } from './BonusThrModal';
import { BatchThrModal } from './BatchThrModal';
import { PayslipModal } from './PayslipModal';

interface BonusThrManagementViewProps {
  onSelectProject?: (projectId: string) => void;
}

export const BonusThrManagementView: React.FC<BonusThrManagementViewProps> = () => {
  const {
    payrollRecords,
    addPayrollPayment,
    updatePayrollPayment,
    deletePayrollPayment,
    batchAddPayrollPayments,
    currentUser,
    isMasterAdmin,
    hasPermission,
    paymentChannels,
  } = useProjects();

  const canManage =
    isMasterAdmin ||
    hasPermission('MANAGE_FINANCE') ||
    currentUser.role === 'DIRECTOR' ||
    (currentUser.role as string) === 'DIRECTOR_PARTNER' ||
    currentUser.role === 'FINANCE_OFFICER';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'THR' | 'BONUS' | 'PENDING'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollPayment | null>(null);
  const [viewSlipItem, setViewSlipItem] = useState<PayrollPayment | null>(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter records that belong to THR or Bonus
  const bonusThrRecords = useMemo(() => {
    return (payrollRecords || []).filter((r) => {
      const isThr = r.paymentCategory === 'THR' || (r.thrAmount && r.thrAmount > 0) || r.period?.toLowerCase().includes('thr') || r.payrollNumber?.startsWith('THR');
      const isBonus =
        r.paymentCategory === 'PERFORMANCE_BONUS' ||
        r.paymentCategory === 'PROJECT_BONUS' ||
        r.paymentCategory === 'ANNUAL_BONUS' ||
        (r.bonusAmount && r.bonusAmount > 0) ||
        (!isThr && r.projectBonus && r.projectBonus > 0 && r.basicSalary === 0) ||
        r.payrollNumber?.startsWith('BNS');

      return isThr || isBonus;
    });
  }, [payrollRecords]);

  // Extract available years (company founded in 2021)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    bonusThrRecords.forEach((r) => {
      if (r.paymentDate) {
        const y = r.paymentDate.slice(0, 4);
        if (y && Number(y) >= 2021) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [bonusThrRecords]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return bonusThrRecords.filter((r) => {
      // 1. Category Tab Filter
      const isThr = r.paymentCategory === 'THR' || (r.thrAmount && r.thrAmount > 0) || r.period?.toLowerCase().includes('thr') || r.payrollNumber?.startsWith('THR');
      if (activeCategoryTab === 'THR' && !isThr) return false;
      if (activeCategoryTab === 'BONUS' && isThr) return false;
      if (activeCategoryTab === 'PENDING' && r.status !== 'PENDING') return false;

      // 2. Year Filter
      if (yearFilter !== 'ALL') {
        const rYear = r.paymentDate ? r.paymentDate.slice(0, 4) : '';
        if (rYear !== yearFilter) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(term);
        const matchNumber = r.payrollNumber?.toLowerCase().includes(term);
        const matchRole = r.roleTitle?.toLowerCase().includes(term);
        const matchPeriod = r.period?.toLowerCase().includes(term);
        const matchNik = r.employeeNik?.toLowerCase().includes(term);
        const matchHoliday = r.holidayName?.toLowerCase().includes(term);
        if (!matchName && !matchNumber && !matchRole && !matchPeriod && !matchNik && !matchHoliday) {
          return false;
        }
      }

      return true;
    });
  }, [bonusThrRecords, activeCategoryTab, yearFilter, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let totalThrIDR = 0;
    let totalBonusIDR = 0;
    let totalTaxIDR = 0;
    let pendingCount = 0;
    const recipientIds = new Set<string>();

    bonusThrRecords.forEach((r) => {
      const isThr = r.paymentCategory === 'THR' || (r.thrAmount && r.thrAmount > 0) || r.period?.toLowerCase().includes('thr') || r.payrollNumber?.startsWith('THR');
      const amount = r.status === 'PAID' ? r.netSalary : 0;

      if (isThr) {
        totalThrIDR += amount;
      } else {
        totalBonusIDR += amount;
      }

      totalTaxIDR += r.pph21Amount || 0;
      recipientIds.add(r.employeeId || r.employeeName);

      if (r.status === 'PENDING') {
        pendingCount++;
      }
    });

    return {
      totalThrIDR,
      totalBonusIDR,
      totalAllDisbursed: totalThrIDR + totalBonusIDR,
      totalTaxIDR,
      recipientsCount: recipientIds.size,
      pendingCount,
      totalSlips: bonusThrRecords.length,
    };
  }, [bonusThrRecords]);

  // Handle Save (Create or Update)
  const handleSavePayroll = (
    data: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>
  ) => {
    if (editingItem) {
      updatePayrollPayment(editingItem.id, data);
      setActionFeedback(`Perubahan kompensasi ${data.employeeName} berhasil disimpan.`);
    } else {
      const res = addPayrollPayment(data);
      if (res.success) {
        setActionFeedback(res.message || `Pencairan ${data.employeeName} berhasil dibukukan!`);
      }
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Handle Batch Save
  const handleSaveBatch = (
    records: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>>
  ) => {
    const res = batchAddPayrollPayments(records);
    if (res.success) {
      setActionFeedback(`Berhasil mencairkan THR massal untuk ${records.length} karyawan sekaligus!`);
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    deletePayrollPayment(id);
    setDeletingId(null);
    setActionFeedback('Slip kompensasi dan mutasi kas terkait berhasil dihapus.');
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Handle Mark as Paid
  const handleMarkAsPaid = (record: PayrollPayment) => {
    updatePayrollPayment(record.id, {
      status: 'PAID',
      paidAt: new Date().toISOString().slice(0, 10),
    });
    setActionFeedback(`Status ${record.payrollNumber} (${record.employeeName}) diubah menjadi LUNAS dan dibukukan ke Kas.`);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data kompensasi untuk diekspor.');
      return;
    }

    const headers = [
      'No. Slip',
      'Tanggal',
      'Periode',
      'Kategori',
      'Nama Karyawan',
      'NIK',
      'Jabatan',
      'Bank Penerima',
      'No. Rekening',
      'Gaji Acuan (IDR)',
      'Bruto Kompensasi (IDR)',
      'Potongan PPh 21 (IDR)',
      'Potongan Lainnya (IDR)',
      'Net THP Diterima (IDR)',
      'Status',
      'Catatan',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.payrollNumber}"`,
      `"${r.paymentDate}"`,
      `"${r.period}"`,
      `"${r.paymentCategory || 'THR'}"`,
      `"${r.employeeName}"`,
      `"${r.employeeNik || ''}"`,
      `"${r.roleTitle}"`,
      `"${r.bankName || ''}"`,
      `"${r.bankAccountNumber || ''}"`,
      r.basicSalary || 0,
      r.totalEarnings || 0,
      r.pph21Amount || 0,
      r.totalDeductions - (r.pph21Amount || 0),
      r.netSalary || 0,
      `"${r.status}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Bonus_THR_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Bonus & Tunjangan Hari Raya (THR)
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                Kompensasi Khusus
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Modul terintegrasi pencairan THR Keagamaan (Idul Fitri, Natal, dsb.), Bonus Kinerja (KPI),
              serta Insentif Proyek Konsultasi. Otomatis menghitung prorata masa kerja, PPh 21 TER, dan membukukan mutasi ke Buku Kas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              title="Unduh Rekap Kompensasi ke format CSV/Excel"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Ekspor CSV</span>
            </button>

            {canManage && (
              <>
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
                  title="Kalkulator & Pencairan THR untuk seluruh staf sekaligus"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Cairkan THR Massal</span>
                </button>

                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsInputModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Input Bonus / THR</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total THR */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total THR Dicairkan</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatRupiah(stats.totalThrIDR)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-semibold">Tunjangan Keagamaan</span> resmi
          </div>
        </div>

        {/* Stat 2: Total Bonus */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bonus Dicairkan</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatRupiah(stats.totalBonusIDR)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Kinerja & Proyek</span> konsultan
          </div>
        </div>

        {/* Stat 3: Total PPh 21 Terhitung */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">PPh 21 Tersinkron</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatRupiah(stats.totalTaxIDR)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-rose-400 font-semibold">TER Tidak Teratur</span> ke Modul Pajak
          </div>
        </div>

        {/* Stat 4: Penerima & Pending */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Penerima & Status</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <span>{stats.recipientsCount} Orang</span>
            {stats.pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats.pendingCount} Pending
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total {stats.totalSlips} slip kompensasi diterbitkan
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-3">
        {/* Navigation Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategoryTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategoryTab === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Semua Pencairan ({bonusThrRecords.length})
            </button>

            <button
              onClick={() => setActiveCategoryTab('THR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategoryTab === 'THR'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Tunjangan Hari Raya (THR)</span>
            </button>

            <button
              onClick={() => setActiveCategoryTab('BONUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategoryTab === 'BONUS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Bonus Kinerja & Proyek</span>
            </button>

            <button
              onClick={() => setActiveCategoryTab('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategoryTab === 'PENDING'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Pencairan ({stats.pendingCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Menampilkan <span className="text-white font-bold">{filteredRecords.length}</span> data
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama karyawan, NIK, jabatan, no. slip, hari raya..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status (Lunas / Draft)</option>
              <option value="PAID">PAID (Lunas Terbayar)</option>
              <option value="PENDING">PENDING (Rencana Pencairan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="p-3.5">No. Slip & Periode</th>
                <th className="p-3.5">Karyawan / Konsultan</th>
                <th className="p-3.5">Kategori & Keterangan</th>
                <th className="p-3.5">Masa Kerja & Acuan</th>
                <th className="p-3.5">Bruto</th>
                <th className="p-3.5">Potongan PPh 21</th>
                <th className="p-3.5">Net Diterima (THP)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Gift className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">Belum ada data pencairan Bonus atau THR.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Gunakan tombol <strong>"+ Input Bonus / THR"</strong> atau <strong>"Cairkan THR Massal"</strong> di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isThr =
                    item.paymentCategory === 'THR' ||
                    (item.thrAmount && item.thrAmount > 0) ||
                    item.period?.toLowerCase().includes('thr') ||
                    item.payrollNumber?.startsWith('THR');
                  const isBonus = !isThr;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* No. Slip & Periode */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                          {item.payrollNumber}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{item.period}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.paymentDate}
                        </div>
                      </td>

                      {/* Karyawan / Konsultan */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.roleTitle} • {item.department}
                        </div>
                        {item.bankName && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.bankName} - {item.bankAccountNumber}
                          </div>
                        )}
                      </td>

                      {/* Kategori & Keterangan */}
                      <td className="p-3.5">
                        {isThr ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Gift className="w-3 h-3" /> THR Keagamaan
                            </span>
                            <div className="text-[11px] text-slate-300 mt-1">
                              {item.holidayName || item.period}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Award className="w-3 h-3" />
                              {item.paymentCategory === 'PROJECT_BONUS'
                                ? 'Bonus Proyek'
                                : item.paymentCategory === 'ANNUAL_BONUS'
                                ? 'Bonus Tahunan'
                                : 'Bonus Kinerja'}
                            </span>
                            {item.bonusCriteria && (
                              <div className="text-[11px] text-slate-300 mt-1 line-clamp-1" title={item.bonusCriteria}>
                                {item.bonusCriteria}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Masa Kerja & Gaji Acuan */}
                      <td className="p-3.5">
                        {isThr ? (
                          <div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold font-mono ${
                                item.isProratedThr || (item.serviceDurationMonths && item.serviceDurationMonths < 12)
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {item.serviceDurationMonths ? `${item.serviceDurationMonths} bln` : '12+ bln (Penuh)'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Acuan: {formatRupiah(item.basicSalary)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-slate-400">
                            Acuan: {formatRupiah(item.basicSalary)}
                          </div>
                        )}
                      </td>

                      {/* Bruto */}
                      <td className="p-3.5 font-mono font-semibold text-slate-200">
                        {formatRupiah(item.totalEarnings)}
                      </td>

                      {/* Potongan PPh 21 */}
                      <td className="p-3.5 font-mono text-rose-400">
                        {item.pph21Amount && item.pph21Amount > 0
                          ? `- ${formatRupiah(item.pph21Amount)}`
                          : 'Rp 0 (Nett)'}
                      </td>

                      {/* Net THP */}
                      <td className="p-3.5 font-mono font-bold text-emerald-400 text-sm">
                        {formatRupiah(item.netSalary)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {item.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> DRAFT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setViewSlipItem(item);
                            setIsPayslipOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Lihat & Cetak Slip Resmi"
                        >
                          <Printer className="w-4 h-4 text-teal-400" />
                        </button>

                        {canManage && (
                          <>
                            {item.status === 'PENDING' && (
                              <button
                                onClick={() => handleMarkAsPaid(item)}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-950 transition-colors"
                                title="Tandai PAID & Masukkan ke Buku Kas"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsInputModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Hapus Slip & Mutasi Terkait"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Konfirmasi Hapus Kompensasi</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus slip pencairan ini? Transaksi buku kas pengeluaran
              dan catatan PPh 21 terkait juga akan dibersihkan dari laporan keuangan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input / Edit Modal */}
      <BonusThrModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSavePayroll}
        initialData={editingItem}
      />

      {/* Batch THR Modal */}
      <BatchThrModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveBatch={handleSaveBatch}
      />

      {/* Payslip View Modal */}
      {viewSlipItem && (
        <PayslipModal
          isOpen={isPayslipOpen}
          onClose={() => {
            setIsPayslipOpen(false);
            setViewSlipItem(null);
          }}
          payroll={viewSlipItem}
        />
      )}
    </div>
  );
};
