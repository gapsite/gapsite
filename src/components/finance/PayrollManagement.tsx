import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Zap,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  Receipt,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Eye,
  RefreshCw,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { PayrollPayment, PayrollStatus } from '../../types';
import { formatIDR } from '../../utils/formatters';
import { calculatePayrollSummary } from '../../utils/payrollCalculations';
import { PayslipModal } from './PayslipModal';
import { PayrollPaymentModal } from './PayrollPaymentModal';
import { BatchPayrollModal } from './BatchPayrollModal';
import { AnnualSalaryManagementView } from './AnnualSalaryManagementView';

export const PayrollManagement: React.FC = () => {
  const {
    payrollRecords,
    addPayrollPayment,
    updatePayrollPayment,
    deletePayrollPayment,
    batchAddPayrollPayments,
    markPayrollAsPaid,
    syncAllPayrollToFinance,
    resetPayrollToDefault,
    transactions,
    currentUser,
    isMasterAdmin,
    hasPermission,
    paymentChannels,
    isSyncingWithFirestore,
    employeeSalaryConfigs,
  } = useProjects();

  const canManagePayroll =
    isMasterAdmin ||
    hasPermission('MANAGE_FINANCE') ||
    currentUser.role === 'DIRECTOR' ||
    (currentUser.role as string) === 'DIRECTOR_PARTNER' ||
    currentUser.role === 'FINANCE_OFFICER';

  // Navigation tab: 'payroll_records' or 'annual_salary'
  const [activeTab, setActiveTab] = useState<'payroll_records' | 'annual_salary'>('payroll_records');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [viewOnlyMine, setViewOnlyMine] = useState(false);

  // Modals state
  const [selectedForView, setSelectedForView] = useState<PayrollPayment | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollPayment | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSyncingLedger, setIsSyncingLedger] = useState(false);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{
    show: boolean;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    removedDuplicatesCount: number;
    taxSyncedCount: number;
    totalAmountIDR: number;
  } | null>(null);

  // Reconciliation statistics between Payroll module and Finance & Cash Flow ledger
  const financeIntegrationStats = useMemo(() => {
    const paidRecords = payrollRecords.filter(
      (p) => p && (p.status === 'PAID' || String(p.status).toUpperCase() === 'PAID')
    );
    const totalPaidPayrollIDR = paidRecords.reduce((sum, p) => sum + (p.netSalary || 0), 0);

    const payrollTransactions = transactions.filter((t) => t.category === 'GAJI_KARYAWAN');
    const totalLedgerPayrollIDR = payrollTransactions.reduce((sum, t) => sum + (t.amountIDR || 0), 0);

    // Count how many paid records are not yet linked to any ledger transaction
    const unlinkedRecords = paidRecords.filter((p) => {
      return !transactions.some(
        (t) =>
          (p.transactionId && t.id === p.transactionId) ||
          (p.payrollNumber && t.referenceNumber === p.payrollNumber) ||
          (p.payrollNumber && t.notes?.includes(p.payrollNumber)) ||
          (p.id && t.notes?.includes(p.id)) ||
          (t.category === 'GAJI_KARYAWAN' &&
            p.employeeName &&
            t.clientOrVendorName?.toLowerCase().trim() === p.employeeName.toLowerCase().trim() &&
            p.period &&
            t.description?.toLowerCase().includes(p.period.toLowerCase()))
      );
    });

    const difference = totalPaidPayrollIDR - totalLedgerPayrollIDR;
    const isMatched = unlinkedRecords.length === 0 && Math.abs(difference) < 1;

    return {
      paidCount: paidRecords.length,
      totalPaidPayrollIDR,
      ledgerCount: payrollTransactions.length,
      totalLedgerPayrollIDR,
      unlinkedCount: unlinkedRecords.length,
      difference,
      isMatched,
    };
  }, [payrollRecords, transactions]);

  const handleSyncToFinance = async () => {
    setIsSyncingLedger(true);
    setSyncErrorMsg(null);
    try {
      const res = await syncAllPayrollToFinance();
      setSyncFeedback({
        show: true,
        syncedCount: res.syncedCount,
        createdCount: res.createdCount,
        updatedCount: res.updatedCount,
        removedDuplicatesCount: res.removedDuplicatesCount || 0,
        taxSyncedCount: res.taxSyncedCount || 0,
        totalAmountIDR: res.totalAmountIDR,
      });
      setTimeout(() => {
        setSyncFeedback((prev) => (prev ? { ...prev, show: false } : null));
      }, 8000);
    } catch (err: any) {
      console.error('Sync payroll error:', err);
      setSyncErrorMsg(err?.message || 'Terjadi kesalahan saat menyinkronkan data gaji ke modul keuangan.');
      setTimeout(() => setSyncErrorMsg(null), 8000);
    } finally {
      setIsSyncingLedger(false);
    }
  };

  // Count user's own payslips
  const myRecordsCount = useMemo(() => {
    const uName = (currentUser.name || '').toLowerCase();
    const uEmail = (currentUser.email || '').toLowerCase();
    const uNik = (currentUser.username || '').toLowerCase();
    return payrollRecords.filter((r) => {
      const rName = (r.employeeName || '').toLowerCase();
      const rEmail = (r.employeeEmail || '').toLowerCase();
      const rNik = (r.employeeNik || '').toLowerCase();
      return (
        r.employeeId === currentUser.id ||
        (uName && rName.includes(uName)) ||
        (uEmail && rEmail === uEmail) ||
        (uNik && rNik.includes(uNik))
      );
    }).length;
  }, [payrollRecords, currentUser]);

  // Distinct periods available
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    payrollRecords.forEach((r) => {
      if (r.period) set.add(r.period);
    });
    // Add default periods if empty
    set.add('September 2026');
    set.add('Agustus 2026');
    set.add('Juli 2026');
    return Array.from(set);
  }, [payrollRecords]);

  // Distinct departments
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    payrollRecords.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set);
  }, [payrollRecords]);

  // Filtered payroll records
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((record) => {
      // My records filter
      if (viewOnlyMine) {
        const uName = (currentUser.name || '').toLowerCase();
        const uEmail = (currentUser.email || '').toLowerCase();
        const uNik = (currentUser.username || '').toLowerCase();
        const rName = (record.employeeName || '').toLowerCase();
        const rEmail = (record.employeeEmail || '').toLowerCase();
        const rNik = (record.employeeNik || '').toLowerCase();
        const isMine =
          record.employeeId === currentUser.id ||
          (uName && rName.includes(uName)) ||
          (uEmail && rEmail === uEmail) ||
          (uNik && rNik.includes(uNik));
        if (!isMine) return false;
      }
      // Period filter
      if (periodFilter !== 'ALL' && record.period !== periodFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && record.status !== statusFilter) {
        return false;
      }
      // Department filter
      if (departmentFilter !== 'ALL' && record.department !== departmentFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = record.employeeName?.toLowerCase().includes(query);
        const matchesNumber = record.payrollNumber?.toLowerCase().includes(query);
        const matchesRole = record.roleTitle?.toLowerCase().includes(query);
        const matchesDept = record.department?.toLowerCase().includes(query);
        const matchesNik = record.employeeNik?.toLowerCase().includes(query);
        if (!matchesName && !matchesNumber && !matchesRole && !matchesDept && !matchesNik) {
          return false;
        }
      }
      return true;
    });
  }, [payrollRecords, periodFilter, statusFilter, departmentFilter, searchTerm, viewOnlyMine, currentUser]);

  // Summary Metrics
  const summary = useMemo(() => {
    return calculatePayrollSummary(payrollRecords, periodFilter);
  }, [payrollRecords, periodFilter]);

  // View Payslip
  const handleOpenPayslip = (payroll: PayrollPayment) => {
    setSelectedForView(payroll);
    setIsPayslipModalOpen(true);
  };

  // Edit Payroll
  const handleOpenEdit = (payroll: PayrollPayment) => {
    setEditingPayroll(payroll);
    setIsInputModalOpen(true);
  };

  // Delete Payroll
  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus slip gaji ${name}? Semua data yang terintegrasi (transaksi pengeluaran kas di Arus Kas/Buku Kas dan kewajiban PPh 21 di Menu Pajak) akan otomatis ikut terhapus secara permanen dari Cloud Firestore dan tersimpan realtime ke seluruh role.`
      )
    ) {
      setDeletingId(id);
      try {
        await deletePayrollPayment(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Save new / edited payroll
  const handleSavePayroll = (
    data: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>
  ) => {
    if (editingPayroll) {
      updatePayrollPayment(editingPayroll.id, data);
      setEditingPayroll(null);
    } else {
      addPayrollPayment(data);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No Slip',
      'Periode',
      'Tanggal Bayar',
      'Nama Karyawan',
      'NIK',
      'Jabatan',
      'Departemen',
      'Gaji Pokok',
      'Tunjangan',
      'Bonus Proyek',
      'Penghasilan Bruto',
      'BPJS Kesehatan',
      'BPJS TK',
      'PPh 21',
      'Potongan Lain',
      'Total Potongan',
      'Take Home Pay',
      'Metode Bayar',
      'Status',
      'No Transaksi Kas',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.payrollNumber}"`,
      `"${r.period}"`,
      `"${r.paymentDate}"`,
      `"${r.employeeName}"`,
      `"${r.employeeNik || '-'}"`,
      `"${r.roleTitle}"`,
      `"${r.department}"`,
      r.basicSalary,
      r.positionAllowance + r.transportAllowance + r.mealAllowance + r.otherAllowances,
      r.projectBonus,
      r.totalEarnings,
      r.bpjsKesehatan,
      r.bpjsKetenagakerjaan,
      r.pph21Amount,
      r.cashAdvanceDeduction + r.otherDeductions,
      r.totalDeductions,
      r.netSalary,
      `"${r.paymentMethod}"`,
      `"${r.status}"`,
      `"${r.transactionId || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Payroll_Gaji_GAP_${periodFilter === 'ALL' ? 'Semua_Periode' : periodFilter.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Full Realtime Integration */}
      <div className="bg-emerald-900/90 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold tracking-wide uppercase font-mono">
              Sistem Pembayaran Gaji Karyawan &amp; Payroll Konsultan
            </h2>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Firestore Realtime Sync Terhubung</span>
            </div>
            <span className="bg-slate-900/80 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Role: {currentUser.roleTitle || currentUser.role}
            </span>
          </div>
          <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
            Data tersimpan aman di <strong>Cloud Firestore</strong> dan terupdate secara realtime ke seluruh peran/role. Setiap pembayaran gaji yang diproses otomatis mengurangi saldo kas di <strong>Arus Kas Harian</strong> (<code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono text-emerald-300">GAJI_KARYAWAN</code>), dan pemotongan <strong>PPh 21 (Skema TER)</strong> langsung tersinkronisasi otomatis ke <strong>Menu Pajak (Tax Management)</strong> serta <strong>Laporan Keuangan</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canManagePayroll && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset data payroll ke contoh default baseline dan simpan ke Cloud Firestore?')) {
                    resetPayrollToDefault();
                  }
                }}
                className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-950 text-emerald-200 border border-emerald-600/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset data contoh default payroll"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
              <button
                type="button"
                onClick={handleSyncToFinance}
                disabled={isSyncingLedger}
                className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                title="Sinkronkan seluruh slip gaji ke Buku Kas, Arus Kas & Laporan Keuangan"
              >
                {isSyncingLedger ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                )}
                <span>Sinkron ke Keuangan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Gaji Masal (Batch)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPayroll(null);
                  setIsInputModalOpen(true);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-800" />
                <span>+ Input Gaji</span>
              </button>
            </>
          )}
          {!canManagePayroll && (
            <div className="px-3.5 py-2 bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>Mode Akses Pegawai (Slip Gaji Realtime)</span>
            </div>
          )}
        </div>
      </div>

      {/* Reconciliation & Integration Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          financeIntegrationStats.isMatched
            ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                financeIntegrationStats.isMatched
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {financeIntegrationStats.isMatched ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <RefreshCw className={`w-5 h-5 ${isSyncingLedger ? 'animate-spin' : ''}`} />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Integrasi Gaji Karyawan &rarr; Arus Kas &amp; Laporan Keuangan
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                    financeIntegrationStats.isMatched
                      ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-200 text-amber-900 border border-amber-400'
                  }`}
                >
                  {financeIntegrationStats.isMatched ? '100% SINKRON & TERINTEGRASI' : 'PERLU SINKRONISASI'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {financeIntegrationStats.isMatched
                  ? `Semua ${financeIntegrationStats.paidCount} data slip gaji lunas (${formatIDR(
                      financeIntegrationStats.totalPaidPayrollIDR
                    )}) telah tercatat otomatis dan terkonfirmasi masuk ke Buku Kas, Arus Kas Harian, dan Laporan Laba Rugi.`
                  : `Terdeteksi selisih data: Total Gaji Lunas ${formatIDR(
                      financeIntegrationStats.totalPaidPayrollIDR
                    )} (${financeIntegrationStats.paidCount} slip) vs tercatat di Buku Kas ${formatIDR(
                      financeIntegrationStats.totalLedgerPayrollIDR
                    )}. Tekan tombol sinkronisasi untuk memasukkan data yang tertinggal.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-200">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Tercatat di Arus Kas</span>
              <span className="text-sm font-black font-mono text-emerald-800">
                {formatIDR(financeIntegrationStats.totalLedgerPayrollIDR)}
              </span>
            </div>
            {canManagePayroll && (
              <button
                type="button"
                onClick={handleSyncToFinance}
                disabled={isSyncingLedger}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSyncingLedger ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{financeIntegrationStats.isMatched ? 'Cek Ulang Integrasi' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
          </div>
        </div>

        {syncFeedback && syncFeedback.show && (
          <div className="mt-3.5 p-3 bg-white rounded-xl border border-emerald-300 shadow-xs flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Sinkronisasi Berhasil:</strong> {syncFeedback.syncedCount} slip gaji lunas ({formatIDR(syncFeedback.totalAmountIDR)}) diperiksa.
                {syncFeedback.createdCount > 0 ? ` Menambahkan ${syncFeedback.createdCount} transaksi baru ke Buku Kas & Arus Kas.` : ''}
                {syncFeedback.updatedCount > 0 ? ` Menyesuaikan ${syncFeedback.updatedCount} transaksi agar nominal dan statusnya akurat.` : ''}
                {syncFeedback.removedDuplicatesCount > 0 ? ` Membersihkan ${syncFeedback.removedDuplicatesCount} transaksi duplikat.` : ''}
                {syncFeedback.taxSyncedCount > 0 ? ` Menyelaraskan ${syncFeedback.taxSyncedCount} kewajiban PPh 21 ke Menu Pajak.` : ''}
                {syncFeedback.createdCount === 0 && syncFeedback.updatedCount === 0 && syncFeedback.removedDuplicatesCount === 0 ? ' Seluruh transaksi telah 100% cocok dan terhubung.' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 text-xs cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {syncErrorMsg && (
          <div className="mt-3.5 p-3 bg-rose-50 rounded-xl border border-rose-300 shadow-xs flex items-center justify-between gap-3 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Gagal Sinkronisasi:</strong> {syncErrorMsg}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncErrorMsg(null)}
              className="text-rose-400 hover:text-rose-700 font-bold px-2 py-1 text-xs cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Tab Switcher: Pembayaran & Slip Gaji vs Penetapan Gaji Karyawan Tahunan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-3 pb-0">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('payroll_records')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payroll_records'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Riwayat Pembayaran &amp; Slip Gaji</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {payrollRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('annual_salary')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'annual_salary'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Penetapan Gaji Karyawan (Tahunan)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {employeeSalaryConfigs.length} SK
            </span>
          </button>
        </div>

        {activeTab === 'payroll_records' && canManagePayroll && (
          <button
            type="button"
            onClick={() => setActiveTab('annual_salary')}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer mb-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kelola Standar Gaji Tahunan Role &amp; Pegawai &rarr;</span>
          </button>
        )}
      </div>

      {activeTab === 'annual_salary' ? (
        <AnnualSalaryManagementView
          onOpenPayrollInputForEmployee={(employeeId, year) => {
            setActiveTab('payroll_records');
            setEditingPayroll(null);
            setIsInputModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gaji Bersih Terbayar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Gaji Terbayar (THP)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-800 tracking-tight">
              {formatIDR(summary.totalPaidIDR)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.paidCount} Slip Gaji Lunas • Periode {periodFilter === 'ALL' ? 'Semua' : periodFilter}
          </p>
        </div>

        {/* Card 2: Total Beban Bruto Perusahaan */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Beban Bruto Gaji
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
              {formatIDR(summary.totalGrossIDR)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Gaji Pokok + Tunjangan + Bonus & Lembur
          </p>
        </div>

        {/* Card 3: Potongan Pajak PPh 21 Terhimpun */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Hutang Setor PPh 21
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-700 tracking-tight">
              {formatIDR(summary.totalPph21IDR)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dipungut dari gaji • Terintegrasi ke Modul Pajak
          </p>
        </div>

        {/* Card 4: Potongan BPJS Pegawai */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Iuran BPJS Terpotong
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-teal-800 tracking-tight">
              {formatIDR(summary.totalBpjsIDR)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            BPJS Kesehatan (1%) & Ketenagakerjaan (2%)
          </p>
        </div>
      </div>

      {/* Filter, Search & Export Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 overflow-hidden">
        {/* Row 1: Kolom Semua Pegawai (Kiri) & Filter Pencarian (Kanan) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
          {/* Kolom Semua Pegawai vs Slip Saya */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start">
            <button
              type="button"
              onClick={() => setViewOnlyMine(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !viewOnlyMine
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Pegawai ({payrollRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setViewOnlyMine(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewOnlyMine
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Slip Saya ({myRecordsCount})</span>
            </button>
          </div>

          {/* Search & Filter Controls: Rapi, Responsif, dan Sejajar Tanpa Melebihi Batas */}
          <div className="flex flex-wrap items-center gap-2 flex-1 xl:justify-end min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial sm:w-56 min-w-[160px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama karyawan, no slip, NIK..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 text-slate-800"
              />
            </div>

            {/* Period Filter */}
            <div className="relative shrink-0 flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Periode</option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-emerald-600 shrink-0 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">LUNAS / TERBAYAR</option>
              <option value="PENDING">PENDING</option>
              <option value="DRAFT">DRAFT</option>
            </select>

            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-emerald-600 shrink-0 cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL">Semua Divisi</option>
                {availableDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Reset Filters */}
            {(searchTerm || periodFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPeriodFilter('ALL');
                  setStatusFilter('ALL');
                  setDepartmentFilter('ALL');
                }}
                className="px-2.5 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                title="Reset semua filter pencarian"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Tombol Ekspor CSV & Input Gaji Di Bawah Kolom Semua Pegawai */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Download CSV Rekap Gaji"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {canManagePayroll && (
              <button
                type="button"
                onClick={() => {
                  setEditingPayroll(null);
                  setIsInputModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Gaji</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold font-mono text-slate-800">{filteredRecords.length}</span> dari{' '}
            <span className="font-mono">{payrollRecords.length}</span> total slip pembayaran
          </div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono">No. Slip & Tanggal</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono">Nama Pegawai & Jabatan</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono text-right">Penghasilan Bruto</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono text-right">Potongan</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono text-right">Take Home Pay (THP)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono text-center">Status & Jurnal Kas</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider font-mono text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      Belum ada data slip gaji pada filter ini
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik "+ Input Gaji Karyawan" atau "Gaji Masal (Batch)" untuk memproses slip gaji pertama.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Column 1: Slip No & Date */}
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        {payroll.payrollNumber}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {payroll.period} • {payroll.paymentDate}
                      </p>
                    </td>

                    {/* Column 2: Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {payroll.employeeName
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{payroll.employeeName}</p>
                          <p className="text-[11px] text-slate-500">
                            {payroll.roleTitle} • <span className="text-slate-400">{payroll.department}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Gross Earnings */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="font-bold text-slate-800">
                        {formatIDR(payroll.totalEarnings)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Pokok: {formatIDR(payroll.basicSalary)}
                        {payroll.projectBonus > 0 && ` + Bonus: ${formatIDR(payroll.projectBonus)}`}
                      </p>
                    </td>

                    {/* Column 4: Deductions */}
                    <td className="py-3 px-4 text-right font-mono text-rose-700">
                      <span className="font-semibold">
                        {payroll.totalDeductions > 0 ? `-${formatIDR(payroll.totalDeductions)}` : 'Rp 0'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        BPJS: {formatIDR((payroll.bpjsKesehatan || 0) + (payroll.bpjsKetenagakerjaan || 0))} • PPh: {formatIDR(payroll.pph21Amount || 0)}
                      </p>
                    </td>

                    {/* Column 5: Net Salary (Take Home Pay) */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 inline-block">
                        {formatIDR(payroll.netSalary)}
                      </span>
                      {(() => {
                        const channel = paymentChannels?.find((c) => c.id === payroll.paymentMethod);
                        return (
                          <div className="text-[10px] text-slate-500 mt-1 font-sans">
                            <div className="text-slate-600 font-medium">
                              Dari: <span className="font-semibold text-emerald-800">{channel ? `${channel.shortName || channel.name}` : payroll.paymentMethod}</span>
                              {channel?.accountNumber && (
                                <span className="font-mono text-slate-500"> ({channel.accountNumber})</span>
                              )}
                            </div>
                            {payroll.bankName && (
                              <div className="text-slate-400 text-[9px]">
                                Ke: {payroll.bankName} {payroll.bankAccountNumber ? `(${payroll.bankAccountNumber})` : ''}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Column 6: Status & Cash Ledger Linkage */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                            payroll.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : payroll.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {payroll.status === 'PAID' ? 'LUNAS / CAIR' : payroll.status}
                        </span>

                        {payroll.transactionId && (
                          <span
                            className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 hover:text-emerald-700 transition-colors"
                            title="Tercatat di Buku Kas Umum"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Kas: {payroll.transactionId}
                          </span>
                        )}

                        {payroll.pph21Amount && payroll.pph21Amount > 0 ? (
                          <span
                            className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded flex items-center gap-1"
                            title="Tersinkronisasi otomatis ke Menu Pajak & Neraca Keuangan (Anti Double-Input)"
                          >
                            <Receipt className="w-2.5 h-2.5 text-indigo-600" />
                            PPh 21: {formatIDR(payroll.pph21Amount)}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Column 7: Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {payroll.status === 'PENDING' && canManagePayroll && (
                          <button
                            type="button"
                            onClick={() => markPayrollAsPaid(payroll.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="Tandai Lunas & Bukukan ke Buku Kas Umum"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Cairkan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenPayslip(payroll)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat / Cetak Slip Gaji"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canManagePayroll && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(payroll)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Rincian Slip Gaji"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === payroll.id}
                              onClick={() => handleDelete(payroll.id, payroll.employeeName)}
                              className={`p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ${
                                deletingId === payroll.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Hapus Slip Gaji & Seluruh Data Kas Terkait"
                            >
                              {deletingId === payroll.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Slip Gaji Modal */}
      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => {
          setIsPayslipModalOpen(false);
          setSelectedForView(null);
        }}
        payroll={selectedForView}
      />

      {/* Input / Edit Modal */}
      <PayrollPaymentModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditingPayroll(null);
        }}
        initialPayroll={editingPayroll}
        onSave={handleSavePayroll}
      />

      {/* Batch Modal */}
      <BatchPayrollModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchProcess={(records) => {
          batchAddPayrollPayments(records);
        }}
      />
    </div>
  );
};
