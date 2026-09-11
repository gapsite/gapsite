import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';

let pool: Pool | null = null;
let currentPoolKey = '';

export interface MysqlConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export interface MysqlHealthState {
  isHealthy: boolean;
  lastChecked: number;
  lastError: string | null;
  errorHelp?: string;
  clientIp?: string;
}

let healthState: MysqlHealthState = {
  isHealthy: false,
  lastChecked: 0,
  lastError: null,
};

export function getMysqlHealthState(): MysqlHealthState {
  return healthState;
}

export function setMysqlHealthState(state: Partial<MysqlHealthState>) {
  healthState = { ...healthState, ...state };
}

export function isMysqlHealthy(): boolean {
  return healthState.isHealthy;
}

export function isMysqlInBackoff(): boolean {
  // If connection was tested and failed within the last 45 seconds, back off to prevent error spam
  return healthState.lastChecked > 0 && !healthState.isHealthy && Date.now() - healthState.lastChecked < 45000;
}

export function getMysqlConfig(): MysqlConfig {
  // Prioritize MYSQL_* family if MYSQL_HOST is provided
  if (process.env.MYSQL_HOST) {
    return {
      host: process.env.MYSQL_HOST.trim(),
      port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
      user: (process.env.MYSQL_USER || process.env.DB_USER || '').trim(),
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || '',
      database: (process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE || '').trim(),
    };
  }

  return {
    host: (process.env.DB_HOST || '').trim(),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: (process.env.DB_USER || '').trim(),
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: (process.env.DB_NAME || process.env.DB_DATABASE || '').trim(),
  };
}

export function isMysqlConfigured(): boolean {
  const config = getMysqlConfig();
  return Boolean(config.host && config.user && config.database);
}

export function getMysqlPool(customConfig?: MysqlConfig): Pool {
  if (customConfig && customConfig.host) {
    return mysql.createPool({
      host: customConfig.host.trim(),
      port: customConfig.port || 3306,
      user: (customConfig.user || '').trim(),
      password: customConfig.password || '',
      database: (customConfig.database || '').trim(),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });
  }

  const config = getMysqlConfig();
  const configKey = `${config.host}:${config.port}:${config.user}:${config.database}:${config.password ? 'haspwd' : 'nopwd'}`;

  if (!pool || currentPoolKey !== configKey) {
    if (pool) {
      pool.end().catch(() => {});
    }
    if (!config.host || !config.user || !config.database) {
      throw new Error('Hostinger MySQL environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) are not configured.');
    }
    pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });
    currentPoolKey = configKey;
  }

  return pool;
}

export async function testMysqlConnection(customConfig?: MysqlConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  host?: string;
  database?: string;
  tables?: string[];
}> {
  const startTime = Date.now();
  let tempPool: Pool | null = null;
  let connection: PoolConnection | null = null;

  try {
    const config = customConfig || getMysqlConfig();
    if (!config.host || !config.user || !config.database) {
      return {
        success: false,
        message: 'Konfigurasi Hostinger MySQL belum lengkap. Pastikan DB_HOST (atau MYSQL_HOST), DB_USER (atau MYSQL_USER), dan DB_NAME (atau MYSQL_DATABASE) terisi.',
        host: config.host,
        database: config.database,
      };
    }

    tempPool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password || '',
      database: config.database,
      connectTimeout: 8000,
    });

    connection = await tempPool.getConnection();
    await connection.ping();

    // Query tables
    const [rows] = await connection.query<any[]>('SHOW TABLES');
    const tables = rows.map((r) => Object.values(r)[0] as string);
    const latencyMs = Date.now() - startTime;

    setMysqlHealthState({
      isHealthy: true,
      lastChecked: Date.now(),
      lastError: null,
      errorHelp: undefined,
    });

    return {
      success: true,
      message: `Berhasil terhubung ke Hostinger MySQL database "${config.database}" (${latencyMs}ms).`,
      latencyMs,
      host: config.host,
      database: config.database,
      tables,
    };
  } catch (error: any) {
    let errorHelp = '';
    const hostLower = (customConfig?.host || getMysqlConfig().host || '').toLowerCase().trim();
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : '';

    if (hostLower === 'localhost' || hostLower === '127.0.0.1') {
      errorHelp = ' Catatan penting: MYSQL_HOST saat ini diatur ke "localhost". Karena aplikasi ini berjalan di cloud server terpisah, "localhost" merujuk ke internal container dan bukan server Hostinger Anda. Silakan ganti MYSQL_HOST dengan IP Server Hostinger Anda (misalnya IP Server di hPanel Hostinger atau hostname MySQL Hostinger seperti sqlXXX.main-hosting.eu).';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message?.includes('Access denied')) {
      errorHelp = ` Catatan: Akses ditolak oleh server Hostinger. Buka hPanel Hostinger > Databases > Remote MySQL, pilih database "${config.database}", dan tambahkan tanda "%" (wildcard semua IP)${incomingIp ? ` atau IP "${incomingIp}"` : ''}. Pastikan juga password user "${config.user}" di Settings cocok dengan di Hostinger.`;
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('ETIMEDOUT')) {
      errorHelp = ' Catatan: Koneksi timeout. Pastikan Remote MySQL di hPanel Hostinger sudah diaktifkan dengan mengizinkan IP "%" dan port 3306 tidak diblokir firewall.';
    }

    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: error.message || String(error),
      errorHelp,
      clientIp: incomingIp,
    });

    return {
      success: false,
      message: `Gagal terhubung ke Hostinger MySQL: ${error.message || error}.${errorHelp}`,
    };
  } finally {
    if (connection) connection.release();
    if (tempPool) {
      await tempPool.end().catch(() => {});
    }
  }
}

