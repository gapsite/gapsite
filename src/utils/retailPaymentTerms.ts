/**
 * Standar Operasional Prosedur (SOP) Termin Pembayaran Proyek Retail Swasta
 * 
 * Aturan Paten:
 * 1. Jatuh tempo invoice proyek retail (swasta) ditetapkan paten 7 hari kalender setelah tanggal invoice terbit (issueDate + 7 hari).
 * 2. Jika tanggal pembayaran diterima melebihi 7 hari dari tanggal terbit (paymentDate > dueDate),
 *    sistem secara otomatis mencatat dan membukukan status keterlambatan (delayDays, delayNotes)
 *    ke dalam termin proyek, jurnal transaksi Buku Kas, dan Piutang Usaha.
 */

export const RETAIL_PAYMENT_TERMS_DAYS = 7;

/**
 * Menghitung tanggal jatuh tempo 7 hari kalender setelah tanggal terbit invoice (YYYY-MM-DD)
 */
export function calculateRetailInvoiceDueDate(issueDate: string, days = RETAIL_PAYMENT_TERMS_DAYS): string {
  if (!issueDate) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  const parts = issueDate.slice(0, 10).split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const [year, month, day] = parts;
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);

    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dt = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  }

  const d = new Date(issueDate);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return fallback.toISOString().slice(0, 10);
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Menghitung selisih hari kalender antara dua tanggal (YYYY-MM-DD)
 * Positif jika targetDate melebihi baseDate.
 */
export function getCalendarDaysDiff(baseDate: string, targetDate: string): number {
  if (!baseDate || !targetDate) return 0;
  const b = new Date(baseDate.slice(0, 10) + 'T00:00:00');
  const t = new Date(targetDate.slice(0, 10) + 'T00:00:00');
  if (isNaN(b.getTime()) || isNaN(t.getTime())) return 0;

  const diffMs = t.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface PaymentDelayAnalysis {
  isDelayed: boolean;
  delayDays: number;
  dueDate: string;
  paymentDate: string;
  delayNotes: string;
}

/**
 * Mengevaluasi apakah pembayaran retail mengalami keterlambatan (> 7 hari dari invoice / lewat dueDate)
 */
export function evaluateRetailPaymentDelay(
  invoiceDate: string | undefined,
  dueDate: string | undefined,
  paymentDate: string | undefined
): PaymentDelayAnalysis {
  const effectiveDueDate = dueDate || (invoiceDate ? calculateRetailInvoiceDueDate(invoiceDate) : '');
  const effectivePaymentDate = paymentDate || new Date().toISOString().slice(0, 10);

  if (!effectiveDueDate) {
    return {
      isDelayed: false,
      delayDays: 0,
      dueDate: '',
      paymentDate: effectivePaymentDate,
      delayNotes: '',
    };
  }

  const diffDays = getCalendarDaysDiff(effectiveDueDate, effectivePaymentDate);
  const isDelayed = diffDays > 0;

  let delayNotes = '';
  if (isDelayed) {
    delayNotes = `⚠️ Keterlambatan Pembayaran: Diterima terlambat ${diffDays} hari dari batas jatuh tempo 7 hari (Jatuh tempo: ${effectiveDueDate}, Realisasi bayar: ${effectivePaymentDate})`;
  }

  return {
    isDelayed,
    delayDays: Math.max(0, diffDays),
    dueDate: effectiveDueDate,
    paymentDate: effectivePaymentDate,
    delayNotes,
  };
}

/**
 * Format tanggal ramah pengguna (misal: 25 Feb 2026)
 */
export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      if (months[monthIdx]) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
