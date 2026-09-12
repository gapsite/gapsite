import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Download,
  UploadCloud,
  DownloadCloud,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  X,
  Copy,
  Check,
  Terminal,
  Activity,
  XCircle,
  Wifi,
  Sliders,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from 'lucide-react';
import { verifyMysqlConnectivity, MysqlDiagnosticReport } from '../utils/mysqlDiagnostics';

interface HostingerMysqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MysqlStatusData {
  configured: boolean;
  success?: boolean;
  message?: string;
  latencyMs?: number;
  host?: string;
  database?: string;
  tables?: string[];
  config?: {
    host: string;
    port: number;
    user: string;
    database: string;
    hasPassword: boolean;
  };
}

export const HostingerMysqlModal: React.FC<HostingerMysqlModalProps> = ({ isOpen, onClose }) => {
  const {
    projects,
    transactions,
    receivables,
    taxObligations,
    payrollPayments,
    governmentProjects,
    retailProjects,
    bankLoans,
    dispositions,
    teamMembers,
    serviceTypes,
    documentTypes,
    documentCategories,
    transactionCategories,
    paymentChannels,
    companyCapital,
    salaryConfigs,
    overheadExpenses,
    officeRentContracts,
    institutionTypes,
    termDistributionSchemes,
    companyLetterhead,
    roleDefinitions,
    assignedByOptions,
    restoreAllDataFromBackup,
    isMysqlConnected,
    isMysqlSyncing,
    lastMysqlSyncTime,
    syncAllToMysql,
    checkMysqlConnectivity,
  } = useProjects();

  const [loading, setLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [statusData, setStatusData] = useState<MysqlStatusData | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<MysqlDiagnosticReport | null>(null);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'guide'>('sync');

  // Configuration Form State
  const [configForm, setConfigForm] = useState({
    host: '',
    port: '3306',
    user: '',
    password: '',
    database: '',
    hasPassword: false,
    isOverride: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Fetch active MySQL configuration from server
  const fetchMysqlConfig = async () => {
    try {
      const res = await safeFetchJson('/api/mysql/config');
      if (res && res.success) {
        setConfigForm((prev) => ({
          ...prev,
          host: res.host || '',
          port: String(res.port || 3306),
          user: res.user || '',
          database: res.database || '',
          hasPassword: Boolean(res.hasPassword),
          isOverride: Boolean(res.isOverride),
        }));
      }
    } catch {
      // Non-fatal if config endpoint not ready
    }
  };

  // Run comprehensive diagnostics and log to console
  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    setActionMessage({
      type: 'info',
      text: 'Menjalankan uji diagnostik koneksi dan memverifikasi Hostinger MySQL...',
    });
    try {
      const report = await verifyMysqlConnectivity({ verbose: true, silent: false });
      setDiagnosticReport(report);
      setShowDiagnosticsPanel(true);
      setStatusData({
        configured: report.configured,
        success: report.connected,
        message: report.message,
        latencyMs: report.latencyMs,
        tables: report.tables,
        config: report.config,
      });

      if (report.connected) {
        setActionMessage({
          type: 'success',
          text: `Diagnostik Sukses: Terhubung ke Hostinger MySQL (${report.latencyMs}ms, ${report.tableCount} tabel).`,
        });
        checkMysqlConnectivity();
      } else {
        setActionMessage({
          type: 'error',
          text: `Diagnostik Gagal: ${report.message}`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Error saat menjalankan diagnostik: ' + (err.message || err),
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Save new MySQL configuration, test connection, init schema, and push current data
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    setActionMessage({
      type: 'info',
      text: 'Menyimpan konfigurasi dan menghubungkan ke Hostinger MySQL...',
    });

    try {
      const res = await safeFetchJson('/api/mysql/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: configForm.host.trim(),
          port: parseInt(configForm.port, 10) || 3306,
          user: configForm.user.trim(),
          password: configForm.password || undefined,
          database: configForm.database.trim(),
        }),
      });

      if (res && res.success) {
        const isConnOk = res.connection?.success;
        setActionMessage({
          type: isConnOk ? 'success' : 'error',
          text: res.message,
        });

        await fetchStatus();
        await fetchMysqlConfig();
        await checkMysqlConnectivity();

        if (isConnOk) {
          // Immediately sync all data to the newly connected database
          setActionMessage({
            type: 'info',
            text: 'Koneksi berhasil! Sedang mengirim seluruh data CRM ke Hostinger MySQL...',
          });
          const syncRes = await syncAllToMysql();
          setActionMessage({
            type: syncRes.success ? 'success' : 'error',
            text: syncRes.success
              ? `Konfigurasi tersimpan dan seluruh data CRM berhasil disinkronkan ke ${configForm.database} di ${configForm.host}!`
              : syncRes.message,
          });
          await fetchStatus();
        }
      } else {
        setActionMessage({
          type: 'error',
          text: res?.message || 'Gagal menyimpan konfigurasi MySQL.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Error saat menyimpan konfigurasi: ' + (err.message || err),
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Reset configuration back to server .env
  const handleResetConfig = async () => {
    if (!window.confirm('Kembalikan konfigurasi database ke variabel lingkungan server (.env)?')) return;
    setIsSavingConfig(true);
    try {
      const res = await safeFetchJson('/api/mysql/config', { method: 'DELETE' });
      setActionMessage({
        type: res?.success ? 'success' : 'error',
        text: res?.message || 'Konfigurasi telah direset.',
      });
      await fetchStatus();
      await fetchMysqlConfig();
      await checkMysqlConnectivity();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Gagal mereset: ' + (err.message || err) });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Helper for safe JSON fetching against SPA fallback
  const safeFetchJson = async (url: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<!') || text.includes('<html');
      if (isHtml) {
        throw new Error(
          'Server mengembalikan halaman HTML (<!doctype...>), bukan endpoint JSON. Backend Node.js Express belum aktif di hosting ini, atau route /api dialihkan ke index.html.'
        );
      }
      throw new Error(`Respon server bukan format JSON (HTTP ${res.status})`);
    }
    return await res.json();
  };

  // Fetch status on open
  const fetchStatus = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const data = await safeFetchJson('/api/mysql/status');
      setStatusData(data);
    } catch (err: any) {
      setStatusData({
        configured: false,
        success: false,
        message: 'Gagal terhubung ke API server: ' + (err.message || err),
        config: {
          host: '(backend belum aktif)',
          port: 3306,
          user: '(backend belum aktif)',
          database: '(backend belum aktif)',
          hasPassword: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchMysqlConfig();
    }
  }, [isOpen]);

  // Push all local data into Hostinger MySQL
  const handlePushData = async () => {
    if (!statusData?.configured || !statusData?.success) {
      if (!window.confirm('Koneksi Hostinger MySQL belum terkonfirmasi aktif. Tetap coba sinkronkan?')) {
        return;
      }
    }

    setLoading(true);
    setActionMessage({ type: 'info', text: 'Sedang menyiapkan tabel dan mengirim seluruh data ke Hostinger MySQL...' });

    try {
      const payload = {
        projects,
        transactions,
        receivables,
        taxObligations,
        payrollPayments,
        governmentProjects,
        retailProjects,
        bankLoans,
        dispositions,
        teamMembers,
        serviceTypes,
        documentTypes,
        documentCategories,
        transactionCategories,
        paymentChannels,
        companyCapital,
        salaryConfigs,
        overheadExpenses,
        officeRentContracts,
        institutionTypes,
        termDistributionSchemes,
        companyLetterhead,
        roleDefinitions,
        assignedByOptions,
      };

      const result = await safeFetchJson('/api/mysql/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: result.message || 'Seluruh data berhasil disimpan ke database Hostinger MySQL!',
        });
        await fetchStatus();
      } else {
        setActionMessage({
          type: 'error',
          text: result.message || 'Gagal menyimpan data ke MySQL Hostinger.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Error saat menyimpan ke MySQL: ' + (err.message || err),
      });
    } finally {
      setLoading(false);
    }
  };

  // Pull data from Hostinger MySQL
  const handlePullData = async () => {
    if (!window.confirm('Tarik data dari Hostinger MySQL? Data dari MySQL akan digabungkan ke aplikasi saat ini.')) {
      return;
    }

    setLoading(true);
    setActionMessage({ type: 'info', text: 'Sedang mengunduh data dari Hostinger MySQL...' });

    try {
      const result = await safeFetchJson('/api/mysql/sync/pull');

      if (result.success && result.data) {
        await restoreAllDataFromBackup(result.data, 'merge');
        setActionMessage({
          type: 'success',
          text: `Berhasil menarik data dari Hostinger MySQL! (${result.data.projects?.length || 0} proyek, ${result.data.transactions?.length || 0} transaksi dimuat).`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: result.message || 'Gagal menarik data dari MySQL Hostinger.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Error saat menarik dari MySQL: ' + (err.message || err),
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto Init Schema
  const handleInitSchema = async () => {
    setLoading(true);
    setActionMessage({ type: 'info', text: 'Sedang membuat 12 tabel di Hostinger MySQL...' });
    try {
      const result = await safeFetchJson('/api/mysql/init-schema', { method: 'POST' });
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        await fetchStatus();
      } else {
        setActionMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Error membuat skema: ' + (err.message || err) });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Hostinger MySQL Database</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500 text-white uppercase tracking-wider">
                  Hostinger
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Penyimpanan data input langsung ke basis data MySQL hosting Hostinger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white text-indigo-700 border-slate-200 border-b-white -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Koneksi & Sinkronisasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('config');
              fetchMysqlConfig();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-violet-700 border-slate-200 border-b-white -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-violet-600" />
            <span>Konfigurasi Hostinger</span>
            {configForm.isOverride && (
              <span className="w-2 h-2 rounded-full bg-violet-600" title="Override Kustom Aktif" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-700 border-slate-200 border-b-white -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Panduan Hostinger hPanel</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action / Alert Message */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                actionMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : actionMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              {actionMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 font-medium">{actionMessage.text}</div>
            </div>
          )}

          {activeTab === 'sync' && (
            <>
              {/* Real-time Continuous MySQL Sync Status Banner */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isMysqlConnected
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200'
                    : 'bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isMysqlConnected
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <Zap className={`w-5 h-5 ${isMysqlSyncing ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">
                          Sinkronisasi Otomatis Real-time (Auto-Sync)
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isMysqlConnected
                              ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isMysqlConnected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {isMysqlSyncing ? 'SEDANG MENYINKRONKAN...' : isMysqlConnected ? 'AKTIF & TERHUBUNG' : 'MENUNGGU KONEKSI'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {isMysqlConnected
                          ? 'Setiap penambahan, pengubahan, atau penghapusan data (Proyek TKDN/Retail/Tender, Kas, Piutang, Pajak, Payroll, dan Tim) otomatis tersimpan dan ter-update di database Hostinger MySQL.'
                          : 'Koneksi ke Hostinger MySQL belum terhubung. Masukkan IP Hostinger Anda di tab "Konfigurasi Hostinger" agar auto-sync berjalan.'}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Terakhir Disinkronkan:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {lastMysqlSyncTime
                        ? new Date(lastMysqlSyncTime).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : isMysqlConnected
                        ? 'Baru saja'
                        : 'Belum pernah'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection Status Card */}
              <div className="p-4 rounded-xl border bg-slate-50/80 border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-900">Status Koneksi Hostinger MySQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusData?.success ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Terhubung ({statusData.latencyMs}ms)
                      </span>
                    ) : statusData?.configured ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Gagal Terhubung
                      </span>
                    ) : statusData?.message?.includes('HTML') || statusData?.message?.includes('backend') ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Backend Belum Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                        Belum Dikonfigurasi
                      </span>
                    )}
                    <button
                      id="btn-run-mysql-diagnostics"
                      type="button"
                      onClick={handleRunDiagnostics}
                      disabled={loading || isDiagnosing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      title="Jalankan Diagnostik Lengkap & Verifikasi Koneksi MySQL"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                      <span>{isDiagnosing ? 'Menguji...' : 'Uji Diagnostik'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={fetchStatus}
                      disabled={loading || isDiagnosing}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Refresh status koneksi"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Configuration Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Host / Server</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {statusData?.config?.host || '-'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Port</span>
                    <span className="font-mono font-bold text-slate-800 block">
                      {statusData?.config?.port || 3306}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Database Name</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {statusData?.config?.database || '-'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">DB Username</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {statusData?.config?.user || '-'}
                    </span>
                  </div>
                </div>

                {statusData?.config?.host?.toLowerCase() === 'localhost' && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Perhatian: MYSQL_HOST terisi "localhost"</span>
                    </div>
                    <p className="leading-relaxed">
                      Karena aplikasi web ini berjalan di server cloud Google AI Studio, <code>localhost</code> mengarah ke mesin server lokal aplikasi, <strong>bukan server Hostinger Anda</strong>.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="font-medium text-amber-950">
                        Masukkan IP Hostinger Anda (misal: <code>srv1786.hstgr.io</code> atau IP numerik) langsung di Tab Konfigurasi:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('config');
                          fetchMysqlConfig();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-800" />
                        <span>Buka Tab Konfigurasi & Masukkan IP &rarr;</span>
                      </button>
                    </div>
                  </div>
                )}

                {statusData?.message && !diagnosticReport && (
                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    {statusData.message}
                  </p>
                )}

                {/* Direct UI Diagnostic Result Display (Success / Error) */}
                {diagnosticReport && showDiagnosticsPanel && (
                  <div
                    id="mysql-diagnostic-result-container"
                    className={`p-4 rounded-xl text-xs space-y-3 border transition-all ${
                      diagnosticReport.connected
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50/95 border-rose-300 text-rose-950'
                    }`}
                  >
                    {/* Result Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {diagnosticReport.connected ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                            <XCircle className="w-5 h-5 text-rose-600" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {diagnosticReport.connected
                                ? 'Hasil Diagnostik: Terhubung ke Hostinger MySQL'
                                : 'Hasil Diagnostik: Gagal Terhubung ke MySQL'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                diagnosticReport.connected
                                  ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-200/80 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {diagnosticReport.connected ? 'SUKSES' : 'ERROR'}
                            </span>
                          </div>
                          <span className="text-[11px] opacity-80 block">
                            {diagnosticReport.connected
                              ? 'Koneksi database aktif dan siap melayani pertukaran data CRM.'
                              : 'Koneksi jaringan atau otentikasi ke database Hostinger mengalami kendala.'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[11px] font-bold px-2 py-1 bg-white/80 rounded-md border border-slate-200">
                          {diagnosticReport.latencyMs}ms
                        </span>
                        <button
                          id="btn-dismiss-diagnostic-card"
                          type="button"
                          onClick={() => setShowDiagnosticsPanel(false)}
                          className="p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Tutup kartu hasil"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Error Box if Failed */}
                    {!diagnosticReport.connected && (
                      <div className="p-3 bg-white rounded-lg border border-rose-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                          Pesan Error dari MySQL / Server:
                        </span>
                        <p className="font-mono text-[11px] text-rose-900 leading-relaxed break-words bg-rose-50/70 p-2 rounded border border-rose-100">
                          {diagnosticReport.message}
                        </p>
                      </div>
                    )}

                    {/* Diagnostic Checks Checklist */}
                    <div className="p-3 bg-white/90 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        Pemeriksaan Komponen Koneksi:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {diagnosticReport.checks.map((c, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded-md border text-[11px] ${
                              c.passed
                                ? 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                                : 'bg-rose-50/50 border-rose-200 text-rose-900'
                            }`}
                          >
                            {c.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-semibold block">{c.name}</span>
                              <span className="text-[10px] opacity-75">{c.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Troubleshooting Guide if Failed */}
                    {diagnosticReport.advice.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Rekomendasi Perbaikan:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed pl-0.5">
                          {diagnosticReport.advice.map((adv, idx) => (
                            <li key={idx} className="font-medium text-amber-900">
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Card Footer / Re-run Action */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Log dan tabel diagnostik lengkap juga tersedia di Konsol F12 (<code>window.runMysqlDiagnostics()</code>).</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          id="btn-rerun-diagnostics"
                          type="button"
                          onClick={handleRunDiagnostics}
                          disabled={isDiagnosing}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            diagnosticReport.connected
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          <Activity className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                          <span>{isDiagnosing ? 'Menguji...' : 'Uji Ulang Diagnostik'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {statusData?.tables && statusData.tables.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Tabel Aktif di Hostinger MySQL ({statusData.tables.length} tabel):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {statusData.tables.map((tbl) => (
                        <span
                          key={tbl}
                          className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md"
                        >
                          {tbl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Volume Summary */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-950">Data Input CRM Lengkap yang Siap Disinkronkan:</span>
                  <span className="text-[11px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {projects.length + retailProjects.length + governmentProjects.length} Proyek • {transactions.length} Kas • {taxObligations.length} Pajak
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Proyek TKDN</span>
                    <span className="font-bold text-slate-900">{projects.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Proyek Retail</span>
                    <span className="font-bold text-indigo-700">{retailProjects.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Proyek Tender</span>
                    <span className="font-bold text-slate-900">{governmentProjects.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Buku Kas & Bank</span>
                    <span className="font-bold text-slate-900">{transactions.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Piutang Usaha</span>
                    <span className="font-bold text-slate-900">{receivables.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Pajak (PPh/PPN)</span>
                    <span className="font-bold text-slate-900">{taxObligations.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Penggajian</span>
                    <span className="font-bold text-slate-900">{payrollPayments.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Biaya Overhead</span>
                    <span className="font-bold text-slate-900">{overheadExpenses.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Sewa Gedung</span>
                    <span className="font-bold text-slate-900">{officeRentContracts.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Pinjaman Bank</span>
                    <span className="font-bold text-slate-900">{bankLoans.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Disposisi Kerja</span>
                    <span className="font-bold text-slate-900">{dispositions.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 text-[10px] block">Pengguna / Tim</span>
                    <span className="font-bold text-slate-900">{teamMembers.length}</span>
                  </div>
                </div>
              </div>

              {/* Hostinger Remote MySQL Quick Permission Banner if Access Denied */}
              {statusData?.configured && !statusData?.success && (statusData?.message?.includes('Access denied') || statusData?.message?.includes('ER_ACCESS_DENIED_ERROR') || statusData?.message?.includes('Remote MySQL')) && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Perizinan Remote MySQL Hostinger Diperlukan</span>
                  </div>
                  <p className="leading-relaxed">
                    Hostinger secara default mengunci akses database MySQL dari luar server hosting. Untuk mengizinkan aplikasi menyimpan data ke database <strong>{statusData?.config?.database || 'u313358252_Gapsite'}</strong>, lakukan langkah berikut:
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-amber-800 shrink-0">1.</span>
                      <span>Buka <strong>hPanel Hostinger</strong> &rarr; menu <strong>Databases</strong> &rarr; pilih <strong>Remote MySQL</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-amber-800 shrink-0">2.</span>
                      <span>Pilih Database: <strong>{statusData?.config?.database || 'u313358252_Gapsite'}</strong></span>
                    </div>
                    <div className="flex items-start gap-2 items-center justify-between">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-800 shrink-0">3.</span>
                        <span>Kolom <strong>IP (IPv4 atau IPv6)</strong>: Masukkan tanda <strong>%</strong> (wildcard semua IP)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('%');
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Tersalin!' : 'Salin "%"'}</span>
                      </button>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-amber-800 shrink-0">4.</span>
                      <span>Klik tombol <strong>Create / Tambahkan</strong>, lalu kembali ke sini dan klik tombol <strong>"Uji Diagnostik"</strong> di atas.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePushData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Simpan & Sinkronkan ke MySQL</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4 text-indigo-600" />
                  <span>Tarik Data dari Hostinger MySQL</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitSchema}
                  disabled={loading || isDiagnosing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-slate-600" />
                  <span>Buat Tabel Otomatis di MySQL</span>
                </button>

                <a
                  href="/api/mysql/schema.sql"
                  download="hostinger_gap_crm_schema.sql"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download hostinger_crm_schema.sql</span>
                </a>

                <button
                  id="btn-trigger-diagnostics-action-grid"
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={loading || isDiagnosing}
                  className="sm:col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  title="Jalankan Uji Diagnostik Koneksi Hostinger MySQL"
                >
                  <Activity className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'Sedang Memeriksa Konektivitas MySQL...' : 'Uji Diagnostik Konektivitas Hostinger MySQL'}</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl space-y-2 text-violet-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
                    <Sliders className="w-4 h-4 text-violet-600" />
                    <span>Konfigurasi Langsung Hostinger MySQL</span>
                  </div>
                  {configForm.isOverride && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-200 text-violet-950 border border-violet-300">
                      Override Runtime Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-violet-800 leading-relaxed">
                  Masukkan informasi koneksi database Hostinger Anda di bawah ini. Ketika disimpan, sistem akan langsung
                  menguji koneksi, membuat tabel CRM jika belum ada, dan mengirim seluruh data input saat ini ke database Hostinger Anda.
                </p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      MySQL Host / IP Server Hostinger <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configForm.host}
                      onChange={(e) => setConfigForm({ ...configForm, host: e.target.value })}
                      placeholder="Contoh: 153.92.xxx.xxx atau srv1786.hstgr.io"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Gunakan <strong>Server IP</strong> dari hPanel Hostinger Anda (bukan <code>localhost</code>).
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Port MySQL
                    </label>
                    <input
                      type="number"
                      value={configForm.port}
                      onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })}
                      placeholder="3306"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">Default: 3306</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Nama Database (DB_NAME) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configForm.database}
                      onChange={(e) => setConfigForm({ ...configForm, database: e.target.value })}
                      placeholder="Contoh: u546311692_gaphorizon"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Username Database (DB_USER) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configForm.user}
                      onChange={(e) => setConfigForm({ ...configForm, user: e.target.value })}
                      placeholder="Contoh: u546311692_Gaphorizonz"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Password Database (DB_PASSWORD)
                    </label>
                    {configForm.hasPassword && (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ✓ Password tersimpan di server
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={configForm.password}
                      onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                      placeholder={configForm.hasPassword ? '•••••••••••• (Kosongkan jika tidak ingin mengubah)' : 'Masukkan password database'}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    disabled={isSavingConfig}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Default (.env)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingConfig ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingConfig ? 'Menyimpan & Menghubungkan...' : 'Simpan & Hubungkan ke Hostinger'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Hostinger Remote MySQL Info Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Di mana menemukan IP Server Hostinger & mengizinkan koneksi?</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Masuk ke <strong>hPanel Hostinger</strong> &rarr; menu <strong>Hosting</strong> / <strong>Dashboard</strong> &rarr; temukan <strong>Server IP</strong> di kolom sebelah kiri (misal: <code>153.92.xxx.xxx</code>).
                  <br />
                  2. Buka menu <strong>Databases &rarr; Remote MySQL</strong> &rarr; pilih database Anda &rarr; pada kolom IP masukkan <code>%</code> (wildcard) &rarr; klik <strong>Create</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Langkah Penting: Aktifkan "Remote MySQL" di Hostinger hPanel</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Secara default, Hostinger mengunci akses port 3306 dari luar server. Agar aplikasi cloud ini dapat
                  menyimpan data langsung ke database MySQL Hostinger Anda, Anda perlu mengaktifkan Remote MySQL sekali saja:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 font-medium pl-1">
                  <li>Masuk ke <strong>hPanel Hostinger</strong> Anda.</li>
                  <li>Buka menu <strong>Databases</strong> &rarr; pilih <strong>Remote MySQL</strong> (MySQL Jarak Jauh).</li>
                  <li>
                    Pada kolom <strong>IP (IPv4 or IPv6)</strong>, masukkan tanda <code>%</code> (tanda persen, mengizinkan akses dari aplikasi).
                  </li>
                  <li>Pilih nama database Anda, lalu klik tombol <strong>Create / Tambahkan</strong>.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Variabel Lingkungan (Environment Variables)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Masukkan detail database Hostinger Anda di menu <strong>Settings</strong> Google AI Studio atau file <code>.env</code>:
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] space-y-1 relative">
                  <p>MYSQL_HOST=sqlXXX.main-hosting.eu (atau IP Hostinger Anda)</p>
                  <p>MYSQL_PORT=3306</p>
                  <p>MYSQL_USER=u123456789_crmuser</p>
                  <p>MYSQL_PASSWORD=PasswordDatabaseAnda123!</p>
                  <p>MYSQL_DATABASE=u123456789_gapcrm</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Opsi Import Manual via phpMyAdmin</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Jika Anda ingin membuat tabel secara manual di phpMyAdmin Hostinger:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  1. Download file <a href="/api/mysql/schema.sql" download="hostinger_gap_crm_schema.sql" className="font-bold text-indigo-700 underline">hostinger_gap_crm_schema.sql</a>.
                  <br />
                  2. Di hPanel Hostinger, klik <strong>Enter phpMyAdmin</strong> pada database Anda.
                  <br />
                  3. Klik tab <strong>Import</strong> &rarr; pilih file <code>.sql</code> tadi &rarr; klik <strong>Go / Kirim</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <span className="text-slate-500">
            Sistem tetap memiliki cadangan ganda (LocalStorage + IndexedDB) sehingga data Anda aman 100%.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
