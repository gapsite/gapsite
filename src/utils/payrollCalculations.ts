import { PayrollPayment, PayrollSummary, UserRole } from '../types';

/**
 * Konversi angka rupiah ke teks terbilang bahasa Indonesia
 * Contoh: 12500000 -> "Dua Belas Juta Lima Ratus Ribu Rupiah"
 */
export const terbilangRupiah = (nominal: number): string => {
  if (isNaN(nominal) || nominal === 0) return 'Nol Rupiah';
  
  const bilangan: string[] = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  const konversi = (n: number): string => {
    let hasil = '';
    if (n < 12) {
      hasil = bilangan[n];
    } else if (n < 20) {
      hasil = konversi(n - 10) + ' Belas';
    } else if (n < 100) {
      hasil = konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    } else if (n < 200) {
      hasil = 'Seratus ' + konversi(n - 100);
    } else if (n < 1000) {
      hasil = konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    } else if (n < 2000) {
      hasil = 'Seribu ' + konversi(n - 1000);
    } else if (n < 1000000) {
      hasil = konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    } else if (n < 1000000000) {
      hasil = konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    } else if (n < 1000000000000) {
      hasil = konversi(Math.floor(n / 1000000000)) + ' Miliar ' + konversi(n % 1000000000);
    } else {
      hasil = konversi(Math.floor(n / 1000000000000)) + ' Triliun ' + konversi(n % 1000000000000);
    }
    return hasil.trim();
  };

  const bulat = Math.floor(Math.abs(nominal));
  const teks = konversi(bulat) + ' Rupiah';
  return teks.replace(/\s+/g, ' ');
};

/**
 * Hitung perkiraan Potongan BPJS Kesehatan Karyawan (1% dari Gaji Pokok & Tunjangan Tetap)
 */
export const hitungBpjsKesehatan = (gajiPokok: number, tunjanganTetap: number = 0): number => {
  const dasarPengenaan = Math.min(Math.max(0, gajiPokok + tunjanganTetap), 12_000_000); // Maksimum dasar BPJS Kes Rp 12.000.000
  return Math.round(dasarPengenaan * 0.01);
};

/**
 * Hitung perkiraan Potongan BPJS Ketenagakerjaan (JHT Karyawan 2%)
 */
export const hitungBpjsKetenagakerjaan = (gajiPokok: number, tunjanganTetap: number = 0): number => {
  const dasarPengenaan = Math.max(0, gajiPokok + tunjanganTetap);
  return Math.round(dasarPengenaan * 0.02);
};

/**
 * Estimasi PPh 21 Bulanan (Menggunakan Skema TER Kategori A/B atau proporsional sederhana)
 */
export const estimasiPph21 = (penghasilanBruto: number): number => {
  if (penghasilanBruto <= 5_400_000) return 0;
  if (penghasilanBruto <= 5_650_000) return Math.round(penghasilanBruto * 0.0025);
  if (penghasilanBruto <= 5_950_000) return Math.round(penghasilanBruto * 0.005);
  if (penghasilanBruto <= 6_300_000) return Math.round(penghasilanBruto * 0.0075);
  if (penghasilanBruto <= 6_750_000) return Math.round(penghasilanBruto * 0.01);
  if (penghasilanBruto <= 7_500_000) return Math.round(penghasilanBruto * 0.0125);
  if (penghasilanBruto <= 8_550_000) return Math.round(penghasilanBruto * 0.015);
  if (penghasilanBruto <= 9_650_000) return Math.round(penghasilanBruto * 0.0175);
  if (penghasilanBruto <= 10_050_000) return Math.round(penghasilanBruto * 0.02);
  if (penghasilanBruto <= 10_350_000) return Math.round(penghasilanBruto * 0.0225);
  if (penghasilanBruto <= 10_700_000) return Math.round(penghasilanBruto * 0.025);
  if (penghasilanBruto <= 12_500_000) return Math.round(penghasilanBruto * 0.03);
  if (penghasilanBruto <= 13_750_000) return Math.round(penghasilanBruto * 0.04);
  if (penghasilanBruto <= 15_100_000) return Math.round(penghasilanBruto * 0.05);
  if (penghasilanBruto <= 16_950_000) return Math.round(penghasilanBruto * 0.06);
  if (penghasilanBruto <= 19_750_000) return Math.round(penghasilanBruto * 0.07);
  if (penghasilanBruto <= 24_150_000) return Math.round(penghasilanBruto * 0.08);
  if (penghasilanBruto <= 26_450_000) return Math.round(penghasilanBruto * 0.09);
  if (penghasilanBruto <= 28_000_000) return Math.round(penghasilanBruto * 0.10);
  if (penghasilanBruto <= 30_050_000) return Math.round(penghasilanBruto * 0.11);
  return Math.round(penghasilanBruto * 0.12);
};

