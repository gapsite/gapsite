import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  SlidersHorizontal,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Layers,
  ShieldCheck,
  Percent,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { TermDistributionSchemeDefinition, TermMilestoneTemplateItem } from '../../types';
import { validateSchemePercentageSum } from '../../utils/governmentProjectCalculations';
import { generateUniqueId } from '../../utils/idGenerator';

interface TermDistributionSchemeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (scheme: TermDistributionSchemeDefinition) => void;
}

const TERM_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
];

export const TermDistributionSchemeManagerModal: React.FC<TermDistributionSchemeManagerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const {
    termDistributionSchemes,
    addTermDistributionScheme,
    updateTermDistributionScheme,
    deleteTermDistributionScheme,
    toggleTermDistributionSchemeStatus,
    resetTermDistributionSchemesToDefault,
    isMasterAdmin,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTerms, setFormTerms] = useState<TermMilestoneTemplateItem[]>([
    { termNumber: 1, title: 'Termin I - Uang Muka (20%)', percentage: 20 },
    { termNumber: 2, title: 'Termin II - Laporan Antara & Verifikasi (40%)', percentage: 40 },
    { termNumber: 3, title: 'Termin III - BAST & Sertifikat Terbit (40%)', percentage: 40 },
  ]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const percentageValidation = useMemo(() => {
    return validateSchemePercentageSum(formTerms);
  }, [formTerms]);

  const filteredSchemes = useMemo(() => {
    return (termDistributionSchemes || []).filter((item) => {
      if (filterStatus === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (filterStatus === 'INACTIVE' && item.status !== 'INACTIVE') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [termDistributionSchemes, filterStatus, searchQuery]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormTerms([
      { termNumber: 1, title: 'Termin I - Uang Muka (20%)', percentage: 20 },
      { termNumber: 2, title: 'Termin II - Laporan Antara & Verifikasi (40%)', percentage: 40 },
      { termNumber: 3, title: 'Termin III - BAST & Sertifikat Terbit (40%)', percentage: 40 },
    ]);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (scheme: TermDistributionSchemeDefinition) => {
    setEditingId(scheme.id);
    setFormName(scheme.name);
    setFormDescription(scheme.description || '');
    setFormTerms(
      scheme.terms.map((t, i) => ({
        termNumber: t.termNumber || i + 1,
        title: t.title,
        percentage: t.percentage,
        description: t.description || '',
      }))
    );
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleAddTermRow = () => {
    const nextNumber = formTerms.length + 1;
    const remaining = Math.max(0, 100 - percentageValidation.totalPercentage);
    setFormTerms([
      ...formTerms,
      {
        termNumber: nextNumber,
        title: `Termin ${nextNumber} (${remaining > 0 ? remaining : 10}%)`,
        percentage: remaining > 0 ? remaining : 10,
      },
    ]);
  };

  const handleRemoveTermRow = (index: number) => {
    if (formTerms.length <= 1) {
      alert('Skema termin minimal harus memiliki 1 tahap termin.');
      return;
    }
    const updated = formTerms
      .filter((_, i) => i !== index)
      .map((t, i) => ({
        ...t,
        termNumber: i + 1,
      }));
    setFormTerms(updated);
  };

  const handleBalanceEqually = () => {
    const count = formTerms.length;
    if (count === 0) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;

    const updated = formTerms.map((t, i) => {
      const pct = i === count - 1 ? base + remainder : base;
      return {
        ...t,
        percentage: pct,
        title: t.title.replace(/\(\d+%\)/, `(${pct}%)`),
      };
    });
    setFormTerms(updated);
  };

  const handleBalanceLastTerm = () => {
    const count = formTerms.length;
    if (count <= 1) {
      setFormTerms([{ ...formTerms[0], percentage: 100 }]);
      return;
    }
    const previousSum = formTerms.slice(0, count - 1).reduce((acc, t) => acc + (Number(t.percentage) || 0), 0);
    const newLastPercentage = Math.max(0, 100 - previousSum);
    const updated = [...formTerms];
    updated[count - 1] = {
      ...updated[count - 1],
      percentage: newLastPercentage,
      title: updated[count - 1].title.replace(/\(\d+%\)/, `(${newLastPercentage}%)`),
    };
    setFormTerms(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formName.trim()) {
      setFeedback({ type: 'error', message: 'Nama skema termin wajib diisi.' });
      return;
    }

    if (!percentageValidation.isValid) {
      setFeedback({
        type: 'error',
        message: `Total persentase harus tepat 100%. Saat ini total akumulasi: ${percentageValidation.totalPercentage}%. Gunakan tombol "Seimbangkan Otomatis".`,
      });
      return;
    }

    const payloadTerms: TermMilestoneTemplateItem[] = formTerms.map((t, idx) => ({
      termNumber: idx + 1,
      title: t.title.trim() || `Termin ${idx + 1} (${t.percentage}%)`,
      percentage: Number(t.percentage) || 0,
      description: t.description?.trim() || undefined,
    }));

    if (editingId) {
      const res = updateTermDistributionScheme(editingId, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        termCount: payloadTerms.length,
        terms: payloadTerms,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Skema termin berhasil diperbarui secara real-time.' });
        setTimeout(() => {
          setIsFormOpen(false);
          setEditingId(null);
        }, 600);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui skema termin.' });
      }
    } else {
      const generatedId = generateUniqueId(`SCHEME_${payloadTerms.length}_TERMIN`);
      const res = addTermDistributionScheme({
        id: generatedId,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        termCount: payloadTerms.length,
        terms: payloadTerms,
        status: 'ACTIVE',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Skema termin baru berhasil ditambahkan secara real-time.' });
        if (onSelect && res.scheme) {
          onSelect(res.scheme);
        }
        setTimeout(() => {
          setIsFormOpen(false);
        }, 600);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menambahkan skema termin.' });
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus skema termin "${name}"? Perubahan akan disinkronkan secara real-time ke seluruh sistem.`)) {
      const res = deleteTermDistributionScheme(id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Skema termin berhasil dihapus.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus skema.' });
      }
    }
  };

  const handleToggleStatus = (id: string) => {
    const res = toggleTermDistributionSchemeStatus(id);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message || 'Gagal mengubah status.' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset master skema pembagian termin ke standar pengadaan pemerintah (APBN 3 Termin, 2 Termin, dsb)?')) {
      const res = resetTermDistributionSchemesToDefault();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Master skema termin berhasil direset.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal mereset data.' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Formulasi Pembayaran & Kontrak
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  Real-Time Sync
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Kelola Master Skema Pembagian Termin
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama skema termin atau rincian persentase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('INACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'INACTIVE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Non-Aktif
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Skema Termin Baru</span>
            </button>
            {isMasterAdmin && (
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Reset ke Standar Pemerintah"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Form or Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isFormOpen ? (
            <div className="bg-slate-50/80 border border-indigo-200 rounded-2xl p-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>{editingId ? 'Edit Skema Pembagian Termin' : 'Tambah Skema Pembagian Termin Baru'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700">Nama Skema Termin *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4 Termin Khusus (20% - 30% - 30% - 20%)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jumlah Tahap</label>
                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-indigo-700">
                      {formTerms.length} Tahap Termin
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Deskripsi / Penjelasan Skema</label>
                  <input
                    type="text"
                    placeholder="Ketentuan pengajuan SP2D, syarat dokumen BAP/BAST pada setiap tahapan..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Formulasi Bobot Termin Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 text-xs">Formulasi Bobot & Judul Tiap Termin</span>
                      <p className="text-[10px] text-slate-500">
                        Pastikan jumlah total persentase seluruh termin tepat 100%.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleBalanceEqually}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Bagi rata persentase secara proporsional"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Bagi Rata</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBalanceLastTerm}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Sesuaikan termin terakhir agar pas 100%"
                      >
                        <Percent className="w-3 h-3 text-emerald-500" />
                        <span>Auto-100% Termin Akhir</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTermRow}
                        className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tambah Termin</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    {formTerms.map((term, i) => {
                      const colorClass = TERM_COLORS[i % TERM_COLORS.length];
                      return (
                        <div
                          key={i}
                          style={{ width: `${Math.max(0, Math.min(100, term.percentage))}%` }}
                          className={`${colorClass} h-full transition-all`}
                          title={`Termin ${i + 1}: ${term.percentage}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Terms List Rows */}
                  <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                    {formTerms.map((term, index) => {
                      const colorClass = TERM_COLORS[index % TERM_COLORS.length];
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${colorClass} shrink-0`} />
                          <span className="w-16 font-mono font-bold text-slate-700 text-[11px] shrink-0">
                            Termin {index + 1}
                          </span>

                          <input
                            type="text"
                            required
                            placeholder={`Judul Termin ${index + 1}`}
                            value={term.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormTerms((prev) =>
                                prev.map((t, i) => (i === index ? { ...t, title: val } : t))
                              );
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              step="0.5"
                              required
                              value={term.percentage}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormTerms((prev) =>
                                  prev.map((t, i) => (i === index ? { ...t, percentage: val } : t))
                                );
                              }}
                              className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right focus:outline-hidden focus:border-indigo-500"
                            />
                            <span className="font-bold text-slate-500">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTermRow(index)}
                            disabled={formTerms.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                            title="Hapus termin ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Percentage Total Meter */}
                  <div
                    className={`px-3.5 py-2 rounded-xl border flex items-center justify-between font-bold text-xs ${
                      percentageValidation.isValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {percentageValidation.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>
                        {percentageValidation.isValid
                          ? 'Total Bobot: 100% (Formulasi Sah & Proporsional)'
                          : `Total Bobot: ${percentageValidation.totalPercentage}% (${
                              percentageValidation.difference > 0
                                ? `Kurang ${percentageValidation.difference}%`
                                : `Lebih ${Math.abs(percentageValidation.difference)}%`
                            })`}
                      </span>
                    </div>

                    {!percentageValidation.isValid && (
                      <button
                        type="button"
                        onClick={handleBalanceLastTerm}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Sesuaikan Termin {formTerms.length}
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!percentageValidation.isValid}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    {editingId ? 'Simpan Skema Termin' : 'Daftarkan Skema Baru'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSchemes.length === 0 ? (
              <div className="col-span-2 py-10 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                Tidak ada skema termin yang ditemukan.
              </div>
            ) : (
              filteredSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                            {scheme.termCount} Termin
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(scheme.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                              scheme.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {scheme.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{scheme.name}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(scheme)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Skema"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(scheme.id, scheme.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Skema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {scheme.description && (
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {scheme.description}
                      </p>
                    )}

                    {/* Progress Bar of Terms */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      {scheme.terms.map((t, idx) => {
                        const colorClass = TERM_COLORS[idx % TERM_COLORS.length];
                        return (
                          <div
                            key={idx}
                            style={{ width: `${t.percentage}%` }}
                            className={`${colorClass} h-full`}
                            title={`${t.title}: ${t.percentage}%`}
                          />
                        );
                      })}
                    </div>

                    {/* Terms Breakdown */}
                    <div className="space-y-1 pt-1">
                      {scheme.terms.map((t, idx) => {
                        const colorClass = TERM_COLORS[idx % TERM_COLORS.length];
                        return (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 truncate max-w-[75%]">
                              <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
                              <span className="text-slate-700 truncate">{t.title}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              {t.percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(scheme);
                        onClose();
                      }}
                      className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Gunakan Skema Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Skema termin tersimpan real-time dan dapat langsung digunakan oleh seluruh role & user.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
