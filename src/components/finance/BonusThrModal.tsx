import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Gift,
  Award,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Building2,
  Info,
  CheckCircle2,
  Percent,
  Sparkles,
  HelpCircle,
  Briefcase,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { PayrollPayment, PayrollPaymentCategory, PaymentMethod } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatRupiah } from '../../utils/formatters';
import { hitungThrProrata, estimasiPph21, terbilangRupiah } from '../../utils/payrollCalculations';

interface BonusThrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payrollData: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>) => void;
  initialData?: PayrollPayment | null;
}

const HOLIDAY_PRESETS = [
  'Idul Fitri 1447 H / 2026 M',
  'Hari Raya Natal 2026',
  'Tahun Baru Masehi 2027',
  'Tahun Baru Imlek 2577 Kongzili',
  'Hari Raya Nyepi Tahun Baru Caka 1948',
  'Hari Raya Waisak 2570 BE',
  'Lainnya (Ketik Manual)',
];

export const BonusThrModal: React.FC<BonusThrModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const {
    teamMembers,
    employeeSalaryConfigs,
    paymentChannels,
    projects,
    currentUser,
  } = useProjects();

  // Mode & Category
  const isEditing = Boolean(initialData);
  const [category, setCategory] = useState<PayrollPaymentCategory>(
    initialData?.paymentCategory || 'THR'
  );

  // Employee Selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialData?.employeeId || ''
  );
  const [employeeName, setEmployeeName] = useState<string>(initialData?.employeeName || '');
  const [employeeNik, setEmployeeNik] = useState<string>(initialData?.employeeNik || '');
  const [roleTitle, setRoleTitle] = useState<string>(initialData?.roleTitle || '');
  const [department, setDepartment] = useState<string>(initialData?.department || 'Konsultasi');
  const [bankName, setBankName] = useState<string>(initialData?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(
    initialData?.bankAccountNumber || ''
  );
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(
    initialData?.bankAccountHolder || ''
  );

  // Base Reference Salary (Gaji Pokok acuan)
  const [baseSalary, setBaseSalary] = useState<number>(initialData?.basicSalary || 0);

  // THR Specific States
  const [holidayPreset, setHolidayPreset] = useState<string>(() => {
    if (initialData?.holidayName) {
      return HOLIDAY_PRESETS.includes(initialData.holidayName)
        ? initialData.holidayName
        : 'Lainnya (Ketik Manual)';
    }
    return HOLIDAY_PRESETS[0];
  });
  const [customHolidayName, setCustomHolidayName] = useState<string>(
    initialData?.holidayName && !HOLIDAY_PRESETS.includes(initialData.holidayName)
      ? initialData.holidayName
      : ''
  );
  const [serviceMonths, setServiceMonths] = useState<number>(
    initialData?.serviceDurationMonths !== undefined ? initialData.serviceDurationMonths : 12
  );
  const [thrMultiplier, setThrMultiplier] = useState<number>(1);
  const [autoCalculateThr, setAutoCalculateThr] = useState<boolean>(true);
  const [nominalThr, setNominalThr] = useState<number>(
    initialData?.thrAmount || initialData?.totalEarnings || 0
  );

  // Bonus Specific States
  const [bonusCriteria, setBonusCriteria] = useState<string>(
    initialData?.bonusCriteria || ''
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [nominalBonus, setNominalBonus] = useState<number>(
    initialData?.bonusAmount || initialData?.projectBonus || initialData?.totalEarnings || 0
  );

  // Deductions & Taxes
  const [applyPph21, setApplyPph21] = useState<boolean>(
    Boolean(initialData?.pph21Amount && initialData.pph21Amount > 0)
  );
  const [pph21Amount, setPph21Amount] = useState<number>(initialData?.pph21Amount || 0);
  const [cashAdvanceDeduction, setCashAdvanceDeduction] = useState<number>(
    initialData?.cashAdvanceDeduction || 0
  );
  const [otherDeductions, setOtherDeductions] = useState<number>(
    initialData?.otherDeductions || 0
  );

  // Payment Details
  const [paymentDate, setPaymentDate] = useState<string>(
    initialData?.paymentDate || new Date().toISOString().slice(0, 10)
  );
  const [period, setPeriod] = useState<string>(
    initialData?.period || (category === 'THR' ? 'THR Idul Fitri 2026' : `Bonus ${new Date().getFullYear()}`)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialData?.paymentMethod || 'BANK_TRANSFER'
  );
  const [paymentChannelId, setPaymentChannelId] = useState<string>(
    initialData?.paymentChannelId || (paymentChannels && paymentChannels[0] ? paymentChannels[0].id : '')
  );
  const [status, setStatus] = useState<'PAID' | 'PENDING'>(
    initialData?.status === 'PENDING' ? 'PENDING' : 'PAID'
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate from initialData when opened or changed
  useEffect(() => {
    if (initialData) {
      setCategory(initialData.paymentCategory || 'THR');
      setSelectedEmployeeId(initialData.employeeId);
      setEmployeeName(initialData.employeeName);
      setEmployeeNik(initialData.employeeNik || '');
      setRoleTitle(initialData.roleTitle);
      setDepartment(initialData.department);
      setBankName(initialData.bankName || '');
      setBankAccountNumber(initialData.bankAccountNumber || '');
      setBankAccountHolder(initialData.bankAccountHolder || initialData.employeeName);
      setBaseSalary(initialData.basicSalary || 0);
      setNominalThr(initialData.thrAmount || (initialData.paymentCategory === 'THR' ? initialData.totalEarnings : 0));
      setNominalBonus(
        initialData.bonusAmount ||
          initialData.projectBonus ||
          (initialData.paymentCategory !== 'THR' ? initialData.totalEarnings : 0)
      );
      setServiceMonths(initialData.serviceDurationMonths !== undefined ? initialData.serviceDurationMonths : 12);
      setBonusCriteria(initialData.bonusCriteria || '');
      setPph21Amount(initialData.pph21Amount || 0);
      setApplyPph21(Boolean(initialData.pph21Amount && initialData.pph21Amount > 0));
      setCashAdvanceDeduction(initialData.cashAdvanceDeduction || 0);
      setOtherDeductions(initialData.otherDeductions || 0);
      setPaymentDate(initialData.paymentDate);
      setPeriod(initialData.period);
      setPaymentMethod(initialData.paymentMethod);
      setPaymentChannelId(initialData.paymentChannelId || '');
      setStatus(initialData.status === 'PENDING' ? 'PENDING' : 'PAID');
      setNotes(initialData.notes || '');
    } else {
      // Default dates
      setPaymentDate(new Date().toISOString().slice(0, 10));
      if (paymentChannels && paymentChannels.length > 0 && !paymentChannelId) {
        setPaymentChannelId(paymentChannels[0].id);
      }
    }
  }, [initialData, isOpen]);

  // Handle Employee Selection
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setErrorMsg(null);

    const emp = teamMembers.find((m) => m.id === empId);
    if (!emp) return;

    setEmployeeName(emp.name);
    setRoleTitle(emp.roleTitle || emp.role);
    setDepartment(emp.department || 'Konsultasi');
    setEmployeeNik(emp.nik || '');

    // Bank details
    if (emp.bankName) setBankName(emp.bankName);
    if (emp.bankAccountNumber) setBankAccountNumber(emp.bankAccountNumber);
    setBankAccountHolder(emp.bankAccountHolder || emp.name);

    // Look up salary config
    const currentYear = new Date().getFullYear();
    const config = employeeSalaryConfigs.find(
      (c) => c.employeeId === empId && c.year === currentYear
    );

    let foundBase = 7_500_000;
    if (config) {
      foundBase = config.basicSalary;
    }

    setBaseSalary(foundBase);

    // Calculate Join Date / Service Months if available
    let months = 12;
    const joinDateStr = (emp as any).joinDate || emp.registeredAt;
    if (joinDateStr) {
      const join = new Date(joinDateStr);
      const now = new Date();
      const diffMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
      months = Math.max(1, diffMonths);
    }
    setServiceMonths(months);

    // Auto-calculate initial THR
    if (category === 'THR') {
      const calc = hitungThrProrata(foundBase, 0, months, thrMultiplier);
      setNominalThr(calc.nominalThr);
    } else {
      // Default bonus
      setNominalBonus(foundBase);
    }
  };

  // Recalculate THR when baseSalary, serviceMonths, thrMultiplier change
  useEffect(() => {
    if (category === 'THR' && autoCalculateThr && baseSalary > 0) {
      const calc = hitungThrProrata(baseSalary, 0, serviceMonths, thrMultiplier);
      setNominalThr(calc.nominalThr);
    }
  }, [category, autoCalculateThr, baseSalary, serviceMonths, thrMultiplier]);

  // Gross Earnings (Total Bruto)
  const totalEarnings = useMemo(() => {
    if (category === 'THR') {
      return nominalThr || 0;
    }
    return nominalBonus || 0;
  }, [category, nominalThr, nominalBonus]);

  // Recalculate PPh 21 when gross changes and applyPph21 is checked
  useEffect(() => {
    if (applyPph21 && totalEarnings > 0) {
      const estTax = estimasiPph21(totalEarnings);
      setPph21Amount(estTax);
    } else if (!applyPph21) {
      setPph21Amount(0);
    }
  }, [applyPph21, totalEarnings]);

  // Deductions & Net Salary
  const totalDeductions = useMemo(() => {
    return (pph21Amount || 0) + (cashAdvanceDeduction || 0) + (otherDeductions || 0);
  }, [pph21Amount, cashAdvanceDeduction, otherDeductions]);

  const netSalary = useMemo(() => {
    return Math.max(0, totalEarnings - totalDeductions);
  }, [totalEarnings, totalDeductions]);

  // Active Holiday Name
  const activeHolidayName = useMemo(() => {
    if (holidayPreset === 'Lainnya (Ketik Manual)') {
      return customHolidayName.trim() || 'Tunjangan Hari Raya';
    }
    return holidayPreset;
  }, [holidayPreset, customHolidayName]);

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeName.trim()) {
      setErrorMsg('Pilih karyawan atau isi nama penerima bonus/THR.');
      return;
    }

    if (totalEarnings <= 0) {
      setErrorMsg('Nominal THR atau Bonus harus lebih dari Rp 0.');
      return;
    }

    if (netSalary <= 0) {
      setErrorMsg('Nominal bersih yang dicairkan tidak boleh 0 atau minus.');
      return;
    }

    const holiday = category === 'THR' ? activeHolidayName : undefined;
    const isProrated = category === 'THR' ? serviceMonths < 12 : undefined;

    // Construct period label if not typed
    const finalPeriod =
      period.trim() ||
      (category === 'THR'
        ? `THR - ${activeHolidayName}`
        : `${category === 'PERFORMANCE_BONUS' ? 'Bonus Kinerja' : 'Bonus Proyek'} ${new Date().getFullYear()}`);

    const payload: Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'> = {
      employeeId: selectedEmployeeId || `emp-${Date.now()}`,
      employeeName: employeeName.trim(),
      employeeNik: employeeNik.trim(),
      roleTitle: roleTitle.trim() || 'Konsultan',
      department: department.trim() || 'Konsultasi',
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim() || employeeName.trim(),
      period: finalPeriod,
      paymentDate,
      paymentCategory: category,

      // Earnings
      basicSalary: baseSalary,
      positionAllowance: 0,
      transportAllowance: 0,
      mealAllowance: 0,
      projectBonus: category === 'PROJECT_BONUS' ? nominalBonus : 0,
      overtimeAmount: 0,
      otherAllowances: 0,
      thrAmount: category === 'THR' ? nominalThr : 0,
      bonusAmount: category !== 'THR' ? nominalBonus : 0,
      serviceDurationMonths: category === 'THR' ? serviceMonths : undefined,
      isProratedThr: isProrated,
      holidayName: holiday,
      bonusCriteria: category !== 'THR' ? bonusCriteria.trim() : undefined,
      totalEarnings,

      // Deductions
      bpjsKesehatan: 0,
      bpjsKetenagakerjaan: 0,
      pph21Amount: applyPph21 ? pph21Amount : 0,
      cashAdvanceDeduction,
      otherDeductions,
      totalDeductions,

      // Net
      netSalary,

      // Channel & Status
      paymentMethod,
      paymentChannelId: paymentChannelId || undefined,
      status,
      notes: notes.trim(),
      recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? 'Edit Data Bonus / THR' : 'Input Pencairan Bonus & Tunjangan Hari Raya (THR)'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Kompensasi Khusus
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan resmi kompensasi non-gaji bulanan, otomatis terintegrasi ke Buku Kas & Pajak PPh 21
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Pilih Jenis Kompensasi */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Jenis Pencairan Kompensasi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCategory('THR');
                  setPeriod(`THR ${activeHolidayName}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  category === 'THR'
                    ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Gift className={`w-4 h-4 ${category === 'THR' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {category === 'THR' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold">THR Keagamaan</div>
                  <div className="text-[10px] text-slate-400">Idul Fitri, Natal, dsb.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('PERFORMANCE_BONUS');
                  setPeriod(`Bonus Kinerja ${new Date().getFullYear()}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  category === 'PERFORMANCE_BONUS'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Award className={`w-4 h-4 ${category === 'PERFORMANCE_BONUS' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {category === 'PERFORMANCE_BONUS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Bonus Kinerja</div>
                  <div className="text-[10px] text-slate-400">KPI & Prestasi Staf</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('PROJECT_BONUS');
                  setPeriod(`Bonus Proyek ${new Date().getFullYear()}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  category === 'PROJECT_BONUS'
                    ? 'bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Briefcase className={`w-4 h-4 ${category === 'PROJECT_BONUS' ? 'text-blue-400' : 'text-slate-400'}`} />
                  {category === 'PROJECT_BONUS' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Bonus Proyek</div>
                  <div className="text-[10px] text-slate-400">Insentif Proyek TKDN</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('ANNUAL_BONUS');
                  setPeriod(`Bonus Akhir Tahun ${new Date().getFullYear()}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  category === 'ANNUAL_BONUS'
                    ? 'bg-purple-500/15 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Layers className={`w-4 h-4 ${category === 'ANNUAL_BONUS' ? 'text-purple-400' : 'text-slate-400'}`} />
                  {category === 'ANNUAL_BONUS' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Bonus Tahunan</div>
                  <div className="text-[10px] text-slate-400">Dividen & Profit-share</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Karyawan Penerima */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Data Penerima (Karyawan / Konsultan)
              </label>
              {selectedEmployeeId && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Data profil tersinkron
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Pilih dari Master Karyawan</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role} - {m.department || 'Konsultan'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Nama Lengkap Karyawan..."
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Jabatan / Role</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Lead Consultant"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">NIK / No. Induk Karyawan</label>
                <input
                  type="text"
                  value={employeeNik}
                  onChange={(e) => setEmployeeNik(e.target.value)}
                  placeholder="e.g. 3171012345670001"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bank Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700/60">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bank Penerima</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCA / Mandiri / BRI"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Atas Nama Rekening</label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="Nama Pemilik Rekening"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Detail Perhitungan (THR vs Bonus) */}
          {category === 'THR' ? (
            /* SEKSI SPESIFIK THR */
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  Kalkulasi Tunjangan Hari Raya (Permenaker No. 6/2016)
                </label>
                <span className="text-[11px] text-amber-400/90 font-mono">
                  {serviceMonths >= 12 ? 'Penuh 100% (Masa Kerja ≥ 12 Bulan)' : `Prorata ${serviceMonths}/12 Bulan`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Peringatan Hari Raya Keagamaan</label>
                  <select
                    value={holidayPreset}
                    onChange={(e) => {
                      setHolidayPreset(e.target.value);
                      if (e.target.value !== 'Lainnya (Ketik Manual)') {
                        setPeriod(`THR ${e.target.value}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {HOLIDAY_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {holidayPreset === 'Lainnya (Ketik Manual)' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Nama Hari Raya Kustom</label>
                    <input
                      type="text"
                      value={customHolidayName}
                      onChange={(e) => {
                        setCustomHolidayName(e.target.value);
                        setPeriod(`THR ${e.target.value}`);
                      }}
                      placeholder="e.g. Idul Fitri 1447 H"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Gaji Acuan THR (Pokok & Tetap)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={Number.isNaN(baseSalary) ? '' : (baseSalary || '')}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Masa Kerja (Bulan)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={Number.isNaN(serviceMonths) ? '' : (serviceMonths ?? '')}
                      onChange={(e) => setServiceMonths(Math.max(1, Number(e.target.value)))}
                      min={1}
                      max={360}
                      className="w-28 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">
                      {serviceMonths >= 12 ? 'Bulan (Hak THR 1x Gaji Penuh)' : `Bulan (Prorata ${(serviceMonths / 12 * 100).toFixed(1)}%)`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Faktor Pengali (Multiplier)</label>
                  <select
                    value={thrMultiplier}
                    onChange={(e) => setThrMultiplier(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value={1}>1.0x (Standar Permenaker)</option>
                    <option value={1.25}>1.25x Upah</option>
                    <option value={1.5}>1.5x Upah (Apresiasi Senior)</option>
                    <option value={2}>2.0x Upah (Double THR)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-amber-300 font-bold">Nominal THR Kotor (Bruto)</label>
                    <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCalculateThr}
                        onChange={(e) => setAutoCalculateThr(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                      Hitung Otomatis
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-amber-400 font-mono font-bold">Rp</span>
                    <input
                      type="number"
                      value={Number.isNaN(nominalThr) ? '' : (nominalThr || '')}
                      onChange={(e) => {
                        setAutoCalculateThr(false);
                        setNominalThr(Number(e.target.value));
                      }}
                      placeholder="0"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-amber-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SEKSI SPESIFIK BONUS */
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Rincian & Kriteria Bonus Karyawan
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">
                    Alasan / Kriteria Pencapaian Bonus
                  </label>
                  <input
                    type="text"
                    value={bonusCriteria}
                    onChange={(e) => setBonusCriteria(e.target.value)}
                    placeholder="e.g. Pencapaian Target Audit Sertifikasi TKDN Q3 / Prestasi Konsultasi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {category === 'PROJECT_BONUS' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">
                      Kaitkan dengan Proyek Klien (Opsional)
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        const p = projects.find((proj) => proj.id === e.target.value);
                        if (p && !bonusCriteria) {
                          setBonusCriteria(`Insentif Sukses Proyek ${p.name}`);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Tidak Terkait Proyek Spesifik --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.clientName || 'Klien'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Gaji Acuan / Standar Gaji</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={Number.isNaN(baseSalary) ? '' : (baseSalary || '')}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-emerald-300 font-bold mb-1">
                    Nominal Bonus yang Diberikan (Bruto)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-emerald-400 font-mono font-bold">Rp</span>
                    <input
                      type="number"
                      value={Number.isNaN(nominalBonus) ? '' : (nominalBonus || '')}
                      onChange={(e) => setNominalBonus(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Pajak PPh 21 & Potongan */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-rose-400" />
                Pajak PPh 21 & Potongan Terkait
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyPphCheck"
                  checked={applyPph21}
                  onChange={(e) => setApplyPph21(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="applyPphCheck" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Potong Pajak PPh 21 (TER Tidak Teratur)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Potongan PPh 21</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    value={Number.isNaN(pph21Amount) ? '' : (pph21Amount || '')}
                    onChange={(e) => {
                      setApplyPph21(true);
                      setPph21Amount(Number(e.target.value));
                    }}
                    placeholder="0"
                    min={0}
                    disabled={!applyPph21}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono disabled:opacity-50 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {applyPph21 ? 'Otomatis terhubung ke Modul Pajak PPh 21' : 'Nett (Ditanggung Perusahaan)'}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Potongan Kasbon / Pinjaman</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    value={Number.isNaN(cashAdvanceDeduction) ? '' : (cashAdvanceDeduction || '')}
                    onChange={(e) => setCashAdvanceDeduction(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Potongan Lainnya</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    value={Number.isNaN(otherDeductions) ? '' : (otherDeductions || '')}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Kanal Pembayaran & Status Pencairan */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-teal-400" />
              Kanal Kas Pembayaran & Pelaksanaan
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="BANK_TRANSFER">Transfer Bank Perusahaan</option>
                  <option value="CASH">Kas Tunai (Petty Cash)</option>
                  <option value="CHECK">Cek / Giro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Rekening Sumber Kas Keluar</label>
                <select
                  value={paymentChannelId}
                  onChange={(e) => setPaymentChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Pilih Rekening Kas --</option>
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.accountNumber || c.shortName || c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tanggal Pencairan / Bayar</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Label Periode Dokumen</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g. THR Idul Fitri 2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Status Pencairan</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('PAID')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      status === 'PAID'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID (Lunas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('PENDING')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      status === 'PENDING'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Draft / Rencana
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan pencairan..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 6. Ringkasan Total THP (Take Home Pay) Yang Diterima Karyawan */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Total Bersih Ditransfer ke Karyawan (Take Home Pay)
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {formatRupiah(netSalary)}
                </div>
                <div className="text-[11px] text-slate-400 italic mt-0.5">
                  &ldquo;{terbilangRupiah(netSalary)}&rdquo;
                </div>
              </div>

              <div className="text-right text-xs space-y-1 font-mono">
                <div className="text-slate-400">
                  Bruto: <span className="text-white font-semibold">{formatRupiah(totalEarnings)}</span>
                </div>
                <div className="text-slate-400">
                  Total Potongan: <span className="text-rose-400 font-semibold">- {formatRupiah(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Simpan Perubahan' : 'Catat & Bukukan Pencairan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
