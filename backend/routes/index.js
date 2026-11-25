/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：接口路由，统一挂载在 /api 前缀下
 */
const express = require("express");
const { wzx_health, wzx_dbTest } = require("../controllers/dbController");
const { wzx_listNews } = require("../controllers/newsController");
const { wzx_listGallery } = require("../controllers/galleryController");
const { wzx_chat } = require("../controllers/chatController");
const wzx_kb = require("../controllers/kbController");
const wzx_vision = require("../controllers/visionController");
const wzx_asr = require("../controllers/asrController");

const wzx_router = express.Router();

wzx_router.get("/health", wzx_health);
wzx_router.post("/db-test", wzx_dbTest);
wzx_router.get("/news", wzx_listNews);
wzx_router.get("/gallery", wzx_listGallery);
wzx_router.post("/chat", wzx_chat);

// 知识库（RAG）：文件管理 + 基于知识库的问答
wzx_router.get("/kb/files", wzx_kb.wzx_listFiles);
wzx_router.post("/kb/files", wzx_kb.wzx_kbUpload, wzx_kb.wzx_uploadFile);
wzx_router.delete("/kb/files/:id", wzx_kb.wzx_deleteFile);
wzx_router.post("/kb/chat", wzx_kb.wzx_ask);

// 图像识别与语音识别
wzx_router.post("/vision", wzx_vision.wzx_visionUpload, wzx_vision.wzx_describe);
wzx_router.post("/asr", wzx_asr.wzx_asrUpload, wzx_asr.wzx_transcribe);

module.exports = wzx_router;
