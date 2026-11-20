/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：后端入口，配置跨域、JSON 解析、静态托管与接口路由
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const wzx_config = require("./config/env");
const wzx_router = require("./routes/index");

const wzx_app = express();
const wzx_frontend = path.join(__dirname, "..", "frontend");

// 课程作业：开放全部跨域，方便前端本地联调
wzx_app.use(cors());
wzx_app.use(express.json());

// 静态资源：首页与各页面直接由 Express 提供，端口与接口保持一致
wzx_app.use(express.static(wzx_frontend));

// 所有业务接口统一挂在 /api 下
wzx_app.use("/api", wzx_router);

// 未匹配的接口返回统一 JSON，避免前端拿到 HTML 报 Unexpected token '<'
wzx_app.use("/api", function (wzx_req, wzx_res) {
  wzx_res.status(404).json({ code: 4040, msg: "接口不存在：" + wzx_req.originalUrl, data: null });
});

// 功能：启动服务并打印访问地址
function wzx_start() {
  wzx_app.listen(wzx_config.serverPort, function () {
    console.log("Server running at http://localhost:" + wzx_config.serverPort);
    console.log("健康检查：http://localhost:" + wzx_config.serverPort + "/api/health");
  });
}

wzx_start();
