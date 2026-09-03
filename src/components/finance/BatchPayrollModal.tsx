import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Zap,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { PayrollPayment, PaymentMethod } from '../../types';
import { formatIDR } from '../../utils/formatters';
import {
  hitungBpjsKesehatan,
  hitungBpjsKetenagakerjaan,
  estimasiPph21,
  DEFAULT_ROLE_COMPENSATION,
} from '../../utils/payrollCalculations';

interface BatchPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchProcess: (records: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>>) => void;
}

interface BatchEmployeeRow {
  employeeId: string;
  employeeName: string;
  employeeNik?: string;
  roleTitle: string;
  department: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder?: string;
  selected: boolean;
  skNumber?: string;
  hasAnnualConfig?: boolean;
}

const CALENDAR_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const BatchPayrollModal: React.FC<BatchPayrollModalProps> = ({
  isOpen,
  onClose,
  onBatchProcess,
}) => {
  const {
    teamMembers,
    currentUser,
    employeeSalaryConfigs,
    getEmployeeSalaryConfigForYear,
  } = useProjects();

  const availableYears = useMemo(() => {
    const startYear = 2021;
    const endYear = 2100;
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return CALENDAR_MONTHS[now.getMonth()] || 'September';
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return now.getFullYear() || 2026;
  });

  const period = `${selectedMonth} ${selectedYear}`;
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_MANDIRI');

  // Helper to generate rows for a given year using official annual salary configurations
  const buildRowsForYear = (targetYear: number): BatchEmployeeRow[] => {
    return teamMembers.map((m) => {
      const configInfo = getEmployeeSalaryConfigForYear(m.id, targetYear, m.role);
      const base = configInfo.basicSalary;
      const allow =
        configInfo.positionAllowance +
        configInfo.transportAllowance +
        configInfo.mealAllowance +
        (configInfo.communicationAllowance || 0) +
        (configInfo.fixedAllowance || 0);
      const bpjsKes = hitungBpjsKesehatan(base, configInfo.positionAllowance);
      const bpjsTk = hitungBpjsKetenagakerjaan(base, configInfo.positionAllowance);
      const tax = estimasiPph21(base + allow);
      const deductions = bpjsKes + bpjsTk + tax;
      const net = Math.max(0, base + allow - deductions);

      return {
        employeeId: m.id,
        employeeName: m.name,
        employeeNik: m.nik || '',
        roleTitle: m.roleTitle || m.role,
        department: m.department || 'Konsultansi',
        basicSalary: base,
        allowances: allow,
        bonus: 0,
        deductions,
        netSalary: net,
        bankName: m.bankName || 'Bank Mandiri',
        bankAccountNumber: m.bankAccountNumber || '',
        bankAccountHolder: m.bankAccountHolder || m.name,
        selected: true,
        skNumber: configInfo.config?.skNumber,
        hasAnnualConfig: Boolean(configInfo.config),
      };
    });
  };

  // Prepare initial rows based on team members and annual salary config
  const [rows, setRows] = useState<BatchEmployeeRow[]>(() => buildRowsForYear(2026));

  // Re-sync rows if teamMembers or employeeSalaryConfigs changes when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setRows(buildRowsForYear(selectedYear));
    }
  }, [isOpen, teamMembers, employeeSalaryConfigs, selectedYear]);

  const toggleSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const updateRow = (index: number, field: keyof BatchEmployeeRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Recalculate net salary
      const gross = (Number(target.basicSalary) || 0) + (Number(target.allowances) || 0) + (Number(target.bonus) || 0);
      target.netSalary = Math.max(0, gross - (Number(target.deductions) || 0));

      updated[index] = target;
      return updated;
    });
  };

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);

  const totalBatchOutflow = useMemo(() => {
    return selectedRows.reduce((acc, r) => acc + r.netSalary, 0);
  }, [selectedRows]);

  const handleProcess = () => {
    if (selectedRows.length === 0) {
      alert('Pilih minimal 1 karyawan untuk diproses.');
      return;
    }

    const payload: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>> = selectedRows.map((r) => {
      const totalEarnings = r.basicSalary + r.allowances + r.bonus;
      const bpjsKes = hitungBpjsKesehatan(r.basicSalary, 0);
      const bpjsTk = hitungBpjsKetenagakerjaan(r.basicSalary, 0);
      const tax = estimasiPph21(totalEarnings);

      return {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        employeeNik: r.employeeNik || '',
        roleTitle: r.roleTitle,
        department: r.department,
        bankName: r.bankName,
        bankAccountNumber: r.bankAccountNumber,
        bankAccountHolder: r.bankAccountHolder || r.employeeName,
        period,
        paymentDate,
        basicSalary: r.basicSalary,
        positionAllowance: r.allowances,
        transportAllowance: 0,
        mealAllowance: 0,
        projectBonus: r.bonus,
        overtimeAmount: 0,
        otherAllowances: 0,
        totalEarnings,
        bpjsKesehatan: bpjsKes,
        bpjsKetenagakerjaan: bpjsTk,
        pph21Amount: tax,
        cashAdvanceDeduction: 0,
        otherDeductions: Math.max(0, r.deductions - bpjsKes - bpjsTk - tax),
        totalDeductions: r.deductions,
        netSalary: r.netSalary,
        paymentMethod,
        paymentChannelId: paymentMethod,
        status: 'PAID',
        notes: `Penggajian Masal (Batch Payroll) Periode ${period}`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Controller',
        paidAt: paymentDate,
      };
    });

    onBatchProcess(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Proses Penggajian Masal (Batch Payroll)
              </h3>
              <p className="text-xs text-slate-400">
                Pencairan serentak bulanan • Otomatis masuk ke Buku Kas & Arus Kas Harian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bulan Penggajian
            </label>
            <select
              id="batch-payroll-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-semibold cursor-pointer"
            >
              {CALENDAR_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tahun Penggajian
            </label>
            <select
              id="batch-payroll-year-select"
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                setRows(buildRowsForYear(yr));
              }}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-semibold cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Pencairan / Transfer
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rekening Sumber Kas Perusahaan
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-medium"
            >
              <option value="BANK_TRANSFER_MANDIRI">Bank Mandiri Giro Corporate</option>
              <option value="BANK_TRANSFER_BCA">Bank BCA Bisnis Utama</option>
              <option value="BANK_TRANSFER_BRI">Bank BRI Corporate</option>
              <option value="BANK_TRANSFER_BNI">Bank BNI Giro</option>
            </select>
          </div>
        </div>

        {/* Table of Employees */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => r.selected)}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="py-2.5 px-3">Nama Karyawan & Posisi</th>
                  <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                  <th className="py-2.5 px-3 text-right">Tunjangan</th>
                  <th className="py-2.5 px-3 text-right">Bonus/Insentif</th>
                  <th className="py-2.5 px-3 text-right">Potongan</th>
                  <th className="py-2.5 px-3 text-right">THP (Gaji Bersih)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr
                    key={row.employeeId || idx}
                    className={`hover:bg-slate-50 transition-colors ${
                      !row.selected ? 'opacity-40 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => updateRow(idx, 'selected', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-900">{row.employeeName}</p>
                        {row.hasAnnualConfig ? (
                          <span
                            className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-mono font-bold border border-emerald-300"
                            title={`Terkoneksi SK Penetapan Gaji Tahunan (${selectedYear}): ${row.skNumber || ''}`}
                          >
                            SK {selectedYear}
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-mono border border-slate-200"
                            title="Menggunakan standar benchmark role"
                          >
                            Acuan Role
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{row.roleTitle}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                        {row.bankAccountNumber ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                            {row.bankName}: {row.bankAccountNumber}
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Rekening belum diatur
                          </span>
                        )}
                        {row.employeeNik && (
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            NIK: {row.employeeNik}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="50000"
                        value={row.basicSalary}
                        disabled={!row.selected}
                        onChange={(e) => updateRow(idx, 'basicSalary', Number(e.target.value) || 0)}
                        className="w-28 text-right text-xs bg-white border border-slate-200 rounded px-2 py-1 font-mono focus:outline-emerald-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="50000"
                        value={row.allowances}
                        disabled={!row.selected}
                        onChange={(e) => updateRow(idx, 'allowances', Number(e.target.value) || 0)}
                        className="w-24 text-right text-xs bg-white border border-slate-200 rounded px-2 py-1 font-mono focus:outline-emerald-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="50000"
                        value={row.bonus}
                        disabled={!row.selected}
                        onChange={(e) => updateRow(idx, 'bonus', Number(e.target.value) || 0)}
                        className="w-24 text-right text-xs bg-white border border-emerald-300 rounded px-2 py-1 font-mono font-semibold text-emerald-800 focus:outline-emerald-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="10000"
                        value={row.deductions}
                        disabled={!row.selected}
                        onChange={(e) => updateRow(idx, 'deductions', Number(e.target.value) || 0)}
                        className="w-24 text-right text-xs bg-white border border-rose-200 rounded px-2 py-1 font-mono text-rose-700 focus:outline-rose-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatIDR(row.netSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary & Process Action */}
        <div className="bg-slate-900 text-white p-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block">Karyawan Dipilih:</span>
              <span className="text-base font-bold font-mono text-white">
                {selectedRows.length} dari {rows.length} Orang
              </span>
            </div>
            <div className="border-l border-slate-700 pl-6">
              <span className="text-slate-400 block">Total Pengeluaran Gaji Masal:</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatIDR(totalBatchOutflow)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={selectedRows.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cairkan & Catat Semua ke Buku Kas & Arus Kas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
