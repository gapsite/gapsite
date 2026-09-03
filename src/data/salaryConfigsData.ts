import { EmployeeAnnualSalaryConfig, UserRole } from '../types';
import {
  DEFAULT_ROLE_COMPENSATION,
  hitungBpjsKesehatan,
  hitungBpjsKetenagakerjaan,
  estimasiPph21,
} from '../utils/payrollCalculations';

export const DEFAULT_EMPLOYEE_SALARY_CONFIGS: EmployeeAnnualSalaryConfig[] = [
  {
    id: 'SALCFG-2026-usr-0',
    employeeId: 'usr-0',
    employeeName: 'Adryan kelvianto',
    year: 2026,
    role: 'MASTER_ADMIN',
    roleTitle: 'Chief Role Master & System SuperAdmin',
    department: 'Central Compliance Governance & Board',
    basicSalary: 18_000_000,
    positionAllowance: 4_500_000,
    transportAllowance: 1_500_000,
    mealAllowance: 1_000_000,
    communicationAllowance: 500_000,
    fixedAllowance: 0,
    annualBonusEstimate: 35_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/001/REMUN-BOARD/2026',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Penetapan Standar Remunerasi Dewan Direksi & Chief Role Master 2026',
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  {
    id: 'SALCFG-2026-usr-lead-01',
    employeeId: 'usr-lead-01',
    employeeName: 'Bambang Irawan, S.T., M.T.',
    year: 2026,
    role: 'LEAD_CONSULTANT',
    roleTitle: 'Lead Assessor / Senior Consultant',
    department: 'Statutory Verification & Consulting',
    basicSalary: 12_500_000,
    positionAllowance: 3_000_000,
    transportAllowance: 1_250_000,
    mealAllowance: 900_000,
    communicationAllowance: 350_000,
    fixedAllowance: 0,
    annualBonusEstimate: 25_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/002/REMUN-LEAD/2026',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Standar Remunerasi Lead Assessor TKDN Kemenperin & SNI',
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  {
    id: 'SALCFG-2026-usr-tech-01',
    employeeId: 'usr-tech-01',
    employeeName: 'Siti Rahmawati, S.Kom.',
    year: 2026,
    role: 'TECHNICAL_CONSULTANT',
    roleTitle: 'Technical Consultant / BOM Specialist',
    department: 'Technical & TKDN Calculations',
    basicSalary: 9_500_000,
    positionAllowance: 2_000_000,
    transportAllowance: 1_000_000,
    mealAllowance: 800_000,
    communicationAllowance: 250_000,
    fixedAllowance: 0,
    annualBonusEstimate: 15_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/003/REMUN-TECH/2026',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Standar Remunerasi Spesialis Perhitungan BOM & Analisis TKDN',
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  {
    id: 'SALCFG-2026-usr-survey-01',
    employeeId: 'usr-survey-01',
    employeeName: 'Hendra Wijaya, S.T.',
    year: 2026,
    role: 'SURVEYOR_LIAISON',
    roleTitle: 'Surveyor Liaison & Field Auditor',
    department: 'Field Verification & Surveyor Liaison',
    basicSalary: 8_000_000,
    positionAllowance: 1_500_000,
    transportAllowance: 1_200_000,
    mealAllowance: 800_000,
    communicationAllowance: 250_000,
    fixedAllowance: 0,
    annualBonusEstimate: 12_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/004/REMUN-SURVEY/2026',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Standar Remunerasi Auditor Lapangan & Penghubung Surveyor Sucofindo/SI',
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  {
    id: 'SALCFG-2026-usr-fin-01',
    employeeId: 'usr-fin-01',
    employeeName: 'Dewi Lestari, S.E.',
    year: 2026,
    role: 'FINANCE_OFFICER',
    roleTitle: 'Finance & Tax Officer',
    department: 'Corporate Finance & Tax Compliance',
    basicSalary: 8_500_000,
    positionAllowance: 1_500_000,
    transportAllowance: 1_000_000,
    mealAllowance: 800_000,
    communicationAllowance: 250_000,
    fixedAllowance: 0,
    annualBonusEstimate: 12_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/005/REMUN-FIN/2026',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Standar Remunerasi Staf Keuangan, Pajak PPh/PPN & Penggajian',
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  // 2025 Historical Records
  {
    id: 'SALCFG-2025-usr-0',
    employeeId: 'usr-0',
    employeeName: 'Adryan kelvianto',
    year: 2025,
    role: 'MASTER_ADMIN',
    roleTitle: 'Chief Role Master & System SuperAdmin',
    department: 'Central Compliance Governance & Board',
    basicSalary: 16_500_000,
    positionAllowance: 4_000_000,
    transportAllowance: 1_500_000,
    mealAllowance: 900_000,
    communicationAllowance: 400_000,
    fixedAllowance: 0,
    annualBonusEstimate: 28_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/001/REMUN-BOARD/2025',
    effectiveDate: '2025-01-01',
    status: 'ARCHIVED',
    notes: 'Penetapan Standar Remunerasi Tahun 2025 (Tutup Buku)',
    createdAt: '2025-01-02T08:00:00.000Z',
    updatedAt: '2025-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
  {
    id: 'SALCFG-2025-usr-lead-01',
    employeeId: 'usr-lead-01',
    employeeName: 'Bambang Irawan, S.T., M.T.',
    year: 2025,
    role: 'LEAD_CONSULTANT',
    roleTitle: 'Lead Assessor / Senior Consultant',
    department: 'Statutory Verification & Consulting',
    basicSalary: 11_500_000,
    positionAllowance: 2_750_000,
    transportAllowance: 1_100_000,
    mealAllowance: 800_000,
    communicationAllowance: 300_000,
    fixedAllowance: 0,
    annualBonusEstimate: 20_000_000,
    thrMonths: 1,
    bpjsKesehatanPercentage: 1,
    bpjsTkPercentage: 2,
    skNumber: 'SK-DIR/002/REMUN-LEAD/2025',
    effectiveDate: '2025-01-01',
    status: 'ARCHIVED',
    notes: 'Standar Remunerasi Lead Assessor Tahun 2025 (Arsip)',
    createdAt: '2025-01-02T08:00:00.000Z',
    updatedAt: '2025-01-02T08:00:00.000Z',
    updatedBy: 'Chief Director',
  },
];

export interface AnnualSalaryBreakdown {
  monthlyBasicSalary: number;
  monthlyAllowances: number;
  monthlyGrossSalary: number;
  monthlyBpjsKesehatan: number;
  monthlyBpjsTk: number;
  monthlyPph21Estimate: number;
  monthlyNetSalaryEstimate: number;
  annualBasicSalary: number;
  annualAllowances: number;
  annualThr: number;
  annualBonusEstimate: number;
  totalAnnualGrossCost: number;
}

/**
 * Menghitung rincian gaji bulanan dan proyeksi biaya tahunan karyawan
 */
export const calculateAnnualSalaryBreakdown = (
  config: EmployeeAnnualSalaryConfig
): AnnualSalaryBreakdown => {
  const basic = config.basicSalary || 0;
  const allow =
    (config.positionAllowance || 0) +
    (config.transportAllowance || 0) +
    (config.mealAllowance || 0) +
    (config.communicationAllowance || 0) +
    (config.fixedAllowance || 0);

  const monthlyGross = basic + allow;
  const bpjsKes = hitungBpjsKesehatan(basic, config.positionAllowance || 0);
  const bpjsTk = hitungBpjsKetenagakerjaan(basic, config.positionAllowance || 0);
  const pph21 = estimasiPph21(monthlyGross);
  const netEstimate = Math.max(0, monthlyGross - (bpjsKes + bpjsTk + pph21));

  const annualBasic = basic * 12;
  const annualAllow = allow * 12;
  const thr = basic * (config.thrMonths ?? 1);
  const bonus = config.annualBonusEstimate || 0;
  const totalAnnualGrossCost = annualBasic + annualAllow + thr + bonus;

  return {
    monthlyBasicSalary: basic,
    monthlyAllowances: allow,
    monthlyGrossSalary: monthlyGross,
    monthlyBpjsKesehatan: bpjsKes,
    monthlyBpjsTk: bpjsTk,
    monthlyPph21Estimate: pph21,
    monthlyNetSalaryEstimate: netEstimate,
    annualBasicSalary: annualBasic,
    annualAllowances: annualAllow,
    annualThr: thr,
    annualBonusEstimate: bonus,
    totalAnnualGrossCost,
  };
};

/**
 * Mencari konfigurasi gaji karyawan untuk tahun tertentu
 * Mengembalikan konfigurasi yang cocok, atau fallback ke role default jika belum diatur
 */
export const getEffectiveSalaryConfig = (
  configs: EmployeeAnnualSalaryConfig[],
  employeeId: string,
  year: number,
  fallbackRole?: UserRole
): {
  config?: EmployeeAnnualSalaryConfig;
  isFromRoleBenchmark: boolean;
  basicSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  communicationAllowance: number;
  fixedAllowance: number;
  annualBonusEstimate: number;
  thrMonths: number;
} => {
  // 1. Cari exact match employeeId dan tahun
  const exact = configs.find(
    (c) => c.employeeId === employeeId && Number(c.year) === Number(year) && c.status !== 'ARCHIVED'
  );
  if (exact) {
    return {
      config: exact,
      isFromRoleBenchmark: false,
      basicSalary: exact.basicSalary,
      positionAllowance: exact.positionAllowance,
      transportAllowance: exact.transportAllowance,
      mealAllowance: exact.mealAllowance,
      communicationAllowance: exact.communicationAllowance || 0,
      fixedAllowance: exact.fixedAllowance || 0,
      annualBonusEstimate: exact.annualBonusEstimate || 0,
      thrMonths: exact.thrMonths ?? 1,
    };
  }

  // 2. Jika tidak ada di tahun tersebut, cari tahun terdekat untuk karyawan ini
  const forEmp = configs
    .filter((c) => c.employeeId === employeeId && c.status !== 'ARCHIVED')
    .sort((a, b) => b.year - a.year);

  if (forEmp.length > 0) {
    const latest = forEmp[0];
    return {
      config: latest,
      isFromRoleBenchmark: false,
      basicSalary: latest.basicSalary,
      positionAllowance: latest.positionAllowance,
      transportAllowance: latest.transportAllowance,
      mealAllowance: latest.mealAllowance,
      communicationAllowance: latest.communicationAllowance || 0,
      fixedAllowance: latest.fixedAllowance || 0,
      annualBonusEstimate: latest.annualBonusEstimate || 0,
      thrMonths: latest.thrMonths ?? 1,
    };
  }

  // 3. Fallback ke benchmark standar role
  const roleKey = fallbackRole || 'TECHNICAL_CONSULTANT';
  const roleBenchmark = DEFAULT_ROLE_COMPENSATION[roleKey] || DEFAULT_ROLE_COMPENSATION.TECHNICAL_CONSULTANT;

  return {
    config: undefined,
    isFromRoleBenchmark: true,
    basicSalary: roleBenchmark.basicSalary,
    positionAllowance: roleBenchmark.positionAllowance,
    transportAllowance: roleBenchmark.transportAllowance,
    mealAllowance: roleBenchmark.mealAllowance,
    communicationAllowance: 0,
    fixedAllowance: 0,
    annualBonusEstimate: 0,
    thrMonths: 1,
  };
};
