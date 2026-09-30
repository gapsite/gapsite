import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// server.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import dotenv from "dotenv";

// server/mysql.ts
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
var pool = null;
var currentPoolKey = "";
function resolveRuntimeConfigPath() {
  const candidates = [
    path.join(process.cwd(), "data", "mysql_config.json"),
    path.join(process.cwd(), "hbuilds", "current", "nodejs", "data", "mysql_config.json"),
    path.resolve(process.cwd(), "..", "data", "mysql_config.json"),
    path.resolve(process.cwd(), "..", "..", "data", "mysql_config.json")
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(process.cwd(), "data", "mysql_config.json");
}
var RUNTIME_CONFIG_PATH = resolveRuntimeConfigPath();
function sanitizeDbError(message) {
  if (!message) return "Unknown database error";
  return message.replace(/(password|pwd)=([^\s;&]+)/gi, "$1=***").replace(/(mysql:\/\/)([^:]+):([^@]+)@/gi, "$1$2:***@").replace(/using password:\s*(YES|NO)/gi, "using password: ***");
}
var healthState = {
  isHealthy: false,
  lastChecked: 0,
  lastError: null
};
function getMysqlHealthState() {
  return healthState;
}
function setMysqlHealthState(state) {
  healthState = { ...healthState, ...state };
}
function isMysqlInBackoff() {
  return healthState.lastChecked > 0 && !healthState.isHealthy && Date.now() - healthState.lastChecked < 45e3;
}
function hasMysqlRuntimeConfig() {
  try {
    return fs.existsSync(RUNTIME_CONFIG_PATH);
  } catch {
    return false;
  }
}
function saveMysqlConfig(newConfig) {
  const dir = path.dirname(RUNTIME_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const existing = getMysqlConfig();
  const configToSave = {
    host: newConfig.host ? newConfig.host.trim() : existing.host || "",
    port: newConfig.port || existing.port || 3306,
    user: newConfig.user ? newConfig.user.trim() : existing.user || "",
    password: newConfig.password !== void 0 && newConfig.password !== "" ? newConfig.password : existing.password || "",
    database: newConfig.database ? newConfig.database.trim() : existing.database || ""
  };
  fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(configToSave, null, 2), "utf-8");
  if (pool) {
    pool.end().catch(() => {
    });
    pool = null;
    currentPoolKey = "";
  }
  healthState = {
    isHealthy: false,
    lastChecked: 0,
    lastError: null
  };
  return configToSave;
}
function clearMysqlRuntimeConfig() {
  if (fs.existsSync(RUNTIME_CONFIG_PATH)) {
    try {
      fs.unlinkSync(RUNTIME_CONFIG_PATH);
    } catch {
    }
  }
  if (pool) {
    pool.end().catch(() => {
    });
    pool = null;
    currentPoolKey = "";
  }
  healthState = {
    isHealthy: false,
    lastChecked: 0,
    lastError: null
  };
}
function getMysqlConfig() {
  const mysqlHost = (process.env.MYSQL_HOST || "").trim();
  const mysqlUser = (process.env.MYSQL_USER || "").trim();
  let mysqlDatabase = (process.env.MYSQL_DATABASE || "").trim();
  const mysqlPassword = process.env.MYSQL_PASSWORD || "";
  const mysqlPort = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const connectionLimit = parseInt(process.env.MYSQL_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT || "10", 10);
  const connectTimeout = parseInt(process.env.MYSQL_CONNECT_TIMEOUT || process.env.DB_CONNECT_TIMEOUT || "10000", 10);
  const userPrefixMatch = mysqlUser.match(/^(u\d+)_/i);
  const dbPrefixMatch = mysqlDatabase.match(/^(u\d+)_/i);
  if (userPrefixMatch && dbPrefixMatch && userPrefixMatch[1].toLowerCase() !== dbPrefixMatch[1].toLowerCase()) {
    console.warn(`[mysql] PERINGATAN: Terdeteksi ketidakcocokan hosting! User "${mysqlUser}" (${userPrefixMatch[1]}) berbeda prefix dengan database "${mysqlDatabase}" (${dbPrefixMatch[1]}). gaphorizon.com harus menggunakan user dan database dari hosting gaphorizon.com.`);
    const gaphorizonDb = (process.env.GAPHORIZON_MYSQL_DATABASE || process.env.GAPHORIZON_DATABASE || "").trim();
    if (gaphorizonDb) {
      mysqlDatabase = gaphorizonDb;
    }
  }
  if (mysqlHost && mysqlUser && mysqlDatabase) {
    return {
      host: mysqlHost,
      port: mysqlPort,
      user: mysqlUser,
      password: mysqlPassword,
      database: mysqlDatabase,
      connectionLimit,
      connectTimeout
    };
  }
  if (fs.existsSync(RUNTIME_CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(RUNTIME_CONFIG_PATH, "utf-8");
      const saved = JSON.parse(content);
      if (saved && saved.host && saved.user && saved.database) {
        return {
          host: String(saved.host).trim(),
          port: parseInt(String(saved.port || "3306"), 10),
          user: String(saved.user).trim(),
          password: String(saved.password || ""),
          database: String(saved.database).trim(),
          connectionLimit: parseInt(String(saved.connectionLimit || process.env.MYSQL_CONNECTION_LIMIT || "10"), 10),
          connectTimeout: parseInt(String(saved.connectTimeout || process.env.MYSQL_CONNECT_TIMEOUT || "10000"), 10)
        };
      }
    } catch {
    }
  }
  const dbUrl = (process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL || "").trim();
  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      const host2 = parsedUrl.hostname;
      const port2 = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306;
      const user2 = decodeURIComponent(parsedUrl.username || "");
      const password2 = decodeURIComponent(parsedUrl.password || "");
      const database2 = decodeURIComponent(parsedUrl.pathname.replace(/^\//, "") || "");
      const isPlaceholder = !user2 || !database2 || user2.toUpperCase() === "USERNAME" || database2.toUpperCase() === "NAMA_DATABASE" || password2.toUpperCase() === "PASSWORD" || host2 === "localhost" || host2 === "127.0.0.1" || dbUrl.includes("USERNAME:PASSWORD") || dbUrl.includes("NAMA_DATABASE");
      if (host2 && user2 && database2 && !isPlaceholder) {
        return { host: host2, port: port2, user: user2, password: password2, database: database2, connectionLimit, connectTimeout };
      }
    } catch {
    }
  }
  const host = (process.env.DB_HOST || "").trim();
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = (process.env.DB_USER || "").trim();
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || "";
  const database = (process.env.DB_NAME || process.env.DB_DATABASE || "").trim();
  return { host, port, user, password, database, connectionLimit, connectTimeout };
}
function isMysqlConfigured() {
  const config = getMysqlConfig();
  return Boolean(config.host && config.user && config.database);
}
function getMysqlPool(customConfig) {
  if (customConfig && customConfig.host) {
    return mysql.createPool({
      host: customConfig.host.trim(),
      port: customConfig.port || 3306,
      user: (customConfig.user || "").trim(),
      password: customConfig.password || "",
      database: (customConfig.database || "").trim(),
      waitForConnections: true,
      connectionLimit: customConfig.connectionLimit || 10,
      queueLimit: 0,
      connectTimeout: customConfig.connectTimeout || 1e4
    });
  }
  const config = getMysqlConfig();
  const configKey = `${config.host}:${config.port}:${config.user}:${config.database}:${config.password ? "haspwd" : "nopwd"}`;
  if (!pool || currentPoolKey !== configKey) {
    if (pool) {
      pool.end().catch(() => {
      });
    }
    if (!config.host || !config.user || !config.database) {
      throw new Error("Hostinger MySQL environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) are not configured.");
    }
    pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      connectTimeout: config.connectTimeout || 1e4
    });
    currentPoolKey = configKey;
  }
  return pool;
}
async function testMysqlConnection(customConfig) {
  const startTime = Date.now();
  let tempPool = null;
  let connection = null;
  const config = customConfig || getMysqlConfig();
  try {
    if (!config.host || !config.user || !config.database) {
      return {
        success: false,
        message: "Konfigurasi Hostinger MySQL belum lengkap. Pastikan MYSQL_HOST (atau DB_HOST), MYSQL_USER (atau DB_USER), dan MYSQL_DATABASE (atau DB_NAME) terisi.",
        host: config.host,
        database: config.database
      };
    }
    tempPool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password || "",
      database: config.database,
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
      connectTimeout: config.connectTimeout || 8e3
    });
    connection = await tempPool.getConnection();
    const [healthRows] = await connection.query("SELECT 1 AS health_check");
    const healthVal = healthRows && healthRows[0] ? healthRows[0].health_check : 1;
    const [rows] = await connection.query("SHOW TABLES");
    const tables = rows.map((r) => Object.values(r)[0]);
    const latencyMs = Date.now() - startTime;
    setMysqlHealthState({
      isHealthy: true,
      lastChecked: Date.now(),
      lastError: null,
      errorHelp: void 0
    });
    return {
      success: true,
      message: `Health check koneksi database berhasil (SELECT 1 = ${healthVal}) ke database "${config.database}" (${latencyMs}ms). Catatan: Status ini hanya memverifikasi koneksi aktif, bukan bukti seluruh data telah tersinkronisasi.`,
      latencyMs,
      host: config.host,
      database: config.database,
      tables
    };
  } catch (error) {
    let errorHelp = "";
    const hostLower = (customConfig?.host || getMysqlConfig().host || "").toLowerCase().trim();
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : "";
    if (hostLower === "localhost" || hostLower === "127.0.0.1") {
      errorHelp = ' Catatan penting: MYSQL_HOST saat ini diatur ke "localhost". Karena aplikasi ini berjalan di cloud server terpisah, "localhost" merujuk ke internal container dan bukan server Hostinger Anda. Silakan ganti MYSQL_HOST dengan IP Server Hostinger Anda (misalnya IP Server di hPanel Hostinger atau hostname MySQL Hostinger seperti sqlXXX.main-hosting.eu).';
    } else if (error.code === "ER_ACCESS_DENIED_ERROR" || error.message?.includes("Access denied")) {
      errorHelp = ` Catatan: Akses ditolak oleh server Hostinger. Buka hPanel Hostinger > Databases > Remote MySQL, pilih database "${config.database}", dan tambahkan tanda "%" (wildcard semua IP)${incomingIp ? ` atau IP "${incomingIp}"` : ""}. Pastikan juga password user "${config.user}" di Settings cocok dengan di Hostinger.`;
    } else if (error.code === "ETIMEDOUT" || error.message?.includes("ETIMEDOUT")) {
      errorHelp = ' Catatan: Koneksi timeout. Pastikan Remote MySQL di hPanel Hostinger sudah diaktifkan dengan mengizinkan IP "%" dan port 3306 tidak diblokir firewall.';
    }
    const safeErrorMsg = sanitizeDbError(error.message || String(error));
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: safeErrorMsg,
      errorHelp,
      clientIp: incomingIp
    });
    return {
      success: false,
      message: `Gagal terhubung ke Hostinger MySQL: ${safeErrorMsg}.${errorHelp}`
    };
  } finally {
    if (connection) connection.release();
    if (tempPool) {
      await tempPool.end().catch(() => {
      });
    }
  }
}
async function initMysqlSchema() {
  if (!isMysqlConfigured()) {
    return { success: false, message: "MySQL is not configured." };
  }
  if (isMysqlInBackoff()) {
    return {
      success: false,
      message: healthState.lastError || "MySQL sedang dalam masa jeda setelah koneksi sebelumnya ditolak."
    };
  }
  const config = getMysqlConfig();
  const hostLower = (config.host || "").toLowerCase().trim();
  const isAiStudioSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isAiStudioSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1")) {
    return {
      success: false,
      message: 'DB_HOST saat ini bernilai "localhost". Di cloud sandbox AI Studio, silakan gunakan IP Remote MySQL Hostinger Anda. Jika aplikasi sudah di-deploy langsung di server Hostinger, "localhost" dapat digunakan secara langsung.'
    };
  }
  let conn = null;
  try {
    const p = getMysqlPool();
    conn = await p.getConnection();
  } catch (err) {
    const ipMatch = err.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : "";
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: err.message || String(err),
      clientIp: incomingIp
    });
    return {
      success: false,
      message: `Gagal terhubung ke MySQL Hostinger (${err.code || err.message || err}). Pastikan IP Server dan Remote MySQL di hPanel sudah benar.`
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
    return { success: true, message: "Skema tabel Hostinger MySQL berhasil disiapkan." };
  } catch (error) {
    return { success: false, message: `Gagal membuat tabel MySQL: ${error.message || error}` };
  } finally {
    conn.release();
  }
}
var HOSTINGER_SQL_SCHEMA_RAW = `-- Skema Database Hostinger MySQL untuk GAP CRM (GAP.SITE)
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

// server.ts
dotenv.config();
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}
if (process.env.DISABLE_HMR === void 0) {
  process.env.DISABLE_HMR = "true";
}
if (!process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN = "https://gaphorizon.com";
}
process.on("unhandledRejection", (reason, promise) => {
  console.error("[server] Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught Exception:", err);
});
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var allowedOrigin = process.env.CORS_ORIGIN || "https://gaphorizon.com";
app.use((req, res, next) => {
  const origin = req.headers.origin || allowedOrigin;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.get(["/health", "/api/health"], (req, res) => {
  const cfg = getMysqlConfig();
  const dbHealth = getMysqlHealthState();
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    mysqlConfigured: isMysqlConfigured(),
    mysqlHealthy: dbHealth.isHealthy,
    mysqlHost: cfg.host || null,
    port: PORT,
    host: "0.0.0.0",
    database: cfg.database || null,
    corsOrigin: process.env.CORS_ORIGIN || "https://gaphorizon.com",
    nodeVersion: process.version,
    env: process.env.NODE_ENV || "production",
    deploymentPath: "hbuilds/current/nodejs"
  });
});
function resolveDataDir() {
  const candidates = [
    path2.join(process.cwd(), "data"),
    path2.join(process.cwd(), "hbuilds", "current", "nodejs", "data"),
    path2.resolve(process.cwd(), "..", "data"),
    path2.resolve(process.cwd(), "..", "..", "data")
  ];
  for (const dir of candidates) {
    if (fs2.existsSync(dir)) return dir;
  }
  const defaultDir = path2.join(process.cwd(), "data");
  try {
    fs2.mkdirSync(defaultDir, { recursive: true });
  } catch {
  }
  return defaultDir;
}
var DATA_DIR = resolveDataDir();
var SERVER_STORAGE_FILE = path2.join(DATA_DIR, "crm_persistent_storage.json");
if (!fs2.existsSync(DATA_DIR)) {
  try {
    fs2.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn("[server-storage] Error creating data directory:", err);
  }
}
var PURGED_DUMMY_USER_IDS = [
  "usr-lead-01",
  "usr-tech-01",
  "usr-survey-01",
  "usr-fin-01",
  "usr-dir-01",
  "usr-lead-02",
  "usr-tech-02",
  "usr-liaison-01",
  "usr-fin-02",
  "usr-client-01",
  "usr-client-indosejahtera",
  "usr-bambang",
  "usr-hendra",
  "usr-dian",
  "usr-fajar",
  "usr-siti",
  "usr-budi"
];
var PURGED_DUMMY_USERNAMES = [
  "bambang.lead",
  "siti.tech",
  "hendra.survey",
  "dewi.finance",
  "bambang.soediro",
  "director.soediro",
  "hendra.kusuma",
  "lead.kusuma",
  "dian.safitri",
  "tech.nurhaliza",
  "fajar.nugraha",
  "liaison.pratama",
  "siti.aminah",
  "finance.sartika",
  "client.indosejahtera",
  "client.wibowo",
  "bambang.irawan",
  "hendra.wijaya",
  "dewi.lestari",
  "siti.rahmawati"
];
var PURGED_DUMMY_EMAILS = [
  "bambang.lead@gapsite.com",
  "siti.rahma@gapsite.com",
  "hendra.survey@gapsite.com",
  "dewi.finance@gapsite.com",
  "bambang.soediro@gapsite.com",
  "hendra.kusuma@gapsite.com",
  "dian.safitri@gapsite.com",
  "nurhaliza.putri@gapsite.com",
  "fajar.nugraha@gapsite.com",
  "dedi.pratama@gapsite.com",
  "siti.aminah@gapsite.com",
  "dewi.sartika@gapsite.com",
  "client.indosejahtera@gapsite.com",
  "budi.wibowo@clientcorp.co.id"
];
var PURGED_DUMMY_NAMES_LOWER = [
  "bambang soediro",
  "hendra kusuma",
  "dian safitri",
  "fajar nugraha",
  "siti aminah",
  "budi santoso",
  "nurhaliza putri",
  "dedi pratama",
  "dewi sartika",
  "budi wibowo",
  "hendra wijaya",
  "dewi lestari",
  "bambang irawan",
  "siti rahmawati"
];
var isPurgedUser = (u) => {
  if (!u) return false;
  if (u.id === "usr-0" || u.username === "admin.master" || u.email === "adryankelvianto250@gmail.com") return false;
  const uid = (u.id || "").toLowerCase();
  const uname = (u.username || "").toLowerCase();
  const uemail = (u.email || "").toLowerCase();
  const unameStr = (u.name || "").toLowerCase();
  if (PURGED_DUMMY_USER_IDS.some((id) => id.toLowerCase() === uid)) return true;
  if (PURGED_DUMMY_USERNAMES.some((un) => un.toLowerCase() === uname)) return true;
  if (PURGED_DUMMY_EMAILS.some((em) => em.toLowerCase() === uemail)) return true;
  if (PURGED_DUMMY_NAMES_LOWER.some((name) => unameStr.includes(name))) return true;
  return false;
};
async function executeMysqlCrmBatchWrite(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") {
    throw new Error("Payload data tidak valid.");
  }
  const payload = rawPayload.data || rawPayload;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  try {
    let dataToPersist = payload;
    if (!Array.isArray(payload.projects) && fs2.existsSync(SERVER_STORAGE_FILE)) {
      try {
        const rawExisting = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        const parsedExisting = JSON.parse(rawExisting);
        const existingData = parsedExisting.data || parsedExisting;
        dataToPersist = { ...existingData, ...payload };
      } catch {
      }
    }
    const dataToSave = {
      version: "1.0",
      updatedAt: nowIso,
      data: dataToPersist
    };
    const tempFile = `${SERVER_STORAGE_FILE}.tmp`;
    fs2.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    fs2.renameSync(tempFile, SERVER_STORAGE_FILE);
  } catch (diskErr) {
    console.error("[server-storage] Gagal menyimpan ke disk cadangan:", diskErr);
  }
  const summary = {
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
    officeRentContracts: payload.officeRentContracts?.length || 0
  };
  if (!isMysqlConfigured()) {
    return {
      success: true,
      source: "disk_backup",
      syncedAt: nowIso,
      summary,
      message: "Data berhasil disimpan ke disk persisten server. Hostinger MySQL belum dikonfigurasi."
    };
  }
  const config = getMysqlConfig();
  const hostLower = (config.host || "").toLowerCase().trim();
  const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1")) {
    return {
      success: true,
      source: "disk_backup",
      syncedAt: nowIso,
      summary,
      message: "Data aman di server disk. Hostinger MySQL masih localhost (masukkan IP server Hostinger di tab Konfigurasi)."
    };
  }
  if (isMysqlInBackoff()) {
    const hState = getMysqlHealthState();
    return {
      success: true,
      source: "disk_backup",
      syncedAt: nowIso,
      summary,
      message: `Data aman di disk server. Koneksi MySQL Hostinger sedang menunggu backoff (${hState.lastError || "Access denied"}).`
    };
  }
  const schemaResult = await initMysqlSchema();
  if (!schemaResult.success) {
    return {
      success: false,
      source: "disk_backup_only",
      syncedAt: nowIso,
      summary,
      message: schemaResult.message
    };
  }
  const pool2 = getMysqlPool();
  const conn = await pool2.getConnection();
  try {
    await conn.beginTransaction();
    if (Array.isArray(payload.projects)) {
      for (const p of payload.projects) {
        if (!p || !p.id || p.id.startsWith("CONCURRENT_TEST_") || p.id.startsWith("RESTART_TEST_")) continue;
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
            p.projectCode || p.code || "",
            p.clientName || "",
            p.stage || "",
            p.status || "",
            p.kbliCode || "",
            JSON.stringify(p)
          ]
        );
      }
    }
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
            t.transactionNumber || t.referenceNumber || "",
            t.type || "",
            t.category || "",
            t.amountIdr || t.amount || 0,
            t.date || "",
            JSON.stringify(t)
          ]
        );
      }
    }
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
            r.invoiceNumber || "",
            r.clientName || "",
            r.totalAmount || 0,
            r.paidAmount || 0,
            r.status || "",
            JSON.stringify(r)
          ]
        );
      }
    }
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
            tx.taxType || "",
            tx.taxName || tx.title || "",
            tx.amount || 0,
            tx.status || "",
            JSON.stringify(tx)
          ]
        );
      }
    }
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
            pr.employeeName || "",
            pr.period || "",
            pr.netSalary || 0,
            JSON.stringify(pr)
          ]
        );
      }
    }
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
          [gp.id, gp.name || gp.projectName || "", JSON.stringify(gp)]
        );
      }
    }
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
          [rp.id, rp.name || rp.projectName || "", JSON.stringify(rp)]
        );
      }
    }
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
          [bl.id, bl.loanName || "", bl.bankName || "", JSON.stringify(bl)]
        );
      }
    }
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
            d.dispositionNumber || "",
            d.assigneeName || "",
            d.status || "",
            JSON.stringify(d)
          ]
        );
      }
    }
    if (Array.isArray(payload.teamMembers)) {
      for (const tm of payload.teamMembers) {
        if (!tm || !tm.id) continue;
        if (isPurgedUser(tm)) {
          try {
            await conn.query("DELETE FROM crm_team_members WHERE id = ? OR username = ? OR email = ?", [
              tm.id,
              tm.username || "",
              tm.email || ""
            ]);
          } catch {
          }
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
            tm.username || "",
            tm.email || "",
            tm.role || "",
            JSON.stringify(tm)
          ]
        );
      }
    }
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
            oh.overheadNumber || "",
            oh.category || "",
            oh.recipient || "",
            oh.amountIdr || 0,
            oh.date || "",
            oh.status || "",
            JSON.stringify(oh)
          ]
        );
      }
    }
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
            rent.contractNumber || "",
            rent.buildingName || "",
            rent.landlordName || "",
            JSON.stringify(rent)
          ]
        );
      }
    }
    const settingsMap = {
      serviceTypes: payload.serviceTypes !== void 0 ? payload.serviceTypes : payload.consultingServices,
      documentTypes: payload.documentTypes,
      documentCategories: payload.documentCategories,
      transactionCategories: payload.transactionCategories,
      paymentChannels: payload.paymentChannels,
      companyCapital: payload.companyCapital,
      salaryConfigs: payload.salaryConfigs !== void 0 ? payload.salaryConfigs : payload.employeeSalaryConfigs,
      institutionTypes: payload.institutionTypes,
      termDistributionSchemes: payload.termDistributionSchemes,
      companyLetterhead: payload.companyLetterhead,
      roleDefinitions: payload.roleDefinitions,
      assignedByOptions: payload.assignedByOptions
    };
    for (const [key, val] of Object.entries(settingsMap)) {
      if (val !== void 0) {
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
    const totalCount = (payload.projects?.length || 0) + (payload.transactions?.length || 0) + (payload.receivables?.length || 0) + (payload.retailProjects?.length || 0) + (payload.governmentProjects?.length || 0) + (payload.overheadExpenses?.length || 0);
    await conn.query(
      `INSERT INTO crm_full_snapshots (snapshot_name, total_records, data)
       VALUES (?, ?, ?)`,
      [`Auto-Sync ${nowIso}`, totalCount, JSON.stringify(payload)]
    );
    try {
      await conn.query(`
        DELETE FROM crm_full_snapshots 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id FROM crm_full_snapshots ORDER BY id DESC LIMIT 30
          ) as keep_snapshots
        )
      `);
    } catch {
    }
    if (Array.isArray(payload.deletedProjectIds)) {
      for (const delId of payload.deletedProjectIds) {
        if (delId) await conn.query("DELETE FROM crm_projects WHERE id = ?", [delId]);
      }
    }
    if (Array.isArray(payload.deletedTransactionIds)) {
      for (const delId of payload.deletedTransactionIds) {
        if (delId) await conn.query("DELETE FROM crm_transactions WHERE id = ?", [delId]);
      }
    }
    if (Array.isArray(payload.deletedReceivableIds)) {
      for (const delId of payload.deletedReceivableIds) {
        if (delId) await conn.query("DELETE FROM crm_receivables WHERE id = ?", [delId]);
      }
    }
    const delTaxes = payload.deletedTaxObligationIds || payload.deletedTaxIds;
    if (Array.isArray(delTaxes)) {
      for (const delId of delTaxes) {
        if (delId) await conn.query("DELETE FROM crm_tax_obligations WHERE id = ?", [delId]);
      }
    }
    if (Array.isArray(payload.deletedPayrollIds)) {
      for (const delId of payload.deletedPayrollIds) {
        if (delId) await conn.query("DELETE FROM crm_payroll WHERE id = ?", [delId]);
      }
    }
    const delOverheads = payload.deletedOverheadExpenseIds || payload.deletedOverheadIds;
    if (Array.isArray(delOverheads)) {
      for (const delId of delOverheads) {
        if (delId) await conn.query("DELETE FROM crm_overhead_expenses WHERE id = ?", [delId]);
      }
    }
    if (Array.isArray(payload.deletedDispositionIds)) {
      for (const delId of payload.deletedDispositionIds) {
        if (delId) await conn.query("DELETE FROM crm_dispositions WHERE id = ?", [delId]);
      }
    }
    if (Array.isArray(payload.deletedUserIds)) {
      for (const delId of payload.deletedUserIds) {
        if (delId) await conn.query("DELETE FROM crm_team_members WHERE id = ?", [delId]);
      }
    }
    try {
      for (const pid of PURGED_DUMMY_USER_IDS) {
        await conn.query("DELETE FROM crm_team_members WHERE id = ?", [pid]);
      }
      for (const pun of PURGED_DUMMY_USERNAMES) {
        await conn.query("DELETE FROM crm_team_members WHERE username = ?", [pun]);
      }
      for (const pem of PURGED_DUMMY_EMAILS) {
        await conn.query("DELETE FROM crm_team_members WHERE email = ?", [pem]);
      }
      await conn.query("DELETE FROM crm_projects WHERE id LIKE 'CONCURRENT_TEST_%' OR id LIKE 'RESTART_TEST_%'");
    } catch {
    }
    await conn.commit();
    setMysqlHealthState({
      isHealthy: true,
      lastChecked: Date.now(),
      lastError: null,
      clientIp: ""
    });
    return {
      success: true,
      source: "mysql_and_disk",
      syncedAt: nowIso,
      summary,
      message: "Seluruh data berhasil disimpan dan disinkronkan ke Hostinger MySQL dan disk server!"
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
app.post("/api/storage/sync", async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error) {
    console.error("[server-storage] Error in persistent sync:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to save storage" });
  }
});
app.post(["/api/storage/restore", "/api/backup/upload"], async (req, res) => {
  try {
    const payload = req.body.data || req.body;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const dataToSave = {
      version: "2.0",
      updatedAt: nowIso,
      data: payload
    };
    const tempFile = `${SERVER_STORAGE_FILE}.tmp`;
    fs2.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    fs2.renameSync(tempFile, SERVER_STORAGE_FILE);
    const result = await executeMysqlCrmBatchWrite({ data: payload });
    res.json({
      success: true,
      message: "Seluruh data server berhasil diganti dari file backup!",
      restoredAt: nowIso,
      syncResult: result
    });
  } catch (error) {
    console.error("[server-storage] Error in storage restore:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to restore storage" });
  }
});
app.get("/api/storage/status", (req, res) => {
  try {
    const exists = fs2.existsSync(SERVER_STORAGE_FILE);
    if (!exists) {
      return res.json({ exists: false, message: "Belum ada cadangan penyimpanan di server." });
    }
    const stats = fs2.statSync(SERVER_STORAGE_FILE);
    res.json({
      exists: true,
      sizeBytes: stats.size,
      lastModified: stats.mtime.toISOString(),
      path: SERVER_STORAGE_FILE
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
async function fetchMysqlCrmDataset() {
  if (!isMysqlConfigured() || isMysqlInBackoff()) return null;
  const config = getMysqlConfig();
  const hostLower = (config.host || "").toLowerCase().trim();
  const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
  if (isSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1")) return null;
  try {
    await initMysqlSchema();
    const pool2 = getMysqlPool();
    const conn = await pool2.getConnection();
    try {
      const fetchTableData = async (tableName) => {
        try {
          const [rows] = await conn.query(`SELECT data FROM ${tableName}`);
          return rows.map((r) => {
            try {
              return typeof r.data === "string" ? JSON.parse(r.data) : r.data;
            } catch {
              return null;
            }
          }).filter(Boolean);
        } catch {
          return [];
        }
      };
      const projects = await fetchTableData("crm_projects");
      const transactions = await fetchTableData("crm_transactions");
      const receivables = await fetchTableData("crm_receivables");
      const taxObligations = await fetchTableData("crm_tax_obligations");
      const payrollPayments = await fetchTableData("crm_payroll");
      const governmentProjects = await fetchTableData("crm_government_projects");
      const retailProjects = await fetchTableData("crm_retail_projects");
      const bankLoans = await fetchTableData("crm_bank_loans");
      const dispositions = await fetchTableData("crm_dispositions");
      const rawTeamMembers = await fetchTableData("crm_team_members");
      const teamMembers = rawTeamMembers.filter((m) => !isPurgedUser(m));
      const overheadExpenses = await fetchTableData("crm_overhead_expenses");
      const officeRentContracts = await fetchTableData("crm_office_rent_contracts");
      let settingsMap = {};
      try {
        const [settingsRows] = await conn.query("SELECT setting_key, data FROM crm_app_settings");
        for (const row of settingsRows) {
          try {
            settingsMap[row.setting_key] = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          } catch {
          }
        }
      } catch {
      }
      const totalRows = projects.length + transactions.length + receivables.length + taxObligations.length + payrollPayments.length + governmentProjects.length + retailProjects.length + bankLoans.length + dispositions.length + teamMembers.length + overheadExpenses.length + officeRentContracts.length;
      return {
        success: true,
        source: "mysql",
        totalRows,
        pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
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
          overheadExpenses: overheadExpenses.length > 0 ? overheadExpenses : settingsMap.overheadExpenses || [],
          officeRentContracts: officeRentContracts.length > 0 ? officeRentContracts : settingsMap.officeRentContracts || [],
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
          assignedByOptions: settingsMap.assignedByOptions || []
        }
      };
    } finally {
      conn.release();
    }
  } catch (err) {
    const ipMatch = err.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : "";
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: err.message || String(err),
      clientIp: incomingIp
    });
    return null;
  }
}
app.get("/api/storage/sync", async (req, res) => {
  try {
    const mysqlDataset = await fetchMysqlCrmDataset().catch(() => null);
    if (mysqlDataset && mysqlDataset.totalRows > 0) {
      return res.json({
        success: true,
        exists: true,
        source: "mysql",
        updatedAt: mysqlDataset.pulledAt,
        data: mysqlDataset.data
      });
    }
    if (!fs2.existsSync(SERVER_STORAGE_FILE)) {
      return res.json({ success: true, exists: false, data: null });
    }
    const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
    if (!raw.trim()) {
      return res.json({ success: true, exists: false, data: null });
    }
    const parsed = JSON.parse(raw);
    res.json({
      success: true,
      exists: true,
      source: "disk",
      updatedAt: parsed.updatedAt || null,
      data: parsed.data || parsed
    });
  } catch (error) {
    console.error("[server-storage] Error reading persistent storage:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to read server storage" });
  }
});
app.get("/api/data", async (req, res) => {
  try {
    const mysqlDataset = await fetchMysqlCrmDataset().catch(() => null);
    if (mysqlDataset && mysqlDataset.totalRows > 0) {
      return res.json(mysqlDataset);
    }
    if (fs2.existsSync(SERVER_STORAGE_FILE)) {
      try {
        const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const fileData = parsed.data || parsed;
        if (fileData && typeof fileData === "object") {
          await executeMysqlCrmBatchWrite(fileData);
          return res.json({
            success: true,
            source: "mysql_seeded",
            pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
            data: fileData
          });
        }
      } catch {
      }
    }
    if (fs2.existsSync(SERVER_STORAGE_FILE)) {
      const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        return res.json({
          success: true,
          source: "server_storage",
          pulledAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
          data: parsed.data || parsed
        });
      }
    }
    return res.json({
      success: true,
      source: "empty",
      pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
      data: null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    let teamMembers = [];
    let source = "none";
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool2 = getMysqlPool();
        const conn = await pool2.getConnection();
        try {
          const [rows] = await conn.query("SELECT data FROM crm_team_members");
          teamMembers = rows.map((r) => {
            try {
              return typeof r.data === "string" ? JSON.parse(r.data) : r.data;
            } catch {
              return null;
            }
          }).filter(Boolean).filter((m) => !isPurgedUser(m));
          source = "mysql";
        } finally {
          conn.release();
        }
      } catch (mysqlErr) {
        console.warn("[server-users] MySQL read warning, falling back to disk:", mysqlErr?.message);
      }
    }
    if (teamMembers.length === 0 && fs2.existsSync(SERVER_STORAGE_FILE)) {
      try {
        const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (Array.isArray(dataObj.teamMembers)) {
            teamMembers = dataObj.teamMembers.filter((m) => !isPurgedUser(m));
            source = "server_storage";
          }
        }
      } catch (fsErr) {
        console.warn("[server-users] Error reading disk storage:", fsErr);
      }
    }
    res.json({
      success: true,
      source,
      total: teamMembers.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      teamMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});
app.post("/api/users", async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.id || !user.username) {
      return res.status(400).json({ success: false, message: "Invalid user payload: id and username required" });
    }
    if (isPurgedUser(user)) {
      return res.status(400).json({ success: false, message: "User is purged or banned" });
    }
    let mysqlSaved = false;
    let mysqlMessage = "";
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool2 = getMysqlPool();
        const conn = await pool2.getConnection();
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
            [user.id, user.username || "", user.email || "", user.role || "GUEST", JSON.stringify(user)]
          );
          mysqlSaved = true;
          mysqlMessage = `User ${user.username} saved to Hostinger MySQL (crm_team_members)`;
        } finally {
          conn.release();
        }
      } catch (err) {
        mysqlMessage = sanitizeDbError(err.message);
        console.warn("[server-users] Error saving user to MySQL:", mysqlMessage);
      }
    }
    try {
      if (fs2.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (!Array.isArray(dataObj.teamMembers)) {
            dataObj.teamMembers = [];
          }
          const idx = dataObj.teamMembers.findIndex((m) => m && m.id === user.id);
          if (idx >= 0) {
            dataObj.teamMembers[idx] = user;
          } else {
            dataObj.teamMembers.push(user);
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs2.writeFileSync(
            temp,
            JSON.stringify({ version: "1.0", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), data: dataObj }, null, 2),
            "utf-8"
          );
          fs2.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch (fsErr) {
      console.warn("[server-users] Error updating disk storage for user:", fsErr);
    }
    res.json({
      success: true,
      mysqlSaved,
      mysqlMessage,
      user,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Missing user id" });
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      try {
        const pool2 = getMysqlPool();
        const conn = await pool2.getConnection();
        try {
          await conn.query("DELETE FROM crm_team_members WHERE id = ?", [id]);
        } finally {
          conn.release();
        }
      } catch (err) {
        console.warn("[server-users] Error deleting user from MySQL:", err.message);
      }
    }
    try {
      if (fs2.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          if (Array.isArray(dataObj.teamMembers)) {
            dataObj.teamMembers = dataObj.teamMembers.filter((m) => m && m.id !== id);
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs2.writeFileSync(
            temp,
            JSON.stringify({ version: "1.0", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), data: dataObj }, null, 2),
            "utf-8"
          );
          fs2.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch {
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});
app.post("/api/data", async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to persist data" });
  }
});
app.post("/api/data/entity", async (req, res) => {
  try {
    const { entityType, action = "save", item, id } = req.body || {};
    const ALLOWED_ENTITIES = [
      "projects",
      "transactions",
      "receivables",
      "taxObligations",
      "payroll",
      "payrollPayments",
      "governmentProjects",
      "retailProjects",
      "bankLoans",
      "dispositions",
      "teamMembers",
      "overheadExpenses",
      "officeRentContracts",
      "serviceTypes",
      "documentTypes",
      "documentCategories",
      "transactionCategories",
      "paymentChannels",
      "companyCapital",
      "salaryConfigs",
      "institutionTypes",
      "termDistributionSchemes",
      "companyLetterhead",
      "roleDefinitions",
      "assignedByOptions"
    ];
    if (!entityType || typeof entityType !== "string" || !ALLOWED_ENTITIES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `Field entityType tidak valid. Harus salah satu dari: ${ALLOWED_ENTITIES.slice(0, 6).join(", ")}...`
      });
    }
    if (action !== "save" && action !== "delete") {
      return res.status(400).json({ success: false, message: 'Action tidak valid. Gunakan "save" atau "delete".' });
    }
    if (action === "delete") {
      const targetId = id || item?.id;
      if (!targetId || typeof targetId !== "string" || targetId.length > 255) {
        return res.status(400).json({ success: false, message: "ID target wajib berupa string valid (maks 255 karakter)." });
      }
    } else {
      if (!item || typeof item !== "object" || !item.id || typeof item.id !== "string") {
        return res.status(400).json({ success: false, message: 'Item data wajib berupa objek dengan properti "id" bertipe string.' });
      }
    }
    let mysqlSuccess = false;
    let mysqlMessage = "";
    let affectedRows = 0;
    let insertId = 0;
    if (isMysqlConfigured() && !isMysqlInBackoff()) {
      const config = getMysqlConfig();
      const hostLower = (config.host || "").toLowerCase().trim();
      const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
      if (!(isSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1"))) {
        try {
          await initMysqlSchema();
          const pool2 = getMysqlPool();
          const conn = await pool2.getConnection();
          try {
            if (action === "delete") {
              const targetId = id || item?.id;
              if (targetId) {
                const tableMap = {
                  projects: "crm_projects",
                  transactions: "crm_transactions",
                  receivables: "crm_receivables",
                  taxObligations: "crm_tax_obligations",
                  payroll: "crm_payroll",
                  payrollPayments: "crm_payroll",
                  governmentProjects: "crm_government_projects",
                  retailProjects: "crm_retail_projects",
                  bankLoans: "crm_bank_loans",
                  dispositions: "crm_dispositions",
                  teamMembers: "crm_team_members",
                  overheadExpenses: "crm_overhead_expenses",
                  officeRentContracts: "crm_office_rent_contracts"
                };
                const tableName = tableMap[entityType];
                if (tableName) {
                  const [delRes] = await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [targetId]);
                  mysqlSuccess = true;
                  affectedRows = delRes?.affectedRows || 0;
                  mysqlMessage = `Record ${targetId} berhasil dihapus dari ${tableName} (${affectedRows} baris terhapus).`;
                }
              }
            } else {
              if (item && item.id) {
                if (entityType === "projects") {
                  const [writeRes] = await conn.query(
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
                      item.projectCode || item.code || "",
                      item.clientName || "",
                      item.stage || "",
                      item.status || "",
                      item.kbliCode || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                  mysqlMessage = `Project ${item.id} berhasil disimpan ke crm_projects (affectedRows: ${affectedRows})`;
                } else if (entityType === "transactions") {
                  const [writeRes] = await conn.query(
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
                      item.transactionNumber || item.referenceNumber || "",
                      item.type || "",
                      item.category || "",
                      item.amountIdr || item.amountIDR || item.amount || 0,
                      item.date || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                  mysqlMessage = `Transaction ${item.id} berhasil disimpan ke crm_transactions (affectedRows: ${affectedRows})`;
                } else if (entityType === "receivables") {
                  const [writeRes] = await conn.query(
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
                      item.invoiceNumber || "",
                      item.clientName || "",
                      item.totalAmount || item.totalAmountIDR || 0,
                      item.paidAmount || item.paidAmountIDR || 0,
                      item.status || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === "taxObligations") {
                  const [writeRes] = await conn.query(
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
                      item.taxType || "",
                      item.taxName || item.title || "",
                      item.amount || item.amountIDR || 0,
                      item.status || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === "payroll" || entityType === "payrollPayments") {
                  const [writeRes] = await conn.query(
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
                      item.employeeName || "",
                      item.period || "",
                      item.netSalary || item.netSalaryIDR || 0,
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                  insertId = writeRes?.insertId || item.id;
                } else if (entityType === "governmentProjects") {
                  const [writeRes] = await conn.query(
                    `INSERT INTO crm_government_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || "", JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === "retailProjects") {
                  const [writeRes] = await conn.query(
                    `INSERT INTO crm_retail_projects (id, project_name, data)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     project_name = VALUES(project_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.name || item.projectName || "", JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === "bankLoans") {
                  const [writeRes] = await conn.query(
                    `INSERT INTO crm_bank_loans (id, loan_name, bank_name, data)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     loan_name = VALUES(loan_name),
                     bank_name = VALUES(bank_name),
                     data = VALUES(data),
                     updated_at = NOW()`,
                    [item.id, item.loanName || "", item.bankName || "", JSON.stringify(item)]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === "dispositions") {
                  const [writeRes] = await conn.query(
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
                      item.dispositionNumber || "",
                      item.assigneeName || "",
                      item.status || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === "teamMembers") {
                  if (isPurgedUser(item)) {
                    await conn.query("DELETE FROM crm_team_members WHERE id = ? OR username = ? OR email = ?", [
                      item.id,
                      item.username || "",
                      item.email || ""
                    ]);
                    mysqlSuccess = true;
                  } else {
                    const [writeRes] = await conn.query(
                      `INSERT INTO crm_team_members (id, username, email, role, data)
                       VALUES (?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       username = VALUES(username),
                       email = VALUES(email),
                       role = VALUES(role),
                       data = VALUES(data),
                       updated_at = NOW()`,
                      [item.id, item.username || "", item.email || "", item.role || "", JSON.stringify(item)]
                    );
                    mysqlSuccess = true;
                    affectedRows = writeRes?.affectedRows || 0;
                  }
                } else if (entityType === "overheadExpenses") {
                  const [writeRes] = await conn.query(
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
                      item.overheadNumber || "",
                      item.category || "",
                      item.recipient || "",
                      item.amountIdr || item.amount || 0,
                      item.date || "",
                      item.status || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if (entityType === "officeRentContracts") {
                  const [writeRes] = await conn.query(
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
                      item.contractNumber || "",
                      item.buildingName || "",
                      item.landlordName || "",
                      JSON.stringify(item)
                    ]
                  );
                  mysqlSuccess = true;
                  affectedRows = writeRes?.affectedRows || 0;
                } else if ([
                  "serviceTypes",
                  "documentTypes",
                  "documentCategories",
                  "transactionCategories",
                  "paymentChannels",
                  "companyCapital",
                  "salaryConfigs",
                  "institutionTypes",
                  "termDistributionSchemes",
                  "companyLetterhead",
                  "roleDefinitions",
                  "assignedByOptions"
                ].includes(entityType)) {
                  const [writeRes] = await conn.query(
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
        } catch (dbErr) {
          const sanitizedErr = sanitizeDbError(dbErr.message || String(dbErr));
          mysqlMessage = sanitizedErr;
          const ipMatch = dbErr.message?.match(/@'([^']+)'/);
          const incomingIp = ipMatch ? ipMatch[1] : "";
          setMysqlHealthState({
            isHealthy: false,
            lastChecked: Date.now(),
            lastError: sanitizedErr,
            clientIp: incomingIp
          });
        }
      }
    }
    try {
      if (fs2.existsSync(SERVER_STORAGE_FILE)) {
        const raw = fs2.readFileSync(SERVER_STORAGE_FILE, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          const dataObj = parsed.data || parsed;
          const targetKey = entityType === "taxes" ? "taxObligations" : entityType === "payroll" ? "payrollPayments" : entityType;
          if (action === "delete") {
            const targetId = id || item?.id;
            if (Array.isArray(dataObj[targetKey])) {
              dataObj[targetKey] = dataObj[targetKey].filter((x) => x && x.id !== targetId);
            }
          } else if (item && item.id) {
            if (!Array.isArray(dataObj[targetKey])) {
              dataObj[targetKey] = [];
            }
            const idx = dataObj[targetKey].findIndex((x) => x && x.id === item.id);
            if (idx >= 0) {
              dataObj[targetKey][idx] = item;
            } else {
              dataObj[targetKey].push(item);
            }
          }
          const temp = `${SERVER_STORAGE_FILE}.tmp`;
          fs2.writeFileSync(
            temp,
            JSON.stringify({ version: "1.0", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), data: dataObj }, null, 2),
            "utf-8"
          );
          fs2.renameSync(temp, SERVER_STORAGE_FILE);
        }
      }
    } catch (fsErr) {
      console.warn("[server-storage] Error updating persistent disk storage for entity:", fsErr);
    }
    res.json({
      success: true,
      mysqlSuccess,
      mysqlMessage,
      affectedRows,
      insertId,
      entityType,
      action,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: sanitizeDbError(error.message) });
  }
});
app.get("/api/mysql/schema.sql", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="hostinger_gap_crm_schema.sql"');
  res.send(HOSTINGER_SQL_SCHEMA_RAW);
});
app.get("/api/mysql/health", async (req, res) => {
  try {
    const config = getMysqlConfig();
    const isConfigured = Boolean(config.host && config.user && config.database);
    if (!isConfigured) {
      return res.status(200).json({
        healthy: false,
        configured: false,
        message: "Konfigurasi MySQL belum lengkap. MYSQL_HOST, MYSQL_USER, dan MYSQL_DATABASE belum terisi.",
        disclaimer: "Status health check hanya memeriksa konektivitas aktif, bukan bukti sinkronisasi data."
      });
    }
    const testResult = await testMysqlConnection();
    res.status(testResult.success ? 200 : 503).json({
      healthy: testResult.success,
      configured: true,
      ...testResult,
      disclaimer: "Health check (SELECT 1) hanya memverifikasi koneksi aktif, bukan bukti bahwa seluruh data telah tersinkronisasi."
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      configured: isMysqlConfigured(),
      error: sanitizeDbError(error.message || String(error))
    });
  }
});
app.get("/api/mysql/status", async (req, res) => {
  try {
    const config = getMysqlConfig();
    const isConfigured = Boolean(config.host && config.user && config.database);
    if (!isConfigured) {
      return res.json({
        configured: false,
        message: "Variabel lingkungan MySQL belum diatur (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE).",
        config: {
          host: config.host || "(belum diisi)",
          port: config.port || 3306,
          user: config.user || "(belum diisi)",
          database: config.database || "(belum diisi)",
          hasPassword: Boolean(config.password)
        }
      });
    }
    const health = getMysqlHealthState();
    const forceRefresh = req.query.force === "true";
    const isStale = Date.now() - health.lastChecked > 2e4;
    let testResult;
    if (forceRefresh || isStale) {
      testResult = await testMysqlConnection();
    } else {
      testResult = {
        success: health.isHealthy,
        message: health.isHealthy ? `Berhasil terhubung ke Hostinger MySQL database "${config.database}".` : health.lastError || "MySQL Hostinger belum terhubung.",
        host: config.host,
        database: config.database
      };
    }
    res.json({
      configured: true,
      ...testResult,
      clientIp: health.clientIp || void 0,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: Boolean(config.password)
      }
    });
  } catch (error) {
    res.status(500).json({
      configured: isMysqlConfigured(),
      success: false,
      message: error.message || "Gagal mengecek status MySQL Hostinger"
    });
  }
});
app.get("/api/mysql/diagnostics", async (req, res) => {
  try {
    const config = getMysqlConfig();
    const testResult = await testMysqlConnection();
    res.json({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      configured: isMysqlConfigured(),
      connected: testResult.success,
      latencyMs: testResult.latencyMs || 0,
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: Boolean(config.password)
      },
      message: testResult.message,
      tables: testResult.tables || [],
      tableCount: testResult.tables?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      configured: isMysqlConfigured(),
      connected: false,
      message: error.message || "Gagal menjalankan diagnostik MySQL"
    });
  }
});
app.get("/api/mysql/config", (req, res) => {
  try {
    const config = getMysqlConfig();
    res.json({
      success: true,
      host: config.host || "",
      port: config.port || 3306,
      user: config.user || "",
      database: config.database || "",
      hasPassword: Boolean(config.password),
      isOverride: hasMysqlRuntimeConfig()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/mysql/config", async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body || {};
    if (!host || !user || !database) {
      return res.status(400).json({
        success: false,
        message: "Host, User, dan Database wajib diisi."
      });
    }
    const savedConfig = saveMysqlConfig({
      host: String(host).trim(),
      port: port ? parseInt(String(port), 10) : 3306,
      user: String(user).trim(),
      password: password !== void 0 ? String(password) : void 0,
      database: String(database).trim()
    });
    const testResult = await testMysqlConnection();
    let schemaResult = null;
    if (testResult.success) {
      schemaResult = await initMysqlSchema();
    }
    res.json({
      success: true,
      message: testResult.success ? `Konfigurasi berhasil disimpan dan koneksi ke database "${savedConfig.database}" di ${savedConfig.host} berhasil!` : `Konfigurasi disimpan, namun koneksi belum berhasil: ${testResult.message}`,
      connection: testResult,
      schema: schemaResult,
      config: {
        host: savedConfig.host,
        port: savedConfig.port,
        user: savedConfig.user,
        database: savedConfig.database,
        hasPassword: Boolean(savedConfig.password),
        isOverride: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete("/api/mysql/config", async (req, res) => {
  try {
    clearMysqlRuntimeConfig();
    const testResult = await testMysqlConnection();
    res.json({
      success: true,
      message: "Konfigurasi MySQL telah dikembalikan ke variabel lingkungan default server.",
      connection: testResult
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/mysql/test", async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body || {};
    let customConfig = void 0;
    if (host || user || database) {
      customConfig = {
        host,
        port: port ? parseInt(port, 10) : 3306,
        user,
        password,
        database
      };
    }
    const result = await testMysqlConnection(customConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Gagal menguji koneksi MySQL Hostinger"
    });
  }
});
app.post("/api/mysql/init-schema", async (req, res) => {
  try {
    const result = await initMysqlSchema();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Gagal membuat skema database MySQL"
    });
  }
});
app.post("/api/mysql/sync/push", async (req, res) => {
  try {
    const result = await executeMysqlCrmBatchWrite(req.body);
    res.json(result);
  } catch (error) {
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : "";
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: error.message || String(error),
      clientIp: incomingIp
    });
    res.status(200).json({
      success: false,
      message: `Gagal menyimpan data ke Hostinger MySQL: ${error.message || error}`
    });
  }
});
app.get("/api/mysql/sync/pull", async (req, res) => {
  try {
    if (!isMysqlConfigured()) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: "Hostinger MySQL belum dikonfigurasi di server environment."
      });
    }
    const config = getMysqlConfig();
    const hostLower = (config.host || "").toLowerCase().trim();
    const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
    if (isSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1")) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: 'Hostinger MySQL belum terhubung: DB_HOST saat ini masih "localhost". Masukkan IP Server Hostinger Anda di Settings.'
      });
    }
    if (isMysqlInBackoff()) {
      const hState = getMysqlHealthState();
      return res.status(200).json({
        success: false,
        skipped: true,
        message: `Koneksi MySQL Hostinger ditolak/belum siap (${hState.lastError || "Access denied"}). Periksa menu Remote MySQL di hPanel Hostinger. Data diambil dari persistent server storage.`
      });
    }
    const pool2 = getMysqlPool();
    let conn = null;
    try {
      conn = await pool2.getConnection();
    } catch (connErr) {
      return res.status(200).json({
        success: false,
        message: `Gagal terhubung ke MySQL Hostinger: ${connErr.message || connErr}`
      });
    }
    try {
      const fetchTableData = async (tableName) => {
        try {
          const [rows] = await conn.query(`SELECT data FROM ${tableName}`);
          return rows.map((r) => {
            try {
              return typeof r.data === "string" ? JSON.parse(r.data) : r.data;
            } catch {
              return null;
            }
          }).filter(Boolean);
        } catch {
          return [];
        }
      };
      const projects = await fetchTableData("crm_projects");
      const transactions = await fetchTableData("crm_transactions");
      const receivables = await fetchTableData("crm_receivables");
      const taxObligations = await fetchTableData("crm_tax_obligations");
      const payrollPayments = await fetchTableData("crm_payroll");
      const governmentProjects = await fetchTableData("crm_government_projects");
      const retailProjects = await fetchTableData("crm_retail_projects");
      const bankLoans = await fetchTableData("crm_bank_loans");
      const dispositions = await fetchTableData("crm_dispositions");
      const teamMembers = await fetchTableData("crm_team_members");
      const overheadExpensesFromTable = await fetchTableData("crm_overhead_expenses");
      const officeRentContractsFromTable = await fetchTableData("crm_office_rent_contracts");
      let settingsMap = {};
      try {
        const [settingsRows] = await conn.query("SELECT setting_key, data FROM crm_app_settings");
        for (const row of settingsRows) {
          try {
            settingsMap[row.setting_key] = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          } catch {
          }
        }
      } catch {
      }
      res.json({
        success: true,
        pulledAt: (/* @__PURE__ */ new Date()).toISOString(),
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
          overheadExpenses: overheadExpensesFromTable.length > 0 ? overheadExpensesFromTable : settingsMap.overheadExpenses || [],
          officeRentContracts: officeRentContractsFromTable.length > 0 ? officeRentContractsFromTable : settingsMap.officeRentContracts || [],
          institutionTypes: settingsMap.institutionTypes || [],
          termDistributionSchemes: settingsMap.termDistributionSchemes || [],
          companyLetterhead: settingsMap.companyLetterhead || null,
          roleDefinitions: settingsMap.roleDefinitions || null,
          assignedByOptions: settingsMap.assignedByOptions || []
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    const ipMatch = error.message?.match(/@'([^']+)'/);
    const incomingIp = ipMatch ? ipMatch[1] : "";
    setMysqlHealthState({
      isHealthy: false,
      lastChecked: Date.now(),
      lastError: error.message || String(error),
      clientIp: incomingIp
    });
    res.status(200).json({
      success: false,
      message: `Gagal menarik data dari Hostinger MySQL: ${error.message || error}`
    });
  }
});
async function setupViteOrStatic() {
  const isTsxDev = Boolean(
    process.argv[1]?.endsWith("server.ts") && process.env.NODE_ENV !== "production"
  );
  const isProduction = process.env.NODE_ENV === "production" || !isTsxDev;
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const candidateDirs = [
      path2.join(process.cwd(), "dist"),
      path2.join(process.cwd(), "hbuilds", "current", "nodejs", "dist"),
      path2.join(typeof __dirname !== "undefined" ? __dirname : process.cwd(), "dist"),
      path2.join(typeof __dirname !== "undefined" ? __dirname : process.cwd(), "..", "dist"),
      path2.join(typeof __dirname !== "undefined" ? __dirname : process.cwd(), "..", "..", "dist"),
      typeof __dirname !== "undefined" ? __dirname : process.cwd(),
      process.cwd()
    ];
    const distPath = candidateDirs.find((dir) => fs2.existsSync(path2.join(dir, "index.html"))) || path2.join(process.cwd(), "dist");
    console.log(`[server] Production static files root: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return next();
      }
      const indexPath = path2.join(distPath, "index.html");
      if (fs2.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        const rootIndex = path2.join(process.cwd(), "index.html");
        if (fs2.existsSync(rootIndex)) {
          res.sendFile(rootIndex);
        } else {
          res.status(503).send("Application bundle is being initialized. Please ensure npm run build has completed.");
        }
      }
    });
  }
  const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[server] Server running on http://0.0.0.0:${PORT} (env PORT=${process.env.PORT || "default 3000"})`);
    console.log(`[server] Node version: ${process.version}, Environment: ${process.env.NODE_ENV || "production"}`);
    console.log(`[server] Hostinger MySQL configured: ${isMysqlConfigured() ? "YES" : "NO"}`);
    try {
      if (!fs2.existsSync(DATA_DIR)) {
        fs2.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs2.existsSync(SERVER_STORAGE_FILE)) {
        const stats = fs2.statSync(SERVER_STORAGE_FILE);
        console.log(`[storage] Persistent disk storage verified: ${SERVER_STORAGE_FILE} (${stats.size} bytes)`);
      }
      if (isMysqlConfigured() && !isMysqlInBackoff()) {
        const config = getMysqlConfig();
        const hostLower = (config.host || "").toLowerCase().trim();
        const isSandbox = Boolean(process.env.CONTROL_PLANE_PORT && process.env.DEFAULT_APP_PORT);
        if (!(isSandbox && (hostLower === "localhost" || hostLower === "127.0.0.1"))) {
          const testRes = await testMysqlConnection();
          if (testRes.success) {
            console.log("[mysql] Hostinger MySQL connection verified on startup.");
            await initMysqlSchema();
          } else {
            console.log(`[mysql] Hostinger MySQL connection note: ${testRes.message}`);
          }
        }
      }
    } catch (startupErr) {
      console.warn("[startup] Persistence check note:", startupErr);
    }
  });
  server.on("error", (err) => {
    console.error(`[server] Server listen error on port ${PORT}:`, err);
  });
}
var shouldStart = typeof process !== "undefined" && !process.env.NO_SERVER_AUTOSTART;
if (shouldStart) {
  setupViteOrStatic().catch((err) => {
    console.error("[server] Fatal error during setupViteOrStatic:", err);
  });
}
export {
  executeMysqlCrmBatchWrite,
  fetchMysqlCrmDataset
};
//# sourceMappingURL=server.js.map
