/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：创建 MySQL 连接池，并提供临时连接测试能力
 */
const mysql = require("mysql2/promise");
const wzx_config = require("./env");

// 业务查询统一使用连接池，减少反复握手
const wzx_pool = mysql.createPool({
  host: wzx_config.host,
  port: wzx_config.port,
  user: wzx_config.user,
  password: wzx_config.password,
  database: wzx_config.database,
  waitForConnections: true,
  connectionLimit: 8,
  charset: "utf8mb4"
});

// 功能：用页面上填写的账号密码临时连一次数据库，返回数据库版本
async function wzx_testConnection(wzx_credential) {
  const wzx_conn = await mysql.createConnection({
    host: wzx_credential.host || wzx_config.host,
    port: wzx_credential.port || wzx_config.port,
    user: wzx_credential.user,
    password: wzx_credential.password,
    database: wzx_config.database
  });

  try {
    const [wzx_rows] = await wzx_conn.query("SELECT VERSION() AS wzx_version, DATABASE() AS wzx_database");
    return {
      version: wzx_rows[0].wzx_version,
      database: wzx_rows[0].wzx_database || "(未选择数据库)"
    };
  } finally {
    await wzx_conn.end();
  }
}

module.exports = { wzx_pool, wzx_testConnection };
