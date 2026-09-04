import React, { useState, useMemo } from 'react';
import {
  Zap,
  Building,
  Utensils,
  Car,
  Bed,
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  X,
  Trash2,
  Edit,
  Receipt,
  FileSpreadsheet,
  ArrowDownRight,
  ShieldCheck,
  Building2,
  Layers,
  ChevronDown,
  Printer,
  Check,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { OverheadExpense, OverheadCategory } from '../../types';
import { formatIDR } from '../../utils/formatters';

interface OverheadManagementProps {
  onOpenReports?: () => void;
}

const CATEGORY_CONFIG: Record<
  OverheadCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string; badgeBg: string; border: string }
> = {
  LISTRIK: {
    label: 'Listrik & Utilitas (PLN/Air)',
    icon: Zap,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-400',
  },
  LISTRIK_UTILITAS: {
    label: 'Listrik & Utilitas (PLN/Air)',
    icon: Zap,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-400',
  },
  IURAN: {
    label: 'Iuran Gedung / Lingkungan',
    icon: Building,
    color: 'text-blue-500',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    border: 'border-blue-400',
  },
  IURAN_GEDUNG: {
    label: 'Iuran Gedung / Lingkungan',
    icon: Building,
    color: 'text-blue-500',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    border: 'border-blue-400',
  },
  KONSUMSI: {
    label: 'Konsumsi & Pantry Kantor',
    icon: Utensils,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-emerald-400',
  },
  KONSUMSI_PANTRY: {
    label: 'Konsumsi & Pantry Kantor',
    icon: Utensils,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-emerald-400',
  },
  TRANSPORTASI: {
    label: 'Transportasi, BBM & Tol',
    icon: Car,
    color: 'text-violet-500',
    badgeBg: 'bg-violet-50 text-violet-800 border-violet-200',
    border: 'border-violet-400',
  },
  TRANSPORTASI_BBM: {
    label: 'Transportasi, BBM & Tol',
    icon: Car,
    color: 'text-violet-500',
    badgeBg: 'bg-violet-50 text-violet-800 border-violet-200',
    border: 'border-violet-400',
  },
  AKOMODASI: {
    label: 'Akomodasi & Hotel Auditor',
    icon: Bed,
    color: 'text-rose-500',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    border: 'border-rose-400',
  },
  AKOMODASI_HOTEL: {
    label: 'Akomodasi & Hotel Auditor',
    icon: Bed,
    color: 'text-rose-500',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    border: 'border-rose-400',
  },
  ATK_OFFICE: {
    label: 'ATK & Perlengkapan Kerja',
    icon: FileText,
    color: 'text-teal-500',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    border: 'border-teal-400',
  },
  ATK_SUPPLIES: {
    label: 'ATK & Perlengkapan Kerja',
    icon: FileText,
    color: 'text-teal-500',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    border: 'border-teal-400',
  },
  LAIN_LAIN: {
    label: 'Operasional Lain-Lain',
    icon: DollarSign,
    color: 'text-slate-500',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
    border: 'border-slate-400',
  },
};

