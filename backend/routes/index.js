/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：接口路由，统一挂载在 /api 前缀下
 */
const express = require("express");
const { wzx_health, wzx_dbTest } = require("../controllers/dbController");
const { wzx_listNews } = require("../controllers/newsController");
const { wzx_listGallery } = require("../controllers/galleryController");

const wzx_router = express.Router();

wzx_router.get("/health", wzx_health);
wzx_router.post("/db-test", wzx_dbTest);
wzx_router.get("/news", wzx_listNews);
wzx_router.get("/gallery", wzx_listGallery);

module.exports = wzx_router;
