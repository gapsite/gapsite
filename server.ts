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
  type MysqlConfig,
} from './server/mysql.ts';

dotenv.config();

const app = express();

// Port configuration: Listen to Hostinger dynamic port (process.env.PORT) to prevent Bad Gateway,
// while strictly binding to port 3000 in AI Studio container sandbox
const isAiStudioSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
const PORT = isAiStudioSandbox ? 3000 : Number(process.env.PORT || 3000);

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

// Retrieve persistent server storage
app.get('/api/storage/sync', (req, res) => {
  try {
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
      updatedAt: parsed.updatedAt || null,
      data: parsed.data || parsed,
    });
  } catch (error: any) {
    console.error('[server-storage] Error reading persistent storage:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to read server storage' });
  }
});

// Save persistent server storage
app.post('/api/storage/sync', (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const dataToSave = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      data: payload.data || payload,
    };

    const tempFile = `${SERVER_STORAGE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, SERVER_STORAGE_FILE);

    res.json({
      success: true,
      updatedAt: dataToSave.updatedAt,
      message: 'Data berhasil diamankan di penyimpanan server.',
    });
  } catch (error: any) {
    console.error('[server-storage] Error writing persistent storage:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to write server storage' });
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
// UNIFIED GET /api/data ENDPOINT
// Fetches data directly from Hostinger MySQL (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
// with automatic schema migration and fallback to persistent server storage.
// ==========================================
app.get('/api/data', async (req, res) => {
  try {
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
            const teamMembers = await fetchTableData('crm_team_members');
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

            // If MySQL already contains records, return MySQL data immediately
            if (totalRows > 0) {
              return res.json({
                success: true,
                source: 'mysql',
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
              });
            }

            // If MySQL is currently empty and server storage exists, auto-seed MySQL so data lives permanently in MySQL
            if (fs.existsSync(SERVER_STORAGE_FILE)) {
              try {
                const raw = fs.readFileSync(SERVER_STORAGE_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                const fileData = parsed.data || parsed;
                if (fileData && typeof fileData === 'object') {
                  if (Array.isArray(fileData.projects)) {
                    for (const p of fileData.projects) {
                      if (!p || !p.id) continue;
                      await conn.query(
                        `INSERT INTO crm_projects (id, code, client_name, stage, status, kbli_code, data)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
                        [p.id, p.projectCode || p.code || '', p.clientName || '', p.stage || '', p.status || '', p.kbliCode || '', JSON.stringify(p)]
                      );
                    }
                  }
                  if (Array.isArray(fileData.transactions)) {
                    for (const t of fileData.transactions) {
                      if (!t || !t.id) continue;
                      await conn.query(
                        `INSERT INTO crm_transactions (id, transaction_number, type, category, amount_idr, date, data)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
                        [t.id, t.transactionNumber || '', t.type || '', t.category || '', t.amountIdr || t.amount || 0, t.date || '', JSON.stringify(t)]
                      );
                    }
                  }
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
          } finally {
            conn.release();
          }
        } catch (dbErr: any) {
          const ipMatch = dbErr.message?.match(/@'([^']+)'/);
          const incomingIp = ipMatch ? ipMatch[1] : '';
          setMysqlHealthState({
            isHealthy: false,
            lastChecked: Date.now(),
            lastError: dbErr.message || String(dbErr),
            clientIp: incomingIp,
          });
        }
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
// POST /api/data/entity ENDPOINT
// Directly executes INSERT or UPDATE query on MySQL for individual modifications
// ==========================================
app.post('/api/data/entity', async (req, res) => {
  try {
    const { entityType, action, item, id } = req.body || {};
    if (!entityType) {
      return res.status(400).json({ success: false, message: 'entityType is required' });
    }

    let mysqlSuccess = false;
    let mysqlMessage = '';

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
                  await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [targetId]);
                  mysqlSuccess = true;
                  mysqlMessage = `Record ${targetId} deleted from ${tableName}`;
                }
              }
            } else {
              // action === 'save' (INSERT or UPDATE)
              if (item && item.id) {
                if (entityType === 'projects') {
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
                  mysqlMessage = `Project ${item.id} saved to crm_projects`;
                } else if (entityType === 'transactions') {
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
                  mysqlMessage = `Transaction ${item.id} saved to crm_transactions`;
                } else if (entityType === 'receivables') {
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
                } else if (entityType === 'taxObligations') {
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
                      item.id,
                      item.taxType || '',
                      item.taxName || item.title || '',
                      item.amount || item.amountIDR || 0,
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                } else if (entityType === 'payroll' || entityType === 'payrollPayments') {
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
                      item.id,
                      item.employeeName || '',
                      item.period || '',
                      item.netSalary || item.netSalaryIDR || 0,
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                } else if (entityType === 'governmentProjects') {
                  await conn.query(
                    `INSERT INTO crm_government_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || '', JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                } else if (entityType === 'retailProjects') {
                  await conn.query(
                    `INSERT INTO crm_retail_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || '', JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                } else if (entityType === 'bankLoans') {
                  await conn.query(
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
                } else if (entityType === 'dispositions') {
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
                      item.id,
                      item.dispositionNumber || '',
                      item.assigneeName || '',
                      item.status || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                } else if (entityType === 'teamMembers') {
                  await conn.query(
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
                } else if (entityType === 'overheadExpenses') {
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
                } else if (entityType === 'officeRentContracts') {
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
                      item.id,
                      item.contractNumber || '',
                      item.buildingName || '',
                      item.landlordName || '',
                      JSON.stringify(item),
                    ]
                  );
                  mysqlSuccess = true;
                }
              }
            }
          } finally {
            conn.release();
          }
        } catch (dbErr: any) {
          mysqlMessage = dbErr.message || String(dbErr);
          const ipMatch = dbErr.message?.match(/@'([^']+)'/);
          const incomingIp = ipMatch ? ipMatch[1] : '';
          setMysqlHealthState({
            isHealthy: false,
            lastChecked: Date.now(),
            lastError: dbErr.message || String(dbErr),
            clientIp: incomingIp,
          });
        }
      }
    }

    res.json({
      success: true,
      mysqlSuccess,
      mysqlMessage,
      entityType,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download SQL Schema for Hostinger phpMyAdmin
app.get('/api/mysql/schema.sql', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="hostinger_gap_crm_schema.sql"');
  res.send(HOSTINGER_SQL_SCHEMA_RAW);
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
          'Hostinger MySQL belum siap: DB_HOST saat ini masih "localhost". Masukkan IP Server Hostinger Anda di Settings.',
      });
    }

    if (isMysqlInBackoff()) {
      const hState = getMysqlHealthState();
      return res.status(200).json({
        success: false,
        skipped: true,
        message: `Koneksi MySQL Hostinger ditolak/belum siap (${hState.lastError || 'Access denied'}). Periksa izin Remote MySQL di hPanel Hostinger. Data diamankan di server disk storage.`,
      });
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Payload data tidak valid.' });
    }

    // Auto-init schema if needed
    const schemaResult = await initMysqlSchema();
    if (!schemaResult.success) {
      return res.status(200).json({
        success: false,
        message: schemaResult.message,
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
      await conn.beginTransaction();

      // 1. Projects
      if (Array.isArray(payload.projects)) {
        for (const p of payload.projects) {
          if (!p.id) continue;
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
          if (!t.id) continue;
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
          if (!r.id) continue;
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
          if (!tx.id) continue;
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
      if (Array.isArray(payload.payrollPayments)) {
        for (const pr of payload.payrollPayments) {
          if (!pr.id) continue;
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
          if (!gp.id) continue;
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
          if (!rp.id) continue;
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
          if (!bl.id) continue;
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
          if (!d.id) continue;
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
          if (!tm.id) continue;
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
          if (!oh.id) continue;
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
          if (!rent.id) continue;
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

      // 13. App Settings & Master Data
      const settingsToSave = [
        'serviceTypes',
        'documentTypes',
        'documentCategories',
        'transactionCategories',
        'paymentChannels',
        'companyCapital',
        'salaryConfigs',
        'overheadExpenses',
        'officeRentContracts',
        'institutionTypes',
        'termDistributionSchemes',
        'companyLetterhead',
        'roleDefinitions',
        'assignedByOptions',
      ];

      for (const key of settingsToSave) {
        if (payload[key] !== undefined) {
          await conn.query(
            `INSERT INTO crm_app_settings (setting_key, data)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
             data = VALUES(data),
             updated_at = NOW()`,
            [key, JSON.stringify(payload[key])]
          );
        }
      }

      // 14. Full Snapshot for point-in-time recovery
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
        [`Auto-Sync ${new Date().toISOString()}`, totalCount, JSON.stringify(payload)]
      );

      // Process deletions if provided
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

      await conn.commit();

      // Keep persistent server storage file synchronized as dual backup
      try {
        fs.writeFileSync(
          SERVER_STORAGE_FILE,
          JSON.stringify({ updatedAt: new Date().toISOString(), data: payload }, null, 2),
          'utf-8'
        );
      } catch {}

      res.json({
        success: true,
        message: 'Seluruh data berhasil disinkronkan dan disimpan ke Hostinger MySQL!',
        syncedAt: new Date().toISOString(),
        summary: {
          projects: payload.projects?.length || 0,
          transactions: payload.transactions?.length || 0,
          receivables: payload.receivables?.length || 0,
          taxObligations: payload.taxObligations?.length || 0,
          payrollPayments: payload.payrollPayments?.length || 0,
          retailProjects: payload.retailProjects?.length || 0,
          governmentProjects: payload.governmentProjects?.length || 0,
          overheadExpenses: payload.overheadExpenses?.length || 0,
          officeRentContracts: payload.officeRentContracts?.length || 0,
          bankLoans: payload.bankLoans?.length || 0,
          dispositions: payload.dispositions?.length || 0,
          teamMembers: payload.teamMembers?.length || 0,
        },
      });
    } catch (err: any) {
      await conn.rollback();
      throw err;
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Hostinger MySQL configured: ${isMysqlConfigured() ? 'YES' : 'NO'}`);
  });
}

setupViteOrStatic();
