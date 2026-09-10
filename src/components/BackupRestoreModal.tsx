import React, { useState, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileJson,
  Calendar,
  Layers,
  X,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupFilePayload {
  version: string;
  appName: string;
  exportedAt: string;
  exportedBy?: string;
  summary: {
    projectsCount: number;
    dispositionsCount: number;
    transactionsCount: number;
    receivablesCount: number;
    taxObligationsCount: number;
    payrollsCount: number;
    governmentProjectsCount: number;
    retailProjectsCount: number;
    overheadExpensesCount: number;
    officeRentContractsCount: number;
    bankLoansCount: number;
    teamMembersCount: number;
  };
  data: {
    projects: any[];
    teamMembers: any[];
    dispositions: any[];
    transactions: any[];
    receivables: any[];
    taxObligations: any[];
    bankLoans: any[];
    companyCapital: any;
    payrollPayments: any[];
    salaryConfigs: any[];
    governmentProjects: any[];
    retailProjects: any[];
    overheadExpenses: any[];
    officeRentContracts: any[];
    serviceTypes: any[];
    documentTypes: any[];
    documentCategories: any[];
    transactionCategories: any[];
    paymentChannels: any[];
    institutionTypes: any[];
    termDistributionSchemes: any[];
    companyLetterhead: any;
    roleDefinitions: any;
    assignedByOptions: string[];
    deletedProjectIds?: string[];
    deletedDispositionIds?: string[];
    deletedTransactionIds?: string[];
    deletedReceivableIds?: string[];
    deletedTaxIds?: string[];
    deletedOverheadIds?: string[];
    deletedPayrollIds?: string[];
  };
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const {
    projects,
    teamMembers,
    dispositions,
    transactions,
    receivables,
    taxObligations,
    bankLoans,
    companyCapital,
    payrollPayments,
    salaryConfigs,
    governmentProjects,
    retailProjects,
    overheadExpenses,
    officeRentContracts,
    serviceTypes,
    documentTypes,
    documentCategories,
    transactionCategories,
    paymentChannels,
    institutionTypes,
    termDistributionSchemes,
    companyLetterhead,
    roleDefinitions,
    assignedByOptions,
    deletedProjectIds,
    deletedDispositionIds,
    deletedTransactionIds,
    deletedReceivableIds,
    deletedTaxIds,
    deletedOverheadIds,
    deletedPayrollIds,
    restoreAllDataFromBackup,
    currentUser,
  } = useProjects();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [includeSystemConfigs, setIncludeSystemConfigs] = useState(true);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedJson, setImportedJson] = useState<BackupFilePayload | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [importStatus, setImportStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Handle Export / Download JSON
  const handleExportBackup = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `KCK_CRM_Backup_${dateStr}.json`;

      const payload: BackupFilePayload = {
        version: '2.0',
        appName: 'KCK CRM',
        exportedAt: now.toISOString(),
        exportedBy: currentUser?.name || 'Administrator',
        summary: {
          projectsCount: projects.length,
          dispositionsCount: dispositions.length,
          transactionsCount: transactions.length,
          receivablesCount: receivables.length,
          taxObligationsCount: taxObligations.length,
          payrollsCount: payrollPayments.length,
          governmentProjectsCount: governmentProjects.length,
          retailProjectsCount: retailProjects.length,
          overheadExpensesCount: overheadExpenses.length,
          officeRentContractsCount: officeRentContracts.length,
          bankLoansCount: bankLoans.length,
          teamMembersCount: teamMembers.length,
        },
        data: {
          projects,
          teamMembers,
          dispositions,
          transactions,
          receivables,
          taxObligations,
          bankLoans,
          companyCapital,
          payrollPayments,
          salaryConfigs,
          governmentProjects,
          retailProjects,
          overheadExpenses,
          officeRentContracts,
          serviceTypes: includeSystemConfigs ? serviceTypes : [],
          documentTypes: includeSystemConfigs ? documentTypes : [],
          documentCategories: includeSystemConfigs ? documentCategories : [],
          transactionCategories: includeSystemConfigs ? transactionCategories : [],
          paymentChannels: includeSystemConfigs ? paymentChannels : [],
          institutionTypes: includeSystemConfigs ? institutionTypes : [],
          termDistributionSchemes: includeSystemConfigs ? termDistributionSchemes : [],
          companyLetterhead: includeSystemConfigs ? companyLetterhead : null,
          roleDefinitions: includeSystemConfigs ? roleDefinitions : {},
          assignedByOptions: includeSystemConfigs ? assignedByOptions : [],
          deletedProjectIds: Array.from(deletedProjectIds || []),
          deletedDispositionIds: Array.from(deletedDispositionIds || []),
          deletedTransactionIds: Array.from(deletedTransactionIds || []),
          deletedReceivableIds: Array.from(deletedReceivableIds || []),
          deletedTaxIds: Array.from(deletedTaxIds || []),
          deletedOverheadIds: Array.from(deletedOverheadIds || []),
          deletedPayrollIds: Array.from(deletedPayrollIds || []),
        },
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Backup berhasil diunduh (${filename})!`);
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err: any) {
      console.error('Export backup error:', err);
      alert('Gagal mengekspor data backup: ' + (err?.message || err));
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportStatus('reading');
    setStatusMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Basic payload validation
        if (!parsed || typeof parsed !== 'object' || (!parsed.data && !parsed.projects)) {
          throw new Error('Format file JSON tidak valid. Pastikan file adalah hasil backup KCK CRM.');
        }

        // Normalize if old format
        let normalizedPayload: BackupFilePayload;
        if (parsed.data) {
          normalizedPayload = parsed as BackupFilePayload;
        } else {
          // Legacy format fallback
          normalizedPayload = {
            version: parsed.version || '1.0',
            appName: 'KCK CRM',
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            summary: {
              projectsCount: parsed.projects?.length || 0,
              dispositionsCount: parsed.dispositions?.length || 0,
              transactionsCount: parsed.transactions?.length || 0,
              receivablesCount: parsed.receivables?.length || 0,
              taxObligationsCount: parsed.taxObligations?.length || 0,
              payrollsCount: parsed.payrollPayments?.length || 0,
              governmentProjectsCount: parsed.governmentProjects?.length || 0,
              retailProjectsCount: parsed.retailProjects?.length || 0,
              overheadExpensesCount: parsed.overheadExpenses?.length || 0,
              officeRentContractsCount: parsed.officeRentContracts?.length || 0,
              bankLoansCount: parsed.bankLoans?.length || 0,
              teamMembersCount: parsed.teamMembers?.length || 0,
            },
            data: {
              projects: parsed.projects || [],
              teamMembers: parsed.teamMembers || [],
              dispositions: parsed.dispositions || [],
              transactions: parsed.transactions || [],
              receivables: parsed.receivables || [],
              taxObligations: parsed.taxObligations || [],
              bankLoans: parsed.bankLoans || [],
              companyCapital: parsed.companyCapital || null,
              payrollPayments: parsed.payrollPayments || [],
              salaryConfigs: parsed.salaryConfigs || [],
              governmentProjects: parsed.governmentProjects || [],
              retailProjects: parsed.retailProjects || [],
              overheadExpenses: parsed.overheadExpenses || [],
              officeRentContracts: parsed.officeRentContracts || [],
              serviceTypes: parsed.serviceTypes || [],
              documentTypes: parsed.documentTypes || [],
              documentCategories: parsed.documentCategories || [],
              transactionCategories: parsed.transactionCategories || [],
              paymentChannels: parsed.paymentChannels || [],
              institutionTypes: parsed.institutionTypes || [],
              termDistributionSchemes: parsed.termDistributionSchemes || [],
              companyLetterhead: parsed.companyLetterhead || null,
              roleDefinitions: parsed.roleDefinitions || {},
              assignedByOptions: parsed.assignedByOptions || [],
            },
          };
        }

        setImportedJson(normalizedPayload);
        setImportStatus('idle');
      } catch (err: any) {
        console.error('Error parsing JSON backup:', err);
        setImportStatus('error');
        setStatusMessage(err?.message || 'Gagal membaca file JSON.');
        setImportedJson(null);
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setStatusMessage('Gagal membaca file dari disk.');
    };
    reader.readAsText(file);
  };

  // Trigger Restore
  const handleExecuteRestore = async () => {
    if (!importedJson || !importedJson.data) {
      alert('Pilih file backup JSON terlebih dahulu.');
      return;
    }

    const confirmText =
      importMode === 'replace'
        ? 'Perhatian: Mode "Ganti Seluruh Data" akan mengganti data saat ini dengan isi file backup ini. Apakah Anda yakin ingin melanjutkan?'
        : 'Mode "Gabungkan Data (Merge)" akan menambahkan data baru dari file backup tanpa menghapus entri yang sudah ada. Lanjutkan?';

    if (!window.confirm(confirmText)) {
      return;
    }

    setIsProcessing(true);
    try {
      await restoreAllDataFromBackup(importedJson.data, importMode);
      setImportStatus('success');
      setStatusMessage('Data berhasil dipulihkan (Restore Sukses)! Halaman siap digunakan.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error during restore:', err);
      setImportStatus('error');
      setStatusMessage('Terjadi kesalahan saat memulihkan data: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Backup & Restore Data JSON</h2>
              <p className="text-xs text-slate-400">Cadangkan seluruh data sistem atau pulihkan dari file JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMessage('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'export'
                ? 'bg-white text-emerald-700 border-slate-200 border-b-white -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor / Download Backup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMessage('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'import'
                ? 'bg-white text-indigo-700 border-slate-200 border-b-white -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Impor / Restore Backup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                importStatus === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {importStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMessage}</div>
            </div>
          )}

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ringkasan Data Saat Ini</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Proyek CRM</span>
                    <span className="text-sm font-bold text-slate-900">{projects.length} entri</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Buku Kas</span>
                    <span className="text-sm font-bold text-slate-900">{transactions.length} transaksi</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Piutang Invoice</span>
                    <span className="text-sm font-bold text-slate-900">{receivables.length} piutang</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Kewajiban Pajak</span>
                    <span className="text-sm font-bold text-slate-900">{taxObligations.length} pajak</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Payroll Gaji</span>
                    <span className="text-sm font-bold text-slate-900">{payrollPayments.length} slip</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Proyek Pemerintah</span>
                    <span className="text-sm font-bold text-slate-900">{governmentProjects.length} proyek</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Proyek Retail</span>
                    <span className="text-sm font-bold text-slate-900">{retailProjects.length} proyek</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">Disposisi Tugas</span>
                    <span className="text-sm font-bold text-slate-900">{dispositions.length} tugas</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="includeConfigs"
                  checked={includeSystemConfigs}
                  onChange={(e) => setIncludeSystemConfigs(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="includeConfigs" className="text-xs text-slate-700 cursor-pointer select-none">
                  Sertakan konfigurasi master (Kop Surat, Kanal Pembayaran, Kategori Transaksi, Role, Jenis Dokumen & Layanan)
                </label>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  File JSON yang diunduh dapat disimpan di Google Drive atau flashdisk sebagai cadangan aman. Anda dapat
                  memulihkan file ini kapan saja ke browser atau domain mana pun.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File Backup (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* File Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center transition-colors">
                  <FileJson className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  {importFileName ? (
                    <span className="text-indigo-600 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {importFileName}
                    </span>
                  ) : (
                    'Klik atau geser file backup (.json) ke sini'
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Mendukung format file cadangan resmi KCK CRM</p>
              </div>

              {/* Preview of Imported File */}
              {importedJson && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Konten File Backup Ditemukan
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Versi {importedJson.version || '2.0'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Proyek CRM</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.projects?.length || 0} entri
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Buku Kas</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.transactions?.length || 0} transaksi
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Piutang</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.receivables?.length || 0} piutang
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Pajak</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.taxObligations?.length || 0} pajak
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Gaji / Payroll</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.payrollPayments?.length || 0} slip
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Proyek Pemda</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.governmentProjects?.length || 0} entri
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Proyek Retail</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.retailProjects?.length || 0} entri
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">Disposisi</span>
                      <span className="font-bold text-slate-900">
                        {importedJson.data.dispositions?.length || 0} tugas
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-indigo-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Pilih Metode Pemulihan (Restore Mode):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          importMode === 'replace'
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">Ganti Seluruh Data (Replace)</span>
                          <span className="text-[11px] text-slate-500">
                            Menghapus data saat ini dan menggantinya persis seperti isi file backup.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          importMode === 'merge'
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">Gabungkan Data (Merge)</span>
                          <span className="text-[11px] text-slate-500">
                            Menambahkan entri baru tanpa menghapus data yang sudah ada di sistem.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  Pastikan file JSON berasal dari sumber terpercaya. Sebelum memulihkan file, Anda disarankan mengunduh
                  cadangan data saat ini melalui tab "Ekspor / Download Backup".
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!importedJson || isProcessing}
                  onClick={handleExecuteRestore}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                    !importedJson || isProcessing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Memulihkan Data...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Pulihkan Data Sekarang (Restore)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
