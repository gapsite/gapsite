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
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { PayrollPayment, PayrollStatus } from '../../types';
import { formatIDR } from '../../utils/formatters';
import { calculatePayrollSummary } from '../../utils/payrollCalculations';
import { PayslipModal } from './PayslipModal';
import { PayrollPaymentModal } from './PayrollPaymentModal';
import { BatchPayrollModal } from './BatchPayrollModal';

export const PayrollManagement: React.FC = () => {
  const {
    payrollRecords,
    addPayrollPayment,
    updatePayrollPayment,
    deletePayrollPayment,
    batchAddPayrollPayments,
    markPayrollAsPaid,
    transactions,
    currentUser,
    isMasterAdmin,
    paymentChannels,
  } = useProjects();

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Modals state
  const [selectedForView, setSelectedForView] = useState<PayrollPayment | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollPayment | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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
  }, [payrollRecords, periodFilter, statusFilter, departmentFilter, searchTerm]);

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
  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus slip gaji ${name}? Transaksi pengeluaran kas yang terkait juga akan otomatis dihapus dari Buku Kas.`
      )
    ) {
      deletePayrollPayment(id);
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold tracking-wide uppercase font-mono">
              Sistem Pembayaran Gaji Karyawan & Payroll Konsultan
            </h2>
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
              Integrasi Arus Kas &amp; Pajak PPh 21
            </span>
          </div>
          <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
            Setiap pembayaran gaji yang diproses otomatis tercatat ke <strong>Buku Kas Umum</strong>, mengurangi saldo kas di <strong>Arus Kas Harian</strong> (<code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono text-emerald-300">GAJI_KARYAWAN</code>), dan pemotongan <strong>PPh Pasal 21</strong> langsung otomatis masuk ke <strong>Menu Pajak &amp; Hutang Pajak (Tax Management)</strong> serta <strong>Laporan Keuangan (Neraca Liabilitas Pajak)</strong> tanpa risiko input ganda (anti double-input).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            <span>+ Input Gaji Karyawan</span>
          </button>
        </div>
      </div>

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
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama karyawan, no slip, NIK..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 text-slate-800"
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 font-semibold focus:outline-emerald-600"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-emerald-600"
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
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-emerald-600"
            >
              <option value="ALL">Semua Divisi</option>
              {availableDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV Rekap Gaji"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPayroll(null);
              setIsInputModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Gaji</span>
          </button>
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
                        <button
                          type="button"
                          onClick={() => handleOpenPayslip(payroll)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Slip Gaji Karyawan"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
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
                          onClick={() => handleDelete(payroll.id, payroll.employeeName)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Slip Gaji & Transaksi Kas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
