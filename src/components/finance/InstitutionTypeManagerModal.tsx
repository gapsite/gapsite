import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Landmark,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Building2,
  Tag,
  ShieldCheck,
  Check,
  Power,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { GovernmentInstitutionTypeDefinition, GovernmentFundingSource } from '../../types';

interface InstitutionTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (type: GovernmentInstitutionTypeDefinition) => void;
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Biru (Pusat / Kemenkeu)', bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500' },
  { value: 'indigo', label: 'Indigo (Lembaga Negara)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500' },
  { value: 'emerald', label: 'Hijau Emerald (Pemda / SKPD)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500' },
  { value: 'violet', label: 'Ungu Violet (BUMN Holding)', bg: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500' },
  { value: 'teal', label: 'Teal (BUMD)', bg: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500' },
  { value: 'amber', label: 'Amber (BLU / BLUD)', bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500' },
  { value: 'rose', label: 'Merah Rose (Universitas / PTN)', bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500' },
  { value: 'slate', label: 'Abu Slate', bg: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500' },
];

export const InstitutionTypeManagerModal: React.FC<InstitutionTypeManagerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const {
    institutionTypes,
    addInstitutionType,
    updateInstitutionType,
    deleteInstitutionType,
    toggleInstitutionTypeStatus,
    resetInstitutionTypesToDefault,
    isMasterAdmin,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPphType, setFormPphType] = useState<'PPH_22' | 'PPH_23' | 'PPH_FINAL' | 'NONE'>('PPH_22');
  const [formPphRate, setFormPphRate] = useState<number>(1.5);
  const [formPpnRate, setFormPpnRate] = useState<number>(11);
  const [formFundingSource, setFormFundingSource] = useState<GovernmentFundingSource>('APBN');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredTypes = useMemo(() => {
    return (institutionTypes || []).filter((item) => {
      if (filterStatus === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (filterStatus === 'INACTIVE' && item.status !== 'INACTIVE') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesCode = item.code?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [institutionTypes, filterStatus, searchQuery]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormId('');
    setFormName('');
    setFormCode('');
    setFormPphType('PPH_22');
    setFormPphRate(1.5);
    setFormPpnRate(11);
    setFormFundingSource('APBN');
    setFormDescription('');
    setFormColor('blue');
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: GovernmentInstitutionTypeDefinition) => {
    setEditingId(item.id);
    setFormId(item.id);
    setFormName(item.name);
    setFormCode(item.code || '');
    setFormPphType(item.defaultPphType || 'PPH_22');
    setFormPphRate(item.defaultPphRate ?? 1.5);
    setFormPpnRate(item.defaultPpnRate ?? 11);
    setFormFundingSource(item.defaultFundingSource || 'APBN');
    setFormDescription(item.description || '');
    setFormColor(item.badgeColor || 'blue');
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formName.trim()) {
      setFeedback({ type: 'error', message: 'Nama tipe instansi wajib diisi.' });
      return;
    }

    if (editingId) {
      const res = updateInstitutionType(editingId, {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        defaultPphType: formPphType,
        defaultPphRate: Number(formPphRate) || 0,
        defaultPpnRate: Number(formPpnRate) || 0,
        defaultFundingSource: formFundingSource,
        description: formDescription.trim() || undefined,
        badgeColor: formColor,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Tipe instansi berhasil diperbarui secara real-time.' });
        setTimeout(() => {
          setIsFormOpen(false);
          setEditingId(null);
        }, 600);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui tipe instansi.' });
      }
    } else {
      const cleanId = (formId || formName)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_');

      const res = addInstitutionType({
        id: cleanId,
        name: formName.trim(),
        code: formCode.trim() || undefined,
        defaultPphType: formPphType,
        defaultPphRate: Number(formPphRate) || 0,
        defaultPpnRate: Number(formPpnRate) || 0,
        defaultFundingSource: formFundingSource,
        description: formDescription.trim() || undefined,
        badgeColor: formColor,
        status: 'ACTIVE',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Tipe instansi baru berhasil ditambahkan secara real-time.' });
        if (onSelect && res.institutionType) {
          onSelect(res.institutionType);
        }
        setTimeout(() => {
          setIsFormOpen(false);
        }, 600);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menambahkan tipe instansi.' });
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus tipe instansi "${name}"? Perubahan akan disimpan dan disinkronkan secara real-time ke seluruh sistem.`)) {
      const res = deleteInstitutionType(id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Tipe instansi berhasil dihapus.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus.' });
      }
    }
  };

  const handleToggleStatus = (id: string) => {
    const res = toggleInstitutionTypeStatus(id);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message || 'Gagal mengubah status.' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh master tipe instansi ke standar pemerintah (Kementerian, BUMN, Pemda, dsb)?')) {
      const res = resetInstitutionTypesToDefault();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Master tipe instansi berhasil direset.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal mereset data.' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
                  Master Data Pengadaan & Perpajakan
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  Real-Time Sync
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Kelola Master Tipe Instansi Pemerintah & BUMN
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

        {/* Feedback alert */}
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
                placeholder="Cari nama instansi, kode, atau tarif pajak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('INACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterStatus === 'INACTIVE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tipe Instansi Baru</span>
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

        {/* Content Body: Table or Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isFormOpen ? (
            <div className="bg-slate-50/80 border border-blue-200 rounded-2xl p-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{editingId ? 'Edit Tipe Instansi' : 'Tambah Tipe Instansi Pemerintah Baru'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700">Nama Tipe Instansi *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kementerian RI / Badan Otorita Khusus"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (!editingId && !formId) {
                          setFormId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode Unik / ID *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingId}
                      placeholder="e.g. BADAN_OTORITA"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold uppercase disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Singkatan / Kode</label>
                    <input
                      type="text"
                      placeholder="e.g. BOK / KEMEN"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Sumber Dana Standar</label>
                    <select
                      value={formFundingSource}
                      onChange={(e) => setFormFundingSource(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="APBN">APBN</option>
                      <option value="APBD">APBD</option>
                      <option value="BUMN_INTERNAL">BUMN (Internal)</option>
                      <option value="BLU">BLU / BLUD</option>
                      <option value="DAK_DAU">DAK / DAU</option>
                      <option value="HIBAH">Hibah</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenis Potongan PPh Standar</label>
                    <select
                      value={formPphType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setFormPphType(val);
                        if (val === 'PPH_22') setFormPphRate(1.5);
                        else if (val === 'PPH_23') setFormPphRate(2.0);
                        else if (val === 'PPH_FINAL') setFormPphRate(1.75);
                        else if (val === 'NONE') setFormPphRate(0);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="PPH_22">PPh Pasal 22 (Pemerintah/Satker - 1.5%)</option>
                      <option value="PPH_23">PPh Pasal 23 (BUMN/BLU/Konsultansi - 2.0%)</option>
                      <option value="PPH_FINAL">PPh Final Jasa Konstruksi (1.75% / 0.5%)</option>
                      <option value="NONE">Tanpa Potongan PPh</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tarif Standar PPh (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formPphRate}
                      onChange={(e) => setFormPphRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tarif PPN WAPU Dipungut (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formPpnRate}
                      onChange={(e) => setFormPpnRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">Umumnya 11% (atau 12% sesuai UU HPP terbaru)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Warna Badge Visual</label>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormColor(c.value)}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition-all ${
                            c.bg
                          } ${formColor === c.value ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {c.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Deskripsi & Ketentuan Pengadaan / Satker</label>
                  <textarea
                    rows={2}
                    placeholder="Ketentuan administrasi, mekanisme LS KPPN / Kasda, atau peraturan kementerian terkait..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Daftarkan Tipe Instansi'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* List Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Tipe Instansi</th>
                  <th className="py-2.5 px-3">Sumber Dana</th>
                  <th className="py-2.5 px-3">Standar PPh</th>
                  <th className="py-2.5 px-3">PPN WAPU</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada tipe instansi yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((item) => {
                    const colorStyle = COLOR_OPTIONS.find((c) => c.value === item.badgeColor)?.bg || 'bg-blue-50 text-blue-700 border-blue-200';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${colorStyle}`}>
                              {item.code || item.id}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.description && (
                                <div className="text-[10px] text-slate-500 line-clamp-1 max-w-sm">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                            {item.defaultFundingSource || 'APBN'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-rose-700">
                            {item.defaultPphType.replace('_', ' ')} ({item.defaultPphRate}%)
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {item.defaultPpnRate}% WAPU
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Klik untuk ubah status aktif/non-aktif"
                          >
                            {item.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onSelect && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelect(item);
                                  onClose();
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Pilih
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Tipe Instansi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Tipe Instansi"
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Setiap perubahan disinkronkan otomatis secara real-time ke seluruh role dan perangkat.</span>
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
