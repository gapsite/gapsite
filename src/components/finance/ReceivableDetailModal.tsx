import React from 'react';
import {
  X,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  FileText,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Receivable } from '../../types';
import {
  getReceivableCategoryLabel,
  getReceivableStatusBadge,
  getAgingBucket,
  getAgingBucketInfo,
  calculateAgeDays,
  calculateDaysOverdue,
} from '../../utils/receivableCalculations';
import { formatIDR } from '../../utils/formatters';

interface ReceivableDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable: Receivable | null;
  onRecordPayment: (rec: Receivable) => void;
  onEdit: (rec: Receivable) => void;
}

export const ReceivableDetailModal: React.FC<ReceivableDetailModalProps> = ({
  isOpen,
  onClose,
  receivable,
  onRecordPayment,
  onEdit,
}) => {
  if (!isOpen || !receivable) return null;

  const statusBadge = getReceivableStatusBadge(receivable.status);
  const agingBucket = getAgingBucket(receivable);
  const agingInfo = getAgingBucketInfo(agingBucket);
  const ageDays = calculateAgeDays(receivable.issueDate);
  const daysOverdue = calculateDaysOverdue(receivable.dueDate);
  const remaining = receivable.remainingAmountIDR !== undefined
    ? receivable.remainingAmountIDR
    : Math.max(0, receivable.totalAmountIDR - (receivable.paidAmountIDR || 0));

  const percentPaid = receivable.totalAmountIDR > 0
    ? Math.min(100, Math.round(((receivable.paidAmountIDR || 0) / receivable.totalAmountIDR) * 100))
    : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">
                  {receivable.invoiceNumber}
                </h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.badgeClass}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {getReceivableCategoryLabel(receivable.category)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cetak Faktur Tagihan"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Progress & Financial KPI Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Perihal Tagihan</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {receivable.title}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Status Kolektibilitas</span>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border mt-0.5 ${agingInfo.badge}`}>
                  {agingInfo.category} ({ageDays} hari)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">
                  Terbayar: <strong className="text-emerald-600 dark:text-emerald-400">{formatIDR(receivable.paidAmountIDR || 0)}</strong> ({percentPaid}%)
                </span>
                <span className="text-slate-500">
                  Sisa: <strong className="text-rose-600 dark:text-rose-400">{formatIDR(remaining)}</strong>
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Invoice</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {formatIDR(receivable.totalAmountIDR)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sudah Disetor</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(receivable.paidAmountIDR || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sisa Piutang</span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatIDR(remaining)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jatuh Tempo</span>
                <span className={`text-xs font-mono font-bold ${daysOverdue > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                  {receivable.dueDate || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Klien */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Penerima Tagihan (Klien)</span>
              </h5>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{receivable.clientName}</p>
              {receivable.clientContactPerson && (
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>PIC: {receivable.clientContactPerson}</span>
                </p>
              )}
              {receivable.clientEmail && (
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{receivable.clientEmail}</span>
                </p>
              )}
              {receivable.clientPhone && (
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{receivable.clientPhone}</span>
                </p>
              )}
            </div>

            {/* Proyek & Milestone */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kaitan Proyek & Milestone</span>
              </h5>
              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {receivable.projectCode ? `[${receivable.projectCode}] Proyek Terkait` : 'Tagihan Standalone'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Termin: <strong className="text-slate-800 dark:text-slate-200">{receivable.milestoneTitle || 'Tagihan Tunggal'}</strong>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tanggal Terbit: <strong className="text-slate-800 dark:text-slate-200">{receivable.issueDate}</strong>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Term of Payment: <strong className="text-slate-800 dark:text-slate-200">{receivable.paymentTermsDays || 30} Hari</strong>
              </p>
            </div>
          </div>

          {/* Payment Receipts History Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Riwayat Penerimaan Pembayaran ({receivable.payments?.length || 0} Transaksi)</span>
              </h5>
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPayment(receivable);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Catat Pembayaran</span>
                </button>
              )}
            </div>

            {receivable.payments && receivable.payments.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nominal (IDR)</th>
                      <th className="py-2.5 px-3">Metode / Saluran Bank</th>
                      <th className="py-2.5 px-3">No. Ref</th>
                      <th className="py-2.5 px-3">Dicatat Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receivable.payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="py-2.5 px-3 font-mono">{pay.paymentDate}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(pay.amountIDR)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {pay.paymentMethod || pay.paymentChannelId || 'Bank Transfer'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {pay.referenceNumber || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {pay.recordedBy || 'Finance'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                Belum ada mutasi pembayaran tercatat untuk invoice ini.
              </div>
            )}
          </div>

          {/* Notes */}
          {receivable.notes && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Catatan Khusus:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{receivable.notes}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(receivable);
              }}
              className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            >
              Edit Faktur Tagihan
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
