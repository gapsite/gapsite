import { Receivable, ReceivableCategory, ReceivableStatus, ReceivableAgingSummary } from '../types';

export const RECEIVABLE_CATEGORIES: { id: ReceivableCategory; label: string; description: string }[] = [
  {
    id: 'TERMIN_KONSULTASI_TKDN',
    label: 'Termin Konsultasi TKDN',
    description: 'Tagihan termin milestone pendampingan sertifikasi TKDN Barang/Jasa Kemenperin',
  },
  {
    id: 'PROYEK_PEMERINTAH_BUMN',
    label: 'Proyek Pemerintah (APBN/BUMN)',
    description: 'Tagihan termin kontrak pengadaan instansi kementerian, pemda, dan BUMN (SP2D)',
  },
  {
    id: 'PROYEK_RETAIL',
    label: 'Proyek Retail & Korporasi Swasta',
    description: 'Tagihan termin atau DP kontrak proyek klien retail dan perusahaan swasta',
  },
  {
    id: 'TERMIN_SERTIFIKASI_BMP',
    label: 'Termin Sertifikasi BMP',
    description: 'Tagihan termin pendampingan Bobot Manfaat Perusahaan (BMP)',
  },
  {
    id: 'JASA_PERIZINAN_LEGAL',
    label: 'Jasa Perizinan OSS & Legalitas',
    description: 'Tagihan pengurusan izin berusaha OSS-RBA, AMDAL, UKL-UPL, SNI',
  },
  {
    id: 'SUCCESS_FEE_TENDER',
    label: 'Success Fee & Insentif Tender',
    description: 'Tagihan fee keberhasilan verifikasi sertifikat & pemenangan tender e-Katalog',
  },
  {
    id: 'RETAINER_KONSULTANSI',
    label: 'Retainer Bulanan Konsultansi',
    description: 'Kontrak retainer bulanan pendampingan kepatuhan industri berkelanjutan',
  },
  {
    id: 'PELATIHAN_WORKSHOP',
    label: 'Pelatihan & Workshop TKDN',
    description: 'Jasa in-house training pemahaman regulasi Permenperin & penyusunan BOM',
  },
  {
    id: 'REIMBURSEMENT_AUDIT_SURVEYOR',
    label: 'Reimbursement Biaya Verifikasi LVI',
    description: 'Tagihan penggantian biaya audit verifikator independen (Sucofindo / Surveyor Indonesia)',
  },
  {
    id: 'PIUTANG_LAINNYA',
    label: 'Piutang Operasional Lainnya',
    description: 'Faktur komersial atau tagihan jasa pendukung lainnya',
  },
];

export const getReceivableCategoryLabel = (category: ReceivableCategory): string => {
  const found = RECEIVABLE_CATEGORIES.find((c) => c.id === category);
  return found ? found.label : category;
};

export const getReceivableStatusBadge = (
  status: ReceivableStatus
): { label: string; badgeClass: string; dotClass: string } => {
  switch (status) {
    case 'BELUM_DIBAYAR':
      return {
        label: 'Belum Dibayar',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
        dotClass: 'bg-amber-500',
      };
    case 'DIBAYAR_SEBAGIAN':
      return {
        label: 'Dibayar Sebagian',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
        dotClass: 'bg-blue-500',
      };
    case 'LUNAS':
      return {
        label: 'Lunas',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700',
        dotClass: 'bg-emerald-500',
      };
    case 'JATUH_TEMPO':
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700 animate-pulse',
        dotClass: 'bg-rose-500',
      };
    case 'BATAL':
      return {
        label: 'Dibatalkan',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-500',
      };
  }
};

/**
 * Calculates number of days elapsed since due date (positive if overdue, negative if not yet due).
 */
export const calculateDaysOverdue = (dueDateStr: string): number => {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculates number of days elapsed since issue date.
 */
export const calculateAgeDays = (issueDateStr: string): number => {
  if (!issueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const issue = new Date(issueDateStr);
  issue.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - issue.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

export type AgingBucket = '0_30' | '31_60' | '61_90' | 'OVER_90';

export const getAgingBucket = (receivable: Receivable): AgingBucket => {
  if (receivable.status === 'LUNAS' || receivable.status === 'BATAL') {
    return '0_30';
  }
  const days = calculateAgeDays(receivable.issueDate);
  if (days <= 30) return '0_30';
  if (days <= 60) return '31_60';
  if (days <= 90) return '61_90';
  return 'OVER_90';
};

export const getAgingBucketInfo = (bucket: AgingBucket) => {
  switch (bucket) {
    case '0_30':
      return {
        label: '0 - 30 Hari',
        category: 'Lancar (Current)',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      };
    case '31_60':
      return {
        label: '31 - 60 Hari',
        category: 'Perhatian Khusus (Special Mention)',
        badge: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    case '61_90':
      return {
        label: '61 - 90 Hari',
        category: 'Kurang Lancar (Sub-Standard)',
        badge: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
        textColor: 'text-orange-600 dark:text-orange-400',
      };
    case 'OVER_90':
      return {
        label: '> 90 Hari',
        category: 'Diragukan / Macet (Doubtful/Loss)',
        badge: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
        textColor: 'text-rose-600 dark:text-rose-400',
      };
  }
};

/**
 * Computes Accounts Receivable Aging matrix and metrics.
 */
export const calculateReceivablesAgingSummary = (receivables: Receivable[]): ReceivableAgingSummary => {
  let current0to30 = 0;
  let aging31to60 = 0;
  let aging61to90 = 0;
  let agingOver90 = 0;
  let totalOutstanding = 0;
  let totalSettled = 0;
  let totalInvoiced = 0;

  receivables.forEach((r) => {
    if (r.status === 'BATAL') return;

    totalInvoiced += r.totalAmountIDR || 0;
    totalSettled += r.paidAmountIDR || 0;
    const remaining = r.remainingAmountIDR || 0;

    if (remaining > 0 && r.status !== 'LUNAS') {
      totalOutstanding += remaining;
      const bucket = getAgingBucket(r);
      if (bucket === '0_30') current0to30 += remaining;
      else if (bucket === '31_60') aging31to60 += remaining;
      else if (bucket === '61_90') aging61to90 += remaining;
      else if (bucket === 'OVER_90') agingOver90 += remaining;
    }
  });

  const settlementRate = totalInvoiced > 0 ? (totalSettled / totalInvoiced) * 100 : 0;

  return {
    current0to30,
    aging31to60,
    aging61to90,
    agingOver90,
    totalOutstanding,
    totalSettled,
    totalInvoiced,
    settlementRate,
  };
};

/**
 * Auto generates next sequential Invoice number for receivables.
 */
export const generateNextInvoiceNumber = (existingReceivables: Receivable[]): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const count = existingReceivables.length + 1;
  const seq = String(count).padStart(3, '0');
  return `INV/${year}/${month}/GAP-${seq}`;
};
