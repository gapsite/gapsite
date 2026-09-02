import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Check,
  Power,
  Info,
  DollarSign,
  Copy,
  Landmark,
  Wallet,
  QrCode,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { PaymentChannelDefinition, PaymentChannelCategory } from '../../types';

interface PaymentChannelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel?: (channelId: string) => void;
}

const CATEGORY_OPTIONS: { value: PaymentChannelCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'BANK_TRANSFER', label: 'Transfer Bank / Giro', icon: <Landmark className="w-3.5 h-3.5" /> },
  { value: 'CARD', label: 'Kartu Korporat / Credit Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { value: 'CASH', label: 'Kas Tunai / Petty Cash', icon: <Wallet className="w-3.5 h-3.5" /> },
  { value: 'DIGITAL', label: 'Virtual Account & QRIS', icon: <QrCode className="w-3.5 h-3.5" /> },
  { value: 'OTHER', label: 'Metode Lainnya', icon: <DollarSign className="w-3.5 h-3.5" /> },
];

const BADGE_COLOR_OPTIONS = [
  { label: 'Biru (BCA / Bank)', value: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Sky / Cyan (BRI)', value: 'bg-sky-50 text-sky-700 border-sky-200' },
  { label: 'Amber (Mandiri)', value: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Teal (BNI)', value: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'Emerald (BSI / Syariah)', value: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Ungu (Kartu Korporat)', value: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Oranye (Petty Cash)', value: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Indigo (Virtual Account)', value: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Rose / Pink (QRIS)', value: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Slate (Netral)', value: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export const PaymentChannelManagerModal: React.FC<PaymentChannelManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectChannel,
}) => {
  const {
    isMasterAdmin,
    hasPermission,
    paymentChannels,
    addPaymentChannel,
    updatePaymentChannel,
    deletePaymentChannel,
    togglePaymentChannelStatus,
    resetPaymentChannelsToDefault,
    transactions,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    shortName: string;
    accountNumber: string;
    accountHolder: string;
    category: PaymentChannelCategory;
    description: string;
    badgeColor: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    id: '',
    name: '',
    shortName: '',
    accountNumber: '',
    accountHolder: 'PT GAP CONSULTING INDONESIA',
    category: 'BANK_TRANSFER',
    description: '',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Deletion with Linked Transactions Resolver Modal State
  const [deleteResolveModal, setDeleteResolveModal] = useState<{
    isOpen: boolean;
    channelId: string;
    channelName: string;
    accountNumber?: string;
    linkedTransactions: import('../../types').FinancialTransaction[];
    reassignTargetId: string;
    actionChoice: 'REASSIGN' | 'DELETE_ALL' | 'DEACTIVATE';
  } | null>(null);

  const canManage = isMasterAdmin || hasPermission('MANAGE_FINANCE') || hasPermission('MANAGE_USERS_ROLES');

  const filteredChannels = useMemo(() => {
    return (paymentChannels || []).filter((ch) => {
      if (statusFilter !== 'ALL' && ch.status !== statusFilter) return false;
      if (selectedCategoryTab !== 'ALL' && ch.category !== selectedCategoryTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ch.name.toLowerCase().includes(q);
        const matchShort = (ch.shortName || '').toLowerCase().includes(q);
        const matchAcc = (ch.accountNumber || '').toLowerCase().includes(q);
        const matchHolder = (ch.accountHolder || '').toLowerCase().includes(q);
        const matchId = ch.id.toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchAcc && !matchHolder && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [paymentChannels, statusFilter, selectedCategoryTab, searchQuery]);

  if (!isOpen) return null;

  const handleOpenAddForm = (prefilledCategory: PaymentChannelCategory = 'BANK_TRANSFER') => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      shortName: '',
      accountNumber: '',
      accountHolder: 'PT GAP CONSULTING INDONESIA',
      category: prefilledCategory,
      description: '',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      status: 'ACTIVE',
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ch: PaymentChannelDefinition) => {
    setEditingId(ch.id);
    setFormData({
      id: ch.id,
      name: ch.name,
      shortName: ch.shortName || '',
      accountNumber: ch.accountNumber || '',
      accountHolder: ch.accountHolder || '',
      category: ch.category || 'BANK_TRANSFER',
      description: ch.description || '',
      badgeColor: ch.badgeColor || 'bg-sky-50 text-sky-700 border-sky-200',
      status: ch.status,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim()) {
      setFormError('Nama Bank / Saluran Pembayaran wajib diisi.');
      return;
    }

    if (editingId) {
      // Update existing
      const res = updatePaymentChannel(editingId, {
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        accountHolder: formData.accountHolder.trim() || undefined,
        category: formData.category,
        description: formData.description.trim() || undefined,
        badgeColor: formData.badgeColor,
        status: formData.status,
      });

      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui saluran pembayaran.');
        return;
      }

      setFormSuccess(res.message || 'Saluran pembayaran berhasil diperbarui.');
      setTimeout(() => {
        setIsFormOpen(false);
        setEditingId(null);
      }, 500);
    } else {
      // Add new
      let customId = formData.id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (!customId) {
        customId = `BANK_${formData.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`;
      }

      const res = addPaymentChannel({
        id: customId,
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        accountHolder: formData.accountHolder.trim() || undefined,
        category: formData.category,
        description: formData.description.trim() || undefined,
        badgeColor: formData.badgeColor,
        status: formData.status,
        isDefault: false,
      });

      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan saluran pembayaran.');
        return;
      }

      setFormSuccess(res.message || 'Saluran pembayaran baru berhasil ditambahkan.');
      setTimeout(() => {
        setIsFormOpen(false);
        setEditingId(null);
      }, 500);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!canManage) {
      alert('Akses Ditolak: Anda tidak memiliki wewenang mengelola master data keuangan.');
      return;
    }

    const linkedTrxs = transactions.filter((t) => t.paymentMethod === id);
    const target = paymentChannels.find((c) => c.id === id);

    if (linkedTrxs.length > 0) {
      const defaultReassignTarget =
        paymentChannels.find((c) => c.id !== id && c.status === 'ACTIVE')?.id || 'BANK_TRANSFER_BRI';

      setDeleteResolveModal({
        isOpen: true,
        channelId: id,
        channelName: name,
        accountNumber: target?.accountNumber,
        linkedTransactions: linkedTrxs,
        reassignTargetId: defaultReassignTarget,
        actionChoice: 'REASSIGN',
      });
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus bank / saluran "${name}" secara permanen?`)) {
      const res = deletePaymentChannel(id);
      if (res.message) {
        alert(res.message);
      }
    }
  };

  const handleExecuteDeleteResolve = () => {
    if (!deleteResolveModal) return;
    const { channelId, actionChoice, reassignTargetId } = deleteResolveModal;

    if (actionChoice === 'REASSIGN') {
      const res = deletePaymentChannel(channelId, { reassignTo: reassignTargetId });
      alert(res.message || 'Transaksi berhasil dialihkan dan saluran dihapus.');
    } else if (actionChoice === 'DELETE_ALL') {
      const res = deletePaymentChannel(channelId, { deleteLinked: true });
      alert(res.message || 'Transaksi terhubung dan saluran bank berhasil dihapus permanen.');
    } else {
      const res = deletePaymentChannel(channelId, { force: false });
      alert(res.message || 'Saluran berhasil dinonaktifkan.');
    }

    setDeleteResolveModal(null);
  };

  const handleResetDefaults = () => {
    if (!isMasterAdmin) {
      alert('Akses Ditolak: Hanya Master Admin yang dapat mereset master data perbankan ke bawaan sistem.');
      return;
    }

    if (
      confirm(
        'Perhatian: Tindakan ini akan mengembalikan daftar Bank & Saluran Pembayaran ke standar bawaan sistem (termasuk Bank BRI, BCA, Mandiri, BNI, BSI, Petty Cash, VA, QRIS).\n\nApakah Anda yakin?'
      )
    ) {
      const res = resetPaymentChannelsToDefault();
      if (res.message) {
        alert(res.message);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono">
                  Master Data Saluran Pembayaran & Rekening Bank
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {paymentChannels.length} Saluran
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola daftar bank transfer (Bank BRI, BCA, Mandiri, BNI), kartu kredit, petty cash & virtual account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari bank, nomor rekening, nama pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isMasterAdmin && (
                <button
                  onClick={handleResetDefaults}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Reset daftar bank ke standar sistem (termasuk Bank BRI)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Standar</span>
                </button>
              )}

              {canManage && (
                <button
                  onClick={() => handleOpenAddForm('BANK_TRANSFER')}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-xl transition-all shadow-md shadow-sky-950/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bank / Saluran</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setSelectedCategoryTab('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedCategoryTab === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semua Saluran ({paymentChannels.length})
              </button>
              {CATEGORY_OPTIONS.map((cat) => {
                const count = paymentChannels.filter((c) => c.category === cat.value).length;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategoryTab(cat.value)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      selectedCategoryTab === cat.value
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Hanya Aktif</option>
                <option value="INACTIVE">Hanya Non-Aktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Body: Form OR List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Add / Edit Drawer Form */}
          {isFormOpen && (
            <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-sky-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                    {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {editingId ? 'Edit Saluran Pembayaran / Bank' : 'Tambah Bank / Saluran Pembayaran Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pastikan nama dan nomor rekening akurat untuk pencatatan transaksi keuangan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Saluran / Bank <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BRI Corporate Transfer / Bank Danamon"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Short Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Pendek / Alias
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bank BRI / BRI"
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Rekening / Akun
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0206-01-002980-30-5"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  {/* Account Holder */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Atas Nama / Pemegang Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PT GAP CONSULTING INDONESIA"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kategori Saluran <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Operasional
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="ACTIVE">Aktif (Tampil di Dropdown Transaksi)</option>
                      <option value="INACTIVE">Non-Aktif (Disembunyikan)</option>
                    </select>
                  </div>

                  {/* Badge Styling */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Warna Badge Label
                    </label>
                    <select
                      value={formData.badgeColor}
                      onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {BADGE_COLOR_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deskripsi / Catatan Penggunaan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Rekening utama untuk pencairan verifikasi surveyor & penerimaan fee klien."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-xl shadow-md shadow-sky-950/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingId ? 'Simpan Perubahan' : 'Tambah Bank / Saluran'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Payment Channels */}
          <div className="space-y-3">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">Tidak ada bank atau saluran yang sesuai filter</p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba ubah kata kunci pencarian atau tambah saluran baru.
                </p>
                {canManage && (
                  <button
                    onClick={() => handleOpenAddForm('BANK_TRANSFER')}
                    className="mt-3 px-3.5 py-1.5 text-xs font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bank / Saluran Baru</span>
                  </button>
                )}
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const isActive = ch.status === 'ACTIVE';
                const isCopied = copiedId === ch.id;
                const linkedCount = transactions.filter((t) => t.paymentMethod === ch.id).length;

                return (
                  <div
                    key={ch.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-65'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                              ch.badgeColor || 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {ch.shortName || ch.name}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{ch.name}</h4>

                          {ch.isDefault && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              System Default
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {isActive ? '● Aktif' : '○ Non-Aktif'}
                          </span>
                        </div>

                        {/* Account Number & Holder */}
                        {(ch.accountNumber || ch.accountHolder) && (
                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            {ch.accountNumber && (
                              <div className="flex items-center gap-1 font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                <span>{ch.accountNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(ch.accountNumber!, ch.id)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5"
                                  title="Salin nomor rekening"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {ch.accountHolder && (
                              <span className="text-slate-500 font-medium">
                                a/n <strong className="text-slate-700">{ch.accountHolder}</strong>
                              </span>
                            )}
                            {linkedCount > 0 && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({linkedCount} transaksi terhubung)
                              </span>
                            )}
                          </div>
                        )}

                        {ch.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{ch.description}</p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {onSelectChannel && isActive && (
                          <button
                            onClick={() => {
                              onSelectChannel(ch.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                          >
                            Pilih
                          </button>
                        )}

                        {canManage && (
                          <>
                            {/* Toggle Active Button */}
                            <button
                              onClick={() => togglePaymentChannelStatus(ch.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isActive
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  : 'text-slate-500 bg-slate-100 hover:bg-slate-200 border-slate-200'
                              }`}
                              title={isActive ? 'Non-aktifkan saluran' : 'Aktifkan saluran'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(ch)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Edit rincian bank / saluran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(ch.id, ch.name)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Hapus saluran pembayaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Perubahan pada master bank langsung tersinkronisasi ke formulir input transaksi & laporan buku besar harian.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Linked Transactions Deletion Resolution Modal */}
        {deleteResolveModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-base leading-tight">Penanganan Transaksi Terhubung</h3>
                    <p className="text-xs text-amber-100">
                      Bank: <strong>{deleteResolveModal.channelName}</strong>
                      {deleteResolveModal.accountNumber ? ` (${deleteResolveModal.accountNumber})` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteResolveModal(null)}
                  className="p-1 rounded-lg hover:bg-amber-600 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                  <p className="font-semibold mb-1">
                    Sistem mendeteksi <strong>{deleteResolveModal.linkedTransactions.length} transaksi</strong> dalam buku kas yang tercatat menggunakan rekening/saluran ini:
                  </p>
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {deleteResolveModal.linkedTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white p-2 rounded-lg border border-amber-200/80 flex items-center justify-between text-[11px]"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-slate-800 truncate">{tx.description || 'Transaksi tanpa judul'}</div>
                          <div className="text-slate-500 font-mono text-[10px]">
                            {tx.date} • {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} • {tx.category}
                          </div>
                        </div>
                        <div className={`font-bold font-mono shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}Rp {(tx.amountIDR || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">Pilih Tindakan Penyelesaian:</label>

                  {/* Option 1: Reassign */}
                  <label className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                    deleteResolveModal.actionChoice === 'REASSIGN'
                      ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="resolveAction"
                        checked={deleteResolveModal.actionChoice === 'REASSIGN'}
                        onChange={() =>
                          setDeleteResolveModal((prev) => (prev ? { ...prev, actionChoice: 'REASSIGN' } : null))
                        }
                        className="mt-0.5 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          1. Alihkan Transaksi ke Rekening Lain & Hapus Bank Ini
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Seluruh {deleteResolveModal.linkedTransactions.length} transaksi di atas akan diubah saluran pembayarannya ke rekening yang Anda pilih di bawah, lalu bank {deleteResolveModal.channelName} akan dihapus secara permanen.
                        </p>
                        {deleteResolveModal.actionChoice === 'REASSIGN' && (
                          <div className="mt-2 pt-2 border-t border-sky-200/60">
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Pilih Rekening Tujuan Pengalihan:
                            </label>
                            <select
                              value={deleteResolveModal.reassignTargetId}
                              onChange={(e) =>
                                setDeleteResolveModal((prev) =>
                                  prev ? { ...prev, reassignTargetId: e.target.value } : null
                                )
                              }
                              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            >
                              {paymentChannels
                                .filter((c) => c.id !== deleteResolveModal.channelId && c.status === 'ACTIVE')
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.accountNumber ? `(${c.accountNumber})` : ''} - {c.accountHolder}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Delete All */}
                  <label className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                    deleteResolveModal.actionChoice === 'DELETE_ALL'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="resolveAction"
                        checked={deleteResolveModal.actionChoice === 'DELETE_ALL'}
                        onChange={() =>
                          setDeleteResolveModal((prev) => (prev ? { ...prev, actionChoice: 'DELETE_ALL' } : null))
                        }
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-rose-700">
                          2. Hapus Bank Beserta Seluruh Transaksi Terhubung Secara Permanen
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Hapus bank dan hapus permanen {deleteResolveModal.linkedTransactions.length} transaksi di atas dari buku kas keuangan.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Deactivate Only */}
                  <label className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                    deleteResolveModal.actionChoice === 'DEACTIVATE'
                      ? 'border-slate-500 bg-slate-100 ring-2 ring-slate-400/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="resolveAction"
                        checked={deleteResolveModal.actionChoice === 'DEACTIVATE'}
                        onChange={() =>
                          setDeleteResolveModal((prev) => (prev ? { ...prev, actionChoice: 'DEACTIVATE' } : null))
                        }
                        className="mt-0.5 text-slate-600 focus:ring-slate-500"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800">
                          3. Nonaktifkan Saja (Status INACTIVE)
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Menyembunyikan bank dari form pencatatan transaksi baru tanpa menghapus data transaksi historis.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteResolveModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteResolve}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer shadow-xs ${
                    deleteResolveModal.actionChoice === 'DELETE_ALL'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  Eksekusi Pilihan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
