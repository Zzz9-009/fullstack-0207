/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：读取 .env 并导出统一配置，避免凭据写死在代码里
 */
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const wzx_config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "wzx_fullstack",
  serverPort: Number(process.env.PORT || 8207),
  ai: {
    // 两个平台都兼容 OpenAI 接口格式，切换平台只需换 key、baseUrl、model 三个值
    providers: {
      siliconflow: {
        name: "硅基流动",
        apiKey: process.env.SILICONFLOW_API_KEY || "",
        baseUrl: (process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/+$/, ""),
        model: process.env.SILICONFLOW_MODEL || "deepseek-ai/DeepSeek-V4-Flash"
      },
      qiniu: {
        name: "七牛云",
        apiKey: process.env.QINIU_API_KEY || "",
        baseUrl: (process.env.QINIU_BASE_URL || "https://api.qnaigc.com/v1").replace(/\/+$/, ""),
        model: process.env.QINIU_MODEL || "qiniu/conatus-free",
        // 视觉模型与语音识别模型走同一套 Key 和域名，单独配置便于以后替换
        visionModel: process.env.QINIU_VISION_MODEL || "deepseek/deepseek-v4-flash-vision-exp",
        asrModel: process.env.QINIU_ASR_MODEL || "qwen-audio-3.0-asr-flash"
      }
    },
    defaultProvider: process.env.AI_PROVIDER || "siliconflow",
    timeout: 60000
  }
};

module.exports = wzx_config;
