import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Users,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Receipt,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Percent,
  Plus,
  ArrowRight,
  Info,
  Landmark,
  Copy,
  Check,
  Settings,
  Wallet,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { PayrollPayment, PaymentMethod } from '../../types';
import { PaymentChannelManagerModal } from './PaymentChannelManagerModal';
import { formatIDR } from '../../utils/formatters';
import {
  hitungBpjsKesehatan,
  hitungBpjsKetenagakerjaan,
  estimasiPph21,
  terbilangRupiah,
  DEFAULT_ROLE_COMPENSATION,
} from '../../utils/payrollCalculations';

interface PayrollPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPayroll?: PayrollPayment | null;
  onSave: (data: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>) => void;
}

export const PayrollPaymentModal: React.FC<PayrollPaymentModalProps> = ({
  isOpen,
  onClose,
  initialPayroll,
  onSave,
}) => {
  const {
    teamMembers,
    activePaymentChannels,
    paymentChannels,
    currentUser,
  } = useProjects();

  // Employee details
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeEmail, setEmployeeEmail] = useState<string>('');
  const [employeePhone, setEmployeePhone] = useState<string>('');
  const [employeeNik, setEmployeeNik] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [bankName, setBankName] = useState<string>('Bank Mandiri');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [bankAccountHolder, setBankAccountHolder] = useState<string>('');

  // Period & Date
  const [period, setPeriod] = useState<string>('September 2026');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Earnings
  const [basicSalary, setBasicSalary] = useState<number>(10_000_000);
  const [positionAllowance, setPositionAllowance] = useState<number>(2_500_000);
  const [transportAllowance, setTransportAllowance] = useState<number>(1_000_000);
  const [mealAllowance, setMealAllowance] = useState<number>(800_000);
  const [projectBonus, setProjectBonus] = useState<number>(0);
  const [overtimeAmount, setOvertimeAmount] = useState<number>(0);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);

  // Deductions
  const [bpjsKesehatan, setBpjsKesehatan] = useState<number>(120_000);
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState<number>(250_000);
  const [pph21Amount, setPph21Amount] = useState<number>(450_000);
  const [cashAdvanceDeduction, setCashAdvanceDeduction] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Payment channel & state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_MANDIRI');
  const [status, setStatus] = useState<'PAID' | 'PENDING' | 'DRAFT'>('PAID');
  const [notes, setNotes] = useState<string>('');
  const [autoRecordCashLedger, setAutoRecordCashLedger] = useState<boolean>(true);
  const [autoRecordPph21, setAutoRecordPph21] = useState<boolean>(true);

  // Company Payment Channel Management state
  const [isPaymentChannelManagerOpen, setIsPaymentChannelManagerOpen] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  // Available company accounts from Finance & Cashflow
  const availablePaymentChannels = useMemo(() => {
    const list =
      activePaymentChannels && activePaymentChannels.length > 0
        ? activePaymentChannels
        : paymentChannels && paymentChannels.length > 0
        ? paymentChannels
        : [];
    return list.filter((c) => c.status !== 'INACTIVE');
  }, [activePaymentChannels, paymentChannels]);

  // Group bank accounts vs cash & others
  const bankChannels = useMemo(() => {
    return availablePaymentChannels.filter((c) => c.category === 'BANK_TRANSFER');
  }, [availablePaymentChannels]);

  const cashAndOtherChannels = useMemo(() => {
    return availablePaymentChannels.filter((c) => c.category !== 'BANK_TRANSFER');
  }, [availablePaymentChannels]);

  // Selected company bank account details
  const selectedCompanyChannel = useMemo(() => {
    return (
      availablePaymentChannels.find((c) => c.id === paymentMethod) ||
      paymentChannels.find((c) => c.id === paymentMethod) ||
      availablePaymentChannels[0]
    );
  }, [availablePaymentChannels, paymentChannels, paymentMethod]);

  const handleCopyAccountNumber = (accNum: string) => {
    if (!accNum) return;
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Error & calculation feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [calculationFeedback, setCalculationFeedback] = useState<string | null>(null);
  const [isCalculatedJustNow, setIsCalculatedJustNow] = useState<boolean>(false);

  // Load initial data if editing
  useEffect(() => {
    if (initialPayroll) {
      setSelectedEmployeeId(initialPayroll.employeeId || 'custom');
      setEmployeeName(initialPayroll.employeeName || '');
      setEmployeeEmail(initialPayroll.employeeEmail || '');
      setEmployeePhone(initialPayroll.employeePhone || '');
      setEmployeeNik(initialPayroll.employeeNik || '');
      setRoleTitle(initialPayroll.roleTitle || '');
      setDepartment(initialPayroll.department || '');
      setBankName(initialPayroll.bankName || 'Bank Mandiri');
      setBankAccountNumber(initialPayroll.bankAccountNumber || '');
      setBankAccountHolder(initialPayroll.bankAccountHolder || '');
      setPeriod(initialPayroll.period || 'September 2026');
      setPaymentDate(initialPayroll.paymentDate || new Date().toISOString().slice(0, 10));
      setBasicSalary(initialPayroll.basicSalary || 0);
      setPositionAllowance(initialPayroll.positionAllowance || 0);
      setTransportAllowance(initialPayroll.transportAllowance || 0);
      setMealAllowance(initialPayroll.mealAllowance || 0);
      setProjectBonus(initialPayroll.projectBonus || 0);
      setOvertimeAmount(initialPayroll.overtimeAmount || 0);
      setOtherAllowances(initialPayroll.otherAllowances || 0);
      setBpjsKesehatan(initialPayroll.bpjsKesehatan || 0);
      setBpjsKetenagakerjaan(initialPayroll.bpjsKetenagakerjaan || 0);
      setPph21Amount(initialPayroll.pph21Amount || 0);
      setCashAdvanceDeduction(initialPayroll.cashAdvanceDeduction || 0);
      setOtherDeductions(initialPayroll.otherDeductions || 0);
      setPaymentMethod(initialPayroll.paymentMethod || 'BANK_TRANSFER_MANDIRI');
      setStatus(initialPayroll.status || 'PAID');
      setNotes(initialPayroll.notes || '');
    } else {
      // Default to first team member if available
      if (teamMembers.length > 0) {
        const first = teamMembers[0];
        handleSelectEmployee(first.id);
      }
    }
  }, [initialPayroll, isOpen]);

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setErrorMsg(null);

    if (empId === 'custom') {
      setEmployeeName('');
      setEmployeeEmail('');
      setEmployeePhone('');
      setRoleTitle('Konsultan / Staf Ahli');
      setDepartment('Operasional Konsultasi');
      return;
    }

    const member = teamMembers.find((m) => m.id === empId);
    if (member) {
      setEmployeeName(member.name);
      setEmployeeEmail(member.email || '');
      setEmployeePhone(member.phone || '');
      setRoleTitle(member.roleTitle || member.role);
      setDepartment(member.department || 'Konsultansi TKDN');
      setBankAccountHolder(member.name);

      // Apply default compensation benchmark if available
      const benchmark = DEFAULT_ROLE_COMPENSATION[member.role] || DEFAULT_ROLE_COMPENSATION.TECHNICAL_CONSULTANT;
      setBasicSalary(benchmark.basicSalary);
      setPositionAllowance(benchmark.positionAllowance);
      setTransportAllowance(benchmark.transportAllowance);
      setMealAllowance(benchmark.mealAllowance);

      // Recalculate BPJS and PPh21
      const bpjsKes = hitungBpjsKesehatan(benchmark.basicSalary, benchmark.positionAllowance);
      const bpjsTk = hitungBpjsKetenagakerjaan(benchmark.basicSalary, benchmark.positionAllowance);
      const gross = benchmark.basicSalary + benchmark.positionAllowance + benchmark.transportAllowance + benchmark.mealAllowance;
      const tax = estimasiPph21(gross);

      setBpjsKesehatan(bpjsKes);
      setBpjsKetenagakerjaan(bpjsTk);
      setPph21Amount(tax);
    }
  };

  // Calculations
  const totalEarnings = useMemo(() => {
    return (
      (basicSalary || 0) +
      (positionAllowance || 0) +
      (transportAllowance || 0) +
      (mealAllowance || 0) +
      (projectBonus || 0) +
      (overtimeAmount || 0) +
      (otherAllowances || 0)
    );
  }, [
    basicSalary,
    positionAllowance,
    transportAllowance,
    mealAllowance,
    projectBonus,
    overtimeAmount,
    otherAllowances,
  ]);

  const totalDeductions = useMemo(() => {
    return (
      (bpjsKesehatan || 0) +
      (bpjsKetenagakerjaan || 0) +
      (pph21Amount || 0) +
      (cashAdvanceDeduction || 0) +
      (otherDeductions || 0)
    );
  }, [
    bpjsKesehatan,
    bpjsKetenagakerjaan,
    pph21Amount,
    cashAdvanceDeduction,
    otherDeductions,
  ]);

  const netSalary = useMemo(() => {
    return Math.max(0, totalEarnings - totalDeductions);
  }, [totalEarnings, totalDeductions]);

  // Quick action: auto calculate BPJS & Tax with instant visual feedback
  const handleAutoCalculateDeductions = () => {
    const bpjsKes = hitungBpjsKesehatan(basicSalary, positionAllowance);
    const bpjsTk = hitungBpjsKetenagakerjaan(basicSalary, positionAllowance);
    const tax = estimasiPph21(totalEarnings);

    setBpjsKesehatan(bpjsKes);
    setBpjsKetenagakerjaan(bpjsTk);
    setPph21Amount(tax);

    setIsCalculatedJustNow(true);
    setCalculationFeedback(
      `Otomatis dihitung: BPJS Kes (1% = ${formatIDR(bpjsKes)}), BPJS TK (2% = ${formatIDR(bpjsTk)}), PPh 21 TER PP 58/2023 (${formatIDR(tax)})`
    );

    setTimeout(() => {
      setIsCalculatedJustNow(false);
    }, 3000);

    setTimeout(() => {
      setCalculationFeedback(null);
    }, 6000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeName.trim()) {
      setErrorMsg('Nama karyawan wajib diisi.');
      return;
    }

    if (totalEarnings <= 0) {
      setErrorMsg('Total penghasilan gaji harus lebih dari 0.');
      return;
    }

    if (netSalary <= 0) {
      setErrorMsg('Gaji bersih (Take Home Pay) tidak boleh bernilai 0 atau minus.');
      return;
    }

    onSave({
      employeeId: selectedEmployeeId,
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail.trim(),
      employeePhone: employeePhone.trim(),
      employeeNik: employeeNik.trim(),
      roleTitle: roleTitle.trim() || 'Konsultan',
      department: department.trim() || 'Konsultasi',
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim() || employeeName.trim(),
      period,
      paymentDate,
      basicSalary,
      positionAllowance,
      transportAllowance,
      mealAllowance,
      projectBonus,
      overtimeAmount,
      otherAllowances,
      totalEarnings,
      bpjsKesehatan,
      bpjsKetenagakerjaan,
      pph21Amount,
      cashAdvanceDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      paymentMethod,
      paymentChannelId: paymentMethod,
      status,
      notes: notes.trim(),
      recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      paidAt: status === 'PAID' ? paymentDate : undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {initialPayroll ? 'Edit Data Slip Gaji Karyawan' : 'Input Pembayaran Gaji Karyawan (Payroll)'}
              </h3>
              <p className="text-xs text-slate-400">
                Terhubung otomatis ke Buku Kas, Arus Kas (Cash Flow), dan Laporan Keuangan
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Profil & Periode */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                1. Data Karyawan & Periode Penggajian
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Pilih dari daftar anggota tim atau ketik kustom
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Karyawan / Tim
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-medium"
                >
                  <option value="" disabled>
                    -- Pilih Karyawan --
                  </option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.roleTitle || m.role})
                    </option>
                  ))}
                  <option value="custom">+ Input Karyawan / Konsultan Kustom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Karyawan *
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Nama Lengkap Karyawan"
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIK / No. Identitas KTP
                </label>
                <input
                  type="text"
                  value={employeeNik}
                  onChange={(e) => setEmployeeNik(e.target.value)}
                  placeholder="Contoh: 3171012304920001"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Lead Assessor / Senior Consultant"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departemen / Divisi
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Verifikasi & Sertifikasi"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Periode Gaji (Bulan/Tahun)
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="September 2026"
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pencairan / Bayar
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Rincian Penghasilan vs Pemotongan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Kolom Kiri: Komponen Penerimaan / Gaji */}
            <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-mono flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  2. Rincian Penerimaan (Penghasilan)
                </span>
                <span className="text-xs font-bold text-emerald-800 font-mono">
                  {formatIDR(totalEarnings)}
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Gaji Pokok (IDR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Tunjangan Jabatan
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={positionAllowance}
                      onChange={(e) => setPositionAllowance(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Tunj. Transport & Dinas
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={transportAllowance}
                      onChange={(e) => setTransportAllowance(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Tunjangan Makan
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={mealAllowance}
                      onChange={(e) => setMealAllowance(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Upah Lembur
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={overtimeAmount}
                      onChange={(e) => setOvertimeAmount(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-0.5">
                      Bonus/Insentif Proyek
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={projectBonus}
                      onChange={(e) => setProjectBonus(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-emerald-900 font-mono font-semibold focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Tunjangan Lainnya
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={otherAllowances}
                      onChange={(e) => setOtherAllowances(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>Subtotal Penghasilan (Bruto):</span>
                <span className="font-mono text-sm">{formatIDR(totalEarnings)}</span>
              </div>
            </div>

            {/* Kolom Kanan: Komponen Pemotongan */}
            <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 font-mono flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-rose-600" />
                  3. Rincian Pemotongan
                </span>
                <button
                  type="button"
                  onClick={handleAutoCalculateDeductions}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isCalculatedJustNow
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105'
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300/80 active:scale-95'
                  }`}
                  title="Hitung otomatis BPJS 1%, BPJS TK 2%, dan PPh 21 TER"
                >
                  {isCalculatedJustNow ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-white animate-bounce" />
                      <span>Terkalkulasi Otomatis!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      <span>Hitung Otomatis BPJS & PPh</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status banner ketika tombol diklik */}
              {calculationFeedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300/80 rounded-lg text-[11px] text-emerald-900 flex items-start gap-2 shadow-xs animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold block text-emerald-950">Kalkulasi Otomatis Berhasil:</span>
                    <span>{calculationFeedback}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      BPJS Kesehatan (1%)
                    </label>
                    <span className="text-[10px] text-slate-400">1% Gaji & Tunjangan Tetap</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={bpjsKesehatan}
                    onChange={(e) => setBpjsKesehatan(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-rose-900 font-mono font-medium focus:outline-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      BPJS Ketenagakerjaan (2%)
                    </label>
                    <span className="text-[10px] text-slate-400">JHT Pegawai 2%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={bpjsKetenagakerjaan}
                    onChange={(e) => setBpjsKetenagakerjaan(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-rose-900 font-mono font-medium focus:outline-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Pajak Penghasilan (PPh Pasal 21)
                    </label>
                    <span className="text-[10px] text-slate-400">Skema TER PP 58/2023</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={pph21Amount}
                    onChange={(e) => setPph21Amount(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-rose-900 font-mono font-medium focus:outline-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Potongan Kasbon
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={cashAdvanceDeduction}
                      onChange={(e) => setCashAdvanceDeduction(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-rose-900 font-mono focus:outline-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                      Potongan Lainnya
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-rose-900 font-mono focus:outline-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200/80 flex justify-between items-center text-xs font-bold text-rose-950">
                <span>Subtotal Pemotongan:</span>
                <span className="font-mono text-sm">({formatIDR(totalDeductions)})</span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Summary Box (Take Home Pay) */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
                    GAJI BERSIH / TAKE HOME PAY (THP)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Otomatis Masuk Buku Kas
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Bruto {formatIDR(totalEarnings)} - Potongan {formatIDR(totalDeductions)}
                </p>
                <p className="text-[11px] text-emerald-200 italic">
                  Terbilang: <span className="font-semibold text-white">"{terbilangRupiah(netSalary)}"</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-300 tracking-tight">
                  {formatIDR(netSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Akun Sumber Pembayaran & Rekening Karyawan */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                4. Saluran Kas Perusahaan &amp; Rekening Karyawan
              </h4>
              <button
                type="button"
                onClick={() => setIsPaymentChannelManagerOpen(true)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                title="Kelola Saluran Rekening Perusahaan di Finance & Cashflow"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kelola Rekening Bank Perusahaan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis" title="Rekening Kas Perusahaan (Sumber Dana) *">
                    Rekening Kas Perusahaan (Sumber Dana) *
                  </label>
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    if (e.target.value === '__OPEN_MANAGER__') {
                      setIsPaymentChannelManagerOpen(true);
                    } else {
                      setPaymentMethod(e.target.value as PaymentMethod);
                    }
                  }}
                  className="w-full h-10 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-medium"
                >
                  {paymentMethod && !availablePaymentChannels.some((c) => c.id === paymentMethod) && (
                    <option value={paymentMethod}>
                      {paymentMethod}
                    </option>
                  )}

                  {bankChannels.length > 0 && (
                    <optgroup label="── Rekening Bank Perusahaan (Transfer / Giro) ──">
                      {bankChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shortName || c.name} — No. Rek: {c.accountNumber || '-'} {c.accountHolder ? `(${c.accountHolder})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {cashAndOtherChannels.length > 0 && (
                    <optgroup label="── Kas Tunai & Saluran Kas Lainnya ──">
                      {cashAndOtherChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__OPEN_MANAGER__" className="font-bold text-emerald-700">
                    ⚙️ + Kelola / Tambah Rekening Perusahaan Baru...
                  </option>
                </select>
              </div>

              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    Bank Tujuan Karyawan
                  </label>
                </div>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: Bank BCA / Mandiri / BRI"
                  className="w-full h-10 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    Nomor Rekening Tujuan
                  </label>
                </div>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Nomor rekening pegawai"
                  className="w-full h-10 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            {/* Kartu Detail Rekening Kas Perusahaan yang Terpilih */}
            {selectedCompanyChannel && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      {selectedCompanyChannel.category === 'CASH' ? (
                        <Wallet className="w-4 h-4" />
                      ) : (
                        <Landmark className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {selectedCompanyChannel.name}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full">
                          {selectedCompanyChannel.category === 'BANK_TRANSFER' ? 'Transfer / Giro Bank' : 'Kas Operasional'}
                        </span>
                        {selectedCompanyChannel.isDefault && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Rekening Utama
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs flex-wrap">
                        {selectedCompanyChannel.accountNumber ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-slate-500 font-sans text-[11px]">No. Rekening Perusahaan:</span>
                            <span className="font-bold tracking-wider text-emerald-900">{selectedCompanyChannel.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyAccountNumber(selectedCompanyChannel.accountNumber!)}
                              className="ml-1 text-slate-400 hover:text-emerald-700 p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Salin Nomor Rekening Perusahaan"
                            >
                              {copiedAccount ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Kas Tunai / Brankas Kantor</span>
                        )}

                        {selectedCompanyChannel.accountHolder && (
                          <div className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Atas Nama: </span>
                            <span className="font-semibold text-slate-800">{selectedCompanyChannel.accountHolder}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Tersinkronisasi Saluran Kas &amp; Arus Kas
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Pembayaran Gaji
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 font-semibold"
                >
                  <option value="PAID">LUNAS / DITRANSFER (Tercatat di Arus Kas Terealisasi)</option>
                  <option value="PENDING">PENDING (Menunggu Otorisasi Transfer)</option>
                  <option value="DRAFT">DRAFT (Konsep Perhitungan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Pembayaran
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan slip gaji..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Konfirmasi Integrasi Otomatis */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h5 className="text-xs font-bold text-emerald-950 font-mono uppercase tracking-wide">
                Integrasi Otomatis ke Keuangan & Arus Kas
              </h5>
            </div>
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoRecordCashLedger}
                  onChange={(e) => setAutoRecordCashLedger(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  Otomatis membukukan pengeluaran ke <strong>Buku Kas (General Ledger)</strong> & <strong>Arus Kas Harian (Cash Flow)</strong> dengan kategori <span className="font-mono font-bold text-emerald-800">GAJI_KARYAWAN</span> senilai <strong>{formatIDR(netSalary)}</strong>.
                </span>
              </label>

              {pph21Amount > 0 && (
                <div className="flex items-start gap-2.5 pt-1 font-medium text-slate-700 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <input
                    type="checkbox"
                    id="autoRecordPph21"
                    checked={autoRecordPph21}
                    onChange={(e) => setAutoRecordPph21(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="autoRecordPph21" className="cursor-pointer text-xs text-slate-700 space-y-0.5">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      Integrasi Pajak PPh 21 Otomatis (Anti Double-Input)
                    </span>
                    <span className="text-slate-600 block">
                      Kewajiban setor <strong>PPh Pasal 21</strong> senilai <strong>{formatIDR(pph21Amount)}</strong> otomatis tercatat di menu <strong>Pajak &amp; Hutang Pajak (Tax Management)</strong> serta diakui di <strong>Laporan Keuangan (Neraca Liabilitas)</strong> tanpa perlu input ulang manual.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Proses Pembayaran Gaji</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Kelola Saluran Rekening Bank Perusahaan */}
      <PaymentChannelManagerModal
        isOpen={isPaymentChannelManagerOpen}
        onClose={() => setIsPaymentChannelManagerOpen(false)}
        onSelectChannel={(channelId) => {
          setPaymentMethod(channelId as PaymentMethod);
          setIsPaymentChannelManagerOpen(false);
        }}
      />
    </div>
  );
};
