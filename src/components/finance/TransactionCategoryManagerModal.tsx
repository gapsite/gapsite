import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Check,
  Settings,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { TransactionCategoryDefinition, TransactionType } from '../../types';

interface TransactionCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType | 'ALL';
  onCategoryCreated?: (newCategory: TransactionCategoryDefinition) => void;
}

const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500' },
  { value: 'rose', label: 'Rose Red', bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500' },
  { value: 'amber', label: 'Amber Yellow', bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500' },
  { value: 'blue', label: 'Sky Blue', bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500' },
  { value: 'indigo', label: 'Indigo Purple', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500' },
  { value: 'purple', label: 'Violet Purple', bg: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500' },
  { value: 'teal', label: 'Teal Cyan', bg: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500' },
  { value: 'slate', label: 'Slate Gray', bg: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500' },
];

export const TransactionCategoryManagerModal: React.FC<TransactionCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  initialType = 'ALL',
  onCategoryCreated,
}) => {
  const {
    transactionCategories,
    addTransactionCategory,
    updateTransactionCategory,
    deleteTransactionCategory,
    toggleTransactionCategoryStatus,
    resetTransactionCategoriesToDefault,
    isMasterAdmin,
    currentUser,
  } = useProjects();

  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPENSE' | 'INCOME'>(
    initialType === 'ALL' ? 'ALL' : initialType
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formGroup, setFormGroup] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('emerald');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Group options dynamically extracted
  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    transactionCategories.forEach((c) => {
      if (c.group) groups.add(c.group);
    });
    return Array.from(groups);
  }, [transactionCategories]);

  // Filtered List
  const filteredCategories = useMemo(() => {
    return transactionCategories.filter((cat) => {
      if (activeTab !== 'ALL' && cat.type !== activeTab) return false;
      if (selectedGroup !== 'ALL' && cat.group !== selectedGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesId = cat.id.toLowerCase().includes(q);
        const matchesGroup = cat.group?.toLowerCase().includes(q);
        const matchesDesc = cat.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesGroup && !matchesDesc) return false;
      }
      return true;
    });
  }, [transactionCategories, activeTab, selectedGroup, searchQuery]);

  const handleOpenAddForm = (typeDefault?: TransactionType) => {
    setEditingId(null);
    setFormName('');
    setFormType(typeDefault || (activeTab === 'ALL' ? 'EXPENSE' : activeTab));
    setFormGroup(typeDefault === 'INCOME' ? 'Pendapatan' : 'Operasional & Rutin');
    setFormDescription('');
    setFormColor('emerald');
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (cat: TransactionCategoryDefinition) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormGroup(cat.group || '');
    setFormDescription(cat.description || '');
    setFormColor(cat.color || 'emerald');
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: 'error', message: 'Nama kategori harus diisi.' });
      return;
    }

    if (editingId) {
      // Update
      const res = updateTransactionCategory(editingId, {
        name: formName.trim(),
        type: formType,
        group: formGroup.trim() || undefined,
        description: formDescription.trim() || undefined,
        color: formColor,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Kategori berhasil diperbarui.' });
        setIsFormOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui kategori.' });
      }
    } else {
      // Create new
      const res = addTransactionCategory({
        id: formName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        name: formName.trim(),
        type: formType,
        group: formGroup.trim() || (formType === 'INCOME' ? 'Pendapatan' : 'Operasional & Rutin'),
        description: formDescription.trim() || undefined,
        color: formColor,
        status: 'ACTIVE',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Kategori baru berhasil ditambahkan.' });
        if (res.category && onCategoryCreated) {
          onCategoryCreated(res.category);
        }
        setIsFormOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menambahkan kategori.' });
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      const res = deleteTransactionCategory(id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Kategori dihapus.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus kategori.' });
      }
    }
  };

  const handleToggleStatus = (id: string) => {
    const res = toggleTransactionCategoryStatus(id);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Status diperbarui.' });
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset semua kategori transaksi kembali ke standar bawaan sistem?')) {
      const res = resetTransactionCategoriesToDefault();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Kategori berhasil direset.' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Master Kategori Keuangan (Expense & Income)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  <ShieldCheck className="w-3 h-3" />
                  Admin.Master Editable
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kelola daftar sub-menu dropdown kategori pengeluaran dan pemasukan buku kas perusahaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Bar: Tabs & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({transactionCategories.length})
              </button>
              <button
                onClick={() => setActiveTab('EXPENSE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Pengeluaran / Expense ({transactionCategories.filter((c) => c.type === 'EXPENSE').length})
              </button>
              <button
                onClick={() => setActiveTab('INCOME')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Pemasukan / Income ({transactionCategories.filter((c) => c.type === 'INCOME').length})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleOpenAddForm()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori Baru
              </button>
              {isMasterAdmin && (
                <button
                  onClick={handleResetDefaults}
                  title="Reset ke Standar Sistem"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search & Group Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kategori (misal: Listrik, Gaji, Makan, Transportasi, LVI, dll)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">Semua Kelompok Grup</option>
                {existingGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inline Form (Add or Edit) */}
          {isFormOpen && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {editingId ? 'Edit Kategori Keuangan' : 'Tambah Kategori Keuangan Baru'}
                  </h4>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jenis Transaksi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as TransactionType)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                    >
                      <option value="EXPENSE">Pengeluaran / Expense (Outflow)</option>
                      <option value="INCOME">Pemasukan / Income (Inflow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Submenu Kategori <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LISTRIK / GAJI KARYAWAN / MAKAN & MINUM"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kelompok / Grup Akun
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Operasional & Rutin / Payroll & HR"
                      value={formGroup}
                      onChange={(e) => setFormGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Keterangan / Deskripsi Penggunaan
                    </label>
                    <input
                      type="text"
                      placeholder="Deskripsi singkat pos pengeluaran ini..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Warna Badge
                    </label>
                    <select
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Simpan Kategori Baru'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Table / List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Submenu Kategori</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Grup Klasifikasi</th>
                  <th className="py-3 px-4">Deskripsi / Pemakaian</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada kategori yang cocok dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const colorStyle = COLOR_OPTIONS.find((c) => c.value === cat.color) || COLOR_OPTIONS[0];
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs border ${colorStyle.bg}`}>
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({cat.id})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {cat.type === 'INCOME' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <ArrowUpRight className="w-3 h-3" /> Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                              <ArrowDownRight className="w-3 h-3" /> Expense
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {cat.group || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-[240px] truncate" title={cat.description}>
                          {cat.description || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(cat.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              cat.status === 'INACTIVE'
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title="Klik untuk mengubah status"
                          >
                            {cat.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditForm(cat)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Preset Highlights */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Submenu Kategori Pengeluaran Standar:
            </h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                '1. LVI & AUDIT OFFICIAL FEE',
                '2. PAJAK PPN 11%',
                '3. PAJAK PPH 23 (JASA & KONSULTANSI)',
                '4. GAJI KARYAWAN',
                '5. INTERNET',
                '6. LISTRIK',
                '7. OPERASIONAL KANTOR',
                '8. MAKAN & MINUM',
                '9. TRANSPORTASI',
                '10. BANK INTEREST',
                '11. SEWA KANTOR',
                '12. OFFICE & UTILITIES EXPENSE',
                '13. MISCELLANEOUS EXPENSE',
              ].map((item) => (
                <span key={item} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total {filteredCategories.length} kategori ditampilkan
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
