/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：数据库连接测试与健康检查控制器
 */
const { wzx_testConnection } = require("../config/db");
const { wzx_ok, wzx_fail } = require("../utils/result");

// 功能：GET /api/health，返回服务状态，便于验收时确认服务已启动
function wzx_health(wzx_req, wzx_res) {
  wzx_ok(wzx_res, {
    service: "科技图文站后端",
    port: wzx_req.socket.localPort,
    time: new Date().toISOString()
  }, "ok");
}

// 功能：POST /api/db-test，用页面传入的账号密码尝试连接 MySQL
async function wzx_dbTest(wzx_req, wzx_res) {
  const wzx_body = wzx_req.body || {};
  const wzx_user = (wzx_body.user || "root").trim();
  const wzx_password = wzx_body.password === undefined ? "" : String(wzx_body.password);

  if (!wzx_user) {
    wzx_fail(wzx_res, "用户名不能为空", 4001);
    return;
  }

  try {
    const wzx_info = await wzx_testConnection({ user: wzx_user, password: wzx_password });
    wzx_ok(wzx_res, wzx_info, "数据库连接成功");
  } catch (wzx_error) {
    // 把 MySQL 的原始错误码与信息带回去，页面可直接显示
    console.error("[api/db-test] 连接失败：", wzx_error.message);
    wzx_fail(wzx_res, "连接失败：" + wzx_error.message, 4002);
  }
}

module.exports = { wzx_health, wzx_dbTest };