export const OverheadManagement: React.FC<OverheadManagementProps> = ({ onOpenReports }) => {
  const {
    overheadExpenses,
    addOverheadExpense,
    updateOverheadExpense,
    deleteOverheadExpense,
    syncAllOverheadToFinance,
    resetOverheadExpensesToDefault,
    paymentChannels,
  } = useProjects();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [taxFilter, setTaxFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OverheadExpense | null>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'LISTRIK_UTILITAS' as OverheadCategory,
    title: '',
    vendorOrMerchant: '',
    amountIDR: 0,
    date: new Date().toISOString().slice(0, 10),
    paidDate: new Date().toISOString().slice(0, 10),
    paymentChannelId: 'BANK_TRANSFER_BCA',
    status: 'PAID' as 'PAID' | 'PENDING' | 'SCHEDULED',
    division: 'Operasional',
    requestedBy: 'Staff Operasional',
    approvedBy: 'Finance Manager',
    hasTax: false,
    taxType: 'PPH_23' as 'PPH_23' | 'PPH_4_2' | 'PPN',
    taxRatePercent: 2,
    notes: '',
    receiptAttachment: '',
  });

  // Unique months available in data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    overheadExpenses.forEach((exp) => {
      if (exp.date) {
        months.add(exp.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [overheadExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return overheadExpenses.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.vendorOrMerchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.overheadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ((exp.division || exp.department || '')).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'ALL' ||
        exp.category === categoryFilter ||
        (categoryFilter === 'LISTRIK_UTILITAS' && exp.category === 'LISTRIK') ||
        (categoryFilter === 'IURAN_GEDUNG' && exp.category === 'IURAN') ||
        (categoryFilter === 'KONSUMSI_PANTRY' && exp.category === 'KONSUMSI') ||
        (categoryFilter === 'TRANSPORTASI_BBM' && exp.category === 'TRANSPORTASI') ||
        (categoryFilter === 'AKOMODASI_HOTEL' && exp.category === 'AKOMODASI') ||
        (categoryFilter === 'ATK_SUPPLIES' && exp.category === 'ATK_OFFICE');
      const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;
      const matchesTax =
        taxFilter === 'ALL' ||
        (taxFilter === 'TAXABLE' && exp.hasTax) ||
        (taxFilter === 'NON_TAX' && !exp.hasTax);
      const matchesMonth = monthFilter === 'ALL' || exp.date.startsWith(monthFilter);

      return matchesSearch && matchesCategory && matchesStatus && matchesTax && matchesMonth;
    });
  }, [overheadExpenses, searchQuery, categoryFilter, statusFilter, taxFilter, monthFilter]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const totalAmount = overheadExpenses.reduce((sum, e) => sum + (e.amountIDR || 0), 0);
    const paidAmount = overheadExpenses
      .filter((e) => e.status === 'PAID')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);
    const pendingAmount = overheadExpenses
      .filter((e) => e.status !== 'PAID')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const electricityTotal = overheadExpenses
      .filter((e) => e.category === 'LISTRIK_UTILITAS' || e.category === 'LISTRIK')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const duesTotal = overheadExpenses
      .filter((e) => e.category === 'IURAN_GEDUNG' || e.category === 'IURAN')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const consumptionTotal = overheadExpenses
      .filter((e) => e.category === 'KONSUMSI_PANTRY' || e.category === 'KONSUMSI')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const transportTotal = overheadExpenses
      .filter((e) => e.category === 'TRANSPORTASI_BBM' || e.category === 'TRANSPORTASI')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const accommodationTotal = overheadExpenses
      .filter((e) => e.category === 'AKOMODASI_HOTEL' || e.category === 'AKOMODASI')
      .reduce((sum, e) => sum + (e.amountIDR || 0), 0);

    const totalTaxes = overheadExpenses.reduce((sum, e) => sum + (e.taxAmountIDR || 0), 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      electricityTotal,
      duesTotal,
      consumptionTotal,
      transportTotal,
      accommodationTotal,
      totalTaxes,
    };
  }, [overheadExpenses]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'LISTRIK_UTILITAS',
      title: '',
      vendorOrMerchant: '',
      amountIDR: 0,
      date: new Date().toISOString().slice(0, 10),
      paidDate: new Date().toISOString().slice(0, 10),
      paymentChannelId: 'BANK_TRANSFER_BCA',
      status: 'PAID',
      division: 'Operasional',
      requestedBy: 'Staff Operasional',
      approvedBy: 'Finance Manager',
      hasTax: false,
      taxType: 'PPH_23',
      taxRatePercent: 2,
      notes: '',
      receiptAttachment: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: OverheadExpense) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      title: exp.title,
      vendorOrMerchant: exp.vendorOrMerchant,
      amountIDR: exp.amountIDR,
      date: exp.date,
      paidDate: exp.paidDate || exp.date,
      paymentChannelId: exp.paymentChannelId || 'BANK_TRANSFER_BCA',
      status: exp.status,
      division: exp.division || exp.department || 'Operasional',
      requestedBy: exp.requestedBy || 'Staff Operasional',
      approvedBy: exp.approvedBy || 'Finance Manager',
      hasTax: !!exp.hasTax,
      taxType: exp.taxType || 'PPH_23',
      taxRatePercent: exp.taxRatePercent || 2,
      notes: exp.notes || '',
      receiptAttachment: exp.receiptAttachment || exp.receiptName || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Mohon isi nama/keperluan pengeluaran overhead.');
      return;
    }
    if (formData.amountIDR <= 0) {
      alert('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    let calculatedTaxAmount = 0;
    if (formData.hasTax && formData.taxRatePercent > 0) {
      calculatedTaxAmount = Math.round((formData.amountIDR * formData.taxRatePercent) / 100);
    }
    const netPaymentIDR = formData.amountIDR - calculatedTaxAmount;

    if (editingExpense) {
      updateOverheadExpense(editingExpense.id, {
        category: formData.category,
        title: formData.title,
        vendorOrMerchant: formData.vendorOrMerchant,
        amountIDR: Number(formData.amountIDR),
        date: formData.date,
        paidDate: formData.status === 'PAID' ? formData.paidDate : undefined,
        paymentChannelId: formData.paymentChannelId,
        status: formData.status,
        division: formData.division,
        requestedBy: formData.requestedBy,
        approvedBy: formData.approvedBy,
        hasTax: formData.hasTax,
        taxType: formData.hasTax ? formData.taxType : undefined,
        taxRatePercent: formData.hasTax ? formData.taxRatePercent : undefined,
        taxAmountIDR: calculatedTaxAmount,
        netPaymentIDR: netPaymentIDR,
        notes: formData.notes,
        receiptAttachment: formData.receiptAttachment,
      });
    } else {
      addOverheadExpense({
        category: formData.category,
        title: formData.title,
        vendorOrMerchant: formData.vendorOrMerchant,
        amountIDR: Number(formData.amountIDR),
        date: formData.date,
        paidDate: formData.status === 'PAID' ? formData.paidDate : undefined,
        paymentChannelId: formData.paymentChannelId,
        status: formData.status,
        division: formData.division,
        requestedBy: formData.requestedBy,
        approvedBy: formData.approvedBy,
        hasTax: formData.hasTax,
        taxType: formData.hasTax ? formData.taxType : undefined,
        taxRatePercent: formData.hasTax ? formData.taxRatePercent : undefined,
        taxAmountIDR: calculatedTaxAmount,
        netPaymentIDR: netPaymentIDR,
        notes: formData.notes,
        receiptAttachment: formData.receiptAttachment,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Hapus pengeluaran overhead "${title}" secara permanen? Tindakan ini akan menghapus data dari memori dan storage.`)) {
      deleteOverheadExpense(id);
    }
  };

  const handleSyncToFinance = () => {
    const result = syncAllOverheadToFinance();
    const msg =
      result.createdTransactionsCount > 0 || result.createdTaxObligationsCount > 0
        ? `Berhasil disinkronkan! ${result.createdTransactionsCount} transaksi pengeluaran baru dicatat ke Buku Kas & ${result.createdTaxObligationsCount} kewajiban pajak dicatat.`
        : 'Semua pengeluaran overhead berstatus LUNAS sudah tersinkronisasi dengan Buku Kas & Laporan Keuangan.';

    setSyncToast({ message: msg, type: 'success' });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Overhead',
      'Tanggal',
      'Kategori',
      'Judul Pengeluaran',
      'Vendor / Merchant',
      'Divisi',
      'Nominal Bruto (Rp)',
      'Kena Pajak',
      'Jenis Pajak',
      'Potongan Pajak (Rp)',
      'Net Bayar (Rp)',
      'Metode / Rekening',
      'Status',
      'Catatan',
    ];

    const rows = filteredExpenses.map((e) => [
      e.overheadNumber,
      e.date,
      `"${CATEGORY_CONFIG[e.category]?.label || e.category}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.vendorOrMerchant.replace(/"/g, '""')}"`,
      `"${e.division || e.department || 'Operasional'}"`,
      e.amountIDR,
      e.hasTax ? 'YA' : 'TIDAK',
      e.taxType || '-',
      e.taxAmountIDR || 0,
      e.netPaymentIDR || e.amountIDR,
      e.paymentChannelId || 'KAS_BESAR',
      e.status,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Overhead_Operasional_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="overhead-management-root">
      {/* Toast Notification */}
      {syncToast && (
        <div className="bg-emerald-900/90 text-white px-4 py-3 rounded-xl border border-emerald-500/50 shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{syncToast.message}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shadow-inner">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    Overhead & Beban Operasional Kantor
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Real-Time Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pencatatan menyeluruh listrik & utilitas, iuran gedung, konsumsi & pantry, transportasi BBM, akomodasi hotel konsultan, terintegrasi ke Pajak & Arus Kas.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => {
                if (confirm('Kembalikan data master Overhead ke standar sistem? Data yang baru saja dibuat akan di-reset.')) {
                  resetOverheadExpensesToDefault();
                }
              }}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset data overhead ke default"
              id="btn-reset-overhead-data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Export data overhead ke CSV"
              id="btn-export-overhead-csv"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleSyncToFinance}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Sinkronkan seluruh pengeluaran berstatus PAID ke Buku Kas & Laporan Keuangan"
              id="btn-sync-overhead-to-finance"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Sinkron ke Arus Kas</span>
            </button>

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Buka Laporan Keuangan"
                id="btn-overhead-open-reports"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] cursor-pointer"
              id="btn-add-overhead-expense"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Catat Biaya Overhead</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5" id="overhead-stats-overview">
        {/* Card 1: Total Biaya Overhead */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Overhead</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 font-mono">{formatIDR(stats.totalAmount)}</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span>{overheadExpenses.length} transaksi tercatat</span>
            </div>
          </div>
        </div>

        {/* Card 2: Listrik & Utilitas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Listrik & Utilitas</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-600 font-mono">{formatIDR(stats.electricityTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">PLN, Air, Internet kantor</div>
          </div>
        </div>

        {/* Card 3: Iuran Gedung */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Iuran & Retribusi</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-blue-600 font-mono">{formatIDR(stats.duesTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">IPL, keamanan, kebersihan</div>
          </div>
        </div>

        {/* Card 4: Konsumsi & Pantry */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Konsumsi & Pantry</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 font-mono">{formatIDR(stats.consumptionTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Lembur, meeting, snack tamu</div>
          </div>
        </div>

        {/* Card 5: Transportasi & BBM */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Transportasi & BBM</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-violet-600 font-mono">{formatIDR(stats.transportTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">BBM, tol, armada operasional</div>
          </div>
        </div>

        {/* Card 6: Akomodasi & Hotel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Akomodasi Auditor</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-rose-600 font-mono">{formatIDR(stats.accommodationTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Hotel & penginapan lapangan</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengeluaran, vendor, no. referensi, divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="input-search-overhead"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              id="select-category-overhead"
            >
              <option value="ALL">Semua Kategori Overhead</option>
              <option value="LISTRIK_UTILITAS">Listrik & Utilitas (PLN/Air)</option>
              <option value="IURAN_GEDUNG">Iuran Gedung / Lingkungan</option>
              <option value="KONSUMSI_PANTRY">Konsumsi & Pantry</option>
              <option value="TRANSPORTASI_BBM">Transportasi, BBM & Tol</option>
              <option value="AKOMODASI_HOTEL">Akomodasi & Hotel</option>
              <option value="ATK_SUPPLIES">ATK & Perlengkapan</option>
              <option value="LAIN_LAIN">Lain-Lain</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              id="select-status-overhead"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">Lunas (Paid)</option>
              <option value="PENDING">Pending Approval</option>
              <option value="SCHEDULED">Terjadwal</option>
            </select>
          </div>

          {/* Tax Filter */}
          <div className="w-full md:w-40">
            <select
              value={taxFilter}
              onChange={(e) => setTaxFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              id="select-tax-overhead"
            >
              <option value="ALL">Semua Skema Pajak</option>
              <option value="TAXABLE">Ada Potongan PPh</option>
              <option value="NON_TAX">Non-Pajak</option>
            </select>
          </div>

          {/* Month Filter */}
          {availableMonths.length > 0 && (
            <div className="w-full md:w-40">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                id="select-month-overhead"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Overhead Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="overhead-table-container">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Transaksi Pengeluaran Overhead
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {filteredExpenses.length} Transaksi
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Total Halaman Ini: <span className="font-bold text-slate-900 font-mono">{formatIDR(filteredExpenses.reduce((s, e) => s + e.amountIDR, 0))}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="overhead-data-table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">No. Ref / Tanggal</th>
                <th className="py-3 px-4">Kategori & Keperluan</th>
                <th className="py-3 px-4">Vendor / Penerima</th>
                <th className="py-3 px-4">Divisi & Pemohon</th>
                <th className="py-3 px-4 text-right">Nominal Bruto</th>
                <th className="py-3 px-4 text-center">Pajak (PPh)</th>
                <th className="py-3 px-4 text-right">Net Dibayar</th>
                <th className="py-3 px-4">Status & Kas</th>
                <th className="py-3 px-4 text-center">Sinkronisasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Zap className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">Tidak ada data pengeluaran overhead yang sesuai filter.</p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        + Catat Overhead Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const cfg = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.LAIN_LAIN;
                  const IconComponent = cfg.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors" id={`row-overhead-${exp.id}`}>
                      {/* Ref & Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">{exp.overheadNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{exp.date}</span>
                        </div>
                      </td>

                      {/* Category & Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded-lg bg-slate-100 ${cfg.color} shrink-0 mt-0.5`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{exp.title}</div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-1 ${cfg.badgeBg}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{exp.vendorOrMerchant}</div>
                        {exp.notes && <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{exp.notes}</div>}
                      </td>

                      {/* Division */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {exp.division || exp.department || 'Operasional'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">Oleh: {exp.requestedBy || '-'}</div>
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(exp.amountIDR)}
                      </td>

                      {/* Tax */}
                      <td className="py-3 px-4 text-center">
                        {exp.hasTax && exp.taxAmountIDR && exp.taxAmountIDR > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {exp.taxType === 'PPH_23' ? 'PPh 23' : exp.taxType === 'PPH_4_2' ? 'PPh 4(2)' : 'PPN'} ({exp.taxRatePercent || 2}%)
                            </span>
                            <span className="text-[10px] font-mono text-purple-700 mt-0.5">
                              -{formatIDR(exp.taxAmountIDR)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Net Payment */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatIDR(exp.netPaymentIDR || exp.amountIDR)}
                      </td>

                      {/* Status & Method */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            exp.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : exp.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {exp.status === 'PAID' ? 'LUNAS' : exp.status === 'PENDING' ? 'PENDING' : 'TERJADWAL'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {exp.paymentChannelId || 'BCA Kas'}
                        </div>
                      </td>

                      {/* Sync Status */}
                      <td className="py-3 px-4 text-center">
                        {exp.transactionId ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title={`ID Transaksi: ${exp.transactionId}`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Tersinkron</span>
                          </span>
                        ) : exp.status === 'PAID' ? (
                          <button
                            onClick={handleSyncToFinance}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                            title="Klik untuk sinkronkan ke buku kas"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-600" />
                            <span>Sinkronkan</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Menunggu Bayar</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengeluaran"
                            id={`btn-edit-overhead-${exp.id}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id, exp.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Permanen"
                            id={`btn-delete-overhead-${exp.id}`}
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
      </div>

      {/* Add / Edit Overhead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingExpense ? 'Edit Pengeluaran Overhead' : 'Catat Pengeluaran Overhead Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input kebutuhan operasional kantor listrik, iuran, konsumsi, transportasi & akomodasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as OverheadCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                    id="input-form-category"
                  >
                    <option value="LISTRIK_UTILITAS">1. Listrik & Utilitas Kantor (PLN/Air/Internet)</option>
                    <option value="IURAN_GEDUNG">2. Iuran Gedung, Kebersihan & Keamanan (IPL)</option>
                    <option value="KONSUMSI_PANTRY">3. Konsumsi Lembur, Meeting & Pantry</option>
                    <option value="TRANSPORTASI_BBM">4. Transportasi, BBM & E-Toll Operasional</option>
                    <option value="AKOMODASI_HOTEL">5. Akomodasi & Hotel Auditor Lapangan</option>
                    <option value="ATK_SUPPLIES">6. ATK, Kertas & Perlengkapan Cetak</option>
                    <option value="LAIN_LAIN">7. Operasional Kantor Lain-Lain</option>
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Divisi Pengaju <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    id="input-form-division"
                  >
                    <option value="Operasional">Divisi Operasional & GA</option>
                    <option value="Konsultan & Teknis">Divisi Konsultan & Verifikasi Lapangan</option>
                    <option value="Keuangan & Pajak">Divisi Keuangan & Pajak</option>
                    <option value="Legal & Perizinan">Divisi Legalitas & Perizinan</option>
                    <option value="Marketing & Bisnis">Divisi Marketing & Komersial</option>
                    <option value="Direksi & Eksekutif">Direksi / Manajemen Puncak</option>
                  </select>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul / Keperluan Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pembayaran Tagihan Listrik PLN Kantor Bulan Agustus 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  id="input-form-title"
                />
              </div>

              {/* Vendor & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vendor / Merchant / Penyedia Jasa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PT PLN (Persero) / Pengelola Gedung / Pertamina"
                    value={formData.vendorOrMerchant}
                    onChange={(e) => setFormData({ ...formData, vendorOrMerchant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    id="input-form-vendor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Bruto (IDR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={formData.amountIDR || ''}
                      onChange={(e) => setFormData({ ...formData, amountIDR: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="0"
                      required
                      id="input-form-amount"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Paid Date, Channel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    id="input-form-date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    id="input-form-status"
                  >
                    <option value="PAID">Lunas (Paid - Masuk Kas)</option>
                    <option value="PENDING">Pending (Belum Dibayar)</option>
                    <option value="SCHEDULED">Terjadwal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rekening Kas Pengeluaran
                  </label>
                  <select
                    value={formData.paymentChannelId}
                    onChange={(e) => setFormData({ ...formData, paymentChannelId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    id="input-form-channel"
                  >
                    {paymentChannels && paymentChannels.length > 0 ? (
                      paymentChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.accountNumber})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="BANK_TRANSFER_BCA">BCA Operasional (088-291-8899)</option>
                        <option value="BANK_TRANSFER_MANDIRI">Mandiri Escrow (122-00-19283-9)</option>
                        <option value="KAS_KECIL_PETTY_CASH">Kas Kecil Kantor (Petty Cash)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Tax Settings Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-has-tax"
                      checked={formData.hasTax}
                      onChange={(e) => setFormData({ ...formData, hasTax: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="chk-has-tax" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Pengeluaran ini Kena Potongan Pajak (PPh 23 Jasa / PPh 4 ayat 2 / PPN)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500">Otomatis masuk ke Modul Pajak</span>
                </div>

                {formData.hasTax && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Pajak</label>
                      <select
                        value={formData.taxType}
                        onChange={(e) => {
                          const val = e.target.value as 'PPH_23' | 'PPH_4_2' | 'PPN';
                          const defaultRate = val === 'PPH_23' ? 2 : val === 'PPH_4_2' ? 10 : 11;
                          setFormData({ ...formData, taxType: val, taxRatePercent: defaultRate });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="PPH_23">PPh 23 Jasa / Sewa Harta (2%)</option>
                        <option value="PPH_4_2">PPh Final Pasal 4(2) Gedung (10%)</option>
                        <option value="PPN">PPN Masukan (11%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tarif Pajak (%) & Estimasi Potongan
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={0.5}
                          value={formData.taxRatePercent}
                          onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                          className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        />
                        <span className="text-xs text-purple-700 font-mono font-bold">
                          = Rp {Math.round((formData.amountIDR * (formData.taxRatePercent || 0)) / 100).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan Bukti</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan nomor faktur/kuitansi, rincian personil yang bertugas..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  id="input-form-notes"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-950/30 transition-all cursor-pointer"
                  id="btn-save-overhead-expense"
                >
                  {editingExpense ? 'Simpan Perubahan' : 'Simpan & Sinkronkan Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
