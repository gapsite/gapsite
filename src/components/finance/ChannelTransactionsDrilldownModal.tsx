import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Landmark,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FinancialTransaction, PaymentChannelDefinition } from '../../types';
import { formatIDR, getTransactionCategoryLabel } from '../../utils/formatters';

interface ChannelTransactionsDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: {
    id: string;
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    count: number;
    incomeCount?: number;
    expenseCount?: number;
    clearedIncome?: number;
    clearedExpense?: number;
    netCashFlow?: number;
  } | null;
  transactions: FinancialTransaction[];
  paymentChannels: PaymentChannelDefinition[];
  onUpdateTransaction: (id: string, updates: Partial<FinancialTransaction>) => void;
}

export const ChannelTransactionsDrilldownModal: React.FC<ChannelTransactionsDrilldownModalProps> = ({
  isOpen,
  onClose,
  channel,
  transactions,
  paymentChannels,
  onUpdateTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetChannel, setSelectedTargetChannel] = useState<string>(
    paymentChannels.find((c) => c.isDefault || c.id === 'BANK_TRANSFER_BCA')?.id ||
      (paymentChannels.length > 0 ? paymentChannels[0].id : 'BANK_TRANSFER_BCA')
  );
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isUnassigned = channel?.id === 'UNASSIGNED_OTHER';

  // Filter transactions by search query
  const filteredTrxs = useMemo(() => {
    if (!transactions) return [];
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.transactionNumber.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.clientOrVendorName && t.clientOrVendorName.toLowerCase().includes(q)) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        getTransactionCategoryLabel(t.category).toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Totals for this channel
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amountIDR, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amountIDR, 0),
    [transactions]
  );
  const netFlow = totalIncome - totalExpense;

  if (!isOpen || !channel) return null;

  const handleBatchAssign = async (targetId: string, onlySelected = false) => {
    const trxsToUpdate = onlySelected
      ? transactions.filter((t) => selectedIds.includes(t.id))
      : transactions;

    if (trxsToUpdate.length === 0) return;

    setIsApplyingBatch(true);
    try {
      const targetCh = paymentChannels.find((c) => c.id === targetId);
      const targetName = targetCh ? targetCh.name : targetId;

      trxsToUpdate.forEach((t) => {
        onUpdateTransaction(t.id, {
          paymentMethod: targetId as any,
        });
      });

      setSelectedIds([]);
      setBatchSuccessMessage(
        `Berhasil menautkan ${trxsToUpdate.length} transaksi ke rekening ${targetName}.`
      );

      setTimeout(() => {
        setBatchSuccessMessage(null);
      }, 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApplyingBatch(false);
    }
  };

  const handleSingleAssign = (txId: string, targetId: string) => {
    onUpdateTransaction(txId, {
      paymentMethod: targetId as any,
    });
  };

  const isAllSelected =
    filteredTrxs.length > 0 &&
    filteredTrxs.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrxs.map((t) => t.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isUnassigned
                  ? 'bg-amber-100/70 text-amber-800 border-amber-300'
                  : 'bg-emerald-100/70 text-emerald-800 border-emerald-300'
              }`}
            >
              {isUnassigned ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Landmark className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {channel.name}
                </h3>
                {isUnassigned ? (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Non-Rekening Khusus
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-slate-200/80 text-slate-700">
                    {channel.accountNumber || 'Aktif'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isUnassigned
                  ? 'Daftar mutasi yang belum terhubung ke rekening bank terdaftar'
                  : `Rekening: ${channel.accountNumber || '-'} • A.N: ${channel.accountHolder || '-'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500">Total Mutasi</div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {transactions.length} Transaksi
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Kas Masuk
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono">
              {formatIDR(totalIncome)}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Kas Keluar
            </div>
            <div className="text-sm font-bold text-rose-700 font-mono">
              ({formatIDR(totalExpense)})
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-medium text-slate-600">Net Arus Kas</div>
            <div
              className={`text-sm font-bold font-mono ${
                netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {netFlow >= 0 ? `+${formatIDR(netFlow)}` : `(${formatIDR(Math.abs(netFlow))})`}
            </div>
          </div>
        </div>

        {/* Batch Assign Bar (Only if unassigned or multiple selected) */}
        {isUnassigned && transactions.length > 0 && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900">
                  Tautkan ke Saluran Bank Resmi Sekaligus (Batch Assign)
                </div>
                <div className="text-[11px] text-amber-700">
                  Pilih rekening tujuan untuk memindahkan transaksi ini dari status *Non-Rekening Khusus* ke rekening operasional.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedTargetChannel}
                onChange={(e) => setSelectedTargetChannel(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {paymentChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.accountNumber || ch.id})
                  </option>
                ))}
              </select>

              {selectedIds.length > 0 ? (
                <button
                  onClick={() => handleBatchAssign(selectedTargetChannel, true)}
                  disabled={isApplyingBatch}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tautkan Terpilih ({selectedIds.length})</span>
                </button>
              ) : (
                <button
                  onClick={() => handleBatchAssign(selectedTargetChannel, false)}
                  disabled={isApplyingBatch}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tautkan Semua ({transactions.length})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {batchSuccessMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{batchSuccessMessage}</span>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no trx, tanggal, keterangan, rekanan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredTrxs.length}</strong> dari{' '}
              {transactions.length} transaksi
            </span>
            {isUnassigned && filteredTrxs.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                {isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[50vh]">
          {filteredTrxs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada transaksi yang cocok dengan pencarian.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10 shadow-2xs">
                <tr>
                  {isUnassigned && (
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="py-2.5 px-3">Tanggal / No TRX</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Deskripsi & Rekanan</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Saluran Bank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrxs.map((t, idx) => {
                  const isSelected = selectedIds.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {isUnassigned && (
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(t.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{t.date}</div>
                        <div className="text-[10px] text-slate-500">{t.transactionNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {getTransactionCategoryLabel(t.category)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {t.description}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.clientOrVendorName || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {t.type === 'INCOME' ? (
                          <span className="text-emerald-700">+{formatIDR(t.amountIDR)}</span>
                        ) : (
                          <span className="text-rose-700">({formatIDR(t.amountIDR)})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <select
                          value={t.paymentMethod || 'UNASSIGNED'}
                          onChange={(e) => {
                            if (e.target.value !== 'UNASSIGNED') {
                              handleSingleAssign(t.id, e.target.value);
                            }
                          }}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            !t.paymentMethod || t.paymentMethod === 'UNASSIGNED'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="UNASSIGNED">⚠️ Non-Rekening</option>
                          {paymentChannels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Kategori: <strong className="text-slate-900">{channel.name}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
