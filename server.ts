import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getMysqlConfig,
  isMysqlConfigured,
  testMysqlConnection,
  initMysqlSchema,
  getMysqlPool,
  HOSTINGER_SQL_SCHEMA_RAW,
  MysqlConfig,
} from './server/mysql';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous payload limits for full backups
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mysqlConfigured: isMysqlConfigured(),
  });
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

    const testResult = await testMysqlConnection();
    res.json({
      configured: true,
      ...testResult,
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
    if (hostLower === 'localhost' || hostLower === '127.0.0.1') {
      return res.status(200).json({
        success: false,
        skipped: true,
        message:
          'Hostinger MySQL belum siap: MYSQL_HOST saat ini masih "localhost". Masukkan IP Server Hostinger Anda di Settings.',
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

      // 11. App Settings & Master Data
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

      // 12. Full Snapshot for point-in-time recovery
      const totalCount =
        (payload.projects?.length || 0) +
        (payload.transactions?.length || 0) +
        (payload.receivables?.length || 0);

      await conn.query(
        `INSERT INTO crm_full_snapshots (snapshot_name, total_records, data)
         VALUES (?, ?, ?)`,
        [`Auto-Sync ${new Date().toISOString()}`, totalCount, JSON.stringify(payload)]
      );

      await conn.commit();

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
        },
      });
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.warn('MySQL Sync Push Warning:', error.message || error);
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
    if (hostLower === 'localhost' || hostLower === '127.0.0.1') {
      return res.status(200).json({
        success: false,
        skipped: true,
        message:
          'Hostinger MySQL belum terhubung: MYSQL_HOST saat ini masih "localhost". Masukkan IP Server Hostinger Anda di Settings.',
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
          overheadExpenses: settingsMap.overheadExpenses || [],
          officeRentContracts: settingsMap.officeRentContracts || [],
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
    console.warn('MySQL Sync Pull Warning:', error.message || error);
    res.status(200).json({
      success: false,
      message: `Gagal menarik data dari Hostinger MySQL: ${error.message || error}`,
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server GAP CRM running on http://0.0.0.0:${PORT}`);
    console.log(`Hostinger MySQL configured: ${isMysqlConfigured() ? 'YES' : 'NO'}`);
  });
}

setupViteOrStatic();
