import React, { useState, useMemo } from 'react';
import {
  FileText,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Tag,
  Hash,
  Layers,
  ChevronRight,
  Info,
  Users,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { TaxObligation, TaxType, TaxObligationStatus } from '../../types';
import { TAX_TYPE_CONFIGS, calculateTaxObligationAmount, getTaxTypeBadge } from '../../utils/taxCalculations';
import { formatRupiah } from '../../utils/formatters';

interface TaxManagementProps {
  onOpenLedgerWithFilter?: (category: string) => void;
}

export const TaxManagement: React.FC<TaxManagementProps> = ({ onOpenLedgerWithFilter }) => {
  const {
    taxObligations,
    addTaxObligation,
    updateTaxObligation,
    deleteTaxObligation,
    payTaxObligation,
    resetTaxObligationsToDefault,
    projects,
    paymentChannels,
    isMasterAdmin,
    currentUser,
  } = useProjects();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaxType, setSelectedTaxType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxObligation | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingTax, setPayingTax] = useState<TaxObligation | null>(null);

  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [calcType, setCalcType] = useState<TaxType>('PPN');
  const [calcDpp, setCalcDpp] = useState<number>(100000000);
  const [calcRate, setCalcRate] = useState<number>(11);
  const [calcPpnOutput, setCalcPpnOutput] = useState<number>(11000000);
  const [calcPpnInput, setCalcPpnInput] = useState<number>(0);

  // Notification / Toast
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    taxType: TaxType;
    taxPeriod: string;
    taxYear: number;
    taxMonth: number;
    title: string;
    description: string;
    taxableBaseAmount: number;
    taxRatePercent: number;
    ppnOutputAmount: number;
    ppnInputAmount: number;
    taxAmount: number;
    dueDate: string;
    billingCode: string;
    taxInvoiceNumber: string;
    projectId: string;
    counterpartyName: string;
    notes: string;
  }>({
    taxType: 'PPN',
    taxPeriod: `Masa ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
    taxYear: new Date().getFullYear(),
    taxMonth: new Date().getMonth() + 1,
    title: '',
    description: '',
    taxableBaseAmount: 100000000,
    taxRatePercent: 11,
    ppnOutputAmount: 11000000,
    ppnInputAmount: 0,
    taxAmount: 11000000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    billingCode: '',
    taxInvoiceNumber: '',
    projectId: '',
    counterpartyName: '',
    notes: '',
  });

  // Payment Form State
  const [payFormData, setPayFormData] = useState<{
    ntpnNumber: string;
    billingCode: string;
    paymentChannelId: string;
    date: string;
    notes: string;
  }>({
    ntpnNumber: '',
    billingCode: '',
    paymentChannelId: paymentChannels[0]?.id || 'BANK_TRANSFER_BRI',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalTaxPayable = 0; // Total Hutang Pajak Terhutang
    let totalPpnPayable = 0; // PPN Terhutang
    let totalPphPayable = 0; // PPh Terhutang (PPh 21, 23, 4(2), Final, Badan)
    let totalPaidTaxes = 0; // Pajak Sudah Disetor
    let pendingCount = 0;
    let overdueCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    taxObligations.forEach((t) => {
      const isUnpaid = t.status !== 'PAID' && (t.remainingAmount > 0 || t.taxAmount > (t.paidAmount || 0));
      const rem = t.remainingAmount !== undefined ? t.remainingAmount : Math.max(0, t.taxAmount - (t.paidAmount || 0));

      if (isUnpaid) {
        totalTaxPayable += rem;
        pendingCount += 1;
        if (t.dueDate && t.dueDate < todayStr) {
          overdueCount += 1;
        }

        if (t.taxType === 'PPN') {
          totalPpnPayable += rem;
        } else {
          totalPphPayable += rem;
        }
      }

      totalPaidTaxes += t.paidAmount || 0;
    });

    return {
      totalTaxPayable,
      totalPpnPayable,
      totalPphPayable,
      totalPaidTaxes,
      pendingCount,
      overdueCount,
      totalRecords: taxObligations.length,
    };
  }, [taxObligations]);

  // Filtered Tax List
  const filteredObligations = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return taxObligations.filter((t) => {
      // Type filter
      if (selectedTaxType !== 'ALL' && t.taxType !== selectedTaxType) return false;

      // Status filter
      if (selectedStatus === 'TERHUTANG') {
        if (t.status === 'PAID' && t.remainingAmount <= 0) return false;
      } else if (selectedStatus === 'PAID') {
        if (t.status !== 'PAID') return false;
      } else if (selectedStatus === 'OVERDUE') {
        if (t.status === 'PAID' || !t.dueDate || t.dueDate >= todayStr) return false;
      }

      // Year filter
      if (selectedYear && t.taxYear && t.taxYear !== selectedYear) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchPeriod = t.taxPeriod?.toLowerCase().includes(q);
        const matchCounterparty = t.counterpartyName?.toLowerCase().includes(q);
        const matchProject = t.projectCode?.toLowerCase().includes(q);
        const matchNtpn = t.ntpnNumber?.toLowerCase().includes(q);
        const matchBilling = t.billingCode?.toLowerCase().includes(q);
        const matchInvoice = t.taxInvoiceNumber?.toLowerCase().includes(q);
        if (!matchTitle && !matchPeriod && !matchCounterparty && !matchProject && !matchNtpn && !matchBilling && !matchInvoice) {
          return false;
        }
      }

      return true;
    });
  }, [taxObligations, selectedTaxType, selectedStatus, selectedYear, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const now = new Date();
    const periodName = `Masa ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    setFormData({
      taxType: 'PPN',
      taxPeriod: periodName,
      taxYear: now.getFullYear(),
      taxMonth: now.getMonth() + 1,
      title: `PPN Kurang Bayar ${periodName}`,
      description: 'PPN 11% atas Faktur Pajak Keluaran Konsultansi TKDN dikurangi Pajak Masukan',
      taxableBaseAmount: 100000000,
      taxRatePercent: 11,
      ppnOutputAmount: 11000000,
      ppnInputAmount: 0,
      taxAmount: 11000000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      billingCode: '',
      taxInvoiceNumber: '',
      projectId: '',
      counterpartyName: 'DJP / KPP Pratama',
      notes: '',
    });
    setEditingTax(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: TaxObligation) => {
    setEditingTax(t);
    setFormData({
      taxType: t.taxType,
      taxPeriod: t.taxPeriod || '',
      taxYear: t.taxYear || new Date().getFullYear(),
      taxMonth: t.taxMonth || new Date().getMonth() + 1,
      title: t.title || '',
      description: t.description || '',
      taxableBaseAmount: t.taxableBaseAmount || 0,
      taxRatePercent: t.taxRatePercent || TAX_TYPE_CONFIGS[t.taxType]?.defaultRate || 11,
      ppnOutputAmount: t.ppnOutputAmount || 0,
      ppnInputAmount: t.ppnInputAmount || 0,
      taxAmount: t.taxAmount || 0,
      dueDate: t.dueDate || '',
      billingCode: t.billingCode || '',
      taxInvoiceNumber: t.taxInvoiceNumber || '',
      projectId: t.projectId || '',
      counterpartyName: t.counterpartyName || '',
      notes: t.notes || '',
    });
    setIsFormModalOpen(true);
  };

  // Dynamic recalculation inside form
  const handleFormTaxTypeChange = (newType: TaxType) => {
    const cfg = TAX_TYPE_CONFIGS[newType] || TAX_TYPE_CONFIGS.OTHER_TAX;
    const defaultRate = cfg.defaultRate;
    const dpp = formData.taxableBaseAmount || 0;

    let newTaxAmount = 0;
    let newOut = 0;
    let newIn = 0;
    let defaultTitle = formData.title;

    if (newType === 'PPN') {
      newOut = Math.round((dpp * defaultRate) / 100);
      newIn = formData.ppnInputAmount || 0;
      newTaxAmount = Math.max(0, newOut - newIn);
      defaultTitle = `PPN Kurang Bayar ${formData.taxPeriod || 'Masa Ini'}`;
    } else {
      newTaxAmount = Math.round((dpp * defaultRate) / 100);
      defaultTitle = `${cfg.shortName} ${formData.taxPeriod || ''}`;
    }

    setFormData((prev) => ({
      ...prev,
      taxType: newType,
      taxRatePercent: defaultRate,
      ppnOutputAmount: newOut,
      taxAmount: newTaxAmount,
      title: defaultTitle,
    }));
  };

  const handleDppOrRateChange = (dppVal: number, rateVal: number, outVal?: number, inVal?: number) => {
    if (formData.taxType === 'PPN') {
      const outputPpn = outVal !== undefined ? outVal : Math.round((dppVal * rateVal) / 100);
      const inputPpn = inVal !== undefined ? inVal : formData.ppnInputAmount || 0;
      const net = Math.max(0, outputPpn - inputPpn);
      setFormData((prev) => ({
        ...prev,
        taxableBaseAmount: dppVal,
        taxRatePercent: rateVal,
        ppnOutputAmount: outputPpn,
        ppnInputAmount: inputPpn,
        taxAmount: net,
      }));
    } else {
      const net = Math.round((dppVal * rateVal) / 100);
      setFormData((prev) => ({
        ...prev,
        taxableBaseAmount: dppVal,
        taxRatePercent: rateVal,
        taxAmount: net,
      }));
    }
  };

  // Save Tax Obligation (Create / Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('error', 'Judul kewajiban pajak tidak boleh kosong.');
      return;
    }

    if (formData.taxAmount <= 0) {
      showToast('error', 'Nominal pajak terhutang harus lebih dari Rp 0.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === formData.projectId);

    if (editingTax) {
      // Update
      const res = updateTaxObligation(editingTax.id, {
        ...formData,
        projectCode: selectedProj ? selectedProj.code : undefined,
      });
      if (res.success) {
        showToast('success', res.message || 'Kewajiban pajak berhasil diperbarui.');
        setIsFormModalOpen(false);
      } else {
        showToast('error', res.message || 'Gagal memperbarui pajak.');
      }
    } else {
      // Create
      const res = addTaxObligation({
        ...formData,
        paidAmount: 0,
        remainingAmount: formData.taxAmount,
        status: 'TERHUTANG',
        projectCode: selectedProj ? selectedProj.code : undefined,
      });
      if (res.success) {
        showToast('success', res.message || 'Kewajiban pajak baru berhasil dicatat.');
        setIsFormModalOpen(false);
      } else {
        showToast('error', res.message || 'Gagal menambahkan pajak.');
      }
    }
  };

  // Open Pay Modal
  const handleOpenPay = (t: TaxObligation) => {
    setPayingTax(t);
    setPayFormData({
      ntpnNumber: t.ntpnNumber || '',
      billingCode: t.billingCode || '',
      paymentChannelId: t.paymentChannelId || paymentChannels[0]?.id || 'BANK_TRANSFER_BRI',
      date: new Date().toISOString().slice(0, 10),
      notes: `Setoran ${t.taxType} ${t.taxPeriod} ke Kas Negara`,
    });
    setIsPayModalOpen(true);
  };

  // Submit Pay Tax Obligation
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTax) return;

    if (!payFormData.ntpnNumber.trim() && !payFormData.billingCode.trim()) {
      showToast('error', 'Mohon lengkapi Nomor NTPN atau Kode Billing DJP sebagai bukti setoran sah.');
      return;
    }

    const res = payTaxObligation(payingTax.id, {
      channelId: payFormData.paymentChannelId,
      date: payFormData.date,
      ntpnNumber: payFormData.ntpnNumber,
      billingCode: payFormData.billingCode,
      notes: payFormData.notes,
    });

    if (res.success) {
      showToast('success', res.message || 'Pajak berhasil disetor dan dicatat ke jurnal kas!');
      setIsPayModalOpen(false);
      setPayingTax(null);
    } else {
      showToast('error', res.message || 'Gagal memproses setoran pajak.');
    }
  };

  // Delete Handler
  const handleDeleteTax = (id: string, title: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kewajiban pajak "${title}"?`)) {
      const res = deleteTaxObligation(id);
      if (res.success) {
        showToast('success', res.message || 'Kewajiban pajak berhasil dihapus.');
      } else {
        showToast('error', res.message || 'Gagal menghapus data.');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredObligations.length === 0) {
      showToast('error', 'Tidak ada data pajak untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'Jenis Pajak',
      'Masa Pajak',
      'Tahun',
      'Judul Kewajiban',
      'DPP (IDR)',
      'Tarif (%)',
      'PPN Keluaran (IDR)',
      'PPN Masukan (IDR)',
      'Nominal Pajak Terhutang (IDR)',
      'Sudah Disetor (IDR)',
      'Sisa Hutang Pajak (IDR)',
      'Status',
      'Jatuh Tempo',
      'Tanggal Setor',
      'NTPN',
      'Kode Billing',
      'No Faktur/Bupot',
      'Klien/Vendor/Instansi',
      'Proyek',
      'Catatan',
    ];

    const rows = filteredObligations.map((t) => [
      `"${t.id}"`,
      `"${t.taxType}"`,
      `"${t.taxPeriod}"`,
      t.taxYear,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.taxableBaseAmount || 0,
      t.taxRatePercent || 0,
      t.ppnOutputAmount || 0,
      t.ppnInputAmount || 0,
      t.taxAmount,
      t.paidAmount || 0,
      t.remainingAmount || 0,
      `"${t.status}"`,
      `"${t.dueDate || '-'}"`,
      `"${t.paidAt || '-'}"`,
      `"${t.ntpnNumber || '-'}"`,
      `"${t.billingCode || '-'}"`,
      `"${t.taxInvoiceNumber || '-'}"`,
      `"${(t.counterpartyName || '').replace(/"/g, '""')}"`,
      `"${t.projectCode || '-'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_Pajak_GAP_Consulting_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Rekapitulasi data pajak berhasil diekspor ke CSV.');
  };

  return (
    <div id="tax-management-root" className="space-y-6">
      {/* Toast Notification */}
      {actionNotice && (
        <div
          id="tax-action-toast"
          className={`p-4 rounded-xl shadow-lg border flex items-center justify-between text-sm transition-all duration-300 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionNotice.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner & Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tax Compliance & Liabilitas Perpajakan DJP
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Pajak PPN & PPh Terhutang (Kewajiban Perpajakan)
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Manajemen komprehensif kewajiban pajak terhutang (PPN 11%, PPh 21, PPh 23, PPh 4(2), PPh Final UMKM, & PPh Badan).
              Terintegrasi langsung ke neraca keuangan (Liabilitas Jangka Pendek) dan pembukuan jurnal kas operasional saat disetor ke kas negara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="tax-btn-calculator"
              onClick={() => setIsCalculatorModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-600/80 transition-all shadow-sm"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              Simulator Pajak
            </button>
            <button
              id="tax-btn-export-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-600/80 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Ekspor CSV
            </button>
            <button
              id="tax-btn-add-obligation"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Catat Pajak Terhutang
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hutang Pajak Terhutang */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Hutang Pajak
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatRupiah(metrics.totalTaxPayable)}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {metrics.pendingCount} kewajiban terhutang
              </span>
              {metrics.overdueCount > 0 && (
                <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  {metrics.overdueCount} jatuh tempo
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            Masuk ke Liabilitas Jangka Pendek Neraca
          </div>
        </div>

        {/* PPN Terhutang */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              PPN 11% Terhutang
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(metrics.totalPpnPayable)}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Selisih Faktur Pajak Keluaran & Masukan
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            SPT Masa PPN (PPN Kurang Bayar)
          </div>
        </div>

        {/* PPh Terhutang (Potput & Final) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              PPh Terhutang (21/23/4.2/Final)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatRupiah(metrics.totalPphPayable)}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              PPh 21 Honor, PPh 23 Surveyor & PPh 4(2)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            Kewajiban Potong Pungut SPT Unifikasi
          </div>
        </div>

        {/* Realisasi Setoran Pajak (Paid) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Realisasi Pajak Disetor
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatRupiah(metrics.totalPaidTaxes)}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Setoran sah dengan Kode NTPN & ID Billing
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            Tercatat di Jurnal Pengeluaran Kas (Beban/Pajak)
          </div>
        </div>
      </div>

      {/* Auto-Sync & Anti-Double Input Status Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Integrasi Pajak Gaji Karyawan (PPh 21) &amp; Laporan Keuangan
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Anti Double-Input Aktif
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Pemotongan PPh 21 dari menu <strong>Pembayaran Gaji Karyawan</strong> otomatis tersinkronisasi sebagai kewajiban pajak di menu ini dan diakui pada Neraca/Laporan Keuangan tanpa perlu input ulang manual.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">PPh 21 Payroll Terhubung:</div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {taxObligations.filter((t) => t.taxType === 'PPH_21' && (t.payrollId || t.payrollNumber)).length} Dokumen Slip
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jenis pajak, masa pajak, judul, NTPN, ID Billing, no faktur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Filter Status */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua ({taxObligations.length})
            </button>
            <button
              onClick={() => setSelectedStatus('TERHUTANG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === 'TERHUTANG'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              Terhutang ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === 'OVERDUE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              Jatuh Tempo ({metrics.overdueCount})
            </button>
            <button
              onClick={() => setSelectedStatus('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              Disetor Lunas ({taxObligations.filter((t) => t.status === 'PAID').length})
            </button>
          </div>
        </div>

        {/* Category Pills & Year filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Jenis Pajak:
            </span>
            {[
              { id: 'ALL', label: 'Semua Pajak' },
              { id: 'PPN', label: 'PPN 11%' },
              { id: 'PPH_21', label: 'PPh 21' },
              { id: 'PPH_23', label: 'PPh 23' },
              { id: 'PPH_4_2', label: 'PPh 4(2)' },
              { id: 'PPH_FINAL_UMKM', label: 'PPh Final 0.5%' },
              { id: 'PPH_25_29', label: 'PPh Badan' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedTaxType(cat.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedTaxType === cat.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Tahun Pajak:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tax Obligations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Daftar Kewajiban & Liabilitas Pajak ({filteredObligations.length} catatan)
            </h2>
          </div>
          {isMasterAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Reset daftar pajak ke data standar sistem?')) {
                  resetTaxObligationsToDefault();
                  showToast('success', 'Data perpajakan telah direset ke default sistem.');
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Default
            </button>
          )}
        </div>

        {filteredObligations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-medium text-slate-900 dark:text-white">Tidak ada data kewajiban pajak</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada catatan pajak yang sesuai dengan filter pencarian saat ini. Klik tombol di bawah untuk mencatat pajak baru.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Catat Kewajiban Pajak Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-4">Status & Masa</th>
                  <th className="py-3.5 px-4">Jenis Pajak</th>
                  <th className="py-3.5 px-4">Rincian & Dokumen</th>
                  <th className="py-3.5 px-4">Dasar Pengenaan (DPP)</th>
                  <th className="py-3.5 px-4 text-right">Pajak Terhutang</th>
                  <th className="py-3.5 px-4">Jatuh Tempo / NTPN</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredObligations.map((t) => {
                  const isPaid = t.status === 'PAID' || (t.remainingAmount <= 0 && t.paidAmount >= t.taxAmount);
                  const isOverdue = !isPaid && t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10);
                  const badge = getTaxTypeBadge(t.taxType);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Status & Masa */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <CheckCircle className="w-3 h-3" />
                              Disetor Sah
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Jatuh Tempo!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              <Clock className="w-3 h-3" />
                              Terhutang
                            </span>
                          )}
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t.taxPeriod || `Masa ${t.taxMonth}/${t.taxYear}`}
                          </div>
                        </div>
                      </td>

                      {/* Jenis Pajak */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                              t.taxType === 'PPN'
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                                : t.taxType === 'PPH_23'
                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                                : t.taxType === 'PPH_21'
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                : t.taxType === 'PPH_4_2'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {badge.label}
                          </span>
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Tarif: {t.taxRatePercent || badge.group}%
                          </div>
                        </div>
                      </td>

                      {/* Rincian & Dokumen */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">
                            {t.title}
                          </div>
                          {t.description && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {t.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            {t.payrollNumber && (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <Users className="w-3 h-3 text-emerald-600" />
                                Slip Payroll: {t.payrollNumber}
                              </span>
                            )}
                            {t.taxInvoiceNumber && (
                              <span className="inline-flex items-center gap-1 font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                <FileText className="w-3 h-3" />
                                {t.taxInvoiceNumber}
                              </span>
                            )}
                            {t.counterpartyName && (
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                Lawan: {t.counterpartyName}
                              </span>
                            )}
                            {t.projectCode && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                Proyek: {t.projectCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DPP */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatRupiah(t.taxableBaseAmount || 0)}
                          </div>
                          {t.taxType === 'PPN' && (t.ppnOutputAmount || t.ppnInputAmount) && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                              <div>Keluaran: {formatRupiah(t.ppnOutputAmount || 0)}</div>
                              <div>Masukan: {formatRupiah(t.ppnInputAmount || 0)}</div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Pajak Terhutang */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="space-y-1">
                          <div
                            className={`font-bold text-base tracking-wide ${
                              isPaid ? 'text-slate-400 line-through' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatRupiah(t.taxAmount)}
                          </div>
                          {isPaid ? (
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Lunas {formatRupiah(t.paidAmount || t.taxAmount)}
                            </div>
                          ) : t.paidAmount && t.paidAmount > 0 ? (
                            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Sisa Hutang: {formatRupiah(t.remainingAmount || t.taxAmount - t.paidAmount)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                              Liabilitas Belum Disetor
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Jatuh Tempo & NTPN */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Jatuh Tempo: {t.dueDate || '-'}</span>
                          </div>
                          {t.billingCode && (
                            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                              ID Billing: <span className="font-bold text-indigo-600 dark:text-indigo-400">{t.billingCode}</span>
                            </div>
                          )}
                          {t.ntpnNumber && (
                            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              NTPN: {t.ntpnNumber}
                            </div>
                          )}
                          {t.paidAt && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Tgl Setor: {t.paidAt}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid ? (
                            <button
                              id={`tax-btn-pay-${t.id}`}
                              onClick={() => handleOpenPay(t)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                              title="Setor Pajak ke Kas Negara & Catat Pengeluaran Kas"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Setor Pajak
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Lunas
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Data Pajak"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteTax(t.id, t.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Hapus Kewajiban Pajak"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT TAX OBLIGATION */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingTax ? 'Edit Kewajiban Pajak' : 'Catat Kewajiban / Hutang Pajak Baru'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kewajiban pajak akan langsung diakui sebagai Liabilitas Pajak Terhutang di Neraca Keuangan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4">
              {/* Jenis Pajak Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wide">
                  Jenis Pajak <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'PPN', label: 'PPN (11%)', sub: 'Pajak Pertambahan Nilai' },
                      { id: 'PPH_23', label: 'PPh 23 (2%)', sub: 'Jasa Surveyor / Konsultan' },
                      { id: 'PPH_21', label: 'PPh 21 (5%)', sub: 'Honor Asesor & Pegawai' },
                      { id: 'PPH_4_2', label: 'PPh 4(2) (10%)', sub: 'Sewa Kantor / Bangunan' },
                      { id: 'PPH_FINAL_UMKM', label: 'PPh Final (0.5%)', sub: 'PP 23/55 Omzet Bruto' },
                      { id: 'PPH_25_29', label: 'PPh Badan (22%)', sub: 'Pasal 25 / 29 Tahunan' },
                    ] as const
                  ).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleFormTaxTypeChange(item.id)}
                      className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                        formData.taxType === item.id
                          ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300 font-bold shadow-md ring-1 ring-emerald-500/50'
                          : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-750 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold text-slate-100">{item.label}</div>
                      <div className={`text-[10px] mt-0.5 ${formData.taxType === item.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Anti-Double Input Warning for PPh 21 */}
                {formData.taxType === 'PPH_21' && (
                  <div className="mt-3 p-3 bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Catatan Anti-Double Input (PPh 21):</div>
                      <div>
                        Pemotongan PPh 21 gaji pegawai sudah terbit secara otomatis setiap kali Anda mencatat pembayaran di menu <strong>Pembayaran Gaji Karyawan</strong>. Gunakan form manual ini khusus untuk pemotongan PPh 21 non-karyawan rutin (misal: honor tim ahli eksternal/narasumber).
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Masa Pajak & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Masa Pajak / Periode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Masa Agustus 2026, Triwulan III, Tahunan 2026"
                    value={formData.taxPeriod}
                    onChange={(e) => setFormData({ ...formData, taxPeriod: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tahun Pajak
                  </label>
                  <input
                    type="number"
                    value={formData.taxYear}
                    onChange={(e) => setFormData({ ...formData, taxYear: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Judul Kewajiban Pajak */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Judul Kewajiban Pajak <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PPN Masa Agustus 2026 (Kurang Bayar Penyerahan JKP TKDN)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* DPP & Perhitungan Pajak */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    Kalkulasi Pajak & DPP
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    Tarif Standar: {formData.taxRatePercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      DPP (Dasar Pengenaan Pajak) Rp <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.taxableBaseAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleDppOrRateChange(val, formData.taxRatePercent);
                      }}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Tarif Pajak (%) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.taxRatePercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleDppOrRateChange(formData.taxableBaseAmount, val);
                      }}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Specific for PPN: Output vs Input */}
                {formData.taxType === 'PPN' && (
                  <div className="pt-2 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-200 mb-1">
                        PPN Keluaran (Faktur Keluaran) Rp
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.ppnOutputAmount}
                        onChange={(e) => {
                          const outVal = Number(e.target.value);
                          handleDppOrRateChange(formData.taxableBaseAmount, formData.taxRatePercent, outVal, formData.ppnInputAmount);
                        }}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-200 mb-1">
                        PPN Masukan (Pajak Masukan Vendor) Rp
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.ppnInputAmount}
                        onChange={(e) => {
                          const inVal = Number(e.target.value);
                          handleDppOrRateChange(formData.taxableBaseAmount, formData.taxRatePercent, formData.ppnOutputAmount, inVal);
                        }}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Calculated Final Payable Amount */}
                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Nominal Pajak Terhutang (Liabilitas):
                  </span>
                  <div className="text-xl font-bold text-rose-400 font-mono tracking-wide">
                    {formatRupiah(formData.taxAmount)}
                  </div>
                </div>
              </div>

              {/* Jatuh Tempo & Dokumen Pendukung */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Jatuh Tempo Pembayaran <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Kode ID Billing (DJP)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 829104829102834"
                    value={formData.billingCode}
                    onChange={(e) => setFormData({ ...formData, billingCode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    No Faktur Pajak / Bupot
                  </label>
                  <input
                    type="text"
                    placeholder="010.002-26.89102834"
                    value={formData.taxInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, taxInvoiceNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Link ke Proyek & Lawan Transaksi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Hubungkan ke Proyek (Opsional)
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="" className="bg-slate-800 text-slate-300">-- Bukan Transaksi Proyek Spesifik --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                        {p.code} - {p.name} ({p.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Lawan Transaksi / KPP Pratama
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT Sucofindo, KPP Pratama Jakarta"
                    value={formData.counterpartyName}
                    onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan pelaporan, lampiran e-Faktur, nomor registrasi Bupot..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all"
                >
                  {editingTax ? 'Simpan Perubahan' : 'Catat Kewajiban Pajak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SETOR PAJAK KE KAS NEGARA (PAY TAX) */}
      {isPayModalOpen && payingTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-700/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Setor Pajak ke Kas Negara
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Otomatis menerbitkan transaksi pengeluaran kas & menghapus hutang pajak di neraca.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Tax Info Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between items-center font-bold text-white">
                <span>{payingTax.title}</span>
                <span className="text-emerald-400 font-mono">
                  {formatRupiah(payingTax.remainingAmount || payingTax.taxAmount)}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex justify-between">
                <span>Jenis: {payingTax.taxType} ({payingTax.taxPeriod})</span>
                <span>DPP: {formatRupiah(payingTax.taxableBaseAmount || 0)}</span>
              </div>
              {payingTax.payrollNumber && (
                <div className="mt-2 pt-2 border-t border-slate-700/80 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/60">
                  <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Pemotongan otomatis dari Slip Gaji: <strong>{payingTax.payrollNumber}</strong> {payingTax.employeeName ? `(${payingTax.employeeName})` : ''}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Nomor Transaksi Penerimaan Negara (NTPN) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8392019485720194 (16 Digit Bukti BPN)"
                  value={payFormData.ntpnNumber}
                  onChange={(e) => setPayFormData({ ...payFormData, ntpnNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-mono font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Kode ID Billing (DJP)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 918273645019283"
                    value={payFormData.billingCode}
                    onChange={(e) => setPayFormData({ ...payFormData, billingCode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-mono font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tanggal Penyetoran <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payFormData.date}
                    onChange={(e) => setPayFormData({ ...payFormData, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Rekening Sumber Dana (Kas / Bank Pengeluaran) <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={payFormData.paymentChannelId}
                  onChange={(e) => setPayFormData({ ...payFormData, paymentChannelId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                      {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''} - {c.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Catatan Penyetoran Pajak
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Disetor melalui Internet Banking Corporate BCA"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all"
                >
                  Konfirmasi Setor Pajak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAX CALCULATOR & SIMULATOR */}
      {isCalculatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-700/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Simulator & Kalkulator Pajak Indonesia
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hitung estimasi tarif PPN 11%, PPh 23 2%, PPh 21, PPh 4(2) & PPh Final.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCalculatorModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Pilih Skema Pajak:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'PPN', label: 'PPN (11%)', rate: 11 },
                      { id: 'PPH_23', label: 'PPh 23 (2%)', rate: 2 },
                      { id: 'PPH_21', label: 'PPh 21 (5%)', rate: 5 },
                      { id: 'PPH_4_2', label: 'PPh 4(2) (10%)', rate: 10 },
                      { id: 'PPH_FINAL_UMKM', label: 'PPh Final (0.5%)', rate: 0.5 },
                      { id: 'PPH_25_29', label: 'PPh Badan (22%)', rate: 22 },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCalcType(item.id);
                        setCalcRate(item.rate);
                        if (item.id === 'PPN') {
                          const outVal = Math.round((calcDpp * item.rate) / 100);
                          setCalcPpnOutput(outVal);
                        }
                      }}
                      className={`p-2 rounded-xl border text-xs font-medium text-center transition-all ${
                        calcType === item.id
                          ? 'border-amber-500 bg-amber-950/70 text-amber-300 font-bold shadow-sm ring-1 ring-amber-500/50'
                          : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-750 hover:border-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Dasar Pengenaan Pajak (DPP / Nilai Transaksi Bruto) Rp:
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000000}
                  value={calcDpp}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCalcDpp(val);
                    if (calcType === 'PPN') {
                      setCalcPpnOutput(Math.round((val * calcRate) / 100));
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-bold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {calcType === 'PPN' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-200 mb-1">
                      PPN Keluaran (11% DPP)
                    </label>
                    <input
                      type="number"
                      value={calcPpnOutput}
                      onChange={(e) => setCalcPpnOutput(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-200 mb-1">
                      PPN Masukan (Kredit Pajak)
                    </label>
                    <input
                      type="number"
                      value={calcPpnInput}
                      onChange={(e) => setCalcPpnInput(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Simulation Result */}
              {(() => {
                const res = calculateTaxObligationAmount({
                  taxType: calcType,
                  taxableBaseAmount: calcDpp,
                  taxRatePercent: calcRate,
                  ppnOutputAmount: calcType === 'PPN' ? calcPpnOutput : undefined,
                  ppnInputAmount: calcType === 'PPN' ? calcPpnInput : undefined,
                });

                return (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/50 to-orange-950/50 border border-amber-800/80 space-y-2">
                    <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                      Hasil Simulasi Perhitungan Pajak:
                    </div>
                    <div className="text-2xl font-black text-amber-200 font-mono">
                      {formatRupiah(res.taxAmount)}
                    </div>
                    <p className="text-xs text-amber-300/90 leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCalculatorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm hover:underline"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = calculateTaxObligationAmount({
                      taxType: calcType,
                      taxableBaseAmount: calcDpp,
                      taxRatePercent: calcRate,
                      ppnOutputAmount: calcType === 'PPN' ? calcPpnOutput : undefined,
                      ppnInputAmount: calcType === 'PPN' ? calcPpnInput : undefined,
                    });

                    const now = new Date();
                    const periodName = `Masa ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

                    setFormData({
                      taxType: calcType,
                      taxPeriod: periodName,
                      taxYear: now.getFullYear(),
                      taxMonth: now.getMonth() + 1,
                      title: `${TAX_TYPE_CONFIGS[calcType].shortName} ${periodName}`,
                      description: res.description,
                      taxableBaseAmount: calcDpp,
                      taxRatePercent: calcRate,
                      ppnOutputAmount: calcType === 'PPN' ? calcPpnOutput : 0,
                      ppnInputAmount: calcType === 'PPN' ? calcPpnInput : 0,
                      taxAmount: res.taxAmount,
                      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                      billingCode: '',
                      taxInvoiceNumber: '',
                      projectId: '',
                      counterpartyName: 'DJP / KPP Pratama',
                      notes: 'Dibuat dari Simulator Pajak',
                    });

                    setIsCalculatorModalOpen(false);
                    setEditingTax(null);
                    setIsFormModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  Gunakan Hasil untuk Catat Pajak Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
