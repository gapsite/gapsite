/**
 * Hostinger MySQL Connectivity & Diagnostic Utility
 * 
 * Provides automated verification of database connectivity between the React frontend,
 * the Express server proxy, and the remote Hostinger MySQL database.
 * 
 * Features:
 * - Ping & latency benchmarking
 * - Environment variable verification (Host, Port, User, Database, Password)
 * - Intelligent error root cause analysis (Remote MySQL IP permissions, localhost detection, auth failures)
 * - Styled, rich browser DevTools console output
 * - Accessible directly via window.runMysqlDiagnostics() in browser console
 */

export interface MysqlConfigSummary {
  host: string;
  port: number;
  user: string;
  database: string;
  hasPassword: boolean;
}

export interface MysqlDiagnosticReport {
  timestamp: string;
  connected: boolean;
  configured: boolean;
  latencyMs: number;
  config: MysqlConfigSummary;
  message: string;
  tables: string[];
  tableCount: number;
  checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
  advice: string[];
}

export interface DiagnosticOptions {
  verbose?: boolean;
  silent?: boolean;
  alertOnFailure?: boolean;
}

/**
 * Verifies Hostinger MySQL connectivity and outputs a diagnostic log in the browser console.
 */
export async function verifyMysqlConnectivity(
  options: DiagnosticOptions = {}
): Promise<MysqlDiagnosticReport> {
  const { verbose = true, silent = false } = options;
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  let rawStatus: any = null;
  let fetchError: Error | null = null;

  try {
    const res = await fetch('/api/mysql/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<!') || text.includes('<html');
      if (isHtml) {
        throw new Error(
          'Server mengembalikan file HTML (<!doctype...>), bukan endpoint API JSON. Backend Node.js Express belum berjalan di lingkungan hosting ini, atau web hosting statis mengalihkan route /api ke index.html.'
        );
      }
      throw new Error(`Respon server bukan format JSON (HTTP ${res.status}, Content-Type: ${contentType || 'unknown'})`);
    }

    rawStatus = await res.json();
  } catch (err: any) {
    fetchError = err instanceof Error ? err : new Error(String(err));
  }

  const durationMs = Math.round(performance.now() - startTime);

  const configured = Boolean(rawStatus?.configured);
  const connected = Boolean(rawStatus?.success);
  const config: MysqlConfigSummary = {
    host: rawStatus?.config?.host || '(belum diisi)',
    port: rawStatus?.config?.port || 3306,
    user: rawStatus?.config?.user || '(belum diisi)',
    database: rawStatus?.config?.database || '(belum diisi)',
    hasPassword: Boolean(rawStatus?.config?.hasPassword),
  };
  const message = rawStatus?.message || (fetchError ? fetchError.message : 'Tidak ada respon dari server.');
  const tables: string[] = Array.isArray(rawStatus?.tables) ? rawStatus.tables : [];

  // Build checks
  const checks = [
    {
      name: 'Server API Endpoint Reachability',
      passed: !fetchError,
      detail: fetchError ? `Gagal menghubungi /api/mysql/status: ${fetchError.message}` : `HTTP 200 OK (${durationMs}ms)`,
    },
    {
      name: 'Environment Variables Configured',
      passed: configured,
      detail: configured ? 'MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE terdeteksi' : 'Variabel lingkungan belum lengkap di server',
    },
    {
      name: 'Host Target Validity',
      passed: config.host.toLowerCase() !== 'localhost' && config.host.toLowerCase() !== '127.0.0.1',
      detail:
        config.host.toLowerCase() === 'localhost' || config.host.toLowerCase() === '127.0.0.1'
          ? 'Peringatan: MYSQL_HOST diarahkan ke localhost (internal container), bukan IP server Hostinger'
          : `Target server: ${config.host}`,
    },
    {
      name: 'Authentication Credential Status',
      passed: config.hasPassword && config.user !== '(belum diisi)',
      detail: `User "${config.user}", Password: ${config.hasPassword ? 'Tersedia [OK]' : 'Belum diisi [KOSONG]'}`,
    },
    {
      name: 'Remote MySQL Handshake & Query',
      passed: connected,
      detail: connected ? `Berhasil terhubung ke database "${config.database}"` : `Gagal: ${message}`,
    },
  ];

  // Derive troubleshooting advice
  const advice: string[] = [];
  const msgLower = (message || '').toLowerCase();
  const hostLower = config.host.toLowerCase();

  if (msgLower.includes('<!doctype') || msgLower.includes('unexpected token') || msgLower.includes('bukan endpoint api') || msgLower.includes('failed to fetch')) {
    advice.push('Backend Express belum aktif di hosting deploy: Database MySQL memerlukan backend server Node.js. Jika di-deploy ke Cloud Run / VPS, pastikan start script "node dist/server.cjs" berjalan dan Environment Variables (MYSQL_HOST, MYSQL_USER, dll.) sudah diisi pada konfigurasi hosting deploy.');
    advice.push('Jika menggunakan Hostinger Web Hosting statis: Web hosting statis biasa (Apache/Nginx) tidak dapat mengeksekusi backend Node.js. Gunakan Cloud Run, VPS Hostinger, atau aktifkan fitur Node.js App di hPanel Hostinger.');
  }

  if (!configured && !msgLower.includes('<!doctype') && !msgLower.includes('unexpected token')) {
    advice.push('Lengkapi variabel lingkungan MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, dan MYSQL_DATABASE di menu Settings.');
  }

  if (hostLower === 'localhost' || hostLower === '127.0.0.1') {
    advice.push('Ubah MYSQL_HOST di Settings dari "localhost" menjadi IP Server Hostinger Anda (misal: 46.202.138.82 atau hostname sqlXXX.main-hosting.eu).');
  }

  if (msgLower.includes('access denied') || msgLower.includes('er_access_denied_error')) {
    advice.push('Izin Remote MySQL di Hostinger: Buka hPanel Hostinger > Databases > Remote MySQL, tambahkan tanda "%" (wildcard IP) untuk database ini.');
    advice.push(`Verifikasi kecocokan password database user "${config.user}" di hPanel Hostinger.`);
  }

  if (msgLower.includes('econnrefused')) {
    advice.push('Koneksi ditolak (Port 3306). Pastikan IP server Hostinger sudah tepat dan port 3306 tidak diblokir.');
  }

  if (msgLower.includes('etimedout')) {
    advice.push('Koneksi timeout. Pastikan fitur Remote MySQL di hPanel Hostinger sudah diaktifkan dengan izin IP "%".');
  }

  if (connected && tables.length === 0) {
    advice.push('Koneksi aktif, namun belum ada tabel skema. Klik tombol "Buat Tabel Otomatis" di menu Hostinger MySQL untuk menginisialisasi 12 tabel.');
  }

  const report: MysqlDiagnosticReport = {
    timestamp,
    connected,
    configured,
    latencyMs: durationMs,
    config,
    message,
    tables,
    tableCount: tables.length,
    checks,
    advice,
  };

  // Browser Console Logging
  if (!silent) {
    logDiagnosticToConsole(report, verbose);
  }

  return report;
}

