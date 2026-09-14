import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getMysqlConfig,
  isMysqlConfigured,
  testMysqlConnection,
  initMysqlSchema,
  getMysqlPool,
  HOSTINGER_SQL_SCHEMA_RAW,
  getMysqlHealthState,
  setMysqlHealthState,
  isMysqlInBackoff,
  saveMysqlConfig,
  clearMysqlRuntimeConfig,
  hasMysqlRuntimeConfig,
  sanitizeDbError,
  type MysqlConfig,
} from './server/mysql.ts';

dotenv.config();

const app = express();

// Port configuration: AI Studio strictly routes external traffic through port 3000
const PORT = 3000;

// Middleware for parsing JSON with generous payload limits for full backups
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  const cfg = getMysqlConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mysqlConfigured: isMysqlConfigured(),
    port: PORT,
    database: cfg.database || null,
  });
});

// ==========================================
// SERVER-SIDE PERSISTENT JSON STORAGE API
// Ensures data survives browser cache clears, private browsing, and client storage eviction.
// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');
const SERVER_STORAGE_FILE = path.join(DATA_DIR, 'crm_persistent_storage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[server-storage] Error creating data directory:', err);
  }
}

// ==========================================
// PURGED DUMMY USERS REGISTRY
// Permanently blacklist & scrub dummy accounts from MySQL & API datasets
// ==========================================
const PURGED_DUMMY_USER_IDS = [
  'usr-lead-01',
  'usr-tech-01',
  'usr-survey-01',
  'usr-fin-01',
  'usr-dir-01',
  'usr-lead-02',
  'usr-tech-02',
  'usr-liaison-01',
  'usr-fin-02',
  'usr-client-01',
  'usr-client-indosejahtera',
  'usr-bambang',
  'usr-hendra',
  'usr-dian',
  'usr-fajar',
  'usr-siti',
  'usr-budi',
];
const PURGED_DUMMY_USERNAMES = [
  'bambang.lead',
  'siti.tech',
  'hendra.survey',
  'dewi.finance',
  'bambang.soediro',
  'director.soediro',
  'hendra.kusuma',
  'lead.kusuma',
  'dian.safitri',
  'tech.nurhaliza',
  'fajar.nugraha',
  'liaison.pratama',
  'siti.aminah',
  'finance.sartika',
  'client.indosejahtera',
  'client.wibowo',
  'bambang.irawan',
  'hendra.wijaya',
  'dewi.lestari',
  'siti.rahmawati',
];
const PURGED_DUMMY_EMAILS = [
  'bambang.lead@gapsite.com',
  'siti.rahma@gapsite.com',
  'hendra.survey@gapsite.com',
  'dewi.finance@gapsite.com',
  'bambang.soediro@gapsite.com',
  'hendra.kusuma@gapsite.com',
  'dian.safitri@gapsite.com',
  'nurhaliza.putri@gapsite.com',
  'fajar.nugraha@gapsite.com',
  'dedi.pratama@gapsite.com',
  'siti.aminah@gapsite.com',
  'dewi.sartika@gapsite.com',
  'client.indosejahtera@gapsite.com',
  'budi.wibowo@clientcorp.co.id',
];
const PURGED_DUMMY_NAMES_LOWER = [
  'bambang soediro',
  'hendra kusuma',
  'dian safitri',
  'fajar nugraha',
  'siti aminah',
  'budi santoso',
  'nurhaliza putri',
  'dedi pratama',
  'dewi sartika',
  'budi wibowo',
  'hendra wijaya',
  'dewi lestari',
  'bambang irawan',
  'siti rahmawati',
];

const isPurgedUser = (u: any): boolean => {
  if (!u) return false;
  if (u.id === 'usr-0' || u.username === 'admin.master' || u.email === 'adryankelvianto250@gmail.com') return false;
  const uid = (u.id || '').toLowerCase();
  const uname = (u.username || '').toLowerCase();
  const uemail = (u.email || '').toLowerCase();
  const unameStr = (u.name || '').toLowerCase();

  if (PURGED_DUMMY_USER_IDS.some((id) => id.toLowerCase() === uid)) return true;
  if (PURGED_DUMMY_USERNAMES.some((un) => un.toLowerCase() === uname)) return true;
  if (PURGED_DUMMY_EMAILS.some((em) => em.toLowerCase() === uemail)) return true;
  if (PURGED_DUMMY_NAMES_LOWER.some((name) => unameStr.includes(name))) return true;
  return false;
};

// Persistent storage routes are mounted below after executeMysqlCrmBatchWrite and fetchMysqlCrmDataset

