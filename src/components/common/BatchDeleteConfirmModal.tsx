import React from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface BatchDeleteItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  amount?: string;
}

interface BatchDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  items: BatchDeleteItem[];
  warningMessage?: string;
  totalAmountText?: string;
  isDeleting?: boolean;
}

export const BatchDeleteConfirmModal: React.FC<BatchDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entityName,
  items,
  warningMessage,
  totalAmountText,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-delete-modal-title"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="batch-delete-modal-title" className="text-base font-bold text-slate-900">
                Rencana Penghapusan Bersamaan ({items.length} {entityName})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfirmasi penghapusan data secara massal dari sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="px-6 pt-5 pb-3">
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-900">
                Perhatian: Tindakan ini permanen dan tidak dapat dibatalkan!
              </p>
              <p className="text-amber-800">
                {warningMessage ||
                  `Sebanyak ${items.length} data ${entityName.toLowerCase()} yang Anda pilih akan dihapus permanen dari basis data dan buku pembukuan.`}
              </p>
            </div>
          </div>
        </div>

        {/* Selected Items List */}
        <div className="px-6 py-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Daftar {entityName} yang akan dihapus:</span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {items.length} Item Dipilih
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.amount && (
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {item.amount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalAmountText && (
            <div className="mt-3 p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs border border-slate-200">
              <span className="font-medium text-slate-600">Total Akumulasi Nominal:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{totalAmountText}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs hover:shadow-sm"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus {items.length} Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {items.length} {entityName} Permanen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