/**
 * Default rekomendasi standar remunerasi per peran konsultan
 */
export const DEFAULT_ROLE_COMPENSATION: Record<string, {
  basicSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  communicationAllowance?: number;
  fixedAllowance?: number;
}> = {
  MASTER_ADMIN: {
    basicSalary: 18_000_000,
    positionAllowance: 4_500_000,
    transportAllowance: 1_500_000,
    mealAllowance: 1_000_000,
    communicationAllowance: 500_000,
  },
  DIRECTOR: {
    basicSalary: 20_000_000,
    positionAllowance: 5_000_000,
    transportAllowance: 2_000_000,
    mealAllowance: 1_200_000,
    communicationAllowance: 600_000,
  },
  LEAD_CONSULTANT: {
    basicSalary: 12_500_000,
    positionAllowance: 3_000_000,
    transportAllowance: 1_250_000,
    mealAllowance: 900_000,
    communicationAllowance: 350_000,
  },
  TECHNICAL_CONSULTANT: {
    basicSalary: 9_500_000,
    positionAllowance: 2_000_000,
    transportAllowance: 1_000_000,
    mealAllowance: 800_000,
    communicationAllowance: 300_000,
  },
  SURVEYOR_LIAISON: {
    basicSalary: 8_000_000,
    positionAllowance: 1_500_000,
    transportAllowance: 1_200_000,
    mealAllowance: 800_000,
    communicationAllowance: 250_000,
  },
  FINANCE_OFFICER: {
    basicSalary: 8_500_000,
    positionAllowance: 1_500_000,
    transportAllowance: 1_000_000,
    mealAllowance: 800_000,
    communicationAllowance: 250_000,
  },
  CLIENT_VIEWER: {
    basicSalary: 0,
    positionAllowance: 0,
    transportAllowance: 0,
    mealAllowance: 0,
    communicationAllowance: 0,
  },
};

/**
 * Rekapitulasi ringkasan pembayaran payroll
 */
export const calculatePayrollSummary = (records: PayrollPayment[], periodFilter?: string): PayrollSummary => {
  const filtered = periodFilter && periodFilter !== 'ALL'
    ? records.filter((r) => r.period === periodFilter)
    : records;

  let totalPaidIDR = 0;
  let totalGrossIDR = 0;
  let totalDeductionsIDR = 0;
  let totalPph21IDR = 0;
  let totalBpjsIDR = 0;
  let paidCount = 0;
  let pendingCount = 0;

  const employeeIds = new Set<string>();

  filtered.forEach((r) => {
    employeeIds.add(r.employeeId || r.employeeName);
    if (r.status === 'PAID') {
      totalPaidIDR += r.netSalary || 0;
      paidCount++;
    } else {
      pendingCount++;
    }
    totalGrossIDR += r.totalEarnings || 0;
    totalDeductionsIDR += r.totalDeductions || 0;
    totalPph21IDR += r.pph21Amount || 0;
    totalBpjsIDR += (r.bpjsKesehatan || 0) + (r.bpjsKetenagakerjaan || 0);
  });

  return {
    totalPaidIDR,
    totalGrossIDR,
    totalDeductionsIDR,
    totalPph21IDR,
    totalBpjsIDR,
    paidCount,
    pendingCount,
    employeeCount: employeeIds.size,
  };
};