// ==========================================
// CORE PERSISTENT DATABASE ENGINE: executeMysqlCrmBatchWrite
// Strictly uses `await conn.query` with explicit INSERT ... ON DUPLICATE KEY UPDATE
// across all 14 CRM tables, commits via transaction, and maintains atomic disk backup.
// Data is never kept in transient Node.js memory and persists across server restarts.
// ==========================================
export async function executeMysqlCrmBatchWrite(rawPayload: any): Promise<{
  success: boolean;
  message: string;
  source: string;
  syncedAt: string;
  summary: Record<string, number>;
  error?: string;
}> {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Payload data tidak valid.');
  }

  const payload = rawPayload.data || rawPayload;
  const nowIso = new Date().toISOString();

  // 1. Durably save to local disk first so data is never lost even if MySQL is offline
  try {
    const dataToSave = {
      version: '1.0',
      updatedAt: nowIso,
      data: payload,
    };
    const tempFile = `${SERVER_STORAGE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, SERVER_STORAGE_FILE);
  } catch (diskErr) {
    console.error('[server-storage] Gagal menyimpan ke disk cadangan:', diskErr);
  }

  const summary: Record<string, number> = {
    projects: payload.projects?.length || 0,
    transactions: payload.transactions?.length || 0,
    receivables: payload.receivables?.length || 0,
    taxObligations: payload.taxObligations?.length || 0,
    payrollPayments: (payload.payrollPayments || payload.payrollRecords)?.length || 0,
    governmentProjects: payload.governmentProjects?.length || 0,
    retailProjects: payload.retailProjects?.length || 0,
    bankLoans: payload.bankLoans?.length || 0,
    dispositions: payload.dispositions?.length || 0,
    teamMembers: payload.teamMembers?.length || 0,
    overheadExpenses: payload.overheadExpenses?.length || 0,
    officeRentContracts: payload.officeRentContracts?.length || 0,
  };

  // 2. Check if MySQL is configured and ready
  if (!isMysqlConfigured()) {
    return {
      success: true,
      source: 'disk_backup',
      syncedAt: nowIso,
      summary,
      message: 'Data berhasil disimpan ke disk persisten server. Hostinger MySQL belum dikonfigurasi.',
    };
  }

  const config = getMysqlConfig();
  const hostLower = (config.host || '').toLowerCase().trim();
  const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1')) {
    return {
      success: true,
      source: 'disk_backup',
      syncedAt: nowIso,
      summary,
      message: 'Data aman di server disk. Hostinger MySQL masih localhost (masukkan IP server Hostinger di tab Konfigurasi).',
    };
  }

  if (isMysqlInBackoff()) {
    const hState = getMysqlHealthState();
    return {
      success: true,
      source: 'disk_backup',
      syncedAt: nowIso,
      summary,
      message: `Data aman di disk server. Koneksi MySQL Hostinger sedang menunggu backoff (${hState.lastError || 'Access denied'}).`,
    };
  }

  // 3. Initialize schema if needed
  const schemaResult = await initMysqlSchema();
  if (!schemaResult.success) {
    return {
      success: false,
      source: 'disk_backup_only',
      syncedAt: nowIso,
      summary,
      message: schemaResult.message,
    };
  }

  // 4. Acquire database connection and execute transactional INSERT and UPDATE queries
  const pool = getMysqlPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Projects
    if (Array.isArray(payload.projects)) {
      for (const p of payload.projects) {
        if (!p || !p.id) continue;
        await conn.query(
          `INSERT INTO crm_projects (id, code, client_name, stage, status, kbli_code, data)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           code = VALUES(code),
           client_name = VALUES(client_name),
           stage = VALUES(stage),
           status = VALUES(status),
           kbli_code = VALUES(kbli_code),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            p.id,
            p.projectCode || p.code || '',
            p.clientName || '',
            p.stage || '',
            p.status || '',
            p.kbliCode || '',
            JSON.stringify(p),
          ]
        );
      }
    }

    // 2. Transactions
    if (Array.isArray(payload.transactions)) {
      for (const t of payload.transactions) {
        if (!t || !t.id) continue;
        await conn.query(
          `INSERT INTO crm_transactions (id, transaction_number, type, category, amount_idr, date, data)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           transaction_number = VALUES(transaction_number),
           type = VALUES(type),
           category = VALUES(category),
           amount_idr = VALUES(amount_idr),
           date = VALUES(date),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            t.id,
            t.transactionNumber || t.referenceNumber || '',
            t.type || '',
            t.category || '',
            t.amountIdr || t.amount || 0,
            t.date || '',
            JSON.stringify(t),
          ]
        );
      }
    }

    // 3. Receivables
    if (Array.isArray(payload.receivables)) {
      for (const r of payload.receivables) {
        if (!r || !r.id) continue;
        await conn.query(
          `INSERT INTO crm_receivables (id, invoice_number, client_name, total_amount, paid_amount, status, data)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           invoice_number = VALUES(invoice_number),
           client_name = VALUES(client_name),
           total_amount = VALUES(total_amount),
           paid_amount = VALUES(paid_amount),
           status = VALUES(status),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            r.id,
            r.invoiceNumber || '',
            r.clientName || '',
            r.totalAmount || 0,
            r.paidAmount || 0,
            r.status || '',
            JSON.stringify(r),
          ]
        );
      }
    }

    // 4. Tax Obligations
    if (Array.isArray(payload.taxObligations)) {
      for (const tx of payload.taxObligations) {
        if (!tx || !tx.id) continue;
        await conn.query(
          `INSERT INTO crm_tax_obligations (id, tax_type, title, amount, status, data)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           tax_type = VALUES(tax_type),
           title = VALUES(title),
           amount = VALUES(amount),
           status = VALUES(status),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            tx.id,
            tx.taxType || '',
            tx.taxName || tx.title || '',
            tx.amount || 0,
            tx.status || '',
            JSON.stringify(tx),
          ]
        );
      }
    }

    // 5. Payroll
    const payrollList = payload.payrollPayments || payload.payrollRecords;
    if (Array.isArray(payrollList)) {
      for (const pr of payrollList) {
        if (!pr || !pr.id) continue;
        await conn.query(
          `INSERT INTO crm_payroll (id, employee_name, period, net_salary, data)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           employee_name = VALUES(employee_name),
           period = VALUES(period),
           net_salary = VALUES(net_salary),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            pr.id,
            pr.employeeName || '',
            pr.period || '',
            pr.netSalary || 0,
            JSON.stringify(pr),
          ]
        );
      }
    }

    // 6. Government Projects
    if (Array.isArray(payload.governmentProjects)) {
      for (const gp of payload.governmentProjects) {
        if (!gp || !gp.id) continue;
        await conn.query(
          `INSERT INTO crm_government_projects (id, project_name, data)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
           project_name = VALUES(project_name),
           data = VALUES(data),
           updated_at = NOW()`,
          [gp.id, gp.name || gp.projectName || '', JSON.stringify(gp)]
        );
      }
    }

    // 7. Retail Projects
    if (Array.isArray(payload.retailProjects)) {
      for (const rp of payload.retailProjects) {
        if (!rp || !rp.id) continue;
        await conn.query(
          `INSERT INTO crm_retail_projects (id, project_name, data)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
           project_name = VALUES(project_name),
           data = VALUES(data),
           updated_at = NOW()`,
          [rp.id, rp.name || rp.projectName || '', JSON.stringify(rp)]
        );
      }
    }

    // 8. Bank Loans
    if (Array.isArray(payload.bankLoans)) {
      for (const bl of payload.bankLoans) {
        if (!bl || !bl.id) continue;
        await conn.query(
          `INSERT INTO crm_bank_loans (id, loan_name, bank_name, data)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           loan_name = VALUES(loan_name),
           bank_name = VALUES(bank_name),
           data = VALUES(data),
           updated_at = NOW()`,
          [bl.id, bl.loanName || '', bl.bankName || '', JSON.stringify(bl)]
        );
      }
    }

    // 9. Dispositions
    if (Array.isArray(payload.dispositions)) {
      for (const d of payload.dispositions) {
        if (!d || !d.id) continue;
        await conn.query(
          `INSERT INTO crm_dispositions (id, disposition_number, assignee_name, status, data)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           disposition_number = VALUES(disposition_number),
           assignee_name = VALUES(assignee_name),
           status = VALUES(status),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            d.id,
            d.dispositionNumber || '',
            d.assigneeName || '',
            d.status || '',
            JSON.stringify(d),
          ]
        );
      }
    }

    // 10. Team Members
    if (Array.isArray(payload.teamMembers)) {
      for (const tm of payload.teamMembers) {
        if (!tm || !tm.id) continue;
        if (isPurgedUser(tm)) {
          try {
            await conn.query('DELETE FROM crm_team_members WHERE id = ? OR username = ? OR email = ?', [
              tm.id,
              tm.username || '',
              tm.email || '',
            ]);
          } catch {}
          continue;
        }
        await conn.query(
          `INSERT INTO crm_team_members (id, username, email, role, data)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           email = VALUES(email),
           role = VALUES(role),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            tm.id,
            tm.username || '',
            tm.email || '',
            tm.role || '',
            JSON.stringify(tm),
          ]
        );
      }
    }

    // 11. Overhead Expenses
    if (Array.isArray(payload.overheadExpenses)) {
      for (const oh of payload.overheadExpenses) {
        if (!oh || !oh.id) continue;
        await conn.query(
          `INSERT INTO crm_overhead_expenses (id, overhead_number, category, recipient, amount_idr, date, status, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           overhead_number = VALUES(overhead_number),
           category = VALUES(category),
           recipient = VALUES(recipient),
           amount_idr = VALUES(amount_idr),
           date = VALUES(date),
           status = VALUES(status),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            oh.id,
            oh.overheadNumber || '',
            oh.category || '',
            oh.recipient || '',
            oh.amountIdr || 0,
            oh.date || '',
            oh.status || '',
            JSON.stringify(oh),
          ]
        );
      }
    }

    // 12. Office Rent Contracts
    if (Array.isArray(payload.officeRentContracts)) {
      for (const rent of payload.officeRentContracts) {
        if (!rent || !rent.id) continue;
        await conn.query(
          `INSERT INTO crm_office_rent_contracts (id, contract_number, building_name, landlord_name, data)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           contract_number = VALUES(contract_number),
           building_name = VALUES(building_name),
           landlord_name = VALUES(landlord_name),
           data = VALUES(data),
           updated_at = NOW()`,
          [
            rent.id,
            rent.contractNumber || '',
            rent.buildingName || '',
            rent.landlordName || '',
            JSON.stringify(rent),
          ]
        );
      }
    }

    // 13. App Settings
    const settingsMap: Record<string, any> = {
      serviceTypes: payload.serviceTypes !== undefined ? payload.serviceTypes : payload.consultingServices,
      documentTypes: payload.documentTypes,
      documentCategories: payload.documentCategories,
      transactionCategories: payload.transactionCategories,
      paymentChannels: payload.paymentChannels,
      companyCapital: payload.companyCapital,
      salaryConfigs: payload.salaryConfigs !== undefined ? payload.salaryConfigs : payload.employeeSalaryConfigs,
      institutionTypes: payload.institutionTypes,
      termDistributionSchemes: payload.termDistributionSchemes,
      companyLetterhead: payload.companyLetterhead,
      roleDefinitions: payload.roleDefinitions,
      assignedByOptions: payload.assignedByOptions,
    };
    for (const [key, val] of Object.entries(settingsMap)) {
      if (val !== undefined) {
        await conn.query(
          `INSERT INTO crm_app_settings (setting_key, data)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE
           data = VALUES(data),
           updated_at = NOW()`,
          [key, JSON.stringify(val)]
        );
      }
    }

    // 14. Full snapshot for rollback/recovery
    const totalCount =
      (payload.projects?.length || 0) +
      (payload.transactions?.length || 0) +
      (payload.receivables?.length || 0) +
      (payload.retailProjects?.length || 0) +
      (payload.governmentProjects?.length || 0) +
      (payload.overheadExpenses?.length || 0);

    await conn.query(
      `INSERT INTO crm_full_snapshots (snapshot_name, total_records, data)
       VALUES (?, ?, ?)`,
      [`Auto-Sync ${nowIso}`, totalCount, JSON.stringify(payload)]
    );

    // Prune old snapshots (keep latest 30)
    try {
      await conn.query(`
        DELETE FROM crm_full_snapshots 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id FROM crm_full_snapshots ORDER BY id DESC LIMIT 30
          ) as keep_snapshots
        )
      `);
    } catch {}

    // Process deletions
    if (Array.isArray(payload.deletedProjectIds)) {
      for (const delId of payload.deletedProjectIds) {
        if (delId) await conn.query('DELETE FROM crm_projects WHERE id = ?', [delId]);
      }
    }
    if (Array.isArray(payload.deletedTransactionIds)) {
      for (const delId of payload.deletedTransactionIds) {
        if (delId) await conn.query('DELETE FROM crm_transactions WHERE id = ?', [delId]);
      }
    }
    if (Array.isArray(payload.deletedReceivableIds)) {
      for (const delId of payload.deletedReceivableIds) {
        if (delId) await conn.query('DELETE FROM crm_receivables WHERE id = ?', [delId]);
      }
    }
    const delTaxes = payload.deletedTaxObligationIds || payload.deletedTaxIds;
    if (Array.isArray(delTaxes)) {
      for (const delId of delTaxes) {
        if (delId) await conn.query('DELETE FROM crm_tax_obligations WHERE id = ?', [delId]);
      }
    }
    if (Array.isArray(payload.deletedPayrollIds)) {
      for (const delId of payload.deletedPayrollIds) {
        if (delId) await conn.query('DELETE FROM crm_payroll WHERE id = ?', [delId]);
      }
    }
    const delOverheads = payload.deletedOverheadExpenseIds || payload.deletedOverheadIds;
    if (Array.isArray(delOverheads)) {
      for (const delId of delOverheads) {
        if (delId) await conn.query('DELETE FROM crm_overhead_expenses WHERE id = ?', [delId]);
      }
    }
    if (Array.isArray(payload.deletedDispositionIds)) {
      for (const delId of payload.deletedDispositionIds) {
        if (delId) await conn.query('DELETE FROM crm_dispositions WHERE id = ?', [delId]);
      }
    }
    if (Array.isArray(payload.deletedUserIds)) {
      for (const delId of payload.deletedUserIds) {
        if (delId) await conn.query('DELETE FROM crm_team_members WHERE id = ?', [delId]);
      }
    }
    // Explicitly purge all banned dummy users from MySQL crm_team_members table
    try {
      for (const pid of PURGED_DUMMY_USER_IDS) {
        await conn.query('DELETE FROM crm_team_members WHERE id = ?', [pid]);
      }
      for (const pun of PURGED_DUMMY_USERNAMES) {
        await conn.query('DELETE FROM crm_team_members WHERE username = ?', [pun]);
      }
      for (const pem of PURGED_DUMMY_EMAILS) {
        await conn.query('DELETE FROM crm_team_members WHERE email = ?', [pem]);
      }
    } catch {}

    await conn.commit();

    setMysqlHealthState({
      isHealthy: true,
      lastChecked: Date.now(),
      lastError: null,
      clientIp: '',
    });

    return {
      success: true,
      source: 'mysql_and_disk',
      syncedAt: nowIso,
      summary,
      message: 'Seluruh data berhasil disimpan dan disinkronkan ke Hostinger MySQL dan disk server!',
    };
  } catch (err: any) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Save persistent server storage (Dual persistence: writes to disk AND executes await INSERT/UPDATE to MySQL)
app.post('/api/storage/sync', async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[server-storage] Error in persistent sync:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save storage' });
  }
});

// Storage status
app.get('/api/storage/status', (req, res) => {
  try {
    const exists = fs.existsSync(SERVER_STORAGE_FILE);
    if (!exists) {
      return res.json({ exists: false, message: 'Belum ada cadangan penyimpanan di server.' });
    }
    const stats = fs.statSync(SERVER_STORAGE_FILE);
    res.json({
      exists: true,
      sizeBytes: stats.size,
      lastModified: stats.mtime.toISOString(),
      path: SERVER_STORAGE_FILE,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// UNIFIED DATASET RETRIEVAL: fetchMysqlCrmDataset
// Retrieves the entire consolidated CRM dataset directly from Hostinger MySQL
// ==========================================
export async function fetchMysqlCrmDataset(): Promise<{
  success: boolean;
  source: string;
  totalRows: number;
  pulledAt: string;
  data: any;
} | null> {
  if (!isMysqlConfigured() || isMysqlInBackoff()) return null;
  const config = getMysqlConfig();
  const hostLower = (config.host || '').toLowerCase().trim();
  const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1')) return null;

  try {
    await initMysqlSchema();
    const pool = getMysqlPool();
    const conn = await pool.getConnection();

    try {
      const fetchTableData = async (tableName: string) => {
        try {
          const [rows] = await conn.query<any[]>(`SELECT data FROM ${tableName}`);
          return rows
            .map((r) => {
              try {
                return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        } catch {
          return [];
        }
      };

      const projects = await fetchTableData('crm_projects');
      const transactions = await fetchTableData('crm_transactions');
      const receivables = await fetchTableData('crm_receivables');
      const taxObligations = await fetchTableData('crm_tax_obligations');
      const payrollPayments = await fetchTableData('crm_payroll');
      const governmentProjects = await fetchTableData('crm_government_projects');
      const retailProjects = await fetchTableData('crm_retail_projects');
      const bankLoans = await fetchTableData('crm_bank_loans');
      const dispositions = await fetchTableData('crm_dispositions');
      const rawTeamMembers = await fetchTableData('crm_team_members');
      const teamMembers = rawTeamMembers.filter((m: any) => !isPurgedUser(m));
      const overheadExpenses = await fetchTableData('crm_overhead_expenses');
      const officeRentContracts = await fetchTableData('crm_office_rent_contracts');

      let settingsMap: Record<string, any> = {};
      try {
        const [settingsRows] = await conn.query<any[]>('SELECT setting_key, data FROM crm_app_settings');
        for (const row of settingsRows) {
          try {
            settingsMap[row.setting_key] = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          } catch {}
        }
      } catch {}

      const totalRows =
        projects.length +
        transactions.length +
        receivables.length +
        taxObligations.length +
        payrollPayments.length +
        governmentProjects.length +
        retailProjects.length +
        bankLoans.length +
        dispositions.length +
        teamMembers.length +
        overheadExpenses.length +
        officeRentContracts.length;

      return {
        success: true,
        source: 'mysql',
        totalRows,
        pulledAt: new Date().toISOString(),
        data: {
          projects,
          transactions,
          receivables,
          taxObligations,
          payrollPayments,
          payrollRecords: payrollPayments,
          governmentProjects,
          retailProjects,
          bankLoans,
          dispositions,
          teamMembers,
          overheadExpenses: overheadExpenses.length > 0 ? overheadExpenses : (settingsMap.overheadExpenses || []),
          officeRentContracts: officeRentContracts.length > 0 ? officeRentContracts : (settingsMap.officeRentContracts || []),
          serviceTypes: settingsMap.serviceTypes || [],
          documentTypes: settingsMap.documentTypes || [],
          documentCategories: settingsMap.documentCategories || [],
          transactionCategories: settingsMap.transactionCategories || [],
          paymentChannels: settingsMap.paymentChannels || [],
          companyCapital: settingsMap.companyCapital || null,
          salaryConfigs: settingsMap.salaryConfigs || [],
          employeeSalaryConfigs: settingsMap.salaryConfigs || [],
          institutionTypes: settingsMap.institutionTypes || [],
          termDistributionSchemes: settingsMap.termDistributionSchemes || [],
          companyLetterhead: settingsMap.companyLetterhead || null,
          roleDefinitions: settingsMap.roleDefinitions || null,
          assignedByOptions: settingsMap.assignedByOptions || [],
        },
      };
    } finally {
      conn.release();
    }
  } catch (err: any) {
    const ipMatch = err.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : '';
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: err.message || String(err),
      clientIp: incomingIp,
    });
    return null;
  }
}

// Retrieve persistent server storage (checks live Hostinger MySQL first, then persistent disk backup)
app.get('/api/storage/sync', async (req, res) => {
  try {
    const mysqlDataset = await fetchMysqlCrmDataset().catch(() => null);
    if (mysqlDataset && mysqlDataset.totalRows > 0) {
      return res.json({
        success: true,
        exists: true,
        source: 'mysql',
        updatedAt: mysqlDataset.pulledAt,
        data: mysqlDataset.data,
      });
    }

    if (!fs.existsSync(SERVER_STORAGE_FILE)) {
      return res.json({ success: true, exists: false, data: null });
    }
    const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
    if (!raw.trim()) {
      return res.json({ success: true, exists: false, data: null });
    }
    const parsed = JSON.parse(raw);
    res.json({
      success: true,
      exists: true,
      source: 'disk',
      updatedAt: parsed.updatedAt || null,
      data: parsed.data || parsed,
    });
  } catch (error: any) {
    console.error('[server-storage] Error reading persistent storage:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to read server storage' });
  }
});

// ==========================================
// UNIFIED GET /api/data ENDPOINT
// Fetches data directly from Hostinger MySQL (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
// with automatic schema migration and fallback to persistent server storage.
// ==========================================
app.get('/api/data', async (req, res) => {
  try {
    const mysqlDataset = await fetchMysqlCrmDataset().catch(() => null);
    if (mysqlDataset && mysqlDataset.totalRows > 0) {
      return res.json(mysqlDataset);
    }

    // If MySQL is currently empty and server storage exists, auto-seed MySQL with full transactional batch write
    if (fs.existsSync(SERVER_STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const fileData = parsed.data || parsed;
        if (fileData && typeof fileData === 'object') {
          await executeMysqlCrmBatchWrite(fileData);
          return res.json({
            success: true,
            source: 'mysql_seeded',
            pulledAt: new Date().toISOString(),
            data: fileData,
          });
        }
      } catch {
        // Silently fallback if seeding encountered an issue
      }
    }

    // Fallback: persistent server disk storage
    if (fs.existsSync(SERVER_STORAGE_FILE)) {
      const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        return res.json({
          success: true,
          source: 'server_storage',
          pulledAt: parsed.updatedAt || new Date().toISOString(),
          data: parsed.data || parsed,
        });
      }
    }

    return res.json({
      success: true,
      source: 'empty',
      pulledAt: new Date().toISOString(),
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// DEDICATED USER MANAGEMENT & CROSS-DEVICE SYNC ENDPOINTS (/api/users)
// Ensures instant multi-device propagation for new registrations and role modifications.
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    let teamMembers: any[] = [];
    let source = 'none';

    // 1. Prioritize live Hostinger MySQL crm_team_members table
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool = getMysqlPool();
        const conn = await pool.getConnection();
        try {
          const [rows] = await conn.query<any[]>('SELECT data FROM crm_team_members');
          teamMembers = rows
            .map((r) => {
              try {
                return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
              } catch {
                return null;
              }
            })
            .filter(Boolean)
            .filter((m: any) => !isPurgedUser(m));
          source = 'mysql';
        } finally {
          conn.release();
        }
      } catch (mysqlErr: any) {
        console.warn('[server-users] MySQL read warning, falling back to disk:', mysqlErr?.message);
      }
    }

    // 2. Fallback to persistent disk storage if MySQL had no rows or was unreachable
    if (teamMembers.length === 0 && fs.existsSync(SERVER_STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (Array.isArray(dataObj.teamMembers)) {
            teamMembers = dataObj.teamMembers.filter((m: any) => !isPurgedUser(m));
            source = 'server_storage';
          }
        }
      } catch (fsErr) {
        console.warn('[server-users] Error reading disk storage:', fsErr);
      }
    }

    res.json({
      success: true,
      source,
      total: teamMembers.length,
      timestamp: new Date().toISOString(),
      teamMembers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.id || !user.username) {
      return res.status(400).json({ success: false, message: 'Invalid user payload: id and username required' });
    }

    if (isPurgedUser(user)) {
      return res.status(400).json({ success: false, message: 'User is purged or banned' });
    }

    let mysqlSaved = false;
    let mysqlMessage = '';

    // 1. Transactional write to Hostinger MySQL
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool = getMysqlPool();
        const conn = await pool.getConnection();
        try {
          await conn.query(
            `INSERT INTO crm_team_members (id, username, email, role, data)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             username = VALUES(username),
             email = VALUES(email),
             role = VALUES(role),
             data = VALUES(data),
             updated_at = NOW()`,
            [user.id, user.username || '', user.email || '', user.role || 'GUEST', JSON.stringify(user)]
          );
          mysqlSaved = true;
          mysqlMessage = `User ${user.username} saved to Hostinger MySQL (crm_team_members)`;
        } finally {
          conn.release();
        }
      } catch (err: any) {
        mysqlMessage = sanitizeDbError(err.message);
        console.warn('[server-users] Error saving user to MySQL:', mysqlMessage);
      }
    }

    // 2. Dual persistence: update local server disk storage file
    try {
      if (fs.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (!Array.isArray(dataObj.teamMembers)) {
            dataObj.teamMembers = [];
          }
          const idx = dataObj.teamMembers.findIndex((m: any) => m && m.id === user.id);
          if (idx >= 0) {
            dataObj.teamMembers[idx] = user;
          } else {
            dataObj.teamMembers.push(user);
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs.writeFileSync(
            temp,
            JSON.stringify({ version: '1.0', updatedAt: new Date().toISOString(), data: dataObj }, null, 2),
            'utf-8'
          );
          fs.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch (fsErr) {
      console.warn('[server-users] Error updating disk storage for user:', fsErr);
    }

    res.json({
      success: true,
      mysqlSaved,
      mysqlMessage,
      user,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Missing user id' });

    // 1. Delete from Hostinger MySQL
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool = getMysqlPool();
        const conn = await pool.getConnection();
        try {
          await conn.query('DELETE FROM crm_team_members WHERE id = ?', [id]);
        } finally {
          conn.release();
        }
      } catch (err: any) {
        console.warn('[server-users] Error deleting user from MySQL:', err.message);
      }
    }

    // 2. Delete from disk storage
    try {
      if (fs.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (Array.isArray(dataObj.teamMembers)) {
            dataObj.teamMembers = dataObj.teamMembers.filter((m: any) => m && m.id !== id);
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs.writeFileSync(
            temp,
            JSON.stringify({ version: '1.0', updatedAt: new Date().toISOString(), data: dataObj }, null, 2),
            'utf-8'
          );
          fs.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch {}

    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});

// ==========================================
// UNIFIED POST /api/data ENDPOINT
// Executes full transactional INSERT / UPDATE on MySQL with await and updates persistent disk backup.
// Guarantees data survives server restarts and container rebuilds.
// ==========================================
app.post('/api/data', async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to persist data' });
  }
});

// ==========================================
// POST /api/data/entity ENDPOINT
// Directly executes INSERT or UPDATE query on MySQL for individual modifications
// ==========================================
// POST /api/data/entity ENDPOINT
// Directly executes INSERT or UPDATE query on MySQL for individual modifications
// Validates server-side inputs, tracks affected rows, and sanitizes database errors.
// ==========================================
app.post('/api/data/entity', async (req, res) => {
  try {
    const { entityType, action = 'save', item, id } = req.body || {};
    
    // Server-side validation
    const ALLOWED_ENTITIES = [
      'projects',
      'transactions',
      'receivables',
      'taxObligations',
      'payroll',
      'payrollPayments',
      'governmentProjects',
      'retailProjects',
      'bankLoans',
      'dispositions',
      'teamMembers',
      'overheadExpenses',
      'officeRentContracts',
      'serviceTypes',
      'documentTypes',
      'documentCategories',
      'transactionCategories',
      'paymentChannels',
      'companyCapital',
      'salaryConfigs',
      'institutionTypes',
      'termDistributionSchemes',
      'companyLetterhead',
      'roleDefinitions',
      'assignedByOptions',
    ];

    if (!entityType || typeof entityType !== 'string' || !ALLOWED_ENTITIES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `Field entityType tidak valid. Harus salah satu dari: ${ALLOWED_ENTITIES.slice(0, 6).join(', ')}...`,
      });
    }

    if (action !== 'save' && action !== 'delete') {
      return res.status(400).json({ success: false, message: 'Action tidak valid. Gunakan "save" atau "delete".' });
    }

    if (action === 'delete') {
      const targetId = id || item?.id;
      if (!targetId || typeof targetId !== 'string' || targetId.length > 255) {
        return res.status(400).json({ success: false, message: 'ID target wajib berupa string valid (maks 255 karakter).' });
      }
    } else {
      if (!item || typeof item !== 'object' || !item.id || typeof item.id !== 'string') {
        return res.status(400).json({ success: false, message: 'Item data wajib berupa objek dengan properti "id" bertipe string.' });
      }
    }

    let mysqlSuccess = false;
    let mysqlMessage = '';
    let affectedRows = 0;
    let insertId: number | string = 0;

    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      const config = getMysqlConfig();
      const hostLower = (config.host || '').toLowerCase().trim();
      const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);

      if (!(isSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1'))) {
        try {
          await initMysqlSchema();
          const pool = getMysqlPool();
          const conn = await pool.getConnection();

          try {
            if (action === 'delete') {
              const targetId = id || item?.id;
              if (targetId) {
                const tableMap: Record<string, string> = {
                  projects: 'crm_projects',
                  transactions: 'crm_transactions',
                  receivables: 'crm_receivables',
                  taxObligations: 'crm_tax_obligations',
                  payroll: 'crm_payroll',
                  payrollPayments: 'crm_payroll',
                  governmentProjects: 'crm_government_projects',
                  retailProjects: 'crm_retail_projects',
                  bankLoans: 'crm_bank_loans',
                  dispositions: 'crm_dispositions',
                  teamMembers: 'crm_team_members',
                  overheadExpenses: 'crm_overhead_expenses',
                  officeRentContracts: 'crm_office_rent_contracts',
                };
                const tableName = tableMap[entityType];
                if (tableName) {
                  const [delRes]: any = await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [targetId]);
                  mysqlSuccess = true;
                  affectedRows = delRes?.affectedRows || 0;
                  mysqlMessage = `Record ${targetId} berhasil dihapus dari ${tableName} (${affectedRows} baris terhapus).`;
                }
              }
            } else {
              // action === 'save' (INSERT or UPDATE)
              if (item && item.id) {
                if (entityType === 'projects') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_projects (id, code, client_name, stage, status, kbli_code, data)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     code = VALUES(code),
                     client_name = VALUES(client_name),
                     stage = VALUES(stage),
                     status = VALUES(status),
                     kbli_code = VALUES(kbli_code),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.projectCode || item.code || '',
                      item.clientName || '',
                      item.stage || '',
                      item.status || '',
                      item.kbliCode || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                  mysqlMessage = `Project ${item.id} berhasil disimpan ke crm_projects (affectedRows: ${affectedRows})`;
                } else if (entityType === 'transactions') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_transactions (id, transaction_number, type, category, amount_idr, date, data)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     transaction_number = VALUES(transaction_number),
                     type = VALUES(type),
                     category = VALUES(category),
                     amount_idr = VALUES(amount_idr),
                     date = VALUES(date),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.transactionNumber || item.referenceNumber || '',
                      item.type || '',
                      item.category || '',
                      item.amountIdr || item.amountIDR || item.amount || 0,
                      item.date || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                  mysqlMessage = `Transaction ${item.id} berhasil disimpan ke crm_transactions (affectedRows: ${affectedRows})`;
                } else if (entityType === 'receivables') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_receivables (id, invoice_number, client_name, total_amount, paid_amount, status, data)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     invoice_number = VALUES(invoice_number),
                     client_name = VALUES(client_name),
                     total_amount = VALUES(total_amount),
                     paid_amount = VALUES(paid_amount),
                     status = VALUES(status),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.invoiceNumber || '',
                      item.clientName || '',
                      item.totalAmount || item.totalAmountIDR || 0,
                      item.paidAmount || item.paidAmountIDR || 0,
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === 'taxObligations') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_tax_obligations (id, tax_type, title, amount, status, data)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     tax_type = VALUES(tax_type),
                     title = VALUES(title),
                     amount = VALUES(amount),
                     status = VALUES(status),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.taxType || '',
                      item.taxName || item.title || '',
                      item.amount || item.amountIDR || 0,
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === 'payroll' || entityType === 'payrollPayments') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_payroll (id, employee_name, period, net_salary, data)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     employee_name = VALUES(employee_name),
                     period = VALUES(period),
                     net_salary = VALUES(net_salary),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.employeeName || '',
                      item.period || '',
                      item.netSalary || item.netSalaryIDR || 0,
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === 'governmentProjects') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_government_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || '', JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === 'retailProjects') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_retail_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || '', JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === 'bankLoans') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_bank_loans (id, loan_name, bank_name, data)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     loan_name = VALUES(loan_name),
                     bank_name = VALUES(bank_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.loanName || '', item.bankName || '', JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === 'dispositions') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_dispositions (id, disposition_number, assignee_name, status, data)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     disposition_number = VALUES(disposition_number),
                     assignee_name = VALUES(assignee_name),
                     status = VALUES(status),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.dispositionNumber || '',
                      item.assigneeName || '',
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === 'teamMembers') {
                  if (isPurgedUser(item)) {
                    await conn.query('DELETE FROM crm_team_members WHERE id = ? OR username = ? OR email = ?', [
                      item.id,
                      item.username || '',
                      item.email || '',
                    ]);
                    mysqlSuccess = true;
                  } else {
                    const [writeRes]: any = await conn.query(
                      `INSERT INTO crm_team_members (id, username, email, role, data)
                       VALUES (?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       username = VALUES(username),
                       email = VALUES(email),
                       role = VALUES(role),
                       data = VALUES(data),
                       updated_at = NOW()`,
                      [item.id, item.username || '', item.email || '', item.role || '', JSON.stringify(item)]
                    );
                    mysqlSuccess = true;
                    affectedRows = writeRes?.affectedRows || 0;
                  }
                } else if (entityType === 'overheadExpenses') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_overhead_expenses (id, overhead_number, category, recipient, amount_idr, date, status, data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     overhead_number = VALUES(overhead_number),
                     category = VALUES(category),
                     recipient = VALUES(recipient),
                     amount_idr = VALUES(amount_idr),
                     date = VALUES(date),
                     status = VALUES(status),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.overheadNumber || '',
                      item.category || '',
                      item.recipient || '',
                      item.amountIdr || item.amount || 0,
                      item.date || '',
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === 'officeRentContracts') {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_office_rent_contracts (id, contract_number, building_name, landlord_name, data)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     contract_number = VALUES(contract_number),
                     building_name = VALUES(building_name),
                     landlord_name = VALUES(landlord_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [
                      item.id,
                      item.contractNumber || '',
                      item.buildingName || '',
                      item.landlordName || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (
                  [
                    'serviceTypes',
                    'documentTypes',
                    'documentCategories',
                    'transactionCategories',
                    'paymentChannels',
                    'companyCapital',
                    'salaryConfigs',
                    'institutionTypes',
                    'termDistributionSchemes',
                    'companyLetterhead',
                    'roleDefinitions',
                    'assignedByOptions',
                  ].includes(entityType)
                ) {
                  const [writeRes]: any = await conn.query(
                    `INSERT INTO crm_app_settings (setting_key, data)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [entityType, JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  mysqlMessage = `Setting ${entityType} berhasil disimpan ke crm_app_settings (affectedRows: ${affectedRows})`;
                }
              }
            }
          } finally {
            conn.release();
          }
        } catch (dbErr: any) {
          const sanitizedErr = sanitizeDbError(dbErr.message || String(dbErr));
          mysqlMessage = sanitizedErr;
          const ipMatch = dbErr.message?.match(/@'([^']+)'/);
          const incomingIp = ipMatch ? ipMatch[1] : '';
          setMysqlHealthState({
            isHealthy: false,
            lastChecked: Date.now(),
            lastError: sanitizedErr,
            clientIp: incomingIp,
          });
        }
      }
    }

    // Dual persistence: update local persistent server storage file alongside MySQL query
    try {
      if (fs.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          const targetKey =
            entityType === 'taxes'
              ? 'taxObligations'
              : entityType === 'payroll'
              ? 'payrollPayments'
              : entityType;

          if (action === 'delete') {
            const targetId = id || item?.id;
            if (Array.isArray(dataObj[targetKey])) {
              dataObj[targetKey] = dataObj[targetKey].filter((x: any) => x && x.id !== targetId);
            }
          } else if (item && item.id) {
            if (!Array.isArray(dataObj[targetKey])) {
              dataObj[targetKey] = [];
            }
            const idx = dataObj[targetKey].findIndex((x: any) => x && x.id === item.id);
            if (idx >= 0) {
              dataObj[targetKey][idx] = item;
            } else {
              dataObj[targetKey].push(item);
            }
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs.writeFileSync(
            temp,
            JSON.stringify({ version: '1.0', updatedAt: new Date().toISOString(), data: dataObj }, null, 2),
            'utf-8'
          );
          fs.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch (fsErr) {
      console.warn('[server-storage] Error updating persistent disk storage for entity:', fsErr);
    }

    res.json({
      success: true,
      mysqlSuccess,
      mysqlMessage,
      affectedRows,
      insertId,
      entityType,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});

// Download SQL Schema for Hostinger phpMyAdmin
app.get('/api/mysql/schema.sql', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="hostinger_gap_crm_schema.sql"');
  res.send(HOSTINGER_SQL_SCHEMA_RAW);
});

// Dedicated MySQL Health Check (performs SELECT 1 check)
app.get('/api/mysql/health', async (req, res) => {
  try {
    const config = getMysqlConfig();
    const isConfigured = Boolean(config.host && config.user && config.database);

    if (!isConfigured) {
      return res.status(200).json({
        healthy: false,
        configured: false,
        message: 'Konfigurasi MySQL belum lengkap. MYSQL_HOST, MYSQL_USER, dan MYSQL_DATABASE belum terisi.',
        disclaimer: 'Status health check hanya memeriksa konektivitas aktif, bukan bukti sinkronisasi data.',
      });
    }

    const testResult = await testMysqlConnection();
    res.status(testResult.success ? 200 : 503).json({
      healthy: testResult.success,
      configured: true,
      ...testResult,
      disclaimer: 'Health check (SELECT 1) hanya memverifikasi koneksi aktif, bukan bukti bahwa seluruh data telah tersinkronisasi.',
    });
  } catch (error: any) {
    res.status(500).json({
      healthy: false,
      configured: isMysqlConfigured(),
      error: sanitizeDbError(error.message || String(error)),
    });
  }
});

// Check Hostinger MySQL Status
app.get('/api/mysql/status', async (req, res) => {
  try {
    const config = getMysqlConfig();
    const isConfigured = Boolean(config.host && config.user && config.database);

    if (!isConfigured) {
      return res.json({
        configured: false,
        message: 'Variabel lingkungan MySQL belum diatur (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE).',
        config: {
          host: config.host || '(belum diisi)',
          port: config.port || 3306,
          user: config.user || '(belum diisi)',
          database: config.database || '(belum diisi)',
          hasPassword: Boolean(config.password),
        },
      });
    }

    const health = getMysqlHealthState();
    const forceRefresh = req.query.force === 'true';
    const isStale = Date.now() - health.lastChecked > 20000;

    let testResult;
    if (forceRefresh || isStale) {
      testResult = await testMysqlConnection();
    } else {
      testResult = {
        success: health.isHealthy,
        message: health.isHealthy
          ? `Berhasil terhubung ke Hostinger MySQL database "${config.database}".`
          : (health.lastError || 'MySQL Hostinger belum terhubung.'),
        host: config.host,
        database: config.database,
      };
    }

    res.json({
      configured: true,
      ...testResult,
      clientIp: health.clientIp || undefined,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: Boolean(config.password),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      configured: isMysqlConfigured(),
      success: false,
      message: error.message || 'Gagal mengecek status MySQL Hostinger',
    });
  }
});

// Detailed Diagnostics endpoint for status check and remote debugging
app.get('/api/mysql/diagnostics', async (req, res) => {
  try {
    const config = getMysqlConfig();
    const testResult = await testMysqlConnection();
    res.json({
      timestamp: new Date().toISOString(),
      configured: isMysqlConfigured(),
      connected: testResult.success,
      latencyMs: testResult.latencyMs || 0,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: Boolean(config.password),
      },
      message: testResult.message,
      tables: testResult.tables || [],
      tableCount: testResult.tables?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      configured: isMysqlConfigured(),
      connected: false,
      message: error.message || 'Gagal menjalankan diagnostik MySQL',
    });
  }
});

// Get active MySQL configuration (masks raw password for security)
app.get('/api/mysql/config', (req, res) => {
  try {
    const config = getMysqlConfig();
    res.json({
      success: true,
      host: config.host || '',
      port: config.port || 3306,
      user: config.user || '',
      database: config.database || '',
      hasPassword: Boolean(config.password),
      isOverride: hasMysqlRuntimeConfig(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update MySQL configuration runtime override
app.post('/api/mysql/config', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body || {};
    if (!host || !user || !database) {
      return res.status(400).json({
        success: false,
        message: 'Host, User, dan Database wajib diisi.',
      });
    }

    const savedConfig = saveMysqlConfig({
      host: String(host).trim(),
      port: port ? parseInt(String(port), 10) : 3306,
      user: String(user).trim(),
      password: password !== undefined ? String(password) : undefined,
      database: String(database).trim(),
    });

    // Immediately test the connection
    const testResult = await testMysqlConnection();
    let schemaResult: any = null;
    if (testResult.success) {
      // Auto-initialize schema to ensure all 14 tables are ready
      schemaResult = await initMysqlSchema();
    }

    res.json({
      success: true,
      message: testResult.success
        ? `Konfigurasi berhasil disimpan dan koneksi ke database "${savedConfig.database}" di ${savedConfig.host} berhasil!`
        : `Konfigurasi disimpan, namun koneksi belum berhasil: ${testResult.message}`,
      connection: testResult,
      schema: schemaResult,
      config: {
        host: savedConfig.host,
        port: savedConfig.port,
        user: savedConfig.user,
        database: savedConfig.database,
        hasPassword: Boolean(savedConfig.password),
        isOverride: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset MySQL configuration to default environment variables
app.delete('/api/mysql/config', async (req, res) => {
  try {
    clearMysqlRuntimeConfig();
    const testResult = await testMysqlConnection();
    res.json({
      success: true,
      message: 'Konfigurasi MySQL telah dikembalikan ke variabel lingkungan default server.',
      connection: testResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test Connection (Allows testing with payload or with server env)
app.post('/api/mysql/test', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body || {};
    let customConfig: MysqlConfig | undefined = undefined;

    if (host || user || database) {
      customConfig = {
        host,
        port: port ? parseInt(port, 10) : 3306,
        user,
        password,
        database,
      };
    }

    const result = await testMysqlConnection(customConfig);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal menguji koneksi MySQL Hostinger',
    });
  }
});

// Initialize Schema / Create Tables in Hostinger MySQL
app.post('/api/mysql/init-schema', async (req, res) => {
  try {
    const result = await initMysqlSchema();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal membuat skema database MySQL',
    });
  }
});

// Push data to Hostinger MySQL (Insert / Update)
app.post('/api/mysql/sync/push', async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error: any) {
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : '';
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: error.message || String(error),
      clientIp: incomingIp,
    });
    res.status(200).json({
      success: false,
      message: `Gagal menyimpan data ke Hostinger MySQL: ${error.message || error}`,
    });
  }
});

// Pull data from Hostinger MySQL
app.get('/api/mysql/sync/pull', async (req, res) => {
  try {
    if (!isMysqlConfigured()) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: 'Hostinger MySQL belum dikonfigurasi di server environment.',
      });
    }

    const config = getMysqlConfig();
    const hostLower = (config.host || '').toLowerCase().trim();
    const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
    if (isSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1')) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message:
          'Hostinger MySQL belum terhubung: DB_HOST saat ini masih "localhost". Masukkan IP Server Hostinger Anda di Settings.',
      });
    }

    if (isMysqlInBackoff()) {
      const hState = getMysqlHealthState();
      return res.status(200).json({
        success: false,
        skipped: true,
        message: `Koneksi MySQL Hostinger ditolak/belum siap (${hState.lastError || 'Access denied'}). Periksa menu Remote MySQL di hPanel Hostinger. Data diambil dari persistent server storage.`,
      });
    }

    const pool = getMysqlPool();
    let conn: any = null;
    try {
      conn = await pool.getConnection();
    } catch (connErr: any) {
      return res.status(200).json({
        success: false,
        message: `Gagal terhubung ke MySQL Hostinger: ${connErr.message || connErr}`,
      });
    }

    try {
      // Helper to query and parse data column
      const fetchTableData = async (tableName: string) => {
        try {
          const [rows] = await conn.query<any[]>(`SELECT data FROM ${tableName}`);
          return rows.map((r) => {
            try {
              return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
            } catch {
              return null;
            }
          }).filter(Boolean);
        } catch {
          return [];
        }
      };

      const projects = await fetchTableData('crm_projects');
      const transactions = await fetchTableData('crm_transactions');
      const receivables = await fetchTableData('crm_receivables');
      const taxObligations = await fetchTableData('crm_tax_obligations');
      const payrollPayments = await fetchTableData('crm_payroll');
      const governmentProjects = await fetchTableData('crm_government_projects');
      const retailProjects = await fetchTableData('crm_retail_projects');
      const bankLoans = await fetchTableData('crm_bank_loans');
      const dispositions = await fetchTableData('crm_dispositions');
      const teamMembers = await fetchTableData('crm_team_members');
      const overheadExpensesFromTable = await fetchTableData('crm_overhead_expenses');
      const officeRentContractsFromTable = await fetchTableData('crm_office_rent_contracts');

      // Fetch Settings
      let settingsMap: Record<string, any> = {};
      try {
        const [settingsRows] = await conn.query<any[]>('SELECT setting_key, data FROM crm_app_settings');
        for (const row of settingsRows) {
          try {
            settingsMap[row.setting_key] = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          } catch {}
        }
      } catch {}

      res.json({
        success: true,
        pulledAt: new Date().toISOString(),
        data: {
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
          serviceTypes: settingsMap.serviceTypes || [],
          documentTypes: settingsMap.documentTypes || [],
          documentCategories: settingsMap.documentCategories || [],
          transactionCategories: settingsMap.transactionCategories || [],
          paymentChannels: settingsMap.paymentChannels || [],
          companyCapital: settingsMap.companyCapital || null,
          salaryConfigs: settingsMap.salaryConfigs || [],
          overheadExpenses: overheadExpensesFromTable.length > 0 ? overheadExpensesFromTable : (settingsMap.overheadExpenses || []),
          officeRentContracts: officeRentContractsFromTable.length > 0 ? officeRentContractsFromTable : (settingsMap.officeRentContracts || []),
          institutionTypes: settingsMap.institutionTypes || [],
          termDistributionSchemes: settingsMap.termDistributionSchemes || [],
          companyLetterhead: settingsMap.companyLetterhead || null,
          roleDefinitions: settingsMap.roleDefinitions || null,
          assignedByOptions: settingsMap.assignedByOptions || [],
        },
      });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : '';
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: error.message || String(error),
      clientIp: incomingIp,
    });
    res.status(200).json({
      success: false,
      message: `Gagal menarik data dari Hostinger MySQL: ${error.message || error}`,
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function setupViteOrStatic() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.argv[1]?.includes('dist') ||
    process.argv[1]?.endsWith('server.cjs');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Determine distPath whether executed from project root (with package.json) or directly
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' ? __dirname : process.cwd());

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Hostinger MySQL configured: ${isMysqlConfigured() ? 'YES' : 'NO'}`);

    // Server startup persistence verification:
    // Ensures persistent data storage file exists and verifies MySQL connectivity
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(SERVER_STORAGE_FILE)) {
        const stats = fs.statSync(SERVER_STORAGE_FILE);
        console.log(`[storage] Persistent disk storage verified: ${SERVER_STORAGE_FILE} (${stats.size} bytes)`);
      }
      if (isMysqlConfigured() && !isMysqlInBackoff()) {
        const config = getMysqlConfig();
        const hostLower = (config.host || '').toLowerCase().trim();
        const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
        if (!(isSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1'))) {
          const testRes = await testMysqlConnection();
          if (testRes.success) {
            console.log('[mysql] Hostinger MySQL connection verified on startup.');
            await initMysqlSchema();
          } else {
            console.log(`[mysql] Hostinger MySQL connection note: ${testRes.message}`);
          }
        }
      }
    } catch (startupErr) {
      console.warn('[startup] Persistence check note:', startupErr);
    }
  });
}

const isMainScript =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs') || process.argv[1].endsWith('server.js'));

if (isMainScript) {
  setupViteOrStatic();
}
