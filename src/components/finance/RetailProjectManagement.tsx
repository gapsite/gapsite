import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  Receipt,
  ArrowUpRight,
  ExternalLink,
  SlidersHorizontal,
  Briefcase,
  BadgePercent,
  Check,
  Percent,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  RetailProject,
  RetailMilestone,
  RetailServiceCategory,
  RetailPricingType,
  RetailPphType,
  RetailProjectStatus,
  RetailMilestoneStatus,
  RetailPaymentScheme,
} from '../../types';
import { formatIDR } from '../../utils/formatters';

interface RetailProjectManagementProps {
  onSelectProject?: (projectId: string) => void;
  onOpenReports?: () => void;
}

const SERVICE_CATEGORY_LABELS: Record<RetailServiceCategory, string> = {
  KONSULTASI_TKDN: 'Pendampingan Sertifikasi TKDN',
  SERTIFIKASI_BMP: 'Bobot Manfaat Perusahaan (BMP)',
  PERIZINAN_LEGAL: 'Perizinan OSS & Legalitas',
  AUDIT_INTERNAL: 'Pre-Audit & Verifikasi LVI',
  PELATIHAN_ISO: 'Pelatihan TKDN & ISO',
  RETAINER_KONSULTASI: 'Retainer Bulanan Kepatuhan',
  LAINNYA: 'Layanan Retail Lainnya',
};

const PAYMENT_SCHEME_LABELS: Record<RetailPaymentScheme, string> = {
  LUNAS_DIMUKA: 'Lunas Dimuka (100% DP)',
  TERMIN_2: '2 Termin (50% DP - 50% BAST)',
  TERMIN_3: '3 Termin (30% DP - 40% Audit - 30% BAST)',
  TERMIN_CUSTOM: 'Kustom Persentase Termin',
  RETAINER_BULANAN: 'Retainer Bulanan Berkala',
};

