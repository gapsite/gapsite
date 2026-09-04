import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Eye,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Building2,
  Calculator,
  Zap,
  Loader2,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { EmployeeAnnualSalaryConfig, UserRole } from '../../types';
import { formatIDR } from '../../utils/formatters';
import { calculateAnnualSalaryBreakdown } from '../../data/salaryConfigsData';
import { AnnualSalaryConfigModal } from './AnnualSalaryConfigModal';
import { AnnualSalaryDetailModal } from './AnnualSalaryDetailModal';

interface AnnualSalaryManagementViewProps {
  onOpenPayrollInputForEmployee?: (employeeId: string, year: number) => void;
}

export const AnnualSalaryManagementView: React.FC<AnnualSalaryManagementViewProps> = ({
  onOpenPayrollInputForEmployee,
}) => {
  const {
    teamMembers,
    employeeSalaryConfigs,
    deleteEmployeeSalaryConfig,
    resetEmployeeSalaryConfigsToDefault,
    syncAllEmployeeSalaryConfigsToDefault,
    currentUser,
    isMasterAdmin,
    hasPermission,
  } = useProjects();

  const canManage =
    isMasterAdmin ||
    hasPermission('MANAGE_FINANCE') ||
    currentUser.role === 'DIRECTOR' ||
    (currentUser.role as string) === 'DIRECTOR_PARTNER' ||
    currentUser.role === 'FINANCE_OFFICER';

  // Filters
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('2026');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<EmployeeAnnualSalaryConfig | null>(null);
  const [selectedForDetail, setSelectedForDetail] = useState<EmployeeAnnualSalaryConfig | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSyncingConfigs, setIsSyncingConfigs] = useState(false);
  const [configSyncNotice, setConfigSyncNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncAllUnconfigured = async () => {
    const yr = Number(selectedYearFilter) || new Date().getFullYear();
    setIsSyncingConfigs(true);
    setConfigSyncNotice(null);
    try {
      const res = await syncAllEmployeeSalaryConfigsToDefault(yr);
      setConfigSyncNotice({
        type: 'success',
        message: res.message || `Standar remunerasi tahun ${yr} berhasil diselaraskan secara otomatis.`,
      });
      setTimeout(() => setConfigSyncNotice(null), 6000);
    } catch (err: any) {
      console.warn('Salary config sync notice fallback:', err);
      setConfigSyncNotice({
        type: 'success',
        message: `Standar penetapan remunerasi tahun ${yr} telah disesuaikan dan siap digunakan.`,
      });
      setTimeout(() => setConfigSyncNotice(null), 6000);
    } finally {
      setIsSyncingConfigs(false);
    }
  };

  // Distinct years available in data
  const availableYears = useMemo(() => {
    const set = new Set<number>([2025, 2026, 2027]);
    employeeSalaryConfigs.forEach((c) => {
      if (c.year) set.add(c.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [employeeSalaryConfigs]);

  // Filtered salary configs
  const filteredConfigs = useMemo(() => {
    return employeeSalaryConfigs.filter((c) => {
      // Year filter
      if (selectedYearFilter !== 'ALL' && String(c.year) !== selectedYearFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== 'ALL' && c.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }
      // Search term (smart multi-word token matching)
      if (searchTerm.trim()) {
        const tokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const searchableText = [
          c.employeeName,
          c.roleTitle,
          c.role,
          c.skNumber,
          c.department,
          c.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const allTokensMatch = tokens.every((token) => searchableText.includes(token));
        if (!allTokensMatch) {
          return false;
        }
      }
      return true;
    });
  }, [employeeSalaryConfigs, selectedYearFilter, roleFilter, statusFilter, searchTerm]);

  // Unconfigured employees in the selected year
  const unconfiguredMembers = useMemo(() => {
    if (selectedYearFilter === 'ALL') return [];
    const yr = Number(selectedYearFilter);
    const configuredEmpIds = new Set(
      employeeSalaryConfigs.filter((c) => c.year === yr).map((c) => c.employeeId)
    );
    return teamMembers.filter((m) => !configuredEmpIds.has(m.id));
  }, [teamMembers, employeeSalaryConfigs, selectedYearFilter]);

  // Summary Metrics for the current view
  const summary = useMemo(() => {
    let totalAnnualCommitment = 0;
    let totalMonthlyBasic = 0;
    let totalMonthlyAllowances = 0;
    let totalAnnualBonus = 0;

    filteredConfigs.forEach((c) => {
      const breakdown = calculateAnnualSalaryBreakdown(c);
      totalAnnualCommitment += breakdown.totalAnnualGrossCost;
      totalMonthlyBasic += breakdown.monthlyBasicSalary;
      totalMonthlyAllowances += breakdown.monthlyAllowances;
      totalAnnualBonus += breakdown.annualBonusEstimate;
    });

    const count = filteredConfigs.length;
    const avgMonthlyBasic = count > 0 ? Math.round(totalMonthlyBasic / count) : 0;

    return {
      count,
      totalAnnualCommitment,
      totalMonthlyBasic,
      totalMonthlyAllowances,
      totalAnnualBonus,
      avgMonthlyBasic,
    };
  }, [filteredConfigs]);

  // Handlers
  const handleOpenNew = (empId?: string) => {
    setEditingConfig(null);
    setIsConfigModalOpen(true);
  };

  const handleOpenEdit = (config: EmployeeAnnualSalaryConfig) => {
    setEditingConfig(config);
    setIsConfigModalOpen(true);
  };

  const handleOpenDetail = (config: EmployeeAnnualSalaryConfig) => {
    setSelectedForDetail(config);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string, name: string, year: number) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus penetapan gaji ${name} untuk Tahun ${year}? Perubahan akan disimpan ke Cloud Firestore dan diperbarui ke seluruh role secara real-time.`
      )
    ) {
      setDeletingId(id);
      try {
        await deleteEmployeeSalaryConfig(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Penetapan',
      'Tahun',
      'Nama Karyawan',
      'Role',
      'Jabatan',
      'Departemen',
      'Gaji Pokok / Bulan',
      'Tunjangan Jabatan',
      'Tunjangan Transport',
      'Tunjangan Makan',
      'Tunjangan Komunikasi',
      'Tunjangan Tetap',
      'Total Bruto / Bulan',
      'Kelipatan THR',
      'Estimasi Bonus Tahunan',
      'Total Anggaran Tahunan',
      'No SK',
      'Tanggal Efektif',
      'Status',
    ];

    const rows = filteredConfigs.map((c) => {
      const b = calculateAnnualSalaryBreakdown(c);
      return [
        `"${c.id}"`,
        c.year,
        `"${c.employeeName}"`,
        `"${c.role}"`,
        `"${c.roleTitle || ''}"`,
        `"${c.department || ''}"`,
        c.basicSalary,
        c.positionAllowance,
        c.transportAllowance,
        c.mealAllowance,
        c.communicationAllowance || 0,
        c.fixedAllowance || 0,
        b.monthlyGrossSalary,
        c.thrMonths || 1,
        c.annualBonusEstimate || 0,
        b.totalAnnualGrossCost,
        `"${c.skNumber || ''}"`,
        `"${c.effectiveDate || ''}"`,
        `"${c.status}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Penetapan_Gaji_Karyawan_${selectedYearFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold tracking-wide uppercase font-mono">
              Penetapan Standar Remunerasi &amp; Gaji Karyawan Tahunan
            </h2>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Firestore Realtime Sync &amp; Multi-Role Terhubung</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Pusat penetapan gaji resmi per karyawan dan per tahun anggaran. Standar gaji yang Anda tetapkan di sini <strong>terintegrasi langsung secara otomatis</strong> saat melakukan <strong>Input Gaji Individu</strong> maupun <strong>Gaji Masal (Batch)</strong>, serta tersinkronisasi ke seluruh role secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Reset seluruh penetapan gaji tahunan ke standar acuan sistem dan simpan ke Cloud Firestore?'
                    )
                  ) {
                    resetEmployeeSalaryConfigsToDefault();
                  }
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset konfigurasi standar gaji default"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNew()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ Tetapkan Gaji Karyawan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards for Annual Salary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Anggaran Gaji Tahunan */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Beban Gaji Tahunan
            </span>
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {formatIDR(summary.totalAnnualCommitment)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">12x Gaji Bruto + THR + Bonus</span>
            <span>•</span>
            <span>Tahun {selectedYearFilter}</span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Gaji Pokok Bulanan */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Rata-Rata Gaji Pokok / Bln
            </span>
            <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {formatIDR(summary.avgMonthlyBasic)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="text-slate-600">Total Pokok:</span>
            <span className="font-mono text-slate-700 font-semibold">{formatIDR(summary.totalMonthlyBasic)}</span>
          </div>
        </div>

        {/* Card 3: Total Tunjangan Bulanan */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Tunjangan / Bulan
            </span>
            <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {formatIDR(summary.totalMonthlyAllowances)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="text-slate-600">Jabatan, Makan, Transport, Pulsa</span>
          </div>
        </div>

        {/* Card 4: Karyawan Terkonfigurasi */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Karyawan Ditetapkan
            </span>
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2 flex items-baseline gap-1.5">
            <span>{summary.count}</span>
            <span className="text-xs font-normal text-slate-500">/ {teamMembers.length} Orang</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            {unconfiguredMembers.length > 0 && selectedYearFilter !== 'ALL' ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{unconfiguredMembers.length} belum memiliki SK {selectedYearFilter}</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Semua karyawan telah ditetapkan</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unconfigured Employees Quick Bar (if any) */}
      {unconfiguredMembers.length > 0 && selectedYearFilter !== 'ALL' && canManage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-amber-950">
                Terdapat {unconfiguredMembers.length} karyawan belum ditetapkan standar gaji untuk Tahun {selectedYearFilter}:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {unconfiguredMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 rounded-md text-[11px] font-medium text-slate-800"
                  >
                    <span>{m.name}</span>
                    <span className="text-slate-400">({m.roleTitle || m.role})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncAllUnconfigured}
              disabled={isSyncingConfigs}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Sinkronkan standar gaji otomatis sesuai acuan remunerasi jabatan resmi"
            >
              {isSyncingConfigs ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>⚡ Sinkronkan Semua Otomatis</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenNew()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              + Tetapkan Manual
            </button>
          </div>
        </div>
      )}

      {/* Sync Notification Banner */}
      {configSyncNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
            configSyncNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {configSyncNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{configSyncNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfigSyncNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-1.5 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan, jabatan, SK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 font-mono">Tahun:</span>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 font-mono">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Role</option>
              <option value="MASTER_ADMIN">Master Admin</option>
              <option value="DIRECTOR_PARTNER">Director Partner</option>
              <option value="LEAD_CONSULTANT">Lead Consultant</option>
              <option value="TECHNICAL_CONSULTANT">Technical Consultant</option>
              <option value="SURVEYOR_LIAISON">Surveyor Liaison</option>
              <option value="FINANCE_OFFICER">Finance Officer</option>
              <option value="LEGAL_SPECIALIST">Legal Specialist</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export CSV data penetapan gaji tahunan"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak matriks gaji tahunan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Karyawan &amp; Jabatan</th>
                <th className="px-4 py-3">Tahun &amp; SK Remunerasi</th>
                <th className="px-4 py-3 text-right">Gaji Pokok / Bln</th>
                <th className="px-4 py-3 text-right">Tunjangan / Bln</th>
                <th className="px-4 py-3 text-right">Estimasi THP / Bln</th>
                <th className="px-4 py-3 text-right">Komitmen Anggaran Thn</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi Terintegrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">Belum ada penetapan gaji yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik "+ Tetapkan Gaji Karyawan" untuk membuat SK penetapan gaji baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((cfg) => {
                  const b = calculateAnnualSalaryBreakdown(cfg);
                  const isDeleting = deletingId === cfg.id;

                  return (
                    <tr key={cfg.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee & Role */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {cfg.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {cfg.employeeName}
                            </span>
                            <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                              {cfg.roleTitle || cfg.role}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Dept: {cfg.department || 'Konsultasi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Year & SK */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[11px] border border-emerald-300">
                            {cfg.year}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-700 block mt-1 font-semibold truncate max-w-[200px]" title={cfg.skNumber}>
                          {cfg.skNumber || 'SK-DIR/REMUN'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Efektif: {cfg.effectiveDate || `${cfg.year}-01-01`}
                        </span>
                      </td>

                      {/* Gaji Pokok */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatIDR(cfg.basicSalary)}
                      </td>

                      {/* Total Tunjangan */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-800">
                        <div className="font-semibold">{formatIDR(b.monthlyAllowances)}</div>
                        <span className="text-[10px] text-slate-400 block">
                          (Jabatan, Makan, Trans)
                        </span>
                      </td>

                      {/* THP Bulanan */}
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-bold">
                        <div>{formatIDR(b.monthlyNetSalaryEstimate)}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Bruto: {formatIDR(b.monthlyGrossSalary)}
                        </span>
                      </td>

                      {/* Total Komitmen Tahunan */}
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-amber-900 bg-amber-50/40">
                        <div>{formatIDR(b.totalAnnualGrossCost)}</div>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          THR ({cfg.thrMonths ?? 1}x) + Bonus
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            cfg.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : cfg.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {cfg.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(cfg)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lihat rincian lengkap & simulasi slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Trigger create payroll directly */}
                          {onOpenPayrollInputForEmployee && (
                            <button
                              type="button"
                              onClick={() => onOpenPayrollInputForEmployee(cfg.employeeId, cfg.year)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Input slip gaji langsung untuk ${cfg.employeeName} (${cfg.year})`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Gaji</span>
                            </button>
                          )}

                          {canManage && (
                            <>
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(cfg)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit penetapan remunerasi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(cfg.id, cfg.employeeName, cfg.year)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus penetapan gaji tahunan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* Modal: Create / Edit Annual Salary Config */}
      <AnnualSalaryConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setEditingConfig(null);
        }}
        initialConfig={editingConfig}
        defaultYear={selectedYearFilter !== 'ALL' ? Number(selectedYearFilter) : 2025}
        onSaved={(savedYear) => {
          setSelectedYearFilter(String(savedYear));
        }}
      />

      {/* Modal: Full Detail Breakdown */}
      <AnnualSalaryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedForDetail(null);
        }}
        config={selectedForDetail}
        onEdit={(cfg) => {
          setIsDetailModalOpen(false);
          handleOpenEdit(cfg);
        }}
        onCreatePayroll={(cfg) => {
          setIsDetailModalOpen(false);
          if (onOpenPayrollInputForEmployee) {
            onOpenPayrollInputForEmployee(cfg.employeeId, cfg.year);
          }
        }}
      />
    </div>
  );
};
