import React from 'react';
import {
  DollarSign,
  TrendingDown,
  Receipt,
  Percent,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Scale,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

export interface PayrollReconciliationData {
  totalSlipsCount: number;
  totalGrossEarnings: number;
  totalNetSalary: number;
  totalPaidNet: number;
  totalPendingNet: number;
  totalDeductions: number;
  totalPph21: number;
  totalBpjs: number;
  totalOtherDeductions: number;
  paidSlipsCount: number;
  pendingSlipsCount: number;
  ledgerTrxCount: number;
  totalLedgerNetIDR: number;
  clearedLedgerNetIDR: number;
  grossVsLedgerDiff: number;
}

interface PayrollReconciliationCardProps {
  data: PayrollReconciliationData;
  payrollAccountingBasis?: 'ACCRUAL_GROSS' | 'CASH_NET';
  onBasisChange?: (basis: 'ACCRUAL_GROSS' | 'CASH_NET') => void;
  onSyncPayroll?: () => void;
  isSyncing?: boolean;
  syncFeedbackMessage?: string | null;
  compact?: boolean;
}

export const PayrollReconciliationCard: React.FC<PayrollReconciliationCardProps> = ({
  data,
  payrollAccountingBasis = 'ACCRUAL_GROSS',
  onBasisChange,
  onSyncPayroll,
  isSyncing = false,
  syncFeedbackMessage = null,
  compact = false,
}) => {
  const isMatched =
    data.totalSlipsCount > 0 &&
    data.totalSlipsCount === data.ledgerTrxCount &&
    Math.abs(data.totalNetSalary - data.totalLedgerNetIDR) < 1000;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-all print:border-slate-300 print:shadow-none print:p-3 print:break-inside-avoid">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rekonsiliasi &amp; Jembatan Gaji Karyawan
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Audit Trail Penggajian
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparansi perbandingan antara <strong>Beban Bruto</strong> (Menu Gaji) dan <strong>Kas Keluar THP</strong> (Buku Kas &amp; Arus Kas)
            </p>
          </div>
        </div>

        {/* Basis Switcher */}
        {onBasisChange && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto shrink-0 print:hidden">
            <button
              type="button"
              onClick={() => onBasisChange('ACCRUAL_GROSS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                payrollAccountingBasis === 'ACCRUAL_GROSS'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gunakan Standar Akrual SAK: Beban Bruto diakui penuh di Laba Rugi"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Standar Akrual SAK (Bruto)</span>
            </button>
            <button
              type="button"
              onClick={() => onBasisChange('CASH_NET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                payrollAccountingBasis === 'CASH_NET'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gunakan Basis Kas Riil: Hanya kas keluar bersih THP yang diakui"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Basis Kas Riil (Net THP)</span>
            </button>
          </div>
        )}
      </div>

      {/* Side-by-Side Key Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Figure 1: Gaji Bruto */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          payrollAccountingBasis === 'ACCRUAL_GROSS'
            ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-300/40'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Gaji Bruto (Menu Gaji)
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
              Laba Rugi (SAK)
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
            {formatIDR(data.totalGrossEarnings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Gaji Pokok + Tunjangan + Bonus/THR ({data.totalSlipsCount} Slip)
          </div>
        </div>

        {/* Figure 2: Kas Bersih THP */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          payrollAccountingBasis === 'CASH_NET'
            ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-300/40'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Kas Keluar THP (Arus Kas)
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              Buku Kas Riil
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-800 mt-1">
            {formatIDR(data.totalLedgerNetIDR)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Take-Home Pay ditransfer ({data.ledgerTrxCount} Transaksi Kas)
          </div>
        </div>

        {/* Figure 3: Selisih Rekonsiliasi */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
              Selisih Potongan &amp; Akrual
            </span>
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
              Rekonsiliasi
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-900 mt-1">
            {formatIDR(Math.abs(data.grossVsLedgerDiff))}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            PPh 21, Iuran BPJS &amp; Penyesuaian Pending
          </div>
        </div>
      </div>

      {/* Detailed Reconciliation Bridge Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
        <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Jembatan Rekonsiliasi Gaji Bruto &rarr; Kas Bersih (Audit Trail)
          </span>
          <span className="text-[11px] font-mono text-slate-500">Nominal (IDR)</span>
        </div>
        <table className="w-full text-xs border-collapse font-sans">
          <tbody>
            <tr className="bg-white border-b border-slate-100">
              <td className="py-2.5 px-3.5 text-slate-800 font-semibold">
                1. Total Beban Bruto Gaji Karyawan (Gross Salary &amp; Allowances)
              </td>
              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 w-44">
                {formatIDR(data.totalGrossEarnings)}
              </td>
            </tr>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <td className="py-2 px-3.5 pl-6 text-slate-600">
                &bull; Dikurangi: Potongan Pajak PPh 21 (Dialihkan ke Kewajiban Pajak)
              </td>
              <td className="py-2 px-3.5 text-right font-mono text-rose-700 w-44">
                ({formatIDR(data.totalPph21)})
              </td>
            </tr>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <td className="py-2 px-3.5 pl-6 text-slate-600">
                &bull; Dikurangi: Potongan Iuran BPJS Kesehatan &amp; Ketenagakerjaan
              </td>
              <td className="py-2 px-3.5 text-right font-mono text-rose-700 w-44">
                ({formatIDR(data.totalBpjs)})
              </td>
            </tr>
            {data.totalOtherDeductions > 0 && (
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <td className="py-2 px-3.5 pl-6 text-slate-600">
                  &bull; Dikurangi: Potongan Kasbon Pegawai &amp; Pemotongan Lainnya
                </td>
                <td className="py-2 px-3.5 text-right font-mono text-rose-700 w-44">
                  ({formatIDR(data.totalOtherDeductions)})
                </td>
              </tr>
            )}
            <tr className="bg-indigo-50/30 border-b border-indigo-100 font-semibold">
              <td className="py-2 px-3.5 text-indigo-950">
                = Subtotal Hak Gaji Bersih Karyawan (Total Net Take-Home Pay)
              </td>
              <td className="py-2 px-3.5 text-right font-mono font-bold text-indigo-950 w-44">
                {formatIDR(data.totalNetSalary)}
              </td>
            </tr>
            {data.totalPendingNet > 0 && (
              <tr className="bg-amber-50/30 border-b border-amber-100 text-amber-900">
                <td className="py-2 px-3.5 pl-6">
                  &bull; Dikurangi: Slip Gaji Belum Cair / Pending ({data.pendingSlipsCount} Slip terbit belum ditransfer kas)
                </td>
                <td className="py-2 px-3.5 text-right font-mono text-amber-800 w-44">
                  ({formatIDR(data.totalPendingNet)})
                </td>
              </tr>
            )}
            <tr className="bg-emerald-50/60 font-bold border-t border-emerald-300">
              <td className="py-2.5 px-3.5 text-emerald-950 flex items-center justify-between">
                <span>= Total Kas Bersih Ditransfer Tercatat di Buku Kas / Arus Kas</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                  Cash Flow
                </span>
              </td>
              <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-900 text-sm w-44">
                {formatIDR(data.totalLedgerNetIDR)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Educational Accounting Guidance */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Penjelasan Akuntansi:</strong>
            <span className="block mt-0.5">
              &bull; <strong>Di Menu Gaji Karyawan:</strong> Angka <span className="font-mono font-bold text-slate-900">{formatIDR(data.totalGrossEarnings)}</span> adalah <strong>Total Beban Bruto (Gross Earnings)</strong> sebelum potongan pajak &amp; BPJS. Nilai ini merupakan biaya kompensasi tenaga kerja komprehensif bagi perusahaan (Standar Akuntansi SAK Laba Rugi).
            </span>
            <span className="block mt-0.5">
              &bull; <strong>Di Buku Kas &amp; Arus Kas:</strong> Angka <span className="font-mono font-bold text-emerald-800">{formatIDR(data.totalLedgerNetIDR)}</span> adalah <strong>Arus Kas Keluar Riil (Net Take Home Pay)</strong> yang keluar dari rekening bank perusahaan ke rekening karyawan.
            </span>
            <span className="block mt-0.5">
              &bull; <strong>Pajak PPh 21 &amp; BPJS:</strong> Potongan sebesar <span className="font-mono font-bold text-amber-800">{formatIDR(data.totalDeductions)}</span> ditampung sebagai <strong>Kewajiban Lancar (Utang Pajak PPh 21 &amp; BPJS)</strong> di Neraca hingga tanggal penyetoran resmi ke Kas Negara.
            </span>
          </div>
        </div>

        {/* Sync status & action button */}
        {onSyncPayroll && (
          <div className="pt-2 mt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-1.5 text-[11px]">
              {isMatched ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Seluruh slip gaji ({data.totalSlipsCount} slip) telah 100% tersinkronkan dengan Buku Kas.
                </span>
              ) : (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Terdapat perbedaan jumlah slip ({data.totalSlipsCount}) dengan mutasi kas ({data.ledgerTrxCount}).
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onSyncPayroll}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan & Samakan Buku Kas'}</span>
            </button>
          </div>
        )}

        {syncFeedbackMessage && (
          <div className="mt-2 p-2 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedbackMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