export const RetailProjectManagement: React.FC<RetailProjectManagementProps> = ({
  onSelectProject,
  onOpenReports,
}) => {
  const {
    retailProjects,
    addRetailProject,
    updateRetailProject,
    deleteRetailProject,
    generateRetailInvoiceToReceivables,
    recordRetailMilestonePayment,
    addRetailMilestone,
    updateRetailMilestone,
    deleteRetailMilestone,
    syncAllRetailToFinance,
    resetRetailProjectsToDefault,
    paymentChannels,
    projects,
    receivables,
    taxObligations,
  } = useProjects();

  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [pricingFilter, setPricingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({
    'ret-sample-1': true,
    'ret-sample-2': true,
  });

  // Project Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<RetailProject | null>(null);

  // Invoice Generation Modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedMilestoneForInvoice, setSelectedMilestoneForInvoice] = useState<{
    project: RetailProject;
    milestone: RetailMilestone;
  } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    fakturPajakNumber: '',
    syncPpnObligation: true,
    notes: '',
  });

  // Payment Recording Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] = useState<{
    project: RetailProject;
    milestone: RetailMilestone;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amountReceivedIDR: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentChannelId: '',
    referenceNumber: '',
    bupotPphNumber: '',
    syncToCashLedger: true,
    syncToTaxObligations: true,
    notes: '',
  });

  // Add Custom Milestone Modal state
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [activeProjectIdForMilestone, setActiveProjectIdForMilestone] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    percentage: 30,
    grossAmountIDR: 0,
    targetDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Toggle Project Milestone Accordion
  const toggleProjectExpand = (id: string) => {
    setExpandedProjectIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return retailProjects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.projectName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.contractNumber.toLowerCase().includes(q) ||
        (p.clientPicName && p.clientPicName.toLowerCase().includes(q)) ||
        (p.clientNpwp && p.clientNpwp.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'ALL' || p.serviceCategory === categoryFilter;
      const matchesPricing = pricingFilter === 'ALL' || p.pricingType === pricingFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesPricing && matchesStatus;
    });
  }, [retailProjects, searchQuery, categoryFilter, pricingFilter, statusFilter]);

  // Aggregate KPI Statistics
  const stats = useMemo(() => {
    let totalContractValue = 0;
    let totalBilled = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let totalPph23 = 0;
    let totalPpn = 0;
    let activeProjectsCount = 0;

    retailProjects.forEach((p) => {
      totalContractValue += p.totalContractValueIDR || 0;
      totalBilled += p.totalBilledAmountIDR || 0;
      totalReceived += p.totalReceivedAmountIDR || 0;
      totalOutstanding += p.totalOutstandingAmountIDR || 0;

      if (p.status === 'AKTIF') {
        activeProjectsCount += 1;
      }

      (p.milestones || []).forEach((m) => {
        if (m.status === 'LUNAS') {
          totalPph23 += m.pphAmountIDR || 0;
        }
        if (m.status === 'INVOICE_TERBIT' || m.status === 'LUNAS' || m.status === 'DIBAYAR_SEBAGIAN') {
          totalPpn += m.ppnAmountIDR || 0;
        }
      });
    });

    return {
      totalContractValue,
      totalBilled,
      totalReceived,
      totalOutstanding,
      totalPph23,
      totalPpn,
      activeProjectsCount,
      totalProjects: retailProjects.length,
    };
  }, [retailProjects]);

  // Handle Open Invoice Modal
  const handleOpenInvoiceModal = (project: RetailProject, milestone: RetailMilestone) => {
    setSelectedMilestoneForInvoice({ project, milestone });
    const nowStr = new Date().toISOString().slice(0, 10);
    const dueDateCalc = new Date();
    dueDateCalc.setDate(dueDateCalc.getDate() + (project.invoicePaymentTermDays || 14));

    setInvoiceForm({
      invoiceNumber: milestone.invoiceNumber || `INV/RET/${new Date().getFullYear()}/${project.id.slice(-4)}/T${milestone.termNumber}`,
      issueDate: nowStr,
      dueDate: milestone.targetDate || dueDateCalc.toISOString().slice(0, 10),
      fakturPajakNumber: milestone.fakturPajakNumber || '',
      syncPpnObligation: milestone.ppnAmountIDR > 0,
      notes: `Tagihan ${milestone.title} - ${project.projectName} (${project.clientName})`,
    });
    setIsInvoiceModalOpen(true);
  };

  // Submit Invoice Generation
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForInvoice) return;

    const res = generateRetailInvoiceToReceivables(
      selectedMilestoneForInvoice.project.id,
      selectedMilestoneForInvoice.milestone.id,
      {
        invoiceNumber: invoiceForm.invoiceNumber,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        fakturPajakNumber: invoiceForm.fakturPajakNumber,
        syncPpnObligation: invoiceForm.syncPpnObligation,
        notes: invoiceForm.notes,
      }
    );

    if (res.success) {
      alert(res.message || 'Invoice retail berhasil diterbitkan ke Piutang Usaha & Pajak!');
      setIsInvoiceModalOpen(false);
      setSelectedMilestoneForInvoice(null);
    } else {
      alert(res.message || 'Gagal menerbitkan invoice.');
    }
  };

  // Handle Open Payment Recording Modal
  const handleOpenPaymentModal = (project: RetailProject, milestone: RetailMilestone) => {
    setSelectedMilestoneForPayment({ project, milestone });
    const defaultChannel = paymentChannels && paymentChannels.length > 0 ? paymentChannels[0].id : 'BANK_TRANSFER';
    const suggestedCash = milestone.netDisbursementIDR || milestone.grossAmountIDR;

    setPaymentForm({
      amountReceivedIDR: suggestedCash,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentChannelId: defaultChannel,
      referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
      bupotPphNumber: milestone.bupotPphNumber || '',
      syncToCashLedger: true,
      syncToTaxObligations: milestone.pphAmountIDR > 0,
      notes: `Pelunasan Termin ${milestone.termNumber} dari ${project.clientName}`,
    });
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Recording
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForPayment) return;

    const res = recordRetailMilestonePayment(
      selectedMilestoneForPayment.project.id,
      selectedMilestoneForPayment.milestone.id,
      {
        amountReceivedIDR: paymentForm.amountReceivedIDR,
        paymentDate: paymentForm.paymentDate,
        paymentChannelId: paymentForm.paymentChannelId,
        referenceNumber: paymentForm.referenceNumber,
        bupotPphNumber: paymentForm.bupotPphNumber,
        syncToCashLedger: paymentForm.syncToCashLedger,
        syncToTaxObligations: paymentForm.syncToTaxObligations,
        notes: paymentForm.notes,
      }
    );

    if (res.success) {
      alert(res.message || 'Pembayaran berhasil dibukukan ke Arus Kas, Piutang & Pajak!');
      setIsPaymentModalOpen(false);
      setSelectedMilestoneForPayment(null);
    } else {
      alert(res.message || 'Gagal mencatat pembayaran.');
    }
  };

  // Export CSV Summary
  const handleExportCSV = () => {
    const headers = [
      'ID Proyek',
      'Nama Klien',
      'Nama Proyek',
      'Kategori Layanan',
      'No. Kontrak / SPK',
      'Nilai Kontrak (Rp)',
      'Skema Pajak',
      'Jenis PPh',
      'Total Tertagih (Rp)',
      'Total Kas Masuk (Rp)',
      'Sisa Piutang (Rp)',
      'Status',
    ];

    const rows = retailProjects.map((p) => [
      p.id,
      `"${p.clientName.replace(/"/g, '""')}"`,
      `"${p.projectName.replace(/"/g, '""')}"`,
      `"${SERVICE_CATEGORY_LABELS[p.serviceCategory] || p.serviceCategory}"`,
      `"${p.contractNumber || '-'}"`,
      p.totalContractValueIDR,
      p.pricingType,
      p.pphType,
      p.totalBilledAmountIDR,
      p.totalReceivedAmountIDR,
      p.totalOutstandingAmountIDR,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Proyek_Retail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncToFinance = () => {
    const result = syncAllRetailToFinance();
    const msg =
      result.createdTransactionsCount > 0 || result.createdTaxObligationsCount > 0
        ? `Berhasil disinkronkan! ${result.createdTransactionsCount} pendapatan termin masuk ke Buku Kas & ${result.createdTaxObligationsCount} PPN Keluaran dicatat ke Modul Pajak.`
        : 'Semua termin proyek retail yang telah diterbitkan invoice / lunas sudah tersinkronisasi penuh dengan Buku Kas & Pajak.';

    setSyncToast({ message: msg, type: 'success' });
    setTimeout(() => setSyncToast(null), 5000);
  };

  return (
    <div className="space-y-6" id="retail-project-management-root">
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
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30 shadow-inner">
                <Briefcase className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    Manajemen Proyek Retail & B2B Swasta
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Real-Time Sync
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Integrasi otomatis Kontrak SPK/PO Retail ke Buku Kas (Inflow), Piutang Usaha (Invoice Termin), dan Pajak (PPN Keluaran & Kredit PPh 23)
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => {
                if (confirm('Kembalikan data master Proyek Retail ke contoh standar sistem? Data yang dibuat saat ini akan di-reset.')) {
                  resetRetailProjectsToDefault();
                }
              }}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset data retail ke default"
              id="btn-reset-retail-data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Download Ringkasan Kontrak Retail CSV"
              id="btn-export-retail-csv"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleSyncToFinance}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Sinkronkan seluruh termin invoice/lunas ke Buku Kas & Pajak"
              id="btn-sync-retail-to-finance"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Sinkron ke Arus Kas</span>
            </button>

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Buka Laporan Keuangan"
                id="btn-open-financial-reports"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-950/40 transition-all hover:scale-[1.02] cursor-pointer"
              id="btn-add-retail-project"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Proyek Retail</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5" id="retail-stats-overview">
        {/* Card 1: Total Kontrak Retail */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Nilai Kontrak Total</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-slate-900 font-mono">
              {formatIDR(stats.totalContractValue)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {stats.totalProjects} Kontrak ({stats.activeProjectsCount} Aktif)
            </div>
          </div>
        </div>

        {/* Card 2: Total Tertagih */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Invoice Diterbitkan</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-indigo-700 font-mono">
              {formatIDR(stats.totalBilled)}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              Tercatat pada Piutang Usaha
            </div>
          </div>
        </div>

        {/* Card 3: Kas Bersih Diterima */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Kas Masuk Rekening</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-emerald-700 font-mono">
              {formatIDR(stats.totalReceived)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Sudah masuk Buku Kas
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Piutang / Belum Lunas */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Sisa Piutang Belum Cair</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-amber-700 font-mono">
              {formatIDR(stats.totalOutstanding)}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              Menunggu termin berikutnya
            </div>
          </div>
        </div>

        {/* Card 5: PPN Keluaran (11%) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">PPN Keluaran (11%)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-blue-700 font-mono">
              {formatIDR(stats.totalPpn)}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">
              Kewajiban SPT Masa PPN
            </div>
          </div>
        </div>

        {/* Card 6: Kredit PPh 23 Terpotong */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Kredit PPh 23 (2%)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-black text-purple-700 font-mono">
              {formatIDR(stats.totalPph23)}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">
              Bukti Potong PPh Badan
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Klien, SPK, NPWP, atau Proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            id="input-search-retail-projects"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Service Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
              id="select-retail-category-filter"
            >
              <option value="ALL">Semua Kategori Jasa</option>
              <option value="KONSULTASI_TKDN">Konsultasi TKDN</option>
              <option value="SERTIFIKASI_BMP">Sertifikasi BMP</option>
              <option value="PERIZINAN_LEGAL">Perizinan OSS / Legal</option>
              <option value="AUDIT_INTERNAL">Audit / Pre-Audit LVI</option>
              <option value="PELATIHAN_ISO">Pelatihan / Workshop</option>
              <option value="RETAINER_KONSULTASI">Retainer Bulanan</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {/* Pricing Scheme Filter */}
          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
            id="select-retail-pricing-filter"
          >
            <option value="ALL">Semua Skema Pajak</option>
            <option value="INCLUDE_PPN">Include PPN 11%</option>
            <option value="EXCLUDE_PPN">Exclude PPN 11%</option>
            <option value="NON_PKP">Non-PKP (Bebas PPN)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
            id="select-retail-status-filter"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Aktif Berjalan</option>
            <option value="SELESAI">Selesai (Lunas)</option>
            <option value="DRAFT">Draf Kontrak</option>
            <option value="ON_HOLD">Ditunda / On Hold</option>
            <option value="BATAL">Batal</option>
          </select>

          {(searchQuery || categoryFilter !== 'ALL' || pricingFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setPricingFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Projects List with Expandable Milestones Accordion */}
      <div className="space-y-4" id="retail-projects-container">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Tidak Ada Proyek Retail Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {searchQuery || categoryFilter !== 'ALL'
                ? 'Tidak ada kontrak yang sesuai dengan kriteria pencarian atau filter yang dipilih.'
                : 'Belum ada data kontrak proyek retail B2B / swasta. Mulai daftarkan kontrak baru untuk mengintegrasikannya dengan kas, piutang, dan pajak.'}
            </p>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Daftarkan Proyek Retail Pertama</span>
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = !!expandedProjectIds[project.id];
            const progressPercent = project.totalContractValueIDR > 0
              ? Math.min(100, Math.round((project.totalReceivedAmountIDR / project.totalContractValueIDR) * 100))
              : 0;

            const billedPercent = project.totalContractValueIDR > 0
              ? Math.min(100, Math.round((project.totalBilledAmountIDR / project.totalContractValueIDR) * 100))
              : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-teal-300"
                id={`retail-project-card-${project.id}`}
              >
                {/* Project Header Row */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleProjectExpand(project.id)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors mt-0.5 cursor-pointer"
                      title={isExpanded ? 'Tutup Detail Termin' : 'Buka Detail Termin'}
                      id={`btn-toggle-expand-${project.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-teal-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md font-mono">
                          {project.id}
                        </span>

                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md">
                          {SERVICE_CATEGORY_LABELS[project.serviceCategory] || project.serviceCategory}
                        </span>

                        {project.pricingType === 'INCLUDE_PPN' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-md">
                            Inc. PPN 11%
                          </span>
                        ) : project.pricingType === 'EXCLUDE_PPN' ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md">
                            Exc. PPN 11%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                            Non-PKP
                          </span>
                        )}

                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          project.status === 'AKTIF'
                            ? 'bg-emerald-100 text-emerald-800'
                            : project.status === 'SELESAI'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'ON_HOLD'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        {project.projectName}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {project.clientName}
                        </span>
                        {project.contractNumber && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            No: {project.contractNumber}
                          </span>
                        )}
                        {project.clientPicName && (
                          <span className="text-slate-500">
                            PIC: {project.clientPicName} {project.clientPicPhone ? `(${project.clientPicPhone})` : ''}
                          </span>
                        )}
                        {project.clientNpwp && (
                          <span className="font-mono text-[11px] text-slate-500">
                            NPWP: {project.clientNpwp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 flex-wrap">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Nilai Kontrak</div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {formatIDR(project.totalContractValueIDR)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Kas Masuk: <span className="text-emerald-600 font-bold font-mono">{formatIDR(project.totalReceivedAmountIDR)}</span>
                      </div>
                    </div>

                    <div className="w-28 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                        <span>Pencairan</span>
                        <span className="font-bold text-teal-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kontrak Proyek"
                        id={`btn-edit-project-${project.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus kontrak retail "${project.projectName}" (${project.clientName})? Seluruh data termin akan dihapus dari sistem.`)) {
                            deleteRetailProject(project.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kontrak"
                        id={`btn-delete-project-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestones / Termin Table (Expanded) */}
                {isExpanded && (
                  <div className="p-5 bg-white space-y-4" id={`milestones-section-${project.id}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Jadwal Termin Pembayaran ({project.milestones.length} Termin)
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          | Skema: {PAYMENT_SCHEME_LABELS[project.paymentScheme] || project.paymentScheme}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveProjectIdForMilestone(project.id);
                          const currentTotalPct = project.milestones.reduce((acc, m) => acc + (m.percentage || 0), 0);
                          const remPct = Math.max(0, 100 - currentTotalPct);
                          const remGross = Math.round((project.totalContractValueIDR * remPct) / 100);

                          setMilestoneForm({
                            title: `Termin ${project.milestones.length + 1}`,
                            percentage: remPct || 20,
                            grossAmountIDR: remGross || 0,
                            targetDate: new Date().toISOString().slice(0, 10),
                            notes: '',
                          });
                          setIsAddMilestoneModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        id={`btn-add-milestone-${project.id}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Termin Baru</span>
                      </button>
                    </div>

                    {/* Table of Milestones */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Termin & Uraian</th>
                            <th className="py-2.5 px-3 text-right">Persentase</th>
                            <th className="py-2.5 px-3 text-right">Nilai Bruto</th>
                            <th className="py-2.5 px-3 text-right">DPP & PPN 11%</th>
                            <th className="py-2.5 px-3 text-right">PPh 23 (2%)</th>
                            <th className="py-2.5 px-3 text-right text-emerald-800">Kas Bersih</th>
                            <th className="py-2.5 px-3">Status Termin</th>
                            <th className="py-2.5 px-3">No. Invoice / Faktur</th>
                            <th className="py-2.5 px-3 text-center">Aksi / Integrasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {project.milestones.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-6 text-center text-slate-400">
                                Belum ada termin pembayaran untuk kontrak ini. Klik &quot;Tambah Termin Baru&quot;.
                              </td>
                            </tr>
                          ) : (
                            project.milestones.map((milestone) => {
                              const isPaid = milestone.status === 'LUNAS';
                              const isBilled = milestone.status === 'INVOICE_TERBIT';
                              const isUnbilled = milestone.status === 'BELUM_DITAGIH';

                              return (
                                <tr
                                  key={milestone.id}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    isPaid ? 'bg-emerald-50/30' : isBilled ? 'bg-indigo-50/20' : ''
                                  }`}
                                  id={`milestone-row-${milestone.id}`}
                                >
                                  {/* Termin & Title */}
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                                        {milestone.termNumber}
                                      </span>
                                      <span>{milestone.title}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Jatuh tempo: {milestone.targetDate || '-'}
                                    </div>
                                  </td>

                                  {/* Percentage */}
                                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                                    {milestone.percentage}%
                                  </td>

                                  {/* Gross */}
                                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatIDR(milestone.grossAmountIDR)}
                                  </td>

                                  {/* DPP & PPN */}
                                  <td className="py-3 px-3 text-right font-mono">
                                    <div className="text-slate-800 font-medium">
                                      DPP: {formatIDR(milestone.dppAmountIDR)}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-semibold">
                                      PPN: {formatIDR(milestone.ppnAmountIDR)}
                                    </div>
                                  </td>

                                  {/* PPh 23 */}
                                  <td className="py-3 px-3 text-right font-mono text-purple-700 font-medium">
                                    -{formatIDR(milestone.pphAmountIDR)}
                                  </td>

                                  {/* Net Disbursement Cash */}
                                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/20">
                                    {formatIDR(milestone.netDisbursementIDR)}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-3">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        LUNAS (KAS MASUK)
                                      </span>
                                    ) : isBilled ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                                        <Receipt className="w-3 h-3 text-indigo-600" />
                                        INVOICE TERBIT
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        BELUM DITAGIH
                                      </span>
                                    )}
                                  </td>

                                  {/* Invoice Details */}
                                  <td className="py-3 px-3 font-mono text-[11px]">
                                    {milestone.invoiceNumber ? (
                                      <div>
                                        <div className="text-slate-800 font-bold">{milestone.invoiceNumber}</div>
                                        {milestone.fakturPajakNumber && (
                                          <div className="text-[10px] text-teal-700">
                                            FP: {milestone.fakturPajakNumber}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">-</span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      {isUnbilled && (
                                        <button
                                          onClick={() => handleOpenInvoiceModal(project, milestone)}
                                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                          title="Terbitkan Invoice & Catat ke Buku Piutang Usaha"
                                          id={`btn-generate-invoice-${milestone.id}`}
                                        >
                                          <Receipt className="w-3.5 h-3.5" />
                                          <span>Terbitkan Invoice</span>
                                        </button>
                                      )}

                                      {isBilled && (
                                        <button
                                          onClick={() => handleOpenPaymentModal(project, milestone)}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                          title="Catat Pembayaran Masuk ke Buku Kas & Laporan Keuangan"
                                          id={`btn-record-payment-${milestone.id}`}
                                        >
                                          <DollarSign className="w-3.5 h-3.5" />
                                          <span>Catat Kas Masuk</span>
                                        </button>
                                      )}

                                      {isPaid && (
                                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                          <Check className="w-3.5 h-3.5" />
                                          <span>{milestone.paymentDate || 'Selesai'}</span>
                                        </div>
                                      )}

                                      <button
                                        onClick={() => {
                                          if (confirm(`Hapus ${milestone.title}?`)) {
                                            deleteRetailMilestone(project.id, milestone.id);
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                        title="Hapus Termin"
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: Tambah / Edit Proyek Retail                                   */}
      {/* ===================================================================== */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
                  <Briefcase className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProject ? 'Edit Kontrak Proyek Retail' : 'Tambah Kontrak Proyek Retail Baru'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Pendaftaran SPK/PO Proyek Swasta & B2B dengan integrasi Piutang, Pajak & Kas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formEl = e.currentTarget;
                const fd = new FormData(formEl);

                const projectName = fd.get('projectName') as string;
                const clientName = fd.get('clientName') as string;
                const clientPicName = fd.get('clientPicName') as string;
                const clientPicPhone = fd.get('clientPicPhone') as string;
                const clientNpwp = fd.get('clientNpwp') as string;
                const contractNumber = fd.get('contractNumber') as string;
                const contractDate = fd.get('contractDate') as string;
                const serviceCategory = fd.get('serviceCategory') as RetailServiceCategory;
                const pricingType = fd.get('pricingType') as RetailPricingType;
                const pphType = fd.get('pphType') as RetailPphType;
                const paymentScheme = fd.get('paymentScheme') as RetailPaymentScheme;
                const totalContractValueIDR = Number(fd.get('totalContractValueIDR')) || 0;
                const invoicePaymentTermDays = Number(fd.get('invoicePaymentTermDays')) || 14;
                const targetCompletionDate = fd.get('targetCompletionDate') as string;
                const notes = fd.get('notes') as string;

                if (!projectName || !clientName || totalContractValueIDR <= 0) {
                  alert('Mohon lengkapi Nama Proyek, Nama Klien, dan Nilai Kontrak!');
                  return;
                }

                if (editingProject) {
                  updateRetailProject(editingProject.id, {
                    projectName,
                    clientName,
                    clientPicName,
                    clientPicPhone,
                    clientNpwp,
                    contractNumber,
                    contractDate,
                    serviceCategory,
                    pricingType,
                    pphType,
                    paymentScheme,
                    totalContractValueIDR,
                    invoicePaymentTermDays,
                    targetCompletionDate,
                    notes,
                  });
                  alert('Kontrak proyek retail berhasil diperbarui.');
                } else {
                  // Auto generate initial milestones based on paymentScheme
                  let milestones: Omit<RetailMilestone, 'id' | 'projectId' | 'createdAt'>[] = [];
                  const nowStr = new Date().toISOString().slice(0, 10);

                  if (paymentScheme === 'LUNAS_DIMUKA') {
                    milestones = [
                      {
                        termNumber: 1,
                        title: 'Pembayaran Lunas Dimuka (100% DP)',
                        percentage: 100,
                        grossAmountIDR: totalContractValueIDR,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(totalContractValueIDR / 1.11) : totalContractValueIDR,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(totalContractValueIDR - totalContractValueIDR / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(totalContractValueIDR * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(totalContractValueIDR / 1.11) : totalContractValueIDR) * 0.02) : 0,
                        netDisbursementIDR: totalContractValueIDR,
                        targetDate: nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                    ];
                  } else if (paymentScheme === 'TERMIN_2') {
                    const dp = Math.round(totalContractValueIDR * 0.5);
                    const pelunasan = totalContractValueIDR - dp;
                    milestones = [
                      {
                        termNumber: 1,
                        title: 'Termin 1 (Uang Muka 50% SPK)',
                        percentage: 50,
                        grossAmountIDR: dp,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(dp / 1.11) : dp,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(dp - dp / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(dp * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(dp / 1.11) : dp) * 0.02) : 0,
                        netDisbursementIDR: dp,
                        targetDate: nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                      {
                        termNumber: 2,
                        title: 'Termin 2 (Pelunasan 50% BAST & Sertifikat)',
                        percentage: 50,
                        grossAmountIDR: pelunasan,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(pelunasan / 1.11) : pelunasan,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(pelunasan - pelunasan / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(pelunasan * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(pelunasan / 1.11) : pelunasan) * 0.02) : 0,
                        netDisbursementIDR: pelunasan,
                        targetDate: targetCompletionDate || nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                    ];
                  } else {
                    // Default TERMIN_3 (30% - 40% - 30%)
                    const t1 = Math.round(totalContractValueIDR * 0.3);
                    const t2 = Math.round(totalContractValueIDR * 0.4);
                    const t3 = totalContractValueIDR - t1 - t2;
                    milestones = [
                      {
                        termNumber: 1,
                        title: 'Termin 1 (Uang Muka 30% SPK)',
                        percentage: 30,
                        grossAmountIDR: t1,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t1 / 1.11) : t1,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t1 - t1 / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(t1 * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(t1 / 1.11) : t1) * 0.02) : 0,
                        netDisbursementIDR: t1,
                        targetDate: nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                      {
                        termNumber: 2,
                        title: 'Termin 2 (Progress 40% Audit LVI Selesai)',
                        percentage: 40,
                        grossAmountIDR: t2,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t2 / 1.11) : t2,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t2 - t2 / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(t2 * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(t2 / 1.11) : t2) * 0.02) : 0,
                        netDisbursementIDR: t2,
                        targetDate: nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                      {
                        termNumber: 3,
                        title: 'Termin 3 (Pelunasan 30% Penerbitan Sertifikat TKDN)',
                        percentage: 30,
                        grossAmountIDR: t3,
                        dppAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t3 / 1.11) : t3,
                        ppnAmountIDR: pricingType === 'INCLUDE_PPN' ? Math.round(t3 - t3 / 1.11) : pricingType === 'EXCLUDE_PPN' ? Math.round(t3 * 0.11) : 0,
                        pphAmountIDR: pphType === 'PPH_23' ? Math.round((pricingType === 'INCLUDE_PPN' ? Math.round(t3 / 1.11) : t3) * 0.02) : 0,
                        netDisbursementIDR: t3,
                        targetDate: targetCompletionDate || nowStr,
                        status: 'BELUM_DITAGIH',
                      },
                    ];
                  }

                  const res = addRetailProject({
                    projectName,
                    clientName,
                    clientPicName,
                    clientPicPhone,
                    clientNpwp,
                    contractNumber,
                    contractDate,
                    serviceCategory,
                    pricingType,
                    pphType,
                    paymentScheme,
                    totalContractValueIDR,
                    invoicePaymentTermDays,
                    targetCompletionDate,
                    status: 'AKTIF',
                    milestones: milestones as any,
                    notes,
                  });

                  alert(res.message || 'Kontrak proyek retail berhasil didaftarkan!');
                }

                setIsProjectModalOpen(false);
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Field 1: Project Name & Client Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Proyek / Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    required
                    defaultValue={editingProject?.projectName || ''}
                    placeholder="Contoh: Sertifikasi TKDN Panel Distribusi Listrik"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Klien / Perusahaan Swasta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    required
                    defaultValue={editingProject?.clientName || ''}
                    placeholder="Contoh: PT Prima Solusi Elektrik"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Kategori Jasa & Skema Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Layanan Jasa
                  </label>
                  <select
                    name="serviceCategory"
                    defaultValue={editingProject?.serviceCategory || 'KONSULTASI_TKDN'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="KONSULTASI_TKDN">Pendampingan Sertifikasi TKDN</option>
                    <option value="SERTIFIKASI_BMP">Bobot Manfaat Perusahaan (BMP)</option>
                    <option value="PERIZINAN_LEGAL">Perizinan OSS & Legalitas</option>
                    <option value="AUDIT_INTERNAL">Audit / Pre-Audit Verifikasi LVI</option>
                    <option value="PELATIHAN_ISO">Pelatihan / Workshop ISO / TKDN</option>
                    <option value="RETAINER_KONSULTASI">Retainer Bulanan Kepatuhan</option>
                    <option value="LAINNYA">Layanan Retail Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skema Jadwal Termin
                  </label>
                  <select
                    name="paymentScheme"
                    defaultValue={editingProject?.paymentScheme || 'TERMIN_3'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="TERMIN_3">3 Termin (30% DP - 40% Audit - 30% BAST)</option>
                    <option value="TERMIN_2">2 Termin (50% DP - 50% Pelunasan)</option>
                    <option value="LUNAS_DIMUKA">Lunas Dimuka (100% DP)</option>
                    <option value="RETAINER_BULANAN">Retainer Bulanan Berkala</option>
                    <option value="TERMIN_CUSTOM">Kustom Fleksibel</option>
                  </select>
                </div>
              </div>

              {/* Field 3: Nilai Kontrak, Pajak PPN & PPh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Nilai Kontrak (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalContractValueIDR"
                    required
                    min={1}
                    defaultValue={editingProject?.totalContractValueIDR || 50000000}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skema PPN
                  </label>
                  <select
                    name="pricingType"
                    defaultValue={editingProject?.pricingType || 'INCLUDE_PPN'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white font-semibold"
                  >
                    <option value="INCLUDE_PPN">Include PPN 11%</option>
                    <option value="EXCLUDE_PPN">Exclude PPN 11%</option>
                    <option value="NON_PKP">Non-PKP (Bebas PPN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Potongan PPh Klien
                  </label>
                  <select
                    name="pphType"
                    defaultValue={editingProject?.pphType || 'PPH_23'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white font-semibold"
                  >
                    <option value="PPH_23">PPh 23 Jasa (2%)</option>
                    <option value="PPH_FINAL_UMKM">PPh Final UMKM (0.5%)</option>
                    <option value="NON_PPH">Tanpa Potongan PPh (0%)</option>
                  </select>
                </div>
              </div>

              {/* Field 4: Kontrak, Tanggal & TOP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Kontrak / SPK / PO
                  </label>
                  <input
                    type="text"
                    name="contractNumber"
                    defaultValue={editingProject?.contractNumber || ''}
                    placeholder="Contoh: SPK/RET/2026/044"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal SPK
                  </label>
                  <input
                    type="date"
                    name="contractDate"
                    defaultValue={editingProject?.contractDate || new Date().toISOString().slice(0, 10)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Selesai Pekerjaan
                  </label>
                  <input
                    type="date"
                    name="targetCompletionDate"
                    defaultValue={editingProject?.targetCompletionDate || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Field 5: PIC & NPWP Klien */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama PIC Klien
                  </label>
                  <input
                    type="text"
                    name="clientPicName"
                    defaultValue={editingProject?.clientPicName || ''}
                    placeholder="Contoh: Bpk. Ahmad Fauzi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. HP / WA PIC
                  </label>
                  <input
                    type="text"
                    name="clientPicPhone"
                    defaultValue={editingProject?.clientPicPhone || ''}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPWP Klien (Untuk e-Faktur)
                  </label>
                  <input
                    type="text"
                    name="clientNpwp"
                    defaultValue={editingProject?.clientNpwp || ''}
                    placeholder="Contoh: 01.234.567.8-012.000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Field 6: Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan & Ruang Lingkup
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingProject?.notes || ''}
                  placeholder="Catatan kontrak, kesepakatan pembayaran, atau nomor dokumen penawaran..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-950/20 transition-all cursor-pointer"
                >
                  {editingProject ? 'Simpan Perubahan' : 'Daftarkan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Terbitkan Invoice & Catat ke Piutang & Pajak                 */}
      {/* ===================================================================== */}
      {isInvoiceModalOpen && selectedMilestoneForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                  <Receipt className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Terbitkan Invoice & Catat Piutang
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Otomatis sinkron ke Modul Piutang Usaha dan SPT Masa Pajak PPN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4">
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                <div className="font-bold text-indigo-900">
                  {selectedMilestoneForInvoice.project.clientName}
                </div>
                <div className="text-slate-600">
                  Pekerjaan: {selectedMilestoneForInvoice.project.projectName}
                </div>
                <div className="text-slate-600 font-mono">
                  Tagihan: {selectedMilestoneForInvoice.milestone.title} ({selectedMilestoneForInvoice.milestone.percentage}%)
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 font-mono">
                  <span className="text-slate-700">Nominal Tagihan:</span>
                  <span className="font-black text-indigo-800 text-sm">
                    {formatIDR(
                      selectedMilestoneForInvoice.milestone.pricingType === 'EXCLUDE_PPN'
                        ? selectedMilestoneForInvoice.milestone.grossAmountIDR + selectedMilestoneForInvoice.milestone.ppnAmountIDR
                        : selectedMilestoneForInvoice.milestone.grossAmountIDR
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Invoice Komersial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  id="input-invoice-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Terbit Invoice
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Faktur Pajak PPN (e-Faktur 010.xxx)
                </label>
                <input
                  type="text"
                  value={invoiceForm.fakturPajakNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, fakturPajakNumber: e.target.value })}
                  placeholder="Contoh: 010.002-26.89123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Opsional. Masukkan jika faktur pajak elektronik sudah di-generate dari DJP Online.
                </p>
              </div>

              {selectedMilestoneForInvoice.milestone.ppnAmountIDR > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <input
                    type="checkbox"
                    id="chk-sync-ppn"
                    checked={invoiceForm.syncPpnObligation}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, syncPpnObligation: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="chk-sync-ppn" className="text-xs text-blue-900 font-medium cursor-pointer">
                    Otomatis catat <strong>PPN Keluaran 11% ({formatIDR(selectedMilestoneForInvoice.milestone.ppnAmountIDR)})</strong> ke Modul Pajak
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Invoice
                </label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 transition-all cursor-pointer"
                  id="btn-submit-generate-invoice"
                >
                  Terbitkan Invoice Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: Catat Pembayaran Masuk (Kas & Bank + PPh 23)                 */}
      {/* ===================================================================== */}
      {isPaymentModalOpen && selectedMilestoneForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <DollarSign className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Catat Pembayaran Masuk Rekening
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Otomatis masuk ke Buku Kas (Inflow), melunasi Piutang & mencatat Kredit PPh 23
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="font-bold text-emerald-950">
                  {selectedMilestoneForPayment.project.clientName}
                </div>
                <div className="text-slate-600">
                  {selectedMilestoneForPayment.milestone.title} ({selectedMilestoneForPayment.milestone.percentage}%)
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-emerald-200 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Nilai Bruto / DPP:</span>
                    <div className="font-bold text-slate-800">{formatIDR(selectedMilestoneForPayment.milestone.grossAmountIDR)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Potongan PPh 23 (2%):</span>
                    <div className="font-bold text-purple-700">-{formatIDR(selectedMilestoneForPayment.milestone.pphAmountIDR)}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Kas Bersih Diterima (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={paymentForm.amountReceivedIDR}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountReceivedIDR: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  id="input-payment-amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Masuk Kas
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Akun Rekening Penerima
                  </label>
                  <select
                    value={paymentForm.paymentChannelId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentChannelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold"
                  >
                    {paymentChannels && paymentChannels.length > 0 ? (
                      paymentChannels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name} ({channel.accountNumber || channel.type})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="BANK_MANDIRI">Bank Mandiri Giro Operasional</option>
                        <option value="BANK_BCA">Bank BCA Bisnis</option>
                        <option value="KAS_TUNAI">Kas Tunai Kantor</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Ref Transfer Bank
                  </label>
                  <input
                    type="text"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    placeholder="Contoh: TRF-BCA-9921"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Bukti Potong PPh 23
                  </label>
                  <input
                    type="text"
                    value={paymentForm.bupotPphNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bupotPphNumber: e.target.value })}
                    placeholder="Contoh: BP-23-2026-0091"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                  <input
                    type="checkbox"
                    id="chk-sync-cash"
                    checked={paymentForm.syncToCashLedger}
                    onChange={(e) => setPaymentForm({ ...paymentForm, syncToCashLedger: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="chk-sync-cash" className="text-xs text-emerald-950 font-medium cursor-pointer">
                    Posting kas masuk ke <strong>Buku Kas & Daily Cash Flow (Inflow)</strong>
                  </label>
                </div>

                {selectedMilestoneForPayment.milestone.pphAmountIDR > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-purple-50/50 rounded-xl border border-purple-200/60">
                    <input
                      type="checkbox"
                      id="chk-sync-pph"
                      checked={paymentForm.syncToTaxObligations}
                      onChange={(e) => setPaymentForm({ ...paymentForm, syncToTaxObligations: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="chk-sync-pph" className="text-xs text-purple-950 font-medium cursor-pointer">
                      Catat bukti potong PPh 23 ({formatIDR(selectedMilestoneForPayment.milestone.pphAmountIDR)}) ke <strong>Kredit Pajak SPT Badan</strong>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
                  id="btn-submit-record-payment"
                >
                  Konfirmasi Kas Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: Tambah Custom Milestone / Termin Baru                        */}
      {/* ===================================================================== */}
      {isAddMilestoneModalOpen && activeProjectIdForMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />
                Tambah Termin Pembayaran Baru
              </h3>
              <button
                onClick={() => setIsAddMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const project = retailProjects.find((p) => p.id === activeProjectIdForMilestone);
                if (!project) return;

                const res = addRetailMilestone(project.id, {
                  termNumber: project.milestones.length + 1,
                  title: milestoneForm.title,
                  percentage: milestoneForm.percentage,
                  grossAmountIDR: milestoneForm.grossAmountIDR,
                  targetDate: milestoneForm.targetDate,
                  status: 'BELUM_DITAGIH',
                  notes: milestoneForm.notes,
                });

                if (res.success) {
                  alert('Termin baru berhasil ditambahkan!');
                  setIsAddMilestoneModalOpen(false);
                } else {
                  alert(res.message || 'Gagal menambahkan termin.');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian / Nama Termin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  placeholder="Contoh: Termin 3 (Penerbitan Laporan Akhir & BAST)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Persentase (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={milestoneForm.percentage}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      const project = retailProjects.find((p) => p.id === activeProjectIdForMilestone);
                      const gross = project ? Math.round((project.totalContractValueIDR * pct) / 100) : 0;
                      setMilestoneForm({ ...milestoneForm, percentage: pct, grossAmountIDR: gross });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Bruto (Rp)
                  </label>
                  <input
                    type="number"
                    value={milestoneForm.grossAmountIDR}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, grossAmountIDR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Termin
                </label>
                <textarea
                  rows={2}
                  value={milestoneForm.notes}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                  placeholder="Keterangan prasyarat termin..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Termin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
