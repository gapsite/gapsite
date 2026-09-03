import React, { useState, useRef } from 'react';
import {
  Printer,
  Building2,
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  ShieldCheck,
  Save,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  Eye,
  Trash2,
  Lock,
  Landmark,
  Briefcase,
  Award,
  FileCheck,
  Check,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { CompanyLetterhead } from '../types';

interface CompanyLetterheadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'LOGO_VISUAL' | 'COMPANY_NAME' | 'CONTACT_ADDRESS' | 'SIGNATORY';

export const CompanyLetterheadModal: React.FC<CompanyLetterheadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    companyLetterhead,
    updateCompanyLetterhead,
    resetCompanyLetterheadToDefault,
    isMasterAdmin,
    currentUser,
  } = useProjects();

  const [activeTab, setActiveTab] = useState<ActiveTab>('LOGO_VISUAL');
  const [formData, setFormData] = useState<CompanyLetterhead>(() => ({ ...companyLetterhead }));
  const [previewMode, setPreviewMode] = useState<'FINANCIAL' | 'PAYSLIP'>('FINANCIAL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sync state whenever modal opens or companyLetterhead changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...companyLetterhead });
      setToastMessage(null);
    }
  }, [isOpen, companyLetterhead]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Logo File Upload (PNG/JPG/SVG/WebP) and convert to base64 Data URL
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Mohon unggah gambar PNG, JPG, SVG, atau WebP.');
      return;
    }

    // Validate size (max 2MB for storage performance)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 2 MB agar dokumen cetak dapat dimuat cepat.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        logoUrl: base64,
        logoType: 'IMAGE',
      }));
      showToast('Logo berhasil diunggah! Lihat pratinjau langsung di sebelah kanan.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
      logoType: 'ICON',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Logo kustom dihapus. Menggunakan ikon standar dokumen.');
  };

  const handleSave = () => {
    if (!isMasterAdmin) {
      alert('Akses Ditolak: Hanya role admin.master (Master Admin) yang memiliki wewenang menyimpan perubahan kop surat.');
      return;
    }

    if (!formData.companyName.trim()) {
      alert('Nama perusahaan tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    const result = updateCompanyLetterhead(formData);
    setIsSaving(false);

    if (result.success) {
      showToast(result.message || 'Kop surat berhasil diperbarui!');
    } else {
      alert(result.message || 'Gagal memperbarui kop surat.');
    }
  };

  const handleReset = () => {
    if (!isMasterAdmin) {
      alert('Hanya Master Admin yang berhak mereset kop surat.');
      return;
    }

    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan seluruh identitas kop surat dan logo ke standar default (PT GAP Consulting Indonesia)?'
      )
    ) {
      const result = resetCompanyLetterheadToDefault();
      if (result.success) {
        showToast(result.message || 'Kop surat dikembalikan ke default.');
      }
    }
  };

  const handleTestPrint = () => {
    if (!printAreaRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pratinjau Kop Surat - ${formData.companyName}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            .header-line { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .logo-img { max-height: 56px; width: auto; object-fit: contain; }
            .company-title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
            .company-tagline { font-size: 11px; font-weight: 700; color: #047857; margin: 3px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .company-contact { font-size: 10px; color: #64748b; line-height: 1.5; margin-top: 6px; }
            .sample-content { margin-top: 40px; padding: 20px; border: 1px dashed #cbd5e1; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header-line">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                ${
                  formData.logoUrl
                    ? `<img src="${formData.logoUrl}" class="logo-img" alt="Logo" />`
                    : `<div style="width: 48px; height: 48px; background: #064e3b; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px;">${formData.shortName?.slice(0, 3) || 'GAP'}</div>`
                }
                <div>
                  <h1 class="company-title">${formData.companyName}</h1>
                  <div class="company-tagline">${formData.tagline || ''}</div>
                  <div class="company-contact">
                    ${formData.address || ''}<br />
                    ${formData.taxId ? `${formData.taxId} • ` : ''}${formData.email ? `Email: ${formData.email} • ` : ''}${formData.phone ? `Telp: ${formData.phone}` : ''}
                  </div>
                </div>
              </div>
              <div style="text-align: right; font-family: monospace; font-size: 11px;">
                <div style="font-weight: bold; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                  DOC NO: SAMPLE/TKDN/${new Date().getFullYear()}
                </div>
                <div style="color: #64748b; margin-top: 4px;">
                  Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div class="sample-content">
            <p><strong>[ HALAMAN CETAK DOKUMEN RESMI ]</strong></p>
            <p>Format kop surat dan logo ini akan diterapkan secara otomatis saat Anda mencetak Laporan Keuangan, Slip Gaji Karyawan, Invoice Piutang, dan Berkas Verifikasi TKDN.</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderCurrentLogoBadge = () => {
    if (formData.logoUrl) {
      return (
        <img
          src={formData.logoUrl}
          alt={formData.companyName}
          className="h-12 w-auto max-w-[160px] object-contain rounded-md"
        />
      );
    }

    const iconColor =
      formData.documentHeaderTheme === 'SLATE'
        ? 'bg-slate-900 text-slate-100'
        : formData.documentHeaderTheme === 'BLUE'
        ? 'bg-blue-900 text-blue-300'
        : formData.documentHeaderTheme === 'INDIGO'
        ? 'bg-indigo-900 text-indigo-300'
        : 'bg-emerald-900 text-emerald-300';

    if (formData.logoIconName === 'Building2') {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
          <Building2 className="w-6 h-6 stroke-[2.5]" />
        </div>
      );
    }
    if (formData.logoIconName === 'Landmark') {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
          <Landmark className="w-6 h-6 stroke-[2.5]" />
        </div>
      );
    }
    if (formData.logoIconName === 'Briefcase') {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
          <Briefcase className="w-6 h-6 stroke-[2.5]" />
        </div>
      );
    }
    if (formData.logoIconName === 'Award') {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
          <Award className="w-6 h-6 stroke-[2.5]" />
        </div>
      );
    }
    if (formData.logoIconName === 'FileCheck') {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
          <FileCheck className="w-6 h-6 stroke-[2.5]" />
        </div>
      );
    }

    return (
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-md ${iconColor}`}>
        <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
      </div>
    );
  };

  return (
    <div
      id="modal-company-letterhead-manager"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-4.5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-md shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Pengaturan Kop Surat & Logo Perusahaan
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  admin.master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ubah logo, nama perusahaan, kontak, dan format kop surat untuk seluruh dokumen cetak resmi
              </p>
            </div>
          </div>
          <button
            id="btn-close-letterhead-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Warning if not Master Admin */}
        {!isMasterAdmin && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-rose-800 flex items-center gap-3 text-xs">
            <Lock className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Akses Dibatasi: </span>
              Anda sedang login sebagai <strong>{currentUser.role}</strong>. Hanya akun dengan wewenang{' '}
              <strong>Master Admin (admin.master)</strong> yang diizinkan untuk menyimpan dan memperbarui kop surat serta logo resmi perusahaan.
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500 text-slate-950 px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-950 hover:opacity-75 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Main Content (Split View: Form Left, Preview Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Editor Tabs & Form Inputs (7 Cols) */}
          <div className="lg:col-span-7 p-6 border-r border-slate-200 overflow-y-auto space-y-5">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('LOGO_VISUAL')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'LOGO_VISUAL'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>1. Logo Kop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPANY_NAME')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'COMPANY_NAME'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>2. Nama PT</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CONTACT_ADDRESS')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'CONTACT_ADDRESS'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>3. Alamat & Kontak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNATORY')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'SIGNATORY'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>4. Penandatangan</span>
              </button>
            </div>

            {/* TAB 1: LOGO & VISUAL STYLING */}
            {activeTab === 'LOGO_VISUAL' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Kustomisasi Logo Resmi Dokumen Cetak
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Unggah logo resmi perusahaan Anda (format PNG, SVG, JPG, atau WebP). Logo ini akan ditampilkan di pojok kiri atas kop surat pada semua laporan keuangan, slip gaji, dan faktur.
                  </p>
                </div>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center transition-all bg-slate-50/50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="company-logo-file-input"
                  />

                  {formData.logoUrl ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 inline-block shadow-xs">
                        <img
                          src={formData.logoUrl}
                          alt="Logo Perusahaan"
                          className="h-16 w-auto max-w-[220px] object-contain mx-auto"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <label
                          htmlFor="company-logo-file-input"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Ganti Logo
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Logo
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        File logo kustom aktif dan tersimpan.
                      </p>
                    </div>
                  ) : (
                    <label
                      htmlFor="company-logo-file-input"
                      className="cursor-pointer block space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-800 hover:underline">
                          Klik untuk Unggah Logo Baru
                        </span>
                        <span className="text-xs text-slate-500"> atau seret file ke sini</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Format PNG transparan, SVG, JPG, atau WebP (Maksimal 2 MB)
                      </p>
                    </label>
                  )}
                </div>

                {/* Option: URL Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atau Masukkan URL Logo (Opsional):
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        logoUrl: e.target.value.trim(),
                        logoType: 'IMAGE',
                      }))
                    }
                    placeholder="https://example.com/logo-perusahaan.png"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Fallback Icon Selector if no image */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ikon Emblem Default (Digunakan jika logo gambar tidak diunggah):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'ShieldCheck', label: 'Shield', icon: ShieldCheck },
                      { id: 'Building2', label: 'Building', icon: Building2 },
                      { id: 'Landmark', label: 'Landmark', icon: Landmark },
                      { id: 'Briefcase', label: 'Briefcase', icon: Briefcase },
                      { id: 'Award', label: 'Award', icon: Award },
                      { id: 'FileCheck', label: 'FileCheck', icon: FileCheck },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSelected = (formData.logoIconName || 'ShieldCheck') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              logoIconName: item.id,
                            }))
                          }
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Header Theme Accent */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Aksen Warna Kop Surat:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'EMERALD', label: 'Emerald Green', bg: 'bg-emerald-600', text: 'text-emerald-700' },
                      { id: 'SLATE', label: 'Classic Slate', bg: 'bg-slate-900', text: 'text-slate-800' },
                      { id: 'BLUE', label: 'Corporate Blue', bg: 'bg-blue-600', text: 'text-blue-700' },
                      { id: 'INDIGO', label: 'Modern Indigo', bg: 'bg-indigo-600', text: 'text-indigo-700' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            documentHeaderTheme: theme.id as any,
                          }))
                        }
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          formData.documentHeaderTheme === theme.id
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${theme.bg} shrink-0`} />
                        <span className="text-xs font-medium text-slate-800 truncate">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NAMA PERUSAHAAN & BRANDING */}
            {activeTab === 'COMPANY_NAME' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Nama Resmi & Legalitas Perusahaan
                  </h4>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Nama ini akan tertera sebagai entitas penerbit resmi pada judul utama kop surat, slip gaji karyawan, dan dokumen verifikasi audit TKDN.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Resmi Perusahaan (Badan Hukum) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    placeholder="Contoh: PT GAP CONSULTING INDONESIA"
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold uppercase tracking-wide"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Nama lengkap PT / CV sesuai Akta Pendirian Kemenkumham & NIB.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Singkat / Brand Kop Surat:
                    </label>
                    <input
                      type="text"
                      value={formData.shortName || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, shortName: e.target.value }))
                      }
                      placeholder="Contoh: GAP.CRM atau GAP"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Singkatan emblem atau logo judul
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Pokok Wajib Pajak (NPWP):
                    </label>
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, taxId: e.target.value }))
                      }
                      placeholder="Contoh: NPWP: 42.891.204.6-014.000"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      NPWP resmi perusahaan
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Sub-Judul Usaha Konsultasi:
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    placeholder="Contoh: Statutory TKDN Verification, SNI & Regulatory Advisory Group"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Deskripsi bidang layanan di bawah nama PT pada kop surat
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: ALAMAT & KONTAK */}
            {activeTab === 'CONTACT_ADDRESS' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-700" />
                    Alamat Domisili & Kontak Kantor
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Informasi alamat dan korespondensi yang tertera pada bagian bawah kop surat dokumen resmi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Kantor / Domisili Usaha:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Contoh: Menara Cakrawala Lt. 12, Jl. M.H. Thamrin No. 9, Menteng, Jakarta Pusat 10340"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon Kantor:
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="(021) 390-1288"
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Resmi Perusahaan:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="finance@gapsite.com"
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website Resmi:
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, website: e.target.value }))
                      }
                      placeholder="www.gapsite.com"
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PEJABAT PENANDATANGAN */}
            {activeTab === 'SIGNATORY' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                    Otorisasi & Penandatangan Dokumen Cetak
                  </h4>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Nama dan jabatan direksi yang akan tercetak pada kolom tanda tangan di bagian akhir laporan keuangan eksekutif dan slip gaji.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pejabat Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedSignatoryName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        authorizedSignatoryName: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Bambang Soediro, S.T., M.M."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan Resmi:
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedSignatoryTitle || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        authorizedSignatoryTitle: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Managing Director & Lead TKDN Verifier"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Legalitas / Catatan Kaki:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Catatan keabsahan dokumen..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Live Preview of Letterhead (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Pratinjau Kop Surat Langsung
                </span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('FINANCIAL')}
                    className={`px-2 py-1 rounded transition-colors ${
                      previewMode === 'FINANCIAL'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Laporan
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('PAYSLIP')}
                    className={`px-2 py-1 rounded transition-colors ${
                      previewMode === 'PAYSLIP'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Slip Gaji
                  </button>
                </div>
              </div>

              {/* Realistic Paper Container */}
              <div
                ref={printAreaRef}
                className="bg-white rounded-xl border border-slate-300 shadow-md p-5 text-slate-900 space-y-4 text-left transition-all"
              >
                {/* Official Printable Header */}
                <div className="border-b-2 border-slate-800 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {renderCurrentLogoBadge()}
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase font-mono leading-tight truncate">
                          {formData.companyName || 'NAMA PERUSAHAAN'}
                        </h2>
                        {formData.tagline && (
                          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide leading-tight mt-0.5">
                            {formData.tagline}
                          </p>
                        )}
                        <p className="text-[9px] text-slate-500 leading-tight mt-1">
                          {formData.address || 'Alamat Perusahaan'}
                          <br />
                          {formData.taxId && <span>{formData.taxId} • </span>}
                          {formData.email && <span>Email: {formData.email} • </span>}
                          {formData.phone && <span>Telp: {formData.phone}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Document Body Preview */}
                <div className="space-y-2 pt-1 opacity-80 text-[10px]">
                  <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-100 font-bold uppercase tracking-wider text-slate-800">
                    {previewMode === 'FINANCIAL'
                      ? 'LAPORAN KEUANGAN & AUDIT KONSULTASI RESMI'
                      : 'SLIP GAJI KARYAWAN BULAN BERJALAN'}
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1 text-slate-600">
                    <span>Nomor Referensi:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {previewMode === 'FINANCIAL'
                        ? 'LAP/FIN/2026/09/001'
                        : 'PAY/2026/09/EMP-001'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1 text-slate-600">
                    <span>Status Keabsahan:</span>
                    <span className="font-bold text-emerald-700">✓ TERVERIFIKASI SISTEM</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Otorisasi Cetak:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">
                      {formData.authorizedSignatoryName || 'Direktur Utama'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print Test Action Button */}
              <button
                type="button"
                onClick={handleTestPrint}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                Uji Cetak Kop Surat ke Kertas / PDF
              </button>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Perubahan logo dan nama perusahaan ini akan tersimpan permanen di cloud database dan langsung aktif di seluruh role pengguna saat mencetak dokumen.
                </span>
              </div>
            </div>

            {/* Last Updated Meta */}
            {companyLetterhead.updatedAt && (
              <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-4 text-right">
                Terakhir diubah:{' '}
                {new Date(companyLetterhead.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                oleh <span className="font-semibold text-slate-600">{companyLetterhead.updatedBy || 'admin.master'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isMasterAdmin}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Kembalikan ke Nama & Logo Awal (PT GAP Consulting)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Standar Default
          </button>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isMasterAdmin || isSaving}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Kop Surat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