export async function initMysqlSchema(): Promise<{ success: boolean; message: string }> {
  if (!isMysqlConfigured()) {
    return { success: false, message: 'MySQL is not configured.' };
  }

  if (isMysqlInBackoff()) {
    return {
      success: false,
      message: healthState.lastError || 'MySQL sedang dalam masa jeda setelah koneksi sebelumnya ditolak.',
    };
  }

  const config = getMysqlConfig();
  const hostLower = (config.host || '').toLowerCase().trim();
  const isAiStudioSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isAiStudioSandbox && (hostLower === 'localhost' || hostLower === '127.0.0.1')) {
    return {
      success: false,
      message:
        'DB_HOST saat ini bernilai "localhost". Di cloud sandbox AI Studio, silakan gunakan IP Remote MySQL Hostinger Anda. Jika aplikasi sudah di-deploy langsung di server Hostinger, "localhost" dapat digunakan secara langsung.',
    };
  }

  let conn: PoolConnection | null = null;
  try {
    const p = getMysqlPool();
    conn = await p.getConnection();
  } catch (err: any) {
    const ipMatch = err.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : '';
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: err.message || String(err),
      clientIp: incomingIp,
    });
    return {
      success: false,
      message: `Gagal terhubung ke MySQL Hostinger (${err.code || err.message || err}). Pastikan IP Server dan Remote MySQL di hPanel sudah benar.`,
    };
  }

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_projects (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50),
        client_name VARCHAR(255),
        stage VARCHAR(50),
        status VARCHAR(50),
        kbli_code VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stage (stage),
        INDEX idx_client (client_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_transactions (
        id VARCHAR(100) PRIMARY KEY,
        transaction_number VARCHAR(100),
        type VARCHAR(20),
        category VARCHAR(100),
        amount_idr BIGINT,
        date VARCHAR(20),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_receivables (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number VARCHAR(100),
        client_name VARCHAR(255),
        total_amount BIGINT,
        paid_amount BIGINT,
        status VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_tax_obligations (
        id VARCHAR(100) PRIMARY KEY,
        tax_type VARCHAR(50),
        title VARCHAR(255),
        amount BIGINT,
        status VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_payroll (
        id VARCHAR(100) PRIMARY KEY,
        employee_name VARCHAR(255),
        period VARCHAR(50),
        net_salary BIGINT,
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_period (period)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_government_projects (
        id VARCHAR(100) PRIMARY KEY,
        project_name VARCHAR(255),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_retail_projects (
        id VARCHAR(100) PRIMARY KEY,
        project_name VARCHAR(255),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_bank_loans (
        id VARCHAR(100) PRIMARY KEY,
        loan_name VARCHAR(255),
        bank_name VARCHAR(255),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_dispositions (
        id VARCHAR(100) PRIMARY KEY,
        disposition_number VARCHAR(100),
        assignee_name VARCHAR(255),
        status VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_team_members (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100),
        email VARCHAR(255),
        role VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_overhead_expenses (
        id VARCHAR(100) PRIMARY KEY,
        overhead_number VARCHAR(100),
        category VARCHAR(100),
        recipient VARCHAR(255),
        amount_idr BIGINT,
        date VARCHAR(20),
        status VARCHAR(50),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_office_rent_contracts (
        id VARCHAR(100) PRIMARY KEY,
        contract_number VARCHAR(100),
        building_name VARCHAR(255),
        landlord_name VARCHAR(255),
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_app_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        data LONGTEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS crm_full_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        snapshot_name VARCHAR(255),
        total_records INT,
        data LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    return { success: true, message: 'Skema tabel Hostinger MySQL berhasil disiapkan.' };
  } catch (error: any) {
    return { success: false, message: `Gagal membuat tabel MySQL: ${error.message || error}` };
  } finally {
    conn.release();
  }
}

export const HOSTINGER_SQL_SCHEMA_RAW = `-- Skema Database Hostinger MySQL untuk GAP CRM (GAP.SITE)
-- Import file ini ke phpMyAdmin di cPanel / hPanel Hostinger Anda

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

CREATE TABLE IF NOT EXISTS \`crm_projects\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`code\` VARCHAR(50) DEFAULT NULL,
  \`client_name\` VARCHAR(255) DEFAULT NULL,
  \`stage\` VARCHAR(50) DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`kbli_code\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_stage\` (\`stage\`),
  INDEX \`idx_client\` (\`client_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_transactions\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`transaction_number\` VARCHAR(100) DEFAULT NULL,
  \`type\` VARCHAR(20) DEFAULT NULL,
  \`category\` VARCHAR(100) DEFAULT NULL,
  \`amount_idr\` BIGINT DEFAULT 0,
  \`date\` VARCHAR(20) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_date\` (\`date\`),
  INDEX \`idx_type\` (\`type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_receivables\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`invoice_number\` VARCHAR(100) DEFAULT NULL,
  \`client_name\` VARCHAR(255) DEFAULT NULL,
  \`total_amount\` BIGINT DEFAULT 0,
  \`paid_amount\` BIGINT DEFAULT 0,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_tax_obligations\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`tax_type\` VARCHAR(50) DEFAULT NULL,
  \`title\` VARCHAR(255) DEFAULT NULL,
  \`amount\` BIGINT DEFAULT 0,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_payroll\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`employee_name\` VARCHAR(255) DEFAULT NULL,
  \`period\` VARCHAR(50) DEFAULT NULL,
  \`net_salary\` BIGINT DEFAULT 0,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_period\` (\`period\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_government_projects\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`project_name\` VARCHAR(255) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_retail_projects\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`project_name\` VARCHAR(255) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_bank_loans\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`loan_name\` VARCHAR(255) DEFAULT NULL,
  \`bank_name\` VARCHAR(255) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_dispositions\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`disposition_number\` VARCHAR(100) DEFAULT NULL,
  \`assignee_name\` VARCHAR(255) DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_team_members\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`username\` VARCHAR(100) DEFAULT NULL,
  \`email\` VARCHAR(255) DEFAULT NULL,
  \`role\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_overhead_expenses\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`overhead_number\` VARCHAR(100) DEFAULT NULL,
  \`category\` VARCHAR(100) DEFAULT NULL,
  \`recipient\` VARCHAR(255) DEFAULT NULL,
  \`amount_idr\` BIGINT DEFAULT 0,
  \`date\` VARCHAR(20) DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_date\` (\`date\`),
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_office_rent_contracts\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`contract_number\` VARCHAR(100) DEFAULT NULL,
  \`building_name\` VARCHAR(255) DEFAULT NULL,
  \`landlord_name\` VARCHAR(255) DEFAULT NULL,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_app_settings\` (
  \`setting_key\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`data\` LONGTEXT NOT NULL,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`crm_full_snapshots\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`snapshot_name\` VARCHAR(255) DEFAULT NULL,
  \`total_records\` INT DEFAULT 0,
  \`data\` LONGTEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
