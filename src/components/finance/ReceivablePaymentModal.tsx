import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Building2,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { Receivable } from '../../types';
import { formatIDR } from '../../utils/formatters';

interface ReceivablePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable: Receivable | null;
}

export const ReceivablePaymentModal: React.FC<ReceivablePaymentModalProps> = ({
  isOpen,
  onClose,
  receivable,
}) => {
  const { activePaymentChannels, recordReceivablePayment } = useProjects();

  const [paymentAmountIDR, setPaymentAmountIDR] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentChannelId, setPaymentChannelId] = useState<string>('BANK_TRANSFER_BRI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [syncToCashLedger, setSyncToCashLedger] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && receivable) {
      setErrorMsg('');
      const remaining = receivable.remainingAmountIDR !== undefined
        ? receivable.remainingAmountIDR
        : Math.max(0, receivable.totalAmountIDR - (receivable.paidAmountIDR || 0));
      setPaymentAmountIDR(remaining);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentChannelId(activePaymentChannels[0]?.id || 'BANK_TRANSFER_BRI');
      setReferenceNumber(`TRF-${receivable.invoiceNumber.replace(/[^A-Za-z0-9]/g, '')}`);
      setNotes(`Pelunasan tagihan invoice ${receivable.invoiceNumber} - ${receivable.title}`);
      setSyncToCashLedger(true);
    }
  }, [isOpen, receivable, activePaymentChannels]);

  if (!isOpen || !receivable) return null;

  const remaining = receivable.remainingAmountIDR !== undefined
    ? receivable.remainingAmountIDR
    : Math.max(0, receivable.totalAmountIDR - (receivable.paidAmountIDR || 0));

  const handlePayFull = () => {
    setPaymentAmountIDR(remaining);
  };

  const handlePayPercent = (percent: number) => {
    setPaymentAmountIDR(Math.round(receivable.totalAmountIDR * (percent / 100)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (paymentAmountIDR <= 0) {
      setErrorMsg('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }
    if (paymentAmountIDR > remaining) {
      setErrorMsg(`Nominal pembayaran (Rp ${paymentAmountIDR.toLocaleString('id-ID')}) melebihi sisa piutang (Rp ${remaining.toLocaleString('id-ID')}).`);
      return;
    }
    if (!paymentDate) {
      setErrorMsg('Tanggal pembayaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const selectedChannel = activePaymentChannels.find((c) => c.id === paymentChannelId);

    const res = recordReceivablePayment(receivable.id, {
      amountIDR: paymentAmountIDR,
      paymentDate,
      paymentChannelId,
      paymentMethod: selectedChannel?.name || paymentChannelId,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      syncToCashLedger,
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Gagal mencatat pembayaran piutang.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                Catat Pembayaran Piutang (Kolektibilitas Kas)
              </h3>
              <p className="text-xs text-slate-400">
                Bukukan pelunasan tagihan langsung ke Buku Kas & Laporan Finansial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  {receivable.invoiceNumber}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {receivable.clientName}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {receivable.title}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Sisa Tagihan Saat Ini</span>
              <span className="text-base font-mono font-black text-rose-600 dark:text-rose-400">
                {formatIDR(remaining)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-center">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatIDR(receivable.totalAmountIDR)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Telah Dibayar</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatIDR(receivable.paidAmountIDR || 0)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Jatuh Tempo</span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {receivable.dueDate || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Payment Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nominal Pembayaran Diterima (IDR) *</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded cursor-pointer"
                >
                  Bayar Lunas 100%
                </button>
                <button
                  type="button"
                  onClick={() => handlePayPercent(50)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded cursor-pointer"
                >
                  50%
                </button>
              </div>
            </div>
            <input
              type="number"
              min="1000"
              max={remaining}
              step="1000"
              value={paymentAmountIDR || ''}
              onChange={(e) => setPaymentAmountIDR(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-emerald-600 dark:text-emerald-400"
              required
            />
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Terbilang: {paymentAmountIDR > 0 ? formatIDR(paymentAmountIDR) : 'Rp 0'}
            </p>
          </div>

          {/* Date & Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tanggal Penerimaan Kas *</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rekening Bank / Kas Penerima *</span>
              </label>
              <select
                value={paymentChannelId}
                onChange={(e) => setPaymentChannelId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dark:text-white"
              >
                {activePaymentChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.accountNumber || 'Kas'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nomor Bukti Transfer / Slip Bank</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="misal: TRF-BCA-889912 / Kwitansi 001"
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>Keterangan Pembayaran</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan transaksi kas masuk..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dark:text-white"
            />
          </div>

          {/* Sync Checkbox */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToCashLedger}
                onChange={(e) => setSyncToCashLedger(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                  Otomatis Posting ke Jurnal Kas Masuk & Arus Kas
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Menambahkan transaksi INCOME kategori Fee Konsultasi ke Buku Kas secara real-time
                </span>
              </div>
            </label>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Simpan Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
