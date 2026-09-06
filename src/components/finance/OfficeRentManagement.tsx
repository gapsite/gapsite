import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
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
  CreditCard,
  Building,
  Check,
  Layers,
  ChevronDown,
  Percent,
  Zap,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { OfficeRentContract, RentMonthlyScheduleItem } from '../../types';
import { generate12MonthRentSchedule } from '../../data/officeRentData';
import { formatIDR } from '../../utils/formatters';

interface OfficeRentManagementProps {
  onOpenReports?: () => void;
}

export const OfficeRentManagement: React.FC<OfficeRentManagementProps> = ({ onOpenReports }) => {
  const {
    officeRentContracts,
    addOfficeRentContract,
    updateOfficeRentContract,
    deleteOfficeRentContract,
    payOfficeRentScheduleItem,
    syncAllOfficeRentToFinance,
    resetOfficeRentContractsToDefault,
    paymentChannels,
  } = useProjects();

  // Selected active contract
  const [selectedContractId, setSelectedContractId] = useState<string>(() => {
    return officeRentContracts[0]?.id || 'rent-contract-2026';
  });

  // Ensure selectedContractId follows when contracts list updates
  useEffect(() => {
    if (officeRentContracts.length > 0 && !officeRentContracts.some((c) => c.id === selectedContractId)) {
      setSelectedContractId(officeRentContracts[0].id);
    }
  }, [officeRentContracts, selectedContractId]);

  // Modal State: Add/Edit Contract
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<OfficeRentContract | null>(null);

  // Modal State: Pay Month Schedule
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<{
    contractId: string;
    schedule: RentMonthlyScheduleItem;
  } | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    paidDate: new Date().toISOString().slice(0, 10),
    paymentChannelId: 'BANK_TRANSFER_BCA',
    referenceNumber: '',
    notes: '',
    syncToLedger: true,
    syncToTax: true,
  });

  // Contract form state
  const [contractForm, setContractForm] = useState({
    contractNumber: '',
    officeName: 'Kantor Pusat Jakarta',
    buildingName: 'Gedung Menara Thamrin',
    address: 'Jl. M.H. Thamrin Kav. 3, Jakarta Pusat',
    landlordName: 'PT Thamrin Graha Propertindo',
    landlordNpwp: '01.345.678.9-021.000',
    landlordBank: 'BCA',
    landlordAccount: '001-9283-7718',
    year: new Date().getFullYear(),
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-12-31`,
    dueDayOfMonth: 5,
    annualBaseRentIDR: 240000000,
    monthlyServiceChargeIDR: 5000000,
    securityDepositIDR: 40000000,
    pph42RatePercent: 10,
    hasPpn: false,
    ppnRatePercent: 11,
    notes: 'Perjanjian sewa ruang kantor tahunan lantai 12',
  });

  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Current active contract with normalized schedules
  const activeContract = useMemo(() => {
    const raw =
      officeRentContracts.find((c) => c.id === selectedContractId) ||
      officeRentContracts[0] ||
      null;
    if (!raw) return null;
    const rawList = (raw.monthlySchedules && raw.monthlySchedules.length > 0)
      ? raw.monthlySchedules
      : (raw.schedules && raw.schedules.length > 0)
        ? raw.schedules
        : [];
    const normalizedList: RentMonthlyScheduleItem[] = rawList.map((item, idx) => ({
      ...item,
      id: item.id || `${raw.id}-m${idx + 1}`,
      monthIndex: item.monthIndex ?? (idx + 1),
      month: item.month ?? item.monthIndex ?? (idx + 1),
    }));
    return {
      ...raw,
      schedules: normalizedList,
      monthlySchedules: normalizedList,
    };
  }, [officeRentContracts, selectedContractId]);

  // Aggregate KPI metrics across active contract
  const metrics = useMemo(() => {
    if (!activeContract) {
      return {
        annualRent: 0,
        monthlyAverage: 0,
        paidTotal: 0,
        remainingTotal: 0,
        accumulatedPph42: 0,
        paidMonthsCount: 0,
      };
    }

    const annualRent = activeContract.annualBaseRentIDR || 0;
    const monthlyAverage = Math.round(annualRent / 12);
    const paidTotal = activeContract.monthlySchedules
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.grossTotalIDR, 0);
    const remainingTotal = activeContract.monthlySchedules
      .filter((s) => s.status !== 'PAID')
      .reduce((sum, s) => sum + s.grossTotalIDR, 0);
    const accumulatedPph42 = activeContract.monthlySchedules.reduce(
      (sum, s) => sum + s.pph42AmountIDR,
      0
    );
    const paidMonthsCount = activeContract.monthlySchedules.filter((s) => s.status === 'PAID').length;

    return {
      annualRent,
      monthlyAverage,
      paidTotal,
      remainingTotal,
      accumulatedPph42,
      paidMonthsCount,
    };
  }, [activeContract]);

  // Handlers
  const handleOpenNewContract = () => {
    setEditingContract(null);
    const currYear = new Date().getFullYear();
    setContractForm({
      contractNumber: `KTR-SEWA-${currYear}-001`,
      officeName: 'Kantor Pusat Jakarta',
      buildingName: 'Gedung Menara Thamrin',
      address: 'Jl. M.H. Thamrin Kav. 3, Jakarta Pusat',
      landlordName: 'PT Graha Landlord Propertindo',
      landlordNpwp: '01.345.678.9-021.000',
      landlordBank: 'BCA',
      landlordAccount: '001-9283-7718',
      year: currYear,
      startDate: `${currYear}-01-01`,
      endDate: `${currYear}-12-31`,
      dueDayOfMonth: 5,
      annualBaseRentIDR: 240000000,
      monthlyServiceChargeIDR: 5000000,
      securityDepositIDR: 40000000,
      pph42RatePercent: 10,
      hasPpn: false,
      ppnRatePercent: 11,
      notes: 'Perjanjian sewa ruang kantor tahunan',
    });
    setIsContractModalOpen(true);
  };

  const handleOpenPayModal = (schedule: RentMonthlyScheduleItem) => {
    const currentActive = activeContract || officeRentContracts[0];
    if (!currentActive) {
      alert('Kontrak sewa tidak ditemukan.');
      return;
    }
    setSelectedScheduleItem({
      contractId: currentActive.id,
      schedule,
    });
    setPaymentForm({
      paidDate: new Date().toISOString().slice(0, 10),
      paymentChannelId: schedule.paymentChannelId || 'BANK_TRANSFER_BCA',
      referenceNumber: `SEWA-${schedule.periodMonthYear}-PAY`,
      notes: `Pembayaran sewa kantor ${schedule.monthName} ${currentActive.year}`,
      syncToLedger: true,
      syncToTax: true,
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleItem) return;

    const contractIdToUse = selectedScheduleItem.contractId || activeContract?.id || officeRentContracts[0]?.id;
    const scheduleIdToUse =
      selectedScheduleItem.schedule.id ||
      selectedScheduleItem.schedule.monthIndex ||
      selectedScheduleItem.schedule.month;

    if (!contractIdToUse || scheduleIdToUse === undefined) {
      alert('Data jadwal termin sewa tidak valid.');
      return;
    }

    const res = payOfficeRentScheduleItem(
      contractIdToUse,
      scheduleIdToUse,
      {
        paidDate: paymentForm.paidDate,
        paymentChannelId: paymentForm.paymentChannelId,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
        syncToLedger: paymentForm.syncToLedger,
        syncToTax: paymentForm.syncToTax,
      }
    );

    setIsPayModalOpen(false);

    if (res && res.success === false) {
      setSyncToast({
        message: res.message || 'Gagal memproses pembayaran sewa kantor.',
        type: 'info',
      });
    } else {
      setSyncToast({
        message: res?.message || `Pembayaran sewa bulan ${selectedScheduleItem.schedule.monthName} berhasil dicatat dan disinkronkan ke Buku Kas & Pajak PPh 4(2)!`,
        type: 'success',
      });
    }
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleQuickPayMonth = (schedule: RentMonthlyScheduleItem) => {
    const currentActive = activeContract || officeRentContracts[0];
    if (!currentActive) return;

    const scheduleIdToUse = schedule.id || schedule.monthIndex || schedule.month;
    if (scheduleIdToUse === undefined) return;

    const res = payOfficeRentScheduleItem(
      currentActive.id,
      scheduleIdToUse,
      {
        paidDate: new Date().toISOString().slice(0, 10),
        paymentChannelId: schedule.paymentChannelId || 'BANK_TRANSFER_BCA',
        referenceNumber: `SEWA-${schedule.periodMonthYear}-QUICK`,
        notes: `Pembayaran cepat sewa kantor bulan ${schedule.monthName} ${currentActive.year}`,
        syncToLedger: true,
        syncToTax: true,
      }
    );

    if (res && res.success === false) {
      setSyncToast({
        message: res.message || 'Gagal memproses pembayaran sewa.',
        type: 'info',
      });
    } else {
      setSyncToast({
        message: res?.message || `Pembayaran sewa ${schedule.monthName} berhasil disetor dan disinkronkan!`,
        type: 'success',
      });
    }
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractForm.annualBaseRentIDR <= 0) {
      alert('Nilai sewa tahunan harus lebih besar dari Rp 0.');
      return;
    }

    const monthlySchedules = generate12MonthRentSchedule(
      contractForm.annualBaseRentIDR,
      contractForm.monthlyServiceChargeIDR,
      contractForm.year,
      contractForm.dueDayOfMonth,
      contractForm.pph42RatePercent,
      contractForm.hasPpn,
      contractForm.ppnRatePercent
    );

    if (editingContract) {
      updateOfficeRentContract(editingContract.id, {
        contractNumber: contractForm.contractNumber,
        officeName: contractForm.officeName,
        buildingName: contractForm.buildingName,
        address: contractForm.address,
        landlordName: contractForm.landlordName,
        landlordNpwp: contractForm.landlordNpwp,
        landlordBank: contractForm.landlordBank,
        landlordAccount: contractForm.landlordAccount,
        year: Number(contractForm.year),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        annualBaseRentIDR: Number(contractForm.annualBaseRentIDR),
        monthlyBaseRentIDR: Math.round(Number(contractForm.annualBaseRentIDR) / 12),
        monthlyServiceChargeIDR: Number(contractForm.monthlyServiceChargeIDR),
        securityDepositIDR: Number(contractForm.securityDepositIDR),
        dueDayOfMonth: Number(contractForm.dueDayOfMonth),
        pph42RatePercent: Number(contractForm.pph42RatePercent),
        hasPpn: contractForm.hasPpn,
        ppnRatePercent: Number(contractForm.ppnRatePercent),
        notes: contractForm.notes,
      });
    } else {
      addOfficeRentContract({
        contractNumber: contractForm.contractNumber || `KTR-SEWA-${contractForm.year}-${Date.now().toString().slice(-3)}`,
        officeName: contractForm.officeName,
        buildingName: contractForm.buildingName,
        address: contractForm.address,
        landlordName: contractForm.landlordName,
        landlordNpwp: contractForm.landlordNpwp,
        landlordBank: contractForm.landlordBank,
        landlordAccount: contractForm.landlordAccount,
        year: Number(contractForm.year),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        annualBaseRentIDR: Number(contractForm.annualBaseRentIDR),
        monthlyBaseRentIDR: Math.round(Number(contractForm.annualBaseRentIDR) / 12),
        monthlyServiceChargeIDR: Number(contractForm.monthlyServiceChargeIDR),
        securityDepositIDR: Number(contractForm.securityDepositIDR),
        dueDayOfMonth: Number(contractForm.dueDayOfMonth),
        pph42RatePercent: Number(contractForm.pph42RatePercent),
        hasPpn: contractForm.hasPpn,
        ppnRatePercent: Number(contractForm.ppnRatePercent),
        status: 'ACTIVE',
        notes: contractForm.notes,
        monthlySchedules: monthlySchedules,
      });
    }

    setIsContractModalOpen(false);
  };

  const handleDeleteContract = (id: string, name: string) => {
    if (confirm(`Hapus kontrak sewa kantor "${name}" secara permanen? Seluruh jadwal 12 bulan dan histori akan dihapus.`)) {
      deleteOfficeRentContract(id);
    }
  };

  const handleSyncToFinance = () => {
    const result = syncAllOfficeRentToFinance();
    const msg =
      result.createdTransactionsCount > 0 || result.createdTaxObligationsCount > 0
        ? `Berhasil disinkronkan! ${result.createdTransactionsCount} transaksi beban sewa dicatat ke Buku Kas & ${result.createdTaxObligationsCount} kewajiban PPh 4(2) dicatat.`
        : 'Seluruh jadwal sewa berstatus PAID sudah tersinkronisasi penuh dengan Buku Kas & Modul Pajak.';

    setSyncToast({ message: msg, type: 'success' });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleExportCSV = () => {
    if (!activeContract) return;

    const headers = [
      'Bulan',
      'Periode',
      'Jatuh Tempo',
      'Pokok Sewa (Rp)',
      'Service Charge (Rp)',
      'Total Bruto (Rp)',
      'PPh Final 4(2) 10% (Rp)',
      'Net Transfer Landlord (Rp)',
      'Status',
      'Tanggal Bayar',
      'Rekening Kas',
      'Ref Transaksi',
    ];

    const rows = activeContract.monthlySchedules.map((s) => [
      `"${s.monthName}"`,
      s.periodMonthYear,
      s.dueDate,
      s.baseRentIDR,
      s.serviceChargeIDR,
      s.grossTotalIDR,
      s.pph42AmountIDR,
      s.netPaymentIDR,
      s.status,
      s.paidDate || '-',
      s.paymentChannelId || '-',
      s.referenceNumber || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jadwal_Sewa_12_Bulan_${activeContract.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="office-rent-management-root">
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30 shadow-inner">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                    Sewa Kantor Tahunan & Amortisasi 12 Bulan
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Breakdown 12 Bulan
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Input kontrak biaya sewa kantor tahunan, pembagian amortisasi beban 12 bulan, potongan pajak PPh Final Pasal 4(2) 10%, dan integrasi otomatis ke Arus Kas harian.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => {
                if (confirm('Kembalikan data Sewa Kantor ke default sistem?')) {
                  resetOfficeRentContractsToDefault();
                }
              }}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset data sewa kantor"
              id="btn-reset-rent-data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Export jadwal 12 bulan ke CSV"
              id="btn-export-rent-csv"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleSyncToFinance}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Sinkronkan jadwal berbayar ke buku kas & pajak"
              id="btn-sync-rent-to-finance"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Sinkron ke Arus Kas</span>
            </button>

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Buka Laporan Keuangan"
                id="btn-rent-open-reports"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            )}

            <button
              onClick={handleOpenNewContract}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.02] cursor-pointer"
              id="btn-add-rent-contract"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Daftarkan Kontrak Sewa</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5" id="rent-stats-overview">
        {/* Card 1: Nilai Sewa Tahunan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Sewa Tahunan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 font-mono">{formatIDR(metrics.annualRent)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tahun {activeContract?.year || 2026}</div>
          </div>
        </div>

        {/* Card 2: Beban Rata-Rata Bulanan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Amortisasi / Bulan</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-indigo-600 font-mono">{formatIDR(metrics.monthlyAverage)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tahunan dibagi 12 Bulan</div>
          </div>
        </div>

        {/* Card 3: Service Charge */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Service Charge / Bln</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-cyan-600 font-mono">
              {formatIDR(activeContract?.monthlyServiceChargeIDR || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pemeliharaan & utilitas gedung</div>
          </div>
        </div>

        {/* Card 4: Realisasi Terbayar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Realisasi Terbayar</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 font-mono">{formatIDR(metrics.paidTotal)}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {metrics.paidMonthsCount} dari 12 Bulan Lunas
            </div>
          </div>
        </div>

        {/* Card 5: Sisa Kewajiban Sewa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Komitmen</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-600 font-mono">{formatIDR(metrics.remainingTotal)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {12 - metrics.paidMonthsCount} Bulan tersisa
            </div>
          </div>
        </div>

        {/* Card 6: Akumulasi PPh Final 4(2) 10% */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">PPh Final 4(2) (10%)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-purple-600 font-mono">{formatIDR(metrics.accumulatedPph42)}</div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">Kewajiban potong sewa</div>
          </div>
        </div>
      </div>

      {/* Contract Selector Bar & Landlord Information Box */}
      {activeContract && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Pilih Kontrak Sewa:</label>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                id="select-active-contract"
              >
                {officeRentContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.officeName} ({c.buildingName}) - Tahun {c.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteContract(activeContract.id, activeContract.officeName)}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                id="btn-delete-active-contract"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kontrak</span>
              </button>
            </div>
          </div>

          {/* Landlord Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Landlord / Pemilik:</span>
              <span className="font-bold text-slate-800">{activeContract.landlordName}</span>
              <span className="text-[10px] text-slate-500 block">NPWP: {activeContract.landlordNpwp || '-'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rekening Pembayaran:</span>
              <span className="font-bold text-slate-800 font-mono">
                {activeContract.landlordBank} {activeContract.landlordAccount}
              </span>
              <span className="text-[10px] text-slate-500 block">a.n. {activeContract.landlordName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Kontrak Sewa:</span>
              <span className="font-bold text-slate-800">
                {activeContract.startDate} s/d {activeContract.endDate}
              </span>
              <span className="text-[10px] text-slate-500 block">Jatuh Tempo: Tgl {activeContract.dueDayOfMonth || 5}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Security Deposit:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatIDR(activeContract.securityDepositIDR || 0)}
              </span>
              <span className="text-[10px] text-emerald-600 block font-semibold">Tersimpan di Pengelola</span>
            </div>
          </div>
        </div>
      )}

      {/* 12-Month Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="rent-breakdown-table-container">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Amortisasi Beban Sewa Kantor (12 Bulan)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              12 Bulan Kalender
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Total Beban Setahun: <span className="font-bold text-slate-900 font-mono">{formatIDR(activeContract?.annualBaseRentIDR || 0)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="rent-breakdown-table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Bulan & Periode</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Pokok Sewa (IDR)</th>
                <th className="py-3 px-4 text-right">Service Charge</th>
                <th className="py-3 px-4 text-right">Total Bruto</th>
                <th className="py-3 px-4 text-center">PPh Final 4(2) (10%)</th>
                <th className="py-3 px-4 text-right">Net Transfer Landlord</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Sinkronisasi Kas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {activeContract?.monthlySchedules.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.status === 'PAID' ? 'bg-emerald-50/10' : ''
                  }`}
                  id={`row-month-${item.month}`}
                >
                  {/* Month */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.monthName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.periodMonthYear}</div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 font-mono text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.dueDate}</span>
                    </div>
                  </td>

                  {/* Monthly Base Rent */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatIDR(item.baseRentIDR)}
                  </td>

                  {/* Service Charge */}
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {formatIDR(item.serviceChargeIDR)}
                  </td>

                  {/* Gross Total */}
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                    {formatIDR(item.grossTotalIDR)}
                  </td>

                  {/* PPh Final 4(2) */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        10% Final
                      </span>
                      <span className="text-[10px] font-mono font-bold text-purple-700 mt-0.5">
                        -{formatIDR(item.pph42AmountIDR)}
                      </span>
                    </div>
                  </td>

                  {/* Net Payment */}
                  <td className="py-3 px-4 text-right font-mono font-black text-blue-700">
                    {formatIDR(item.netPaymentIDR)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status === 'PAID' ? 'LUNAS' : item.status === 'OVERDUE' ? 'JATUH TEMPO' : 'BELUM DIBAYAR'}
                    </span>
                    {item.paidDate && (
                      <div className="text-[10px] text-slate-500 mt-0.5">Tgl: {item.paidDate}</div>
                    )}
                  </td>

                  {/* Sync Status */}
                  <td className="py-3 px-4 text-center">
                    {item.transactionId ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        title={`ID Transaksi: ${item.transactionId}`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Buku Kas & Pajak</span>
                      </span>
                    ) : item.status === 'PAID' ? (
                      <button
                        onClick={handleSyncToFinance}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-blue-600" />
                        <span>Sinkronkan</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Otomatis saat Bayar</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    {item.status === 'PAID' ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sudah Disetor</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          id={`btn-pay-month-${item.monthIndex || item.month}`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar Bulan Ini</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPayMonth(item)}
                          className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          title="Bayar Cepat (1-Klik otomatis sinkron ke Kas & Pajak)"
                          id={`btn-quick-pay-month-${item.monthIndex || item.month}`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>1-Klik</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Month Modal */}
      {isPayModalOpen && selectedScheduleItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-blue-900 text-white p-5 flex items-center justify-between border-b border-blue-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Pembayaran Sewa Kantor: {selectedScheduleItem.schedule.monthName}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Periode {selectedScheduleItem.schedule.periodMonthYear} - {activeContract?.officeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {/* Payment Summary Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pokok Sewa Bulanan:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatIDR(selectedScheduleItem.schedule.baseRentIDR)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Service Charge Bulanan:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatIDR(selectedScheduleItem.schedule.serviceChargeIDR)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span className="text-slate-900">Total Beban Bruto:</span>
                  <span className="font-mono text-slate-900">
                    {formatIDR(selectedScheduleItem.schedule.grossTotalIDR)}
                  </span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Potongan PPh Final Pasal 4(2) (10%):</span>
                  <span className="font-bold font-mono">
                    -{formatIDR(selectedScheduleItem.schedule.pph42AmountIDR)}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-blue-200 pt-2 font-black text-sm text-blue-800">
                  <span>Net Transfer ke Landlord:</span>
                  <span className="font-mono">{formatIDR(selectedScheduleItem.schedule.netPaymentIDR)}</span>
                </div>
              </div>

              {/* Payment Details Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paidDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rekening Kas Sumber Dana <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentForm.paymentChannelId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentChannelId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Referensi Transfer / Bukti Bayar
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRF-BCA-20260805-9928"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sync Options Checkboxes */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-rent-ledger"
                    checked={paymentForm.syncToLedger}
                    onChange={(e) => setPaymentForm({ ...paymentForm, syncToLedger: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="chk-rent-ledger" className="text-xs font-bold text-blue-950 cursor-pointer">
                    Catat Otomatis ke Buku Kas & Arus Kas Harian (EXPENSE)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-rent-tax"
                    checked={paymentForm.syncToTax}
                    onChange={(e) => setPaymentForm({ ...paymentForm, syncToTax: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="chk-rent-tax" className="text-xs font-bold text-purple-950 cursor-pointer">
                    Catat Kewajiban Setor PPh Final Pasal 4(2) 10% ke Modul Pajak DJP
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  id="btn-confirm-rent-payment"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Contract Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingContract ? 'Edit Kontrak Sewa Kantor' : 'Daftarkan Kontrak Sewa Tahunan Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sistem akan otomatis menghasilkan pembagian amortisasi 12 bulan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Unit Kantor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kantor Pusat Jakarta Lantai 12"
                    value={contractForm.officeName}
                    onChange={(e) => setContractForm({ ...contractForm, officeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Gedung / Tower <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gedung Menara Thamrin"
                    value={contractForm.buildingName}
                    onChange={(e) => setContractForm({ ...contractForm, buildingName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Landlord / Pemilik Gedung <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PT Graha Propertindo"
                    value={contractForm.landlordName}
                    onChange={(e) => setContractForm({ ...contractForm, landlordName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NPWP Landlord</label>
                  <input
                    type="text"
                    placeholder="01.345.678.9-021.000"
                    value={contractForm.landlordNpwp}
                    onChange={(e) => setContractForm({ ...contractForm, landlordNpwp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Financial Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biaya Sewa Kantor Tahunan (12 Bulan) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={10000000}
                      step={1000000}
                      value={contractForm.annualBaseRentIDR}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, annualBaseRentIDR: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-blue-600 font-mono mt-1 block">
                    = Rp {Math.round(contractForm.annualBaseRentIDR / 12).toLocaleString('id-ID')} / bulan
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Charge Bulanan (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={contractForm.monthlyServiceChargeIDR}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, monthlyServiceChargeIDR: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Year & Due Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={contractForm.year}
                    onChange={(e) => setContractForm({ ...contractForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo Bulanan</label>
                  <select
                    value={contractForm.dueDayOfMonth}
                    onChange={(e) => setContractForm({ ...contractForm, dueDayOfMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                      <option key={day} value={day}>
                        Tanggal {day} setiap bulan
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif PPh Final 4(2)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={contractForm.pph42RatePercent}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-700"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  id="btn-save-contract"
                >
                  Simpan & Generate 12 Bulan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
