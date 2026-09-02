import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Building2,
  ShieldCheck,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle2,
  HelpCircle,
  FileText,
  TrendingUp,
  Landmark,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { formatIDR } from '../../utils/formatters';
import { CompanyCapitalSettings } from '../../types';

interface CompanyCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyCapitalModal: React.FC<CompanyCapitalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { companyCapital, updateCompanyCapital, resetCompanyCapitalToDefault, currentUser } = useProject();

  const [authorizedCapital, setAuthorizedCapital] = useState<number>(5000000000);
  const [paidInCapital, setPaidInCapital] = useState<number>(1250000000);
  const [additionalCapital, setAdditionalCapital] = useState<number>(250000000);
  const [retainedEarningsOpening, setRetainedEarningsOpening] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state with context when opened
  useEffect(() => {
    if (companyCapital) {
      setAuthorizedCapital(companyCapital.authorizedCapital || 0);
      setPaidInCapital(companyCapital.paidInCapital || 0);
      setAdditionalCapital(companyCapital.additionalCapital || 0);
      setRetainedEarningsOpening(companyCapital.retainedEarningsOpening || 0);
      setNotes(companyCapital.notes || '');
    }
  }, [companyCapital, isOpen]);

  if (!isOpen) return null;

  const totalPaidAndAdditional = (paidInCapital || 0) + (additionalCapital || 0);
  const paidInPercentage = authorizedCapital > 0 ? (totalPaidAndAdditional / authorizedCapital) * 100 : 0;
  const isUUPTCompliant = paidInPercentage >= 25;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (authorizedCapital <= 0) {
      setNotification({
        type: 'error',
        message: 'Nominal Modal Dasar harus lebih besar dari Rp 0!',
      });
      return;
    }

    if (paidInCapital < 0 || additionalCapital < 0) {
      setNotification({
        type: 'error',
        message: 'Nominal Modal Disetor atau Modal Tambahan tidak boleh bernilai negatif!',
      });
      return;
    }

    const payload: Partial<CompanyCapitalSettings> = {
      authorizedCapital: Number(authorizedCapital),
      paidInCapital: Number(paidInCapital),
      additionalCapital: Number(additionalCapital),
      retainedEarningsOpening: Number(retainedEarningsOpening || 0),
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Master Admin',
    };

    const res = updateCompanyCapital(payload);
    if (res.success) {
      setNotification({
        type: 'success',
        message: 'Struktur Modal Perusahaan berhasil diperbarui dan disinkronkan ke Laporan Neraca!',
      });
      setTimeout(() => {
        setNotification(null);
        onClose();
      }, 1200);
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Gagal menyimpan pengaturan modal.',
      });
    }
  };

  const handleApplyPreset = (auth: number, paid: number, add: number, label: string) => {
    setAuthorizedCapital(auth);
    setPaidInCapital(paid);
    setAdditionalCapital(add);
    setNotification({
      type: 'success',
      message: `Preset permodalan "${label}" diterapkan. Silakan klik Simpan.`,
    });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan konfigurasi modal perusahaan ke nilai standar (Default)?')) {
      resetCompanyCapitalToDefault();
      setNotification({
        type: 'success',
        message: 'Pengaturan modal dikembalikan ke nilai standar.',
      });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pengaturan Modal Perusahaan &amp; Ekuitas</span>
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold rounded-full border border-emerald-500/40 uppercase tracking-wide">
                  Neraca Standar SAK
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Kelola nominal Modal Dasar, Modal Ditempatkan/Disetor, dan Modal Tambahan untuk Laporan Keuangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-3 text-xs flex items-center gap-2 font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Quick Preset Badges */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preset Struktur Modal Cepat (Standar PT Indonesia):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(1000000000, 250000000, 0, 'PT Skala Kecil (1 Milyar)')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-lg transition-colors font-medium cursor-pointer shadow-2xs"
              >
                PT Kecil (Dasar 1 M | Disetor 250 Jt)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(5000000000, 1250000000, 250000000, 'PT Skala Menengah (5 Milyar)')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-lg transition-colors font-medium cursor-pointer shadow-2xs"
              >
                PT Menengah (Dasar 5 M | Disetor 1.25 M + 250 Jt)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(10000000000, 2500000000, 500000000, 'PT Skala Besar (10 Milyar)')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-lg transition-colors font-medium cursor-pointer shadow-2xs"
              >
                PT Besar (Dasar 10 M | Disetor 2.5 M + 500 Jt)
              </button>
            </div>
          </div>

          {/* Section 1: Input Nominal Permodalan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Modal Dasar Perusahaan */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Modal Dasar Perusahaan (Authorized Capital) *</span>
                </label>
                <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatIDR(authorizedCapital)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Total batas maksimal modal yang tertuang dalam Akta Notaris Pendirian Perusahaan &amp; Pengesahan Kemenkumham RI.
              </p>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rp
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={authorizedCapital || ''}
                  onChange={(e) => setAuthorizedCapital(Number(e.target.value))}
                  placeholder="Contoh: 5000000000"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  required
                />
              </div>
            </div>

            {/* Field 2: Modal Ditempatkan & Disetor Penuh */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-cyan-600" />
                  <span>2. Modal Disetor / Ditempatkan (Paid-in Capital) *</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Nilai modal riil yang disetor oleh para pemegang saham (Min. 25% dari Modal Dasar sesuai UUPT).
              </p>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rp
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={paidInCapital || ''}
                  onChange={(e) => setPaidInCapital(Number(e.target.value))}
                  placeholder="Contoh: 1250000000"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                  required
                />
              </div>
              <div className="text-[11px] font-mono text-cyan-700 font-semibold text-right">
                {formatIDR(paidInCapital)}
              </div>
            </div>

            {/* Field 3: Modal Tambahan / Tambahan Modal Disetor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Modal Tambahan / Agio Modal (Additional Capital)</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Tambahan modal disetor di luar nilai nominal saham, agio saham, atau suntikan modal ekspansi bisnis.
              </p>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rp
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={additionalCapital || ''}
                  onChange={(e) => setAdditionalCapital(Number(e.target.value))}
                  placeholder="Contoh: 250000000"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
              <div className="text-[11px] font-mono text-indigo-700 font-semibold text-right">
                {formatIDR(additionalCapital)}
              </div>
            </div>

            {/* Field 4: Saldo Laba Ditahan Awal */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>4. Saldo Laba Ditahan Awal (Retained Earnings Opening)</span>
                </label>
                <span className="text-[11px] font-mono text-slate-700 font-semibold">
                  {formatIDR(retainedEarningsOpening)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Akumulasi sisa laba bersih dari tahun-tahun buku sebelumnya yang ditahan perusahaan (bukan dibagikan sebagai dividen).
              </p>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rp
                </div>
                <input
                  type="number"
                  step="1000000"
                  value={retainedEarningsOpening || ''}
                  onChange={(e) => setRetainedEarningsOpening(Number(e.target.value))}
                  placeholder="Contoh: 0"
                  className="w-full pl-10 pr-4 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                />
              </div>
            </div>

            {/* Field 5: Catatan Legalitas & Akta Notaris */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>5. Dasar Hukum / Nomor Akta Notaris &amp; SK Kemenkumham</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Akta Notaris No. 12 Tgl 15 Jan 2024 / SK Kemenkumham AHU-0012345.AH.01.01"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Section 2: Ringkasan Analisis Permodalan & Kepatuhan UUPT */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-xl text-white border border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Ringkasan Ekuitas Modal di Laporan Neraca
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isUUPTCompliant
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {isUUPTCompliant ? '✅ Memenuhi Syarat UUPT (≥ 25%)' : '⚠️ Rasio Setoran < 25%'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Modal Dasar</div>
                <div className="text-xs font-mono font-bold text-slate-100 mt-0.5">
                  {formatIDR(authorizedCapital)}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Modal Disetor</div>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                  {formatIDR(paidInCapital)}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Modal Tambahan</div>
                <div className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                  {formatIDR(additionalCapital)}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Total Modal Efektif</div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                  {formatIDR(totalPaidAndAdditional)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <em>Catatan:</em> Angka di atas akan secara otomatis menjadi dasar komponen <strong>Ekuitas (Modal Disetor &amp; Modal Tambahan)</strong> pada Laporan Neraca &amp; Laporan Perubahan Ekuitas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Modal</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