/**
 * Beautifully formats and logs the diagnostic report into browser console.
 */
function logDiagnosticToConsole(report: MysqlDiagnosticReport, verbose: boolean): void {
  const isOk = report.connected;
  const headerBg = isOk ? '#059669' : '#dc2626';
  const headerText = isOk ? 'TERHUBUNG (CONNECTED)' : 'TIDAK TERHUBUNG (DISCONNECTED)';

  console.groupCollapsed(
    `%c Hostinger MySQL Diagnostic %c ${headerText} %c ${report.latencyMs}ms `,
    'background: #1e1b4b; color: #a5b4fc; font-weight: bold; padding: 3px 6px; border-radius: 4px 0 0 4px;',
    `background: ${headerBg}; color: white; font-weight: bold; padding: 3px 8px;`,
    'background: #334155; color: #f8fafc; padding: 3px 6px; border-radius: 0 4px 4px 0;'
  );

  console.info(`🕒 Waktu Diagnostik: ${report.timestamp}`);
  console.info(`⚡ Status: ${report.message}`);

  // Summary Table
  console.table({
    'MySQL Host': { Nilai: report.config.host, Status: report.config.host !== 'localhost' ? '✅ OK' : '⚠️ Perlu Ganti IP' },
    'MySQL Port': { Nilai: report.config.port, Status: '✅ OK' },
    'MySQL User': { Nilai: report.config.user, Status: report.config.user !== '(belum diisi)' ? '✅ OK' : '❌ Kosong' },
    'MySQL Database': { Nilai: report.config.database, Status: report.config.database !== '(belum diisi)' ? '✅ OK' : '❌ Kosong' },
    'Password Status': { Nilai: report.config.hasPassword ? 'Tersimpan' : 'Kosong', Status: report.config.hasPassword ? '✅ OK' : '❌ Kosong' },
    'Status Koneksi': { Nilai: report.connected ? 'Aktif' : 'Gagal', Status: report.connected ? '✅ Terhubung' : '❌ Putus' },
    'Tabel Aktif': { Nilai: `${report.tableCount} tabel`, Status: report.tableCount > 0 ? '✅ Siap' : '⚠️ Perlu Init' },
    'Respons Server': { Nilai: `${report.latencyMs} ms`, Status: '✅ Selesai' },
  });

  // Diagnostic Checklist
  console.group('📋 Detail Pemeriksaan Sistem:');
  report.checks.forEach((c) => {
    const icon = c.passed ? '✅' : '❌';
    console.log(`${icon} [${c.name}]: ${c.detail}`);
  });
  console.groupEnd();

  // Active Tables
  if (report.tables.length > 0) {
    console.group(`🗄️ Tabel Database Terdeteksi (${report.tables.length}):`);
    console.log(report.tables.join(', '));
    console.groupEnd();
  }

  // Troubleshooting Advice
  if (report.advice.length > 0) {
    console.group('%c💡 Petunjuk Perbaikan (Troubleshooting Guide):', 'color: #ea580c; font-weight: bold;');
    report.advice.forEach((item, idx) => {
      console.warn(`${idx + 1}. ${item}`);
    });
    console.groupEnd();
  }

  console.info(
    '%cTip: Jalankan `runMysqlDiagnostics()` di konsol kapan saja untuk memeriksa kembali koneksi MySQL.',
    'color: #6366f1; font-style: italic;'
  );

  console.groupEnd();
}

/**
 * Self-registers on window object for instant DevTools console access.
 */
if (typeof window !== 'undefined') {
  const globalWin = window as any;
  globalWin.verifyMysqlConnectivity = verifyMysqlConnectivity;
  globalWin.runMysqlDiagnostics = verifyMysqlConnectivity;
  globalWin.checkHostingerMySQL = verifyMysqlConnectivity;
}
