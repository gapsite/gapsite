import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  User,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Percent,
  Calculator,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { EmployeeAnnualSalaryConfig, UserRole } from '../../types';
import { formatIDR } from '../../utils/formatters';
import { calculateAnnualSalaryBreakdown } from '../../data/salaryConfigsData';
import { DEFAULT_ROLE_COMPENSATION } from '../../utils/payrollCalculations';

interface AnnualSalaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: EmployeeAnnualSalaryConfig | null;
  defaultYear?: number;
}

export const AnnualSalaryConfigModal: React.FC<AnnualSalaryConfigModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  defaultYear,
}) => {
  const {
    teamMembers,
    currentUser,
    employeeSalaryConfigs,
    addOrUpdateEmployeeSalaryConfig,
  } = useProjects();

  const currentYear = defaultYear || new Date().getFullYear();

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [year, setYear] = useState<number>(currentYear);
  const [role, setRole] = useState<UserRole>('TECHNICAL_CONSULTANT');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Compensation
  const [basicSalary, setBasicSalary] = useState<number>(10_000_000);
  const [positionAllowance, setPositionAllowance] = useState<number>(2_500_000);
  const [transportAllowance, setTransportAllowance] = useState<number>(1_000_000);
  const [mealAllowance, setMealAllowance] = useState<number>(800_000);
  const [communicationAllowance, setCommunicationAllowance] = useState<number>(300_000);
  const [fixedAllowance, setFixedAllowance] = useState<number>(0);
  const [annualBonusEstimate, setAnnualBonusEstimate] = useState<number>(15_000_000);
  const [thrMonths, setThrMonths] = useState<number>(1);

  // Administration & Governance
  const [skNumber, setSkNumber] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(`${currentYear}-01-01`);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  const [notes, setNotes] = useState<string>('');

  // UI feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Available years list
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = 2023; y <= 2030; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (initialConfig) {
      setSelectedEmployeeId(initialConfig.employeeId);
      setEmployeeName(initialConfig.employeeName);
      setYear(initialConfig.year);
      setRole(initialConfig.role);
      setRoleTitle(initialConfig.roleTitle || '');
      setDepartment(initialConfig.department || '');
      setBasicSalary(initialConfig.basicSalary || 0);
      setPositionAllowance(initialConfig.positionAllowance || 0);
      setTransportAllowance(initialConfig.transportAllowance || 0);
      setMealAllowance(initialConfig.mealAllowance || 0);
      setCommunicationAllowance(initialConfig.communicationAllowance || 0);
      setFixedAllowance(initialConfig.fixedAllowance || 0);
      setAnnualBonusEstimate(initialConfig.annualBonusEstimate || 0);
      setThrMonths(initialConfig.thrMonths ?? 1);
      setSkNumber(initialConfig.skNumber || '');
      setEffectiveDate(initialConfig.effectiveDate || `${initialConfig.year}-01-01`);
      setStatus(initialConfig.status || 'ACTIVE');
      setNotes(initialConfig.notes || '');
    } else {
      // Default new configuration
      const targetYear = defaultYear || new Date().getFullYear();
      setYear(targetYear);
      setEffectiveDate(`${targetYear}-01-01`);
      setSkNumber(`SK-DIR/${String(employeeSalaryConfigs.length + 1).padStart(3, '0')}/REMUN/${targetYear}`);
      setStatus('ACTIVE');

      // Default to first member not yet configured for this year, or first member
      const alreadyConfiguredIds = new Set(
        employeeSalaryConfigs.filter((c) => c.year === targetYear).map((c) => c.employeeId)
      );
      const firstAvailable = teamMembers.find((m) => !alreadyConfiguredIds.has(m.id)) || teamMembers[0];

      if (firstAvailable) {
        handleSelectEmployee(firstAvailable.id, targetYear);
      }
    }
    setErrorMsg(null);
    setSuccessNotice(null);
  }, [isOpen, initialConfig, defaultYear]);

  const handleSelectEmployee = (empId: string, currentSelectedYear?: number) => {
    setSelectedEmployeeId(empId);
    setErrorMsg(null);

    const member = teamMembers.find((m) => m.id === empId);
    if (!member) return;

    setEmployeeName(member.name);
    setRole(member.role);
    setRoleTitle(member.roleTitle || member.role);
    setDepartment(member.department || 'Operasional Konsultasi');

    const yr = currentSelectedYear || year;

    // Check if there's already an existing config for this employee in this year or prior year
    const existingSameYear = employeeSalaryConfigs.find(
      (c) => c.employeeId === empId && c.year === yr && (!initialConfig || c.id !== initialConfig.id)
    );

    if (existingSameYear) {
      setBasicSalary(existingSameYear.basicSalary);
      setPositionAllowance(existingSameYear.positionAllowance);
      setTransportAllowance(existingSameYear.transportAllowance);
      setMealAllowance(existingSameYear.mealAllowance);
      setCommunicationAllowance(existingSameYear.communicationAllowance || 0);
      setFixedAllowance(existingSameYear.fixedAllowance || 0);
      setAnnualBonusEstimate(existingSameYear.annualBonusEstimate || 0);
      setThrMonths(existingSameYear.thrMonths ?? 1);
      setSkNumber(existingSameYear.skNumber || '');
      setNotes(existingSameYear.notes || '');
      return;
    }

    // Otherwise apply default role benchmark
    const benchmark = DEFAULT_ROLE_COMPENSATION[member.role] || DEFAULT_ROLE_COMPENSATION.TECHNICAL_CONSULTANT;
    setBasicSalary(benchmark.basicSalary);
    setPositionAllowance(benchmark.positionAllowance);
    setTransportAllowance(benchmark.transportAllowance);
    setMealAllowance(benchmark.mealAllowance);
    setCommunicationAllowance(250_000);
    setFixedAllowance(0);
    setAnnualBonusEstimate(benchmark.basicSalary * 1.5);
    setThrMonths(1);
    setNotes(`Penetapan standar gaji tahunan berdasarkan benchmark kompetensi jabatan ${member.roleTitle || member.role}.`);
  };

  // Live calculation breakdown
  const previewConfig: EmployeeAnnualSalaryConfig = useMemo(() => {
    return {
      id: initialConfig?.id || 'temp',
      employeeId: selectedEmployeeId,
      employeeName,
      year,
      role,
      roleTitle,
      department,
      basicSalary,
      positionAllowance,
      transportAllowance,
      mealAllowance,
      communicationAllowance,
      fixedAllowance,
      annualBonusEstimate,
      thrMonths,
      skNumber,
      effectiveDate,
      status,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Master Admin',
    };
  }, [
    initialConfig,
    selectedEmployeeId,
    employeeName,
    year,
    role,
    roleTitle,
    department,
    basicSalary,
    positionAllowance,
    transportAllowance,
    mealAllowance,
    communicationAllowance,
    fixedAllowance,
    annualBonusEstimate,
    thrMonths,
    skNumber,
    effectiveDate,
    status,
    notes,
    currentUser,
  ]);

  const breakdown = useMemo(() => {
    return calculateAnnualSalaryBreakdown(previewConfig);
  }, [previewConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEmployeeId) {
      setErrorMsg('Pilih karyawan yang akan ditetapkan gajinya.');
      return;
    }
    if (basicSalary <= 0) {
      setErrorMsg('Gaji pokok bulanan harus lebih besar dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addOrUpdateEmployeeSalaryConfig({
        id: initialConfig?.id,
        employeeId: selectedEmployeeId,
        employeeName,
        year,
        role,
        roleTitle,
        department,
        basicSalary,
        positionAllowance,
        transportAllowance,
        mealAllowance,
        communicationAllowance,
        fixedAllowance,
        annualBonusEstimate,
        thrMonths,
        skNumber: skNumber || `SK-DIR/${year}/REMUN/${selectedEmployeeId}`,
        effectiveDate,
        status,
        notes,
      });

      if (res.success) {
        setSuccessNotice(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan penetapan gaji.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="annual-salary-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="annual-salary-modal-container"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>{initialConfig ? 'Edit Penetapan Gaji Karyawan' : 'Penetapan Standar Gaji Karyawan Tahunan'}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Tahun {year}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Terintegrasi otomatis dari role hingga menu pembayaran gaji &amp; tersimpan realtime ke seluruh role
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Section 1: Employee & Year Selection */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Identitas Karyawan &amp; Tahun Penetapan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Employee Selection */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Karyawan / Konsultan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="salary-cfg-employee-select"
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  disabled={Boolean(initialConfig)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="" disabled>-- Pilih Karyawan --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.roleTitle || m.role} ({m.department || 'Konsultasi'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Anggaran <span className="text-rose-500">*</span>
                </label>
                <select
                  id="salary-cfg-year-select"
                  value={year}
                  onChange={(e) => {
                    const newYr = Number(e.target.value);
                    setYear(newYr);
                    setEffectiveDate(`${newYr}-01-01`);
                    if (selectedEmployeeId) {
                      handleSelectEmployee(selectedEmployeeId, newYr);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Readonly Role & Dept summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Role Sistem</span>
                <span className="font-semibold text-slate-800 font-mono">{role}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Jabatan Organisasi</span>
                <span className="font-semibold text-slate-800">{roleTitle || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Departemen</span>
                <span className="font-semibold text-slate-800">{department || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Komponen Remunerasi Bulanan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Komponen Remunerasi &amp; Tunjangan Bulanan (Rupiah)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Gaji Pokok */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gaji Pokok Bulanan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50_000}
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(basicSalary)}</span>
              </div>

              {/* Tunjangan Jabatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Jabatan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50_000}
                    value={positionAllowance}
                    onChange={(e) => setPositionAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(positionAllowance)}</span>
              </div>

              {/* Tunjangan Transport */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Transportasi
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50_000}
                    value={transportAllowance}
                    onChange={(e) => setTransportAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(transportAllowance)}</span>
              </div>

              {/* Tunjangan Makan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Makan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50_000}
                    value={mealAllowance}
                    onChange={(e) => setMealAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(mealAllowance)}</span>
              </div>

              {/* Tunjangan Komunikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Komunikasi / Pulsa
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={25_000}
                    value={communicationAllowance}
                    onChange={(e) => setCommunicationAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(communicationAllowance)}</span>
              </div>

              {/* Tunjangan Tetap Lainnya */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Tetap Lainnya
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={50_000}
                    value={fixedAllowance}
                    onChange={(e) => setFixedAllowance(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(fixedAllowance)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Komponen Tahunan & Insentif Kinerja */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>3. Proyeksi Komponen Tahunan (THR &amp; Bonus Kinerja)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelipatan THR (Tunjangan Hari Raya)
                </label>
                <select
                  value={thrMonths}
                  onChange={(e) => setThrMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value={1}>1x Gaji Pokok ({formatIDR(basicSalary)})</option>
                  <option value={1.5}>1.5x Gaji Pokok ({formatIDR(basicSalary * 1.5)})</option>
                  <option value={2}>2x Gaji Pokok ({formatIDR(basicSalary * 2)})</option>
                  <option value={0}>Tidak Ada / 0x</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Sesuai Peraturan Menaker No. 6/2016</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimasi Bonus Tahunan / Insentif Proyek
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={500_000}
                    value={annualBonusEstimate}
                    onChange={(e) => setAnnualBonusEstimate(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{formatIDR(annualBonusEstimate)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Administrasi & Legalitas SK */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>4. Legalitas &amp; Dokumen Penetapan Direksi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor SK / Surat Keputusan Direksi
                </label>
                <input
                  type="text"
                  value={skNumber}
                  onChange={(e) => setSkNumber(e.target.value)}
                  placeholder="SK-DIR/001/REMUN/2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Berlaku Efektif
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Penetapan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="ACTIVE">AKTIF (Berlaku Resmi)</option>
                  <option value="DRAFT">DRAFT (Dalam Usulan)</option>
                  <option value="ARCHIVED">ARSIP (Tutup Buku)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Dasar Keputusan Remunerasi
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Penetapan remunerasi mengacu pada evaluasi kinerja dan benchmark industri konsultansi sertifikasi TKDN..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Section 5: Real-time Live Calculation Matrix Preview */}
          <div className="bg-emerald-950 text-emerald-50 rounded-xl p-5 border border-emerald-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Ringkasan Simulasi Gaji Bulanan &amp; Anggaran Tahunan Perusahaan</span>
              </div>
              <span className="text-[11px] bg-emerald-900 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700 font-mono">
                Tahun {year}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-700/50">
                <span className="text-emerald-300 text-[11px] block">Gaji Pokok / Bulan</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {formatIDR(breakdown.monthlyBasicSalary)}
                </span>
              </div>

              <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-700/50">
                <span className="text-emerald-300 text-[11px] block">Total Tunjangan / Bulan</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {formatIDR(breakdown.monthlyAllowances)}
                </span>
              </div>

              <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-700/50">
                <span className="text-emerald-300 text-[11px] block">Penghasilan Bruto / Bulan</span>
                <span className="text-base font-bold font-mono text-amber-300 mt-1 block">
                  {formatIDR(breakdown.monthlyGrossSalary)}
                </span>
              </div>

              <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-700/50">
                <span className="text-emerald-300 text-[11px] block">Estimasi THP Bersih / Bulan</span>
                <span className="text-base font-bold font-mono text-emerald-300 mt-1 block">
                  {formatIDR(breakdown.monthlyNetSalaryEstimate)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Pot. BPJS ({formatIDR(breakdown.monthlyBpjsKesehatan + breakdown.monthlyBpjsTk)}) + PPh21 ({formatIDR(breakdown.monthlyPph21Estimate)})
                </span>
              </div>
            </div>

            {/* Total annual commitment */}
            <div className="pt-2 border-t border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-emerald-200">
                Total Proyeksi Beban Anggaran Gaji Tahunan (12x Gaji Bruto + THR + Bonus):
              </span>
              <span className="text-lg font-extrabold font-mono text-amber-300">
                {formatIDR(breakdown.totalAnnualGrossCost)}
              </span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Perubahan tersimpan ke Cloud Firestore &amp; tersinkronisasi realtime ke seluruh role.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Penetapan Gaji Tahunan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
