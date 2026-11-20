/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：图文列表接口控制器
 */
const { wzx_findAllGallery } = require("../models/galleryModel");
const { wzx_ok, wzx_fail } = require("../utils/result");

// 功能：GET /api/gallery，返回全部图文及总数
async function wzx_listGallery(wzx_req, wzx_res) {
  try {
    const wzx_list = await wzx_findAllGallery();
    wzx_ok(wzx_res, { list: wzx_list, total: wzx_list.length }, "查询成功");
  } catch (wzx_error) {
    console.error("[api/gallery] 查询失败：", wzx_error.message);
    wzx_fail(wzx_res, "图文查询失败：" + wzx_error.message, 5002);
  }
}

module.exports = { wzx_listGallery };
