import { OfficeRentContract, OfficeRentMonthlyScheduleItem } from '../types';

export const INDONESIAN_MONTH_NAMES = [
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

/**
 * Generate 12-month schedule for office rent contract
 */
export const generateOfficeRentSchedule = (params: {
  contractId: string;
  year: number;
  startDate: string;
  tenureMonths?: number;
  annualRentAmountIDR: number;
  monthlyServiceChargeIDR?: number;
  pph42RatePercent?: number;
  isSubjectToPpn?: boolean;
  ppnRatePercent?: number;
  dueDayOfMonth?: number;
}): OfficeRentMonthlyScheduleItem[] => {
  const {
    contractId,
    year,
    startDate,
    tenureMonths = 12,
    annualRentAmountIDR,
    monthlyServiceChargeIDR = 0,
    pph42RatePercent = 10,
    isSubjectToPpn = false,
    ppnRatePercent = 11,
    dueDayOfMonth = 5,
  } = params;

  const monthlyRent = Math.round(annualRentAmountIDR / tenureMonths);
  const start = new Date(startDate);
  const startMonth = start.getMonth(); // 0-11
  const startYear = start.getFullYear() || year;

  const items: OfficeRentMonthlyScheduleItem[] = [];

  for (let i = 0; i < tenureMonths; i++) {
    const targetDate = new Date(startYear, startMonth + i, 1);
    const mIndex = targetDate.getMonth();
    const curYear = targetDate.getFullYear();
    const monthNum = String(mIndex + 1).padStart(2, '0');
    const period = `${curYear}-${monthNum}`;
    const monthName = INDONESIAN_MONTH_NAMES[mIndex];

    const dayStr = String(Math.min(dueDayOfMonth, 28)).padStart(2, '0');
    const dueDate = `${curYear}-${monthNum}-${dayStr}`;

    const grossTotal = monthlyRent + monthlyServiceChargeIDR;
    const pph42Amount = Math.round(grossTotal * (pph42RatePercent / 100));
    const ppnAmount = isSubjectToPpn ? Math.round(grossTotal * (ppnRatePercent / 100)) : 0;
    const netPayable = grossTotal - pph42Amount + ppnAmount;

    items.push({
      id: `${contractId}-m${i + 1}`,
      monthIndex: i + 1,
      monthName,
      periodMonthYear: period,
      dueDate,
      rentAmountIDR: monthlyRent,
      serviceChargeIDR: monthlyServiceChargeIDR,
      grossTotalIDR: grossTotal,
      pph42RatePercent,
      pph42AmountIDR: pph42Amount,
      ppnRatePercent: isSubjectToPpn ? ppnRatePercent : 0,
      ppnAmountIDR: ppnAmount,
      netPayableToLandlordIDR: netPayable,
      status: 'UNPAID',
    });
  }

  return items;
};

// Initial Seed Contract for Office Rent (2025 & 2026)
const defaultSchedules2025 = generateOfficeRentSchedule({
  contractId: 'rent-2025-001',
  year: 2025,
  startDate: '2025-01-01',
  tenureMonths: 12,
  annualRentAmountIDR: 120_000_000,
  monthlyServiceChargeIDR: 2_500_000,
  pph42RatePercent: 10,
  isSubjectToPpn: true,
  ppnRatePercent: 11,
  dueDayOfMonth: 5,
});

// Mark some past months in 2025 as already paid for realistic initial state
const seededSchedules2025 = defaultSchedules2025.map((item, idx) => {
  if (idx < 6) {
    // Jan - Jun 2025 paid
    const monthNum = String(idx + 1).padStart(2, '0');
    return {
      ...item,
      status: 'PAID' as const,
      paidDate: `2025-${monthNum}-05`,
      paymentChannelId: 'BANK_TRANSFER_BRI',
      paymentMethod: 'Bank Transfer BRI',
      referenceNumber: `TRX-SEWA-2025-${monthNum}`,
      transactionId: `tx-rent-2025-${monthNum}`,
      taxObligationId: `tax-pph42-rent-2025-${monthNum}`,
      notes: `Sewa Kantor Pusat Bulan ${item.monthName} 2025 sudah disetor via BRI`,
    };
  }
  return item;
});

// Seed Contract for 2026 (Renewal / Ongoing)
const defaultSchedules2026 = generateOfficeRentSchedule({
  contractId: 'rent-2026-001',
  year: 2026,
  startDate: '2026-01-01',
  tenureMonths: 12,
  annualRentAmountIDR: 132_000_000, // Escalation +10%
  monthlyServiceChargeIDR: 2_750_000,
  pph42RatePercent: 10,
  isSubjectToPpn: true,
  ppnRatePercent: 11,
  dueDayOfMonth: 5,
});

// Mark Q1 2026 as paid
const seededSchedules2026 = defaultSchedules2026.map((item, idx) => {
  if (idx < 3) {
    // Jan - Mar 2026 paid
    const monthNum = String(idx + 1).padStart(2, '0');
    return {
      ...item,
      status: 'PAID' as const,
      paidDate: `2026-${monthNum}-05`,
      paymentChannelId: 'BANK_TRANSFER_BRI',
      paymentMethod: 'Bank Transfer BRI',
      referenceNumber: `TRX-SEWA-2026-${monthNum}`,
      transactionId: `tx-rent-2026-${monthNum}`,
      taxObligationId: `tax-pph42-rent-2026-${monthNum}`,
      notes: `Sewa Kantor Pusat Periode ${item.monthName} 2026 (Tahun Berjalan)`,
    };
  }
  return item;
});

export const INITIAL_OFFICE_RENTS: OfficeRentContract[] = [
  {
    id: 'rent-2025-001',
    contractNumber: 'SPK-SEWA/JKT/2025/001',
    officeName: 'Kantor Pusat Jakarta - Menara Kadin Lt. 15',
    buildingName: 'Menara Kadin Indonesia',
    address: 'Jl. H.R. Rasuna Said Blok X-5 Kav. 2-3, Kuningan, Jakarta Selatan 12950',
    landlordName: 'PT Graha Sarana Multigedung (Pengelola Menara Kadin)',
    landlordType: 'CORPORATE_PKP',
    landlordNpwp: '01.234.567.8-011.000',
    landlordPhone: '021-5274400',
    landlordEmail: 'leasing@menarakadin.co.id',
    landlordBankAccount: 'Bank Mandiri 124-00-8899112 a/n PT Graha Sarana Multigedung',
    year: 2025,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    tenureMonths: 12,
    annualRentAmountIDR: 120_000_000,
    monthlyRentAmountIDR: 10_000_000,
    monthlyServiceChargeIDR: 2_500_000,
    securityDepositIDR: 25_000_000,
    pph42RatePercent: 10,
    isSubjectToPpn: true,
    ppnRatePercent: 11,
    autoSyncToLedger: true,
    autoSyncToTax: true,
    schedules: seededSchedules2025,
    status: 'EXTENDED',
    isRenewed: true,
    renewedToContractId: 'rent-2026-001',
    renewalHistory: [
      {
        id: 'ren-hist-2025-to-2026',
        renewalNumber: 1,
        renewalDate: '2025-12-15',
        fromYear: 2025,
        toYear: 2026,
        previousAnnualRent: 120_000_000,
        newAnnualRent: 132_000_000,
        escalationPercent: 10,
        adendumNumber: 'ADENDUM-01/SPK-SEWA/JKT/2026/001',
        newContractId: 'rent-2026-001',
        notes: 'Perpanjangan sewa tahun anggaran 2026 dengan penyesuaian tarif +10%',
        createdAt: '2025-12-15T10:00:00.000Z',
        createdBy: 'Master Admin',
      },
    ],
    notes: 'Perjanjian sewa ruang kantor seluas 120 m2 untuk Kantor Pusat PT GAP Consulting.',
    createdAt: '2025-01-01T08:00:00.000Z',
    createdBy: 'Master Admin',
  },
  {
    id: 'rent-2026-001',
    contractNumber: 'ADENDUM-01/SPK-SEWA/JKT/2026/001',
    officeName: 'Kantor Pusat Jakarta - Menara Kadin Lt. 15',
    buildingName: 'Menara Kadin Indonesia',
    address: 'Jl. H.R. Rasuna Said Blok X-5 Kav. 2-3, Kuningan, Jakarta Selatan 12950',
    landlordName: 'PT Graha Sarana Multigedung (Pengelola Menara Kadin)',
    landlordType: 'CORPORATE_PKP',
    landlordNpwp: '01.234.567.8-011.000',
    landlordPhone: '021-5274400',
    landlordEmail: 'leasing@menarakadin.co.id',
    landlordBankAccount: 'Bank Mandiri 124-00-8899112 a/n PT Graha Sarana Multigedung',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    tenureMonths: 12,
    annualRentAmountIDR: 132_000_000,
    monthlyRentAmountIDR: 11_000_000,
    monthlyServiceChargeIDR: 2_750_000,
    securityDepositIDR: 25_000_000,
    pph42RatePercent: 10,
    isSubjectToPpn: true,
    ppnRatePercent: 11,
    autoSyncToLedger: true,
    autoSyncToTax: true,
    schedules: seededSchedules2026,
    status: 'ACTIVE',
    previousContractId: 'rent-2025-001',
    notes: 'Perpanjangan kontrak sewa tahun ke-2 (2026) dengan tarif baru Rp 132.000.000/tahun.',
    createdAt: '2025-12-15T10:00:00.000Z',
    createdBy: 'Master Admin',
  },
];
